import { z } from "zod";
import { bancoSchema } from "./cuentaBancaria.schema.js";

// ============================================================================
// Contratos del modulo tienda del vendedor (RF119-RF123, RF130-RF139).
// Se aplican con validate() en tienda.routes.js:
//  - paginacion de ventas/ingresos: truncado + clamp (R2), nunca 400;
//  - ?estado de ventas solo filtra si es valido (otro valor = sin filtro);
//  - agrupar_por de ingresos: "dia" agrupa por dia, otro valor = transaccion.
// ============================================================================

export { bancoSchema };
export const upsertCuentaBancariaSchema = bancoSchema;

export const ESTADOS_VENTA = ["Pendiente", "En camino", "Entregado", "Cancelado"];

// R2: la paginacion de tienda trunca a entero y aplica clamp (nunca 400):
// el controller ya dependia de ese comportamiento, se conserva al validar en
// la ruta. Los alias ?page/?limit siguen disponibles.
const paginaTiendaSchema = z.coerce
  .number()
  .optional()
  .transform((n) => (n === undefined ? undefined : Math.max(1, Math.trunc(n))))
  .describe("Pagina base 1 (alias: page)");

const porPaginaTiendaSchema = z.coerce
  .number()
  .optional()
  .transform((n) =>
    n === undefined ? undefined : Math.min(100, Math.max(1, Math.trunc(n)))
  )
  .describe("Registros por pagina, max 100 (alias: limit)");

/** Query de GET /api/tienda/ventas (RF119/RF120). */
export const historialVentasQuerySchema = z
  .object({
    // string libre: otro valor se ignora (sin filtro), igual que antes.
    estado: z.string().optional().describe("Filtra por estado (otro valor = sin filtro)"),
    fecha_desde: z.string().optional().describe("Fecha inicial (YYYY-MM-DD)"),
    fecha_hasta: z.string().optional().describe("Fecha final (YYYY-MM-DD)"),
    q: z.string().optional().describe("Busca en producto, comprador o referencia de pago"),
    pagina: paginaTiendaSchema,
    por_pagina: porPaginaTiendaSchema,
    page: z.coerce.number().optional().describe("Alias de pagina"),
    limit: z.coerce.number().optional().describe("Alias de por_pagina"),
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
    // string libre: "dia" agrupa por dia; otro valor = transaccion.
    agrupar_por: z
      .string()
      .optional()
      .describe("Agrupacion de ingresos: dia = por dia; otro valor = transaccion"),
    pagina: paginaTiendaSchema,
    por_pagina: porPaginaTiendaSchema,
    page: z.coerce.number().optional().describe("Alias de pagina"),
    limit: z.coerce.number().optional().describe("Alias de por_pagina"),
  })
  .meta({
    id: "HistorialIngresosQuery",
    title: "HistorialIngresosQuery",
    description: "Query de GET /api/tienda/ingresos (ingresos 90/10 agrupados)",
    examples: [{ agrupar_por: "dia", pagina: 1, por_pagina: 10 }],
  });
