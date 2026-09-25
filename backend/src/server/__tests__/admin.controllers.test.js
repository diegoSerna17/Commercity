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

const tokenAdmin = jwt.sign(
  { id: 1, email: "admin@test.com" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);
const tokenComprador = jwt.sign(
  { id: 7, email: "comprador@test.com" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);

beforeEach(() => {
    vi.clearAllMocks();
    // Default: auth OK (blacklist vacia) + rol administrador + usuario activo
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      return [[], undefined];
    });
  });

describe("GET /api/admin/stats (RF55-RF59 + fix 4.5)", () => {
  it("rechaza sin token (401)", async () => {
    const res = await request(app).get("/api/admin/stats");
    expect(res.status).toBe(401);
  });

  it("rechaza a un comprador (403 - solo admin)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "comprador" }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(res.status).toBe(403);
  });

  it("devuelve las estadisticas y excluye lineas canceladas de las comisiones", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("ur.usuario_id = ?")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("COUNT(DISTINCT ur.usuario_id)")) {
        return [[{ totalVendedores: 4, totalCompradores: 12, totalProductos: 20, totalComisiones: 500000 }], undefined];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalComisiones).toBe(500000);
    // Fix 4.5: la consulta de comisiones excluye cancelados
    const consulta = pool.query.mock.calls.find(([sql]) => sql.includes("totalComisiones"));
    expect(consulta[0]).toContain("estado_envio <> 'Cancelado'");
  });
});

describe("GET /api/admin/usuarios y productos (RF67/RF68)", () => {
  it("lista usuarios con rol y estado", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("GROUP BY u.id")) {
        return [[{ id: 2, nombre_completo: "Juan", email: "juan@test.com", activo: 1, roles: "vendedor" }], undefined];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/admin/usuarios")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].rol).toBe("Vendedor");
    expect(res.body.data[0].estado).toBe("activo");
  });

  it("fix 4.4: lista TODOS los productos, incluidos los suspendidos", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("FROM productos p")) {
        return [
          [
            { id: 1, nombre: "TV", precio: 1000000, eliminado_por_admin: 0, vendedor: "A" },
            { id: 2, nombre: "Celular", precio: 2000000, eliminado_por_admin: 1, vendedor: "B" },
          ],
          undefined,
        ];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/admin/productos")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[1].suspendido).toBe(true);
  });

  it("fix 4.4: restaura un producto suspendido", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("UPDATE productos SET eliminado_por_admin = 0")) return [{ affectedRows: 1 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/admin/productos/2/restaurar")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe("activo");
  });

  it("suspende un producto con borrado logico (RF72)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("SET eliminado_por_admin = 1")) return [{ affectedRows: 1 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .delete("/api/admin/productos/1")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    const consulta = pool.query.mock.calls.find(([sql]) => sql.includes("SET eliminado_por_admin = 1"));
    expect(consulta[0]).not.toContain("DELETE FROM productos");
  });
});

