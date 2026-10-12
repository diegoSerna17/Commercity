#!/usr/bin/env node
// tools/verificar-version.mjs (TASK-10.9, DEC-010, Fase 10)
// VERSION (raiz) es la fuente. Falla si hay desfase en los package.json,
// MARKETING_VERSION (iOS) o versionName (Android),
// o si queda la version anterior en textos (argumento opcional).
// Uso: node tools/verificar-version.mjs [versionAnterior]
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const version = readFileSync(join(ROOT, "VERSION"), "utf8").trim();
const anterior = process.argv[2];
let errores = 0;
function fail(msg) {
  errores += 1;
  console.error(`VERSION-CHECK: ${msg}`);
}

for (const rel of ["backend/package.json", "apps/escritorio/package.json", "apps/movil/package.json"]) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) continue;
  const j = JSON.parse(readFileSync(p, "utf8"));
  if (j.version !== version) fail(`${rel} tiene ${j.version}, se espera ${version}`);
}

const pbx = join(ROOT, "apps/movil/ios/App/App.xcodeproj/project.pbxproj");
if (existsSync(pbx)) {
  const s = readFileSync(pbx, "utf8");
  const m = s.match(/MARKETING_VERSION = ([^;]+);/);
  if (m && m[1].trim() !== version) fail(`MARKETING_VERSION iOS tiene ${m[1].trim()}, se espera ${version}`);
}
const gradle = join(ROOT, "apps/movil/android/app/build.gradle");
if (existsSync(gradle)) {
  const s = readFileSync(gradle, "utf8");
  const m = s.match(/versionName\s+"([^"]+)"/);
  if (m && m[1] !== version) fail(`versionName Android tiene ${m[1]}, se espera ${version}`);
}

if (anterior) {
  try {
    const out = execFileSync("git", ["grep", "-n", "--", anterior, "--", ".", ":(exclude)package-lock.json", ":(exclude)tools/verificar-version.mjs"], { cwd: ROOT, encoding: "utf8" }).trim();
    if (out) fail(`queda la version anterior ${anterior} en:\n${out}`);
  } catch {
    // git grep sale 1 cuando no hay coincidencias: OK
  }
}

if (errores > 0) process.exit(1);
console.log(`VERSION-CHECK: OK (${version} sincronizada)`);
