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

/**
 * Body de PATCH /api/usuarios/me (RF14-RF17, RF38, RF39).
 * Todos los campos son opcionales, pero debe venir al menos uno. La foto se
 * sube por multipart en el campo "avatar"; en JSON solo viajan los textos.
 */
export const actualizarPerfilSchema = z
  .object({
    nombre_completo: z
      .string({ error: "El nombre de perfil es obligatorio" })
      .trim()
      .min(1, "El nombre de perfil es obligatorio")
      .max(100, "El nombre de perfil no puede superar 100 caracteres")
      .optional()
      .describe("Nombre de perfil (max 100)"),
    descripcion_personal: z
      .string()
      .trim()
      .max(2000, "La descripcion no puede superar 2000 caracteres")
      .optional()
      .describe("Descripcion personal del perfil (max 2000)"),
    direccion_envio: z
      .string()
      .trim()
      .max(500, "La direccion no puede superar 500 caracteres")
      .optional()
      .describe("Direccion de envio por defecto (max 500)"),
    // Marcador interno: la ruta lo agrega cuando llega un archivo multipart,
    // para que un PATCH que solo cambia el avatar no falle por body vacio.
    avatar: z.literal("1").optional().describe("Marcador interno del avatar multipart"),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Debes enviar al menos un campo para actualizar el perfil"
  )
  .meta({
    id: "ActualizarPerfil",
    title: "ActualizarPerfil",
    description:
      "Body de PATCH /api/usuarios/me (nombre, descripcion o direccion; avatar por multipart)",
    examples: [
      { nombre_completo: "Ana Compradora", descripcion_personal: "Compro en CommerCity" },
    ],
  });
