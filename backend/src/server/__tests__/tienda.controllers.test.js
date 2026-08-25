import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { encryptSensitive } from "../utils/crypto.js";

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

const tokenVendedor = jwt.sign(
  { id: 3, email: "vendedor@test.com" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);
const tokenComprador = jwt.sign(
  { id: 7, email: "comprador@test.com" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);

const filaBancaria = {
  id: 1,
  usuario_id: 3,
  titular_nombre: encryptSensitive("Maria Fernanda Lopez"),
  banco: "Bancolombia",
  tipo_cuenta: "ahorros",
  numero_cuenta: encryptSensitive("12345678901234"),
  es_commercity: 0,
  updated_at: "2026-08-08T12:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default: auth OK (blacklist vacia) + rol vendedor
  pool.query.mockImplementation((sql) => {
    if (sql.includes("tokens_invalidados")) return [[], undefined];
    if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
    return [[], undefined];
  });
});

describe("Cuenta bancaria (RNF11 / RF121-RF123 / RF122)", () => {
  it("rechaza sin token (401)", async () => {
    const res = await request(app).get("/api/tienda/mi-cuenta-bancaria");
    expect(res.status).toBe(401);
  });

  it("rechaza a un comprador (403 - solo vendedor)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "comprador" }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/tienda/mi-cuenta-bancaria")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(res.status).toBe(403);
  });

  it("devuelve registrado=false cuando no hay datos", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      return [[], undefined]; // datos_bancarios sin filas
    });

    const res = await request(app)
      .get("/api/tienda/mi-cuenta-bancaria")
      .set("Authorization", `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    expect(res.body.data.registrado).toBe(false);
  });

  it("descifra y devuelve los datos privados del vendedor", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      if (sql.includes("FROM datos_bancarios")) return [[filaBancaria], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/tienda/mi-cuenta-bancaria")
      .set("Authorization", `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    expect(res.body.data.registrado).toBe(true);
    expect(res.body.data.datos.titular_nombre).toBe("Maria Fernanda Lopez");
    expect(res.body.data.datos.numero_cuenta).toBe("12345678901234");
  });

  it("devuelve los datos enmascarados (RF122)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      if (sql.includes("FROM datos_bancarios")) return [[filaBancaria], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/tienda/mi-cuenta-bancaria/masked")
      .set("Authorization", `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    const datos = res.body.data.datos;
    // Nunca expone el numero completo ni el titular completo
    expect(datos.numero_cuenta_enmascarado).toContain("1234");
    expect(datos.numero_cuenta_enmascarado).not.toBe("12345678901234");
    expect(datos.titular_nombre_enmascarado).toContain("Lopez");
    expect(datos.titular_nombre_enmascarado).not.toContain("Maria Fernanda");
  });

  describe("POST /api/tienda/mi-cuenta-bancaria (upsert)", () => {
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
        if (sql.includes("FROM datos_bancarios")) return [[filaBancaria], undefined];
        return [[], undefined];
      });
      conn.query.mockImplementation((sql) => {
        if (sql.includes("SELECT id FROM datos_bancarios")) return [[], undefined]; // no existe -> insert
        if (sql.includes("INSERT INTO datos_bancarios")) return [{ insertId: 5 }, undefined];
        return [[], undefined];
      });
    });

    it("registra una cuenta bancaria cifrada (201)", async () => {
      const res = await request(app)
        .post("/api/tienda/mi-cuenta-bancaria")
        .set("Authorization", `Bearer ${tokenVendedor}`)
        .send({ titular_nombre: "Maria Fernanda Lopez", banco: "Bancolombia", tipo_cuenta: "ahorros", numero_cuenta: "12345678901234" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.es_actualizacion).toBe(false);

      // Fix 3.2: en BD se guarda CIFRADO, nunca el texto plano
      const insertCall = conn.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO datos_bancarios"));
      expect(insertCall).toBeTruthy();
      expect(insertCall[1][1]).not.toContain("Maria");
      expect(insertCall[1][4]).not.toContain("12345678901234");
      expect(conn.commit).toHaveBeenCalled();
    });

    it("actualiza la cuenta bancaria existente (200)", async () => {
      conn.query.mockImplementation((sql) => {
        if (sql.includes("SELECT id FROM datos_bancarios")) return [[{ id: 1 }], undefined];
        if (sql.includes("UPDATE datos_bancarios")) return [{ affectedRows: 1 }, undefined];
        return [[], undefined];
      });

      const res = await request(app)
        .put("/api/tienda/mi-cuenta-bancaria")
        .set("Authorization", `Bearer ${tokenVendedor}`)
        .send({ titular_nombre: "Maria Fernanda Lopez", banco: "Bancolombia", tipo_cuenta: "corriente", numero_cuenta: "9999888877776666" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.es_actualizacion).toBe(true);
      expect(conn.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE datos_bancarios"), expect.anything());
      expect(conn.commit).toHaveBeenCalled();
    });

    it("rechaza datos invalidos (400 - zod)", async () => {
      const res = await request(app)
        .post("/api/tienda/mi-cuenta-bancaria")
        .set("Authorization", `Bearer ${tokenVendedor}`)
        .send({ titular_nombre: "A", banco: "Bancolombia", tipo_cuenta: "corriente", numero_cuenta: "12" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("hace rollback si la BD falla (500)", async () => {
      conn.query.mockRejectedValue(new Error("DB boom"));

      const res = await request(app)
        .post("/api/tienda/mi-cuenta-bancaria")
        .set("Authorization", `Bearer ${tokenVendedor}`)
        .send({ titular_nombre: "Maria Fernanda Lopez", banco: "Bancolombia", tipo_cuenta: "ahorros", numero_cuenta: "12345678901234" });

      expect(res.status).toBe(500);
      expect(conn.rollback).toHaveBeenCalled();
    });
  });
});

describe("Historial de ventas, ingresos y dashboard (RF119-RF123)", () => {
  const filaVenta = {
    id: 10, pedido_id: 5, referencia_pedido: "PAG-x1", nombre_producto: "Televisor",
    url_imagen: "tv.jpg", cantidad: 2, valor_unitario: 1190000, valor_subtotal: 2000000,
    monto_vendedor: 1800000, monto_comision: 200000, nombre_comprador: "Juan",
    email_comprador: "juan@test.com", estado_envio: "Pendiente", fecha_pedido: "2026-08-08",
  };

  it("GET /api/tienda/ventas usa el vendedor del token y filtra por estado_envio", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      if (sql.includes("SELECT COUNT(*)")) return [[{ total: 1 }], undefined];
      if (sql.includes("SUM(dp.subtotal)")) return [[{ total_ventas: 1, total_bruto: 2000000, total_neto_vendedor: 1800000, total_comision_plataforma: 200000 }], undefined];
      return [[filaVenta], undefined];
    });

    const res = await request(app)
      .get("/api/tienda/ventas?estado=Pendiente")
      .set("Authorization", `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.resumen.total_neto_vendedor).toBe(1800000);
    // El vendedor_id sale del token, no del query
    const llamadaVentas = pool.query.mock.calls.find(([sql]) => sql.includes("FROM detalle_pedidos dp"));
    expect(llamadaVentas[1][0]).toBe(3);
  });

  it("GET /api/tienda/ventas aplica filtros por fecha y busqueda", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      if (sql.includes("SELECT COUNT(*)")) return [[{ total: 1 }], undefined];
      if (sql.includes("SUM(dp.subtotal)")) return [[{ total_ventas: 1, total_bruto: 2000000, total_neto_vendedor: 1800000, total_comision_plataforma: 200000 }], undefined];
      return [[filaVenta], undefined];
    });

    const res = await request(app)
      .get("/api/tienda/ventas?fecha_desde=2026-01-01&fecha_hasta=2026-12-31&q=tv")
      .set("Authorization", `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    const conFecha = pool.query.mock.calls.find(([sql]) => sql.includes("DATE(p.fecha_pedido) >= DATE(?)"));
    expect(conFecha).toBeTruthy();
    const conBusqueda = pool.query.mock.calls.find(([sql]) => sql.includes("pr.nombre LIKE ?"));
    expect(conBusqueda).toBeTruthy();
  });

  it("GET /api/tienda/ventas excluye las lineas canceladas por defecto (RF129)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      if (sql.includes("SELECT COUNT(*)")) return [[{ total: 0 }], undefined];
      if (sql.includes("SUM(dp.subtotal)")) return [[{ total_ventas: 0, total_bruto: 0, total_neto_vendedor: 0, total_comision_plataforma: 0 }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/tienda/ventas")
      .set("Authorization", `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    const sinFiltro = pool.query.mock.calls.find(([sql]) => sql.includes("FROM detalle_pedidos dp"));
    expect(sinFiltro[0]).toContain("dp.estado_envio <> 'Cancelado'");
  });

  it("GET /api/tienda/ventas con estado=Cancelado si las muestra (RF129)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      if (sql.includes("SELECT COUNT(*)")) return [[{ total: 1 }], undefined];
      if (sql.includes("SUM(dp.subtotal)")) return [[{ total_ventas: 1, total_bruto: 0, total_neto_vendedor: 0, total_comision_plataforma: 0 }], undefined];
      return [[{ ...filaVenta, estado_envio: "Cancelado" }], undefined];
    });

    const res = await request(app)
      .get("/api/tienda/ventas?estado=Cancelado")
      .set("Authorization", `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    const conFiltro = pool.query.mock.calls.find(([sql]) => sql.includes("FROM detalle_pedidos dp"));
    expect(conFiltro[0]).toContain("dp.estado_envio = ?");
    expect(conFiltro[0]).not.toContain("<> 'Cancelado'");
  });

  it("GET /api/tienda/ingresos devuelve el resumen 90/10 sin datos bancarios", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      if (sql.includes("SELECT COUNT(*)")) return [[{ total: 1 }], undefined];
      if (sql.includes("COUNT(dp.id) AS total_transacciones")) return [[{ total_transacciones: 1, total_bruto: 2000000, total_neto_vendedor: 1800000, total_comision_plataforma: 200000 }], undefined];
      return [[filaVenta], undefined];
    });

    const res = await request(app)
      .get("/api/tienda/ingresos")
      .set("Authorization", `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    expect(res.body.data.resumen.consistencia_90_10_validada).toBe(true);
    expect(JSON.stringify(res.body)).not.toContain("numero_cuenta");
  });

  it("GET /api/tienda/ingresos agrupa por dia cuando agrupar_por=dia", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      if (sql.includes("SELECT COUNT(*)")) return [[{ total: 1 }], undefined];
      if (sql.includes("COUNT(dp.id) AS total_transacciones")) return [[{ total_transacciones: 1, total_bruto: 2000000, total_neto_vendedor: 1800000, total_comision_plataforma: 200000 }], undefined];
      if (sql.includes("GROUP BY DATE(p.fecha_pedido)")) return [[{ fecha: "2026-08-08", pedidos: 1, bruto: 2000000, ganancia_neta: 1800000, comision: 200000 }], undefined];
      return [[filaVenta], undefined];
    });

    const res = await request(app)
      .get("/api/tienda/ingresos?agrupar_por=dia")
      .set("Authorization", `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    expect(res.body.data.periodo).toHaveLength(1);
    expect(res.body.data.periodo[0].fecha).toBe("2026-08-08");
  });

  it("GET /api/tienda/dashboard/stats devuelve tarjetas, por estado y ultimos 6 meses", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      if (sql.includes("COUNT(DISTINCT p.id) AS total_ventas")) {
        return [[{ total_ventas: 4, total_bruto: 8000000, total_neto_vendedor: 7200000, total_comision: 800000, unidades_vendidas: 5 }], undefined];
      }
      if (sql.includes("GROUP BY dp.estado_envio")) return [[{ estado: "Pendiente", cantidad: 3, valor_subtotal: 6000000 }], undefined];
      if (sql.includes("GROUP BY DATE_FORMAT")) return [[{ mes: "2026-07", ganancias: 7200000 }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/tienda/dashboard/stats")
      .set("Authorization", `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tarjetas.total_neto_vendedor).toBe(7200000);
    expect(res.body.data.por_estado[0].estado).toBe("Pendiente");
    expect(res.body.data.ultimos_6_meses[0].mes).toBe("2026-07");
  });
});

