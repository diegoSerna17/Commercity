import { request } from "../api/client.js";

/**
 * Resumen del carrito del comprador autenticado con desglose de IVA 19%
 * (RF113/RF114). Requiere JWT: el backend toma el comprador del token.
 * Contrato real: GET /api/pedidos/resumen -> data { por_vendedor, totales }
 * donde totales = { subtotal, iva, total }.
 */
export const obtenerResumenPedido = () => request("/api/pedidos/resumen");

/**
 * Confirma el pago y crea el pedido en una sola transaccion (RF134).
 * Contrato real: POST /api/pedidos/confirmar-pago
 * body { direccion_envio, metodo_pago, tarjeta_ultimos4?, tarjeta_marca?, nombre_tarjeta? }
 * M-28: la pasarela es simulada; nunca se envia el numero completo de la tarjeta.
 * @param {{ direccion_envio: string, metodo_pago: "tarjeta"|"transferencia"|"pse", tarjeta_ultimos4?: string, tarjeta_marca?: string, nombre_tarjeta?: string }} datos
 */
export const confirmarPago = (datos) =>
  request("/api/pedidos/confirmar-pago", { method: "POST", body: datos });
