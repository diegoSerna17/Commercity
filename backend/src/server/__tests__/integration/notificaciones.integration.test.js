/**
 * E2E de notificaciones (RF99-RF105) contra MySQL REAL y DESECHABLE.
 *
 * Cubre el ciclo de vida completo por HTTP (supertest sobre la app real, pool
 * mysql2 real, sin mocks):
 *   - generacion real de la notificacion al enviar un mensaje de chat (RF105),
 *   - listado con contrato y paginacion,
 *   - contador de no leidas, marcar una / todas, eliminar una / todas,
 *   - filtros y parametros invalidos (400), notificaciones ajenas (404),
 *   - aislamiento entre usuarios y rechazo sin JWT (401).
 *
 * Reglas:
 *   - JAMAS corre contra la BD compartida: solo contra TEST_DB_HOST/NAME.
 *   - Sin TEST_DB_* la suite se SALTA (un clon limpio no necesita MySQL).
 *   - Preparar la BD con schema+seed y migraciones antes de correr:
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

describe.skipIf(!habilitado)("E2E notificaciones: ciclo de vida contra MySQL real", () => {
  let app;
  let pool;
  let raw;

  const marca = `e2e_notif_${Date.now().toString(36)}`;
  const usuarioIds = [];
  let emisor;
  let receptor;
  let tokenEmisor;
  let tokenReceptor;
  let notificacionLeidaId;

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

  const enviarMensaje = (token, receptorId, mensaje) =>
    request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ receptor_id: receptorId, mensaje });

  const listar = (token, query = "") =>
    request(app)
      .get(`/api/notificaciones${query}`)
      .set("Authorization", `Bearer ${token}`);

  const contarNoLeidas = (token) =>
    request(app)
      .get("/api/notificaciones/no-leidas")
      .set("Authorization", `Bearer ${token}`);

  const ultimaNotificacion = async (usuarioId) => {
    const [rows] = await raw.query(
      `SELECT id, usuario_id, tipo, descripcion, estado, url_redireccion
       FROM notificaciones WHERE usuario_id = ? ORDER BY id DESC LIMIT 1`,
      [usuarioId]
    );
    return rows[0];
  };

  beforeAll(async () => {
    // El pool de la app debe apuntar a la BD desechable ANTES de importarla.
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

    emisor = await crearUsuario("emisor");
    receptor = await crearUsuario("receptor");
    tokenEmisor = tokenDe(emisor.id, emisor.email);
    tokenReceptor = tokenDe(receptor.id, receptor.email);
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
    await limpiar("DELETE FROM notificaciones WHERE usuario_id IN (?)", [usuarioIds]);
    await limpiar("DELETE FROM mensajes_chat WHERE emisor_id IN (?) OR receptor_id IN (?)", [
      usuarioIds,
      usuarioIds,
    ]);
    await limpiar("DELETE FROM usuario_roles WHERE usuario_id IN (?)", [usuarioIds]);
    await limpiar("DELETE FROM usuarios WHERE id IN (?)", [usuarioIds]);
    await raw.end();
  });

  it("1. rechaza el listado sin JWT (401)", async () => {
    const res = await request(app).get("/api/notificaciones");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("2. el mensaje de chat genera la notificacion persistida para el receptor", async () => {
    const res = await enviarMensaje(tokenEmisor, receptor.id, "Hola, E2E de notificaciones");
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeGreaterThan(0);

    const notif = await ultimaNotificacion(receptor.id);
    expect(notif).toBeDefined();
    expect(notif.tipo).toBe("mensajes");
    expect(notif.estado).toBe("no leido");
    expect(notif.url_redireccion).toBe("/messages");
    expect(notif.descripcion).toContain(marca);

    notificacionLeidaId = notif.id;
  });

  it("3. el contador de no leidas refleja la notificacion nueva", async () => {
    const res = await contarNoLeidas(tokenReceptor);
    expect(res.status).toBe(200);
    expect(res.body.data.total_no_leidas).toBe(1);
  });

  it("4. el listado respeta el contrato y la paginacion", async () => {
    const res = await listar(tokenReceptor);
    expect(res.status).toBe(200);

    const data = res.body.data;
    expect(data.total).toBe(1);
    expect(data.pagina).toBe(1);
    expect(data.por_pagina).toBe(50);
    expect(data.total_registros).toBe(1);
    expect(data.total_paginas).toBe(1);
    expect(data.hay_mas).toBe(false);

    const [notif] = data.notificaciones;
    expect(notif.id).toBe(notificacionLeidaId);
    expect(notif.tipo).toBe("mensajes");
    expect(notif.leida).toBe(false);
    expect(notif.dias_horas).toBe("Recién");
    expect(notif.fecha_hora).toBeTruthy();
  });

  it("5. acepta filtros validos y rechaza parametros invalidos (400)", async () => {
    const valido = await listar(tokenReceptor, "?tipo=mensajes&limite=10&pagina=1");
    expect(valido.status).toBe(200);
    expect(valido.body.data.total).toBe(1);

    const tipoInvalido = await listar(tokenReceptor, "?tipo=promocion");
    expect(tipoInvalido.status).toBe(400);

    const limiteCero = await listar(tokenReceptor, "?limite=0");
    expect(limiteCero.status).toBe(400);

    const limiteExcedido = await listar(tokenReceptor, "?limite=51");
    expect(limiteExcedido.status).toBe(400);

    const paginaInvalida = await listar(tokenReceptor, "?pagina=0");
    expect(paginaInvalida.status).toBe(400);

    const idInvalido = await request(app)
      .patch("/api/notificaciones/abc/leida")
      .set("Authorization", `Bearer ${tokenReceptor}`);
    expect(idInvalido.status).toBe(400);
  });

  it("6. aislamiento: el emisor no ve las notificaciones del receptor", async () => {
    const res = await listar(tokenEmisor);
    expect(res.status).toBe(200);
    expect(res.body.data.total_registros).toBe(0);
    expect(res.body.data.notificaciones).toHaveLength(0);
  });

  it("7. marcar una leida actualiza estado y bloquea ids ajenos (404)", async () => {
    const ajeno = await request(app)
      .patch(`/api/notificaciones/${notificacionLeidaId}/leida`)
      .set("Authorization", `Bearer ${tokenEmisor}`);
    expect(ajeno.status).toBe(404);

    const propio = await request(app)
      .patch(`/api/notificaciones/${notificacionLeidaId}/leida`)
      .set("Authorization", `Bearer ${tokenReceptor}`);
    expect(propio.status).toBe(200);
    expect(propio.body.data.id).toBe(notificacionLeidaId);

    const contador = await contarNoLeidas(tokenReceptor);
    expect(contador.body.data.total_no_leidas).toBe(0);

    const listado = await listar(tokenReceptor);
    expect(listado.body.data.notificaciones[0].leida).toBe(true);
  });

  it("8. paginacion real con dos registros y marcar todas leidas", async () => {
    const chat = await enviarMensaje(tokenEmisor, receptor.id, "Segundo mensaje E2E");
    expect(chat.status).toBe(201);

    const pagina1 = await listar(tokenReceptor, "?limite=1&pagina=1");
    expect(pagina1.body.data.total).toBe(1);
    expect(pagina1.body.data.total_registros).toBe(2);
    expect(pagina1.body.data.total_paginas).toBe(2);
    expect(pagina1.body.data.hay_mas).toBe(true);

    const pagina2 = await listar(tokenReceptor, "?limite=1&pagina=2");
    expect(pagina2.body.data.total).toBe(1);
    expect(pagina2.body.data.hay_mas).toBe(false);

    const marcar = await request(app)
      .patch("/api/notificaciones/leidas")
      .set("Authorization", `Bearer ${tokenReceptor}`);
    expect(marcar.status).toBe(200);
    expect(marcar.body.data.actualizadas).toBe(1);

    const contador = await contarNoLeidas(tokenReceptor);
    expect(contador.body.data.total_no_leidas).toBe(0);
  });

  it("9. eliminar una notificacion propia y 404 al repetir", async () => {
    const chat = await enviarMensaje(tokenEmisor, receptor.id, "Tercer mensaje E2E");
    expect(chat.status).toBe(201);

    const pendiente = await ultimaNotificacion(receptor.id);
    expect(pendiente.estado).toBe("no leido");

    const eliminar = await request(app)
      .delete(`/api/notificaciones/${pendiente.id}`)
      .set("Authorization", `Bearer ${tokenReceptor}`);
    expect(eliminar.status).toBe(200);
    expect(eliminar.body.data.id).toBe(pendiente.id);

    const repetir = await request(app)
      .delete(`/api/notificaciones/${pendiente.id}`)
      .set("Authorization", `Bearer ${tokenReceptor}`);
    expect(repetir.status).toBe(404);
  });

  it("10. eliminar todas deja la bandeja vacia", async () => {
    const res = await request(app)
      .delete("/api/notificaciones")
      .set("Authorization", `Bearer ${tokenReceptor}`);
    expect(res.status).toBe(200);
    expect(res.body.data.eliminadas).toBe(2);

    const listado = await listar(tokenReceptor);
    expect(listado.body.data.total_registros).toBe(0);

    const contador = await contarNoLeidas(tokenReceptor);
    expect(contador.body.data.total_no_leidas).toBe(0);
  });
});
