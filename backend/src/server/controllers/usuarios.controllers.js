import pkg from "../../../package.json" with { type: "json" };
import { expiracionEnMs } from "../utils/config.js";
import { esPoolSaturado } from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";
import {
    firmarToken,
    registrarUsuario,
    autenticarUsuario,
    revocarToken,
    cerrarTodasLasSesiones as cerrarSesionesDelUsuario,
    obtenerPerfil,
    cambiarRolUsuario,
    solicitarRecuperacion as emitirRecuperacion,
    restablecerPassword as aplicarNuevaPassword,
    obtenerPerfilPublico,
    eliminarCuentaComprador as darDeBajaCuenta,
    listarDirectorio,
    actualizarPerfil as guardarPerfil,
} from "../services/usuarios.service.js";

// ============================================================================
// MODULO DE AUTENTICACION (integrado desde AVANCES/SPRING 1/DIEGO SERNA/2)
// Fixes aplicados en la integracion (informe v3.0):
//   3.1 CRITICO: JWT_SECRET sin fallback hardcodeado (se usa utils/config.js).
//   3.2 ALTA:    register con transaccion (usuario + rol nunca quedan a medias).
//   3.3 MEDIO:   logout invalida el token en tokens_invalidados (RF2).
//   3.4 MEDIO:   el correo dice "expira en 5 minutos" (RF4) en utils/mailer.js.
// Desde 1.5.3 el SQL y las reglas viven en services/usuarios.service.js; aqui
// solo se valida (middleware), se llama al servicio y se responde.
// ============================================================================

/**
 * Endpoint de verificación: responde que el servidor esta activo.
 * Usado por GET /api/usuarios/ (routes/usuarios.routes.js).
 *
 * Fix DEF-02 / DEF-03 (P1 contrato API uniforme): anteriormente devolvia
 * texto plano, lo cual rompia el contrato { success, data } que usan los
 * otros 67 endpoints. Ahora responde JSON conforme al contrato.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const getUsuarios = (req, res) => {
    // Banner dinamico: major de backend/package.json (hoy "Commercity API v1").
    const apiMajor = String(pkg.version).split(".")[0];
    return res.json({
        success: true,
        data: {
            message: "servidor creado",
            status: "ok",
            timestamp: new Date().toISOString(),
            version: `Commercity API v${apiMajor}`
        }
    });
};

// F4 (P1): cookie httpOnly + SameSite para el JWT (mitiga robo via XSS).
// El token viaja en el body SOLO para las apps nativas (ver tokenParaBody);
// la web usa exclusivamente la cookie httpOnly.
function emitirCookieSesion(res, token) {
    res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: expiracionEnMs(),
        path: "/",
    });
}

/**
 * Decide si el JWT se devuelve en el body.
 * La web recibe solo la cookie httpOnly; movil y escritorio, que no comparten
 * dominio con la API, lo piden explicitamente con `X-Client-Type`.
 * @param {import("express").Request} req
 * @param {string} token JWT recien emitido.
 * @returns {string|null} Token para el body o null.
 */
function tokenParaBody(req, token) {
    const cliente = String(req.get("X-Client-Type") || "").trim().toLowerCase();
    return cliente === "movil" || cliente === "escritorio" ? token : null;
}

// ============================ REGISTRO ============================
export const register = async (req, res, next) => {
    // TASK-4.9: body puede faltar; el contrato Zod ya lo rechaza aguas arriba,
    // pero la desestructuracion no debe romper con 500.
    const { email, password, nombre_completo } = req.body ?? {};

    try {
        const resultado = await registrarUsuario({ email, password, nombre_completo });

        // M-3: la respuesta es IDENTICA exista o no el email: ni cookie, ni
        // token, ni id, ni el rol asignado. Si se diferenciara, un atacante
        // podria enumerar cuentas por el cuerpo de la respuesta. El cliente
        // inicia sesion con POST /login despues del alta.
        return successResponse(res, "Usuario registrado correctamente", {
            user: {
                email: resultado.email,
                nombre_completo: resultado.nombre_completo,
                roles: [],
            },
        }, 201);
    } catch (error) {
        if (esPoolSaturado(error)) return next(error);
        console.error("Error en register:", error?.message);
        return errorResponse(res, "Error interno del servidor", 500);
    }
};

