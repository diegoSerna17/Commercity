import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatsSection from "./StatsSection.jsx";

const TARJETAS = {
  total_ventas: 12,
  total_neto_vendedor: 2500000,
  unidades_vendidas: 30,
  total_comision: 250000,
};

describe("StatsSection", () => {
  it("muestra ceros cuando tarjetas es nulo", () => {
    render(<StatsSection tarjetas={null} ingresos={null} />);

    expect(screen.getByText("Ventas Totales")).toBeInTheDocument();
    expect(screen.getAllByText("0")).toHaveLength(2);
    expect(screen.getAllByText("$0")).toHaveLength(3);
  });

  it("formatea los valores monetarios y las unidades", () => {
    render(<StatsSection tarjetas={TARJETAS} ingresos={null} />);

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("$250.000")).toBeInTheDocument();
    // Sin ingresos, el neto de la ultima tarjeta cae al de las tarjetas.
    expect(screen.getAllByText("$2.500.000")).toHaveLength(2);
  });

  it("lista los ultimos ingresos con fecha y montos", () => {
    render(
      <StatsSection
        tarjetas={TARJETAS}
        ingresos={{
          items: [
            {
              id: 1,
              nombre_producto: "Teclado",
              fecha_pedido: "2026-10-12T10:00:00.000Z",
              referencia_pedido: "REF-1",
              estado_envio: "Entregado",
              monto_vendedor: 90000,
              valor_subtotal: 100000,
            },
          ],
        }}
      />
    );

    expect(screen.getByText("Últimos ingresos")).toBeInTheDocument();
    expect(screen.getByText("Teclado")).toBeInTheDocument();
    expect(screen.getByText(/REF-1 · Entregado/)).toBeInTheDocument();
    expect(screen.getByText("$90.000")).toBeInTheDocument();
    expect(screen.getByText("de $100.000")).toBeInTheDocument();
  });

  it("omite la fecha cuando el valor no es una fecha valida", () => {
    render(
      <StatsSection
        tarjetas={null}
        ingresos={{
          items: [
            {
              id: 2,
              nombre_producto: "Mouse",
              fecha_pedido: "no-es-fecha",
              referencia_pedido: "REF-2",
              estado_envio: "Pendiente",
              monto_vendedor: 10000,
              valor_subtotal: 20000,
            },
          ],
        }}
      />
    );

    expect(screen.getByText(/· REF-2 · Pendiente/)).toBeInTheDocument();
  });

  it("muestra el resumen y la consistencia del flujo 90/10", () => {
    render(
      <StatsSection
        tarjetas={TARJETAS}
        ingresos={{
          items: [],
          resumen: {
            total_transacciones: 3,
            total_bruto: 300000,
            total_comision_plataforma: 30000,
            total_neto_vendedor: 270000,
            consistencia_90_10_validada: true,
          },
        }}
      />
    );

    expect(screen.getByText(/Transacciones registradas: 3/)).toBeInTheDocument();
    expect(screen.getByText(/flujo 90\/10 consistente/)).toBeInTheDocument();
    expect(screen.getByText("$270.000")).toBeInTheDocument();
  });

  it("avisa cuando el flujo 90/10 no es consistente", () => {
    render(
      <StatsSection
        tarjetas={null}
        ingresos={{
          items: [],
          resumen: {
            total_transacciones: 1,
            total_bruto: 100000,
            total_comision_plataforma: 10000,
            total_neto_vendedor: 80000,
            consistencia_90_10_validada: false,
          },
        }}
      />
    );

    expect(screen.getByText(/revisar consistencia 90\/10/)).toBeInTheDocument();
  });
});
