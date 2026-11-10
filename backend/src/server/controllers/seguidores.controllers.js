import pool from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";

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
        // validate(seguirSchema) ya valido el body y coacciono seguido_id.
        const { seguido_id: seguidoId } = req.body;

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
        // validate(seguidorIdParamSchema, "params") ya valido y coacciono :id.
        const seguidoId = req.params.id;

        const [result] = await pool.query(
            "DELETE FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?",
            [req.userId, seguidoId]
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
        const { page: pagina, limit: limite } = req.query;
        const offset = (pagina - 1) * limite;
        const [[totalRow]] = await pool.query(
            "SELECT COUNT(*) AS total FROM seguidores WHERE seguidor_id = ?",
            [req.userId]
        );
        const total = Number(totalRow?.total || 0);
        const [filas] = await pool.query(
            `SELECT u.id, u.nombre_completo, u.foto_perfil, s.fecha_seguimiento
             FROM seguidores s
             JOIN usuarios u ON u.id = s.seguido_id
             WHERE s.seguidor_id = ?
             ORDER BY s.fecha_seguimiento DESC
             LIMIT ? OFFSET ?`,
            [req.userId, limite, offset]
        );
        return res.status(200).json({
            success: true,
            message: "Usuarios que sigues.",
            data: filas,
            paginacion: {
                pagina,
                por_pagina: limite,
                total,
                total_paginas: Math.max(1, Math.ceil(total / limite)),
            },
        });
    } catch (err) {
        next(err);
    }
};

export const listarSeguidores = async (req, res, next) => {
    try {
        const { page: pagina, limit: limite } = req.query;
        const offset = (pagina - 1) * limite;
        const [[totalRow]] = await pool.query(
            "SELECT COUNT(*) AS total FROM seguidores WHERE seguido_id = ?",
            [req.userId]
        );
        const total = Number(totalRow?.total || 0);
        const [filas] = await pool.query(
            `SELECT u.id, u.nombre_completo, u.foto_perfil, s.fecha_seguimiento
             FROM seguidores s
             JOIN usuarios u ON u.id = s.seguidor_id
             WHERE s.seguido_id = ?
             ORDER BY s.fecha_seguimiento DESC
             LIMIT ? OFFSET ?`,
            [req.userId, limite, offset]
        );
        return res.status(200).json({
            success: true,
            message: "Usuarios que te siguen.",
            data: filas,
            paginacion: {
                pagina,
                por_pagina: limite,
                total,
                total_paginas: Math.max(1, Math.ceil(total / limite)),
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Cuenta los seguidores y seguidos de cualquier usuario (perfil publico).
 * Endpoint publico: no requiere autenticacion porque solo expone totales.
 */
export const contarSeguidores = async (req, res, next) => {
    try {
        // validate(seguidorIdParamsSchema, "params") ya valido y coacciono :id.
        const usuarioId = req.params.id;

        if (!(await usuarioExiste(usuarioId))) {
            return errorResponse(res, "Usuario no encontrado", 404);
        }

        const [[seguidores], [siguiendo]] = await Promise.all([
            pool.query(
                "SELECT COUNT(*) AS total FROM seguidores WHERE seguido_id = ?",
                [usuarioId]
            ),
            pool.query(
                "SELECT COUNT(*) AS total FROM seguidores WHERE seguidor_id = ?",
                [usuarioId]
            ),
        ]);

        return successResponse(res, "Contadores sociales del usuario.", {
            seguidores: seguidores[0]?.total ?? 0,
            siguiendo: siguiendo[0]?.total ?? 0,
        });
    } catch (err) {
        next(err);
    }
};
