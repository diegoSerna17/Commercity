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

const { __pool: pool } = await import("mysql2/promise");
const { default: app } = await import("../app.js");

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