describe("PATCH /api/admin/usuarios/:id/estado (RF73/RF74 - baneo)", () => {
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
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      return [[], undefined];
    });
    conn.query.mockImplementation((sql) => {
      if (sql.includes("UPDATE productos SET eliminado_por_admin = 1")) return [{ affectedRows: 2 }, undefined];
      if (sql.includes("UPDATE usuarios SET activo = 0")) return [{ affectedRows: 1 }, undefined];
      if (sql.includes("FOR UPDATE")) return [[], undefined];
      if (sql.includes("estado_envio <> 'Cancelado'")) return [[{ total: 0 }], undefined];
      return [[], undefined];
    });
  });

  it("banea en UNA transaccion: suspende productos, activo=0 y destino de pedidos", async () => {
    const res = await request(app)
      .patch("/api/admin/usuarios/2/estado")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ estado: "baneado" });

    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe("baneado");
    expect(res.body.data.motivo.suspendidos).toBe(2);
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE productos SET eliminado_por_admin = 1"),
      [2]
    );
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE usuarios SET activo = 0"),
      [2]
    );
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.rollback).not.toHaveBeenCalled();
  });

  it("B-R5: cancela lineas Pendiente, completa En camino y reembolsa si el pedido queda vacio", async () => {
    conn.query.mockImplementation((sql) => {
      if (sql.includes("UPDATE productos SET eliminado_por_admin = 1")) return [{ affectedRows: 1 }, undefined];
      if (sql.includes("UPDATE usuarios SET activo = 0")) return [{ affectedRows: 1 }, undefined];
      if (sql.includes("FOR UPDATE")) {
        return [
          [
            { id: 10, producto_id: 3, cantidad: 2, estado_envio: "Pendiente", pedido_id: 4, stock_actual: 5 },
            { id: 11, producto_id: 5, cantidad: 1, estado_envio: "En camino", pedido_id: 5, stock_actual: 3 },
          ],
          undefined,
        ];
      }
      if (sql.includes("estado_envio <> 'Cancelado'")) return [[{ total: 0 }], undefined];
      if (sql.includes("UPDATE pagos_simulados SET estado = 'Reembolsado'")) return [{ affectedRows: 1 }, undefined];
      if (sql.includes("estado_pago_vendedor = 'Desembolsado'")) return [{ affectedRows: 1 }, undefined];
      return [{ affectedRows: 1 }, undefined];
    });

    const res = await request(app)
      .patch("/api/admin/usuarios/2/estado")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ estado: "baneado" });

    expect(res.status).toBe(200);
    expect(res.body.data.motivo.cancelados).toBe(1);
    expect(res.body.data.motivo.completados).toBe(1);
    // RF74: el pago del pedido 4 (quedo sin lineas activas) pasa a Reembolsado
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE pagos_simulados SET estado = 'Reembolsado'"),
      [4]
    );
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE productos SET stock = stock + ?"),
      [2, 3]
    );
  });

  it("devuelve 404 si el usuario a banear no existe", async () => {
    conn.query.mockImplementation((sql) => {
      if (sql.includes("UPDATE productos SET eliminado_por_admin = 1")) return [{ affectedRows: 0 }, undefined];
      if (sql.includes("UPDATE usuarios SET activo = 0")) return [{ affectedRows: 0 }, undefined];
      return [{ affectedRows: 0 }, undefined];
    });

    const res = await request(app)
      .patch("/api/admin/usuarios/99/estado")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ estado: "baneado" });

    expect(res.status).toBe(404);
    expect(conn.rollback).toHaveBeenCalled();
  });

  it("rechaza estado invalido (400)", async () => {
    const res = await request(app)
      .patch("/api/admin/usuarios/2/estado")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ estado: "superadmin" });

    expect(res.status).toBe(400);
    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  it("devuelve 404 al reactivar un usuario inexistente", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("UPDATE usuarios SET activo = 1")) return [{ affectedRows: 0 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/admin/usuarios/99/estado")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ estado: "activo" });

    expect(res.status).toBe(404);
  });

  it("reactiva sin restaurar productos suspendidos (RF74)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("UPDATE usuarios SET activo = 1")) return [{ affectedRows: 1 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/admin/usuarios/2/estado")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ estado: "activo" });

    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe("activo");
    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  it("hace rollback si falla la BD (500)", async () => {
    conn.query.mockRejectedValue(new Error("DB boom"));

    const res = await request(app)
      .patch("/api/admin/usuarios/2/estado")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ estado: "baneado" });

    expect(res.status).toBe(500);
    expect(conn.rollback).toHaveBeenCalled();
  });
});

describe("DELETE /api/admin/usuarios/:id (B-R4 - nunca borrado fisico)", () => {
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
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      return [[], undefined];
    });
    conn.query.mockImplementation((sql) => {
      if (sql.includes("UPDATE productos SET eliminado_por_admin = 1")) return [{ affectedRows: 1 }, undefined];
      if (sql.includes("UPDATE usuarios SET activo = 0")) return [{ affectedRows: 1 }, undefined];
      if (sql.includes("FOR UPDATE")) return [[], undefined];
      if (sql.includes("estado_envio <> 'Cancelado'")) return [[{ total: 0 }], undefined];
      return [{ affectedRows: 1 }, undefined];
    });
  });

  it("desactiva logicamente sin ejecutar DELETE FROM usuarios", async () => {
    const res = await request(app)
      .delete("/api/admin/usuarios/2")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe("baneado");
    expect(conn.query).not.toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM usuarios"),
      expect.anything()
    );
    expect(conn.commit).toHaveBeenCalled();
  });
});

