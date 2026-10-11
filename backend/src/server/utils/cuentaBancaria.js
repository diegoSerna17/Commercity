/**
 * A3 (auditoria 2026-10-11): logica compartida de la cuenta bancaria
 * (RF75/RF76/RF121-RF123, RNF11) usada por tienda.controllers.js (vendedor) y
 * admin/cuentaBancaria.controllers.js (cuenta de Commercity). Antes estaba
 * duplicada en ambos controllers.
 *
 * M-10/TASK-4.4: los datos se cifran con AAD = usuario_id (utils/crypto.js v2) y
 * los registros del formato anterior se re-cifran perezosamente al leerlos.
 */
import pool from "../config/db.js";
import {
  encryptSensitive,
  decryptSensitive,
  maskBankAccount,
  maskFullName,
  esCifradoV2,
} from "./crypto.js";

const CAMPOS = `id, usuario_id, titular_nombre, banco, tipo_cuenta, numero_cuenta,
                es_commercity, updated_at`;

/** Cifra un campo de la cuenta bancaria ligado al usuario (AAD). */
export function cifrarCampo(texto, usuarioId) {
  return encryptSensitive(texto, { aad: String(usuarioId) });
}

/** Descifra un campo de la cuenta bancaria ligado al usuario (AAD). */
export function descifrarCampo(texto, usuarioId) {
  return decryptSensitive(texto, { aad: String(usuarioId) });
}

/**
 * Cuenta bancaria del usuario (1:1).
 * @param {number} usuarioId
 */
export async function buscarCuentaBancaria(usuarioId) {
  const [rows] = await pool.query(
    `SELECT ${CAMPOS} FROM datos_bancarios WHERE usuario_id = ? LIMIT 1`,
    [usuarioId]
  );
  return rows[0] || null;
}

/** Cuenta bancaria de la plataforma (es_commercity = 1). */
export async function buscarCuentaCommercity() {
  const [rows] = await pool.query(
    `SELECT ${CAMPOS} FROM datos_bancarios WHERE es_commercity = 1 ORDER BY id LIMIT 1`
  );
  return rows[0] || null;
}

/**
 * M-10: re-cifrado perezoso. Si el registro viene del formato anterior (sin
 * prefijo v2:), se descifra con las claves historicas y se vuelve a cifrar con
 * la clave/AAD actuales para que una rotacion futura no lo pierda. Fail-soft:
 * cualquier fallo deja la fila como estaba y la lectura continua.
 * @param {object|null} fila fila de datos_bancarios
 * @returns {Promise<object|null>} fila (posiblemente con los campos ya en v2)
 */
export async function recifrarCuentaBancariaSiEsLegado(fila) {
  if (!fila) return fila;
  if (esCifradoV2(fila.titular_nombre) && esCifradoV2(fila.numero_cuenta)) return fila;

  try {
    const aad = String(fila.usuario_id);
    const titular = decryptSensitive(fila.titular_nombre, { aad });
    const numero = decryptSensitive(fila.numero_cuenta, { aad });
    if (!titular || !numero) return fila;

    const titularV2 = encryptSensitive(titular, { aad });
    const numeroV2 = encryptSensitive(numero, { aad });
    await pool.query(
      `UPDATE datos_bancarios
          SET titular_nombre = ?, numero_cuenta = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
      [titularV2, numeroV2, fila.id]
    );
    return { ...fila, titular_nombre: titularV2, numero_cuenta: numeroV2 };
  } catch {
    return fila;
  }
}

/** Registro privado (datos completos) de una fila de datos_bancarios. */
export function buildPrivateRecord(row) {
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    titular_nombre: descifrarCampo(row.titular_nombre, row.usuario_id),
    banco: row.banco,
    tipo_cuenta: row.tipo_cuenta,
    numero_cuenta: descifrarCampo(row.numero_cuenta, row.usuario_id),
    es_commercity: Boolean(row.es_commercity),
    updated_at: row.updated_at || null,
  };
}

/** Registro enmascarado (RF122/RF138) de una fila de datos_bancarios. */
export function buildPublicRecord(row) {
  const rawNumero = descifrarCampo(row.numero_cuenta, row.usuario_id);
  const rawTitular = descifrarCampo(row.titular_nombre, row.usuario_id);
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    banco: row.banco,
    tipo_cuenta: row.tipo_cuenta,
    titular_nombre_enmascarado: maskFullName(rawTitular),
    numero_cuenta_enmascarado: maskBankAccount(rawNumero),
    ultimos4: rawNumero ? rawNumero.slice(-4) : null,
    es_commercity: Boolean(row.es_commercity),
    updated_at: row.updated_at || null,
    tiene_datos_registrados: Boolean(rawNumero && rawTitular),
  };
}

/**
 * Validacion de la cuenta bancaria para Mi Tienda (RF131-RF133, RF138):
 * registrada, completa y enmascarada (nunca en claro).
 */
export function validarCuentaBancaria(fila) {
  if (!fila) {
    return {
      registrada: false,
      completa: false,
      banco: null,
      tipo_cuenta: null,
      titular_enmascarado: null,
      numero_enmascarado: null,
      ultimos4: null,
      updated_at: null,
    };
  }
  const titular = descifrarCampo(fila.titular_nombre, fila.usuario_id);
  const numero = descifrarCampo(fila.numero_cuenta, fila.usuario_id);
  const completa = Boolean(
    titular && numero &&
    fila.banco && fila.tipo_cuenta &&
    ["ahorros", "corriente"].includes(fila.tipo_cuenta) &&
    /^\d{6,20}$/.test(String(numero))
  );
  return {
    registrada: true,
    completa,
    banco: fila.banco,
    tipo_cuenta: fila.tipo_cuenta,
    titular_enmascarado: maskFullName(titular),
    numero_enmascarado: maskBankAccount(numero),
    ultimos4: numero ? String(numero).slice(-4) : null,
    updated_at: fila.updated_at || null,
  };
}
