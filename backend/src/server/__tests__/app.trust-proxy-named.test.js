import { describe, it, expect, vi } from "vitest";

// B2 (auditoria 2026-11-04): TRUST_PROXY acepta valores nombrados de Express
// ("loopback", "linklocal", ...). Archivo separado para fijar el env antes del
// import sin mutarlo entre pruebas.
vi.mock("mysql2/promise", () => ({
  __esModule: true,
  default: { createPool: vi.fn(() => ({ query: vi.fn(), getConnection: vi.fn() })) },
}));

process.env.NODE_ENV = "development";
process.env.JWT_SECRET = "jwt-secret-de-pruebas-trust-proxy-000000000";
process.env.DB_USER = "trust_proxy_user";
process.env.DB_PASSWORD = "clave-local-trust-proxy";
process.env.TRUST_PROXY = "loopback";

const { default: app } = await import("../app.js");

describe("TRUST_PROXY con valor nombrado", () => {
  it("aplica el valor de Express sin convertirlo a numero", () => {
    expect(app.get("trust proxy")).toBe("loopback");
  });
});
