import { z } from "zod";
import { idParam } from "./common.schema.js";

// ============================================================================
// Contratos del modulo chat interno (RF101).
// Espejan la validacion manual de chat.controllers.js:
//  - receptor_id numerico entero positivo, distinto del emisor;
//  - mensaje: texto con trim, vacio = 400;
//  - multipart rechazado en puerta (sin columna de persistencia);
//  - :usuarioId y :id numericos enteros positivos.
// Fuente documental (OpenAPI); sin cablear validate() todavia (Fase 1).
// ============================================================================

/** Body de POST /api/chat/ (mensaje de texto JSON). */
export const enviarMensajeSchema = z
  .object({
    receptor_id: idParam.describe("Destinatario (distinto del usuario autenticado)"),
    // M-14 (TASK-4.7): longitud maxima explicita del mensaje de chat.
    mensaje: z
      .string()
      .trim()
      .min(1, "El mensaje está vacío")
      .max(2000, "El mensaje no puede superar 2000 caracteres")
      .describe("Texto del mensaje (1-2000)"),
  })
  .meta({
    id: "EnviarMensaje",
    title: "EnviarMensaje",
    description: "Body de POST /api/chat/ (solo texto; el multipart se rechaza con 400)",
    examples: [{ receptor_id: 7, mensaje: "Hola, sigue disponible?" }],
  });

/** Query de GET /api/chat/mensajes/:usuarioId (paginacion, TASK-4.7). */
export const conversacionQuerySchema = z
  .object({
    pagina: z.coerce.number().int().positive().default(1).describe("Pagina (default 1)"),
    por_pagina: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(50)
      .describe("Mensajes por pagina (default 50, max 100)"),
  })
  .meta({
    id: "ConversacionQuery",
    title: "ConversacionQuery",
    description: "Query de GET /api/chat/mensajes/:usuarioId (paginado)",
    examples: [{ pagina: 1, por_pagina: 50 }],
  });

/** Params de GET /api/chat/mensajes/:usuarioId. */
export const conversacionParamsSchema = z
  .object({ usuarioId: idParam })
  .meta({
    id: "ConversacionParams",
    title: "ConversacionParams",
    description: "Params de GET /api/chat/mensajes/:usuarioId (historial con otro usuario)",
    examples: [{ usuarioId: 7 }],
  });

/** Params de PATCH /api/chat/mensajes/:id/leido. */
export const mensajeIdParamsSchema = z
  .object({ id: idParam })
  .meta({
    id: "MensajeIdParams",
    title: "MensajeIdParams",
    description: "Params de PATCH /api/chat/mensajes/:id/leido (marca mensaje recibido como leido)",
    examples: [{ id: 15 }],
  });

/** Query de GET /api/chat/conversaciones (paginacion, B-9). */
export const conversacionesQuerySchema = z
  .object({
    pagina: z.coerce.number().int().positive().default(1).describe("Pagina (default 1)"),
    por_pagina: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(50)
      .describe("Conversaciones por pagina (default 50, max 100)"),
  })
  .meta({
    id: "ConversacionesQuery",
    title: "ConversacionesQuery",
    description: "Query de GET /api/chat/conversaciones (paginado, B-9)",
    examples: [{ pagina: 1, por_pagina: 50 }],
  });
