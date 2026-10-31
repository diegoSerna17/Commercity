const { z } = require("zod");

const password = z
  .string()
  .min(8, "La contrasena debe tener al menos 8 caracteres")
  .regex(/[A-Za-z]/, "Debe incluir al menos una letra")
  .regex(/\d/, "Debe incluir al menos un numero");

const registerSchema = z
  .object({
    email: z.string().email("Email invalido"),
    password,
    nombre_completo: z.string().min(2).optional(),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().email("Email invalido"),
    password,
  })
  .strict();

module.exports = { registerSchema, loginSchema };
