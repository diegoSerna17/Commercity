import pool from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { validarId } from "../utils/ids.js";
import {
    enviarMensajeSchema,
    conversacionQuerySchema,
    conversacionesQuerySchema,
} from "../schemas/chat.schema.js";

// ============================================================================
// MODULO DE CHAT INTERNO (RF101)
// Tabla: mensajes_chat (emisor_id, receptor_id, mensaje, enviado_at, leido) -
// 6 columnas, ver schema_commercity.sql (BD commercity_v2). SIN tipo_mensaje ni
// archivo_url: la BD real no las tiene (hallazgo B2 de la auditoria 2026-10-06,
// rama A: se corrige el codigo al schema real).
// ============================================================================

/**
 * POST /api/chat
 * Envia un mensaje de texto del usuario autenticado (emisor) a otro usuario
 * (receptor). Los adjuntos se rechazan de forma explicita: sin la columna
 * archivo_url no hay donde persistirlos (rama A del hallazgo B2).
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export const enviarMensaje = async (req, res, next) => {
    try {
        // M-14 (TASK-4.7): contrato Zod con longitud maxima (2000) del mensaje.
        const parsed = enviarMensajeSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
            return errorResponse(res, "Datos del mensaje inválidos", 400, parsed.error.issues);
        }
        const receptorId = Number(parsed.data.receptor_id);
        const texto = parsed.data.mensaje;

        if (receptorId === req.userId) {
            return errorResponse(res, "No puedes enviarte un mensaje a ti mismo", 400);
        }
        // B2 (rama A): sin archivo_url en la BD real no se puede persistir un
        // adjunto; rechazar con 400 evita perder el archivo silenciosamente.
        if (req.file) {
            return errorResponse(res, "El chat no admite archivos en esta versión", 400);
        }

        // Verificar que el receptor exista y este activo.
        const [receptor] = await pool.query(
            "SELECT id, activo FROM usuarios WHERE id = ?",
            [receptorId]
        );
        if (receptor.length === 0 || !receptor[0].activo) {
            return errorResponse(res, "Usuario no encontrado", 404);
        }

        const [result] = await pool.query(
            `INSERT INTO mensajes_chat (emisor_id, receptor_id, mensaje)
             VALUES (?, ?, ?)`,
            [req.userId, receptorId, texto]
        );

        // Genera la notificacion para que el receptor la vea en tiempo real.
        try {
            const [emisor] = await pool.query(
                "SELECT nombre_completo FROM usuarios WHERE id = ?",
                [req.userId]
            );
            const nombreEmisor = emisor[0]?.nombre_completo || "alguien";
            await pool.query(
                `INSERT INTO notificaciones (usuario_id, tipo, descripcion, url_redireccion, estado)
                 VALUES (?, ?, ?, ?, ?)`,
                [receptorId, "mensajes", `Nuevo mensaje de ${nombreEmisor}`, "/messages", "no leido"]
            );
        } catch {
            // No romper el envio por un fallo de notificacion.
        }

        return successResponse(res, "Mensaje enviado correctamente", {
            id: result.insertId,
        }, 201);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/chat/conversaciones
 * Lista las conversaciones del usuario autenticado: una por cada interlocutor,
 * con el ultimo mensaje y el numero de mensajes no leidos.
 */
