/**
 * M-11/M-12 (TASK-4.5, auditoria 2026-10-11): auditoria de acciones sensibles.
 * Persiste en `auditoria_acciones` (migracion 016) quien hizo que, sobre que
 * objetivo, cuando y desde que IP. `detalle` es JSON y NUNCA lleva datos
 * sensibles (numeros de cuenta completos, contrasenas, tokens).
 *
 * Fail-soft: un fallo al auditar jamas rompe la accion de negocio; se deja
 * constancia en el log del servidor (sin datos sensibles).
 */
import pool from "../config/db.js";

/** Acciones auditadas (claves estables para consultas). */
export const ACCIONES = Object.freeze({
  USUARIO_BANEADO: "usuario.baneado",
  USUARIO_REACTIVADO: "usuario.reactivado",
  CUENTA_BANCARIA_CAMBIADA: "cuenta_bancaria.cambiada",
  CUENTA_PLATAFORMA_CAMBIADA: "cuenta_bancaria_plataforma.cambiada",
  REPORTE_CREADO: "reporte.creado",
  REPORTE_RESUELTO: "reporte.resuelto",
  REPORTE_ARCHIVADO: "reporte.archivado",
  DESEMBOLSO: "pedido.desembolso",
});

/**
 * Registra una accion en la auditoria.
 * @param {object} entrada
 * @param {number|string|null} [entrada.actorId] usuario que ejecuta (del JWT)
 * @param {string} entrada.accion clave estable (ver ACCIONES)
 * @param {string|null} [entrada.objetivoTipo] "usuario"|"pedido"|"reporte"|...
 * @param {number|null} [entrada.objetivoId]
 * @param {object|null} [entrada.detalle] JSON sin datos sensibles
 * @param {string|null} [entrada.ip]
 * @param {import("mysql2/promise").PoolConnection} [entrada.conn] conexion en
 *        transaccion (para auditar dentro de la misma operacion); por defecto pool
 * @returns {Promise<boolean>} true si se registro
 */
export async function registrarAuditoria({
  actorId = null,
  accion,
  objetivoTipo = null,
  objetivoId = null,
  detalle = null,
  ip = null,
  conn = pool,
}) {
  try {
    await conn.query(
      `INSERT INTO auditoria_acciones
         (actor_id, accion, objetivo_tipo, objetivo_id, detalle, ip)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        actorId ?? null,
        accion,
        objetivoTipo ?? null,
        objetivoId ?? null,
        detalle ? JSON.stringify(detalle) : null,
        ip ? String(ip).slice(0, 45) : null,
      ]
    );
    return true;
  } catch (error) {
    // Fail-soft: la accion de negocio ya se hizo (o se esta haciendo) y no debe
    // revertirse por la auditoria. Sin datos sensibles en el log.
    console.error(`[auditoria] no se pudo registrar "${accion}": ${error.message}`);
    return false;
  }
}
