import { describe, expect, it } from "vitest";
import { formatSocialCount, perfilVendedorSocial } from "./perfilVendedorSocial.js";

describe("perfilVendedorSocial", () => {
  it("expone las listas ficticias de seguidores y seguidos", () => {
    expect(perfilVendedorSocial.usuario).toBeTruthy();
    expect(perfilVendedorSocial.seguidores.length).toBeGreaterThan(0);
    expect(perfilVendedorSocial.siguiendo.length).toBeGreaterThan(0);
  });

  it("formatSocialCount deja los numeros bajo mil sin cambios", () => {
    expect(formatSocialCount(0)).toBe("0");
    expect(formatSocialCount(999)).toBe("999");
  });

  it("formatSocialCount abrevia los miles sin decimales innecesarios", () => {
    expect(formatSocialCount(1000)).toBe("1k");
    expect(formatSocialCount(1200)).toBe("1.2k");
    expect(formatSocialCount(1500)).toBe("1.5k");
    expect(formatSocialCount(2000)).toBe("2k");
  });
});
