// RE Titulo: Hero - Pagina principal y dashboard MVP de CommerCity
//
// RE Implementacion React: useState para controlar apertura del sidebar
// RE en mobile, useNavigate para navegacion programatica
//
// JS Codigo y componentes: renderiza Navbar como sidebar, header sticky con
// JS busqueda y notificaciones, banner hero con gradiente y CTAs, grilla de
// JS planes con datos estaticos en PLANS, y paginacion con barra de progreso
//
// TW Clases Tailwind: tokens personalizados como bg-surface-container-lowest,
// TW bg-auth-card-bg, text-brand-orange, rounded-hero. Layout flex con
// TW sidebar fijo y main scrollable. Efectos backdrop-blur en header sticky,
// TW grid responsive para planes, overlay con bg-gradient-to-r

// JS Importaciones de hooks, Navbar e iconos para el dashboard
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import {
  Menu,
  Search,
  Bell,
  User,
  ChevronDown,
} from "lucide-react";

// JS Datos estaticos de productos e-commerce
const productsData = [
  {
    name: "Zapatillas Urban Red",
    originalPrice: 138890,
    price: 125000,
    badge: "-10%",
    badgeBg: "bg-figma-accent-blue",
  },
  {
    name: "Auriculares Studio Pro",
    originalPrice: null,
    price: 299000,
    badge: null,
    badgeBg: null,
  },
  {
    name: "Calzado Heritage High",
    originalPrice: 126670,
    price: 95000,
    badge: "-25%",
    badgeBg: "bg-figma-accent-blue",
  },
  {
    name: "Mochila City Stealth",
    originalPrice: 83160,
    price: 79000,
    badge: "-5%",
    badgeBg: "bg-figma-accent-blue",
  },
  {
    name: "Reloj Elitist Gold",
    originalPrice: null,
    price: 345000,
    badge: null,
    badgeBg: null,
  },
  {
    name: "Set Botánico Urban",
    originalPrice: 56250,
    price: 45000,
    badge: "-20%",
    badgeBg: "bg-figma-accent-blue",
  },
];


