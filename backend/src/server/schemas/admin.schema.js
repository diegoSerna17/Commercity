import { z } from "zod";
import { bancoSchema, bancoPlataformaSchema } from "./cuentaBancaria.schema.js";

// ============================================================================
// Contratos del modulo admin (RF55-RF76; toda ruta exige rol administrador).
// Espejan la validacion manual de controllers/admin/*:
//  - :id numerico entero positivo (validarId);
//  - cambio de estado de usuario: solo activo|baneado (motivo lo genera el servidor);
//  - reportes: filtro pendiente|resuelto; resolver exige respuesta max 2000;
//  - buscador: q libre + scope usuario|producto|all (default all).
// Fuente documental (OpenAPI); sin cablear validate() todavia (Fase 1).
// ============================================================================

export { bancoSchema };
// M-12 (TASK-4.5): el alta/actualizacion de la cuenta de la plataforma exige
// ademas la contrasena del administrador (step-up).
export const upsertCuentaBancariaAdminSchema = bancoPlataformaSchema;

/** Query de GET /api/admin/usuarios. */
export const adminUsuariosQuerySchema = z
  .object({
    q: z.string().trim().optional().describe("Busca por nombre o correo"),
  })
  .meta({
    id: "AdminUsuariosQuery",
    title: "AdminUsuariosQuery",
    description: "Query de GET /api/admin/usuarios (RF67/RF73/RF74)",
    examples: [{ q: "ana" }],
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
  })
  .meta({
    id: "AdminProductosQuery",
    title: "AdminProductosQuery",
    description: "Query de GET /api/admin/productos (RF68/RF72)",
    examples: [{ q: "cafe", soloActivos: "true" }],
  });

/** Query de GET /api/admin/reportes. */
export const adminReportesQuerySchema = z
  .object({
    q: z.string().trim().optional().describe("Texto a buscar"),
    estado: z.enum(["pendiente", "resuelto"]).optional().describe("Filtra por estado"),
    incluir_archivados: z.string().optional().describe('Valores que incluyen archivados: "1", "true", "si"'),
  })
  .meta({
    id: "AdminReportesQuery",
    title: "AdminReportesQuery",
    description: "Query de GET /api/admin/reportes (RF60-RF66)",
    examples: [{ estado: "pendiente" }],
  });

/** Body de PATCH /api/admin/reportes/:id/resolver. */
export const resolverReporteSchema = z
  .object({
    respuesta: z
      .string()
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
    q: z.string().trim().describe("Texto a buscar (vacio = listas vacias)"),
    scope: z.enum(["all", "usuario", "producto"]).default("all").describe("Alcance de la busqueda"),
  })
  .meta({
    id: "BusquedaAdminQuery",
    title: "BusquedaAdminQuery",
    description: "Query de GET /api/admin/busqueda (buscador unificado, limite 20 por tipo)",
    examples: [{ q: "cafe", scope: "all" }],
  });
