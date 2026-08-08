/**
 * Destino de los pedidos de un vendedor al ser baneado (B-R5/RF74).
 * Ejecuta dentro de la transaccion del llamador (FOR UPDATE asegura atomicidad):
 *  - Lineas 'Pendiente' -> se cancelan y se restituye el stock.
 *  - Lineas 'En camino' -> se completan y se desembolsa al vendedor.
 *  - Si un pedido queda con TODAS sus lineas canceladas, el pago se marca
 *    'Reembolsado' (RF74).
 * @param {import("mysql2/promise").PoolConnection} conn conexion en transaccion
 * @param {number} vendedorId
 */
export const destinoPedidosVendedor = async (conn, vendedorId) => {
  const id = Number(vendedorId);
  if (!Number.isInteger(id) || id <= 0) throw new Error("vendedorId inválido");

  const [rows] = await conn.query(
    `SELECT dp.id, dp.producto_id, dp.cantidad, dp.estado_envio, dp.pedido_id,
            prod.stock AS stock_actual
       FROM detalle_pedidos dp
       JOIN pedidos pe ON pe.id = dp.pedido_id
       JOIN productos prod ON prod.id = dp.producto_id
      WHERE dp.vendedor_id = ?
        AND dp.estado_envio IN ('Pendiente', 'En camino')
        FOR UPDATE`,
    [id]
  );

  let cancelados = 0;
  let completados = 0;
  const pedidosAfectados = new Set();

  for (const dp of rows) {
    if (dp.estado_envio === "Pendiente") {
      await conn.query(
        "UPDATE detalle_pedidos SET estado_envio = 'Cancelado' WHERE id = ?",
        [dp.id]
      );
      await conn.query(
        "UPDATE productos SET stock = stock + ? WHERE id = ?",
        [dp.cantidad, dp.producto_id]
      );
      cancelados++;
      pedidosAfectados.add(dp.pedido_id);
    } else {
      await conn.query(
        `UPDATE detalle_pedidos
            SET estado_envio = 'Entregado',
                estado_pago_vendedor = 'Desembolsado',
                fecha_desembolso = NOW()
          WHERE id = ?`,
        [dp.id]
      );
      completados++;
    }
  }

  // RF74: reembolsar el pago si el pedido quedo sin lineas activas.
  for (const pedidoId of pedidosAfectados) {
    const [restantes] = await conn.query(
      "SELECT COUNT(*) AS total FROM detalle_pedidos WHERE pedido_id = ? AND estado_envio <> 'Cancelado'",
      [pedidoId]
    );
    if (Number(restantes[0]?.total || 0) === 0) {
      await conn.query(
        "UPDATE pagos_simulados SET estado = 'Reembolsado' WHERE pedido_id = ?",
        [pedidoId]
      );
    }
  }

  return { cancelados, completados };
};
