const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../../config/database");
const { JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE } = require("../../config/jwt");
const { successResponse, errorResponse } = require("../../shared/response");

function firmarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      token_version: Number(usuario.token_version || 0),
    },
    JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "7d",
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      jwtid: crypto.randomUUID(),
    },
  );
}

async function register(req, res, next) {
  const { email, password, nombre_completo } = req.body;

  try {
    const [existe] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (existe.length > 0) {
      return errorResponse(res, "El correo ya esta registrado", 409);
    }

    const hash = await bcrypt.hash(password, 10);
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();
      const [insertado] = await conn.query(
        "INSERT INTO usuarios (email, password, nombre_completo) VALUES (?, ?, ?)",
        [email, hash, nombre_completo || null],
      );
      const [rol] = await conn.query("SELECT id FROM roles WHERE nombre = 'comprador'");
      if (rol.length === 0) {
        await conn.rollback();
        return errorResponse(res, "Error interno del servidor", 500);
      }
      await conn.query("INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?, ?)", [
        insertado.insertId,
        rol[0].id,
      ]);
      await conn.commit();

      const token = firmarToken({ id: insertado.insertId, email, token_version: 0 });
      return successResponse(
        res,
        "Usuario registrado correctamente",
        {
          token,
          user: {
            id: insertado.insertId,
            email,
            nombre_completo: nombre_completo || null,
            roles: ["comprador"],
          },
        },
        201,
      );
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  const { email, password } = req.body;

  try {
    const [filas] = await pool.query(
      `SELECT id, email, password, nombre_completo, activo, token_version
         FROM usuarios WHERE email = ?`,
      [email],
    );

    if (filas.length === 0) {
      return errorResponse(res, "Credenciales invalidas", 401);
    }

    const usuario = filas[0];
    const valida = await bcrypt.compare(password, usuario.password);
    if (!usuario.activo || !valida) {
      return errorResponse(res, "Credenciales invalidas", 401);
    }

    const [roles] = await pool.query(
      `SELECT r.nombre FROM roles r
         JOIN usuario_roles ur ON ur.rol_id = r.id
        WHERE ur.usuario_id = ?`,
      [usuario.id],
    );

    const token = firmarToken(usuario);
    return successResponse(res, "Inicio de sesion exitoso", {
      token,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre_completo: usuario.nombre_completo,
        roles: roles.map((r) => r.nombre),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const [filas] = await pool.query(
      "SELECT id, email, nombre_completo, foto_perfil FROM usuarios WHERE id = ?",
      [req.userId],
    );
    if (filas.length === 0) {
      return errorResponse(res, "Usuario no encontrado", 404);
    }
    return successResponse(res, "Perfil del usuario", filas[0]);
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, me };
