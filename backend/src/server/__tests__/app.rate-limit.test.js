import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// Mock de mysql2/promise: createPool devuelve un pool simulado (sin BD real).
vi.mock("mysql2/promise", () => ({
  __esModule: true,
  default: { createPool: vi.fn(() => ({ query: vi.fn(), getConnection: vi.fn() })) },
}));

// M-9/H7: los rate limits con `skip` se desactivan en NODE_ENV=test, asi que
// este archivo los ejercita con NODE_ENV=development sobre una instancia fresca
// de app.js. El JWT_SECRET debe ser largo (fuera de test se valida >= 32).
process.env.NODE_ENV = "development";
process.env.JWT_SECRET = "jwt-secret-de-pruebas-rate-limit-000000000000";

const { default: app } = await import("../app.js");

describe("Rate limits por endpoint (M-9/H7)", () => {
  it("register: 429 despues de 5 intentos por hora desde la misma IP", async () => {
    const estados = [];
    for (let i = 0; i < 5; i += 1) {
      const res = await request(app)
        .post("/api/usuarios/register")
        .send({ email: `rl_${i}@test.local`, password: "clave-segura-123", nombre_completo: "RL" });
      estados.push(res.status);
    }
    // Los primeros 5 pasan al validador/controlador (nunca 429).
    expect(estados.every((s) => s !== 429)).toBe(true);

    const sexto = await request(app)
      .post("/api/usuarios/register")
      .send({ email: "rl_6@test.local", password: "clave-segura-123", nombre_completo: "RL" });
    expect(sexto.status).toBe(429);
    expect(sexto.body.error.code).toBe("RATE_LIMIT");
  });

  it("seguidores: 429 despues de 30 peticiones por minuto desde la misma IP", async () => {
    let ultimo;
    for (let i = 0; i < 31; i += 1) {
      ultimo = await request(app).get("/api/seguidores/siguiendo");
    }
    expect(ultimo.status).toBe(429);
    expect(ultimo.body.error.code).toBe("RATE_LIMIT");
  });

  it("login: el cupo por CUENTA (5/15min) bloquea solo al email atacado", async () => {
    const ataque = () =>
      request(app)
        .post("/api/usuarios/login")
        .send({ email: "victima@test.local", password: "intento-fallido" });

    let ultimo;
    for (let i = 0; i < 6; i += 1) {
      ultimo = await ataque();
    }
    expect(ultimo.status).toBe(429);
    expect(ultimo.body.error.code).toBe("RATE_LIMIT");

    // Otra cuenta desde la misma IP pasa: el cupo por IP (10/min) aun no llega
    // y la clave de cuenta es distinta.
    const otra = await request(app)
      .post("/api/usuarios/login")
      .send({ email: "otra-cuenta@test.local", password: "intento-fallido" });
    expect(otra.status).not.toBe(429);
  });
});
