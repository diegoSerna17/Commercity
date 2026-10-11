import { describe, it, expect, vi, afterEach } from "vitest";

const mockFatal = () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    return { exitSpy, errorSpy };
};

afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    process.env.NODE_ENV = "test";
    delete process.env.CRYPTO_SECRET_KEY;
    process.env.JWT_SECRET = "jwt-secret-solo-para-pruebas-vitest-000000000000";
});

describe("utils/config.js - validacion de secretos (fix 3.1, TASK-2.6)", () => {
    it("exporta el secreto cuando existe en el entorno", async () => {
        process.env.JWT_SECRET = "secreto_de_prueba";
        vi.resetModules();
        const { JWT_SECRET, validarJWTSecret } = await import("../utils/config.js");

        expect(JWT_SECRET).toBe("secreto_de_prueba");
        expect(validarJWTSecret("otro_secreto")).toBe("otro_secreto");
    });

    it("si falta JWT_SECRET, registra el error fatal y termina el proceso (exit 1)", async () => {
        const { exitSpy, errorSpy } = mockFatal();
        vi.resetModules();
        const { validarJWTSecret } = await import("../utils/config.js");

        validarJWTSecret("");

        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("FATAL"));
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it("rechaza el valor de ejemplo de JWT_SECRET fuera de test (exit 1)", async () => {
        const { exitSpy, errorSpy } = mockFatal();
        vi.resetModules();
        const { validarJWTSecret } = await import("../utils/config.js");

        validarJWTSecret("cambia_este_valor_por_uno_aleatorio_largo", "production");

        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining("valor de ejemplo")
        );
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it("exige >= 32 caracteres fuera de NODE_ENV=test", async () => {
        const { exitSpy, errorSpy } = mockFatal();
        vi.resetModules();
        const { validarJWTSecret } = await import("../utils/config.js");

        validarJWTSecret("corto", "production");
        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining("al menos 32 caracteres")
        );
        expect(exitSpy).toHaveBeenCalledWith(1);

        exitSpy.mockClear();
        expect(validarJWTSecret("a".repeat(32), "production")).toBe("a".repeat(32));
        expect(exitSpy).not.toHaveBeenCalled();
    });

    it("acepta secretos cortos SOLO en NODE_ENV=test", async () => {
        vi.resetModules();
        const { validarJWTSecret } = await import("../utils/config.js");

        expect(validarJWTSecret("corto", "test")).toBe("corto");
    });

    it("en produccion sin CRYPTO_SECRET_KEY propia el modulo aborta (exit 1)", async () => {
        const { exitSpy, errorSpy } = mockFatal();
        process.env.NODE_ENV = "production";
        process.env.JWT_SECRET = "j".repeat(48);
        delete process.env.CRYPTO_SECRET_KEY;
        vi.resetModules();

        await import("../utils/config.js");

        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining("CRYPTO_SECRET_KEY")
        );
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it("en produccion con CRYPTO_SECRET_KEY propia usa la clave propia (no el fallback)", async () => {
        process.env.NODE_ENV = "production";
        process.env.JWT_SECRET = "j".repeat(48);
        process.env.CRYPTO_SECRET_KEY = "c".repeat(48);
        vi.resetModules();

        const { CRYPTO_SECRET_KEY, CRYPTO_EFFECTIVE_KEY, JWT_SIGNING_KEY } =
            await import("../utils/config.js");

        expect(CRYPTO_SECRET_KEY).toBe("c".repeat(48));
        expect(CRYPTO_SECRET_KEY).not.toBe(JWT_SIGNING_KEY);
        expect(CRYPTO_EFFECTIVE_KEY).toMatch(/^[a-f0-9]{64}$/);
    });
});
