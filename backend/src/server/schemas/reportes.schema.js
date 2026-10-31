import { z } from "zod";

// ============================================================================
// Contrato del modulo reportes (RF62/RF63, RF79, RF101).
// Espeja la validacion manual de reportes.controllers.js:
//  - tipo se normaliza (mayusculas/minusculas) al ENUM de BD;
//  - motivo obligatorio, max 2000;
//  - tipo=Producto exige producto_id valido; tipo=Usuario exige
//    usuario_reportado_id valido y distinto del informante;
//  - evidencia: archivo multipart opcional (no va en el JSON).
// Fuente documental (OpenAPI); sin cablear validate() todavia (Fase 1).
// ============================================================================

const baseReporte = {
  tipo: z.enum(["Producto", "Usuario"]).describe("Tipo de contenido reportado (se normaliza capitalizacion)"),
  motivo: z
    .string()
    .trim()
    .min(1, "El motivo es obligatorio")
    .max(2000, "El motivo es demasiado largo")
    .describe("Motivo del reporte (max 2000)"),
};

export const crearReporteSchema = z
  .discriminatedUnion("tipo", [
    z
      .object({
        ...baseReporte,
        tipo: z.literal("Producto"),
        producto_id: z.coerce.number().int().positive().describe("Producto reportado"),
      })
      .strict(),
    z
      .object({
        ...baseReporte,
        tipo: z.literal("Usuario"),
        usuario_reportado_id: z.coerce.number().int().positive().describe("Usuario reportado (distinto del informante)"),
      })
      .strict(),
  ])
  .meta({
    id: "CrearReporte",
    title: "CrearReporte",
    description: "Body de POST /api/reportes/ (multipart: evidencia opcional; informante del JWT)",
    examples: [
      { tipo: "Producto", motivo: "Producto falsificado", producto_id: 9 },
      { tipo: "Usuario", motivo: "Mensajes ofensivos", usuario_reportado_id: 7 },
    ],
  });
