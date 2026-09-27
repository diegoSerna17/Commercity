import { request } from "../api/client.js";

/**
 * Historial de compras del comprador autenticado (RF26-RF32).
 * El backend agrupa las lineas por pedido y calcula IVA y totales en vuelo.
 * @param {string} [estado] Filtro opcional: "Pendiente" | "En camino" | "Entregado" | "Cancelado"
 */
export const listarHistorialCompras = (estado) =>
  request(
    `/api/historial/compras${estado ? `?estado=${encodeURIComponent(estado)}` : ""}`
  );

/**
 * Cancela una linea del pedido en estado Pendiente, restituye stock y marca el
 * pago como reembolsado (RF135). El id es el de la linea (detalle_id).
 * @param {number} detalleId
 */
export const cancelarCompra = (detalleId) =>
  request(`/api/historial/compras/${detalleId}/cancelar`, { method: "POST" });
