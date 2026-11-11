/**
 * C2 (plan 1.5.5): constantes compartidas de validacion de secretos.
 *
 * Vive aparte de utils/config.js porque ese modulo llama a dotenv.config() y
 * aborta el proceso (process.exit) al importarse. Los scripts de operacion
 * (backend/scripts/verificar-entorno.mjs) necesitan las mismas listas sin
 * arrancar la configuracion del servidor.
 *
 * Este archivo no tiene efectos secundarios: solo exporta constantes.
 */

/**
 * Valores de ejemplo/placeholder que jamas deben usarse como secreto real.
 * TASK-2.6 (auditoria 2026-10-11): el valor del viejo .env.example quedo
 * copiado en entornos reales; se rechaza explicitamente fuera de test.
 */
export const VALORES_DE_EJEMPLO = new Set([
    "cambia_este_valor_por_uno_aleatorio_largo",
    "cambia_este_valor",
    "changeme",
    "jwt_secret",
    "secret",
]);

/** Longitud minima exigida a JWT_SECRET y CRYPTO_SECRET_KEY. */
export const LONGITUD_MINIMA_SECRET = 32;
