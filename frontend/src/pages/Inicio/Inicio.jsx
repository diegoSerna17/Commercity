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
import FichaProducto from "../../components/FichaProducto";
import Header from "../../components/Header";

// JS Datos estaticos de productos e-commerce
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
  // RE Hook para navegacion desde botones del dashboard
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);

return (
    <div className="flex min-h-screen md:min-h-0 overflow-hidden bg-surface-container-lowest font-sans">

      {/* TW Contenido principal de la pagina */}
      <main className="flex-grow h-dvh overflow-y-auto relative">
        {/* TW Encabezado sticky con breadcrumb, busqueda y notificaciones */}
        <Header showCategories={true} />

        {/* TW Banner hero con imagen de fondo, gradiente y copy centrado estilo Figma */}
        <section className="p-4 sm:p-6 md:p-padding-lg lg:p-padding-xl">
          <div className="relative w-full h-[260px] sm:h-[320px] md:h-[380px] lg:h-[450px] rounded-figma-card overflow-hidden shadow-2xl">
            <img
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAE0Uf2aJHJR6JmZTmDeaBo4MB_roFJRkzXT2fSstX1qItU8s3TCa1hWAtEB8AHoTTqo-9HN39bZlI3sfpBuqFG88d_p1ypbvLz6GSMezwEjlfmyBKn9yDyqblPuxKaM9_zY_CLnEhDn6uqW1cc7MMvOKsV6D0owc4yi5tS_l40BHL1wofZq5InnDgCJ72HwXFuJZDtFZqUPWhp3OwpYUTQSIcU1_SCPI071NpmpbW4Q5kI808pH4mqBSaUt_yVBtMnnm0PuENQjw"
            />
            {/* TW Overlay gradiente + copy */}
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest/90 via-surface-container-lowest/40 to-transparent">
              <div className="absolute left-4 sm:left-8 md:left-12 top-1/2 -translate-y-1/2 max-w-[90%] sm:max-w-[700px] pr-4">
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[52px] leading-tight font-extrabold -tracking-[1.2px] sm:-tracking-[2px] md:-tracking-[3px] lg:-tracking-[3.6px] text-figma-text-primary drop-shadow-lg mb-3 sm:mb-5">
                  Transforma tu estilo.<br />Eleva tu vida.
                </h1>
                <p className="text-sm sm:text-base md:text-body-lg leading-relaxed text-figma-text-primary max-w-[90%] sm:max-w-[576px]">
                  CommerCity — Donde tus deseos se hacen realidad. Explora y encuentra lo que te define.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TW Mapeo de productos e-commerce estilo Figma */}
        <section className="px-4 sm:px-6 md:px-padding-lg lg:px-padding-xl pb-12 md:pb-16">
          <div className="flex items-center justify-end mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-headline-md font-extrabold text-on-surface" id="products-heading">
              Explora Novedades
            </h2>
          </div>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
            role="list"
            aria-labelledby="products-heading"
          >
            {productsData.map((product) => (
              <article
                key={product.name}
                role="listitem"
                className="bg-auth-card-bg rounded-2xl lg:rounded-figma-card overflow-hidden flex flex-col gap-2.5 lg:gap-4 p-2.5 lg:p-4 shadow-xl border border-figma-divider transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl"
              >
                <button
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  className="text-left"
                  aria-label={`Ver ficha de ${product.name}`}
                >
                  <div className="relative rounded-[8px] lg:rounded-[6px] overflow-hidden bg-surface-container-high h-[160px] sm:h-[180px] md:h-[200px] lg:h-[260px] flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.imageAlt}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    {product.badge && (
                      <span
                        className={`absolute top-3 left-3 sm:top-4 sm:left-4 ${product.badgeBg} text-figma-text-primary text-[10px] font-medium px-2 py-1 rounded-full uppercase tracking-wider`}
                      >
                        {product.badge}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  className="flex flex-col gap-1 pt-3 lg:pt-4 pb-1 text-left"
                >
                  <h3 className="text-body-sm lg:text-body-lg font-bold text-on-surface line-clamp-2">
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
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* TW Indicador de carga con barra de progreso estilo Figma */}
        <div className="flex items-center justify-center gap-md px-4 sm:px-6 md:px-padding-xl pt-2 pb-10 md:pb-14">
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

      {selectedProduct && (
        <FichaProducto
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onReportar={() => alert("Producto reportado para revision.")}
          onIrPerfilVendedor={() => navigate("/profile")}
        />
      )}
    </div>
  );
};

export default Hero;
