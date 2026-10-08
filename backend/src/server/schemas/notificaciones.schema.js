import { z } from "zod";

// ============================================================================
// Contratos del modulo notificaciones.
// Espejan la validacion manual de notificaciones.controllers.js:
//  - ?tipo solo filtra si es uno de los 7 validos (otro valor = 400);
//  - ?limite entero 1-50 (default 50, fuera de rango = 400).
// Fuente documental (OpenAPI); sin cablear validate() todavia (Fase 1).
// ============================================================================

export const TIPOS_NOTIFICACION = [
  "compra",
  "pedido enviado",
  "en camino",
  "entregado",
  "devolucion",
  "mensajes",
  "reporte",
];

export const LIMITE_NOTIFICACIONES_MAXIMO = 50;

/** Query de GET /api/notificaciones/ (filtros opcionales). */
export const listarNotificacionesQuerySchema = z
  .object({
    tipo: z.enum(TIPOS_NOTIFICACION).optional().describe("Filtra por tipo de notificacion"),
    limite: z.coerce
      .number()
      .int()
      .min(1, "El límite debe estar entre 1 y 50")
      .max(50, "El límite debe estar entre 1 y 50")
      .optional()
      .describe("Maximo de registros (default 50)"),
  })
  .meta({
    id: "ListarNotificacionesQuery",
    title: "ListarNotificacionesQuery",
    description: "Query de GET /api/notificaciones/ (tipo y limite opcionales)",
    examples: [{ tipo: "mensajes", limite: 20 }],
  });
