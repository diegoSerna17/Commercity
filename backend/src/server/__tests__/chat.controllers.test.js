import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// Mock del pool MySQL (sin BD real).
vi.mock("mysql2/promise", () => {
  const pool = { query: vi.fn(), getConnection: vi.fn() };
  return {
    __esModule: true,
    default: { createPool: vi.fn(() => pool) },
    __pool: pool,
  };
});

process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto_test";

const { __pool: pool } = await import("mysql2/promise");
const { default: app } = await import("../app.js");

const token = jwt.sign({ id: 3, email: "usuario@test.com" }, process.env.JWT_SECRET, { expiresIn: "1h" });

const filaMensaje = {
  id: 10,
  emisor_id: 5,
  receptor_id: 3,
  tipo_mensaje: "texto",
  mensaje: "Hola, ¿tienes stock del producto?",
  archivo_url: null,
  enviado_at: "2026-08-20T20:00:00.000Z",
  leido: 0,
  otro_nombre: "Vendedor Alex Rivera",
  otro_foto: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  pool.query.mockImplementation((sql) => {
    if (sql.includes("tokens_invalidados")) return [[], undefined];
    return [[], undefined];
  });
});

describe("Chat interno (RF105) - autenticacion", () => {
  it("POST /api/chat/mensajes sin token -> 401", async () => {
    const res = await request(app).post("/api/chat/mensajes").send({ receptor_id: 5, mensaje: "Hola" });
    expect(res.status).toBe(401);
  });

  it("GET /api/chat/conversaciones sin token -> 401", async () => {
    const res = await request(app).get("/api/chat/conversaciones");
    expect(res.status).toBe(401);
  });

  it("GET /api/chat/mensajes/1 sin token -> 401", async () => {
    const res = await request(app).get("/api/chat/mensajes/1");
    expect(res.status).toBe(401);
  });

  it("PATCH /api/chat/mensajes/1/leido sin token -> 401", async () => {
    const res = await request(app).patch("/api/chat/mensajes/1/leido");
    expect(res.status).toBe(401);
  });
});

describe("Chat interno (RF105) - enviar mensaje", () => {
  it("rechaza body invalido sin receptor_id (400 zod)", async () => {
    const res = await request(app)
      .post("/api/chat/mensajes")
      .set("Authorization", `Bearer ${token}`)
      .send({ mensaje: "Hola" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rechaza mensaje de texto vacio (400)", async () => {
    const res = await request(app)
      .post("/api/chat/mensajes")
      .set("Authorization", `Bearer ${token}`)
      .send({ receptor_id: 5, tipo_mensaje: "texto", mensaje: "   " });
    expect(res.status).toBe(400);
  });

  it("rechaza enviarse mensaje a si mismo (400)", async () => {
    const res = await request(app)
      .post("/api/chat/mensajes")
      .set("Authorization", `Bearer ${token}`)
      .send({ receptor_id: 3, mensaje: "Auto" });
    expect(res.status).toBe(400);
  });

  it("rechaza receptor inexistente o inactivo (404)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id FROM usuarios")) return [[], undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .post("/api/chat/mensajes")
      .set("Authorization", `Bearer ${token}`)
      .send({ receptor_id: 999, mensaje: "Hola" });
    expect(res.status).toBe(404);
  });

  it("crea un mensaje de texto (201)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id FROM usuarios")) return [[{ id: 5 }], undefined];
      if (sql.includes("INSERT INTO mensajes_chat")) return [{ insertId: 10 }, undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .post("/api/chat/mensajes")
      .set("Authorization", `Bearer ${token}`)
      .send({ receptor_id: 5, mensaje: "Hola" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(10);
    expect(res.body.data.emisor_id).toBe(3);
    // El emisor sale del token, no del body.
    const llamadaInsert = pool.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO mensajes_chat"));
    expect(llamadaInsert[1][0]).toBe(3);
  });

  it("devuelve 500 estructurado si la BD falla", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id FROM usuarios")) return [[{ id: 5 }], undefined];
      throw new Error("DB boom");
    });
    const res = await request(app)
      .post("/api/chat/mensajes")
      .set("Authorization", `Bearer ${token}`)
      .send({ receptor_id: 5, mensaje: "Hola" });
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("Chat interno (RF105) - conversaciones y mensajes", () => {
  it("GET /api/chat/conversaciones devuelve ultimo mensaje y no leidos (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("MAX(m2.id)")) return [[filaMensaje], undefined];
      if (sql.includes("GROUP BY emisor_id")) return [[{ emisor_id: 5, total: 2 }], undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .get("/api/chat/conversaciones")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.conversaciones).toHaveLength(1);
    expect(res.body.data.conversaciones[0].no_leidos).toBe(2);
    expect(res.body.data.conversaciones[0].otro_usuario.nombre).toBe("Vendedor Alex Rivera");
  });

  it("GET /api/chat/mensajes/:receptorId rechaza id invalido (400)", async () => {
    const res = await request(app)
      .get("/api/chat/mensajes/abc")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("GET /api/chat/mensajes/:receptorId devuelve historial y marca leidos (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("UPDATE mensajes_chat")) return [{ affectedRows: 1 }, undefined];
      return [[filaMensaje], undefined];
    });
    const res = await request(app)
      .get("/api/chat/mensajes/5")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.mensajes).toHaveLength(1);
    expect(res.body.data.otro_usuario.id).toBe(5);
    const llamadaUpdate = pool.query.mock.calls.find(([sql]) => sql.includes("UPDATE mensajes_chat"));
    expect(llamadaUpdate).toBeTruthy();
  });

  it("PATCH /api/chat/mensajes/:id/leido marca como leido (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("UPDATE mensajes_chat")) return [{ affectedRows: 1 }, undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .patch("/api/chat/mensajes/10/leido")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(10);
  });

  it("PATCH /api/chat/mensajes/:id/leido devuelve 404 si no es del usuario", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("UPDATE mensajes_chat")) return [{ affectedRows: 0 }, undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .patch("/api/chat/mensajes/999/leido")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("PATCH /api/chat/mensajes/:id/leido rechaza id invalido (400)", async () => {
    const res = await request(app)
      .patch("/api/chat/mensajes/x/leido")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
