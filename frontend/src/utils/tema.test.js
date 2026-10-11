import { afterEach, describe, expect, it, vi } from "vitest";
import { guardarTema, obtenerTemaGuardado } from "./tema.js";

describe("tema", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("devuelve system cuando localStorage no esta disponible", () => {
    // Arrange
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });

    // Act / Assert
    expect(obtenerTemaGuardado()).toBe("system");
  });

  it("no falla al guardar si localStorage rechaza la escritura", () => {
    // Arrange
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("cuota llena");
    });

    // Act / Assert
    expect(() => guardarTema("dark")).not.toThrow();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("persiste el tema normalizado cuando localStorage funciona", () => {
    // Act
    guardarTema("light");

    // Assert
    expect(localStorage.getItem("commercity-theme")).toBe("light");
    expect(obtenerTemaGuardado()).toBe("light");
  });
});
