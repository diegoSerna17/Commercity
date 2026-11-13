/**
 * C2 (plan 1.5.5): pruebas de scripts/verificar-entorno.mjs.
 * Cubren presente, ausente, invalida, los avisos de Resend y el contrato de
 * que la salida nunca contiene valores. Importar el script no lee el .env ni
 * ejecuta la revision (guarda de "ejecutado directamente").
 */
import { describe, it, expect } from "vitest";
import {
  evaluarEntorno,
  formatearReporte,
  probarDb,
} from "../../../scripts/verificar-entorno.mjs";

const BASE = {
  NODE_ENV: "development",
  DB_HOST: "localhost",
  DB_PORT: "3306",
  DB_USER: "commercity_app",
  DB_PASSWORD: "clave_local_de_prueba",
  DB_NAME: "commercity_dev",
  JWT_SECRET: "j".repeat(48),
  JWT_EXPIRES_IN: "24h",
  FRONTEND_URL: "http://localhost:5173",
  CRYPTO_SECRET_KEY: "c".repeat(48),
  RESEND_API_KEY: "",
  RESEND_FROM: "CommerCity <onboarding@resend.dev>",
};

const estadoDe = (resultado, nombre) =>
  resultado.filas.find((fila) => fila.nombre === nombre)?.estado;
const detalleDe = (resultado, nombre) =>
  resultado.filas.find((fila) => fila.nombre === nombre)?.detalle;

describe("evaluarEntorno", () => {
  it("reporta presente en un entorno completo y valido", () => {
    const resultado = evaluarEntorno(BASE);

    expect(resultado.errores).toEqual([]);
    for (const nombre of [
      "DB_HOST",
      "DB_PORT",
      "DB_USER",
      "DB_PASSWORD",
      "DB_NAME",
      "JWT_SECRET",
      "JWT_EXPIRES_IN",
      "FRONTEND_URL",
      "CRYPTO_SECRET_KEY",
      "RESEND_FROM",
      "NODE_ENV",
    ]) {
      expect(estadoDe(resultado, nombre)).toBe("presente");
    }
    // Sin RESEND_API_KEY el correo es simulado, pero no es un error.
    expect(estadoDe(resultado, "RESEND_API_KEY")).toBe("ausente");
    expect(formatearReporte(resultado).join("\n")).toContain("Resultado: OK");
  });

  it("marca ausente y falla cuando falta JWT_SECRET", () => {
    const resultado = evaluarEntorno({ ...BASE, JWT_SECRET: "" });

    expect(estadoDe(resultado, "JWT_SECRET")).toBe("ausente");
    expect(resultado.errores).toContain("JWT_SECRET");
    expect(formatearReporte(resultado).join("\n")).toContain("Resultado: FALLO");
  });

  it("marca invalida una JWT_SECRET de ejemplo", () => {
    const resultado = evaluarEntorno({
      ...BASE,
      JWT_SECRET: "cambia_este_valor_por_uno_aleatorio_largo",
    });

    expect(estadoDe(resultado, "JWT_SECRET")).toBe("inválida");
    expect(detalleDe(resultado, "JWT_SECRET")).toContain("ejemplo");
  });

  it("marca invalida una JWT_SECRET corta", () => {
    const resultado = evaluarEntorno({ ...BASE, JWT_SECRET: "corto" });

    expect(estadoDe(resultado, "JWT_SECRET")).toBe("inválida");
    expect(detalleDe(resultado, "JWT_SECRET")).toContain("32");
  });

  it("marca invalido un JWT_EXPIRES_IN con formato desconocido", () => {
    const resultado = evaluarEntorno({ ...BASE, JWT_EXPIRES_IN: "siempre" });

    expect(estadoDe(resultado, "JWT_EXPIRES_IN")).toBe("inválida");
    expect(detalleDe(resultado, "JWT_EXPIRES_IN")).toContain("formato");
  });

  it("trata JWT_EXPIRES_IN ausente como opcional (default 24h)", () => {
    const resultado = evaluarEntorno({ ...BASE, JWT_EXPIRES_IN: "" });

    expect(estadoDe(resultado, "JWT_EXPIRES_IN")).toBe("ausente");
    expect(resultado.errores).not.toContain("JWT_EXPIRES_IN");
  });

  it("rechaza DB_USER root sin clave (igual que config/db.js)", () => {
    const resultado = evaluarEntorno({
      ...BASE,
      DB_USER: "root",
      DB_PASSWORD: "",
    });

    expect(estadoDe(resultado, "DB_USER")).toBe("inválida");
    expect(estadoDe(resultado, "DB_PASSWORD")).toBe("inválida");
    expect(resultado.errores).toEqual(
      expect.arrayContaining(["DB_USER", "DB_PASSWORD"])
    );
  });

  it("exige CRYPTO_SECRET_KEY en produccion", () => {
    const resultado = evaluarEntorno({
      ...BASE,
      NODE_ENV: "production",
      CRYPTO_SECRET_KEY: "",
    });

    expect(estadoDe(resultado, "CRYPTO_SECRET_KEY")).toBe("ausente");
    expect(detalleDe(resultado, "CRYPTO_SECRET_KEY")).toContain("produccion");
    expect(resultado.errores).toContain("CRYPTO_SECRET_KEY");
  });

  it("avisa que DB_NAME no es la base local de pruebas", () => {
    const resultado = evaluarEntorno({ ...BASE, DB_NAME: "otra_base" });

    expect(estadoDe(resultado, "DB_NAME")).toBe("presente");
    expect(resultado.avisos.some((a) => a.includes("commercity_dev"))).toBe(true);
  });

  it("M-7: NODE_ENV es obligatoria y falla si falta", () => {
    const resultado = evaluarEntorno({ ...BASE, NODE_ENV: "" });

    expect(estadoDe(resultado, "NODE_ENV")).toBe("ausente");
    expect(resultado.errores).toContain("NODE_ENV");
    expect(detalleDe(resultado, "NODE_ENV")).toContain("obligatoria");
  });

  it("M-7: NODE_ENV desconocido es invalida", () => {
    const resultado = evaluarEntorno({ ...BASE, NODE_ENV: "staging" });

    expect(estadoDe(resultado, "NODE_ENV")).toBe("inválida");
    expect(resultado.errores).toContain("NODE_ENV");
    expect(detalleDe(resultado, "NODE_ENV")).toContain("development");
  });
});

