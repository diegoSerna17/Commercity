import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { perfilVendedorSocial } from "../../data/perfilVendedorSocial.js";
import { dejarDeSeguir, seguirUsuario } from "../../services/seguidores.service.js";
import SeguidoresModal from "./SeguidoresModal.jsx";

vi.mock("../../services/seguidores.service.js", () => ({
  seguirUsuario: vi.fn(),
  dejarDeSeguir: vi.fn(),
}));

function renderModal(props = {}) {
  const onClose = vi.fn();
  const onChanged = vi.fn();
  const resultado = render(
    <SeguidoresModal
      datos={perfilVendedorSocial}
      onClose={onClose}
      onChanged={onChanged}
      {...props}
    />
  );
  return { onClose, onChanged, ...resultado };
}

describe("SeguidoresModal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    seguirUsuario.mockResolvedValue({ success: true });
    dejarDeSeguir.mockResolvedValue({ success: true });
  });

  it("abre en la pestana de seguidores y muestra sus datos", () => {
    renderModal();

    expect(screen.getByRole("dialog", { name: /Juan_giraldo/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Seguidores 11/ })).toBeInTheDocument();
    expect(screen.getByText("Camila Torres")).toBeInTheDocument();
  });

  it("respeta initialTab y cambia de pestana", async () => {
    // Arrange
    const user = userEvent.setup();
    renderModal({ initialTab: "siguiendo" });
    expect(screen.getByText("Andres Bedoya")).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole("button", { name: /Seguidores 11/ }));

    // Assert
    expect(screen.getByText("Camila Torres")).toBeInTheDocument();
  });

  it("cierra con Escape, con el boton y con el fondo", () => {
    // Arrange
    const { onClose } = renderModal();

    // Act
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("presentation"));

    // Assert
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("filtra por nombre o usuario y avisa cuando no hay resultados", async () => {
    // Arrange
    const user = userEvent.setup();
    renderModal();
    const buscador = screen.getByPlaceholderText("Buscar...");

    // Act
    await user.type(buscador, "camila");

    // Assert
    expect(screen.getByText("Camila Torres")).toBeInTheDocument();
    expect(screen.queryByText("Sebastian Ruiz")).not.toBeInTheDocument();

    // Act
    await user.clear(buscador);
    await user.type(buscador, "zzz");

    // Assert
    expect(screen.getByText("Sin resultados para tu busqueda")).toBeInTheDocument();
  });

  it("muestra el estado vacio de cada pestana", async () => {
    // Arrange
    const user = userEvent.setup();
    renderModal({ datos: { usuario: "Ana", seguidores: [], siguiendo: [] } });

    // Assert
    expect(screen.getByText("Aun no tienes seguidores")).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole("button", { name: /Siguiendo 0/ }));

    // Assert
    expect(screen.getByText("Aun no sigues a ningun usuario")).toBeInTheDocument();
  });

  it("sigue a un usuario desde la pestana de seguidores", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onChanged } = renderModal();

    // Act
    await user.click(screen.getAllByRole("button", { name: "Seguir" })[0]);

    // Assert
    await waitFor(() => expect(seguirUsuario).toHaveBeenCalledWith(1));
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button", { name: "Dejar de seguir" }).length).toBeGreaterThan(0);
  });

  it("deja de seguir desde la pestana siguiendo", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onChanged } = renderModal({ initialTab: "siguiendo" });

    // Act
    await user.click(screen.getAllByRole("button", { name: "Dejar de seguir" })[0]);

    // Assert
    await waitFor(() => expect(dejarDeSeguir).toHaveBeenCalledWith(1));
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button", { name: "Seguir" }).length).toBeGreaterThan(0);
  });

  it("trata el 409 de seguir como ya seguido y el 404 de dejar como ya no seguido", async () => {
    // Arrange
    const user = userEvent.setup();
    seguirUsuario.mockRejectedValue(Object.assign(new Error("Ya lo sigues"), { status: 409 }));
    dejarDeSeguir.mockRejectedValue(
      Object.assign(new Error("Ya no lo sigues"), { status: 404 })
    );
    const { onChanged } = renderModal();

    // Act
    await user.click(screen.getAllByRole("button", { name: "Seguir" })[0]);

    // Assert
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(screen.queryByText("Ya lo sigues")).not.toBeInTheDocument();
  });

  it("muestra el error de la API y no avisa el cambio", async () => {
    // Arrange
    const user = userEvent.setup();
    seguirUsuario.mockRejectedValue(new Error("Servicio caido"));
    const { onChanged } = renderModal();

    // Act
    await user.click(screen.getAllByRole("button", { name: "Seguir" })[0]);

    // Assert
    expect(await screen.findByText("Servicio caido")).toBeInTheDocument();
    expect(onChanged).not.toHaveBeenCalled();
  });
});
