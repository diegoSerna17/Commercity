import { z } from "zod";
import { paramsIdSchema } from "./common.schema.js";

// ============================================================================
// Contratos del modulo historial / compras del comprador (RF26-RF32, RF135).
// Espejan la validacion manual de compras.controllers.js:
//  - ?estado solo filtra si es uno de los 4 validos (otro valor = sin filtro).
//  - Cancelar exige :id entero positivo (Number.isInteger + > 0).
// Fuente documental (OpenAPI); sin cablear validate() todavia (Fase 1).
// ============================================================================

/** Query de GET /api/historial/compras (?estado opcional RF30 + paginacion B-9). */
export const historialComprasQuerySchema = z
  .object({
    // B-9: string libre a proposito; el controller aplica la allowlist manual
    // (otro valor = sin filtro, RF30) en vez de rechazar con 400.
    estado: z.string().optional().describe("Filtra lineas por estado (otro valor = sin filtro)"),
    pagina: z.coerce.number().int().positive().default(1).describe("Pagina (default 1)"),
    por_pagina: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(20)
      .describe("Pedidos por pagina (default 20, max 100)"),
  })
  .meta({
    id: "HistorialComprasQuery",
    title: "HistorialComprasQuery",
    description: "Query de GET /api/historial/compras (filtro opcional por estado RF30 + paginacion B-9)",
    examples: [{ estado: "Pendiente", pagina: 1, por_pagina: 20 }],
  });

/** Params de POST /api/historial/compras/:id/cancelar (RF135). */
export const cancelarPedidoParamsSchema = paramsIdSchema;
