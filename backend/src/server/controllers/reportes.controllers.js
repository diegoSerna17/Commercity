import pool from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { registrarAuditoria, ACCIONES } from "../utils/auditoria.js";
import { borrarArchivoSubido } from "../config/multer.js";

/**
 * Crea un reporte de producto o usuario (RF62/RF63, RF79, RF101).
 * El informante se toma del JWT (req.userId), nunca del body.
 * La evidencia es opcional (archivo multipart "evidencia").
 * El formato lo valida crearReporteSchema (validate()).
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export const crearReporte = async (req, res, next) => {
  try {
    const tipo = req.body.tipo;
    const motivo = req.body.motivo;
    const evidenciaUrl = req.file ? `/uploads/reportes/${req.file.filename}` : null;

    let productoId = req.body.producto_id ?? null;
    let usuarioReportadoId = req.body.usuario_reportado_id ?? null;

    if (tipo === "Producto") {
      const [producto] = await pool.query(
        "SELECT id FROM productos WHERE id = ?",
        [productoId]
      );
      if (producto.length === 0) {
        borrarArchivoSubido(req.file);
        return errorResponse(res, "Producto no encontrado", 404);
      }
    } else {
      if (usuarioReportadoId === req.userId) {
        borrarArchivoSubido(req.file);
        return errorResponse(res, "No puedes reportarte a ti mismo", 400);
      }
      const [usuario] = await pool.query(
        "SELECT id FROM usuarios WHERE id = ?",
        [usuarioReportadoId]
      );
      if (usuario.length === 0) {
        borrarArchivoSubido(req.file);
        return errorResponse(res, "Usuario no encontrado", 404);
      }
    }

    // M-14: deduplicar por (informante, objetivo, estado abierto): un usuario
    // no puede tener dos reportes Pendientes sobre el mismo producto/usuario.
    const [duplicado] = await pool.query(
      `SELECT id FROM reportes
        WHERE informante_id = ? AND estado_reporte = 'Pendiente' AND archivado = 0
          AND ${tipo === "Producto" ? "producto_id = ?" : "usuario_reportado_id = ?"}
        LIMIT 1`,
      [req.userId, tipo === "Producto" ? productoId : usuarioReportadoId]
    );
    if (duplicado.length > 0) {
      borrarArchivoSubido(req.file);
      return errorResponse(res, "Ya tienes un reporte abierto sobre este objetivo", 409);
    }

    const [result] = await pool.query(
      `INSERT INTO reportes
         (informante_id, tipo_reporte, producto_id, usuario_reportado_id, motivo, evidencia_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.userId, tipo, productoId, usuarioReportadoId, motivo, evidenciaUrl]
    );

    // M-11: auditoria del reporte creado (sin el texto del motivo).
    await registrarAuditoria({
      actorId: req.userId,
      accion: ACCIONES.REPORTE_CREADO,
      objetivoTipo: "reporte",
      objetivoId: result.insertId,
      detalle: { tipo, producto_id: productoId, usuario_reportado_id: usuarioReportadoId },
      ip: req.ip,
    });

    return successResponse(
      res,
      "Reporte creado correctamente",
      { id: result.insertId },
      201
    );
  } catch (err) {
    borrarArchivoSubido(req.file);
    next(err);
  }
};
