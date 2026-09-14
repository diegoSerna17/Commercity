import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

// Verifica la lista blanca de CORS para los tres clientes de la Fase 2:
// web (Vite), escritorio (Electron, sin Origin / "null") y movil (Ionic/Capacitor).
// Se usa una ruta inexistente para no tocar la BD: el middleware CORS corre
// antes de los routers y su cabecera se evalua sobre la respuesta final.
describe("CORS por origen (web / escritorio / movil)", () => {
  const RUTA = "/api/ruta-inexistente-cors";

  it("permite el origen del frontend web (localhost:5173)", async () => {
    const res = await request(app).get(RUTA).set("Origin", "http://localhost:5173");
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });

  it("permite el esquema de Ionic/Capacitor (capacitor://localhost)", async () => {
    const res = await request(app).get(RUTA).set("Origin", "capacitor://localhost");
    expect(res.headers["access-control-allow-origin"]).toBe("capacitor://localhost");
  });

  it("permite http://localhost y https://localhost (WebView Android)", async () => {
    const httpRes = await request(app).get(RUTA).set("Origin", "http://localhost");
    expect(httpRes.headers["access-control-allow-origin"]).toBe("http://localhost");
    const httpsRes = await request(app).get(RUTA).set("Origin", "https://localhost");
    expect(httpsRes.headers["access-control-allow-origin"]).toBe("https://localhost");
  });

  it("acepta peticiones sin Origin (Electron main process / curl)", async () => {
    const res = await request(app).get(RUTA);
    expect(res.status).toBeLessThan(500);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("rechaza un origen no autorizado", async () => {
    const res = await request(app).get(RUTA).set("Origin", "https://origen-no-permitido.example");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("responde el preflight OPTIONS de un origen permitido", async () => {
    const res = await request(app)
      .options("/api/carrito")
      .set("Origin", "capacitor://localhost")
      .set("Access-Control-Request-Method", "POST");
    expect([200, 204]).toContain(res.status);
    expect(res.headers["access-control-allow-origin"]).toBe("capacitor://localhost");
  });
});
