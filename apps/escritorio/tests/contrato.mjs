#!/usr/bin/env node
/**
 * apps/escritorio/tests/contrato.mjs (TASK-10.4, Fase 10)
 * Valida que las llamadas del cliente de escritorio existan en docs/api/openapi.json,
 * sin levantar servidor (verificacion estatica).
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const openapiPath = join(ROOT, "docs", "api", "openapi.json");
const appJs = join(ROOT, "apps", "escritorio", "src", "app.js");
const apiJs = join(ROOT, "apps", "escritorio", "src", "api.js");
const indexHtml = join(ROOT, "apps", "escritorio", "src", "index.html");

const spec = JSON.parse(readFileSync(openapiPath, "utf8"));
const rutas = new Set(Object.keys(spec.paths ?? {}));
let errores = 0;
if (!existsSync(appJs)) {
  console.log("contrato-escritorio: src/app.js no existe, se omite");
  process.exit(0);
}
const src = readFileSync(appJs, "utf8");
const usadas = new Set([...src.matchAll(/["'`](\/api\/[A-Za-z0-9/_{}-]+)["'`]/g)].map((m) => m[1].replace(/\/\d+/g, "/{id}")));
console.log(`contrato-escritorio: ${usadas.size} rutas usadas, ${rutas.size} en OpenAPI`);
for (const r of usadas) {
  // La barra final no cambia el endpoint: OpenAPI registra `/api/seguidores/`
  // y el cliente llama `/api/seguidores`. Se normaliza en ambos lados.
  const base = r.split("?")[0].replace(/\/+$/, "");
  const ok = [...rutas].some((o) => {
    const oficial = o.split("{")[0].replace(/\/+$/, "");
    return oficial === base || base.startsWith(`${oficial}/`);
  });
  if (!ok) {
    console.error(`contrato-escritorio: ruta sin OpenAPI: ${r}`);
    errores += 1;
  }
}
if (/\sonclick\s*=\s*["']/i.test(src)) {
  console.error("contrato-escritorio: no debe quedar onclick inline en el HTML (M-17/M-18)");
  errores += 1;
}
// A-1 (M-28): el escritorio nunca debe enviar el PAN. Solo circulan los
// ultimos 4 digitos y la marca (igual que web y movil). Si reaparece
// `numero_tarjeta` como clave del payload, el contrato falla.
if (/\bnumero_tarjeta\s*:/.test(src)) {
  console.error("contrato-escritorio: numero_tarjeta prohibido (M-28); usar ultimos4_tarjeta + marca_tarjeta");
  errores += 1;
}
if (!/\bultimos4_tarjeta\s*:/.test(src)) {
  console.error("contrato-escritorio: falta ultimos4_tarjeta en el payload de pago (M-28)");
  errores += 1;
}
// 1.5.9: el backend exige acepta_terminos en register (RF6). El cliente debe
// enviarlo solo cuando la casilla de terminos este marcada y la pantalla debe
// ofrecer esa casilla.
const apiSrc = existsSync(apiJs) ? readFileSync(apiJs, "utf8") : "";
if (!/acepta_terminos/.test(apiSrc)) {
  console.error("contrato-escritorio: api.register debe enviar acepta_terminos (RF6)");
  errores += 1;
}
if (!/reg-terms/.test(src) || !/aceptaTerminos|acceptedTerms|reg-terms/.test(src)) {
  console.error("contrato-escritorio: doRegistro debe leer la casilla reg-terms y pasarla a api.register");
  errores += 1;
}
const htmlSrc = existsSync(indexHtml) ? readFileSync(indexHtml, "utf8") : "";
if (!/id="reg-terms"/.test(htmlSrc)) {
  console.error("contrato-escritorio: falta la casilla de terminos id=reg-terms en registro");
  errores += 1;
}
// 1.5.9: el guardado de la cuenta de la plataforma es step-up y exige password.
if (!/admin-bank-password/.test(src) || !/admin-bank-password/.test(htmlSrc)) {
  console.error("contrato-escritorio: el formulario admin debe pedir admin-bank-password y enviarla");
  errores += 1;
}
if (errores > 0) process.exit(1);
console.log("contrato-escritorio: OK");
