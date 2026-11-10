import pool from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";

// ============================================================================
// MODULO DE CALIFICACIONES DE VENDEDORES (RF107 del documento 20/08)
// "El sistema permitira a los compradores calificar a los vendedores de 1 a 5
// estrellas despues de realizar una compra."
// Tabla real: calificaciones_vendedores (UNIQUE (pedido_id, vendedor_id) ->
// una calificacion por vendedor y pedido; estrellas CHECK 1-5; comprador_id,
// vendedor_id, comentario).
// Contrato de entrada: calificacionSchema (schemas/calificaciones.schema.js).

/**
 * POST /api/calificaciones/vendedor
 * Registra la calificacion (1-5 estrellas) de un comprador hacia un vendedor
 * despues de realizar una compra (RF107).
 *
 * Validaciones:
 *  - El pedido debe existir y pertenecer al comprador autenticado.
 *  - Debe existir al menos una linea de compra hacia ese vendedor que no este
 *    cancelada (el RF exige "despues de realizar una compra").
 *  - Una sola calificacion por vendedor dentro del pedido (UNIQUE
 *    (pedido_id, vendedor_id) del esquema); un pedido multi-vendedor permite
 *    calificar a cada vendedor una vez.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export const calificarVendedor = async (req, res, next) => {
  try {
    const compradorId = req.userId;
    // El body ya viene validado por validate(calificacionSchema) en la ruta.
    const { pedido_id, vendedor_id, estrellas, comentario } = req.body;

    // M-5: un usuario no puede calificarse a si mismo.
    if (Number(vendedor_id) === Number(compradorId)) {
      return errorResponse(res, "No puedes calificarte a ti mismo", 400);
    }

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

    // M-5: solo se califica una compra ya ENTREGADA de ese vendedor (el RF
    // exige "despues de realizar una compra"; una linea Pendiente/En camino no
    // lo es todavia).
    const [lineas] = await pool.query(
      `SELECT id FROM detalle_pedidos
       WHERE pedido_id = ? AND vendedor_id = ? AND estado_envio = 'Entregado'
       LIMIT 1`,
      [pedido_id, vendedor_id]
    );
    if (lineas.length === 0) {
      return errorResponse(res, "Solo puedes calificar a un vendedor con una compra 'Entregado' en este pedido", 400);
    }

    // Una sola calificacion por VENDEDOR dentro del pedido
    // (UNIQUE (pedido_id, vendedor_id), mig 018). Un pedido multi-vendedor
    // permite calificar a cada vendedor por separado.
    const [existentes] = await pool.query(
      "SELECT id FROM calificaciones_vendedores WHERE pedido_id = ? AND vendedor_id = ?",
      [pedido_id, vendedor_id]
    );
    if (existentes.length > 0) {
      return errorResponse(res, "Este pedido ya fue calificado", 409);
    }

    let result;
    try {
      [result] = await pool.query(
        `INSERT INTO calificaciones_vendedores
         (pedido_id, comprador_id, vendedor_id, estrellas, comentario)
         VALUES (?, ?, ?, ?, ?)`,
        [pedido_id, compradorId, vendedor_id, estrellas, comentario || null]
      );
    } catch (error) {
      // M-5: la carrera entre dos calificaciones del mismo pedido choca con el
      // UNIQUE y MySQL responde ER_DUP_ENTRY; es un 409, no un 500.
      if (error?.code === "ER_DUP_ENTRY") {
        return errorResponse(res, "Este pedido ya fue calificado", 409);
      }
      throw error;
    }

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

/**
 * GET /api/calificaciones/vendedor/:id (RF51)
 * Calificaciones recibidas por un vendedor, con promedio y paginacion.
 * Publico con datos minimos del comprador (solo primer nombre).
 */
export const listarCalificacionesVendedor = async (req, res, next) => {
  try {
    const vendedorId = Number(req.params.id);
    const { page: pagina, limit: limite } = req.query;
    const offset = (pagina - 1) * limite;

    // RF51: el perfil solo existe si el id pertenece a un vendedor.
    const [vendedor] = await pool.query(
      `SELECT u.id
         FROM usuarios u
         INNER JOIN usuario_roles ur ON ur.usuario_id = u.id
         INNER JOIN roles r ON r.id = ur.rol_id
        WHERE u.id = ? AND r.nombre = 'vendedor'
        LIMIT 1`,
      [vendedorId]
    );
    if (vendedor.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Vendedor no encontrado" },
      });
    }

    // Resumen y total en una sola consulta.
    const [[resumen]] = await pool.query(
      `SELECT COUNT(*) AS total, AVG(estrellas) AS promedio
         FROM calificaciones_vendedores
        WHERE vendedor_id = ?`,
      [vendedorId]
    );
    const total = Number(resumen?.total || 0);
    const promedio = resumen?.promedio;

    const [filas] = await pool.query(
      `SELECT c.id, c.estrellas, c.comentario, c.fecha_calificacion,
              SUBSTRING_INDEX(COALESCE(u.nombre_completo, 'Comprador'), ' ', 1) AS comprador
         FROM calificaciones_vendedores c
         LEFT JOIN usuarios u ON u.id = c.comprador_id
        WHERE c.vendedor_id = ?
        ORDER BY c.id DESC
        LIMIT ? OFFSET ?`,
      [vendedorId, limite, offset]
    );

    return res.status(200).json({
      success: true,
      message: "Calificaciones del vendedor",
      data: {
        resumen: {
          promedio: promedio != null ? Number(Number(promedio).toFixed(1)) : null,
          total,
        },
        calificaciones: filas,
      },
      paginacion: {
        pagina,
        por_pagina: limite,
        total,
        total_paginas: Math.max(1, Math.ceil(total / limite)),
      },
    });
  } catch (err) {
    next(err);
  }
};