// ============================= LOGIN =============================
export const login = async (req, res, next) => {
    const { email, password } = req.body ?? {};

    try {
        const usuario = await autenticarUsuario({ email, password });
        if (!usuario) {
            return errorResponse(res, "Credenciales inválidas", 401);
        }

        const token = firmarToken(usuario);
        emitirCookieSesion(res, token);
        return successResponse(res, "Inicio de sesión exitoso", {
            token: tokenParaBody(req, token),
            user: {
                id: usuario.id,
                email: usuario.email,
                nombre_completo: usuario.nombre_completo,
                foto_perfil: usuario.foto_perfil,
                roles: usuario.roles
            }
        });
    } catch (error) {
        if (esPoolSaturado(error)) return next(error);
        console.error("Error en login:", error?.message);
        return errorResponse(res, "Error interno del servidor", 500);
    }
};

// ========================= LOGOUT (RF2) =========================
/** Extrae el JWT de la peticion: header Bearer o cookie httpOnly. */
function tokenDeLaPeticion(req) {
    let token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token && req.headers.cookie) {
        const m = String(req.headers.cookie).match(/(?:^|;\s*)token=([^;]+)/);
        if (m) {
            try { token = decodeURIComponent(m[1]); } catch { token = m[1]; }
        }
    }
    return token;
}

// Fix 3.3: revoca el JWT en la lista negra tokens_invalidados (la ruta exige
// token via authRequired). INSERT IGNORE hace idempotente un doble logout.
export const logout = async (req, res) => {
    await revocarToken(tokenDeLaPeticion(req));
    // F4: limpia la cookie httpOnly en el logout.
    res.clearCookie("token", { httpOnly: true, sameSite: "lax", path: "/" });
    return successResponse(res, "Sesión cerrada correctamente");
};

// ============ CERRAR TODAS LAS SESIONES (M-8/TASK-4.3) ==========
// Incrementa token_version: TODOS los JWT emitidos antes (Bearer o cookie)
// quedan invalidos. Ademas revoca el token actual en la lista negra y limpia
// la cookie del navegador.
export const cerrarTodasLasSesiones = async (req, res, next) => {
    try {
        await cerrarSesionesDelUsuario(req.userId, tokenDeLaPeticion(req));
        res.clearCookie("token", { httpOnly: true, sameSite: "lax", path: "/" });
        return successResponse(res, "Todas las sesiones fueron cerradas");
    } catch (error) {
        if (esPoolSaturado(error)) return next(error);
        console.error("Error en cerrarTodasLasSesiones:", error?.message);
        return errorResponse(res, "Error interno del servidor", 500);
    }
};

// ===================== PERFIL (autenticado) =====================
export const getPerfil = async (req, res, next) => {
    try {
        const perfil = await obtenerPerfil(req.userId);
        if (!perfil) {
            return errorResponse(res, "Usuario no encontrado", 404);
        }
        return successResponse(res, "Perfil obtenido", perfil);
    } catch (error) {
        if (esPoolSaturado(error)) return next(error);
        console.error("Error en getPerfil:", error?.message);
        return errorResponse(res, "Error interno del servidor", 500);
    }
};

// ============ CAMBIAR ROL (comprador <-> vendedor) =============
export const cambiarRol = async (req, res, next) => {
    const { rol } = req.body;

    try {
        const resultado = await cambiarRolUsuario({
            usuarioId: req.userId,
            rol,
            ip: req.ip,
        });
        if (!resultado.ok) {
            return errorResponse(res, resultado.mensaje, resultado.status);
        }
        return successResponse(res, "Rol actualizado correctamente", {
            roles: resultado.roles
        });
    } catch (error) {
        return next(error);
    }
};

