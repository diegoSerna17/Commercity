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

// Comprador del seed: camila.torres@commercity.com (id 9).
const tokenComprador = jwt.sign(
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

describe("Calificacion de vendedor (RF107)", () => {
  it("POST /api/calificaciones/vendedor sin token -> 401", async () => {
    const res = await request(app).post("/api/calificaciones/vendedor");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("body invalido (estrellas fuera de rango) -> 400 VALIDATION_ERROR", async () => {
    const res = await request(app)
      .post("/api/calificaciones/vendedor")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ pedido_id: 1, vendedor_id: 3, estrellas: 6 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("pedido inexistente -> 404", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM pedidos WHERE id")) return [[], undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .post("/api/calificaciones/vendedor")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ pedido_id: 999, vendedor_id: 3, estrellas: 5 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("pedido de otro comprador -> 403", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM pedidos WHERE id")) return [[{ id: 1, comprador_id: 7 }], undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .post("/api/calificaciones/vendedor")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ pedido_id: 1, vendedor_id: 3, estrellas: 5 });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("pedido sin compra de ese vendedor -> 400", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM pedidos WHERE id")) return [[{ id: 5, comprador_id: 9 }], undefined];
      if (sql.includes("FROM detalle_pedidos")) return [[], undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .post("/api/calificaciones/vendedor")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ pedido_id: 5, vendedor_id: 99, estrellas: 4 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("pedido ya calificado -> 400", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM pedidos WHERE id")) return [[{ id: 5, comprador_id: 9 }], undefined];
      if (sql.includes("FROM detalle_pedidos")) return [[{ id: 1 }], undefined];
      if (sql.includes("FROM calificaciones_vendedores")) return [[{ id: 1 }], undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .post("/api/calificaciones/vendedor")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ pedido_id: 5, vendedor_id: 3, estrellas: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("crea la calificacion (201) y parametriza el INSERT", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM pedidos WHERE id")) return [[{ id: 5, comprador_id: 9 }], undefined];
      if (sql.includes("FROM detalle_pedidos")) return [[{ id: 1 }], undefined];
      if (sql.includes("FROM calificaciones_vendedores")) return [[], undefined];
      if (sql.includes("INSERT INTO calificaciones_vendedores")) return [{ insertId: 77 }, undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .post("/api/calificaciones/vendedor")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ pedido_id: 5, vendedor_id: 3, estrellas: 5, comentario: "Excelente" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(77);

    const insert = pool.query.mock.calls.find(
      ([sql]) => sql.includes("INSERT INTO calificaciones_vendedores")
    );
    expect(insert[1][0]).toBe(5); // pedido_id
    expect(insert[1][1]).toBe(9); // comprador_id = id del JWT
    expect(insert[1][2]).toBe(3); // vendedor_id
    expect(insert[1][3]).toBe(5); // estrellas
    expect(insert[1][4]).toBe("Excelente");
  });

  it("devuelve 500 si la BD falla", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      throw new Error("BD caida");
    });
    const res = await request(app)
      .post("/api/calificaciones/vendedor")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ pedido_id: 5, vendedor_id: 3, estrellas: 5 });
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });
});
