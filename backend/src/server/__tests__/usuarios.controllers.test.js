import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { enviarCorreoRecuperacion } from "../utils/mailer.js";

// Mock de mysql2/promise: createPool devuelve un pool simulado (sin BD real).
vi.mock("mysql2/promise", () => {
  const pool = { query: vi.fn(), getConnection: vi.fn() };
  return {
    __esModule: true,
    default: { createPool: vi.fn(() => pool) },
    __pool: pool,
  };
});

// Mock de bcrypt: hashes/compares deterministicos y rapidos (bcrypt es CJS,
// por eso el import espera el export "default").
vi.mock("bcrypt", () => ({
  __esModule: true,
  default: {
    hash: vi.fn().mockResolvedValue("$2b$10$mock_hash"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// Mock del mailer: no envia correos reales en tests.
vi.mock("../utils/mailer.js", () => ({
  enviarCorreoRecuperacion: vi.fn().mockResolvedValue({ id: "mock-mail" }),
}));

// El secreto debe existir antes de importar app.js (utils/config.js lo exige).
process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto_test";

const { __pool: pool } = await import("mysql2/promise");
const { default: app } = await import("../app.js");

// Token compartido para las rutas protegidas del modulo de autenticacion.
const token = jwt.sign(
  { id: 7, email: "test@test.com" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/usuarios/perfil-publico/:id", () => {
  it("devuelve 400 si el id no es un entero positivo", async () => {
    const res = await request(app).get("/api/usuarios/perfil-publico/abc");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "El id debe ser un entero positivo" },
    });
  });

  it("devuelve 404 si el usuario no existe", async () => {
    pool.query.mockResolvedValue([[], undefined]);

    const res = await request(app).get("/api/usuarios/perfil-publico/999");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "Usuario no encontrado" },
    });
  });

  it("devuelve 404 si el usuario esta baneado (activo = 0)", async () => {
    pool.query.mockResolvedValue([[{ id: 3, activo: 0 }], undefined]);

    const res = await request(app).get("/api/usuarios/perfil-publico/3");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("devuelve el perfil publico sin datos sensibles", async () => {
    const usuario = {
      id: 7,
      nombre_completo: "Maria Lopez",
      foto_perfil: "https://img.com/maria.png",
      descripcion_personal: "Vendedora de accesorios",
      activo: 1,
    };
    pool.query.mockResolvedValue([[usuario], undefined]);

    const res = await request(app).get("/api/usuarios/perfil-publico/7");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      id: 7,
      nombre: "Maria Lopez",
      biografia: "Vendedora de accesorios",
      avatar: "https://img.com/maria.png",
    });
    // No debe filtrar password ni email
    expect(res.body.data).not.toHaveProperty("password");
    expect(res.body.data).not.toHaveProperty("email");
  });

  it("usa avatar por defecto cuando foto_perfil es nulo", async () => {
    pool.query.mockResolvedValue([[{ id: 2, nombre_completo: "Juan", foto_perfil: null, descripcion_personal: null, activo: 1 }], undefined]);

    const res = await request(app).get("/api/usuarios/perfil-publico/2");

    expect(res.status).toBe(200);
    expect(res.body.data.avatar).toBe("https://via.placeholder.com/150");
  });

  it("devuelve 500 con respuesta generica si la BD falla", async () => {
    pool.query.mockRejectedValue(new Error("connection refused"));

    const res = await request(app).get("/api/usuarios/perfil-publico/1");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Error al obtener el perfil" },
    });
    // No expone el detalle interno del error
    expect(res.body.error).not.toHaveProperty("details");
  });

  it("la consulta usa parametros y no concatena el id", async () => {
    pool.query.mockResolvedValue([[], undefined]);

    await request(app).get("/api/usuarios/perfil-publico/42");

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE id = ?"),
      [42]
    );
  });
});

