/**
 * Utilidades de SQL compartidas entre capas (A4/B-8, auditoria 2026-10-11).
 * `escapeLike` vivia en controllers/admin/admin.utils.js y la capa de usuario
 * la necesitaba (inversion de capas); admin.utils la re-exporta por compat.
 */

/**
 * Convierte un texto en un patron LIKE parametrizable escapando los comodines
 * (% y _) y el caracter de escape, para que la busqueda sea literal.
 * @param {string} q
 * @returns {string} patron "%texto%"
 */
export const escapeLike = (q) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
