import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// Mock del pool MySQL (sin BD real) - cubre authRequired y el controller.
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

const tokenComprador = jwt.sign(
  { id: 8, email: "diego.serna@commercity.com" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);

// authRequired consulta la lista negra de tokens; no hay rol exigido.
function mockAuth() {
  pool.query.mockImplementation((sql) => {
    if (sql.includes("tokens_invalidados")) return [[], undefined];
    return [[], undefined];
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth();
});

describe("Chat interno (RF105)", () => {
  // ============================ ENVIAR MENSAJE ============================
  it("POST /api/chat sin token -> 401", async () => {
    const res = await request(app).post("/api/chat");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("POST /api/chat con mensaje vacio -> 400", async () => {
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ receptor_id: 2, mensaje: "   " });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/chat con destinatario invalido -> 400", async () => {
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ receptor_id: "abc", mensaje: "Hola" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/chat a si mismo -> 400", async () => {
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ receptor_id: 8, mensaje: "Hola" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/chat a usuario inexistente -> 404", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id, activo FROM usuarios")) return [[], undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ receptor_id: 999, mensaje: "Hola" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("POST /api/chat crea mensaje de texto (201)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id, activo FROM usuarios")) return [[{ id: 2, activo: 1 }], undefined];
      if (sql.includes("INSERT INTO mensajes_chat")) return [{ insertId: 900 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ receptor_id: 2, mensaje: "Hola Carlos" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(900);

    const insert = pool.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO mensajes_chat"));
    expect(insert[1][0]).toBe(8);      // emisor_id = id del JWT
    expect(insert[1][1]).toBe(2);      // receptor_id
    expect(insert[1][2]).toBe("texto");// tipo_mensaje
    expect(insert[1][3]).toBe("Hola Carlos");
    expect(insert[1][4]).toBeNull();   // archivo_url
  });

  it("POST /api/chat con archivo (multipart) guarda archivo_url (201)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id, activo FROM usuarios")) return [[{ id: 2, activo: 1 }], undefined];
      if (sql.includes("INSERT INTO mensajes_chat")) return [{ insertId: 901 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .field("receptor_id", "2")
      .field("mensaje", "Mira esta foto")
      .attach("archivo", Buffer.from("imagen-fake"), "foto.jpg");

    expect(res.status).toBe(201);

    const insert = pool.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO mensajes_chat"));
    expect(insert[1][2]).toBe("imagen"); // tipo derivado del mimetype
    expect(insert[1][4]).toMatch(/^\/uploads\/\d+\.jpg$/);
  });

  it("POST /api/chat devuelve 500 si la BD falla", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id, activo FROM usuarios")) return [[{ id: 2, activo: 1 }], undefined];
      throw new Error("BD caida");
    });
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ receptor_id: 2, mensaje: "Hola" });
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });

  // ========================= LISTAR CONVERSACIONES ========================
  it("GET /api/chat/conversaciones sin token -> 401", async () => {
    const res = await request(app).get("/api/chat/conversaciones");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/chat/conversaciones lista las conversaciones (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("GROUP BY LEAST")) {
        return [[{
          usuario_id: 2,
          nombre_completo: "Carlos Vidal",
          foto_perfil: null,
          mensaje_id: 5,
          emisor_id: 2,
          receptor_id: 8,
          tipo_mensaje: "texto",
          mensaje: "Hola Diego",
          archivo_url: null,
          enviado_at: "2026-08-20 10:00:00",
          leido: 0,
        }], undefined];
      }
      if (sql.includes("leido = 0")) {
        return [[{ emisor_id: 2, total: 1 }], undefined];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/chat/conversaciones")
      .set("Authorization", `Bearer ${tokenComprador}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].usuario.id).toBe(2);
    expect(res.body.data[0].ultimo_mensaje.mensaje).toBe("Hola Diego");
    expect(res.body.data[0].no_leidos).toBe(1);
  });

  // ========================== RECIBIR MENSAJES ============================
  it("GET /api/chat/mensajes/:usuarioId devuelve el historial (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id, nombre_completo, foto_perfil FROM usuarios")) {
        return [[{ id: 2, nombre_completo: "Carlos Vidal", foto_perfil: null }], undefined];
      }
      if (sql.includes("ORDER BY enviado_at ASC")) {
        return [[{
          id: 5,
          emisor_id: 2,
          receptor_id: 8,
          tipo_mensaje: "texto",
          mensaje: "Hola Diego",
          archivo_url: null,
          enviado_at: "2026-08-20 10:00:00",
          leido: 0,
        }], undefined];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/chat/mensajes/2")
      .set("Authorization", `Bearer ${tokenComprador}`);

    expect(res.status).toBe(200);
    expect(res.body.data.usuario.id).toBe(2);
    expect(res.body.data.mensajes).toHaveLength(1);
    expect(res.body.data.mensajes[0].mensaje).toBe("Hola Diego");
  });

  it("GET /api/chat/mensajes/:usuarioId con usuario inexistente -> 404", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id, nombre_completo, foto_perfil FROM usuarios")) return [[], undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .get("/api/chat/mensajes/999")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  // ========================== MARCAR COMO LEIDO ===========================
  it("PATCH /api/chat/mensajes/:id/leido marca como leido (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("UPDATE mensajes_chat")) return [{ affectedRows: 1 }, undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .patch("/api/chat/mensajes/5/leido")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(5);
  });
});
