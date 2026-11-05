import pool from "../config/db.js";
import { borrarArchivoSubido, borrarUploadPorUrl } from "../config/multer.js";
import { escapeLike } from "../utils/sql.js";

/**
 * Panel Principal (RF87-RF94): catalogo de productos con busqueda, filtros
 * por categoria/vendedor y paginacion. Consultas parametrizadas contra el
 * esquema v3 (productos, categorias, usuarios).
 */

/**
 * Lista productos disponibles con busqueda (nombre/categoria/vendedor) y paginacion.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const getProductos = async (req, res, next) => {
  try {
    const pagina = req.query.page;
    const limite = req.query.limit;
    const offset = (pagina - 1) * limite;

    const nombre = String(req.query.nombre || "");
    const categoria = String(req.query.categoria || "");
    const vendedor = String(req.query.vendedor || "");
    const vendedorId = req.query.vendedor_id;

    const condiciones = [];
    const valores = [];

    // M-20 (TASK-5.4): filtro exacto por vendedor para el perfil publico.
    if (vendedorId !== undefined) {
      condiciones.push("p.vendedor_id = ?");
      valores.push(vendedorId);
    }

    // B-8 (TASK-4.9): comodines del usuario escapados (busqueda literal).
    if (nombre.trim() !== "") {
      condiciones.push("p.nombre LIKE ?");
      valores.push(escapeLike(nombre));
    }

    if (categoria.trim() !== "") {
      condiciones.push("c.nombre LIKE ?");
      valores.push(escapeLike(categoria));
    }

    if (vendedor.trim() !== "") {
      condiciones.push("v.nombre_completo LIKE ?");
      valores.push(escapeLike(vendedor));
    }

    const where = condiciones.length
      ? ` AND ${condiciones.join(" AND ")}`
      : "";

    const consultaTotal = `
      SELECT COUNT(*) AS total
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      INNER JOIN usuarios v ON p.vendedor_id = v.id
      WHERE 1 = 1
        AND p.eliminado_por_admin = 0
        AND p.estado = 'Disponible'
        ${where}
    `;

    const [resultadoTotal] = await pool.query(consultaTotal, valores);

    const totalProductos = Number(resultadoTotal[0]?.total || 0);
    const totalPaginas = Math.max(Math.ceil(totalProductos / limite), 1);

    const consultaProductos = `
      SELECT
        p.id,
        p.vendedor_id,
        p.nombre,
        p.descripcion,
        p.precio,
        p.stock,
        p.imagen_url AS imagen,
        p.fecha_publicacion AS fecha_creacion,
        p.descuento_porcentaje AS descuento_porcentaje,
        c.nombre AS categoria,
        v.id AS vendedor_id,
        v.nombre_completo AS vendedor,
        v.foto_perfil AS vendedor_foto
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      INNER JOIN usuarios v ON p.vendedor_id = v.id
      WHERE 1 = 1
        AND p.eliminado_por_admin = 0
        AND p.estado = 'Disponible'
        ${where}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `;

    const [productos] = await pool.query(consultaProductos, [
      ...valores,
      limite,
      offset,
    ]);

    return res.status(200).json({
      success: true,
      data: {
        pagina,
        limite,
        totalProductos,
        totalPaginas,
        hayPaginaAnterior: pagina > 1,
        hayPaginaSiguiente: pagina < totalPaginas,
        productos,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lista las categorias activas para el filtro del panel.
 */
