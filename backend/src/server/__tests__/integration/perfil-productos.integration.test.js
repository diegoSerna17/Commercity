/**
 * E2E de perfil/catalogo (RF51 y RF55) contra MySQL REAL y DESECHABLE.
 *
 * Cubre lo que la suite unitaria solo simula con mocks:
 *   - RF55: pausar un producto lo saca del catalogo, de la ficha y del carrito;
 *     el checkout responde 409 si la linea ya estaba en el carrito;
 *   - RF55: la baja logica conserva la fila y el vendedor sigue viendola en
 *     `mis-productos`;
 *   - RF51: calificaciones publicas por vendedor con promedio y paginacion,
 *     y 404 cuando el id no es un vendedor.
 *
 * Reglas:
 *   - JAMAS corre contra la BD compartida: solo contra TEST_DB_*.
 *   - Sin TEST_DB_* la suite se SALTA (un clon limpio no necesita MySQL).
 *   - Preparar la BD con schema+seed y migraciones antes de correr:
 *       $env:TEST_DB_NAME="commercity_dev"; npm run test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

const TEST_DB = {
  host: process.env.TEST_DB_HOST,
  port: process.env.TEST_DB_PORT ? Number(process.env.TEST_DB_PORT) : 3306,
  user: process.env.TEST_DB_USER,
  password: process.env.TEST_DB_PASSWORD || "",
  database: process.env.TEST_DB_NAME,
};

const habilitado = Boolean(TEST_DB.host && TEST_DB.user && TEST_DB.database);

describe.skipIf(!habilitado)("E2E perfil y catalogo (RF51/RF55) contra MySQL real", () => {
  let app;
  let pool;
  let raw;

  const marca = `e2e_perfil_${Date.now().toString(36)}`;
  const usuarioIds = [];
  const productoIds = [];
  const pedidoIds = [];
  let categoriaId;
  let comprador;
  let vendedor;
  let tokenComprador;
  let tokenVendedor;
  let productoPausado;
  let productoEliminado;

  const tokenDe = (id, email) =>
    jwt.sign({ id, email, token_version: 0 }, process.env.JWT_SECRET, {
      issuer: "commercity-api",
      audience: "commercity-clients",
      expiresIn: "1h",
    });

  const crearUsuario = async (etiqueta) => {
    const email = `${marca}_${etiqueta}@test.local`;
    const [r] = await raw.query(
      "INSERT INTO usuarios (email, password, nombre_completo, activo) VALUES (?, 'hash_solo_e2e', ?, 1)",
      [email, `Usuario ${etiqueta} ${marca}`]
    );
    usuarioIds.push(r.insertId);
    return { id: r.insertId, email };
  };

  const crearProducto = async (vendedorId, etiqueta, stock = 10) => {
    const [r] = await raw.query(
      `INSERT INTO productos
         (vendedor_id, categoria_id, nombre, descripcion, imagen_url, precio, stock, descuento_porcentaje)
       VALUES (?, ?, ?, 'Producto E2E', '/uploads/e2e.jpg', 10000.00, ?, 0.00)`,
      [vendedorId, categoriaId, `${marca} ${etiqueta}`, stock]
    );
    productoIds.push(r.insertId);
    return r.insertId;
  };

  beforeAll(async () => {
    process.env.DB_HOST = TEST_DB.host;
    process.env.DB_PORT = String(TEST_DB.port || 3306);
    process.env.DB_USER = TEST_DB.user;
    process.env.DB_PASSWORD = TEST_DB.password;
    process.env.DB_NAME = TEST_DB.database;
    process.env.NODE_ENV = "test";

    ({ default: app } = await import("../../app.js"));
    ({ default: pool } = await import("../../config/db.js"));

    raw = await mysql.createConnection({ ...TEST_DB });

    try {
      await raw.query("SELECT pausado FROM productos LIMIT 1");
    } catch {
      throw new Error(
        `TEST_DB_NAME="${TEST_DB.database}" no tiene el esquema al dia. ` +
          "Cargue schema_commercity.sql + seed y aplique scripts/aplicar-migraciones.mjs."
      );
    }

    const [cat] = await raw.query("INSERT INTO categorias (nombre) VALUES (?)", [
      `${marca} categoria`,
    ]);
    categoriaId = cat.insertId;

    comprador = await crearUsuario("comprador");
    vendedor = await crearUsuario("vendedor");
    tokenComprador = tokenDe(comprador.id, comprador.email);
    tokenVendedor = tokenDe(vendedor.id, vendedor.email);

    // El rol es obligatorio para PATCH/DELETE de productos.
    const [[rolVendedor]] = await raw.query(
      "SELECT id FROM roles WHERE nombre = 'vendedor' LIMIT 1"
    );
    await raw.query("INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?, ?)", [
      vendedor.id,
      rolVendedor.id,
    ]);

    productoPausado = await crearProducto(vendedor.id, "pausado");
    productoEliminado = await crearProducto(vendedor.id, "eliminado");
  }, 60000);

  afterAll(async () => {
    if (pool) await pool.end();
    if (!raw) return;

    const limpiar = async (sql, params) => {
      try {
        await raw.query(sql, params);
      } catch {
        // limpieza best effort
      }
    };

    if (usuarioIds.length) {
      await limpiar("DELETE FROM carrito_items WHERE comprador_id IN (?)", [usuarioIds]);
      await limpiar("DELETE FROM calificaciones_vendedores WHERE pedido_id IN (?)", [pedidoIds]);
      await limpiar("DELETE FROM pedidos WHERE comprador_id IN (?)", [usuarioIds]);
      await limpiar("DELETE FROM usuario_roles WHERE usuario_id IN (?)", [usuarioIds]);
    }
    if (productoIds.length) {
      await limpiar("DELETE FROM productos WHERE id IN (?)", [productoIds]);
    }
    if (usuarioIds.length) {
      await limpiar("DELETE FROM usuarios WHERE id IN (?)", [usuarioIds]);
    }
    if (categoriaId) {
      await limpiar("DELETE FROM categorias WHERE id = ?", [categoriaId]);
    }
    await raw.end();
  });

  const catalogo = (nombre) =>
    request(app).get(`/api/productos?nombre=${encodeURIComponent(nombre)}`);

  it("RF55: pausar saca el producto del catalogo, de la ficha y del carrito", async () => {
    // Act
    const pausa = await request(app)
      .patch(`/api/productos/${productoPausado}/estado`)
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .send({ estado: "pausado" });

    // Assert
    expect(pausa.status).toBe(200);
    expect(pausa.body.data.estado).toBe("pausado");

    const listado = await catalogo(`${marca} pausado`);
    expect(listado.status).toBe(200);
    expect(
      listado.body.data.productos.some((p) => p.nombre === `${marca} pausado`)
    ).toBe(false);

    const ficha = await request(app).get(`/api/productos/${productoPausado}`);
    expect(ficha.status).toBe(404);

    const carrito = await request(app)
      .post("/api/carrito")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ producto_id: productoPausado, cantidad: 1 });
    expect(carrito.status).toBe(404);
    expect(carrito.body.error.code).toBe("PRODUCT_NOT_FOUND");
  });

  it("RF55: el checkout rechaza con 409 un producto pausado que ya estaba en el carrito", async () => {
    // Arrange: la linea se agrego antes de pausar el producto.
    await raw.query(
      "INSERT INTO carrito_items (comprador_id, producto_id, cantidad) VALUES (?, ?, 1)",
      [comprador.id, productoPausado]
    );

    // Act
    const res = await request(app)
      .post("/api/pedidos/confirmar-pago")
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({ direccion_envio: "Calle E2E #1-2, Medellin", metodo_pago: "pse" });

    // Assert
    expect(res.status).toBe(409);
    expect(res.body.error.message).toContain("RF74");

    await raw.query(
      "DELETE FROM carrito_items WHERE comprador_id = ? AND producto_id = ?",
      [comprador.id, productoPausado]
    );
  });

  it("RF55: la baja logica conserva el producto para su vendedor", async () => {
    // Act
    const baja = await request(app)
      .delete(`/api/productos/${productoEliminado}`)
      .set("Authorization", `Bearer ${tokenVendedor}`);

    // Assert
    expect(baja.status).toBe(200);
    expect(baja.body.data.estado).toBe("eliminado");

    const ficha = await request(app).get(`/api/productos/${productoEliminado}`);
    expect(ficha.status).toBe(404);

    const misProductos = await request(app)
      .get("/api/productos/mis-productos")
      .set("Authorization", `Bearer ${tokenVendedor}`);
    expect(misProductos.status).toBe(200);
    const enGrilla = misProductos.body.data.find((p) => p.id === productoEliminado);
    expect(enGrilla).toBeTruthy();
    expect(enGrilla.eliminado_por_vendedor).toBe(1);

    // Y no se puede reactivar desde el endpoint de estado.
    const reactivar = await request(app)
      .patch(`/api/productos/${productoEliminado}/estado`)
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .send({ estado: "activo" });
    expect(reactivar.status).toBe(409);
  });

  it("RF51: calificaciones publicas con promedio y paginacion", async () => {
    // Arrange: dos pedidos y dos calificaciones del mismo vendedor.
    for (const estrellas of [5, 4]) {
      const [pedido] = await raw.query(
        "INSERT INTO pedidos (comprador_id, direccion_envio, total_neto) VALUES (?, ?, ?)",
        [comprador.id, "Calle E2E #1-2, Medellin", 10000]
      );
      pedidoIds.push(pedido.insertId);
      await raw.query(
        `INSERT INTO calificaciones_vendedores
           (pedido_id, vendedor_id, comprador_id, estrellas, comentario)
         VALUES (?, ?, ?, ?, ?)`,
        [pedido.insertId, vendedor.id, comprador.id, estrellas, `Comentario ${estrellas}`]
      );
    }

    // Act
    const res = await request(app).get(
      `/api/calificaciones/vendedor/${vendedor.id}?page=1&limit=1`
    );

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.data.resumen).toEqual({ promedio: 4.5, total: 2 });
    expect(res.body.data.calificaciones).toHaveLength(1);
    expect(res.body.paginacion).toMatchObject({
      pagina: 1,
      por_pagina: 1,
      total: 2,
      total_paginas: 2,
    });

    const segunda = await request(app).get(
      `/api/calificaciones/vendedor/${vendedor.id}?page=2&limit=1`
    );
    expect(segunda.status).toBe(200);
    expect(segunda.body.data.calificaciones).toHaveLength(1);
    expect(segunda.body.data.calificaciones[0].id).not.toBe(
      res.body.data.calificaciones[0].id
    );
  });

  it("RF51: 404 si el id no pertenece a un vendedor", async () => {
    const res = await request(app).get(
      `/api/calificaciones/vendedor/${comprador.id}`
    );

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
