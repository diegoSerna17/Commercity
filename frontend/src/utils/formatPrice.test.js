import { describe, expect, it } from "vitest";
import { formatPrice } from "./formatPrice.js";

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
