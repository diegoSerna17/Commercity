import pool from "../config/db.js";

/**
 * Redondea un monto a 2 decimales (precision monetaria).
 * @param {number} numero - Monto a redondear
 * @returns {number} Monto redondeado
 */
function redondear2(numero) {
  return Math.round(numero * 100) / 100;
}

/**
 * Valida que un valor sea entero positivo.
 * @param {*} valor - Valor a validar
 * @returns {boolean} true si es entero > 0
 */
function esEnteroPositivo(valor) {
  return Number.isInteger(Number(valor)) && Number(valor) > 0;
}

/**
 * Obtiene el stock disponible de un producto activo (no eliminado por admin).
 * @param {number} productoId - ID del producto
 * @returns {Promise<number|null>} Stock disponible o null si no existe
 */
async function obtenerStock(productoId) {
  const [filas] = await pool.query(
    "SELECT stock FROM productos WHERE id = ? AND eliminado_por_admin = 0 LIMIT 1",
    [productoId]
  );
  return filas.length > 0 ? filas[0].stock : null;
}

/**
 * Verifica que el comprador exista y este activo.
 * @param {number} compradorId - ID del comprador
 * @returns {Promise<boolean>} true si el comprador existe y esta activo
 */
async function compradorExiste(compradorId) {
  const [filas] = await pool.query(
    "SELECT 1 FROM usuarios WHERE id = ? AND activo = 1 LIMIT 1",
    [compradorId]
  );
  return filas.length > 0;
}