describe("avisos de Resend (P4)", () => {
  it("avisa que resend.dev solo entrega al dueño de la cuenta", () => {
    const resultado = evaluarEntorno({
      ...BASE,
      RESEND_API_KEY: "re_clave_de_prueba",
      RESEND_FROM: "CommerCity <onboarding@resend.dev>",
    });

    expect(resultado.avisos.some((a) => a.includes("dueño de la cuenta"))).toBe(true);
  });

  it("avisa correo simulado cuando falta RESEND_API_KEY", () => {
    const resultado = evaluarEntorno({ ...BASE, RESEND_API_KEY: "" });

    expect(resultado.avisos.some((a) => a.includes("simulado"))).toBe(true);
  });
});

describe("contrato de confidencialidad", () => {
  it("la salida y el resultado nunca contienen los valores", () => {
    const secreto = "SEGRETO_QUE_NO_DEBE_SALIR_0123456789abcdef";
    const claveDb = "CLAVE_DB_QUE_NO_DEBE_SALIR_9876543210";
    const expiracionInvalida = "exp_que_no_debe_salir";

    const resultado = evaluarEntorno({
      ...BASE,
      JWT_SECRET: secreto,
      CRYPTO_SECRET_KEY: secreto,
      DB_PASSWORD: claveDb,
      JWT_EXPIRES_IN: expiracionInvalida,
    });

    const salida = formatearReporte(resultado).join("\n");
    const serializado = JSON.stringify(resultado);

    for (const valor of [secreto, claveDb, expiracionInvalida]) {
      expect(salida).not.toContain(valor);
      expect(serializado).not.toContain(valor);
    }
  });

  it("probarDb se omite sin intentar conectar si faltan variables", async () => {
    const prueba = await probarDb({ DB_HOST: "", DB_USER: "", DB_NAME: "" });

    expect(prueba.ok).toBe(false);
    expect(prueba.omitido).toBe(true);
    expect(prueba.codigo).toContain("DB_HOST");
  });
});
