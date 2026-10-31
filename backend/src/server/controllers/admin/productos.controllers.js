import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";
import { validarId, escapeLike } from "./admin.utils.js";

// Fix 4.4: el admin ve TODOS los productos (activos y suspendidos) y puede
// restaurar un producto suspendido (RF68 queda completa).
export const getProductos = async (req, res, next) => {
  try {
    const q = req.query.q ? escapeLike(String(req.query.q).trim()) : null;
    const soloActivos = req.query.soloActivos === "true";
    const [rows] = await pool.query(
      `SELECT p.id, p.nombre, p.precio, p.eliminado_por_admin, v.nombre_completo AS vendedor
         FROM productos p
         JOIN usuarios v ON v.id = p.vendedor_id
         ${soloActivos ? "WHERE p.eliminado_por_admin = 0" : ""}
         ${q ? `${soloActivos ? "AND" : "WHERE"} (p.nombre LIKE ? OR v.nombre_completo LIKE ?)` : ""}
         ORDER BY p.id`,
      q ? [q, q] : []
    );
    return successResponse(res, "Lista de productos", rows.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      precio: Number(p.precio),
      vendedor: p.vendedor,
      suspendido: p.eliminado_por_admin === 1,
    })));
  } catch (err) {
    next(err);
  }
};

// RF72/B-R3: suspension logica (nunca DELETE).
export const eliminarProducto = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!validarId(id)) return errorResponse(res, "ID inválido", 400);

    const [result] = await pool.query(
      "UPDATE productos SET eliminado_por_admin = 1 WHERE id = ? AND eliminado_por_admin = 0",
      [id]
    );
    if (result.affectedRows === 0)
      return errorResponse(res, "Producto no encontrado", 404);
    return successResponse(res, "Producto suspendido", { id, estado: "suspendido" });
  } catch (err) {
    next(err);
  }
};

// Fix 4.4: restaurar un producto suspendido por error del admin.
export const restaurarProducto = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!validarId(id)) return errorResponse(res, "ID inválido", 400);

    const [result] = await pool.query(
      "UPDATE productos SET eliminado_por_admin = 0 WHERE id = ? AND eliminado_por_admin = 1",
      [id]
    );
    if (result.affectedRows === 0)
      return errorResponse(res, "Producto no encontrado o no suspendido", 404);
    return successResponse(res, "Producto restaurado", { id, estado: "activo" });
  } catch (err) {
    next(err);
  }
};
