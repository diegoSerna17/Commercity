import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// Mock del pool MySQL (sin BD real).
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
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
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
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
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
    // authRequired (middleware) consulta el pool: lista negra de tokens vacia.
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      return [[], undefined];
    });
    // Flujo feliz del controller: todas las consultas de negocio van por conn.
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
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
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
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
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
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
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
    conn.query.mockImplementation((sql) => {
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      throw new Error("DB boom");
    });

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
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      return [[], undefined];
    });
  });

  it("rechaza sin token (401)", async () => {
    const res = await request(app).patch("/api/pedidos/5/estado").send({ estado: "En camino" });
    expect(res.status).toBe(401);
  });

  it("rechaza a un comprador que intenta avanzar envios (404 - no es vendedor de ninguna linea)", async () => {
    // Nota: requireRoles se eliminó de la ruta; ahora el controller valida por
    // ownership: si estado != Cancelado, se consulta con vendedor_id = token.sub,
    // y un comprador normal no tendra lineas a su nombre en el pedido.
    conn.query.mockImplementation((sql) => {
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("SELECT id, comprador_id, fecha_pedido FROM pedidos")) {
        return [[{ id: 5, comprador_id: 7, fecha_pedido: new Date() }], undefined];
      }
      if (/SELECT id,\s+estado_envio\s+FROM detalle_pedidos/.test(sql)) {
        return [[], undefined]; // el comprador (id=7) no es vendedor de ninguna linea
      }
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/pedidos/5/estado")
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "En camino" });
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/vendedor no tiene envíos|no tiene envios/i);
  });

  it("avanza UN nivel las lineas del vendedor autenticado (200)", async () => {
    conn.query.mockImplementation((sql) => {
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("SELECT id, comprador_id, fecha_pedido FROM pedidos")) {
        return [[{ id: 5, comprador_id: 7, fecha_pedido: new Date() }], undefined];
      }
      if (/SELECT id,\s+estado_envio\s+FROM detalle_pedidos/.test(sql)) {
        return [[{ id: 10, estado_envio: "Pendiente" }], undefined];
      }
      if (/UPDATE detalle_pedidos\s+SET estado_envio/.test(sql)) return [{ affectedRows: 1 }, undefined];
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
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("SELECT id, comprador_id, fecha_pedido FROM pedidos")) {
        return [[{ id: 5, comprador_id: 7, fecha_pedido: new Date() }], undefined];
      }
      if (/SELECT id,\s+estado_envio\s+FROM detalle_pedidos/.test(sql)) {
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
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("SELECT id, comprador_id, fecha_pedido FROM pedidos")) {
        return [[{ id: 5, comprador_id: 7, fecha_pedido: new Date() }], undefined];
      }
      if (/SELECT id,\s+estado_envio\s+FROM detalle_pedidos/.test(sql)) return [[], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/pedidos/5/estado")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .send({ estado: "En camino" });

    expect(res.status).toBe(404);
  });
});

