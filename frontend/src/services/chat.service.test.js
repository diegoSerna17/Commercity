import { beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "../api/client.js";
import {
  enviarArchivo,
  enviarMensaje,
  listarConversaciones,
  marcarMensajeLeido,
  obtenerConversacion,
} from "./chat.service.js";

vi.mock("../api/client.js", () => ({
  request: vi.fn(),
}));

describe("chat.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    request.mockResolvedValue({ success: true, data: {} });
  });

  it("lista conversaciones y mensajes con otro usuario", async () => {
    await listarConversaciones();
    // B-9: pagina completa por defecto (max 100)
    expect(request).toHaveBeenCalledWith("/api/chat/conversaciones?por_pagina=100");

    await obtenerConversacion(9);
    expect(request).toHaveBeenLastCalledWith("/api/chat/mensajes/9");
  });

  it("marca un mensaje recibido como leido", async () => {
    await marcarMensajeLeido(3);
    expect(request).toHaveBeenCalledWith("/api/chat/mensajes/3/leido", {
      method: "PATCH",
    });
  });

  it("envia un mensaje de texto", async () => {
    await enviarMensaje(9, "Hola");
    expect(request).toHaveBeenCalledWith("/api/chat", {
      method: "POST",
      body: { receptor_id: 9, mensaje: "Hola" },
    });
  });

  it("envia un archivo como FormData sin fijar JSON", async () => {
    const archivo = new File(["dato"], "captura.png", { type: "image/png" });
    await enviarArchivo(9, archivo);

    const [ruta, opciones] = request.mock.calls[0];
    expect(ruta).toBe("/api/chat");
    expect(opciones.method).toBe("POST");
    expect(opciones.isForm).toBe(true);
    expect(opciones.body).toBeInstanceOf(FormData);
    expect(opciones.body.get("receptor_id")).toBe("9");
    expect(opciones.body.get("archivo")).toBe(archivo);
  });
});
