import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// Cobertura de ramas de error/filtros que quedaron sin ejercitar (CON-004).
// Mock del pool con el mismo patron envoltorio que el resto de la suite.
vi.mock("mysql2/promise", () => {
  const queryInterna = vi.fn();
  const query = vi.fn((sql, ...resto) => {
    if (typeof sql === "string" && sql.includes("tokens_invalidados") && !sql.includes("AS revocado")) {
      return Promise.resolve([[], undefined]);
    }
    if (typeof sql === "string" && sql.includes("AS revocado")) {
      return Promise.resolve([[{ activo: 1, token_version: 0, revocado: 0 }], undefined]);
    }
    return queryInterna(sql, ...resto);
  });
  query.mockImplementation = (fn) => { queryInterna.mockImplementation(fn); return query; };
  query.mockImplementationOnce = (fn) => { queryInterna.mockImplementationOnce(fn); return query; };
  query.mockResolvedValue = (valor) => { queryInterna.mockResolvedValue(valor); return query; };
  query.mockRejectedValue = (error) => { queryInterna.mockRejectedValue(error); return query; };
  const conn = {
    query: vi.fn(),
    beginTransaction: vi.fn().mockResolvedValue(),
    commit: vi.fn().mockResolvedValue(),
    rollback: vi.fn().mockResolvedValue(),
    release: vi.fn().mockResolvedValue(),
  };
  const pool = { query, getConnection: vi.fn().mockResolvedValue(conn) };
  return {
    __esModule: true,
    default: { createPool: vi.fn(() => pool) },
    __pool: pool,
    __conn: conn,
  };
});

process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto_test";

const IMAGEN_JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(24)]);

const { __pool: pool, __conn: conn } = await import("mysql2/promise");
const { default: app } = await import("../app.js");

const tokenVendedor = jwt.sign(
  { id: 3, email: "vendedor@test.com", token_version: 0 },
  process.env.JWT_SECRET,
  { issuer: "commercity-api", audience: "commercity-clients", expiresIn: "1h" }
);
const tokenComprador = jwt.sign(
  { id: 7, email: "comprador@test.com", token_version: 0 },
  process.env.JWT_SECRET,
  { issuer: "commercity-api", audience: "commercity-clients", expiresIn: "1h" }
);
const tokenAdmin = jwt.sign(
  { id: 1, email: "admin@test.com", token_version: 0 },
  process.env.JWT_SECRET,
  { issuer: "commercity-api", audience: "commercity-clients", expiresIn: "1h" }
);

/** Mock base: rol vendedor+administrador y el resto delegado al handler. */
const mockConRoles = (handler = () => [[], undefined]) =>
  pool.query.mockImplementation((sql, ...resto) => {
    if (typeof sql === "string" && sql.includes("FROM usuario_roles")) {
      return [[{ nombre: "vendedor" }, { nombre: "administrador" }], undefined];
    }
    return handler(sql, ...resto);
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockConRoles();
});

describe("GET /api/productos: filtro por vendedor_id (M-20)", () => {
  it("rechaza vendedor_id no entero positivo (400)", async () => {
    const res = await request(app).get("/api/productos?vendedor_id=abc");

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("vendedor_id");
  });

  it("aplica el filtro exacto p.vendedor_id = ? cuando es valido", async () => {
    mockConRoles((sql) =>
      typeof sql === "string" && sql.includes("COUNT(*)") ? [[{ total: 0 }], undefined] : [[], undefined]
    );

    const res = await request(app).get("/api/productos?vendedor_id=3");

    expect(res.status).toBe(200);
    const consulta = pool.query.mock.calls.find(([sql]) => String(sql).includes("COUNT(*)"));
    expect(consulta[0]).toContain("p.vendedor_id = ?");
    expect(consulta[1]).toContain(3);
  });
});

describe("Subidas: ramas de validacion (TASK-4.6)", () => {
  it("rechaza un archivo con extension/MIME no permitidos (400 UPLOAD_INVALIDO)", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .field("nombre", "Doc")
      .field("descripcion", "Desc")
      .field("precio", "1000")
      .field("stock", "1")
      .field("categoria", "Tecnologia")
      .attach("imagen", Buffer.from("soy-un-txt"), "notas.txt");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("UPLOAD_INVALIDO");
  });

  it("crear sin campos requeridos borra la imagen ya escrita (400 y sin huerfanos)", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .field("precio", "1000")
      .attach("imagen", IMAGEN_JPEG, "foto.jpg");

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("Faltan campos requeridos");
  });

  it("crear sin precio/stock con imagen -> 400", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .field("nombre", "Sin precio")
      .field("descripcion", "Desc")
      .field("categoria", "Tecnologia")
      .attach("imagen", IMAGEN_JPEG, "foto.jpg");

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("precio");
  });

  it("editar con id invalido y imagen -> 400 (limpia el archivo)", async () => {
    const res = await request(app)
      .put("/api/productos/abc")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .field("nombre", "X")
      .attach("imagen", IMAGEN_JPEG, "foto.jpg");

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("ID inválido");
  });

  it("editar un producto ajeno/inexistente con imagen -> 404 (limpia el archivo)", async () => {
    mockConRoles(() => [[], undefined]);

    const res = await request(app)
      .put("/api/productos/99")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .field("nombre", "X")
      .attach("imagen", IMAGEN_JPEG, "foto.jpg");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("editar con descuento invalido y imagen -> 400", async () => {
    mockConRoles((sql) =>
      typeof sql === "string" && sql.includes("FROM productos")
        ? [[{ id: 1, categoria_id: 2, imagen_url: "/uploads/x.jpg", vendedor_id: 3, nombre: "A", descripcion: "B", precio: 10, stock: 1, descuento_porcentaje: 0 }], undefined]
        : [[], undefined]
    );

    const res = await request(app)
      .put("/api/productos/1")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .field("descuento", "150")
      .attach("imagen", IMAGEN_JPEG, "foto.jpg");

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/descuento/i);
  });

  it("TASK-4.6: limita las subidas por usuario fuera de test (429 en la 21)", async () => {
    const { subirImagen } = await import("../config/multer.js");
    const [limitar] = subirImagen("imagen");
    const anterior = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      const req = { userId: 987654 };
      let ultimoStatus = null;
      for (let i = 0; i < 21; i += 1) {
        const res = {
          status(code) { ultimoStatus = code; return this; },
          json() { return this; },
        };
        limitar(req, res, () => { ultimoStatus = null; });
      }
      expect(ultimoStatus).toBe(429);
    } finally {
      process.env.NODE_ENV = anterior;
    }
  });
});

