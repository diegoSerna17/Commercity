import { z } from "zod";
import { idParam } from "./common.schema.js";

// ============================================================================
// Contratos del modulo carrito (H1: comprador_id siempre del JWT).
// Cableados con validate() en routes/carrito.routes.js:
// z.coerce.number().int().positive() acepta/rechaza los mismos valores que la
// validacion manual anterior (Number('3')=3 ok; Number('')=0 y NaN rechazados).
// ============================================================================

/** Body de POST /api/carrito/ (agregar; cantidad default 1). */
export const agregarAlCarritoSchema = z
  .object({
    producto_id: idParam.describe("Producto a agregar"),
    cantidad: z.coerce.number().int().positive().default(1).describe("Cantidad (default 1)"),
  })
  .meta({
    id: "AgregarAlCarrito",
    title: "AgregarAlCarrito",
    description: "Body de POST /api/carrito/ (upsert atomico, valida stock)",
    examples: [{ producto_id: 5, cantidad: 2 }],
  });

/** Params :productoId de DELETE/PATCH /api/carrito/:productoId. */
export const carritoProductoParamsSchema = z
  .object({ productoId: idParam })
  .meta({
    id: "CarritoProductoParams",
    title: "CarritoProductoParams",
    description: "Params de DELETE/PATCH /api/carrito/:productoId",
    examples: [{ productoId: 5 }],
  });

/** Body de PATCH /api/carrito/:productoId (nueva cantidad). */
export const modificarCantidadSchema = z
  .object({
    cantidad: z.coerce.number().int().positive().describe("Nueva cantidad (valida stock)"),
  })
  .meta({
    id: "ModificarCantidadCarrito",
    title: "ModificarCantidadCarrito",
    description: "Body de PATCH /api/carrito/:productoId",
    examples: [{ cantidad: 3 }],
  });
