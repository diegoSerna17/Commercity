import bcrypt from "bcrypt";
import crypto from "crypto";
import pool from "../config/db.js";
import {
    JWT_SECRET,
    JWT_ISSUER,
    JWT_AUDIENCE,
    JWT_EXPIRES_IN,
} from "../utils/config.js";
import jwt from "jsonwebtoken";
import { enviarCorreoRecuperacion, enviarAvisoRegistroDuplicado } from "../utils/mailer.js";
import { escapeLike } from "../utils/sql.js";
import { borrarUploadPorUrl } from "../config/multer.js";
import { destinoPedidosVendedor } from "./pedidos.service.js";
import { registrarAuditoria, ACCIONES } from "../utils/auditoria.js";

// ============================================================================
// Servicio del dominio usuarios (autenticacion, perfil y directorio).
// Concentra el SQL y las reglas de negocio; el controlador valida, llama y
// responde. El pool viene de config/db.js, de modo que las pruebas que lo
// mockean siguen funcionando sin cambios.
// ============================================================================

// H5/H8 (TASK-4.8): hash bcrypt ficticio para igualar el TIEMPO de login entre
// una cuenta existente y una inexistente (anti-enumeracion por timing). No
// corresponde a ninguna contrasena real (se genero de un valor aleatorio).
const HASH_FICTICIO = "$2b$10$f3bObWmLFI8EVveYGbAXP.4MwdtHCDDHnbQFA4.jGDg5c5RIg5IYS";

/**
 * Respuesta uniforme de alta cuando el email ya existe (M-15): hash ficticio
 * descartable para igualar tiempos (B-6) y aviso fail-soft al titular.
 */
async function respuestaDuplicado(email, nombre_completo) {
    await bcrypt.hash(crypto.randomUUID(), 10);
    try {
        await enviarAvisoRegistroDuplicado(email);
    } catch {
        // fail-soft: la respuesta no cambia aunque falle el correo
    }
    return {
        duplicado: true,
        email,
        nombre_completo: nombre_completo || null,
    };
}

/** Firma el JWT de sesion con los claims y la version de token vigente. */
export function firmarToken(usuario) {
    return jwt.sign(
        { id: usuario.id, email: usuario.email, token_version: Number(usuario.token_version || 0) },
        JWT_SECRET,
        {
            algorithm: "HS256",
            expiresIn: JWT_EXPIRES_IN,
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
            // jti unico (UUID v4): dos logins en el mismo segundo no emiten
            // el mismo token. No se valida en verify: los tokens previos
            // (sin jti) siguen validos hasta expirar.
            jwtid: crypto.randomUUID(),
        }
    );
}

/**
 * Registra un comprador.
 * M-15 (TASK-4.7): si el email ya existe NO se revela; se avisa al titular
 * real por correo y se devuelve el mismo contrato de alta sin token.
 * @param {{ email: string, password: string, nombre_completo?: string }} datos
 * @returns {Promise<{ duplicado: boolean, id?: number, email: string, nombre_completo: string|null, rol?: string }>}
 */
