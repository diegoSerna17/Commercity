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
    let sendMock;

    beforeAll(async () => {
        process.env.RESEND_API_KEY = "re_test_key";
        process.env.RESEND_FROM = "CommerCity <test@resend.dev>";
        ({ enviarCorreoRecuperacion: enviar } = await import("../utils/mailer.js"));
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
});

describe("utils/mailer.js - modo desarrollo sin API key", () => {
    it("simula el correo en consola y no llama a Resend", async () => {
        vi.resetModules();
        delete process.env.RESEND_API_KEY;

        const { enviarCorreoRecuperacion: enviarDev } = await import("../utils/mailer.js");
        const resultado = await enviarDev("dev@test.com", "http://localhost:5173/restore?token=abc");

        expect(resultado).toEqual({ id: "dev-mail-simulado" });
    });
});
