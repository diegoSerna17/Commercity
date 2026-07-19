

// JS Importaciones de hooks, Link y componente Navbar
import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import SeguidoresModal from "../../components/SeguidoresModal";
import AgregarProducto from "../../components/AgregarProducto";
import {
  formatSocialCount,
  perfilVendedorSocial,
} from "../../data/perfilVendedorSocial";

// JS Datos estaticos de productos con nombre, precio e imagen
const PRODUCTS = [
  {
    id: 1,
    nombre: "Bolso Boutique",
    imagen:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB4oZRsMghLMKea-NouRkrJ6HbT1qfmPEHTIGExDvHkiGL1mL7kj5WZKgxnaf_iC7lD-g-je7EMXWWoEaeNlvIt9CYKspmzAJ6cLMb9uYjglxuIq06KjT0qYAURYY0QALJTxpk7ituRzgUE46RUo2R6KNKmTEWe2fXkRdm6lJw7L-voc-4BhJ7DzHUvAF9y6SUzrDw0ZvOkF7RiNXwy0ker7EPS_S91_PMg6PUHSI1Z7gOr6LkAnUqxTQBSbJOE7qScObG4IUj3lg",
    descuento: "-10%",
    precioOriginal: "$138.880",
    precioFinal: "$125.000",
  },
  {
    id: 2,
    nombre: "Cuadro Decorativo Minimalista",
    imagen: null,
    descuento: null,
    precioOriginal: null,
    precioFinal: "$29.000",
    placeholder: "CONOCIMIENTO QUE CREACION\nSAFE WORK",
  },
  {
    id: 3,
    nombre: "Cuadro Decorativo",
    imagen:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDDIge-HzhTMp0MelClTxZlUKkPzJpWrehwhpRXdR3xcASwWXFuoUa6sKCd9Op0seyPlIFNMzPT4zrXWfpaRKIHn2oPDowtAPZeZTqp_atrQt9yLNOxmmfn4L_Tl0msMXcKxUiforo_7Os3GjabmpntMg2fYkNhb8BD2DJt0G2ytOsGyEeZ9b_6XpR_qwgk0Nd1FvQJf6j3uzNWd1PJFJpF7FHePcUZI8Kq8TlkGERN0qIh1o9PzGA4s1ruWlkysKVuq_Q0IJ6NWA",
    descuento: "-25%",
    precioOriginal: "$6.000",
    precioFinal: "$25.000",
  },
  {
    id: 4,
    nombre: "Bascula de Oro",
    imagen:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDcLpnMyyRAc1jkoAbO2UL04wJ9PdlxqH7norpstv2mt_rIYP3RrkQY0icrePuNZ1X-mL_h5dnDz1OqKWfOF20oD7QNz8IAotYcFLTQUrHtQg2dal0LIwqc1E0XX7cvK5DUxOMlAVYNdqdZFzEO7-rvXnzBL9DdFOCFQvTp4TDJVH38ZfboJe93Z-1t9HYqtllvVFkLGWdGj4nuJCEHgh_fnTA9yNlsMDcS_RJpa1kD_e3eP9SEwBlhjggVngalld_wIdKs90LQ_A",
    descuento: "-20%",
    precioOriginal: "$4.000",
    precioFinal: "$40.000",
  },
  {
    id: 5,
    nombre: "Bascula de Oro",
    imagen:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBc8DxjfR7opjw29-Ff-uF4-nvGNtvso8O9sLvpvDsrqK553orZUDrqkh_S9DOkU30Ow7RoMVyHBPPNfvpa5PyuKg0ds4EFZMFAdhGz9WwKs5DLo3yH1TeaStTQTcpWTldFRkUuoI4tqyySvkwST5AD_HgiEVDtIN8HOJJ79h2Mwa5v-dwJxryNY-vMjKt-CydMqcw8CroOgk0TJKB6q9auxFIULcXPXepcU0JMrArQFV3gdlAUP8ybviPXcYGQ9IQ-3AJVNOapcw",
    descuento: "-20%",
    precioOriginal: "$4.000",
    precioFinal: "$40.000",
  },
  {
    id: 6,
    nombre: "Cuadro Decorativo",
    imagen:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuACHt8YoVh1lbkaDgxguiYHzSTzrfS8j1c_uEguBePHoEamag0wP3U8BUXzCIs6zGR8AUJjVITZGoiZm_q-2lXzqwi4iSzlZMDHxE60Ur9G56jJR8A0RbRIEqx1TkkDTtbhQ8NukWYEPIMtr0Cd2OVRHzgPtnff_YeU_W8BoSDomIf-t4mK9wDuAPsjQ9m7FQbDTF8Oh0SR8HOpSG9P5B29fVvdZYOsE7M_rgiIGVKQ4zgGRYygDGCNJcJj90zvmVaJL_XvROC2uQ",
    descuento: "-25%",
    precioOriginal: "$6.000",
    precioFinal: "$25.000",
  },
];

// JS Configuracion de pestanas para alternar entre vistas
const TABS = [
  { label: "Mi Feed", icon: "grid" },
  { label: "Mis Productos", icon: "package" },
];

