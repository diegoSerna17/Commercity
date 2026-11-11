import { successResponse, errorResponse } from "../utils/response.js";
import {
  obtenerResumenCarrito,
  confirmarPago as confirmarPagoServicio,
  actualizarEstadoPedido,
} from "../services/pedidos.service.js";

// ============================================================================
// MODULO DE PEDIDOS Y PAGO (integrado desde AVANCES/SPRING 1/CARLOS VIDAL/Entrega)
// Fixes aplicados en la integracion (informe v1.0):
//   3.2: sin pedidos.estado_pedido (RF119: estados por linea estado_envio).
//   3.4: rutas protegidas con authRequired; comprador/vendedor salen del token.
//   3.5: INSERT a detalle_pedidos sin columnas GENERATED ni imagen_url.
//   3.6: RF134 ACID - crear pedido + lineas + descontar stock + registrar pago
//        en UNA transaccion con FOR UPDATE.
//   3.8: RF74 - solo productos no suspendidos y vendedores activos.
//   3.10: el pago se aprueba solo tras validar la tarjeta (Luhn, RF118).
//   3.11: redondeo round2 en todos los montos.
// Desde 1.5.3 la logica transaccional vive en services/pedidos.service.js;
// aqui solo se valida (middleware), se llama al servicio y se responde.
// ============================================================================

// Contratos de entrada: confirmarPagoSchema, estadoSchema y paramsIdSchema
// (schemas/pedidos.schema.js) se aplican con validate() en pedidos.routes.js.

/**
 * GET /api/pedidos/resumen
 * Resumen del carrito agrupado por vendedor con desglose de IVA y 90/10 en
 * vuelo (RF113/RF114/RF117/RF134). Solo lectura, no muta nada.
 */
export const getResumenCarrito = async (req, res, next) => {
  try {
    const resumen = await obtenerResumenCarrito(req.userId);
    return successResponse(res, "Resumen del carrito", resumen);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/pedidos/confirmar-pago
 * RF134 (ACID sugerido por el Director): crea el pedido, las lineas de detalle,
 * descuenta el stock y registra el pago en UNA transaccion con FOR UPDATE.
 * RF118: si el metodo es tarjeta, valida Luhn antes de aprobar el pago.
 */
export const confirmarPago = async (req, res, next) => {
  try {
    // validate(confirmarPagoSchema) ya valido el body en la ruta.
    const resultado = await confirmarPagoServicio({
      compradorId: req.userId,
      data: req.body,
    });

    if (!resultado.ok) {
      return errorResponse(res, resultado.mensaje, resultado.status, resultado.details);
    }

    return successResponse(
      res,
      "Pago confirmado y pedido creado con éxito",
      resultado.data,
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/pedidos/:id/estado
 * DOS caminos dentro del mismo endpoint:
 *  - Camino 1 (Vendedor / RF122-RF124): estado = "En camino" | "Entregado"
 *    Avanza UN nivel las líneas del vendedor autenticado:
 *      Pendiente -> En camino -> Entregado.
 *  - Camino 2 (Comprador / RF35): estado = "Cancelado"
 *    Cancela líneas del pedido (restituye stock, marca líneas, actualiza pago,
 *    notifica). Dos sub-casos:
 *      · body.detalle_id  -> cancela SOLO esa línea.
 *      · sin detalle_id   -> cancela TODO el pedido (líneas no Entregado).
 */
export const actualizarEstado = async (req, res, next) => {
  try {
    // validate(paramsIdSchema, "params") + validate(estadoSchema) ya validaron.
    const { id } = req.params;
    const { estado, detalle_id } = req.body;

    const resultado = await actualizarEstadoPedido({
      pedidoId: id,
      estado,
      detalleId: detalle_id,
      usuarioId: req.userId,
    });

    if (!resultado.ok) {
      return errorResponse(res, resultado.mensaje, resultado.status);
    }

    return successResponse(res, resultado.mensaje, resultado.data);
  } catch (err) {
    next(err);
  }
};