describe("Reportes admin (RF60-RF66 + fix 4.2)", () => {
  it("lista reportes mapeados", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("FROM reportes r")) {
        return [
          [
            { id: 1, tipo_reporte: "Producto", motivo: "falso", evidencia_url: "a.jpg", estado_reporte: "Pendiente", respuesta_admin: null, fecha_reporte: "2026-08-08", producto_id: 3, usuario_reportado_id: null, producto_nombre: "TV", producto_precio: "1000000", producto_vendedor: "A", usuario_reportado_nombre: null, usuario_reportado_email: null, informante_nombre: "Juan", informante_email: "juan@test.com" },
          ],
          undefined,
        ];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/admin/reportes")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].tipo).toBe("producto");
    expect(res.body.data[0].estado).toBe("pendiente");
  });

  it("fix 4.2: archiva el reporte (UPDATE archivado=1, nunca DELETE)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("UPDATE reportes SET archivado = 1")) return [{ affectedRows: 1 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .delete("/api/admin/reportes/1")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    const consulta = pool.query.mock.calls.find(([sql]) => sql.includes("archivado = 1"));
    expect(consulta).toBeTruthy();
    expect(pool.query).not.toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM reportes"),
      expect.anything()
    );
  });

  it("resuelve un reporte pendiente con respuesta", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("SET estado_reporte = 'Resuelto'")) return [{ affectedRows: 1 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/admin/reportes/1/resolver")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ respuesta: "Revisado y procede." });

    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe("resuelto");
  });

  it("rechaza resolver sin respuesta (400)", async () => {
    const res = await request(app)
      .patch("/api/admin/reportes/1/resolver")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ respuesta: "" });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/admin/busqueda (RF69-RF71)", () => {
  it("cae al fallback LIKE si no existe el indice FULLTEXT", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("MATCH(")) throw new Error("no index");
      if (sql.includes("u.nombre_completo LIKE ?")) {
        return [[{ id: 2, nombre_completo: "Juan", email: "juan@test.com", activo: 1, roles: "vendedor" }], undefined];
      }
      if (sql.includes("p.nombre LIKE ?")) {
        return [[{ id: 1, nombre: "TV", precio: 1000000, vendedor: "A" }], undefined];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/admin/busqueda?q=tv")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.usuarios).toHaveLength(1);
    expect(res.body.data.productos).toHaveLength(1);
  });

  it("busca solo productos con scope=producto", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("MATCH(")) throw new Error("no index");
      if (sql.includes("p.nombre LIKE ?")) return [[{ id: 1, nombre: "TV", precio: 1000000, vendedor: "A" }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/admin/busqueda?q=tv&scope=producto")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.productos).toHaveLength(1);
    expect(res.body.data.usuarios).toHaveLength(0);
  });

  it("responde listado vacio si no hay query", async () => {
    const res = await request(app)
      .get("/api/admin/busqueda")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ usuarios: [], productos: [] });
  });
});

