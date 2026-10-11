import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { request, setCurrentUser } from "../../api/client.js";
import IniciarSesion from "./IniciarSesion.jsx";

vi.mock("../../api/client.js", () => ({
  request: vi.fn(),
  setCurrentUser: vi.fn(),
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<IniciarSesion />} />
        <Route path="/" element={<h1>Inicio</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

async function completarCredenciales(user, email = "ana@correo.com", password = "secreta123") {
  await user.type(screen.getByLabelText("Correo electrónico"), email);
  await user.type(screen.getByLabelText("Contraseña"), password);
}

describe("IniciarSesion", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it("inicia sesion, guarda solo el usuario y navega al inicio (F4)", async () => {
    // Arrange
    const user = userEvent.setup();
    const usuario = { id: 7, nombre_completo: "Ana", roles: ["comprador"] };
    request.mockResolvedValue({ success: true, data: { token: "jwt-secreto", user: usuario } });
    renderLogin();

    // Act
    await completarCredenciales(user);
    await user.click(screen.getByRole("button", { name: /Entrar/ }));

    // Assert
    expect(request).toHaveBeenCalledWith("/api/usuarios/login", {
      method: "POST",
      body: { email: "ana@correo.com", password: "secreta123" },
    });
    expect(setCurrentUser).toHaveBeenCalledWith(usuario);
    expect(await screen.findByRole("heading", { name: "Inicio" })).toBeInTheDocument();
    // F4: el JWT nunca se persiste en localStorage.
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("muestra el error del backend y no navega", async () => {
    // Arrange
    const user = userEvent.setup();
    request.mockRejectedValue(new Error("Credenciales inválidas"));
    renderLogin();

    // Act
    await completarCredenciales(user);
    await user.click(screen.getByRole("button", { name: /Entrar/ }));

    // Assert
    expect(await screen.findByText("Credenciales inválidas")).toBeInTheDocument();
    expect(setCurrentUser).not.toHaveBeenCalled();
  });

  it("alterna la visibilidad de la contrasena", async () => {
    // Arrange
    const user = userEvent.setup();
    renderLogin();
    const campo = screen.getByLabelText("Contraseña");

    // Act
    expect(campo).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Mostrar contraseña" }));

    // Assert
    expect(campo).toHaveAttribute("type", "text");
  });
});
