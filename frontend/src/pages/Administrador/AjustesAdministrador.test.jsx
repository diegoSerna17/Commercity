import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AjustesAdministrador from "./AjustesAdministrador.jsx";
import {
  guardarMiCuentaBancaria,
  obtenerMiCuentaBancaria,
} from "../../services/admin.service.js";

vi.mock("../../services/admin.service.js", () => ({
  obtenerMiCuentaBancaria: vi.fn(),
  guardarMiCuentaBancaria: vi.fn(),
}));

const cuentaApi = (sobreescribir = {}) => ({
  titular_nombre: "Daniel Palacios",
  banco: "bancolombia",
  tipo_cuenta: "ahorros",
  numero_cuenta: "1234567890",
  ...sobreescribir,
});

function renderAjustes() {
  const onClose = vi.fn();
  const resultado = render(<AjustesAdministrador onClose={onClose} />);
  return { ...resultado, onClose };
}

async function esperarCarga() {
  await waitFor(() =>
    expect(screen.getByLabelText("Nombre del titular")).toBeEnabled()
  );
}

async function llenarFormulario(
  usuario,
  {
    titular = "  Daniel Palacios  ",
    banco = "bancolombia",
    tipo = "ahorros",
    numero = "1234567890",
    password = "ClaveAdmin123",
  } = {}
) {
  const campoTitular = screen.getByLabelText("Nombre del titular");
  await usuario.clear(campoTitular);
  await usuario.type(campoTitular, titular);
  await usuario.selectOptions(screen.getByLabelText("Banco"), banco);
  await usuario.selectOptions(screen.getByLabelText("Tipo de cuenta"), tipo);
  const campoNumero = screen.getByLabelText("Número de cuenta");
  await usuario.clear(campoNumero);
  await usuario.type(campoNumero, numero);
  await usuario.type(screen.getByLabelText("Contraseña"), password);
}

