import pool from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { validarId } from "../utils/ids.js";
import { registrarAuditoria, ACCIONES } from "../utils/auditoria.js";
import { borrarArchivoSubido } from "../config/multer.js";

const TIPOS_VALIDOS = ["Producto", "Usuario"];

/**
 * Normaliza el tipo de reporte a la nomenclatura del ENUM de BD
 * ('Producto' | 'Usuario'), aceptando variantes de mayusculas/minusculas.
 * @param {string} tipo - valor recibido del cliente
 * @returns {string} valor normalizado
 */
const normalizarTipo = (tipo) =>
  tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();

/**
 * Crea un reporte de producto o usuario (RF62/RF63, RF79, RF101).
 * El informante se toma del JWT (req.userId), nunca del body.
 * La evidencia es opcional (archivo multipart "evidencia").
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export const crearReporte = async (req, res, next) => {
  try {
    // B-8: un POST sin cuerpo llegaba como req.body undefined y daba 500 en
    // vez de 400; se coalesce a {} y las validaciones responden 400.
    const body = req.body ?? {};
    const tipo = normalizarTipo(
      typeof body.tipo === "string" ? body.tipo.trim() : ""
    );
    const motivo =
      typeof body.motivo === "string" ? body.motivo.trim() : "";
    const evidenciaUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!TIPOS_VALIDOS.includes(tipo)) {
      // TASK-4.6: sin reporte, la evidencia subida no debe quedar huerfana.
      borrarArchivoSubido(req.file);
      return errorResponse(
        res,
        "El tipo de reporte debe ser 'Producto' o 'Usuario'",
        400
      );
    }
    if (!motivo) {
      borrarArchivoSubido(req.file);
      return errorResponse(res, "El motivo es obligatorio", 400);
    }
    if (motivo.length > 2000) {
      borrarArchivoSubido(req.file);
      return errorResponse(res, "El motivo es demasiado largo", 400);
    }

    let productoId = null;
    let usuarioReportadoId = null;

    if (tipo === "Producto") {
      const id = Number(body.producto_id);
      if (!validarId(id)) {
        borrarArchivoSubido(req.file);
        return errorResponse(res, "Debe indicar un producto valido", 400);
      }
      const [producto] = await pool.query(
        "SELECT id FROM productos WHERE id = ?",
        [id]
      );
      if (producto.length === 0) {
        borrarArchivoSubido(req.file);
        return errorResponse(res, "Producto no encontrado", 404);
      }
      productoId = id;
    } else {
      const id = Number(body.usuario_reportado_id);
      if (!validarId(id)) {
        borrarArchivoSubido(req.file);
        return errorResponse(res, "Debe indicar un usuario valido", 400);
      }
      if (id === req.userId) {
        borrarArchivoSubido(req.file);
        return errorResponse(res, "No puedes reportarte a ti mismo", 400);
      }
      const [usuario] = await pool.query(
        "SELECT id FROM usuarios WHERE id = ?",
        [id]
      );
      if (usuario.length === 0) {
        borrarArchivoSubido(req.file);
        return errorResponse(res, "Usuario no encontrado", 404);
      }
      usuarioReportadoId = id;
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
