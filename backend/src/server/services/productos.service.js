import pool from "../config/db.js";
import { borrarUploadPorUrl } from "../config/multer.js";
import { escapeLike } from "../utils/sql.js";

// ============================================================================
// Servicio del dominio productos (RF44-RF49, RF54, RF55, RF78, RF79, RF86-RF94).
// Concentra el SQL del catalogo, el detalle publico, la validacion de stock y
// la gestion del vendedor. El controlador solo valida, llama y responde.
// ============================================================================

/**
 * Lista productos disponibles con busqueda (nombre/categoria/vendedor) y paginacion.
 */
export async function listarProductos({
  pagina,
  limite,
  nombre,
  categoria,
  vendedor,
  vendedorId,
}) {
  const offset = (pagina - 1) * limite;
  const nombreFiltro = String(nombre || "");
  const categoriaFiltro = String(categoria || "");
  const vendedorFiltro = String(vendedor || "");

  const condicionesProducto = [];
  const condicionesJoin = [];
  const valoresProducto = [];
  const valoresJoin = [];

  // M-20 (TASK-5.4): filtro exacto por vendedor para el perfil publico.
  if (vendedorId !== undefined) {
    condicionesProducto.push("p.vendedor_id = ?");
    valoresProducto.push(vendedorId);
  }

  // B-8 (TASK-4.9): comodines del usuario escapados (busqueda literal).
  if (nombreFiltro.trim() !== "") {
    condicionesProducto.push("p.nombre LIKE ?");
    valoresProducto.push(escapeLike(nombreFiltro));
  }

  if (categoriaFiltro.trim() !== "") {
    condicionesJoin.push("c.nombre LIKE ?");
    valoresJoin.push(escapeLike(categoriaFiltro));
  }

  if (vendedorFiltro.trim() !== "") {
    condicionesJoin.push("v.nombre_completo LIKE ?");
    valoresJoin.push(escapeLike(vendedorFiltro));
  }

  const whereProducto = condicionesProducto.length
    ? ` AND ${condicionesProducto.join(" AND ")}`
    : "";
  const whereJoin = condicionesJoin.length
    ? ` AND ${condicionesJoin.join(" AND ")}`
    : "";
  const valores = [...valoresProducto, ...valoresJoin];

  // Rendimiento (2026-11-06): el catalogo base no necesita los JOIN con
  // categorias ni usuarios para contar. Solo se unen si el filtro usa sus
  // columnas, y asi el COUNT se resuelve con el indice del catalogo.
  const consultaTotal = condicionesJoin.length
    ? `
    SELECT COUNT(*) AS total
    FROM productos p
    INNER JOIN categorias c ON p.categoria_id = c.id
    INNER JOIN usuarios v ON p.vendedor_id = v.id
    WHERE 1 = 1
      AND p.eliminado_por_admin = 0
      AND p.eliminado_por_vendedor = 0
      AND p.pausado = 0
      AND p.estado = 'Disponible'
      ${whereProducto}
      ${whereJoin}
  `
    : `
    SELECT COUNT(*) AS total
    FROM productos p
    WHERE 1 = 1
      AND p.eliminado_por_admin = 0
      AND p.eliminado_por_vendedor = 0
      AND p.pausado = 0
      AND p.estado = 'Disponible'
      ${whereProducto}
  `;
  const valoresTotal = condicionesJoin.length ? valores : valoresProducto;

  const [resultadoTotal] = await pool.query(consultaTotal, valoresTotal);

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
      AND p.eliminado_por_vendedor = 0
      AND p.pausado = 0
      AND p.estado = 'Disponible'
      ${whereProducto}
      ${whereJoin}
    ORDER BY p.id DESC
    LIMIT ? OFFSET ?
  `;

  const [productos] = await pool.query(consultaProductos, [
    ...valores,
    limite,
    offset,
  ]);

  return {
    pagina,
    limite,
    totalProductos,
    totalPaginas,
    hayPaginaAnterior: pagina > 1,
    hayPaginaSiguiente: pagina < totalPaginas,
    productos,
  };
}

/** Lista las categorias activas para el filtro del panel. */
export async function listarCategorias() {
  const [categorias] = await pool.query(`
    SELECT id, nombre
    FROM categorias
    WHERE activo = 1
    ORDER BY nombre ASC
  `);
  return categorias;
}

/** Lista los vendedores activos para el filtro del panel (paginado). */
export async function listarVendedores({ pagina, limite }) {
  const offset = (pagina - 1) * limite;
  const [[totalRow]] = await pool.query(`
    SELECT COUNT(*) AS total
    FROM usuarios u
    INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
    INNER JOIN roles r ON r.id = ur.rol_id
    WHERE r.nombre = 'vendedor'
      AND u.activo = 1
      AND EXISTS (
        SELECT 1 FROM productos p
         WHERE p.vendedor_id = u.id
           AND p.eliminado_por_admin = 0
           AND p.eliminado_por_vendedor = 0
           AND p.pausado = 0
           AND p.estado = 'Disponible'
      )
  `);
  const total = Number(totalRow?.total || 0);
  const [vendedores] = await pool.query(
    `SELECT u.id, u.nombre_completo AS nombre
     FROM usuarios u
     INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
     INNER JOIN roles r ON r.id = ur.rol_id
     WHERE r.nombre = 'vendedor'
       AND u.activo = 1
       AND EXISTS (
         SELECT 1 FROM productos p
          WHERE p.vendedor_id = u.id
            AND p.eliminado_por_admin = 0
            AND p.eliminado_por_vendedor = 0
            AND p.pausado = 0
            AND p.estado = 'Disponible'
       )
     ORDER BY u.nombre_completo ASC
     LIMIT ? OFFSET ?`,
    [limite, offset]
  );

  return {
    vendedores,
    paginacion: {
      pagina,
      por_pagina: limite,
      total,
      total_paginas: Math.max(1, Math.ceil(total / limite)),
    },
  };
}

const avatarPorDefecto = (nombre) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    nombre || "Vendedor"
  )}&background=1a1a26&color=fff&bold=true&size=80&rounded=true`;

/**
 * Detalle publico de un producto con datos del vendedor y su calificacion (RF49).
 * Filtra productos suspendidos por el admin (RF72) y vendedores inactivos (RF74).
 * @returns {Promise<object|null>} detalle o null si no existe / no es visible.
 */
export async function obtenerDetalleProducto(productoId) {
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
        AND p.eliminado_por_vendedor = 0
        AND p.pausado = 0
        AND u.activo = 1
      LIMIT 1`,
    [productoId]
  );

  if (filas.length === 0) return null;

  const fila = filas[0];
  const [calificaciones] = await pool.query(
    `SELECT AVG(estrellas) AS promedio, COUNT(*) AS total
       FROM calificaciones_vendedores
      WHERE vendedor_id = ?`,
    [fila.vendedor_id]
  );
  const promedio = calificaciones[0]?.promedio;

  return {
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
  };
}

/**
 * Valida en la BD el stock real para una cantidad dada. El estado
 * Disponible/Agotado SIEMPRE se lee de la columna generada (nunca se calcula
 * en el backend). Se usa como respaldo del control del frontend.
 * @returns {Promise<object|null>} resultado o null si el producto no existe.
 */
export async function validarStock(productoId, cantidad) {
  const [filas] = await pool.query(
    `SELECT stock, estado
       FROM productos
      WHERE id = ? AND eliminado_por_admin = 0
        AND eliminado_por_vendedor = 0 AND pausado = 0
      LIMIT 1`,
    [productoId]
  );

  if (filas.length === 0) return null;

  const { stock, estado } = filas[0];

  if (estado === "Agotado" || Number(stock) === 0) {
    return {
      valido: false,
      stock_disponible: 0,
      estado,
      mensaje: "Este producto está agotado",
    };
  }

  if (cantidad > Number(stock)) {
    return {
      valido: false,
      stock_disponible: Number(stock),
      estado,
      mensaje: `Solo hay ${stock} unidad${Number(stock) === 1 ? "" : "es"} disponible${Number(stock) === 1 ? "" : "s"}`,
    };
  }

  return {
    valido: true,
    stock_disponible: Number(stock),
    estado,
    mensaje: "Stock disponible",
  };
}

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
 * Multipart: campo "imagen" obligatorio (la presencia la valida el controlador).
 * El estado lo calcula la BD (GENERADA).
 * @returns {Promise<number>} id del producto creado.
 */
export async function crearProducto({ vendedorId, datos, archivo }) {
  const { nombre, descripcion, precio, stock, descuento, categoria } = datos;

  const categoriaId = await obtenerOCrearCategoria(categoria);
  const imagenUrl = `/uploads/${archivo.filename}`;

  const [resultado] = await pool.query(
    `INSERT INTO productos
       (vendedor_id, categoria_id, nombre, descripcion, imagen_url, precio, stock, descuento_porcentaje)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      vendedorId,
      categoriaId,
      nombre,
      descripcion,
      imagenUrl,
      precio,
      stock,
      descuento ?? 0,
    ]
  );

  return resultado.insertId;
}