/**
 * POST /api/carrito - Agrega un producto al carrito del comprador.
 * Si el producto ya esta en el carrito, incrementa la cantidad (upsert atomico).
 * Usa la UNIQUE KEY uq_comprador_producto del esquema real.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export async function agregarProducto(req, res) {
  const conexion = await pool.getConnection();
  try {
    const { comprador_id: compradorId, producto_id: productoId, cantidad = 1 } = req.body;

    if (
      !esEnteroPositivo(compradorId) ||
      !esEnteroPositivo(productoId) ||
      !esEnteroPositivo(cantidad)
    ) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "comprador_id, producto_id y cantidad deben ser enteros positivos" },
      });
    }

    const stock = await obtenerStock(productoId);
    if (stock === null) {
      return res.status(404).json({
        success: false,
        error: { code: "PRODUCT_NOT_FOUND", message: "El producto no existe o fue eliminado por el administrador" },
      });
    }

    if (!(await compradorExiste(compradorId))) {
      return res.status(404).json({
        success: false,
        error: { code: "COMPRADOR_NOT_FOUND", message: "El comprador no existe o esta inactivo" },
      });
    }

    await conexion.beginTransaction();

    // Bloqueo de fila para evitar inconsistencias por concurrencia
    const [existentes] = await conexion.query(
      "SELECT cantidad FROM carrito_items WHERE comprador_id = ? AND producto_id = ? FOR UPDATE",
      [compradorId, productoId]
    );

    const cantidadAcumulada = existentes.length > 0 ? existentes[0].cantidad + cantidad : cantidad;
    if (cantidadAcumulada > stock) {
      await conexion.rollback();
      return res.status(400).json({
        success: false,
        error: { code: "INSUFFICIENT_STOCK", message: `Stock insuficiente. Disponible: ${stock}` },
      });
    }

    await conexion.query(
      `INSERT INTO carrito_items (comprador_id, producto_id, cantidad)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)`,
      [compradorId, productoId, cantidad]
    );

    await conexion.commit();
    return res.status(201).json({
      success: true,
      message: "Producto agregado al carrito",
    });
  } catch (error) {
    await conexion.rollback();
    console.error("Error en agregarProducto:", error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Error interno del servidor" },
    });
  } finally {
    conexion.release();
  }
}

/**
 * DELETE /api/carrito/:productoId - Elimina un producto del carrito.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export async function eliminarProducto(req, res) {
  try {
    const compradorId = Number(req.query.comprador_id);
    const productoId = Number(req.params.productoId);

    if (!esEnteroPositivo(compradorId) || !esEnteroPositivo(productoId)) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "comprador_id y producto_id deben ser enteros positivos" },
      });
    }

    const [resultado] = await pool.query(
      "DELETE FROM carrito_items WHERE comprador_id = ? AND producto_id = ?",
      [compradorId, productoId]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: { code: "ITEM_NOT_FOUND", message: "El producto no esta en el carrito" },
      });
    }

    return res.json({ success: true, message: "Producto eliminado del carrito" });
  } catch (error) {
    console.error("Error en eliminarProducto:", error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Error interno del servidor" },
    });
  }
}

/**
 * PATCH /api/carrito/:productoId - Modifica la cantidad de un producto en el carrito.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export async function modificarCantidad(req, res) {
  const conexion = await pool.getConnection();
  try {
    const compradorId = Number(req.query.comprador_id);
    const productoId = Number(req.params.productoId);
    const { cantidad } = req.body;

    if (
      !esEnteroPositivo(compradorId) ||
      !esEnteroPositivo(productoId) ||
      !esEnteroPositivo(cantidad)
    ) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "comprador_id, producto_id y cantidad deben ser enteros positivos" },
      });
    }

    const stock = await obtenerStock(productoId);
    if (stock === null) {
      return res.status(404).json({
        success: false,
        error: { code: "PRODUCT_NOT_FOUND", message: "El producto no existe o fue eliminado por el administrador" },
      });
    }

    if (cantidad > stock) {
      return res.status(400).json({
        success: false,
        error: { code: "INSUFFICIENT_STOCK", message: `Stock insuficiente. Disponible: ${stock}` },
      });
    }

    await conexion.beginTransaction();

    // Verifica existencia con bloqueo para no depender de affectedRows del UPDATE
    const [existentes] = await conexion.query(
      "SELECT 1 FROM carrito_items WHERE comprador_id = ? AND producto_id = ? FOR UPDATE",
      [compradorId, productoId]
    );
    if (existentes.length === 0) {
      await conexion.rollback();
      return res.status(404).json({
        success: false,
        error: { code: "ITEM_NOT_FOUND", message: "El producto no esta en el carrito" },
      });
    }

    await conexion.query(
      "UPDATE carrito_items SET cantidad = ? WHERE comprador_id = ? AND producto_id = ?",
      [cantidad, compradorId, productoId]
    );

    await conexion.commit();
    return res.json({ success: true, message: "Cantidad actualizada" });
  } catch (error) {
    await conexion.rollback();
    console.error("Error en modificarCantidad:", error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Error interno del servidor" },
    });
  } finally {
    conexion.release();
  }
}

/**
 * GET /api/carrito - Lista el carrito del comprador agrupado por vendedor (RF109).
 * Calcula precio final con descuento (descuento_porcentaje) y el resumen global.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export async function listarCarrito(req, res) {
  try {
    const compradorId = Number(req.query.comprador_id);

    if (!esEnteroPositivo(compradorId)) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "comprador_id debe ser entero positivo" },
      });
    }

    const [items] = await pool.query(
      `SELECT
         ci.producto_id,
         ci.cantidad,
         p.nombre               AS producto_nombre,
         p.precio,
         p.descuento_porcentaje,
         p.imagen_url,
         p.vendedor_id,
         u.nombre_completo      AS vendedor_nombre
       FROM carrito_items ci
       JOIN productos  p ON p.id = ci.producto_id
       JOIN usuarios   u ON u.id = p.vendedor_id
       WHERE ci.comprador_id = ?
       ORDER BY u.nombre_completo, p.nombre`,
      [compradorId]
    );

    // Agrupar por vendedor (RF109) y calcular resumen con precio final
    const agrupado = {};
    for (const item of items) {
      const vendedorId = item.vendedor_id;
      if (!agrupado[vendedorId]) {
        agrupado[vendedorId] = {
          vendedor_id: vendedorId,
          vendedor_nombre: item.vendedor_nombre,
          subtotal: 0,
          items: [],
        };
      }

      const precioFinal = redondear2(
        Number(item.precio) * (1 - Number(item.descuento_porcentaje || 0) / 100)
      );
      const precioLinea = redondear2(precioFinal * item.cantidad);

      agrupado[vendedorId].subtotal = redondear2(agrupado[vendedorId].subtotal + precioLinea);
      agrupado[vendedorId].items.push({
        producto_id: item.producto_id,
        nombre: item.producto_nombre,
        precio: Number(item.precio),
        precio_final: precioFinal,
        descuento_porcentaje: Number(item.descuento_porcentaje || 0),
        imagen_url: item.imagen_url,
        cantidad: item.cantidad,
        subtotal_linea: precioLinea,
      });
    }

    const vendedores = Object.values(agrupado);
    const total = redondear2(vendedores.reduce((acc, v) => acc + v.subtotal, 0));

    return res.json({
      success: true,
      data: {
        vendedores,
        resumen: {
          cantidad_vendedores: vendedores.length,
          cantidad_items: items.length,
          subtotal_global: total,
          total,
        },
      },
    });
  } catch (error) {
    console.error("Error en listarCarrito:", error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Error interno del servidor" },
    });
  }
}
