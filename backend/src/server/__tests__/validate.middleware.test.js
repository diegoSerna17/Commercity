import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { z } from "zod";

// B2 (auditoria 2026-11-04): el middleware validate() debe limpiar el archivo
// que multer ya escribio cuando el cuerpo no cumple el schema.
vi.mock("../config/multer.js", () => ({
  borrarArchivoSubido: vi.fn(),
}));

const { borrarArchivoSubido } = await import("../config/multer.js");
const { validate } = await import("../middleware/validate.middleware.js");

const app = express();
app.use(express.json());
app.post(
  "/con-archivo",
  (req, _res, next) => {
    req.file = { path: "tmp/archivo.jpg" };
    next();
  },
  validate(z.object({ nombre: z.string().min(1, "El nombre es obligatorio") })),
  (_req, res) => res.json({ ok: true })
);
app.get(
  "/query",
  validate(
    z.object({ page: z.coerce.number().int().min(1).default(1) }),
    "query"
  ),
  (req, res) => res.json({ page: req.query.page })
);

describe("validate()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responde 400 con el primer mensaje y limpia el archivo subido", async () => {
    const res = await request(app).post("/con-archivo").send({ nombre: "" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("El nombre es obligatorio");
    expect(borrarArchivoSubido).toHaveBeenCalledWith({ path: "tmp/archivo.jpg" });
  });

  it("reemplaza req.query con los valores coercionados y los defaults", async () => {
    const res = await request(app).get("/query");

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
  });

  it("rechaza una query invalida sin llegar al handler", async () => {
    const res = await request(app).get("/query?page=0");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
