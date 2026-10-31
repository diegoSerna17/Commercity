import { z } from "zod";

// ============================================================================
// Primitivas compartidas de la API CommerCity.
// Fuente unica para ids de ruta, paginacion y envoltorios de respuesta.
// Fase 1 del plan docs-api-Zod: estos esquemas alimentan el generador
// OpenAPI 3.1 (z.toJSONSchema) sin duplicar definiciones.
// ============================================================================

/** Id entero positivo de ruta. Acepta string numerico (Express entrega strings). */
export const idParam = z.coerce
  .number()
  .int()
  .positive()
  .describe("Identificador entero positivo")
  .meta({ title: "IdParam", description: "Identificador entero positivo de ruta o cuerpo" });

/** Params { id } de rutas /:id. */
export const paramsIdSchema = z
  .object({ id: idParam })
  .meta({
    id: "ParamsId",
    title: "ParamsId",
    description: "Parametro de ruta :id (entero positivo)",
    examples: [{ id: 12 }],
  });

/** Paginacion ?page=&limit= compacta (catalogo publico). */
export const paginacionSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1).describe("Pagina, base 1"),
    limit: z.coerce.number().int().min(1).max(100).default(4).describe("Registros por pagina (max 100)"),
  })
  .meta({
    id: "Paginacion",
    title: "Paginacion",
    description: "Paginacion del catalogo publico (?page, ?limit)",
    examples: [{ page: 1, limit: 4 }],
  });

/** Paginacion estilo tienda (?pagina=&por_pagina=, alias ?page=&limit=). */
export const paginacionTiendaSchema = z
  .object({
    pagina: z.coerce.number().int().min(1).default(1).describe("Pagina, base 1"),
    por_pagina: z.coerce.number().int().min(1).max(100).default(10).describe("Registros por pagina (max 100)"),
  })
  .meta({
    id: "PaginacionTienda",
    title: "PaginacionTienda",
    description: "Paginacion de historiales de tienda (?pagina, ?por_pagina)",
    examples: [{ pagina: 1, por_pagina: 10 }],
  });

/** Envoltorio uniforme de respuestas exitosas { success, message?, data }. */
export const envoltorioOkSchema = z
  .object({
    success: z.literal(true).describe("Siempre true en respuestas exitosas"),
    message: z.string().optional().describe("Mensaje humano opcional"),
    data: z.unknown().describe("Carga util (forma por endpoint)"),
  })
  .meta({
    id: "EnvoltorioOk",
    title: "EnvoltorioOk",
    description: "Envoltorio uniforme de respuestas exitosas",
  });

/** Envoltorio uniforme de errores { success, error: { code, message, details? } }. */
export const envoltorioErrorSchema = z
  .object({
    success: z.literal(false).describe("Siempre false en errores"),
    error: z
      .object({
        code: z.string().describe("Codigo maquina (p. ej. VALIDATION_ERROR, NOT_FOUND)"),
        message: z.string().describe("Mensaje humano"),
      })
      .catchall(z.unknown()),
  })
  .meta({
    id: "EnvoltorioError",
    title: "EnvoltorioError",
    description: "Envoltorio uniforme de respuestas de error",
  });
