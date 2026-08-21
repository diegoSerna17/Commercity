/**
 * Modulo Notificaciones (RF99-RF104).
 * Campana en el topbar:
 *   RF100 lista ordenada de mas reciente a mas antigua,
 *   RF101 tipo (compra/mensajes/reporte/pedido/en camino/entregado) +
 *         descripcion breve + dias/hora,
 *   RF102 eliminar individual o limpiar todas,
 *   RF103 clic -> seccion correspondiente (url_redireccion),
 *   RF104 indicador de no leidas sobre el icono.
 *
 * La tabla real es `notificaciones` (schema_commercity.sql). El registro por
 * eventos (compra, mensaje, reporte, envio) lo hace el helper
 * `registrarNotificacion` de forma best-effort: su fallo jamas rompe el evento
 * principal (patron efecto secundario / lazy).
 */
import pool from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";

/** Conjunto de tipos visibles en la campana (RF101). */
const TIPOS_VALIDOS = ["compra", "mensajes", "reporte", "pedido", "en camino", "entregado"];

/**
 * Valores reales del ENUM `estado` en la BD (commercy_v2): `'leido'` y
 * `'no leido'` (sin tildes). Usarlos textuales es obligatorio: MySQL valida
 * el valor del ENUM de forma exacta.
 */
const ESTADO_NO_LEIDO = "no leido";
const ESTADO_LEIDO = "leido";

/**
 * Inserta una notificacion sin propagar errores (best-effort).
 * Se usa desde los modulos de dominio (pedidos, chat, reportes) tras cada
 * evento relevante: compra, envio/entregado, mensaje, reporte.
 *
 * @param {object} opts
 * @param {object} opts.db - pool o conexion (si se quiere participar en una transaccion).
 * @param {number} opts.usuario_id - destinatario de la notificacion.
 * @param {string} opts.tipo - uno de TIPOS_VALIDOS (RF101).
 * @param {string} opts.descripcion - texto breve del evento (RF101).
 * @param {string} [opts.url_redireccion] - ruta frontend a la que se navega al hacer clic (RF103).
 */
