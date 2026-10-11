import { describe, it, expect, vi, afterEach } from "vitest";
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

// CORS (M-16/H6, auditoria 2026-10-11): CERRADO por defecto.
//  - FRONTEND_URL + CORS_ALLOWLIST siempre permitidos.
//  - Localhost/Capacitor solo fuera de produccion.
//  - null/file:// (escritorio/movil empaquetado) SOLO con
//    ALLOW_DESKTOP_ORIGINS=true.
//  - Un origen desconocido no se refleja (el navegador lo bloquea).
const preflight = (origin, appObjetivo = app) =>
  request(appObjetivo)
    .options("/api/productos")
    .set("Origin", origin)
    .set("Access-Control-Request-Method", "POST");

afterEach(() => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "jwt-secret-solo-para-pruebas-vitest-000000000000";
  delete process.env.CRYPTO_SECRET_KEY;
  delete process.env.CORS_ALLOWLIST;
  delete process.env.DB_USER;
  delete process.env.DB_PASSWORD;
  delete process.env.ALLOW_DESKTOP_ORIGINS;
  process.env.FRONTEND_URL = "http://localhost:5173";
  vi.resetModules();
});

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

  it("M-16/H6: por defecto NO permite Electron (null) ni file://", async () => {
    const resNull = await preflight("null");
    expect(resNull.headers["access-control-allow-origin"]).toBeUndefined();

    const resFile = await preflight("file://");
    expect(resFile.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("M-16/H6: con ALLOW_DESKTOP_ORIGINS=true si permite null y file:// (entorno controlado)", async () => {
    process.env.ALLOW_DESKTOP_ORIGINS = "true";
    vi.resetModules();
    const { default: appDesktop } = await import("../app.js");

    const resNull = await preflight("null", appDesktop);
    expect(resNull.headers["access-control-allow-origin"]).toBe("null");

    const resFile = await preflight("file://", appDesktop);
    expect(resFile.headers["access-control-allow-origin"]).toBe("file://");
  });

  it("M-16/H6: en produccion solo entran FRONTEND_URL y CORS_ALLOWLIST (sin localhost ni desktop)", async () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "j".repeat(48);
    process.env.CRYPTO_SECRET_KEY = "c".repeat(48);
    // Evita el aborto de config/db.js por credenciales por defecto.
    process.env.DB_USER = "commercity_app";
    process.env.DB_PASSWORD = "clave-local";
    process.env.FRONTEND_URL = "https://commercity.example";
    process.env.CORS_ALLOWLIST = "https://admin.commercity.example";
    process.env.ALLOW_DESKTOP_ORIGINS = "false";
    vi.resetModules();
    const { default: appProd } = await import("../app.js");

    expect((await preflight("http://localhost:5173", appProd)).headers["access-control-allow-origin"]).toBeUndefined();
    expect((await preflight("https://localhost", appProd)).headers["access-control-allow-origin"]).toBeUndefined();
    expect((await preflight("null", appProd)).headers["access-control-allow-origin"]).toBeUndefined();
    expect((await preflight("https://malicioso.com", appProd)).headers["access-control-allow-origin"]).toBeUndefined();
    expect((await preflight("https://commercity.example", appProd)).headers["access-control-allow-origin"])
      .toBe("https://commercity.example");
    expect((await preflight("https://admin.commercity.example", appProd)).headers["access-control-allow-origin"])
      .toBe("https://admin.commercity.example");
  });

  it("no refleja un origen desconocido (https://malicioso.com)", async () => {
    const res = await preflight("https://malicioso.com");

    // Sin Access-Control-Allow-Origin el navegador bloquea la peticion cruzada.
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("no refleja Access-Control-Allow-Origin cuando la peticion llega sin header Origin", async () => {
    const res = await request(app)
      .options("/api/productos")
      .set("Access-Control-Request-Method", "POST");

    // Sin Origin (mismo origen o cliente no navegador) no hay CORS que aplicar.
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
