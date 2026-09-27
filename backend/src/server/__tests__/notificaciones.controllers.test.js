import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// Mock del pool MySQL (sin BD real) - cubre authRequired y el controller.
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
  { id: 8, email: "camila.torres@commercity.com" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);

// authRequired solo consulta la lista negra de tokens.
function mockAuth() {
  pool.query.mockImplementation((sql) => {
    if (sql.includes("tokens_invalidados")) return [[], undefined];
    return [[], undefined];
  });
}

const filaNotificacion = (sobre = {}) => ({
  id: 1,
  tipo: "compra",
  descripcion: "Tu pedido #5 ha sido confirmado y está en preparación.",
  estado: "no leido",
  url_redireccion: "/history",
  fecha_hora: new Date(),
  ...sobre,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth();
});

describe("Notificaciones (RF99-RF104) - autenticacion (401)", () => {
  it("GET /api/notificaciones sin token -> 401", async () => {
    const res = await request(app).get("/api/notificaciones");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/notificaciones/no-leidas sin token -> 401", async () => {
    const res = await request(app).get("/api/notificaciones/no-leidas");
    expect(res.status).toBe(401);
  });

  it("PATCH /api/notificaciones/1/leida sin token -> 401", async () => {
    const res = await request(app).patch("/api/notificaciones/1/leida");
    expect(res.status).toBe(401);
  });

  it("PATCH /api/notificaciones/leidas sin token -> 401", async () => {
    const res = await request(app).patch("/api/notificaciones/leidas");
    expect(res.status).toBe(401);
  });

  it("DELETE /api/notificaciones/1 sin token -> 401", async () => {
    const res = await request(app).delete("/api/notificaciones/1");
    expect(res.status).toBe(401);
  });

  it("DELETE /api/notificaciones sin token -> 401", async () => {
    const res = await request(app).delete("/api/notificaciones");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/notificaciones (RF100/RF101) - listado", () => {
  it("lista las notificaciones del usuario con shape RF101 (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      return [
        [
          filaNotificacion({ id: 3, tipo: "en camino", descripcion: "Tu pedido #5 está en camino." }),
          filaNotificacion({ id: 2, tipo: "mensajes", descripcion: "Tienes un nuevo mensaje.", url_redireccion: "/messages/chat" }),
          filaNotificacion({ id: 1, estado: "leido" }),
        ],
        undefined,
      ];
    });

    const res = await request(app)
      .get("/api/notificaciones")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(3);
    expect(res.body.data.notificaciones[0].id).toBe(3);
    // Shape RF101: tipo, descripcion, dias/hora, url_redireccion
    expect(res.body.data.notificaciones[0]).toMatchObject({
      tipo: "en camino",
      descripcion: "Tu pedido #5 está en camino.",
      url_redireccion: "/history",
      leida: false,
    });
    expect(res.body.data.notificaciones[0]).toHaveProperty("dias_horas");
    expect(res.body.data.notificaciones[0]).toHaveProperty("fecha_hora");
    // la fila 1 tiene estado 'leido' -> leida true
    expect(res.body.data.notificaciones[2].leida).toBe(true);
  });

  it("aplica filtro por tipo en la consulta (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      return [[filaNotificacion({ tipo: "reporte" })], undefined];
    });

    const res = await request(app)
      .get("/api/notificaciones?tipo=reporte")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notificaciones).toHaveLength(1);
    // la query debe filtrar por tipo y por usuario
    const llamada = pool.query.mock.calls.find(([sql]) => sql.includes("FROM notificaciones"));
    expect(llamada[0]).toContain("usuario_id = ?");
    expect(llamada[0]).toContain("tipo = ?");
    expect(llamada[1]).toEqual([8, "reporte", 50]);
  });

  it("rechaza tipo de filtro invalido (400)", async () => {
    const res = await request(app)
      .get("/api/notificaciones?tipo=descuento")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza limite fuera de rango (400)", async () => {
    const res = await request(app)
      .get("/api/notificaciones?limite=1000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("calcula dias/hora relativo para notificaciones (RF101)", async () => {
    const hace3Dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const hace2Horas = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const hace30Min = new Date(Date.now() - 30 * 60 * 1000);
    const fechaFutura = new Date(Date.now() + 5 * 60 * 1000);
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      return [
        [
          filaNotificacion({ id: 4, fecha_hora: hace3Dias }),
          filaNotificacion({ id: 3, fecha_hora: hace2Horas }),
          filaNotificacion({ id: 2, fecha_hora: hace30Min }),
          filaNotificacion({ id: 1, fecha_hora: fechaFutura }),
        ],
        undefined,
      ];
    });

    const res = await request(app)
      .get("/api/notificaciones")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notificaciones[0].dias_horas).toBe("Hace 3 días");
    expect(res.body.data.notificaciones[1].dias_horas).toBe("Hace 2 h");
    expect(res.body.data.notificaciones[2].dias_horas).toBe("Hace 30 min");
    expect(res.body.data.notificaciones[3].dias_horas).toBe("Recién");
  });

  it("devuelve 500 estandar si la BD falla", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      throw new Error("BD caida");
    });

    const res = await request(app)
      .get("/api/notificaciones")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("GET /api/notificaciones/no-leidas (RF104) - indicador", () => {
  it("devuelve el total de no leidas del usuario (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      return [[{ total: 7 }], undefined];
    });

    const res = await request(app)
      .get("/api/notificaciones/no-leidas")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.total_no_leidas).toBe(7);
  });

  it("devuelve 0 cuando no hay no leidas", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      return [[{ total: 0 }], undefined];
    });

    const res = await request(app)
      .get("/api/notificaciones/no-leidas")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total_no_leidas).toBe(0);
  });

  it("devuelve 0 si la BD no devuelve filas (fallback)", async () => {
    // El pool de auth ya responde [[], undefined] para todo: cubre el ?? 0.
    const res = await request(app)
      .get("/api/notificaciones/no-leidas")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total_no_leidas).toBe(0);
  });

  it("devuelve 500 estandar si la BD falla", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      throw new Error("BD caida");
    });

    const res = await request(app)
      .get("/api/notificaciones/no-leidas")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("Marcar como leida", () => {
  it("PATCH /api/notificaciones/1/leida marca la notificacion (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      return [{ affectedRows: 1 }, undefined];
    });

    const res = await request(app)
      .patch("/api/notificaciones/1/leida")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const llamada = pool.query.mock.calls.find(([sql]) => sql.includes("UPDATE notificaciones"));
    expect(llamada[0]).toContain("id = ? AND usuario_id = ?");
    expect(llamada[1]).toEqual(["leido", 1, 8]);
  });

  it("PATCH devuelve 404 si no existe o no pertenece al usuario", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      return [{ affectedRows: 0 }, undefined];
    });

    const res = await request(app)
      .patch("/api/notificaciones/999/leida")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("PATCH rechaza id no numerico (400)", async () => {
    const res = await request(app)
      .patch("/api/notificaciones/abc/leida")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("PATCH /api/notificaciones/leidas marca todas (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      return [{ affectedRows: 5 }, undefined];
    });

    const res = await request(app)
      .patch("/api/notificaciones/leidas")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.actualizadas).toBe(5);
    const llamada = pool.query.mock.calls.find(([sql]) => sql.includes("UPDATE notificaciones"));
    expect(llamada[0]).toContain("usuario_id = ? AND estado = ?");
  });
});

