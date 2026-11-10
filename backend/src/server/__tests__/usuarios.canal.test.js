import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock del pool MySQL: el login solo consulta usuario y roles (sin BD real).
// Se aisla en su propio archivo para no consumir el cupo de 10/min del
// limitador de login, que a proposito NO se desactiva en NODE_ENV=test.
vi.mock("mysql2/promise", () => {
  const pool = { query: vi.fn(), getConnection: vi.fn() };
  return {
    __esModule: true,
    default: { createPool: vi.fn(() => pool) },
    __pool: pool,
  };
});

process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto_test";

// bcrypt es CJS: se mockea para que el login no dependa de un hash real.
vi.mock("bcrypt", () => ({
  __esModule: true,
  default: {
    hash: vi.fn().mockResolvedValue("$2b$10$mock_hash"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

const { __pool: pool } = await import("mysql2/promise");
const { default: app } = await import("../app.js");

const USUARIO = {
  id: 7,
  email: "compra@test.com",
  password: "$2b$10$x",
  nombre_completo: "Comprador",
  foto_perfil: null,
  activo: 1,
  token_version: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  pool.query.mockImplementation((sql) => {
    if (sql.includes("FROM usuarios u WHERE u.email")) return [[USUARIO], undefined];
    if (sql.includes("FROM roles r")) return [[{ nombre: "comprador" }], undefined];
    return [[], undefined];
  });
});

function login(email, cabeceras = {}) {
  const peticion = request(app).post("/api/usuarios/login");
  for (const [clave, valor] of Object.entries(cabeceras)) peticion.set(clave, valor);
  return peticion.send({ email, password: "SuperPass123" });
}

describe("POST /api/usuarios/login - canal del token (decision 2026-11-10)", () => {
  it("la web (sin cabecera) recibe solo la cookie httpOnly", async () => {
    const res = await login("web@test.com");

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeNull();
    const cookies = res.headers["set-cookie"] || [];
    expect(cookies.some((c) => c.startsWith("token=") && c.includes("HttpOnly"))).toBe(true);
  });

  it("movil recibe el token en el body", async () => {
    const res = await login("movil@test.com", { "X-Client-Type": "movil" });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
  });

  it("escritorio recibe el token en el body", async () => {
    const res = await login("escritorio@test.com", { "X-Client-Type": "escritorio" });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
  });

  it("normaliza mayusculas y espacios de la cabecera", async () => {
    const res = await login("mayus@test.com", { "X-Client-Type": "  MOVIL " });

    expect(res.body.data.token).toBeTruthy();
  });

  it("un valor desconocido se trata como web (sin token en el body)", async () => {
    const res = await login("otro@test.com", { "X-Client-Type": "navegador" });

    expect(res.body.data.token).toBeNull();
  });
});
