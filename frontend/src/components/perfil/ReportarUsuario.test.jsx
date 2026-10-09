import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "../../api/client.js";
import { crearReporte } from "../../services/reportes.service.js";
import ReportarUsuario from "./ReportarUsuario.jsx";

vi.mock("../../api/client.js", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("../../services/reportes.service.js", () => ({
  crearReporte: vi.fn(),
}));

const USUARIO = { id: 12, nombre: "Tienda Demo" };

describe("ReportarUsuario", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentUser.mockReturnValue({ id: 7 });
  });

  it("muestra el aviso de inicio de sesion cuando no hay usuario autenticado", async () => {
    // Arrange
    const user = userEvent.setup();
    getCurrentUser.mockReturnValue(null);

    render(<ReportarUsuario usuario={USUARIO} onClose={vi.fn()} />);

    // Act
    await user.type(
      screen.getByPlaceholderText("Describe el motivo del reporte..."),
      "Spam"
    );
    await user.click(screen.getByRole("button", { name: "Enviar reporte" }));

    // Assert
    expect(
      await screen.findByText("Inicia sesión para reportar un usuario.")
    ).toBeInTheDocument();
    expect(crearReporte).not.toHaveBeenCalled();
  });

  it("envia el reporte de usuario y muestra el exito", async () => {
    // Arrange
    const user = userEvent.setup();
    crearReporte.mockResolvedValue({ success: true, data: { id: 1 } });

    render(<ReportarUsuario usuario={USUARIO} onClose={vi.fn()} />);

    // Act
    await user.type(
      screen.getByPlaceholderText("Describe el motivo del reporte..."),
      "Acoso en el chat"
    );
    await user.click(screen.getByRole("button", { name: "Enviar reporte" }));

    // Assert
    await waitFor(() => {
      expect(crearReporte).toHaveBeenCalledWith({
        tipo: "Usuario",
        motivo: "Acoso en el chat",
        usuarioReportadoId: 12,
        evidencia: undefined,
      });
    });
    expect(
      await screen.findByText("Reporte enviado exitosamente")
    ).toBeInTheDocument();
  });

  it("muestra el mensaje de error cuando falla el envio", async () => {
    // Arrange
    const user = userEvent.setup();
    crearReporte.mockRejectedValue(new Error("Servicio no disponible"));

    render(<ReportarUsuario usuario={USUARIO} onClose={vi.fn()} />);

    // Act
    await user.type(
      screen.getByPlaceholderText("Describe el motivo del reporte..."),
      "Motivo valido"
    );
    await user.click(screen.getByRole("button", { name: "Enviar reporte" }));

    // Assert
    expect(
      await screen.findByText("Servicio no disponible")
    ).toBeInTheDocument();
  });
});
