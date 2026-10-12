import { round2 } from "../../utils/finanzas.js";
import { importeReembolsoLinea, reembolsarPago } from "../../utils/reembolsos.js";

/**
 * Destino de los pedidos de un vendedor al ser baneado (B-R5/RF74).
 * Ejecuta dentro de la transaccion del llamador (FOR UPDATE asegura atomicidad):
 *  - Lineas 'Pendiente' -> se cancelan, se restituye el stock y se acumula su
 *    reembolso (IVA incluido) en pagos_simulados.monto_reembolsado (A-3/M-1),
 *    aunque queden lineas activas en el pedido.
 *  - Lineas 'En camino' -> NO se auto-desembolsan: quedan en revision del
 *    administrador (DEC-004/M-1), contadas en `enRevision`.
 *  - El estado del pago lo deriva la regla por monto de utils/reembolsos.js
 *    ('Reembolsado' solo si el acumulado cubre el monto) y se notifica al
 *    comprador (fail-soft).
 * @param {import("mysql2/promise").PoolConnection} conn conexion en transaccion
 * @param {number} vendedorId
 * @returns {Promise<{cancelados: number, enRevision: number}>}
 */
export const destinoPedidosVendedor = async (conn, vendedorId) => {
  const id = Number(vendedorId);
  if (!Number.isInteger(id) || id <= 0) throw new Error("vendedorId inválido");

  const [rows] = await conn.query(
    `SELECT dp.id, dp.producto_id, dp.cantidad, dp.estado_envio, dp.pedido_id,
            dp.subtotal, prod.stock AS stock_actual
       FROM detalle_pedidos dp
       JOIN pedidos pe ON pe.id = dp.pedido_id
       JOIN productos prod ON prod.id = dp.producto_id
      WHERE dp.vendedor_id = ?
        AND dp.estado_envio IN ('Pendiente', 'En camino')
        FOR UPDATE`,
    [id]
  );

  let cancelados = 0;
  let enRevision = 0;
  const reembolsosPorPedido = new Map();

  for (const dp of rows) {
    if (dp.estado_envio === "En camino") {
      // DEC-004/M-1: el admin decide el destino; el sistema no desembolsa solo.
      enRevision++;
      continue;
    }
    await conn.query(
      "UPDATE detalle_pedidos SET estado_envio = 'Cancelado' WHERE id = ?",
      [dp.id]
    );
    await conn.query(
      "UPDATE productos SET stock = stock + ? WHERE id = ?",
      [dp.cantidad, dp.producto_id]
    );
    cancelados++;
    const acumulado = reembolsosPorPedido.get(dp.pedido_id) || 0;
    reembolsosPorPedido.set(
      dp.pedido_id,
      round2(acumulado + importeReembolsoLinea(dp.subtotal))
    );
  }

  // A-3/M-1: el reembolso se registra por linea cancelada aunque queden lineas
  // activas. La guarda de estado ('Aprobado'/'Reembolsado') y la regla por
  // monto viven en utils/reembolsos.js (misma ruta que RF35/RF135).
  for (const [pedidoId, importe] of reembolsosPorPedido) {
    const [pedido] = await conn.query(
      "SELECT comprador_id FROM pedidos WHERE id = ?",
      [pedidoId]
    );
    await reembolsarPago(conn, pedidoId, importe);

    // RF101/RF103: notificar al comprador del reembolso (fail-soft).
    try {
      const compradorId = pedido[0]?.comprador_id;
      if (compradorId) {
        await conn.query(
          `INSERT INTO notificaciones (usuario_id, tipo, descripcion, url_redireccion, estado)
           VALUES (?, ?, ?, ?, ?)`,
          [
            compradorId,
            "reembolso",
            `Pedido #${pedidoId}: una venta fue cancelada por el administrador y su importe fue reembolsado.`,
            "/history",
            "no leido",
          ]
        );
      }
    } catch {
      // no romper la transaccion del baneo por una notificacion
    }
  }

  return { cancelados, enRevision };
};
