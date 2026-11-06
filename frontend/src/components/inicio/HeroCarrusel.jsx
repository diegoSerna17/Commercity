import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, EffectFade } from "swiper/modules";
import { heroSlides } from "../../data/heroSlides.js";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

/**
 * Carrusel de bienvenida de la pagina de inicio: imagen, etiqueta, titulo,
 * descripcion y boton que lleva al catalogo.
 */
export default function HeroCarrusel() {
  return (
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
                      color: "white",
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
  );
}
