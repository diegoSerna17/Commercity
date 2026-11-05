import { z } from "zod";

// ============================================================================
// Contrato del modulo reportes (RF62/RF63, RF79, RF101), cableado con
// validate() en routes/reportes.routes.js.
//  - tipo se normaliza (mayusculas/minusculas) al ENUM de BD;
//  - motivo obligatorio, max 2000;
//  - tipo=Producto exige producto_id; tipo=Usuario exige
//    usuario_reportado_id (la regla "no reportarse a si mismo" es de negocio y
//    vive en el controller);
//  - evidencia: archivo multipart opcional (no va en el JSON).
// ============================================================================

const normalizarTipo = (tipo) =>
  typeof tipo === "string"
    ? tipo.trim().charAt(0).toUpperCase() + tipo.trim().slice(1).toLowerCase()
    : tipo;

export const crearReporteSchema = z
  .object({
    tipo: z
      .string()
      .trim()
      .min(1, "El tipo de reporte debe ser 'Producto' o 'Usuario'")
      .transform(normalizarTipo)
      .pipe(z.enum(["Producto", "Usuario"], "El tipo de reporte debe ser 'Producto' o 'Usuario'"))
      .describe("Tipo de contenido reportado (se normaliza capitalizacion)"),
    motivo: z
      .string()
      .trim()
      .min(1, "El motivo es obligatorio")
      .max(2000, "El motivo es demasiado largo")
      .describe("Motivo del reporte (max 2000)"),
    producto_id: z.coerce
      .number()
      .int()
      .positive("Debe indicar un producto valido")
      .optional()
      .describe("Producto reportado (requerido si tipo=Producto)"),
    usuario_reportado_id: z.coerce
      .number()
      .int()
      .positive("Debe indicar un usuario valido")
      .optional()
      .describe("Usuario reportado (requerido si tipo=Usuario)"),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.tipo === "Producto") {
      if (data.producto_id === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["producto_id"],
          message: "Debe indicar un producto valido",
        });
      }
      if (data.usuario_reportado_id !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["usuario_reportado_id"],
          message: "Un reporte de producto no admite usuario_reportado_id",
        });
      }
      return;
    }
    if (data.usuario_reportado_id === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["usuario_reportado_id"],
        message: "Debe indicar un usuario valido",
      });
    }
    if (data.producto_id !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["producto_id"],
        message: "Un reporte de usuario no admite producto_id",
      });
    }
  })
  .meta({
    id: "CrearReporte",
    title: "CrearReporte",
    description: "Body de POST /api/reportes/ (multipart: evidencia opcional; informante del JWT)",
    examples: [
      { tipo: "Producto", motivo: "Producto falsificado", producto_id: 9 },
      { tipo: "Usuario", motivo: "Mensajes ofensivos", usuario_reportado_id: 7 },
    ],
  });
