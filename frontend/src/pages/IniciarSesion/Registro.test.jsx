import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { request, setCurrentUser } from "../../api/client.js";
import Registro from "./Registro.jsx";

vi.mock("../../api/client.js", () => ({
  request: vi.fn(),
  setCurrentUser: vi.fn(),
}));

function renderRegistro() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Registro />} />
        <Route path="/" element={<h1>Inicio</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

async function completarFormulario(user, { nombre = "Ana Perez", email = "ana@correo.com", password = "secreta123" } = {}) {
  await user.type(screen.getByPlaceholderText("Nombre completo"), nombre);
  await user.type(screen.getByPlaceholderText("Correo electrónico"), email);
  await user.type(screen.getByPlaceholderText("Contraseña"), password);
  await user.click(screen.getByRole("checkbox"));
}

describe("Registro", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("no llama a la API cuando el correo tiene formato invalido", async () => {
    // Arrange
    const user = userEvent.setup();
    renderRegistro();

    // Act: el navegador bloquea el envio por la validacion nativa de type=email
    await completarFormulario(user, { email: "correo-invalido" });
    await user.click(screen.getByRole("button", { name: "Registrarse" }));

    // Assert
    expect(request).not.toHaveBeenCalled();
  });

  it("exige una contrasena de al menos 8 caracteres", async () => {
    // Arrange
    const user = userEvent.setup();
    renderRegistro();

    // Act
    await completarFormulario(user, { password: "corta" });
    await user.click(screen.getByRole("button", { name: "Registrarse" }));

    // Assert
    expect(
      screen.getByText("La contraseña debe tener mínimo 8 caracteres")
    ).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });

  it("registra la cuenta, guarda el usuario (no el token) y navega", async () => {
    // Arrange
    const user = userEvent.setup();
    const usuario = { id: 9, nombre_completo: "Ana Perez", roles: ["comprador"] };
    request.mockResolvedValue({ success: true, data: { token: "jwt-secreto", user: usuario } });
    renderRegistro();

    // Act
    await completarFormulario(user);
    await user.click(screen.getByRole("button", { name: "Registrarse" }));

    // Assert
    expect(request).toHaveBeenCalledWith("/api/usuarios/register", {
      method: "POST",
      body: {
        nombre_completo: "Ana Perez",
        email: "ana@correo.com",
        password: "secreta123",
      },
    });
    expect(setCurrentUser).toHaveBeenCalledWith(usuario);
    expect(await screen.findByRole("heading", { name: "Inicio" })).toBeInTheDocument();
    // F4: el JWT nunca se persiste en localStorage.
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("muestra el error del backend cuando el correo ya existe", async () => {
    // Arrange
    const user = userEvent.setup();
    request.mockRejectedValue(new Error("El email ya está registrado"));
    renderRegistro();

    // Act
    await completarFormulario(user);
    await user.click(screen.getByRole("button", { name: "Registrarse" }));

    // Assert
    expect(await screen.findByText("El email ya está registrado")).toBeInTheDocument();
    expect(setCurrentUser).not.toHaveBeenCalled();
  });
});
