import { successResponse, errorResponse } from "../../utils/response.js";
import {
  listarReportes as listarReportesAdmin,
  obtenerReporte as obtenerReporteAdmin,
  archivarReporte,
  resolverReporte as resolverReporteAdmin,
} from "../../services/admin.service.js";

export const getReportes = async (req, res, next) => {
  try {
    const { pagina, por_pagina: porPagina } = req.query;

    // A2 (P2): borrado logico. Por defecto se excluyen archivados (mig 011);
    // ?incluir_archivados=1 los incluye (moderacion).
    const incluirArchivados = ["1", "true", "si", "sí"].includes(
      String(req.query.incluir_archivados || "").toLowerCase()
    );

    const { reportes, total } = await listarReportesAdmin({
      pagina,
      porPagina,
      q: req.query.q,
      estado: req.query.estado,
      incluirArchivados,
    });

    return res.status(200).json({
      success: true,
      message: "Lista de reportes",
      data: reportes,
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

    const reporte = await obtenerReporteAdmin(id);
    if (!reporte) return errorResponse(res, "Reporte no encontrado", 404);
    return successResponse(res, "Reporte obtenido", reporte);
  } catch (err) {
    next(err);
  }
};

// Fix 4.2: el reporte es historial de moderacion; se ARCHIVA, nunca se borra
// fisicamente. Requiere la columna archivado (migracion 011).
export const eliminarReporte = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const archivado = await archivarReporte({
      id,
      actorId: req.userId,
      ip: req.ip,
    });
    if (!archivado) return errorResponse(res, "Reporte no encontrado", 404);

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

    const resuelto = await resolverReporteAdmin({
      id,
      respuesta,
      actorId: req.userId,
      ip: req.ip,
    });
    if (!resuelto) {
      return errorResponse(res, "Reporte no encontrado o ya resuelto", 404);
    }

    return successResponse(res, "Reporte resuelto", { id, estado: "resuelto" });
  } catch (err) {
    next(err);
  }
};