export const getCategorias = async (_req, res, next) => {
  try {
    const [categorias] = await pool.query(`
      SELECT id, nombre
      FROM categorias
      WHERE activo = 1
      ORDER BY nombre ASC
    `);

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
    const { page: pagina, limit: limite } = req.query;
    const offset = (pagina - 1) * limite;
    const [[totalRow]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM usuarios u
      INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
      INNER JOIN roles r ON r.id = ur.rol_id
      WHERE r.nombre = 'vendedor'
        AND u.activo = 1
    `);
    const total = Number(totalRow?.total || 0);
    const [vendedores] = await pool.query(
      `SELECT u.id, u.nombre_completo AS nombre
       FROM usuarios u
       INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
       INNER JOIN roles r ON r.id = ur.rol_id
       WHERE r.nombre = 'vendedor'
         AND u.activo = 1
       ORDER BY u.nombre_completo ASC
       LIMIT ? OFFSET ?`,
      [limite, offset]
    );

    return res.json({
      success: true,
      data: vendedores,
      paginacion: {
        pagina,
        por_pagina: limite,
        total,
        total_paginas: Math.max(1, Math.ceil(total / limite)),
      },
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

const avatarPorDefecto = (nombre) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    nombre || "Vendedor"
  )}&background=1a1a26&color=fff&bold=true&size=80&rounded=true`;

/**
 * GET /api/productos/:id (RF78/RF79)
 * Detalle publico de un producto con datos del vendedor y su calificacion (RF49).
 * Filtra productos suspendidos por el admin (RF72) y vendedores inactivos (RF74).
 */
export const getProductoDetalle = async (req, res, next) => {
  try {
    const productoId = Number(req.params.id);

    const [filas] = await pool.query(
      `SELECT p.id, p.nombre, p.descripcion, p.imagen_url, p.precio,
              p.descuento_porcentaje, p.stock, p.estado, p.fecha_publicacion,
              c.id AS categoria_id, c.nombre AS categoria_nombre,
              u.id AS vendedor_id, u.nombre_completo AS vendedor_nombre,
              u.foto_perfil AS vendedor_foto
         FROM productos p
         JOIN categorias c ON c.id = p.categoria_id
         JOIN usuarios  u ON u.id = p.vendedor_id
        WHERE p.id = ?
          AND p.eliminado_por_admin = 0
          AND u.activo = 1
        LIMIT 1`,
      [productoId]
    );

    if (filas.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Producto no encontrado" },
      });
    }

    const fila = filas[0];
    const [calificaciones] = await pool.query(
      `SELECT AVG(estrellas) AS promedio, COUNT(*) AS total
         FROM calificaciones_vendedores
        WHERE vendedor_id = ?`,
      [fila.vendedor_id]
    );
    const promedio = calificaciones[0]?.promedio;

    return res.json({
      success: true,
      data: {
        id: fila.id,
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        imagen_url: fila.imagen_url,
        precio: Number(fila.precio),
        descuento_porcentaje: Number(fila.descuento_porcentaje || 0),
        stock: Number(fila.stock),
        estado: fila.estado,
        fecha_publicacion: fila.fecha_publicacion,
        categoria: { id: fila.categoria_id, nombre: fila.categoria_nombre },
        vendedor: {
          id: fila.vendedor_id,
          nombre: fila.vendedor_nombre,
          foto: fila.vendedor_foto || avatarPorDefecto(fila.vendedor_nombre),
          calificacion_promedio: promedio != null ? Number(Number(promedio).toFixed(1)) : null,
          total_calificaciones: Number(calificaciones[0]?.total || 0),
        },
      },
    });
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

    const [filas] = await pool.query(
      `SELECT stock, estado
         FROM productos
        WHERE id = ? AND eliminado_por_admin = 0
        LIMIT 1`,
      [productoId]
    );

    if (filas.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Producto no encontrado" },
      });
    }

    const { stock, estado } = filas[0];

    if (estado === "Agotado" || Number(stock) === 0) {
      return res.json({
        success: true,
        data: {
          valido: false,
          stock_disponible: 0,
          estado,
          mensaje: "Este producto está agotado",
        },
      });
    }

    if (cantidad > Number(stock)) {
      return res.json({
        success: true,
        data: {
          valido: false,
          stock_disponible: Number(stock),
          estado,
          mensaje: `Solo hay ${stock} unidad${Number(stock) === 1 ? "" : "es"} disponible${Number(stock) === 1 ? "" : "s"}`,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        valido: true,
        stock_disponible: Number(stock),
        estado,
        mensaje: "Stock disponible",
      },
    });
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
 * Busca una categoria por nombre; si no existe, la crea automaticamente.
 * B2 (auditoria 2026-11-04): un solo INSERT ... ON DUPLICATE KEY UPDATE cierra
 * la carrera entre dos altas simultaneas de la misma categoria (nombre UNIQUE).
 * @param {string} nombreCategoria
 * @returns {Promise<number>} id de la categoria (existente o recien creada)
 */
async function obtenerOCrearCategoria(nombreCategoria) {
  const [resultado] = await pool.query(
    `INSERT INTO categorias (nombre) VALUES (?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [nombreCategoria]
  );
  return resultado.insertId;
}

/**
 * POST /api/productos (RF45/RF46/RF48) - crear producto del vendedor autenticado.
 * Multipart: campo "imagen" obligatorio. El estado lo calcula la BD (GENERADA).
 * El formato y los rangos los valida crearProductoSchema (validate()).
 */
export const crearProductoVendedor = async (req, res, next) => {
  try {
    const { nombre, descripcion, precio, stock, descuento, categoria } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "La imagen es requerida" },
      });
    }

    const categoriaId = await obtenerOCrearCategoria(categoria);
    const imagenUrl = `/uploads/${req.file.filename}`;

    const [resultado] = await pool.query(
      `INSERT INTO productos
         (vendedor_id, categoria_id, nombre, descripcion, imagen_url, precio, stock, descuento_porcentaje)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        categoriaId,
        nombre,
        descripcion,
        imagenUrl,
        precio,
        stock,
        descuento ?? 0,
      ]
    );

    return res.status(201).json({
      success: true,
      data: { id: resultado.insertId, mensaje: "Producto creado exitosamente" },
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

    const [productoExistente] = await pool.query(
      `SELECT id, categoria_id, imagen_url, vendedor_id,
              nombre, descripcion, precio, stock, descuento_porcentaje
         FROM productos
        WHERE id = ? AND vendedor_id = ?`,
      [productoId, req.userId]
    );

    if (productoExistente.length === 0) {
      borrarArchivoSubido(req.file);
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Producto no encontrado" },
      });
    }

    const producto = productoExistente[0];
    const { nombre, descripcion, precio, stock, descuento, categoria } = req.body;

    let categoriaId = producto.categoria_id;
    if (categoria !== undefined) {
      categoriaId = await obtenerOCrearCategoria(categoria);
    }

    const imagenUrl = req.file ? `/uploads/${req.file.filename}` : producto.imagen_url;
    // TASK-4.6: al reemplazar la imagen, la anterior deja de estar referenciada.
    if (req.file && producto.imagen_url && producto.imagen_url !== imagenUrl) {
      borrarUploadPorUrl(producto.imagen_url);
    }

    await pool.query(
      `UPDATE productos
          SET nombre = ?, descripcion = ?, imagen_url = ?, precio = ?,
              stock = ?, descuento_porcentaje = ?, categoria_id = ?
        WHERE id = ? AND vendedor_id = ?`,
      [
        nombre ?? producto.nombre,
        descripcion ?? producto.descripcion,
        imagenUrl,
        precio ?? producto.precio,
        stock ?? producto.stock,
        descuento ?? producto.descuento_porcentaje,
        categoriaId,
        productoId,
        req.userId,
      ]
    );

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
    const { page: pagina, limit: limite } = req.query;
    const offset = (pagina - 1) * limite;
    const [[totalRow]] = await pool.query(
      "SELECT COUNT(*) AS total FROM productos WHERE vendedor_id = ?",
      [req.userId]
    );
    const total = Number(totalRow?.total || 0);
    const [productos] = await pool.query(
      `SELECT p.id, p.nombre, p.descripcion, p.imagen_url, p.precio, p.stock,
              p.estado, p.descuento_porcentaje, p.fecha_publicacion,
              c.id AS categoria_id, c.nombre AS categoria_nombre
         FROM productos p
         JOIN categorias c ON p.categoria_id = c.id
        WHERE p.vendedor_id = ?
        ORDER BY p.id DESC
        LIMIT ? OFFSET ?`,
      [req.userId, limite, offset]
    );

    return res.json({
      success: true,
      data: productos.map((p) => ({
        ...p,
        precio: Number(p.precio),
        stock: Number(p.stock),
        descuento_porcentaje: Number(p.descuento_porcentaje || 0),
      })),
      paginacion: {
        pagina,
        por_pagina: limite,
        total,
        total_paginas: Math.max(1, Math.ceil(total / limite)),
      },
    });
  } catch (error) {
    next(error);
  }
};
