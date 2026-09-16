import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, EffectFade } from "swiper/modules";
import FichaProducto from "../../components/inicio/FichaProducto";
import Header from "../../components/globales/Header";
import Reportar from "../../components/inicio/Reportar";
import { listarProductos } from "../../services/productos.service.js";
import { API_BASE_URL } from "../../constants/config.js";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

const heroSlides = [
  {
    id: 1,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAE0Uf2aJHJR6JmZTmDeaBo4MB_roFJRkzXT2fSstX1qItU8s3TCa1hWAtEB8AHoTTqo-9HN39bZlI3sfpBuqFG88d_p1ypbvLz6GSMezwEjlfmyBKn9yDyqblPuxKaM9_zY_CLnEhDn6uqW1cc7MMvOKsV6D0owc4yi5tS_l40BHL1wofZq5InnDgCJ72HwXFuJZDtFZqUPWhp3OwpYUTQSIcU1_SCPI071NpmpbW4Q5kI808pH4mqBSaUt_yVBtMnnm0PuENQjw",
    tag: "Nuevos ingresos",
    title: "Transforma tu estilo.",
    titleAccent: "Eleva tu vida.",
    description: "CommerCity — Donde tus deseos se hacen realidad. Explora y encuentra lo que te define.",
    ctaText: "Explorar ahora",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop",
    tag: "Ofertas de la semana",
    title: "Hasta 50% off",
    titleAccent: "En productos seleccionados",
    description: "No dejes pasar esta oportunidad. Descuentos increíbles en las mejores marcas.",
    ctaText: "Ver ofertas",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&auto=format&fit=crop",
    tag: "Tendencias",
    title: "Lo más vendido",
    titleAccent: "Esta temporada",
    description: "Descubre los productos que todos están comprando. Calidad y estilo garantizados.",
    ctaText: "Ver trending",
  },
];

// JS Cantidad de productos que se piden por pagina a la API.
const LIMITE_PRODUCTOS = 12;

// JS Imagen de respaldo cuando el producto no tiene imagen publicada.
const PRODUCTO_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop";

