import { describe, expect, it } from "vitest";
import { formatNumber, formatPrice, formatPriceRounded } from "./formatPrice.js";
import { formatCOP } from "./historialUtils.js";

describe("formatPrice", () => {
  it("formatea cero en pesos colombianos", () => {
    expect(formatPrice(0)).toBe("$0");
  });

  it("agrega separadores de miles", () => {
    expect(formatPrice(150000)).toBe("$150.000");
  });

  it("conserva los decimales con la convencion es-CO", () => {
    expect(formatPrice(1500.5)).toBe("$1.500,5");
  });

  it("lanza TypeError ante un precio nulo (el llamador debe omitirlo)", () => {
    // PanelControl y AdminModalReporte solo llaman formatPrice cuando el
    // precio existe; esta prueba documenta esa precondicion.
    expect(() => formatPrice(null)).toThrow(TypeError);
  });
});

describe("formatPriceRounded", () => {
  it("formatea cero con simbolo", () => {
    expect(formatPriceRounded(0)).toBe("$0");
  });

  it("agrega separadores de miles", () => {
    expect(formatPriceRounded(150000)).toBe("$150.000");
  });

  it("redondea hacia abajo los decimales menores a medio peso", () => {
    expect(formatPriceRounded(1500.4)).toBe("$1.500");
  });

  it("redondea hacia arriba desde medio peso", () => {
    expect(formatPriceRounded(1500.5)).toBe("$1.501");
  });

  it("produce el mismo texto que formatCOP para los mismos valores", () => {
    // Caracterizacion de la unificacion: formatCOP delega en esta funcion.
    const valores = [0, 1, 999, 1234567.4, 1234567.6, 150000];

    for (const valor of valores) {
      expect(formatCOP(valor)).toBe(formatPriceRounded(valor));
    }
  });
});

describe("formatNumber", () => {
  it("formatea un conteo sin simbolo de moneda", () => {
    expect(formatNumber(1234567)).toBe("1.234.567");
  });

  it("devuelve cero ante nulo o indefinido", () => {
    expect(formatNumber(null)).toBe("0");
    expect(formatNumber(undefined)).toBe("0");
  });

  it("no antepone el simbolo de moneda", () => {
    expect(formatNumber(10000)).toBe("10.000");
  });
});