const Hero = () => {
  // RE Hook para navegacion desde botones del dashboard
  const navigate = useNavigate();
  // RE Estado para controlar apertura y cierre del sidebar en mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-hidden bg-surface-container-lowest font-sans">
      {/* TW Renderizado del sidebar de navegacion con estado controlado */}
      <Navbar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* TW Overlay semitransparente que cierra el sidebar al hacer clic */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* TW Contenido principal de la pagina */}
      <main className="flex-grow h-dvh overflow-y-auto relative">
        {/* TW Encabezado sticky con breadcrumb, busqueda y notificaciones */}
        <header className="sticky top-0 z-10 bg-surface-container-lowest/60 backdrop-blur-lg border-b border-figma-divider h-[68px] flex items-center justify-between px-padding-xl">
          {/* TW Categorías dropdown + menu hamburguesa mobile */}
          <div className="flex items-center gap-md">
            <button
              className="lg:hidden p-2 -ml-2 text-brand-muted-text hover:text-on-surface transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
            <nav aria-label="Menú de categorías">
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded="false"
                className="flex items-center gap-1.5 bg-transparent border-none text-brand-muted-text text-body-sm font-medium hover:text-on-surface transition-colors"
              >
                Categorías
                <ChevronDown size={16} className="transition-transform" />
              </button>
            </nav>
          </div>

          {/* TW Acciones derecha: busqueda + notificaciones + perfil */}
          <div className="flex items-center gap-lg flex-1 justify-end">
            {/* TW Campo de busqueda */}
            <div className="relative hidden  sm:block flex-1 max-w-[300px]" role="search">
              <label htmlFor="search-input" className="sr-only">Buscar productos</label>
              <input
                id="search-input"
                className="bg-figma-input-bg border border-figma-divider/60 rounded-button py-[9px] pl-10 pr-4 text-body-sm w-full text-figma-text-primary placeholder-figma-text-search outline-none transition-colors focus:bg-figma-input-bg-focus"
                placeholder="Buscar productos..."
                type="search"
                autoComplete="off"
              />
              <Search
                size={15}
                className="text-figma-search-icon absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>

            {/* TW Iconos */}
            <div className="flex items-center gap-md text-brand-muted-text shrink-0">
              <button className="hover:text-on-surface transition-colors relative">
                <Bell size={24} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-accent-red rounded-full" />
              </button>
              <button
                className="hover:text-on-surface transition-colors"
                onClick={() => navigate("/login")}
              >
                <User size={24} />
              </button>
            </div>
          </div>
        </header>

        {/* TW Banner hero con imagen de fondo, gradiente y copy centrado estilo Figma */}
        <section className="p-padding-xl">
          <div className="relative w-full h-[552px] lg:h-[400px] md:h-[280px] sm:h-[220px] rounded-figma-card overflow-hidden shadow-2xl">
            <img
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAE0Uf2aJHJR6JmZTmDeaBo4MB_roFJRkzXT2fSstX1qItU8s3TCa1hWAtEB8AHoTTqo-9HN39bZlI3sfpBuqFG88d_p1ypbvLz6GSMezwEjlfmyBKn9yDyqblPuxKaM9_zY_CLnEhDn6uqW1cc7MMvOKsV6D0owc4yi5tS_l40BHL1wofZq5InnDgCJ72HwXFuJZDtFZqUPWhp3OwpYUTQSIcU1_SCPI071NpmpbW4Q5kI808pH4mqBSaUt_yVBtMnnm0PuENQjw"
            />
            {/* TW Overlay gradiente + copy */}
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest/90 via-surface-container-lowest/40 to-transparent">
              <div className="absolute left-12 top-1/2 -translate-y-1/2 max-w-[700px]">
                <h1 className="text-[72px] lg:text-[52px] md:text-[32px] sm:text-[26px] leading-none font-extrabold -tracking-[3.6px] text-figma-text-primary drop-shadow-lg mb-5">
                  Transforma tu estilo.<br />Eleva tu vida.
                </h1>
                <p className="text-body-lg leading-relaxed text-figma-text-primary max-w-[576px]">
                  CommerCity — Donde tus deseos se hacen realidad. Explora y encuentra lo que te define.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TW Mapeo de productos e-commerce estilo Figma */}
        <section className="px-padding-xl pb-16">
          <div className="flex items-center justify-end mb-8">
            <h2 className="text-headline-md font-extrabold text-on-surface" id="products-heading">
              Explora Novedades
            </h2>
          </div>
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            role="list"
            aria-labelledby="products-heading"
          >
            {productsData.map((product) => (
              <article
                key={product.name}
                className="bg-auth-card-bg rounded-2xl lg:rounded-figma-card overflow-hidden flex flex-col gap-2.5 lg:gap-4 p-2.5 lg:p-4 shadow-xl border border-figma-divider transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="relative rounded-[8px] lg:rounded-[6px] overflow-hidden bg-surface-container-high h-[130px] sm:h-[160px] lg:h-[260px] flex-shrink-0">
                  <div className="w-full h-full bg-surface-variant" />
                  {product.badge && (
                    <span
                      className={`absolute top-4 left-4 ${product.badgeBg} text-figma-text-primary text-[10px] font-medium px-2 py-1 rounded-full uppercase tracking-wider`}
                    >
                      {product.badge}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1 pt-4 pb-1">
                  <h3 className="text-body-sm lg:text-body-lg font-bold text-on-surface">
                    {product.name}
                  </h3>
                  <div className="flex flex-col">
                    {product.originalPrice && (
                      <span className="text-xs lg:text-body-sm font-medium text-figma-accent-blue/60 line-through">
                        ${product.originalPrice.toLocaleString("es-CO")}
                      </span>
                    )}
                    <span className="text-body-md lg:text-body-lg font-medium text-brand-orange">
                      ${product.price.toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* TW Indicador de carga con barra de progreso estilo Figma */}
        <div className="flex items-center justify-center gap-md px-padding-xl pt-2 pb-14">
          <span className="text-body-sm font-medium text-text-dim">
            Cargando más piezas...
          </span>
          <div
            className="w-12 h-1 bg-surface-container rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={33}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="w-1/3 h-full bg-figma-accent-blue rounded-full" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Hero;
