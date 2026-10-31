import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  avanzarEstadoPedido,
  listarVentas,
} from "../../services/tienda.service.js";
import Pedidos from "./Pedidos.jsx";

vi.mock("../../components/globales/Header", () => ({
  default: () => <header>Header</header>,
}));

vi.mock("../../services/tienda.service.js", () => ({
  listarVentas: vi.fn(),
  avanzarEstadoPedido: vi.fn(),
}));

vi.mock("./DetallePedidos", () => ({
  default: ({ pedido, onClose }) => (
    <div>
      <p>Detalle {pedido.id}</p>
      <button type="button" onClick={onClose}>
        Cerrar detalle
      </button>
    </div>
  ),
}));

function itemVenta(sobreescribir = {}) {
  return {
    id: 1,
    pedido_id: 50,
    referencia_pedido: "REF-50",
    nombre_comprador: "Carlos Comprador",
    email_comprador: "carlos@correo.com",
    fecha_pedido: "2026-10-01T10:00:00.000Z",
    nombre_producto: "Audífonos",
    cantidad: 2,
    valor_unitario: 10000,
    valor_subtotal: 20000,
    monto_vendedor: 18000,
    monto_comision: 2000,
    estado_envio: "Pendiente",
    ...sobreescribir,
  };
}

function respuestaConItems(items, { totalPaginas = 1 } = {}) {
  return {
    data: {
      items,
      resumen: {
        total_ventas: items.length,
        total_bruto: 20000,
        total_neto_vendedor: 18000,
      },
      total_paginas: totalPaginas,
    },
  };
}

function respuestaVentas(estado = "Pendiente") {
  return respuestaConItems([itemVenta({ estado_envio: estado })]);
}

