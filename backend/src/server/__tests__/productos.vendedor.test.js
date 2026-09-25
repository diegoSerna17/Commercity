import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// Mock del pool MySQL (sin BD real) - cubre authRequired, requireRoles y el controller.
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

const tokenVendedor = jwt.sign(
  { id: 2, email: "juan.giraldo@commercity.com" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);
const tokenComprador = jwt.sign(
  { id: 8, email: "camila.torres@commercity.com" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);

function mockAuth(rol = "vendedor") {
  pool.query.mockImplementation((sql) => {
    if (sql.includes("tokens_invalidados")) return [[], undefined];
    if (sql.includes("FROM usuario_roles")) return [[{ nombre: rol }], undefined];
    return [[], undefined];
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth("vendedor");
});

describe("Gestion de productos del vendedor (RF44-RF49, RF54)", () => {
  it("POST /api/productos sin token -> 401", async () => {
    mockAuth("vendedor");
    const res = await request(app).post("/api/productos");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/productos con token de comprador -> 403 (RBAC)", async () => {
    mockAuth("comprador");
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("POST /api/productos crea con el vendedor del JWT (201) - Fix 4.1", async () => {
    // auth OK + categoria existente + insert producto
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      if (sql.includes("SELECT id FROM categorias")) return [[{ id: 5 }], undefined];
      if (sql.includes("INSERT INTO productos")) return [{ insertId: 999 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .field("nombre", "Producto de prueba")
      .field("descripcion", "Descripcion")
      .field("precio", "25000")
      .field("stock", "10")
      .field("descuento", "0")
      .field("categoria", "Tecnologia")
      .attach("imagen", Buffer.from("imagen-fake"), "foto.jpg");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(999);

    // Fix 4.1: el INSERT usa req.userId (2), nunca un id hardcodeado.
    const insert = pool.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO productos"));
    expect(insert[1][0]).toBe(2); // vendedor_id = id del JWT
    expect(insert[1][5]).toBe(25000); // precio
    expect(insert[1][7]).toBe(0); // descuento
  });

  it("POST /api/productos sin imagen -> 400", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .field("nombre", "Sin imagen")
      .field("descripcion", "Desc")
      .field("precio", "1000")
      .field("stock", "1")
      .field("categoria", "Tecnologia");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/productos con precio invalido -> 400", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .field("nombre", "Mal precio")
      .field("descripcion", "Desc")
      .field("precio", "-5")
      .field("stock", "1")
      .field("categoria", "Tecnologia")
      .attach("imagen", Buffer.from("x"), "foto.jpg");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("PUT /api/productos/:id edita SOLO si el producto es del vendedor (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      if (sql.includes("SELECT id, categoria_id")) {
        return [[{ id: 1, categoria_id: 5, imagen_url: "/uploads/vieja.jpg", vendedor_id: 2 }], undefined];
      }
      if (sql.includes("UPDATE productos")) return [[], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .put("/api/productos/1")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .field("nombre", "Nombre editado")
      .field("precio", "30000");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // La consulta de propiedad filtra por vendedor_id = req.userId
    const select = pool.query.mock.calls.find(([sql]) => sql.includes("SELECT id, categoria_id"));
    expect(select[1]).toEqual([1, 2]);
  });

  it("PUT /api/productos/:id de otro vendedor o inexistente -> 404", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      return [[], undefined]; // el SELECT de propiedad no devuelve filas
    });

    const res = await request(app)
      .put("/api/productos/99")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .field("nombre", "Robado");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("PUT /api/productos/:id con ID invalido -> 400", async () => {
    const res = await request(app)
      .put("/api/productos/abc")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .field("nombre", "x");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("GET /api/productos/mis-productos lista solo los del vendedor (200)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      if (sql.includes("WHERE p.vendedor_id = ?")) {
        return [
          [
            {
              id: 1,
              nombre: "Mi producto",
              descripcion: "d",
              imagen_url: "/uploads/a.jpg",
              precio: "1000.00",
              stock: 3,
              estado: "Disponible",
              descuento_porcentaje: "10.00",
              fecha_publicacion: "2026-01-01T00:00:00.000Z",
              categoria_id: 5,
              categoria_nombre: "Tecnologia",
            },
          ],
          undefined,
        ];
      }
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/productos/mis-productos")
      .set("Authorization", `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      nombre: "Mi producto",
      precio: 1000,
      stock: 3,
      descuento_porcentaje: 10,
    });
    // Se filtra por el id del JWT
    const select = pool.query.mock.calls.find(([sql]) => sql.includes("WHERE p.vendedor_id = ?"));
    expect(select[1]).toEqual([2]);
  });

  it("POST /api/productos crea categoria nueva automaticamente (INSERT categorias)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      if (sql.includes("SELECT id FROM categorias")) return [[], undefined]; // no existe
      if (sql.includes("INSERT INTO categorias")) return [{ insertId: 77 }, undefined];
      if (sql.includes("INSERT INTO productos")) return [{ insertId: 555 }, undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .field("nombre", "Prod categoria nueva")
      .field("descripcion", "d")
      .field("precio", "10000")
      .field("stock", "2")
      .field("categoria", "Nueva Categoria")
      .attach("imagen", Buffer.from("x"), "foto.jpg");

    expect(res.status).toBe(201);
    const insertCategoria = pool.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO categorias"));
    expect(insertCategoria[1]).toEqual(["Nueva Categoria"]);
  });

  it("PUT /api/productos/:id con imagen nueva usa el nuevo archivo", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      if (sql.includes("SELECT id, categoria_id")) {
        return [
          [
            {
              id: 1,
              categoria_id: 5,
              imagen_url: "/uploads/vieja.jpg",
              vendedor_id: 2,
              nombre: "Original",
              descripcion: "desc original",
              precio: "1000.00",
              stock: 3,
              descuento_porcentaje: "0.00",
            },
          ],
          undefined,
        ];
      }
      if (sql.includes("UPDATE productos")) return [[], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .put("/api/productos/1")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .field("nombre", "Editado con imagen")
      .attach("imagen", Buffer.from("nueva"), "nueva.png");

    expect(res.status).toBe(200);
    const update = pool.query.mock.calls.find(([sql]) => sql.includes("UPDATE productos"));
    expect(update[1][2]).toMatch(/^\/uploads\/\d+\.png$/); // imagen nueva
  });

  it("devuelve 500 si la BD falla al editar", async () => {
    pool.query.mockRejectedValue(new Error("BD caida"));
    const res = await request(app)
      .put("/api/productos/1")
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .field("nombre", "x");
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });

  it("devuelve 500 si la BD falla al listar mis productos", async () => {
    pool.query.mockRejectedValue(new Error("BD caida"));
    const res = await request(app)
      .get("/api/productos/mis-productos")
      .set("Authorization", `Bearer ${tokenVendedor}`);
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });
});
