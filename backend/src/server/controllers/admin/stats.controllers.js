import pool from "../../config/db.js";
import { successResponse } from "../../utils/response.js";

/**
 * Estadisticas del admin (RF55-RF59).
 * Fix 4.5: el total de comisiones excluye lineas canceladas (RF56: un pedido
 * cancelado no genera comision para CommerCity).
 */
export const getStats = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        (SELECT COUNT(DISTINCT ur.usuario_id) FROM usuario_roles ur
          JOIN roles r ON r.id = ur.rol_id WHERE r.nombre = 'vendedor') AS totalVendedores,
        (SELECT COUNT(DISTINCT ur.usuario_id) FROM usuario_roles ur
          JOIN roles r ON r.id = ur.rol_id WHERE r.nombre = 'comprador') AS totalCompradores,
        (SELECT COUNT(*) FROM productos WHERE eliminado_por_admin = 0) AS totalProductos,
        (SELECT COALESCE(SUM(monto_comision), 0) FROM detalle_pedidos
          WHERE estado_envio <> 'Cancelado') AS totalComisiones
    `);
    const s = rows[0];
    return successResponse(res, "Estadisticas del admin", {
      totalVendedores: Number(s.totalVendedores),
      totalCompradores: Number(s.totalCompradores),
      totalProductos: Number(s.totalProductos),
      totalComisiones: Number(s.totalComisiones),
    });
  } catch (err) {
    next(err);
  }
};
