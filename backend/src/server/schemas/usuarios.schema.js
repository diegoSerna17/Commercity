import { z } from "zod";
import { paramsIdSchema } from "./common.schema.js";

// ============================================================================
// Contratos del modulo usuarios ( RF2, RF40 ).
// Los endpoints de auth usan validate() con auth.schemas.js; perfil,
// directorio y params se cablean con validate() en routes/usuarios.routes.js.
// ============================================================================

/** Params de GET /api/usuarios/perfil-publico/:id. */
export const perfilPublicoParamsSchema = paramsIdSchema;

/** Query de GET /api/usuarios/directorio (?q opcional). */
export const directorioQuerySchema = z
  .object({
    q: z.string().trim().optional().describe("Texto a buscar en nombre o correo"),
  })
  .meta({
    id: "DirectorioQuery",
    title: "DirectorioQuery",
    description: "Query de GET /api/usuarios/directorio (directorio para iniciar chat)",
    examples: [{ q: "ana" }],
  });

/** Body de PATCH /api/usuarios/me: solo el nombre (obligatorio, max 100). */
export const actualizarPerfilSchema = z
  .object({
    nombre_completo: z
      .string({ error: "El nombre de perfil es obligatorio" })
      .trim()
      .min(1, "El nombre de perfil es obligatorio")
      .max(100, "El nombre de perfil no puede superar 100 caracteres")
      .describe("Nombre de perfil (obligatorio, max 100)"),
  })
  .strict()
  .meta({
    id: "ActualizarPerfil",
    title: "ActualizarPerfil",
    description: "Body de PATCH /api/usuarios/me (actualiza unicamente el nombre)",
    examples: [{ nombre_completo: "Ana Compradora" }],
  });