describe("Casos borde admin (cobertura de 404 y filtros)", () => {
  it("stats: 500 si la BD falla", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("ur.usuario_id = ?")) return [[{ nombre: "administrador" }], undefined];
      throw new Error("BD caida");
    });

    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(500);
  });

  it("getProductos aplica filtro q y soloActivos", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("FROM productos p")) {
        return [[{ id: 1, nombre: "TV", precio: 1000000, eliminado_por_admin: 0, vendedor: "A" }], undefined];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/admin/productos?q=tv&soloActivos=true")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    const consulta = pool.query.mock.calls.find(([sql]) => sql.includes("FROM productos p"));
    expect(consulta[0]).toContain("WHERE p.eliminado_por_admin = 0");
    expect(consulta[1]).toEqual(["%tv%", "%tv%"]);
  });

  it("suspender producto inexistente -> 404", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("SET eliminado_por_admin = 1")) return [{ affectedRows: 0 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .delete("/api/admin/productos/99")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(404);
  });

  it("restaurar producto no suspendido -> 404", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("SET eliminado_por_admin = 0")) return [{ affectedRows: 0 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/admin/productos/1/restaurar")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(404);
  });

  it("getUsuarios aplica filtro q", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("GROUP BY u.id")) {
        return [[{ id: 2, nombre_completo: "Juan", email: "juan@test.com", activo: 0, roles: "comprador" }], undefined];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/admin/usuarios?q=juan")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].estado).toBe("baneado");
  });

  it("getReporte inexistente -> 404", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/admin/reportes/99")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(404);
  });

  it("archivar reporte inexistente -> 404", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("archivado = 1")) return [{ affectedRows: 0 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .delete("/api/admin/reportes/99")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(404);
  });

  it("resolver reporte ya resuelto -> 404", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("SET estado_reporte = 'Resuelto'")) return [{ affectedRows: 0 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/admin/reportes/1/resolver")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ respuesta: "Ya revisado." });
    expect(res.status).toBe(404);
  });

  it("lista reportes de tipo Usuario (mapeo alterno)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("FROM reportes r")) {
        return [
          [
            { id: 2, tipo_reporte: "Usuario", motivo: "spam", evidencia_url: null, estado_reporte: "Resuelto", respuesta_admin: "ok", fecha_reporte: null, producto_id: null, usuario_reportado_id: 9, producto_nombre: null, producto_precio: null, producto_vendedor: null, usuario_reportado_nombre: "Pedro", usuario_reportado_email: "pedro@test.com", informante_nombre: "Ana", informante_email: "ana@test.com" },
          ],
          undefined,
        ];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/admin/reportes")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].tipo).toBe("usuario");
    expect(res.body.data[0].reportado).toBe("Pedro");
    expect(res.body.data[0].estado).toBe("resuelto");
    expect(res.body.data[0].evidencias).toBe(0);
  });

  it("rechaza filtro de estado invalido en reportes (400)", async () => {
    const res = await request(app)
      .get("/api/admin/reportes?estado=borrado")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(400);
  });

  it("busca solo usuarios con scope=usuario", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      if (sql.includes("MATCH(")) throw new Error("no index");
      if (sql.includes("u.nombre_completo LIKE ?")) {
        return [[{ id: 2, nombre_completo: "Juan", email: "juan@test.com", activo: 1, roles: "vendedor" }], undefined];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/admin/busqueda?q=juan&scope=usuario")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.usuarios).toHaveLength(1);
    expect(res.body.data.productos).toHaveLength(0);
  });

  it("baneo: 500 si la BD falla dentro de la transaccion", async () => {
    const conn2 = {
      query: vi.fn().mockRejectedValue(new Error("DB boom")),
      beginTransaction: vi.fn().mockResolvedValue(),
      commit: vi.fn(),
      rollback: vi.fn().mockResolvedValue(),
      release: vi.fn(),
    };
    pool.getConnection.mockResolvedValue(conn2);
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .patch("/api/admin/usuarios/2/estado")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ estado: "baneado" });

    expect(res.status).toBe(500);
    expect(conn2.rollback).toHaveBeenCalled();
  });

  it("eliminar usuario inexistente -> 404", async () => {
    const conn3 = {
      query: vi.fn().mockResolvedValue([{ affectedRows: 0 }, undefined]),
      beginTransaction: vi.fn().mockResolvedValue(),
      commit: vi.fn(),
      rollback: vi.fn().mockResolvedValue(),
      release: vi.fn(),
    };
    pool.getConnection.mockResolvedValue(conn3);
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("SELECT activo FROM usuarios")) return [[{ activo: 1 }], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "administrador" }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .delete("/api/admin/usuarios/99")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(404);
    expect(conn3.rollback).toHaveBeenCalled();
  });
});
