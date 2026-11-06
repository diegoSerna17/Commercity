#!/usr/bin/env node
/**
 * tools/medir-firefox.mjs
 * Evidencia de rendimiento en Firefox con Playwright:
 *  - carga la app real,
 *  - ejecuta peticiones GET a la API desde el navegador,
 *  - guarda HAR (sin cuerpos) y un JSON con tiempos y tamanos.
 *
 * Requiere playwright@1.65.0 instalado fuera del repo:
 *   %LOCALAPPDATA%\perf-playwright  (o PLAYWRIGHT_HOME)
 *   node node_modules/playwright/cli.js install firefox
 *
 * Uso:
 *   node tools/medir-firefox.mjs [--app URL] [--api URL] [--repeticiones N] [--salida DIR]
 */
import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
function valor(nombre, defecto) {
  const i = args.indexOf(nombre);
  return i >= 0 && args[i + 1] ? args[i + 1] : defecto;
}
const app = valor("--app", "http://localhost:5173").replace(/\/+$/, "");
const api = valor("--api", "http://localhost:3000").replace(/\/+$/, "");
const repeticiones = Number(valor("--repeticiones", "5"));
const salidaDir = valor("--salida", join(ROOT, "docs", "informes", "rendimiento"));

const playwrightHome =
  process.env.PLAYWRIGHT_HOME || join(process.env.LOCALAPPDATA || homedir(), "perf-playwright");
const requireDesdeHome = createRequire(join(playwrightHome, "package.json"));
const { firefox } = requireDesdeHome("playwright");

const endpoints = [
  { nombre: "catalogo-p1", url: `${api}/api/productos?page=1&limit=20` },
  { nombre: "catalogo-p50", url: `${api}/api/productos?page=50&limit=20` },
  { nombre: "busqueda", url: `${api}/api/productos?nombre=${encodeURIComponent("a")}` },
  { nombre: "categorias", url: `${api}/api/categorias` },
  { nombre: "vendedores", url: `${api}/api/vendedores?page=1&limit=20` },
];

function percentil(ordenados, p) {
  if (ordenados.length === 0) return null;
  const idx = Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1);
  return Number(ordenados[Math.max(0, idx)].toFixed(2));
}

const marca = new Date().toISOString().replace(/[:.]/g, "-");
const harPath = join(salidaDir, `firefox-${marca}.har`);
const jsonPath = join(salidaDir, `firefox-${marca}.json`);
mkdirSync(salidaDir, { recursive: true });

const browser = await firefox.launch({ headless: true });
const version = browser.version();
const context = await browser.newContext({
  viewport: { width: 1366, height: 768 },
  recordHar: { path: harPath, content: "omit" },
});
const page = await context.newPage();

console.log(`FIREFOX: ${version} | app ${app} | api ${api}`);
await page.goto(app, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(2500);

const muestras = [];
for (const endpoint of endpoints) {
  const tiempos = [];
  for (let i = 0; i < repeticiones; i += 1) {
    const r = await page.evaluate(async (url) => {
      const t0 = performance.now();
      const res = await fetch(url, { credentials: "omit" });
      const texto = await res.text();
      const total = performance.now() - t0;
      const base = url.split("?")[0];
      const entries = performance
        .getEntriesByType("resource")
        .filter((e) => e.name.startsWith(base));
      const entry = entries[entries.length - 1] || null;
      return {
        status: res.status,
        total_ms: Number(total.toFixed(2)),
        bytes_texto: texto.length,
        resource_timing: entry
          ? {
              duration_ms: Number(entry.duration.toFixed(2)),
              transferSize: entry.transferSize,
              encodedBodySize: entry.encodedBodySize,
              decodedBodySize: entry.decodedBodySize,
              responseStart: Number(entry.responseStart.toFixed(2)),
              requestStart: Number(entry.requestStart.toFixed(2)),
              startTime: Number(entry.startTime.toFixed(2)),
            }
          : null,
      };
    }, endpoint.url);
    muestras.push({ endpoint: endpoint.nombre, ...r });
    tiempos.push(r.total_ms);
    await page.waitForTimeout(150);
  }
  const ordenados = [...tiempos].sort((a, b) => a - b);
  console.log(
    `  ${endpoint.nombre}: p50 ${percentil(ordenados, 50)} ms | p95 ${percentil(ordenados, 95)} ms | estados ${[...new Set(muestras.filter((m) => m.endpoint === endpoint.nombre).map((m) => m.status))].join(",")}`
  );
}

await context.close();
await browser.close();

const har = JSON.parse(readFileSync(harPath, "utf8"));
const entradasHar = (har.log?.entries ?? [])
  .filter((e) => e.request?.url?.includes("/api/"))
  .map((e) => ({
    url: e.request.url,
    metodo: e.request.method,
    status: e.response?.status,
    tiempo_total_ms: e.time,
    espera_ttfb_ms: e.timings?.wait,
    recepcion_ms: e.timings?.receive,
    headers_bytes: e.response?.headersSize,
    cuerpo_bytes: e.response?.bodySize,
    contenido_bytes: e.response?.content?.size,
  }));

const resumen = endpoints.map((endpoint) => {
  const propias = muestras.filter((m) => m.endpoint === endpoint.nombre);
  const tiempos = propias.map((m) => m.total_ms).sort((a, b) => a - b);
  const harPropias = entradasHar.filter((e) => e.url === endpoint.url);
  const esperas = harPropias.map((e) => e.espera_ttfb_ms).filter((v) => typeof v === "number").sort((a, b) => a - b);
  return {
    endpoint: endpoint.nombre,
    n: propias.length,
    p50_ms: percentil(tiempos, 50),
    p95_ms: percentil(tiempos, 95),
    ttfb_har_p50_ms: percentil(esperas, 50),
    bytes_har_promedio: harPropias.length
      ? Math.round(harPropias.reduce((a, e) => a + (e.cuerpo_bytes || 0), 0) / harPropias.length)
      : null,
    headers_har_promedio: harPropias.length
      ? Math.round(harPropias.reduce((a, e) => a + (e.headers_bytes || 0), 0) / harPropias.length)
      : null,
    estados: [...new Set(propias.map((m) => m.status))],
  };
});

writeFileSync(
  jsonPath,
  JSON.stringify(
    {
      fecha: new Date().toISOString(),
      navegador: `firefox ${version}`,
      app,
      api,
      repeticiones,
      resumen,
      muestras,
      har: entradasHar,
    },
    null,
    2
  ) + "\n"
);

console.log(`FIREFOX: JSON ${jsonPath}`);
console.log(`FIREFOX: HAR  ${harPath}`);
