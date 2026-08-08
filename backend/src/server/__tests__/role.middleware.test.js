import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";

// Mock del pool para no depender de la BD real
vi.mock("../config/db.js", () => ({
    default: { query: vi.fn() }
}));

import pool from "../config/db.js";
import { authRequired } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto_test";

const app = express();
app.get("/protegido", authRequired, requireRoles(["administrador"]), (req, res) => {
    res.json({ success: true, data: { userId: req.userId, roles: req.userRoles } });
});

const tokenValido = jwt.sign({ id: 7, email: "admin@test.com" }, process.env.JWT_SECRET, { expiresIn: "1h" });

beforeEach(() => {
    vi.clearAllMocks();
});

describe("requireRoles (RBAC)", () => {
    it("deberia rechazar la peticion sin token (401, antes de requireRoles)", async () => {
        const res = await request(app).get("/protegido");
        expect(res.status).toBe(401);
    });

    it("deberia devolver 403 con token invalido", async () => {
        const res = await request(app)
            .get("/protegido")
            .set("Authorization", "Bearer token_falso_123");
        expect(res.status).toBe(403);
    });

    it("deberia devolver 403 si el usuario no tiene el rol administrador", async () => {
        pool.query.mockImplementation((sql) =>
            sql.includes("tokens_invalidados") ? [[], undefined] : [[{ nombre: "vendedor" }]]
        );

        const res = await request(app)
            .get("/protegido")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("deberia devolver 403 si el usuario no tiene roles asignados", async () => {
        pool.query.mockImplementation((sql) =>
            sql.includes("tokens_invalidados") ? [[], undefined] : [[]]
        );

        const res = await request(app)
            .get("/protegido")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(403);
    });

    it("deberia permitir el acceso y consultar los roles del usuario autenticado", async () => {
        pool.query.mockImplementation((sql) =>
            sql.includes("tokens_invalidados") ? [[], undefined] : [[{ nombre: "administrador" }]]
        );

        const res = await request(app)
            .get("/protegido")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.userId).toBe(7);
        expect(res.body.data.roles).toEqual(["administrador"]);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("FROM usuario_roles"),
            [7]
        );
    });

    it("deberia propagar el error de base de datos (500)", async () => {
        pool.query.mockRejectedValue(new Error("DB boom"));

        const res = await request(app)
            .get("/protegido")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(500);
    });
});
