import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import {
  encryptSensitive,
  decryptSensitive,
  maskBankAccount,
  maskFullName,
} from "../utils/crypto.js";

/**
 * Cifra con la clave LEGADA (pre-fix H5): sha256(CRYPTO_SECRET_KEY || JWT_SECRET)
 * en bruto. Reproduce el formato de los registros ya existentes en BD.
 */
function cifrarConClaveLegada(texto) {
  const secreto = process.env.CRYPTO_SECRET_KEY || process.env.JWT_SECRET;
  const clave = crypto.createHash("sha256").update(secreto).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", clave, iv);
  const data = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  return [
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    data.toString("base64url"),
  ].join(":");
}

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

  it("descifra registros cifrados con la clave legada (fallback pre-fix H5)", () => {
    const legado = cifrarConClaveLegada("6030012345678");
    expect(decryptSensitive(legado)).toBe("6030012345678");
  });

  it("descifra registros de la ventana intermedia (commit fac1b9a)", () => {
    const secreto = process.env.CRYPTO_SECRET_KEY || process.env.JWT_SECRET;
    const base = crypto
      .createHash("sha256")
      .update(`${secreto}::crypto`)
      .digest("hex");
    const clave = crypto.createHash("sha256").update(base).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", clave, iv);
    const data = Buffer.concat([cipher.update("7001112223", "utf8"), cipher.final()]);
    const intermedio = [
      iv.toString("base64url"),
      cipher.getAuthTag().toString("base64url"),
      data.toString("base64url"),
    ].join(":");
    expect(decryptSensitive(intermedio)).toBe("7001112223");
  });

  it("el fallback legado no afecta el roundtrip de la clave actual", () => {
    const actual = encryptSensitive("0190123456");
    expect(decryptSensitive(actual)).toBe("0190123456");
  });

  it("devuelve null si ambos intentos de clave fallan (dato ajeno)", () => {
    // Cifrado con una clave que no es ni la actual ni la legada.
    const claveAjena = crypto.createHash("sha256").update("otro_secreto").digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", claveAjena, iv);
    const data = Buffer.concat([cipher.update("secreto", "utf8"), cipher.final()]);
    const ajeno = [
      iv.toString("base64url"),
      cipher.getAuthTag().toString("base64url"),
      data.toString("base64url"),
    ].join(":");
    expect(decryptSensitive(ajeno)).toBeNull();
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
