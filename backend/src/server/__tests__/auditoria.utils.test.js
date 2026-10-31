import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/db.js", () => {
  const queryInterna = vi.fn();
  const query = vi.fn((sql, ...resto) => queryInterna(sql, ...resto));
  query.mockImplementation = (fn) => { queryInterna.mockImplementation(fn); return query; };
  return { default: { query } };
});

import pool from "../config/db.js";
import { registrarAuditoria, ACCIONES } from "../utils/auditoria.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("utils/auditoria.js (M-11/TASK-4.5)", () => {
  it("registra la accion con detalle JSON, objetivo e IP", async () => {
    pool.query.mockResolvedValue([{ insertId: 1 }, undefined]);

    const ok = await registrarAuditoria({
      actorId: 1,
      accion: ACCIONES.USUARIO_BANEADO,
      objetivoTipo: "usuario",
      objetivoId: 2,
      detalle: { suspendidos: 3, enRevision: 1 },
      ip: "127.0.0.1",
    });

    expect(ok).toBe(true);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO auditoria_acciones"),
      [1, "usuario.baneado", "usuario", 2, JSON.stringify({ suspendidos: 3, enRevision: 1 }), "127.0.0.1"]
    );
  });

  it("acepta campos opcionales ausentes (nulls)", async () => {
    pool.query.mockResolvedValue([{ insertId: 2 }, undefined]);

    await registrarAuditoria({ accion: ACCIONES.REPORTE_ARCHIVADO });

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [
      null, "reporte.archivado", null, null, null, null,
    ]);
  });

  it("usa la conexion en transaccion cuando se pasa conn", async () => {
    const conn = { query: vi.fn().mockResolvedValue([{}, undefined]) };

    await registrarAuditoria({ conn, actorId: 5, accion: ACCIONES.DESEMBOLSO, ip: "10.0.0.1" });

    expect(conn.query).toHaveBeenCalledTimes(1);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("acorta la IP a 45 caracteres (limite de columna)", async () => {
    pool.query.mockResolvedValue([{}, undefined]);

    await registrarAuditoria({ accion: ACCIONES.USUARIO_REACTIVADO, ip: "x".repeat(60) });

    const [, params] = pool.query.mock.calls[0];
    expect(params[5]).toHaveLength(45);
  });

  it("es fail-soft: si la BD falla devuelve false y loguea sin datos sensibles", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    pool.query.mockRejectedValue(new Error("BD caida"));

    await expect(registrarAuditoria({ accion: ACCIONES.USUARIO_REACTIVADO })).resolves.toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("[auditoria]"));

    errorSpy.mockRestore();
  });
});
