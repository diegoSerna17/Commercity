import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listarCalificacionesVendedor } from "../../services/calificaciones.service.js";
import PerfilCalificaciones from "./PerfilCalificaciones.jsx";

vi.mock("../../services/calificaciones.service.js", () => ({
  listarCalificacionesVendedor: vi.fn(),
}));

function respuesta({
  total = 7,
  promedio = 4.5,
  calificaciones = [],
  pagina = 1,
  totalPaginas = 1,
} = {}) {
  return {
    data: { resumen: { promedio, total }, calificaciones },
    paginacion: { pagina, por_pagina: 5, total, total_paginas: totalPaginas },
  };
}

function calificacion(id, estrellas, comprador, comentario = null) {
  return { id, estrellas, comprador, comentario };
}

describe("PerfilCalificaciones (RF51)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("carga el resumen y las calificaciones del vendedor", async () => {
    // Arrange
    listarCalificacionesVendedor.mockResolvedValue(
      respuesta({
        promedio: 4.6,
        calificaciones: [
          calificacion(1, 5, "Camila", "Excelente"),
          calificacion(2, 4, "Ana"),
        ],
      })
    );

    // Act
    render(<PerfilCalificaciones vendedorId={3} />);

    // Assert
    expect(
      await screen.findByRole("heading", { name: "Calificaciones" })
    ).toBeInTheDocument();
    expect(screen.getByText("4.6")).toBeInTheDocument();
    expect(screen.getByText("(7)")).toBeInTheDocument();
    expect(screen.getByText("Camila")).toBeInTheDocument();
    expect(screen.getByText("Excelente")).toBeInTheDocument();
    expect(screen.getByLabelText("5 de 5 estrellas")).toBeInTheDocument();
    expect(listarCalificacionesVendedor).toHaveBeenCalledWith(3, {
      page: 1,
      limit: 5,
    });
  });

  it("no muestra la seccion cuando no hay calificaciones", async () => {
    // Arrange
    listarCalificacionesVendedor.mockResolvedValue(
      respuesta({ total: 0, promedio: null })
    );

    // Act
    render(<PerfilCalificaciones vendedorId={3} />);

    // Assert
    await waitFor(() => expect(listarCalificacionesVendedor).toHaveBeenCalled());
    expect(
      screen.queryByRole("heading", { name: "Calificaciones" })
    ).not.toBeInTheDocument();
  });

  it("oculta la seccion si la API falla y no bloquea el perfil", async () => {
    // Arrange
    listarCalificacionesVendedor.mockRejectedValue(new Error("caida"));

    // Act
    render(<PerfilCalificaciones vendedorId={3} />);

    // Assert
    await waitFor(() => expect(listarCalificacionesVendedor).toHaveBeenCalled());
    expect(
      screen.queryByRole("heading", { name: "Calificaciones" })
    ).not.toBeInTheDocument();
  });

  it("no consulta la API sin vendedorId", () => {
    // Act
    render(<PerfilCalificaciones />);

    // Assert
    expect(listarCalificacionesVendedor).not.toHaveBeenCalled();
  });

  it("pagina con 'Ver mas' sin perder lo ya mostrado", async () => {
    // Arrange
    const user = userEvent.setup();
    listarCalificacionesVendedor
      .mockResolvedValueOnce(
        respuesta({
          total: 6,
          calificaciones: [calificacion(1, 5, "Camila")],
          totalPaginas: 2,
        })
      )
      .mockResolvedValueOnce(
        respuesta({
          total: 6,
          calificaciones: [calificacion(2, 4, "Ana")],
          pagina: 2,
          totalPaginas: 2,
        })
      );

    render(<PerfilCalificaciones vendedorId={3} />);
    await screen.findByText("Camila");

    // Act
    await user.click(
      screen.getByRole("button", { name: "Ver mas calificaciones" })
    );

    // Assert
    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Camila")).toBeInTheDocument();
    expect(listarCalificacionesVendedor).toHaveBeenLastCalledWith(3, {
      page: 2,
      limit: 5,
    });
    expect(
      screen.queryByRole("button", { name: "Ver mas calificaciones" })
    ).not.toBeInTheDocument();
  });
});
