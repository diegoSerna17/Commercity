import pool from "../config/db.js";

/**
 * Middleware de autorizacion por roles (RBAC).
 * Debe ejecutarse DESPUES de authRequired (usa req.userId inyectado por el JWT).
 * Consulta los roles del usuario en la BD y permite el paso solo si tiene
 * al menos uno de los roles permitidos. Inyecta req.userRoles para uso posterior.
 */
export const requireRoles = (rolesPermitidos) => {
  return async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        `SELECT r.nombre
           FROM usuario_roles ur
           JOIN roles r ON r.id = ur.rol_id
          WHERE ur.usuario_id = ?`,
        [req.userId]
      );
      const roles = rows.map((r) => r.nombre);
      req.userRoles = roles;

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
