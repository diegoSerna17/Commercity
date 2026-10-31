import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import WelcomeBanner from "./WelcomeBanner.jsx";

describe("WelcomeBanner", () => {
  it("saluda con el primer nombre del vendedor", () => {
    render(<WelcomeBanner primerNombre="Ana" />);

    expect(screen.getByText("Bienvenido de nuevo, Ana 👋")).toBeInTheDocument();
  });
});
