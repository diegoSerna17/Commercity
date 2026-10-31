import pool from "../config/db.js";

/**
 * Middleware de autorizacion por roles (RBAC).
 * Debe ejecutarse DESPUES de authRequired (usa req.userId inyectado por el JWT).
 * B-10: si authRequired ya dejo los roles en req.userRoles (consulta unica),
 * no se vuelve a consultar la BD; si no vienen (p. ej. invocacion directa),
 * se consultan como antes y se inyectan para uso posterior.
 */
export const requireRoles = (rolesPermitidos) => {
  return async (req, res, next) => {
    try {
      if (!Array.isArray(req.userRoles)) {
        const [rows] = await pool.query(
          `SELECT r.nombre
             FROM usuario_roles ur
             JOIN roles r ON r.id = ur.rol_id
            WHERE ur.usuario_id = ?`,
          [req.userId]
        );
        req.userRoles = rows.map((r) => r.nombre);
      }
      const roles = req.userRoles;

      if (!roles.some((rol) => rolesPermitidos.includes(rol))) {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "No tienes permisos para esta accion" },
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
