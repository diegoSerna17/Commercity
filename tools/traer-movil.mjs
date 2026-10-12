#!/usr/bin/env node
/**
 * tools/traer-movil.mjs (TASK-10.8, DEC-009, Fase 10)
 * Auxiliar MANUAL de solo lectura: lista commits del repo movil aun no portados
 * (por patch-id) y genera por archivo el diff contra apps/movil para revision.
 * No hace merge ni push. Alternativa con PAT descartada (ALT-006).
 * Uso: node tools/traer-movil.mjs
 */
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REMOTO = "movil/main";
const ARCHIVOS = [
  "package.json",
  "package-lock.json",
  "README.md",
  "www/api.js",
  "www/app.js",
  "www/index.html",
  "android/app/build.gradle",
  "android/app/src/main/AndroidManifest.xml",
];

function git(...args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch (e) {
    return "";
  }
}

console.log(`Comparando ${REMOTO} contra apps/movil (solo lectura)...\n`);
for (const f of ARCHIVOS) {
  const a = `HEAD:apps/movil/${f}`;
  const b = `${REMOTO}:${f}`;
  const stat = git("diff", "--numstat", a, b) || "0\t0";
  console.log(`### ${f} (numstat ${stat.replace(/\t/g, " ")})`);
  const diff = git("diff", "--stat", a, b);
  if (diff) console.log(diff);
  console.log(`   Revision manual: git diff HEAD:apps/movil/${f} ${b}\n`);
}
console.log("Nota: no se importa keystore, PDF, SRS, audio ni scripts de debug (DEC-009).");
