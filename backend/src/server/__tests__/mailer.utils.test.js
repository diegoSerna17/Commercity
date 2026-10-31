import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock de Resend: no envia correos reales. La fabrica se re-ejecuta por cada
// import de "resend" (incluso despues de vi.resetModules).
vi.mock("resend", () => {
    const send = vi.fn();
    // function (no arrow) para que `new Resend(apiKey)` sea valido.
    function Resend() {
        return { emails: { send } };
    }
    return { Resend, __send: send };
});

describe("utils/mailer.js - con RESEND_API_KEY", () => {
    let enviar;
    let enviarAviso;
    let sendMock;

    beforeAll(async () => {
        process.env.RESEND_API_KEY = "re_test_key";
        process.env.RESEND_FROM = "CommerCity <test@resend.dev>";
        ({ enviarCorreoRecuperacion: enviar, enviarAvisoRegistroDuplicado: enviarAviso } =
            await import("../utils/mailer.js"));
        ({ __send: sendMock } = await import("resend"));
    });

    it("envia el correo y devuelve los datos de Resend", async () => {
        sendMock.mockResolvedValue({ data: { id: "mail-1" }, error: null });

        const resultado = await enviar("comprador@test.com", "http://localhost:5173/restore?token=abc");

        expect(resultado).toEqual({ id: "mail-1" });
        expect(sendMock).toHaveBeenCalledTimes(1);
        const arg = sendMock.mock.calls[0][0];
        expect(arg.to).toEqual(["comprador@test.com"]);
        // Fix 3.4: el texto del correo dice 5 minutos (RF4), no 1 hora
        expect(arg.html).toContain("5 minutos");
        expect(arg.html).not.toContain("1 hora");
    });

    it("lanza error si Resend responde con error", async () => {
        sendMock.mockResolvedValue({ data: null, error: new Error("mail fail") });

        await expect(enviar("a@test.com", "http://localhost:5173/restore?token=abc"))
            .rejects.toThrow("No se pudo enviar el correo de recuperación");
    });

    it("M-15: envia el aviso de registro duplicado al titular", async () => {
        sendMock.mockResolvedValue({ data: { id: "mail-aviso" }, error: null });

        const resultado = await enviarAviso("existe@test.com");

        expect(resultado).toEqual({ id: "mail-aviso" });
        const arg = sendMock.mock.calls.at(-1)[0];
        expect(arg.to).toEqual(["existe@test.com"]);
        expect(arg.subject).toContain("Intento de registro");
        // El aviso no incluye enlaces con token ni datos de la cuenta
        expect(arg.html).not.toContain("restore?token");
        expect(arg.html).not.toContain("nombre_completo");
    });

    it("M-15: lanza error si Resend falla al enviar el aviso", async () => {
        sendMock.mockResolvedValue({ data: null, error: new Error("aviso fail") });

        await expect(enviarAviso("existe@test.com"))
            .rejects.toThrow("No se pudo enviar el aviso de registro");
    });
});

describe("utils/mailer.js - modo desarrollo sin API key", () => {
    it("simula el correo en consola y no llama a Resend", async () => {
        vi.resetModules();
        delete process.env.RESEND_API_KEY;

        const { enviarCorreoRecuperacion: enviarDev, enviarAvisoRegistroDuplicado: avisoDev } =
            await import("../utils/mailer.js");
        const resultado = await enviarDev("dev@test.com", "http://localhost:5173/restore?token=abc");

        expect(resultado).toEqual({ id: "dev-mail-simulado" });
        // M-15: el aviso tambien se simula sin API key
        await expect(avisoDev("dev@test.com")).resolves.toEqual({ id: "dev-mail-simulado" });
    });
});
