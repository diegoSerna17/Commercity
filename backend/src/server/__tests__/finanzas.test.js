import { describe, it, expect } from "vitest";
import {
  IVA_RATE,
  COMISION_VENDEDOR,
  COMISION_PLATAFORMA,
  round2,
  calcularLinea,
  calcularTotales,
  validarLuhn,
} from "../utils/finanzas.js";

describe("round2", () => {
  it("redondea a 2 decimales", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(1.004)).toBe(1);
    expect(round2(119000.456)).toBe(119000.46);
  });
});

describe("calcularLinea (RF134)", () => {
  it("sin descuento: subtotal = precio / 1.19 e IVA = subtotal x 0.19", () => {
    const r = calcularLinea(119000, 0, 1);
    expect(r.precioFinal).toBe(119000);
    expect(r.subtotal).toBe(100000);
    expect(r.iva).toBe(19000);
    expect(r.total).toBe(119000);
    expect(r.montoVendedor).toBe(90000);
    expect(r.montoComision).toBe(10000);
  });

  it("aplica descuento porcentual antes de desglosar IVA", () => {
    const r = calcularLinea(119000, 10, 2);
    expect(r.precioFinal).toBe(107100);
    expect(r.subtotal).toBe(180000);
    expect(r.iva).toBe(34200);
    expect(r.total).toBe(214200);
    expect(r.montoVendedor).toBe(162000);
    expect(r.montoComision).toBe(18000);
  });

  it("multiplica por cantidad", () => {
    const r = calcularLinea(59500, 0, 3);
    expect(r.subtotal).toBe(150000);
    expect(r.iva).toBe(28500);
    expect(r.total).toBe(178500);
  });

  it("trata descuento ausente como 0", () => {
    const r = calcularLinea(119000, undefined, 1);
    expect(r.subtotal).toBe(100000);
  });

  it("constantes de reparto 90/10", () => {
    expect(IVA_RATE).toBe(0.19);
    expect(COMISION_VENDEDOR).toBe(0.9);
    expect(COMISION_PLATAFORMA).toBe(0.1);
  });
});

describe("calcularTotales (RF117: en vuelo, no persistidos)", () => {
  it("suma lineas", () => {
    const t = calcularTotales([
      { subtotal: 100000, iva: 19000 },
      { subtotal: 50000, iva: 9500 },
    ]);
    expect(t.subtotal).toBe(150000);
    expect(t.iva).toBe(28500);
    expect(t.total).toBe(178500);
  });

  it("maneja arreglo vacio", () => {
    const t = calcularTotales([]);
    expect(t).toEqual({ subtotal: 0, iva: 0, total: 0 });
  });
});

describe("validarLuhn (RF118)", () => {
  it("aprueba Visa de prueba", () => {
    expect(validarLuhn("4111111111111111")).toBe(true);
  });

  it("rechaza numero con Luhn invalido", () => {
    expect(validarLuhn("1234567890123456")).toBe(false);
  });

  it("ignora espacios y no digitos", () => {
    expect(validarLuhn("4111 1111 1111 1111")).toBe(true);
  });

  it("rechaza longitudes fuera de 13-19", () => {
    expect(validarLuhn("4111")).toBe(false);
    expect(validarLuhn("")).toBe(false);
    expect(validarLuhn("abc")).toBe(false);
  });
});
