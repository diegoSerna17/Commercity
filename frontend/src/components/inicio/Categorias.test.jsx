import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listarCategorias } from "../../services/productos.service.js";
import Categorias from "./Categorias.jsx";

vi.mock("../../services/productos.service.js", () => ({
  listarCategorias: vi.fn(),
}));

function VistaRuta() {
  const location = useLocation();
  return <p>ruta: {location.pathname + location.search}</p>;
}

function renderCategorias(ruta = "/") {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Categorias />
      <VistaRuta />
    </MemoryRouter>
  );
}

describe("Categorias", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    listarCategorias.mockResolvedValue({
      success: true,
      data: [
        { id: 1, nombre: "Tecnologia" },
        { id: 2, nombre: "Ropa y moda" },
      ],
    });
  });

  it("no renderiza nada mientras carga", () => {
    // Arrange
    listarCategorias.mockReturnValue(new Promise(() => {}));

    // Act
    const { container } = renderCategorias();

    // Assert
    expect(container.querySelector("button")).not.toBeInTheDocument();
  });

  it("no renderiza nada si la lista viene vacia", async () => {
    // Arrange
    listarCategorias.mockResolvedValue({ data: [] });

    // Act
    const { container } = renderCategorias();

    // Assert
    await waitFor(() => expect(listarCategorias).toHaveBeenCalled());
    expect(container.querySelector("button")).not.toBeInTheDocument();
  });

  it("no renderiza nada si la carga falla", async () => {
    // Arrange
    listarCategorias.mockRejectedValue(new Error("sin red"));

    // Act
    const { container } = renderCategorias();

    // Assert
    await waitFor(() => expect(listarCategorias).toHaveBeenCalled());
    expect(container.querySelector("button")).not.toBeInTheDocument();
  });

  it("abre el desplegable con Todos y las categorias", async () => {
    // Arrange
    const user = userEvent.setup();
    renderCategorias();
    await screen.findByRole("button", { name: /Categorías/ });

    // Act
    await user.click(screen.getByRole("button", { name: /Categorías/ }));

    // Assert
    expect(screen.getByRole("button", { name: "Todos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tecnologia" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ropa y moda" })).toBeInTheDocument();
  });

  it("seleccionar una categoria navega con encodeURIComponent", async () => {
    // Arrange
    const user = userEvent.setup();
    renderCategorias();
    await screen.findByRole("button", { name: /Categorías/ });
    await user.click(screen.getByRole("button", { name: /Categorías/ }));

    // Act
    await user.click(screen.getByRole("button", { name: "Ropa y moda" }));

    // Assert
    expect(screen.getByText("ruta: /?categoria=Ropa%20y%20moda")).toBeInTheDocument();
  });

  it("la opcion Todos limpia el filtro", async () => {
    // Arrange
    const user = userEvent.setup();
    renderCategorias("/?categoria=Tecnologia");
    await screen.findByRole("button", { name: "Tecnologia" });
    await user.click(screen.getByRole("button", { name: "Tecnologia" }));

    // Act
    await user.click(screen.getByRole("button", { name: "Todos" }));

    // Assert
    expect(screen.getByText("ruta: /")).toBeInTheDocument();
  });

  it("la categoria activa sale de searchParams y se muestra en el boton", async () => {
    // Act
    renderCategorias("/?categoria=Tecnologia");

    // Assert
    expect(await screen.findByRole("button", { name: "Tecnologia" })).toBeInTheDocument();
  });

  it("se cierra al hacer mousedown fuera del contenedor", async () => {
    // Arrange
    const user = userEvent.setup();
    renderCategorias();
    await screen.findByRole("button", { name: /Categorías/ });
    await user.click(screen.getByRole("button", { name: /Categorías/ }));
    expect(screen.getByRole("button", { name: "Todos" })).toBeInTheDocument();

    // Act
    await user.click(document.body);

    // Assert
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Todos" })).not.toBeInTheDocument()
    );
  });
});
