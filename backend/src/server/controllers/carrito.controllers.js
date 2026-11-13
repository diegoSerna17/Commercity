import pool, { esPoolSaturado } from "../config/db.js";

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
 * Responde 503 cuando el pool esta saturado (cola llena); deja pasar el resto
 * de errores para que el llamador responda 500.
 * @param {import("express").Response} res
 * @param {unknown} error
 * @returns {boolean} true si ya respondio
 */
function responderPoolSaturado(res, error) {
  if (!esPoolSaturado(error)) return false;
  res.status(503).json({
    success: false,
    error: {
      code: "SERVICE_UNAVAILABLE",
      message: "Servicio temporalmente saturado. Intenta de nuevo en unos segundos.",
    },
  });
  return true;
}

/**
 * Obtiene stock y vendedor de un producto disponible: ni eliminado por el
 * administrador, ni dado de baja por el vendedor, ni pausado (RF55).
 * @param {number} productoId - ID del producto
 * @returns {Promise<{stock: number, vendedor_id: number}|null>} Datos o null si no existe
 */
async function obtenerProducto(productoId) {
  const [filas] = await pool.query(
    `SELECT stock, vendedor_id
       FROM productos
      WHERE id = ? AND eliminado_por_admin = 0
        AND eliminado_por_vendedor = 0 AND pausado = 0
      LIMIT 1`,
    [productoId]
  );
  return filas.length > 0 ? filas[0] : null;
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
  // A-1 (auditoria backend 1.5.5): las lecturas auxiliares se resuelven ANTES
  // de tomar la conexion del pool. Antes, pool.query() esperaba una conexion
  // libre mientras esta peticion retenia una; con trafico concurrente el pool
  // se agotaba (y la cola era infinita). La validacion sigue dentro del try
  // para conservar el contrato 500 SERVER_ERROR / 503 del controlador.
  // H1 (P0): el comprador se deriva del JWT (req.userId). Se ignora
  // cualquier comprador_id enviado por el cliente para cerrar el IDOR.
  const compradorId = Number(req.userId);
  const { producto_id: productoId, cantidad = 1 } = req.body;
  let conexion;

  try {
    if (!esEnteroPositivo(compradorId)) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "producto_id y cantidad deben ser enteros positivos" },
      });
    }

    const producto = await obtenerProducto(productoId);
    if (producto === null) {
      return res.status(404).json({
        success: false,
        error: { code: "PRODUCT_NOT_FOUND", message: "El producto no existe o no esta disponible" },
      });
    }

    // DEC-002/M-4: prohibida la autocompra (tambien se valida en confirmarPago).
    if (Number(producto.vendedor_id) === compradorId) {
      return res.status(400).json({
        success: false,
        error: { code: "AUTOCOMPRA", message: "No puedes agregar tus propios productos al carrito" },
      });
    }

    const stock = Number(producto.stock);
    if (!(await compradorExiste(compradorId))) {
      return res.status(404).json({
        success: false,
        error: { code: "COMPRADOR_NOT_FOUND", message: "El comprador no existe o esta inactivo" },
      });
    }

    conexion = await pool.getConnection();

    await conexion.beginTransaction();

    // Bloqueo de fila para evitar inconsistencias por concurrencia
    const [existentes] = await conexion.query(
      "SELECT cantidad FROM carrito_items WHERE comprador_id = ? AND producto_id = ? FOR UPDATE",
      [compradorId, productoId]
    );

    // B-9 (TASK-4.9): coercion numerica ANTES de sumar; un body con "3" no debe
    // concatenar strings ("83") ni romper la comparacion con el stock.
    const cantidadNumerica = Number(cantidad);
    const cantidadAcumulada = existentes.length > 0
      ? Number(existentes[0].cantidad) + cantidadNumerica
      : cantidadNumerica;
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
      [compradorId, productoId, cantidadNumerica]
    );

    await conexion.commit();
    return res.status(201).json({
      success: true,
      message: "Producto agregado al carrito",
    });
  } catch (error) {
    if (conexion) await conexion.rollback();
    if (responderPoolSaturado(res, error)) return;
    console.error("Error en agregarProducto:", error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Error interno del servidor" },
    });
  } finally {
    if (conexion) conexion.release();
  }
}

