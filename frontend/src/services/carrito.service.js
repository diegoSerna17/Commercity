import { request } from "../api/client.js";

/**
 * Consulta el carrito del comprador agrupado por vendedor (RF103, RF109).
 * Contrato real: GET /api/carrito?comprador_id=<id>
 * @param {number} compradorId
 */
export const listarCarrito = (compradorId) =>
  request(`/api/carrito?comprador_id=${encodeURIComponent(compradorId)}`);

/**
 * Agrega un producto al carrito (upsert por comprador y producto).
 * Contrato real: POST /api/carrito { comprador_id, producto_id, cantidad }
 */
export const agregarProducto = (compradorId, productoId, cantidad = 1) =>
  request("/api/carrito", {
    method: "POST",
    body: { comprador_id: compradorId, producto_id: productoId, cantidad },
  });

/**
 * Modifica la cantidad de un producto del carrito.
 * Contrato real: PATCH /api/carrito/:productoId?comprador_id=<id> { cantidad }
 */
export const modificarCantidad = (compradorId, productoId, cantidad) =>
  request(
    `/api/carrito/${productoId}?comprador_id=${encodeURIComponent(compradorId)}`,
    { method: "PATCH", body: { cantidad } }
  );

/**
 * Elimina un producto del carrito.
 * Contrato real: DELETE /api/carrito/:productoId?comprador_id=<id>
 */
export const eliminarProducto = (compradorId, productoId) =>
  request(
    `/api/carrito/${productoId}?comprador_id=${encodeURIComponent(compradorId)}`,
    { method: "DELETE" }
  );
