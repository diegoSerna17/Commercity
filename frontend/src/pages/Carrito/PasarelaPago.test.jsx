import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { confirmarPago } from "../../services/pedidos.service.js";
import PasarelaPago from "./PasarelaPago.jsx";

vi.mock("../../services/pedidos.service.js", () => ({
  confirmarPago: vi.fn(),
}));

const totales = { subtotal: 50000, iva: 9500, total: 59500 };

async function completarFormulario(
  user,
  direccion = "Calle 123",
  nombre = "Ana Perez"
) {
  await user.type(
    screen.getByPlaceholderText("0000 0000 0000 0000"),
    "4111 1111 1111 1111"
  );
  await user.type(screen.getByPlaceholderText("NOMBRE APELLIDO"), nombre);
  await user.type(
    screen.getByPlaceholderText("Dirección completa de entrega"),
    direccion
  );
}

describe("PasarelaPago", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    confirmarPago.mockResolvedValue({});
  });

  it("no confirma el pago si la dirección tiene menos de cinco caracteres", async () => {
    const user = userEvent.setup();
    render(
      <PasarelaPago
        totales={totales}
        onCancelar={vi.fn()}
        onPagoExitoso={vi.fn()}
      />
    );

    await completarFormulario(user, "Abc");
    await user.click(screen.getByRole("button", { name: /Total a Pagar/ }));

    expect(
      screen.getByText(
        "Ingresa una dirección de envío válida (mínimo 5 caracteres)",
        { exact: true }
      )
    ).toBeInTheDocument();
    expect(confirmarPago).not.toHaveBeenCalled();
  });

  it("envía los datos normalizados al confirmar el pago", async () => {
    const user = userEvent.setup();
    render(
      <PasarelaPago
        totales={totales}
        onCancelar={vi.fn()}
        onPagoExitoso={vi.fn()}
      />
    );

    await completarFormulario(user, "  Calle 123  ", "  Ana Perez  ");
    await user.click(screen.getByRole("button", { name: /Total a Pagar/ }));

    expect(await screen.findByRole("heading", { name: "¡Pago exitoso!" })).toBeInTheDocument();
    expect(confirmarPago).toHaveBeenCalledWith({
      direccion_envio: "Calle 123",
      metodo_pago: "tarjeta",
      numero_tarjeta: "4111111111111111",
      nombre_tarjeta: "ANA PEREZ",
    });
  });

  it("presenta el error cuando confirmarPago rechaza", async () => {
    const user = userEvent.setup();
    confirmarPago.mockRejectedValueOnce(new Error("Pago rechazado"));
    render(
      <PasarelaPago
        totales={totales}
        onCancelar={vi.fn()}
        onPagoExitoso={vi.fn()}
      />
    );

    await completarFormulario(user);
    await user.click(screen.getByRole("button", { name: /Total a Pagar/ }));

    expect(await screen.findByText("Pago rechazado")).toBeInTheDocument();
  });

  it("muestra el éxito y llama onPagoExitoso al volver al carrito", async () => {
    const user = userEvent.setup();
    const onPagoExitoso = vi.fn();
    render(
      <PasarelaPago
        totales={totales}
        onCancelar={vi.fn()}
        onPagoExitoso={onPagoExitoso}
      />
    );

    await completarFormulario(user);
    await user.click(screen.getByRole("button", { name: /Total a Pagar/ }));

    expect(await screen.findByText("Tu pedido ha sido procesado correctamente.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Volver al carrito" }));

    expect(onPagoExitoso).toHaveBeenCalledTimes(1);
  });
});
