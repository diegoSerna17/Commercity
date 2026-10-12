import { describe, it, expect, vi } from "vitest";
import {
  TOLERANCIA_REEMBOLSO,
  importeReembolsoLinea,
  importeReembolsoLineas,
  reembolsarPago,
} from "../utils/reembolsos.js";

/** Conexion simulada: 1) lectura del pago FOR UPDATE, 2) UPDATE del acumulado. */
const connConPago = (pago, affectedRows = 1) => ({
  query: vi.fn()
    .mockResolvedValueOnce([[pago], undefined])
    .mockResolvedValueOnce([{ affectedRows }, undefined]),
});

describe("utils/reembolsos.js (A-2, M-1, TASK-4.4)", () => {
  it("importeReembolsoLinea aplica IVA y redondea a 2 decimales", () => {
    expect(importeReembolsoLinea(100000)).toBe(119000);
    expect(importeReembolsoLinea("25333.33")).toBe(30146.66);
  });

  it("importeReembolsoLineas suma varias lineas", () => {
    expect(importeReembolsoLineas([{ subtotal: 100000 }, { subtotal: 200000 }])).toBe(357000);
    expect(importeReembolsoLineas([])).toBe(0);
  });

  it("sin fila de pago no muta y devuelve estado null", async () => {
    const conn = { query: vi.fn().mockResolvedValue([[], undefined]) };

    const r = await reembolsarPago(conn, 5, 1000);

    expect(r).toEqual({ actualizado: false, estado: null, monto_reembolsado: 0 });
    expect(conn.query).toHaveBeenCalledTimes(1);
  });

  it("un pago Pendiente/Rechazado no se toca (H2)", async () => {
    const conn = { query: vi.fn().mockResolvedValue([[{ estado: "Pendiente", monto: 100, monto_reembolsado: 0 }], undefined]) };

    const r = await reembolsarPago(conn, 5, 10);

    expect(r.actualizado).toBe(false);
    expect(r.estado).toBe("Pendiente");
    expect(r.monto_reembolsado).toBe(0);
    expect(conn.query).toHaveBeenCalledTimes(1);
  });

  it("marca Reembolsado cuando el acumulado cubre el monto (tolerancia +-0.01)", async () => {
    const conn = connConPago({ estado: "Aprobado", monto: 100, monto_reembolsado: 0 });

    const r = await reembolsarPago(conn, 7, 99.99);

    expect(r).toEqual({ actualizado: true, estado: "Reembolsado", monto_reembolsado: 99.99 });
    const [sql, params] = conn.query.mock.calls[1];
    // A-2: el estado se evalua ANTES de incrementar y con tolerancia B-10
    expect(sql).toContain("estado = IF(monto_reembolsado + ? >= monto - 0.01, 'Reembolsado', 'Aprobado')");
    expect(sql).toContain("monto_reembolsado = LEAST(monto_reembolsado + ?, monto)");
    expect(sql.indexOf("estado = IF")).toBeLessThan(sql.indexOf("monto_reembolsado = LEAST"));
    expect(params).toEqual([99.99, 99.99, 7]);
  });

  it("queda Aprobado cuando el acumulado no cubre el monto", async () => {
    const conn = connConPago({ estado: "Aprobado", monto: 100, monto_reembolsado: 0 });

    const r = await reembolsarPago(conn, 7, 99.98);

    expect(r.estado).toBe("Aprobado");
    expect(r.monto_reembolsado).toBe(99.98);
  });

  it("sobre un pago ya Reembolsado sigue acumulando (A-2: sin early-return)", async () => {
    const conn = connConPago({ estado: "Reembolsado", monto: 100, monto_reembolsado: 50 });

    const r = await reembolsarPago(conn, 7, 60);

    expect(r.actualizado).toBe(true);
    expect(r.estado).toBe("Reembolsado");
    expect(conn.query).toHaveBeenCalledTimes(2);
  });

  it("si la BD no registra el reembolso (affectedRows 0) reporta importe 0", async () => {
    const conn = connConPago({ estado: "Aprobado", monto: 100, monto_reembolsado: 0 }, 0);

    const r = await reembolsarPago(conn, 7, 10);

    expect(r.actualizado).toBe(false);
    expect(r.monto_reembolsado).toBe(0);
  });

  it("la tolerancia de redondeo es de 1 centavo", () => {
    expect(TOLERANCIA_REEMBOLSO).toBe(0.01);
  });
});
