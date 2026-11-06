#!/usr/bin/env node
/**
 * backend/scripts/medir-endpoints.mjs
 * Mide latencia (TTFB y total) de los endpoints del backend sin dependencias
 * nuevas: usa node:http/https y un pool de concurrencia simple.
 *
 * Uso (desde backend/):
 *   node scripts/medir-endpoints.mjs --n 200 --concurrencia 10
 *   $env:PERF_TOKEN="..."; node scripts/medir-endpoints.mjs
 *
 * El token NUNCA se pasa por argumento: se lee de PERF_TOKEN para no dejarlo
 * en el historial de la shell.
 */
import http from "node:http";
import https from "node:https";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
function valor(nombre, defecto) {
  const i = args.indexOf(nombre);
  return i >= 0 && args[i + 1] ? args[i + 1] : defecto;
}
const base = valor("--base", "http://localhost:3000").replace(/\/+$/, "");
const n = Number(valor("--n", "200"));
const concurrencia = Math.max(1, Number(valor("--concurrencia", "10")));
const calentamiento = Math.max(0, Number(valor("--calentamiento", "20")));
const salida = valor("--salida", "");
const token = process.env.PERF_TOKEN;
const ayuda = args.includes("--help") || args.includes("-h");

if (ayuda) {
  console.log("Uso: node scripts/medir-endpoints.mjs [--base URL] [--n N] [--concurrencia N] [--calentamiento N] [--salida RUTA]");
  console.log("  PERF_TOKEN  Token Bearer opcional (solo por variable de entorno).");
  process.exit(0);
}
if (!Number.isInteger(n) || n <= 0) {
  console.error(`MEDICION: --n invalido: ${n}`);
  process.exit(1);
}

const endpoints = [
  { nombre: "health", ruta: "/health" },
  { nombre: "catalogo-p1", ruta: "/api/productos?page=1&limit=20" },
  { nombre: "catalogo-p50", ruta: "/api/productos?page=50&limit=20" },
  { nombre: "busqueda", ruta: `/api/productos?nombre=${encodeURIComponent("a")}` },
  { nombre: "categorias", ruta: "/api/categorias" },
  { nombre: "vendedores", ruta: "/api/vendedores?page=1&limit=20" },
  { nombre: "producto-detalle", ruta: "/api/productos/1" },
  { nombre: "seguidores-contadores", ruta: "/api/seguidores/1/contadores" },
  { nombre: "calificaciones-vendedor", ruta: "/api/calificaciones/vendedor/1" },
  { nombre: "notificaciones", ruta: "/api/notificaciones?pagina=1&limite=10", auth: true },
  { nombre: "historial", ruta: "/api/historial/compras", auth: true },
  { nombre: "admin-stats", ruta: "/api/admin/stats", auth: true },
];

const activos = endpoints.filter((e) => !e.auth || token);
const omitidos = endpoints.filter((e) => e.auth && !token);
if (omitidos.length > 0) {
  console.log(`MEDICION: sin PERF_TOKEN, se omiten: ${omitidos.map((e) => e.nombre).join(", ")}`);
}

function peticion(url) {
  const lib = url.protocol === "https:" ? https : http;
  const inicio = performance.now();
  return new Promise((resolve) => {
    const req = lib.request(
      url,
      {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      (res) => {
        const ttfb = performance.now() - inicio;
        let bytes = 0;
        res.on("data", (c) => {
          bytes += c.length;
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            ttfb,
            total: performance.now() - inicio,
            bytes,
          });
        });
      }
    );
    req.setTimeout(20000, () => req.destroy(new Error("timeout")));
    req.on("error", (e) => {
      resolve({ error: e.code || e.message, ttfb: null, total: performance.now() - inicio, bytes: 0 });
    });
    req.end();
  });
}

function percentil(ordenados, p) {
  if (ordenados.length === 0) return null;
  const idx = Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1);
  return Number(ordenados[Math.max(0, idx)].toFixed(2));
}

async function medirEndpoint({ nombre, ruta }) {
  const url = new URL(base + ruta);
  for (let i = 0; i < calentamiento; i += 1) await peticion(url);

  const resultados = [];
  let siguiente = 0;
  async function trabajador() {
    while (siguiente < n) {
      siguiente += 1;
      resultados.push(await peticion(url));
    }
  }
  const inicio = performance.now();
  await Promise.all(Array.from({ length: Math.min(concurrencia, n) }, trabajador));
  const duracion = (performance.now() - inicio) / 1000;

  const ok = resultados.filter((r) => !r.error);
  const tiempos = ok.map((r) => r.total).sort((a, b) => a - b);
  const ttfb = ok.map((r) => r.ttfb).sort((a, b) => a - b);
  const errores = resultados.filter((r) => r.error).length;
  const porEstado = {};
  for (const r of resultados) porEstado[r.status ?? r.error] = (porEstado[r.status ?? r.error] || 0) + 1;

  return {
    endpoint: nombre,
    ruta,
    n,
    concurrencia,
    errores,
    por_estado: porEstado,
    p50_ms: percentil(tiempos, 50),
    p95_ms: percentil(tiempos, 95),
    p99_ms: percentil(tiempos, 99),
    promedio_ms: tiempos.length ? Number((tiempos.reduce((a, b) => a + b, 0) / tiempos.length).toFixed(2)) : null,
    ttfb_p50_ms: percentil(ttfb, 50),
    ttfb_p95_ms: percentil(ttfb, 95),
    rps: Number((resultados.length / duracion).toFixed(2)),
    bytes_promedio: ok.length ? Math.round(ok.reduce((a, b) => a + b.bytes, 0) / ok.length) : 0,
  };
}

const resultados = [];
for (const endpoint of activos) {
  console.log(`MEDICION: ${endpoint.nombre} (${endpoint.ruta})`);
  const r = await medirEndpoint(endpoint);
  resultados.push(r);
  const estados = Object.entries(r.por_estado).map(([k, v]) => `${k}:${v}`).join(" ");
  console.log(
    `  p50 ${r.p50_ms} ms | p95 ${r.p95_ms} ms | p99 ${r.p99_ms} ms | ${r.rps} req/s | estados ${estados}`
  );
}

const salidaFinal =
  salida ||
  join(ROOT, "docs", "informes", "rendimiento", `medicion-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
mkdirSync(dirname(salidaFinal), { recursive: true });
writeFileSync(
  salidaFinal,
  JSON.stringify(
    {
      fecha: new Date().toISOString(),
      base,
      node: process.version,
      token_usado: Boolean(token),
      n,
      concurrencia,
      calentamiento,
      omitidos: omitidos.map((e) => e.nombre),
      resultados,
    },
    null,
    2
  ) + "\n"
);
console.log(`MEDICION: resultados en ${salidaFinal}`);
