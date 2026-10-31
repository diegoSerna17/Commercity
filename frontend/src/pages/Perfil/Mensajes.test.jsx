import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Mensajes from "./Mensajes.jsx";
import { listarConversaciones } from "../../services/chat.service.js";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("../../services/chat.service.js", () => ({
  listarConversaciones: vi.fn(),
}));

const CONVERSACIONES = [
  {
    usuario: {
      id: 1,
      nombre_completo: "Ana Perez",
      foto_perfil: "https://cdn.example.com/ana.png",
    },
    no_leidos: 2,
    ultimo_mensaje: {
      mensaje: "Nos vemos manana",
      enviado_at: "2026-10-12T15:30:00.000Z",
    },
  },
  {
    usuario: { id: 2, nombre_completo: "bruno diaz", foto_perfil: "" },
    no_leidos: 0,
    ultimo_mensaje: { tipo_mensaje: "imagen" },
  },
  {
    usuario: { id: 3, nombre_completo: "Carla Ruiz" },
    no_leidos: 0,
    ultimo_mensaje: { archivo_url: "https://cdn.example.com/factura.pdf" },
  },
  {
    usuario: { id: 4, nombre_completo: "Diego Mora" },
    no_leidos: 0,
    ultimo_mensaje: {},
  },
];

describe("Mensajes", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    listarConversaciones.mockReset();
    sessionStorage.clear();
  });

  it("muestra el estado de carga", () => {
    listarConversaciones.mockReturnValue(new Promise(() => {}));

    render(<Mensajes />);

    expect(screen.getByText("Cargando conversaciones...")).toBeInTheDocument();
  });

  it("muestra el estado vacio", async () => {
    listarConversaciones.mockResolvedValue({ data: [] });

    render(<Mensajes />);

    expect(
      await screen.findByText("No tienes conversaciones.")
    ).toBeInTheDocument();
  });

  it("muestra el error del servicio", async () => {
    listarConversaciones.mockRejectedValue(new Error("Chat no disponible"));

    render(<Mensajes />);

    expect(await screen.findByText("Chat no disponible")).toBeInTheDocument();
  });

  it("usa el mensaje de error por defecto", async () => {
    listarConversaciones.mockRejectedValue({});

    render(<Mensajes />);

    expect(
      await screen.findByText("No se pudieron cargar las conversaciones")
    ).toBeInTheDocument();
  });

  it("lista las conversaciones con avatar, hora y vista previa", async () => {
    listarConversaciones.mockResolvedValue({ data: CONVERSACIONES });

    render(<Mensajes />);

    expect(await screen.findByText("Ana Perez")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Ana Perez" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/ana.png"
    );
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("Nos vemos manana")).toBeInTheDocument();
    expect(screen.getByText("Imagen")).toBeInTheDocument();
    expect(screen.getByText("Archivo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Diego Mora/ })).toBeInTheDocument();
  });

  it("abre el chat guardando los datos en sessionStorage", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarConversaciones.mockResolvedValue({ data: CONVERSACIONES });
    render(<Mensajes />);
    await screen.findByText("Ana Perez");

    // Act
    await usuario.click(
      screen.getByRole("button", { name: /Ana Perez/ })
    );

    // Assert
    expect(navigateMock).toHaveBeenCalledWith("/messages/chat");
    expect(JSON.parse(sessionStorage.getItem("activeChat"))).toEqual({
      id: 1,
      name: "Ana Perez",
      avatar: "https://cdn.example.com/ana.png",
    });
  });

  it("guarda avatar vacio cuando el usuario no tiene foto", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarConversaciones.mockResolvedValue({ data: CONVERSACIONES });
    render(<Mensajes />);
    await screen.findByText("bruno diaz");

    // Act
    await usuario.click(screen.getByRole("button", { name: /bruno diaz/ }));

    // Assert
    expect(JSON.parse(sessionStorage.getItem("activeChat"))).toEqual({
      id: 2,
      name: "bruno diaz",
      avatar: "",
    });
  });

  it("vuelve a la pantalla anterior", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarConversaciones.mockResolvedValue({ data: [] });
    render(<Mensajes />);

    // Act
    await usuario.click(screen.getByRole("button", { name: "Volver" }));

    // Assert
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });
});
