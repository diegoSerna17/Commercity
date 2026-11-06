/**
 * Integracion de pedidos y calificaciones contra MySQL REAL y DESECHABLE.
 *
 * Cubre dos flujos que la suite unitaria solo simula:
 *   1. checkout ACID (carrito -> pedido + detalle + pago + stock) por HTTP;
 *   2. calificacion multi-vendedor: un pedido con dos vendedores permite
 *      calificar a cada uno una vez y repetir devuelve 409 (B2, mig 018).
 *
 * Reglas:
 *   - JAMAS corre contra la BD compartida: solo contra TEST_DB_*.
 *   - Sin TEST_DB_* la suite se SALTA (un clon limpio no necesita MySQL).
 *   - Preparar la BD con schema+seed y migraciones antes de correr:
 *       $env:TEST_DB_NAME="commercity_dev"; npm run test:integration
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

describe.skipIf(!habilitado)("E2E pedidos y calificaciones contra MySQL real", () => {
  let app;
  let pool;
  let raw;

  const marca = `e2e_ped_${Date.now().toString(36)}`;
  const usuarioIds = [];
  const productoIds = [];
  const pedidoIds = [];
  let categoriaId;
  let comprador;
  let vendedor1;
  let vendedor2;
  let tokenComprador;
  let productoUno;
  let productoDos;

  const tokenDe = (id, email) =>
    jwt.sign({ id, email, token_version: 0 }, process.env.JWT_SECRET, {
      issuer: "commercity-api",
      audience: "commercity-clients",
      expiresIn: "1h",
    });

  const crearUsuario = async (etiqueta) => {
    const email = `${marca}_${etiqueta}@test.local`;
    const [r] = await raw.query(
      "INSERT INTO usuarios (email, password, nombre_completo, activo) VALUES (?, 'hash_solo_e2e', ?, 1)",
      [email, `Usuario ${etiqueta} ${marca}`]
    );
    usuarioIds.push(r.insertId);
    return { id: r.insertId, email };
  };

  const crearProducto = async (vendedorId, etiqueta, stock = 10) => {
    const [r] = await raw.query(
      `INSERT INTO productos
         (vendedor_id, categoria_id, nombre, descripcion, imagen_url, precio, stock, descuento_porcentaje)
       VALUES (?, ?, ?, 'Producto E2E', '/uploads/e2e.jpg', 10000.00, ?, 0.00)`,
      [vendedorId, categoriaId, `${marca} ${etiqueta}`, stock]
    );
    productoIds.push(r.insertId);
    return r.insertId;
  };

  beforeAll(async () => {
    process.env.DB_HOST = TEST_DB.host;
    process.env.DB_PORT = String(TEST_DB.port || 3306);
    process.env.DB_USER = TEST_DB.user;
    process.env.DB_PASSWORD = TEST_DB.password;
    process.env.DB_NAME = TEST_DB.database;
    process.env.NODE_ENV = "test";

    ({ default: app } = await import("../../app.js"));
    ({ default: pool } = await import("../../config/db.js"));

    raw = await mysql.createConnection({ ...TEST_DB });

    try {
      await raw.query("SELECT token_version FROM usuarios LIMIT 1");
    } catch {
      throw new Error(
        `TEST_DB_NAME="${TEST_DB.database}" no tiene el esquema al dia. ` +
          "Cargue schema_commercity.sql + seed y aplique scripts/aplicar-migraciones.mjs."
      );
    }

    const [cat] = await raw.query(
      "INSERT INTO categorias (nombre) VALUES (?)",
      [`${marca} categoria`]
    );
    categoriaId = cat.insertId;

    comprador = await crearUsuario("comprador");
    vendedor1 = await crearUsuario("vendedor1");
    vendedor2 = await crearUsuario("vendedor2");
    tokenComprador = tokenDe(comprador.id, comprador.email);

    productoUno = await crearProducto(vendedor1.id, "uno", 10);
    productoDos = await crearProducto(vendedor2.id, "dos", 10);
  });

  afterAll(async () => {
    if (pool) await pool.end();
    if (!raw) return;

    const limpiar = async (sql, params) => {
      try {
        await raw.query(sql, params);
      } catch {
        // la limpieza no debe tapar el resultado de los tests
      }
    };
    if (pedidoIds.length) {
      await limpiar("DELETE FROM calificaciones_vendedores WHERE pedido_id IN (?)", [pedidoIds]);
      await limpiar("DELETE FROM pagos_simulados WHERE pedido_id IN (?)", [pedidoIds]);
      await limpiar("DELETE FROM detalle_pedidos WHERE pedido_id IN (?)", [pedidoIds]);
      await limpiar("DELETE FROM pedidos WHERE id IN (?)", [pedidoIds]);
    }
    if (productoIds.length) {
      await limpiar("DELETE FROM carrito_items WHERE producto_id IN (?)", [productoIds]);
      await limpiar("DELETE FROM productos WHERE id IN (?)", [productoIds]);
    }
    if (categoriaId) await limpiar("DELETE FROM categorias WHERE id = ?", [categoriaId]);
    if (usuarioIds.length) {
      await limpiar("DELETE FROM notificaciones WHERE usuario_id IN (?)", [usuarioIds]);
      await limpiar("DELETE FROM usuarios WHERE id IN (?)", [usuarioIds]);
    }
    await raw.end();
  });

  it("1. checkout: carrito -> pedido, pago aprobado y stock descontado (RF134)", async () => {
    const agregar = await request(app)
      .post("/api/carrito")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ producto_id: productoUno, cantidad: 2 });
    expect(agregar.status).toBe(201);

    const pago = await request(app)
      .post("/api/pedidos/confirmar-pago")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({
        direccion_envio: "Calle E2E #1-2, Medellin",
        metodo_pago: "transferencia",
      });

    expect(pago.status).toBe(201);
    const pedidoId = pago.body.data.pedido_id;
    pedidoIds.push(pedidoId);

    const [stock] = await raw.query("SELECT stock FROM productos WHERE id = ?", [productoUno]);
    expect(stock[0].stock).toBe(8);

    const [detalle] = await raw.query(
      "SELECT vendedor_id, cantidad FROM detalle_pedidos WHERE pedido_id = ?",
      [pedidoId]
    );
    expect(detalle).toHaveLength(1);
    expect(detalle[0].vendedor_id).toBe(vendedor1.id);

    const [pagos] = await raw.query(
      "SELECT estado, monto FROM pagos_simulados WHERE pedido_id = ?",
      [pedidoId]
    );
    expect(pagos[0].estado).toBe("Aprobado");
  });

  it("2. calificaciones: dos vendedores en un pedido se califican una vez cada uno (B2)", async () => {
    // Pedido entregado con una linea de cada vendedor.
    const [pedido] = await raw.query(
      "INSERT INTO pedidos (comprador_id, direccion_envio, total_neto) VALUES (?, ?, ?)",
      [comprador.id, "Calle E2E #1-2, Medellin", 20000]
    );
    const pedidoId = pedido.insertId;
    pedidoIds.push(pedidoId);

    for (const [productoId, vendedorId] of [
      [productoUno, vendedor1.id],
      [productoDos, vendedor2.id],
    ]) {
      await raw.query(
        `INSERT INTO detalle_pedidos
           (pedido_id, producto_id, vendedor_id, cantidad, precio_unitario_historico,
            descuento_aplicado, subtotal, monto_vendedor, monto_comision, estado_envio)
         VALUES (?, ?, ?, 1, 10000, 0, 10000, 9000, 1000, 'Entregado')`,
        [pedidoId, productoId, vendedorId]
      );
    }

    const calificar = (vendedorId) =>
      request(app)
        .post("/api/calificaciones/vendedor")
        .set("Authorization", `Bearer ${tokenComprador}`)
        .send({ pedido_id: pedidoId, vendedor_id: vendedorId, estrellas: 5 });

    expect((await calificar(vendedor1.id)).status).toBe(201);
    expect((await calificar(vendedor2.id)).status).toBe(201);

    const repetido = await calificar(vendedor1.id);
    expect(repetido.status).toBe(409);
    expect(repetido.body.error.code).toBe("CONFLICT");

    const [filas] = await raw.query(
      "SELECT vendedor_id FROM calificaciones_vendedores WHERE pedido_id = ? ORDER BY vendedor_id",
      [pedidoId]
    );
    expect(filas.map((f) => f.vendedor_id)).toEqual([vendedor1.id, vendedor2.id]);
  });
});
