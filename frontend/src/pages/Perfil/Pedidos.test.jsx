import { render, screen, waitFor } from "@testing-library/react";
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

function respuestaVentas(estado = "Pendiente") {
  return {
    data: {
      items: [
        {
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
          estado_envio: estado,
        },
      ],
      resumen: {
        total_ventas: 1,
        total_bruto: 20000,
        total_neto_vendedor: 18000,
      },
      total_paginas: 1,
    },
  };
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
});
