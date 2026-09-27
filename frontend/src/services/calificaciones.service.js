import { request } from "../api/client.js";

// Calificaciones de vendedores (RF107).

/**
 * Califica a un vendedor de 1 a 5 estrellas (RF107).
 * Contrato real: POST /api/calificaciones/vendedor
 * body { pedido_id, vendedor_id, estrellas, comentario? }
 * - pedido_id: pedido del comprador autenticado (obligatorio; el RF exige
 *   calificar despues de realizar una compra).
 * - vendedor_id: vendedor calificado.
 * - estrellas: entero entre 1 y 5.
 * - comentario: opcional, maximo 500 caracteres.
 * El backend valida que el pedido exista y pertenezca al comprador, que tenga
 * una linea no cancelada hacia ese vendedor y que el pedido no este ya
 * calificado (una calificacion por pedido).
 * @param {{ pedido_id: number, vendedor_id: number, estrellas: number, comentario?: string }} datos
 * @returns {Promise<{success: boolean, data: object}>}
 */
export const calificarVendedor = (datos) =>
  request("/api/calificaciones/vendedor", { method: "POST", body: datos });
