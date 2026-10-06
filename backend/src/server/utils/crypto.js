import crypto from "node:crypto";
import { CRYPTO_EFFECTIVE_KEY, JWT_SECRET } from "../utils/config.js";

/**
 * Utilidades de cifrado de datos sensibles (RNF11).
 * Integradas desde el modulo de Erick (Tienda del Vendedor) tras revision v1.0:
 *   - Fix 3.2: la clave ya NO esta hardcodeada; viene de utils/config.js
 *     (CRYPTO_SECRET_KEY en .env, derivada de JWT_SECRET si no se define).
 *   - Se usa AES-256-GCM con IV aleatorio por cifrado (formato iv:tag:data).
 *   - H5 (P2): se usa CRYPTO_EFFECTIVE_KEY (dominio "crypto"), nunca la clave
 *     JWT en bruto, aunque ambas nazcan del mismo secreto.
 */

const ALGORITMO = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/** Deriva una clave de 32 bytes a partir del secreto de cifrado (SHA-256). */
function derivarClave() {
  return crypto.createHash("sha256").update(CRYPTO_EFFECTIVE_KEY).digest();
}

/**
 * Clave LEGADA usada antes del fix H5 (separacion por proposito):
 * sha256(CRYPTO_SECRET_KEY || JWT_SECRET) en bruto. Solo se usa como
 * fallback de LECTURA para no volver indescifrables los registros ya
 * cifrados en BD (datos_bancarios) tras el cambio de derivacion.
 */
function derivarClaveLegada() {
  const secretoLegado = process.env.CRYPTO_SECRET_KEY || JWT_SECRET;
  return crypto.createHash("sha256").update(secretoLegado).digest();
}

/**
 * Clave de la ventana intermedia (commit fac1b9a, antes del fix del lote):
 * sha256(hex(sha256((CRYPTO_SECRET_KEY || JWT_SECRET)::"crypto"))).
 * Solo difiere de la actual cuando NO hay CRYPTO_SECRET_KEY propio en el .env;
 * en ese caso se reintenta para no perder registros de ese periodo.
 */
function derivarClaveIntermedia() {
  const secreto = process.env.CRYPTO_SECRET_KEY || JWT_SECRET;
  const base = crypto.createHash("sha256").update(`${secreto}::crypto`).digest("hex");
  return crypto.createHash("sha256").update(base).digest();
}

/** Claves a intentar en decryptSensitive: actual, intermedia y legada. */
function clavesPosibles() {
  return [derivarClave(), derivarClaveIntermedia(), derivarClaveLegada()];
}

/**
 * Cifra un texto sensible. Devuelve null si la entrada es vacia.
 * @param {string|null|undefined} plainText
 * @returns {string|null} cadena "iv:tag:cifrado" en base64url
 */
export function encryptSensitive(plainText) {
  if (plainText === null || plainText === undefined) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITMO, derivarClave(), iv);
  const cifrado = Buffer.concat([
    cipher.update(String(plainText), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    cifrado.toString("base64url"),
  ].join(":");
}

/**
 * Descifra una cadena producida por encryptSensitive.
 * @param {string|null|undefined} cipherText
 * @returns {string|null}
 */
export function decryptSensitive(cipherText) {
  if (!cipherText) return null;
  const [ivB64, tagB64, dataB64] = String(cipherText).split(":");
  if (!ivB64 || !tagB64 || !dataB64) return null;
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const data = Buffer.from(dataB64, "base64url");
  // Clave actual primero; si falla (datos cifrados con claves anteriores
  // al fix H5), se reintenta con las claves historicas antes de rendirse.
  for (const clave of clavesPosibles()) {
    try {
      const decipher = crypto.createDecipheriv(ALGORITMO, clave, iv);
      decipher.setAuthTag(tag);
      const texto = Buffer.concat([decipher.update(data), decipher.final()]);
      return texto.toString("utf8");
    } catch (e) {
      // Clave incorrecta o dato corrupto: se prueba la siguiente clave.
    }
  }
  return null;
}

/**
 * Enmascara un numero de cuenta dejando visibles solo los ultimos 4 digitos.
 * @param {string|null|undefined} fullAccountNumber
 * @returns {string}
 */
export function maskBankAccount(fullAccountNumber) {
  if (!fullAccountNumber) return "****";
  const clean = String(fullAccountNumber).replace(/\s/g, "");
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  const masked = "*".repeat(Math.min(clean.length - 4, 12));
  return masked + last4;
}

/**
 * Enmascara el nombre del titular: mantiene la ultima palabra completa.
 * @param {string|null|undefined} fullName
 * @returns {string|null}
 */
export function maskFullName(fullName) {
  if (!fullName) return null;
  const parts = String(fullName).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  return parts
    .map((p, i) => {
      if (i === parts.length - 1) return p;
      return p.charAt(0) + "*".repeat(Math.max(p.length - 1, 1));
    })
    .join(" ");
}
