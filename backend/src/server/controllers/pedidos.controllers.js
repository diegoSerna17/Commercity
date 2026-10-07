import { randomUUID } from "node:crypto";
import { z } from "zod";
import pool from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { calcularLinea, calcularTotales, validarLuhn, round2 } from "../utils/finanzas.js";
import { estadoPagoVendedorTrasCancelacion, importeReembolsoLinea } from "../utils/reembolsos.js";

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
    // Vendedor: "En camino" | "Entregado" (avanza 1 nivel).
    // Comprador: "Cancelado" (RF35 reembolso y restitución de stock).
    estado: z.enum(["En camino", "Entregado", "Cancelado"]),
    // Opcional. Solo se usa cuando estado = "Cancelado": si se pasa detalle_id
    // se cancela SOLO esa línea; si no, se cancela TODO el pedido
    // (líneas que aún no están Entregado).
    detalle_id: z.coerce.number().int().positive().optional(),
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

    // R1: el bloqueo RF74 de N consultas FOR UPDATE (una por item) se consolida
    // en UNA sentencia batch: mismo bloqueo de filas, mismo filtro SQL y el
    // mismo mensaje de error, sin N+1 de round-trips dentro de la transaccion
    // RF134. carrito_items no puede repetir producto (uq_comprador_producto),
    // por lo que cada producto aparece exactamente una vez.
    const [prods] = await conn.query(
      `SELECT id, vendedor_id, stock, eliminado_por_admin
         FROM productos
        WHERE id IN (${items.map(() => "?").join(",")})
          AND eliminado_por_admin = 0
          AND vendedor_id IN (SELECT id FROM usuarios WHERE activo = 1)
          FOR UPDATE`,
      items.map((item) => item.producto_id)
    );
    const prodsPorId = new Map(prods.map((p) => [Number(p.id), p]));

    for (const item of items) {
      // RF74: producto activo y vendedor activo (ausente del resultado = filtro).
      const prod = prodsPorId.get(Number(item.producto_id));
      if (!prod) {
        await conn.rollback();
        return errorResponse(res, `El producto ${item.producto_id} no está disponible (RF74)`, 409);
      }
      if (Number(prod.stock) < item.cantidad) {
        await conn.rollback();
        return errorResponse(
          res,
          `Stock insuficiente para el producto ${item.producto_id}: disponible ${prod.stock}, solicitado ${item.cantidad}`,
          409
        );
      }

      const linea = {
        ...item,
        vendedor_id: prod.vendedor_id,
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

    // RF140 + R1 (sin N+1): las lineas del detalle se insertan en UNA sentencia
    // multi-VALUES con montos 90/10 calculados por el backend (calcularLinea).
    await conn.query(
      `INSERT INTO detalle_pedidos
         (pedido_id, producto_id, vendedor_id, cantidad, precio_unitario_historico,
          descuento_aplicado, subtotal, monto_vendedor, monto_comision,
          estado_envio, estado_pago_vendedor)
       VALUES ${lineas
         .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', 'Pendiente')")
         .join(", ")}`,
      lineas.flatMap((l) => [
        pedidoId,
        l.producto_id,
        l.vendedor_id,
        l.cantidad,
        l.precioFinal,
        l.descuento_porcentaje,
        l.subtotal,
        l.montoVendedor,
        l.montoComision,
      ])
    );

    // Fix 3.6 + R1: descuento de stock de TODAS las lineas en UNA sentencia
    // (las filas ya estan bloqueadas y el stock validado en el batch FOR UPDATE).
    await conn.query(
      `UPDATE productos
          SET stock = stock - CASE id ${lineas.map(() => "WHEN ? THEN ?").join(" ")} END
        WHERE id IN (${lineas.map(() => "?").join(",")})`,
      lineas.flatMap((l) => [l.producto_id, l.cantidad]).concat(lineas.map((l) => l.producto_id))
    );

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

    // RF101/RF103: registrar notificación de compra al comprador. Un fallo aquí
    // no debe romper el pedido ya confirmado.
    try {
      await conn.query(
        `INSERT INTO notificaciones (usuario_id, tipo, descripcion, url_redireccion, estado)
         VALUES (?, ?, ?, ?, ?)`,
        [
          compradorId,
          "compra",
          `Tu pedido #${pedidoId} ha sido confirmado y está en preparación.`,
          "/history",
          "no leido",
        ]
      );
    } catch {
      // no romper la transacción por un fallo de notificación
    }

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

// La regla de estado de pago del vendedor (Pendiente|Desembolsado) y el calculo
// del importe reembolsado viven en utils/reembolsos.js (compartidos con RF135).

// ─────────────────────────────────────────────────────────────
// Camino 2 (RF35) — helpers de cancelación.
// Devuelven { error: { status, message } } o los datos resultantes;
// el rollback y la respuesta HTTP los maneja actualizarEstado.
// ─────────────────────────────────────────────────────────────

/**
 * Sub-caso A: cancela SOLO la línea indicada por detalle_id.
 * Restituye stock y marca la línea como Cancelada (RF35).
 */
async function cancelarUnaLinea(conn, id, detalle_id) {
  const [lineas] = await conn.query(
    `SELECT dp.id, dp.cantidad, dp.producto_id, dp.estado_envio, dp.vendedor_id,
            dp.estado_pago_vendedor, dp.subtotal, p.nombre AS producto_nombre
       FROM detalle_pedidos dp
       JOIN productos p ON p.id = dp.producto_id
      WHERE dp.id = ? AND dp.pedido_id = ?
        FOR UPDATE`,
    [detalle_id, id]
  );
  if (lineas.length === 0) {
    return {
      error: {
        status: 404,
        message: `Detalle #${detalle_id} no existe o no pertenece al pedido #${id}`,
      },
    };
  }
  const linea = lineas[0];

  // No se puede cancelar lo que ya está Entregado o ya Cancelado.
  if (linea.estado_envio === "Entregado" || linea.estado_envio === "Cancelado") {
    return {
      error: {
        status: 409,
        message: `Línea en estado '${linea.estado_envio}' no se puede cancelar`,
      },
    };
  }

  await conn.query(
    "UPDATE productos SET stock = stock + ? WHERE id = ?",
    [linea.cantidad, linea.producto_id]
  );
  // estado_pago_vendedor solo admite 'Pendiente' | 'Desembolsado' (ENUM real).
  const pagoVendedorLinea = estadoPagoVendedorTrasCancelacion(
    linea.estado_pago_vendedor
  );
  await conn.query(
    `UPDATE detalle_pedidos
        SET estado_envio = 'Cancelado',
            estado_pago_vendedor = ?
      WHERE id = ?`,
    [pagoVendedorLinea, linea.id]
  );

  return {
    lineasCanceladas: [
      {
        detalle_id: linea.id,
        producto_id: linea.producto_id,
        producto_nombre: linea.producto_nombre,
        cantidad: linea.cantidad,
        vendedor_id: linea.vendedor_id,
        subtotal: linea.subtotal,
      },
    ],
    lineasNoCanceladas: [],
  };
}

/**
 * Sub-caso B: cancela todas las líneas cancelables del pedido
 * (excluye Entregado y ya Cancelado). Si no hay ninguna cancelable, error 409.
 */
async function cancelarTodasLasLineas(conn, id) {
  const [todas] = await conn.query(
    `SELECT dp.id, dp.cantidad, dp.producto_id, dp.estado_envio, dp.vendedor_id,
            dp.estado_pago_vendedor, dp.subtotal, p.nombre AS producto_nombre
       FROM detalle_pedidos dp
       JOIN productos p ON p.id = dp.producto_id
      WHERE dp.pedido_id = ?
        FOR UPDATE`,
    [id]
  );

  const lineasCanceladas = [];
  const lineasNoCanceladas = [];

  for (const ln of todas) {
    if (ln.estado_envio === "Entregado" || ln.estado_envio === "Cancelado") {
      lineasNoCanceladas.push({
        detalle_id: ln.id,
        producto_nombre: ln.producto_nombre,
        motivo: ln.estado_envio === "Entregado" ? "Entregado" : "Ya estaba Cancelado",
      });
    } else {
      await conn.query(
        "UPDATE productos SET stock = stock + ? WHERE id = ?",
        [ln.cantidad, ln.producto_id]
      );
      const pagoVendedorLinea = estadoPagoVendedorTrasCancelacion(
        ln.estado_pago_vendedor
      );
      await conn.query(
        `UPDATE detalle_pedidos
            SET estado_envio = 'Cancelado',
                estado_pago_vendedor = ?
          WHERE id = ?`,
        [pagoVendedorLinea, ln.id]
      );
      lineasCanceladas.push({
        detalle_id: ln.id,
        producto_id: ln.producto_id,
        producto_nombre: ln.producto_nombre,
        cantidad: ln.cantidad,
        vendedor_id: ln.vendedor_id,
        subtotal: ln.subtotal,
      });
    }
  }

  if (lineasCanceladas.length === 0) {
    return {
      error: {
        status: 409,
        message:
          "Ninguna línea del pedido se puede cancelar (todas están Entregadas o Canceladas)",
      },
    };
  }
  return { lineasCanceladas, lineasNoCanceladas };
}

/**
 * Actualiza pagos_simulados segun lo que quedo en el pedido.
 * pagos_simulados.estado es ENUM('Aprobado','Rechazado','Pendiente','Reembolsado')
 * en la BD real: NO existe 'Parcial'.
 * Si TODO el pedido fue cancelado → 'Reembolsado'; si quedan lineas vivas →
 * 'Aprobado' (ver informes/PROPUESTA_MIGRACION_ENUM_ESTADOS.md, Opcion A).
 * S1 (mig 013): el IMPORTE reembolsado se ACUMULA en monto_reembolsado con el
 * importe de las lineas canceladas EN ESTA llamada (subtotal x 1.19 por linea),
 * para que la cancelacion parcial del comprador y la general registren el mismo
 * dinero devuelto. El criterio todo-o-nada del ESTADO se conserva.
 * H2: solo los pagos 'Aprobado' acumulan importe (lectura bloqueada FOR UPDATE,
 * race-safe); si el pago esta 'Pendiente'/'Rechazado' NO se muta y se reporta
 * su estado REAL y monto_reembolsado 0 (no se inventa dinero no registrado).
 * @param {Array<{subtotal: number|string}>} lineasCanceladas lineas canceladas en esta llamada
 * @returns {Promise<{estado: string, monto_reembolsado: number}>} estado REAL resultante del pago y el importe acumulado en esta llamada
 */
async function actualizarPagoTrasCancelacion(conn, id, lineasCanceladas) {
  const [restantes] = await conn.query(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN estado_envio = 'Entregado' THEN 1 ELSE 0 END) AS entregadas,
            SUM(CASE WHEN estado_envio = 'Cancelado' THEN 1 ELSE 0 END) AS canceladas
       FROM detalle_pedidos WHERE pedido_id = ?`,
    [id]
  );
  const r = restantes[0];
  const estadoCalculado =
    Number(r.canceladas) === Number(r.total) ? "Reembolsado" : "Aprobado";

  const [pagos] = await conn.query(
    "SELECT estado FROM pagos_simulados WHERE pedido_id = ? FOR UPDATE",
    [id]
  );
  const estadoPagoActual = pagos[0]?.estado;
  if (estadoPagoActual !== "Aprobado") {
    return { estado: estadoPagoActual || estadoCalculado, monto_reembolsado: 0 };
  }

  const importeReembolsado = round2(
    lineasCanceladas.reduce((acc, l) => acc + importeReembolsoLinea(l.subtotal), 0)
  );
  await conn.query(
    `UPDATE pagos_simulados
        SET estado = ?,
            monto_reembolsado = monto_reembolsado + ?
      WHERE pedido_id = ?`,
    [estadoCalculado, importeReembolsado, id]
  );
  return { estado: estadoCalculado, monto_reembolsado: importeReembolsado };
}

/**
 * Notificaciones fail-soft de la cancelacion (RF101/RF103):
 * 1) al comprador, 2) a cada vendedor afectado. Nunca rompe la transaccion.
 */
async function notificarCancelacion(conn, pedido, id, lineasCanceladas, nuevoEstadoPago) {
  try {
    const vendedoresAfectados = [...new Set(lineasCanceladas.map((l) => l.vendedor_id))];
    try {
      await conn.query(
        `INSERT INTO notificaciones (usuario_id, tipo, descripcion, url_redireccion, estado)
         VALUES (?, ?, ?, ?, ?)`,
        [
          pedido.comprador_id,
          "cancelado",
          `Pedido #${id}: ${lineasCanceladas.length} línea(s) cancelada(s). Estado pago: ${nuevoEstadoPago}.`,
          "/history",
          "no leido",
        ]
      );
    } catch { /* skip notif */ }

    for (const vid of vendedoresAfectados) {
      const countV = lineasCanceladas.filter((l) => l.vendedor_id === vid).length;
      try {
        await conn.query(
          `INSERT INTO notificaciones (usuario_id, tipo, descripcion, url_redireccion, estado)
           VALUES (?, ?, ?, ?, ?)`,
          [
            vid,
            "cancelado",
            `Pedido #${id}: ${countV} venta(s) cancelada(s) y reembolsada(s). Stock restituidos.`,
            "/store",
            "no leido",
          ]
        );
      } catch { /* skip notif */ }
    }
  } catch { /* skip all notifs */ }
}

