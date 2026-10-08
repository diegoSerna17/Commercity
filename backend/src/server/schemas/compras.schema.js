import { z } from "zod";
import { paramsIdSchema } from "./common.schema.js";

// ============================================================================
// Contratos del modulo historial / compras del comprador (RF26-RF32, RF135).
// Espejan la validacion manual de compras.controllers.js:
//  - ?estado solo filtra si es uno de los 4 validos (otro valor = sin filtro).
//  - Cancelar exige :id entero positivo (Number.isInteger + > 0).
// Fuente documental (OpenAPI); sin cablear validate() todavia (Fase 1).
// ============================================================================

/** Query de GET /api/historial/compras (?estado opcional RF30). */
export const historialComprasQuerySchema = z
  .object({
    estado: z
      .enum(["Pendiente", "En camino", "Entregado", "Cancelado"])
      .optional()
      .describe("Filtra lineas por estado (otro valor = sin filtro)"),
  })
  .meta({
    id: "HistorialComprasQuery",
    title: "HistorialComprasQuery",
    description: "Query de GET /api/historial/compras (filtro opcional por estado RF30)",
    examples: [{ estado: "Pendiente" }],
  });

/** Params de POST /api/historial/compras/:id/cancelar (RF135). */
export const cancelarPedidoParamsSchema = paramsIdSchema;
