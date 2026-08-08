import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

// Mock del pool para no depender de la BD real
vi.mock("../config/db.js", () => ({
    default: { query: vi.fn() }
}));

import pool from "../config/db.js";
import historialRouter from "../routes/historial.routes.js";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto_test";

const app = express();
app.use(express.json());
app.use("/api/historial", historialRouter);

const tokenValido = jwt.sign({ id: 7, email: "test@test.com" }, process.env.JWT_SECRET, { expiresIn: "1h" });

const filasMock = [
    {
        pedido_id: 1,
        fecha: "2026-08-08T02:08:27.000Z",
        estado: "Pendiente",
        cantidad: 1,
        monto: "1299000.00",
        producto: "MacBook Air M2",
        imagen: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop",
        vendedor: "Vendedor Alex Rivera"
    }
];

beforeEach(() => {
    vi.clearAllMocks();
});

describe("GET /api/historial/compras", () => {
    it("deberia rechazar la peticion sin token (401)", async () => {
        const res = await request(app).get("/api/historial/compras");
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it("deberia devolver 403 con token invalido", async () => {
        const res = await request(app)
            .get("/api/historial/compras")
            .set("Authorization", "Bearer token_falso_123");
        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
    });

    it("deberia devolver el historial del comprador autenticado con contrato { success, data }", async () => {
        pool.query.mockResolvedValue([filasMock]);

        const res = await request(app)
            .get("/api/historial/compras")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].vendedor).toBe("Vendedor Alex Rivera");
        expect(res.body.data[0].producto).toBe("MacBook Air M2");

        // El comprador_id sale del token (req.userId), nunca de un query param
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("WHERE p.comprador_id = ?"),
            [7]
        );
    });

    it("deberia aplicar el filtro por estado cuando llega ?estado=", async () => {
        pool.query.mockResolvedValue([filasMock]);

        const res = await request(app)
            .get("/api/historial/compras?estado=Pendiente")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(200);
        const [query, params] = pool.query.mock.calls[0];
        expect(query).toContain("AND dp.estado_envio = ?");
        expect(params).toEqual([7, "Pendiente"]);
    });

    it("NO deberia filtrar si el estado no esta en la lista valida", async () => {
        pool.query.mockResolvedValue([filasMock]);

        await request(app)
            .get("/api/historial/compras?estado=pendiente")
            .set("Authorization", `Bearer ${tokenValido}`);

        const [query, params] = pool.query.mock.calls[0];
        expect(query).not.toContain("AND dp.estado_envio = ?");
        expect(params).toEqual([7]);
    });

    it("deberia devolver 500 con error estructurado si la BD falla", async () => {
        pool.query.mockRejectedValue(new Error("BD caida"));

        const res = await request(app)
            .get("/api/historial/compras")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("INTERNAL_ERROR");
    });
});
