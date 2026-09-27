import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("mysql2/promise", () => {
    // query envoltorio: responde de forma transparente la consulta que authRequired
    // hace por DEF-01 ("SELECT activo FROM usuarios WHERE id = ? LIMIT 1") y delega
    // el resto a la query interna que configura cada test con mockImplementation.
    const queryInterna = vi.fn();
    const query = vi.fn((sql, ...resto) => {
        if (typeof sql === "string" && sql.includes("SELECT activo FROM usuarios WHERE id = ? LIMIT 1")) {
            return Promise.resolve([[{ activo: 1 }], undefined]);
        }
        return queryInterna(sql, ...resto);
    });
    query.mockImplementation = (fn) => { queryInterna.mockImplementation(fn); return query; };
    query.mockImplementationOnce = (fn) => { queryInterna.mockImplementationOnce(fn); return query; };
    query.mockResolvedValue = (valor) => { queryInterna.mockResolvedValue(valor); return query; };
    query.mockRejectedValue = (error) => { queryInterna.mockRejectedValue(error); return query; };
    const pool = { query, getConnection: vi.fn() };
    return { __esModule: true, default: { createPool: vi.fn(() => pool) }, __pool: pool };
});

process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto_test";

const { __pool: pool } = await import("mysql2/promise");
const { default: app } = await import("../app.js");

