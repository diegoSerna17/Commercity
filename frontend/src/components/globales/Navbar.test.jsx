import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
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

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="ruta-actual">{location.pathname}</output>;
}

function renderNavbar({ isOpen = true, onClose = vi.fn() } = {}) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <LocationProbe />
      <Navbar isOpen={isOpen} onClose={onClose} />
    </MemoryRouter>
  );
}

describe("Navbar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sessionStorage.clear();
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

  it("muestra las secciones de vendedor al administrador (desajuste admin/vendedor)", () => {
    // Arrange
    getCurrentUser.mockReturnValue({ id: 1, nombre_completo: "Admin", roles: ["administrador"] });

    // Act
    renderNavbar();

    // Assert
    expect(screen.getByRole("button", { name: /Perfil/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tienda/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pedidos/ })).toBeInTheDocument();
  });

  it("navega al pulsar un item y cierra el sidebar", async () => {
    // Arrange
    const user = userEvent.setup();
    const onClose = vi.fn();
    getCurrentUser.mockReturnValue({ id: 7, roles: ["comprador"] });
    renderNavbar({ onClose });

    // Act
    await user.click(screen.getByRole("button", { name: /Carrito/ }));

    // Assert
    expect(screen.getByTestId("ruta-actual").textContent).toBe("/cart");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cierra sesion, limpia el chat activo y navega al login", async () => {
    // Arrange
    const user = userEvent.setup();
    const onClose = vi.fn();
    getCurrentUser.mockReturnValue({ id: 7, roles: ["vendedor"] });
    sessionStorage.setItem("activeChat", JSON.stringify({ id: 9 }));
    renderNavbar({ onClose });

    // Act
    await user.click(screen.getByRole("button", { name: "Cerrar Sesión" }));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("ruta-actual").textContent).toBe("/login");
    });
    expect(cerrarSesion).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem("activeChat")).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("limpia la sesion local aunque falle la revocacion del token", async () => {
    // Arrange
    const user = userEvent.setup();
    const onClose = vi.fn();
    getCurrentUser.mockReturnValue({ id: 7, roles: ["comprador"] });
    cerrarSesion.mockRejectedValue(new Error("Sin red"));
    renderNavbar({ onClose });

    // Act
    await user.click(screen.getByRole("button", { name: "Cerrar Sesión" }));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("ruta-actual").textContent).toBe("/login");
    });
    expect(cerrarSesion).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("muestra el usuario por defecto y oculta el sidebar cerrado", () => {
    // Arrange
    getCurrentUser.mockReturnValue(null);

    // Act
    const { container } = renderNavbar({ isOpen: false });

    // Assert
    expect(screen.getByText("Usuario")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Perfil/ })
    ).not.toBeInTheDocument();
    expect(container.querySelector("aside").className).toContain(
      "-translate-x-full"
    );
  });
});
