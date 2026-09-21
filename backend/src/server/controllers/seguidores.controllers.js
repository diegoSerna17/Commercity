import { z } from "zod";
import pool from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";

const seguirSchema = z.object({
    seguido_id: z.coerce.number().int().positive(),
});

const idParamSchema = z.coerce.number().int().positive();

async function usuarioExiste(usuarioId) {
    const [filas] = await pool.query(
        "SELECT 1 FROM usuarios WHERE id = ? AND activo = 1 LIMIT 1",
        [usuarioId]
    );
    return filas.length > 0;
}

export const seguirUsuario = async (req, res, next) => {
    try {
        const seguidorId = req.userId;
        const parsed = seguirSchema.safeParse(req.body);

        if (!parsed.success) {
            return errorResponse(res, "Datos inválidos", 400, parsed.error.issues);
        }

        const { seguido_id: seguidoId } = parsed.data;

        if (seguidoId === seguidorId) {
            return errorResponse(res, "No puedes seguirte a ti mismo", 400);
        }

        if (!(await usuarioExiste(seguidoId))) {
            return errorResponse(res, "Usuario a seguir no encontrado", 404);
        }

        const [existentes] = await pool.query(
            "SELECT 1 FROM seguidores WHERE seguidor_id = ? AND seguido_id = ? LIMIT 1",
            [seguidorId, seguidoId]
        );

        if (existentes.length > 0) {
            return errorResponse(res, "Ya sigues a este usuario", 409);
        }

        await pool.query(
            "INSERT INTO seguidores (seguidor_id, seguido_id) VALUES (?, ?)",
            [seguidorId, seguidoId]
        );

        return successResponse(
            res,
            "Ahora sigues a este usuario.",
            { seguidor_id: seguidorId, seguido_id: seguidoId },
            201
        );
    } catch (err) {
        next(err);
    }
};

export const dejarDeSeguir = async (req, res, next) => {
    try {
        const idParsed = idParamSchema.safeParse(req.params.id);

        if (!idParsed.success) {
            return errorResponse(res, "Id de usuario inválido", 400);
        }

        const [result] = await pool.query(
            "DELETE FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?",
            [req.userId, idParsed.data]
        );

        if (result.affectedRows === 0) {
            return errorResponse(res, "No sigues a este usuario", 404);
        }

        return successResponse(res, "Has dejado de seguir a este usuario.");
    } catch (err) {
        next(err);
    }
};

export const listarSiguiendo = async (req, res, next) => {
    try {
        const [filas] = await pool.query(
            `SELECT u.id, u.nombre_completo, u.foto_perfil, s.fecha_seguimiento
             FROM seguidores s
             JOIN usuarios u ON u.id = s.seguido_id
             WHERE s.seguidor_id = ?
             ORDER BY s.fecha_seguimiento DESC`,
            [req.userId]
        );
        return successResponse(res, "Usuarios que sigues.", filas);
    } catch (err) {
        next(err);
    }
};

export const listarSeguidores = async (req, res, next) => {
    try {
        const [filas] = await pool.query(
            `SELECT u.id, u.nombre_completo, u.foto_perfil, s.fecha_seguimiento
             FROM seguidores s
             JOIN usuarios u ON u.id = s.seguidor_id
             WHERE s.seguido_id = ?
             ORDER BY s.fecha_seguimiento DESC`,
            [req.userId]
        );
        return successResponse(res, "Usuarios que te siguen.", filas);
    } catch (err) {
        next(err);
    }
};
