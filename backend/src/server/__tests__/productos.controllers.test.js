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
