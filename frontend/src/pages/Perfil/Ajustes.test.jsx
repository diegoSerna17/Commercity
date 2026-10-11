import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  clearCurrentUser,
  getCurrentUser,
  setCurrentUser,
} from "../../api/client.js";
import {
  actualizarPerfil,
  cambiarRol,
  eliminarCuenta,
} from "../../services/usuarios.service.js";
import Ajustes from "./Ajustes.jsx";

vi.mock("../../components/globales/Header", () => ({
  default: () => <header>Header</header>,
}));

vi.mock("../../api/client.js", () => ({
  clearCurrentUser: vi.fn(),
  getCurrentUser: vi.fn(),
  setCurrentUser: vi.fn(),
}));

vi.mock("../../services/usuarios.service.js", () => ({
  actualizarPerfil: vi.fn(),
  cambiarRol: vi.fn(),
  eliminarCuenta: vi.fn(),
}));

function renderAjustes() {
  return render(
    <MemoryRouter initialEntries={["/settings"]}>
      <Routes>
        <Route path="/settings" element={<Ajustes />} />
        <Route path="/login" element={<h1>Inicio de sesion</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Ajustes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    getCurrentUser.mockReturnValue({
      id: 7,
      nombre_completo: "Ana Perez",
      email: "ana@correo.com",
      roles: ["vendedor"],
    });
    actualizarPerfil.mockResolvedValue({
      data: { nombre_completo: "Ana Gomez" },
    });
    cambiarRol.mockResolvedValue({ data: { roles: ["comprador"] } });
    eliminarCuenta.mockResolvedValue({ data: { id: 7, estado: "inactivo" } });
  });

  it("guarda el nombre contra la API y actualiza la sesion", async () => {
    // Arrange
    const user = userEvent.setup();
    renderAjustes();
    const campo = screen.getByLabelText("Nombre de perfil");

    // Act
    await user.clear(campo);
    await user.type(campo, "Ana Gomez");
    await user.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    // Assert
    expect(actualizarPerfil).toHaveBeenCalledWith("Ana Gomez");
    expect(await screen.findByText("Nombre actualizado correctamente.")).toBeInTheDocument();
    expect(setCurrentUser).toHaveBeenCalledWith(
      expect.objectContaining({ nombre_completo: "Ana Gomez" })
    );
  });

  it("no simula exito al guardar la direccion (el backend aun no la persiste)", async () => {
    // Arrange
    const user = userEvent.setup();
    renderAjustes();

    // Act
    await user.type(screen.getByLabelText("Direccion"), "Calle 123 #45-67");
    await user.type(screen.getByLabelText("Ciudad"), "Cali");
    await user.type(screen.getByLabelText("Departamento"), "Valle");
    await user.click(screen.getByRole("button", { name: "Cambiar Direccion" }));

    // Assert
    expect(
      screen.queryByText("Direccion actualizada correctamente.")
    ).not.toBeInTheDocument();
    expect(
      await screen.findByText(/aun no se guarda en tu cuenta/)
    ).toBeInTheDocument();
  });

  it("aplica y persiste el tema elegido", async () => {
    // Arrange
    const user = userEvent.setup();
    renderAjustes();

    // Act
    await user.click(screen.getByRole("button", { name: /Oscuro/ }));

    // Assert
    expect(localStorage.getItem("commercity-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("elimina la cuenta, limpia la sesion y navega al login", async () => {
    // Arrange
    const user = userEvent.setup();
    renderAjustes();

    // Act
    await user.click(screen.getByRole("button", { name: "Eliminar Cuenta" }));
    await user.click(screen.getByRole("button", { name: "Si, eliminar cuenta" }));

    // Assert
    expect(eliminarCuenta).toHaveBeenCalledTimes(1);
    expect(clearCurrentUser).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("heading", { name: "Inicio de sesion" })
    ).toBeInTheDocument();
  });
});
