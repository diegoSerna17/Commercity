import { beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "../api/client.js";
import { crearReporte } from "./reportes.service.js";

vi.mock("../api/client.js", () => ({
  request: vi.fn(),
}));

describe("crearReporte", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    request.mockResolvedValue({ success: true, data: { id: 1 } });
  });

  it("arma el FormData de un reporte de usuario y omite al informante", async () => {
    // Act
    await crearReporte({
      tipo: "Usuario",
      motivo: "Acoso por el chat",
      usuarioReportadoId: 12,
    });

    // Assert
    expect(request).toHaveBeenCalledTimes(1);
    const [ruta, opciones] = request.mock.calls[0];
    expect(ruta).toBe("/api/reportes");
    expect(opciones.method).toBe("POST");
    expect(opciones.isForm).toBe(true);

    const formData = opciones.body;
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("tipo")).toBe("Usuario");
    expect(formData.get("usuario_reportado_id")).toBe("12");
    expect(formData.get("motivo")).toBe("Acoso por el chat");
    // SEC-001: el informante lo determina el backend desde el JWT, nunca el body.
    expect(Array.from(formData.keys())).toEqual([
      "tipo",
      "motivo",
      "usuario_reportado_id",
    ]);
  });

  it("agrega la evidencia solo cuando se envia un archivo", async () => {
    // Arrange
    const evidencia = new File(["contenido"], "captura.png", {
      type: "image/png",
    });

    // Act
    await crearReporte({
      tipo: "Usuario",
      motivo: "Prueba",
      usuarioReportadoId: 3,
      evidencia,
    });

    // Assert
    const formData = request.mock.calls[0][1].body;
    expect(formData.get("evidencia")).toBe(evidencia);
  });
});
