import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../config/db.js";
import { JWT_SECRET } from "../utils/config.js";

/**
 * Middleware que valida el JWT del header Authorization.
 * Si es valido, inyecta req.userId y req.userEmail para usarlo en controllers.
 *
 * Fix 3.1: usa el secreto validado de utils/config.js (el servidor no arranca
 *          sin JWT_SECRET; nunca hay un valor hardcodeado de respaldo).
 * Fix 3.3: consulta tokens_invalidados (lista negra) para rechazar los tokens
 *          que ya fueron revocados en logout (RF2).
 */
export const authRequired = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Token no autorizado" }
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        // Primero verifica firma/expiracion (no toca BD con tokens invalidos).
        const decoded = jwt.verify(token, JWT_SECRET);

        // Fix 3.3: lista negra de tokens revocados en logout.
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const [bloqueados] = await pool.query(
            "SELECT 1 FROM tokens_invalidados WHERE token_hash = ? AND expira_en > NOW()",
            [tokenHash]
        );

        if (bloqueados.length > 0) {
            return res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: "Token revocado. Inicia sesión de nuevo" }
            });
        }

        // Fix DEF-01 (P1 seguridad): rechazar usuarios con activo = 0 (baneados /
        // borrado lógico). Sin este check, un usuario desactivado conserva el
        // acceso hasta que su JWT expira o es revocado explícitamente en logout.
        const [usuarioFila] = await pool.query(
            "SELECT activo FROM usuarios WHERE id = ? LIMIT 1",
            [decoded.id]
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

        req.userId = decoded.id;
        req.userEmail = decoded.email;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: "Token expirado. Inicia sesión de nuevo" }
            });
        }
        if (error.name === "JsonWebTokenError") {
            return res.status(403).json({
                success: false,
                error: { code: "FORBIDDEN", message: "Token inválido" }
            });
        }
        // Error de BD en la consulta de la lista negra: fail-closed.
        return res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" }
        });
    }
};