describe("Eliminar notificaciones (RF102)", () => {
  it("DELETE /api/notificaciones/1 elimina una notificacion (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      return [{ affectedRows: 1 }, undefined];
    });

    const res = await request(app)
      .delete("/api/notificaciones/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const llamada = pool.query.mock.calls.find(([sql]) => sql.includes("DELETE FROM notificaciones"));
    expect(llamada[0]).toContain("id = ? AND usuario_id = ?");
    expect(llamada[1]).toEqual([1, 8]);
  });

  it("DELETE devuelve 404 si no existe o no pertenece al usuario", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      return [{ affectedRows: 0 }, undefined];
    });

    const res = await request(app)
      .delete("/api/notificaciones/999")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("DELETE /api/notificaciones limpia todas (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      return [{ affectedRows: 12 }, undefined];
    });

    const res = await request(app)
      .delete("/api/notificaciones")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.eliminadas).toBe(12);
    const llamada = pool.query.mock.calls.find(([sql]) => sql.includes("DELETE FROM notificaciones"));
    expect(llamada[1]).toEqual([8]);
  });
});

describe("Registro por eventos (RF101/RF103)", () => {
  it("confirmarPago registra notificacion de compra al comprador", async () => {
    const { confirmarPago } = await import("../controllers/pedidos.controllers.js");
    const conn = {
      query: vi.fn(),
      beginTransaction: vi.fn().mockResolvedValue(),
      commit: vi.fn().mockResolvedValue(),
      rollback: vi.fn().mockResolvedValue(),
      release: vi.fn().mockResolvedValue(),
    };
    conn.query.mockImplementation((sql) => {
      if (sql.includes("FROM carrito_items")) {
        return [[{ producto_id: 1, cantidad: 1, nombre: "TV", precio: 1000000, descuento_porcentaje: 0, vendedor_id: 3, stock: 5 }], undefined];
      }
      if (sql.includes("FOR UPDATE")) return [[{ id: 1, vendedor_id: 3, stock: 5, eliminado_por_admin: 0 }], undefined];
      if (sql.includes("INSERT INTO pedidos")) return [{ insertId: 5 }, undefined];
      if (sql.includes("INSERT INTO detalle_pedidos")) return [{ affectedRows: 1 }, undefined];
      if (sql.includes("UPDATE productos")) return [{ affectedRows: 1 }, undefined];
      if (sql.includes("INSERT INTO pagos_simulados")) return [{ insertId: 9 }, undefined];
      if (sql.includes("DELETE FROM carrito_items")) return [{ affectedRows: 1 }, undefined];
      return [[], undefined];
    });
    pool.getConnection.mockResolvedValue(conn);

    const res = await request(app)
      .post("/api/pedidos/confirmar-pago")
      .set("Authorization", `Bearer ${token}`)
      .send({ direccion_envio: "Calle 1 # 2-3", metodo_pago: "pse" });

    expect(res.status).toBe(201);
    const notifCall = conn.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO notificaciones"));
    expect(notifCall).toBeDefined();
    expect(notifCall[1]).toEqual([8, "compra", expect.stringContaining("#5"), "/history", "no leido"]);
  });

  it("actualizarEstado registra notificacion de envio/entregado al comprador", async () => {
    const { actualizarEstado } = await import("../controllers/pedidos.controllers.js");
    const conn = {
      query: vi.fn(),
      beginTransaction: vi.fn().mockResolvedValue(),
      commit: vi.fn().mockResolvedValue(),
      rollback: vi.fn().mockResolvedValue(),
      release: vi.fn().mockResolvedValue(),
    };
    conn.query.mockImplementation((sql) => {
      if (sql.includes("SELECT id, comprador_id, fecha_pedido FROM pedidos")) {
        return [[{ id: 5, comprador_id: 8, fecha_pedido: new Date() }], undefined];
      }
      if (/SELECT id,\s+estado_envio/.test(sql)) return [[{ id: 10, estado_envio: "Pendiente" }], undefined];
      if (/UPDATE detalle_pedidos\s+SET estado_envio/.test(sql)) return [{ affectedRows: 1 }, undefined];
      if (sql.includes("INSERT INTO notificaciones")) return [{ insertId: 1 }, undefined];
      return [[], undefined];
    });
    pool.getConnection.mockResolvedValue(conn);
    // requireRoles (vendedor): el middleware consulta usuario_roles por el pool.
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      return [[], undefined];
    });

    const tokenVendedor = jwt.sign({ id: 3, email: "vendedor@test.com" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const res = await request(app)
      .patch("/api/pedidos/5/estado")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .send({ estado: "En camino" });

    expect(res.status).toBe(200);
    const notifCall = conn.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO notificaciones"));
    expect(notifCall).toBeDefined();
    expect(notifCall[1]).toEqual([8, "en camino", expect.stringContaining("#5"), "/history", "no leido"]);
  });

  it("un fallo al registrar la notificacion de compra NO rompe el pedido (201)", async () => {
    const conn = {
      query: vi.fn(),
      beginTransaction: vi.fn().mockResolvedValue(),
      commit: vi.fn().mockResolvedValue(),
      rollback: vi.fn().mockResolvedValue(),
      release: vi.fn().mockResolvedValue(),
    };
    conn.query.mockImplementation((sql) => {
      if (sql.includes("INSERT INTO notificaciones")) throw new Error("tabla no existe");
      if (sql.includes("FROM carrito_items")) {
        return [[{ producto_id: 1, cantidad: 1, nombre: "TV", precio: 1000000, descuento_porcentaje: 0, vendedor_id: 3, stock: 5 }], undefined];
      }
      if (sql.includes("FOR UPDATE")) return [[{ id: 1, vendedor_id: 3, stock: 5, eliminado_por_admin: 0 }], undefined];
      if (sql.includes("INSERT INTO pedidos")) return [{ insertId: 5 }, undefined];
      if (sql.includes("INSERT INTO detalle_pedidos")) return [{ affectedRows: 1 }, undefined];
      if (sql.includes("UPDATE productos")) return [{ affectedRows: 1 }, undefined];
      if (sql.includes("INSERT INTO pagos_simulados")) return [{ insertId: 9 }, undefined];
      if (sql.includes("DELETE FROM carrito_items")) return [{ affectedRows: 1 }, undefined];
      return [[], undefined];
    });
    pool.getConnection.mockResolvedValue(conn);

    const res = await request(app)
      .post("/api/pedidos/confirmar-pago")
      .set("Authorization", `Bearer ${token}`)
      .send({ direccion_envio: "Calle 1 # 2-3", metodo_pago: "pse" });

    expect(res.status).toBe(201);
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.rollback).not.toHaveBeenCalled();
  });

  it("un fallo al notificar el cambio de estado NO rompe el update (200)", async () => {
    const conn = {
      query: vi.fn(),
      beginTransaction: vi.fn().mockResolvedValue(),
      commit: vi.fn().mockResolvedValue(),
      rollback: vi.fn().mockResolvedValue(),
      release: vi.fn().mockResolvedValue(),
    };
    conn.query.mockImplementation((sql) => {
      if (sql.includes("SELECT id, comprador_id, fecha_pedido FROM pedidos")) {
        return [[{ id: 5, comprador_id: 8, fecha_pedido: new Date() }], undefined];
      }
      if (/SELECT id,\s+estado_envio/.test(sql)) return [[{ id: 10, estado_envio: "En camino" }], undefined];
      if (/UPDATE detalle_pedidos\s+SET estado_envio/.test(sql)) return [{ affectedRows: 1 }, undefined];
      if (sql.includes("INSERT INTO notificaciones")) throw new Error("BD caida");
      return [[], undefined];
    });
    pool.getConnection.mockResolvedValue(conn);
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      return [[], undefined];
    });

    const tokenVendedor = jwt.sign({ id: 3, email: "vendedor@test.com" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const res = await request(app)
      .patch("/api/pedidos/5/estado")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .send({ estado: "Entregado" });

    expect(res.status).toBe(200);
    expect(res.body.data.estado_envio).toBe("Entregado");
  });
});
