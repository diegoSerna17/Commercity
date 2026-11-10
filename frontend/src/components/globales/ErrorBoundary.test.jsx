import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorBoundary from "./ErrorBoundary.jsx";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ErrorBoundary", () => {
  it("muestra el fallback y permite reintentar sin dejar la pantalla en blanco", async () => {
    // React y componentDidCatch escriben en console.error: se silencia para
    // no ensuciar la salida de la prueba.
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    let debeFallar = true;

    function HijoInestable() {
      if (debeFallar) {
        throw new Error("chunk caido");
      }
      return <p>Contenido recuperado</p>;
    }

    render(
      <ErrorBoundary>
        <HijoInestable />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Algo salió mal" }),
    ).toBeInTheDocument();

    // El hijo deja de fallar y el boton vuelve a montar el arbol.
    debeFallar = false;
    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Contenido recuperado")).toBeInTheDocument();
  });

  it("renderiza los hijos cuando no hay error", () => {
    render(
      <ErrorBoundary>
        <p>Todo bien</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Todo bien")).toBeInTheDocument();
  });
});
