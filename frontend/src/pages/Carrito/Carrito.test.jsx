import { createElement } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "../../api/client.js";
import {
  eliminarProducto,
  listarCarrito,
  modificarCantidad,
} from "../../services/carrito.service.js";
import { obtenerResumenPedido } from "../../services/pedidos.service.js";
import Carrito from "./Carrito.jsx";

const mockPasarelaPago = vi.hoisted(() => vi.fn());

vi.mock("../../components/globales/Header", () => ({
  default: () => createElement("header", null, "Header"),
}));

vi.mock("./PasarelaPago", () => ({ default: mockPasarelaPago }));

vi.mock("../../api/client.js", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("../../services/carrito.service.js", () => ({
  eliminarProducto: vi.fn(),
  listarCarrito: vi.fn(),
  modificarCantidad: vi.fn(),
}));

vi.mock("../../services/pedidos.service.js", () => ({
  obtenerResumenPedido: vi.fn(),
}));

function respuestaCarrito(cantidad = 2) {
  return {
    data: {
      vendedores: [
        {
          vendedor_nombre: "Tienda Demo",
          items: [
            {
              producto_id: 42,
              nombre: "Audífonos",
              precio_final: 10000,
              precio: 12000,
              descuento_porcentaje: 17,
              cantidad,
              imagen_url: null,
            },
          ],
        },
      ],
    },
  };
}

const carritoVacio = { data: { vendedores: [] } };

describe("Carrito", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentUser.mockReturnValue({ id: 7 });
    listarCarrito.mockResolvedValue(respuestaCarrito());
    modificarCantidad.mockResolvedValue({});
    eliminarProducto.mockResolvedValue({});
    obtenerResumenPedido.mockResolvedValue({ data: { totales: null } });
    mockPasarelaPago.mockImplementation(({ totales }) =>
      createElement(
        "div",
        { "data-testid": "pasarela-pago" },
        JSON.stringify(totales)
      )
    );
  });

  it("muestra la carga mientras obtiene el carrito y luego el producto", async () => {
    let resolverCarga;
    listarCarrito.mockReturnValueOnce(
      new Promise((resolve) => {
        resolverCarga = resolve;
      })
    );

    render(<Carrito />);

    expect(screen.getByText("Cargando tu carrito...")).toBeInTheDocument();

    await act(async () => {
      resolverCarga(respuestaCarrito());
    });

    expect(await screen.findByText("Audífonos")).toBeInTheDocument();
    expect(screen.getByText("Tienda Demo")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("muestra el estado de carrito vacío", async () => {
    listarCarrito.mockResolvedValueOnce(carritoVacio);

    render(<Carrito />);

    expect(await screen.findByText("Tu carrito está vacío")).toBeInTheDocument();
  });

  it("muestra el error cuando falla la carga", async () => {
    listarCarrito.mockRejectedValueOnce(new Error("Servicio no disponible"));

    render(<Carrito />);

    expect(await screen.findByText("Servicio no disponible")).toBeInTheDocument();
  });

  it("incrementa la cantidad del producto", async () => {
    const user = userEvent.setup();
    listarCarrito
      .mockResolvedValueOnce(respuestaCarrito(2))
      .mockResolvedValueOnce(respuestaCarrito(3));

    render(<Carrito />);

    await screen.findByText("Audífonos");
    await user.click(screen.getByRole("button", { name: "+" }));

    await waitFor(() => {
      expect(modificarCantidad).toHaveBeenCalledWith(7, 42, 3);
    });
    expect(await screen.findByText("3")).toBeInTheDocument();
  });

  it("elimina el producto al bajar de una unidad", async () => {
    const user = userEvent.setup();
    listarCarrito
      .mockResolvedValueOnce(respuestaCarrito(1))
      .mockResolvedValueOnce(carritoVacio);

    render(<Carrito />);

    await screen.findByText("Audífonos");
    await user.click(screen.getByRole("button", { name: "−" }));

    await waitFor(() => {
      expect(eliminarProducto).toHaveBeenCalledWith(7, 42);
    });
    expect(modificarCantidad).not.toHaveBeenCalled();
    expect(await screen.findByText("Tu carrito está vacío")).toBeInTheDocument();
  });

  it("elimina el artículo mediante su botón", async () => {
    const user = userEvent.setup();
    listarCarrito
      .mockResolvedValueOnce(respuestaCarrito())
      .mockResolvedValueOnce(carritoVacio);

    render(<Carrito />);

    await screen.findByText("Audífonos");
    await user.click(screen.getByRole("button", { name: "Eliminar producto" }));

    await waitFor(() => {
      expect(eliminarProducto).toHaveBeenCalledWith(7, 42);
    });
    expect(await screen.findByText("Tu carrito está vacío")).toBeInTheDocument();
  });

  it("espera el resumen antes de mostrar la pasarela y le pasa los totales", async () => {
    const user = userEvent.setup();
    const totales = { subtotal: 50000, iva: 9500, total: 59500 };
    let resolverResumen;
    obtenerResumenPedido.mockReturnValueOnce(
      new Promise((resolve) => {
        resolverResumen = resolve;
      })
    );

    render(<Carrito />);

    await screen.findByText("Audífonos");
    await user.click(screen.getByRole("button", { name: "Comprar" }));

    expect(screen.queryByTestId("pasarela-pago")).not.toBeInTheDocument();

    await act(async () => {
      resolverResumen({ data: { totales } });
    });

    expect(await screen.findByTestId("pasarela-pago")).toHaveTextContent(
      JSON.stringify(totales)
    );
  });
});
