import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../config/db.js";
import { JWT_SECRET } from "../utils/config.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { enviarCorreoRecuperacion } from "../utils/mailer.js";

// ============================================================================
// MODULO DE AUTENTICACION (integrado desde AVANCES/SPRING 1/DIEGO SERNA/2)
// Fixes aplicados en la integracion (informe v3.0):
//   3.1 CRITICO: JWT_SECRET sin fallback hardcodeado (se usa utils/config.js).
//   3.2 ALTA:    register con transaccion (usuario + rol nunca quedan a medias).
//   3.3 MEDIO:   logout invalida el token en tokens_invalidados (RF2).
//   3.4 MEDIO:   el correo dice "expira en 5 minutos" (RF4) en utils/mailer.js.
// ============================================================================

/**
 * Endpoint de verificación: responde que el servidor esta activo.
 * Usado por GET / (routes/routes.js) y por GET /api/usuarios/
 * (routes/usuarios.routes.js).
 *
 * Fix DEF-02 / DEF-03 (P1 contrato API uniforme): anteriormente devolvia
 * texto plano, lo cual rompia el contrato { success, data } que usan los
 * otros 67 endpoints. Ahora responde JSON conforme al contrato.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const getUsuarios = (req, res) => {
    return res.json({
        success: true,
        data: {
            message: "servidor creado",
            status: "ok",
            timestamp: new Date().toISOString(),
            version: "Commercity API v1"
        }
    });
};

// ============================ REGISTRO ============================
export const register = async (req, res) => {
    const { email, password, nombre_completo } = req.body;

    try {
        // Email duplicado (la UNIQUE de la BD es la garantia final)
        const [existente] = await pool.query(
            "SELECT id FROM usuarios WHERE email = ?",
            [email]
        );
        if (existente.length > 0) {
            return errorResponse(res, "El email ya está registrado", 400);
        }

        const rolSolicitado = "comprador";
        const passwordHash = await bcrypt.hash(password, 10);

        // Fix 3.2: transaccion para que usuario + rol queden siempre consistentes.
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [resultado] = await connection.query(
                "INSERT INTO usuarios (email, password, nombre_completo) VALUES (?, ?, ?)",
                [email, passwordHash, nombre_completo || null]
            );
            const usuarioId = resultado.insertId;

            // Asignar el rol por medio de la tabla puente usuario_roles
            const [rolRow] = await connection.query(
                "SELECT id FROM roles WHERE nombre = ?",
                [rolSolicitado]
            );
            if (rolRow.length === 0) {
                await connection.rollback();
                return errorResponse(res, "Error interno del servidor", 500);
            }
            await connection.query(
                "INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?, ?)",
                [usuarioId, rolRow[0].id]
            );

            await connection.commit();

            // Fix 3.1: secreto validado, nunca un fallback hardcodeado.
            const token = jwt.sign(
                { id: usuarioId, email },
                JWT_SECRET,
                { expiresIn: "7d" }
            );

            return successResponse(res, "Usuario registrado correctamente", {
                token,
                user: {
                    id: usuarioId,
                    email,
                    nombre_completo: nombre_completo || null,
                    roles: [rolSolicitado]
                }
            }, 201);
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        // Duplicado de email a pesar del pre-check (race condition)
        if (error?.code === "ER_DUP_ENTRY") {
            return errorResponse(res, "El email ya está registrado", 400);
        }
        console.error("Error en register:", error);
        return errorResponse(res, "Error interno del servidor", 500);
    }
};

// ============================= LOGIN =============================
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [usuarios] = await pool.query(
            `SELECT u.id, u.email, u.password, u.nombre_completo, u.foto_perfil, u.activo
             FROM usuarios u WHERE u.email = ?`,
            [email]
        );
        if (usuarios.length === 0) {
            return errorResponse(res, "Credenciales inválidas", 401);
        }

        const usuario = usuarios[0];
        if (!usuario.activo) {
            return errorResponse(res, "Usuario inactivo", 401);
        }

        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            return errorResponse(res, "Credenciales inválidas", 401);
        }

        // Roles
        const [roles] = await pool.query(
            `SELECT r.nombre FROM roles r
             INNER JOIN usuario_roles ur ON r.id = ur.rol_id
             WHERE ur.usuario_id = ?`,
            [usuario.id]
        );

        // Fix 3.1: secreto validado, nunca un fallback hardcodeado.
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        return successResponse(res, "Inicio de sesión exitoso", {
            token,
            user: {
                id: usuario.id,
                email: usuario.email,
                nombre_completo: usuario.nombre_completo,
                foto_perfil: usuario.foto_perfil,
                roles: roles.map(r => r.nombre)
            }
        });
    } catch (error) {
        console.error("Error en login:", error);
        return errorResponse(res, "Error interno del servidor", 500);
    }
};

// ========================= LOGOUT (RF2) =========================
// Fix 3.3: revoca el JWT en la lista negra tokens_invalidados (la ruta exige
// token via authRequired). INSERT IGNORE hace idempotente un doble logout.
export const logout = async (req, res) => {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (token) {
        const hash = crypto.createHash("sha256").update(token).digest("hex");
        await pool.query(
            "INSERT IGNORE INTO tokens_invalidados (token_hash, expira_en) VALUES (?, DATE_ADD(NOW(), INTERVAL 7 DAY))",
            [hash]
        );
    }
    return successResponse(res, "Sesión cerrada correctamente");
};

// ===================== PERFIL (autenticado) =====================
export const getPerfil = async (req, res) => {
    try {
        const [usuarios] = await pool.query(
            `SELECT u.id, u.email, u.nombre_completo, u.foto_perfil, u.descripcion_personal,
                    u.direccion_envio, u.created_at, u.updated_at
             FROM usuarios u WHERE u.id = ?`,
            [req.userId]
        );
        if (usuarios.length === 0) {
            return errorResponse(res, "Usuario no encontrado", 404);
        }

        const [roles] = await pool.query(
            `SELECT r.nombre FROM roles r
             INNER JOIN usuario_roles ur ON r.id = ur.rol_id
             WHERE ur.usuario_id = ?`,
            [req.userId]
        );

        return successResponse(res, "Perfil obtenido", {
            ...usuarios[0],
            roles: roles.map(r => r.nombre)
        });
    } catch (error) {
        console.error("Error en getPerfil:", error);
        return errorResponse(res, "Error interno del servidor", 500);
    }
};

// ============ CAMBIAR ROL (comprador <-> vendedor) =============
export const cambiarRol = async (req, res) => {
    const { rol } = req.body;

    try {
        const rolesValidos = ["comprador", "vendedor"];
        if (!rolesValidos.includes(rol)) {
            return errorResponse(res, "Rol inválido. Solo comprador o vendedor", 400);
        }

        const [rolRow] = await pool.query(
            "SELECT id FROM roles WHERE nombre = ?",
            [rol]
        );
        if (rolRow.length === 0) {
            return errorResponse(res, "Rol no encontrado", 404);
        }

        const [rolesActuales] = await pool.query(
            `SELECT r.nombre FROM roles r
             INNER JOIN usuario_roles ur ON r.id = ur.rol_id
             WHERE ur.usuario_id = ?`,
            [req.userId]
        );

        if (rolesActuales.some(r => r.nombre === "administrador")) {
            return errorResponse(res, "El rol administrador no puede autodegradarse", 403);
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query(
                "DELETE FROM usuario_roles WHERE usuario_id = ?",
                [req.userId]
            );
            await connection.query(
                "INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?, ?)",
                [req.userId, rolRow[0].id]
            );

            await connection.commit();
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

        return successResponse(res, "Rol actualizado correctamente", {
            roles: [rol]
        });
    } catch (error) {
        console.error("Error en cambiarRol:", error);
        return errorResponse(res, "Error interno del servidor", 500);
    }
};

// ================ SOLICITAR RECUPERACION (RF4) =================
export const solicitarRecuperacion = async (req, res) => {
    const { email } = req.body;

    try {
        const [usuarios] = await pool.query(
            "SELECT id, email, activo FROM usuarios WHERE email = ?",
            [email]
        );

        // Anti-enumeracion: respuesta uniforme para email existente/inexistente
        if (usuarios.length === 0 || !usuarios[0].activo) {
            return successResponse(
                res,
                "Si el correo existe, recibirás un enlace para restablecer tu contraseña."
            );
        }

        const usuario = usuarios[0];

        // Token seguro (32 bytes hex = 64 caracteres)
        const token = crypto.randomBytes(32).toString("hex");

        // RF4: expira a los 5 minutos
        await pool.query(
            "UPDATE usuarios SET token_recuperacion = ?, token_recuperacion_expiracion = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = ?",
            [token, usuario.id]
        );

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const resetUrl = `${frontendUrl}/restore?token=${token}`;

        await enviarCorreoRecuperacion(usuario.email, resetUrl);

        return successResponse(
            res,
            "Si el correo existe, recibirás un enlace para restablecer tu contraseña."
        );
    } catch (error) {
        console.error("Error en solicitarRecuperacion:", error);
        return errorResponse(res, "Error interno del servidor", 500);
    }
};

// ================ RESTABLECER CONTRASEÑA (RF4) =================
export const restablecerPassword = async (req, res) => {
    const { token, password } = req.body;

    try {
        // Token de un solo uso y no expirado (RF4: 5 minutos)
        const [usuarios] = await pool.query(
            "SELECT id, email FROM usuarios WHERE token_recuperacion = ? AND token_recuperacion_expiracion > NOW()",
            [token]
        );

        if (usuarios.length === 0) {
            return errorResponse(res, "El enlace es inválido o ya fue utilizado", 400);
        }

        const usuario = usuarios[0];

        const passwordHash = await bcrypt.hash(password, 10);

        // Actualizar contraseña y limpiar token (el link muere: un solo uso)
        await pool.query(
            "UPDATE usuarios SET password = ?, token_recuperacion = NULL, token_recuperacion_expiracion = NULL WHERE id = ?",
            [passwordHash, usuario.id]
        );

        return successResponse(res, "Contraseña restablecida correctamente. Ya puedes iniciar sesión.");
    } catch (error) {
        console.error("Error en restablecerPassword:", error);
        return errorResponse(res, "Error interno del servidor", 500);
    }
};

// ========================== ADMIN ==============================
export const adminGetDatos = async (req, res) => {
    try {
        // Devuelve el rol detectado por requireRoles (inyectado en req.userRoles)
        return successResponse(res, "Acceso de administrador autorizado", {
            email: req.userEmail,
            roles: req.userRoles,
        });
    } catch (error) {
        console.error("Error en adminGetDatos:", error);
        return errorResponse(res, "Error interno del servidor", 500);
    }
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

/**
 * GET /api/usuarios/directorio?q=
 * Lista usuarios activos para poder iniciar un chat con cualquier persona.
 * Excluye al usuario autenticado y no expone datos sensibles.
 */
