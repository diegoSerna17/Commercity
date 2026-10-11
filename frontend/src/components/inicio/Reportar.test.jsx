import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "../../api/client.js";
import { crearReporte } from "../../services/reportes.service.js";
import Reportar from "./Reportar.jsx";

vi.mock("../../api/client.js", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("../../services/reportes.service.js", () => ({
  crearReporte: vi.fn(),
}));

const PRODUCTO = { id: 42, name: "Audífonos" };

function imagen(nombre = "captura.png", bytes = 1024) {
  return new File([new ArrayBuffer(bytes)], nombre, { type: "image/png" });
}

describe("Reportar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentUser.mockReturnValue({ id: 7 });
    crearReporte.mockResolvedValue({ success: true, data: { id: 1 } });
  });

  it("exige descripción y evidencia antes de enviar", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Reportar producto={PRODUCTO} onClose={vi.fn()} />);

    // Act
    await user.click(screen.getByRole("button", { name: "Enviar reporte" }));

    // Assert
    expect(screen.getByText("La descripción es requerida.")).toBeInTheDocument();
    expect(
      screen.getByText("Debes subir al menos un archivo de evidencia.")
    ).toBeInTheDocument();
    expect(crearReporte).not.toHaveBeenCalled();
  });

  it("rechaza archivos que no son imagenes permitidas", () => {
    // Arrange
    render(<Reportar producto={PRODUCTO} onClose={vi.fn()} />);
    const input = screen.getByLabelText("Archivo de evidencia");

    // Act
    fireEvent.change(input, {
      target: { files: [new File(["texto"], "notas.txt", { type: "text/plain" })] },
    });

    // Assert
    expect(
      screen.getByText("Formato no permitido. Usa JPG, PNG, WEBP o GIF.")
    ).toBeInTheDocument();
  });

  it("rechaza evidencias de mas de 5 MB", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Reportar producto={PRODUCTO} onClose={vi.fn()} />);

    // Act
    await user.upload(
      screen.getByLabelText("Archivo de evidencia"),
      imagen("grande.png", 5 * 1024 * 1024 + 1)
    );

    // Assert
    expect(
      screen.getByText("La evidencia no puede superar los 5 MB.")
    ).toBeInTheDocument();
  });

  it("limita a un archivo y avisa cuando se eligen varios", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Reportar producto={PRODUCTO} onClose={vi.fn()} />);
    const dropZone = screen.getByRole("button", {
      name: /Haz click para subir tus archivos/,
    });

    // Act: solo el drag & drop puede traer mas de un archivo a la vez.
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [imagen("uno.png"), imagen("dos.png")] },
    });

    // Assert
    expect(
      screen.getByText("Solo se permite un archivo de evidencia; se usara el primero.")
    ).toBeInTheDocument();
    expect(screen.getByText("uno.png")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Describe el motivo del reporte..."),
      "Producto duplicado"
    );
    await user.click(screen.getByRole("button", { name: "Enviar reporte" }));

    // Assert
    expect(crearReporte).toHaveBeenCalledTimes(1);
    const enviado = crearReporte.mock.calls[0][0];
    expect(enviado).toMatchObject({
      tipo: "Producto",
      motivo: "Producto duplicado",
      productoId: 42,
    });
    expect(enviado.evidencia.name).toBe("uno.png");
  });

  it("envia el reporte con la evidencia valida", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Reportar producto={PRODUCTO} onClose={vi.fn()} />);

    // Act
    await user.upload(screen.getByLabelText("Archivo de evidencia"), imagen());
    await user.type(
      screen.getByPlaceholderText("Describe el motivo del reporte..."),
      "Producto defectuoso"
    );
    await user.click(screen.getByRole("button", { name: "Enviar reporte" }));

    // Assert
    expect(await screen.findByText("Reporte enviado exitosamente")).toBeInTheDocument();
    expect(crearReporte).toHaveBeenCalledTimes(1);
  });

  it("muestra el aviso de sesion cuando no hay usuario autenticado", async () => {
    // Arrange
    const user = userEvent.setup();
    getCurrentUser.mockReturnValue(null);
    render(<Reportar producto={PRODUCTO} onClose={vi.fn()} />);

    // Act
    await user.upload(screen.getByLabelText("Archivo de evidencia"), imagen());
    await user.type(
      screen.getByPlaceholderText("Describe el motivo del reporte..."),
      "Motivo valido"
    );
    await user.click(screen.getByRole("button", { name: "Enviar reporte" }));

    // Assert
    expect(
      await screen.findByText("Inicia sesión para reportar un producto.")
    ).toBeInTheDocument();
    expect(crearReporte).not.toHaveBeenCalled();
  });
});
