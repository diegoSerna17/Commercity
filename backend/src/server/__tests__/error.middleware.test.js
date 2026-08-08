import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import { errorHandler, asyncHandler } from "../middleware/error.middleware.js";

describe("errorHandler (middleware de error centralizado)", () => {
    it("responde 500 con el contrato estandar sin exponer el error interno", async () => {
        const app = express();
        app.get("/boom", () => {
            throw new Error("detalle interno secreto");
        });
        app.use(errorHandler);

        const res = await request(app).get("/boom");

        expect(res.status).toBe(500);
        expect(res.body).toEqual({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" },
        });
        // No filtra el mensaje interno ni stack traces
        expect(res.body.error).not.toHaveProperty("details");
        expect(JSON.stringify(res.body)).not.toContain("detalle interno secreto");
    });

    it("responde 500 tambien para errores pasados con next(error)", async () => {
        const app = express();
        app.get("/next-error", (_req, _res, next) => {
            next(new Error("boom via next"));
        });
        app.use(errorHandler);

        const res = await request(app).get("/next-error");

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
    });

    it("respeta el httpStatus del error (errores de validacion -> 400)", async () => {
        const app = express();
        app.get("/validacion", (_req, _res, next) => {
            const err = new Error("campo invalido");
            err.httpStatus = 400;
            next(err);
        });
        app.use(errorHandler);

        const res = await request(app).get("/validacion");

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
});

describe("asyncHandler", () => {
    it("propaga el error del handler asincrono al siguiente middleware", async () => {
        const next = vi.fn();
        const handler = asyncHandler(async () => {
            throw new Error("boom async");
        });

        await handler({}, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("resuelve sin llamar a next cuando el handler tiene exito", async () => {
        const next = vi.fn();
        const handler = asyncHandler(async () => "ok");

        await handler({}, {}, next);

        expect(next).not.toHaveBeenCalled();
    });
});
