import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../config/db.js";
import { JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE } from "../utils/config.js";

/**
 * Middleware que valida el JWT del header Authorization.
 * Si es valido, inyecta req.userId y req.userEmail para usarlo en controllers.
 *
 * Fix 3.1: usa el secreto validado de utils/config.js (el servidor no arranca
 *          sin JWT_SECRET; nunca hay un valor hardcodeado de respaldo).
 * Fix 3.3: consulta tokens_invalidados (lista negra) para rechazar los tokens
 *          que ya fueron revocados en logout (RF2).
 * M-8 (TASK-4.3): compara `token_version` del JWT contra usuarios.token_version
 *          (revocacion masiva por reset/baneo/cierre de sesiones) y fija
 *          `algorithms: ["HS256"]` + `iss`/`aud` (B-4). Todo fallo de token
 *          responde 401 uniforme (nunca 403 para credenciales).
 */
export const authRequired = async (req, res, next) => {
    // F4: acepta Bearer header (clientes actuales) o cookie httpOnly `token`
    // (nuevo flujo web seguro). El header tiene prioridad.
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    } else if (req.headers.cookie) {
        const m = String(req.headers.cookie).match(/(?:^|;\s*)token=([^;]+)/);
        if (m) {
            try { token = decodeURIComponent(m[1]); } catch { token = m[1]; }
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Token no autorizado" }
        });
    }

    try {
        // Primero verifica firma/algoritmo/emisor/audiencia y expiracion
        // (no toca BD con tokens invalidos). algorithms fijo evita el ataque
        // de confusion de algoritmos (p. ej. alg: none).
        const decoded = jwt.verify(token, JWT_SECRET, {
            algorithms: ["HS256"],
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        });

        // Fix 3.3: lista negra de tokens revocados en logout.
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        // TASK-4.11 (rendimiento): UNA sola consulta responde las tres preguntas
        // por peticion autenticada: revocacion (lista negra), estado (activo) y
        // version del token (M-8). Antes eran dos round-trips por request.
        // Fix DEF-01: rechazar usuarios con activo = 0 (baneados / borrado logico).
        // B-10: la misma consulta trae ademas los roles (GROUP_CONCAT) para que
        // requireRoles no haga una segunda consulta por peticion.
        const [usuarioFila] = await pool.query(
            `SELECT u.activo, u.token_version,
                    EXISTS(
                      SELECT 1 FROM tokens_invalidados t
                       WHERE t.token_hash = ? AND t.expira_en > NOW()
                    ) AS revocado,
                    (SELECT GROUP_CONCAT(r.nombre ORDER BY r.nombre SEPARATOR ',')
                       FROM usuario_roles ur
                       JOIN roles r ON r.id = ur.rol_id
                      WHERE ur.usuario_id = u.id) AS roles_csv
               FROM usuarios u
              WHERE u.id = ?
              LIMIT 1`,
            [tokenHash, decoded.id]
        );
        if (usuarioFila.length === 0 || Number(usuarioFila[0].activo) === 0) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "USER_DISABLED",
                    message: "Cuenta desactivada o baneada. Contacta al administrador."
                }
            });
        }

        // Fix 3.3: el token pudo revocarse en logout (lista negra).
        if (Number(usuarioFila[0].revocado) === 1) {
            return res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: "Token revocado. Inicia sesión de nuevo" }
            });
        }

        // M-8: revocacion por version. Un reset de contrasena, un baneo o el
        // cierre de todas las sesiones incrementan token_version y dejan
        // invalidos los tokens ya emitidos.
        if (Number(decoded.token_version) !== Number(usuarioFila[0].token_version)) {
            return res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: "Sesión expirada. Inicia sesión de nuevo" }
            });
        }

        req.userId = decoded.id;
        req.userEmail = decoded.email;
        // B-10: roles ya resueltos en la consulta unica; requireRoles los
        // reutiliza sin otra consulta. Si la columna no viene (mocks viejos),
        // se deja undefined y requireRoles consulta como antes.
        if (usuarioFila[0].roles_csv !== undefined) {
            req.userRoles = usuarioFila[0].roles_csv
                ? String(usuarioFila[0].roles_csv).split(",")
                : [];
        }
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: "Token expirado. Inicia sesión de nuevo" }
            });
        }
        if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
            // M-8: token invalido unificado en 401 (antes 403 FORBIDDEN).
            return res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: "Token inválido" }
            });
        }
        // Error de BD en la consulta de la lista negra: fail-closed.
        return res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" }
        });
    }
};
