#!/usr/bin/env node
/**
 * gen-seed-hashes.mjs — script one-off (R-1, auditoria 2026-10-11).
 *
 * Regenera los hashes bcrypt de los 20 usuarios de `seed_commercity.sql` a
 * partir de la contrasena semilla tomada de la variable de entorno
 * SEED_PASSWORD. La contrasena NUNCA se imprime ni se escribe en el repo:
 * el seed solo versiona hashes (uno distinto por usuario, sal aleatoria).
 *
 * Uso (desde `backend/`, con `npm ci` ya ejecutado):
 *   PowerShell:
 *     $env:SEED_PASSWORD = (pide la contrasena por canal privado / gestor de secretos)
 *     node scripts/gen-seed-hashes.mjs
 *   Luego: comunicar la contrasena al equipo por canal privado (nunca por el
 *   repositorio, issues ni documentacion versionada).
 *
 * Comportamiento:
 *   - Exige SEED_PASSWORD (minimo 8 caracteres, igual que la politica de la app).
 *   - Hace copia `seed_commercity.sql.bak` (ignorada por git) antes de escribir.
 *   - Reemplaza SOLO los hashes de las lineas de usuarios del seed.
 *   - Salida: conteo de hashes regenerados; jamas la clave ni los hashes.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcrypt";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.resolve(__dirname, "..", "..", "seed_commercity.sql");
const BCRYPT_ROUNDS = 10;
const password = process.env.SEED_PASSWORD;

if (!password) {
  console.error(
    "FATAL: falta la variable de entorno SEED_PASSWORD. La contrasena se pide al lider por canal privado; nunca se pasa por argumentos."
  );
  process.exit(1);
}
if (String(password).length < 8) {
  console.error("FATAL: SEED_PASSWORD debe tener al menos 8 caracteres (politica de la app).");
  process.exit(1);
}
if (!fs.existsSync(SEED_PATH)) {
  console.error(`FATAL: no se encontro el seed en ${SEED_PATH}`);
  process.exit(1);
}

const original = fs.readFileSync(SEED_PATH, "utf8");
const userLine = /^(\((\d+), '([^']+)', ')(\$2[aby]\$[^']*)('.*)$/gm;

let total = 0;
const emails = [];
const actualizado = original.replace(userLine, (match, pre, id, email, _hash, post) => {
  const hash = bcrypt.hashSync(String(password), BCRYPT_ROUNDS);
  total += 1;
  emails.push(email);
  return `${pre}${hash}${post}`;
});

if (total === 0) {
  console.error("FATAL: no se encontro ninguna linea de usuario con hash bcrypt en el seed.");
  process.exit(1);
}

fs.writeFileSync(`${SEED_PATH}.bak`, original, "utf8");
fs.writeFileSync(SEED_PATH, actualizado, "utf8");

console.log(`OK: ${total} hashes bcrypt regenerados en seed_commercity.sql (respaldo en ${path.basename(SEED_PATH)}.bak).`);
console.log("La contrasena NO se muestra aqui: comunicarla al equipo por canal privado.");
console.log(`Usuarios actualizados: ${emails.join(", ")}`);
