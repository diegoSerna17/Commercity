import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { getCurrentUser } from "../../api/client.js";
import RutaProtegida from "./RutaProtegida.jsx";

vi.mock("../../api/client.js", () => ({
  getCurrentUser: vi.fn(),
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="ruta-actual">{location.pathname}</output>;
}

function renderRuta(initialEntry = "/cart") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LocationProbe />
      <Routes>
        <Route
          path="/cart"
          element={
            <RutaProtegida>
              <h1>Carrito protegido</h1>
            </RutaProtegida>
          }
        />
        <Route path="/" element={<h1>Inicio</h1>} />
        <Route path="/login" element={<h1>Inicio de sesion</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RutaProtegida", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
  });

  it("renderiza la pagina cuando hay sesion", () => {
    // Arrange
    vi.mocked(getCurrentUser).mockReturnValue({ id: 7 });

    // Act
    renderRuta();

    // Assert
    expect(
      screen.getByRole("heading", { name: "Carrito protegido" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("ruta-actual").textContent).toBe("/cart");
  });

  it("redirige a /login cuando no hay sesion", () => {
    // Arrange
    vi.mocked(getCurrentUser).mockReturnValue(null);

    // Act
    renderRuta();

    // Assert
    expect(
      screen.getByRole("heading", { name: "Inicio de sesion" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("ruta-actual").textContent).toBe("/login");
  });
});
