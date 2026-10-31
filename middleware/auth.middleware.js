const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const { JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE } = require("../utils/config");
const { errorResponse } = require("../utils/response");

// Verifica el token y el estado del usuario en una sola consulta.
async function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return errorResponse(res, "Token no autorizado", 401);
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    const [filas] = await pool.query(
      "SELECT activo, token_version FROM usuarios WHERE id = ? LIMIT 1",
      [decoded.id],
    );

    if (filas.length === 0 || Number(filas[0].activo) === 0) {
      return errorResponse(res, "Cuenta desactivada", 401);
    }
    if (Number(decoded.token_version) !== Number(filas[0].token_version)) {
      return errorResponse(res, "Sesion expirada", 401);
    }

    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  } catch {
    return errorResponse(res, "Token invalido o expirado", 401);
  }
}

module.exports = { authRequired };
