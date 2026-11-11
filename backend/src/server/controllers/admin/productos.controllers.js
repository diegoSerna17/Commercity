import { successResponse, errorResponse } from "../../utils/response.js";
import {
  listarProductosAdmin,
  suspenderProducto,
  restaurarProducto as restaurarProductoAdmin,
} from "../../services/admin.service.js";

// Fix 4.4: el admin ve TODOS los productos (activos y suspendidos) y puede
// restaurar un producto suspendido (RF68 queda completa).
// B2 (auditoria 2026-11-04): listado paginado con LIMIT/OFFSET.
export const getProductos = async (req, res, next) => {
  try {
    const { pagina, por_pagina: porPagina, soloActivos: soloActivosRaw } = req.query;
    const soloActivos = soloActivosRaw === "true";

    const { productos, total } = await listarProductosAdmin({
      pagina,
      porPagina,
      soloActivos,
      q: req.query.q,
    });

    return res.status(200).json({
      success: true,
      message: "Lista de productos",
      data: productos,
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

    const suspendido = await suspenderProducto({
      id,
      actorId: req.userId,
      ip: req.ip,
    });
    if (!suspendido) return errorResponse(res, "Producto no encontrado", 404);

    return successResponse(res, "Producto suspendido", { id, estado: "suspendido" });
  } catch (err) {
    next(err);
  }
};

// Fix 4.4: restaurar un producto suspendido por error del admin.
export const restaurarProducto = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const restaurado = await restaurarProductoAdmin({
      id,
      actorId: req.userId,
      ip: req.ip,
    });
    if (!restaurado) return errorResponse(res, "Producto no encontrado o no suspendido", 404);

    return successResponse(res, "Producto restaurado", { id, estado: "activo" });
  } catch (err) {
    next(err);
  }
};
