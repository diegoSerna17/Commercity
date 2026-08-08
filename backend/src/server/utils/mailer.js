import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

const resend = apiKey && apiKey !== "re_XXXX_pon_tu_api_key_aqui"
    ? new Resend(apiKey)
    : null;

/**
 * Envia el correo de recuperacion de contrasena.
 * @param {String} email destinatario
 * @param {String} resetUrl enlace con el token
 */
export const enviarCorreoRecuperacion = async (email, resetUrl) => {
    const from = process.env.RESEND_FROM || "CommerCity <onboarding@resend.dev>";

    console.log("\n Link de recuperación generado:");
    console.log(`   Para: ${email}`);
    console.log(`   Enlace: ${resetUrl}\n`);

    // Sin API key configurada -> modo desarrollo: solo imprime el link en consola
    if (!resend) {
        console.log("[DEV] Resend NO configurado — simulación de correo (no se envió nada).\n");
        return { id: "dev-mail-simulado" };
    }

    const { data, error } = await resend.emails.send({
        from,
        to: [email],
        subject: "Recuperación de contraseña — CommerCity",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #f8f8fb; border-radius: 16px;">
                <h2 style="color: #f97316; margin: 0 0 12px;">CommerCity</h2>
                <p style="color: #333; font-size: 15px; line-height: 1.6;">Hola 👋,</p>
                <p style="color: #333; font-size: 15px; line-height: 1.6;">
                    Recibimos una solicitud para restablecer tu contraseña.
                    Haz clic en el botón de abajo para crear una nueva:
                </p>
                <div style="text-align: center; margin: 28px 0;">
                    <a href="${resetUrl}" style="background: #f97316; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block;">
                        Restablecer contraseña
                    </a>
                </div>
                <p style="color: #666; font-size: 13px; line-height: 1.5;">
                    Si no solicitaste este cambio, ignora este correo. El enlace expira en 5 minutos.
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 12px;">
                    © ${new Date().getFullYear()} CommerCity — Todos los derechos reservados.
                </p>
            </div>
        `
    });

    if (error) {
        console.error("❌ Error enviando correo con Resend:", error);
        throw new Error("No se pudo enviar el correo de recuperación");
    }

    return data;
};
