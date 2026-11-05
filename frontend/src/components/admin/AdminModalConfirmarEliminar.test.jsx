import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AdminModalConfirmarEliminar from "./AdminModalConfirmarEliminar.jsx";

function renderModal(props = {}) {
  const onConfirmar = vi.fn();
  const onCancelar = vi.fn();
  render(
    <AdminModalConfirmarEliminar
      nombre="Ana Perez"
      onConfirmar={onConfirmar}
      onCancelar={onCancelar}
      {...props}
    />
  );
  return { onConfirmar, onCancelar };
}

describe("AdminModalConfirmarEliminar", () => {
  it("usa el sustantivo del tipo Usuario por defecto", () => {
    renderModal();

    expect(screen.getByText("Eliminar Usuario")).toBeInTheDocument();
    expect(
      screen.getByText(/Seguro que quieres eliminar al usuario/)
    ).toBeInTheDocument();
    expect(screen.getByText("Ana Perez")).toBeInTheDocument();
    expect(
      screen.getByText(/Esta accion no se puede deshacer/)
    ).toBeInTheDocument();
  });

  it.each([
    ["Usuario", "al usuario"],
    ["Producto", "el producto"],
    ["Reporte", "el reporte"],
  ])("adapta el texto al tipo %s", (tipo, sustantivo) => {
    renderModal({ tipo });

    expect(screen.getByText(`Eliminar ${tipo}`)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`Seguro que quieres eliminar ${sustantivo}`))
    ).toBeInTheDocument();
  });

  it("usa el texto generico para un tipo desconocido", () => {
    renderModal({ tipo: "Comentario" });

    expect(
      screen.getByText(/Seguro que quieres eliminar el registro/)
    ).toBeInTheDocument();
  });

  it("confirma y cancela con los botones", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onConfirmar, onCancelar } = renderModal();

    // Act
    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    // Assert
    expect(onConfirmar).toHaveBeenCalledTimes(1);
    expect(onCancelar).toHaveBeenCalledTimes(1);
  });

  it("cancela al hacer clic en el fondo", () => {
    // Arrange
    const { onCancelar } = renderModal();

    // Act
    fireEvent.mouseDown(screen.getByRole("presentation"));

    // Assert
    expect(onCancelar).toHaveBeenCalledTimes(1);
  });
});