// ============================================================================
// DEF-05 / RF35 — Cancelación de compra por el comprador
// ============================================================================
describe("PATCH /api/pedidos/:id/estado = Cancelado (RF35 - cancelación por comprador)", () => {
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
    // DEF-01: middleware auth debe verificar activo=1 para ambos tokens
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios WHERE id = ?")) {
        return [[{ activo: 1 }], undefined];
      }
      return [[], undefined];
    });
  });

  it("rechaza sin token (401)", async () => {
    const res = await request(app)
      .patch("/api/pedidos/5/estado")
      .send({ estado: "Cancelado" });
    expect(res.status).toBe(401);
  });

  it("rechaza si quien cancela NO es el comprador del pedido (403)", async () => {
    conn.query.mockImplementation((sql) => {
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("SELECT id, comprador_id, fecha_pedido FROM pedidos")) {
        // pedido del comprador 7, pero viene tokenVendedor = 3
        return [[{ id: 5, comprador_id: 7, fecha_pedido: new Date() }], undefined];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/pedidos/5/estado")
      .set("Authorization", `Bearer ${tokenVendedor}`) // 3 ≠ 7
      .send({ estado: "Cancelado" });

    expect(res.status).toBe(403);
    expect(conn.rollback).toHaveBeenCalled();
    expect(res.body.error.message).toMatch(/solo el comprador/i);
  });

it("rechaza (404) si detalle_id no pertenece al pedido", async () => {
    conn.query.mockImplementation((sql) => {
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("SELECT id, comprador_id, fecha_pedido FROM pedidos")) {
        return [[{ id: 5, comprador_id: 7, fecha_pedido: new Date() }], undefined];
      }
      if (/WHERE dp\.id = \? AND dp\.pedido_id = \?/.test(sql)) {
        return [[], undefined]; // detalle no existe / no pertenece
      }
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/pedidos/5/estado")
      .set("Authorization", `Bearer ${token}`) // comprador 7 = owner OK
      .send({ estado: "Cancelado", detalle_id: 999 });

    expect(res.status).toBe(404);
    expect(conn.rollback).toHaveBeenCalled();
  });

it("rechaza (409) cancelar por detalle_id cuando la línea ya está Entregada", async () => {
    conn.query.mockImplementation((sql) => {
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("SELECT id, comprador_id, fecha_pedido FROM pedidos")) {
        return [[{ id: 5, comprador_id: 7, fecha_pedido: new Date() }], undefined];
      }
      if (/WHERE dp\.id = \? AND dp\.pedido_id = \?/.test(sql)) {
        return [[{
          id: 22, cantidad: 2, producto_id: 101, estado_envio: "Entregado",
          vendedor_id: 3, producto_nombre: "Zapatos"
        }], undefined];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/pedidos/5/estado")
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "Cancelado", detalle_id: 22 });

    expect(res.status).toBe(409);
    expect(conn.rollback).toHaveBeenCalled();
    expect(res.body.error.message).toMatch(/Entregado|no se puede cancelar/i);
  });

it("cancelación por detalle_id OK (200): restituye stock, marca línea, notifica", async () => {
    conn.query.mockImplementation((sql) => {
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("SELECT id, comprador_id, fecha_pedido FROM pedidos")) {
        return [[{ id: 5, comprador_id: 7, fecha_pedido: new Date() }], undefined];
      }
      if (/WHERE dp\.id = \? AND dp\.pedido_id = \?/.test(sql)) {
        return [[{
          id: 22, cantidad: 2, producto_id: 101, estado_envio: "Pendiente",
          vendedor_id: 3, producto_nombre: "Zapatos"
        }], undefined];
      }
      if (sql.includes("UPDATE productos SET stock = stock + ?")) {
        return [{ affectedRows: 1 }, undefined];
      }
      if (/UPDATE detalle_pedidos\s+SET estado_envio = 'Cancelado'/.test(sql)) {
        return [{ affectedRows: 1 }, undefined];
      }
      if (sql.includes("COUNT(*) AS total")) {
        // 2 líneas total = 1 Cancelada + 1 Entregada → Parcial
        return [[{ total: 2, entregadas: 1, canceladas: 1 }], undefined];
      }
      if (/UPDATE pagos_simulados\s+SET estado = \?/.test(sql)) {
        return [{ affectedRows: 1 }, undefined];
      }
      if (sql.includes("INSERT INTO notificaciones")) {
        return [{ insertId: 1 }, undefined];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/pedidos/5/estado")
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "Cancelado", detalle_id: 22 });

    expect(res.status).toBe(200);
    expect(res.body.data.tipo).toBe("por_linea");
    expect(res.body.data.lineas_canceladas).toBe(1);
    expect(res.body.data.detalle_ids_cancelados).toEqual([22]);
    expect(res.body.data.estado_pago).toBe("Parcial");
    // Verifica restitución stock
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE productos SET stock = stock + ?"),
      [2, 101]
    );
    // Verifica que se actualice a Parcial (no Reembolsado) por la línea Entregada que queda
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE pagos_simulados\s+SET estado = \?/),
      ["Parcial", 5]
    );
    expect(conn.commit).toHaveBeenCalled();
  });

