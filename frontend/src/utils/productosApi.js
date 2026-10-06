/**
 * Cliente HTTP del modulo Catalogo/Producto (backend central).
 * Convencion del proyecto: contrato { success, data } / { success, error }.
 * Integrado desde Carlos Perea (2026-08-09) y adaptado a la URL base central.
 * F6 (P2 auditoria 2026-10-05): usa el cliente central (JWT + 401 global)
 * en vez del fetch duplicado sin autenticacion.
 */
import { request } from "../api/client.js";

/**
 * Lista los productos activos del panel principal (RF87-RF94).
 * @param {{ vendedorId?: number|string, categoriaId?: number|string, limit?: number, page?: number }} [opciones]
 * @returns {Promise<{ success: boolean, data: { productos: Array } }>}
 */
export async function listarProductos({ vendedorId, categoriaId, limit, page } = {}) {
  const params = new URLSearchParams();
  if (vendedorId) params.set("vendedorId", vendedorId);
  if (categoriaId) params.set("categoriaId", categoriaId);
  if (limit) params.set("limit", limit);
  if (page) params.set("page", page);

  const qs = params.toString();
  return request(`/api/productos${qs ? `?${qs}` : ""}`);
}

/**
 * Detalle completo de un producto con datos del vendedor (RF78/RF79).
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, data: object }>}
 */
export async function obtenerProducto(id) {
  return request(`/api/productos/${id}`);
}

/**
 * Valida en el backend el stock real para una cantidad antes de agregar al carrito (RF86).
 * @param {number|string} id
 * @param {number} cantidad
 * @returns {Promise<{ success: boolean, data: { valido: boolean, stock_disponible: number, estado: string, mensaje: string } }>}
 */
export async function validarStockProducto(id, cantidad) {
  return request(
    `/api/productos/${id}/validar-stock${cantidad ? `?cantidad=${cantidad}` : ""}`
  );
}
