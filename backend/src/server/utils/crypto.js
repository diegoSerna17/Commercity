import crypto from "node:crypto";
import { CRYPTO_SECRET_KEY } from "../utils/config.js";

/**
 * Utilidades de cifrado de datos sensibles (RNF11).
 * Integradas desde el modulo de Erick (Tienda del Vendedor) tras revision v1.0:
 *   - Fix 3.2: la clave ya NO esta hardcodeada; viene de utils/config.js
 *     (CRYPTO_SECRET_KEY en .env, derivada de JWT_SECRET si no se define).
 *   - Se usa AES-256-GCM con IV aleatorio por cifrado (formato iv:tag:data).
 */

const ALGORITMO = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/** Deriva una clave de 32 bytes a partir del secreto (SHA-256). */
function derivarClave() {
  return crypto.createHash("sha256").update(CRYPTO_SECRET_KEY).digest();
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
  try {
    const [ivB64, tagB64, dataB64] = String(cipherText).split(":");
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const decipher = crypto.createDecipheriv(
      ALGORITMO,
      derivarClave(),
      Buffer.from(ivB64, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    const texto = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64url")),
      decipher.final(),
    ]);
    return texto.toString("utf8");
  } catch (e) {
    return null;
  }
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
