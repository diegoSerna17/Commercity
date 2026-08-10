import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

// Mock del pool para no depender de la BD real
vi.mock("../config/db.js", () => ({
  default: { query: vi.fn() },
}));

import pool from "../config/db.js";
import productosRouter from "../routes/productos.routes.js";

const app = express();
app.use(express.json());
app.use("/api", productosRouter);

const filaProducto = {
  id: 1,
  vendedor_id: 2,
  nombre: "MacBook Air M2",
  descripcion: "Laptop",
  precio: "5990000.00",
  stock: 10,
  imagen: "https://img.com/macbook.png",
  descuento_porcentaje: "10.00",
  categoria: "Tecnologia",
  vendedor: "Vendedor Alex",
  vendedor_foto: "https://img.com/alex.png",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/productos (Panel Principal RF87-RF94)", () => {
  it("devuelve el catalogo paginado con contrato { success, data }", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("COUNT(*)")) return [[{ total: 25 }], undefined];
      return [[filaProducto], undefined];
    });

    const res = await request(app).get("/api/productos?page=2&limit=4");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      pagina: 2,
      limite: 4,
      totalProductos: 25,
      totalPaginas: 7,
      hayPaginaAnterior: true,
      hayPaginaSiguiente: true,
    });
    expect(res.body.data.productos).toHaveLength(1);
  });

  it("pasa pagina y limite como numeros en LIMIT ? OFFSET ?", async () => {
    pool.query.mockResolvedValue([[], undefined]);

    await request(app).get("/api/productos?page=3&limit=6");

    const consultaProductos = pool.query.mock.calls.find(([sql]) =>
      sql.includes("LIMIT ? OFFSET ?")
    );
    expect(consultaProductos).toBeDefined();
    // [...valores, limite, offset] -> limite=6, offset=12
    expect(consultaProductos[1]).toEqual([6, 12]);
  });

  it("filtra por nombre, categoria y vendedor (RF88) con parametros", async () => {
    pool.query.mockResolvedValue([[], undefined]);

    await request(app).get("/api/productos?nombre=mac&categoria=Tecnologia&vendedor=Alex");

    const consultaTotal = pool.query.mock.calls.find(([sql]) =>
      sql.includes("COUNT(*)")
    );
    expect(consultaTotal[0]).toContain("p.nombre LIKE ?");
    expect(consultaTotal[0]).toContain("c.nombre LIKE ?");
    expect(consultaTotal[0]).toContain("v.nombre_completo LIKE ?");
    expect(consultaTotal[1]).toEqual(["%mac%", "%Tecnologia%", "%Alex%"]);
  });

  it("solo muestra productos disponibles y no eliminados por admin (RF72/RF86)", async () => {
    pool.query.mockResolvedValue([[], undefined]);

    await request(app).get("/api/productos");

    const consulta = pool.query.mock.calls.find(([sql]) => sql.includes("COUNT(*)"));
    expect(consulta[0]).toContain("p.eliminado_por_admin = 0");
    expect(consulta[0]).toContain("p.estado = 'Disponible'");
  });

  it("protege contra paginas negativas o limites desmedidos", async () => {
    pool.query.mockResolvedValue([[], undefined]);

    await request(app).get("/api/productos?page=-5&limit=9999");

    const consultaProductos = pool.query.mock.calls.find(([sql]) =>
      sql.includes("LIMIT ? OFFSET ?")
    );
    expect(consultaProductos[1]).toEqual([100, 0]); // limite tope 100, pagina minima 1
  });

  it("devuelve 500 con error estructurado si la BD falla", async () => {
    pool.query.mockRejectedValue(new Error("BD caida"));

    const res = await request(app).get("/api/productos");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("GET /api/categorias", () => {
  it("devuelve las categorias activas", async () => {
    pool.query.mockResolvedValue([[{ id: 1, nombre: "Tecnologia" }], undefined]);

    const res = await request(app).get("/api/categorias");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([{ id: 1, nombre: "Tecnologia" }]);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE activo = 1")
    );
  });
});

describe("GET /api/vendedores", () => {
  it("devuelve los vendedores activos con rol vendedor", async () => {
    pool.query.mockResolvedValue([[{ id: 2, nombre: "Vendedor Alex" }], undefined]);

    const res = await request(app).get("/api/vendedores");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([{ id: 2, nombre: "Vendedor Alex" }]);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("r.nombre = 'vendedor'")
    );
  });
});

// ============================================================================
// DETALLE DE PRODUCTO (RF78/RF79) - integrado desde Carlos Perea (2026-08-09)
// ============================================================================

const filaDetalle = {
  id: 584,
  nombre: "Auriculares Pro",
  descripcion: "Auriculares inalámbricos con cancelación de ruido",
  imagen_url: "https://img.com/auriculares.png",
  precio: "550000.00",
  descuento_porcentaje: "15.00",
  stock: 8,
  estado: "Disponible",
  fecha_publicacion: "2026-07-01T12:00:00.000Z",
  categoria_id: 3,
  categoria_nombre: "Tecnologia",
  vendedor_id: 471,
  vendedor_nombre: "Vendedor Alex",
  vendedor_foto: "https://img.com/alex.png",
};

