import { describe, expect, it } from "vitest";
import { formatCOP, numProductosLabel } from "./historialUtils.js";

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

  it("numProductosLabel singular y plural", () => {
    expect(numProductosLabel([])).toBe("0 productos");
    expect(numProductosLabel([PRODUCTOS[0]])).toBe("1 producto");
    expect(numProductosLabel(PRODUCTOS)).toBe("2 productos");
  });
});
