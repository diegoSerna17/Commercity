import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

// Mock del pool para no depender de la BD real
vi.mock("../config/db.js", () => ({
    default: { query: vi.fn(), getConnection: vi.fn() }
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
        direccion: "Calle 5 # 20-10, Cali",
        detalle_id: 11,
        estado: "Pendiente",
        cantidad: 1,
        precio_unitario: "1299000.00",
        descuento_aplicado: "0.00",
        subtotal: "1091596.64",
        producto: "MacBook Air M2",
        imagen: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop",
        vendedor: "Vendedor Alex Rivera"
    },
    {
        pedido_id: 1,
        fecha: "2026-08-08T02:08:27.000Z",
        direccion: "Calle 5 # 20-10, Cali",
        detalle_id: 12,
        estado: "Entregado",
        cantidad: 2,
        precio_unitario: "95000.00",
        descuento_aplicado: "0.00",
        subtotal: "159663.87",
        producto: "Mouse Inalambrico",
        imagen: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop",
        vendedor: "Vendedor Marco Rossi"
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

    it("deberia devolver el historial del comprador agrupado por pedido (RF32) con campos RF31", async () => {
        pool.query.mockImplementation((sql) =>
            sql.includes("tokens_invalidados") ? [[], undefined] : [filasMock]
        );

        const res = await request(app)
            .get("/api/historial/compras")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        // RF32: las dos lineas del mismo pedido se agrupan en un solo pedido
        expect(res.body.data).toHaveLength(1);
        const pedido = res.body.data[0];
        expect(pedido.pedido_id).toBe(1);
        // RF31: direccion de envio
        expect(pedido.direccion).toBe("Calle 5 # 20-10, Cali");
        // vendedores unicos del pedido
        expect(pedido.vendedores).toContain("Vendedor Alex Rivera");
        expect(pedido.vendedores).toContain("Vendedor Marco Rossi");
        // items con precio unitario, IVA y total por linea
        expect(pedido.items).toHaveLength(2);
        const mac = pedido.items[0];
        expect(mac.producto).toBe("MacBook Air M2");
        expect(mac.precio_unitario).toBe(1299000);
        // IVA = subtotal x 0.19 en vuelo (RF31)
        expect(mac.iva).toBeCloseTo(1091596.64 * 0.19, 2);
        expect(mac.total).toBeCloseTo(1091596.64 * 1.19, 2);
        // resumen del pedido
        expect(pedido.resumen.subtotal).toBeCloseTo(1091596.64 + 159663.87, 2);
        expect(pedido.resumen.total).toBeCloseTo((1091596.64 + 159663.87) * 1.19, 2);
        // estado predominante: Pendiente tiene prioridad sobre Entregado (RF28/RF29)
        expect(pedido.estado).toBe("Pendiente");

        // El comprador_id sale del token (req.userId), nunca de un query param
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("WHERE p.comprador_id = ?"),
            [7]
        );
    });

    it("deberia aplicar el filtro por estado cuando llega ?estado=", async () => {
        pool.query.mockImplementation((sql) =>
            sql.includes("tokens_invalidados") ? [[], undefined] : [filasMock]
        );

        const res = await request(app)
            .get("/api/historial/compras?estado=Pendiente")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(200);
        const llamadaCompras = pool.query.mock.calls.find(([sql]) => sql.includes("comprador_id = ?"));
        const [query, params] = llamadaCompras;
        expect(query).toContain("AND dp.estado_envio = ?");
        expect(params).toEqual([7, "Pendiente"]);
    });

    it("NO deberia filtrar si el estado no esta en la lista valida", async () => {
        pool.query.mockImplementation((sql) =>
            sql.includes("tokens_invalidados") ? [[], undefined] : [filasMock]
        );

        await request(app)
            .get("/api/historial/compras?estado=pendiente")
            .set("Authorization", `Bearer ${tokenValido}`);

        const llamadaCompras = pool.query.mock.calls.find(([sql]) => sql.includes("comprador_id = ?"));
        const [query, params] = llamadaCompras;
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

describe("POST /api/historial/compras/:id/cancelar (RF135)", () => {
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
        pool.query.mockResolvedValue([[], undefined]); // blacklist de tokens vacia
        conn.beginTransaction.mockResolvedValue();
        conn.commit.mockResolvedValue();
        conn.rollback.mockResolvedValue();
        conn.release.mockResolvedValue();
        conn.query.mockResolvedValue([[], undefined]);
    });

    it("deberia rechazar la peticion sin token (401)", async () => {
        const res = await request(app).post("/api/historial/compras/9/cancelar");
        expect(res.status).toBe(401);
    });

    it("deberia devolver 400 con id no numerico", async () => {
        const res = await request(app)
            .post("/api/historial/compras/abc/cancelar")
            .set("Authorization", `Bearer ${tokenValido}`);
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("deberia devolver 404 si la linea no es del comprador o no esta Pendiente", async () => {
        conn.query.mockResolvedValue([[], undefined]); // FOR UPDATE sin filas
        const res = await request(app)
            .post("/api/historial/compras/999/cancelar")
            .set("Authorization", `Bearer ${tokenValido}`);
        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("deberia cancelar la linea, restituir stock y reembolsar el pago (200)", async () => {
        conn.query.mockImplementation((sql) => {
            if (sql.includes("FOR UPDATE"))
                return [[{ id: 9, producto_id: 3, cantidad: 2, pedido_id: 4 }], undefined];
            return [[], undefined];
        });

        const res = await request(app)
            .post("/api/historial/compras/9/cancelar")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual({ id: 9, estado: "Cancelado", reembolsado: true });

        expect(conn.query).toHaveBeenCalledWith(
            expect.stringContaining("WHERE dp.id = ? AND p.comprador_id = ? AND dp.estado_envio = 'Pendiente'"),
            [9, 7]
        );
        expect(conn.query).toHaveBeenCalledWith(
            expect.stringContaining("UPDATE detalle_pedidos SET estado_envio = 'Cancelado'"),
            [9]
        );
        expect(conn.query).toHaveBeenCalledWith(
            expect.stringContaining("UPDATE productos SET stock = stock + ? WHERE id = ?"),
            [2, 3]
        );
        expect(conn.query).toHaveBeenCalledWith(
            expect.stringContaining("UPDATE pagos_simulados SET estado = 'Reembolsado'"),
            [4]
        );
        expect(conn.commit).toHaveBeenCalled();
        expect(conn.rollback).not.toHaveBeenCalled();
    });

    it("deberia devolver 500 con rollback si la BD falla", async () => {
        conn.query.mockRejectedValue(new Error("DB boom"));

        const res = await request(app)
            .post("/api/historial/compras/9/cancelar")
            .set("Authorization", `Bearer ${tokenValido}`);

        expect(res.status).toBe(500);
        expect(res.body.error.code).toBe("INTERNAL_ERROR");
        expect(conn.rollback).toHaveBeenCalled();
    });
});
