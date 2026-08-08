import pool from "../config/db.js";

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
export const getProductos = async (req, res) => {
  try {
    const pagina = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limite = Math.min(Math.max(parseInt(req.query.limit, 10) || 4, 1), 100);
    const offset = (pagina - 1) * limite;

    const nombre = String(req.query.nombre || "");
    const categoria = String(req.query.categoria || "");
    const vendedor = String(req.query.vendedor || "");

    const condiciones = [];
    const valores = [];

    if (nombre.trim() !== "") {
      condiciones.push("p.nombre LIKE ?");
      valores.push(`%${nombre}%`);
    }

    if (categoria.trim() !== "") {
      condiciones.push("c.nombre LIKE ?");
      valores.push(`%${categoria}%`);
    }

    if (vendedor.trim() !== "") {
      condiciones.push("v.nombre_completo LIKE ?");
      valores.push(`%${vendedor}%`);
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
    console.error("Error al obtener productos:", error.message);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Error al obtener productos" },
    });
  }
};

/**
 * Lista las categorias activas para el filtro del panel.
 */
export const getCategorias = async (_req, res) => {
  try {
    const [categorias] = await pool.query(`
      SELECT id, nombre
      FROM categorias
      WHERE activo = 1
      ORDER BY nombre ASC
    `);

    return res.json({ success: true, data: categorias });
  } catch (error) {
    console.error("Error al obtener categorías:", error.message);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Error al obtener las categorías" },
    });
  }
};

/**
 * Lista los vendedores activos para el filtro del panel.
 */
export const getVendedores = async (_req, res) => {
  try {
    const [vendedores] = await pool.query(`
      SELECT u.id, u.nombre_completo AS nombre
      FROM usuarios u
      INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
      INNER JOIN roles r ON r.id = ur.rol_id
      WHERE r.nombre = 'vendedor'
        AND u.activo = 1
      ORDER BY u.nombre_completo ASC
    `);

    return res.json({ success: true, data: vendedores });
  } catch (error) {
    console.error("Error al obtener vendedores:", error.message);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Error al obtener los vendedores" },
    });
  }
};
