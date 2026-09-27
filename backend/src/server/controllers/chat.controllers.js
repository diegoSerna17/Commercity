import pool from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { validarId } from "./admin/admin.utils.js";

// ============================================================================
// MODULO DE CHAT INTERNO (RF101)
// Tabla base: mensajes_chat (emisor_id, receptor_id, tipo_mensaje, mensaje,
// archivo_url, enviado_at, leido). La tabla ya existe en base.sql.
// ============================================================================

/**
 * POST /api/chat
 * Envia un mensaje del usuario autenticado (emisor) a otro usuario (receptor).
 * Soporta texto plano y archivos (imagen o documento) via multipart "archivo".
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export const enviarMensaje = async (req, res, next) => {
    try {
        const receptorId = Number(req.body.receptor_id);
        const texto = typeof req.body.mensaje === "string" ? req.body.mensaje.trim() : "";
        const archivoUrl = req.file ? `/uploads/${req.file.filename}` : null;

        if (!validarId(receptorId)) {
            return errorResponse(res, "Debe indicar un destinatario válido", 400);
        }
        if (receptorId === req.userId) {
            return errorResponse(res, "No puedes enviarte un mensaje a ti mismo", 400);
        }

        // Si hay archivo, el tipo se deriva del mimetype; si no, es texto.
        const tipoMensaje = archivoUrl
            ? ((req.file.mimetype || "").startsWith("image/") ? "imagen" : "archivo")
            : "texto";

        // Regla RF101: sin archivo y sin texto, no hay mensaje que enviar.
        if (!archivoUrl && !texto) {
            return errorResponse(res, "El mensaje está vacío", 400);
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
            `INSERT INTO mensajes_chat (emisor_id, receptor_id, tipo_mensaje, mensaje, archivo_url)
             VALUES (?, ?, ?, ?, ?)`,
            [req.userId, receptorId, tipoMensaje, texto || null, archivoUrl]
        );

        // Genera la notificacion para que el receptor la vea en tiempo real.
        try {
            const [emisor] = await pool.query(
                "SELECT nombre_completo FROM usuarios WHERE id = ?",
                [req.userId]
            );
            const nombreEmisor = emisor[0]?.nombre_completo || "alguien";
            const descripcion = archivoUrl
                ? `Te envió un archivo: ${nombreEmisor}`
                : `Nuevo mensaje de ${nombreEmisor}`;
            await pool.query(
                `INSERT INTO notificaciones (usuario_id, tipo, descripcion, url_redireccion, estado)
                 VALUES (?, ?, ?, ?, ?)`,
                [receptorId, "mensajes", descripcion, "/messages", "no leido"]
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

        const [conversaciones] = await pool.query(
            `SELECT
               otro.id AS usuario_id,
               otro.nombre_completo,
               otro.foto_perfil,
               m.id AS mensaje_id,
               m.emisor_id,
               m.receptor_id,
               m.tipo_mensaje,
               m.mensaje,
               m.archivo_url,
               m.enviado_at,
               m.leido
             FROM mensajes_chat m
             JOIN usuarios otro
               ON otro.id = CASE WHEN m.emisor_id = ? THEN m.receptor_id ELSE m.emisor_id END
             WHERE m.id IN (
               SELECT MAX(id)
               FROM mensajes_chat
               WHERE emisor_id = ? OR receptor_id = ?
               GROUP BY LEAST(emisor_id, receptor_id), GREATEST(emisor_id, receptor_id)
             )
             ORDER BY m.enviado_at DESC`,
            [usuarioId, usuarioId, usuarioId]
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
                tipo_mensaje: c.tipo_mensaje,
                mensaje: c.mensaje,
                archivo_url: c.archivo_url,
                enviado_at: c.enviado_at,
                enviado_por_mi: c.emisor_id === usuarioId,
            },
            no_leidos: mapaNoLeidos[c.usuario_id] || 0,
        }));

        return successResponse(res, "Conversaciones obtenidas", data);
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

        const [otro] = await pool.query(
            "SELECT id, nombre_completo, foto_perfil FROM usuarios WHERE id = ?",
            [otroId]
        );
        if (otro.length === 0) {
            return errorResponse(res, "Usuario no encontrado", 404);
        }

        const [mensajes] = await pool.query(
            `SELECT id, emisor_id, receptor_id, tipo_mensaje, mensaje, archivo_url, enviado_at, leido
             FROM mensajes_chat
             WHERE (emisor_id = ? AND receptor_id = ?) OR (emisor_id = ? AND receptor_id = ?)
             ORDER BY enviado_at ASC, id ASC`,
            [req.userId, otroId, otroId, req.userId]
        );

        return successResponse(res, "Mensajes obtenidos", {
            usuario: {
                id: otro[0].id,
                nombre_completo: otro[0].nombre_completo,
                foto_perfil: otro[0].foto_perfil,
            },
            mensajes,
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
