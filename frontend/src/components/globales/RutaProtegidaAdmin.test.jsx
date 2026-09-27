// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { getCurrentUser, getToken } from "../../api/client.js";
import RutaProtegidaAdmin from "./RutaProtegidaAdmin.jsx";

vi.mock("../../api/client.js", () => ({
  getCurrentUser: vi.fn(),
  getToken: vi.fn(),
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="ruta-actual">{location.pathname}</output>;
}

function renderRutasProtegidas() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <LocationProbe />
      <Routes>
        <Route
          path="/admin"
          element={
            <RutaProtegidaAdmin>
              <h1>Panel de administracion</h1>
            </RutaProtegidaAdmin>
          }
        />
        <Route path="/login" element={<h1>Inicio de sesion</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RutaProtegidaAdmin", () => {
  beforeEach(() => {
    vi.mocked(getToken).mockReset();
    vi.mocked(getCurrentUser).mockReset();
  });

  it("permite renderizar a un usuario con token y rol administrador", () => {
    // Arrange
    vi.mocked(getToken).mockReturnValue("jwt-de-prueba");
    vi.mocked(getCurrentUser).mockReturnValue({
      roles: ["usuario", "administrador"],
    });

    // Act
    renderRutasProtegidas();

    // Assert
    expect(
      screen.getByRole("heading", { name: "Panel de administracion" }),
    ).toBeTruthy();
    expect(screen.getByTestId("ruta-actual").textContent).toBe("/admin");
  });

  it("redirige a /login cuando no hay token", () => {
    // Arrange
    vi.mocked(getToken).mockReturnValue(null);
    vi.mocked(getCurrentUser).mockReturnValue({ roles: ["administrador"] });

    // Act
    renderRutasProtegidas();

    // Assert
    expect(
      screen.getByRole("heading", { name: "Inicio de sesion" }),
    ).toBeTruthy();
    expect(screen.getByTestId("ruta-actual").textContent).toBe("/login");
  });

  it("redirige a /login cuando el usuario no tiene rol administrador", () => {
    // Arrange
    vi.mocked(getToken).mockReturnValue("jwt-de-prueba");
    vi.mocked(getCurrentUser).mockReturnValue({ roles: ["usuario"] });

    // Act
    renderRutasProtegidas();

    // Assert
    expect(
      screen.getByRole("heading", { name: "Inicio de sesion" }),
    ).toBeTruthy();
    expect(screen.getByTestId("ruta-actual").textContent).toBe("/login");
  });
});
