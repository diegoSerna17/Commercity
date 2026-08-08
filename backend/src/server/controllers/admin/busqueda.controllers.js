import pool from "../../config/db.js";
import { successResponse } from "../../utils/response.js";
import { capitalizar, escapeLike } from "./admin.utils.js";

// RF69-RF71: buscador unificado admin.
// Intenta FULLTEXT (MATCH...AGAINST) y cae al fallback LIKE (escapado) si el
// indice no existe. `scope` permite filtrar a usuario|producto|all (default all).
export const buscarAdmin = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return successResponse(res, "Busqueda admin", { usuarios: [], productos: [] });
    const scope = req.query.scope || "all";
    const like = escapeLike(q);

    const fulltextProductos = `
      SELECT p.id, p.nombre, p.precio, v.nombre_completo AS vendedor
        FROM productos p
        JOIN usuarios v ON v.id = p.vendedor_id
       WHERE p.eliminado_por_admin = 0
         AND MATCH(p.nombre, p.descripcion) AGAINST(? IN NATURAL LANGUAGE MODE)
       ORDER BY p.id LIMIT 20`;

    const fulltextUsuarios = `
      SELECT u.id, u.nombre_completo, u.email, u.activo,
             GROUP_CONCAT(r.nombre ORDER BY CASE r.nombre
               WHEN 'administrador' THEN 0 WHEN 'vendedor' THEN 1 ELSE 2 END) AS roles
        FROM usuarios u
        LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
        LEFT JOIN roles r ON r.id = ur.rol_id
       WHERE MATCH(u.nombre_completo, u.email) AGAINST(? IN NATURAL LANGUAGE MODE)
       GROUP BY u.id ORDER BY u.id LIMIT 20`;

    const likeProductos = `
      SELECT p.id, p.nombre, p.precio, v.nombre_completo AS vendedor
        FROM productos p
        JOIN usuarios v ON v.id = p.vendedor_id
       WHERE p.eliminado_por_admin = 0
         AND (p.nombre LIKE ? OR v.nombre_completo LIKE ?)
       ORDER BY p.id LIMIT 20`;

    const likeUsuarios = `
      SELECT u.id, u.nombre_completo, u.email, u.activo,
             GROUP_CONCAT(r.nombre ORDER BY CASE r.nombre
               WHEN 'administrador' THEN 0 WHEN 'vendedor' THEN 1 ELSE 2 END) AS roles
        FROM usuarios u
        LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
        LEFT JOIN roles r ON r.id = ur.rol_id
       WHERE u.nombre_completo LIKE ? OR r.nombre LIKE ?
       GROUP BY u.id ORDER BY u.id LIMIT 20`;

    const mapearUsuarios = (rows) =>
      rows.map((u) => ({
        id: u.id,
        nombre: u.nombre_completo,
        email: u.email,
        rol: capitalizar((u.roles || "").split(",")[0]),
        estado: u.activo ? "activo" : "baneado",
      }));
    const mapearProductos = (rows) =>
      rows.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio),
        vendedor: p.vendedor,
      }));

    const resultado = { usuarios: [], productos: [] };

    if (scope !== "producto") {
      try {
        const [rows] = await pool.query(fulltextUsuarios, [q]);
        resultado.usuarios = mapearUsuarios(rows);
      } catch (_err) {
        const [rows] = await pool.query(likeUsuarios, [like, like]);
        resultado.usuarios = mapearUsuarios(rows);
      }
    }

    if (scope !== "usuario") {
      try {
        const [rows] = await pool.query(fulltextProductos, [q]);
        resultado.productos = mapearProductos(rows);
      } catch (_err) {
        const [rows] = await pool.query(likeProductos, [like, like]);
        resultado.productos = mapearProductos(rows);
      }
    }

    return successResponse(res, "Busqueda admin", resultado);
  } catch (err) {
    next(err);
  }
};
