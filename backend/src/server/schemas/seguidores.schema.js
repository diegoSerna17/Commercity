import { z } from "zod";
import { idParam, paginacionSchema } from "./common.schema.js";

// ============================================================================
// Contratos del modulo seguidores (RF106, RF110).
// ============================================================================

/** Query paginada de GET /siguiendo y /seguidores. */
export const seguidoresQuerySchema = z
  .object({
    page: paginacionSchema.shape.page,
    limit: paginacionSchema.shape.limit,
  })
  .meta({
    id: "SeguidoresQuery",
    title: "SeguidoresQuery",
    description: "Paginacion de GET /api/seguidores/siguiendo y /seguidores",
    examples: [{ page: 1, limit: 50 }],
  });

/** Body de POST /api/seguidores/ (seguir a un usuario). */
export const seguirSchema = z
  .object({
    seguido_id: idParam.describe("Usuario a seguir (distinto del autenticado)"),
  })
  .meta({
    id: "SeguirUsuario",
    title: "SeguirUsuario",
    description: "Body de POST /api/seguidores/ (seguir a un usuario)",
    examples: [{ seguido_id: 7 }],
  });

/** Params :id de DELETE /api/seguidores/:id y GET /:id/contadores.
 * Alias del idParam comun (mismo objeto, misma meta): evita registrar dos
 * ids distintos para el mismo contrato en el generador OpenAPI. */
export const seguidorIdParamSchema = idParam;

/** Objeto de params { id } para validate(..., "params"). */
export const seguidorIdParamsSchema = z
  .object({ id: idParam })
  .meta({
    id: "SeguidorIdParams",
    title: "SeguidorIdParams",
    description: "Params :id de DELETE /api/seguidores/:id y GET /:id/contadores",
    examples: [{ id: 7 }],
  });
