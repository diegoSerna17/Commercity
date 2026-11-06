import { describe, it, expect } from "vitest";
import { crearReporteSchema } from "../schemas/reportes.schema.js";

// B2 (auditoria 2026-11-04): las reglas de negocio del reporte viven en el
// schema (validate()), no en el controller.
describe("crearReporteSchema", () => {
  it("normaliza la capitalizacion del tipo y acepta Producto con producto_id", () => {
    const parsed = crearReporteSchema.safeParse({
      tipo: "producto",
      motivo: "Producto falsificado",
      producto_id: "9",
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data.tipo).toBe("Producto");
    expect(parsed.data.producto_id).toBe(9);
  });

  it("acepta Usuario con usuario_reportado_id", () => {
    const parsed = crearReporteSchema.safeParse({
      tipo: "USUARIO",
      motivo: "Mensajes ofensivos",
      usuario_reportado_id: 7,
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data.tipo).toBe("Usuario");
  });

  it("rechaza Producto sin producto_id", () => {
    const parsed = crearReporteSchema.safeParse({
      tipo: "Producto",
      motivo: "Falta el objetivo",
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error.issues[0].message).toBe("Debe indicar un producto valido");
  });

  it("rechaza Usuario con producto_id (objetivo ambiguo)", () => {
    const parsed = crearReporteSchema.safeParse({
      tipo: "Usuario",
      motivo: "Objetivo ambiguo",
      producto_id: 3,
      usuario_reportado_id: 7,
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error.issues.some((i) => i.path[0] === "producto_id")).toBe(true);
  });

  it("rechaza Usuario sin usuario_reportado_id", () => {
    const parsed = crearReporteSchema.safeParse({
      tipo: "Usuario",
      motivo: "Falta el objetivo",
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error.issues[0].message).toBe("Debe indicar un usuario valido");
  });
});
