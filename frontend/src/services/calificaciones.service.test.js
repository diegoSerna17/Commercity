import { beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "../api/client.js";
import { calificarVendedor } from "./calificaciones.service.js";

vi.mock("../api/client.js", () => ({
  request: vi.fn(),
}));

describe("calificaciones.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("arma el cuerpo del POST /api/calificaciones/vendedor (RF107)", async () => {
    // Arrange
    request.mockResolvedValue({ success: true, data: { id: 1 } });
    const datos = {
      pedido_id: 5,
      vendedor_id: 3,
      estrellas: 4,
      comentario: "Buen vendedor",
    };

    // Act
    const resultado = await calificarVendedor(datos);

    // Assert
    expect(request).toHaveBeenCalledWith("/api/calificaciones/vendedor", {
      method: "POST",
      body: datos,
    });
    expect(resultado).toEqual({ success: true, data: { id: 1 } });
  });

  it("propaga el 409 de calificacion duplicada", async () => {
    // Arrange
    const error = Object.assign(new Error("El pedido ya fue calificado"), {
      status: 409,
    });
    request.mockRejectedValue(error);

    // Act / Assert
    await expect(
      calificarVendedor({ pedido_id: 5, vendedor_id: 3, estrellas: 5 })
    ).rejects.toMatchObject({ status: 409, message: "El pedido ya fue calificado" });
  });
});