describe("AjustesAdministrador", () => {
  beforeEach(() => {
    obtenerMiCuentaBancaria.mockReset();
    guardarMiCuentaBancaria.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra el formulario deshabilitado mientras carga la cuenta", () => {
    // Arrange
    obtenerMiCuentaBancaria.mockReturnValue(new Promise(() => {}));

    // Act
    renderAjustes();

    // Assert
    expect(screen.getByLabelText("Nombre del titular")).toBeDisabled();
    expect(screen.getByLabelText("Banco")).toBeDisabled();
    expect(screen.getByLabelText("Tipo de cuenta")).toBeDisabled();
    expect(screen.getByLabelText("Número de cuenta")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Guardar cuenta bancaria" })
    ).toBeDisabled();
  });

  it("carga la cuenta registrada en el formulario", async () => {
    // Arrange
    obtenerMiCuentaBancaria.mockResolvedValue({
      data: { registrado: true, datos: cuentaApi() },
    });

    // Act
    renderAjustes();
    await esperarCarga();

    // Assert
    expect(screen.getByLabelText("Nombre del titular")).toHaveValue(
      "Daniel Palacios"
    );
    expect(screen.getByLabelText("Banco")).toHaveValue("bancolombia");
    expect(screen.getByLabelText("Tipo de cuenta")).toHaveValue("ahorros");
    expect(screen.getByLabelText("Número de cuenta")).toHaveValue("1234567890");
  });

  it("conserva un banco guardado que no esta en el listado", async () => {
    // Arrange
    obtenerMiCuentaBancaria.mockResolvedValue({
      data: {
        registrado: true,
        datos: cuentaApi({ banco: "banco_antiguo" }),
      },
    });

    // Act
    renderAjustes();
    await esperarCarga();

    // Assert
    expect(screen.getByLabelText("Banco")).toHaveValue("banco_antiguo");
    expect(
      screen.getByRole("option", { name: "banco_antiguo" })
    ).toBeInTheDocument();
  });

  it("deja el formulario vacio cuando no hay cuenta registrada", async () => {
    // Arrange
    obtenerMiCuentaBancaria.mockResolvedValue({
      data: { registrado: false, datos: null },
    });

    // Act
    renderAjustes();
    await esperarCarga();

    // Assert
    expect(screen.getByLabelText("Nombre del titular")).toHaveValue("");
    expect(screen.getByLabelText("Banco")).toHaveValue("");
    expect(screen.getByLabelText("Tipo de cuenta")).toHaveValue("");
    expect(screen.getByLabelText("Número de cuenta")).toHaveValue("");
  });

  it("avisa cuando no puede cargar la cuenta bancaria", async () => {
    // Arrange
    obtenerMiCuentaBancaria.mockRejectedValue(new Error("Cuenta caida"));

    // Act
    renderAjustes();

    // Assert
    expect(await screen.findByText("Cuenta caida")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre del titular")).toBeEnabled();
  });

  it("usa el mensaje por defecto al fallar la carga", async () => {
    // Arrange
    obtenerMiCuentaBancaria.mockRejectedValue({});

    // Act
    renderAjustes();

    // Assert
    expect(
      await screen.findByText("No se pudo cargar la cuenta bancaria.")
    ).toBeInTheDocument();
  });

  it("valida todos los campos antes de guardar", async () => {
    // Arrange
    const usuario = userEvent.setup();
    obtenerMiCuentaBancaria.mockResolvedValue({
      data: { registrado: false, datos: null },
    });
    renderAjustes();
    await esperarCarga();
    const guardar = () =>
      usuario.click(
        screen.getByRole("button", { name: "Guardar cuenta bancaria" })
      );

    // Act
    await guardar();

    // Assert
    expect(
      screen.getByText("El nombre del titular es obligatorio.")
    ).toBeInTheDocument();

    // Act
    await usuario.type(
      screen.getByLabelText("Nombre del titular"),
      "Daniel Palacios"
    );
    await guardar();

    // Assert
    expect(screen.getByText("Selecciona un banco.")).toBeInTheDocument();

    // Act
    await usuario.selectOptions(
      screen.getByLabelText("Banco"),
      "bancolombia"
    );
    await guardar();

    // Assert
    expect(
      screen.getByText("Selecciona el tipo de cuenta.")
    ).toBeInTheDocument();

    // Act
    await usuario.selectOptions(
      screen.getByLabelText("Tipo de cuenta"),
      "ahorros"
    );
    await guardar();

    // Assert
    expect(
      screen.getByText("El número de cuenta es obligatorio.")
    ).toBeInTheDocument();

    // Act
    await usuario.type(screen.getByLabelText("Número de cuenta"), "123");
    await guardar();

    // Assert
    expect(
      screen.getByText("El número de cuenta debe tener entre 6 y 20 dígitos.")
    ).toBeInTheDocument();
    expect(guardarMiCuentaBancaria).not.toHaveBeenCalled();
  });

  it("registra la cuenta y luego la actualiza", async () => {
    // Arrange
    const usuario = userEvent.setup();
    obtenerMiCuentaBancaria.mockResolvedValue({
      data: { registrado: false, datos: null },
    });
    guardarMiCuentaBancaria
      .mockResolvedValueOnce({ message: "Cuenta creada" })
      .mockResolvedValueOnce({});
    renderAjustes();
    await esperarCarga();
    await llenarFormulario(usuario);

    // Act
    await usuario.click(
      screen.getByRole("button", { name: "Guardar cuenta bancaria" })
    );

    // Assert
    await waitFor(() =>
      expect(guardarMiCuentaBancaria).toHaveBeenCalledWith(
        {
          titular_nombre: "Daniel Palacios",
          banco: "bancolombia",
          tipo_cuenta: "ahorros",
          numero_cuenta: "1234567890",
          password: "ClaveAdmin123",
        },
        { actualizar: false }
      )
    );
    expect(await screen.findByText("Cuenta creada")).toBeInTheDocument();
    // 1.5.9: la contraseña de step-up nunca queda en el formulario.
    expect(screen.getByLabelText("Contraseña")).toHaveValue("");

    // Act: la contraseña se vacía tras guardar; se vuelve a escribir para la
    // segunda operación (step-up).
    await usuario.type(screen.getByLabelText("Contraseña"), "ClaveAdmin123");
    await usuario.click(
      screen.getByRole("button", { name: "Guardar cuenta bancaria" })
    );

    // Assert
    await waitFor(() =>
      expect(guardarMiCuentaBancaria).toHaveBeenLastCalledWith(
        expect.objectContaining({ banco: "bancolombia" }),
        { actualizar: true }
      )
    );
    expect(
      await screen.findByText("Cuenta bancaria guardada correctamente.")
    ).toBeInTheDocument();
  });

  it("actualiza la cuenta ya registrada", async () => {
    // Arrange
    const usuario = userEvent.setup();
    obtenerMiCuentaBancaria.mockResolvedValue({
      data: { registrado: true, datos: cuentaApi() },
    });
    guardarMiCuentaBancaria.mockResolvedValue({ message: "Actualizada" });
    renderAjustes();
    await esperarCarga();

    // Act
    await usuario.clear(screen.getByLabelText("Número de cuenta"));
    await usuario.type(screen.getByLabelText("Número de cuenta"), "9876543210");
    await usuario.type(screen.getByLabelText("Contraseña"), "ClaveAdmin123");
    await usuario.click(
      screen.getByRole("button", { name: "Guardar cuenta bancaria" })
    );

    // Assert
    await waitFor(() =>
      expect(guardarMiCuentaBancaria).toHaveBeenCalledWith(
        expect.objectContaining({ numero_cuenta: "9876543210" }),
        { actualizar: true }
      )
    );
  });

  it("muestra el detalle de validacion, el mensaje del error y el mensaje por defecto", async () => {
    // Arrange
    const usuario = userEvent.setup();
    obtenerMiCuentaBancaria.mockResolvedValue({
      data: { registrado: false, datos: null },
    });
    guardarMiCuentaBancaria
      .mockRejectedValueOnce({
        data: { error: { details: [{ mensaje: "Cuenta invalida" }, {}] } },
      })
      .mockRejectedValueOnce(new Error("Fallo del servidor"))
      .mockRejectedValueOnce({});
    renderAjustes();
    await esperarCarga();
    await llenarFormulario(usuario);
    const guardar = () =>
      usuario.click(
        screen.getByRole("button", { name: "Guardar cuenta bancaria" })
      );

    // Act
    await guardar();

    // Assert
    expect(await screen.findByText("Cuenta invalida")).toBeInTheDocument();

    // Act
    await guardar();

    // Assert
    expect(await screen.findByText("Fallo del servidor")).toBeInTheDocument();

    // Act
    await guardar();

    // Assert
    expect(
      await screen.findByText("No se pudo guardar la cuenta bancaria.")
    ).toBeInTheDocument();
  });

  it("guarda con la tecla Enter desde los campos de texto", async () => {
    // Arrange
    const usuario = userEvent.setup();
    obtenerMiCuentaBancaria.mockResolvedValue({
      data: { registrado: false, datos: null },
    });
    guardarMiCuentaBancaria.mockResolvedValue({});
    renderAjustes();
    await esperarCarga();
    await llenarFormulario(usuario);

    // Act
    fireEvent.keyDown(screen.getByLabelText("Número de cuenta"), {
      key: "Enter",
    });

    // Assert
    await waitFor(() => expect(guardarMiCuentaBancaria).toHaveBeenCalledTimes(1));
  });

  it("bloquea el doble envio mientras guarda", async () => {
    // Arrange
    const usuario = userEvent.setup();
    let resolver;
    obtenerMiCuentaBancaria.mockResolvedValue({
      data: { registrado: false, datos: null },
    });
    guardarMiCuentaBancaria.mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve;
      })
    );
    renderAjustes();
    await esperarCarga();
    await llenarFormulario(usuario);

    // Act
    await usuario.click(
      screen.getByRole("button", { name: "Guardar cuenta bancaria" })
    );

    // Assert
    expect(
      screen.getByRole("button", { name: "Guardando..." })
    ).toBeDisabled();

    // Act
    await act(async () => {
      resolver({});
    });

    // Assert
    expect(guardarMiCuentaBancaria).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("button", { name: "Guardar cuenta bancaria" })
    ).toBeEnabled();
  });

  it("oculta el aviso despues de tres segundos", async () => {
    // Arrange
    vi.useFakeTimers();
    obtenerMiCuentaBancaria.mockRejectedValue(new Error("Cuenta caida"));
    renderAjustes();
    await act(async () => {});

    // Act
    const aviso = screen.getByText("Cuenta caida");

    // Assert
    expect(aviso).toHaveStyle({ opacity: "1" });

    // Act
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Assert
    expect(aviso).toHaveStyle({ opacity: "0" });
  });

  it("cierra con el fondo y con el boton de la cabecera", async () => {
    // Arrange
    obtenerMiCuentaBancaria.mockResolvedValue({
      data: { registrado: false, datos: null },
    });
    const { onClose } = renderAjustes();
    await esperarCarga();

    // Act
    fireEvent.mouseDown(screen.getByRole("presentation"));
    fireEvent.click(screen.getAllByRole("button")[0]);

    // Assert
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