/**
 * DELETE /api/carrito/:productoId - Elimina un producto del carrito.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export async function eliminarProducto(req, res) {
  try {
    // H1 (P0): comprador desde JWT, nunca de query.
    const compradorId = Number(req.userId);
    const productoId = Number(req.params.productoId);

    if (!esEnteroPositivo(compradorId)) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "producto_id debe ser entero positivo" },
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
    if (responderPoolSaturado(res, error)) return;
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
  // A-1 (auditoria backend 1.5.5): producto y validaciones antes de retener
  // una conexion del pool (misma causa que en agregarProducto). La validacion
  // vive dentro del try para conservar el contrato 500 SERVER_ERROR / 503.
  // H1 (P0): comprador desde JWT, nunca de query.
  const compradorId = Number(req.userId);
  const productoId = Number(req.params.productoId);
  const { cantidad } = req.body;
  let conexion;

  try {
    if (!esEnteroPositivo(compradorId)) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "producto_id y cantidad deben ser enteros positivos" },
      });
    }

    const producto = await obtenerProducto(productoId);
    if (producto === null) {
      return res.status(404).json({
        success: false,
        error: { code: "PRODUCT_NOT_FOUND", message: "El producto no existe o no esta disponible" },
      });
    }

    // B-9: coercion numerica antes de comparar/actualizar.
    const cantidadNumerica = Number(cantidad);
    if (cantidadNumerica > producto.stock) {
      return res.status(400).json({
        success: false,
        error: { code: "INSUFFICIENT_STOCK", message: `Stock insuficiente. Disponible: ${producto.stock}` },
      });
    }

    conexion = await pool.getConnection();
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
      [cantidadNumerica, compradorId, productoId]
    );

    await conexion.commit();
    return res.json({ success: true, message: "Cantidad actualizada" });
  } catch (error) {
    if (conexion) await conexion.rollback();
    if (responderPoolSaturado(res, error)) return;
    console.error("Error en modificarCantidad:", error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Error interno del servidor" },
    });
  } finally {
    if (conexion) conexion.release();
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
    // H1 (P0): comprador desde JWT, nunca de query.
    const compradorId = Number(req.userId);

    if (!esEnteroPositivo(compradorId)) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Token no autorizado" },
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
         u.nombre_completo      AS vendedor_nombre,
         p.eliminado_por_admin,
         p.eliminado_por_vendedor,
         p.pausado,
         u.activo
       FROM carrito_items ci
       JOIN productos  p ON p.id = ci.producto_id
       JOIN usuarios   u ON u.id = p.vendedor_id
       WHERE ci.comprador_id = ?
       ORDER BY u.nombre_completo, p.nombre`,
      [compradorId]
    );

    // M-6: el listado conserva TODOS los items (el comprador debe poder ver y
    // quitar los que ya no se pueden comprar), pero solo los disponibles
    // suman al subtotal y a los contadores del resumen.
    const estaDisponible = (item) =>
      Number(item.eliminado_por_admin) === 0 &&
      Number(item.eliminado_por_vendedor) === 0 &&
      Number(item.pausado) === 0 &&
      Number(item.activo) === 1;

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

      const disponible = estaDisponible(item);
      const precioFinal = redondear2(
        Number(item.precio) * (1 - Number(item.descuento_porcentaje || 0) / 100)
      );
      const precioLinea = disponible
        ? redondear2(precioFinal * item.cantidad)
        : 0;

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
        disponible,
      });
    }

    const vendedores = Object.values(agrupado);
    const total = redondear2(vendedores.reduce((acc, v) => acc + v.subtotal, 0));

    // Solo cuentan los items comprables y los vendedores con al menos uno.
    const itemsDisponibles = items.filter(estaDisponible);
    const vendedoresDisponibles = new Set(
      itemsDisponibles.map((item) => item.vendedor_id)
    ).size;

    return res.json({
      success: true,
      data: {
        vendedores,
        resumen: {
          cantidad_vendedores: vendedoresDisponibles,
          cantidad_items: itemsDisponibles.length,
          subtotal_global: total,
          total,
        },
      },
    });
  } catch (error) {
    if (responderPoolSaturado(res, error)) return;
    console.error("Error en listarCarrito:", error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Error interno del servidor" },
    });
  }
}
