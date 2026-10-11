import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import express from "express";

// Gate DOCS_ENABLED de docs.routes.js: en produccion la documentacion se apaga
// por defecto y con DOCS_ENABLED=false en cualquier entorno. Cubre las tres
// rutas (openapi.json, docs, docs.js) (CON-004).
const appConDocs = (router) => {
  const app = express();
  app.use("/api", router);
  return app;
};

afterEach(() => {
  delete process.env.DOCS_ENABLED;
  vi.resetModules();
});

describe("docs.routes.js: gate DOCS_ENABLED", () => {
  it("DOCS_ENABLED=false apaga /api/openapi.json, /api/docs y /api/docs.js (404)", async () => {
    process.env.DOCS_ENABLED = "false";
    vi.resetModules();
    const { default: docsOff } = await import("../docs/docs.routes.js");
    const app = appConDocs(docsOff);

    for (const ruta of ["/api/openapi.json", "/api/docs", "/api/docs.js"]) {
      const res = await request(app).get(ruta);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    }
  });

  it("DOCS_ENABLED=true sirve el documento generado desde docs/api", async () => {
    process.env.DOCS_ENABLED = "true";
    vi.resetModules();
    const { default: docsOn } = await import("../docs/docs.routes.js");
    const app = appConDocs(docsOn);

    const res = await request(app).get("/api/openapi.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.1.0");
  });
});
