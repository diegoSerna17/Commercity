import { z } from "zod";
import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";
import { bancoSchema } from "../../schemas/cuentaBancaria.schema.js";
import {
  buscarCuentaCommercity,
  recifrarCuentaBancariaSiEsLegado,
  cifrarCampo,
  buildPrivateRecord,
  buildPublicRecord,
} from "../../utils/cuentaBancaria.js";

// ============================================================================
// MODULO: CUENTA BANCARIA DE COMMERCITY (RF75/RF76)
// ----------------------------------------------------------------------------
// El administrador registra la cuenta bancaria de la plataforma (la que recibe
// la comision del 10%). Se guarda con es_commercity = 1 y cifrado AES-256-GCM
// (RNF11). Protegido por authRequired + requireRoles(["administrador"]).
//
// A3 (TASK-4.10): la lectura/escritura y el cifrado v2 con AAD viven en
// utils/cuentaBancaria.js; M-10 dispara el re-cifrado perezoso al leer.
// ============================================================================

/**
 * GET /api/admin/mi-cuenta-bancaria - Datos completos de la cuenta de Commercity.
 */
export const getMiCuentaBancaria = async (req, res, next) => {
  try {
    const fila = await recifrarCuentaBancariaSiEsLegado(await buscarCuentaCommercity());
    if (!fila) {
      return successResponse(res, "Sin cuenta bancaria de Commercity registrada", {
        registrado: false,
        datos: null,
      });
    }
    return successResponse(res, "Cuenta bancaria de Commercity obtenida", {
      registrado: true,
      datos: buildPrivateRecord(fila),
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
    const fila = await recifrarCuentaBancariaSiEsLegado(await buscarCuentaCommercity());
    if (!fila) {
      return successResponse(res, "Sin cuenta bancaria de Commercity registrada", {
        registrado: false,
        datos: null,
      });
    }
    return successResponse(res, "Cuenta bancaria de Commercity (enmascarada)", {
      registrado: true,
      datos: buildPublicRecord(fila),
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

    // M-10: v2 con AAD = usuario_id (el admin registrador).
    const encryptedTitular = cifrarCampo(data.titular_nombre, usuarioId);
    const encryptedNumero = cifrarCampo(data.numero_cuenta, usuarioId);

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
      { registrado: true, es_actualizacion: existing.length > 0, datos: buildPrivateRecord(fila) },
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
