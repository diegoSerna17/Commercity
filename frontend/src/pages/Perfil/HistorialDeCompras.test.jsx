import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HistorialDeCompras from "./HistorialDeCompras.jsx";
import {
  cancelarCompra,
  listarHistorialCompras,
} from "../../services/historial.service.js";

vi.mock("../../components/globales/Header", () => ({
  default: ({ title }) => <h1>{title}</h1>,
}));

vi.mock("../../services/historial.service.js", () => ({
  listarHistorialCompras: vi.fn(),
  cancelarCompra: vi.fn(),
}));

function pedidoApi(sobreescribir = {}) {
  return {
    pedido_id: 501,
    fecha: "2026-10-12T10:00:00.000Z",
    estado: "En camino",
    direccion: "Calle 1 #2-3",
    vendedores: ["Ana Perez"],
    items: [
      {
        detalle_id: 1,
        producto: "Teclado",
        cantidad: 2,
        precio_unitario: "50000",
        estado: "Pendiente",
      },
      {
        detalle_id: 2,
        producto: "Mouse",
        cantidad: 1,
        precio_unitario: "30000",
        estado: "Entregado",
      },
    ],
    resumen: { subtotal: 130000, iva: 24700, total: 154700 },
    ...sobreescribir,
  };
}

async function abrirDetalle(usuario) {
  await screen.findAllByText("Ana Perez");
  await usuario.click(screen.getAllByRole("button", { name: "Ver compra" })[0]);
}

describe("HistorialDeCompras", () => {
  beforeEach(() => {
    listarHistorialCompras.mockReset();
    cancelarCompra.mockReset();
  });

  it("muestra el estado de carga", () => {
    listarHistorialCompras.mockReturnValue(new Promise(() => {}));

    render(<HistorialDeCompras />);

    expect(screen.getByText("Cargando tu historial...")).toBeInTheDocument();
  });

  it("muestra el estado vacio", async () => {
    listarHistorialCompras.mockResolvedValue({ data: [] });

    render(<HistorialDeCompras />);

    expect(
      await screen.findByText("No hay pedidos para este filtro.")
    ).toBeInTheDocument();
  });

  it("mapea y muestra el pedido con su estado y total", async () => {
    listarHistorialCompras.mockResolvedValue({ data: [pedidoApi()] });

    render(<HistorialDeCompras />);

    expect(await screen.findByText("Historial Compras")).toBeInTheDocument();
    expect(screen.getAllByText("Ana Perez")).toHaveLength(2);
    expect(screen.getAllByText("AP")).toHaveLength(2);
    expect(screen.getByText("2 productos")).toBeInTheDocument();
    // El filtro "En Camino" comparte texto con las dos insignias del pedido.
    expect(screen.getAllByText("En Camino")).toHaveLength(3);
    expect(screen.getAllByText("$154.700")).toHaveLength(2);
    expect(screen.getByText("Teclado, Mouse")).toBeInTheDocument();
  });

  it("resume varios vendedores y tolera listas vacias o fechas invalidas", async () => {
    // Arrange
    listarHistorialCompras.mockResolvedValue({
      data: [
        pedidoApi({ pedido_id: 1, vendedores: ["Ana", "Beto", "Caro"] }),
        pedidoApi({ pedido_id: 2, vendedores: [], fecha: "no-es-fecha" }),
      ],
    });

    // Act
    render(<HistorialDeCompras />);

    // Assert
    expect(await screen.findAllByText("3 vendedores")).toHaveLength(2);
    expect(screen.getAllByText("Vendedor")).toHaveLength(2);
  });

  it("recarga con el estado elegido en los filtros", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarHistorialCompras.mockResolvedValue({ data: [] });
    render(<HistorialDeCompras />);
    await screen.findByText("No hay pedidos para este filtro.");
    expect(listarHistorialCompras).toHaveBeenNthCalledWith(1, null);

    // Act
    await usuario.click(screen.getByRole("button", { name: "Pendiente" }));
    await waitFor(() =>
      expect(listarHistorialCompras).toHaveBeenLastCalledWith("Pendiente")
    );
    await usuario.click(screen.getByRole("button", { name: "Todo" }));

    // Assert
    await waitFor(() =>
      expect(listarHistorialCompras).toHaveBeenLastCalledWith(null)
    );
  });

  it("muestra el error del servicio y vacia la lista", async () => {
    listarHistorialCompras.mockRejectedValue(new Error("Historial caido"));

    render(<HistorialDeCompras />);

    expect(await screen.findByText("Historial caido")).toBeInTheDocument();
    expect(
      screen.getByText("No hay pedidos para este filtro.")
    ).toBeInTheDocument();
  });

  it("usa el mensaje de error por defecto", async () => {
    listarHistorialCompras.mockRejectedValue({});

    render(<HistorialDeCompras />);

    expect(
      await screen.findByText("No se pudo cargar el historial de compras")
    ).toBeInTheDocument();
  });

  it("abre el detalle y lo cierra con Escape", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarHistorialCompras.mockResolvedValue({ data: [pedidoApi()] });
    render(<HistorialDeCompras />);

    // Act
    await abrirDetalle(usuario);

    // Assert
    expect(screen.getByText("Detalle de la compra")).toBeInTheDocument();
    expect(screen.getByText("Calle 1 #2-3")).toBeInTheDocument();
    expect(screen.getByText("$100.000")).toBeInTheDocument();
    expect(screen.getAllByText("$24.700").length).toBeGreaterThan(0);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Detalle de la compra")).not.toBeInTheDocument();
  });

  it("cancela una linea Pendiente y recarga el historial", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarHistorialCompras.mockResolvedValue({ data: [pedidoApi()] });
    let resolver;
    cancelarCompra.mockReturnValue(new Promise((resolve) => { resolver = resolve; }));
    render(<HistorialDeCompras />);
    await abrirDetalle(usuario);

    // Act
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    // Assert
    expect(screen.getByRole("button", { name: "Cancelando..." })).toBeDisabled();
    expect(cancelarCompra).toHaveBeenCalledWith(1);

    resolver();
    await waitFor(() =>
      expect(listarHistorialCompras).toHaveBeenCalledTimes(2)
    );
    await waitFor(() =>
      expect(screen.queryByText("Cancelando...")).not.toBeInTheDocument()
    );
  });

  it("muestra el error cuando no se puede cancelar", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarHistorialCompras.mockResolvedValue({ data: [pedidoApi()] });
    cancelarCompra.mockRejectedValue(new Error("La linea ya fue enviada"));
    render(<HistorialDeCompras />);
    await abrirDetalle(usuario);

    // Act
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    // Assert
    expect(
      await screen.findByText("La linea ya fue enviada")
    ).toBeInTheDocument();
    expect(screen.getByText("Detalle de la compra")).toBeInTheDocument();
  });
});
