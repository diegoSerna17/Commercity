import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "../../api/client.js";
import {
  contarSeguidores,
  dejarDeSeguir,
  listarSiguiendo,
  seguirUsuario,
} from "../../services/seguidores.service.js";
import {
  listarProductos,
  listarVendedores,
} from "../../services/productos.service.js";
import PerfilPublico from "./PerfilPublico.jsx";

vi.mock("../../components/globales/Header", () => ({
  default: () => createElement("header", null, "Header"),
}));

vi.mock("../../api/client.js", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("../../services/productos.service.js", () => ({
  listarProductos: vi.fn(),
  listarVendedores: vi.fn(),
}));

vi.mock("../../services/seguidores.service.js", () => ({
  contarSeguidores: vi.fn(),
  dejarDeSeguir: vi.fn(),
  listarSiguiendo: vi.fn(),
  seguirUsuario: vi.fn(),
}));

vi.mock("../../services/reportes.service.js", () => ({
  crearReporte: vi.fn(),
}));

function renderPerfil() {
  return render(
    <MemoryRouter initialEntries={["/vendedor/5"]}>
      <Routes>
        <Route path="/vendedor/:id" element={<PerfilPublico />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PerfilPublico", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentUser.mockReturnValue({ id: 7 });
    listarVendedores.mockResolvedValue({
      data: [{ id: 5, nombre: "Tienda Demo" }],
    });
    listarProductos.mockResolvedValue({ data: { productos: [] } });
    contarSeguidores.mockResolvedValue({
      data: { seguidores: 3, siguiendo: 1 },
    });
    listarSiguiendo.mockResolvedValue({ data: [] });
    dejarDeSeguir.mockResolvedValue({ success: true });
    seguirUsuario.mockResolvedValue({ success: true });
  });

  it("renderiza el vendedor y abre el modal de reporte de usuario", async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    renderPerfil();

    // Assert
    expect(await screen.findByText("Tienda Demo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reportar" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Reportar usuario")).toBeInTheDocument();
  });

  it("no muestra un rating sin fuente real", async () => {
    // Act
    renderPerfil();

    // Assert
    await screen.findByText("Tienda Demo");
    expect(screen.queryByText("5.0")).not.toBeInTheDocument();
  });

  it("oculta el boton Reportar en el propio perfil", async () => {
    // Arrange
    getCurrentUser.mockReturnValue({ id: 5 });

    // Act
    renderPerfil();

    // Assert
    await screen.findByText("Tienda Demo");
    expect(
      screen.queryByRole("button", { name: "Reportar" })
    ).not.toBeInTheDocument();
  });

  it("M-20: filtra los productos por vendedor_id en vez de por nombre", async () => {
    // Act
    renderPerfil();

    // Assert
    await screen.findByText("Tienda Demo");
    expect(listarProductos).toHaveBeenCalledWith({ vendedorId: "5", limit: 100 });
  });

  it("M-21: consulta la lista de seguidos solo con sesion", async () => {
    // Act
    renderPerfil();

    // Assert
    await screen.findByText("Tienda Demo");
    expect(listarSiguiendo).toHaveBeenCalledTimes(1);
  });

  it("M-21: sin sesion no consulta la lista de seguidos", async () => {
    // Arrange
    getCurrentUser.mockReturnValue(null);

    // Act
    renderPerfil();

    // Assert
    await screen.findByText("Tienda Demo");
    expect(listarSiguiendo).not.toHaveBeenCalled();
  });
});
