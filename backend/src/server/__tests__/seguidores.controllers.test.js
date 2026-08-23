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

// Usuario autenticado del seed: camila.torres@commercity.com (id 9).
const token = jwt.sign(
  { id: 9, email: "camila.torres@commercity.com" },
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

describe("Seguidores - POST /api/seguidores (seguir usuario)", () => {
  it("sin token -> 401", async () => {
    const res = await request(app).post("/api/seguidores").send({ seguido_id: 3 });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("body invalido (seguido_id faltante) -> 400 VALIDATION_ERROR", async () => {
    const res = await request(app)
      .post("/api/seguidores")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("no se puede seguir a si mismo -> 400", async () => {
    const res = await request(app)
      .post("/api/seguidores")
      .set("Authorization", `Bearer ${token}`)
      .send({ seguido_id: 9 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("usuario a seguir inexistente -> 404", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuarios WHERE id")) return [[], undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .post("/api/seguidores")
      .set("Authorization", `Bearer ${token}`)
      .send({ seguido_id: 999 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("ya sigue al usuario -> 409", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuarios WHERE id")) return [[{ 1: 1 }], undefined];
      if (sql.includes("FROM seguidores WHERE seguidor_id")) return [[{ 1: 1 }], undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .post("/api/seguidores")
      .set("Authorization", `Bearer ${token}`)
      .send({ seguido_id: 3 });
    expect(res.status).toBe(409);
  });

  it("crea el seguimiento (201) y parametriza el INSERT", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuarios WHERE id")) return [[{ 1: 1 }], undefined];
      if (sql.includes("FROM seguidores WHERE seguidor_id")) return [[], undefined];
      if (sql.includes("INSERT INTO seguidores")) return [{ insertId: 0 }, undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .post("/api/seguidores")
      .set("Authorization", `Bearer ${token}`)
      .send({ seguido_id: 3 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ seguidor_id: 9, seguido_id: 3 });

    const insert = pool.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO seguidores"));
    expect(insert[1]).toEqual([9, 3]);
  });

  it("devuelve 500 si la BD falla", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      throw new Error("BD caida");
    });
    const res = await request(app)
      .post("/api/seguidores")
      .set("Authorization", `Bearer ${token}`)
      .send({ seguido_id: 3 });
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("Seguidores - DELETE /api/seguidores/:id (dejar de seguir)", () => {
  it("sin token -> 401", async () => {
    const res = await request(app).delete("/api/seguidores/3");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("id invalido -> 400", async () => {
    const res = await request(app)
      .delete("/api/seguidores/abc")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("no seguia a ese usuario -> 404", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("DELETE FROM seguidores")) return [{ affectedRows: 0 }, undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .delete("/api/seguidores/3")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("deja de seguir correctamente -> 200 y parametriza el DELETE", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("DELETE FROM seguidores")) return [{ affectedRows: 1 }, undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .delete("/api/seguidores/3")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const del = pool.query.mock.calls.find(([sql]) => sql.includes("DELETE FROM seguidores"));
    expect(del[1]).toEqual([9, 3]);
  });
});

describe("Seguidores - GET /api/seguidores/siguiendo", () => {
  it("sin token -> 401", async () => {
    const res = await request(app).get("/api/seguidores/siguiendo");
    expect(res.status).toBe(401);
  });

  it("devuelve la lista de usuarios seguidos", async () => {
    const filas = [
      { id: 3, nombre_completo: "Vendedor Uno", foto_perfil: null, fecha_seguimiento: "2026-01-01" },
    ];
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("s.seguido_id")) return [filas, undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .get("/api/seguidores/siguiendo")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(filas);
  });
});

describe("Seguidores - GET /api/seguidores/seguidores", () => {
  it("sin token -> 401", async () => {
    const res = await request(app).get("/api/seguidores/seguidores");
    expect(res.status).toBe(401);
  });

  it("devuelve la lista de usuarios que siguen al autenticado", async () => {
    const filas = [
      { id: 5, nombre_completo: "Comprador Dos", foto_perfil: null, fecha_seguimiento: "2026-01-02" },
    ];
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("s.seguidor_id")) return [filas, undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .get("/api/seguidores/seguidores")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(filas);
  });
});
