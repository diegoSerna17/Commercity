import { z } from "zod";
import pool from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";
import {
  encryptSensitive,
  decryptSensitive,
  maskBankAccount,
  maskFullName,
} from "../utils/crypto.js";
import { round2 } from "../utils/finanzas.js";

// ============================================================================
// MODULO TIENDA DEL VENDEDOR (integrado desde AVANCES/SPRING 1/ERICK/TIENDA)
// Fixes aplicados en la integracion (informe v1.0):
//   3.1: auth con el JWT_SECRET validado del backend central (authRequired).
//   3.2: clave de cifrado desde utils/config.js (RNF11), nunca hardcodeada.
//   3.5: sin pedidos.estado_pedido; el estado se lee de detalle_pedidos.estado_envio.
//   3.8: control de propiedad: vendedorId = req.userId (token).
//   3.9: sin endpoints que expongan pedidos ajenos.
// ============================================================================

const bancoSchema = z
  .object({
    titular_nombre: z.string().trim().min(3).max(100)
      .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/, "El titular solo puede contener letras y espacios"),
    banco: z.string().trim().min(3).max(50),
    tipo_cuenta: z.enum(["ahorros", "corriente"]),
    numero_cuenta: z.string().regex(/^\d+$/, "El número de cuenta solo puede contener dígitos")
      .min(6).max(20),
  })
  .strict();

const ESTADOS_VENTA = ["Pendiente", "En camino", "Entregado", "Cancelado"];

// ─────────────────────────────────────────────────────────────
// CUENTA BANCARIA (RF121-RF123, RNF11)
// ─────────────────────────────────────────────────────────────
async function buscarCuentaBancaria(usuarioId) {
  const [rows] = await pool.query(
    `SELECT id, usuario_id, titular_nombre, banco, tipo_cuenta, numero_cuenta,
            es_commercity, updated_at
       FROM datos_bancarios WHERE usuario_id = ? LIMIT 1`,
    [usuarioId]
  );
  return rows[0] || null;
}

function buildPrivateRecord(row) {
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    titular_nombre: decryptSensitive(row.titular_nombre),
    banco: row.banco,
    tipo_cuenta: row.tipo_cuenta,
    numero_cuenta: decryptSensitive(row.numero_cuenta),
    es_commercity: Boolean(row.es_commercity),
    updated_at: row.updated_at || null,
  };
}

function buildPublicRecord(row) {
  const rawNumero = decryptSensitive(row.numero_cuenta);
  const rawTitular = decryptSensitive(row.titular_nombre);
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    banco: row.banco,
    tipo_cuenta: row.tipo_cuenta,
    titular_nombre_enmascarado: maskFullName(rawTitular),
    numero_cuenta_enmascarado: maskBankAccount(rawNumero),
    ultimos4: rawNumero ? rawNumero.slice(-4) : null,
    es_commercity: Boolean(row.es_commercity),
    updated_at: row.updated_at || null,
    tiene_datos_registrados: Boolean(rawNumero && rawTitular),
  };
}

/** GET /api/tienda/mi-cuenta-bancaria (datos completos, solo el vendedor) */
export const getMiCuentaBancaria = async (req, res, next) => {
  try {
    const fila = await buscarCuentaBancaria(req.userId);
    if (!fila) {
      return successResponse(res, "Sin datos bancarios registrados", { registrado: false, datos: null });
    }
    return successResponse(res, "Cuenta bancaria obtenida", { registrado: true, datos: buildPrivateRecord(fila) });
  } catch (err) {
    next(err);
  }
};

/** GET /api/tienda/mi-cuenta-bancaria/masked (vista segura, RF122) */
export const getMiCuentaBancariaMasked = async (req, res, next) => {
  try {
    const fila = await buscarCuentaBancaria(req.userId);
    if (!fila) {
      return successResponse(res, "Sin datos bancarios registrados", { registrado: false, datos: null });
    }
    return successResponse(res, "Cuenta bancaria (enmascarada)", { registrado: true, datos: buildPublicRecord(fila) });
  } catch (err) {
    next(err);
  }
};