/**
 * PUT /api/productos/:id (RF49) - editar producto del vendedor autenticado.
 * Solo puede editar productos cuyo vendedor_id sea el del JWT.
 * @returns {Promise<{ ok: true } | { ok: false, notFound: true }>}
 */
export async function editarProducto({ vendedorId, productoId, datos, archivo }) {
  const [productoExistente] = await pool.query(
    `SELECT id, categoria_id, imagen_url, vendedor_id,
            nombre, descripcion, precio, stock, descuento_porcentaje
       FROM productos
      WHERE id = ? AND vendedor_id = ?`,
    [productoId, vendedorId]
  );

  if (productoExistente.length === 0) {
    return { ok: false, notFound: true };
  }

  const producto = productoExistente[0];
  const { nombre, descripcion, precio, stock, descuento, categoria } = datos;

  let categoriaId = producto.categoria_id;
  if (categoria !== undefined) {
    categoriaId = await obtenerOCrearCategoria(categoria);
  }

  const imagenUrl = archivo ? `/uploads/${archivo.filename}` : producto.imagen_url;
  // TASK-4.6: al reemplazar la imagen, la anterior deja de estar referenciada.
  if (archivo && producto.imagen_url && producto.imagen_url !== imagenUrl) {
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
      vendedorId,
    ]
  );

  return { ok: true };
}

