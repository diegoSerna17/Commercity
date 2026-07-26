import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, EffectFade } from "swiper/modules";
import FichaProducto from "../../components/inicio/FichaProducto";
import Header from "../../components/globales/Header";
import Reportar from "../../components/inicio/Reportar";

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

const productsData = [
  {
    id: 1,
    name: "Zapatillas Urban Red",
    category: "Calzado",
    originalPrice: 138890,
    price: 125000,
    precioBase: 138890,
    descuento: 10,
    stock: 45,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop",
    imageAlt: "Zapatillas urbanas rojas",
    description: "Zapatillas de alto rendimiento con amortiguacion avanzada. Ideales para uso diario, entrenamientos y recorridos urbanos con suela antideslizante.",
    vendedorId: "juan_giraldo",
    vendedorNombre: "Juan_Giraldo",
    vendedorAvatar: "https://ui-avatars.com/api/?name=Juan+Giraldo&background=1a1a26&color=fff&bold=true&size=80&rounded=true",
    badge: "-10%",
    badgeBg: "bg-figma-accent-blue",
  },
  {
    id: 2,
    name: "Auriculares Studio Pro",
    category: "Tecnologia",
    originalPrice: null,
    price: 299000,
    precioBase: 299000,
    descuento: 0,
    stock: 18,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&auto=format&fit=crop",
    imageAlt: "Auriculares de estudio",
    description: "Auriculares premium con sonido envolvente, cancelacion pasiva de ruido y almohadillas comodas para sesiones largas.",
    vendedorId: "juan_giraldo",
    vendedorNombre: "Juan_Giraldo",
    vendedorAvatar: "https://ui-avatars.com/api/?name=Juan+Giraldo&background=1a1a26&color=fff&bold=true&size=80&rounded=true",
    badge: null,
    badgeBg: null,
  },
  {
    id: 3,
    name: "Calzado Heritage High",
    category: "Calzado",
    originalPrice: 126670,
    price: 95000,
    precioBase: 126670,
    descuento: 25,
    stock: 22,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=900&auto=format&fit=crop",
    imageAlt: "Calzado heritage high",
    description: "Tenis altos con diseño clasico, costuras reforzadas y plantilla suave para combinar estilo urbano con comodidad.",
    vendedorId: "juan_giraldo",
    vendedorNombre: "Juan_Giraldo",
    vendedorAvatar: "https://ui-avatars.com/api/?name=Juan+Giraldo&background=1a1a26&color=fff&bold=true&size=80&rounded=true",
    badge: "-25%",
    badgeBg: "bg-figma-accent-blue",
  },
  {
    id: 4,
    name: "Mochila City Stealth",
    category: "Accesorios",
    originalPrice: 83160,
    price: 79000,
    precioBase: 83160,
    descuento: 5,
    stock: 31,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&auto=format&fit=crop",
    imageAlt: "Mochila negra urbana",
    description: "Mochila urbana resistente al uso diario, con compartimentos internos para portatil, accesorios y objetos personales.",
    vendedorId: "juan_giraldo",
    vendedorNombre: "Juan_Giraldo",
    vendedorAvatar: "https://ui-avatars.com/api/?name=Juan+Giraldo&background=1a1a26&color=fff&bold=true&size=80&rounded=true",
    badge: "-5%",
    badgeBg: "bg-figma-accent-blue",
  },
  {
    id: 5,
    name: "Reloj Elitist Gold",
    category: "Accesorios",
    originalPrice: null,
    price: 345000,
    precioBase: 345000,
    descuento: 0,
    stock: 9,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&auto=format&fit=crop",
    imageAlt: "Reloj dorado elegante",
    description: "Reloj elegante con acabado dorado, correa resistente y un diseno minimalista para ocasiones casuales o formales.",
    vendedorId: "juan_giraldo",
    vendedorNombre: "Juan_Giraldo",
    vendedorAvatar: "https://ui-avatars.com/api/?name=Juan+Giraldo&background=1a1a26&color=fff&bold=true&size=80&rounded=true",
    badge: null,
    badgeBg: null,
  },
  {
    id: 6,
    name: "Set Botánico Urban",
    category: "Hogar",
    originalPrice: 56250,
    price: 45000,
    precioBase: 56250,
    descuento: 20,
    stock: 16,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=900&auto=format&fit=crop",
    imageAlt: "Set botanico urbano",
    description: "Set decorativo botanico para interiores con macetas compactas, ideal para escritorios, salas y espacios pequenos.",
    vendedorId: "juan_giraldo",
    vendedorNombre: "Juan_Giraldo",
    vendedorAvatar: "https://ui-avatars.com/api/?name=Juan+Giraldo&background=1a1a26&color=fff&bold=true&size=80&rounded=true",
    badge: "-20%",
    badgeBg: "bg-figma-accent-blue",
  },
];

const Hero = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mostrarReportar, setMostrarReportar] = useState(false);

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
            {productsData.map((product) => (
              <article
                key={product.name}
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
                    {product.originalPrice && (
                      <span
                        className="text-sm font-medium line-through"
                        style={{ color: "var(--color-brand-muted-text)" }}
                      >
                        ${product.originalPrice.toLocaleString("es-CO")}
                      </span>
                    )}
                    <span
                      className="text-lg lg:text-xl font-bold"
                      style={{ color: "var(--color-brand-orange)" }}
                    >
                      ${product.price.toLocaleString("es-CO")}
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

          <div className="flex justify-center mt-8 sm:hidden">
            <button
              className="px-6 py-2.5 rounded-full text-sm font-semibold transition-colors"
              style={{
                border: "1px solid var(--color-border-subtle)",
                color: "var(--color-brand-orange)",
              }}
            >
              Ver todos los productos
            </button>
          </div>
        </section>

        {/* Loading */}
        <div className="flex flex-col items-center justify-center gap-4 px-4 pb-16 md:pb-20">
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
            Cargando más piezas...
          </span>
          <div
            className="w-32 h-1 rounded-full overflow-hidden"
            style={{
              backgroundColor: "var(--color-surface-container-high)",
            }}
            role="progressbar"
            aria-valuenow={33}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="w-1/3 h-full rounded-full animate-pulse"
              style={{ backgroundColor: "var(--color-brand-orange)" }}
            />
          </div>
        </div>
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