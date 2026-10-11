import { beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "../api/client.js";
import {
  actualizarPerfil,
  cambiarRol,
  cerrarSesion,
  eliminarCuenta,
  obtenerMiUsuario,
  restablecerPassword,
  solicitarRecuperacion,
} from "./usuarios.service.js";

vi.mock("../api/client.js", () => ({
  request: vi.fn(),
}));

describe("usuarios.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    request.mockResolvedValue({ success: true, data: {} });
  });

  it("obtenerMiUsuario consulta GET /api/usuarios/me", async () => {
    await obtenerMiUsuario();
    expect(request).toHaveBeenCalledWith("/api/usuarios/me");
  });

  it("actualizarPerfil envia PATCH con el nombre", async () => {
    await actualizarPerfil("Ana Gomez");
    expect(request).toHaveBeenCalledWith("/api/usuarios/me", {
      method: "PATCH",
      body: { nombre_completo: "Ana Gomez" },
    });
  });

  it("solicitarRecuperacion envia POST /api/usuarios/recover", async () => {
    await solicitarRecuperacion("ana@correo.com");
    expect(request).toHaveBeenCalledWith("/api/usuarios/recover", {
      method: "POST",
      body: { email: "ana@correo.com" },
    });
  });

  it("restablecerPassword envia el token y la contrasena nueva", async () => {
    await restablecerPassword("tok-123", "nuevaClave1");
    expect(request).toHaveBeenCalledWith("/api/usuarios/reset-password", {
      method: "POST",
      body: { token: "tok-123", password: "nuevaClave1" },
    });
  });

  it("cerrarSesion invoca POST /api/usuarios/logout (RF2)", async () => {
    await cerrarSesion();
    expect(request).toHaveBeenCalledWith("/api/usuarios/logout", { method: "POST" });
  });

  it("cambiarRol envia el rol destino", async () => {
    await cambiarRol("vendedor");
    expect(request).toHaveBeenCalledWith("/api/usuarios/me/rol", {
      method: "PATCH",
      body: { rol: "vendedor" },
    });
  });

  it("eliminarCuenta invoca DELETE /api/usuarios/cuenta", async () => {
    await eliminarCuenta();
    expect(request).toHaveBeenCalledWith("/api/usuarios/cuenta", { method: "DELETE" });
  });
});