export async function registrarUsuario({ email, password, nombre_completo }) {
    // M-15 (TASK-4.7): respuesta UNIFORME. Si el email ya existe NO se
    // revela: se avisa al titular real por correo y se responde igual que
    // un alta (sin token, porque la cuenta existente no se toca).
    const [existente] = await pool.query(
        "SELECT id FROM usuarios WHERE email = ?",
        [email]
    );
    if (existente.length > 0) {
        // B-6 (anti-enumeracion por tiempo): el alta nueva cuesta un
        // bcrypt.hash; aqui se hace un hash ficticio descartable para que
        // ambas respuestas tarden lo mismo y no se distingan por timing.
        return respuestaDuplicado(email, nombre_completo);
    }

    const rolSolicitado = "comprador";
    const passwordHash = await bcrypt.hash(password, 10);

    // Fix 3.2: transaccion para que usuario + rol queden siempre consistentes.
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        let resultado;
        try {
            [resultado] = await connection.query(
                "INSERT INTO usuarios (email, password, nombre_completo, terminos_aceptados_en) VALUES (?, ?, ?, NOW())",
                [email, passwordHash, nombre_completo || null]
            );
        } catch (err) {
            // Duplicado de email a pesar del pre-check (race condition): M-15,
            // misma respuesta uniforme (aviso al titular, sin token).
            if (err?.code === "ER_DUP_ENTRY") {
                await connection.rollback();
                return respuestaDuplicado(email, nombre_completo);
            }
            throw err;
        }
        const usuarioId = resultado.insertId;

        // Asignar el rol por medio de la tabla puente usuario_roles
        const [rolRow] = await connection.query(
            "SELECT id FROM roles WHERE nombre = ?",
            [rolSolicitado]
        );
        if (rolRow.length === 0) {
            await connection.rollback();
            throw new Error("Rol comprador no configurado");
        }
        await connection.query(
            "INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?, ?)",
            [usuarioId, rolRow[0].id]
        );

        await connection.commit();

        return {
            duplicado: false,
            id: usuarioId,
            email,
            nombre_completo: nombre_completo || null,
            rol: rolSolicitado,
        };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

/**
 * Valida credenciales y devuelve el usuario con sus roles.
 * H5 anti-enumeracion: mismo trabajo criptografico exista o no la cuenta.
 * @param {{ email: string, password: string }} datos
 * @returns {Promise<object|null>} usuario con roles, o null si no es valido.
 */
export async function autenticarUsuario({ email, password }) {
    const [usuarios] = await pool.query(
        `SELECT u.id, u.email, u.password, u.nombre_completo, u.foto_perfil, u.activo,
                u.token_version
         FROM usuarios u WHERE u.email = ?`,
        [email]
    );

    // H5: mismo trabajo criptografico exista o no la cuenta.
    if (usuarios.length === 0) {
        await bcrypt.compare(password ?? "", HASH_FICTICIO);
        return null;
    }

    const usuario = usuarios[0];
    const passwordValido = await bcrypt.compare(password ?? "", usuario.password);
    // H5 anti-enumeracion: mensaje uniforme tambien para inactivos y el
    // chequeo de estado va DESPUES del compare (mismo tiempo).
    if (!usuario.activo || !passwordValido) {
        return null;
    }

    // Roles
    const [roles] = await pool.query(
        `SELECT r.nombre FROM roles r
         INNER JOIN usuario_roles ur ON r.id = ur.rol_id
         WHERE ur.usuario_id = ?`,
        [usuario.id]
    );

    return {
        id: usuario.id,
        email: usuario.email,
        nombre_completo: usuario.nombre_completo,
        foto_perfil: usuario.foto_perfil,
        token_version: usuario.token_version,
        roles: roles.map((r) => r.nombre),
    };
}

/** Revoca un token en la lista negra (idempotente via INSERT IGNORE). */
export async function revocarToken(token) {
    if (!token) return;
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    await pool.query(
        "INSERT IGNORE INTO tokens_invalidados (token_hash, expira_en) VALUES (?, DATE_ADD(NOW(), INTERVAL 7 DAY))",
        [hash]
    );
}

/** Incrementa token_version: invalida todos los JWT previos del usuario. */
export async function cerrarTodasLasSesiones(usuarioId, token) {
    await pool.query(
        "UPDATE usuarios SET token_version = token_version + 1 WHERE id = ?",
        [usuarioId]
    );
    await revocarToken(token);
}

/** Perfil propio (incluye roles) o null si el usuario no existe. */
export async function obtenerPerfil(usuarioId) {
    const [usuarios] = await pool.query(
        `SELECT u.id, u.email, u.nombre_completo, u.foto_perfil, u.descripcion_personal,
                u.direccion_envio, u.created_at, u.updated_at
         FROM usuarios u WHERE u.id = ?`,
        [usuarioId]
    );
    if (usuarios.length === 0) return null;

    const [roles] = await pool.query(
        `SELECT r.nombre FROM roles r
         INNER JOIN usuario_roles ur ON r.id = ur.rol_id
         WHERE ur.usuario_id = ?`,
        [usuarioId]
    );

    return {
        ...usuarios[0],
        roles: roles.map((r) => r.nombre),
    };
}

/**
 * Cambia el rol del usuario autenticado (comprador <-> vendedor).
 * B2 (auditoria 2026-11-04): bajar a comprador con productos activos o
 * pedidos abiertos dejaria ventas y compromisos sin responsable.
 * @returns {Promise<{ ok: true, roles: string[] } | { ok: false, status: number, mensaje: string }>}
 */
export async function cambiarRolUsuario({ usuarioId, rol, ip }) {
    const [rolRow] = await pool.query(
        "SELECT id FROM roles WHERE nombre = ?",
        [rol]
    );
    if (rolRow.length === 0) {
        return { ok: false, status: 404, mensaje: "Rol no encontrado" };
    }

    const [rolesActuales] = await pool.query(
        `SELECT r.nombre FROM roles r
         INNER JOIN usuario_roles ur ON r.id = ur.rol_id
         WHERE ur.usuario_id = ?`,
        [usuarioId]
    );

    if (rolesActuales.some((r) => r.nombre === "administrador")) {
        return { ok: false, status: 403, mensaje: "El rol administrador no puede autodegradarse" };
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        if (rol === "comprador") {
            const [[compromisos]] = await connection.query(
                `SELECT
                   (SELECT COUNT(*) FROM productos
                     WHERE vendedor_id = ? AND eliminado_por_admin = 0) AS productos_activos,
                   (SELECT COUNT(*) FROM detalle_pedidos
                     WHERE vendedor_id = ? AND estado_envio IN ('Pendiente', 'En camino')) AS pedidos_abiertos`,
                [usuarioId, usuarioId]
            );
            if (Number(compromisos.productos_activos) > 0 || Number(compromisos.pedidos_abiertos) > 0) {
                await connection.rollback();
                return {
                    ok: false,
                    status: 409,
                    mensaje: "No puedes cambiar a comprador con productos activos o pedidos abiertos",
                };
            }
        }

        await connection.query(
            "DELETE FROM usuario_roles WHERE usuario_id = ?",
            [usuarioId]
        );
        await connection.query(
            "INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?, ?)",
            [usuarioId, rolRow[0].id]
        );

        // M-11/B2: auditoria del cambio de rol (sin datos sensibles).
        await registrarAuditoria({
            actorId: usuarioId,
            accion: ACCIONES.USUARIO_ROL_CAMBIADO,
            objetivoTipo: "usuario",
            objetivoId: usuarioId,
            detalle: {
                roles_anteriores: rolesActuales.map((r) => r.nombre),
                rol_nuevo: rol,
            },
            ip,
            conn: connection,
        });

        await connection.commit();
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }

    return { ok: true, roles: [rol] };
}

/**
 * Emite un token de recuperacion (solo se persiste el SHA-256) y envia el
 * correo. Anti-enumeracion: no revela si el correo existe.
 */
export async function solicitarRecuperacion(email) {
    const [usuarios] = await pool.query(
        "SELECT id, email, activo FROM usuarios WHERE email = ?",
        [email]
    );

    // Anti-enumeracion: respuesta uniforme para email existente/inexistente
    if (usuarios.length === 0 || !usuarios[0].activo) {
        return;
    }

    const usuario = usuarios[0];

    // Token seguro (32 bytes hex = 64 caracteres). H3 (P2): solo se
    // persiste el SHA-256 (nunca en claro); el valor real viaja por email.
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // RF4: expira a los 5 minutos.
    // M-9: cooldown por usuario: el UPDATE solo aplica si no hay un token
    // emitido en el ultimo minuto (expiracion a 5 min -> umbral 4 min). Con
    // affectedRows 0 no se reenvia correo; la respuesta sigue siendo
    // uniforme para no filtrar la existencia de la cuenta.
    const [resultado] = await pool.query(
        "UPDATE usuarios SET token_recuperacion = ?, token_recuperacion_expiracion = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = ? AND (token_recuperacion_expiracion IS NULL OR token_recuperacion_expiracion < DATE_ADD(NOW(), INTERVAL 4 MINUTE))",
        [tokenHash, usuario.id]
    );
    if (Number(resultado?.affectedRows) === 0) {
        return;
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/restore?token=${token}`;

    await enviarCorreoRecuperacion(usuario.email, resetUrl);
}

/**
 * Restablece la contrasena con un token de un solo uso.
 * B-* (TASK-4.9) + M-8: reset ATOMICO: la guarda del token vigente viaja en
 * el WHERE, de modo que dos peticiones simultaneas no pueden reutilizarlo.
 * @returns {Promise<{ ok: true } | { ok: false, mensaje: string }>}
 */
export async function restablecerPassword({ token, password }) {
    // H3: se compara el hash (el token en claro jamas se guardo).
    const tokenHash = typeof token === "string"
        ? crypto.createHash("sha256").update(token).digest("hex")
        : "";

    const passwordHash = await bcrypt.hash(password, 10);

    const [resultado] = await pool.query(
        "UPDATE usuarios SET password = ?, token_version = token_version + 1, password_changed_at = NOW(), token_recuperacion = NULL, token_recuperacion_expiracion = NULL WHERE token_recuperacion = ? AND token_recuperacion_expiracion > NOW()",
        [passwordHash, tokenHash]
    );
    if (Number(resultado?.affectedRows) === 0) {
        return { ok: false, mensaje: "El enlace es inválido o ya fue utilizado" };
    }

    return { ok: true };
}

/**
 * Perfil publico por ID (sin datos sensibles).
 * @returns {Promise<object|null>} perfil o null si no existe / esta inactivo.
 */
export async function obtenerPerfilPublico(id) {
    const [rows] = await pool.query(
        'SELECT id, nombre_completo, foto_perfil, descripcion_personal, activo FROM usuarios WHERE id = ?',
        [id]
    );

    if (rows.length === 0) return null;

    const usuarioBD = rows[0];
    if (!usuarioBD.activo) return null;

    return {
        id: usuarioBD.id,
        nombre: usuarioBD.nombre_completo,
        biografia: usuarioBD.descripcion_personal,
        avatar: usuarioBD.foto_perfil || "https://via.placeholder.com/150",
    };
}

/**
 * RF40 / B-R6 / M-7: baja logica del comprador en una sola transaccion.
 * @returns {Promise<
 *   { ok: true, pedidos: object } |
 *   { ok: false, status: number, code: string, mensaje: string }
 * >}
 */
export async function eliminarCuentaComprador({ usuarioId, password, ip }) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Verificar que la cuenta exista y este activa (FOR UPDATE: nadie mas
        // la desactiva en paralelo mientras se resuelven sus pedidos).
        const [usuarios] = await conn.query(
            "SELECT id, password, activo FROM usuarios WHERE id = ? FOR UPDATE",
            [usuarioId]
        );
        if (usuarios.length === 0) {
            await conn.rollback();
            return { ok: false, status: 404, code: "NOT_FOUND", mensaje: "Usuario no encontrado" };
        }

        // M-7: la baja exige la contrasena actual (step-up antes de una accion
        // irreversible sobre la cuenta).
        const passwordValida =
            typeof password === "string" &&
            password.length > 0 &&
            (await bcrypt.compare(password, usuarios[0].password));
        if (!passwordValida) {
            await conn.rollback();
            return { ok: false, status: 403, code: "FORBIDDEN", mensaje: "Contraseña incorrecta" };
        }

        // B3 (auditoria 2026-11-04): un administrador puede darse de baja, pero
        // la operacion no puede dejar la plataforma sin ningun admin activo.
        const [rolAdmin] = await conn.query(
            `SELECT MAX(CASE WHEN r.nombre = 'administrador' THEN 1 ELSE 0 END) AS es_admin
               FROM usuario_roles ur
               JOIN roles r ON r.id = ur.rol_id
              WHERE ur.usuario_id = ?`,
            [usuarioId]
        );
        if (Number(rolAdmin[0]?.es_admin) === 1) {
            const [adminsActivos] = await conn.query(
                `SELECT COUNT(DISTINCT u.id) AS total
                   FROM usuarios u
                   JOIN usuario_roles ur ON ur.usuario_id = u.id
                   JOIN roles r ON r.id = ur.rol_id
                  WHERE r.nombre = 'administrador' AND u.activo = 1`
            );
            if (Number(adminsActivos[0]?.total || 0) <= 1) {
                await conn.rollback();
                return {
                    ok: false,
                    status: 409,
                    code: "CONFLICT",
                    mensaje: "No se puede eliminar la cuenta del último administrador activo",
                };
            }
        }

        // Desactivacion logica de la cuenta. M-8: incrementa token_version
        // (todas las sesiones del usuario quedan invalidas al instante).
        await conn.query(
            "UPDATE usuarios SET activo = 0, token_version = token_version + 1 WHERE id = ?",
            [usuarioId]
        );
        // Suspender sus productos publicados si es vendedor (RF54/RF74)
        await conn.query(
            "UPDATE productos SET eliminado_por_admin = 1 WHERE vendedor_id = ? AND eliminado_por_admin = 0",
            [usuarioId]
        );
        // M-7: resolver las lineas abiertas del usuario como VENDEDOR reutilizando
        // la ruta del baneo (cancela Pendiente + reembolsa + notifica al comprador).
        const pedidos = await destinoPedidosVendedor(conn, usuarioId);
        // Vaciar el carrito (dato transitorio, se puede borrar)
        await conn.query(
            "DELETE FROM carrito_items WHERE comprador_id = ?",
            [usuarioId]
        );

        // B3: dejar constancia de la baja en la auditoria, dentro de la misma
        // transaccion. Fail-soft: un fallo de auditoria no revierte la baja.
        await registrarAuditoria({
            actorId: usuarioId,
            accion: ACCIONES.USUARIO_BAJA_CUENTA,
            objetivoTipo: "usuario",
            objetivoId: usuarioId,
            detalle: { pedidos },
            ip,
            conn,
        });

        await conn.commit();
        return { ok: true, pedidos };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

/** Directorio de usuarios activos para iniciar un chat (excluye al propio). */
export async function listarDirectorio({ usuarioId, q }) {
    const busqueda = typeof q === "string" ? q.trim() : "";

    let sql = `SELECT id, nombre_completo, foto_perfil
               FROM usuarios
               WHERE activo = 1 AND id <> ?`;
    const params = [usuarioId];

    if (busqueda) {
        // M-15: el directorio no filtra por email (no confirma correos);
        // B-8: los comodines LIKE del usuario se escapan.
        sql += " AND nombre_completo LIKE ?";
        params.push(escapeLike(String(busqueda)));
    }

    sql += " ORDER BY nombre_completo ASC LIMIT 50";

    const [rows] = await pool.query(sql, params);
    return rows;
}

/** Actualiza el nombre/descripcion/direccion/avatar del usuario autenticado. */
export async function actualizarPerfil({ usuarioId, cambios, archivo }) {
    const { nombre_completo, descripcion_personal, direccion_envio } = cambios;

    const [actual] = await pool.query(
        "SELECT foto_perfil FROM usuarios WHERE id = ?",
        [usuarioId]
    );

    const campos = [];
    const valores = [];

    if (nombre_completo !== undefined) {
        campos.push("nombre_completo = ?");
        valores.push(nombre_completo);
    }
    if (descripcion_personal !== undefined) {
        campos.push("descripcion_personal = ?");
        valores.push(descripcion_personal);
    }
    if (direccion_envio !== undefined) {
        campos.push("direccion_envio = ?");
        valores.push(direccion_envio);
    }
    if (archivo) {
        campos.push("foto_perfil = ?");
        valores.push(`/uploads/${archivo.filename}`);
    }

    await pool.query(
        `UPDATE usuarios SET ${campos.join(", ")} WHERE id = ?`,
        [...valores, usuarioId]
    );

    // Si se reemplazo el avatar, el archivo anterior deja de estar referenciado.
    const fotoAnterior = actual[0]?.foto_perfil;
    if (archivo && fotoAnterior) borrarUploadPorUrl(fotoAnterior);

    const [rows] = await pool.query(
        `SELECT id, email, nombre_completo, foto_perfil, descripcion_personal, direccion_envio
           FROM usuarios WHERE id = ?`,
        [usuarioId]
    );

    return rows[0];
}
