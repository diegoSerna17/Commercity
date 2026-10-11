import { beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "../api/client.js";
import { listarProductos } from "./productos.service.js";

vi.mock("../api/client.js", () => ({
  request: vi.fn(),
}));

describe("listarProductos", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    request.mockResolvedValue({ success: true, data: {} });
  });

  it("M-20: envia vendedor_id solo cuando se indica", async () => {
    // Act
    await listarProductos({ vendedorId: 5, limit: 100 });

    // Assert
    expect(request).toHaveBeenCalledWith(
      "/api/productos?page=1&limit=100&vendedor_id=5"
    );
  });

  it("omite los filtros vacios", async () => {
    // Act
    await listarProductos();

    // Assert
    expect(request).toHaveBeenCalledWith("/api/productos?page=1&limit=12");
  });

  it("envia nombre y categoria cuando tienen valor", async () => {
    // Act
    await listarProductos({ nombre: "  teclado  ", categoria: "Tecnologia" });

    // Assert
    expect(request).toHaveBeenCalledWith(
      "/api/productos?page=1&limit=12&nombre=teclado&categoria=Tecnologia"
    );
  });
});
