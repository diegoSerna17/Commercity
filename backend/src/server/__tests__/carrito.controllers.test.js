import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock de mysql2/promise: createPool devuelve un pool simulado (sin BD real).
vi.mock("mysql2/promise", () => {
  const pool = { query: vi.fn(), getConnection: vi.fn() };
  const conn = {
    beginTransaction: vi.fn().mockResolvedValue(),
    commit: vi.fn().mockResolvedValue(),
    rollback: vi.fn().mockResolvedValue(),
    release: vi.fn().mockResolvedValue(),
    query: vi.fn(),
  };
  pool.getConnection.mockResolvedValue(conn);
  return {
    __esModule: true,
    default: { createPool: vi.fn(() => pool) },
    __pool: pool,
    __conn: conn,
  };
});

const { __pool: pool, __conn: conn } = await import("mysql2/promise");
const { default: app } = await import("../app.js");

// Helpers de simulacion de BD
function productoInexistente() {
  pool.query.mockImplementation((sql) =>
    sql.includes("SELECT stock") ? Promise.resolve([[], undefined]) : Promise.resolve([[], undefined])
  );
}

// Configura el flujo completo de POST: stock, comprador activo y item existente en el carrito
function setupAgregar({ stock, compradorActivo: activo, itemExistente }) {
  pool.query.mockImplementation((sql) => {
    if (sql.includes("SELECT stock")) return Promise.resolve([stock ? [{ stock }] : []]);
    if (sql.includes("SELECT 1 FROM usuarios")) return Promise.resolve([activo ? [{}] : []]);
    return Promise.resolve([[], undefined]);
  });
  conn.query.mockImplementation((sql) => {
    if (sql.includes("SELECT cantidad")) return Promise.resolve([itemExistente ? [{ cantidad: itemExistente }] : []]);
    return Promise.resolve([{ affectedRows: 1 }, undefined]);
  });
}

function soloStock(stock) {
  pool.query.mockImplementation((sql) =>
    sql.includes("SELECT stock") ? Promise.resolve([[{ stock }]]) : Promise.resolve([[], undefined])
  );
}

function listarItemsMock(items) {
  pool.query.mockImplementation((sql) =>
    sql.includes("FROM carrito_items")
      ? Promise.resolve([items, undefined])
      : Promise.resolve([[], undefined])
  );
}

function conexionSinItem() {
  conn.query.mockImplementation((sql) =>
    sql.includes("SELECT 1 FROM carrito_items")
      ? Promise.resolve([[], undefined])
      : Promise.resolve([{ affectedRows: 1 }, undefined])
  );
}

describe("GET /", () => {
  it("responde 200 con el mensaje del servidor", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("servidor creado");
  });
});

