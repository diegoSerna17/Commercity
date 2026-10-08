import { Router } from "express";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { errorResponse } from "../utils/response.js";

const router = Router();

// docs/api/ vive en la raiz del repo (versionado por excepcion .gitignore).
const dirDocsApi = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "docs", "api");

// Gate conservador: visible fuera de produccion salvo DOCS_ENABLED=false;
// en produccion solo con DOCS_ENABLED=true. No toca helmet/CSP/CORS.
const DOCS_HABILITADAS =
  process.env.DOCS_ENABLED === "true" ||
  (process.env.DOCS_ENABLED !== "false" && process.env.NODE_ENV !== "production");

// GET /api/openapi.json — documento OpenAPI 3.1 generado (npm run docs:api).
router.get("/openapi.json", (_req, res) => {
  if (!DOCS_HABILITADAS) {
    return errorResponse(res, "Endpoint no encontrado. Revisa el método HTTP y la ruta.", 404);
  }
  const ruta = join(dirDocsApi, "openapi.json");
  if (!existsSync(ruta)) {
    return errorResponse(res, "Documentacion no generada. Ejecuta npm run docs:api en backend.", 404);
  }
  return res.type("json").send(readFileSync(ruta, "utf8"));
});

// GET /api/docs — pagina Scalar (docs/api/index.html). Si la CSP del backend
// bloquea el CDN, la pagina muestra el fallback con el enlace al JSON.
router.get("/docs", (_req, res) => {
  if (!DOCS_HABILITADAS) {
    return errorResponse(res, "Endpoint no encontrado. Revisa el método HTTP y la ruta.", 404);
  }
  const ruta = join(dirDocsApi, "index.html");
  if (!existsSync(ruta)) {
    return errorResponse(res, "Documentacion no generada.", 404);
  }
  return res.type("html").send(readFileSync(ruta, "utf8"));
});

export default router;
