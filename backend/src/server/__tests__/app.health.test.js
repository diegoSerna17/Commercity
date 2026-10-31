import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock de mysql2/promise: createPool devuelve un pool simulado (sin BD real).
vi.mock("mysql2/promise", () => {
  const pool = { query: vi.fn(), getConnection: vi.fn() };
  return {
    __esModule: true,
    default: { createPool: vi.fn(() => pool) },
    __pool: pool,
  };
});

process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto_test";

const { __pool: pool } = await import("mysql2/promise");
const { default: app } = await import("../app.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /health (TASK-8.4)", () => {
  it("200 con status/db ok cuando la BD responde al SELECT 1 (sin token)", async () => {
    pool.query.mockResolvedValue([[{ "1": 1 }], undefined]);

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { status: "ok", db: "ok" } });
    expect(pool.query).toHaveBeenCalledWith("SELECT 1");
  });

  it("503 con codigo DB_UNAVAILABLE y sin detalles internos cuando la BD falla", async () => {
    pool.query.mockRejectedValue(new Error("connect ECONNREFUSED"));

    const res = await request(app).get("/health");

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("DB_UNAVAILABLE");
    expect(JSON.stringify(res.body)).not.toContain("ECONNREFUSED");
  });
});
