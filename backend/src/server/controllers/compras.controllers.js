import pool from "../config/db.js";

/**
 * Historial de compras del comprador autenticado.
 * Requiere authRequired (req.userId viene del token JWT).
 * Filtro opcional por estado: ?estado=Pendiente|En camino|Entregado
 */
export const getHistorialComprasComprador = async (req, res) => {
    const compradorId = req.userId;
    const { estado } = req.query;

    let query = `
        SELECT
            p.id AS pedido_id,
            p.fecha_pedido AS fecha,
            dp.estado_envio AS estado,
            dp.cantidad AS cantidad,
            dp.subtotal AS monto,
            prod.nombre AS producto,
            prod.imagen_url AS imagen,
            v.nombre_completo AS vendedor
        FROM pedidos p
        JOIN detalle_pedidos dp ON p.id = dp.pedido_id
        JOIN productos prod ON dp.producto_id = prod.id
        JOIN usuarios v ON dp.vendedor_id = v.id
        WHERE p.comprador_id = ?
    `;

    const params = [compradorId];

    // Filtro por estado. El ENUM de la BD usa mayusculas: 'Pendiente', 'En camino', 'Entregado'
    const estadosValidos = ["Pendiente", "En camino", "Entregado"];
    if (estado && estadosValidos.includes(estado)) {
        query += ` AND dp.estado_envio = ?`;
        params.push(estado);
    }

    query += ` ORDER BY p.fecha_pedido DESC;`;

    try {
        const [rows] = await pool.query(query, params);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error al obtener el historial de compras:", error.message);
        return res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Error al obtener el historial" }
        });
    }
};

/**
 * RF135: el comprador cancela un pedido en estado Pendiente.
 * Transaccion ACID: cancela la linea, restituye el stock al producto y marca el
 * pago como Reembolsado (M8). Solo el dueno del pedido y solo en estado Pendiente.
 */
export const cancelarPedidoComprador = async (req, res) => {
    const compradorId = req.userId;
    const detalleId = Number(req.params.id);

    if (!Number.isInteger(detalleId) || detalleId <= 0) {
        return res.status(400).json({
            success: false,
            error: { code: "VALIDATION_ERROR", message: "ID inválido" }
        });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Bloquear la linea y validar propietario + estado Pendiente.
        // comprador_id vive en pedidos, no en detalle_pedidos (fix RF135).
        const [lineas] = await conn.query(
            `SELECT dp.id, dp.producto_id, dp.cantidad, dp.pedido_id
               FROM detalle_pedidos dp
               JOIN pedidos p ON p.id = dp.pedido_id
              WHERE dp.id = ? AND p.comprador_id = ? AND dp.estado_envio = 'Pendiente'
              FOR UPDATE`,
            [detalleId, compradorId]
        );
        if (lineas.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Pedido no encontrado o no cancelable" }
            });
        }

        const linea = lineas[0];

        // 2. Cancelar la linea
        await conn.query(
            "UPDATE detalle_pedidos SET estado_envio = 'Cancelado' WHERE id = ?",
            [detalleId]
        );
        // 3. Restituir stock al producto
        await conn.query(
            "UPDATE productos SET stock = stock + ? WHERE id = ?",
            [linea.cantidad, linea.producto_id]
        );
        // 4. Marcar el pago como Reembolsado (M8)
        await conn.query(
            "UPDATE pagos_simulados SET estado = 'Reembolsado' WHERE pedido_id = ?",
            [linea.pedido_id]
        );

        await conn.commit();
        return res.status(200).json({
            success: true,
            data: { id: detalleId, estado: "Cancelado", reembolsado: true }
        });
    } catch (error) {
        await conn.rollback();
        console.error("Error al cancelar el pedido:", error.message);
        return res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Error al cancelar el pedido" }
        });
    } finally {
        conn.release();
    }
};
