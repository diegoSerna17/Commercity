import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AdminModalReporte from "./AdminModalReporte.jsx";
import { reporteFalso } from "../../test/utils.jsx";

function renderModal(props = {}) {
  const callbacks = {
    onEnviarRespuesta: vi.fn(),
    onCerrar: vi.fn(),
    onToggleBanear: vi.fn(),
    onPedirEliminarUsuario: vi.fn(),
    onPedirEliminarProducto: vi.fn(),
  };
  const resultado = render(
    <AdminModalReporte
      reporte={reporteFalso()}
      modo="ver"
      estaBaneado={false}
      {...callbacks}
      {...props}
    />
  );
  return { ...callbacks, ...resultado };
}

describe("AdminModalReporte", () => {
  it("no renderiza nada sin reporte", () => {
    const { container } = render(<AdminModalReporte reporte={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("muestra los datos del reporte de usuario", () => {
    renderModal({
      reporte: reporteFalso({
        reportadoInfo: "Comprador · Bogota",
        reportadoPorInfo: "Vendedor · Medellin",
        evidencias: 2,
      }),
    });

    expect(screen.getByText("Detalle del Reporte")).toBeInTheDocument();
    expect(screen.getByText("Usuario")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText("2026-10-12")).toBeInTheDocument();
    expect(screen.getByText("Carlos Ruiz")).toBeInTheDocument();
    expect(screen.getByText("Comprador")).toBeInTheDocument();
    expect(screen.getByText("Ana Perez")).toBeInTheDocument();
    expect(screen.getByText("Vendedor")).toBeInTheDocument();
    expect(screen.getByText(/Lenguaje ofensivo/)).toBeInTheDocument();
    expect(screen.getByText("Foto 1")).toBeInTheDocument();
    expect(screen.getByText("Foto 2")).toBeInTheDocument();
  });

  it("no muestra evidencias cuando el conteo es cero", () => {
    renderModal({ reporte: reporteFalso({ evidencias: 0 }) });

    expect(screen.queryByText("Evidencias")).not.toBeInTheDocument();
  });

  it("muestra los datos y el precio del reporte de producto", () => {
    renderModal({
      reporte: reporteFalso({
        tipo: "producto",
        reportado: "Teclado gamer",
        reportadoPrecio: 150000,
        reportadoVendedor: "Ana Perez",
      }),
    });

    expect(screen.getByText("Producto")).toBeInTheDocument();
    expect(screen.getByText("Teclado gamer")).toBeInTheDocument();
    expect(screen.getByText("$150.000")).toBeInTheDocument();
    expect(screen.getByText("Vendedor: Ana Perez")).toBeInTheDocument();
    expect(screen.getByText("Acciones sobre el Producto")).toBeInTheDocument();
    expect(
      screen.queryByText("Acciones sobre el Usuario")
    ).not.toBeInTheDocument();
  });

  it("muestra la respuesta cuando el reporte esta resuelto", () => {
    renderModal({
      modo: "responder",
      reporte: reporteFalso({ estado: "resuelto", respuesta: "Caso cerrado" }),
    });

    expect(screen.getByText("Resuelto")).toBeInTheDocument();
    expect(screen.getByText("Respuesta del Administrador")).toBeInTheDocument();
    expect(screen.getByText("Caso cerrado")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("valida en linea que la respuesta no este vacia antes de enviar", async () => {
    // Arrange
    const user = userEvent.setup();
    const alerta = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { onEnviarRespuesta } = renderModal({ modo: "responder" });

    // Act
    await user.click(screen.getByRole("button", { name: "Enviar Respuesta" }));

    // Assert
    expect(
      screen.getByText("Por favor escribe una respuesta.")
    ).toBeInTheDocument();
    expect(onEnviarRespuesta).not.toHaveBeenCalled();
    expect(alerta).not.toHaveBeenCalled();
    alerta.mockRestore();
  });

  it("envia la respuesta recortada", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onEnviarRespuesta } = renderModal({ modo: "responder" });

    // Act
    await user.type(
      screen.getByPlaceholderText("Escribe tu respuesta al reporte..."),
      "  Revisado.  "
    );
    await user.click(screen.getByRole("button", { name: "Enviar Respuesta" }));

    // Assert
    expect(onEnviarRespuesta).toHaveBeenCalledWith("Revisado.");
  });

  it("no muestra el formulario de respuesta en modo ver", () => {
    renderModal({ modo: "ver" });

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Enviar Respuesta" })
    ).not.toBeInTheDocument();
  });

  it("alterna el baneo y pide eliminar al usuario", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onToggleBanear, onPedirEliminarUsuario } = renderModal();

    // Act
    await user.click(screen.getByRole("button", { name: "Banear" }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    // Assert
    expect(onToggleBanear).toHaveBeenCalledTimes(1);
    expect(onPedirEliminarUsuario).toHaveBeenCalledTimes(1);
  });

  it("muestra Activar cuando el usuario ya esta baneado", () => {
    renderModal({ estaBaneado: true });

    expect(screen.getByRole("button", { name: "Activar" })).toBeInTheDocument();
  });

  it("deshabilita las acciones cuando el usuario fue eliminado", () => {
    renderModal({ usuarioEliminadoDesdeReporte: true });

    expect(screen.getByRole("button", { name: "Eliminado" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Banear" })).toBeDisabled();
  });

  it("pide eliminar el producto y deshabilita si ya fue eliminado", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onPedirEliminarProducto, rerender } = renderModal({
      reporte: reporteFalso({ tipo: "producto", reportadoPrecio: 50000 }),
    });

    // Act
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    // Assert
    expect(onPedirEliminarProducto).toHaveBeenCalledTimes(1);

    rerender(
      <AdminModalReporte
        reporte={reporteFalso({ tipo: "producto", reportadoPrecio: 50000 })}
        modo="ver"
        productoEliminadoDesdeReporte
        onPedirEliminarProducto={onPedirEliminarProducto}
      />
    );
    expect(screen.getByRole("button", { name: "Eliminado" })).toBeDisabled();
  });

  it("cierra con el fondo y con el boton Cancelar", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onCerrar } = renderModal({ modo: "responder" });

    // Act
    fireEvent.mouseDown(screen.getByRole("presentation"));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    // Assert
    expect(onCerrar).toHaveBeenCalledTimes(2);
  });
});
