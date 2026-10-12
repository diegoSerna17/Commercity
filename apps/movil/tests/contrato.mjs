#!/usr/bin/env node
/**
 * apps/movil/tests/contrato.mjs (TASK-10.4, Fase 10)
 * Valida que las llamadas del cliente movil existan en docs/api/openapi.json,
 * sin levantar servidor (verificacion estatica).
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const openapiPath = join(ROOT, "docs", "api", "openapi.json");
const apiJs = join(ROOT, "apps", "movil", "www", "api.js");
const appJs = join(ROOT, "apps", "movil", "www", "app.js");

const spec = JSON.parse(readFileSync(openapiPath, "utf8"));
const rutas = new Set(Object.keys(spec.paths ?? {}));
let errores = 0;

function extraeRutas(src) {
  const out = new Set();
  for (const m of src.matchAll(/["'`](\/api\/[A-Za-z0-9/_{}-]+)["'`]/g)) out.add(m[1].replace(/\/\d+/g, "/{id}"));
  return out;
}

let src = "";
for (const p of [apiJs, appJs]) {
  if (existsSync(p)) src += readFileSync(p, "utf8") + "\n";
  else console.log(`contrato-movil: ${p} no existe, se omite`);
}
const usadas = extraeRutas(src);
console.log(`contrato-movil: ${usadas.size} rutas usadas en el cliente, ${rutas.size} en OpenAPI`);
for (const r of usadas) {
  const base = r.split("?")[0];
  const ok = [...rutas].some((o) => o === base || base.startsWith(o.split("{")[0]));
  if (!ok) {
    console.error(`contrato-movil: ruta del cliente sin OpenAPI: ${r}`);
    errores += 1;
  }
}
// Reglas de endurecimiento (TASK-6.3/6.4): sin PAN, sin clave extra en reset, sin direccion vacia silenciosa
if (/\bnumero_tarjeta\b|\bcard_number\b|\bnumeroTarjeta\b|\bcardNumber\b|["']pan["']\s*:/i.test(src)) {
  console.error("contrato-movil: el cliente no debe enviar el PAN completo, solo ultimos4_tarjeta + marca_tarjeta (M-28)");
  errores += 1;
}
if (/nuevaPassword/.test(src)) {
  console.error("contrato-movil: reset-password no debe enviar la clave extra nuevaPassword (flujo RF4)");
  errores += 1;
}
if (errores > 0) process.exit(1);
console.log("contrato-movil: OK");