describe("POST /api/usuarios/register (RF1 - fix 3.2 transaccion)", () => {
  const conn = {
    query: vi.fn(),
    beginTransaction: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
    release: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    pool.getConnection.mockResolvedValue(conn);
    conn.beginTransaction.mockResolvedValue();
    conn.commit.mockResolvedValue();
    conn.rollback.mockResolvedValue();
    conn.release.mockResolvedValue();
    conn.query.mockImplementation((sql) => {
      if (sql.includes("INSERT INTO usuarios"))
        return [{ insertId: 99 }, undefined];
      if (sql.includes("SELECT id FROM roles"))
        return [[{ id: 1 }], undefined];
      return [[], undefined];
    });
  });

  it("registra usuario nuevo con rol comprador y devuelve token (201)", async () => {
    pool.query.mockResolvedValue([[], undefined]); // email no duplicado

    const res = await request(app)
      .post("/api/usuarios/register")
      .send({ email: "nuevo@test.com", password: "SuperPass123", nombre_completo: "Nuevo Usuario" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.email).toBe("nuevo@test.com");
    expect(res.body.data.user.roles).toContain("comprador");

    // Fix 3.2: usuario + rol en la misma transaccion
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO usuarios"),
      ["nuevo@test.com", "$2b$10$mock_hash", "Nuevo Usuario"]
    );
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO usuario_roles"),
      [99, 1]
    );
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.rollback).not.toHaveBeenCalled();
  });

  it("rechaza email duplicado (400)", async () => {
    pool.query.mockResolvedValue([[{ id: 5 }], undefined]);

    const res = await request(app)
      .post("/api/usuarios/register")
      .send({ email: "duplicado@test.com", password: "SuperPass123" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  it("rechaza body con campo extra 'rol' (.strict())", async () => {
    const res = await request(app)
      .post("/api/usuarios/register")
      .send({ email: "x@test.com", password: "SuperPass123", rol: "vendedor" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rechaza contraseña menor a 6 caracteres (400)", async () => {
    const res = await request(app)
      .post("/api/usuarios/register")
      .send({ email: "short@test.com", password: "12345" });

    expect(res.status).toBe(400);
  });

  it("hace rollback y responde 500 si falla la BD dentro de la transaccion", async () => {
    pool.query.mockResolvedValue([[], undefined]);
    conn.query.mockRejectedValue(new Error("DB boom"));

    const res = await request(app)
      .post("/api/usuarios/register")
      .send({ email: "falla@test.com", password: "SuperPass123" });

    expect(res.status).toBe(500);
    expect(conn.rollback).toHaveBeenCalled();
  });

  it("maneja la race condition de email duplicado (ER_DUP_ENTRY -> 400)", async () => {
    pool.query.mockResolvedValue([[], undefined]);
    conn.query.mockRejectedValue(Object.assign(new Error("dup"), { code: "ER_DUP_ENTRY" }));

    const res = await request(app)
      .post("/api/usuarios/register")
      .send({ email: "race@test.com", password: "SuperPass123" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("ya está registrado");
    expect(conn.rollback).toHaveBeenCalled();
  });

  it("hace rollback si el rol comprador no existe en la BD (500)", async () => {
    pool.query.mockResolvedValue([[], undefined]);
    conn.query.mockImplementation((sql) => {
      if (sql.includes("INSERT INTO usuarios")) return [{ insertId: 99 }, undefined];
      return [[], undefined]; // SELECT roles sin filas
    });

    const res = await request(app)
      .post("/api/usuarios/register")
      .send({ email: "norol@test.com", password: "SuperPass123" });

    expect(res.status).toBe(500);
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.commit).not.toHaveBeenCalled();
  });
});

describe("POST /api/usuarios/login (RF2 - fix 3.1)", () => {
  it("inicia sesion con credenciales validas y devuelve token + roles", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("FROM usuarios u WHERE u.email"))
        return [[{ id: 7, email: "compra@test.com", password: "$2b$10$x", nombre_completo: "Comprador", foto_perfil: null, activo: 1 }], undefined];
      if (sql.includes("FROM roles r"))
        return [[{ nombre: "comprador" }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .post("/api/usuarios/login")
      .send({ email: "compra@test.com", password: "SuperPass123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.roles).toEqual(["comprador"]);
  });

  it("rechaza email inexistente (401)", async () => {
    pool.query.mockResolvedValue([[], undefined]);

    const res = await request(app)
      .post("/api/usuarios/login")
      .send({ email: "nadie@test.com", password: "SuperPass123" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rechaza usuario inactivo (401)", async () => {
    pool.query.mockResolvedValue([[{ id: 7, email: "x@test.com", password: "hash", activo: 0 }], undefined]);

    const res = await request(app)
      .post("/api/usuarios/login")
      .send({ email: "x@test.com", password: "SuperPass123" });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain("inactivo");
  });

  it("rechaza contraseña incorrecta (401)", async () => {
    bcrypt.compare.mockResolvedValueOnce(false);
    pool.query.mockResolvedValue([[{ id: 7, email: "x@test.com", password: "hash", activo: 1 }], undefined]);

    const res = await request(app)
      .post("/api/usuarios/login")
      .send({ email: "x@test.com", password: "PassMala_999" });

    expect(res.status).toBe(401);
  });

  it("rechaza campos vacios (400 - zod)", async () => {
    const res = await request(app)
      .post("/api/usuarios/login")
      .send({ email: "", password: "" });

    expect(res.status).toBe(400);
  });

  it("devuelve 500 con error estandar si la BD falla", async () => {
    pool.query.mockRejectedValue(new Error("BD caida"));

    const res = await request(app)
      .post("/api/usuarios/login")
      .send({ email: "x@test.com", password: "SuperPass123" });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("GET /api/usuarios/me (protegido)", () => {
  it("rechaza la peticion sin token (401)", async () => {
    const res = await request(app).get("/api/usuarios/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rechaza token invalido (403)", async () => {
    const res = await request(app)
      .get("/api/usuarios/me")
      .set("Authorization", "Bearer token_falso_123456");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("devuelve el perfil del usuario autenticado con roles", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuarios u WHERE u.id"))
        return [[{ id: 7, email: "test@test.com", nombre_completo: "Yo", foto_perfil: null }], undefined];
      if (sql.includes("FROM roles r"))
        return [[{ nombre: "comprador" }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/usuarios/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("test@test.com");
    expect(res.body.data.roles).toEqual(["comprador"]);
  });

  it("devuelve 404 si el usuario no existe", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/usuarios/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("devuelve 500 si la BD falla", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      throw new Error("BD caida");
    });

    const res = await request(app)
      .get("/api/usuarios/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("POST /api/usuarios/logout (RF2 - fix 3.3 revocacion de token)", () => {
  it("rechaza sin token (401) porque debe revocar el token", async () => {
    const res = await request(app).post("/api/usuarios/logout");
    expect(res.status).toBe(401);
  });

  it("revoca el token en tokens_invalidados y responde 200", async () => {
    pool.query.mockResolvedValue([[], undefined]); // lista negra vacia

    const res = await request(app)
      .post("/api/usuarios/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const insertCall = pool.query.mock.calls.find(([sql]) =>
      sql.includes("INSERT IGNORE INTO tokens_invalidados"));
    expect(insertCall).toBeTruthy();
  });

  it("rechaza un token ya revocado (401)", async () => {
    pool.query.mockResolvedValue([[{ token_hash: "x" }], undefined]);

    const res = await request(app)
      .post("/api/usuarios/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain("revocado");
  });
});

describe("PATCH /api/usuarios/me/rol (RF41 - comprador <-> vendedor)", () => {
  const conn = {
    query: vi.fn(),
    beginTransaction: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
    release: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    pool.getConnection.mockResolvedValue(conn);
    conn.beginTransaction.mockResolvedValue();
    conn.commit.mockResolvedValue();
    conn.rollback.mockResolvedValue();
    conn.release.mockResolvedValue();
    conn.query.mockResolvedValue([{ affectedRows: 1 }, undefined]);
  });

  it("rechaza la peticion sin token (401)", async () => {
    const res = await request(app)
      .patch("/api/usuarios/me/rol")
      .send({ rol: "vendedor" });
    expect(res.status).toBe(401);
  });

  it("rechaza un rol invalido (400 - zod enum)", async () => {
    pool.query.mockResolvedValue([[], undefined]);

    const res = await request(app)
      .patch("/api/usuarios/me/rol")
      .set("Authorization", `Bearer ${token}`)
      .send({ rol: "superadmin" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rechaza que un administrador se autodegrade (403)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id FROM roles WHERE nombre")) return [[{ id: 2 }], undefined];
      if (sql.includes("FROM roles r")) return [[{ nombre: "administrador" }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/usuarios/me/rol")
      .set("Authorization", `Bearer ${token}`)
      .send({ rol: "vendedor" });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toContain("administrador");
  });

  it("cambia de comprador a vendedor con transaccion (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id FROM roles WHERE nombre")) return [[{ id: 2 }], undefined];
      if (sql.includes("FROM roles r")) return [[{ nombre: "comprador" }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/usuarios/me/rol")
      .set("Authorization", `Bearer ${token}`)
      .send({ rol: "vendedor" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.roles).toEqual(["vendedor"]);
    expect(conn.commit).toHaveBeenCalled();
  });

  it("devuelve 404 si el rol solicitado no existe en la BD", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT id FROM roles WHERE nombre")) return [[], undefined];
      if (sql.includes("FROM roles r")) return [[{ nombre: "comprador" }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/usuarios/me/rol")
      .set("Authorization", `Bearer ${token}`)
      .send({ rol: "vendedor" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(pool.getConnection).not.toHaveBeenCalled();
  });
});

describe("POST /api/usuarios/recover (RF4 - anti-enumeracion)", () => {
  it("responde 200 uniforme para email inexistente sin llamar al mailer", async () => {
    pool.query.mockResolvedValue([[], undefined]);

    const res = await request(app)
      .post("/api/usuarios/recover")
      .send({ email: "nadie@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(enviarCorreoRecuperacion).not.toHaveBeenCalled();
  });

  it("genera token de 5 minutos y llama al mailer para email existente", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("SELECT id, email, activo FROM usuarios WHERE email"))
        return [[{ id: 7, email: "existe@test.com", activo: 1 }], undefined];
      if (sql.includes("UPDATE usuarios SET token_recuperacion"))
        return [{ affectedRows: 1 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .post("/api/usuarios/recover")
      .send({ email: "existe@test.com" });

    expect(res.status).toBe(200);
    expect(enviarCorreoRecuperacion).toHaveBeenCalledTimes(1);
    // RF4: la expiracion guardada en BD es de 5 minutos
    const updateCall = pool.query.mock.calls.find(([sql]) =>
      sql.includes("INTERVAL 5 MINUTE"));
    expect(updateCall).toBeTruthy();
  });

  it("devuelve 400 con email vacio (zod)", async () => {
    const res = await request(app)
      .post("/api/usuarios/recover")
      .send({ email: "" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("no filtra cuentas: responde 200 sin mailer para usuario inactivo", async () => {
    pool.query.mockResolvedValue([[{ id: 7, email: "x@test.com", activo: 0 }], undefined]);

    const res = await request(app)
      .post("/api/usuarios/recover")
      .send({ email: "x@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(enviarCorreoRecuperacion).not.toHaveBeenCalled();
  });

  it("devuelve 500 si la BD falla", async () => {
    pool.query.mockRejectedValue(new Error("BD caida"));

    const res = await request(app)
      .post("/api/usuarios/recover")
      .send({ email: "x@test.com" });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("POST /api/usuarios/reset-password (RF4 - token de un solo uso)", () => {
  const TOKEN_VALIDO = "token_valido_de_64chars_123456789012345678901234567890";

  it("rechaza token invalido o expirado (400)", async () => {
    pool.query.mockResolvedValue([[], undefined]);

    const res = await request(app)
      .post("/api/usuarios/reset-password")
      .send({ token: "token_inexistente_123", password: "NuevaPass456" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("restablece la contrasena, limpia el token y responde 200", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("WHERE token_recuperacion = ?"))
        return [[{ id: 7, email: "existe@test.com" }], undefined];
      if (sql.includes("UPDATE usuarios SET password"))
        return [{ affectedRows: 1 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .post("/api/usuarios/reset-password")
      .send({ token: TOKEN_VALIDO, password: "NuevaPass456" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(bcrypt.hash).toHaveBeenCalled();

    // El token se limpia: el link muere (un solo uso)
    const updateCall = pool.query.mock.calls.find(([sql]) =>
      sql.includes("token_recuperacion = NULL"));
    expect(updateCall).toBeTruthy();
  });

  it("rechaza contrasena corta (400 - zod)", async () => {
    const res = await request(app)
      .post("/api/usuarios/reset-password")
      .send({ token: TOKEN_VALIDO, password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("devuelve 500 si la BD falla", async () => {
    pool.query.mockRejectedValue(new Error("BD caida"));

    const res = await request(app)
      .post("/api/usuarios/reset-password")
      .send({ token: TOKEN_VALIDO, password: "NuevaPass456" });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("GET /api/usuarios/admin (RBAC - requireRoles)", () => {
  it("rechaza la peticion sin token (401)", async () => {
    const res = await request(app).get("/api/usuarios/admin");
    expect(res.status).toBe(401);
  });

  it("rechaza a un comprador (403)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "comprador" }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/usuarios/admin")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("permite el acceso a un administrador (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/usuarios/admin")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("test@test.com");
    expect(res.body.data.roles).toContain("administrador");
  });
});

describe("DELETE /api/usuarios/cuenta (RF40 - comprador elimina su cuenta)", () => {
  const conn = {
    query: vi.fn(),
    beginTransaction: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
    release: vi.fn(),
  };
  const tokenCuenta = jwt.sign(
    { id: 5, email: "comprador@test.com" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto_test";
    pool.getConnection.mockResolvedValue(conn);
    pool.query.mockResolvedValue([[], undefined]); // blacklist de tokens vacia
    conn.beginTransaction.mockResolvedValue();
    conn.commit.mockResolvedValue();
    conn.rollback.mockResolvedValue();
    conn.release.mockResolvedValue();
    conn.query.mockResolvedValue([[], undefined]);
  });

  it("devuelve 401 sin token", async () => {
    const res = await request(app).delete("/api/usuarios/cuenta");
    expect(res.status).toBe(401);
  });

  it("desactiva la cuenta, suspende productos y vacia el carrito (200)", async () => {
    conn.query.mockImplementation((sql) => {
      if (sql.includes("SELECT id, activo FROM usuarios"))
        return [[{ id: 5, activo: 1 }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .delete("/api/usuarios/cuenta")
      .set("Authorization", `Bearer ${tokenCuenta}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ id: 5, estado: "desactivado" });

    // B-R6: nunca DELETE fisico del usuario
    expect(conn.query).not.toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM usuarios"),
      expect.anything()
    );
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE usuarios SET activo = 0 WHERE id = ?"),
      [5]
    );
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE productos SET eliminado_por_admin = 1 WHERE vendedor_id = ?"),
      [5]
    );
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM carrito_items WHERE comprador_id = ?"),
      [5]
    );
    expect(conn.commit).toHaveBeenCalled();
  });

  it("devuelve 404 si la cuenta no existe", async () => {
    conn.query.mockResolvedValue([[], undefined]); // SELECT sin filas

    const res = await request(app)
      .delete("/api/usuarios/cuenta")
      .set("Authorization", `Bearer ${tokenCuenta}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("devuelve 500 con rollback si la BD falla", async () => {
    conn.query.mockRejectedValue(new Error("DB boom"));

    const res = await request(app)
      .delete("/api/usuarios/cuenta")
      .set("Authorization", `Bearer ${tokenCuenta}`);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
    expect(conn.rollback).toHaveBeenCalled();
  });
});
