import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

  afterEach(() => {
    vi.useRealTimers();
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

  it("valida el motivo requerido y el maximo de caracteres", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ReportarUsuario usuario={USUARIO} onClose={vi.fn()} />);

    // Act
    await user.click(screen.getByRole("button", { name: "Enviar reporte" }));

    // Assert
    expect(
      screen.getByText("La descripción es requerida.")
    ).toBeInTheDocument();

    // Act
    fireEvent.change(
      screen.getByPlaceholderText("Describe el motivo del reporte..."),
      { target: { value: "a".repeat(2001) } }
    );
    await user.click(screen.getByRole("button", { name: "Enviar reporte" }));

    // Assert
    expect(
      screen.getByText(
        "La descripción no puede superar los 2000 caracteres."
      )
    ).toBeInTheDocument();
    expect(crearReporte).not.toHaveBeenCalled();
  });

  it("avisa cuando no puede identificar el usuario reportado", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ReportarUsuario usuario={{}} onClose={vi.fn()} />);

    // Act
    await user.type(
      screen.getByPlaceholderText("Describe el motivo del reporte..."),
      "Motivo valido"
    );
    await user.click(screen.getByRole("button", { name: "Enviar reporte" }));

    // Assert
    expect(
      await screen.findByText("No se pudo identificar el usuario reportado.")
    ).toBeInTheDocument();
    expect(crearReporte).not.toHaveBeenCalled();
  });

  it("usa el mensaje por defecto cuando falla el envio", async () => {
    // Arrange
    const user = userEvent.setup();
    crearReporte.mockRejectedValue({});
    render(<ReportarUsuario usuario={USUARIO} onClose={vi.fn()} />);

    // Act
    await user.type(
      screen.getByPlaceholderText("Describe el motivo del reporte..."),
      "Motivo valido"
    );
    await user.click(screen.getByRole("button", { name: "Enviar reporte" }));

    // Assert
    expect(
      await screen.findByText("No se pudo enviar el reporte.")
    ).toBeInTheDocument();
  });

  it("adjunta la evidencia desde el input y desde el arrastre", async () => {
    // Arrange
    const user = userEvent.setup();
    crearReporte.mockResolvedValue({ success: true });
    render(<ReportarUsuario usuario={USUARIO} onClose={vi.fn()} />);
    // El modal se portaliza en document.body, fuera del container de render.
    const input = document.querySelector('input[type="file"]');
    const seleccionado = new File(["contenido"], "evidencia.pdf", {
      type: "application/pdf",
    });

    // Act
    fireEvent.change(input, { target: { files: [seleccionado] } });

    // Assert
    expect(screen.getByText("evidencia.pdf")).toBeInTheDocument();

    // Act
    const zona = screen.getByRole("button", { name: /Haz click para subir/ });
    fireEvent.click(zona);
    fireEvent.dragOver(zona);
    fireEvent.dragLeave(zona);
    const arrastrado = new File(["datos"], "informe.pdf", {
      type: "application/pdf",
    });
    fireEvent.drop(zona, { dataTransfer: { files: [arrastrado] } });

    // Assert
    expect(screen.getByText("informe.pdf")).toBeInTheDocument();

    // Act
    fireEvent.change(
      screen.getByPlaceholderText("Describe el motivo del reporte..."),
      { target: { value: "Adjunto evidencia" } }
    );
    await user.click(screen.getByRole("button", { name: "Enviar reporte" }));

    // Assert
    await waitFor(() => {
      expect(crearReporte).toHaveBeenCalledWith(
        expect.objectContaining({ evidencia: arrastrado })
      );
    });
  });

  it("cierra con cancelar, con la X y con el fondo", async () => {
    // Arrange
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ReportarUsuario usuario={USUARIO} onClose={onClose} />);
    await user.type(
      screen.getByPlaceholderText("Describe el motivo del reporte..."),
      "Motivo valido"
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(
      screen.getByPlaceholderText("Describe el motivo del reporte...")
    ).toHaveValue("");

    // Act
    fireEvent.click(within(screen.getByRole("dialog")).getAllByRole("button")[0]);

    // Assert
    expect(onClose).toHaveBeenCalledTimes(2);

    // Act
    fireEvent.mouseDown(screen.getByRole("presentation"));

    // Assert
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("cierra solo despues de dos segundos cuando el envio es exitoso", async () => {
    // Arrange
    vi.useFakeTimers();
    const onClose = vi.fn();
    crearReporte.mockResolvedValue({ success: true });
    render(<ReportarUsuario usuario={USUARIO} onClose={onClose} />);
    fireEvent.change(
      screen.getByPlaceholderText("Describe el motivo del reporte..."),
      { target: { value: "Motivo valido" } }
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }));
    await act(async () => {});

    // Assert
    expect(
      screen.getByText("Reporte enviado exitosamente")
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    // Act
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByText("Reporte enviado exitosamente")
    ).not.toBeInTheDocument();
  });
});
