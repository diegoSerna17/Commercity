import { fotoProductoPorCategoria } from "../data/fotosProductoPorCategoria.js";

/** Local image used when a product image cannot be loaded or is a 1x1 test pixel. */
export const PRODUCT_IMAGE_FALLBACK = `${import.meta.env.BASE_URL}product-placeholder.svg`;

/**
 * Resuelve la imagen de respaldo de un producto: primero una fotografia real
 * acorde a su categoria; si la categoria no tiene fotos, la imagen local neutra.
 * @param {string|undefined} categoria Nombre de la categoria del producto.
 * @param {number|string|undefined} id Id del producto (semilla de la eleccion).
 * @returns {string}
 */
export function resolverImagenRespaldoProducto(categoria, id) {
  return fotoProductoPorCategoria(categoria, id) || PRODUCT_IMAGE_FALLBACK;
}

/**
 * Aplica el respaldo en dos etapas sobre un <img> de producto:
 *   0 -> 1: reemplaza por una foto real de la categoria (si existe).
 *   1 -> 2: si esa foto tambien falla (sin conexion), usa la imagen local neutra.
 * Las etapas se guardan en dataset para no reentrar en el evento onError.
 * Requiere que el <img> lleve data-categoria y data-product-id.
 */
function aplicarRespaldo(image) {
  const etapa = image.dataset.fallbackStage || "0";

  if (etapa === "0") {
    const foto = fotoProductoPorCategoria(image.dataset.categoria, image.dataset.productId);
    if (foto) {
      image.dataset.fallbackStage = "1";
      image.src = foto;
      return;
    }
  }

  if (image.dataset.fallbackStage !== "2") {
    image.dataset.fallbackStage = "2";
    image.src = PRODUCT_IMAGE_FALLBACK;
  }
}

/** onError de <img>: la imagen del producto no cargo. */
export function aplicarFallbackImagenProducto(event) {
  aplicarRespaldo(event.currentTarget);
}

/** onLoad de <img>: la imagen cargo pero es un pixel de prueba (1x1). */
export function replaceInvalidProductImage(event) {
  const image = event.currentTarget;
  if (image.naturalWidth <= 1 || image.naturalHeight <= 1) {
    aplicarRespaldo(image);
  }
}
