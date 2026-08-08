import { describe, it, expect, vi } from "vitest";

describe("utils/config.js - validacion de JWT_SECRET (fix 3.1)", () => {
    it("exporta el secreto cuando existe en el entorno", async () => {
        process.env.JWT_SECRET = "secreto_de_prueba";
        const { JWT_SECRET, validarJWTSecret } = await import("../utils/config.js");

        expect(JWT_SECRET).toBe("secreto_de_prueba");
        expect(validarJWTSecret("otro_secreto")).toBe("otro_secreto");
    });

    it("si falta JWT_SECRET, registra el error fatal y termina el proceso (exit 1)", async () => {
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {});
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const { validarJWTSecret } = await import("../utils/config.js");

        validarJWTSecret("");

        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining("FATAL")
        );
        expect(exitSpy).toHaveBeenCalledWith(1);

        exitSpy.mockRestore();
        errorSpy.mockRestore();
    });
});
