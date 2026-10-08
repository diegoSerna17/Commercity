import { z } from "zod";
import { paginacionSchema, idParam } from "./common.schema.js";

// ============================================================================
// Contratos del modulo productos / catalogo (RF45-RF49, RF54, RF78/RF79,
// RF81-RF94). Espejan la validacion manual de productos.controllers.js:
//  - validarRangosProducto: precio finito > 0; stock entero >= 0;
//    descuento 0-100; '' y null invalidos (H3).
//  - Crear exige nombre/descripcion/categoria + imagen multipart obligatoria.
//  - Multipart: los numeros llegan como strings -> se usa z.coerce.
// Fuente documental (OpenAPI); sin cablear validate() todavia (Fase 1).
// ============================================================================

const precioProducto = z.coerce
  .number()
  .finite("Precio y stock deben ser numeros validos")
  .positive("Precio y stock deben ser numeros validos")
  .describe("Precio publicado (ya incluye IVA 19%, RF48)");

const stockProducto = z.coerce
  .number()
  .int("Precio y stock deben ser numeros validos")
  .min(0, "Precio y stock deben ser numeros validos")
  .describe("Stock disponible (entero >= 0)");

const descuentoProducto = z.coerce
  .number()
  .finite("El descuento debe ser un numero entre 0 y 100")
  .min(0, "El descuento debe ser un numero entre 0 y 100")
  .max(100, "El descuento debe ser un numero entre 0 y 100")
  .describe("Descuento porcentual 0-100");

/** Query de GET /api/productos (catalogo publico RF87-RF94). */
export const catalogoQuerySchema = z
  .object({
    page: paginacionSchema.shape.page,
    limit: paginacionSchema.shape.limit,
    nombre: z.string().optional().describe("Filtro por nombre"),
    categoria: z.string().optional().describe("Filtro por categoria"),
    vendedor: z.string().optional().describe("Filtro por vendedor"),
  })
  .meta({
    id: "CatalogoQuery",
    title: "CatalogoQuery",
    description: "Query de GET /api/productos (busqueda, filtros y paginacion)",
    examples: [{ page: 1, limit: 4, nombre: "cafe", categoria: "Alimentos" }],
  });

/** Params :id de detalle / validacion de stock. */
export const productoIdParamsSchema = z
  .object({ id: idParam })
  .meta({
    id: "ProductoIdParams",
    title: "ProductoIdParams",
    description: "Params de GET /api/productos/:id y /:id/validar-stock",
    examples: [{ id: 5 }],
  });

/** Query/body de GET /api/productos/:id/validar-stock (RF86). */
export const validarStockQuerySchema = z
  .object({
    cantidad: z.coerce.number().int().positive().describe("Cantidad a validar contra el stock"),
  })
  .meta({
    id: "ValidarStock",
    title: "ValidarStock",
    description: "Cantidad de GET /api/productos/:id/validar-stock (RF86)",
    examples: [{ cantidad: 2 }],
  });

/** Body de POST /api/productos (multipart + campo imagen obligatorio). */
export const crearProductoSchema = z
  .object({
    nombre: z.string().trim().min(1, "Faltan campos requeridos (nombre, descripcion, categoria)").describe("Nombre del producto"),
    descripcion: z.string().trim().min(1, "Faltan campos requeridos (nombre, descripcion, categoria)").describe("Descripcion"),
    precio: precioProducto,
    stock: stockProducto,
    descuento: descuentoProducto.optional().describe("Descuento porcentual (opcional)"),
    categoria: z.string().trim().min(1, "Faltan campos requeridos (nombre, descripcion, categoria)").describe("Categoria (se crea si no existe)"),
  })
  .meta({
    id: "CrearProducto",
    title: "CrearProducto",
    description: "Body de POST /api/productos (vendedor; imagen multipart obligatoria, RF45/RF46/RF48)",
    examples: [
      { nombre: "Cafe especial", descripcion: "Libra de cafe de origen", precio: 25000, stock: 10, categoria: "Alimentos" },
    ],
  });

/** Body de PUT /api/productos/:id (edicion parcial: conserva valores de BD). */
export const editarProductoSchema = z
  .object({
    nombre: z.string().trim().min(1).optional().describe("Nombre del producto"),
    descripcion: z.string().trim().min(1).optional().describe("Descripcion"),
    precio: precioProducto.optional(),
    stock: stockProducto.optional(),
    descuento: descuentoProducto.optional(),
    categoria: z.string().trim().min(1).optional().describe("Categoria"),
  })
  .meta({
    id: "EditarProducto",
    title: "EditarProducto",
    description: "Body de PUT /api/productos/:id (edicion parcial del vendedor)",
    examples: [{ precio: 27000, stock: 8 }],
  });
