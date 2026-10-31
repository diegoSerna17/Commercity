import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "../../api/client.js";
import { calificarVendedor } from "../../services/calificaciones.service.js";
import { listarHistorialCompras } from "../../services/historial.service.js";
import { productoFalso } from "../../test/utils.jsx";
import FichaProducto from "./FichaProducto.jsx";

vi.mock("../../api/client.js", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("../../services/calificaciones.service.js", () => ({
  calificarVendedor: vi.fn(),
}));

vi.mock("../../services/historial.service.js", () => ({
  listarHistorialCompras: vi.fn(),
}));

function renderFicha(props = {}) {
  const onClose = vi.fn();
  const onAgregarCarrito = vi.fn();
  const onReportar = vi.fn();
  const onIrPerfilVendedor = vi.fn();
  const resultado = render(
    <FichaProducto
      product={productoFalso()}
      onClose={onClose}
      onAgregarCarrito={onAgregarCarrito}
      onReportar={onReportar}
      onIrPerfilVendedor={onIrPerfilVendedor}
      {...props}
    />
  );

  return { onClose, onAgregarCarrito, onReportar, onIrPerfilVendedor, ...resultado };
}

describe("FichaProducto", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentUser.mockReturnValue({ id: 10, roles: ["comprador"] });
    calificarVendedor.mockResolvedValue({ success: true });
    listarHistorialCompras.mockResolvedValue({
      success: true,
      data: [
        {
          pedido_id: 501,
          items: [{ vendedor: "Ana Perez", estado: "Entregado" }],
        },
      ],
    });
  });

  it("renderiza los datos del producto", () => {
    renderFicha();

    expect(screen.getByRole("dialog", { name: /Teclado mecanico/ })).toBeInTheDocument();
    expect(screen.getByText("Teclado mecanico")).toBeInTheDocument();
    expect(screen.getByText("Tecnologia")).toBeInTheDocument();
    expect(screen.getByText("$150.000")).toBeInTheDocument();
    expect(screen.getByText("10 unidades")).toBeInTheDocument();
    expect(screen.getByText("Teclado de prueba con switches azules.")).toBeInTheDocument();
    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });

  it("no renderiza nada sin producto", () => {
    const { container } = render(<FichaProducto product={null} onClose={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("cierra con el boton Volver y con Escape", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onClose } = renderFicha();

    // Act
    await user.click(screen.getByRole("button", { name: /Volver/ }));

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);

    // Act
    fireEvent.keyDown(document, { key: "Escape" });

    // Assert
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("reporta el producto y navega al perfil del vendedor", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onReportar, onIrPerfilVendedor } = renderFicha();

    // Act
    await user.click(screen.getByRole("button", { name: /Reportar/ }));
    await user.click(screen.getByRole("button", { name: /Ana Perez/ }));

    // Assert
    expect(onReportar).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(onIrPerfilVendedor).toHaveBeenCalledWith(7);
  });

  it("agrega la cantidad elegida al carrito y muestra el aviso", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onAgregarCarrito } = renderFicha();

    // Act
    // El boton de sumar no tiene texto accesible; se identifica por su icono.
    const botonSumar = screen
      .getAllByRole("button")
      .find((b) => b.querySelector("svg.lucide-plus"));
    await user.click(botonSumar);
    await user.click(screen.getByRole("button", { name: "Agregar al carrito" }));

    // Assert
    expect(onAgregarCarrito).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 2);
    expect(await screen.findByText("2 unidades agregadas al carrito")).toBeInTheDocument();
  });

  it("la cantidad maxima es el stock (RF83)", async () => {
    // Arrange
    const user = userEvent.setup();
    renderFicha({ product: productoFalso({ stock: 2 }) });
    const botonSumar = screen
      .getAllByRole("button")
      .find((b) => b.querySelector("svg.lucide-plus"));

    // Act
    await user.click(botonSumar);
    await user.click(botonSumar);

    // Assert
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(botonSumar).toBeDisabled();
  });

  it("deshabilita la compra y el aumento cuando esta agotado", () => {
    renderFicha({ product: productoFalso({ stock: 0 }) });

    expect(screen.getByText("Agotado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar al carrito" })).toBeDisabled();
  });

  it("muestra el error cuando el carrito rechaza el producto", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onAgregarCarrito } = renderFicha();
    onAgregarCarrito.mockRejectedValue(new Error("Sin stock"));

    // Act
    await user.click(screen.getByRole("button", { name: "Agregar al carrito" }));

    // Assert
    expect(await screen.findByText("Sin stock")).toBeInTheDocument();
  });

  it("califica al vendedor tras resolver el pedido del historial (RF107)", async () => {
    // Arrange
    const user = userEvent.setup();
    renderFicha();
    await user.click(screen.getByRole("button", { name: "Calificar" }));
    await user.click(screen.getByRole("button", { name: "5 estrellas" }));
    await user.type(screen.getByPlaceholderText("Comentario (opcional)"), "  Muy bueno  ");

    // Act
    await user.click(screen.getByRole("button", { name: "Enviar calificacion" }));

    // Assert
    await waitFor(() =>
      expect(calificarVendedor).toHaveBeenCalledWith({
        pedido_id: 501,
        vendedor_id: 7,
        estrellas: 5,
        comentario: "Muy bueno",
      })
    );
    expect(
      await screen.findByText("Calificacion registrada. Gracias por tu opinion.")
    ).toBeInTheDocument();
  });

  it("no permite calificar sin una compra previa al vendedor", async () => {
    // Arrange
    const user = userEvent.setup();
    listarHistorialCompras.mockResolvedValue({ data: [] });
    renderFicha();
    await user.click(screen.getByRole("button", { name: "Calificar" }));
    await user.click(screen.getByRole("button", { name: "3 estrellas" }));

    // Act
    await user.click(screen.getByRole("button", { name: "Enviar calificacion" }));

    // Assert
    expect(
      await screen.findByText("Solo puedes calificar a un vendedor despues de comprarle.")
    ).toBeInTheDocument();
    expect(calificarVendedor).not.toHaveBeenCalled();
  });

  it("muestra el error 409 de calificacion duplicada", async () => {
    // Arrange
    const user = userEvent.setup();
    calificarVendedor.mockRejectedValue(
      Object.assign(new Error("El pedido ya fue calificado"), { status: 409 })
    );
    renderFicha();
    await user.click(screen.getByRole("button", { name: "Calificar" }));
    await user.click(screen.getByRole("button", { name: "4 estrellas" }));

    // Act
    await user.click(screen.getByRole("button", { name: "Enviar calificacion" }));

    // Assert
    expect(await screen.findByText("El pedido ya fue calificado")).toBeInTheDocument();
  });

  it("no permite calificarse a si mismo", () => {
    // Arrange
    getCurrentUser.mockReturnValue({ id: 7, roles: ["vendedor"] });

    // Act
    renderFicha();

    // Assert
    expect(screen.getByRole("button", { name: "Calificar" })).toBeDisabled();
    expect(screen.getByText("No puedes calificarte a ti mismo.")).toBeInTheDocument();
  });

  it("sin sesion avisa que debe iniciar sesion para calificar", () => {
    // Arrange
    getCurrentUser.mockReturnValue(null);

    // Act
    renderFicha();

    // Assert
    expect(screen.getByRole("button", { name: "Calificar" })).toBeDisabled();
    expect(screen.getByText("Inicia sesion para calificar a este vendedor.")).toBeInTheDocument();
  });

  it("sin vendedor identificado no permite calificar", () => {
    // Act
    renderFicha({ product: productoFalso({ vendedorId: null }) });

    // Assert
    expect(screen.getByRole("button", { name: "Calificar" })).toBeDisabled();
    expect(
      screen.getByText("No se pudo identificar al vendedor de este producto.")
    ).toBeInTheDocument();
  });

  it("abre y cierra la vista ampliada de la imagen", async () => {
    // Arrange
    const user = userEvent.setup();
    renderFicha();

    // Act
    await user.click(screen.getByRole("button", { name: "Ampliar imagen del producto" }));

    // Assert
    expect(screen.getByRole("dialog", { name: "Vista ampliada del producto" })).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole("button", { name: "Cerrar vista ampliada" }));

    // Assert
    expect(
      screen.queryByRole("dialog", { name: "Vista ampliada del producto" })
    ).not.toBeInTheDocument();
  });
});
