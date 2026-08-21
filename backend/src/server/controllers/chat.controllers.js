/**
 * Modulo Chat interno (RF105 del documento 20/08).
 * Comunicacion entre usuarios: mensajes de texto, imagen y archivo.
 * Tabla real: mensajes_chat (emisor_id, receptor_id, tipo_mensaje,
 * mensaje, archivo_url, enviado_at, leido).
 */
import { z } from "zod";
import pool from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";

const mensajeSchema = z.object({
  receptor_id: z.number().int().positive(),
  tipo_mensaje: z.enum(["texto", "imagen", "archivo"]).default("texto"),
  mensaje: z.string().max(4000).optional(),
  archivo_url: z.string().max(255).optional(),
});

/**
 * Envia un mensaje de un usuario autenticado a otro (RF105).
 * - texto: requiere mensaje no vacio.
 * - imagen/archivo: requiere archivo_url.
 * - Prohibido enviarse mensaje a uno mismo.
 */
export const enviarMensaje = async (req, res, next) => {
  try {
    const emisorId = req.userId;
    const data = mensajeSchema.parse(req.body);
    const { receptor_id, tipo_mensaje, mensaje, archivo_url } = data;

    if (receptor_id === emisorId) {
      return errorResponse(res, "No puedes enviarte un mensaje a ti mismo.", 400);
    }
    if (tipo_mensaje === "texto" && (!mensaje || !mensaje.trim())) {
      return errorResponse(res, "El mensaje es obligatorio.", 400);
    }
    if (tipo_mensaje !== "texto" && !archivo_url) {
      return errorResponse(res, "La URL del archivo es obligatoria para imagen o archivo.", 400);
    }

    // El receptor debe existir y estar activo.
    const [receptor] = await pool.query(
      "SELECT id FROM usuarios WHERE id = ? AND activo = 1",
      [receptor_id]
    );
    if (receptor.length === 0) {
      return errorResponse(res, "Receptor no encontrado o inactivo.", 404);
    }

    const [result] = await pool.query(
      `INSERT INTO mensajes_chat (emisor_id, receptor_id, tipo_mensaje, mensaje, archivo_url)
       VALUES (?, ?, ?, ?, ?)`,
      [emisorId, receptor_id, tipo_mensaje, mensaje?.trim() ?? null, archivo_url ?? null]
    );

    return successResponse(
      res,
      "Mensaje enviado correctamente.",
      {
        id: result.insertId,
        emisor_id: emisorId,
        receptor_id,
        tipo_mensaje,
        mensaje: mensaje?.trim() ?? null,
        archivo_url: archivo_url ?? null,
      },
      201
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(
        res,
        "Datos del mensaje inválidos.",
        400,
        err.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }))
      );
    }
    next(err);
  }
};

/**
 * Lista las conversaciones del usuario autenticado con el ultimo mensaje
 * de cada par y el conteo de no leidos (RF105).
 */
