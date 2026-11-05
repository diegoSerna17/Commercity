import { describe, it, expect, vi } from "vitest";

// B2 (auditoria 2026-11-04): TRUST_PROXY por env configura el trust proxy de
// Express. El caso sin variable y el valor nombrado viven en
// cors.middleware.test.js para no mutar el entorno entre imports.
vi.mock("mysql2/promise", () => ({
  __esModule: true,
  default: { createPool: vi.fn(() => ({ query: vi.fn(), getConnection: vi.fn() })) },
}));

process.env.NODE_ENV = "development";
process.env.JWT_SECRET = "jwt-secret-de-pruebas-trust-proxy-000000000";
process.env.DB_USER = "trust_proxy_user";
process.env.DB_PASSWORD = "clave-local-trust-proxy";
process.env.TRUST_PROXY = "1";
process.env.CORS_ALLOWLIST = "https://extra.example.com";

const { default: app } = await import("../app.js");

describe("TRUST_PROXY", () => {
  it("con un numero de hops configura trust proxy numerico", () => {
    expect(app.get("trust proxy")).toBe(1);
  });
});

