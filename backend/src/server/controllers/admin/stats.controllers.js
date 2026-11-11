import { successResponse } from "../../utils/response.js";
import { obtenerStats } from "../../services/admin.service.js";

/**
 * Estadisticas del admin (RF55-RF59).
 * Fix 4.5: el total de comisiones excluye lineas canceladas (RF56: un pedido
 * cancelado no genera comision para CommerCity).
 */
export const getStats = async (_req, res, next) => {
  try {
    const stats = await obtenerStats();
    return successResponse(res, "Estadisticas del admin", stats);
  } catch (err) {
    next(err);
  }
};
