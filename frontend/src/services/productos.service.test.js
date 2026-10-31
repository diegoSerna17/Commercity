import { beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "../api/client.js";
import {
  actualizarProducto,
  crearProducto,
  listarCategorias,
  listarMisProductos,
  listarProductos,
  listarVendedores,
  obtenerProducto,
} from "./productos.service.js";

vi.mock("../api/client.js", () => ({
  request: vi.fn(),
}));

describe("productos.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    request.mockResolvedValue({ success: true, data: {} });
  });

  describe("listarProductos", () => {
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

    it("envia el filtro por vendedor y recorta espacios", async () => {
      // Act
      await listarProductos({ vendedor: "  Ana Perez  " });

      // Assert
      expect(request).toHaveBeenCalledWith(
        "/api/productos?page=1&limit=12&vendedor=Ana+Perez"
      );
    });
  });

  it("obtenerProducto consulta el detalle publico (RF78/RF79)", async () => {
    await obtenerProducto(7);
    expect(request).toHaveBeenCalledWith("/api/productos/7");
  });

  it("listarCategorias y listarVendedores alimentan los filtros del catalogo", async () => {
    await listarCategorias();
    expect(request).toHaveBeenLastCalledWith("/api/categorias");

    await listarVendedores();
    expect(request).toHaveBeenLastCalledWith("/api/vendedores");
  });

  it("listarMisProductos pide los productos del vendedor autenticado (RF54)", async () => {
    await listarMisProductos();
    expect(request).toHaveBeenCalledWith("/api/productos/mis-productos");
  });

  it("crearProducto envia FormData con los campos y la imagen (RF45/RF46/RF48)", async () => {
    // Arrange
    const imagen = new File(["foto"], "producto.png", { type: "image/png" });

    // Act
    await crearProducto(
      {
        nombre: "  Teclado  ",
        descripcion: "  Mecanico  ",
        precio: 150000,
        stock: 0,
        categoria: " Tecnologia ",
        descuento: 0,
      },
      imagen
    );

    // Assert
    const [ruta, opciones] = request.mock.calls[0];
    expect(ruta).toBe("/api/productos");
    expect(opciones.method).toBe("POST");
    expect(opciones.isForm).toBe(true);
    expect(opciones.body).toBeInstanceOf(FormData);
    expect(opciones.body.get("nombre")).toBe("Teclado");
    expect(opciones.body.get("descripcion")).toBe("Mecanico");
    expect(opciones.body.get("precio")).toBe("150000");
    expect(opciones.body.get("stock")).toBe("0");
    expect(opciones.body.get("categoria")).toBe("Tecnologia");
    expect(opciones.body.get("descuento")).toBe("0");
    expect(opciones.body.get("imagen")).toBe(imagen);
  });

  it("crearProducto omite los campos vacios y la imagen ausente", async () => {
    // Act
    await crearProducto({ nombre: "Teclado", descripcion: "", precio: 1000 });

    // Assert
    const opciones = request.mock.calls[0][1];
    expect(opciones.body.get("nombre")).toBe("Teclado");
    expect(opciones.body.has("descripcion")).toBe(false);
    expect(opciones.body.has("stock")).toBe(false);
    expect(opciones.body.has("imagen")).toBe(false);
  });

  it("actualizarProducto hace PUT con FormData y la imagen opcional (RF49)", async () => {
    // Act
    await actualizarProducto(7, { nombre: "Teclado nuevo", stock: 3 });

    // Assert
    const [ruta, opciones] = request.mock.calls[0];
    expect(ruta).toBe("/api/productos/7");
    expect(opciones.method).toBe("PUT");
    expect(opciones.isForm).toBe(true);
    expect(opciones.body.get("nombre")).toBe("Teclado nuevo");
    expect(opciones.body.get("stock")).toBe("3");
    expect(opciones.body.has("imagen")).toBe(false);
  });
});
