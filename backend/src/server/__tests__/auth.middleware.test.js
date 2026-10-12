import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";

// Mock del pool para no depender de la BD real (mismo patron que
// role.middleware.test.js). En este archivo TODAS las consultas se delegan a
// la query interna, para que cada test decida que responde
// (tokens_invalidados, activo del usuario, etc.).
vi.mock("../config/db.js", () => {
    const queryInterna = vi.fn();
    const query = vi.fn((sql, ...resto) => queryInterna(sql, ...resto));
    query.mockImplementation = (fn) => { queryInterna.mockImplementation(fn); return query; };
    query.mockImplementationOnce = (fn) => { queryInterna.mockImplementationOnce(fn); return query; };
    query.mockResolvedValue = (valor) => { queryInterna.mockResolvedValue(valor); return query; };
    query.mockRejectedValue = (error) => { queryInterna.mockRejectedValue(error); return query; };
    return { default: { query } };
});

import pool from "../config/db.js";
import { authRequired } from "../middleware/auth.middleware.js";

// utils/config.js exige JWT_SECRET al importar (dotenv lo carga desde .env);
// el fallback solo aplica si tampoco existe ahi.
process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto_test";

const SECRETO = process.env.JWT_SECRET;

// Ruta minima SOLO con authRequired: aisla el middleware de requireRoles
// (ese se cubre en role.middleware.test.js).
const app = express();
app.get("/protegido", authRequired, (req, res) => {
    res.json({ success: true, data: { userId: req.userId, userEmail: req.userEmail } });
});

const tokenValido = jwt.sign({ id: 7, email: "test@test.com" , token_version: 0},
    SECRETO,
    { issuer: "commercity-api", audience: "commercity-clients", expiresIn: "1h" }
);

// JWT realmente vencido: jsonwebtoken acepta expiresIn numerico (segundos),
// por eso -60 deja exp = ahora - 60 s y verify lanza TokenExpiredError.
const tokenExpirado = jwt.sign({ id: 7, email: "test@test.com" , token_version: 0},
    SECRETO,
    { issuer: "commercity-api", audience: "commercity-clients", expiresIn: -60 }
);

beforeEach(() => {
    vi.clearAllMocks();
    // Estado por defecto: lista negra vacia y usuario existente y activo.
    pool.query.mockImplementation((sql) => {
        if (typeof sql === "string" && sql.includes("tokens_invalidados") && !sql.includes("AS revocado")) {
            return [[], undefined];
        }
        if (typeof sql === "string" && sql.includes("AS revocado")) {
            return [[{ activo: 1, token_version: 0, revocado: 0 }], undefined];
        }
        return [[], undefined];
    });
});

