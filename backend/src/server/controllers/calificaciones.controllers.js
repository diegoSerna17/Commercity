import { z } from "zod";
import pool from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";

// ============================================================================
// MODULO DE CALIFICACIONES DE VENDEDORES (RF107 del documento 20/08)
// "El sistema permitira a los compradores calificar a los vendedores de 1 a 5
// estrellas despues de realizar una compra."
// Tabla real: calificaciones_vendedores (pedido_id UNIQUE -> una calificacion
// por pedido; estrellas CHECK 1-5; comprador_id, vendedor_id, comentario).
// ============================================================================

const calificacionSchema = z.object({
  pedido_id: z.number().int().positive(),
  vendedor_id: z.number().int().positive(),
  estrellas: z.number().int().min(1).max(5),
  comentario: z.string().trim().max(500).optional(),
});

/**
 * POST /api/calificaciones/vendedor
 * Registra la calificacion (1-5 estrellas) de un comprador hacia un vendedor
 * despues de realizar una compra (RF107).
 *
 * Validaciones:
 *  - El pedido debe existir y pertenecer al comprador autenticado.
 *  - Debe existir al menos una linea de compra hacia ese vendedor que no este
 *    cancelada (el RF exige "despues de realizar una compra").
 *  - Una sola calificacion por pedido (restriccion UNIQUE del esquema).
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export const calificarVendedor = async (req, res, next) => {
  try {
    const compradorId = req.userId;
    const parsed = calificacionSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Datos de la calificacion invalidos", 400, parsed.error.issues);
    }

    const { pedido_id, vendedor_id, estrellas, comentario } = parsed.data;

    // El pedido debe existir y pertenecer al comprador autenticado.
    const [pedidos] = await pool.query(
      "SELECT id, comprador_id FROM pedidos WHERE id = ?",
      [pedido_id]
    );
    if (pedidos.length === 0) {
      return errorResponse(res, "Pedido no encontrado", 404);
    }
    if (pedidos[0].comprador_id !== compradorId) {
      return errorResponse(res, "El pedido no pertenece al usuario autenticado", 403);
    }

    // Debe existir una linea de compra real hacia ese vendedor (no cancelada).
    const [lineas] = await pool.query(
      `SELECT id FROM detalle_pedidos
       WHERE pedido_id = ? AND vendedor_id = ? AND estado_envio <> 'Cancelado'
       LIMIT 1`,
      [pedido_id, vendedor_id]
    );
    if (lineas.length === 0) {
      return errorResponse(res, "No hay compra de este vendedor en el pedido indicado", 400);
    }

    // Una sola calificacion por pedido (UNIQUE uq_pedido_calificacion_vend).
    const [existentes] = await pool.query(
      "SELECT id FROM calificaciones_vendedores WHERE pedido_id = ?",
      [pedido_id]
    );
    if (existentes.length > 0) {
      return errorResponse(res, "Este pedido ya fue calificado", 400);
    }

    const [result] = await pool.query(
      `INSERT INTO calificaciones_vendedores
       (pedido_id, comprador_id, vendedor_id, estrellas, comentario)
       VALUES (?, ?, ?, ?, ?)`,
      [pedido_id, compradorId, vendedor_id, estrellas, comentario || null]
    );

    return successResponse(
      res,
      "Calificacion registrada correctamente.",
      {
        id: result.insertId,
        pedido_id,
        comprador_id: compradorId,
        vendedor_id,
        estrellas,
        comentario: comentario || null,
      },
      201
    );
  } catch (err) {
    next(err);
  }
};
