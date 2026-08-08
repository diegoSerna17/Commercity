import jwt from "jsonwebtoken";

/**
 * Middleware que valida el JWT del header Authorization.
 * Si es valido, inyecta req.userId y req.userEmail para usarlo en controllers.
 * El JWT_SECRET siempre viene de .env; el servidor no arranca sin el.
 */
export const authRequired = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Token no autorizado" }
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userEmail = decoded.email;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: "Token expirado. Inicia sesion de nuevo" }
            });
        }
        return res.status(403).json({
            success: false,
            error: { code: "FORBIDDEN", message: "Token invalido" }
        });
    }
};
