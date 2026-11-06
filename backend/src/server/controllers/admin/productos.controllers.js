import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";
import { escapeLike } from "./admin.utils.js";
import { registrarAuditoria, ACCIONES } from "../../utils/auditoria.js";

// Fix 4.4: el admin ve TODOS los productos (activos y suspendidos) y puede
// restaurar un producto suspendido (RF68 queda completa).
// B2 (auditoria 2026-11-04): listado paginado con LIMIT/OFFSET.
export const getProductos = async (req, res, next) => {
  try {
    const { pagina, por_pagina: porPagina, soloActivos: soloActivosRaw } = req.query;
    const q = req.query.q ? escapeLike(req.query.q) : null;
    const soloActivos = soloActivosRaw === "true";
    const offset = (pagina - 1) * porPagina;

    const condiciones = [];
    const params = [];
    if (soloActivos) condiciones.push("p.eliminado_por_admin = 0");
    if (q) {
      condiciones.push("(p.nombre LIKE ? OR v.nombre_completo LIKE ?)");
      params.push(q, q);
    }
    const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

    const [[totalRow]] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM productos p
         JOIN usuarios v ON v.id = p.vendedor_id
         ${where}`,
      params
    );
    const total = Number(totalRow?.total || 0);

    const [rows] = await pool.query(
      `SELECT p.id, p.nombre, p.precio, p.eliminado_por_admin, v.nombre_completo AS vendedor
         FROM productos p
         JOIN usuarios v ON v.id = p.vendedor_id
         ${where}
        ORDER BY p.id
        LIMIT ? OFFSET ?`,
      [...params, porPagina, offset]
    );

    return res.status(200).json({
      success: true,
      message: "Lista de productos",
      data: rows.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio),
        vendedor: p.vendedor,
        suspendido: p.eliminado_por_admin === 1,
      })),
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

// RF72/B-R3: suspension logica (nunca DELETE).
export const eliminarProducto = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const [result] = await pool.query(
      "UPDATE productos SET eliminado_por_admin = 1 WHERE id = ? AND eliminado_por_admin = 0",
      [id]
    );
    if (result.affectedRows === 0)
      return errorResponse(res, "Producto no encontrado", 404);

    // M-11/B2: auditoria de la suspension (moderacion).
    await registrarAuditoria({
      actorId: req.userId,
      accion: ACCIONES.PRODUCTO_SUSPENDIDO,
      objetivoTipo: "producto",
      objetivoId: id,
      ip: req.ip,
    });

    return successResponse(res, "Producto suspendido", { id, estado: "suspendido" });
  } catch (err) {
    next(err);
  }
};

// Fix 4.4: restaurar un producto suspendido por error del admin.
export const restaurarProducto = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const [result] = await pool.query(
      "UPDATE productos SET eliminado_por_admin = 0 WHERE id = ? AND eliminado_por_admin = 1",
      [id]
    );
    if (result.affectedRows === 0)
      return errorResponse(res, "Producto no encontrado o no suspendido", 404);

    // M-11/B2: auditoria de la restauracion.
    await registrarAuditoria({
      actorId: req.userId,
      accion: ACCIONES.PRODUCTO_RESTAURADO,
      objetivoTipo: "producto",
      objetivoId: id,
      ip: req.ip,
    });

    return successResponse(res, "Producto restaurado", { id, estado: "activo" });
  } catch (err) {
    next(err);
  }
};
