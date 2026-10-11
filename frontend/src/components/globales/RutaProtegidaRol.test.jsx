import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import {
  clearCurrentUser,
  getCurrentUser,
  setCurrentUser,
} from "../../api/client.js";
import { obtenerMiUsuario } from "../../services/usuarios.service.js";
import RutaProtegidaRol from "./RutaProtegidaRol.jsx";

vi.mock("../../api/client.js", () => ({
  clearCurrentUser: vi.fn(),
  getCurrentUser: vi.fn(),
  setCurrentUser: vi.fn(),
}));

vi.mock("../../services/usuarios.service.js", () => ({
  obtenerMiUsuario: vi.fn(),
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="ruta-actual">{location.pathname}</output>;
}

function renderRuta(initialEntry = "/store") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LocationProbe />
      <Routes>
        <Route
          path="/store"
          element={
            <RutaProtegidaRol roles={["vendedor", "administrador"]}>
              <h1>Tienda del vendedor</h1>
            </RutaProtegidaRol>
          }
        />
        <Route path="/" element={<h1>Inicio</h1>} />
        <Route path="/login" element={<h1>Inicio de sesion</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RutaProtegidaRol", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentUser.mockReturnValue({ id: 7, roles: ["vendedor"] });
    obtenerMiUsuario.mockResolvedValue({ data: { id: 7, roles: ["vendedor"] } });
  });

  it("confirma el rol contra /api/usuarios/me y renderiza la ruta", async () => {
    // Act
    renderRuta();

    // Assert
    expect(await screen.findByRole("heading", { name: "Tienda del vendedor" })).toBeInTheDocument();
    expect(obtenerMiUsuario).toHaveBeenCalledTimes(1);
    expect(setCurrentUser).toHaveBeenCalledWith({ id: 7, roles: ["vendedor"] });
    expect(screen.getByTestId("ruta-actual").textContent).toBe("/store");
  });

  it("redirige al inicio cuando el rol vigente no autoriza la ruta", async () => {
    // Arrange
    obtenerMiUsuario.mockResolvedValue({ data: { id: 7, roles: ["comprador"] } });

    // Act
    renderRuta();

    // Assert
    expect(await screen.findByRole("heading", { name: "Inicio" })).toBeInTheDocument();
    expect(screen.getByTestId("ruta-actual").textContent).toBe("/");
    expect(screen.queryByRole("heading", { name: "Tienda del vendedor" })).not.toBeInTheDocument();
  });

  it("limpia la sesion y redirige a /login cuando /me responde 401", async () => {
    // Arrange
    const error = new Error("Sesión caducada");
    error.status = 401;
    obtenerMiUsuario.mockRejectedValue(error);

    // Act
    renderRuta();

    // Assert
    await waitFor(() => {
      expect(clearCurrentUser).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByRole("heading", { name: "Inicio de sesion" })).toBeInTheDocument();
  });

  it("redirige a /login sin llamar a /me cuando no hay sesion local", () => {
    // Arrange
    getCurrentUser.mockReturnValue(null);

    // Act
    renderRuta();

    // Assert
    expect(
      screen.getByRole("heading", { name: "Inicio de sesion" }),
    ).toBeInTheDocument();
    expect(obtenerMiUsuario).not.toHaveBeenCalled();
  });

  it("mantiene la sesion local si /me falla sin conexion (sin status 401)", async () => {
    // Arrange
    obtenerMiUsuario.mockRejectedValue(new Error("Failed to fetch"));

    // Act
    renderRuta();

    // Assert
    expect(await screen.findByRole("heading", { name: "Tienda del vendedor" })).toBeInTheDocument();
    expect(clearCurrentUser).not.toHaveBeenCalled();
  });
});
