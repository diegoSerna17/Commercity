import pool from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { validarId } from "../utils/ids.js";

const TIPOS_VALIDOS = [
    "compra",
    "pedido enviado",
    "en camino",
    "entregado",
    "devolucion",
    "mensajes",
    "reporte",
];

const LIMITE_MAXIMO = 50;

const formatearDiasHoras = (fecha) => {
    const f = new Date(fecha);
    if (Number.isNaN(f.getTime())) return "";

    const diffMs = Date.now() - f.getTime();
    if (diffMs < 60000) return "Recién";

    const minutos = Math.floor(diffMs / 60000);
    if (minutos < 60) return `Hace ${minutos} min`;

    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} h`;

    const dias = Math.floor(horas / 24);
    return `Hace ${dias} días`;
};

export const listarNotificaciones = async (req, res, next) => {
    try {
        const condiciones = ["usuario_id = ?"];
        const params = [req.userId];

        if (req.query.tipo !== undefined) {
            if (typeof req.query.tipo !== "string" || !TIPOS_VALIDOS.includes(req.query.tipo)) {
                return errorResponse(res, "Tipo de notificación inválido", 400);
            }
            condiciones.push("tipo = ?");
            params.push(req.query.tipo);
        }

        let limite = LIMITE_MAXIMO;
        if (req.query.limite !== undefined) {
            const n = Number(req.query.limite);
            if (!Number.isInteger(n) || n < 1 || n > LIMITE_MAXIMO) {
                return errorResponse(res, "El límite debe estar entre 1 y 50", 400);
            }
            limite = n;
        }

        // B-7 (TASK-4.9): paginacion del listado (la respuesta suma campos, sin
        // cambiar el contrato existente { total, notificaciones }).
        let pagina = 1;
        if (req.query.pagina !== undefined) {
            const p = Number(req.query.pagina);
            if (!Number.isInteger(p) || p < 1) {
                return errorResponse(res, "La página debe ser un entero positivo", 400);
            }
            pagina = p;
        }
        const offset = (pagina - 1) * limite;

        const [totalRows] = await pool.query(
            `SELECT COUNT(*) AS total FROM notificaciones WHERE ${condiciones.join(" AND ")}`,
            params
        );
        const totalRegistros = Number(totalRows[0]?.total || 0);

        const [rows] = await pool.query(
            `SELECT id, tipo, descripcion, estado, url_redireccion, fecha_hora
             FROM notificaciones
             WHERE ${condiciones.join(" AND ")}
             ORDER BY fecha_hora DESC, id DESC
             LIMIT ? OFFSET ?`,
            [...params, limite, offset]
        );

        const notificaciones = rows.map((n) => ({
            id: n.id,
            tipo: n.tipo,
            descripcion: n.descripcion,
            url_redireccion: n.url_redireccion,
            leida: n.estado === "leido",
            dias_horas: formatearDiasHoras(n.fecha_hora),
            fecha_hora: n.fecha_hora,
        }));

        return successResponse(res, "Notificaciones obtenidas", {
            total: notificaciones.length,
            notificaciones,
            pagina,
            por_pagina: limite,
            total_registros: totalRegistros,
            total_paginas: Math.max(1, Math.ceil(totalRegistros / limite)),
            hay_mas: pagina * limite < totalRegistros,
        });
    } catch (err) {
        next(err);
    }
};

export const contarNoLeidas = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            "SELECT COUNT(*) AS total FROM notificaciones WHERE usuario_id = ? AND estado = 'no leido'",
            [req.userId]
        );

        return successResponse(res, "Notificaciones no leídas", {
            total_no_leidas: Number(rows[0]?.total ?? 0),
        });
    } catch (err) {
        next(err);
    }
};

export const marcarTodasLeidas = async (req, res, next) => {
    try {
        const [result] = await pool.query(
            "UPDATE notificaciones SET estado = ? WHERE usuario_id = ? AND estado = ?",
            ["leido", req.userId, "no leido"]
        );

        return successResponse(res, "Notificaciones marcadas como leídas", {
            actualizadas: result.affectedRows,
        });
    } catch (err) {
        next(err);
    }
};

export const marcarLeida = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!validarId(id)) {
            return errorResponse(res, "ID de notificación inválido", 400);
        }

        const [result] = await pool.query(
            "UPDATE notificaciones SET estado = ? WHERE id = ? AND usuario_id = ?",
            ["leido", id, req.userId]
        );

        if (result.affectedRows === 0) {
            return errorResponse(res, "Notificación no encontrada", 404);
        }

        return successResponse(res, "Notificación marcada como leída", { id });
    } catch (err) {
        next(err);
    }
};

export const eliminarNotificacion = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!validarId(id)) {
            return errorResponse(res, "ID de notificación inválido", 400);
        }

        const [result] = await pool.query(
            "DELETE FROM notificaciones WHERE id = ? AND usuario_id = ?",
            [id, req.userId]
        );

        if (result.affectedRows === 0) {
            return errorResponse(res, "Notificación no encontrada", 404);
        }

        return successResponse(res, "Notificación eliminada", { id });
    } catch (err) {
        next(err);
    }
};

export const eliminarTodas = async (req, res, next) => {
    try {
        const [result] = await pool.query(
            "DELETE FROM notificaciones WHERE usuario_id = ?",
            [req.userId]
        );

        return successResponse(res, "Notificaciones eliminadas", {
            eliminadas: result.affectedRows,
        });
    } catch (err) {
        next(err);
    }
};
