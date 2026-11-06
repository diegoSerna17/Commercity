import { createElement } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
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
import { listarCalificacionesVendedor } from "../../services/calificaciones.service.js";
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

vi.mock("../../services/calificaciones.service.js", () => ({
  listarCalificacionesVendedor: vi.fn(),
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="ruta-actual">{location.pathname}</output>;
}

function renderPerfil(entries = ["/vendedor/5"]) {
  return render(
    <MemoryRouter initialEntries={entries}>
      <LocationProbe />
      <Routes>
        <Route path="/vendedor/:id" element={<PerfilPublico />} />
      </Routes>
    </MemoryRouter>
  );
}

function productoApi(sobreescribir = {}) {
  return {
    id: 42,
    nombre: "Audífonos",
    precio: 100000,
    descuento_porcentaje: 10,
    stock: 10,
    imagen: "/uploads/aud.png",
    categoria: "Tecnologia",
    vendedor: "Tienda Demo",
    vendedor_foto: "/uploads/tienda.png",
    ...sobreescribir,
  };
}

describe("PerfilPublico", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sessionStorage.clear();
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
    listarCalificacionesVendedor.mockResolvedValue({
      data: { resumen: { promedio: null, total: 0 }, calificaciones: [] },
      paginacion: { pagina: 1, por_pagina: 5, total: 0, total_paginas: 1 },
    });
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

    // Act
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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

  it("muestra los productos con descuento, categoria y stock", async () => {
    // Arrange
    listarProductos.mockResolvedValueOnce({
      data: { productos: [productoApi()] },
    });

    // Act
    renderPerfil();

    // Assert
    expect(await screen.findByText("Audífonos")).toBeInTheDocument();
    expect(screen.getAllByText("Tienda Demo")).toHaveLength(2);
    expect(screen.getByText("-10%")).toBeInTheDocument();
    expect(screen.getByText("Tecnologia")).toBeInTheDocument();
    expect(screen.getByText("10 unidades")).toBeInTheDocument();
    expect(screen.getByText("$100.000")).toBeInTheDocument();
    expect(screen.getByText("$90.000")).toBeInTheDocument();
    expect(screen.getByAltText("Audífonos").getAttribute("src")).toContain(
      "/uploads/aud.png"
    );
  });

  it("avisa cuando no hay productos publicados", async () => {
    // Act
    renderPerfil();

    // Assert
    expect(
      await screen.findByText(
        "Este vendedor no tiene productos publicados por ahora."
      )
    ).toBeInTheDocument();
  });

  it("muestra el error de carga y su mensaje por defecto", async () => {
    // Arrange
    listarProductos.mockRejectedValueOnce(new Error("Catalogo caido"));

    // Act
    renderPerfil();

    // Assert
    expect(await screen.findByText("Catalogo caido")).toBeInTheDocument();

    // Arrange
    listarProductos.mockRejectedValueOnce({});

    // Act
    renderPerfil();

    // Assert
    expect(
      await screen.findByText("No se pudo cargar el perfil del vendedor")
    ).toBeInTheDocument();
  });

  it("deja los contadores en cero si fallan las consultas sociales", async () => {
    // Arrange
    contarSeguidores.mockRejectedValue(new Error("Contadores caidos"));
    listarSiguiendo.mockRejectedValue(new Error("Seguidos caidos"));

    // Act
    renderPerfil();

    // Assert
    expect(
      await screen.findByText(
        "Este vendedor no tiene productos publicados por ahora."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("Contadores caidos")).not.toBeInTheDocument();
    expect(screen.getAllByText("0")).toHaveLength(3);
  });

  it("sigue y deja de seguir al vendedor actualizando el contador", async () => {
    // Arrange
    const user = userEvent.setup();
    renderPerfil();
    const seguir = await screen.findByRole("button", { name: "Seguir" });

    // Act
    await user.click(seguir);

    // Assert
    await waitFor(() =>
      expect(seguirUsuario).toHaveBeenCalledWith(5)
    );
    expect(
      await screen.findByRole("button", { name: "Siguiendo" })
    ).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole("button", { name: "Siguiendo" }));

    // Assert
    await waitFor(() => expect(dejarDeSeguir).toHaveBeenCalledWith(5));
    expect(
      await screen.findByRole("button", { name: "Seguir" })
    ).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("tolera un 404 al dejar de seguir y un 409 al seguir", async () => {
    // Arrange
    const user = userEvent.setup();
    listarSiguiendo.mockResolvedValueOnce({ data: [{ id: 5 }] });
    dejarDeSeguir.mockRejectedValueOnce({ status: 404 });
    const { unmount } = renderPerfil();

    // Act
    await user.click(await screen.findByRole("button", { name: "Siguiendo" }));

    // Assert
    expect(
      await screen.findByRole("button", { name: "Seguir" })
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    // Arrange
    unmount();
    listarSiguiendo.mockResolvedValueOnce({ data: [] });
    seguirUsuario.mockRejectedValueOnce({ status: 409 });

    // Act
    renderPerfil();

    // Assert
    await user.click(await screen.findByRole("button", { name: "Seguir" }));
    expect(
      await screen.findByRole("button", { name: "Siguiendo" })
    ).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("conserva el estado si el error al seguir no es tolerable", async () => {
    // Arrange
    const user = userEvent.setup();
    seguirUsuario.mockRejectedValueOnce({ status: 500 });
    renderPerfil();
    await user.click(await screen.findByRole("button", { name: "Seguir" }));

    // Assert
    await waitFor(() => expect(seguirUsuario).toHaveBeenCalledWith(5));
    expect(
      await screen.findByRole("button", { name: "Seguir" })
    ).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("abre el chat guardando el contacto activo", async () => {
    // Arrange
    const user = userEvent.setup();
    renderPerfil();
    await screen.findByText("Tienda Demo");

    // Act
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    // Assert
    const guardado = JSON.parse(sessionStorage.getItem("activeChat"));
    expect(guardado).toMatchObject({ id: 5, name: "Tienda Demo" });
    expect(screen.getByTestId("ruta-actual").textContent).toBe(
      "/messages/chat"
    );
  });

  it("navega al login al mensajear sin sesion", async () => {
    // Arrange
    const user = userEvent.setup();
    getCurrentUser.mockReturnValue(null);
    renderPerfil();
    await screen.findByText("Tienda Demo");

    // Act
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    // Assert
    expect(screen.getByTestId("ruta-actual").textContent).toBe("/login");
    expect(sessionStorage.getItem("activeChat")).toBeNull();
  });

  it("navega al login al seguir sin sesion", async () => {
    // Arrange
    const user = userEvent.setup();
    getCurrentUser.mockReturnValue(null);
    renderPerfil();

    // Act
    await user.click(await screen.findByRole("button", { name: "Seguir" }));

    // Assert
    expect(screen.getByTestId("ruta-actual").textContent).toBe("/login");
    expect(seguirUsuario).not.toHaveBeenCalled();
  });

  it("prefiere el avatar del state y cae al generico si falla", async () => {
    // Arrange
    renderPerfil([
      {
        pathname: "/vendedor/5",
        state: { nombre: "Tienda Demo", avatar: "/uploads/ana.png" },
      },
    ]);
    const avatar = await screen.findByAltText("Avatar de Tienda Demo");

    // Assert
    expect(avatar.getAttribute("src")).toContain("/uploads/ana.png");
    expect(listarVendedores).not.toHaveBeenCalled();

    // Act
    fireEvent.error(avatar);

    // Assert
    expect(avatar.src).toContain("avatar-placeholder.svg");
  });

  it("no actualiza el estado si desmonta antes de las respuestas", async () => {
    // Arrange
    let resolverVendedores;
    let resolverContadores;
    let resolverSiguiendo;
    listarVendedores.mockReturnValue(
      new Promise((resolve) => {
        resolverVendedores = resolve;
      })
    );
    contarSeguidores.mockReturnValue(
      new Promise((resolve) => {
        resolverContadores = resolve;
      })
    );
    listarSiguiendo.mockReturnValue(
      new Promise((resolve) => {
        resolverSiguiendo = resolve;
      })
    );
    listarProductos.mockReturnValue(new Promise(() => {}));
    const { unmount } = renderPerfil();

    // Act
    unmount();
    await act(async () => {
      resolverVendedores({ data: [{ id: 5, nombre: "Tienda Demo" }] });
      resolverContadores({ data: { seguidores: 9, siguiendo: 9 } });
      resolverSiguiendo({ data: [{ id: 5 }] });
    });

    // Assert
    expect(screen.queryByText("Tienda Demo")).not.toBeInTheDocument();
  });

  it("no actualiza los productos si desmonta durante la carga", async () => {
    // Arrange
    let resolverProductos;
    listarProductos.mockReturnValue(
      new Promise((resolve) => {
        resolverProductos = resolve;
      })
    );
    const { unmount } = renderPerfil([
      {
        pathname: "/vendedor/5",
        state: { nombre: "Tienda Demo", avatar: "" },
      },
    ]);

    // Act
    unmount();
    await act(async () => {
      resolverProductos({ data: { productos: [productoApi()] } });
    });

    // Assert
    expect(screen.queryByText("Audífonos")).not.toBeInTheDocument();
  });

  it("ignora el error de productos despues de desmontar", async () => {
    // Arrange
    let rechazarProductos;
    listarProductos.mockReturnValue(
      new Promise((_, reject) => {
        rechazarProductos = reject;
      })
    );
    const { unmount } = renderPerfil([
      {
        pathname: "/vendedor/5",
        state: { nombre: "Tienda Demo", avatar: "" },
      },
    ]);

    // Act
    unmount();
    await act(async () => {
      rechazarProductos(new Error("Catalogo caido"));
    });

    // Assert
    expect(screen.queryByText("Catalogo caido")).not.toBeInTheDocument();
  });

  it("normaliza el avatar placeholder externo al local", async () => {
    // Act
    renderPerfil([
      {
        pathname: "/vendedor/5",
        state: {
          nombre: "Tienda Demo",
          avatar: "https://via.placeholder.com/150",
        },
      },
    ]);
    const avatar = await screen.findByAltText("Avatar de Tienda Demo");

    // Assert
    expect(avatar.getAttribute("src")).toContain("avatar-placeholder.svg");
  });

  it("usa Vendedor cuando la API no encuentra el perfil", async () => {
    // Arrange
    listarVendedores.mockResolvedValue({ data: [] });

    // Act
    renderPerfil();

    // Assert
    expect(
      await screen.findByRole("heading", { name: "Vendedor" })
    ).toBeInTheDocument();
  });
});