const filaCalificacion = { promedio: "4.6667", total: 3 };

/** Simula las 2 consultas del detalle (producto + calificaciones del vendedor). */
function mockDetalleConCalificacion() {
  pool.query.mockImplementation((sql) => {
    if (sql.includes("calificaciones_vendedores")) {
      return [[filaCalificacion], undefined];
    }
    return [[filaDetalle], undefined];
  });
}

describe("GET /api/productos/:id (RF78/RF79)", () => {
  it("devuelve el detalle normalizado con categoria, vendedor y calificacion (RF49)", async () => {
    mockDetalleConCalificacion();

    const res = await request(app).get("/api/productos/584");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: 584,
      nombre: "Auriculares Pro",
      precio: 550000,
      descuento_porcentaje: 15,
      stock: 8,
      estado: "Disponible",
      categoria: { id: 3, nombre: "Tecnologia" },
      vendedor: {
        id: 471,
        nombre: "Vendedor Alex",
        foto: "https://img.com/alex.png",
        calificacion_promedio: 4.7,
        total_calificaciones: 3,
      },
    });
  });

  it("excluye vendedores inactivos en la consulta (RF74)", async () => {
    mockDetalleConCalificacion();

    await request(app).get("/api/productos/584");

    const consulta = pool.query.mock.calls.find(([sql]) =>
      sql.includes("FROM productos p")
    );
    expect(consulta[0]).toContain("u.activo = 1");
    expect(consulta[0]).toContain("p.eliminado_por_admin = 0");
    expect(consulta[1]).toEqual([584]);
  });

  it("usa avatar por defecto si el vendedor no tiene foto", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("calificaciones_vendedores")) {
        return [[{ promedio: null, total: 0 }], undefined];
      }
      return [[{ ...filaDetalle, vendedor_foto: null }], undefined];
    });

    const res = await request(app).get("/api/productos/584");

    expect(res.status).toBe(200);
    expect(res.body.data.vendedor.foto).toContain("ui-avatars.com");
    expect(res.body.data.vendedor.calificacion_promedio).toBeNull();
    expect(res.body.data.vendedor.total_calificaciones).toBe(0);
  });

  it("devuelve 404 si el producto no existe o esta suspendido", async () => {
    pool.query.mockResolvedValue([[], undefined]);

    const res = await request(app).get("/api/productos/99999");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("devuelve 400 si el ID no es numerico", async () => {
    const res = await request(app).get("/api/productos/abc");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("devuelve 500 estructurado si la BD falla", async () => {
    pool.query.mockRejectedValue(new Error("BD caida"));

    const res = await request(app).get("/api/productos/584");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });
});

// ============================================================================
// VALIDACION DE STOCK (RF86) - integrado desde Carlos Perea (2026-08-09)
// ============================================================================

describe("GET /api/productos/:id/validar-stock (RF86)", () => {
  it("devuelve valido:true si hay stock suficiente", async () => {
    pool.query.mockResolvedValue([
      [{ stock: 8, estado: "Disponible" }],
      undefined,
    ]);

    const res = await request(app).get("/api/productos/584/validar-stock?cantidad=2");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      valido: true,
      stock_disponible: 8,
      estado: "Disponible",
      mensaje: "Stock disponible",
    });
  });

  it("marca valido:false si el producto esta Agotado (estado generado por BD)", async () => {
    pool.query.mockResolvedValue([[{ stock: 0, estado: "Agotado" }], undefined]);

    const res = await request(app).get("/api/productos/584/validar-stock?cantidad=1");

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      valido: false,
      stock_disponible: 0,
      estado: "Agotado",
    });
  });

  it("marca valido:false si la cantidad supera el stock", async () => {
    pool.query.mockResolvedValue([
      [{ stock: 3, estado: "Disponible" }],
      undefined,
    ]);

    const res = await request(app).get("/api/productos/584/validar-stock?cantidad=5");

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      valido: false,
      stock_disponible: 3,
      estado: "Disponible",
    });
    expect(res.body.data.mensaje).toContain("Solo hay 3");
  });

  it("acepta cantidad por body como respaldo", async () => {
    pool.query.mockResolvedValue([
      [{ stock: 10, estado: "Disponible" }],
      undefined,
    ]);

    const res = await request(app)
      .get("/api/productos/584/validar-stock")
      .send({ cantidad: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.valido).toBe(true);
  });

  it("devuelve 400 si la cantidad no es entero positivo", async () => {
    const res = await request(app).get("/api/productos/584/validar-stock?cantidad=0");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("devuelve 400 si el ID no es numerico", async () => {
    const res = await request(app).get("/api/productos/abc/validar-stock?cantidad=1");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("devuelve 404 si el producto no existe", async () => {
    pool.query.mockResolvedValue([[], undefined]);

    const res = await request(app).get("/api/productos/99999/validar-stock?cantidad=1");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("devuelve 500 estructurado si la BD falla", async () => {
    pool.query.mockRejectedValue(new Error("BD caida"));

    const res = await request(app).get("/api/productos/584/validar-stock?cantidad=1");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });
});
