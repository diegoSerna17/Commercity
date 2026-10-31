import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  eliminarNotificacion,
  eliminarTodas,
  listarNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} from "../../services/notificaciones.service.js";
import { notificacionFalsa } from "../../test/utils.jsx";
import NotificacionesDropdown from "./NotificacionesDropdown.jsx";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("../../services/notificaciones.service.js", () => ({
  listarNotificaciones: vi.fn(),
  marcarTodasLeidas: vi.fn(),
  marcarLeida: vi.fn(),
  eliminarNotificacion: vi.fn(),
  eliminarTodas: vi.fn(),
}));

const NOTIFICACIONES = [
  notificacionFalsa({ id: 1, descripcion: "Pedido confirmado" }),
  notificacionFalsa({ id: 2, descripcion: "Mensaje nuevo", tipo: "mensajes", leida: true }),
  notificacionFalsa({ id: 3, descripcion: "Producto aprobado" }),
  notificacionFalsa({ id: 4, descripcion: "Pago recibido" }),
  notificacionFalsa({ id: 5, descripcion: "Calificacion recibida" }),
  notificacionFalsa({ id: 6, descripcion: "Stock bajo" }),
];

function renderDropdown(onChange = vi.fn()) {
  return { onChange, ...render(<NotificacionesDropdown onChange={onChange} />) };
}

describe("NotificacionesDropdown", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    listarNotificaciones.mockResolvedValue({
      success: true,
      data: { notificaciones: NOTIFICACIONES },
    });
    marcarTodasLeidas.mockResolvedValue({ success: true });
    marcarLeida.mockResolvedValue({ success: true });
    eliminarNotificacion.mockResolvedValue({ success: true });
    eliminarTodas.mockResolvedValue({ success: true });
  });

  it("carga las notificaciones de la sesion al montar", async () => {
    // Act
    renderDropdown();

    // Assert
    expect(await screen.findByText("Pedido confirmado")).toBeInTheDocument();
    expect(listarNotificaciones).toHaveBeenCalledWith(50);
  });

  it("muestra el estado de carga antes de la respuesta", () => {
    // Arrange
    listarNotificaciones.mockReturnValue(new Promise(() => {}));

    // Act
    renderDropdown();

    // Assert
    expect(screen.getByText("Cargando notificaciones...")).toBeInTheDocument();
  });

  it("muestra el estado vacio", async () => {
    // Arrange
    listarNotificaciones.mockResolvedValue({ data: { notificaciones: [] } });

    // Act
    renderDropdown();

    // Assert
    expect(await screen.findByText("No hay notificaciones")).toBeInTheDocument();
  });

  it("muestra el error del servicio", async () => {
    // Arrange
    listarNotificaciones.mockRejectedValue(new Error("Servicio no disponible"));

    // Act
    renderDropdown();

    // Assert
    expect(await screen.findByText("Servicio no disponible")).toBeInTheDocument();
  });

  it("ver todas y ver menos alternan las notificaciones visibles", async () => {
    // Arrange
    const user = userEvent.setup();
    renderDropdown();
    await screen.findByText("Pedido confirmado");
    expect(screen.queryByText("Stock bajo")).not.toBeInTheDocument();

    // Act
    await user.click(screen.getByRole("button", { name: "Ver todas las notificaciones" }));

    // Assert
    expect(screen.getByText("Stock bajo")).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole("button", { name: "Ver menos" }));

    // Assert
    expect(screen.queryByText("Stock bajo")).not.toBeInTheDocument();
  });

  it("marcar todas como leidas actualiza el estado y avisa el cambio", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onChange } = renderDropdown();
    await screen.findByText("Pedido confirmado");

    // Act
    await user.click(screen.getByRole("button", { name: "Marcar leídas" }));

    // Assert
    await waitFor(() => expect(marcarTodasLeidas).toHaveBeenCalledTimes(1));
    expect(onChange).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Marcar leídas" })).not.toBeInTheDocument();
  });

  it("limpiar todo elimina las notificaciones y avisa el cambio", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onChange } = renderDropdown();
    await screen.findByText("Pedido confirmado");

    // Act
    await user.click(screen.getByRole("button", { name: "Limpiar todo" }));

    // Assert
    await waitFor(() => expect(eliminarTodas).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("No hay notificaciones")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalled();
  });

  it("descartar una notificacion no navega (stopPropagation)", async () => {
    // Arrange
    const user = userEvent.setup();
    renderDropdown();
    await screen.findByText("Pedido confirmado");

    // Act
    const botones = screen.getAllByRole("button", { name: "Cerrar notificación" });
    await user.click(botones[0]);

    // Assert
    await waitFor(() => expect(eliminarNotificacion).toHaveBeenCalledWith(1));
    expect(navigateMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Pedido confirmado")).not.toBeInTheDocument();
  });

  it("al hacer clic en una notificacion la marca leida y navega a su ruta", async () => {
    // Arrange
    const user = userEvent.setup();
    renderDropdown();
    await screen.findByText("Pedido confirmado");

    // Act
    await user.click(screen.getByText("Pedido confirmado"));

    // Assert
    await waitFor(() => expect(marcarLeida).toHaveBeenCalledWith(1));
    expect(navigateMock).toHaveBeenCalledWith("/orders");
  });

  it("navega a mensajes cuando el tipo es mensajes", async () => {
    // Arrange
    const user = userEvent.setup();
    renderDropdown();
    await screen.findByText("Mensaje nuevo");

    // Act
    await user.click(screen.getByText("Mensaje nuevo"));

    // Assert
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/messages"));
    expect(marcarLeida).not.toHaveBeenCalled();
  });

  it("una ruta desconocida cae en la raiz", async () => {
    // Arrange
    const user = userEvent.setup();
    listarNotificaciones.mockResolvedValue({
      data: {
        notificaciones: [
          notificacionFalsa({ id: 9, descripcion: "Ruta rara", url_redireccion: "/otra" }),
        ],
      },
    });
    renderDropdown();
    await screen.findByText("Ruta rara");

    // Act
    await user.click(screen.getByText("Ruta rara"));

    // Assert
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/"));
  });
});
