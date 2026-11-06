import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DetallePedidos from "./DetallePedidos.jsx";
import { pedidoFalso } from "../../test/utils.jsx";

function renderDetalle(sobreescribir = {}) {
  const onClose = vi.fn();
  const resultado = render(
    <DetallePedidos pedido={pedidoFalso(sobreescribir)} onClose={onClose} />
  );
  return { ...resultado, onClose };
}

describe("DetallePedidos", () => {
  it("no renderiza nada sin pedido", () => {
    const { container } = render(<DetallePedidos pedido={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("muestra los datos del pedido y calcula el total", () => {
    renderDetalle();

    expect(screen.getByText("Detalle del pedido")).toBeInTheDocument();
    expect(screen.getByText(/Fecha:/)).toHaveTextContent("12 de octubre de 2026");
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText("Ana Perez")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("Dirección de envío")).toBeInTheDocument();
    expect(screen.getByText("Calle 1 # 2-3")).toBeInTheDocument();
    expect(screen.getByText("Bogota")).toBeInTheDocument();
    expect(screen.getByText("Teclado mecanico")).toBeInTheDocument();
    expect(screen.getByText("Cantidad 2")).toBeInTheDocument();
    expect(screen.getAllByText("$100.000").length).toBeGreaterThan(0);
    expect(screen.getByText("$81.000")).toBeInTheDocument();
    expect(screen.getByText("$9.000")).toBeInTheDocument();
  });

  it("usa la referencia y el correo cuando no hay direccion", () => {
    renderDetalle({ direccion: null, ciudad: null, referencia: "PSE-998" });

    expect(screen.getByText("Referencia del pago")).toBeInTheDocument();
    expect(screen.getByText("PSE-998")).toBeInTheDocument();
    expect(
      screen.getByText("ana.perez@example.com")
    ).toBeInTheDocument();
    expect(screen.queryByText("Dirección de envío")).not.toBeInTheDocument();
  });

  it.each([
    ["Entregado", "text-primary-fixed-dim"],
    ["En Camino", "text-secondary-fixed-dim"],
    ["Pendiente", "text-error"],
    ["Desconocido", "text-on-surface-variant"],
  ])("aplica el chip del estado %s", (estado, clase) => {
    renderDetalle({ estado });

    const chip = document.querySelector(`span.${clase}`);
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent(estado);
  });

  it("aplica ganancia y comision por defecto y lista mas de cinco productos", () => {
    const productos = Array.from({ length: 6 }, (_, i) => ({
      detalleId: i + 1,
      nombre: `Producto ${i + 1}`,
      cantidad: 1,
      precioUnitario: 10000,
      precioUnit: 10000,
      estado: "Pendiente",
    }));

    renderDetalle({
      productos,
      neto: undefined,
      comision: undefined,
    });

    expect(screen.getByText("Producto 6")).toBeInTheDocument();
    expect(screen.getByText("$60.000")).toBeInTheDocument();
    expect(document.querySelector(".max-h-64")).toBeInTheDocument();
    expect(screen.getAllByText("$0").length).toBeGreaterThanOrEqual(2);
  });

  it("cierra con Escape, con el fondo y con el boton Cerrar", () => {
    // Arrange
    const { onClose } = renderDetalle();

    // Act
    fireEvent.keyDown(document, { key: "Enter" });
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("presentation"));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    // Assert
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("retira el listener de teclado al desmontar", () => {
    // Arrange
    const quitar = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderDetalle();

    // Act
    unmount();

    // Assert
    expect(quitar).toHaveBeenCalledWith("keydown", expect.any(Function));
    quitar.mockRestore();
  });
});
