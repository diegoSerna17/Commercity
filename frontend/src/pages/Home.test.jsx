import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "./Home.jsx";

vi.mock("./Inicio/Inicio", () => ({
  default: () => <h1>Inicio</h1>,
}));

describe("Home", () => {
  it("renderiza la pagina de inicio", () => {
    render(<Home />);

    expect(screen.getByText("Inicio")).toBeInTheDocument();
  });
});
