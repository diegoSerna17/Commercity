import { API_BASE_URL } from "../constants/config.js";
import { resolverImagenRespaldoProducto } from "./productImageFallback.js";

/**
 * Utilidades compartidas de las tarjetas de producto (Inicio, PerfilPublico,
 * Header y PerfilVendedor). Antes vivian duplicadas en cada pagina.
 */

// JS Avatar local por defecto: sin depender de servicios de imagenes de terceros.
export const AVATAR_POR_DEFECTO = `${import.meta.env.BASE_URL}avatar-placeholder.svg`;

/**
 * Resuelve una ruta de archivo del backend a una URL absoluta.
 * @param {string|null|undefined} ruta Ruta relativa (/uploads/x.jpg) o URL absoluta
 * @returns {string|null} URL lista para usar en un src, o null si no hay ruta
 */
export function resolverUrlArchivo(ruta) {
  if (!ruta) return null;
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return `${API_BASE_URL}${ruta}`;
}

/**
 * Imagen del producto: usa la del backend o una foto real de respaldo acorde
 * a la categoria del producto (estable por id).
 * @param {string|null|undefined} imagenUrl
 * @param {number|string} id
 * @param {string|undefined} categoria
 * @returns {string}
 */
export function resolverImagenProducto(imagenUrl, id, categoria) {
  return resolverUrlArchivo(imagenUrl) ?? resolverImagenRespaldoProducto(categoria, id);
}

/**
 * Traduce el producto de /api/productos al shape que consumen las tarjetas
 * (misma forma que usa la pagina principal).
 * @param {object} producto Producto crudo del backend
 * @returns {object} Producto listo para la tarjeta
 */
export function mapearProducto(producto) {
  const descuento = Number(producto.descuento_porcentaje) || 0;
  const precio = Number(producto.precio) || 0;

  return {
    id: producto.id,
    name: producto.nombre,
    category: producto.categoria,
    // JS Los precios monetarios se muestran sin decimales (COP)
    price: Math.round(precio),
    precioBase: Math.round(precio),
    descuento,
    stock: Number(producto.stock) || 0,
    image: resolverImagenProducto(producto.imagen, producto.id, producto.categoria),
    imageAlt: producto.nombre,
    description: producto.descripcion,
    vendedorId: producto.vendedor_id,
    vendedorNombre: producto.vendedor,
    vendedorAvatar: producto.vendedor_foto || AVATAR_POR_DEFECTO,
    badge: descuento > 0 ? `-${descuento}%` : null,
    badgeBg: descuento > 0 ? "bg-figma-accent-blue" : null,
  };
}

/**
 * Precio final con el descuento aplicado (misma formula del backend).
 * @param {{price: number, precioBase: number, descuento: number}} producto
 * @returns {number}
 */
export function calcularPrecioFinal(producto) {
  if (!producto.descuento) return producto.price;
  return Math.round(producto.precioBase - (producto.precioBase * producto.descuento) / 100);
}