export const listarConversaciones = async (req, res, next) => {
    try {
        const usuarioId = req.userId;

        // B-9: paginacion validada con Zod (default 50, max 100).
        const parsedQuery = conversacionesQuerySchema.safeParse(req.query ?? {});
        if (!parsedQuery.success) {
            return errorResponse(res, "Parámetros de paginación inválidos", 400, parsedQuery.error.issues);
        }
        const { pagina, por_pagina: porPagina } = parsedQuery.data;
        const offset = (pagina - 1) * porPagina;

        const [[totalRow]] = await pool.query(
            `SELECT COUNT(DISTINCT par) AS total FROM (
               SELECT receptor_id AS par FROM mensajes_chat WHERE emisor_id = ?
               UNION
               SELECT emisor_id AS par FROM mensajes_chat WHERE receptor_id = ?
             ) interlocutores`,
            [usuarioId, usuarioId]
        );
        const total = Number(totalRow?.total || 0);

        const [conversaciones] = await pool.query(
            `SELECT
               otro.id AS usuario_id,
               otro.nombre_completo,
               otro.foto_perfil,
               m.id AS mensaje_id,
               m.emisor_id,
               m.receptor_id,
               m.mensaje,
               m.enviado_at,
               m.leido
             FROM mensajes_chat m
             JOIN usuarios otro
               ON otro.id = CASE WHEN m.emisor_id = ? THEN m.receptor_id ELSE m.emisor_id END
             JOIN (
               -- Ultimo mensaje de cada conversacion (par de usuarios), sargable
               -- por direccion: cada rama usa el prefijo de un indice distinto
               -- (emisor_id / receptor_id, mig 014). Equivale al antiguo
               -- MAX(id) GROUP BY LEAST/GREATEST, que no aprovechaba indices.
               SELECT MAX(ultimo_id) AS mensaje_id, par
               FROM (
                 SELECT id AS ultimo_id, receptor_id AS par
                   FROM mensajes_chat
                  WHERE emisor_id = ?
                 UNION ALL
                 SELECT id, emisor_id AS par
                   FROM mensajes_chat
                  WHERE receptor_id = ?
               ) direcciones
               GROUP BY par
             ) ultimo ON ultimo.mensaje_id = m.id
             ORDER BY m.enviado_at DESC
             LIMIT ? OFFSET ?`,
            [usuarioId, usuarioId, usuarioId, porPagina, offset]
        );

        const [noLeidos] = await pool.query(
            `SELECT emisor_id, COUNT(*) AS total
             FROM mensajes_chat
             WHERE receptor_id = ? AND leido = 0
             GROUP BY emisor_id`,
            [usuarioId]
        );

        const mapaNoLeidos = Object.fromEntries(
            noLeidos.map((n) => [n.emisor_id, Number(n.total)])
        );

        const data = conversaciones.map((c) => ({
            usuario: {
                id: c.usuario_id,
                nombre_completo: c.nombre_completo,
                foto_perfil: c.foto_perfil,
            },
            ultimo_mensaje: {
                id: c.mensaje_id,
                mensaje: c.mensaje,
                enviado_at: c.enviado_at,
                enviado_por_mi: c.emisor_id === usuarioId,
            },
            no_leidos: mapaNoLeidos[c.usuario_id] || 0,
        }));

        return res.status(200).json({
            success: true,
            message: "Conversaciones obtenidas",
            data,
            paginacion: { pagina, por_pagina: porPagina, total, total_paginas: Math.max(1, Math.ceil(total / porPagina)) },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/chat/mensajes/:usuarioId
 * Devuelve el historial de mensajes entre el usuario autenticado y otro usuario.
 */
export const obtenerConversacion = async (req, res, next) => {
    try {
        const otroId = Number(req.params.usuarioId);

        if (!validarId(otroId)) {
            return errorResponse(res, "El id del usuario debe ser un entero positivo", 400);
        }

        // M-15: mismo 404 para usuario inexistente o inactivo (no se enumeran cuentas).
        const [otro] = await pool.query(
            "SELECT id, nombre_completo, foto_perfil FROM usuarios WHERE id = ? AND activo = 1",
            [otroId]
        );
        if (otro.length === 0) {
            return errorResponse(res, "Usuario no encontrado", 404);
        }

        // M-14: paginacion del historial (default 50 por pagina, max 100).
        const parsedQuery = conversacionQuerySchema.safeParse(req.query ?? {});
        if (!parsedQuery.success) {
            return errorResponse(res, "Parámetros de paginación inválidos", 400, parsedQuery.error.issues);
        }
        const { pagina, por_pagina: porPagina } = parsedQuery.data;
        const offset = (pagina - 1) * porPagina;

        const [totalRows] = await pool.query(
            `SELECT COUNT(*) AS total
               FROM mensajes_chat
              WHERE (emisor_id = ? AND receptor_id = ?) OR (emisor_id = ? AND receptor_id = ?)`,
            [req.userId, otroId, otroId, req.userId]
        );
        const total = Number(totalRows[0]?.total || 0);

        // La pagina se trae de la mas reciente a la mas antigua y se invierte
        // para responder en orden cronologico ascendente (chat).
        const [mensajes] = await pool.query(
            `SELECT id, emisor_id, receptor_id, mensaje, enviado_at, leido
             FROM mensajes_chat
             WHERE (emisor_id = ? AND receptor_id = ?) OR (emisor_id = ? AND receptor_id = ?)
             ORDER BY enviado_at DESC, id DESC
             LIMIT ? OFFSET ?`,
            [req.userId, otroId, otroId, req.userId, porPagina, offset]
        );
        mensajes.reverse();

        return successResponse(res, "Mensajes obtenidos", {
            usuario: {
                id: otro[0].id,
                nombre_completo: otro[0].nombre_completo,
                foto_perfil: otro[0].foto_perfil,
            },
            mensajes,
            total,
            pagina,
            por_pagina: porPagina,
            total_paginas: Math.max(1, Math.ceil(total / porPagina)),
        });
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/chat/mensajes/:id/leido
 * Marca como leido un mensaje recibido por el usuario autenticado.
 */
export const marcarMensajeLeido = async (req, res, next) => {
    try {
        const mensajeId = Number(req.params.id);

        if (!validarId(mensajeId)) {
            return errorResponse(res, "El id del mensaje debe ser un entero positivo", 400);
        }

        const [result] = await pool.query(
            "UPDATE mensajes_chat SET leido = 1 WHERE id = ? AND receptor_id = ?",
            [mensajeId, req.userId]
        );

        if (result.affectedRows === 0) {
            return errorResponse(res, "Mensaje no encontrado", 404);
        }

        return successResponse(res, "Mensaje marcado como leído", { id: mensajeId });
    } catch (err) {
        next(err);
    }
};
