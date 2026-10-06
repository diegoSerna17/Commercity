import { request } from "../api/client.js";

/**
 * Consulta el carrito del comprador agrupado por vendedor (RF103, RF109).
 * H1 (P0): el comprador se deriva del JWT; no se envia comprador_id.
 * @param {number} [_compradorId] Obsoleto (se ignora, compatibilidad).
 */
export const listarCarrito = (_compradorId) =>
  request(`/api/carrito`);

/**
 * Agrega un producto al carrito (upsert por comprador y producto).
 * Contrato real: POST /api/carrito { producto_id, cantidad }
 */
export const agregarProducto = (_compradorId, productoId, cantidad = 1) =>
  request("/api/carrito", {
    method: "POST",
    body: { producto_id: productoId, cantidad },
  });

/**
 * Modifica la cantidad de un producto del carrito.
 * Contrato real: PATCH /api/carrito/:productoId { cantidad }
 */
export const modificarCantidad = (_compradorId, productoId, cantidad) =>
  request(
    `/api/carrito/${productoId}`,
    { method: "PATCH", body: { cantidad } }
  );

/**
 * Elimina un producto del carrito.
 * Contrato real: DELETE /api/carrito/:productoId
 */
export const eliminarProducto = (_compradorId, productoId) =>
  request(
    `/api/carrito/${productoId}`,
    { method: "DELETE" }
  );
