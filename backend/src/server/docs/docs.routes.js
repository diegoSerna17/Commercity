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

// CSP acotada SOLO a GET /api/docs: identica a la default de helmet v8 salvo
// script-src (suma el CDN pineado de Scalar) e img-src (suma https: para
// assets de la UI). Se aplica con res.set() en esa respuesta; la config
// global de helmet en app.js NO se modifica.
const CSP_DOCS = [
  "default-src 'self'",
  "base-uri 'self'",
  "font-src 'self' https: data:",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "img-src 'self' data: https:",
  "object-src 'none'",
  "script-src 'self' https://cdn.jsdelivr.net",
  "script-src-attr 'none'",
  "style-src 'self' https: 'unsafe-inline'",
  "upgrade-insecure-requests",
].join(";");

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

// GET /api/docs — pagina Scalar (docs/api/index.html). El init vive en
// /api/docs.js (externo) para no necesitar 'unsafe-inline' en script-src.
router.get("/docs", (_req, res) => {
  if (!DOCS_HABILITADAS) {
    return errorResponse(res, "Endpoint no encontrado. Revisa el método HTTP y la ruta.", 404);
  }
  const ruta = join(dirDocsApi, "index.html");
  if (!existsSync(ruta)) {
    return errorResponse(res, "Documentacion no generada.", 404);
  }
  res.set("Content-Security-Policy", CSP_DOCS);
  return res.type("html").send(readFileSync(ruta, "utf8"));
});

// GET /api/docs.js — init de Scalar (same-origin, cubierto por script-src 'self').
router.get("/docs.js", (_req, res) => {
  if (!DOCS_HABILITADAS) {
    return errorResponse(res, "Endpoint no encontrado. Revisa el método HTTP y la ruta.", 404);
  }
  const ruta = join(dirDocsApi, "docs.js");
  if (!existsSync(ruta)) {
    return errorResponse(res, "Documentacion no generada.", 404);
  }
  return res.type("application/javascript").send(readFileSync(ruta, "utf8"));
});

export default router;
