import { z } from "zod";
import { paramsIdSchema } from "./common.schema.js";

// ============================================================================
// Contratos del modulo pedidos / pago (RF35, RF113/RF114/RF117/RF118, RF134).
// confirmarPagoSchema y estadoSchema movidos verbatim desde
// pedidos.controllers.js (Fase 1): misma forma, mismo comportamiento.
// paramsIdSchema se reutiliza desde common (forma identica).
// ============================================================================

export const confirmarPagoSchema = z
  .object({
    direccion_envio: z.string().trim().min(5).max(1000).describe("Direccion de envio (5-1000)"),
    metodo_pago: z.enum(["tarjeta", "transferencia", "pse"]).describe("Metodo de pago simulado"),
    numero_tarjeta: z.string().trim().optional().describe("Requerido si metodo_pago=tarjeta (se valida Luhn, RF118)"),
    nombre_tarjeta: z.string().trim().max(100).optional().describe("Nombre en la tarjeta"),
  })
  .strict()
  .meta({
    id: "ConfirmarPago",
    title: "ConfirmarPago",
    description: "Body de POST /api/pedidos/confirmar-pago (checkout ACID RF134)",
    examples: [
      { direccion_envio: "Calle 10 #20-30, Medellin", metodo_pago: "tarjeta", numero_tarjeta: "4111111111111111", nombre_tarjeta: "Ana Compradora" },
    ],
  });

export const estadoSchema = z
  .object({
    // Vendedor: "En camino" | "Entregado" (avanza 1 nivel).
    // Comprador: "Cancelado" (RF35 reembolso y restitución de stock).
    estado: z.enum(["En camino", "Entregado", "Cancelado"]).describe("Transicion de estado solicitada"),
    // Opcional. Solo se usa cuando estado = "Cancelado": si se pasa detalle_id
    // se cancela SOLO esa línea; si no, se cancela TODO el pedido
    // (líneas que aún no están Entregado).
    detalle_id: z.coerce.number().int().positive().optional().describe("Linea a cancelar (solo con estado=Cancelado)"),
  })
  .strict()
  .meta({
    id: "ActualizarEstadoPedido",
    title: "ActualizarEstadoPedido",
    description: "Body de PATCH /api/pedidos/:id/estado (vendedor avanza nivel; comprador cancela RF35)",
    examples: [{ estado: "En camino" }, { estado: "Cancelado", detalle_id: 3 }],
  });

export { paramsIdSchema };
export const pedidoIdParamsSchema = paramsIdSchema;
