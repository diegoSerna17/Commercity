import { beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "../api/client.js";
import { obtenerPerfilPublico } from "./perfil.service.js";

vi.mock("../api/client.js", () => ({
  request: vi.fn(),
}));

describe("perfil.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("consulta el perfil publico por id (RF110)", async () => {
    // Arrange
    request.mockResolvedValue({
      success: true,
      data: { id: 5, nombre: "Ana Perez", biografia: null, avatar: "" },
    });

    // Act
    const resultado = await obtenerPerfilPublico(5);

    // Assert
    expect(request).toHaveBeenCalledWith("/api/usuarios/perfil-publico/5");
    expect(resultado.data.id).toBe(5);
  });

  it("propaga el 404 de un usuario inexistente o inactivo", async () => {
    // Arrange
    request.mockRejectedValue(
      Object.assign(new Error("Usuario no encontrado"), { status: 404 })
    );

    // Act / Assert
    await expect(obtenerPerfilPublico(99)).rejects.toMatchObject({ status: 404 });
  });
});
