import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listarCategorias } from "../../services/productos.service.js";
import AgregarProducto from "./AgregarProducto.jsx";

vi.mock("../../services/productos.service.js", () => ({
  listarCategorias: vi.fn(),
}));

const PRODUCTO = {
  nombre: "Teclado viejo",
  descripcion: "Descripcion vieja",
  precio: 150000,
  stock: 3,
  descuento_porcentaje: 10,
  categoria_nombre: "Tecnologia",
};

function renderFormulario(props = {}) {
  const onCancel = vi.fn();
  const onSubmit = vi.fn().mockResolvedValue({ data: { mensaje: "Guardado" } });
  const resultado = render(
    <AgregarProducto onCancel={onCancel} onSubmit={onSubmit} {...props} />
  );
  return { onCancel, onSubmit, ...resultado };
}

async function llenarFormulario(user) {
  const categoria = screen.getByLabelText("Categoria");
  await waitFor(() => expect(categoria).not.toBeDisabled());

  await user.type(screen.getByLabelText("Nombre del producto"), "Teclado");
  await user.type(screen.getByLabelText("Descripcion completa"), "Mecanico");
  await user.type(screen.getByLabelText("Precio $"), "150000");
  await user.type(screen.getByLabelText("Stock"), "5");
  await user.selectOptions(categoria, "Tecnologia");

  const imagen = new File(["foto"], "foto.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Imagen"), { target: { files: [imagen] } });

  return imagen;
}

describe("AgregarProducto", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    listarCategorias.mockResolvedValue({
      data: [
        { id: 1, nombre: "Tecnologia" },
        { id: 2, nombre: "Ropa" },
      ],
    });
  });

  it("carga las categorias reales en el selector", async () => {
    // Act
    renderFormulario();

    // Assert
    expect(await screen.findByRole("option", { name: "Tecnologia" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Ropa" })).toBeInTheDocument();
  });

  it("formatea el precio mientras se escribe y descarta las letras", async () => {
    // Arrange
    const user = userEvent.setup();
    renderFormulario();
    const precio = screen.getByLabelText("Precio $");

    // Act
    await user.type(precio, "1500000");

    // Assert
    expect(precio).toHaveValue("1.500.000");

    // Act
    await user.clear(precio);
    await user.type(precio, "abc");

    // Assert
    expect(precio).toHaveValue("");
  });

  it("rechaza un archivo que no es imagen y acepta uno de imagen", async () => {
    // Arrange
    renderFormulario();
    const input = screen.getByLabelText("Imagen");

    // Act
    fireEvent.change(input, {
      target: { files: [new File(["x"], "doc.pdf", { type: "application/pdf" })] },
    });

    // Assert
    // Comportamiento real: al rechazar el archivo se limpia imagenArchivo, por
    // lo que el mensaje visible es "Selecciona una imagen" (ver ledger).
    expect(screen.getByText("Selecciona una imagen")).toBeInTheDocument();
    expect(screen.queryByText("✓ Imagen cargada")).not.toBeInTheDocument();

    // Act
    fireEvent.change(input, {
      target: { files: [new File(["x"], "foto.png", { type: "image/png" })] },
    });

    // Assert
    expect(screen.getByText("✓ Imagen cargada")).toBeInTheDocument();
  });

  it("valida todos los campos obligatorios al enviar", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onSubmit } = renderFormulario();

    // Act
    await user.click(screen.getByRole("button", { name: "Agregar Producto" }));

    // Assert
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByText("Campo requerido")).toHaveLength(3);
    expect(screen.getByText("Selecciona una imagen")).toBeInTheDocument();
    expect(screen.getByText("Ingresa un precio válido")).toBeInTheDocument();
    expect(screen.getByText("Ingresa un stock válido")).toBeInTheDocument();
  });

  it("precarga los valores en modo edicion y no exige imagen", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onSubmit } = renderFormulario({ producto: PRODUCTO });

    // Assert
    expect(screen.getByText("Editar Producto")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre del producto")).toHaveValue("Teclado viejo");
    expect(screen.getByLabelText("Descripcion completa")).toHaveValue("Descripcion vieja");
    expect(screen.getByLabelText("Precio $")).toHaveValue("150.000");
    expect(screen.getByLabelText("Stock")).toHaveValue(3);
    expect(screen.getByLabelText("Descuento %")).toHaveValue(10);
    expect(await screen.findByLabelText("Categoria")).toHaveValue("Tecnologia");

    // Act
    await user.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    // Assert
    expect(onSubmit).toHaveBeenCalled();
  });

  it("envia los datos normalizados y la imagen, y muestra el mensaje de exito", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onSubmit } = renderFormulario();

    // Act
    const imagen = await llenarFormulario(user);
    await user.click(screen.getByRole("button", { name: "Agregar Producto" }));

    // Assert
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          nombre: "Teclado",
          descripcion: "Mecanico",
          precio: 150000,
          stock: 5,
          categoria: "Tecnologia",
          descuento: 0,
        },
        imagen
      )
    );
    expect(await screen.findByText("Guardado")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre del producto")).toHaveValue("");
    expect(screen.queryByText("✓ Imagen cargada")).not.toBeInTheDocument();
  });

  it("muestra el error del backend al guardar", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onSubmit } = renderFormulario();
    onSubmit.mockRejectedValue(new Error("El producto ya existe"));

    // Act
    await llenarFormulario(user);
    await user.click(screen.getByRole("button", { name: "Agregar Producto" }));

    // Assert
    expect(await screen.findByText("El producto ya existe")).toBeInTheDocument();
  });

  it("usa el mensaje por defecto cuando la respuesta no trae mensaje", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onSubmit } = renderFormulario();
    onSubmit.mockResolvedValue({ data: {} });

    // Act
    await llenarFormulario(user);
    await user.click(screen.getByRole("button", { name: "Agregar Producto" }));

    // Assert
    expect(await screen.findByText("Producto creado exitosamente")).toBeInTheDocument();
  });

  it("cancela con el boton Cancelar", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onCancel } = renderFormulario();

    // Act
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    // Assert
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("cae a un campo de texto si fallan las categorias", async () => {
    // Arrange
    listarCategorias.mockRejectedValue(new Error("sin red"));

    // Act
    renderFormulario();

    // Assert
    expect(await screen.findByPlaceholderText("EJ: Ropa")).toBeInTheDocument();
  });
});
