import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TEMAS,
  guardarTema,
  inicializarTema,
  obtenerTemaGuardado,
  resolverTema,
  temaDelSistema,
} from "./tema.js";

describe("tema", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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

  it("normaliza a system un tema guardado invalido", () => {
    // Arrange
    localStorage.setItem("commercity-theme", "neon");

    // Act / Assert
    expect(obtenerTemaGuardado()).toBe("system");
    expect(TEMAS).toEqual(["light", "dark", "system"]);
  });

  it("normaliza a system un tema invalido al guardarlo", () => {
    // Act
    const normalizado = guardarTema("neon");

    // Assert
    expect(normalizado).toBe("system");
    expect(localStorage.getItem("commercity-theme")).toBe("system");
  });

  it("temaDelSistema cae en dark cuando matchMedia no existe", () => {
    // jsdom no implementa matchMedia por defecto.
    expect(window.matchMedia).toBeUndefined();
    expect(temaDelSistema()).toBe("dark");
  });

  it("resolverTema usa la preferencia del sistema solo para system", () => {
    // Arrange
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn() })
    );

    // Act / Assert
    expect(resolverTema("system")).toBe("dark");
    expect(resolverTema("light")).toBe("light");
  });

  it("inicializarTema se suscribe con addEventListener y aplica system al cambiar", () => {
    // Arrange
    const manejarCambio = vi.fn();
    const media = {
      matches: false,
      addEventListener: vi.fn((evento, callback) => {
        if (evento === "change") manejarCambio.mockImplementation(callback);
      }),
    };
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(media));
    localStorage.setItem("commercity-theme", "system");

    // Act
    inicializarTema();
    manejarCambio();

    // Assert
    expect(media.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("inicializarTema usa addListener cuando addEventListener no existe", () => {
    // Arrange
    const media = {
      matches: true,
      addListener: vi.fn(),
    };
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(media));

    // Act
    inicializarTema();

    // Assert
    expect(media.addListener).toHaveBeenCalledWith(expect.any(Function));
  });

  it("inicializarTema no se suscribe cuando matchMedia no existe", () => {
    // Act / Assert
    expect(() => inicializarTema()).not.toThrow();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
