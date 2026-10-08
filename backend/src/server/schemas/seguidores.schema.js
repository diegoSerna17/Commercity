import { z } from "zod";
import { idParam } from "./common.schema.js";

// ============================================================================
// Contratos del modulo seguidores (RF106, RF110).
// Movidos verbatim desde seguidores.controllers.js (Fase 1):
// misma forma, mismo comportamiento (safeParse en el controller).
// ============================================================================

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
