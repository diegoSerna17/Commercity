import { randomUUID } from "node:crypto";
import { z } from "zod";
import pool from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { calcularLinea, calcularTotales, validarLuhn, round2 } from "../utils/finanzas.js";

// ============================================================================
// MODULO DE PEDIDOS Y PAGO (integrado desde AVANCES/SPRING 1/CARLOS VIDAL/Entrega)
// Fixes aplicados en la integracion (informe v1.0):
//   3.2: sin pedidos.estado_pedido (RF119: estados por linea estado_envio).
//   3.4: rutas protegidas con authRequired; comprador/vendedor salen del token.
//   3.5: INSERT a detalle_pedidos sin columnas GENERATED ni imagen_url.
//   3.6: RF134 ACID - crear pedido + lineas + descontar stock + registrar pago
//        en UNA transaccion con FOR UPDATE.
//   3.8: RF74 - solo productos no suspendidos y vendedores activos.
//   3.10: el pago se aprueba solo tras validar la tarjeta (Luhn, RF118).
//   3.11: redondeo round2 en todos los montos.
// ============================================================================

const confirmarPagoSchema = z
  .object({
    direccion_envio: z.string().trim().min(5).max(1000),
    metodo_pago: z.enum(["tarjeta", "transferencia", "pse"]),
    numero_tarjeta: z.string().trim().optional(),
    nombre_tarjeta: z.string().trim().max(100).optional(),
  })
  .strict();

const estadoSchema = z
  .object({
    estado: z.enum(["En camino", "Entregado"]),
  })
  .strict();

const ESTADO_NIVEL = { Pendiente: 0, "En camino": 1, Entregado: 2 };

/**
 * Consulta los items del carrito del comprador autenticado.
 * El filtro RF74 (productos suspendidos / vendedores inactivos) se aplica en la
 * consulta FOR UPDATE de confirmarPago, donde se bloquean las filas.
 * @param {import("mysql2/promise").PoolConnection} conn
 * @param {number} compradorId
 */
async function getItemsCarrito(conn, compradorId) {
  const [items] = await conn.query(
    `SELECT ci.producto_id, ci.cantidad, p.nombre, p.imagen_url, p.precio,
            p.descuento_porcentaje, p.vendedor_id, p.stock
       FROM carrito_items ci
       JOIN productos p ON p.id = ci.producto_id
      WHERE ci.comprador_id = ?
      ORDER BY p.id`,
    [compradorId]
  );
  return items;
}

/**
 * GET /api/pedidos/resumen
 * Resumen del carrito agrupado por vendedor con desglose de IVA y 90/10 en
 * vuelo (RF113/RF114/RF117/RF134). Solo lectura, no muta nada.
 */