export const listarUsuarios = async (req, res, next) => {
    try {
        const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

        let sql = `SELECT id, nombre_completo, foto_perfil
                   FROM usuarios
                   WHERE activo = 1 AND id <> ?`;
        const params = [req.userId];

        if (q) {
            sql += " AND (nombre_completo LIKE ? OR email LIKE ?)";
            params.push(`%${q}%`, `%${q}%`);
        }

        sql += " ORDER BY nombre_completo ASC LIMIT 50";

        const [rows] = await pool.query(sql, params);
        return successResponse(res, "Usuarios obtenidos", rows);
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/usuarios/me
 * Actualiza únicamente el nombre de perfil del usuario autenticado.
 */
export const actualizarPerfil = async (req, res, next) => {
    try {
        const nombre = typeof req.body?.nombre_completo === "string"
            ? req.body.nombre_completo.trim()
            : "";

        if (!nombre) {
            return errorResponse(res, "El nombre de perfil es obligatorio", 400);
        }
        if (nombre.length > 100) {
            return errorResponse(res, "El nombre de perfil no puede superar 100 caracteres", 400);
        }

        await pool.query(
            "UPDATE usuarios SET nombre_completo = ? WHERE id = ?",
            [nombre, req.userId]
        );

        const [rows] = await pool.query(
            "SELECT id, email, nombre_completo, foto_perfil FROM usuarios WHERE id = ?",
            [req.userId]
        );

        return successResponse(res, "Perfil actualizado correctamente", rows[0]);
    } catch (err) {
        next(err);
    }
};
