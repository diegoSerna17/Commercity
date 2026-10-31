import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  Link,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
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
  default: ({ onChange }) => (
    <div data-testid="dropdown-notificaciones">
      <button type="button" onClick={onChange}>
        Recargar notificaciones
      </button>
    </div>
  ),
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

function renderHeaderConRutas(props = {}) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <LocationProbe />
      <Header {...props} />
      <Link to="/otra">Ir a otra ruta</Link>
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

  it("abre y cierra la busqueda movil y navega con Enter", () => {
    // Arrange
    getCurrentUser.mockReturnValue(null);
    renderHeaderConRutas();

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Abrir busqueda" }));
    const campo = document.getElementById("mobile-search-input");

    // Assert
    expect(campo).not.toBeNull();

    // Act
    fireEvent.change(campo, { target: { value: "gato" } });
    fireEvent.keyDown(campo, { key: "Enter" });

    // Assert
    expect(screen.getByTestId("ruta-actual").textContent).toBe(
      "/?busqueda=gato"
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Cerrar busqueda" }));

    // Assert
    expect(document.getElementById("mobile-search-input")).toBeNull();
  });

  it("cierra la busqueda movil al cambiar de ruta", () => {
    // Arrange
    getCurrentUser.mockReturnValue(null);
    renderHeaderConRutas();
    fireEvent.click(screen.getByRole("button", { name: "Abrir busqueda" }));
    expect(document.getElementById("mobile-search-input")).not.toBeNull();

    // Act
    fireEvent.click(screen.getByRole("link", { name: "Ir a otra ruta" }));

    // Assert
    expect(screen.getByTestId("ruta-actual").textContent).toBe("/otra");
    expect(document.getElementById("mobile-search-input")).toBeNull();
  });

  it("muestra sin resultados si falla la busqueda y oculta la lista al hacer click fuera", async () => {
    // Arrange
    const user = userEvent.setup();
    getCurrentUser.mockReturnValue(null);
    listarProductos.mockRejectedValue(new Error("Catalogo caido"));
    renderHeaderConRutas();

    // Act
    await user.type(screen.getByPlaceholderText("Buscar productos..."), "aud");

    // Assert
    expect(
      await screen.findByText('Sin resultados para "aud"')
    ).toBeInTheDocument();

    // Act
    fireEvent.mouseDown(document.body);

    // Assert
    await waitFor(() =>
      expect(
        screen.queryByText('Sin resultados para "aud"')
      ).not.toBeInTheDocument()
    );
  });

  it("abre el detalle del resultado y muestra el precio con descuento", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelectProduct = vi.fn();
    getCurrentUser.mockReturnValue(null);
    listarProductos.mockResolvedValue({
      data: {
        productos: [
          {
            id: 1,
            nombre: "Audífonos",
            precio: 10000,
            descuento_porcentaje: 10,
            vendedor: "Tienda",
            imagen: null,
            categoria: "Tecnologia",
          },
        ],
      },
    });
    renderHeaderConRutas({ onSelectProduct });

    // Act
    await user.type(screen.getByPlaceholderText("Buscar productos..."), "aud");
    const resultado = await screen.findByRole("button", { name: /Audífonos/ });

    // Assert
    expect(screen.getByText("$10.000")).toBeInTheDocument();
    expect(screen.getByText("$9.000")).toBeInTheDocument();

    // Act
    fireEvent.click(resultado);

    // Assert
    expect(onSelectProduct).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 })
    );
    expect(
      screen.queryByRole("button", { name: /Audífonos/ })
    ).not.toBeInTheDocument();
  });

  it("vuelve a mostrar los resultados al enfocar el buscador con texto", async () => {
    // Arrange
    const user = userEvent.setup();
    getCurrentUser.mockReturnValue(null);
    listarProductos.mockResolvedValue({
      data: {
        productos: [
          {
            id: 1,
            nombre: "Audífonos",
            precio: 10000,
            descuento_porcentaje: 0,
            vendedor: "Tienda",
          },
        ],
      },
    });
    renderHeaderConRutas();
    const campo = screen.getByPlaceholderText("Buscar productos...");

    // Act
    await user.type(campo, "aud");

    // Assert
    expect(await screen.findByText("Audífonos")).toBeInTheDocument();

    // Act
    fireEvent.mouseDown(document.body);

    // Assert
    await waitFor(() =>
      expect(screen.queryByText("Audífonos")).not.toBeInTheDocument()
    );

    // Act
    fireEvent.focus(campo);

    // Assert
    expect(await screen.findByText("Audífonos")).toBeInTheDocument();
  });

  it("recarga las no leidas desde el dropdown y navega al login desde el perfil", async () => {
    // Arrange
    const user = userEvent.setup();
    getCurrentUser.mockReturnValue({ id: 7 });
    contarNoLeidas.mockResolvedValueOnce({ data: { total_no_leidas: 5 } });
    renderHeaderConRutas();

    // Assert
    expect(await screen.findByText("5")).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole("button", { name: "Notificaciones" }));

    // Assert
    expect(screen.getByTestId("dropdown-notificaciones")).toBeInTheDocument();

    // Act
    contarNoLeidas.mockResolvedValueOnce({ data: { total_no_leidas: 120 } });
    await user.click(
      screen.getByRole("button", { name: "Recargar notificaciones" })
    );

    // Assert
    expect(await screen.findByText("99+")).toBeInTheDocument();

    // Act
    contarNoLeidas.mockRejectedValueOnce(new Error("Notificaciones caidas"));
    await user.click(
      screen.getByRole("button", { name: "Recargar notificaciones" })
    );

    // Assert
    await waitFor(() => expect(contarNoLeidas).toHaveBeenCalledTimes(3));
    expect(screen.getByText("99+")).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole("button", { name: "Perfil" }));

    // Assert
    expect(screen.getByTestId("ruta-actual").textContent).toBe("/login");
  });

  it("no consulta notificaciones desde el dropdown sin sesion", async () => {
    // Arrange
    const user = userEvent.setup();
    getCurrentUser.mockReturnValue(null);
    renderHeaderConRutas();

    // Act
    await user.click(screen.getByRole("button", { name: "Notificaciones" }));
    await user.click(
      screen.getByRole("button", { name: "Recargar notificaciones" })
    );

    // Assert
    expect(contarNoLeidas).not.toHaveBeenCalled();
  });
});
