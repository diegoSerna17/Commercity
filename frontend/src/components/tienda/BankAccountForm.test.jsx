import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  guardarMiCuentaBancaria,
  obtenerMiCuentaBancaria,
} from "../../services/tienda.service.js";
import BankAccountForm from "./BankAccountForm.jsx";

vi.mock("../../services/tienda.service.js", () => ({
  obtenerMiCuentaBancaria: vi.fn(),
  guardarMiCuentaBancaria: vi.fn(),
}));

const CUENTA = {
  titular_nombre: "Ana Perez",
  banco: "bancolombia",
  tipo_cuenta: "ahorros",
  numero_cuenta: "****1234",
};

function renderFormulario(onGuardado = vi.fn()) {
  render(<BankAccountForm onGuardado={onGuardado} />);
  return { onGuardado };
}

async function llenarFormulario(user) {
  await user.type(screen.getByLabelText("Nombre del titular"), "Ana Perez");
  await user.selectOptions(screen.getByLabelText("Banco"), "bancolombia");
  await user.selectOptions(screen.getByLabelText("Tipo de cuenta"), "ahorros");
  await user.type(screen.getByLabelText("Número de cuenta"), "1234567890");
  await user.type(screen.getByLabelText("Contraseña"), "ClaveVendedor123");
}

describe("BankAccountForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    obtenerMiCuentaBancaria.mockResolvedValue({ data: { datos: CUENTA } });
    guardarMiCuentaBancaria.mockResolvedValue({ success: true });
  });

  it("carga la cuenta del vendedor y muestra el numero enmascarado", async () => {
    // Act
    renderFormulario();

    // Assert
    expect(await screen.findByDisplayValue("Ana Perez")).toBeInTheDocument();
    expect(screen.getByDisplayValue("****1234")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bancolombia")).toBeInTheDocument();
  });

  it("muestra el aviso cuando no puede cargar la cuenta", async () => {
    // Arrange
    obtenerMiCuentaBancaria.mockRejectedValue(new Error("Sin conexion"));

    // Act
    renderFormulario();

    // Assert
    expect(await screen.findByText("Sin conexion")).toBeInTheDocument();
  });

  it("valida el titular por campo al salir", async () => {
    // Arrange
    const user = userEvent.setup();
    renderFormulario();
    const titular = screen.getByLabelText("Nombre del titular");
    await waitFor(() => expect(titular).toHaveValue("Ana Perez"));
    await user.clear(titular);

    // Act / Assert
    fireEvent.blur(titular);
    expect(screen.getByText("El nombre del titular es obligatorio.")).toBeInTheDocument();

    await user.type(titular, "Ab");
    fireEvent.blur(titular);
    expect(screen.getByText("El nombre debe tener al menos 3 caracteres.")).toBeInTheDocument();

    await user.clear(titular);
    await user.type(titular, "Ana");
    fireEvent.blur(titular);
    expect(screen.getByText("Ingresa nombre y apellido.")).toBeInTheDocument();

    await user.clear(titular);
    await user.type(titular, "Ana 123");
    fireEvent.blur(titular);
    expect(
      screen.getByText("El nombre solo puede contener letras y espacios.")
    ).toBeInTheDocument();
  });

  it("revalida el campo cuando ya tenia error", async () => {
    // Arrange
    const user = userEvent.setup();
    renderFormulario();
    const titular = screen.getByLabelText("Nombre del titular");
    await waitFor(() => expect(titular).toHaveValue("Ana Perez"));
    await user.clear(titular);
    fireEvent.blur(titular);
    expect(screen.getByText("El nombre del titular es obligatorio.")).toBeInTheDocument();

    // Act
    await user.type(titular, "Ana Maria");

    // Assert
    await waitFor(() =>
      expect(
        screen.queryByText("El nombre del titular es obligatorio.")
      ).not.toBeInTheDocument()
    );
  });

  it("valida banco, tipo de cuenta y numero de cuenta", async () => {
    // Arrange
    obtenerMiCuentaBancaria.mockResolvedValue({ data: { datos: null } });
    renderFormulario();
    await screen.findByLabelText("Banco");

    // Act / Assert
    fireEvent.blur(screen.getByLabelText("Banco"));
    expect(screen.getByText("Selecciona un banco.")).toBeInTheDocument();

    fireEvent.blur(screen.getByLabelText("Tipo de cuenta"));
    expect(screen.getByText("Selecciona el tipo de cuenta.")).toBeInTheDocument();

    const numero = screen.getByLabelText("Número de cuenta");
    fireEvent.blur(numero);
    expect(screen.getByText("El número de cuenta es obligatorio.")).toBeInTheDocument();

    fireEvent.change(numero, { target: { value: "12ab34" } });
    expect(numero).toHaveValue("1234");
    fireEvent.blur(numero);
    expect(
      screen.getByText("El número de cuenta debe tener entre 6 y 20 dígitos.")
    ).toBeInTheDocument();

    fireEvent.change(numero, { target: { value: "1".repeat(21) } });
    fireEvent.blur(numero);
    expect(
      screen.getByText("El número de cuenta debe tener entre 6 y 20 dígitos.")
    ).toBeInTheDocument();
  });

  it("envia la cuenta valida y avisa al padre", async () => {
    // Arrange
    const user = userEvent.setup();
    obtenerMiCuentaBancaria.mockResolvedValue({ data: { datos: null } });
    const { onGuardado } = renderFormulario();
    await screen.findByLabelText("Banco");

    // Act
    await llenarFormulario(user);
    await user.click(screen.getByRole("button", { name: "Guardar cuenta bancaria" }));

    // Assert
    await waitFor(() =>
      expect(guardarMiCuentaBancaria).toHaveBeenCalledWith({
        titular_nombre: "Ana Perez",
        banco: "bancolombia",
        tipo_cuenta: "ahorros",
        numero_cuenta: "1234567890",
        password: "ClaveVendedor123",
      })
    );
    expect(
      await screen.findByText("Cuenta bancaria guardada correctamente.")
    ).toBeInTheDocument();
    expect(onGuardado).toHaveBeenCalledTimes(1);
  });

  it("no envia el formulario si algun campo es invalido", async () => {
    // Arrange
    const user = userEvent.setup();
    obtenerMiCuentaBancaria.mockResolvedValue({ data: { datos: null } });
    renderFormulario();
    await screen.findByLabelText("Banco");

    // Act
    await user.click(screen.getByRole("button", { name: "Guardar cuenta bancaria" }));

    // Assert
    expect(guardarMiCuentaBancaria).not.toHaveBeenCalled();
    expect(screen.getByText("Revisa los campos marcados en rojo.")).toBeInTheDocument();
  });

  it("muestra el error del backend al guardar", async () => {
    // Arrange
    const user = userEvent.setup();
    obtenerMiCuentaBancaria.mockResolvedValue({ data: { datos: null } });
    guardarMiCuentaBancaria.mockRejectedValue(new Error("Cuenta invalida"));
    renderFormulario();
    await screen.findByLabelText("Banco");

    // Act
    await llenarFormulario(user);
    await user.click(screen.getByRole("button", { name: "Guardar cuenta bancaria" }));

    // Assert
    expect(await screen.findByText("Cuenta invalida")).toBeInTheDocument();
  });
});
