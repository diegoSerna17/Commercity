// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL, USER_KEY } from "../constants/config.js";
import { getCurrentUser, request, setCurrentUser } from "./client.js";

/** Respuesta fetch simulada con cuerpo JSON/texto. */
function respuesta(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    text: vi.fn().mockResolvedValue(typeof body === "string" ? body : JSON.stringify(body)),
  };
}

/**
 * Sustituye window.location por un doble testeable (jsdom no navega).
 * @returns {ReturnType<typeof vi.fn>} espia de location.assign
 */
function simularUbicacion(pathname) {
  const assign = vi.fn();
  vi.stubGlobal("location", { pathname, assign });
  return assign;
}

describe("request", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("envía la cookie de sesión (credentials include) y devuelve la respuesta JSON", async () => {
    // Arrange
    const payload = { nombre: "Ada" };
    const responseData = { id: 7, nombre: "Ada" };
    globalThis.fetch.mockResolvedValue(respuesta(responseData));

    // Act
    const result = await request("/usuarios", {
      method: "POST",
      body: payload,
    });

    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/usuarios`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(responseData);
  });

  it("no adjunta Authorization: la sesión viaja solo en la cookie httpOnly (F4)", async () => {
    // Arrange
    setCurrentUser({ id: 7, nombre_completo: "Ada" });
    globalThis.fetch.mockResolvedValue(respuesta({ ok: true }));

    // Act
    await request("/carrito");

    // Assert
    const [, config] = globalThis.fetch.mock.calls[0];
    expect(config.headers).toEqual({});
    expect(config.credentials).toBe("include");
  });

  it("devuelve texto plano cuando el cuerpo no es JSON", async () => {
    // Arrange
    globalThis.fetch.mockResolvedValue(respuesta("respuesta de texto"));

    // Act
    const result = await request("/estado");

    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/estado`, {
      method: "GET",
      credentials: "include",
      headers: {},
    });
    expect(result).toBe("respuesta de texto");
  });

  it("lanza un Error con mensaje, status y data cuando la respuesta no es ok", async () => {
    // Arrange
    const errorData = { error: { message: "Acceso denegado" }, codigo: "AUTH" };
    globalThis.fetch.mockResolvedValue(respuesta(errorData, { ok: false, status: 403 }));

    // Act
    const requestPromise = request("/admin");

    // Assert
    await expect(requestPromise).rejects.toMatchObject({
      name: "Error",
      message: "Acceso denegado",
      status: 403,
      data: errorData,
    });
  });

  it("lanza un Error cuando el contrato trae success:false aunque el status sea 200", async () => {
    // Arrange
    const body = { success: false, error: { message: "No autorizado" } };
    globalThis.fetch.mockResolvedValue(respuesta(body));

    // Act
    const requestPromise = request("/carrito");

    // Assert
    await expect(requestPromise).rejects.toMatchObject({
      message: "No autorizado",
      status: 200,
      data: body,
    });
  });

  it("A-5: un 401 anónimo no redirige ni borra nada", async () => {
    // Arrange
    const assign = simularUbicacion("/orders");
    globalThis.fetch.mockResolvedValue(
      respuesta({ error: { message: "Sesión requerida" } }, { ok: false, status: 401 })
    );

    // Act
    await expect(request("/api/carrito")).rejects.toMatchObject({ status: 401 });

    // Assert
    expect(assign).not.toHaveBeenCalled();
  });

  it("A-5: un 401 con sesión previa limpia el usuario y redirige a /login", async () => {
    // Arrange
    setCurrentUser({ id: 7, nombre_completo: "Ada" });
    const assign = simularUbicacion("/orders");
    globalThis.fetch.mockResolvedValue(
      respuesta({ error: { message: "Sesión caducada" } }, { ok: false, status: 401 })
    );

    // Act
    await expect(request("/api/carrito")).rejects.toMatchObject({ status: 401 });

    // Assert
    expect(assign).toHaveBeenCalledWith("/login");
    expect(getCurrentUser()).toBeNull();
  });

  it("A-5: un 401 en una ruta pública (p. ej. /login) no redirige", async () => {
    // Arrange
    setCurrentUser({ id: 7, nombre_completo: "Ada" });
    const assign = simularUbicacion("/login");
    globalThis.fetch.mockResolvedValue(
      respuesta({ error: { message: "Credenciales inválidas" } }, { ok: false, status: 401 })
    );

    // Act
    await expect(
      request("/api/usuarios/login", { method: "POST", body: {} })
    ).rejects.toMatchObject({ status: 401 });

    // Assert
    expect(assign).not.toHaveBeenCalled();
  });
});

describe("almacenamiento del usuario", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("getCurrentUser devuelve null cuando el JSON guardado es inválido", () => {
    // Arrange
    localStorage.setItem(USER_KEY, "{no-es-json");

    // Act / Assert
    expect(getCurrentUser()).toBeNull();
  });
});
