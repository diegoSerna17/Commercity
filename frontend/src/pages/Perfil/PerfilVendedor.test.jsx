import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PerfilVendedor from "./PerfilVendedor.jsx";
import {
  actualizarProducto,
  crearProducto,
  listarMisProductos,
} from "../../services/productos.service.js";
import {
  listarSeguidores,
  listarSiguiendo,
} from "../../services/seguidores.service.js";
import { getCurrentUser } from "../../api/client.js";
import {
  crearArchivoImagen,
  mockFileReader,
  usuarioFalso,
} from "../../test/utils.jsx";

vi.mock("../../components/globales/Header", () => ({
  default: ({ title }) => <h1>{title}</h1>,
}));

vi.mock("../../components/perfil/AgregarProducto", () => ({
  default: ({ producto, onCancel, onSubmit }) => (
    <div>
      <p>{producto ? `Editar ${producto.nombre}` : "Nuevo producto"}</p>
      <button
        type="button"
        onClick={() => onSubmit({ nombre: "Producto nuevo" }, "imagen.png")}
      >
        Enviar formulario
      </button>
      <button type="button" onClick={onCancel}>
        Cancelar formulario
      </button>
    </div>
  ),
}));

vi.mock("../../components/perfil/SeguidoresModal", () => ({
  default: ({ datos, initialTab, onClose, onChanged }) => (
    <div>
      <p>{`Modal ${initialTab}: ${datos.usuario} ${datos.seguidores.length}/${datos.siguiendo.length}`}</p>
      <button type="button" onClick={onChanged}>
        Recargar sociales
      </button>
      <button type="button" onClick={onClose}>
        Cerrar modal
      </button>
    </div>
  ),
}));

vi.mock("../../services/productos.service.js", () => ({
  listarMisProductos: vi.fn(),
  crearProducto: vi.fn(),
  actualizarProducto: vi.fn(),
}));

vi.mock("../../services/seguidores.service.js", () => ({
  listarSeguidores: vi.fn(),
  listarSiguiendo: vi.fn(),
}));

vi.mock("../../api/client.js", () => ({
  getCurrentUser: vi.fn(),
}));

function productoApi(sobreescribir = {}) {
  return {
    id: 1,
    nombre: "Teclado mecanico",
    precio: 100000,
    descuento_porcentaje: 10,
    stock: 5,
    imagen_url: "/uploads/teclado.png",
    categoria_nombre: "Tecnologia",
    ...sobreescribir,
  };
}

function usuarioSocial(sobreescribir = {}) {
  return {
    id: 3,
    nombre_completo: "Carla Ruiz",
    foto_perfil: null,
    ...sobreescribir,
  };
}

function prepararCarga({
  productos = [productoApi()],
  siguiendo = [usuarioSocial()],
  seguidores = [usuarioSocial({ id: 4, nombre_completo: "Beto Diaz" })],
} = {}) {
  listarMisProductos.mockResolvedValue({ data: { productos } });
  listarSiguiendo.mockResolvedValue({ data: siguiendo });
  listarSeguidores.mockResolvedValue({ data: seguidores });
}

function renderPerfil() {
  return render(
    <MemoryRouter>
      <PerfilVendedor />
    </MemoryRouter>
  );
}

