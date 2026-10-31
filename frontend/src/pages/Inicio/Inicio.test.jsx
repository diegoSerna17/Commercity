import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Inicio from "./Inicio.jsx";
import { listarProductos } from "../../services/productos.service.js";
import { agregarProducto } from "../../services/carrito.service.js";
import { getCurrentUser } from "../../api/client.js";

vi.mock("swiper/react", () => ({
  Swiper: ({ children }) => <div>{children}</div>,
  SwiperSlide: ({ children }) => <div>{children}</div>,
}));

vi.mock("swiper/modules", () => ({
  Pagination: {},
  Autoplay: {},
  EffectFade: {},
}));

vi.mock("../../services/productos.service.js", () => ({
  listarProductos: vi.fn(),
}));

vi.mock("../../services/carrito.service.js", () => ({
  agregarProducto: vi.fn(),
}));

vi.mock("../../api/client.js", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("../../components/globales/Header", () => ({
  default: ({ onSelectProduct }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onSelectProduct({
            id: 9,
            nombre: "Silla ergonomica",
            precio: 200000,
            stock: 3,
            categoria: "Hogar",
            vendedor_id: 3,
            vendedor: "Carla Ruiz",
          })
        }
      >
        Buscar producto
      </button>
      <button type="button" onClick={() => onSelectProduct(null)}>
        Buscar vacio
      </button>
    </div>
  ),
}));

vi.mock("../../components/inicio/Categorias", () => ({
  default: () => <div>Categorias</div>,
}));

vi.mock("../../components/inicio/FichaProducto", () => ({
  default: ({ product, onClose, onReportar, onIrPerfilVendedor, onAgregarCarrito }) => (
    <div>
      <p>Ficha de {product.name}</p>
      <button type="button" onClick={onClose}>
        Cerrar ficha
      </button>
      <button type="button" onClick={() => onReportar(product)}>
        Reportar producto
      </button>
      <button type="button" onClick={onIrPerfilVendedor}>
        Ir al vendedor
      </button>
      <button
        type="button"
        onClick={() => {
          onAgregarCarrito(product, 2).catch(() => {});
        }}
      >
        Agregar al carrito
      </button>
    </div>
  ),
}));

vi.mock("../../components/inicio/Reportar", () => ({
  default: ({ producto, onClose }) => (
    <div>
      <p>Reportar {producto?.name}</p>
      <button type="button" onClick={onClose}>
        Cerrar reporte
      </button>
    </div>
  ),
}));

function productoApi(sobreescribir = {}) {
  return {
    id: 1,
    nombre: "Teclado mecanico",
    precio: 150000,
    descuento_porcentaje: 10,
    stock: 10,
    categoria: "Tecnologia",
    imagen: "https://example.com/teclado.png",
    descripcion: "Teclado de prueba",
    vendedor_id: 7,
    vendedor: "Ana Perez",
    vendedor_foto: "https://example.com/ana.png",
    ...sobreescribir,
  };
}

function respuestaApi(productos, extra = {}) {
  return {
    data: {
      productos,
      pagina: 1,
      totalPaginas: 1,
      totalProductos: productos.length,
      hayPaginaSiguiente: false,
      ...extra,
    },
  };
}

function FiltroRapido() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate("/?busqueda=mouse")}>
      Filtrar mouse
    </button>
  );
}

function EspiaVendedor() {
  const { id } = useParams();
  const location = useLocation();
  return (
    <p>
      Vendedor {id} - {location.state?.nombre} - {location.state?.avatar}
    </p>
  );
}

function renderInicio(ruta = "/") {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Inicio />
              <FiltroRapido />
            </>
          }
        />
        <Route path="/login" element={<p>Pantalla login</p>} />
        <Route path="/vendedor/:id" element={<EspiaVendedor />} />
      </Routes>
    </MemoryRouter>
  );
}

async function abrirFicha(usuario) {
  await screen.findByText("Teclado mecanico");
  await usuario.click(
    screen.getByRole("button", { name: "Ver ficha de Teclado mecanico" })
  );
}

