import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// Mock de mysql2/promise: createPool devuelve un pool simulado (sin BD real).
// El preflight OPTIONS no consulta la BD, pero importar app.js crea el pool.
vi.mock("mysql2/promise", () => ({
  __esModule: true,
  default: { createPool: vi.fn(() => ({ query: vi.fn(), getConnection: vi.fn() })) },
}));

// El secreto debe existir antes de importar app.js (utils/config.js lo exige).
process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto_test";

const { default: app } = await import("../app.js");

// Mismo origen web que resuelve app.js (el .env del proyecto define FRONTEND_URL).
const FRONTEND_WEB = process.env.FRONTEND_URL || "http://localhost:5173";

// CORS (RNF seguridad / regla api-seguridad.md): ademas del frontend web, la
// WebView de Capacitor (app movil Ionic) envia su propio Origin y debe poder
// llamar a la API; los origenes desconocidos no se reflejan (los bloquea el
// navegador). Se prueba el preflight OPTIONS sobre una ruta real del backend.
const preflight = (origin) =>
  request(app)
    .options("/api/productos")
    .set("Origin", origin)
    .set("Access-Control-Request-Method", "POST");

describe("CORS (origenes permitidos: frontend web + WebView Capacitor)", () => {
  it("permite el origen del frontend web configurado (FRONTEND_URL o default localhost:5173)", async () => {
    const res = await preflight(FRONTEND_WEB);

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(FRONTEND_WEB);
  });

  it("permite la WebView de Capacitor Android con androidScheme https (https://localhost)", async () => {
    const res = await preflight("https://localhost");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("https://localhost");
  });

  it("permite la WebView de Capacitor Android con esquema http / dev (http://localhost)", async () => {
    const res = await preflight("http://localhost");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost");
  });

  it("permite la WebView de Capacitor iOS (capacitor://localhost)", async () => {
    const res = await preflight("capacitor://localhost");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("capacitor://localhost");
  });

  it("no refleja un origen desconocido (https://malicioso.com)", async () => {
    const res = await preflight("https://malicioso.com");

    // Sin Access-Control-Allow-Origin el navegador bloquea la peticion cruzada.
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
