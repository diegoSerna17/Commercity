import pool from "../config/db.js";

/**
 * Endpoint de verificación: responde que el servidor esta activo.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const getUsuarios = (req, res) => {
    res.send('servidor creado')
};

/**
 * Endpoint publico para ver el perfil de otro usuario por su ID.
 * Excluye datos sensibles (password, token, direccion de envio).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const getPerfilPublico = async (req, res) => {
    try {
        const { id } = req.params;

        // Validacion de entrada: id debe ser entero positivo
        const idNumerico = Number(id);
        if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
            return res.status(400).json({
                success: false,
                error: { code: "VALIDATION_ERROR", message: "El id debe ser un entero positivo" }
            });
        }

        // Busqueda del usuario activo en la BD (excluye datos sensibles)
        const [rows] = await pool.query(
            'SELECT id, nombre_completo, foto_perfil, descripcion_personal, activo FROM usuarios WHERE id = ?',
            [idNumerico]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Usuario no encontrado" }
            });
        }

        const usuarioBD = rows[0];

        // Si el usuario esta baneado, no se muestra su perfil publico
        if (!usuarioBD.activo) {
            return res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Usuario no encontrado" }
            });
        }

        // Mapeo de los campos reales de la BD a la estructura publica
        const perfilPublico = {
            id: usuarioBD.id,
            nombre: usuarioBD.nombre_completo,
            biografia: usuarioBD.descripcion_personal,
            avatar: usuarioBD.foto_perfil || "https://via.placeholder.com/150"
        };

        return res.status(200).json({ success: true, data: perfilPublico });

    } catch (error) {
        // Log interno para depuracion; no se expone al cliente
        console.error("Error al obtener perfil publico:", error.message);
        return res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Error al obtener el perfil" }
        });
    }
};