describe("Validacion de Mi Tienda (RF130-RF139)", () => {
  const filaLineaCoherente = {
    id: 10, pedido_id: 5, producto_id: 3, cantidad: 2,
    subtotal: "2000000.00", monto_vendedor: "1800000.00",
    monto_comision: "200000.00", estado_envio: "Pendiente",
  };
  const filaLineaIncoherente = {
    id: 11, pedido_id: 6, producto_id: 4, cantidad: 1,
    subtotal: "1000.00", monto_vendedor: "0.00",
    monto_comision: "0.00", estado_envio: "Pendiente",
  };
  const filaDevolucion = {
    id: 30, pedido_id: 9, cantidad: 1, subtotal: "50000.00",
    monto_vendedor: "45000.00", monto_comision: "5000.00",
    fecha_pedido: "2026-08-10", estado_pago: "Aprobado",
  };

  it("rechaza sin token (401)", async () => {
    const res = await request(app).get("/api/tienda/validacion");
    expect(res.status).toBe(401);
  });

  it("rechaza a un comprador (403 - solo vendedor)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "comprador" }], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/tienda/validacion")
      .set("Authorization", `Bearer ${tokenComprador}`);
    expect(res.status).toBe(403);
  });

  it("detecta vendedor sin cuenta bancaria registrada (RF131)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      return [[], undefined]; // sin cuenta, sin lineas, sin devoluciones
    });

    const res = await request(app)
      .get("/api/tienda/validacion")
      .set("Authorization", `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    expect(res.body.data.cuenta_bancaria.registrada).toBe(false);
    expect(res.body.data.cuenta_bancaria.completa).toBe(false);
    expect(res.body.data.validado).toBe(false);
    expect(res.body.data.observaciones.some((o) => o.includes("RF131"))).toBe(true);
  });

  it("valida cuenta bancaria completa + flujo 90/10 sin exponer el numero (RF138)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      if (sql.includes("FROM datos_bancarios")) return [[filaBancaria], undefined];
      if (sql.includes("estado_envio = 'Cancelado'")) return [[], undefined]; // sin devoluciones
      if (sql.includes("FROM detalle_pedidos dp")) return [[filaLineaCoherente], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/tienda/validacion")
      .set("Authorization", `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.cuenta_bancaria.registrada).toBe(true);
    expect(data.cuenta_bancaria.completa).toBe(true);
    // RF138: nunca se expone el numero completo ni el titular completo
    expect(JSON.stringify(res.body)).not.toContain("12345678901234");
    expect(JSON.stringify(res.body)).not.toContain("Maria Fernanda");
    expect(data.cuenta_bancaria.numero_enmascarado).toContain("1234");
    // Flujo 90/10 coherente (vendedor + comision == subtotal)
    expect(data.flujo_90_10.lineas_incoherentes).toBe(0);
    expect(data.flujo_90_10.validado).toBe(true);
    expect(data.flujo_90_10.totales.vendedor_90).toBe(1800000);
    expect(data.flujo_90_10.totales.comision_10).toBe(200000);
    expect(data.devoluciones.lineas_canceladas).toBe(0);
    expect(data.validado).toBe(true);
  });

  it("detecta lineas incoherentes en el flujo 90/10 (monto en cero)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      if (sql.includes("FROM datos_bancarios")) return [[filaBancaria], undefined];
      if (sql.includes("estado_envio = 'Cancelado'")) return [[], undefined];
      if (sql.includes("FROM detalle_pedidos dp")) return [[filaLineaIncoherente], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/tienda/validacion")
      .set("Authorization", `Bearer ${tokenVendedor}`);

    const data = res.body.data;
    expect(data.flujo_90_10.lineas_incoherentes).toBe(1);
    expect(data.flujo_90_10.incoherencias[0].detalle_id).toBe(11);
    expect(data.flujo_90_10.validado).toBe(false);
    expect(data.validado).toBe(false);
    expect(data.observaciones.some((o) => o.includes("RF136/RF139"))).toBe(true);
  });

  it("advierte cuando hay lineas canceladas sin pago Reembolsado (RF35/RF137)", async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes("tokens_invalidados")) return [[], undefined];
      if (sql.includes("FROM usuario_roles")) return [[{ nombre: "vendedor" }], undefined];
      if (sql.includes("FROM datos_bancarios")) return [[filaBancaria], undefined];
      if (sql.includes("estado_envio = 'Cancelado'")) return [[filaDevolucion], undefined];
      if (sql.includes("FROM detalle_pedidos dp")) return [[filaLineaCoherente], undefined];
      return [[], undefined];
    });

    const res = await request(app)
      .get("/api/tienda/validacion")
      .set("Authorization", `Bearer ${tokenVendedor}`);

    const data = res.body.data;
    expect(data.devoluciones.lineas_canceladas).toBe(1);
    expect(data.devoluciones.pagos_marcados_reembolsados).toBe(0);
    expect(data.devoluciones.validado).toBe(false);
    expect(data.observaciones.some((o) => o.includes("RF35"))).toBe(true);
  });
});
