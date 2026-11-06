import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  clearCurrentUser,
  getCurrentUser,
  setCurrentUser,
} from "../../api/client.js";
import {
  actualizarPerfil,
  cambiarRol,
  cerrarTodasLasSesiones,
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
  cerrarTodasLasSesiones: vi.fn(),
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
    cerrarTodasLasSesiones.mockResolvedValue({ data: {} });
    eliminarCuenta.mockResolvedValue({ data: { id: 7, estado: "inactivo" } });
  });

  afterEach(() => {
    vi.useRealTimers();
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
    expect(actualizarPerfil).toHaveBeenCalledWith(
      { nombre_completo: "Ana Gomez", descripcion_personal: "" },
      null
    );
    expect(
      await screen.findByText("Perfil actualizado correctamente.")
    ).toBeInTheDocument();
    expect(setCurrentUser).toHaveBeenCalledWith(
      expect.objectContaining({ nombre_completo: "Ana Gomez" })
    );
  });

  it("guarda la direccion en el perfil (RF39)", async () => {
    // Arrange
    const user = userEvent.setup();
    renderAjustes();

    // Act
    await user.type(screen.getByLabelText("Direccion"), "Calle 123 #45-67");
    await user.type(screen.getByLabelText("Ciudad"), "Cali");
    await user.type(screen.getByLabelText("Departamento"), "Valle");
    await user.click(screen.getByRole("button", { name: "Cambiar Direccion" }));

    // Assert
    expect(actualizarPerfil).toHaveBeenCalledWith({
      direccion_envio: "Calle 123 #45-67, Cali, Valle",
    });
    expect(
      await screen.findByText("Direccion guardada correctamente.")
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

  it("valida el nombre vacio y la direccion incompleta", async () => {
    // Arrange
    const user = userEvent.setup();
    renderAjustes();

    // Act
    await user.clear(screen.getByLabelText("Nombre de perfil"));
    await user.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    // Assert
    expect(
      screen.getByText("El nombre de perfil no puede estar vacio.")
    ).toBeInTheDocument();
    expect(actualizarPerfil).not.toHaveBeenCalled();

    // Act
    await user.click(screen.getByRole("button", { name: "Cambiar Direccion" }));

    // Assert
    expect(
      screen.getByText("Por favor completa todos los campos de direccion.")
    ).toBeInTheDocument();
  });

  it("muestra el mensaje del error y el mensaje por defecto al guardar el nombre", async () => {
    // Arrange
    const user = userEvent.setup();
    actualizarPerfil
      .mockRejectedValueOnce(new Error("Nombre ocupado"))
      .mockRejectedValueOnce({});
    renderAjustes();
    const campo = screen.getByLabelText("Nombre de perfil");

    // Act
    await user.clear(campo);
    await user.type(campo, "Ana Gomez");
    await user.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    // Assert
    expect(await screen.findByText("Nombre ocupado")).toBeInTheDocument();
    expect(setCurrentUser).not.toHaveBeenCalled();

    // Act
    await user.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    // Assert
    expect(
      await screen.findByText("No se pudo actualizar el perfil.")
    ).toBeInTheDocument();
  });

  it("oculta el aviso despues de tres segundos y medio", async () => {
    // Arrange
    vi.useFakeTimers();
    renderAjustes();
    fireEvent.change(screen.getByLabelText("Nombre de perfil"), {
      target: { value: "   " },
    });

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    // Assert
    expect(
      screen.getByText("El nombre de perfil no puede estar vacio.")
    ).toBeInTheDocument();

    // Act
    await act(async () => {
      vi.advanceTimersByTime(3500);
    });

    // Assert
    expect(
      screen.queryByText("El nombre de perfil no puede estar vacio.")
    ).not.toBeInTheDocument();
  });

  it("confirma el cambio de rol y actualiza la sesion", async () => {
    // Arrange
    const user = userEvent.setup();
    renderAjustes();

    // Act
    await user.click(screen.getByRole("button", { name: "Cambiar a comprador" }));

    // Assert
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole("button", { name: "Si, cambiar rol" }));

    // Assert
    await waitFor(() => expect(cambiarRol).toHaveBeenCalledWith("comprador"));
    expect(setCurrentUser).toHaveBeenCalledWith(
      expect.objectContaining({ roles: ["comprador"] })
    );
    expect(
      await screen.findByText("Rol actualizado correctamente.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cambiar a vendedor" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("muestra el error al cambiar de rol y cierra el modal", async () => {
    // Arrange
    const user = userEvent.setup();
    cambiarRol.mockRejectedValueOnce(new Error("No permitido"));
    renderAjustes();

    // Act
    await user.click(screen.getByRole("button", { name: "Cambiar a comprador" }));
    await user.click(screen.getByRole("button", { name: "Si, cambiar rol" }));

    // Assert
    expect(await screen.findByText("No permitido")).toBeInTheDocument();
    expect(setCurrentUser).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cancela los modales con el boton y con el fondo", () => {
    // Arrange
    renderAjustes();
    const cancelares = () =>
      screen.getAllByRole("button", { name: "Cancelar" });

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Cambiar a comprador" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(cancelares()[0]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar Cuenta" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(cancelares()[0]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Act: clic en el fondo (mousedown sobre el contenedor presentation)
    fireEvent.click(screen.getByRole("button", { name: "Cambiar a comprador" }));
    const backdrop = document.querySelector('[role="presentation"]');
    fireEvent.mouseDown(backdrop);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("muestra el error al eliminar la cuenta", async () => {
    // Arrange
    eliminarCuenta.mockRejectedValueOnce(new Error("No se puede eliminar"));
    renderAjustes();

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Eliminar Cuenta" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Si, eliminar cuenta" })
    );

    // Assert
    expect(await screen.findByText("No se puede eliminar")).toBeInTheDocument();
    expect(clearCurrentUser).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Eliminar Cuenta" })
    ).toBeEnabled();
  });

  it("funciona sin usuario en sesion y aplica el rol por defecto", async () => {
    // Arrange
    const user = userEvent.setup();
    getCurrentUser.mockReturnValue(null);
    cambiarRol.mockResolvedValue({ data: {} });
    renderAjustes();

    // Assert
    expect(screen.getByLabelText("Nombre de perfil")).toHaveValue("");
    expect(screen.getByLabelText("Correo electronico")).toHaveValue("");

    // Act
    await user.type(
      screen.getByLabelText("Nombre de perfil"),
      "Nuevo Nombre"
    );
    await user.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    // Assert
    await waitFor(() =>
      expect(actualizarPerfil).toHaveBeenCalledWith(
        { nombre_completo: "Nuevo Nombre", descripcion_personal: "" },
        null
      )
    );
    expect(
      await screen.findByText("Perfil actualizado correctamente.")
    ).toBeInTheDocument();
    expect(setCurrentUser).not.toHaveBeenCalled();

    // Act
    await user.click(screen.getByRole("button", { name: "Cambiar a vendedor" }));
    await user.click(screen.getByRole("button", { name: "Si, cambiar rol" }));

    // Assert
    await waitFor(() => expect(cambiarRol).toHaveBeenCalledWith("vendedor"));
    expect(
      await screen.findByText("Rol actualizado correctamente.")
    ).toBeInTheDocument();
    expect(setCurrentUser).not.toHaveBeenCalled();
  });

  it("sube foto y descripcion del perfil (RF14-RF17)", async () => {
    // Arrange
    const user = userEvent.setup();
    actualizarPerfil.mockResolvedValueOnce({
      data: {
        nombre_completo: "Ana Perez",
        descripcion_personal: "Vendo cafe",
        foto_perfil: "/uploads/avatar.png",
      },
    });
    renderAjustes();

    // Act
    await user.type(screen.getByLabelText("Descripcion"), "Vendo cafe");
    const archivo = new File([new Uint8Array([1, 2, 3])], "foto.png", {
      type: "image/png",
    });
    await user.upload(screen.getByLabelText("Foto de perfil"), archivo);
    await user.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    // Assert
    await waitFor(() => expect(actualizarPerfil).toHaveBeenCalled());
    const [datos, foto] = actualizarPerfil.mock.calls[0];
    expect(datos).toEqual({
      nombre_completo: "Ana Perez",
      descripcion_personal: "Vendo cafe",
    });
    expect(foto).toBe(archivo);
    expect(setCurrentUser).toHaveBeenCalledWith(
      expect.objectContaining({ descripcion_personal: "Vendo cafe" })
    );
  });

  it("cierra todas las sesiones tras confirmar (M-8)", async () => {
    // Arrange
    const user = userEvent.setup();
    renderAjustes();

    // Act
    await user.click(
      screen.getByRole("button", { name: "Cerrar sesion en todos los dispositivos" })
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Si, cerrar sesiones" }));

    // Assert
    await waitFor(() => expect(cerrarTodasLasSesiones).toHaveBeenCalledTimes(1));
    expect(clearCurrentUser).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("heading", { name: "Inicio de sesion" })
    ).toBeInTheDocument();
  });

  it("muestra el error al cerrar todas las sesiones", async () => {
    // Arrange
    const user = userEvent.setup();
    cerrarTodasLasSesiones.mockRejectedValueOnce(new Error("No se pudo"));
    renderAjustes();

    // Act
    await user.click(
      screen.getByRole("button", { name: "Cerrar sesion en todos los dispositivos" })
    );
    await user.click(screen.getByRole("button", { name: "Si, cerrar sesiones" }));

    // Assert
    expect(await screen.findByText("No se pudo")).toBeInTheDocument();
    expect(clearCurrentUser).not.toHaveBeenCalled();
  });
});
