import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import { CRYPTO_EFFECTIVE_KEY } from "../utils/config.js";
import { encryptSensitive } from "../utils/crypto.js";

vi.mock("../config/db.js", () => {
  const queryInterna = vi.fn();
  const query = vi.fn((sql, ...resto) => queryInterna(sql, ...resto));
  query.mockImplementation = (fn) => { queryInterna.mockImplementation(fn); return query; };
  return { default: { query } };
});

import pool from "../config/db.js";
import {
  cifrarCampo,
  descifrarCampo,
  recifrarCuentaBancariaSiEsLegado,
  buildPrivateRecord,
  buildPublicRecord,
  validarCuentaBancaria,
} from "../utils/cuentaBancaria.js";

/** Cifra con el formato ANTERIOR a v2 (sha256 de la clave efectiva, sin AAD). */
function cifrarLegado(texto) {
  const clave = crypto.createHash("sha256").update(CRYPTO_EFFECTIVE_KEY).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", clave, iv);
  const data = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  return [
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    data.toString("base64url"),
  ].join(":");
}

const filaV2 = {
  id: 1,
  usuario_id: 9,
  titular_nombre: cifrarCampo("Ana Perez", 9),
  banco: "Bancolombia",
  tipo_cuenta: "ahorros",
  numero_cuenta: cifrarCampo("1234567890", 9),
  es_commercity: 0,
  updated_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("utils/cuentaBancaria.js (A3/M-10)", () => {
  it("cifra y descifra con el AAD del usuario (y solo con el)", () => {
    expect(descifrarCampo(cifrarCampo("dato-sensible", 7), 7)).toBe("dato-sensible");
    expect(descifrarCampo(cifrarCampo("dato-sensible", 7), 8)).toBeNull();
  });

  it("buildPrivateRecord descifra y buildPublicRecord enmascara sin filtrar el numero", () => {
    const priv = buildPrivateRecord(filaV2);
    expect(priv.numero_cuenta).toBe("1234567890");
    expect(priv.titular_nombre).toBe("Ana Perez");

    const pub = buildPublicRecord(filaV2);
    expect(pub.numero_cuenta_enmascarado).toContain("7890");
    expect(pub.ultimos4).toBe("7890");
    expect(pub.tiene_datos_registrados).toBe(true);
    expect(JSON.stringify(pub)).not.toContain("1234567890");
  });

  it("validarCuentaBancaria distingue registrada/completa/incompleta", () => {
    expect(validarCuentaBancaria(null)).toMatchObject({ registrada: false, completa: false });
    expect(validarCuentaBancaria(filaV2)).toMatchObject({ registrada: true, completa: true });

    const incompleta = { ...filaV2, numero_cuenta: cifrarCampo("12", 9) };
    expect(validarCuentaBancaria(incompleta).completa).toBe(false);
  });

  it("recifrar: un registro ya en v2 no dispara UPDATE", async () => {
    const r = await recifrarCuentaBancariaSiEsLegado(filaV2);

    expect(r).toBe(filaV2);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("recifrar: un registro legado se descifra y se persiste en v2", async () => {
    const legado = {
      ...filaV2,
      titular_nombre: cifrarLegado("Ana Perez"),
      numero_cuenta: cifrarLegado("1234567890"),
    };
    pool.query.mockResolvedValue([{ affectedRows: 1 }, undefined]);

    const r = await recifrarCuentaBancariaSiEsLegado(legado);

    expect(r.titular_nombre.startsWith("v2:")).toBe(true);
    expect(r.numero_cuenta.startsWith("v2:")).toBe(true);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE datos_bancarios"),
      [expect.stringMatching(/^v2:/), expect.stringMatching(/^v2:/), 1]
    );
  });

  it("recifrar es fail-soft si la BD falla (devuelve la fila original)", async () => {
    const legado = {
      ...filaV2,
      titular_nombre: cifrarLegado("Ana Perez"),
      numero_cuenta: cifrarLegado("1234567890"),
    };
    pool.query.mockRejectedValue(new Error("BD caida"));

    const r = await recifrarCuentaBancariaSiEsLegado(legado);

    expect(r).toBe(legado);
  });

  it("recifrar ignora registros indescifrables (no inventa datos)", async () => {
    const ajeno = { ...filaV2, titular_nombre: "aa:bb:cc", numero_cuenta: "aa:bb:cc" };

    const r = await recifrarCuentaBancariaSiEsLegado(ajeno);

    expect(r).toBe(ajeno);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("recifrar devuelve null/undefined tal cual", async () => {
    expect(await recifrarCuentaBancariaSiEsLegado(null)).toBeNull();
  });
});
