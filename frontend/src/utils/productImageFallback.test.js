import { describe, expect, it } from "vitest";
import {
  PRODUCT_IMAGE_FALLBACK,
  aplicarFallbackImagenProducto,
  replaceInvalidProductImage,
  resolverImagenRespaldoProducto,
} from "./productImageFallback.js";

function imagenFalsa(dataset = {}, dimensiones = {}) {
  return {
    dataset: { ...dataset },
    src: "https://ejemplo.com/original.png",
    naturalWidth: dimensiones.width ?? 400,
    naturalHeight: dimensiones.height ?? 400,
  };
}

describe("productImageFallback", () => {
  it("usa la imagen local neutra cuando la categoria no tiene fotos", () => {
    expect(resolverImagenRespaldoProducto("Categoria-Inexistente", 1)).toBe(
      PRODUCT_IMAGE_FALLBACK
    );
  });

  it("aplica el respaldo en dos etapas cuando la imagen falla", () => {
    // Arrange: categoria sin fotos -> directo a la imagen local
    const sinFotos = imagenFalsa({ categoria: "Categoria-Inexistente", productId: "1" });

    // Act
    aplicarFallbackImagenProducto({ currentTarget: sinFotos });

    // Assert
    expect(sinFotos.dataset.fallbackStage).toBe("2");
    expect(sinFotos.src).toBe(PRODUCT_IMAGE_FALLBACK);

    // Arrange: categoria con fotos -> primero la foto real de la categoria
    const conFotos = imagenFalsa({ categoria: "Tecnologia", productId: "3" });

    // Act
    aplicarFallbackImagenProducto({ currentTarget: conFotos });

    // Assert
    expect(conFotos.dataset.fallbackStage).toBe("1");
    expect(conFotos.src).not.toBe("https://ejemplo.com/original.png");
  });

  it("reemplaza la imagen cuando solo cargo un pixel de prueba", () => {
    // Arrange
    const imagen = imagenFalsa({ categoria: "Tecnologia", productId: "3" }, { width: 1, height: 1 });

    // Act
    replaceInvalidProductImage({ currentTarget: imagen });

    // Assert
    expect(imagen.dataset.fallbackStage).toBe("1");
  });

  it("no toca las imagenes validas", () => {
    // Arrange
    const imagen = imagenFalsa({ categoria: "Tecnologia", productId: "3" });

    // Act
    replaceInvalidProductImage({ currentTarget: imagen });

    // Assert
    expect(imagen.dataset.fallbackStage).toBeUndefined();
    expect(imagen.src).toBe("https://ejemplo.com/original.png");
  });
});
