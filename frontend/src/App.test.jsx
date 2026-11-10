import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";
import { clearCurrentUser, setCurrentUser } from "./api/client.js";
import { obtenerMiUsuario } from "./services/usuarios.service.js";

vi.mock("./services/usuarios.service.js", () => ({
  obtenerMiUsuario: vi.fn(),
}));

vi.mock("./components/globales/Navbar", () => ({
  default: () => <nav>Navegacion</nav>,
}));

vi.mock("./components/globales/NotificacionesEnVivo", () => ({
  default: () => <p>Notificaciones en vivo</p>,
}));

vi.mock("./pages/Home", () => ({ default: () => <h1>Pagina Home</h1> }));
vi.mock("./pages/IniciarSesion/IniciarSesion", () => ({
  default: () => <h1>Pagina Login</h1>,
}));
vi.mock("./pages/IniciarSesion/Registro", () => ({
  default: () => <h1>Pagina Registro</h1>,
}));
vi.mock("./pages/IniciarSesion/Recuperar", () => ({
  default: () => <h1>Pagina Recuperar</h1>,
}));
vi.mock("./pages/IniciarSesion/Restablecer", () => ({
  default: () => <h1>Pagina Restablecer</h1>,
}));
vi.mock("./pages/Perfil/PerfilVendedor", () => ({
  default: () => <h1>Pagina Perfil Vendedor</h1>,
}));
vi.mock("./pages/Perfil/PerfilPublico", () => ({
  default: () => <h1>Pagina Perfil Publico</h1>,
}));
vi.mock("./pages/Perfil/Pedidos", () => ({
  default: () => <h1>Pagina Pedidos</h1>,
}));
vi.mock("./pages/Perfil/Mensajes", () => ({
  default: () => <h1>Pagina Mensajes</h1>,
}));
vi.mock("./pages/Perfil/Chats", () => ({
  default: () => <h1>Pagina Chats</h1>,
}));
vi.mock("./pages/Carrito/Carrito", () => ({
  default: () => <h1>Pagina Carrito</h1>,
}));
vi.mock("./pages/Perfil/HistorialDeCompras", () => ({
  default: () => <h1>Pagina Historial</h1>,
}));
vi.mock("./pages/Perfil/Ajustes", () => ({
  default: () => <h1>Pagina Ajustes</h1>,
}));
vi.mock("./pages/Tienda/Tienda", () => ({
  default: () => <h1>Pagina Tienda</h1>,
}));
vi.mock("./pages/Administrador/PanelControl", () => ({
  default: () => <h1>Pagina Panel Administrador</h1>,
}));

function renderApp(ruta) {
  window.history.replaceState({}, "", ruta);
  return render(<App />);
}

