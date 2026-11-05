import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FichaProducto from "../../components/inicio/FichaProducto";
import Categorias from "../../components/inicio/Categorias";
import Header from "../../components/globales/Header";
import Reportar from "../../components/inicio/Reportar";
import HeroCarrusel from "../../components/inicio/HeroCarrusel";
import TarjetaProducto from "../../components/inicio/TarjetaProducto";
import PaginacionCatalogo from "../../components/inicio/PaginacionCatalogo";
import { useCatalogo } from "./useCatalogo.js";
import { agregarProducto } from "../../services/carrito.service.js";
import { getCurrentUser } from "../../api/client.js";
import { mapearProducto } from "../../utils/mapearProducto.js";

export default function Inicio() {
  const navigate = useNavigate();
  const {
    busqueda,
    categoria,
    productos,
    pagina,
    totalPaginas,
    totalProductos,
    hayPaginaSiguiente,
    cargando,
    cargandoMas,
    error,
    cargarProductos,
    cargarMasProductos,
  } = useCatalogo();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mostrarReportar, setMostrarReportar] = useState(false);
  // RF62/RF63: producto que se esta reportando en el modal.
  const [productoReportado, setProductoReportado] = useState(null);

  // RF104: persiste el producto en el carrito real del comprador autenticado.
  async function manejarAgregarCarrito(product, cantidad) {
    const compradorId = getCurrentUser()?.id;
    if (!compradorId) {
      navigate("/login");
      throw new Error("Inicia sesión para agregar productos al carrito");
    }
    await agregarProducto(product.id, cantidad);
  }

  // JS Navega al perfil publico del vendedor pasando nombre y avatar por state.
  function irPerfilVendedor(producto) {
    navigate(`/vendedor/${producto.vendedorId}`, {
      state: {
        nombre: producto.vendedorNombre,
        avatar: producto.vendedorAvatar,
      },
    });
  }

  // JS Abre la ficha de un producto elegido en la busqueda en vivo del header.
  function manejarSeleccionBusqueda(productoCrudo) {
    if (!productoCrudo) return;
    setSelectedProduct(mapearProducto(productoCrudo));
  }

  return (
    <div className="flex min-h-screen md:min-h-0 overflow-hidden bg-surface-container-lowest font-sans">
      <main className="flex-grow h-dvh overflow-y-auto relative">
        <Header onSelectProduct={manejarSeleccionBusqueda} />

        <HeroCarrusel />

        <Categorias />

        {/* ===== PRODUCTOS ===== */}
        <section className="px-4 sm:px-6 md:px-padding-lg lg:px-padding-xl pb-16 md:pb-20">
          <div className="flex items-end justify-between mb-8 md:mb-10">
            <div>
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2"
                id="products-heading"
                style={{ color: "var(--color-on-surface)" }}
              >
                {busqueda
                  ? `Resultados para "${busqueda}"`
                  : categoria || "Explora Novedades"}
              </h2>
              <p
                className="text-sm md:text-base"
                style={{ color: "var(--color-brand-muted-text)" }}
              >
                {busqueda || categoria
                  ? "Productos que coinciden con tu busqueda"
                  : "Productos destacados de la semana"}
              </p>
            </div>
            <button
              className="hidden sm:flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: "var(--color-brand-orange)" }}
            >
              Ver todo
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-7"
            role="list"
            aria-labelledby="products-heading"
          >
            {cargando && (
              <div
                className="col-span-full flex flex-col items-center justify-center gap-3 py-16"
                role="status"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span
                  className="text-xs font-medium tracking-wide uppercase"
                  style={{ color: "var(--color-brand-muted-text)" }}
                >
                  Cargando productos...
                </span>
              </div>
            )}

            {!cargando && error && (
              <div
                className="col-span-full flex flex-col items-center justify-center gap-4 rounded-3xl border px-4 py-16 text-center"
                style={{
                  borderColor: "var(--color-border-subtle)",
                  backgroundColor: "var(--color-auth-card-bg)",
                }}
              >
                <p className="text-sm md:text-base" style={{ color: "var(--color-on-surface)" }}>
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => cargarProductos(1)}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: "var(--color-brand-orange)",
                    color: "var(--color-brand-dark-text)",
                  }}
                >
                  Reintentar
                </button>
              </div>
            )}

            {!cargando && !error && productos.length === 0 && (
              <div
                className="col-span-full flex flex-col items-center justify-center gap-2 rounded-3xl border px-4 py-16 text-center"
                style={{
                  borderColor: "var(--color-border-subtle)",
                  backgroundColor: "var(--color-auth-card-bg)",
                }}
              >
                <p className="text-sm md:text-base font-semibold" style={{ color: "var(--color-on-surface)" }}>
                  No hay productos disponibles por ahora
                </p>
                <p className="text-xs md:text-sm" style={{ color: "var(--color-brand-muted-text)" }}>
                  Vuelve mas tarde para ver las novedades de la ciudad.
                </p>
              </div>
            )}

            {!cargando &&
              !error &&
              productos.map((product) => (
                <TarjetaProducto
                  key={product.id}
                  product={product}
                  onAbrir={setSelectedProduct}
                  onIrPerfilVendedor={irPerfilVendedor}
                />
              ))}
          </div>

        </section>

        {/* Paginacion del catalogo */}
        {!cargando && !error && productos.length > 0 && (
          <PaginacionCatalogo
            pagina={pagina}
            totalPaginas={totalPaginas}
            totalProductos={totalProductos}
            cantidadMostrada={productos.length}
            hayPaginaSiguiente={hayPaginaSiguiente}
            cargandoMas={cargandoMas}
            onCargarMas={cargarMasProductos}
          />
        )}
      </main>

      {selectedProduct && (
        <FichaProducto
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onReportar={(product) => {
            setProductoReportado(product);
            setMostrarReportar(true);
          }}
          onIrPerfilVendedor={() => irPerfilVendedor(selectedProduct)}
          onAgregarCarrito={manejarAgregarCarrito}
        />
      )}

      {mostrarReportar && (
        <Reportar
          producto={productoReportado}
          onClose={() => setMostrarReportar(false)}
        />
      )}
    </div>
  );
}