export const listarConversaciones = async (req, res, next) => {
  try {
    const usuarioId = req.userId;

    const [ultimos] = await pool.query(
      `SELECT mc.id, mc.emisor_id, mc.receptor_id, mc.tipo_mensaje, mc.mensaje,
              mc.archivo_url, mc.enviado_at, mc.leido,
              u.nombre_completo AS otro_nombre, u.foto_perfil AS otro_foto
       FROM mensajes_chat mc
       INNER JOIN usuarios u ON u.id = IF(mc.emisor_id = ?, mc.receptor_id, mc.emisor_id)
       WHERE mc.id IN (
         SELECT MAX(m2.id) FROM mensajes_chat m2
         WHERE m2.emisor_id = ? OR m2.receptor_id = ?
         GROUP BY LEAST(m2.emisor_id, m2.receptor_id), GREATEST(m2.emisor_id, m2.receptor_id)
       )
       ORDER BY mc.enviado_at DESC`,
      [usuarioId, usuarioId, usuarioId]
    );

    const [noLeidos] = await pool.query(
      `SELECT emisor_id, COUNT(*) AS total
       FROM mensajes_chat
       WHERE receptor_id = ? AND leido = 0
       GROUP BY emisor_id`,
      [usuarioId]
    );
    const noLeidosPorEmisor = new Map(noLeidos.map((n) => [n.emisor_id, Number(n.total)]));

    const conversaciones = ultimos.map((m) => {
      const otroId = m.emisor_id === usuarioId ? m.receptor_id : m.emisor_id;
      return {
        id: m.id,
        otro_usuario: { id: otroId, nombre: m.otro_nombre, foto: m.otro_foto },
        ultimo_mensaje: {
          id: m.id,
          emisor_id: m.emisor_id,
          tipo_mensaje: m.tipo_mensaje,
          mensaje: m.mensaje,
          archivo_url: m.archivo_url,
          enviado_at: m.enviado_at,
          leido: !!m.leido,
        },
        no_leidos: noLeidosPorEmisor.get(otroId) || 0,
      };
    });

    return successResponse(res, "Conversaciones del usuario", { conversaciones });
  } catch (err) {
    next(err);
  }
};

/**
 * Lista el historial entre el usuario autenticado y otro usuario,
 * y marca como leidos los mensajes recibidos (RF105).
 */
export const listarMensajesCon = async (req, res, next) => {
  try {
    const usuarioId = req.userId;
    const otroId = Number(req.params.receptorId);
    if (!Number.isInteger(otroId) || otroId <= 0) {
      return errorResponse(res, "El id del otro usuario debe ser un entero positivo.", 400);
    }

    const [mensajes] = await pool.query(
      `SELECT mc.id, mc.emisor_id, mc.receptor_id, mc.tipo_mensaje, mc.mensaje,
              mc.archivo_url, mc.enviado_at, mc.leido,
              u.nombre_completo AS otro_nombre, u.foto_perfil AS otro_foto
       FROM mensajes_chat mc
       INNER JOIN usuarios u ON u.id = IF(mc.emisor_id = ?, mc.receptor_id, mc.emisor_id)
       WHERE (mc.emisor_id = ? AND mc.receptor_id = ?)
          OR (mc.emisor_id = ? AND mc.receptor_id = ?)
       ORDER BY mc.enviado_at ASC, mc.id ASC`,
      [usuarioId, usuarioId, otroId, otroId, usuarioId]
    );

    await pool.query(
      `UPDATE mensajes_chat SET leido = 1
       WHERE emisor_id = ? AND receptor_id = ? AND leido = 0`,
      [otroId, usuarioId]
    );

    const otro =
      mensajes.length > 0
        ? { id: otroId, nombre: mensajes[0].otro_nombre, foto: mensajes[0].otro_foto }
        : { id: otroId, nombre: null, foto: null };

    return successResponse(res, "Mensajes de la conversación", {
      otro_usuario: otro,
      mensajes: mensajes.map((m) => ({
        id: m.id,
        emisor_id: m.emisor_id,
        receptor_id: m.receptor_id,
        tipo_mensaje: m.tipo_mensaje,
        mensaje: m.mensaje,
        archivo_url: m.archivo_url,
        enviado_at: m.enviado_at,
        leido: !!m.leido,
      })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Marca como leido un mensaje dirigido al usuario autenticado (RF105).
 */
export const marcarComoLeido = async (req, res, next) => {
  try {
    const usuarioId = req.userId;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return errorResponse(res, "El id del mensaje debe ser un entero positivo.", 400);
    }

    const [result] = await pool.query(
      "UPDATE mensajes_chat SET leido = 1 WHERE id = ? AND receptor_id = ?",
      [id, usuarioId]
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, "Mensaje no encontrado o no es tuyo.", 404);
    }

    return successResponse(res, "Mensaje marcado como leído", { id });
  } catch (err) {
    next(err);
  }
};
