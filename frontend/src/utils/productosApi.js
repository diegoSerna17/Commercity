/**
 * Cliente HTTP del modulo Catalogo/Producto (backend central).
 * Convencion del proyecto: contrato { success, data } / { success, error }.
 * Integrado desde Carlos Perea (2026-08-09) y adaptado a la URL base central.
 */
const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:5000";

async function manejarRespuesta(response) {
  const datos = await response.json().catch(() => null);

  if (!response.ok) {
    const mensaje = datos?.error?.message || "Ocurrio un error al comunicarse con el servidor";
    throw new Error(mensaje);
  }

  return datos;
}

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

  const respuesta = await fetch(`${API_BASE}/api/productos?${params.toString()}`);
  return manejarRespuesta(respuesta);
}

/**
 * Detalle completo de un producto con datos del vendedor (RF78/RF79).
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, data: object }>}
 */
export async function obtenerProducto(id) {
  const respuesta = await fetch(`${API_BASE}/api/productos/${id}`);
  return manejarRespuesta(respuesta);
}

/**
 * Valida en el backend el stock real para una cantidad antes de agregar al carrito (RF86).
 * @param {number|string} id
 * @param {number} cantidad
 * @returns {Promise<{ success: boolean, data: { valido: boolean, stock_disponible: number, estado: string, mensaje: string } }>}
 */
export async function validarStockProducto(id, cantidad) {
  const respuesta = await fetch(
    `${API_BASE}/api/productos/${id}/validar-stock?cantidad=${cantidad}`
  );
  return manejarRespuesta(respuesta);
}