const PerfilVendedor = () => {
  // RE Estado para la pestana activa actual
  const [activeTab, setActiveTab] = useState("Mis Productos");
  const [socialTab, setSocialTab] = useState(null);
  const [mostrarAgregarProducto, setMostrarAgregarProducto] = useState(false);

  return (
    <div className="flex h-screen bg-surface-container-lowest">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title="Perfil" />

        {/* TW Contenido principal del perfil */}
        <section className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* TW Encabezado del perfil con avatar, informacion y acciones */}
            <section className="bg-gradient-to-b from-brand-orange/[0.05] to-transparent rounded-hero p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-24 h-24 md:w-40 md:h-40 bg-brand-orange rounded-full flex items-center justify-center text-4xl md:text-6xl font-bold text-auth-card-bg">
                    J
                  </div>
                  <button className="absolute bottom-2 right-2 bg-surface-container p-2 rounded-full border border-border-subtle shadow-lg text-on-surface/70 hover:text-on-surface">
                    <svg
                      fill="none"
                      height="18"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="18"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>
                </div>

                {/* TW Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <h2 className="text-3xl font-bold text-on-surface">
                      juan_giraldo
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 md:gap-4">
                    <Link
                      to="/messages"
                      className="bg-brand-orange text-auth-card-bg px-4 py-2 md:px-5 md:py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition"
                    >
                      <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                      </svg>
                      Mensajes
                    </Link>
                    <button
                      onClick={() => setMostrarAgregarProducto(true)}
                      className="bg-brand-orange text-auth-card-bg px-4 py-2 md:px-5 md:py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition"
                    >
                      <svg fill="none" height="16" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" width="16">
                        <line x1="12" x2="12" y1="5" y2="19" />
                        <line x1="5" x2="19" y1="12" y2="12" />
                      </svg>
                      Agregar
                    </button>
                  </div>
                  </div>

                  {/* TW Rating */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-brand-orange">
                        ★
                      </span>
                    ))}
                  </div>

                  {/* TW Stats */}
<div className="flex gap-4 md:gap-8 mb-6">
                    <button
                      type="button"
                      onClick={() => setSocialTab("seguidores")}
                      className="text-left rounded-card px-2 py-1 -ml-2 transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-border-focus"
                    >
                      <p className="text-lg md:text-xl font-bold text-on-surface">
                        {formatSocialCount(perfilVendedorSocial.seguidores.length)}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-app-text-muted font-semibold">
                        Seguidores
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSocialTab("siguiendo")}
                      className="text-left rounded-card px-2 py-1 -ml-2 transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-border-focus"
                    >
                      <p className="text-lg md:text-xl font-bold text-on-surface">
                        {formatSocialCount(perfilVendedorSocial.siguiendo.length)}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-app-text-muted font-semibold">
                        Seguidos
                      </p>
                    </button>
                  </div>

                  {/* TW Bio */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-on-surface">Juan Giraldo</h3>
                    <p className="text-app-text-muted text-sm leading-relaxed">
                      Me gusta encontrar productos de buena calidad y apoyar
                      tiendas con excelente atención. Siempre busco compras con
                      buenas recomendaciones.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* TW Mapeo de pestanas a botones de navegacion */}
            <nav className="bg-auth-card-bg rounded-xl p-1 flex">
              {TABS.map((tab) => {
                const active = tab.label === activeTab;
                return (
                  <button
                    key={tab.label}
                    onClick={() => setActiveTab(tab.label)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
                      active
                        ? "bg-surface-container text-brand-orange shadow-sm"
                        : "text-app-text-muted hover:text-on-surface"
                    }`}
                  >
                    {tab.label === "Mi Feed" ? (
                      <svg
                        fill="none"
                        height="18"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="18"
                      >
                        <rect height="7" width="7" x="3" y="3" />
                        <rect height="7" width="7" x="14" y="3" />
                        <rect height="7" width="7" x="14" y="14" />
                        <rect height="7" width="7" x="3" y="14" />
                      </svg>
                    ) : (
                      <svg
                        fill="none"
                        height="18"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="18"
                      >
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                        <path d="M3 6h18" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                    )}
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* TW Grilla de productos con imagenes, descuentos y precios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {PRODUCTS.map((p) => (
                <article
                  key={p.id}
                  className="bg-auth-card-bg rounded-hero overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                >
                  <div className="relative aspect-square">
                    {/* TW Renderizado condicional: imagen del producto o placeholder con gradiente */}
                    {p.imagen ? (
                      <img
                        alt={p.nombre}
                        className="w-full h-full object-cover"
                        src={p.imagen}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-[#333333] to-[#111111] flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-[6px] text-white/40 tracking-[0.2em] mb-1">
                            CONOCIMIENTO QUE CREACION
                          </p>
                          <p className="text-lg font-bold tracking-widest text-on-surface">
                            SAFE WORK
                          </p>
                        </div>
                      </div>
                    )}

                    {/* TW Renderizado condicional del badge de descuento */}
                    {p.descuento && (
                      <div className="absolute top-4 left-4 bg-app-badge text-[10px] font-bold px-2 py-1 rounded-full text-white">
                        {p.descuento}
                      </div>
                    )}

                    <button className="absolute top-4 right-4 bg-white text-app-badge p-1.5 rounded-full shadow-lg hover:opacity-90 transition">
                      <svg
                        fill="none"
                        height="14"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                        width="14"
                      >
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-5">
                    <h4 className="font-semibold text-on-surface mb-1">
                      {p.nombre}
                    </h4>
                    {p.precioOriginal && (
                      <p className="text-app-text-muted text-xs line-through">
                        {p.precioOriginal}
                      </p>
                    )}
                    <p className="text-brand-orange font-bold text-lg">
                      {p.precioFinal}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        </main>

{socialTab && (
          <SeguidoresModal
            datos={perfilVendedorSocial}
            initialTab={socialTab}
            onClose={() => setSocialTab(null)}
          />
        )}

        {mostrarAgregarProducto && (
          <AgregarProducto
            onCancel={() => setMostrarAgregarProducto(false)}
            onSubmit={async (formData) => {
              console.log("Producto a enviar:", formData);
              setMostrarAgregarProducto(false);
            }}
          />
        )}
      </div>
  );
};

export default PerfilVendedor;