describe("authRequired (JWT por header o cookie)", () => {
    it("responde 401 UNAUTHORIZED si no llega token (sin header ni cookie)", async () => {
        const res = await request(app).get("/protegido");

        expect(res.status).toBe(401);
        expect(res.body).toEqual({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Token no autorizado" },
        });
        // Sin token no se toca la BD.
        expect(pool.query).not.toHaveBeenCalled();
    });

    it("autentica un token valido por header Authorization Bearer (200)", async () => {
        const res = await request(app)
            .get("/protegido")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(200);
        expect(res.body.data.userId).toBe(7);
        expect(res.body.data.userEmail).toBe("test@test.com");
        // TASK-4.11: UNA consulta combina lista negra + activo + token_version.
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("AS revocado"),
            [expect.any(String), 7]
        );
    });

    it("autentica un token valido llegado por COOKIE httpOnly (200)", async () => {
        const res = await request(app)
            .get("/protegido")
            .set("Cookie", `token=${tokenValido}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.userId).toBe(7);
        // El flujo completo se ejecuta aunque no venga header Authorization.
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("AS revocado"),
            [expect.any(String), 7]
        );
    });

    it("M-8: token invalido responde 401 uniforme (no 403) con el valor crudo de la cookie", async () => {
        // decodeURIComponent("abc%ZZ") lanza URIError -> fallback al valor crudo,
        // que no es un JWT valido y cae en JsonWebTokenError (401, no 403).
        const res = await request(app)
            .get("/protegido")
            .set("Cookie", "token=abc%ZZ");

        expect(res.status).toBe(401);
        expect(res.body).toEqual({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Token inválido" },
        });
        expect(pool.query).not.toHaveBeenCalled();
    });

    it("M-8: rechaza un token con firma manipulada (401)", async () => {
        const manipulados = tokenValido.slice(0, -3) + "abc";
        const res = await request(app)
            .get("/protegido")
            .set("Authorization", `Bearer ${manipulados}`);

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe("UNAUTHORIZED");
        expect(pool.query).not.toHaveBeenCalled();
    });

    it("M-8/B-4: rechaza alg:none (401, algorithms fijo HS256)", async () => {
        // Token sin firma con alg none: jwt.verify debe rechazarlo.
        const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
        const payload = Buffer.from(JSON.stringify({
            id: 7, email: "test@test.com", token_version: 0,
            iss: "commercity-api", aud: "commercity-clients",
        })).toString("base64url");
        const res = await request(app)
            .get("/protegido")
            .set("Authorization", `Bearer ${header}.${payload}.`);

        expect(res.status).toBe(401);
        expect(res.body.error.message).toBe("Token inválido");
        expect(pool.query).not.toHaveBeenCalled();
    });

    it("M-8/B-4: rechaza un token con otro issuer/audience (401)", async () => {
        const tokenOtroEmisor = jwt.sign(
            { id: 7, email: "test@test.com", token_version: 0 },
            SECRETO,
            { issuer: "otro-servicio", audience: "commercity-clients", expiresIn: "1h" }
        );
        const res = await request(app)
            .get("/protegido")
            .set("Authorization", `Bearer ${tokenOtroEmisor}`);

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe("UNAUTHORIZED");
        expect(pool.query).not.toHaveBeenCalled();
    });

    it("M-8: rechaza el token si su token_version ya no coincide con la BD (401)", async () => {
        // El usuario subio de version (reset de contrasena / baneo / cierre de
        // sesiones): el token viejo (version 0) deja de servir.
        pool.query.mockImplementation((sql) => {
            if (typeof sql === "string" && sql.includes("tokens_invalidados") && !sql.includes("AS revocado")) {
                return [[], undefined];
            }
            if (typeof sql === "string" && sql.includes("AS revocado")) {
                return [[{ activo: 1, token_version: 1 }], undefined];
            }
            return [[], undefined];
        });

        const res = await request(app)
            .get("/protegido")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(401);
        expect(res.body).toEqual({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Sesión expirada. Inicia sesión de nuevo" },
        });
    });

    it("responde 401 USER_DISABLED si el usuario esta desactivado (activo = 0)", async () => {
        pool.query.mockImplementation((sql) => {
            if (typeof sql === "string" && sql.includes("tokens_invalidados") && !sql.includes("AS revocado")) {
                return [[], undefined];
            }
            if (typeof sql === "string" && sql.includes("AS revocado")) {
                return [[{ activo: 0 }], undefined];
            }
            return [[], undefined];
        });

        const res = await request(app)
            .get("/protegido")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("USER_DISABLED");
        expect(res.body.error.message).toBe(
            "Cuenta desactivada o baneada. Contacta al administrador."
        );
        // La consulta combinada SI se ejecuta (devuelve activo=0); lo que
        // falla es la verificacion de estado, no la consulta.
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("AS revocado"),
            [expect.any(String), 7]
        );
    });

    it("responde 401 USER_DISABLED si el usuario ya no existe en la BD", async () => {
        pool.query.mockImplementation((sql) => {
            if (typeof sql === "string" && sql.includes("tokens_invalidados") && !sql.includes("AS revocado")) {
                return [[], undefined];
            }
            if (typeof sql === "string" && sql.includes("AS revocado")) {
                return [[], undefined]; // sin filas: usuario borrado/inexistente
            }
            return [[], undefined];
        });

        const res = await request(app)
            .get("/protegido")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe("USER_DISABLED");
    });

    it("responde 401 con Token expirado si el JWT ya vencio", async () => {
        const res = await request(app)
            .get("/protegido")
            .set("Authorization", `Bearer ${tokenExpirado}`);

        expect(res.status).toBe(401);
        expect(res.body).toEqual({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Token expirado. Inicia sesión de nuevo" },
        });
        // jwt.verify falla antes de consultar la BD (firma/expiracion primero).
        expect(pool.query).not.toHaveBeenCalled();
    });

    it("TASK-4.11: rechaza un token revocado en la lista negra (401)", async () => {
        // La consulta combinada devuelve revocado = 1 (lo inserto un logout).
        pool.query.mockImplementation(() => [[
            { activo: 1, token_version: 0, revocado: 1 },
        ], undefined]);

        const res = await request(app)
            .get("/protegido")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(401);
        expect(res.body.error.message).toContain("revocado");
    });
});
