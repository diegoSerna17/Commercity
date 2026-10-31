import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import {
  encryptSensitive,
  decryptSensitive,
  maskBankAccount,
  maskFullName,
  esCifradoV2,
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

describe("utils/crypto.js v2 (M-10/H10 - TASK-4.4)", () => {
  it("el cifrado nuevo lleva el prefijo de version v2: y es detectado por esCifradoV2", () => {
    const cifrado = encryptSensitive("Maria Lopez");
    expect(cifrado.startsWith("v2:")).toBe(true);
    expect(esCifradoV2(cifrado)).toBe(true);
    // Los formatos anteriores (sin prefijo) no son v2
    expect(esCifradoV2("aXY6dGFnOmRhdGE")).toBe(false);
    expect(esCifradoV2(null)).toBe(false);
  });

  it("roundtrip v2 con AAD (usuario_id)", () => {
    const cifrado = encryptSensitive("6030012345678", { aad: "42" });
    expect(cifrado.startsWith("v2:")).toBe(true);
    expect(decryptSensitive(cifrado, { aad: "42" })).toBe("6030012345678");
    expect(decryptSensitive(cifrado, { aad: 42 })).toBe("6030012345678");
  });

  it("un AAD distinto no descifra el dato (anti-swap entre usuarios)", () => {
    const cifrado = encryptSensitive("6030012345678", { aad: "42" });
    // Otro usuario no puede descifrarlo ni aunque conozca la clave
    expect(decryptSensitive(cifrado, { aad: "43" })).toBeNull();
    // Sin AAD tampoco
    expect(decryptSensitive(cifrado)).toBeNull();
  });

  it("roundtrip v2 sin AAD sigue funcionando", () => {
    const cifrado = encryptSensitive("dato-sin-usuario");
    expect(decryptSensitive(cifrado)).toBe("dato-sin-usuario");
    // y no se descifra si se exige un AAD que no se uso al cifrar
    expect(decryptSensitive(cifrado, { aad: "7" })).toBeNull();
  });

  it("encryptSensitive con entradas vacias devuelve null (aunque haya AAD)", () => {
    expect(encryptSensitive(null, { aad: "1" })).toBeNull();
    expect(encryptSensitive(undefined, { aad: "1" })).toBeNull();
  });

  it("un v2 corrupto devuelve null y deja log sin datos", () => {
    const cifrado = encryptSensitive("secreto", { aad: "1" });
    const corrupto = `${cifrado.slice(0, -4)}AAAA`;
    expect(decryptSensitive(corrupto, { aad: "1" })).toBeNull();
  });
});
