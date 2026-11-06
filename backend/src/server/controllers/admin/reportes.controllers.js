import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";
import { escapeLike, mapearReporte, QUERY_REPORTES } from "./admin.utils.js";
import { registrarAuditoria, ACCIONES } from "../../utils/auditoria.js";

export const getReportes = async (req, res, next) => {
  try {
    const { pagina, por_pagina: porPagina } = req.query;
    const q = req.query.q ? escapeLike(req.query.q) : null;
    const estado = req.query.estado;

    // A2 (P2): borrado logico. Por defecto se excluyen archivados (mig 011);
    // ?incluir_archivados=1 los incluye (moderacion).
    const incluirArchivados = ["1", "true", "si", "sí"].includes(
      String(req.query.incluir_archivados || "").toLowerCase()
    );

    const condiciones = [];
    const params = [];
    if (!incluirArchivados) {
      condiciones.push("r.archivado = 0");
    }
    if (estado) {
      condiciones.push("r.estado_reporte = ?");
      params.push(estado === "resuelto" ? "Resuelto" : "Pendiente");
    }
    if (q) {
      condiciones.push(
        "(COALESCE(p.nombre, ru.nombre_completo) LIKE ? OR i.nombre_completo LIKE ? OR r.tipo_reporte LIKE ?)"
      );
      params.push(q, q, q);
    }
    const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
    const offset = (pagina - 1) * porPagina;

    const [[totalRow]] = await pool.query(
      `SELECT COUNT(*) AS total FROM (${QUERY_REPORTES} ${where}) AS reportes_filtrados`,
      params
    );
    const total = Number(totalRow?.total || 0);

    const [rows] = await pool.query(
      `${QUERY_REPORTES} ${where} ORDER BY r.fecha_reporte DESC LIMIT ? OFFSET ?`,
      [...params, porPagina, offset]
    );

    return res.status(200).json({
      success: true,
      message: "Lista de reportes",
      data: rows.map(mapearReporte),
      paginacion: {
        pagina,
        por_pagina: porPagina,
        total,
        total_paginas: Math.max(1, Math.ceil(total / porPagina)),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getReporte = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const [rows] = await pool.query(`${QUERY_REPORTES} WHERE r.id = ?`, [id]);
    if (rows.length === 0) return errorResponse(res, "Reporte no encontrado", 404);
    return successResponse(res, "Reporte obtenido", mapearReporte(rows[0]));
  } catch (err) {
    next(err);
  }
};

// Fix 4.2: el reporte es historial de moderacion; se ARCHIVA, nunca se borra
// fisicamente. Requiere la columna archivado (migracion 011).
export const eliminarReporte = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const [result] = await pool.query(
      "UPDATE reportes SET archivado = 1 WHERE id = ? AND archivado = 0",
      [id]
    );
    if (result.affectedRows === 0)
      return errorResponse(res, "Reporte no encontrado", 404);
    // M-11: auditoria del archivado (moderacion).
    await registrarAuditoria({
      actorId: req.userId,
      accion: ACCIONES.REPORTE_ARCHIVADO,
      objetivoTipo: "reporte",
      objetivoId: id,
      ip: req.ip,
    });
    return successResponse(res, "Reporte archivado", { id, estado: "archivado" });
  } catch (err) {
    next(err);
  }
};

export const resolverReporte = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    // Body validado por resolverReporteSchema (validate()).
    const { respuesta } = req.body;

    const [result] = await pool.query(
      `UPDATE reportes SET estado_reporte = 'Resuelto', respuesta_admin = ?, respondido_at = NOW()
        WHERE id = ? AND estado_reporte = 'Pendiente'`,
      [respuesta, id]
    );
    if (result.affectedRows === 0)
      return errorResponse(res, "Reporte no encontrado o ya resuelto", 404);
    // M-11: auditoria de la resolucion (sin el texto de la respuesta).
    await registrarAuditoria({
      actorId: req.userId,
      accion: ACCIONES.REPORTE_RESUELTO,
      objetivoTipo: "reporte",
      objetivoId: id,
      detalle: { largo_respuesta: respuesta.length },
      ip: req.ip,
    });
    return successResponse(res, "Reporte resuelto", { id, estado: "resuelto" });
  } catch (err) {
    next(err);
  }
};
