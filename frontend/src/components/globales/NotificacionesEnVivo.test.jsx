import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { getCurrentUser } from "../../api/client.js";
import {
  listarNotificaciones,
  marcarLeida,
} from "../../services/notificaciones.service.js";
import NotificacionesEnVivo from "./NotificacionesEnVivo.jsx";

vi.mock("../../api/client.js", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("../../services/notificaciones.service.js", () => ({
  listarNotificaciones: vi.fn(),
  marcarLeida: vi.fn(),
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="ruta-actual">{location.pathname}</output>;
}

function renderNotificaciones() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <LocationProbe />
      <Routes>
        <Route path="/" element={<NotificacionesEnVivo />} />
        <Route path="/messages" element={<h1>Mensajes</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("NotificacionesEnVivo", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("no consulta la API sin sesion (A-5)", async () => {
    // Arrange
    getCurrentUser.mockReturnValue(null);

    // Act
    renderNotificaciones();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    // Assert
    expect(listarNotificaciones).not.toHaveBeenCalled();
  });

  it("muestra un toast cuando llega una notificacion nueva y la marca al hacer click", async () => {
    // Arrange
    getCurrentUser.mockReturnValue({ id: 7 });
    listarNotificaciones
      .mockResolvedValueOnce({ data: { notificaciones: [{ id: 5, leida: true }] } })
      .mockResolvedValue({
        data: {
          notificaciones: [
            {
              id: 9,
              leida: false,
              descripcion: "Tienes un mensaje nuevo",
              tipo: "mensajes",
              url_redireccion: "/mensajes",
            },
          ],
        },
      });
    marcarLeida.mockResolvedValue({ success: true });

    // Act
    renderNotificaciones();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.queryByText("Nueva notificación")).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(7100);
    });

    // Assert
    expect(screen.getByText("Tienes un mensaje nuevo")).toBeInTheDocument();

    // Act: click en el toast
    await act(async () => {
      fireEvent.click(screen.getByText("Tienes un mensaje nuevo"));
    });

    // Assert
    expect(marcarLeida).toHaveBeenCalledWith(9);
    expect(screen.getByTestId("ruta-actual").textContent).toBe("/messages");
  });

  it("no repite el toast de una notificacion ya mostrada", async () => {
    // Arrange
    getCurrentUser.mockReturnValue({ id: 7 });
    const notificaciones = [
      { id: 5, leida: false, descripcion: "Algo", tipo: "pedidos", url_redireccion: "/pedidos" },
    ];
    listarNotificaciones.mockResolvedValue({ data: { notificaciones } });

    // Act
    renderNotificaciones();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(7100);
    });

    // Assert: la primera consulta solo memoriza el id, no hay toast
    expect(screen.queryByText("Nueva notificación")).not.toBeInTheDocument();
  });
});
