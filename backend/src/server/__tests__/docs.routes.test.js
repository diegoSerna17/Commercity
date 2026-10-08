import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

// Rutas de documentacion OpenAPI (Fase 3 docs-api): no tocan la BD,
// solo leen docs/api/ del disco. Gate DOCS_ENABLED (on fuera de produccion).
describe("Documentacion OpenAPI (/api/openapi.json y /api/docs)", () => {
  it("sirve el documento OpenAPI 3.1 con las 72 operaciones", async () => {
    const res = await request(app).get("/api/openapi.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.1.0");
    expect(res.body.info.title).toBe("CommerCity API");
    const numOps = Object.values(res.body.paths).reduce((n, item) => n + Object.keys(item).length, 0);
    expect(numOps).toBe(72);
  });

  it("login es publico y /me exige bearer (seguridad por operacion)", async () => {
    const res = await request(app).get("/api/openapi.json");
    expect(res.body.paths["/api/usuarios/login"].post.security).toBeUndefined();
    expect(res.body.paths["/api/usuarios/me"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(res.body.paths["/api/admin/stats"].get["x-roles"]).toEqual(["administrador"]);
  });

  it("sirve la pagina /api/docs con el bundle Scalar pineado", async () => {
    const res = await request(app).get("/api/docs");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toContain("@scalar/api-reference@1.73.1");
    expect(res.text).toContain("sha384-");
  });

  it("no captura rutas de productos (/api/productos sigue vivo)", async () => {
    const res = await request(app).get("/api/openapi.json");
    expect(res.status).toBe(200);
    // El router de docs no interfiere: una ruta inexistente sigue dando NOT_FOUND uniforme.
    const nf = await request(app).get("/api/ruta-inexistente-docs");
    expect(nf.status).toBe(404);
    expect(nf.body.success).toBe(false);
  });
});