describe("App", () => {
  beforeEach(() => {
    obtenerMiUsuario.mockReset();
  });

  afterEach(() => {
    clearCurrentUser();
    window.history.replaceState({}, "", "/");
  });

  it("renderiza la pagina publica de inicio con navbar", async () => {
    renderApp("/");

    expect(await screen.findByText("Pagina Home")).toBeInTheDocument();
    expect(screen.getByText("Navegacion")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Abrir menu" })
    ).toBeInTheDocument();
  });

  it.each([
    ["/login", "Pagina Login"],
    ["/register", "Pagina Registro"],
    ["/recover", "Pagina Recuperar"],
    ["/restore", "Pagina Restablecer"],
  ])("oculta el navbar en %s", async (ruta, texto) => {
    renderApp(ruta);

    expect(await screen.findByText(texto)).toBeInTheDocument();
    expect(screen.queryByText("Navegacion")).not.toBeInTheDocument();
  });

  it("oculta el navbar en el panel de administracion", async () => {
    // Arrange
    setCurrentUser({ roles: ["administrador"] });
    obtenerMiUsuario.mockResolvedValue({
      data: { roles: ["administrador"] },
    });

    // Act
    renderApp("/admin");

    // Assert
    expect(
      await screen.findByText("Pagina Panel Administrador")
    ).toBeInTheDocument();
    expect(screen.queryByText("Navegacion")).not.toBeInTheDocument();
  });

  it("redirige a login en una ruta protegida sin sesion", async () => {
    renderApp("/cart");

    expect(await screen.findByText("Pagina Login")).toBeInTheDocument();
    expect(screen.queryByText("Pagina Carrito")).not.toBeInTheDocument();
  });

  it("abre una ruta protegida con sesion local", async () => {
    // Arrange
    setCurrentUser({ roles: ["comprador"] });

    // Act
    renderApp("/messages");

    // Assert
    expect(await screen.findByText("Pagina Mensajes")).toBeInTheDocument();
    expect(screen.getByText("Navegacion")).toBeInTheDocument();
  });

  it("deja pasar a vendedor a las rutas de vendedor", async () => {
    // Arrange
    setCurrentUser({ roles: ["comprador"] });
    obtenerMiUsuario.mockResolvedValue({
      data: { nombre_completo: "Ana", roles: ["comprador", "vendedor"] },
    });

    // Act
    renderApp("/orders");

    // Assert
    expect(await screen.findByText("Pagina Pedidos")).toBeInTheDocument();
  });

  it("expulsa al comprador de una ruta de vendedor", async () => {
    // Arrange
    setCurrentUser({ roles: ["comprador"] });
    obtenerMiUsuario.mockResolvedValue({
      data: { nombre_completo: "Ana", roles: ["comprador"] },
    });

    // Act
    renderApp("/store");

    // Assert
    expect(await screen.findByText("Pagina Home")).toBeInTheDocument();
    expect(screen.queryByText("Pagina Tienda")).not.toBeInTheDocument();
  });

  it("expulsa al vendedor del panel de administracion", async () => {
    // Arrange
    setCurrentUser({ roles: ["vendedor"] });
    obtenerMiUsuario.mockResolvedValue({
      data: { nombre_completo: "Ana", roles: ["vendedor"] },
    });

    // Act
    renderApp("/admin/dashboard");

    // Assert
    expect(await screen.findByText("Pagina Home")).toBeInTheDocument();
    expect(
      screen.queryByText("Pagina Panel Administrador")
    ).not.toBeInTheDocument();
  });

  it("permite al administrador entrar a las rutas de vendedor", async () => {
    // Arrange
    setCurrentUser({ roles: ["administrador"] });
    obtenerMiUsuario.mockResolvedValue({
      data: { nombre_completo: "Admin", roles: ["administrador"] },
    });

    // Act
    renderApp("/store");

    // Assert
    expect(await screen.findByText("Pagina Tienda")).toBeInTheDocument();
  });

  it("redirige a login si la verificacion del rol da 401", async () => {
    // Arrange
    setCurrentUser({ roles: ["vendedor"] });
    obtenerMiUsuario.mockRejectedValue({ status: 401 });

    // Act
    renderApp("/profile");

    // Assert
    expect(await screen.findByText("Pagina Login")).toBeInTheDocument();
    expect(screen.queryByText("Pagina Perfil Vendedor")).not.toBeInTheDocument();
  });

  it("niega el acceso si falla la red al verificar el rol (fail-closed)", async () => {
    // Arrange
    setCurrentUser({ roles: ["vendedor"] });
    obtenerMiUsuario.mockRejectedValue(new Error("sin conexion"));

    // Act
    renderApp("/PerfilVendedor");

    // Assert
    expect(await screen.findByText("Pagina Login")).toBeInTheDocument();
    expect(
      screen.queryByText("Pagina Perfil Vendedor")
    ).not.toBeInTheDocument();
  });

  it("muestra la pagina 404 en una ruta desconocida", async () => {
    renderApp("/ruta-que-no-existe");

    expect(
      await screen.findByRole("heading", { name: "Página no encontrada" })
    ).toBeInTheDocument();
  });

  it("renderiza la vista publica de vendedor sin sesion", async () => {
    renderApp("/vendedor/7");

    expect(await screen.findByText("Pagina Perfil Publico")).toBeInTheDocument();
    expect(screen.getByText("Navegacion")).toBeInTheDocument();
  });

  it("monta las notificaciones en vivo solo con sesion", async () => {
    // Arrange
    const { unmount } = renderApp("/");

    // Act + Assert
    expect(await screen.findByText("Pagina Home")).toBeInTheDocument();
    expect(
      screen.queryByText("Notificaciones en vivo")
    ).not.toBeInTheDocument();

    unmount();
    setCurrentUser({ roles: ["comprador"] });
    renderApp("/");

    expect(
      await screen.findByText("Notificaciones en vivo")
    ).toBeInTheDocument();
  });

  it("abre y cierra el menu lateral con el boton y el fondo", async () => {
    // Arrange
    const usuario = userEvent.setup();
    const { container } = renderApp("/");
    await screen.findByText("Pagina Home");
    const fondo = container.querySelector('div[aria-hidden="true"]');

    // Act + Assert
    expect(document.body.style.overflow).toBe("");
    await usuario.click(screen.getByRole("button", { name: "Abrir menu" }));
    expect(document.body.style.overflow).toBe("hidden");

    await usuario.click(fondo);
    await waitFor(() => expect(document.body.style.overflow).toBe(""));
  });
});
