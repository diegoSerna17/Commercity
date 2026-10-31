import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";

// B-10: authRequired trae los roles en la consulta unica (roles_csv) y
// requireRoles no debe hacer una segunda consulta por peticion.
vi.mock("../config/db.js", () => {
    const queryInterna = vi.fn();
    const query = vi.fn((sql, ...resto) => {
        if (typeof sql === "string" && sql.includes("AS revocado")) {
            return Promise.resolve([[{ activo: 1, token_version: 0, revocado: 0, roles_csv: "administrador,vendedor" }], undefined]);
        }
        return queryInterna(sql, ...resto);
    });
    query.mockImplementation = (fn) => { queryInterna.mockImplementation(fn); return query; };
    query.mockImplementationOnce = (fn) => { queryInterna.mockImplementationOnce(fn); return query; };
    query.mockResolvedValue = (valor) => { queryInterna.mockResolvedValue(valor); return query; };
    query.mockRejectedValue = (error) => { queryInterna.mockRejectedValue(error); return query; };
    return { default: { query } };
});

import pool from "../config/db.js";
import { authRequired } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto_test";

const app = express();
app.get("/protegido", authRequired, requireRoles(["administrador"]), (req, res) => {
    res.json({ success: true, data: { userId: req.userId, roles: req.userRoles } });
});

const tokenValido = jwt.sign({ id: 7, email: "admin@test.com", token_version: 0 }, process.env.JWT_SECRET, { issuer: "commercity-api", audience: "commercity-clients", expiresIn: "1h" });

beforeEach(() => {
    vi.clearAllMocks();
});

describe("B-10 requireRoles reutiliza los roles de authRequired (una sola consulta)", () => {
    it("permite el acceso sin consultar usuario_roles (solo la consulta de auth)", async () => {
        const res = await request(app)
            .get("/protegido")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(200);
        expect(res.body.data.roles).toEqual(["administrador", "vendedor"]);
        // Una sola consulta en total: la de authRequired (con roles_csv).
        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(pool.query.mock.calls[0][0]).toContain("AS revocado");
        expect(pool.query.mock.calls[0][0]).toContain("roles_csv");
    });

    it("rechaza con 403 sin segunda consulta cuando el rol no esta entre los de la sesion", async () => {
        const appSoloSuper = express();
        const { requireRoles: rr } = await import("../middleware/role.middleware.js");
        const { authRequired: ar } = await import("../middleware/auth.middleware.js");
        appSoloSuper.get("/x", ar, rr(["superadmin"]), (_req, res) => {
            res.json({ success: true });
        });

        const res = await request(appSoloSuper)
            .get("/x")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(403);
        expect(pool.query).toHaveBeenCalledTimes(1);
    });
});
