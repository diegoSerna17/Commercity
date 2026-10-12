#!/usr/bin/env node
/**
 * tools/sync-version.mjs (TASK-10.9, DEC-010, Fase 10)
 * VERSION (raiz) es la fuente. Sincroniza backend/package.json,
 * apps/escritorio/package.json, apps/movil/package.json, MARKETING_VERSION (iOS)
 * y versionName (Android). Nunca se edita la version a mano.
 * Uso: node tools/sync-version.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const version = readFileSync(join(ROOT, "VERSION"), "utf8").trim();
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`VERSION invalida: "${version}" (se espera X.Y.Z)`);
  process.exit(1);
}

function syncPackageJson(rel) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) {
    console.log(` - ${rel}: no existe, se omite`);
    return;
  }
  const j = JSON.parse(readFileSync(p, "utf8"));
  if (j.version !== version) {
    j.version = version;
    writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
    console.log(` - ${rel}: version -> ${version}`);
  } else {
    console.log(` - ${rel}: ya en ${version}`);
  }
}

syncPackageJson("backend/package.json");
syncPackageJson("apps/escritorio/package.json");
syncPackageJson("apps/movil/package.json");

// iOS MARKETING_VERSION en project.pbxproj
const pbx = join(ROOT, "apps/movil/ios/App/App.xcodeproj/project.pbxproj");
if (existsSync(pbx)) {
  let s = readFileSync(pbx, "utf8");
  const antes = s;
  s = s.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`);
  if (s !== antes) {
    writeFileSync(pbx, s);
    console.log(` - ios project.pbxproj: MARKETING_VERSION -> ${version}`);
  } else {
    console.log(" - ios project.pbxproj: sin MARKETING_VERSION para sincronizar");
  }
} else {
  console.log(" - ios project.pbxproj: no existe, se omite");
}

// Android versionName en build.gradle (solo si ya esta externalizado por env; nunca inyecta credenciales)
const gradle = join(ROOT, "apps/movil/android/app/build.gradle");
if (existsSync(gradle)) {
  let s = readFileSync(gradle, "utf8");
  const antes = s;
  s = s.replace(/versionName\s+"[^"]+"/, `versionName "${version}"`);
  if (s !== antes) {
    writeFileSync(gradle, s);
    console.log(` - android build.gradle: versionName -> ${version}`);
  } else {
    console.log(" - android build.gradle: sin versionName literal para sincronizar");
  }
} else {
  console.log(" - android build.gradle: no existe, se omite");
}

console.log(`VERSION fuente: ${version} (sync-version OK)`);