it("cancelación general OK con mezcla Pendiente + Entregado → Parcial + no_canceladas", async () => {
    conn.query.mockImplementation((sql) => {
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("SELECT id, comprador_id, fecha_pedido FROM pedidos")) {
        return [[{ id: 10, comprador_id: 7, fecha_pedido: new Date() }], undefined];
      }
      if (/FROM detalle_pedidos dp\s+JOIN productos p/.test(sql) && sql.includes("FOR UPDATE") && /WHERE dp\.pedido_id = \?/.test(sql)) {
        return [[
          { id: 1, cantidad: 1, producto_id: 50, estado_envio: "Pendiente",  vendedor_id: 3, producto_nombre: "A" },
          { id: 2, cantidad: 2, producto_id: 51, estado_envio: "En camino", vendedor_id: 4, producto_nombre: "B" },
          { id: 3, cantidad: 1, producto_id: 52, estado_envio: "Entregado", vendedor_id: 3, producto_nombre: "C" },
        ], undefined];
      }
      if (sql.includes("UPDATE productos SET stock = stock + ?")) {
        return [{ affectedRows: 1 }, undefined];
      }
      if (/UPDATE detalle_pedidos\s+SET estado_envio = 'Cancelado'/.test(sql)) {
        return [{ affectedRows: 1 }, undefined];
      }
      if (sql.includes("COUNT(*) AS total")) {
        // 3 total: 2 canceladas, 1 entregada → Parcial
        return [[{ total: 3, entregadas: 1, canceladas: 2 }], undefined];
      }
      if (/UPDATE pagos_simulados\s+SET estado = \?/.test(sql)) {
        return [{ affectedRows: 1 }, undefined];
      }
      if (sql.includes("INSERT INTO notificaciones")) {
        return [{ insertId: 1 }, undefined];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/pedidos/10/estado")
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "Cancelado" });

    expect(res.status).toBe(200);
    expect(res.body.data.tipo).toBe("general");
    expect(res.body.data.lineas_canceladas).toBe(2);
    expect(res.body.data.detalle_ids_cancelados).toEqual([1, 2]);
    expect(res.body.data.no_canceladas).toHaveLength(1);
    expect(res.body.data.no_canceladas[0].detalle_id).toBe(3);
    expect(res.body.data.no_canceladas[0].motivo).toBe("Entregado");
    expect(res.body.data.estado_pago).toBe("Parcial");
    expect(conn.commit).toHaveBeenCalled();
  });

it("cancelación general de pedido TODO Entregado → 409 (ninguna línea cancelable)", async () => {
    conn.query.mockImplementation((sql) => {
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("SELECT id, comprador_id, fecha_pedido FROM pedidos")) {
        return [[{ id: 11, comprador_id: 7, fecha_pedido: new Date() }], undefined];
      }
      if (/FROM detalle_pedidos dp\s+JOIN productos p/.test(sql) && sql.includes("FOR UPDATE") && /WHERE dp\.pedido_id = \?/.test(sql)) {
        return [[
          { id: 5, cantidad: 1, producto_id: 10, estado_envio: "Entregado", vendedor_id: 3, producto_nombre: "X" },
          { id: 6, cantidad: 1, producto_id: 11, estado_envio: "Entregado", vendedor_id: 3, producto_nombre: "Y" },
        ], undefined];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/pedidos/11/estado")
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "Cancelado" });

    expect(res.status).toBe(409);
    expect(conn.rollback).toHaveBeenCalled();
    expect(res.body.error.message).toMatch(/Ninguna línea|todas.*Entregadas/i);
  });

  it("cancelación general TODO el pedido (sin líneas Entregadas) → estado_pago Reembolsado", async () => {
    conn.query.mockImplementation((sql) => {
if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("SELECT id, comprador_id, fecha_pedido FROM pedidos")) {
        return [[{ id: 12, comprador_id: 7, fecha_pedido: new Date() }], undefined];
      }
      if (/FROM detalle_pedidos dp\s+JOIN productos p/.test(sql) && sql.includes("FOR UPDATE") && /WHERE dp\.pedido_id = \?/.test(sql)) {
        return [[
          { id: 7, cantidad: 3, producto_id: 20, estado_envio: "Pendiente", vendedor_id: 4, producto_nombre: "M" },
        ], undefined];
      }
      if (sql.includes("UPDATE productos SET stock = stock + ?")) return [{ affectedRows: 1 }, undefined];
      if (/UPDATE detalle_pedidos\s+SET estado_envio = 'Cancelado'/.test(sql)) return [{ affectedRows: 1 }, undefined];
      if (sql.includes("COUNT(*) AS total")) {
        return [[{ total: 1, entregadas: 0, canceladas: 1 }], undefined]; // todas canceladas
      }
      if (/UPDATE pagos_simulados\s+SET estado = \?/.test(sql)) return [{ affectedRows: 1 }, undefined];
      if (sql.includes("INSERT INTO notificaciones")) return [{ insertId: 1 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/pedidos/12/estado")
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "Cancelado" });

    expect(res.status).toBe(200);
    expect(res.body.data.lineas_canceladas).toBe(1);
    expect(res.body.data.no_canceladas).toEqual([]);
    expect(res.body.data.estado_pago).toBe("Reembolsado");
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE pagos_simulados\s+SET estado = \?/),
      ["Reembolsado", 12]
    );
    expect(conn.commit).toHaveBeenCalled();
  });
});