// JS El backend devuelve rutas relativas (/uploads/...); se resuelven contra la API.
function resolverImagen(imagen) {
  if (!imagen) return PRODUCTO_IMAGE_FALLBACK;
  if (/^https?:\/\//i.test(imagen)) return imagen;
  return `${API_BASE_URL}${imagen}`;
}

// JS Avatar por defecto cuando el vendedor no tiene foto de perfil.
function resolverAvatar(vendedor) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    vendedor || "Vendedor"
  )}&background=1a1a26&color=fff&bold=true&size=80&rounded=true`;
}

// JS Traduce el producto de la API al shape que consumen la tarjeta y FichaProducto.
function mapearProducto(producto) {
  const descuento = Number(producto.descuento_porcentaje) || 0;
  const precio = Number(producto.precio) || 0;

  return {
    id: producto.id,
    name: producto.nombre,
    category: producto.categoria,
    // JS Los precios monetarios se muestran sin decimales (COP)
    price: Math.round(precio),
    precioBase: Math.round(precio),
    descuento,
    stock: Number(producto.stock) || 0,
    image: resolverImagen(producto.imagen),
    imageAlt: producto.nombre,
    description: producto.descripcion,
    vendedorId: producto.vendedor_id,
    vendedorNombre: producto.vendedor,
    vendedorAvatar: producto.vendedor_foto || resolverAvatar(producto.vendedor),
    badge: descuento > 0 ? `-${descuento}%` : null,
    badgeBg: descuento > 0 ? "bg-figma-accent-blue" : null,
  };
}

// JS Precio final con el descuento aplicado (misma formula del backend).
function calcularPrecioFinal(producto) {
  if (!producto.descuento) return producto.price;
  return Math.round(producto.precioBase - (producto.precioBase * producto.descuento) / 100);
}

const Hero = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mostrarReportar, setMostrarReportar] = useState(false);

  // RE Estado del catalogo real: productos, paginacion, carga y error
  const [productos, setProductos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalProductos, setTotalProductos] = useState(0);
  const [hayPaginaSiguiente, setHayPaginaSiguiente] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState("");

  // JS Consulta el catalogo paginado contra GET /api/productos
  const cargarProductos = useCallback(async (numeroPagina) => {
    const primeraCarga = numeroPagina === 1;
    if (primeraCarga) setCargando(true);
    else setCargandoMas(true);
    setError("");

    try {
      const res = await listarProductos({ page: numeroPagina, limit: LIMITE_PRODUCTOS });
      const data = res.data || {};
      const nuevos = (data.productos || []).map(mapearProducto);

      setProductos((actuales) => (primeraCarga ? nuevos : [...actuales, ...nuevos]));
      setPagina(data.pagina ?? numeroPagina);
      setTotalPaginas(data.totalPaginas ?? 1);
      setTotalProductos(data.totalProductos ?? nuevos.length);
      setHayPaginaSiguiente(Boolean(data.hayPaginaSiguiente));
    } catch (err) {
      // Sin status significa que la peticion no llego al servidor
      setError(
        err.status
          ? err.message || "No se pudieron cargar los productos"
          : "No se pudo conectar con el servidor. Verifica que el backend este activo."
      );
      if (primeraCarga) setProductos([]);
    } finally {
      setCargando(false);
      setCargandoMas(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos(1);
  }, [cargarProductos]);

  const cargarMasProductos = () => {
    if (hayPaginaSiguiente && !cargandoMas) cargarProductos(pagina + 1);
  };

  return (
    <div className="flex min-h-screen md:min-h-0 overflow-hidden bg-surface-container-lowest font-sans">
      <main className="flex-grow h-dvh overflow-y-auto relative">
        <Header showCategories={true} />

        {/* ===== HERO SLIDER ===== */}
        <section className="px-4 sm:px-6 md:px-padding-lg lg:px-padding-xl pt-2 pb-6 md:pb-10">
          <Swiper
            modules={[Pagination, Autoplay, EffectFade]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            speed={900}
            autoplay={{ delay: 5500, disableOnInteraction: false }}
            loop
            grabCursor
            pagination={{ clickable: true }}
            className="hero-swiper w-full rounded-[32px] overflow-hidden h-[360px] sm:h-[400px] md:h-[480px] lg:h-[580px]"
          >
            {heroSlides.map((slide) => (
<SwiperSlide key={slide.id}>
  <div className="relative w-full h-full overflow-hidden">

    {/* Imagen fondo */}
    <img
      src={slide.image}
      alt={slide.tag}
      className="absolute inset-0 w-full h-full object-cover scale-105"
    />

    {/* Overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/20" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

    {/* Glow */}
    <div
      className="absolute -left-32 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[180px] opacity-25"
      style={{
        background:
          "radial-gradient(circle,var(--color-primary),transparent 70%)",
      }}
    />

    <div
      className="absolute right-[-180px] top-[-150px] w-[500px] h-[500px] rounded-full blur-[170px] opacity-20"
      style={{
        background:
          "radial-gradient(circle,#4F8CFF,transparent 70%)",
      }}
    />

{/* Contenido */}
<div className="absolute inset-0 flex items-center">
  <div className="w-full max-w-[1350px] mx-auto px-6 sm:px-10 lg:px-16">

    {/* Badge */}
    <div
      className="inline-flex items-center gap-3 rounded-full px-5 py-3 mb-7 backdrop-blur-xl"
      style={{
        background: "rgba(255,255,255,.08)",
        border: "1px solid rgba(255,255,255,.12)",
      }}
    >
      <span
        className="w-2.5 h-2.5 rounded-full animate-pulse"
        style={{ background: "var(--color-primary)" }}
      />

      <span
        className="uppercase tracking-[0.18em] text-xs font-semibold"
        style={{ color: "var(--color-primary)" }}
      >
        {slide.tag}
      </span>
    </div>

    {/* Título */}
    <h1
      className="max-w-[760px] text-[42px] sm:text-[58px] md:text-[70px] xl:text-[82px] font-black leading-[0.95] tracking-tight"
      style={{
        color: "var(--color-figma-text-primary)",
        textShadow: "0 10px 35px rgba(0,0,0,.45)",
      }}
    >
      {slide.title}
      <br />
      <span style={{ color: "var(--color-primary)" }}>
        {slide.titleAccent}
      </span>
    </h1>

    {/* Descripción */}
    <p
      className="mt-7 max-w-[620px] text-base md:text-lg leading-8"
      style={{
        color: "rgba(255,255,255,.80)",
      }}
    >
      {slide.description}
    </p>

    {/* Botón */}
    <div className="mt-10">
      <button
        onClick={() =>
          document
            .getElementById("products-heading")
            ?.scrollIntoView({ behavior: "smooth" })
        }
        className="group inline-flex items-center gap-3 h-10 px-3 rounded-full font-semibold text-base transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(239,153,24,.35)] active:scale-95"
        style={{
          background: "var(--color-primary)",
          color: "var(--color-on-primary)",
        }}
      >
        {slide.ctaText}

        <svg
          className="w-5 h-5 transition-transform group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 12h14M13 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>

  </div>
</div>

</div>
</SwiperSlide>
            ))}
          </Swiper>
        </section>

        {/* ===== PRODUCTOS ===== */}
        <section className="px-4 sm:px-6 md:px-padding-lg lg:px-padding-xl pb-16 md:pb-20">
          <div className="flex items-end justify-between mb-8 md:mb-10">
            <div>
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2"
                id="products-heading"
                style={{ color: "var(--color-on-surface)" }}
              >
                Explora Novedades
              </h2>
              <p
                className="text-sm md:text-base"
                style={{ color: "var(--color-brand-muted-text)" }}
              >
                Productos destacados de la semana
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
              <article
                key={product.id}
                role="listitem"
                className="group relative rounded-3xl overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-2"
                style={{
                  backgroundColor: "var(--color-auth-card-bg)",
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)",
                }}
              >
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    border: "1px solid var(--color-border-subtle)",
                    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05)",
                  }}
                />

                <button
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  className="text-left relative overflow-hidden"
                  aria-label={`Ver ficha de ${product.name}`}
                >
                  <div className="relative h-[200px] sm:h-[220px] md:h-[260px] flex-shrink-0 overflow-hidden bg-surface-container-high">
                    <img
                      src={product.image}
                      alt={product.imageAlt}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {product.badge && (
                      <span
                        className="absolute top-4 left-4 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg"
                        style={{
                          backgroundColor: "var(--color-brand-orange)",
                          color: "var(--color-auth-card-bg)",
                        }}
                      >
                        {product.badge}
                      </span>
                    )}

                    <span
                      className="absolute top-4 right-4 text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md uppercase tracking-wider"
                      style={{
                        backgroundColor: "var(--color-bg-glass)",
                        color: "var(--color-on-surface-variant)",
                        border: "1px solid var(--color-border-subtle)",
                      }}
                    >
                      {product.category}
                    </span>
                  </div>
                </button>

                <div className="flex flex-col gap-2 p-5 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className="text-left group/btn"
                  >
                    <h3
                      className="text-base lg:text-lg font-bold line-clamp-2 transition-colors duration-200 group-hover/btn:text-brand-orange"
                      style={{ color: "var(--color-on-surface)" }}
                    >
                      {product.name}
                    </h3>
                  </button>

                  <div className="flex items-center gap-2 mt-0.5">
                    <img
                      src={product.vendedorAvatar}
                      alt={product.vendedorNombre}
                      className="w-5 h-5 rounded-full"
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--color-brand-muted-text)" }}
                    >
                      {product.vendedorNombre}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2.5 mt-1.5">
                    {product.descuento > 0 && (
                      <span
                        className="text-sm font-medium line-through"
                        style={{ color: "var(--color-brand-muted-text)" }}
                      >
                        ${product.precioBase.toLocaleString("es-CO")}
                      </span>
                    )}
                    <span
                      className="text-lg lg:text-xl font-bold"
                      style={{ color: "var(--color-brand-orange)" }}
                    >
                      ${Math.round(calcularPrecioFinal(product)).toLocaleString("es-CO")}
                    </span>
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="text-[10px] font-medium uppercase tracking-wider"
                        style={{ color: "var(--color-brand-muted-text)" }}
                      >
                        Stock disponible
                      </span>
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: "var(--color-brand-orange)" }}
                      >
                        {product.stock} unidades
                      </span>
                    </div>
                    <div
                      className="w-full h-1 rounded-full overflow-hidden"
                      style={{
                        backgroundColor: "var(--color-surface-container-high)",
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.min((product.stock / 50) * 100, 100)}%`,
                          backgroundColor: "var(--color-brand-orange)",
                          opacity: 0.6,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {hayPaginaSiguiente && !cargando && !error && (
            <div className="flex justify-center mt-8 sm:hidden">
              <button
                type="button"
                onClick={cargarMasProductos}
                disabled={cargandoMas}
                className="px-6 py-2.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  border: "1px solid var(--color-border-subtle)",
                  color: "var(--color-brand-orange)",
                }}
              >
                {cargandoMas ? "Cargando..." : "Cargar mas productos"}
              </button>
            </div>
          )}
        </section>

        {/* Paginacion del catalogo */}
        {!cargando && !error && productos.length > 0 && (
          <div className="flex flex-col items-center justify-center gap-4 px-4 pb-16 md:pb-20">
            <span
              className="text-xs font-medium tracking-wide uppercase"
              style={{ color: "var(--color-brand-muted-text)" }}
            >
              Mostrando {productos.length} de {totalProductos} productos
            </span>
            <div
              className="w-32 h-1 rounded-full overflow-hidden"
              style={{
                backgroundColor: "var(--color-surface-container-high)",
              }}
              role="progressbar"
              aria-valuenow={pagina}
              aria-valuemin={1}
              aria-valuemax={totalPaginas}
              aria-label="Pagina del catalogo"
            >
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min((pagina / totalPaginas) * 100, 100)}%`,
                  backgroundColor: "var(--color-brand-orange)",
                }}
              />
            </div>
            {hayPaginaSiguiente ? (
              <button
                type="button"
                onClick={cargarMasProductos}
                disabled={cargandoMas}
                className="hidden sm:block px-6 py-2.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  border: "1px solid var(--color-border-subtle)",
                  color: "var(--color-brand-orange)",
                }}
              >
                {cargandoMas ? "Cargando piezas..." : "Cargar mas productos"}
              </button>
            ) : (
              <span className="text-xs" style={{ color: "var(--color-brand-muted-text)" }}>
                Has visto todo el catalogo
              </span>
            )}
          </div>
        )}
      </main>

      {selectedProduct && (
        <FichaProducto
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onReportar={() => setMostrarReportar(true)}
          onIrPerfilVendedor={() => navigate("/profile")}
        />
      )}

      {mostrarReportar && (
        <Reportar onClose={() => setMostrarReportar(false)} />
      )}
    </div>
  );
};

export default Hero;