describe("POST /api/carrito (agregarProducto)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    conn.beginTransaction.mockResolvedValue();
    conn.commit.mockResolvedValue();
    conn.rollback.mockResolvedValue();
  });

  it("valida que comprador_id, producto_id y cantidad sean enteros positivos -> 400", async () => {
    const res = await request(app)
      .post("/api/carrito")
      .send({ comprador_id: 1, producto_id: 1, cantidad: 0 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("devuelve 404 si el producto no existe", async () => {
    productoInexistente();
    const res = await request(app)
      .post("/api/carrito")
      .send({ comprador_id: 1, producto_id: 999, cantidad: 2 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PRODUCT_NOT_FOUND");
  });

  it("devuelve 404 si el comprador no existe o esta inactivo", async () => {
    setupAgregar({ stock: 10, compradorActivo: false, itemExistente: null });
    const res = await request(app)
      .post("/api/carrito")
      .send({ comprador_id: 999, producto_id: 1, cantidad: 2 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("COMPRADOR_NOT_FOUND");
  });

  it("rechaza si la cantidad acumulada excede el stock -> 400 INSUFFICIENT_STOCK", async () => {
    setupAgregar({ stock: 10, compradorActivo: true, itemExistente: 8 }); // 8 + 3 = 11 > 10
    const res = await request(app)
      .post("/api/carrito")
      .send({ comprador_id: 1, producto_id: 1, cantidad: 3 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INSUFFICIENT_STOCK");
  });

  it("agrega un producto nuevo -> 201", async () => {
    setupAgregar({ stock: 10, compradorActivo: true, itemExistente: null });
    const res = await request(app)
      .post("/api/carrito")
      .send({ comprador_id: 1, producto_id: 1, cantidad: 2 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("acumula cantidad si el producto ya existe -> 201", async () => {
    setupAgregar({ stock: 10, compradorActivo: true, itemExistente: 2 }); // 2 + 2 = 4 <= 10
    const res = await request(app)
      .post("/api/carrito")
      .send({ comprador_id: 1, producto_id: 1, cantidad: 2 });
    expect(res.status).toBe(201);
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining("ON DUPLICATE KEY UPDATE"),
      expect.any(Array)
    );
  });

  it("maneja errores internos -> 500 SERVER_ERROR", async () => {
    pool.query.mockRejectedValue(new Error("boom"));
    const res = await request(app)
      .post("/api/carrito")
      .send({ comprador_id: 1, producto_id: 1, cantidad: 2 });
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("SERVER_ERROR");
  });
});

describe("GET /api/carrito (listarCarrito)", () => {
  it("valida comprador_id -> 400", async () => {
    const res = await request(app).get("/api/carrito?comprador_id=abc");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("lista el carrito agrupado por vendedor con resumen -> 200", async () => {
    listarItemsMock([
      {
        producto_id: 1,
        cantidad: 5,
        producto_nombre: "Producto Prueba",
        precio: 100000,
        descuento_porcentaje: 10,
        imagen_url: "https://ejemplo.com/img.png",
        vendedor_id: 2,
        vendedor_nombre: "Vendedor Prueba",
      },
    ]);
    const res = await request(app).get("/api/carrito?comprador_id=1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.vendedores).toHaveLength(1);
    expect(res.body.data.vendedores[0].items[0].precio_final).toBe(90000);
    expect(res.body.data.resumen.total).toBe(450000);
  });

  it("devuelve carrito vacio cuando no hay items -> 200", async () => {
    listarItemsMock([]);
    const res = await request(app).get("/api/carrito?comprador_id=1");
    expect(res.status).toBe(200);
    expect(res.body.data.vendedores).toHaveLength(0);
    expect(res.body.data.resumen.total).toBe(0);
  });
});

describe("PATCH /api/carrito/:productoId (modificarCantidad)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    conn.beginTransaction.mockResolvedValue();
    conn.commit.mockResolvedValue();
    conn.rollback.mockResolvedValue();
  });

  it("valida parametros -> 400", async () => {
    const res = await request(app)
      .patch("/api/carrito/1?comprador_id=1")
      .send({ cantidad: -1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("devuelve 404 si el producto no existe", async () => {
    productoInexistente();
    const res = await request(app)
      .patch("/api/carrito/999?comprador_id=1")
      .send({ cantidad: 2 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PRODUCT_NOT_FOUND");
  });

  it("rechaza cantidad mayor al stock -> 400", async () => {
    soloStock(10);
    const res = await request(app)
      .patch("/api/carrito/1?comprador_id=1")
      .send({ cantidad: 50 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INSUFFICIENT_STOCK");
  });

  it("devuelve 404 si el item no esta en el carrito", async () => {
    soloStock(10);
    conexionSinItem();
    const res = await request(app)
      .patch("/api/carrito/1?comprador_id=1")
      .send({ cantidad: 2 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ITEM_NOT_FOUND");
  });

  it("actualiza la cantidad -> 200", async () => {
    soloStock(10);
    conn.query.mockResolvedValue([[{ id: 1 }], undefined]); // item existe
    const res = await request(app)
      .patch("/api/carrito/1?comprador_id=1")
      .send({ cantidad: 4 });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Cantidad actualizada");
  });
});

describe("DELETE /api/carrito/:productoId (eliminarProducto)", () => {
  it("valida parametros -> 400", async () => {
    const res = await request(app).delete("/api/carrito/1?comprador_id=abc");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("devuelve 404 si el item no esta en el carrito", async () => {
    pool.query.mockResolvedValue([{ affectedRows: 0 }, undefined]);
    const res = await request(app).delete("/api/carrito/1?comprador_id=1");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ITEM_NOT_FOUND");
  });

  it("elimina el producto del carrito -> 200", async () => {
    pool.query.mockResolvedValue([{ affectedRows: 1 }, undefined]);
    const res = await request(app).delete("/api/carrito/1?comprador_id=1");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Producto eliminado del carrito");
  });
});
