import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Restablecer from "./Restablecer.jsx";
import { restablecerPassword } from "../../services/usuarios.service.js";

vi.mock("../../services/usuarios.service.js", () => ({
  restablecerPassword: vi.fn(),
}));

function renderPagina(ruta = "/restablecer?token=token-valido") {
  const resultado = render(
    <MemoryRouter initialEntries={[ruta]}>
      <Restablecer />
    </MemoryRouter>
  );
  return { ...resultado, formulario: resultado.container.querySelector("form") };
}

async function llenarContrasenas(usuario, nueva, confirmar = nueva) {
  await usuario.type(screen.getByLabelText("Nueva contraseña"), nueva);
  await usuario.type(screen.getByLabelText("Confirmar contraseña"), confirmar);
}

describe("Restablecer", () => {
  beforeEach(() => {
    restablecerPassword.mockReset();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("exige el token del enlace antes de llamar al servicio", async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { formulario } = renderPagina("/restablecer");

    // Act
    await llenarContrasenas(usuario, "clave1234");
    fireEvent.submit(formulario);

    // Assert
    expect(
      await screen.findByText(/falta el token de recuperación/)
    ).toBeInTheDocument();
    expect(restablecerPassword).not.toHaveBeenCalled();
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });

  it("exige al menos 8 caracteres", async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { formulario } = renderPagina();

    // Act
    await llenarContrasenas(usuario, "corta12");
    fireEvent.submit(formulario);

    // Assert
    expect(
      screen.getByText("La contraseña debe tener al menos 8 caracteres.")
    ).toBeInTheDocument();
    expect(restablecerPassword).not.toHaveBeenCalled();
  });

  it("exige que las contrasenas coincidan", async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { formulario } = renderPagina();

    // Act
    await llenarContrasenas(usuario, "clave1234", "clave4321");
    fireEvent.submit(formulario);

    // Assert
    expect(screen.getByText("Las contraseñas no coinciden.")).toBeInTheDocument();
    expect(restablecerPassword).not.toHaveBeenCalled();
  });

  it("restablece, muestra el mensaje del backend y bloquea el formulario", async () => {
    // Arrange
    const usuario = userEvent.setup();
    restablecerPassword.mockResolvedValue({ message: "Contrasena actualizada" });
    const { formulario } = renderPagina();

    // Act
    await llenarContrasenas(usuario, "clave1234");
    fireEvent.submit(formulario);

    // Assert
    expect(await screen.findByText("Contrasena actualizada")).toBeInTheDocument();
    expect(restablecerPassword).toHaveBeenCalledWith("token-valido", "clave1234");
    expect(screen.getByLabelText("Nueva contraseña")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Restablecer contraseña" })
    ).toBeDisabled();
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });

  it("usa el mensaje de exito por defecto", async () => {
    // Arrange
    const usuario = userEvent.setup();
    restablecerPassword.mockResolvedValue({});
    const { formulario } = renderPagina();

    // Act
    await llenarContrasenas(usuario, "clave1234");
    fireEvent.submit(formulario);

    // Assert
    expect(
      await screen.findByText(
        "Contraseña restablecida correctamente. Ya puedes iniciar sesión."
      )
    ).toBeInTheDocument();
  });

  it("muestra el error del backend cuando el enlace venció", async () => {
    // Arrange
    const usuario = userEvent.setup();
    restablecerPassword.mockRejectedValue(
      new Error("El enlace de recuperación expiró o ya fue usado.")
    );
    const { formulario } = renderPagina();

    // Act
    await llenarContrasenas(usuario, "clave1234");
    fireEvent.submit(formulario);

    // Assert
    expect(
      await screen.findByText("El enlace de recuperación expiró o ya fue usado.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nueva contraseña")).not.toBeDisabled();
  });

  it("alterna la visibilidad de ambas contrasenas", async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { container } = renderPagina();
    const nueva = screen.getByLabelText("Nueva contraseña");
    const confirmar = screen.getByLabelText("Confirmar contraseña");
    const [ojoNueva, ojoConfirmar] = container.querySelectorAll(
      'button[type="button"]'
    );

    // Act
    await usuario.click(ojoNueva);
    await usuario.click(ojoConfirmar);

    // Assert
    expect(nueva).toHaveAttribute("type", "text");
    expect(confirmar).toHaveAttribute("type", "text");
  });

  it("ofrece volver al inicio de sesion", () => {
    renderPagina();

    expect(
      screen.getByRole("link", { name: /Volver al inicio de sesión/ })
    ).toHaveAttribute("href", "/login");
  });
});
