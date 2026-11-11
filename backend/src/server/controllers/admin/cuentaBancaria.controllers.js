import { successResponse, errorResponse } from "../../utils/response.js";
import {
  obtenerCuentaCommercity,
  guardarCuentaCommercity,
} from "../../services/admin.service.js";

// ============================================================================
// MODULO: CUENTA BANCARIA DE COMMERCITY (RF75/RF76)
// ----------------------------------------------------------------------------
// El administrador registra la cuenta bancaria de la plataforma (la que recibe
// la comision del 10%). Se guarda con es_commercity = 1 y cifrado AES-256-GCM
// (RNF11). Protegido por authRequired + requireRoles(["administrador"]).
// A3 (TASK-4.10): la lectura/escritura y el cifrado v2 con AAD viven en
// utils/cuentaBancaria.js; M-10 dispara el re-cifrado perezoso al leer.
// Desde 1.5.3 el SQL vive en services/admin.service.js.
// ============================================================================

/**
 * GET /api/admin/mi-cuenta-bancaria - Cuenta de Commercity ENMASCARADA por
 * defecto (B-7). El numero y el titular completos solo se devuelven con el
 * parametro explicito ?revelar=completa (los formularios de edicion de web y
 * escritorio lo piden asi); cualquier otro valor responde enmascarado.
 */
export const getMiCuentaBancaria = async (req, res, next) => {
  try {
    const { mensaje, data } = await obtenerCuentaCommercity({
      revelarCompleta: req.query.revelar === "completa",
    });
    return successResponse(res, mensaje, data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/mi-cuenta-bancaria/masked - Vista segura (RF122).
 */
export const getMiCuentaBancariaMasked = async (_req, res, next) => {
  try {
    const { mensaje, data } = await obtenerCuentaCommercity({ revelarCompleta: false });
    return successResponse(res, mensaje, data);
  } catch (err) {
    next(err);
  }
};

/**
 * POST/PUT /api/admin/mi-cuenta-bancaria - Upsert de la cuenta de Commercity.
 * El registro se crea/actualiza SIEMPRE con es_commercity = 1 (RF76).
 */
export const upsertMiCuentaBancaria = async (req, res, next) => {
  try {
    // Body validado por upsertCuentaBancariaAdminSchema (validate()).
    const resultado = await guardarCuentaCommercity({
      usuarioId: req.userId,
      data: req.body,
      ip: req.ip,
    });

    if (!resultado.ok) {
      return errorResponse(res, resultado.mensaje, resultado.status);
    }

    return successResponse(res, resultado.mensaje, resultado.data, resultado.status);
  } catch (err) {
    next(err);
  }
};
