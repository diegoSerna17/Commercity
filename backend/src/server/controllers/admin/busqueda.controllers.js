import { successResponse } from "../../utils/response.js";
import { buscarAdmin as buscarAdminServicio } from "../../services/admin.service.js";

// RF69-RF71: buscador unificado admin.
// Intenta FULLTEXT (MATCH...AGAINST) y cae al fallback LIKE (escapado) si el
// indice no existe. `scope` permite filtrar a usuario|producto|all (default all).
export const buscarAdmin = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return successResponse(res, "Busqueda admin", { usuarios: [], productos: [] });

    const resultado = await buscarAdminServicio({
      q,
      scope: req.query.scope || "all",
    });

    return successResponse(res, "Busqueda admin", resultado);
  } catch (err) {
    next(err);
  }
};