// ─────────────────────────────────────────────────────────────
// Camino 1 (RF122-RF124) — helper de avance del vendedor.
// ─────────────────────────────────────────────────────────────

/**
 * Valida y aplica el avance UN nivel de las lineas del vendedor:
 * Pendiente -> En camino -> Entregado.
 * @returns {Promise<{error?: {status:number,message:string}, ids?: number[]}>}
 */
async function avanzarEnviosVendedor(conn, id, vendedorId, estado) {
  const [detalles] = await conn.query(
    `SELECT id, estado_envio
       FROM detalle_pedidos
      WHERE pedido_id = ? AND vendedor_id = ?
        FOR UPDATE`,
    [id, vendedorId]
  );

  if (detalles.length === 0) {
    return { error: { status: 404, message: "El vendedor no tiene envíos en este pedido" } };
  }

  for (const d of detalles) {
    if (d.estado_envio === "Cancelado") {
      return {
        error: { status: 409, message: "Un envío cancelado no puede cambiar de estado" },
      };
    }
    const actual = ESTADO_NIVEL[d.estado_envio];
    if (actual === undefined || ESTADO_NIVEL[estado] !== actual + 1) {
      return {
        error: {
          status: 409,
          message: `Transición inválida: ${d.estado_envio} -> ${estado}`,
        },
      };
    }
  }

  const ids = detalles.map((d) => d.id);
  await conn.query(
    `UPDATE detalle_pedidos SET estado_envio = ? WHERE id IN (${ids.map(() => "?").join(",")})`,
    [estado, ...ids]
  );
  return { ids };
}

