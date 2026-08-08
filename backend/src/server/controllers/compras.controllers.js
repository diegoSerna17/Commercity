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
