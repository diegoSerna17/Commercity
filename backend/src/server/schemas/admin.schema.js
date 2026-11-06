import { z } from "zod";
import { bancoSchema, bancoPlataformaSchema } from "./cuentaBancaria.schema.js";

// ============================================================================
// Contratos del modulo admin (RF55-RF76; toda ruta exige rol administrador).
// Cableados con validate() en routes/admin.routes.js:
//  - :id numerico entero positivo (paramsIdSchema);
//  - cambio de estado de usuario: solo activo|baneado;
//  - reportes: filtro pendiente|resuelto; resolver exige respuesta max 2000;
//  - buscador: q libre + scope usuario|producto|all (default all).
// ============================================================================

export { bancoSchema };
// M-12 (TASK-4.5): el alta/actualizacion de la cuenta de la plataforma exige
// ademas la contrasena del administrador (step-up).
export const upsertCuentaBancariaAdminSchema = bancoPlataformaSchema;

/** Query de GET /api/admin/usuarios (busqueda + paginacion B-9). */
export const adminUsuariosQuerySchema = z
  .object({
    q: z.string().trim().optional().describe("Busca por nombre o correo"),
    pagina: z.coerce.number().int().positive().default(1).describe("Pagina (default 1)"),
    por_pagina: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(50)
      .describe("Usuarios por pagina (default 50, max 100)"),
  })
  .meta({
    id: "AdminUsuariosQuery",
    title: "AdminUsuariosQuery",
    description: "Query de GET /api/admin/usuarios (RF67/RF73/RF74, paginado B-9)",
    examples: [{ q: "ana", pagina: 1, por_pagina: 50 }],
  });

/** Body de PATCH /api/admin/usuarios/:id/estado. */
export const cambiarEstadoUsuarioSchema = z
  .object({
    estado: z.enum(["activo", "baneado"]).describe("Nuevo estado del usuario"),
  })
  .strict()
  .meta({
    id: "CambiarEstadoUsuario",
    title: "CambiarEstadoUsuario",
    description: "Body de PATCH /api/admin/usuarios/:id/estado (banear/suspender/reactivar)",
    examples: [{ estado: "baneado" }],
  });

/** Query de GET /api/admin/productos. */
export const adminProductosQuerySchema = z
  .object({
    q: z.string().trim().optional().describe("Busca por producto o vendedor"),
    soloActivos: z.string().optional().describe('"true" para excluir suspendidos'),
    pagina: z.coerce.number().int().positive().default(1).describe("Pagina (default 1)"),
    por_pagina: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(50)
      .describe("Productos por pagina (default 50, max 100)"),
  })
  .meta({
    id: "AdminProductosQuery",
    title: "AdminProductosQuery",
    description: "Query de GET /api/admin/productos (RF68/RF72, paginado)",
    examples: [{ q: "cafe", soloActivos: "true", pagina: 1, por_pagina: 50 }],
  });

/** Query de GET /api/admin/reportes. */
export const adminReportesQuerySchema = z
  .object({
    q: z.string().trim().optional().describe("Texto a buscar"),
    estado: z.enum(["pendiente", "resuelto"]).optional().describe("Filtra por estado"),
    incluir_archivados: z.string().optional().describe('Valores que incluyen archivados: "1", "true", "si"'),
    pagina: z.coerce.number().int().positive().default(1).describe("Pagina (default 1)"),
    por_pagina: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(50)
      .describe("Reportes por pagina (default 50, max 100)"),
  })
  .meta({
    id: "AdminReportesQuery",
    title: "AdminReportesQuery",
    description: "Query de GET /api/admin/reportes (RF60-RF66, paginado)",
    examples: [{ estado: "pendiente", pagina: 1, por_pagina: 50 }],
  });

/** Body de PATCH /api/admin/reportes/:id/resolver. */
export const resolverReporteSchema = z
  .object({
    respuesta: z
      .string({ error: "La respuesta es obligatoria" })
      .trim()
      .min(1, "La respuesta es obligatoria")
      .max(2000, "Respuesta demasiado larga")
      .describe("Respuesta de resolucion del admin (max 2000)"),
  })
  .strict()
  .meta({
    id: "ResolverReporte",
    title: "ResolverReporte",
    description: "Body de PATCH /api/admin/reportes/:id/resolver",
    examples: [{ respuesta: "Contenido retirado tras revision" }],
  });

/** Query de GET /api/admin/busqueda (RF69-RF71, FULLTEXT con fallback LIKE). */
export const busquedaAdminQuerySchema = z
  .object({
    q: z.string().trim().default("").describe("Texto a buscar (vacio = listas vacias)"),
    scope: z.enum(["all", "usuario", "producto"]).default("all").describe("Alcance de la busqueda"),
  })
  .meta({
    id: "BusquedaAdminQuery",
    title: "BusquedaAdminQuery",
    description: "Query de GET /api/admin/busqueda (buscador unificado, limite 20 por tipo)",
    examples: [{ q: "cafe", scope: "all" }],
  });
