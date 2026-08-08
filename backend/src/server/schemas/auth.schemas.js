import { z } from "zod";

const email = z.string().email("Email inválido");
const password = z.string().min(6, "La contraseña debe tener al menos 6 caracteres");

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