describe("Chat: ramas de validacion y error", () => {
  it("obtener conversacion con id no numerico -> 400", async () => {
    const res = await request(app)
      .get("/api/chat/mensajes/abc")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(res.status).toBe(400);
  });

  it("marcar leido con id no numerico -> 400", async () => {
    const res = await request(app)
      .patch("/api/chat/mensajes/abc/leido")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(res.status).toBe(400);
  });

  it("marcar leido un mensaje inexistente -> 404", async () => {
    mockConRoles(() => [{ affectedRows: 0 }, undefined]);
    const res = await request(app)
      .patch("/api/chat/mensajes/999/leido")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(res.status).toBe(404);
  });

  it("errores de BD -> 500 en conversaciones, historial y marcar leido", async () => {
    mockConRoles(() => { throw new Error("BD caida"); });

    const conversaciones = await request(app)
      .get("/api/chat/conversaciones")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(conversaciones.status).toBe(500);

    const historial = await request(app)
      .get("/api/chat/mensajes/2")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(historial.status).toBe(500);

    const leido = await request(app)
      .patch("/api/chat/mensajes/5/leido")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(leido.status).toBe(500);
  });
});

describe("Notificaciones: paginacion y error", () => {
  it("acepta limite y pagina validos (200)", async () => {
    mockConRoles((sql) =>
      typeof sql === "string" && sql.includes("COUNT(*)") ? [[{ total: 0 }], undefined] : [[], undefined]
    );

    const res = await request(app)
      .get("/api/notificaciones?limite=5&pagina=3")
      .set("Authorization", `Bearer ${tokenComprador}`);

    expect(res.status).toBe(200);
    expect(res.body.data.pagina).toBe(3);
    expect(res.body.data.por_pagina).toBe(5);
    const listado = pool.query.mock.calls.find(([sql]) => String(sql).includes("LIMIT ? OFFSET ?"));
    expect(listado[1]).toEqual([7, 5, 10]);
  });

  it("rechaza pagina invalida (400)", async () => {
    const res = await request(app)
      .get("/api/notificaciones?pagina=0")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/[Pp]ágina/);
  });

  it("formatea como vacio una fecha invalida", async () => {
    mockConRoles((sql) =>
      typeof sql === "string" && sql.includes("SELECT id, tipo, descripcion")
        ? [[{ id: 1, tipo: "compra", descripcion: "x", estado: "no leido", url_redireccion: null, fecha_hora: "no-es-fecha" }], undefined]
        : [[], undefined]
    );

    const res = await request(app)
      .get("/api/notificaciones")
      .set("Authorization", `Bearer ${tokenComprador}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notificaciones[0].dias_horas).toBe("");
  });

  it("errores de BD -> 500 en marcar-todas, marcar-una, eliminar-una y eliminar-todas", async () => {
    mockConRoles(() => { throw new Error("BD caida"); });

    const todas = await request(app)
      .patch("/api/notificaciones/leidas")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(todas.status).toBe(500);

    const una = await request(app)
      .patch("/api/notificaciones/1/leida")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(una.status).toBe(500);

    const eliminarUna = await request(app)
      .delete("/api/notificaciones/1")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(eliminarUna.status).toBe(500);

    const eliminarTodas = await request(app)
      .delete("/api/notificaciones")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(eliminarTodas.status).toBe(500);
  });
});

describe("Carrito: ramas de error (500)", () => {
  it("eliminar y modificar con la BD caida -> 500", async () => {
    mockConRoles(() => { throw new Error("BD caida"); });

    const eliminar = await request(app)
      .delete("/api/carrito/1")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(eliminar.status).toBe(500);

    const modificarProducto = await request(app)
      .patch("/api/carrito/1")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ cantidad: 2 });
    expect(modificarProducto.status).toBe(500);

    const listar = await request(app)
      .get("/api/carrito")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(listar.status).toBe(500);
  });
});

describe("Admin: filtros de productos", () => {
  it("lista productos con busqueda q (LIKE escapado)", async () => {
    mockConRoles((sql) =>
      typeof sql === "string" && sql.includes("FROM productos p") ? [[], undefined] : [[], undefined]
    );

    const res = await request(app)
      .get("/api/admin/productos?q=tv")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    const consulta = pool.query.mock.calls.find(([sql]) => String(sql).includes("FROM productos p"));
    expect(consulta[0]).toContain("LIKE ?");
    expect(consulta[1]).toEqual(["%tv%", "%tv%"]);
  });
});
