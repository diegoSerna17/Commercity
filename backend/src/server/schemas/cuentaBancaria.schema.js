import { z } from "zod";

// A3 (P2 auditoria 2026-10-05): esquema unico de cuenta bancaria.
// Antes duplicado en admin/cuentaBancaria.controllers.js y tienda.controllers.js.
export const bancoSchema = z
  .object({
    titular_nombre: z
      .string()
      .trim()
      .min(3)
      .max(100)
      .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/, "El titular solo puede contener letras y espacios")
      .describe("Nombre del titular (solo letras y espacios)"),
    banco: z.string().trim().min(3).max(50).describe("Nombre del banco"),
    tipo_cuenta: z.enum(["ahorros", "corriente"]).describe("Tipo de cuenta"),
    numero_cuenta: z
      .string()
      .regex(/^\d+$/, "El número de cuenta solo puede contener dígitos")
      .min(6)
      .max(20)
      .describe("Numero de cuenta (solo digitos, 6-20)"),
  })
  .strict()
  .meta({
    id: "CuentaBancaria",
    title: "CuentaBancaria",
    description: "Body de alta/actualizacion de cuenta bancaria (vendedor y admin). RNF11: se cifra en BD.",
    examples: [
      { titular_nombre: "Ana Compradora", banco: "Bancolombia", tipo_cuenta: "ahorros", numero_cuenta: "1234567890" },
    ],
  });

/**
 * M-12 (TASK-4.5): el cambio de la cuenta bancaria DE LA PLATAFORMA exige
 * step-up con la contrasena del administrador (accion sensible sobre dinero).
 */
export const bancoPlataformaSchema = bancoSchema
  .extend({
    password: z
      .string()
      .min(8)
      .max(72)
      .describe("Contrasena del administrador (step-up obligatorio)"),
  })
  .meta({
    id: "CuentaBancariaPlataforma",
    title: "CuentaBancariaPlataforma",
    description: "Body de alta/actualizacion de la cuenta bancaria de Commercity (admin + contrasena)",
    examples: [
      {
        titular_nombre: "CommerCity SAS",
        banco: "Bancolombia",
        tipo_cuenta: "corriente",
        numero_cuenta: "1234567890",
        password: "ClaveAdmin123",
      },
    ],
  });
