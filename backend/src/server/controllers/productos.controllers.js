import { borrarArchivoSubido } from "../config/multer.js";
import {
  listarProductos,
  listarCategorias,
  listarVendedores,
  obtenerDetalleProducto,
  validarStock,
  crearProducto,
  editarProducto,
  listarMisProductos,
  cambiarEstadoProducto,
  eliminarProducto,
} from "../services/productos.service.js";

/**
 * Panel Principal (RF87-RF94): catalogo de productos con busqueda, filtros
 * por categoria/vendedor y paginacion. Consultas parametrizadas contra el
 * esquema v3 (productos, categorias, usuarios).
 * Desde 1.5.3 el SQL vive en services/productos.service.js; el controlador
 * valida, llama al servicio y responde.
 */

/**
 * Lista productos disponibles con busqueda (nombre/categoria/vendedor) y paginacion.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const getProductos = async (req, res, next) => {
  try {
    const data = await listarProductos({
      pagina: req.query.page,
      limite: req.query.limit,
      nombre: req.query.nombre,
      categoria: req.query.categoria,
      vendedor: req.query.vendedor,
      vendedorId: req.query.vendedor_id,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * Lista las categorias activas para el filtro del panel.
 */
export const getCategorias = async (_req, res, next) => {
  try {
    const categorias = await listarCategorias();
    return res.json({ success: true, data: categorias });
  } catch (error) {
    next(error);
  }
};

/**
 * Lista los vendedores activos para el filtro del panel (paginado).
 */
export const getVendedores = async (req, res, next) => {
  try {
    const { vendedores, paginacion } = await listarVendedores({
      pagina: req.query.page,
      limite: req.query.limit,
    });

    return res.json({
      success: true,
      data: vendedores,
      paginacion,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// DETALLE DE PRODUCTO (RF78/RF79) y VALIDACION DE STOCK (RF86)
// Integrados desde AVANCES/SPRING 1/CARLOS PEREA (2026-08-09).
// Fixes de integracion:
//   4.1 tests unitarios (ver __tests__/productos.controllers.test.js).
//   4.2 solo se exponen /productos/:id y /productos/:id/validar-stock; la lista
//       general /productos sigue siendo del Panel Principal (Brandon).
//   4.3 el detalle excluye vendedores inactivos (RF74: u.activo = 1).
// ============================================================================

/**
 * GET /api/productos/:id (RF78/RF79)
 * Detalle publico de un producto con datos del vendedor y su calificacion (RF49).
 * Filtra productos suspendidos por el admin (RF72) y vendedores inactivos (RF74).
 */
export const getProductoDetalle = async (req, res, next) => {
  try {
    const productoId = Number(req.params.id);
    const detalle = await obtenerDetalleProducto(productoId);

    if (!detalle) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Producto no encontrado" },
      });
    }

    return res.json({ success: true, data: detalle });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/productos/:id/validar-stock (RF86)
 * Valida en la BD el stock real para una cantidad dada. El estado
 * Disponible/Agotado SIEMPRE se lee de la columna generada (nunca se calcula
 * en el backend). Se usa como respaldo del control del frontend.
 */
export const validarStockProducto = async (req, res, next) => {
  try {
    const productoId = Number(req.params.id);
    const cantidad = Number(req.query.cantidad);

    const resultado = await validarStock(productoId, cantidad);

    if (!resultado) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Producto no encontrado" },
      });
    }

    return res.json({ success: true, data: resultado });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// GESTION DE PRODUCTOS DEL VENDEDOR (RF44-RF49, RF54)
// Integrada desde Jose Yepes (2026-08-12).
// Fix 4.1: el vendedor se obtiene del JWT (req.userId) via authRequired +
// requireRoles(["vendedor"]); se elimino el VENDEDOR_ID_TEMPORAL hardcodeado.
// El estado Disponible/Agotado SIEMPRE lo calcula la BD (columna GENERADA).
// ============================================================================

/**
 * POST /api/productos (RF45/RF46/RF48) - crear producto del vendedor autenticado.
 * Multipart: campo "imagen" obligatorio. El estado lo calcula la BD (GENERADA).
 * El formato y los rangos los valida crearProductoSchema (validate()).
 */
export const crearProductoVendedor = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "La imagen es requerida" },
      });
    }

    const id = await crearProducto({
      vendedorId: req.userId,
      datos: req.body,
      archivo: req.file,
    });

    return res.status(201).json({
      success: true,
      data: { id, mensaje: "Producto creado exitosamente" },
    });
  } catch (error) {
    borrarArchivoSubido(req.file);
    next(error);
  }
};

/**
 * PUT /api/productos/:id (RF49) - editar producto del vendedor autenticado.
 * Solo puede editar productos cuyo vendedor_id sea el del JWT.
 */
export const editarProductoVendedor = async (req, res, next) => {
  try {
    const productoId = Number(req.params.id);

    const resultado = await editarProducto({
      vendedorId: req.userId,
      productoId,
      datos: req.body,
      archivo: req.file,
    });

    if (!resultado.ok) {
      borrarArchivoSubido(req.file);
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Producto no encontrado" },
      });
    }

    return res.json({
      success: true,
      data: { mensaje: "Producto actualizado exitosamente" },
    });
  } catch (error) {
    borrarArchivoSubido(req.file);
    next(error);
  }
};

/**
 * GET /api/productos/mis-productos (RF54) - lista los productos del vendedor autenticado.
 */
export const getMisProductos = async (req, res, next) => {
  try {
    const { productos, paginacion } = await listarMisProductos({
      vendedorId: req.userId,
      pagina: req.query.page,
      limite: req.query.limit,
    });

    return res.json({
      success: true,
      data: productos,
      paginacion,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/productos/:id/estado (RF55) - el vendedor pausa o reactiva su
 * publicacion sin borrarla. Un producto dado de baja por el vendedor no se
 * reactiva desde aqui.
 */
export const cambiarEstadoProductoVendedor = async (req, res, next) => {
  try {
    const productoId = Number(req.params.id);
    const { estado } = req.body;

    const resultado = await cambiarEstadoProducto({
      vendedorId: req.userId,
      productoId,
      estado,
    });

    if (!resultado.ok) {
      const status = resultado.code === "CONFLICT" ? 409 : 404;
      return res.status(status).json({
        success: false,
        error: { code: resultado.code, message: resultado.mensaje },
      });
    }

    return res.json({ success: true, data: resultado.data });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/productos/:id (RF55) - baja logica propia del vendedor. No borra
 * la fila: conserva el historial de pedidos y calificaciones.
 */
export const eliminarProductoVendedor = async (req, res, next) => {
  try {
    const productoId = Number(req.params.id);
    const eliminado = await eliminarProducto({
      vendedorId: req.userId,
      productoId,
    });

    if (!eliminado) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Producto no encontrado o ya eliminado" },
      });
    }

    return res.json({ success: true, data: { id: productoId, estado: "eliminado" } });
  } catch (error) {
    next(error);
  }
};
