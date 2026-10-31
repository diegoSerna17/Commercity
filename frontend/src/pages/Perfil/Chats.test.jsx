import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { getCurrentUser } from "../../api/client.js";
import {
  enviarArchivo,
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
  default: ({ onClose }) => (
    <div>
      <p>Modal reporte</p>
      <button type="button" onClick={onClose}>
        Cerrar reporte
      </button>
    </div>
  ),
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="ruta-actual">{location.pathname}</output>;
}

function renderChats(entries = ["/messages/chat"]) {
  return render(
    <MemoryRouter initialEntries={entries}>
      <LocationProbe />
      <Routes>
        <Route path="/messages" element={<h1>Lista de mensajes</h1>} />
        <Route path="/messages/chat" element={<Chats />} />
      </Routes>
    </MemoryRouter>
  );
}

const contactoGuardado = () =>
  sessionStorage.setItem(
    "activeChat",
    JSON.stringify({ id: 9, name: "Tienda Demo", avatar: "" })
  );

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

  it("renderiza adjuntos de imagen y de archivo en las burbujas", async () => {
    // Arrange
    contactoGuardado();
    obtenerConversacion.mockResolvedValueOnce({
      data: {
        mensajes: [
          {
            id: 10,
            emisor_id: 9,
            receptor_id: 7,
            mensaje: "",
            leido: true,
            enviado_at: null,
            archivo_url: "/uploads/foto.png",
            tipo_mensaje: "imagen",
          },
          {
            id: 11,
            emisor_id: 7,
            receptor_id: 9,
            mensaje: "Te envio el informe",
            leido: true,
            enviado_at: "fecha-invalida",
            archivo_url: "/uploads/informe.pdf",
            tipo_mensaje: "archivo",
          },
        ],
      },
    });

    // Act
    renderChats();

    // Assert
    const imagen = await screen.findByAltText("Imagen");
    expect(imagen.getAttribute("src")).toContain("/uploads/foto.png");
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("informe.pdf")).toBeInTheDocument();
    expect(screen.getByText("Archivo adjunto")).toBeInTheDocument();
    expect(screen.getByText("Te envio el informe")).toBeInTheDocument();
  });

  it("vuelve a la lista si el contacto guardado no es JSON valido", () => {
    // Arrange
    sessionStorage.setItem("activeChat", "{malformado");

    // Act
    renderChats();

    // Assert
    expect(
      screen.getByRole("heading", { name: "Lista de mensajes" })
    ).toBeInTheDocument();
    expect(obtenerConversacion).not.toHaveBeenCalled();
  });

  it("usa el mensaje por defecto cuando falla la carga", async () => {
    // Arrange
    contactoGuardado();
    obtenerConversacion.mockRejectedValueOnce(new Error(""));

    // Act
    renderChats();

    // Assert
    expect(
      await screen.findByText("No se pudo cargar la conversación")
    ).toBeInTheDocument();
  });

  it("envia con Enter y adjunta un archivo", async () => {
    // Arrange
    const user = userEvent.setup();
    contactoGuardado();
    renderChats();
    await screen.findByText("Hola, ¿sigue disponible?");
    const campo = screen.getByPlaceholderText("Escribe un mensaje...");

    // Act
    await user.type(campo, "Con enter");
    await user.keyboard("{Enter}");

    // Assert
    await waitFor(() =>
      expect(enviarMensaje).toHaveBeenCalledWith(9, "Con enter")
    );

    // Act
    const archivo = new File(["pdf"], "factura.pdf", {
      type: "application/pdf",
    });
    const selectorArchivo = document.querySelector('input[type="file"]');
    fireEvent.click(screen.getByRole("button", { name: "Adjuntar archivo" }));
    fireEvent.change(selectorArchivo, { target: { files: [] } });
    fireEvent.change(selectorArchivo, { target: { files: [archivo] } });

    // Assert
    await waitFor(() =>
      expect(enviarArchivo).toHaveBeenCalledWith(9, archivo)
    );
    expect(obtenerConversacion).toHaveBeenCalledTimes(3);
  });

  it("ignora el envio vacio y muestra los errores de mensaje y archivo", async () => {
    // Arrange
    const user = userEvent.setup();
    contactoGuardado();
    renderChats();
    await screen.findByText("Hola, ¿sigue disponible?");

    // Act
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    // Assert
    expect(enviarMensaje).not.toHaveBeenCalled();

    // Act
    enviarMensaje.mockRejectedValueOnce(new Error("Mensaje caido"));
    await user.type(
      screen.getByPlaceholderText("Escribe un mensaje..."),
      "Hola"
    );
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    // Assert
    expect(await screen.findByText("Mensaje caido")).toBeInTheDocument();

    // Act
    enviarArchivo.mockRejectedValueOnce({});
    fireEvent.change(document.querySelector('input[type="file"]'), {
      target: { files: [new File(["x"], "nota.txt", { type: "text/plain" })] },
    });

    // Assert
    expect(
      await screen.findByText("No se pudo enviar el archivo")
    ).toBeInTheDocument();
  });

  it("vuelve atras con Volver", async () => {
    // Arrange
    const user = userEvent.setup();
    contactoGuardado();
    renderChats(["/messages", "/messages/chat"]);
    await screen.findByText("Hola, ¿sigue disponible?");

    // Act
    await user.click(screen.getByRole("button", { name: "Volver" }));

    // Assert
    expect(
      await screen.findByRole("heading", { name: "Lista de mensajes" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("ruta-actual").textContent).toBe("/messages");
  });

  it("abre el perfil del vendedor desde el chat", async () => {
    // Arrange
    const user = userEvent.setup();
    contactoGuardado();
    renderChats();
    await screen.findByText("Hola, ¿sigue disponible?");

    // Act
    await user.click(screen.getByRole("button", { name: "Ver Perfil" }));

    // Assert
    expect(screen.getByTestId("ruta-actual").textContent).toBe("/vendedor/9");
  });

  it("abre y cierra el modal de reporte", async () => {
    // Arrange
    const user = userEvent.setup();
    contactoGuardado();
    renderChats();
    await screen.findByText("Hola, ¿sigue disponible?");

    // Act
    await user.click(screen.getByRole("button", { name: "Reportar" }));

    // Assert
    expect(screen.getByText("Modal reporte")).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole("button", { name: "Cerrar reporte" }));

    // Assert
    expect(screen.queryByText("Modal reporte")).not.toBeInTheDocument();
  });

  it("deshabilita Reportar cuando el contacto es el propio usuario", async () => {
    // Arrange
    getCurrentUser.mockReturnValue({ id: 9 });
    contactoGuardado();
    renderChats();
    await screen.findByText("Hola, ¿sigue disponible?");

    // Act
    const boton = screen.getByRole("button", { name: "Reportar" });

    // Assert
    expect(boton).toBeDisabled();
  });
});
