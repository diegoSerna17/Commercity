import pool from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { validarId } from "./admin/admin.utils.js";

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
    const tipo = normalizarTipo(
      typeof req.body.tipo === "string" ? req.body.tipo.trim() : ""
    );
    const motivo =
      typeof req.body.motivo === "string" ? req.body.motivo.trim() : "";
    const evidenciaUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!TIPOS_VALIDOS.includes(tipo)) {
      return errorResponse(
        res,
        "El tipo de reporte debe ser 'Producto' o 'Usuario'",
        400
      );
    }
    if (!motivo) return errorResponse(res, "El motivo es obligatorio", 400);
    if (motivo.length > 2000)
      return errorResponse(res, "El motivo es demasiado largo", 400);

    let productoId = null;
    let usuarioReportadoId = null;

    if (tipo === "Producto") {
      const id = Number(req.body.producto_id);
      if (!validarId(id))
        return errorResponse(res, "Debe indicar un producto valido", 400);
      const [producto] = await pool.query(
        "SELECT id FROM productos WHERE id = ?",
        [id]
      );
      if (producto.length === 0)
        return errorResponse(res, "Producto no encontrado", 404);
      productoId = id;
    } else {
      const id = Number(req.body.usuario_reportado_id);
      if (!validarId(id))
        return errorResponse(res, "Debe indicar un usuario valido", 400);
      if (id === req.userId)
        return errorResponse(res, "No puedes reportarte a ti mismo", 400);
      const [usuario] = await pool.query(
        "SELECT id FROM usuarios WHERE id = ?",
        [id]
      );
      if (usuario.length === 0)
        return errorResponse(res, "Usuario no encontrado", 404);
      usuarioReportadoId = id;
    }

    const [result] = await pool.query(
      `INSERT INTO reportes
         (informante_id, tipo_reporte, producto_id, usuario_reportado_id, motivo, evidencia_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.userId, tipo, productoId, usuarioReportadoId, motivo, evidenciaUrl]
    );

    return successResponse(
      res,
      "Reporte creado correctamente",
      { id: result.insertId },
      201
    );
  } catch (err) {
    next(err);
  }
};
