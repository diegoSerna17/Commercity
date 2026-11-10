import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import NoEncontrado from "./NoEncontrado.jsx";

describe("NoEncontrado", () => {
  it("muestra el mensaje 404 y un enlace para volver al inicio", () => {
    render(
      <MemoryRouter>
        <NoEncontrado />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Página no encontrada" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Volver al inicio" }),
    ).toHaveAttribute("href", "/");
  });
});
