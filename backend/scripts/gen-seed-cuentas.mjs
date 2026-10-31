#!/usr/bin/env node
/**
 * gen-seed-cuentas.mjs — script one-off (M-DB-6, auditoria 2026-10-11).
 *
 * Re-cifra los campos sensibles del bloque `datos_bancarios` de
 * `seed_commercity.sql` (titular_nombre y numero_cuenta) con el MISMO esquema
 * que la app: AES-256-GCM, formato `iv:tag:dato` en base64url, clave derivada
 * de CRYPTO_SECRET_KEY (o del fallback JWT_SECRET) via utils/crypto.js.
 *
 * Uso (desde `backend/`, con `npm ci` ya ejecutado):
 *   PowerShell:
 *     $env:CRYPTO_SECRET_KEY = (clave de desarrollo, por canal privado)
 *     node scripts/gen-seed-cuentas.mjs
 *
 * Comportamiento:
 *   - Usa la MISMA funcion encryptSensitive de la app: el cifrado siempre es
 *     compatible con decryptSensitive del backend vigente.
 *   - Si un valor ya esta cifrado, intenta descifrarlo con la cadena de claves
 *     actual para re-cifrarlo con la clave nueva (sirve para rotar la clave del
 *     seed). Si no puede descifrarlo, aborta sin escribir.
 *   - Hace copia `seed_commercity.sql.bak` antes de escribir y jamas imprime la
 *     clave.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.resolve(__dirname, "..", "..", "seed_commercity.sql");

if (!process.env.CRYPTO_SECRET_KEY && !process.env.JWT_SECRET) {
  console.error("FATAL: define CRYPTO_SECRET_KEY (recomendado) o JWT_SECRET para derivar la clave de cifrado.");
  process.exit(1);
}
// config.js aborta si falta JWT_SECRET; el placeholder solo aplica cuando la
// clave real de cifrado viene por CRYPTO_SECRET_KEY (jamas se usa para cifrar).
if (!process.env.JWT_SECRET && process.env.CRYPTO_SECRET_KEY) {
  process.env.JWT_SECRET = "placeholder-solo-para-importar-config";
}

const { encryptSensitive, decryptSensitive } = await import("../src/server/utils/crypto.js");

const CIFRADO = /^[A-Za-z0-9_-]+:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/;

function aCifrado(valor) {
  if (CIFRADO.test(valor)) {
    const plano = decryptSensitive(valor);
    if (plano === null) {
      throw new Error("un valor de datos_bancarios esta cifrado con una clave desconocida: no se puede re-cifrar sin el texto plano");
    }
    return encryptSensitive(plano);
  }
  return encryptSensitive(valor);
}

const original = fs.readFileSync(SEED_PATH, "utf8");
const bloque = original.match(/INSERT INTO datos_bancarios[^;]*;/s);
if (!bloque) {
  console.error("FATAL: no se encontro el bloque INSERT INTO datos_bancarios en el seed.");
  process.exit(1);
}

let total = 0;
const nuevoBloque = bloque[0].replace(
  /^\((\d+), '([^']*)', '([^']*)', '([^']*)', '([^']*)', (\d)\)([,;])$/gm,
  (linea, usuarioId, banco, titular, tipo, numero, esCommercity, fin) => {
    total += 1;
    return `(${usuarioId}, '${banco}', '${aCifrado(titular)}', '${tipo}', '${aCifrado(numero)}', ${esCommercity})${fin}`;
  }
);

if (total === 0) {
  console.error("FATAL: no se reemplazo ninguna fila de datos_bancarios (revisar el formato del seed).");
  process.exit(1);
}

fs.writeFileSync(`${SEED_PATH}.bak`, original, "utf8");
fs.writeFileSync(SEED_PATH, original.replace(bloque[0], nuevoBloque), "utf8");
console.log(`OK: ${total} filas de datos_bancarios re-cifradas (formato iv:tag:dato) en seed_commercity.sql.`);
console.log("La clave NO se muestra aqui: se entrega por canal privado y define el CRYPTO_SECRET_KEY de desarrollo.");
