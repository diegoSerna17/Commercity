import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// Mock del pool MySQL (sin BD real) - cubre authRequired y el controller.
vi.mock("mysql2/promise", () => {
  // query envoltorio: responde de forma transparente la consulta que authRequired
  // hace por DEF-01 ("SELECT activo FROM usuarios WHERE id = ? LIMIT 1") y delega
  // el resto a la query interna que configura cada test con mockImplementation.
  const queryInterna = vi.fn();
  const query = vi.fn((sql, ...resto) => {
    if (typeof sql === "string" && sql.includes("SELECT activo FROM usuarios WHERE id = ? LIMIT 1")) {
      return Promise.resolve([[{ activo: 1 }], undefined]);
    }
    return queryInterna(sql, ...resto);
  });
  query.mockImplementation = (fn) => { queryInterna.mockImplementation(fn); return query; };
  query.mockImplementationOnce = (fn) => { queryInterna.mockImplementationOnce(fn); return query; };
  query.mockResolvedValue = (valor) => { queryInterna.mockResolvedValue(valor); return query; };
  query.mockRejectedValue = (error) => { queryInterna.mockRejectedValue(error); return query; };
  const pool = { query, getConnection: vi.fn() };
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
  { id: 8, email: "camila.torres@commercity.com" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);

// authRequired solo consulta la lista negra de tokens; no hay rol exigido.
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

describe("Creacion de reportes (RF62/RF63, RF79, RF101)", () => {
  it("POST /api/reportes sin token -> 401", async () => {
    const res = await request(app).post("/api/reportes");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/reportes con tipo invalido -> 400", async () => {
    const res = await request(app)
      .post("/api/reportes")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ tipo: "Tienda", motivo: "Motivo", producto_id: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/reportes sin motivo -> 400", async () => {
    const res = await request(app)
      .post("/api/reportes")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ tipo: "Producto", producto_id: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/reportes de producto sin producto_id -> 400", async () => {
    const res = await request(app)
      .post("/api/reportes")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ tipo: "Producto", motivo: "Motivo" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/reportes de producto inexistente -> 404", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id FROM productos")) return [[], undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .post("/api/reportes")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ tipo: "Producto", motivo: "Motivo", producto_id: 999 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("POST /api/reportes de producto crea con informante del JWT (201)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id FROM productos")) return [[{ id: 1 }], undefined];
      if (sql.includes("INSERT INTO reportes")) return [{ insertId: 500 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .post("/api/reportes")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ tipo: "producto", motivo: "Producto roto", producto_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(500);

    const insert = pool.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO reportes"));
    expect(insert[1][0]).toBe(8); // informante_id = id del JWT
    expect(insert[1][1]).toBe("Producto"); // tipo normalizado
    expect(insert[1][2]).toBe(1); // producto_id
    expect(insert[1][3]).toBeNull(); // usuario_reportado_id
    expect(insert[1][4]).toBe("Producto roto");
  });

  it("POST /api/reportes de usuario autoreporte -> 400", async () => {
    const res = await request(app)
      .post("/api/reportes")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ tipo: "Usuario", motivo: "Motivo", usuario_reportado_id: 8 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/reportes de usuario inexistente -> 404", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id FROM usuarios")) return [[], undefined];
      return [[], undefined];
    });
    const res = await request(app)
      .post("/api/reportes")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ tipo: "Usuario", motivo: "Motivo", usuario_reportado_id: 999 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("POST /api/reportes de usuario crea (201)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id FROM usuarios")) return [[{ id: 2 }], undefined];
      if (sql.includes("INSERT INTO reportes")) return [{ insertId: 501 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .post("/api/reportes")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ tipo: "Usuario", motivo: "Conducta inapropiada", usuario_reportado_id: 2 });

    expect(res.status).toBe(201);
    const insert = pool.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO reportes"));
    expect(insert[1][1]).toBe("Usuario");
    expect(insert[1][2]).toBeNull(); // producto_id
    expect(insert[1][3]).toBe(2); // usuario_reportado_id
  });

  it("POST /api/reportes con evidencia (multipart) guarda evidencia_url (201)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id FROM productos")) return [[{ id: 1 }], undefined];
      if (sql.includes("INSERT INTO reportes")) return [{ insertId: 502 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .post("/api/reportes")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .field("tipo", "Producto")
      .field("motivo", "Producto con defecto")
      .field("producto_id", "1")
      .attach("evidencia", Buffer.from("imagen-fake"), "evidencia.jpg");

    expect(res.status).toBe(201);
    const insert = pool.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO reportes"));
    expect(insert[1][5]).toMatch(/^\/uploads\/\d+\.jpg$/);
  });

  it("devuelve 500 si la BD falla al crear", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id FROM productos")) return [[{ id: 1 }], undefined];
      throw new Error("BD caida");
    });
    const res = await request(app)
      .post("/api/reportes")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ tipo: "Producto", motivo: "Motivo", producto_id: 1 });
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });
});
