import { z } from "zod";
import { idParam, paginacionSchema } from "./common.schema.js";

// ============================================================================
// Contrato del modulo calificaciones (RF107).
// ============================================================================

/** Query de GET /api/calificaciones/vendedor/:id (RF51). */
export const calificacionesVendedorQuerySchema = z
  .object({
    page: paginacionSchema.shape.page,
    limit: paginacionSchema.shape.limit,
  })
  .meta({
    id: "CalificacionesVendedorQuery",
    title: "CalificacionesVendedorQuery",
    description: "Paginacion de las calificaciones recibidas por un vendedor",
    examples: [{ page: 1, limit: 10 }],
  });

/** Params :id del vendedor. */
export const calificacionesVendedorParamsSchema = z
  .object({ id: idParam })
  .meta({
    id: "CalificacionesVendedorParams",
    title: "CalificacionesVendedorParams",
    description: "Id del vendedor cuyas calificaciones se consultan",
    examples: [{ id: 4 }],
  });

export const calificacionSchema = z
  .object({
    pedido_id: z.number().int().positive().describe("Pedido comprado por el usuario autenticado"),
    vendedor_id: z.number().int().positive().describe("Vendedor a calificar (con linea no cancelada en el pedido)"),
    estrellas: z.number().int().min(1).max(5).describe("Calificacion de 1 a 5 estrellas"),
    comentario: z.string().trim().max(500).optional().describe("Comentario opcional (max 500)"),
  })
  .meta({
    id: "CalificacionVendedor",
    title: "CalificacionVendedor",
    description: "Body de POST /api/calificaciones/vendedor (RF107: calificar tras comprar)",
    examples: [{ pedido_id: 10, vendedor_id: 4, estrellas: 5, comentario: "Excelente vendedor" }],
  });