/** GET /api/productos/mis-productos (RF54): productos del vendedor autenticado. */
export async function listarMisProductos({ vendedorId, pagina, limite }) {
  const offset = (pagina - 1) * limite;
  const [[totalRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM productos WHERE vendedor_id = ?",
    [vendedorId]
  );
  const total = Number(totalRow?.total || 0);
  const [productos] = await pool.query(
    `SELECT p.id, p.nombre, p.descripcion, p.imagen_url, p.precio, p.stock,
            p.estado, p.descuento_porcentaje, p.fecha_publicacion,
            p.pausado, p.eliminado_por_vendedor,
            c.id AS categoria_id, c.nombre AS categoria_nombre
       FROM productos p
       JOIN categorias c ON p.categoria_id = c.id
      WHERE p.vendedor_id = ?
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?`,
    [vendedorId, limite, offset]
  );

  return {
    productos: productos.map((p) => ({
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
  };
}

/**
 * PATCH /api/productos/:id/estado (RF55) - el vendedor pausa o reactiva su
 * publicacion sin borrarla. Un producto dado de baja por el vendedor no se
 * reactiva desde aqui.
 * @returns {Promise<{ ok: true, data: object } | { ok: false, code: string, mensaje: string }>}
 */
export async function cambiarEstadoProducto({ vendedorId, productoId, estado }) {
  const [productos] = await pool.query(
    "SELECT id, pausado, eliminado_por_vendedor FROM productos WHERE id = ? AND vendedor_id = ?",
    [productoId, vendedorId]
  );
  if (productos.length === 0) {
    return { ok: false, code: "NOT_FOUND", mensaje: "Producto no encontrado" };
  }
  if (productos[0].eliminado_por_vendedor === 1) {
    return {
      ok: false,
      code: "CONFLICT",
      mensaje: "El producto fue eliminado y no se puede reactivar",
    };
  }

  const pausado = estado === "pausado" ? 1 : 0;
  await pool.query("UPDATE productos SET pausado = ? WHERE id = ? AND vendedor_id = ?", [
    pausado,
    productoId,
    vendedorId,
  ]);

  return {
    ok: true,
    data: { id: productoId, estado: pausado ? "pausado" : "activo" },
  };
}

/**
 * DELETE /api/productos/:id (RF55) - baja logica propia del vendedor. No borra
 * la fila: conserva el historial de pedidos y calificaciones.
 * @returns {Promise<boolean>} true si se elimino; false si no existia/ya estaba eliminado.
 */
export async function eliminarProducto({ vendedorId, productoId }) {
  const [resultado] = await pool.query(
    `UPDATE productos
        SET eliminado_por_vendedor = 1, pausado = 1
      WHERE id = ? AND vendedor_id = ? AND eliminado_por_vendedor = 0`,
    [productoId, vendedorId]
  );
  return resultado.affectedRows !== 0;
}
