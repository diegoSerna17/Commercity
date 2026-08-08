import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";
import { validarId, escapeLike, mapearReporte, QUERY_REPORTES } from "./admin.utils.js";

export const getReportes = async (req, res, next) => {
  try {
    const q = req.query.q ? escapeLike(String(req.query.q).trim()) : null;
    const estado = req.query.estado;
    if (estado && !["pendiente", "resuelto"].includes(estado))
      return errorResponse(res, "Filtro de estado inválido (pendiente|resuelto)", 400);

    const condiciones = [];
    const params = [];
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
    const [rows] = await pool.query(
      `${QUERY_REPORTES} ${
        condiciones.length ? "WHERE " + condiciones.join(" AND ") : ""
      } ORDER BY r.fecha_reporte DESC`,
      params
    );
    return successResponse(res, "Lista de reportes", rows.map(mapearReporte));
  } catch (err) {
    next(err);
  }
};

export const getReporte = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!validarId(id)) return errorResponse(res, "ID inválido", 400);

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
    if (!validarId(id)) return errorResponse(res, "ID inválido", 400);

    const [result] = await pool.query(
      "UPDATE reportes SET archivado = 1 WHERE id = ? AND archivado = 0",
      [id]
    );
    if (result.affectedRows === 0)
      return errorResponse(res, "Reporte no encontrado", 404);
    return successResponse(res, "Reporte archivado", { id, estado: "archivado" });
  } catch (err) {
    next(err);
  }
};

export const resolverReporte = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const respuesta =
      typeof req.body.respuesta === "string" ? req.body.respuesta.trim() : "";
    if (!validarId(id)) return errorResponse(res, "ID inválido", 400);
    if (!respuesta) return errorResponse(res, "La respuesta es obligatoria", 400);
    if (respuesta.length > 2000)
      return errorResponse(res, "Respuesta demasiado larga", 400);

    const [result] = await pool.query(
      `UPDATE reportes SET estado_reporte = 'Resuelto', respuesta_admin = ?, respondido_at = NOW()
        WHERE id = ? AND estado_reporte = 'Pendiente'`,
      [respuesta, id]
    );
    if (result.affectedRows === 0)
      return errorResponse(res, "Reporte no encontrado o ya resuelto", 404);
    return successResponse(res, "Reporte resuelto", { id, estado: "resuelto" });
  } catch (err) {
    next(err);
  }
};
