import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { solicitarRecuperacion } from "../../services/usuarios.service.js";
import Recuperar from "./Recuperar.jsx";

vi.mock("../../services/usuarios.service.js", () => ({
  solicitarRecuperacion: vi.fn(),
}));

function renderRecuperar() {
  return render(
    <MemoryRouter initialEntries={["/recover"]}>
      <Recuperar />
    </MemoryRouter>
  );
}

describe("Recuperar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("muestra el mensaje uniforme del backend sin revelar si el correo existe", async () => {
    // Arrange
    const user = userEvent.setup();
    solicitarRecuperacion.mockResolvedValue({
      success: true,
      message: "Si el correo existe, recibirás un enlace para restablecer tu contraseña.",
    });
    renderRecuperar();

    // Act
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@correo.com");
    await user.click(screen.getByRole("button", { name: "Enviar enlace" }));

    // Assert
    expect(solicitarRecuperacion).toHaveBeenCalledWith("ana@correo.com");
    expect(
      await screen.findByText(
        "Si el correo existe, recibirás un enlace para restablecer tu contraseña."
      )
    ).toBeInTheDocument();
  });

  it("muestra el error cuando falla la solicitud", async () => {
    // Arrange
    const user = userEvent.setup();
    solicitarRecuperacion.mockRejectedValue(new Error("Servicio no disponible"));
    renderRecuperar();

    // Act
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@correo.com");
    await user.click(screen.getByRole("button", { name: "Enviar enlace" }));

    // Assert
    expect(await screen.findByText("Servicio no disponible")).toBeInTheDocument();
  });
});
