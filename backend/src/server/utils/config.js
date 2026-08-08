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
 */
export const CRYPTO_SECRET_KEY =
    process.env.CRYPTO_SECRET_KEY || JWT_SECRET;
