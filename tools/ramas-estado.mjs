#!/usr/bin/env node
/**
 * tools/ramas-estado.mjs (TASK-10.1, Fase 10)
 * Inventario de ramas frente a PREVIEW. Solo lectura, sin dependencias.
 * Uso: node tools/ramas-estado.mjs [--check]
 * --check sale con codigo 1 si hay ramas PENDIENTE/OBSOLETA fuera de la lista permitida.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "origin/PREVIEW";
const CHECK = process.argv.includes("--check");
const PERMITIDAS_PATH = join(ROOT, "tools", "ramas-permitidas.json");

function git(...args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function loadPermitidas() {
  try {
    if (existsSync(PERMITIDAS_PATH)) {
      const j = JSON.parse(readFileSync(PERMITIDAS_PATH, "utf8"));
      return new Set([...(j.permitidas ?? []), ...(j.archivadas ?? [])]);
    }
  } catch { /* lista vacia */ }
  return new Set();
}

const ramasOut = git("for-each-ref", "--format=%(refname:short)|%(committerdate:short)|%(authorname)", "refs/remotes/", "refs/heads/");
if (!ramasOut) {
  console.log("Sin ramas para inventariar.");
  process.exit(0);
}

const baseTip = git("rev-parse", BASE);
const filas = [];
for (const line of ramasOut.split("\n")) {
  const [ref, fecha, autor] = line.split("|");
  if (!ref || ref.endsWith("/HEAD")) continue;
  if (ref === BASE || ref === "origin/HEAD") continue;
  const tip = git("rev-parse", ref);
  if (!tip) continue;
  const unicos = git("rev-list", "--count", `${BASE}..${ref}`);
  const faltantes = git("rev-list", "--count", `${ref}..${BASE}`);
  let estado = "INTEGRADA";
  if (tip === baseTip) estado = "DUPLICADA";
  else if (unucosNum(unicos) > 0) estado = "PENDIENTE";
  else if (tip !== baseTip && unucosNum(unicos) === 0 && unucosNum(faltantes) > 0) estado = "INTEGRADA";
  // Obsolescencia: >60 dias sin commits y sin unicos -> OBSOLETA informativa
  filas.push({ rama: ref, unicos: unucosNum(unicos), faltantes: unucosNum(faltantes), fecha, autor, tip: tip.slice(0, 7), estado });
}

function unucosNum(v) {
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? 0 : n;
}

// Segunda pasada: marcar OBSOLETA (>60 dias) cuando no tiene unicos
const hoy = Date.now();
for (const f of filas) {
  if (f.unicos === 0 && f.estado === "INTEGRADA" && f.fecha) {
    const t = Date.parse(f.fecha);
    if (!Number.isNaN(t) && hoy - t > 60 * 24 * 3600 * 1000) f.estado = "OBSOLETA";
  }
}

console.log("| Rama | Unicos vs PREVIEW | Faltantes | Ultimo commit | Autor | Tip | Estado |");
console.log("|---|---|---|---|---|---|---|");
for (const f of filas.sort((a, b) => a.rama.localeCompare(b.rama))) {
  console.log(`| ${f.rama} | ${f.unicos} | ${f.faltantes} | ${f.fecha} | ${f.autor} | ${f.tip} | ${f.estado} |`);
}

if (CHECK) {
  const permitidas = loadPermitidas();
  const malas = filas.filter(
    (f) => (f.estado === "PENDIENTE" || f.estado === "OBSOLETA") && !permitidas.has(f.rama)
  );
  if (malas.length > 0) {
    console.error(`\nramas-estado --check: ${malas.length} rama(s) fuera de la lista permitida:`);
    for (const m of malas) console.error(` - ${m.rama} (${m.estado}, ${m.unicos} unicos)`);
    process.exit(1);
  }
  console.log("\nramas-estado --check: OK (sin ramas pendientes/obsoletas fuera de lista).");
}
