import { z } from "zod";
import { paginacionSchema, idParam } from "./common.schema.js";

// ============================================================================
// Contratos del modulo productos / catalogo (RF45-RF49, RF54, RF78/RF79,
// RF81-RF94). Cableados con validate() en routes/productos.routes.js y
// routes/admin.routes.js.
//  - precio: DECIMAL(12,2) -> numero > 0 y <= 9.999.999.999,99;
//  - stock: INT -> entero entre 0 y 2.147.483.647;
//  - descuento: 0-100;
//  - nombre VARCHAR(150), categoria VARCHAR(100), descripcion TEXT.
// Multipart: los numeros llegan como strings; '' y null se rechazan (H3).
// ============================================================================

const numeroDeFormulario = z.union(
  [z.number(), z.string().trim().min(1)],
  { error: "Faltan campos requeridos (precio, stock)" }
);

const precioProducto = numeroDeFormulario
  .pipe(
    z.coerce
      .number()
      .finite("Precio y stock deben ser numeros validos")
      .positive("Precio y stock deben ser numeros validos")
      .max(9_999_999_999.99, "El precio supera el maximo de DECIMAL(12,2)")
  )
  .describe("Precio publicado (ya incluye IVA 19%, RF48; max DECIMAL(12,2))");

const stockProducto = numeroDeFormulario
  .pipe(
    z.coerce
      .number()
      .int("Precio y stock deben ser numeros validos")
      .min(0, "Precio y stock deben ser numeros validos")
      .max(2_147_483_647, "El stock supera el maximo de INT")
  )
  .describe("Stock disponible (entero >= 0, max INT)");

const descuentoProducto = numeroDeFormulario
  .pipe(
    z.coerce
      .number()
      .finite("El descuento debe ser un numero entre 0 y 100")
      .min(0, "El descuento debe ser un numero entre 0 y 100")
      .max(100, "El descuento debe ser un numero entre 0 y 100")
  )
  .describe("Descuento porcentual 0-100");

/** Query de GET /api/productos (catalogo publico RF87-RF94). */
export const catalogoQuerySchema = z
  .object({
    page: paginacionSchema.shape.page,
    limit: paginacionSchema.shape.limit,
    nombre: z.string().optional().describe("Filtro por nombre"),
    categoria: z.string().optional().describe("Filtro por categoria"),
    vendedor: z.string().optional().describe("Filtro por vendedor"),
    // M-20 (TASK-5.4): permite filtrar el catalogo por vendedor exacto (el
    // perfil publico deja de buscar por LIKE de nombre).
    vendedor_id: z.coerce
      .number({ error: "vendedor_id debe ser un entero positivo" })
      .int("vendedor_id debe ser un entero positivo")
      .positive("vendedor_id debe ser un entero positivo")
      .optional()
      .describe("Filtro por id de vendedor"),
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
    nombre: z
      .string({ error: "Faltan campos requeridos (nombre, descripcion, categoria)" })
      .trim()
      .min(1, "Faltan campos requeridos (nombre, descripcion, categoria)")
      .max(150, "El nombre no puede superar 150 caracteres")
      .describe("Nombre del producto (max 150)"),
    descripcion: z
      .string({ error: "Faltan campos requeridos (nombre, descripcion, categoria)" })
      .trim()
      .min(1, "Faltan campos requeridos (nombre, descripcion, categoria)")
      .max(5000, "La descripcion no puede superar 5000 caracteres")
      .describe("Descripcion (TEXT)"),
    precio: precioProducto,
    stock: stockProducto,
    descuento: descuentoProducto.optional().describe("Descuento porcentual (opcional)"),
    categoria: z
      .string({ error: "Faltan campos requeridos (nombre, descripcion, categoria)" })
      .trim()
      .min(1, "Faltan campos requeridos (nombre, descripcion, categoria)")
      .max(100, "La categoria no puede superar 100 caracteres")
      .describe("Categoria (se crea si no existe; max 100)"),
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
    nombre: z
      .string()
      .trim()
      .min(1)
      .max(150, "El nombre no puede superar 150 caracteres")
      .optional()
      .describe("Nombre del producto (max 150)"),
    descripcion: z
      .string()
      .trim()
      .min(1)
      .max(5000, "La descripcion no puede superar 5000 caracteres")
      .optional()
      .describe("Descripcion (TEXT)"),
    precio: precioProducto.optional(),
    stock: stockProducto.optional(),
    descuento: descuentoProducto.optional(),
    categoria: z
      .string()
      .trim()
      .min(1)
      .max(100, "La categoria no puede superar 100 caracteres")
      .optional()
      .describe("Categoria (max 100)"),
  })
  .meta({
    id: "EditarProducto",
    title: "EditarProducto",
    description: "Body de PUT /api/productos/:id (edicion parcial del vendedor)",
    examples: [{ precio: 27000, stock: 8 }],
  });

/** Query de GET /api/productos/mis-productos y GET /api/vendedores. */
export const misProductosQuerySchema = z
  .object({
    page: paginacionSchema.shape.page,
    limit: paginacionSchema.shape.limit,
  })
  .meta({
    id: "MisProductosQuery",
    title: "MisProductosQuery",
    description: "Paginacion de GET /api/productos/mis-productos y GET /api/vendedores",
    examples: [{ page: 1, limit: 50 }],
  });

/** Body de PATCH /api/productos/:id/estado (RF55). */
export const estadoProductoVendedorSchema = z
  .object({
    estado: z.enum(["pausado", "activo"], "El estado debe ser pausado o activo"),
  })
  .strict()
  .meta({
    id: "EstadoProductoVendedor",
    title: "EstadoProductoVendedor",
    description: "Pausa o reactiva una publicacion propia del vendedor (RF55)",
    examples: [{ estado: "pausado" }],
  });
