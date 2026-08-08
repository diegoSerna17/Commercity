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

/**
 * RF40 / B-R6: el comprador elimina su cuenta desde ajustes (desactivacion logica).
 * - usuarios.activo = 0 (nunca DELETE fisico)
 * - Se vacia su carrito (dato transitorio)
 * - Si ademas es vendedor, sus productos se suspenden (RF54/RF74)
 * - Se conservan pedidos, calificaciones y reportes (historial intacto)
 */
export const eliminarCuentaComprador = async (req, res) => {
    const compradorId = req.userId;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Verificar que la cuenta exista y este activa
        const [usuarios] = await conn.query(
            "SELECT id, activo FROM usuarios WHERE id = ?",
            [compradorId]
        );
        if (usuarios.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Usuario no encontrado" }
            });
        }

        // Desactivacion logica de la cuenta
        await conn.query(
            "UPDATE usuarios SET activo = 0 WHERE id = ?",
            [compradorId]
        );
        // Suspender sus productos publicados si es vendedor (RF54/RF74)
        await conn.query(
            "UPDATE productos SET eliminado_por_admin = 1 WHERE vendedor_id = ? AND eliminado_por_admin = 0",
            [compradorId]
        );
        // Vaciar el carrito (dato transitorio, se puede borrar)
        await conn.query(
            "DELETE FROM carrito_items WHERE comprador_id = ?",
            [compradorId]
        );

        await conn.commit();
        return res.status(200).json({
            success: true,
            data: { id: compradorId, estado: "desactivado" }
        });
    } catch (error) {
        await conn.rollback();
        console.error("Error al eliminar la cuenta:", error.message);
        return res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Error al eliminar la cuenta" }
        });
    } finally {
        conn.release();
    }
};
