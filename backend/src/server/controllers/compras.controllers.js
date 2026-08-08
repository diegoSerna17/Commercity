import pool from "../config/db.js";
import { round2 } from "../utils/finanzas.js";

// ============================================================================
// MODULO HISTORIAL DE COMPRAS (integrado desde AVANCES/SPRING 1/JARY)
// RF26-RF32 completados por el lider (2026-08-08):
//   - RF31: direccion de envio, IVA 19% en vuelo, precio unitario, total por
//           linea/pedido e imagen (ahora se devuelven todos los campos).
//   - RF32: los pedidos se agrupan por cabecera con resumen (subtotal, IVA,
//           total) y el detalle de sus items.
//   - RF28/RF30: el estado es por linea (detalle_pedidos.estado_envio); el
//           filtro ?estado= sigue funcionando sobre el ENUM oficial.
// ============================================================================

const IVA_RATE = 0.19;

/** Estado textual por linea (RF29). */
const NORMALIZAR_ESTADO = (e) => (e === "Cancelado" ? "Cancelado" : e || "Pendiente");

/**
 * Historial de compras del comprador autenticado (RF26-RF32).
 * Agrupa las lineas por pedido (RF32) y expone todos los campos del RF31:
 * vendedor, productos, direccion, fecha, estado por linea, cantidad, precio
 * unitario, IVA 19%, total e imagen.
 * Filtro opcional: ?estado=Pendiente|En camino|Entregado|Cancelado (RF30).
 */
export const getHistorialComprasComprador = async (req, res) => {
    const compradorId = req.userId;
    const { estado } = req.query;

    let query = `
        SELECT
            p.id AS pedido_id,
            p.fecha_pedido AS fecha,
            p.direccion_envio AS direccion,
            dp.id AS detalle_id,
            dp.estado_envio AS estado,
            dp.cantidad AS cantidad,
            dp.precio_unitario_historico AS precio_unitario,
            dp.descuento_aplicado AS descuento_aplicado,
            dp.subtotal AS subtotal,
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

    // Filtro por estado (RF30). El ENUM de la BD usa: 'Pendiente', 'En camino', 'Entregado'
    const estadosValidos = ["Pendiente", "En camino", "Entregado", "Cancelado"];
    if (estado && estadosValidos.includes(estado)) {
        query += ` AND dp.estado_envio = ?`;
        params.push(estado);
    }

    query += ` ORDER BY p.fecha_pedido DESC, dp.id ASC;`;

    try {
        const [rows] = await pool.query(query, params);

        // RF32: agrupar lineas por pedido y calcular IVA/totales en vuelo (RF31).
        const pedidosMap = new Map();
        for (const r of rows) {
            const subtotalLinea = Number(r.subtotal || 0);
            const ivaLinea = round2(subtotalLinea * IVA_RATE);
            const totalLinea = round2(subtotalLinea + ivaLinea);
            const precioUnitario = Number(r.precio_unitario || 0);
            const descuento = Number(r.descuento_aplicado || 0);
            const cantidad = Number(r.cantidad || 0);

            if (!pedidosMap.has(r.pedido_id)) {
                pedidosMap.set(r.pedido_id, {
                    pedido_id: r.pedido_id,
                    fecha: r.fecha,
                    direccion: r.direccion,
                    vendedores: new Set(),
                    items: [],
                    resumen: { subtotal: 0, iva: 0, total: 0 },
                });
            }
            const pedido = pedidosMap.get(r.pedido_id);
            pedido.vendedores.add(r.vendedor);

            pedido.items.push({
                detalle_id: r.detalle_id,
                producto: r.producto,
                imagen: r.imagen,
                vendedor: r.vendedor,
                estado: NORMALIZAR_ESTADO(r.estado),
                cantidad,
                precio_unitario: precioUnitario,
                descuento_aplicado: descuento,
                subtotal: subtotalLinea,
                iva: ivaLinea,
                total: totalLinea,
            });
            pedido.resumen.subtotal = round2(pedido.resumen.subtotal + subtotalLinea);
            pedido.resumen.iva = round2(pedido.resumen.iva + ivaLinea);
            pedido.resumen.total = round2(pedido.resumen.total + totalLinea);
        }

        // Serializar: estado del pedido = estado predominante de sus lineas.
        const pedidos = Array.from(pedidosMap.values()).map((p) => ({
            ...p,
            vendedores: Array.from(p.vendedores),
            estado: estadoPredominante(p.items),
            resumen: {
                subtotal: p.resumen.subtotal,
                iva: p.resumen.iva,
                total: p.resumen.total,
            },
        }));

        return res.status(200).json({ success: true, data: pedidos });
    } catch (error) {
        console.error("Error al obtener el historial de compras:", error.message);
        return res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Error al obtener el historial" }
        });
    }
};

/**
 * Devuelve el estado que domina las lineas de un pedido (RF28/RF29).
 * Si conviven varios estados, se prioriza el menos avanzado (Pendiente).
 * @param {Array<{estado: string}>} items
 * @returns {string}
 */
function estadoPredominante(items) {
    if (items.length === 0) return "Pendiente";
    const prioridad = { Cancelado: 0, Pendiente: 1, "En camino": 2, Entregado: 3 };
    return items.reduce((acc, i) =>
        prioridad[i.estado] < prioridad[acc] ? i.estado : acc, items[0].estado
    );
}

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
