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
    mensaje: z.string().trim().min(1, "El mensaje está vacío").describe("Texto del mensaje (no vacio)"),
  })
  .meta({
    id: "EnviarMensaje",
    title: "EnviarMensaje",
    description: "Body de POST /api/chat/ (solo texto; el multipart se rechaza con 400)",
    examples: [{ receptor_id: 7, mensaje: "Hola, sigue disponible?" }],
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