export const registrarNotificacion = async ({
  db = pool,
  usuario_id,
  tipo,
  descripcion,
  url_redireccion = null,
}) => {
  try {
    await db.query(
      `INSERT INTO notificaciones (usuario_id, tipo, descripcion, url_redireccion, estado)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario_id, tipo, descripcion, url_redireccion, ESTADO_NO_LEIDO]
    );
  } catch (err) {
    // La notificacion es un efecto secundario: no debe romper el flujo principal.
    console.warn("No se pudo registrar la notificacion:", err.message);
  }
};

/**
 * Texto relativo "dias y hora" de la notificacion (RF101),
 * ej: "Ahora", "Hace 5 min", "Hace 3 h", "Hace 2 días".
 * @param {string|Date} fechaISO
 * @returns {string}
 */
const calcularDiasHoras = (fechaISO) => {
  const diffMs = Date.now() - new Date(fechaISO).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return "Recién";
  const minutos = Math.floor(diffMs / 60000);
  if (minutos < 1) return "Ahora";
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `Hace ${dias} día${dias === 1 ? "" : "s"}`;
};

/**
 * GET /api/notificaciones
 * Lista las notificaciones del usuario autenticado, de la mas reciente a la
 * mas antigua (RF100). Filtro opcional por tipo (RF101) y por limite.
 */
export const listarNotificaciones = async (req, res, next) => {
  try {
    const usuarioId = req.userId;
    const { tipo, limite } = req.query;

    if (tipo !== undefined && !TIPOS_VALIDOS.includes(tipo)) {
      return errorResponse(
        res,
        `Tipo de notificacion invalido. Valores permitidos: ${TIPOS_VALIDOS.join(", ")}`,
        400
      );
    }
    let limiteNum = 50;
    if (limite !== undefined) {
      limiteNum = Number(limite);
      if (!Number.isInteger(limiteNum) || limiteNum < 1 || limiteNum > 100) {
        return errorResponse(res, "El limite debe ser un entero entre 1 y 100", 400);
      }
    }

    const parametros = [usuarioId];
    let filtroTipo = "";
    if (tipo) {
      filtroTipo = " AND tipo = ?";
      parametros.push(tipo);
    }
    parametros.push(limiteNum);

    const [filas] = await pool.query(
      `SELECT id, tipo, descripcion, estado, url_redireccion, fecha_hora
         FROM notificaciones
        WHERE usuario_id = ?${filtroTipo}
        ORDER BY fecha_hora DESC, id DESC
        LIMIT ?`,
      parametros
    );

    const notificaciones = filas.map((n) => ({
      id: n.id,
      tipo: n.tipo,
      descripcion: n.descripcion,
      estado: n.estado,
      leida: n.estado === ESTADO_LEIDO,
      url_redireccion: n.url_redireccion,
      fecha_hora: n.fecha_hora,
      dias_horas: calcularDiasHoras(n.fecha_hora),
    }));

    return successResponse(res, "Notificaciones del usuario", {
      total: notificaciones.length,
      notificaciones,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/notificaciones/no-leidas
 * Indicador sobre el icono de la campana (RF104): cantidad de notificaciones
 * no leidas del usuario autenticado.
 */
export const contarNoLeidas = async (req, res, next) => {
  try {
    const usuarioId = req.userId;

    const [filas] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM notificaciones
        WHERE usuario_id = ? AND estado = ?`,
      [usuarioId, ESTADO_NO_LEIDO]
    );

    return successResponse(res, "Indicador de notificaciones no leidas", {
      total_no_leidas: Number(filas[0]?.total ?? 0),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notificaciones/:id/leida
 * Marca una notificacion como leida (solo si pertenece al usuario autenticado).
 */
export const marcarComoLeida = async (req, res, next) => {
  try {
    const usuarioId = req.userId;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return errorResponse(res, "El id de la notificacion debe ser un entero positivo", 400);
    }

    const [result] = await pool.query(
      `UPDATE notificaciones SET estado = ?
        WHERE id = ? AND usuario_id = ?`,
      [ESTADO_LEIDO, id, usuarioId]
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, "Notificacion no encontrada o no pertenece al usuario", 404);
    }

    return successResponse(res, "Notificacion marcada como leida", { id });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notificaciones/leidas
 * Marca como leidas TODAS las notificaciones del usuario (limpia el indicador RF104).
 */
export const marcarTodasLeidas = async (req, res, next) => {
  try {
    const usuarioId = req.userId;

    const [result] = await pool.query(
      `UPDATE notificaciones SET estado = ?
        WHERE usuario_id = ? AND estado = ?`,
      [ESTADO_LEIDO, usuarioId, ESTADO_NO_LEIDO]
    );

    return successResponse(res, "Todas las notificaciones marcadas como leidas", {
      actualizadas: result.affectedRows ?? 0,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/notificaciones/:id
 * Elimina una notificacion individual (RF102).
 */
export const eliminarNotificacion = async (req, res, next) => {
  try {
    const usuarioId = req.userId;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return errorResponse(res, "El id de la notificacion debe ser un entero positivo", 400);
    }

    const [result] = await pool.query(
      `DELETE FROM notificaciones WHERE id = ? AND usuario_id = ?`,
      [id, usuarioId]
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, "Notificacion no encontrada o no pertenece al usuario", 404);
    }

    return successResponse(res, "Notificacion eliminada", { id });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/notificaciones
 * Elimina todas las notificaciones del usuario (RF102, limpieza masiva).
 */
export const eliminarTodas = async (req, res, next) => {
  try {
    const usuarioId = req.userId;

    const [result] = await pool.query(
      "DELETE FROM notificaciones WHERE usuario_id = ?",
      [usuarioId]
    );

    return successResponse(res, "Todas las notificaciones eliminadas", {
      eliminadas: result.affectedRows ?? 0,
    });
  } catch (err) {
    next(err);
  }
};
