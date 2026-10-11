import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { getCurrentUser } from "../../api/client.js";
import { cerrarSesion } from "../../services/usuarios.service.js";
import Navbar from "./Navbar.jsx";

vi.mock("../../api/client.js", () => ({
  clearCurrentUser: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock("../../services/usuarios.service.js", () => ({
  cerrarSesion: vi.fn(),
}));

function renderNavbar() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Navbar isOpen onClose={vi.fn()} />
    </MemoryRouter>
  );
}

describe("Navbar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    cerrarSesion.mockResolvedValue({});
  });

  it("oculta las secciones de vendedor a un comprador (M-22)", () => {
    // Arrange
    getCurrentUser.mockReturnValue({ id: 7, nombre_completo: "Ana", roles: ["comprador"] });

    // Act
    renderNavbar();

    // Assert
    expect(screen.getByRole("button", { name: /Inicio/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Carrito/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Historial de compras/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ajustes/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Perfil/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tienda/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Pedidos/ })).not.toBeInTheDocument();
  });

  it("muestra las secciones de vendedor a un vendedor", () => {
    // Arrange
    getCurrentUser.mockReturnValue({ id: 7, nombre_completo: "Ana", roles: ["vendedor"] });

    // Act
    renderNavbar();

    // Assert
    expect(screen.getByRole("button", { name: /Perfil/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tienda/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pedidos/ })).toBeInTheDocument();
  });
});
