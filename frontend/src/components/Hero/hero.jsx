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
  ChevronRight,
  ChevronLeft,
  Zap,
  Sparkles,
  Building2,
} from "lucide-react";

// JS Datos estaticos de planes con nombre, precio, badge e icono
const PLANS = [
  {
    name: "Zapato Básico",
    desc: "Optimiza tus procesos fundamentales con nuestra suite esencial de herramientas.",
    price: "19.00",
    badge: "Plan",
    badgeBg: "bg-accent-blue",
    Icon: Zap,
    iconClass: "text-accent-blue",
  },
  {
    name: "Auriculares Pro",
    desc: "Escalabilidad avanzada y soporte prioritario para empresas en rápido crecimiento.",
    price: "49.00",
    badge: "Populares",
    badgeBg: "bg-purple-600",
    Icon: Sparkles,
    iconClass: "text-purple-600",
  },
  {
    name: "Reloj Enterprise",
    desc: "Soluciones a medida, seguridad de grado bancario y consultoría dedicada.",
    price: "99.00",
    badge: "Premium",
    badgeBg: "bg-indigo-700",
    Icon: Building2,
    iconClass: "text-indigo-700",
  },
];

// JS Datos de paginacion con numeros y salto de omision
const PAGES = [1, 2, 3, "...", 10];

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
        <header className="sticky top-0 z-10 bg-surface-container-lowest/60 backdrop-blur-lg border-b border-surface-container h-[68px] flex items-center justify-between px-padding-xl">
          {/* TW Breadcrumb + menu hamburguesa mobile */}
          <div className="flex items-center gap-2 text-brand-muted-text text-body-sm">
            <button
              className="lg:hidden p-2 -ml-2 mr-1 text-brand-muted-text hover:text-on-surface transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <span>Plataforma</span>
            <ChevronRight size={16} />
            <span className="text-on-surface font-medium">Inicio MVP</span>
          </div>

          {/* TW Acciones derecha: busqueda + notificaciones + perfil */}
          <div className="flex items-center gap-lg">
            {/* TW Campo de busqueda */}
            <div className="relative hidden sm:block">
              <input
                className="bg-auth-card-bg border border-surface-container rounded-full py-1.5 pl-10 pr-4 text-body-sm focus:ring-1 focus:ring-brand-orange focus:border-brand-orange w-[256px] text-on-surface placeholder-brand-muted-text outline-none transition-colors"
                placeholder="Buscar..."
                type="text"
              />
              <Search
                size={16}
                className="text-brand-muted-text absolute left-4 top-1/2 -translate-y-1/2"
              />
            </div>

            {/* TW Iconos */}
            <div className="flex items-center gap-md text-brand-muted-text">
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

        {/* TW Banner hero con imagen de fondo, gradiente y llamados a la accion */}
        <section className="p-padding-xl">
          <div className="relative w-full h-[552px] rounded-hero overflow-hidden shadow-2xl">
            <img
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAE0Uf2aJHJR6JmZTmDeaBo4MB_roFJRkzXT2fSstX1qItU8s3TCa1hWAtEB8AHoTTqo-9HN39bZlI3sfpBuqFG88d_p1ypbvLz6GSMezwEjlfmyBKn9yDyqblPuxKaM9_zY_CLnEhDn6uqW1cc7MMvOKsV6D0owc4yi5tS_l40BHL1wofZq5InnDgCJ72HwXFuJZDtFZqUPWhp3OwpYUTQSIcU1_SCPI071NpmpbW4Q5kI808pH4mqBSaUt_yVBtMnnm0PuENQjw"
            />
            {/* TW Overlay gradiente */}
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest/90 via-surface-container-lowest/40 to-transparent flex flex-col justify-center px-8 lg:px-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <h1 className="text-[40px] lg:text-[56px] leading-tight font-bold text-on-surface drop-shadow-lg">
                  Transformando el Futuro con Tecnología
                </h1>
                <p className="text-headline-sm text-on-surface/90 leading-relaxed">
                  Explora soluciones de software de vanguardia adaptadas para
                  elevar tu negocio en la era digital.
                </p>
              </div>
              <div className="flex gap-md flex-wrap mt-8">
                <button className="bg-brand-orange hover:brightness-90 text-on-primary font-bold px-8 py-4 rounded-card transition-all shadow-lg">
                  Comenzar ahora
                </button>
                <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-on-surface font-semibold px-8 py-4 rounded-card transition-all border border-white/20">
                  Saber más
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* TW Mapeo de datos de planes a tarjetas de producto */}
        <section className="p-padding-xl grid grid-cols-1 md:grid-cols-3 gap-padding-xl">
          {PLANS.map((plan) => {
            const Icon = plan.Icon;
            return (
              <article
                key={plan.name}
                className="bg-auth-card-bg rounded-hero p-padding-xl shadow-xl border border-surface-container flex flex-col h-full min-h-[442px]"
              >
                {/* TW Cabecera grafica del plan */}
                <div className="w-full h-[220px] bg-surface-container-high rounded-card-lg mb-padding-xl relative overflow-hidden flex items-center justify-center">
                  <div
                    className={`absolute top-4 left-4 ${plan.badgeBg} text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider`}
                  >
                    {plan.badge}
                  </div>
                  <Icon size={96} className={plan.iconClass} />
                </div>

                <h2 className="text-headline-md font-bold mb-2 text-on-surface">
                  {plan.name}
                </h2>
                <p className="text-brand-muted-text mb-6 flex-grow">
                  {plan.desc}
                </p>

                <div className="flex items-baseline gap-xs mb-8">
                  <span className="text-3xl font-bold text-brand-orange">
                    ${plan.price}
                  </span>
                  <span className="text-brand-muted-text">/mes</span>
                </div>

                <button className="w-full py-4 bg-brand-orange hover:brightness-90 text-on-primary font-bold rounded-card transition-all uppercase tracking-wide text-body-sm">
                  Seleccionar Plan
                </button>
              </article>
            );
          })}
        </section>

        {/* TW Controles de paginacion y barra de progreso */}
        <div className="p-padding-xl flex flex-wrap justify-center items-center gap-md">
          <nav className="flex items-center gap-2 bg-auth-card-bg px-padding-md py-2 rounded-card-lg border border-surface-container">
            <button className="p-2 text-brand-muted-text hover:text-on-surface transition-colors">
              <ChevronLeft size={20} />
            </button>

            {PAGES.map((page, idx) =>
              page === "..." ? (
                <span key={idx} className="px-2 text-brand-muted-text">
                  ...
                </span>
              ) : (
                <button
                  key={idx}
                  className={`w-10 h-10 rounded-card transition-colors font-bold ${
                    page === 1
                      ? "bg-brand-orange text-on-primary"
                      : "hover:bg-white/5 text-brand-muted-text hover:text-on-surface"
                  }`}
                >
                  {page}
                </button>
              )
            )}

            <button className="p-2 text-brand-muted-text hover:text-on-surface transition-colors">
              <ChevronRight size={20} />
            </button>
          </nav>

          {/* TW Barra de progreso */}
          <div className="w-48 h-1.5 bg-auth-card-bg rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-brand-orange rounded-full" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Hero;