const token = jwt.sign(
    { id: 9, email: "camila.torres@commercity.com" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
);

beforeEach(() => {
    vi.clearAllMocks();
    pool.query.mockImplementation((sql) =>
        sql.includes("tokens_invalidados") ? [[], undefined] : [[], undefined]
    );
});

describe("Seguidores", () => {
    it("rechaza solicitudes sin token", async () => {
        const response = await request(app).get("/api/seguidores/siguiendo");
        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe("UNAUTHORIZED");
    });

    it("rechaza un body inválido", async () => {
        const response = await request(app)
            .post("/api/seguidores")
            .set("Authorization", `Bearer ${token}`)
            .send({});
        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("impide el auto-seguimiento", async () => {
        const response = await request(app)
            .post("/api/seguidores")
            .set("Authorization", `Bearer ${token}`)
            .send({ seguido_id: 9 });
        expect(response.status).toBe(400);
    });

    it("devuelve 404 si el usuario no existe", async () => {
        pool.query.mockImplementation((sql) => {
            if (sql.includes("tokens_invalidados")) return [[], undefined];
            if (sql.includes("FROM usuarios WHERE id")) return [[], undefined];
            return [[], undefined];
        });
        const response = await request(app)
            .post("/api/seguidores")
            .set("Authorization", `Bearer ${token}`)
            .send({ seguido_id: 999 });
        expect(response.status).toBe(404);
    });

    it("devuelve 409 si el seguimiento ya existe", async () => {
        pool.query.mockImplementation((sql) => {
            if (sql.includes("tokens_invalidados")) return [[], undefined];
            if (sql.includes("FROM usuarios WHERE id")) return [[{ 1: 1 }], undefined];
            if (sql.includes("FROM seguidores WHERE seguidor_id")) return [[{ 1: 1 }], undefined];
            return [[], undefined];
        });
        const response = await request(app)
            .post("/api/seguidores")
            .set("Authorization", `Bearer ${token}`)
            .send({ seguido_id: 3 });
        expect(response.status).toBe(409);
    });

    it("crea el seguimiento con parámetros", async () => {
        pool.query.mockImplementation((sql) => {
            if (sql.includes("tokens_invalidados")) return [[], undefined];
            if (sql.includes("FROM usuarios WHERE id")) return [[{ 1: 1 }], undefined];
            if (sql.includes("FROM seguidores WHERE seguidor_id")) return [[], undefined];
            if (sql.includes("INSERT INTO seguidores")) return [{ insertId: 1 }, undefined];
            return [[], undefined];
        });
        const response = await request(app)
            .post("/api/seguidores")
            .set("Authorization", `Bearer ${token}`)
            .send({ seguido_id: 3 });
        expect(response.status).toBe(201);
        expect(response.body.data).toEqual({ seguidor_id: 9, seguido_id: 3 });
        const insert = pool.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO seguidores"));
        expect(insert[1]).toEqual([9, 3]);
    });

    it("elimina un seguimiento existente", async () => {
        pool.query.mockImplementation((sql) => {
            if (sql.includes("tokens_invalidados")) return [[], undefined];
            if (sql.includes("DELETE FROM seguidores")) return [{ affectedRows: 1 }, undefined];
            return [[], undefined];
        });
        const response = await request(app)
            .delete("/api/seguidores/3")
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        const deletion = pool.query.mock.calls.find(([sql]) => sql.includes("DELETE FROM seguidores"));
        expect(deletion[1]).toEqual([9, 3]);
    });

    it("devuelve 404 si no existe el seguimiento a eliminar", async () => {
        pool.query.mockImplementation((sql) => {
            if (sql.includes("tokens_invalidados")) return [[], undefined];
            if (sql.includes("DELETE FROM seguidores")) return [{ affectedRows: 0 }, undefined];
            return [[], undefined];
        });
        const response = await request(app)
            .delete("/api/seguidores/3")
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(404);
    });

    it("lista usuarios seguidos", async () => {
        const rows = [{ id: 3, nombre_completo: "Vendedor Uno", foto_perfil: null }];
        pool.query.mockImplementation((sql) => {
            if (sql.includes("tokens_invalidados")) return [[], undefined];
            if (sql.includes("s.seguido_id")) return [rows, undefined];
            return [[], undefined];
        });
        const response = await request(app)
            .get("/api/seguidores/siguiendo")
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(rows);
    });

    it("lista usuarios seguidores", async () => {
        const rows = [{ id: 5, nombre_completo: "Comprador Dos", foto_perfil: null }];
        pool.query.mockImplementation((sql) => {
            if (sql.includes("tokens_invalidados")) return [[], undefined];
            if (sql.includes("s.seguidor_id")) return [rows, undefined];
            return [[], undefined];
        });
        const response = await request(app)
            .get("/api/seguidores/seguidores")
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(rows);
    });

    it("rechaza un id invalido al dejar de seguir (400)", async () => {
        const response = await request(app)
            .delete("/api/seguidores/abc")
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("devuelve 500 si la BD falla al crear el seguimiento", async () => {
        pool.query.mockImplementation((sql) => {
            if (sql.includes("tokens_invalidados")) return [[], undefined];
            throw new Error("BD caida");
        });
        const response = await request(app)
            .post("/api/seguidores")
            .set("Authorization", `Bearer ${token}`)
            .send({ seguido_id: 3 });
        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe("INTERNAL_ERROR");
    });

    it("devuelve 500 si la BD falla al eliminar el seguimiento", async () => {
        pool.query.mockImplementation((sql) => {
            if (sql.includes("tokens_invalidados")) return [[], undefined];
            if (sql.includes("DELETE FROM seguidores")) throw new Error("BD caida");
            return [[], undefined];
        });
        const response = await request(app)
            .delete("/api/seguidores/3")
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe("INTERNAL_ERROR");
    });

    it("devuelve 500 si la BD falla al listar seguidos", async () => {
        pool.query.mockImplementation((sql) => {
            if (sql.includes("tokens_invalidados")) return [[], undefined];
            if (sql.includes("FROM seguidores s")) throw new Error("BD caida");
            return [[], undefined];
        });
        const response = await request(app)
            .get("/api/seguidores/siguiendo")
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe("INTERNAL_ERROR");
    });

    it("devuelve 500 si la BD falla al listar seguidores", async () => {
        pool.query.mockImplementation((sql) => {
            if (sql.includes("tokens_invalidados")) return [[], undefined];
            if (sql.includes("FROM seguidores s")) throw new Error("BD caida");
            return [[], undefined];
        });
        const response = await request(app)
            .get("/api/seguidores/seguidores")
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe("INTERNAL_ERROR");
    });
});