/**
 * RF103: notifica al comprador el cambio de estado de su envio (fail-soft).
 */
async function notificarCambioEstado(conn, pedido, id, estado) {
  try {
    const compradorId = pedido.comprador_id;
    if (compradorId) {
      try {
        const descripcion =
          estado === "Entregado"
            ? `Tu pedido #${id} fue entregado`
            : `Tu pedido #${id} está en camino`;
        await conn.query(
          `INSERT INTO notificaciones (usuario_id, tipo, descripcion, url_redireccion, estado)
           VALUES (?, ?, ?, ?, ?)`,
          [compradorId, estado.toLowerCase(), descripcion, "/history", "no leido"]
        );
      } catch {
        // no romper el update
      }
    }
  } catch {
    // no romper el update
  }
}

/**
 * PATCH /api/pedidos/:id/estado
 * DOS caminos dentro del mismo endpoint:
 *  - Camino 1 (Vendedor / RF122-RF124): estado = "En camino" | "Entregado"
 *    Avanza UN nivel las líneas del vendedor autenticado:
 *      Pendiente -> En camino -> Entregado.
 *  - Camino 2 (Comprador / RF35): estado = "Cancelado"
 *    Cancela líneas del pedido (restituye stock, marca líneas, actualiza pago,
 *    notifica). Dos sub-casos:
 *      · body.detalle_id  -> cancela SOLO esa línea.
 *      · sin detalle_id   -> cancela TODO el pedido (líneas no Entregado).
 */
