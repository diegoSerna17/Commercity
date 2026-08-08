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
process.env.CRYPTO_SECRET_KEY = process.env.CRYPTO_SECRET_KEY || "clave_test_cifrado_rf76";

const { __pool: pool } = await import("mysql2/promise");
const { default: app } = await import("../app.js");

const tokenAdmin = jwt.sign(
  { id: 471, email: "admin01@commercity.com" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);
const tokenVendedor = jwt.sign(
  { id: 2, email: "juan.giraldo@commercity.com" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);

// Fila cifrada simulada de datos_bancarios (iv:tag:data base64url)
const filaCifrada = {
  id: 1,
  usuario_id: 1,
  titular_nombre: "ZW52Ojp0YWc6ZGF0YQ",
  banco: "Bancolombia",
  tipo_cuenta: "corriente",
  numero_cuenta: "ZW52Ojp0YWc6ZGF0YQ",
  es_commercity: 1,
  updated_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default: auth OK (blacklist vacia) + rol administrador
  pool.query.mockImplementation((sql) => {
    if (sql.includes("tokens_invalidados")) return [[], undefined];
    if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
    return [[], undefined];
  });
  // getConnection para upsert
  pool.getConnection.mockResolvedValue({
    beginTransaction: vi.fn().mockResolvedValue(),
    commit: vi.fn().mockResolvedValue(),
    rollback: vi.fn().mockResolvedValue(),
    release: vi.fn().mockResolvedValue(),
    query: vi.fn().mockResolvedValue([[], undefined]),
  });
});

describe("GET /api/admin/mi-cuenta-bancaria (RF76)", () => {
  it("rechaza sin token (401)", async () => {
    const res = await request(app).get("/api/admin/mi-cuenta-bancaria");
    expect(res.status).toBe(401);
  });

  it("rechaza a un vendedor (403 - solo admin)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/admin/mi-cuenta-bancaria")
      .set("Authorization", `Bearer ${tokenVendedor}`);
    expect(res.status).toBe(403);
  });

  it("devuelve registrado=false cuando no existe cuenta de Commercity", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("es_commercity = 1")) return [[], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/admin/mi-cuenta-bancaria")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.registrado).toBe(false);
  });

  it("devuelve la cuenta de Commercity descifrada", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("es_commercity = 1")) return [[filaCifrada], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/admin/mi-cuenta-bancaria")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.data.registrado).toBe(true);
    expect(res.body.data.datos.banco).toBe("Bancolombia");
    expect(res.body.data.datos.es_commercity).toBe(true);
  });

  it("devuelve la cuenta enmascarada en /masked", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("es_commercity = 1")) return [[filaCifrada], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/admin/mi-cuenta-bancaria/masked")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.data.registrado).toBe(true);
    expect(res.body.data.datos.numero_cuenta_enmascarado).toBeDefined();
    expect(res.body.data.datos.titular_nombre_enmascarado).toBeDefined();
  });
});

describe("POST /api/admin/mi-cuenta-bancaria (RF76 upsert)", () => {
  it("crea la cuenta de Commercity con es_commercity = 1 (201)", async () => {
    // SELECT de existencia -> vacio (INSERT)
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("SELECT id FROM datos_bancarios WHERE es_commercity")) return [[], undefined];
      if (sql.includes("WHERE es_commercity = 1")) return [[filaCifrada], undefined];
      return [[], undefined];
    });
    // Spy del query dentro de la transaccion para verificar el INSERT
    const connQuery = vi.fn().mockResolvedValue([[], undefined]);
    pool.getConnection.mockResolvedValue({
      beginTransaction: vi.fn().mockResolvedValue(),
      commit: vi.fn().mockResolvedValue(),
      rollback: vi.fn().mockResolvedValue(),
      release: vi.fn().mockResolvedValue(),
      query: connQuery,
    });

    const res = await request(app)
      .post("/api/admin/mi-cuenta-bancaria")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        titular_nombre: "CommerCity SAS",
        banco: "Bancolombia",
        tipo_cuenta: "corriente",
        numero_cuenta: "1234567890",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    // Verificar que el INSERT fuerza es_commercity = 1 (literal en el SQL)
    const insert = connQuery.mock.calls.find(
      ([sql]) => sql.includes("INSERT INTO datos_bancarios")
    );
    expect(insert).toBeDefined();
    expect(insert[0]).toContain("es_commercity");
    expect(insert[0]).toMatch(/VALUES\s*\([^)]*1\)\s*$/i);
  });

  it("actualiza la cuenta existente (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("WHERE es_commercity = 1")) return [[filaCifrada], undefined];
      return [[], undefined];
    });
    // SELECT de existencia dentro de la transaccion -> ya existe (UPDATE)
    pool.getConnection.mockResolvedValue({
      beginTransaction: vi.fn().mockResolvedValue(),
      commit: vi.fn().mockResolvedValue(),
      rollback: vi.fn().mockResolvedValue(),
      release: vi.fn().mockResolvedValue(),
      query: vi.fn().mockImplementation((sql) =>
        sql.includes("SELECT id FROM datos_bancarios")
          ? Promise.resolve([[{ id: 1 }], undefined])
          : Promise.resolve([[], undefined])
      ),
    });

    const res = await request(app)
      .put("/api/admin/mi-cuenta-bancaria")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        titular_nombre: "CommerCity SAS Actualizado",
        banco: "Davivienda",
        tipo_cuenta: "ahorros",
        numero_cuenta: "9876543210",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.es_actualizacion).toBe(true);
  });

  it("valida el cuerpo (400): numero con letras", async () => {
    const res = await request(app)
      .post("/api/admin/mi-cuenta-bancaria")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        titular_nombre: "CommerCity SAS",
        banco: "Bancolombia",
        tipo_cuenta: "corriente",
        numero_cuenta: "abc123456",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
