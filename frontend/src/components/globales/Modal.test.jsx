import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Modal from "./Modal.jsx";

function Harness() {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}>
        Abrir
      </button>
      <Modal abierto={abierto} onClose={() => setAbierto(false)} tituloId="modal-titulo">
        <h2 id="modal-titulo">Titulo</h2>
        <button type="button">Primero</button>
        <button type="button">Segundo</button>
      </Modal>
    </>
  );
}

describe("Modal", () => {
  it("expone role dialog, aria-modal y aria-labelledby", async () => {
    const usuario = userEvent.setup();
    render(<Harness />);
    await usuario.click(screen.getByRole("button", { name: "Abrir" }));

    const dialogo = screen.getByRole("dialog");
    expect(dialogo).toHaveAttribute("aria-modal", "true");
    expect(dialogo).toHaveAttribute("aria-labelledby", "modal-titulo");
    expect(screen.getByRole("heading", { name: "Titulo" })).toBeInTheDocument();
  });

  it("cierra con Escape y devuelve el foco al boton que lo abrio", async () => {
    const usuario = userEvent.setup();
    render(<Harness />);
    const abrir = screen.getByRole("button", { name: "Abrir" });
    await usuario.click(abrir);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await usuario.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it("atrapa el foco dentro del panel al tabular", async () => {
    const usuario = userEvent.setup();
    render(<Harness />);
    await usuario.click(screen.getByRole("button", { name: "Abrir" }));

    expect(screen.getByRole("button", { name: "Primero" })).toHaveFocus();
    await usuario.tab();
    expect(screen.getByRole("button", { name: "Segundo" })).toHaveFocus();
    await usuario.tab();
    expect(screen.getByRole("button", { name: "Primero" })).toHaveFocus();
  });

  it("no renderiza nada cuando esta cerrado", () => {
    render(
      <Modal abierto={false} onClose={vi.fn()} etiqueta="Cerrado">
        <p>Contenido</p>
      </Modal>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
