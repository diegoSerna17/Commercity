// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL } from "../constants/config.js";
import { request, setToken } from "./client.js";

describe("request", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("adjunta el Bearer token, serializa JSON y devuelve la respuesta JSON", async () => {
    // Arrange
    const payload = { nombre: "Ada" };
    const responseData = { id: 7, nombre: "Ada" };
    setToken("jwt-de-prueba");
    globalThis.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(JSON.stringify(responseData)),
    });

    // Act
    const result = await request("/usuarios", {
      method: "POST",
      body: payload,
    });

    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/usuarios`, {
      method: "POST",
      headers: {
        Authorization: "Bearer jwt-de-prueba",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(responseData);
  });

  it("devuelve texto plano y omite Authorization cuando no hay token", async () => {
    // Arrange
    globalThis.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue("respuesta de texto"),
    });

    // Act
    const result = await request("/estado");

    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/estado`, {
      method: "GET",
      headers: {},
    });
    expect(result).toBe("respuesta de texto");
  });

  it("lanza un Error con mensaje, status y data cuando la respuesta no es ok", async () => {
    // Arrange
    const errorData = { error: { message: "Acceso denegado" }, codigo: "AUTH" };
    globalThis.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      text: vi.fn().mockResolvedValue(JSON.stringify(errorData)),
    });

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
});
