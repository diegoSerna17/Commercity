import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TopBar from "./TopBar.jsx";

vi.mock("../globales/Header", () => ({
  default: ({ title, showSearch }) => (
    <p>
      {title} - buscador: {String(showSearch)}
    </p>
  ),
}));

describe("TopBar", () => {
  it("renderiza el Header de la tienda sin buscador", () => {
    render(<TopBar />);

    expect(screen.getByText("Tienda - buscador: false")).toBeInTheDocument();
  });
});
