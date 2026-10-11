import { describe, expect, it } from "vitest";
import { API_BASE_URL } from "../constants/config.js";
import {
  AVATAR_POR_DEFECTO,
  calcularPrecioFinal,
  mapearProducto,
  resolverImagenProducto,
  resolverUrlArchivo,
} from "./mapearProducto.js";

describe("resolverUrlArchivo", () => {
  it("resuelve rutas relativas del backend contra la API", () => {
    expect(resolverUrlArchivo("/uploads/foto.png")).toBe(
      `${API_BASE_URL}/uploads/foto.png`
    );
  });

  it("deja intactas las URL absolutas y devuelve null sin ruta", () => {
    expect(resolverUrlArchivo("https://cdn.example.com/foto.png")).toBe(
      "https://cdn.example.com/foto.png"
    );
    expect(resolverUrlArchivo(null)).toBeNull();
    expect(resolverUrlArchivo("")).toBeNull();
  });
});

describe("resolverImagenProducto", () => {
  it("prefiere la imagen del backend y usa el respaldo cuando falta", () => {
    expect(resolverImagenProducto("/uploads/a.png", 1, "Tecnologia")).toBe(
      `${API_BASE_URL}/uploads/a.png`
    );
    const respaldo = resolverImagenProducto(null, 3, "Categoria-Inexistente");
    expect(respaldo).toBeTruthy();
    expect(respaldo).toContain("product-placeholder");
  });
});

describe("mapearProducto", () => {
  const producto = {
    id: 1,
    nombre: "Audífonos",
    categoria: "Tecnologia",
    descripcion: "Buenos",
    precio: "12500",
    descuento_porcentaje: "20",
    stock: "5",
    imagen: "/uploads/a.png",
    vendedor_id: 9,
    vendedor: "Tienda Demo",
    vendedor_foto: null,
  };

  it("traduce el producto del backend al shape de la tarjeta", () => {
    // Act
    const card = mapearProducto(producto);

    // Assert
    expect(card).toMatchObject({
      id: 1,
      name: "Audífonos",
      category: "Tecnologia",
      price: 12500,
      precioBase: 12500,
      descuento: 20,
      stock: 5,
      badge: "-20%",
      badgeBg: "bg-figma-accent-blue",
      vendedorId: 9,
      vendedorNombre: "Tienda Demo",
    });
    expect(card.image).toBe(`${API_BASE_URL}/uploads/a.png`);
    // Avatar local: sin depender de servicios de terceros.
    expect(card.vendedorAvatar).toBe(AVATAR_POR_DEFECTO);
  });

  it("no marca descuento cuando el producto no lo tiene", () => {
    // Act
    const card = mapearProducto({ ...producto, descuento_porcentaje: 0 });

    // Assert
    expect(card.badge).toBeNull();
    expect(card.badgeBg).toBeNull();
  });
});

describe("calcularPrecioFinal", () => {
  it("aplica el descuento redondeado (misma formula del backend)", () => {
    expect(
      calcularPrecioFinal({ price: 10000, precioBase: 10000, descuento: 20 })
    ).toBe(8000);
    expect(
      calcularPrecioFinal({ price: 9999, precioBase: 9999, descuento: 33 })
    ).toBe(Math.round(9999 - (9999 * 33) / 100));
  });

  it("devuelve el precio base cuando no hay descuento", () => {
    expect(
      calcularPrecioFinal({ price: 10000, precioBase: 10000, descuento: 0 })
    ).toBe(10000);
  });
});
