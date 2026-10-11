import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { getCurrentUser } from "../../api/client.js";
import { contarNoLeidas } from "../../services/notificaciones.service.js";
import { listarProductos } from "../../services/productos.service.js";
import Header from "./Header.jsx";

vi.mock("../../api/client.js", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("../../services/notificaciones.service.js", () => ({
  contarNoLeidas: vi.fn(),
}));

vi.mock("../../services/productos.service.js", () => ({
  listarProductos: vi.fn(),
}));

vi.mock("./NotificacionesDropdown", () => ({
  default: () => <div data-testid="dropdown-notificaciones" />,
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="ruta-actual">{`${location.pathname}${location.search}`}</output>;
}

function renderHeader(props = {}) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <LocationProbe />
      <Routes>
        <Route path="/" element={<Header {...props} />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Header", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    contarNoLeidas.mockResolvedValue({ data: { total_no_leidas: 0 } });
    listarProductos.mockResolvedValue({ data: { productos: [] } });
  });

  it("muestra el titulo y no consulta notificaciones sin sesion (A-5)", async () => {
    // Arrange
    getCurrentUser.mockReturnValue(null);

    // Act
    renderHeader({ title: "Inicio" });

    // Assert
    expect(screen.getByText("Inicio")).toBeInTheDocument();
    await waitFor(() => expect(listarProductos).not.toHaveBeenCalled());
    expect(contarNoLeidas).not.toHaveBeenCalled();
  });

  it("muestra el contador de no leidas con sesion", async () => {
    // Arrange
    getCurrentUser.mockReturnValue({ id: 7 });
    contarNoLeidas.mockResolvedValue({ data: { total_no_leidas: 3 } });

    // Act
    renderHeader();

    // Assert
    expect(await screen.findByText("3")).toBeInTheDocument();
    expect(contarNoLeidas).toHaveBeenCalledTimes(1);
  });

  it("busca productos mientras se escribe y navega con Enter", async () => {
    // Arrange
    const user = userEvent.setup();
    getCurrentUser.mockReturnValue({ id: 7 });
    listarProductos.mockResolvedValue({
      data: {
        productos: [
          { id: 1, nombre: "Audífonos", precio: 10000, descuento_porcentaje: 0, vendedor: "Tienda" },
        ],
      },
    });

    // Act
    renderHeader();
    await user.type(screen.getByPlaceholderText("Buscar productos..."), "aud");

    // Assert
    await waitFor(() => {
      expect(listarProductos).toHaveBeenCalledWith({ nombre: "aud", limit: 8 });
    });
    expect(await screen.findByText("Audífonos")).toBeInTheDocument();

    // Act
    await user.keyboard("{Enter}");

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("ruta-actual").textContent).toBe("/?busqueda=aud");
    });
  });
});
