/**
 * TASK-3.9 (auditoria 2026-10-11): pruebas de integracion con MySQL REAL y
 * DESECHABLE (TEST_DB_*). Reproducen primero y verifican despues los hallazgos
 * de dinero y concurrencia:
 *   - reembolso proporcional de 2 y 3 lineas (A-2/A-3),
 *   - doble confirmarPago simultaneo del mismo comprador (A-1),
 *   - baneo de un vendedor con lineas en varios pedidos (A-3/M-1/DEC-004).
 *
 * Reglas:
 *   - JAMAS corre contra la BD compartida: solo contra TEST_DB_HOST/NAME.
 *   - Sin TEST_DB_* la suite se SALTA (un clon limpio no necesita MySQL).
 *   - Prepara la BD con el esquema+seed antes de correr:
 *       $env:TEST_DB_NAME="commercity_dev"; npm run test:integration
 *
 * Variables: TEST_DB_HOST, TEST_DB_PORT, TEST_DB_USER, TEST_DB_PASSWORD,
 * TEST_DB_NAME.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

const TEST_DB = {
  host: process.env.TEST_DB_HOST,
  port: process.env.TEST_DB_PORT ? Number(process.env.TEST_DB_PORT) : 3306,
  user: process.env.TEST_DB_USER,
  password: process.env.TEST_DB_PASSWORD || "",
  database: process.env.TEST_DB_NAME,
};

const habilitado = Boolean(TEST_DB.host && TEST_DB.user && TEST_DB.database);

describe.skipIf(!habilitado)("integracion MySQL real: dinero y concurrencia", () => {
  let app;
  let pool;
  let raw;
  let categoriaId;
  let compradorId;
  let comprador2Id;
  let vendedorId;
  let vendedor2Id;
  let tokenComprador;
  let tokenComprador2;

  const marca = `itest_${Date.now().toString(36)}`;
  const usuarioIds = [];
  const productoIds = [];
  const pedidoIds = [];

  const tokenDe = (id, email) =>
    jwt.sign({ id, email , token_version: 0}, process.env.JWT_SECRET, { issuer: "commercity-api", audience: "commercity-clients", expiresIn: "1h" });

  const crearUsuario = async (etiqueta) => {
    const email = `${marca}_${etiqueta}@test.local`;
    const [r] = await raw.query(
      "INSERT INTO usuarios (email, password, nombre_completo, activo) VALUES (?, 'hash_solo_itest', ?, 1)",
      [email, `Usuario ${etiqueta} ${marca}`]
    );
    usuarioIds.push(r.insertId);
    return { id: r.insertId, email };
  };

  const crearProducto = async (vendedor, precio) => {
    const [r] = await raw.query(
      `INSERT INTO productos
         (vendedor_id, categoria_id, nombre, descripcion, imagen_url, precio, stock, descuento_porcentaje)
       VALUES (?, ?, ?, 'producto de integracion', 'https://example.invalid/itest.png', ?, 100, 0)`,
      [vendedor, categoriaId, `${marca}_prod_${productoIds.length}`, precio]
    );
    productoIds.push(r.insertId);
    return r.insertId;
  };

  const alCarrito = async (comprador, productoId, cantidad) => {
    await raw.query(
      "INSERT INTO carrito_items (comprador_id, producto_id, cantidad) VALUES (?, ?, ?)",
      [comprador, productoId, cantidad]
    );
  };

  const confirmarPago = async (token) => {
    const res = await request(app)
      .post("/api/pedidos/confirmar-pago")
      .set("Authorization", `Bearer ${token}`)
      .send({ direccion_envio: "Calle Integracion 123 # 45-67", metodo_pago: "pse" });
    if (res.body?.data?.pedido_id) pedidoIds.push(res.body.data.pedido_id);
    return res;
  };

  const cancelarLinea = (token, pedidoId, detalleId) =>
    request(app)
      .patch(`/api/pedidos/${pedidoId}/estado`)
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "Cancelado", detalle_id: detalleId });

  const leerPago = async (pedidoId) => {
    const [rows] = await raw.query(
      "SELECT estado, monto, monto_reembolsado FROM pagos_simulados WHERE pedido_id = ?",
      [pedidoId]
    );
    return rows[0];
  };

  const leerLineas = async (pedidoId) => {
    const [rows] = await raw.query(
      "SELECT id, estado_envio, subtotal FROM detalle_pedidos WHERE pedido_id = ? ORDER BY id",
      [pedidoId]
    );
    return rows;
  };

  beforeAll(async () => {
    // 1. El pool de la app debe apuntar a la BD desechable ANTES de importarla.
    process.env.DB_HOST = TEST_DB.host;
    process.env.DB_PORT = String(TEST_DB.port || 3306);
    process.env.DB_USER = TEST_DB.user;
    process.env.DB_PASSWORD = TEST_DB.password;
    process.env.DB_NAME = TEST_DB.database;
    process.env.NODE_ENV = "test";

    ({ default: app } = await import("../../app.js"));
    ({ default: pool } = await import("../../config/db.js"));

    raw = await mysql.createConnection({ ...TEST_DB });

    // 2. Guarda: la BD debe tener el esquema cargado.
    try {
      await raw.query("SELECT 1 FROM usuarios LIMIT 1");
    } catch {
      throw new Error(
        `TEST_DB_NAME="${TEST_DB.database}" no tiene el esquema de CommerCity. ` +
          "Cargue schema_commercity.sql (y seed) en una BD local desechable."
      );
    }

    const [cat] = await raw.query(
      "INSERT INTO categorias (nombre, descripcion) VALUES (?, 'categoria de integracion')",
      [`${marca}_cat`]
    );
    categoriaId = cat.insertId;

    const vendedor = await crearUsuario("vendedor");
    vendedorId = vendedor.id;
    const comprador = await crearUsuario("comprador");
    compradorId = comprador.id;
    const comprador2 = await crearUsuario("comprador2");
    comprador2Id = comprador2.id;

    tokenComprador = tokenDe(compradorId, comprador.email);
    tokenComprador2 = tokenDe(comprador2Id, comprador2.email);
  });

  afterAll(async () => {
    if (pool) await pool.end();
    if (!raw) return;

    const limpiar = async (sql, params) => {
      if (params[0]?.length === 0) return;
      try {
        await raw.query(sql, params);
      } catch {
        // la limpieza no debe tapar el resultado de los tests
      }
    };
    await limpiar("DELETE FROM notificaciones WHERE usuario_id IN (?)", [usuarioIds]);
    await limpiar("DELETE FROM detalle_pedidos WHERE pedido_id IN (?)", [pedidoIds]);
    await limpiar("DELETE FROM pagos_simulados WHERE pedido_id IN (?)", [pedidoIds]);
    await limpiar("DELETE FROM pedidos WHERE id IN (?)", [pedidoIds]);
    await limpiar("DELETE FROM carrito_items WHERE comprador_id IN (?)", [
      [compradorId, comprador2Id].filter(Boolean),
    ]);
    await limpiar("DELETE FROM productos WHERE id IN (?)", [productoIds]);
    await limpiar("DELETE FROM usuario_roles WHERE usuario_id IN (?)", [usuarioIds]);
    await limpiar("DELETE FROM usuarios WHERE id IN (?)", [usuarioIds]);
    if (categoriaId) {
      await limpiar("DELETE FROM categorias WHERE id = ?", [[categoriaId]]);
    }
    await raw.end();
  });

  it("A-2: reembolso proporcional de 2 lineas acumula por monto y cierra en Reembolsado", async () => {
    const p1 = await crearProducto(vendedorId, 119000); // subtotal 100000.00
    const p2 = await crearProducto(vendedorId, 238000); // subtotal 200000.00
    await alCarrito(compradorId, p1, 1);
    await alCarrito(compradorId, p2, 1);

    const pagoRes = await confirmarPago(tokenComprador);
    expect(pagoRes.status).toBe(201);
    const pedidoId = pagoRes.body.data.pedido_id;

    const pagoInicial = await leerPago(pedidoId);
    expect(Number(pagoInicial.monto_reembolsado)).toBe(0);
    expect(pagoInicial.estado).toBe("Aprobado");

    const lineas = await leerLineas(pedidoId);
    expect(lineas).toHaveLength(2);

    // 1) Cancelar la primera linea: 100000 x 1.19 = 119000 < 357000 (monto).
    const r1 = await cancelarLinea(tokenComprador, pedidoId, lineas[0].id);
    expect(r1.status).toBe(200);
    expect(r1.body.data.estado_pago).toBe("Aprobado");
    const pago1 = await leerPago(pedidoId);
    expect(Number(pago1.monto_reembolsado)).toBeCloseTo(119000, 2);
    expect(pago1.estado).toBe("Aprobado");

    // 2) Cancelar la segunda: 200000 x 1.19 = 238000; acumulado = monto -> Reembolsado.
    const r2 = await cancelarLinea(tokenComprador, pedidoId, lineas[1].id);
    expect(r2.status).toBe(200);
    expect(r2.body.data.estado_pago).toBe("Reembolsado");
    const pago2 = await leerPago(pedidoId);
    expect(Number(pago2.monto_reembolsado)).toBeCloseTo(Number(pago2.monto), 2);
    expect(pago2.estado).toBe("Reembolsado");
  });

  it("A-2: reembolso proporcional de 3 lineas no cierra el pago hasta cubrir el monto", async () => {
    const p1 = await crearProducto(vendedorId, 119000); // 100000
    const p2 = await crearProducto(vendedorId, 238000); // 200000
    const p3 = await crearProducto(vendedorId, 595000); // 500000
    await alCarrito(compradorId, p1, 1);
    await alCarrito(compradorId, p2, 1);
    await alCarrito(compradorId, p3, 1);

    const pagoRes = await confirmarPago(tokenComprador);
    expect(pagoRes.status).toBe(201);
    const pedidoId = pagoRes.body.data.pedido_id;
    const lineas = await leerLineas(pedidoId);
    expect(lineas).toHaveLength(3);

    const r1 = await cancelarLinea(tokenComprador, pedidoId, lineas[0].id);
    expect(r1.status).toBe(200);
    expect(r1.body.data.estado_pago).toBe("Aprobado");

    const r2 = await cancelarLinea(tokenComprador, pedidoId, lineas[1].id);
    expect(r2.status).toBe(200);
    // 119000 + 238000 = 357000; aun por debajo de 952000 (monto total).
    expect(r2.body.data.estado_pago).toBe("Aprobado");
    const pago2 = await leerPago(pedidoId);
    expect(Number(pago2.monto_reembolsado)).toBeCloseTo(357000, 2);
    expect(pago2.estado).toBe("Aprobado");

    const r3 = await cancelarLinea(tokenComprador, pedidoId, lineas[2].id);
    expect(r3.status).toBe(200);
    expect(r3.body.data.estado_pago).toBe("Reembolsado");
    const pago3 = await leerPago(pedidoId);
    expect(Number(pago3.monto_reembolsado)).toBeCloseTo(Number(pago3.monto), 2);
    expect(pago3.estado).toBe("Reembolsado");
  });

  it("A-1: doble confirmarPago simultaneo crea UN solo pedido (FOR UPDATE del carrito)", async () => {
    const p = await crearProducto(vendedorId, 119000);
    await alCarrito(comprador2Id, p, 1);

    const [resA, resB] = await Promise.all([
      confirmarPago(tokenComprador2),
      confirmarPago(tokenComprador2),
    ]);

    const exitos = [resA, resB].filter((r) => r.status === 201);
    const rechazos = [resA, resB].filter((r) => r.status === 400);
    // Uno confirma; el otro encuentra el carrito ya consumido.
    expect(exitos).toHaveLength(1);
    expect(rechazos).toHaveLength(1);

    const [pedidos] = await raw.query(
      "SELECT COUNT(*) AS total FROM pedidos WHERE comprador_id = ?",
      [comprador2Id]
    );
    expect(Number(pedidos[0].total)).toBe(1);
  });

  it("A-3/M-1/DEC-004: baneo multi-pedido reembolsa Pendientes y deja 'En camino' en revision", async () => {
    const vendedor2 = await crearUsuario("vendedor2");
    vendedor2Id = vendedor2.id;
    const tokenVendedor2 = tokenDe(vendedor2Id, vendedor2.email);

    const pA = await crearProducto(vendedor2Id, 119000);
    const pB = await crearProducto(vendedor2Id, 238000);

    // Pedido A (comprador 1): la linea se avanza a 'En camino' antes del baneo.
    await alCarrito(compradorId, pA, 1);
    const resA = await confirmarPago(tokenComprador);
    expect(resA.status).toBe(201);
    const pedidoA = resA.body.data.pedido_id;
    const lineasA = await leerLineas(pedidoA);
    const avance = await request(app)
      .patch(`/api/pedidos/${pedidoA}/estado`)
      .set("Authorization", `Bearer ${tokenVendedor2}`)
      .send({ estado: "En camino" });
    expect(avance.status).toBe(200);

    // Pedido B (comprador 2): linea Pendiente.
    await alCarrito(comprador2Id, pB, 1);
    const resB = await confirmarPago(tokenComprador2);
    expect(resB.status).toBe(201);
    const pedidoB = resB.body.data.pedido_id;

    // Baneo por la MISMA ruta del admin (destino de pedidos del vendedor).
    const { destinoPedidosVendedor } = await import(
      "../../controllers/admin/pedidos.controllers.js"
    );
    const conn = await pool.getConnection();
    let resultado;
    try {
      await conn.beginTransaction();
      resultado = await destinoPedidosVendedor(conn, vendedor2Id);
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    expect(resultado.cancelados).toBe(1);
    expect(resultado.enRevision).toBe(1);

    // Pedido A ('En camino'): intacto, sin desembolso automatico (DEC-004).
    const [lineaA] = await raw.query(
      "SELECT estado_envio, estado_pago_vendedor FROM detalle_pedidos WHERE id = ?",
      [lineasA[0].id]
    );
    expect(lineaA[0].estado_envio).toBe("En camino");
    expect(lineaA[0].estado_pago_vendedor).toBe("Pendiente");
    const pagoA = await leerPago(pedidoA);
    expect(pagoA.estado).toBe("Aprobado");
    expect(Number(pagoA.monto_reembolsado)).toBe(0);

    // Pedido B (Pendiente): cancelada, stock restituido y reembolso acumulado.
    const [lineaB] = await raw.query(
      "SELECT estado_envio FROM detalle_pedidos WHERE pedido_id = ?",
      [pedidoB]
    );
    expect(lineaB[0].estado_envio).toBe("Cancelado");
    const pagoB = await leerPago(pedidoB);
    expect(Number(pagoB.monto_reembolsado)).toBeCloseTo(238000, 2); // 200000 x 1.19
    expect(pagoB.estado).toBe("Reembolsado"); // unica linea del pedido -> cubre el monto

    const [stockB] = await raw.query("SELECT stock FROM productos WHERE id = ?", [pB]);
    expect(Number(stockB[0].stock)).toBe(100); // 99 tras la compra -> 100 tras el baneo

    // El comprador del pedido B recibe la notificacion del reembolso (fail-soft).
    const [notifs] = await raw.query(
      "SELECT COUNT(*) AS total FROM notificaciones WHERE usuario_id = ? AND tipo = 'reembolso'",
      [comprador2Id]
    );
    expect(Number(notifs[0].total)).toBeGreaterThanOrEqual(1);
  });

  it("B-5: pedido multi-vendedor: cancelar la linea de un vendedor no toca la del otro", async () => {
    const vendedorB = await crearUsuario("vendedorB");
    const pA = await crearProducto(vendedorId, 119000); // 100000 x 1.19
    const pB = await crearProducto(vendedorB.id, 238000); // 200000 x 1.19
    await alCarrito(compradorId, pA, 1);
    await alCarrito(compradorId, pB, 1);

    const pagoRes = await confirmarPago(tokenComprador);
    expect(pagoRes.status).toBe(201);
    const pedidoId = pagoRes.body.data.pedido_id;

    const leerDetalle = async () => {
      const [det] = await raw.query(
        "SELECT id, vendedor_id, estado_envio FROM detalle_pedidos WHERE pedido_id = ? ORDER BY id",
        [pedidoId]
      );
      return det;
    };
    const porVendedor = (det, vid) => det.find((d) => Number(d.vendedor_id) === Number(vid));

    // El pedido quedo con lineas de DOS vendedores distintos.
    const detInicial = await leerDetalle();
    expect(detInicial).toHaveLength(2);
    const lineaA = porVendedor(detInicial, vendedorId);
    const lineaB = porVendedor(detInicial, vendedorB.id);
    expect(lineaA).toBeTruthy();
    expect(lineaB).toBeTruthy();

    // Cancelar SOLO la linea del primer vendedor: reembolso parcial.
    const r = await cancelarLinea(tokenComprador, pedidoId, lineaA.id);
    expect(r.status).toBe(200);
    expect(r.body.data.estado_pago).toBe("Aprobado"); // 119000 de 357000
    const pago = await leerPago(pedidoId);
    expect(Number(pago.monto_reembolsado)).toBeCloseTo(119000, 2);
    expect(pago.estado).toBe("Aprobado");

    // La linea del otro vendedor sigue Pendiente e intacta.
    const detFinal = await leerDetalle();
    expect(porVendedor(detFinal, vendedorId).estado_envio).toBe("Cancelado");
    expect(porVendedor(detFinal, vendedorB.id).estado_envio).toBe("Pendiente");
  });
});

// B-5: este bloque solo existe para el modo deshabilitado (sin TEST_DB_*).
// El skip es intencional: un clon limpio no necesita MySQL local. Con
// TEST_DB_HOST/USER/NAME definidos corre la suite real de arriba
// (npm run test:integration contra MySQL local desechable, nunca compartida).
if (!habilitado) {
  describe("integracion MySQL real (deshabilitada)", () => {
    it.skip("define TEST_DB_HOST/TEST_DB_USER/TEST_DB_NAME para correrla (npm run test:integration)", () => {});
  });
}
