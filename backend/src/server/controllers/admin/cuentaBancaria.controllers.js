import { z } from "zod";
import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";
import {
  encryptSensitive,
  decryptSensitive,
  maskBankAccount,
  maskFullName,
} from "../../utils/crypto.js";

// ============================================================================
// MODULO: CUENTA BANCARIA DE COMMERCITY (RF75/RF76)
// ----------------------------------------------------------------------------
// El administrador registra la cuenta bancaria de la plataforma (la que recibe
// la comision del 10%). Se guarda con es_commercity = 1 y cifrado AES-256-GCM
// (RNF11), reutilizando utils/crypto.js. Protegido por authRequired +
// requireRoles(["administrador"]) a nivel de ruta.
// ============================================================================

const bancoSchema = z
  .object({
    titular_nombre: z.string().trim().min(3).max(100)
      .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/, "El titular solo puede contener letras y espacios"),
    banco: z.string().trim().min(3).max(50),
    tipo_cuenta: z.enum(["ahorros", "corriente"]),
    numero_cuenta: z.string().regex(/^\d+$/, "El número de cuenta solo puede contener dígitos")
      .min(6).max(20),
  })
  .strict();

/** Busca la cuenta de Commercity (es_commercity = 1). */
async function buscarCuentaCommercity() {
  const [rows] = await pool.query(
    `SELECT id, usuario_id, titular_nombre, banco, tipo_cuenta, numero_cuenta,
            es_commercity, updated_at
       FROM datos_bancarios
      WHERE es_commercity = 1
      ORDER BY id
      LIMIT 1`
  );
  return rows[0] || null;
}

function buildRecord(row) {
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    titular_nombre: decryptSensitive(row.titular_nombre),
    banco: row.banco,
    tipo_cuenta: row.tipo_cuenta,
    numero_cuenta: decryptSensitive(row.numero_cuenta),
    es_commercity: Boolean(row.es_commercity),
    updated_at: row.updated_at || null,
  };
}

function buildMaskedRecord(row) {
  const rawNumero = decryptSensitive(row.numero_cuenta);
  const rawTitular = decryptSensitive(row.titular_nombre);
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
 * GET /api/admin/mi-cuenta-bancaria - Datos completos de la cuenta de Commercity.
 */
export const getMiCuentaBancaria = async (req, res, next) => {
  try {
    const fila = await buscarCuentaCommercity();
    if (!fila) {
      return successResponse(res, "Sin cuenta bancaria de Commercity registrada", {
        registrado: false,
        datos: null,
      });
    }
    return successResponse(res, "Cuenta bancaria de Commercity obtenida", {
      registrado: true,
      datos: buildRecord(fila),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/mi-cuenta-bancaria/masked - Vista segura (RF122).
 */
export const getMiCuentaBancariaMasked = async (req, res, next) => {
  try {
    const fila = await buscarCuentaCommercity();
    if (!fila) {
      return successResponse(res, "Sin cuenta bancaria de Commercity registrada", {
        registrado: false,
        datos: null,
      });
    }
    return successResponse(res, "Cuenta bancaria de Commercity (enmascarada)", {
      registrado: true,
      datos: buildMaskedRecord(fila),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST/PUT /api/admin/mi-cuenta-bancaria - Upsert de la cuenta de Commercity.
 * El registro se crea/actualiza SIEMPRE con es_commercity = 1 (RF76).
 */
export const upsertMiCuentaBancaria = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const data = bancoSchema.parse(req.body);
    const usuarioId = req.userId;

    const encryptedTitular = encryptSensitive(data.titular_nombre);
    const encryptedNumero = encryptSensitive(data.numero_cuenta);

    await conn.beginTransaction();
    const [existing] = await conn.query(
      "SELECT id FROM datos_bancarios WHERE es_commercity = 1 LIMIT 1"
    );

    if (existing.length === 0) {
      await conn.query(
        `INSERT INTO datos_bancarios
           (usuario_id, titular_nombre, banco, tipo_cuenta, numero_cuenta, es_commercity)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [usuarioId, encryptedTitular, data.banco, data.tipo_cuenta, encryptedNumero]
      );
    } else {
      await conn.query(
        `UPDATE datos_bancarios
            SET usuario_id = ?, titular_nombre = ?, banco = ?, tipo_cuenta = ?,
                numero_cuenta = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND es_commercity = 1`,
        [usuarioId, encryptedTitular, data.banco, data.tipo_cuenta, encryptedNumero, existing[0].id]
      );
    }

    await conn.commit();

    const fila = await buscarCuentaCommercity();
    return successResponse(
      res,
      existing.length === 0
        ? "Cuenta bancaria de Commercity registrada correctamente."
        : "Cuenta bancaria de Commercity actualizada correctamente.",
      { registrado: true, es_actualizacion: existing.length > 0, datos: buildRecord(fila) },
      existing.length === 0 ? 201 : 200
    );
  } catch (err) {
    await conn.rollback();
    if (err instanceof z.ZodError) {
      return errorResponse(res, "Datos de cuenta bancaria inválidos.", 400,
        err.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message })));
    }
    next(err);
  } finally {
    conn.release();
  }
};
