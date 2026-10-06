import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

/**
 * Valida que JWT_SECRET exista en el entorno (fix 3.1 de la integracion de auth).
 * Regla api-seguridad.md: JWT_SECRET SIEMPRE viene de .env; el servidor FALLA
 * al arrancar si no existe. NUNCA hay un valor hardcodeado de respaldo, porque
 * eso dejaria los tokens falsificables.
 * @param {string|undefined} secret Valor a validar (por defecto el del .env).
 * @returns {string} El secreto validado.
 */
export const validarJWTSecret = (secret = process.env.JWT_SECRET) => {
    if (!secret) {
        console.error("FATAL: falta JWT_SECRET en el .env. El servidor no arranca.");
        process.exit(1);
    }
    return secret;
};

export const JWT_SECRET = validarJWTSecret();

/**
 * Clave de cifrado de datos sensibles (RNF11 - cuenta bancaria).
 * NUNCA hay un valor hardcodeado: si no se define CRYPTO_SECRET_KEY en el .env,
 * se deriva de JWT_SECRET (que es obligatorio). En produccion se recomienda
 * definir CRYPTO_SECRET_KEY con un valor propio de 32 bytes.
 *
 * H5 (P2 auditoria 2026-10-05): separacion por proposito aunque compartan
 * origen. JWT y cifrado jamas usan la misma clave bruta: cada una se deriva
 * con un dominio distinto (SHA-256(secreto + "::" + proposito)).
 */
function derivarClaveProposito(secreto, proposito) {
    return crypto.createHash("sha256").update(`${secreto}::${proposito}`).digest("hex");
}

export const CRYPTO_SECRET_KEY =
    process.env.CRYPTO_SECRET_KEY || JWT_SECRET;

/** Clave efectiva para firmar/validar JWT (dominio "jwt"). */
export const JWT_SIGNING_KEY = derivarClaveProposito(JWT_SECRET, "jwt");

/** Clave efectiva para cifrado AES de datos sensibles (dominio "crypto"). */
export const CRYPTO_EFFECTIVE_KEY = derivarClaveProposito(CRYPTO_SECRET_KEY, "crypto");
