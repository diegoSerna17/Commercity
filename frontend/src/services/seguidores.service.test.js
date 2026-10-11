import { beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "../api/client.js";
import {
  contarSeguidores,
  dejarDeSeguir,
  listarSeguidores,
  listarSiguiendo,
  seguirUsuario,
} from "./seguidores.service.js";

vi.mock("../api/client.js", () => ({
  request: vi.fn(),
}));

describe("seguidores.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    request.mockResolvedValue({ success: true, data: [] });
  });

  it("lista siguiendo y seguidores del usuario autenticado", async () => {
    await listarSiguiendo();
    expect(request).toHaveBeenCalledWith("/api/seguidores/siguiendo");

    await listarSeguidores();
    expect(request).toHaveBeenLastCalledWith("/api/seguidores/seguidores");
  });

  it("seguirUsuario envia POST con seguido_id (RF106)", async () => {
    await seguirUsuario(12);
    expect(request).toHaveBeenCalledWith("/api/seguidores", {
      method: "POST",
      body: { seguido_id: 12 },
    });
  });

  it("dejarDeSeguir usa DELETE por usuario", async () => {
    await dejarDeSeguir(12);
    expect(request).toHaveBeenCalledWith("/api/seguidores/12", { method: "DELETE" });
  });

  it("contarSeguidores consulta los contadores publicos", async () => {
    await contarSeguidores(5);
    expect(request).toHaveBeenCalledWith("/api/seguidores/5/contadores");
  });
});
