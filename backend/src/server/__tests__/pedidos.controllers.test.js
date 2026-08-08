import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// Mock del pool MySQL (sin BD real).
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

const token = jwt.sign(
  { id: 7, email: "comprador@test.com" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);

const tokenVendedor = jwt.sign(
  { id: 3, email: "vendedor@test.com" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);

beforeEach(() => {
  vi.clearAllMocks();
  pool.query.mockResolvedValue([[], undefined]);
});

describe("GET /api/pedidos/resumen (RF113/RF114 + RF74)", () => {
  it("rechaza sin token (401)", async () => {
    const res = await request(app).get("/api/pedidos/resumen");
    expect(res.status).toBe(401);
  });

  it("agrupa items por vendedor con desglose de IVA y 90/10", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      return [
        [
          { producto_id: 1, cantidad: 2, nombre: "Televisor", imagen_url: "tv.jpg", precio: 1190000, descuento_porcentaje: 0, vendedor_id: 3, vendedor_nombre: "Vendedor A", stock: 5, eliminado_por_admin: 0, activo: 1 },
          { producto_id: 2, cantidad: 1, nombre: "Celular", imagen_url: "cel.jpg", precio: 238000, descuento_porcentaje: 10, vendedor_id: 4, vendedor_nombre: "Vendedor B", stock: 3, eliminado_por_admin: 0, activo: 1 },
        ],
        undefined,
      ];
    });

    const res = await request(app)
      .get("/api/pedidos/resumen")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.por_vendedor).toHaveLength(2);
    expect(res.body.data.totales.subtotal).toBeCloseTo(2180000);
    expect(res.body.data.totales.total).toBeCloseTo(2594200);
  });

  it("RF74: excluye productos suspendidos o de vendedores inactivos", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      return [
        [
          { producto_id: 1, cantidad: 1, nombre: "Bueno", precio: 119000, descuento_porcentaje: 0, vendedor_id: 3, vendedor_nombre: "A", stock: 5, eliminado_por_admin: 0, activo: 1 },
          { producto_id: 2, cantidad: 1, nombre: "Suspendido", precio: 119000, descuento_porcentaje: 0, vendedor_id: 4, vendedor_nombre: "B", stock: 5, eliminado_por_admin: 1, activo: 1 },
        ],
        undefined,
      ];
    });

    const res = await request(app)
      .get("/api/pedidos/resumen")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.por_vendedor).toHaveLength(1);
    expect(res.body.data.por_vendedor[0].items[0].nombre).toBe("Bueno");
  });

  it("devuelve 500 con error estandar si la BD falla", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      throw new Error("BD caida");
    });

    const res = await request(app)
      .get("/api/pedidos/resumen")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("POST /api/pedidos/confirmar-pago (RF134 ACID)", () => {
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
      if (sql.includes("FROM carrito_items")) {
        return [[{ producto_id: 1, cantidad: 2, nombre: "Televisor", precio: 1190000, descuento_porcentaje: 0, vendedor_id: 3, stock: 10 }], undefined];
      }
      if (sql.includes("FOR UPDATE")) {
        return [[{ id: 1, vendedor_id: 3, stock: 10, eliminado_por_admin: 0 }], undefined];
      }
      if (sql.includes("INSERT INTO pedidos")) return [{ insertId: 5 }, undefined];
      if (sql.includes("INSERT INTO detalle_pedidos")) return [{ affectedRows: 1 }, undefined];
      if (sql.includes("UPDATE productos")) return [{ affectedRows: 1 }, undefined];
      if (sql.includes("INSERT INTO pagos_simulados")) return [{ insertId: 9 }, undefined];
      if (sql.includes("DELETE FROM carrito_items")) return [{ affectedRows: 1 }, undefined];
      return [[], undefined];
    });
  });

  it("rechaza sin token (401)", async () => {
    const res = await request(app)
      .post("/api/pedidos/confirmar-pago")
      .send({ direccion_envio: "Calle 1 # 2-3", metodo_pago: "pse" });
    expect(res.status).toBe(401);
  });

  it("rechaza tarjeta con Luhn invalido (402 PAGO_RECHAZADO)", async () => {
    const res = await request(app)
      .post("/api/pedidos/confirmar-pago")
      .set("Authorization", `Bearer ${token}`)
      .send({ direccion_envio: "Calle 1 # 2-3", metodo_pago: "tarjeta", numero_tarjeta: "1234567890123456", nombre_tarjeta: "JUAN PEREZ" });
    expect(res.status).toBe(402);
    expect(res.body.error.code).toBe("PAGO_RECHAZADO");
    // No inicia transaccion (el pago se rechaza antes de tocar la BD)
    expect(conn.beginTransaction).not.toHaveBeenCalled();
    expect(conn.commit).not.toHaveBeenCalled();
  });

  it("crea pedido + lineas + descuenta stock + registra pago en UNA transaccion (201)", async () => {
    const res = await request(app)
      .post("/api/pedidos/confirmar-pago")
      .set("Authorization", `Bearer ${token}`)
      .send({ direccion_envio: "Calle 1 # 2-3", metodo_pago: "pse" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pedido_id).toBe(5);
    expect(res.body.data.total_neto).toBeCloseTo(2000000);
    expect(res.body.data.iva).toBeCloseTo(380000);
    expect(res.body.data.total).toBeCloseTo(2380000);
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO pedidos"),
      [7, "Calle 1 # 2-3", 2000000]
    );
    // Fix 3.5: el INSERT de detalle NO incluye columnas GENERATED ni imagen_url
    const detalleCall = conn.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO detalle_pedidos"));
    expect(detalleCall[0]).not.toContain("monto_vendedor");
    expect(detalleCall[0]).not.toContain("imagen_url");
    // ACID: stock y pago en la misma transaccion, carrito consumido
    expect(conn.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE productos SET stock = stock - ?"), [2, 1]);
    expect(conn.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO pagos_simulados"), expect.anything());
    expect(conn.query).toHaveBeenCalledWith(expect.stringContaining("DELETE FROM carrito_items"), [7]);
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.rollback).not.toHaveBeenCalled();
  });

  it("rechaza carrito vacio (400)", async () => {
    conn.query.mockImplementation((sql) => {
      if (sql.includes("FROM carrito_items")) return [[], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .post("/api/pedidos/confirmar-pago")
      .set("Authorization", `Bearer ${token}`)
      .send({ direccion_envio: "Calle 1 # 2-3", metodo_pago: "pse" });

    expect(res.status).toBe(400);
    expect(conn.rollback).toHaveBeenCalled();
  });

  it("rechaza body invalido con 400 VALIDATION_ERROR (zod)", async () => {
    const res = await request(app)
      .post("/api/pedidos/confirmar-pago")
      .set("Authorization", `Bearer ${token}`)
      .send({ metodo_pago: "pse" }); // falta direccion_envio

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(conn.commit).not.toHaveBeenCalled();
  });

  it("rechaza metodo de pago no permitido (400)", async () => {
    const res = await request(app)
      .post("/api/pedidos/confirmar-pago")
      .set("Authorization", `Bearer ${token}`)
      .send({ direccion_envio: "Calle 1 # 2-3", metodo_pago: "efectivo" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("RF74: rechaza producto suspendido (409)", async () => {
    conn.query.mockImplementation((sql) => {
      if (sql.includes("FROM carrito_items")) {
        return [[{ producto_id: 9, cantidad: 1, nombre: "Mal", precio: 100, descuento_porcentaje: 0, vendedor_id: 4, stock: 5 }], undefined];
      }
      return [[], undefined]; // FOR UPDATE sin filas = producto suspendido/vendedor inactivo
    });

    const res = await request(app)
      .post("/api/pedidos/confirmar-pago")
      .set("Authorization", `Bearer ${token}`)
      .send({ direccion_envio: "Calle 1 # 2-3", metodo_pago: "pse" });

    expect(res.status).toBe(409);
    expect(conn.rollback).toHaveBeenCalled();
  });

  it("rechaza stock insuficiente (409)", async () => {
    conn.query.mockImplementation((sql) => {
      if (sql.includes("FROM carrito_items")) {
        return [[{ producto_id: 1, cantidad: 20, nombre: "Televisor", precio: 1190000, descuento_porcentaje: 0, vendedor_id: 3, stock: 10 }], undefined];
      }
      if (sql.includes("FOR UPDATE")) return [[{ id: 1, vendedor_id: 3, stock: 10, eliminado_por_admin: 0 }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .post("/api/pedidos/confirmar-pago")
      .set("Authorization", `Bearer ${token}`)
      .send({ direccion_envio: "Calle 1 # 2-3", metodo_pago: "pse" });

    expect(res.status).toBe(409);
    expect(conn.rollback).toHaveBeenCalled();
  });

  it("hace rollback y responde 500 si la BD falla", async () => {
    conn.query.mockRejectedValue(new Error("DB boom"));

    const res = await request(app)
      .post("/api/pedidos/confirmar-pago")
      .set("Authorization", `Bearer ${token}`)
      .send({ direccion_envio: "Calle 1 # 2-3", metodo_pago: "pse" });

    expect(res.status).toBe(500);
    expect(conn.rollback).toHaveBeenCalled();
  });
});

describe("PATCH /api/pedidos/:id/estado (RF122/RF124 - por linea, un nivel)", () => {
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
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      return [[], undefined];
    });
  });

  it("rechaza sin token (401)", async () => {
    const res = await request(app).patch("/api/pedidos/5/estado").send({ estado: "En camino" });
    expect(res.status).toBe(401);
  });

  it("rechaza a un comprador (403 - requireRoles)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "comprador" }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/pedidos/5/estado")
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "En camino" });
    expect(res.status).toBe(403);
  });

  it("avanza UN nivel las lineas del vendedor autenticado (200)", async () => {
    conn.query.mockImplementation((sql) => {
      if (sql.includes("SELECT id, estado_envio")) {
        return [[{ id: 10, estado_envio: "Pendiente" }], undefined];
      }
      if (sql.includes("UPDATE detalle_pedidos SET estado_envio")) return [{ affectedRows: 1 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/pedidos/5/estado")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .send({ estado: "En camino" });

    expect(res.status).toBe(200);
    expect(res.body.data.estado_envio).toBe("En camino");
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE pedido_id = ? AND vendedor_id = ?"),
      [5, 3]
    );
    expect(conn.commit).toHaveBeenCalled();
  });

  it("rechaza saltar niveles (Pendiente -> Entregado) con 409", async () => {
    conn.query.mockImplementation((sql) => {
      if (sql.includes("SELECT id, estado_envio")) {
        return [[{ id: 10, estado_envio: "Pendiente" }], undefined];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/pedidos/5/estado")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .send({ estado: "Entregado" });

    expect(res.status).toBe(409);
    expect(conn.rollback).toHaveBeenCalled();
  });

  it("devuelve 404 si el vendedor no tiene envios en el pedido", async () => {
    conn.query.mockImplementation((sql) => {
      if (sql.includes("SELECT id, estado_envio")) return [[], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/pedidos/5/estado")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .send({ estado: "En camino" });

    expect(res.status).toBe(404);
  });
});
