import { z } from "zod";

// ============================================================================
// Contrato del modulo calificaciones (RF107).
// Movido verbatim desde calificaciones.controllers.js (Fase 1):
// misma forma, mismos mensajes implicitos, mismo comportamiento.
// ============================================================================

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
