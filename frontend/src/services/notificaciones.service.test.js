import { beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "../api/client.js";
import {
  contarNoLeidas,
  eliminarNotificacion,
  eliminarTodas,
  listarNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} from "./notificaciones.service.js";

vi.mock("../api/client.js", () => ({
  request: vi.fn(),
}));

describe("notificaciones.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    request.mockResolvedValue({ success: true, data: {} });
  });

  it("listarNotificaciones envia el limite", async () => {
    await listarNotificaciones(10);
    expect(request).toHaveBeenCalledWith("/api/notificaciones?limite=10");
  });

  it("contarNoLeidas consulta el resumen", async () => {
    await contarNoLeidas();
    expect(request).toHaveBeenCalledWith("/api/notificaciones/no-leidas");
  });

  it("marca notificaciones como leidas con PATCH", async () => {
    await marcarTodasLeidas();
    expect(request).toHaveBeenCalledWith("/api/notificaciones/leidas", { method: "PATCH" });

    await marcarLeida(5);
    expect(request).toHaveBeenLastCalledWith("/api/notificaciones/5/leida", {
      method: "PATCH",
    });
  });

  it("elimina una o todas las notificaciones", async () => {
    await eliminarNotificacion(9);
    expect(request).toHaveBeenCalledWith("/api/notificaciones/9", { method: "DELETE" });

    await eliminarTodas();
    expect(request).toHaveBeenLastCalledWith("/api/notificaciones", { method: "DELETE" });
  });
});
