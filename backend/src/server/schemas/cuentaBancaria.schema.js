import { z } from "zod";

// A3 (P2 auditoria 2026-10-05): esquema unico de cuenta bancaria.
// Antes duplicado en admin/cuentaBancaria.controllers.js y tienda.controllers.js.
export const bancoSchema = z
  .object({
    titular_nombre: z.string().trim().min(3).max(100)
      .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/, "El titular solo puede contener letras y espacios"),
    banco: z.string().trim().min(3).max(50),
    tipo_cuenta: z.enum(["ahorros", "corriente"]),
    numero_cuenta: z.string().regex(/^\d+$/, "El número de cuenta solo puede contener dígitos")
      .min(6).max(20),
  })
  .strict();