export const getResumenCarrito = async (req, res, next) => {
  try {
    const compradorId = req.userId;

    const [items] = await pool.query(
      `SELECT ci.producto_id, ci.cantidad, p.nombre, p.imagen_url, p.precio,
              p.descuento_porcentaje, p.vendedor_id, u.nombre_completo AS vendedor_nombre,
              p.stock, p.eliminado_por_admin, u.activo
         FROM carrito_items ci
         JOIN productos p ON p.id = ci.producto_id
         JOIN usuarios u ON u.id = p.vendedor_id
        WHERE ci.comprador_id = ?
        ORDER BY p.vendedor_id, p.id`,
      [compradorId]
    );

    // RF74: excluir productos suspendidos o de vendedores inactivos
    const itemsValidos = items.filter(
      (i) => Number(i.eliminado_por_admin) === 0 && Number(i.activo) === 1
    );

    const lineas = itemsValidos.map((i) => ({
      ...i,
      ...calcularLinea(Number(i.precio), Number(i.descuento_porcentaje), i.cantidad),
    }));

    const totales = calcularTotales(lineas);

    const porVendedor = Object.values(
      lineas.reduce((acc, l) => {
        if (!acc[l.vendedor_id]) {
          acc[l.vendedor_id] = { vendedor_id: l.vendedor_id, vendedor_nombre: l.vendedor_nombre, items: [] };
        }
        acc[l.vendedor_id].items.push(l);
        return acc;
      }, {})
    );

    return successResponse(res, "Resumen del carrito", {
      comprador_id: compradorId,
      por_vendedor: porVendedor,
      totales,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/pedidos/confirmar-pago
 * RF134 (ACID sugerido por el Director): crea el pedido, las lineas de detalle,
 * descuenta el stock y registra el pago en UNA transaccion con FOR UPDATE.
 * RF118: si el metodo es tarjeta, valida Luhn antes de aprobar el pago.
 */
export const confirmarPago = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const data = parse(confirmarPagoSchema, req.body);
    const compradorId = req.userId;

    // RF118: forma academica; la tarjeta nunca se persiste.
    if (data.metodo_pago === "tarjeta") {
      const numero = String(data.numero_tarjeta || "").replace(/\s/g, "");
      if (!/^\d{13,19}$/.test(numero) || !data.nombre_tarjeta) {
        return errorResponse(
          res, "Número de tarjeta (13-19 dígitos) y nombre del titular son obligatorios (RF118)", 400
        );
      }
      if (!validarLuhn(numero)) {
        return res.status(402).json({
          success: false,
          error: { code: "PAGO_RECHAZADO", message: "La pasarela rechazó la tarjeta (Luhn inválido)" }
        });
      }
    }

    await conn.beginTransaction();

    const items = await getItemsCarrito(conn, compradorId);
    if (items.length === 0) {
      await conn.rollback();
      return errorResponse(res, "El carrito del comprador está vacío o no tiene productos disponibles", 400, [
        { campo: "carrito", mensaje: "CARRITO_VACIO" },
      ]);
    }

    const lineas = [];
    let totalNeto = 0;
    let totalIva = 0;

    for (const item of items) {
      // RF74 + bloqueo de fila: producto activo y vendedor activo
      const [prods] = await conn.query(
        `SELECT id, vendedor_id, stock, eliminado_por_admin
           FROM productos
          WHERE id = ?
            AND eliminado_por_admin = 0
            AND vendedor_id IN (SELECT id FROM usuarios WHERE activo = 1)
            FOR UPDATE`,
        [item.producto_id]
      );
      if (prods.length === 0) {
        await conn.rollback();
        return errorResponse(res, `El producto ${item.producto_id} no está disponible (RF74)`, 409);
      }
      if (Number(prods[0].stock) < item.cantidad) {
        await conn.rollback();
        return errorResponse(
          res,
          `Stock insuficiente para el producto ${item.producto_id}: disponible ${prods[0].stock}, solicitado ${item.cantidad}`,
          409
        );
      }

      const linea = {
        ...item,
        vendedor_id: prods[0].vendedor_id,
        ...calcularLinea(Number(item.precio), Number(item.descuento_porcentaje), item.cantidad),
      };
      lineas.push(linea);
      totalNeto = round2(totalNeto + linea.subtotal);
      totalIva = round2(totalIva + linea.iva);
    }

    const [resultadoPedido] = await conn.query(
      `INSERT INTO pedidos (comprador_id, direccion_envio, total_neto, fecha_pedido)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [compradorId, data.direccion_envio, totalNeto]
    );
    const pedidoId = resultadoPedido.insertId;

    // Fix 3.5: sin columnas GENERATED STORED ni imagen_url en detalle_pedidos.
    for (const l of lineas) {
      await conn.query(
        `INSERT INTO detalle_pedidos
           (pedido_id, producto_id, vendedor_id, cantidad, precio_unitario_historico,
            descuento_aplicado, subtotal, estado_envio, estado_pago_vendedor)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendiente', 'Pendiente')`,
        [
          pedidoId,
          l.producto_id,
          l.vendedor_id,
          l.cantidad,
          l.precioFinal,
          l.descuento_porcentaje,
          l.subtotal,
        ]
      );
    }

    // Fix 3.6 (ACID): descuento de stock dentro de la misma transaccion.
    for (const l of lineas) {
      await conn.query(
        "UPDATE productos SET stock = stock - ? WHERE id = ?",
        [l.cantidad, l.producto_id]
      );
    }

    const totalConIva = round2(totalNeto + totalIva);
    const referenciaPago = `PAG-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;

    // Fix 3.10: el pago se registra Aprobado solo tras validar la pasarela (Luhn).
    await conn.query(
      `INSERT INTO pagos_simulados (pedido_id, metodo_pago, referencia_pago, monto, estado)
       VALUES (?, ?, ?, ?, 'Aprobado')`,
      [pedidoId, data.metodo_pago, referenciaPago, totalConIva]
    );

    // El carrito se consume al confirmar la compra
    await conn.query("DELETE FROM carrito_items WHERE comprador_id = ?", [compradorId]);

    await conn.commit();

    return successResponse(res, "Pago confirmado y pedido creado con éxito", {
      pedido_id: pedidoId,
      referencia_pago: referenciaPago,
      metodo_pago: data.metodo_pago,
      estado_pago: "Aprobado",
      total_neto: totalNeto,
      iva: totalIva,
      total: totalConIva,
      numero_items: lineas.length,
      distribucion_90_10: {
        total_vendedores: round2(lineas.reduce((acc, l) => acc + l.montoVendedor, 0)),
        total_comision_commercity: round2(lineas.reduce((acc, l) => acc + l.montoComision, 0)),
      },
    }, 201);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * PATCH /api/pedidos/:id/estado  (RF122/RF124)
 * El vendedor avanza UN nivel el estado de SUS envios en el pedido:
 * Pendiente -> En camino -> Entregado. El id del vendedor sale del token.
 */
export const actualizarEstado = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { id } = parse(paramsIdSchema, req.params);
    const { estado } = parse(estadoSchema, req.body);
    const vendedorId = req.userId;

    await conn.beginTransaction();

    const [detalles] = await conn.query(
      `SELECT id, estado_envio
         FROM detalle_pedidos
        WHERE pedido_id = ? AND vendedor_id = ?
          FOR UPDATE`,
      [id, vendedorId]
    );

    if (detalles.length === 0) {
      await conn.rollback();
      return errorResponse(res, "El vendedor no tiene envíos en este pedido", 404);
    }

    for (const d of detalles) {
      if (d.estado_envio === "Cancelado") {
        await conn.rollback();
        return errorResponse(res, "Un envío cancelado no puede cambiar de estado", 409);
      }
      const actual = ESTADO_NIVEL[d.estado_envio];
      if (actual === undefined || ESTADO_NIVEL[estado] !== actual + 1) {
        await conn.rollback();
        return errorResponse(res, `Transición inválida: ${d.estado_envio} -> ${estado}`, 409);
      }
    }

    const ids = detalles.map((d) => d.id);
    await conn.query(
      `UPDATE detalle_pedidos SET estado_envio = ? WHERE id IN (${ids.map(() => "?").join(",")})`,
      [estado, ...ids]
    );

    await conn.commit();
    return successResponse(res, "Estado de envío actualizado", {
      pedido_id: id,
      estado_envio: estado,
      envios_actualizados: ids.length,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const paramsIdSchema = z.object({ id: z.coerce.number().int().positive() });

const parse = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    const err = new Error(message);
    err.httpStatus = 400;
    err.errorCode = "VALIDATION_ERROR";
    throw err;
  }
  return result.data;
};