export const actualizarEstado = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { id } = parse(paramsIdSchema, req.params);
    const { estado, detalle_id } = parse(estadoSchema, req.body);

    await conn.beginTransaction();

    // Cargar pedido (comprador_id nos sirve para ambos caminos y para el RBAC).
    const [pedidos] = await conn.query(
      "SELECT id, comprador_id, fecha_pedido FROM pedidos WHERE id = ? FOR UPDATE",
      [id]
    );
    if (pedidos.length === 0) {
      await conn.rollback();
      return errorResponse(res, "Pedido no encontrado", 404);
    }
    const pedido = pedidos[0];

    // ─────────────────────────────────────────────────────────────
    // CAMINO 2 — Cancelación por el comprador (RF35)
    // ─────────────────────────────────────────────────────────────
    if (estado === "Cancelado") {
      // RBAC: solo el dueño del pedido puede cancelar.
      if (Number(pedido.comprador_id) !== Number(req.userId)) {
        await conn.rollback();
        return errorResponse(res, "Solo el comprador del pedido puede cancelarlo", 403);
      }

      // ── Sub-caso A: cancelar SOLO una línea por detalle_id ──
      // ── Sub-caso B: cancelar todo el pedido (líneas cancelables) ──
      const resultado =
        detalle_id !== undefined
          ? await cancelarUnaLinea(conn, id, detalle_id)
          : await cancelarTodasLasLineas(conn, id);
      if (resultado.error) {
        await conn.rollback();
        return errorResponse(res, resultado.error.message, resultado.error.status);
      }
      const { lineasCanceladas, lineasNoCanceladas } = resultado;

      // ── Actualizar pagos_simulados según lo que quedó en el pedido ──
      // S1: acumula el importe reembolsado de las lineas canceladas AHORA.
      // H4: la respuesta expone el mismo contrato que RF135 (estado_pago +
      // monto_reembolsado real registrado en esta llamada).
      const pagoResultado = await actualizarPagoTrasCancelacion(conn, id, lineasCanceladas);

      // ── Notificaciones fail-soft ──
      await notificarCancelacion(conn, pedido, id, lineasCanceladas, pagoResultado.estado);

      await conn.commit();
      return successResponse(res, "Cancelación procesada", {
        pedido_id: id,
        tipo: detalle_id !== undefined ? "por_linea" : "general",
        estado_pago: pagoResultado.estado,
        monto_reembolsado: pagoResultado.monto_reembolsado,
        lineas_canceladas: lineasCanceladas.length,
        detalle_ids_cancelados: lineasCanceladas.map((l) => l.detalle_id),
        no_canceladas: lineasNoCanceladas,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // CAMINO 1 — Vendedor avanza estado (Pendiente -> En camino -> Entregado)
    // ─────────────────────────────────────────────────────────────
    const vendedorId = req.userId;

    const avance = await avanzarEnviosVendedor(conn, id, vendedorId, estado);
    if (avance.error) {
      await conn.rollback();
      return errorResponse(res, avance.error.message, avance.error.status);
    }
    const ids = avance.ids;

    // RF103: notificar al comprador el cambio de estado de su envío.
    await notificarCambioEstado(conn, pedido, id, estado);

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
