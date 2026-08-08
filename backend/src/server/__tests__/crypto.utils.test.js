import { describe, it, expect } from "vitest";
import {
  encryptSensitive,
  decryptSensitive,
  maskBankAccount,
  maskFullName,
} from "../utils/crypto.js";

describe("utils/crypto.js (RNF11 - fix 3.2)", () => {
  it("cifra y descifra un dato sensible (roundtrip)", () => {
    const cifrado = encryptSensitive("Maria Lopez");
    expect(cifrado).toBeTruthy();
    // No guarda el texto plano
    expect(cifrado).not.toContain("Maria");
    expect(decryptSensitive(cifrado)).toBe("Maria Lopez");
  });

  it("genera cifrados distintos para el mismo texto (IV aleatorio)", () => {
    const a = encryptSensitive("1234567890");
    const b = encryptSensitive("1234567890");
    expect(a).not.toBe(b);
    expect(decryptSensitive(a)).toBe("1234567890");
    expect(decryptSensitive(b)).toBe("1234567890");
  });

  it("devuelve null para entradas vacias o corruptas", () => {
    expect(encryptSensitive(null)).toBeNull();
    expect(encryptSensitive(undefined)).toBeNull();
    expect(decryptSensitive(null)).toBeNull();
    expect(decryptSensitive("")).toBeNull();
    expect(decryptSensitive("basura-no-cifrada")).toBeNull();
  });

  it("enmascara el numero de cuenta dejando los ultimos 4", () => {
    expect(maskBankAccount("12345678901234")).toBe("**********1234");
    expect(maskBankAccount("1234")).toBe("1234");
    expect(maskBankAccount(null)).toBe("****");
  });

  it("enmascara el nombre del titular conservando la ultima palabra", () => {
    expect(maskFullName("Maria Fernanda Lopez")).toBe("M**** F******* Lopez");
    expect(maskFullName(null)).toBeNull();
  });
});
