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
    // M-28/TASK-5.5: la pasarela es simulada y el backend NUNCA recibe el PAN.
    // Solo circulan los ultimos 4 digitos y la marca de la tarjeta.
    ultimos4_tarjeta: z
      .string()
      .regex(/^\d{4}$/, "Ultimos 4 digitos de la tarjeta")
      .optional()
      .describe("Ultimos 4 digitos (requerido si metodo_pago=tarjeta)"),
    marca_tarjeta: z
      .enum(["Visa", "Mastercard", "Amex", "Otra"])
      .optional()
      .describe("Marca de la tarjeta (opcional)"),
    nombre_tarjeta: z.string().trim().max(100).optional().describe("Nombre en la tarjeta"),
  })
  .strict()
  .meta({
    id: "ConfirmarPago",
    title: "ConfirmarPago",
    description: "Body de POST /api/pedidos/confirmar-pago (checkout ACID RF134; tarjeta enmascarada, M-28)",
    examples: [
      { direccion_envio: "Calle 10 #20-30, Medellin", metodo_pago: "tarjeta", ultimos4_tarjeta: "1111", marca_tarjeta: "Visa", nombre_tarjeta: "Ana Compradora" },
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
