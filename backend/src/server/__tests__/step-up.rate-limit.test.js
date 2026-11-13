import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// 1.5.9: el limitador de step-up se monta en las rutas DESPUES de authRequired
// y solo cuenta los fallos. Se ejercita fuera de NODE_ENV=test (donde los
// limitadores se saltan por convencion) sobre una instancia fresca de app.js.
process.env.NODE_ENV = "development";
process.env.JWT_SECRET = "jwt-secret-de-pruebas-step-up-000000000000000";
process.env.DB_USER = "step_up_user";
process.env.DB_PASSWORD = "clave-local-step-up";
process.env.CRYPTO_SECRET_KEY = "clave-de-cifrado-step-up-000000000000";

vi.mock("mysql2/promise", () => {
  const pool = {
    query: vi.fn(),
    getConnection: vi.fn(),
  };
  return {
    __esModule: true,
    default: { createPool: vi.fn(() => pool) },
    __pool: pool,
  };
});

// La contrasena siempre es incorrecta: cada intento devuelve 403 y cuenta.
vi.mock("bcrypt", () => ({
  __esModule: true,
  default: {
    hash: vi.fn().mockResolvedValue("$2b$10$mock_hash"),
    compare: vi.fn().mockResolvedValue(false),
  },
}));

process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto_test";

const { __pool: pool } = await import("mysql2/promise");
const { default: app } = await import("../app.js");

const tokenVendedor = jwt.sign(
  { id: 7, email: "vendedor@test.com", token_version: 0 },
  process.env.JWT_SECRET,
  { issuer: "commercity-api", audience: "commercity-clients", expiresIn: "1h" }
);

beforeEach(() => {
  vi.clearAllMocks();
  pool.query.mockImplementation((sql) => {
    if (typeof sql === "string" && sql.includes("AS revocado")) {
      return [[{ activo: 1, token_version: 0, revocado: 0, roles_csv: "vendedor" }], undefined];
    }
    if (typeof sql === "string" && sql.includes("SELECT password FROM usuarios")) {
      return [[{ password: "$2b$10$hash" }], undefined];
    }
    return [[], undefined];
  });
});

describe("Step-up sin limite de intentos (1.5.9)", () => {
  it("el sexto intento fallido contra la cuenta bancaria responde 429", async () => {
    const ataque = () =>
      request(app)
        .post("/api/tienda/mi-cuenta-bancaria")
        .set("Authorization", `Bearer ${tokenVendedor}`)
        .send({
          titular_nombre: "Maria Fernanda Lopez",
          banco: "Bancolombia",
          tipo_cuenta: "ahorros",
          numero_cuenta: "12345678901234",
          password: "Incorrecta999",
        });

    const estados = [];
    for (let i = 0; i < 5; i += 1) {
      const res = await ataque();
      estados.push(res.status);
    }
    expect(estados).toEqual([403, 403, 403, 403, 403]);

    const sexto = await ataque();
    expect(sexto.status).toBe(429);
    expect(sexto.body.error.code).toBe("RATE_LIMIT");
  });
});
