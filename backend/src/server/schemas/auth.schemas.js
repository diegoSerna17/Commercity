import { z } from "zod";

const email = z
  .string()
  .email("Email inválido")
  .describe("Correo del usuario")
  .meta({ title: "Email", description: "Correo del usuario", examples: ["comprador@ejemplo.com"] });
// H5 (P2): minimo 8 + complejidad (letra y numero) en vez de 6 sin reglas.
// H8 (TASK-4.8): bcrypt solo considera los primeros 72 BYTES; se rechaza el
// resto en vez de truncarlo en silencio.
const password = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Za-z]/, "La contraseña debe incluir al menos una letra")
  .regex(/\d/, "La contraseña debe incluir al menos un número")
  .refine((valor) => Buffer.byteLength(valor, "utf8") <= 72, "La contraseña no puede superar 72 bytes")
  .describe("Contraseña (min 8, con letra y número; max 72 bytes)")
  .meta({ title: "Password", description: "Contraseña: minimo 8 caracteres, con letra y numero (max 72 bytes)" });

export const registerSchema = z
  .object({
    email,
    password,
    nombre_completo: z
      .string()
      .min(2, "Nombre obligatorio")
      .optional()
      .describe("Nombre completo (opcional, min 2)"),
  })
  .strict()
  .meta({
    id: "Registro",
    title: "Registro",
    description: "Body de POST /api/usuarios/register (crea comprador)",
    examples: [{ email: "comprador@ejemplo.com", password: "Clave1234", nombre_completo: "Ana Compradora" }],
  });

export const loginSchema = z
  .object({ email, password })
  .strict()
  .meta({
    id: "Login",
    title: "Login",
    description: "Body de POST /api/usuarios/login (emite JWT)",
    examples: [{ email: "comprador@ejemplo.com", password: "Clave1234" }],
  });

export const recoverSchema = z
  .object({ email })
  .strict()
  .meta({
    id: "Recuperacion",
    title: "Recuperacion",
    description: "Body de POST /api/usuarios/recover (envia correo de restablecimiento)",
    examples: [{ email: "comprador@ejemplo.com" }],
  });

export const resetSchema = z
  .object({
    token: z.string().min(10, "Token inválido").describe("Token de restablecimiento recibido por correo"),
    password,
  })
  .strict()
  .meta({
    id: "RestablecerPassword",
    title: "RestablecerPassword",
    description: "Body de POST /api/usuarios/reset-password",
    examples: [{ token: "0123456789abcdef", password: "Nueva1234" }],
  });

export const cambiarRolSchema = z
  .object({
    rol: z.enum(["comprador", "vendedor"], "Solo comprador o vendedor").describe("Rol destino del usuario"),
  })
  .strict()
  .meta({
    id: "CambiarRol",
    title: "CambiarRol",
    description: "Body de PATCH /api/usuarios/me/rol (comprador <-> vendedor)",
    examples: [{ rol: "vendedor" }],
  });
