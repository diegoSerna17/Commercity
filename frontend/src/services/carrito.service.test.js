import { beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "../api/client.js";
import {
  agregarProducto,
  eliminarProducto,
  listarCarrito,
  modificarCantidad,
} from "./carrito.service.js";

vi.mock("../api/client.js", () => ({
  request: vi.fn(),
}));

describe("carrito.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    request.mockResolvedValue({ success: true, data: {} });
  });

  it("listarCarrito consulta el carrito de la sesion (RF103/RF109)", async () => {
    // Act
    await listarCarrito();

    // Assert
    expect(request).toHaveBeenCalledWith("/api/carrito");
  });

  it("agregarProducto envia producto_id y cantidad (contrato POST /api/carrito)", async () => {
    // Act
    await agregarProducto(12, 3);

    // Assert
    expect(request).toHaveBeenCalledWith("/api/carrito", {
      method: "POST",
      body: { producto_id: 12, cantidad: 3 },
    });
  });

  it("agregarProducto usa cantidad 1 por defecto", async () => {
    // Act
    await agregarProducto(12);

    // Assert
    expect(request).toHaveBeenCalledWith("/api/carrito", {
      method: "POST",
      body: { producto_id: 12, cantidad: 1 },
    });
  });

  it("H1: nunca envia comprador_id, el backend lo deriva de la sesion", async () => {
    // Act
    await listarCarrito();
    await agregarProducto(12, 2);
    await modificarCantidad(12, 4);
    await eliminarProducto(12);

    // Assert
    const llamadas = request.mock.calls.flat();
    expect(JSON.stringify(llamadas)).not.toContain("comprador_id");
  });

  it("modificarCantidad hace PATCH sobre el producto con la cantidad nueva", async () => {
    // Act
    await modificarCantidad(12, 4);

    // Assert
    expect(request).toHaveBeenCalledWith("/api/carrito/12", {
      method: "PATCH",
      body: { cantidad: 4 },
    });
  });

  it("eliminarProducto hace DELETE sobre el producto", async () => {
    // Act
    await eliminarProducto(12);

    // Assert
    expect(request).toHaveBeenCalledWith("/api/carrito/12", { method: "DELETE" });
  });
});
