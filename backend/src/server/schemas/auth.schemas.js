import { z } from "zod";

const email = z.string().email("Email inválido");
// H5 (P2): minimo 8 + complejidad (letra y numero) en vez de 6 sin reglas.
const password = z.string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Za-z]/, "La contraseña debe incluir al menos una letra")
  .regex(/\d/, "La contraseña debe incluir al menos un número");

export const registerSchema = z.object({
    email,
    password,
    nombre_completo: z.string().min(2, "Nombre obligatorio").optional(),
}).strict();

export const loginSchema = z.object({ email, password }).strict();

export const recoverSchema = z.object({ email }).strict();

export const resetSchema = z.object({
    token: z.string().min(10, "Token inválido"),
    password,
}).strict();

export const cambiarRolSchema = z.object({
    rol: z.enum(["comprador", "vendedor"], "Solo comprador o vendedor"),
}).strict();
