import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { getCurrentUser } from "../../api/client.js";
import {
  enviarMensaje,
  marcarMensajeLeido,
  obtenerConversacion,
} from "../../services/chat.service.js";
import Chats from "./Chats.jsx";

vi.mock("../../api/client.js", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("../../services/chat.service.js", () => ({
  enviarArchivo: vi.fn(),
  enviarMensaje: vi.fn(),
  marcarMensajeLeido: vi.fn(),
  obtenerConversacion: vi.fn(),
}));

vi.mock("../../components/perfil/ReportarUsuario.jsx", () => ({
  default: () => null,
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="ruta-actual">{location.pathname}</output>;
}

function renderChats() {
  return render(
    <MemoryRouter initialEntries={["/messages/chat"]}>
      <LocationProbe />
      <Routes>
        <Route path="/messages" element={<h1>Lista de mensajes</h1>} />
        <Route path="/messages/chat" element={<Chats />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Chats", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sessionStorage.clear();
    getCurrentUser.mockReturnValue({ id: 7 });
    obtenerConversacion.mockResolvedValue({
      data: {
        mensajes: [
          {
            id: 1,
            emisor_id: 9,
            receptor_id: 7,
            mensaje: "Hola, ¿sigue disponible?",
            leido: false,
            enviado_at: "2026-10-01T10:00:00.000Z",
          },
          {
            id: 2,
            emisor_id: 7,
            receptor_id: 9,
            mensaje: "Si, esta disponible",
            leido: true,
            enviado_at: "2026-10-01T10:05:00.000Z",
          },
        ],
      },
    });
    enviarMensaje.mockResolvedValue({ success: true });
    marcarMensajeLeido.mockResolvedValue({ success: true });
  });

  it("vuelve a la lista de mensajes cuando no hay conversacion activa", () => {
    // Act
    renderChats();

    // Assert
    expect(screen.getByRole("heading", { name: "Lista de mensajes" })).toBeInTheDocument();
    expect(obtenerConversacion).not.toHaveBeenCalled();
  });

  it("carga la conversacion y marca como leidos los mensajes recibidos", async () => {
    // Arrange
    sessionStorage.setItem(
      "activeChat",
      JSON.stringify({ id: 9, name: "Tienda Demo", avatar: "" })
    );

    // Act
    renderChats();

    // Assert
    expect(await screen.findByText("Hola, ¿sigue disponible?")).toBeInTheDocument();
    expect(screen.getByText("Si, esta disponible")).toBeInTheDocument();
    expect(obtenerConversacion).toHaveBeenCalledWith(9);
    expect(marcarMensajeLeido).toHaveBeenCalledWith(1);
  });

  it("envia un mensaje y recarga la conversacion", async () => {
    // Arrange
    const user = userEvent.setup();
    sessionStorage.setItem(
      "activeChat",
      JSON.stringify({ id: 9, name: "Tienda Demo", avatar: "" })
    );
    renderChats();
    await screen.findByText("Hola, ¿sigue disponible?");

    // Act
    await user.type(screen.getByPlaceholderText("Escribe un mensaje..."), "Gracias");
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    // Assert
    expect(enviarMensaje).toHaveBeenCalledWith(9, "Gracias");
    expect(obtenerConversacion).toHaveBeenCalledTimes(2);
  });
});
