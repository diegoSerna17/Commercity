import { describe, expect, it } from "vitest";
import {
  IVA_RATE,
  calcIVA,
  calcSubtotal,
  calcTotal,
  formatCOP,
  numProductosLabel,
} from "./historialUtils.js";

const PRODUCTOS = [
  { cantidad: 2, precioUnit: 50000 },
  { cantidad: 1, precioUnit: 25000 },
];

describe("historialUtils", () => {
  it("formatCOP redondea y separa miles sin decimales", () => {
    expect(formatCOP(0)).toBe("$0");
    expect(formatCOP(1234567.4)).toBe("$1.234.567");
    expect(formatCOP(1234567.6)).toBe("$1.234.568");
  });

  it("calcula subtotal, IVA del 19 % y total", () => {
    const subtotal = calcSubtotal(PRODUCTOS);

    expect(subtotal).toBe(125000);
    expect(IVA_RATE).toBe(0.19);
    expect(calcIVA(subtotal)).toBeCloseTo(23750);
    expect(calcTotal(subtotal)).toBeCloseTo(148750);
  });

  it("numProductosLabel singular y plural", () => {
    expect(numProductosLabel([])).toBe("0 productos");
    expect(numProductosLabel([PRODUCTOS[0]])).toBe("1 producto");
    expect(numProductosLabel(PRODUCTOS)).toBe("2 productos");
  });
});