// ================ SOLICITAR RECUPERACION (RF4) =================
export const solicitarRecuperacion = async (req, res, next) => {
    const { email } = req.body ?? {};

    try {
        await emitirRecuperacion(email);
        return successResponse(
            res,
            "Si el correo existe, recibirás un enlace para restablecer tu contraseña."
        );
    } catch (error) {
        if (esPoolSaturado(error)) return next(error);
        console.error("Error en solicitarRecuperacion:", error?.message);
        return errorResponse(res, "Error interno del servidor", 500);
    }
};

// ================ RESTABLECER CONTRASEÑA (RF4) =================
export const restablecerPassword = async (req, res, next) => {
    const { token, password } = req.body ?? {};

    try {
        const resultado = await aplicarNuevaPassword({ token, password });
        if (!resultado.ok) {
            return errorResponse(res, resultado.mensaje, 400);
        }
        return successResponse(res, "Contraseña restablecida correctamente. Ya puedes iniciar sesión.");
    } catch (error) {
        if (esPoolSaturado(error)) return next(error);
        console.error("Error en restablecerPassword:", error?.message);
        return errorResponse(res, "Error interno del servidor", 500);
    }
};

// ========================== ADMIN ==============================
export const adminGetDatos = async (req, res, next) => {
    try {
        // Devuelve el rol detectado por requireRoles (inyectado en req.userRoles)
        return successResponse(res, "Acceso de administrador autorizado", {
            email: req.userEmail,
            roles: req.userRoles,
        });
    } catch (error) {
        if (esPoolSaturado(error)) return next(error);
        console.error("Error en adminGetDatos:", error?.message);
        return errorResponse(res, "Error interno del servidor", 500);
    }
};

/**
 * Endpoint publico para ver el perfil de otro usuario por su ID.
 * Excluye datos sensibles (password, token, direccion de envio).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const getPerfilPublico = async (req, res, next) => {
    try {
        // Params ya validados por perfilPublicoParamsSchema (validate()).
        const idNumerico = Number(req.params.id);
        const perfilPublico = await obtenerPerfilPublico(idNumerico);

        if (!perfilPublico) {
            return res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Usuario no encontrado" }
            });
        }

        return res.status(200).json({ success: true, data: perfilPublico });

    } catch (error) {
        if (esPoolSaturado(error)) return next(error);
        // Log interno para depuracion; no se expone al cliente
        console.error("Error al obtener perfil publico:", error.message);
        return res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Error al obtener el perfil" }
        });
    }
};

/**
 * RF40 / B-R6 / M-7: el comprador elimina su cuenta desde ajustes (desactivacion logica).
 * - Exige la contrasena actual (step-up: la baja es irreversible).
 * - usuarios.activo = 0 (nunca DELETE fisico)
 * - Resuelve sus lineas abiertas como vendedor con la MISMA ruta del baneo.
 * - Se vacia su carrito (dato transitorio)
 * - Si ademas es vendedor, sus productos se suspenden (RF54/RF74)
 * - Se conservan pedidos, calificaciones y reportes (historial intacto)
 * - Todo en UNA sola transaccion.
 */
export const eliminarCuentaComprador = async (req, res, next) => {
    const compradorId = req.userId;
    const { password } = req.body ?? {};

    try {
        const resultado = await darDeBajaCuenta({
            usuarioId: compradorId,
            password,
            ip: req.ip,
        });
        if (!resultado.ok) {
            return res.status(resultado.status).json({
                success: false,
                error: { code: resultado.code, message: resultado.mensaje }
            });
        }

        return res.status(200).json({
            success: true,
            data: { id: compradorId, estado: "desactivado", pedidos: resultado.pedidos }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/usuarios/directorio?q=
 * Lista usuarios activos para poder iniciar un chat con cualquier persona.
 * Excluye al usuario autenticado y no expone datos sensibles.
 */
export const listarUsuarios = async (req, res, next) => {
    try {
        const rows = await listarDirectorio({ usuarioId: req.userId, q: req.query.q });
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
        // Body validado por actualizarPerfilSchema (validate()).
        const actualizado = await guardarPerfil({
            usuarioId: req.userId,
            cambios: req.body,
            archivo: req.file,
        });
        return successResponse(res, "Perfil actualizado correctamente", actualizado);
    } catch (err) {
        next(err);
    }
};
