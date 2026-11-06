import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar, EstadoBadge } from "./historialComponentes.jsx";

describe("EstadoBadge", () => {
  it.each([
    ["Entregado", "bg-primary-fixed-dim/10"],
    ["En Camino", "bg-secondary-fixed-dim/10"],
    ["Pendiente", "bg-error-container/20"],
    ["Cancelado", "bg-surface-container/40"],
  ])("renderiza el estado %s con su color", (estado, clase) => {
    render(<EstadoBadge estado={estado} />);

    expect(screen.getByText(estado)).toHaveClass(clase);
  });

  it("usa el estilo neutro para un estado desconocido", () => {
    render(<EstadoBadge estado="Devuelto" />);

    expect(screen.getByText("Devuelto")).toHaveClass("bg-surface-container/30");
  });

  it("agrega borde cuando withBorder es verdadero", () => {
    render(<EstadoBadge estado="Entregado" withBorder />);

    expect(screen.getByText("Entregado")).toHaveClass("border");
  });

  it("no agrega borde por defecto", () => {
    render(<EstadoBadge estado="Pendiente" />);

    expect(screen.getByText("Pendiente")).not.toHaveClass("border");
  });
});

describe("Avatar", () => {
  it("muestra las iniciales con el color de texto del pedido", () => {
    render(
      <Avatar order={{ initials: "AP", initialsTextClass: "text-primary-fixed-dim" }} />
    );

    const avatar = screen.getByText("AP");
    expect(avatar).toHaveClass("rounded-full");
    expect(avatar).toHaveClass("text-primary-fixed-dim");
  });
});