describe("PerfilVendedor", () => {
  beforeEach(() => {
    listarMisProductos.mockReset();
    crearProducto.mockReset();
    actualizarProducto.mockReset();
    listarSiguiendo.mockReset();
    listarSeguidores.mockReset();
    getCurrentUser.mockReset();
    getCurrentUser.mockReturnValue(
      usuarioFalso("vendedor", { foto_perfil: "/uploads/ana.png" })
    );
  });

  it("carga productos y relaciones sociales y pinta el perfil", async () => {
    // Arrange
    prepararCarga();

    // Act
    renderPerfil();

    // Assert
    expect(await screen.findByText("Teclado mecanico")).toBeInTheDocument();
    expect(screen.getByText("Perfil")).toBeInTheDocument();
    expect(screen.getAllByText("Ana Perez")).toHaveLength(2);
    expect(screen.getByAltText("Avatar de Ana Perez")).toHaveAttribute(
      "src",
      expect.stringContaining("/uploads/ana.png")
    );
    expect(screen.getByText("$100.000")).toBeInTheDocument();
    expect(screen.getByText("$90.000")).toBeInTheDocument();
    expect(screen.getByText("-10%")).toBeInTheDocument();

    const seguidores = screen.getByRole("button", { name: /Seguidores/ });
    const seguidos = screen.getByRole("button", { name: /Seguidos/ });
    expect(seguidores).toHaveTextContent("1");
    expect(seguidos).toHaveTextContent("1");
    expect(screen.getByText("Productos")).toBeInTheDocument();
  });

  it("alterna entre Mi Feed y Mis Productos", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    renderPerfil();
    await screen.findByText("Teclado mecanico");
    expect(
      screen.getByRole("button", { name: "Agregar Producto" })
    ).toBeInTheDocument();
    expect(screen.getByTitle("Editar producto")).toBeInTheDocument();

    // Act
    await usuario.click(screen.getByRole("button", { name: "Mi Feed" }));

    // Assert
    expect(
      screen.queryByRole("button", { name: "Agregar Producto" })
    ).not.toBeInTheDocument();
    expect(screen.queryByTitle("Editar producto")).not.toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Mis Productos" }));
    expect(
      screen.getByRole("button", { name: "Agregar Producto" })
    ).toBeInTheDocument();
    expect(screen.getByTitle("Editar producto")).toBeInTheDocument();
  });

  it("tolera fallos parciales y mantiene el perfil visible", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const usuario = userEvent.setup();
    listarMisProductos.mockRejectedValue(new Error("productos caidos"));
    listarSiguiendo.mockResolvedValue({ data: [usuarioSocial()] });
    listarSeguidores.mockRejectedValue(new Error("seguidores caidos"));

    // Act
    renderPerfil();
    await usuario.click(screen.getByRole("button", { name: /Seguidores/ }));

    // Assert
    expect(
      await screen.findByText("Modal seguidores: Ana Perez 0/1")
    ).toBeInTheDocument();
    expect(error).toHaveBeenCalledWith(
      "No se pudieron cargar los productos del vendedor:",
      expect.any(Error)
    );
    expect(error).toHaveBeenCalledWith(
      "No se pudo cargar la lista de seguidores:",
      expect.any(Error)
    );
    expect(screen.getAllByText("Ana Perez")).toHaveLength(2);
    error.mockRestore();
  });

  it("deja las listas vacias cuando fallan todas las peticiones", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const usuario = userEvent.setup();
    listarMisProductos.mockRejectedValue(new Error("a"));
    listarSiguiendo.mockRejectedValue(new Error("b"));
    listarSeguidores.mockRejectedValue(new Error("c"));

    // Act
    renderPerfil();
    await usuario.click(screen.getByRole("button", { name: /Seguidos/ }));

    // Assert
    expect(
      await screen.findByText("Modal siguiendo: Ana Perez 0/0")
    ).toBeInTheDocument();
    expect(error).toHaveBeenCalledTimes(3);
    expect(error).toHaveBeenCalledWith(
      "No se pudo cargar la lista de seguidos:",
      expect.any(Error)
    );
    error.mockRestore();
  });

  it("no actualiza el estado cuando el componente ya se desmonto", async () => {
    // Arrange
    let resolverProductos;
    listarMisProductos.mockReturnValue(
      new Promise((resolve) => {
        resolverProductos = resolve;
      })
    );
    listarSiguiendo.mockResolvedValue({ data: [] });
    listarSeguidores.mockResolvedValue({ data: [] });
    const { unmount } = renderPerfil();

    // Act
    unmount();
    await act(async () => {
      resolverProductos({ data: { productos: [productoApi()] } });
    });

    // Assert
    expect(screen.queryByText("Teclado mecanico")).not.toBeInTheDocument();
  });

  it("avisa en linea cuando el avatar no es imagen o no se eligio archivo", async () => {
    // Arrange
    const alerta = vi.spyOn(window, "alert").mockImplementation(() => {});
    prepararCarga();
    const { container } = renderPerfil();
    await screen.findByText("Teclado mecanico");
    const input = container.querySelector('input[type="file"]');

    // Act
    fireEvent.change(input, {
      target: { files: [new File(["texto"], "nota.txt", { type: "text/plain" })] },
    });
    fireEvent.change(input, { target: { files: [] } });

    // Assert
    expect(
      screen.getByText("Por favor selecciona un archivo de imagen.")
    ).toBeInTheDocument();
    expect(alerta).not.toHaveBeenCalled();
    alerta.mockRestore();
  });

  it("genera la vista previa cuando el avatar es una imagen", async () => {
    // Arrange
    const restaurar = mockFileReader("data:image/png;base64,QUJD");
    prepararCarga();
    const { container } = renderPerfil();
    await screen.findByText("Teclado mecanico");
    const input = container.querySelector('input[type="file"]');

    // Act
    fireEvent.change(input, {
      target: { files: [crearArchivoImagen()] },
    });

    // Assert
    expect(screen.getByAltText("Avatar de Ana Perez")).toHaveAttribute(
      "src",
      "data:image/png;base64,QUJD"
    );
    expect(
      screen.getByText("Vista previa: aún no se guarda en tu cuenta.")
    ).toBeInTheDocument();
    restaurar();
  });

  it("muestra el avatar generico cuando la imagen falla", async () => {
    // Arrange
    prepararCarga();
    renderPerfil();
    await screen.findByText("Teclado mecanico");

    // Act
    fireEvent.error(screen.getByAltText("Avatar de Ana Perez"));

    // Assert
    expect(
      screen.queryByAltText("Avatar de Ana Perez")
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Ana Perez")).toHaveLength(2);
  });

  it("oculta la imagen del producto cuando no carga", async () => {
    // Arrange
    prepararCarga();
    renderPerfil();
    const imagen = await screen.findByAltText("Teclado mecanico");

    // Act
    fireEvent.error(imagen);

    // Assert
    expect(screen.queryByAltText("Teclado mecanico")).not.toBeInTheDocument();
    expect(screen.getByText("Teclado mecanico")).toBeInTheDocument();
  });

  it("edita la biografia y guarda el texto sin espacios extremos", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    renderPerfil();
    await screen.findByText("Teclado mecanico");

    // Act
    await usuario.click(screen.getByTitle("Editar descripción"));
    const caja = screen.getByRole("textbox");
    await usuario.clear(caja);
    await usuario.type(caja, "  Nueva biografia  ");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    // Assert
    expect(screen.getByText("Nueva biografia")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.getByText("Vista previa: aún no se guarda en tu cuenta.")
    ).toBeInTheDocument();
  });

  it("cancela la edicion de la biografia sin cambiar el texto", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    renderPerfil();
    await screen.findByText("Teclado mecanico");
    const bioOriginal = screen.getByText(/Me gusta encontrar productos/)
      .textContent;

    // Act
    await usuario.click(screen.getByTitle("Editar descripción"));
    await usuario.type(screen.getByRole("textbox"), " cambiada");
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    // Assert
    expect(screen.getByText(bioOriginal)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("recorta la biografia al maximo de 180 caracteres", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    renderPerfil();
    await screen.findByText("Teclado mecanico");
    const larga = "a".repeat(200);

    // Act
    await usuario.click(screen.getByTitle("Editar descripción"));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: larga },
    });

    // Assert
    expect(screen.getByText("200/180")).toBeInTheDocument();

    // Act
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    // Assert
    expect(screen.getByText("a".repeat(180))).toBeInTheDocument();
    expect(screen.queryByText(larga)).not.toBeInTheDocument();
  });

  it("abre el modal de seguidores en la pestaña pulsada y lo cierra", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    renderPerfil();
    await screen.findByText("Teclado mecanico");

    // Act
    await usuario.click(screen.getByRole("button", { name: /Seguidores/ }));

    // Assert
    expect(
      screen.getByText("Modal seguidores: Ana Perez 1/1")
    ).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Cerrar modal" }));
    expect(screen.queryByText(/^Modal seguidores/)).not.toBeInTheDocument();

    // Act
    await usuario.click(screen.getByRole("button", { name: /Seguidos/ }));

    // Assert
    expect(
      screen.getByText("Modal siguiendo: Ana Perez 1/1")
    ).toBeInTheDocument();
  });

  it("recarga seguidores y seguidos cuando el modal notifica un cambio", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarMisProductos.mockResolvedValue({
      data: { productos: [productoApi()] },
    });
    listarSiguiendo
      .mockResolvedValueOnce({ data: [usuarioSocial()] })
      .mockResolvedValueOnce({ data: [] });
    listarSeguidores
      .mockResolvedValueOnce({ data: [usuarioSocial()] })
      .mockResolvedValueOnce({
        data: [
          usuarioSocial(),
          usuarioSocial({ id: 9, nombre_completo: "Dora Luz" }),
        ],
      });
    renderPerfil();
    await screen.findByText("Teclado mecanico");
    await usuario.click(screen.getByRole("button", { name: /Seguidores/ }));
    expect(
      screen.getByText("Modal seguidores: Ana Perez 1/1")
    ).toBeInTheDocument();

    // Act
    await usuario.click(screen.getByRole("button", { name: "Recargar sociales" }));

    // Assert
    expect(
      await screen.findByText("Modal seguidores: Ana Perez 2/0")
    ).toBeInTheDocument();
    expect(listarSeguidores).toHaveBeenCalledTimes(2);
    expect(listarSiguiendo).toHaveBeenCalledTimes(2);
  });

  it("crea un producto y recarga la lista", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarMisProductos
      .mockResolvedValueOnce({ data: { productos: [productoApi()] } })
      .mockResolvedValueOnce({
        data: {
          productos: [
            productoApi(),
            productoApi({ id: 2, nombre: "Producto nuevo" }),
          ],
        },
      });
    listarSiguiendo.mockResolvedValue({ data: [] });
    listarSeguidores.mockResolvedValue({ data: [] });
    crearProducto.mockResolvedValue({ success: true });
    renderPerfil();
    await screen.findByText("Teclado mecanico");

    // Act
    await usuario.click(
      screen.getByRole("button", { name: "Agregar Producto" })
    );
    expect(screen.getByText("Nuevo producto")).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Enviar formulario" }));

    // Assert
    expect(crearProducto).toHaveBeenCalledWith(
      { nombre: "Producto nuevo" },
      "imagen.png"
    );
    expect(await screen.findByText("Producto nuevo")).toBeInTheDocument();
    expect(listarMisProductos).toHaveBeenCalledTimes(2);

    // Act
    await usuario.click(
      screen.getByRole("button", { name: "Cancelar formulario" })
    );

    // Assert
    expect(screen.queryByText("Nuevo producto")).not.toBeInTheDocument();
  });

  it("actualiza un producto y recarga la lista", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarMisProductos
      .mockResolvedValueOnce({ data: [productoApi()] })
      .mockResolvedValueOnce({
        data: [productoApi({ nombre: "Teclado editado" })],
      });
    listarSiguiendo.mockResolvedValue({ data: [] });
    listarSeguidores.mockResolvedValue({ data: [] });
    actualizarProducto.mockResolvedValue({ success: true });
    renderPerfil();
    await screen.findByText("Teclado mecanico");

    // Act
    await usuario.click(screen.getByTitle("Editar producto"));

    // Assert
    expect(screen.getByText("Editar Teclado mecanico")).toBeInTheDocument();

    // Act
    await usuario.click(screen.getByRole("button", { name: "Enviar formulario" }));

    // Assert
    expect(actualizarProducto).toHaveBeenCalledWith(
      1,
      { nombre: "Producto nuevo" },
      "imagen.png"
    );
    expect(await screen.findByText("Teclado editado")).toBeInTheDocument();
    expect(listarMisProductos).toHaveBeenCalledTimes(2);

    // Act
    await usuario.click(
      screen.getByRole("button", { name: "Cancelar formulario" })
    );

    // Assert
    expect(screen.queryByText(/^Editar /)).not.toBeInTheDocument();
  });

  it("usa el nombre y el avatar por defecto sin usuario en sesion", async () => {
    // Arrange
    getCurrentUser.mockReturnValue(null);
    prepararCarga({ productos: [], siguiendo: [], seguidores: [] });

    // Act
    renderPerfil();

    // Assert
    expect(screen.getByAltText("Avatar de Usuario").getAttribute("src")).toContain(
      "avatar-placeholder.svg"
    );
    expect(screen.getAllByText("Usuario")).toHaveLength(2);
  });
});
