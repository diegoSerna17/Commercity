import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  BadgeComision,
  BadgeEstadoReporte,
  BadgeEstadoUsuario,
  BadgeTipo,
} from "./AdminBadges.jsx";

describe("AdminBadges", () => {
  it("BadgeEstadoUsuario muestra Activo o Baneado", () => {
    const { rerender } = render(<BadgeEstadoUsuario estado="activo" />);
    expect(screen.getByText("Activo")).toBeInTheDocument();

    rerender(<BadgeEstadoUsuario estado="baneado" />);
    expect(screen.getByText("Baneado")).toBeInTheDocument();
  });

  it("BadgeEstadoReporte muestra Resuelto o Pendiente", () => {
    const { rerender } = render(<BadgeEstadoReporte estado="resuelto" />);
    expect(screen.getByText("Resuelto")).toBeInTheDocument();

    rerender(<BadgeEstadoReporte estado="pendiente" />);
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("BadgeTipo muestra Usuario o Producto", () => {
    const { rerender } = render(<BadgeTipo tipo="usuario" />);
    expect(screen.getByText("Usuario")).toBeInTheDocument();

    rerender(<BadgeTipo tipo="producto" />);
    expect(screen.getByText("Producto")).toBeInTheDocument();
  });

  it("BadgeComision usa 10 % por defecto y acepta otro porcentaje", () => {
    const { rerender } = render(<BadgeComision />);
    expect(screen.getByText("Comision %10")).toBeInTheDocument();

    rerender(<BadgeComision porcentaje="15" />);
    expect(screen.getByText("Comision %15")).toBeInTheDocument();
  });
});