describe("Pedidos", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    listarVentas.mockResolvedValue(respuestaVentas());
    avanzarEstadoPedido.mockResolvedValue({ success: true });
  });

  it("carga las ventas del vendedor y muestra la tabla", async () => {
    // Act
    render(<Pedidos />);

    // Assert
    expect(await screen.findByText("Carlos Comprador")).toBeInTheDocument();
    expect(screen.getByText("1 producto")).toBeInTheDocument();
    expect(screen.getByText(/Total vendido:/)).toBeInTheDocument();
    expect(listarVentas).toHaveBeenCalledWith({ estado: null, pagina: 1 });
  });

  it("vuelve a consultar al cambiar de filtro", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Pedidos />);
    await screen.findByText("Carlos Comprador");

    // Act
    await user.click(screen.getByRole("button", { name: "Entregado" }));

    // Assert
    await waitFor(() => {
      expect(listarVentas).toHaveBeenLastCalledWith({ estado: "Entregado", pagina: 1 });
    });
  });

  it("avanza el estado del pedido un solo nivel (RF124)", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Pedidos />);
    await screen.findByText("Carlos Comprador");

    // Act
    await user.selectOptions(screen.getByRole("combobox"), "En Camino");

    // Assert
    await waitFor(() => {
      expect(avanzarEstadoPedido).toHaveBeenCalledWith(50, "En camino");
    });
  });

  it("muestra el error de carga y permite reintentar con el filtro", async () => {
    // Arrange
    listarVentas.mockRejectedValueOnce(new Error("Servicio no disponible"));

    // Act
    render(<Pedidos />);

    // Assert
    expect(await screen.findByText("Servicio no disponible")).toBeInTheDocument();
  });

  it("mapea estados sin avance, fechas invalidas y comprador por defecto", async () => {
    // Arrange
    listarVentas.mockResolvedValueOnce(
      respuestaConItems([
        itemVenta({
          id: 1,
          nombre_comprador: undefined,
          estado_envio: "En camino",
          fecha_pedido: "fecha-invalida",
        }),
        itemVenta({
          id: 2,
          nombre_comprador: "Dora Luz",
          estado_envio: "Devuelto",
        }),
      ])
    );

    // Act
    render(<Pedidos />);

    // Assert
    expect(await screen.findByText("Comprador")).toBeInTheDocument();
    const selectores = screen.getAllByRole("combobox");
    // Defecto registrado en el ledger: "En camino" se muestra como "En Camino"
    // pero SIGUIENTE_ESTADO no reconoce esa etiqueta y el selector queda deshabilitado.
    expect(selectores[0]).toHaveValue("En Camino");
    expect(selectores[0]).toBeDisabled();
    expect(selectores[1]).toHaveValue("Devuelto");
    expect(selectores[1]).toBeDisabled();
  });

  it("carga la siguiente pagina y acumula los pedidos", async () => {
    // Arrange
    const user = userEvent.setup();
    listarVentas
      .mockResolvedValueOnce(respuestaConItems([itemVenta()], { totalPaginas: 2 }))
      .mockResolvedValueOnce(
        respuestaConItems(
          [itemVenta({ id: 2, pedido_id: 51, nombre_comprador: "Dora Luz" })],
          { totalPaginas: 2 }
        )
      );
    render(<Pedidos />);
    await screen.findByText("Carlos Comprador");

    // Act
    await user.click(
      screen.getByRole("button", { name: "Cargar mas pedidos" })
    );

    // Assert
    await waitFor(() =>
      expect(listarVentas).toHaveBeenLastCalledWith({ estado: null, pagina: 2 })
    );
    expect(await screen.findByText("Dora Luz")).toBeInTheDocument();
    expect(screen.getByText("Carlos Comprador")).toBeInTheDocument();
  });

  it("descarta las respuestas viejas al cambiar de filtro", async () => {
    // Arrange
    const user = userEvent.setup();
    let resolverPrimera;
    listarVentas
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolverPrimera = resolve;
        })
      )
      .mockResolvedValueOnce(
        respuestaConItems([
          itemVenta({
            id: 2,
            nombre_comprador: "Beatriz Nueva",
            estado_envio: "Entregado",
          }),
        ])
      );
    render(<Pedidos />);

    // Act
    await user.click(screen.getByRole("button", { name: "Entregado" }));

    // Assert
    expect(await screen.findByText("Beatriz Nueva")).toBeInTheDocument();

    // Act
    await act(async () => {
      resolverPrimera(
        respuestaConItems([itemVenta({ nombre_comprador: "Carlos Viejo" })])
      );
    });

    // Assert
    expect(screen.queryByText("Carlos Viejo")).not.toBeInTheDocument();
    expect(screen.getByText("Beatriz Nueva")).toBeInTheDocument();
  });

  it("ignora el error de una respuesta vieja al cambiar de filtro", async () => {
    // Arrange
    const user = userEvent.setup();
    let rechazarPrimera;
    listarVentas
      .mockReturnValueOnce(
        new Promise((_, reject) => {
          rechazarPrimera = reject;
        })
      )
      .mockResolvedValueOnce(
        respuestaConItems([
          itemVenta({ id: 2, nombre_comprador: "Beatriz Nueva" }),
        ])
      );
    render(<Pedidos />);

    // Act
    await user.click(screen.getByRole("button", { name: "Entregado" }));
    await screen.findByText("Beatriz Nueva");
    await act(async () => {
      rechazarPrimera(new Error("Error viejo"));
    });

    // Assert
    expect(screen.queryByText("Error viejo")).not.toBeInTheDocument();
    expect(screen.getByText("Beatriz Nueva")).toBeInTheDocument();
  });

  it("muestra los errores al avanzar el estado del pedido", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Pedidos />);
    await screen.findByText("Carlos Comprador");

    // Act
    avanzarEstadoPedido.mockRejectedValueOnce(new Error("No autorizado"));
    await user.selectOptions(screen.getByRole("combobox"), "En Camino");

    // Assert
    expect(await screen.findByText("No autorizado")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("Pendiente");

    // Act
    avanzarEstadoPedido.mockRejectedValueOnce({});
    await user.selectOptions(screen.getByRole("combobox"), "En Camino");

    // Assert
    expect(
      await screen.findByText("No se pudo actualizar el estado del pedido")
    ).toBeInTheDocument();
  });

  it("abre y cierra el detalle del pedido", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Pedidos />);
    await screen.findByText("Carlos Comprador");

    // Act
    await user.click(screen.getByRole("button", { name: "Ver detalle" }));

    // Assert
    expect(screen.getByText("Detalle 1")).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole("button", { name: "Cerrar detalle" }));

    // Assert
    expect(screen.queryByText("Detalle 1")).not.toBeInTheDocument();
  });
});
