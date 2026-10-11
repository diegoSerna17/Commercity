import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

/**
 * Valores de ejemplo/placeholder que jamas deben usarse como secreto real.
 * TASK-2.6 (auditoria 2026-10-11): el valor del viejo .env.example quedo
 * copiado en entornos reales; se rechaza explicitamente fuera de test.
 */
const VALORES_DE_EJEMPLO = new Set([
    "cambia_este_valor_por_uno_aleatorio_largo",
    "cambia_este_valor",
    "changeme",
    "jwt_secret",
    "secret",
]);

const LONGITUD_MINIMA_SECRET = 32;

const fatal = (mensaje) => {
    console.error(`FATAL: ${mensaje}`);
    process.exit(1);
};

/**
 * Valida que JWT_SECRET exista y sea un secreto real (fix 3.1 + TASK-2.6).
 * Regla api-seguridad.md: JWT_SECRET SIEMPRE viene de .env; el servidor FALLA
 * al arrancar si no existe. NUNCA hay un valor hardcodeado de respaldo, porque
 * eso dejaria los tokens falsificables.
 * Fuera de NODE_ENV=test se rechazan los valores de ejemplo y se exige una
 * longitud minima de 32 caracteres (los tests usan un secreto corto de prueba).
 * @param {string|undefined} secret Valor a validar (por defecto el del .env).
 * @param {string|undefined} entorno Entorno a considerar (por defecto NODE_ENV).
 * @returns {string} El secreto validado.
 */
export const validarJWTSecret = (
    secret = process.env.JWT_SECRET,
    entorno = process.env.NODE_ENV
) => {
    if (!secret) {
        fatal("falta JWT_SECRET en el .env. El servidor no arranca.");
    }
    if (entorno !== "test") {
        const valor = String(secret);
        if (VALORES_DE_EJEMPLO.has(valor.toLowerCase())) {
            fatal("JWT_SECRET usa un valor de ejemplo. Genere uno aleatorio y unico (>= 32 caracteres).");
        }
        if (valor.length < LONGITUD_MINIMA_SECRET) {
            fatal(`JWT_SECRET debe tener al menos ${LONGITUD_MINIMA_SECRET} caracteres fuera de NODE_ENV=test.`);
        }
    }
    return secret;
};

export const JWT_SECRET = validarJWTSecret();

/**
 * Clave de cifrado de datos sensibles (RNF11 - cuenta bancaria).
 * NUNCA hay un valor hardcodeado: si no se define CRYPTO_SECRET_KEY en el .env,
 * se deriva de JWT_SECRET (que es obligatorio). En produccion, TASK-2.6 exige
 * una CRYPTO_SECRET_KEY propia: sin ella el servidor no arranca.
 *
 * H5 (P2 auditoria 2026-10-05): separacion por proposito aunque compartan
 * origen. JWT y cifrado jamas usan la misma clave bruta: cada una se deriva
 * con un dominio distinto (SHA-256(secreto + "::" + proposito)).
 */
function derivarClaveProposito(secreto, proposito) {
    return crypto.createHash("sha256").update(`${secreto}::${proposito}`).digest("hex");
}

/** Clave efectiva de firma JWT (dominio "jwt"). */
export const JWT_SIGNING_KEY = derivarClaveProposito(JWT_SECRET, "jwt");

/**
 * B-4 (TASK-4.3): emisor y audiencia fijos del JWT. Se firman SIEMPRE y se
 * verifican SIEMPRE, de modo que un token emitido para otro servicio (u otro
 * entorno) con el mismo secreto no sea aceptado aqui.
 */
export const JWT_ISSUER = process.env.JWT_ISSUER || "commercity-api";
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "commercity-clients";

if (process.env.NODE_ENV === "production") {
    const claveCrypto = process.env.CRYPTO_SECRET_KEY;
    if (!claveCrypto) {
        fatal("en produccion CRYPTO_SECRET_KEY es obligatoria (clave propia, distinta de JWT_SECRET).");
    } else if (
        VALORES_DE_EJEMPLO.has(String(claveCrypto).toLowerCase()) ||
        String(claveCrypto).length < LONGITUD_MINIMA_SECRET
    ) {
        fatal(`CRYPTO_SECRET_KEY debe ser aleatoria, propia y de al menos ${LONGITUD_MINIMA_SECRET} caracteres.`);
    }
}

/**
 * Clave efectiva para cifrado AES de datos sensibles (dominio "crypto").
 * H5 (auditoria 2026-10-05): por defecto el cifrado se deriva del dominio
 * JWT (JWT_SIGNING_KEY), nunca de la clave bruta de firma.
 */
export const CRYPTO_SECRET_KEY =
    process.env.CRYPTO_SECRET_KEY || JWT_SIGNING_KEY;

/** Clave efectiva para cifrado AES (dominio "crypto" sobre CRYPTO_SECRET_KEY). */
export const CRYPTO_EFFECTIVE_KEY = derivarClaveProposito(CRYPTO_SECRET_KEY, "crypto");