describe("Inicio", () => {
  beforeEach(() => {
    listarProductos.mockReset();
    agregarProducto.mockReset();
    getCurrentUser.mockReset();
    getCurrentUser.mockReturnValue(null);
  });

  it("carga la primera pagina y pinta la tarjeta del producto", async () => {
    // Arrange
    listarProductos.mockResolvedValue(respuestaApi([productoApi()]));

    // Act
    renderInicio();

    // Assert
    expect(await screen.findByText("Teclado mecanico")).toBeInTheDocument();
    expect(listarProductos).toHaveBeenCalledWith({
      page: 1,
      limit: 12,
      nombre: "",
      categoria: "",
    });
    expect(screen.getByText("Tecnologia")).toBeInTheDocument();
    expect(screen.getByText("-10%")).toBeInTheDocument();
    expect(screen.getByText("$150.000")).toBeInTheDocument();
    expect(screen.getByText("$135.000")).toBeInTheDocument();
    expect(screen.getByText("10 unidades")).toBeInTheDocument();
    expect(screen.getByText("Ana Perez")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 1 de 1 productos")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Pagina del catalogo" })
    ).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByText("Categorias")).toBeInTheDocument();
  });

  it("usa la busqueda y la categoria de la URL", async () => {
    // Arrange
    listarProductos.mockResolvedValue(respuestaApi([productoApi()]));

    // Act
    renderInicio("/?busqueda=teclado&categoria=Tecnologia");

    // Assert
    expect(
      await screen.findByText('Resultados para "teclado"')
    ).toBeInTheDocument();
    expect(listarProductos).toHaveBeenCalledWith({
      page: 1,
      limit: 12,
      nombre: "teclado",
      categoria: "Tecnologia",
    });
  });

  it("muestra solo la categoria cuando no hay busqueda", async () => {
    // Arrange
    listarProductos.mockResolvedValue(respuestaApi([productoApi()]));

    // Act
    renderInicio("/?categoria=Hogar");

    // Assert
    expect(await screen.findByText("Hogar")).toBeInTheDocument();
    expect(
      screen.getByText("Productos que coinciden con tu busqueda")
    ).toBeInTheDocument();
  });

  it("muestra el estado vacio", async () => {
    listarProductos.mockResolvedValue(respuestaApi([]));

    renderInicio();

    expect(
      await screen.findByText("No hay productos disponibles por ahora")
    ).toBeInTheDocument();
  });

  it("muestra el error de red y permite reintentar", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarProductos
      .mockRejectedValueOnce(new Error("sin red"))
      .mockResolvedValueOnce(respuestaApi([productoApi()]));
    renderInicio();

    // Act
    expect(
      await screen.findByText(
        "No se pudo conectar con el servidor. Verifica que el backend este activo."
      )
    ).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Reintentar" }));

    // Assert
    expect(await screen.findByText("Teclado mecanico")).toBeInTheDocument();
    expect(listarProductos).toHaveBeenCalledTimes(2);
  });

  it("muestra el mensaje del backend cuando la peticion llega al servidor", async () => {
    listarProductos.mockRejectedValue({ status: 500 });

    renderInicio();

    expect(
      await screen.findByText("No se pudieron cargar los productos")
    ).toBeInTheDocument();
  });

  it("carga mas productos y avisa cuando no quedan mas", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarProductos
      .mockResolvedValueOnce(
        respuestaApi([productoApi()], {
          totalPaginas: 2,
          totalProductos: 2,
          hayPaginaSiguiente: true,
        })
      )
      .mockResolvedValueOnce(
        respuestaApi([productoApi({ id: 2, nombre: "Mouse gamer" })], {
          pagina: 2,
          totalPaginas: 2,
          totalProductos: 2,
          hayPaginaSiguiente: false,
        })
      );
    renderInicio();
    await screen.findByText("Teclado mecanico");

    // Act
    await usuario.click(
      screen.getAllByRole("button", { name: "Cargar mas productos" })[0]
    );

    // Assert
    expect(await screen.findByText("Mouse gamer")).toBeInTheDocument();
    expect(listarProductos).toHaveBeenLastCalledWith({
      page: 2,
      limit: 12,
      nombre: "",
      categoria: "",
    });
    expect(screen.getByText("Mostrando 2 de 2 productos")).toBeInTheDocument();
    expect(screen.getByText("Has visto todo el catalogo")).toBeInTheDocument();
  });

  it("descarta la respuesta vieja cuando los filtros cambian (RF87)", async () => {
    // Arrange
    const usuario = userEvent.setup();
    let resolverVieja;
    listarProductos.mockImplementation(({ nombre }) => {
      if (nombre === "mouse") {
        return Promise.resolve(respuestaApi([productoApi({ id: 2, nombre: "Mouse gamer" })]));
      }
      return new Promise((resolve) => {
        resolverVieja = resolve;
      });
    });
    renderInicio();

    // Act
    await usuario.click(screen.getByRole("button", { name: "Filtrar mouse" }));
    expect(await screen.findByText("Mouse gamer")).toBeInTheDocument();
    await act(async () => {
      resolverVieja(respuestaApi([productoApi({ id: 1, nombre: "Teclado viejo" })]));
    });

    // Assert
    expect(screen.queryByText("Teclado viejo")).not.toBeInTheDocument();
    expect(screen.getByText("Mouse gamer")).toBeInTheDocument();
    expect(
      screen.getByText('Resultados para "mouse"')
    ).toBeInTheDocument();
  });

  it("abre y cierra la ficha del producto", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarProductos.mockResolvedValue(respuestaApi([productoApi()]));
    renderInicio();

    // Act
    await abrirFicha(usuario);

    // Assert
    expect(screen.getByText("Ficha de Teclado mecanico")).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Cerrar ficha" }));
    expect(screen.queryByText("Ficha de Teclado mecanico")).not.toBeInTheDocument();
  });

  it("abre la ficha desde el resultado de la busqueda del header", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarProductos.mockResolvedValue(respuestaApi([]));
    renderInicio();
    await screen.findByText("No hay productos disponibles por ahora");

    // Act
    await usuario.click(screen.getByRole("button", { name: "Buscar producto" }));

    // Assert
    expect(screen.getByText("Ficha de Silla ergonomica")).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Buscar vacio" }));
    expect(screen.getByText("Ficha de Silla ergonomica")).toBeInTheDocument();
  });

  it("reporta el producto abierto y cierra el reporte", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarProductos.mockResolvedValue(respuestaApi([productoApi()]));
    renderInicio();
    await abrirFicha(usuario);

    // Act
    await usuario.click(screen.getByRole("button", { name: "Reportar producto" }));

    // Assert
    expect(screen.getByText("Reportar Teclado mecanico")).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Cerrar reporte" }));
    expect(screen.queryByText("Reportar Teclado mecanico")).not.toBeInTheDocument();
  });

  it("navega al perfil del vendedor con su nombre y avatar", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarProductos.mockResolvedValue(respuestaApi([productoApi()]));
    renderInicio();
    await screen.findByText("Teclado mecanico");

    // Act
    await usuario.click(
      screen.getByRole("button", { name: "Ver perfil de Ana Perez" })
    );

    // Assert
    expect(
      await screen.findByText(
        "Vendedor 7 - Ana Perez - https://example.com/ana.png"
      )
    ).toBeInTheDocument();
  });

  it("exige sesion para agregar al carrito", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarProductos.mockResolvedValue(respuestaApi([productoApi()]));
    renderInicio();
    await abrirFicha(usuario);

    // Act
    await usuario.click(screen.getByRole("button", { name: "Agregar al carrito" }));

    // Assert
    expect(await screen.findByText("Pantalla login")).toBeInTheDocument();
    expect(agregarProducto).not.toHaveBeenCalled();
  });

  it("agrega al carrito real con sesion iniciada", async () => {
    // Arrange
    const usuario = userEvent.setup();
    getCurrentUser.mockReturnValue({ id: 10 });
    agregarProducto.mockResolvedValue({ success: true });
    listarProductos.mockResolvedValue(respuestaApi([productoApi()]));
    renderInicio();
    await abrirFicha(usuario);

    // Act
    await usuario.click(screen.getByRole("button", { name: "Agregar al carrito" }));

    // Assert
    await waitFor(() =>
      expect(agregarProducto).toHaveBeenCalledWith(1, 2)
    );
  });

  it("navega al vendedor desde la ficha abierta", async () => {
    // Arrange
    const usuario = userEvent.setup();
    listarProductos.mockResolvedValue(respuestaApi([productoApi()]));
    renderInicio();
    await abrirFicha(usuario);

    // Act
    await usuario.click(screen.getByRole("button", { name: "Ir al vendedor" }));

    // Assert
    expect(
      await screen.findByText(
        "Vendedor 7 - Ana Perez - https://example.com/ana.png"
      )
    ).toBeInTheDocument();
  });
});
