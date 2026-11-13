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
const indexHtml = join(ROOT, "apps", "movil", "www", "index.html");

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
  // La barra final no cambia el endpoint: OpenAPI registra `/api/carrito/` y
  // el cliente llama `/api/carrito`. Se normaliza en ambos lados.
  const base = r.split("?")[0].replace(/\/+$/, "");
  const ok = [...rutas].some((o) => {
    const oficial = o.split("{")[0].replace(/\/+$/, "");
    return oficial === base || base.startsWith(`${oficial}/`);
  });
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
// 1.5.9: register exige acepta_terminos (RF6) y el cliente movil ya tiene la
// casilla reg-terms; debe enviarla solo cuando esta marcada.
const apiSrc = existsSync(apiJs) ? readFileSync(apiJs, "utf8") : "";
if (!/acepta_terminos/.test(apiSrc)) {
  console.error("contrato-movil: api.register debe enviar acepta_terminos (RF6)");
  errores += 1;
}
if (!/reg-terms/.test(src) || !/acepta_terminos/.test(src)) {
  console.error("contrato-movil: handleRegistro debe leer reg-terms y pasarla a api.register");
  errores += 1;
}
const htmlSrc = existsSync(indexHtml) ? readFileSync(indexHtml, "utf8") : "";
if (!/id="reg-terms"/.test(htmlSrc)) {
  console.error("contrato-movil: falta la casilla de terminos id=reg-terms en registro");
  errores += 1;
}
// 1.5.9: el guardado de la cuenta de la plataforma es step-up y exige password.
if (!/admin-bank-password/.test(src) || !/admin-bank-password/.test(htmlSrc)) {
  console.error("contrato-movil: el formulario admin debe pedir admin-bank-password y enviarla");
  errores += 1;
}
if (errores > 0) process.exit(1);
console.log("contrato-movil: OK");
