import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { getCurrentUser } from "../../api/client.js";
import {
  listarIngresos,
  obtenerEstadisticasTienda,
  validarMiTienda,
} from "../../services/tienda.service.js";
import Tienda from "./Tienda.jsx";

vi.mock("../../components/tienda/StatsSection", () => ({
  default: () => <div data-testid="stats-section" />,
}));

vi.mock("../../components/tienda/BankAccountForm", () => ({
  default: () => <div data-testid="bank-account-form" />,
}));

vi.mock("../../api/client.js", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("../../services/tienda.service.js", () => ({
  listarIngresos: vi.fn(),
  obtenerEstadisticasTienda: vi.fn(),
  validarMiTienda: vi.fn(),
}));

const VENDEDOR = { id: 7, nombre_completo: "Ana Perez", roles: ["vendedor"] };

function renderTienda() {
  return render(
    <MemoryRouter initialEntries={["/store"]}>
      <Tienda />
    </MemoryRouter>
  );
}

describe("Tienda", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    obtenerEstadisticasTienda.mockResolvedValue({ data: { tarjetas: null } });
    listarIngresos.mockResolvedValue({ data: { resumen: null, items: [] } });
    validarMiTienda.mockResolvedValue({
      data: {
        cuenta_bancaria: {
          completa: true,
          banco: "Bancolombia",
          tipo_cuenta: "ahorros",
          numero_enmascarado: "****1234",
        },
        flujo_90_10: {
          validado: true,
          lineas_analizadas: 2,
          lineas_incoherentes: 0,
          totales: { vendedor_90_esperado: 90000 },
        },
      },
    });
  });

  it("muestra el aviso para compradores y no consulta la API", () => {
    // Arrange
    getCurrentUser.mockReturnValue({ id: 7, roles: ["comprador"] });

    // Act
    renderTienda();

    // Assert
    expect(
      screen.getByText(/Esta sección es para vendedores/)
    ).toBeInTheDocument();
    expect(obtenerEstadisticasTienda).not.toHaveBeenCalled();
    expect(validarMiTienda).not.toHaveBeenCalled();
  });

  it("carga estadisticas, ingresos y validacion del vendedor (RF121/RF130-RF139)", async () => {
    // Arrange
    getCurrentUser.mockReturnValue(VENDEDOR);

    // Act
    renderTienda();

    // Assert
    expect(await screen.findByText("Validación de Mi Tienda")).toBeInTheDocument();
    expect(listarIngresos).toHaveBeenCalledWith({ porPagina: 5 });
    expect(screen.getByText("Cuenta bancaria completa")).toBeInTheDocument();
    expect(screen.getByText("Reparto 90/10 consistente")).toBeInTheDocument();
    expect(screen.getByTestId("bank-account-form")).toBeInTheDocument();
  });

  it("muestra el error cuando falla la carga de la tienda", async () => {
    // Arrange
    getCurrentUser.mockReturnValue(VENDEDOR);
    obtenerEstadisticasTienda.mockRejectedValue(new Error("Servicio no disponible"));

    // Act
    renderTienda();

    // Assert
    expect(await screen.findByText("Servicio no disponible")).toBeInTheDocument();
  });
});
