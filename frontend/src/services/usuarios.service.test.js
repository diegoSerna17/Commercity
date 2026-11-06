import { beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "../api/client.js";
import {
  actualizarPerfil,
  cambiarRol,
  cerrarSesion,
  cerrarTodasLasSesiones,
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

  it("actualizarPerfil envia PATCH con los campos de texto", async () => {
    await actualizarPerfil({ nombre_completo: "Ana Gomez" });
    expect(request).toHaveBeenCalledWith("/api/usuarios/me", {
      method: "PATCH",
      body: { nombre_completo: "Ana Gomez" },
    });
  });

  it("actualizarPerfil con archivo envia FormData multipart (RF39)", async () => {
    const archivo = new File([new Uint8Array([1, 2, 3])], "avatar.png", {
      type: "image/png",
    });

    await actualizarPerfil({ descripcion_personal: "Hola" }, archivo);

    const [url, opciones] = request.mock.calls[0];
    expect(url).toBe("/api/usuarios/me");
    expect(opciones.method).toBe("PATCH");
    expect(opciones.isForm).toBe(true);
    expect(opciones.body).toBeInstanceOf(FormData);
    expect(opciones.body.get("descripcion_personal")).toBe("Hola");
    expect(opciones.body.get("avatar")).toBeInstanceOf(File);
  });

  it("cerrarTodasLasSesiones invoca POST /api/usuarios/logout-todas (M-8)", async () => {
    await cerrarTodasLasSesiones();
    expect(request).toHaveBeenCalledWith("/api/usuarios/logout-todas", {
      method: "POST",
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
