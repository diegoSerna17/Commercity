import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import app from "../app.js";

// A-3: validacion de Origin/Referer en mutantes con cookie `token`.
// Se usa una ruta inexistente para no tocar la BD: el middleware corre antes
// de los routers, asi que el 403 se evalua sobre la respuesta sin consultar.
// Sin el middleware, estas peticiones llegarian al catch-all 404.
describe("A-3 validarOriginCookies (CSRF en profundidad)", () => {
  const RUTA = "/api/ruta-inexistente-csrf";

  afterEach(() => {
    delete process.env.ALLOW_DESKTOP_ORIGINS;
  });

  it("POST con cookie y Origin permitido pasa (llega al 404, no 403)", async () => {
    const res = await request(app)
      .post(RUTA)
      .set("Cookie", "token=abc")
      .set("Origin", "http://localhost:5173");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("POST con cookie y Origin no permitido responde 403 FORBIDDEN", async () => {
    const res = await request(app)
      .post(RUTA)
      .set("Cookie", "token=abc")
      .set("Origin", "https://malicioso.example");
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      success: false,
      error: { code: "FORBIDDEN", message: "Origen no permitido." },
    });
  });

  it("Bearer con Origin malo no se bloquea (auth por header, sin CSRF)", async () => {
    const res = await request(app)
      .post(RUTA)
      .set("Authorization", "Bearer abc")
      .set("Origin", "https://malicioso.example");
    expect(res.status).toBe(404);
  });

  it("GET con cookie y Origin malo no se bloquea (metodo seguro)", async () => {
    const res = await request(app)
      .get(RUTA)
      .set("Cookie", "token=abc")
      .set("Origin", "https://malicioso.example");
    expect(res.status).toBe(404);
  });

  it("POST con cookie, sin Origin pero con Referer permitido pasa", async () => {
    const res = await request(app)
      .post(RUTA)
      .set("Cookie", "token=abc")
      .set("Referer", "http://localhost:5173/algun/form");
    expect(res.status).toBe(404);
  });

  it("POST con cookie, sin Origin pero con Referer malo responde 403", async () => {
    const res = await request(app)
      .post(RUTA)
      .set("Cookie", "token=abc")
      .set("Referer", "https://malicioso.example/form");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("POST con cookie sin Origin ni Referer pasa (cliente no-navegador)", async () => {
    const res = await request(app).post(RUTA).set("Cookie", "token=abc");
    expect(res.status).toBe(404);
  });

  it("POST sin cookie con Origin malo pasa (no hay sesion por cookie)", async () => {
    const res = await request(app)
      .post(RUTA)
      .set("Origin", "https://malicioso.example");
    expect(res.status).toBe(404);
  });

  it("Origin null sin ALLOW_DESKTOP_ORIGINS responde 403; con true pasa", async () => {
    const bloqueado = await request(app)
      .post(RUTA)
      .set("Cookie", "token=abc")
      .set("Origin", "null");
    expect(bloqueado.status).toBe(403);

    process.env.ALLOW_DESKTOP_ORIGINS = "true";
    const permitido = await request(app)
      .post(RUTA)
      .set("Cookie", "token=abc")
      .set("Origin", "null");
    expect(permitido.status).toBe(404);
  });
});
