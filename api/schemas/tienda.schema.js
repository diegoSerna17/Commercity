import { z } from "zod";
import { bancoSchema } from "./cuentaBancaria.schema.js";

// ============================================================================
// Contratos del modulo tienda del vendedor (RF119-RF123, RF130-RF139).
// Espejan la validacion manual de tienda.controllers.js:
//  - parsePaginacion: pagina base 1 con clamp, por_pagina 1-100;
//  - ?estado de ventas solo filtra si es valido (otro valor = sin filtro);
//  - agrupar_por de ingresos: "dia" agrupa por dia, otro valor = transaccion.
// Fuente documental (OpenAPI); sin cablear validate() todavia (Fase 1).
// ============================================================================

export { bancoSchema };
export const upsertCuentaBancariaSchema = bancoSchema;

export const ESTADOS_VENTA = ["Pendiente", "En camino", "Entregado", "Cancelado"];

/** Query de GET /api/tienda/ventas (RF119/RF120). */
export const historialVentasQuerySchema = z
  .object({
    estado: z.enum(ESTADOS_VENTA).optional().describe("Filtra por estado (otro valor = sin filtro)"),
    fecha_desde: z.string().optional().describe("Fecha inicial (YYYY-MM-DD)"),
    fecha_hasta: z.string().optional().describe("Fecha final (YYYY-MM-DD)"),
    q: z.string().optional().describe("Busca en producto, comprador o referencia de pago"),
    pagina: z.coerce.number().int().optional().describe("Pagina base 1 (alias: page)"),
    por_pagina: z.coerce.number().int().optional().describe("Registros por pagina, max 100 (alias: limit)"),
  })
  .meta({
    id: "HistorialVentasQuery",
    title: "HistorialVentasQuery",
    description: "Query de GET /api/tienda/ventas (filtros + paginacion del vendedor)",
    examples: [{ estado: "Pendiente", pagina: 1, por_pagina: 10 }],
  });

/** Query de GET /api/tienda/ingresos (RF121/RF123, 90% del vendedor). */
export const historialIngresosQuerySchema = z
  .object({
    fecha_desde: z.string().optional().describe("Fecha inicial (YYYY-MM-DD)"),
    fecha_hasta: z.string().optional().describe("Fecha final (YYYY-MM-DD)"),
    agrupar_por: z
      .enum(["transaccion", "dia"])
      .default("transaccion")
      .describe("Agrupacion de ingresos (default transaccion)"),
    pagina: z.coerce.number().int().optional().describe("Pagina base 1 (alias: page)"),
    por_pagina: z.coerce.number().int().optional().describe("Registros por pagina, max 100 (alias: limit)"),
  })
  .meta({
    id: "HistorialIngresosQuery",
    title: "HistorialIngresosQuery",
    description: "Query de GET /api/tienda/ingresos (ingresos 90/10 agrupados)",
    examples: [{ agrupar_por: "dia", pagina: 1, por_pagina: 10 }],
  });