/** POST/PUT /api/tienda/mi-cuenta-bancaria (upsert transaccional) */
export const upsertMiCuentaBancaria = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const data = bancoSchema.parse(req.body);
    const usuarioId = req.userId;

    const encryptedTitular = encryptSensitive(data.titular_nombre);
    const encryptedNumero = encryptSensitive(data.numero_cuenta);

    await conn.beginTransaction();
    const [existing] = await conn.query(
      "SELECT id FROM datos_bancarios WHERE usuario_id = ? LIMIT 1",
      [usuarioId]
    );

    if (existing.length === 0) {
      await conn.query(
        `INSERT INTO datos_bancarios
           (usuario_id, titular_nombre, banco, tipo_cuenta, numero_cuenta, es_commercity)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [usuarioId, encryptedTitular, data.banco, data.tipo_cuenta, encryptedNumero]
      );
    } else {
      await conn.query(
        `UPDATE datos_bancarios
            SET titular_nombre = ?, banco = ?, tipo_cuenta = ?, numero_cuenta = ?,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND usuario_id = ?`,
        [encryptedTitular, data.banco, data.tipo_cuenta, encryptedNumero, existing[0].id, usuarioId]
      );
    }

    await conn.commit();

    const fila = await buscarCuentaBancaria(usuarioId);
    return successResponse(
      res,
      existing.length === 0 ? "Cuenta bancaria registrada correctamente." : "Cuenta bancaria actualizada correctamente.",
      { registrado: true, es_actualizacion: existing.length > 0, datos: buildPrivateRecord(fila) },
      existing.length === 0 ? 201 : 200
    );
  } catch (err) {
    await conn.rollback();
    if (err instanceof z.ZodError) {
      return errorResponse(res, "Datos de cuenta bancaria inválidos.", 400,
        err.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message })));
    }
    next(err);
  } finally {
    conn.release();
  }
};

// ─────────────────────────────────────────────────────────────
// HISTORIAL DE VENTAS (RF119/RF120) - solo del vendedor autenticado
// ─────────────────────────────────────────────────────────────
function parsePaginacion(query) {
  const pagina = Number(query.pagina ?? query.page ?? 1);
  const porPagina = Number(query.por_pagina ?? query.limit ?? 10);
  return {
    pagina: Math.max(1, Number.isFinite(pagina) ? pagina : 1),
    porPagina: Math.min(100, Math.max(1, Number.isFinite(porPagina) ? porPagina : 10)),
  };
}

export const getHistorialVentas = async (req, res, next) => {
  try {
    const vendedorId = req.userId;
    const { estado, fecha_desde, fecha_hasta, q } = req.query;
    const { pagina, porPagina } = parsePaginacion(req.query);

    const where = ["dp.vendedor_id = ?"];
    const params = [vendedorId];

    // RF129 (doc 20/08): la linea cancelada por el comprador desaparece de la
    // seccion Pedidos por defecto; solo se muestra si se filtra estado=Cancelado.
    if (estado && ESTADOS_VENTA.includes(String(estado))) {
      where.push("dp.estado_envio = ?");
      params.push(String(estado));
    } else {
      where.push("dp.estado_envio <> 'Cancelado'");
    }
    if (fecha_desde) {
      where.push("DATE(p.fecha_pedido) >= DATE(?)");
      params.push(String(fecha_desde));
    }
    if (fecha_hasta) {
      where.push("DATE(p.fecha_pedido) <= DATE(?)");
      params.push(String(fecha_hasta));
    }
    if (q && String(q).trim()) {
      const like = "%" + String(q).trim() + "%";
      where.push("(pr.nombre LIKE ? OR uc.nombre_completo LIKE ? OR ps.referencia_pago LIKE ?)");
      params.push(like, like, like);
    }
    const whereSQL = where.join(" AND ");

    const fromJoin = `
      FROM detalle_pedidos dp
      INNER JOIN pedidos p ON p.id = dp.pedido_id
      INNER JOIN productos pr ON pr.id = dp.producto_id
      LEFT JOIN pagos_simulados ps ON ps.pedido_id = p.id
      LEFT JOIN usuarios uc ON uc.id = p.comprador_id
      WHERE ${whereSQL}`;

    const [contador] = await pool.query("SELECT COUNT(*) AS total " + fromJoin, params);
    const totalRegistros = Number(contador[0]?.total || 0);
    const totalPaginas = Math.ceil(totalRegistros / porPagina) || 1;
    const offset = (pagina - 1) * porPagina;

    const [items] = await pool.query(
      `SELECT
         dp.id, dp.pedido_id,
         COALESCE(ps.referencia_pago, CONCAT('PED-', dp.pedido_id)) AS referencia_pedido,
         pr.nombre AS nombre_producto, pr.imagen_url AS url_imagen,
         dp.cantidad, dp.precio_unitario_historico AS valor_unitario,
         dp.subtotal AS valor_subtotal, dp.monto_vendedor, dp.monto_comision,
         uc.nombre_completo AS nombre_comprador, uc.email AS email_comprador,
         dp.estado_envio, p.fecha_pedido
       ` + fromJoin + `
       ORDER BY p.fecha_pedido DESC, dp.id DESC
       LIMIT ${porPagina} OFFSET ${offset}`,
      params
    );

    const [resumenRows] = await pool.query(
      `SELECT
         COUNT(*) AS total_ventas,
         COALESCE(SUM(dp.subtotal), 0) AS total_bruto,
         COALESCE(SUM(dp.monto_vendedor), 0) AS total_neto_vendedor,
         COALESCE(SUM(dp.monto_comision), 0) AS total_comision_plataforma
       ` + fromJoin, params
    );

    return successResponse(res, "Historial de ventas", {
      items: items.map((i) => ({
        ...i,
        cantidad: Number(i.cantidad),
        valor_unitario: Number(i.valor_unitario),
        valor_subtotal: Number(i.valor_subtotal),
        monto_vendedor: Number(i.monto_vendedor),
        monto_comision: Number(i.monto_comision),
      })),
      total_registros: totalRegistros,
      total_paginas: totalPaginas,
      pagina_actual: pagina,
      registros_por_pagina: porPagina,
      resumen: {
        total_ventas: Number(resumenRows[0]?.total_ventas || 0),
        total_bruto: Number(resumenRows[0]?.total_bruto || 0),
        total_neto_vendedor: Number(resumenRows[0]?.total_neto_vendedor || 0),
        total_comision_plataforma: Number(resumenRows[0]?.total_comision_plataforma || 0),
      },
      filtros_aplicados: { estado, fecha_desde, fecha_hasta, q },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// HISTORIAL DE INGRESOS 90% (RF121/RF123, RF122 sin datos bancarios)
// ─────────────────────────────────────────────────────────────
export const getHistorialIngresos = async (req, res, next) => {
  try {
    const vendedorId = req.userId;
    const { fecha_desde, fecha_hasta, agrupar_por = "transaccion" } = req.query;
    const { pagina, porPagina } = parsePaginacion(req.query);

    const where = ["dp.vendedor_id = ?"];
    const params = [vendedorId];
    if (fecha_desde) {
      where.push("DATE(p.fecha_pedido) >= DATE(?)");
      params.push(String(fecha_desde));
    }
    if (fecha_hasta) {
      where.push("DATE(p.fecha_pedido) <= DATE(?)");
      params.push(String(fecha_hasta));
    }
    const whereSQL = where.join(" AND ");

    const fromJoin = `
      FROM detalle_pedidos dp
      INNER JOIN pedidos p ON p.id = dp.pedido_id
      INNER JOIN productos pr ON pr.id = dp.producto_id
      LEFT JOIN pagos_simulados ps ON ps.pedido_id = p.id
      WHERE ${whereSQL}`;

    const [contador] = await pool.query("SELECT COUNT(*) AS total " + fromJoin, params);
    const totalRegistros = Number(contador[0]?.total || 0);
    const totalPaginas = Math.ceil(totalRegistros / porPagina) || 1;
    const offset = (pagina - 1) * porPagina;

    const [transacciones] = await pool.query(
      `SELECT
         dp.id AS transaccion_id, dp.pedido_id,
         COALESCE(ps.referencia_pago, CONCAT('PED-', dp.pedido_id)) AS referencia_pedido,
         p.fecha_pedido, dp.estado_envio,
         pr.nombre AS nombre_producto, pr.imagen_url AS url_imagen,
         dp.cantidad, dp.precio_unitario_historico, dp.descuento_aplicado,
         dp.subtotal AS valor_subtotal, dp.monto_vendedor, dp.monto_comision
       ` + fromJoin + `
       ORDER BY p.fecha_pedido DESC, dp.id DESC
       LIMIT ${porPagina} OFFSET ${offset}`,
      params
    );

    const [totalesRows] = await pool.query(
      `SELECT
         COUNT(dp.id) AS total_transacciones,
         COALESCE(SUM(dp.subtotal), 0) AS total_bruto,
         COALESCE(SUM(dp.monto_vendedor), 0) AS total_neto_vendedor,
         COALESCE(SUM(dp.monto_comision), 0) AS total_comision_plataforma
       ` + fromJoin, params
    );

    const periodo = [];
    if (String(agrupar_por) === "dia") {
      const [diario] = await pool.query(
        `SELECT
           DATE(p.fecha_pedido) AS fecha,
           COUNT(DISTINCT p.id) AS pedidos,
           COALESCE(SUM(dp.subtotal), 0) AS bruto,
           COALESCE(SUM(dp.monto_vendedor), 0) AS ganancia_neta,
           COALESCE(SUM(dp.monto_comision), 0) AS comision
         ` + fromJoin + `
         GROUP BY DATE(p.fecha_pedido)
         ORDER BY fecha DESC`,
        params
      );
      periodo.push(...diario);
    }

    const t = totalesRows[0] || {};
    const ganancias = Number(t.total_neto_vendedor || 0);
    const comision = Number(t.total_comision_plataforma || 0);
    const bruto = Number(t.total_bruto || 0);
    const consistente = Math.abs(bruto - (ganancias + comision)) <
      0.01 * Math.max(1, Number(t.total_transacciones || 1));

    return successResponse(res, "Historial de ingresos", {
      items: transacciones.map((x) => ({
        id: x.transaccion_id,
        pedido_id: x.pedido_id,
        referencia_pedido: x.referencia_pedido,
        fecha_pedido: x.fecha_pedido,
        estado_envio: x.estado_envio,
        nombre_producto: x.nombre_producto,
        url_imagen: x.url_imagen,
        cantidad: Number(x.cantidad),
        valor_unitario: Number(x.precio_unitario_historico),
        valor_subtotal: Number(x.valor_subtotal),
        monto_vendedor: Number(x.monto_vendedor),
        monto_comision: Number(x.monto_comision),
      })),
      total_registros: totalRegistros,
      total_paginas: totalPaginas,
      pagina_actual: pagina,
      registros_por_pagina: porPagina,
      resumen: {
        total_transacciones: Number(t.total_transacciones || 0),
        total_bruto: bruto,
        total_neto_vendedor: ganancias,
        total_comision_plataforma: comision,
        consistencia_90_10_validada: consistente,
      },
      periodo: periodo.map((d) => ({
        fecha: d.fecha,
        pedidos: Number(d.pedidos),
        bruto: Number(d.bruto),
        ganancia_neta: Number(d.ganancia_neta),
        comision: Number(d.comision),
      })),
      filtros_aplicados: { fecha_desde, fecha_hasta, agrupar_por },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// DASHBOARD (RF119) - tarjetas, por estado y ultimos 6 meses
// ─────────────────────────────────────────────────────────────
export const getDashboardStats = async (req, res, next) => {
  try {
    const vendedorId = req.userId;

    const [totalRows] = await pool.query(
      `SELECT
         COUNT(DISTINCT p.id) AS total_ventas,
         COALESCE(SUM(dp.subtotal), 0) AS total_bruto,
         COALESCE(SUM(dp.monto_vendedor), 0) AS total_neto_vendedor,
         COALESCE(SUM(dp.monto_comision), 0) AS total_comision,
         SUM(dp.cantidad) AS unidades_vendidas
       FROM detalle_pedidos dp
       INNER JOIN pedidos p ON p.id = dp.pedido_id
       WHERE dp.vendedor_id = ?`,
      [vendedorId]
    );

    const [porEstado] = await pool.query(
      `SELECT dp.estado_envio AS estado,
              COUNT(DISTINCT p.id) AS cantidad,
              COALESCE(SUM(dp.subtotal), 0) AS valor_subtotal
         FROM detalle_pedidos dp
         INNER JOIN pedidos p ON p.id = dp.pedido_id
        WHERE dp.vendedor_id = ?
        GROUP BY dp.estado_envio`,
      [vendedorId]
    );

    const [meses] = await pool.query(
      `SELECT DATE_FORMAT(p.fecha_pedido, '%Y-%m') AS mes,
              COALESCE(SUM(dp.monto_vendedor), 0) AS ganancias
         FROM detalle_pedidos dp
         INNER JOIN pedidos p ON p.id = dp.pedido_id
        WHERE dp.vendedor_id = ?
        GROUP BY DATE_FORMAT(p.fecha_pedido, '%Y-%m')
        ORDER BY mes DESC
        LIMIT 6`,
      [vendedorId]
    );

    const t = totalRows[0] || {};

    return successResponse(res, "Estadisticas de la tienda", {
      tarjetas: {
        total_ventas: Number(t.total_ventas || 0),
        unidades_vendidas: Number(t.unidades_vendidas || 0),
        total_bruto: round2(Number(t.total_bruto || 0)),
        total_neto_vendedor: round2(Number(t.total_neto_vendedor || 0)),
        total_comision: round2(Number(t.total_comision || 0)),
      },
      por_estado: porEstado.map((e) => ({
        estado: e.estado,
        cantidad: Number(e.cantidad),
        valor_subtotal: round2(Number(e.valor_subtotal || 0)),
      })),
      ultimos_6_meses: meses.map((m) => ({
        mes: m.mes,
        ganancias: round2(Number(m.ganancias)),
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// VALIDACION DE MI TIENDA (RF130-RF139) - integrado desde Erick (24/08)
// Endpoint de solo lectura: verifica la consistencia de Mi Tienda contra la
// BD real (cuenta bancaria, flujo 90/10 y devoluciones) sin mutar datos.
// ─────────────────────────────────────────────────────────────
const TOLERANCIA_CENTAVOS = 0.01;

/** Comprueba que la cuenta bancaria este registrada y sea utilizable (RF131-RF133). */
function validarCuentaBancaria(fila) {
  if (!fila) {
    return {
      registrada: false,
      completa: false,
      banco: null,
      tipo_cuenta: null,
      titular_enmascarado: null,
      numero_enmascarado: null,
      ultimos4: null,
      updated_at: null,
    };
  }
  const titular = decryptSensitive(fila.titular_nombre);
  const numero = decryptSensitive(fila.numero_cuenta);
  const completa = Boolean(
    titular && numero &&
    fila.banco && fila.tipo_cuenta &&
    ["ahorros", "corriente"].includes(fila.tipo_cuenta) &&
    /^\d{6,20}$/.test(String(numero))
  );
  return {
    registrada: true,
    completa,
    banco: fila.banco,
    tipo_cuenta: fila.tipo_cuenta,
    titular_enmascarado: maskFullName(titular),
    numero_enmascarado: maskBankAccount(numero),
    ultimos4: numero ? String(numero).slice(-4) : null,
    updated_at: fila.updated_at || null,
  };
}

/**
 * GET /api/tienda/validacion
 * Validacion integral de Mi Tienda contra la BD real (RF130-RF139):
 *  1. Cuenta bancaria del vendedor (RF131-RF133): registrada, completa y
 *     NUNCA expuesta en claro (RF138).
 *  2. Flujo 90/10 (RF136/RF139): cada linea de venta activa debe cumplir
 *     monto_vendedor + monto_comision == subtotal (tolerancia 1 centavo).
 *  3. Devoluciones (RF35/RF129/RF137): lineas canceladas, unidades de stock
 *     restituidas y pago reembolsado (descuento del 90% del vendedor).
 * El endpoint es de solo lectura y solo opera sobre el vendedor del token.
 */
export const getValidacionMiTienda = async (req, res, next) => {
  try {
    const vendedorId = req.userId;

    // --- 1. Cuenta bancaria (RF131-RF133, RF138) ---
    const [bancarias] = await pool.query(
      `SELECT id, usuario_id, titular_nombre, banco, tipo_cuenta, numero_cuenta,
              es_commercity, updated_at
         FROM datos_bancarios
        WHERE usuario_id = ?
        LIMIT 1`,
      [vendedorId]
    );
    const cuentaBancaria = validarCuentaBancaria(bancarias[0] || null);

    // --- 2. Flujo 90/10 (RF136/RF139) ---
    const [lineas] = await pool.query(
      `SELECT dp.id, dp.pedido_id, dp.producto_id, dp.cantidad, dp.subtotal,
              dp.monto_vendedor, dp.monto_comision, dp.estado_envio
         FROM detalle_pedidos dp
        WHERE dp.vendedor_id = ?
        ORDER BY dp.id`,
      [vendedorId]
    );

    const incoherencias = [];
    let lineasActivas = 0;
    let subtotalActivo = 0;
    let vendedorActivo = 0;
    let comisionActivo = 0;

    for (const l of lineas) {
      const subtotal = Number(l.subtotal || 0);
      const montoV = Number(l.monto_vendedor || 0);
      const montoC = Number(l.monto_comision || 0);
      const diferencia = round2(Math.abs(subtotal - (montoV + montoC)));

      if (l.estado_envio !== "Cancelado") {
        lineasActivas += 1;
        subtotalActivo = round2(subtotalActivo + subtotal);
        vendedorActivo = round2(vendedorActivo + montoV);
        comisionActivo = round2(comisionActivo + montoC);
      }

      if (diferencia > TOLERANCIA_CENTAVOS) {
        incoherencias.push({
          detalle_id: l.id,
          pedido_id: l.pedido_id,
          estado_envio: l.estado_envio,
          subtotal,
          monto_vendedor: montoV,
          monto_comision: montoC,
          diferencia,
        });
      }
    }

    // Consistencia global: el acumulado 90/10 sobre el subtotal activo cuadra
    // dentro de una tolerancia de redondeo de 1 centavo por linea.
    const flujoPorLineasValido = incoherencias.length === 0;
    const globalCoherente =
      Math.abs(subtotalActivo - (vendedorActivo + comisionActivo)) <=
      TOLERANCIA_CENTAVOS * Math.max(1, lineasActivas);

    // --- 3. Devoluciones (RF35/RF129/RF137) ---
    const [devoluciones] = await pool.query(
      `SELECT dp.id, dp.pedido_id, dp.cantidad, dp.subtotal, dp.monto_vendedor,
              dp.monto_comision, p.fecha_pedido, ps.estado AS estado_pago
         FROM detalle_pedidos dp
         INNER JOIN pedidos p ON p.id = dp.pedido_id
         LEFT JOIN pagos_simulados ps ON ps.pedido_id = p.id
        WHERE dp.vendedor_id = ? AND dp.estado_envio = 'Cancelado'
        ORDER BY dp.id`,
      [vendedorId]
    );

    const devolucion = devoluciones.reduce(
      (acc, d) => {
        acc.lineas_canceladas += 1;
        acc.unidades_restituidas_stock += Number(d.cantidad || 0);
        acc.monto_reembolsado = round2(acc.monto_reembolsado + Number(d.subtotal || 0));
        acc.monto_vendedor_descontado = round2(
          acc.monto_vendedor_descontado + Number(d.monto_vendedor || 0)
        );
        if (d.estado_pago === "Reembolsado") acc.pagos_marcados_reembolsados += 1;
        return acc;
      },
      {
        lineas_canceladas: 0,
        unidades_restituidas_stock: 0,
        monto_reembolsado: 0,
        monto_vendedor_descontado: 0,
        pagos_marcados_reembolsados: 0,
      }
    );

    const devolucionValida =
      devolucion.lineas_canceladas === 0 || devolucion.pagos_marcados_reembolsados > 0;

    const observaciones = [];
    if (!cuentaBancaria.registrada) {
      observaciones.push("El vendedor no ha registrado su cuenta bancaria (RF131).");
    } else if (!cuentaBancaria.completa) {
      observaciones.push("La cuenta bancaria registrada está incompleta o con formato inválido (RF132).");
    }
    if (!flujoPorLineasValido) {
      observaciones.push(
        `${incoherencias.length} línea(s) no cumplen monto_vendedor + monto_comision == subtotal (RF136/RF139).`
      );
    } else if (!globalCoherente) {
      observaciones.push("Los totales acumulados del 90/10 no cuadran con el subtotal activo (RF136/RF139).");
    }
    if (devolucion.lineas_canceladas > 0 && devolucion.pagos_marcados_reembolsados === 0) {
      observaciones.push("Existen líneas canceladas sin pago marcado como Reembolsado (RF35).");
    }

    const validado =
      cuentaBancaria.registrada &&
      cuentaBancaria.completa &&
      flujoPorLineasValido &&
      globalCoherente &&
      devolucionValida;

    return successResponse(res, "Validacion de Mi Tienda", {
      vendedor_id: vendedorId,
      cuenta_bancaria: cuentaBancaria,
      flujo_90_10: {
        lineas_analizadas: lineas.length,
        lineas_activas: lineasActivas,
        lineas_validas: lineas.length - incoherencias.length,
        lineas_incoherentes: incoherencias.length,
        incoherencias,
        totales: {
          subtotal: subtotalActivo,
          vendedor_90: vendedorActivo,
          vendedor_90_esperado: round2(subtotalActivo * 0.9),
          comision_10: comisionActivo,
          comision_10_esperada: round2(subtotalActivo * 0.1),
        },
        validado: flujoPorLineasValido && globalCoherente,
      },
      devoluciones: {
        ...devolucion,
        validado: devolucionValida,
      },
      validado,
      observaciones,
    });
  } catch (err) {
    next(err);
  }
};
