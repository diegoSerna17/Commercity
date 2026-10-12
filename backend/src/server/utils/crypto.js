import crypto from "node:crypto";
import { CRYPTO_SECRET_KEY, CRYPTO_EFFECTIVE_KEY, JWT_SECRET } from "../utils/config.js";

/**
 * Utilidades de cifrado de datos sensibles (RNF11).
 * Integradas desde el modulo de Erick (Tienda del Vendedor) tras revision v1.0:
 *   - Fix 3.2: la clave ya NO esta hardcodeada; viene de utils/config.js
 *     (CRYPTO_SECRET_KEY en .env, derivada de JWT_SECRET si no se define).
 *   - Se usa AES-256-GCM con IV aleatorio por cifrado.
 *   - H5 (P2): se usa CRYPTO_EFFECTIVE_KEY (dominio "crypto"), nunca la clave
 *     JWT en bruto, aunque ambas nazcan del mismo secreto.
 *
 * M-10/H10 (TASK-4.4, auditoria 2026-10-11):
 *   - authTagLength: 16 explicito en cifrado y descifrado.
 *   - v2: clave derivada con HKDF-SHA256 desde CRYPTO_SECRET_KEY (KDF nativo)
 *     + AAD con el usuario_id, formato "v2:iv:tag:dato".
 *   - Los registros viejos (sin prefijo) siguen descifrandose con las claves
 *     historicas y se re-cifran perezosamente al leerlos (los controllers).
 *   - Un fallo de descifrado deja un log SIN datos (ni claro ni cifrado).
 */

const ALGORITMO = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export const VERSION_ACTUAL = "v2";
export const PREFIJO_VERSION = `${VERSION_ACTUAL}:`;

/** Deriva la clave LEGADA de 32 bytes (SHA-256 del secreto efectivo). */
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

/**
 * M-10: clave v2 derivada con HKDF-SHA256 (KDF nativo) desde la
 * CRYPTO_SECRET_KEY efectiva, con sal/info fijas del dominio.
 */
function derivarClaveV2() {
  return Buffer.from(
    crypto.hkdfSync(
      "sha256",
      Buffer.from(String(CRYPTO_SECRET_KEY), "utf8"),
      Buffer.from("commercity:datos-sensibles", "utf8"),
      Buffer.from("aes-256-gcm:v2", "utf8"),
      32
    )
  );
}

/** Claves a intentar en decryptSensitive para formatos anteriores a v2. */
function clavesPosibles() {
  return [derivarClave(), derivarClaveIntermedia(), derivarClaveLegada()];
}

/** Convierte el AAD recibido (p. ej. usuario_id) a Buffer, o null si no aplica. */
function aadBuffer(aad) {
  if (aad === null || aad === undefined || aad === "") return null;
  return Buffer.from(String(aad), "utf8");
}

/**
 * Cifra un texto sensible. Devuelve null si la entrada es vacia.
 * M-10: si se pasa `aad` (p. ej. el usuario_id), el dato queda ligado a ese
 * contexto: descifrarlo con otro AAD falla (anti-swap entre usuarios).
 * @param {string|null|undefined} plainText
 * @param {{aad?: string|number}} [opciones]
 * @returns {string|null} cadena "v2:iv:tag:cifrado" en base64url
 */
export function encryptSensitive(plainText, { aad } = {}) {
  if (plainText === null || plainText === undefined) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITMO, derivarClaveV2(), iv, { authTagLength: TAG_LENGTH });
  const aadValor = aadBuffer(aad);
  if (aadValor) cipher.setAAD(aadValor);
  const cifrado = Buffer.concat([
    cipher.update(String(plainText), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    VERSION_ACTUAL,
    iv.toString("base64url"),
    tag.toString("base64url"),
    cifrado.toString("base64url"),
  ].join(":");
}

/**
 * Descifra una cadena producida por encryptSensitive (formato v2 o anterior).
 * @param {string|null|undefined} cipherText
 * @param {{aad?: string|number}} [opciones]
 * @returns {string|null}
 */
export function decryptSensitive(cipherText, { aad } = {}) {
  if (!cipherText) return null;
  const valor = String(cipherText);
  const esV2 = valor.startsWith(PREFIJO_VERSION);
  const cuerpo = esV2 ? valor.slice(PREFIJO_VERSION.length) : valor;
  const [ivB64, tagB64, dataB64] = cuerpo.split(":");
  if (!ivB64 || !tagB64 || !dataB64) return null;

  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const data = Buffer.from(dataB64, "base64url");
  const aadValor = aadBuffer(aad);

  // v2: solo la clave nueva (con AAD si el dato se cifro con el). Formatos
  // anteriores: se reintenta con las claves historicas antes de rendirse.
  const claves = esV2 ? [derivarClaveV2()] : clavesPosibles();
  for (const clave of claves) {
    try {
      const decipher = crypto.createDecipheriv(ALGORITMO, clave, iv, { authTagLength: TAG_LENGTH });
      if (esV2 && aadValor) decipher.setAAD(aadValor);
      decipher.setAuthTag(tag);
      const texto = Buffer.concat([decipher.update(data), decipher.final()]);
      return texto.toString("utf8");
    } catch {
      // Clave incorrecta o dato corrupto: se prueba la siguiente clave.
    }
  }
  // M-10: log SIN datos (ni el texto claro ni el cifrado) para no filtrar nada.
  console.error(
    "[crypto] No se pudo descifrar un dato sensible: clave incorrecta, AAD distinto o dato corrupto."
  );
  return null;
}

/**
 * M-10: indica si un valor ya esta en el formato actual (v2:). Los registros
 * anteriores se re-cifran perezosamente al leerse.
 * @param {string|null|undefined} valor
 * @returns {boolean}
 */
export function esCifradoV2(valor) {
  return typeof valor === "string" && valor.startsWith(PREFIJO_VERSION);
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
