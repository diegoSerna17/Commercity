import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Header from "../../components/globales/Header";
import { getCurrentUser } from "../../api/client.js";
import { API_BASE_URL } from "../../constants/config.js";
import {
  aplicarFallbackImagenProducto,
  replaceInvalidProductImage,
  resolverImagenRespaldoProducto,
} from "../../utils/productImageFallback.js";
import { listarProductos, listarVendedores } from "../../services/productos.service.js";
import {
  contarSeguidores,
  dejarDeSeguir,
  listarSiguiendo,
  seguirUsuario,
} from "../../services/seguidores.service.js";

// JS Avatar de respaldo cuando el vendedor no tiene foto de perfil.
const AVATAR_FALLBACK = "https://picsum.photos/seed/avatar1/400/400";

const STAR_PATH =
  "M2.86875 14.25L4.0875 8.98125L0 5.4375L5.4 4.96875L7.5 0L9.6 4.96875L15 5.4375L10.9125 8.98125L12.1313 14.25L7.5 11.4563L2.86875 14.25Z";

/**
 * Resuelve una ruta de archivo del backend a una URL absoluta.
 * @param {string|null|undefined} ruta
 * @returns {string|null}
 */
function resolverUrlArchivo(ruta) {
  if (!ruta) return null;
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return `${API_BASE_URL}${ruta}`;
}

/**
 * Imagen del producto: usa la del backend o una foto real de respaldo acorde
 * a la categoria del producto (estable por id).
 */
function resolverImagenProducto(imagenUrl, id, categoria) {
  return resolverUrlArchivo(imagenUrl) ?? resolverImagenRespaldoProducto(categoria, id);
}

// JS Avatar por defecto cuando el vendedor no tiene foto de perfil.
function resolverAvatar(vendedor) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    vendedor || "Vendedor"
  )}&background=1a1a26&color=fff&bold=true&size=80&rounded=true`;
}

/**
 * Traduce el producto del listado /api/productos al shape de la tarjeta.
 * Mismo mapeo que usa la pagina principal (Inicio.jsx) para reutilizar el
 * diseño y las animaciones de las tarjetas.
 */
function mapearProducto(producto) {
  const descuento = Number(producto.descuento_porcentaje) || 0;
  const precio = Number(producto.precio) || 0;

  return {
    id: producto.id,
    name: producto.nombre,
    category: producto.categoria,
    price: Math.round(precio),
    precioBase: Math.round(precio),
    descuento,
    stock: Number(producto.stock) || 0,
    image: resolverImagenProducto(producto.imagen, producto.id, producto.categoria),
    imageAlt: producto.nombre,
    description: producto.descripcion,
    vendedorId: producto.vendedor_id,
    vendedorNombre: producto.vendedor,
    vendedorAvatar: producto.vendedor_foto || resolverAvatar(producto.vendedor),
    badge: descuento > 0 ? `-${descuento}%` : null,
  };
}

// JS Precio final con el descuento aplicado (misma formula del backend).
function calcularPrecioFinal(producto) {
  if (!producto.descuento) return producto.price;
  return Math.round(producto.precioBase - (producto.precioBase * producto.descuento) / 100);
}

/**
 * Perfil publico de un vendedor (accesible desde el producto).
 * Misma estructura visual que PerfilVendedor, pero sin edicion: en lugar del
 * boton "Agregar Producto" muestra "Enviar mensaje" y lista los productos en
 * venta del vendedor con el mismo diseño/animaciones de la pagina principal.
 */
export default function PerfilPublico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const [vendedor, setVendedor] = useState({
    id: Number(id),
    nombre: state.nombre || "",
    avatar: resolverUrlArchivo(state.avatar) ?? AVATAR_FALLBACK,
  });
  const [productos, setProductos] = useState([]);
  const [contadores, setContadores] = useState({ seguidores: 0, siguiendo: 0 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [siguiendo, setSiguiendo] = useState(false);
  const [cargandoSeguimiento, setCargandoSeguimiento] = useState(false);

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      try {
        // Resuelve nombre/avatar del vendedor. Prioridad al state de navegacion;
        // si el usuario recarga la URL, se recupera desde /api/vendedores.
        let nombre = state.nombre || "";
        let avatar = resolverUrlArchivo(state.avatar) ?? AVATAR_FALLBACK;

        if (!nombre) {
          const res = await listarVendedores();
          const lista = Array.isArray(res?.data) ? res.data : [];
          const encontrado = lista.find((v) => Number(v.id) === Number(id));
          nombre = encontrado?.nombre || "Vendedor";
        }

        if (!activo) return;
        setVendedor({ id: Number(id), nombre, avatar });

        // Lista los productos en venta del vendedor (filtro por nombre).
        const resProductos = await listarProductos({ vendedor: nombre, limit: 100 });
        const data = resProductos?.data || {};
        if (!activo) return;
        setProductos((data.productos || []).map(mapearProducto));
      } catch (err) {
        if (!activo) return;
        setError(err.message || "No se pudo cargar el perfil del vendedor");
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargar();

    // Contadores de seguidores/seguidos (no bloquean la carga de productos).
    contarSeguidores(Number(id))
      .then((res) => {
        if (!activo) return;
        setContadores({
          seguidores: res?.data?.seguidores ?? 0,
          siguiendo: res?.data?.siguiendo ?? 0,
        });
      })
      .catch(() => {
        // silencio: si falla, los contadores quedan en 0
      });

    // Estado de seguimiento del usuario autenticado hacia este vendedor.
    listarSiguiendo()
      .then((res) => {
        if (!activo) return;
        const lista = Array.isArray(res?.data) ? res.data : [];
        setSiguiendo(lista.some((u) => Number(u.id) === Number(id)));
      })
      .catch(() => {
        // silencio: sin sesion o error, se muestra como no seguido
      });

    return () => {
      activo = false;
    };
  }, [id, state.nombre, state.avatar]);

  // Abre la conversacion con el vendedor (mismo flujo que Mensajes.jsx).
  const enviarMensaje = () => {
    const usuarioActual = getCurrentUser();
    if (!usuarioActual) {
      navigate("/login");
      return;
    }
    sessionStorage.setItem(
      "activeChat",
      JSON.stringify({
        id: vendedor.id,
        name: vendedor.nombre,
        avatar: vendedor.avatar || "",
      })
    );
    navigate("/messages/chat");
  };

  // Alterna entre seguir y dejar de seguir al vendedor (RF106).
  const alternarSeguimiento = async () => {
    const usuarioActual = getCurrentUser();
    if (!usuarioActual) {
      navigate("/login");
      return;
    }
    if (cargandoSeguimiento) return;

    setCargandoSeguimiento(true);
    try {
      if (siguiendo) {
        try {
          await dejarDeSeguir(vendedor.id);
        } catch (err) {
          if (err.status !== 404) throw err;
        }
        setSiguiendo(false);
        setContadores((prev) => ({
          ...prev,
          seguidores: Math.max(0, prev.seguidores - 1),
        }));
      } else {
        try {
          await seguirUsuario(vendedor.id);
        } catch (err) {
          if (err.status !== 409) throw err;
        }
        setSiguiendo(true);
        setContadores((prev) => ({
          ...prev,
          seguidores: prev.seguidores + 1,
        }));
      }
    } catch {
      // silencio: el boton conserva su estado previo
    } finally {
      setCargandoSeguimiento(false);
    }
  };

  return (
    <div
      className="flex-1 flex flex-col min-w-0 overflow-y-auto"
      style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
    >
      <Header title="Vendedor" showSearch={false} />

      <main
        className="flex-1 px-4 sm:px-6 lg:px-10 py-6 md:py-10 mx-auto w-full overflow-y-auto"
        style={{ maxWidth: "1200px" }}
      >
        {/* Profile Card */}
        <div
          className="rounded-3xl p-6 md:p-10 mb-8"
          style={{
            backgroundColor: "var(--color-auth-card-bg)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12">
            {/* Avatar */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div
                className="rounded-full overflow-hidden flex items-center justify-center"
                style={{
                  width: "176px",
                  height: "176px",
                  backgroundColor: "var(--color-surface-container-high)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <img
                  src={vendedor.avatar}
                  alt={`Avatar de ${vendedor.nombre}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = AVATAR_FALLBACK;
                  }}
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">
                <div className="space-y-3">
                  <h1
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 800,
                      fontSize: "32px",
                      letterSpacing: "-0.8px",
                      lineHeight: "38px",
                      color: "var(--color-on-surface)",
                    }}
                  >
                    {vendedor.nombre || "Vendedor"}
                  </h1>

                  <div className="flex items-center gap-[6px]">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="flex-shrink-0"
                        style={{ width: "18px", height: "17px" }}
                      >
                        <svg
                          viewBox="0 0 15 14.25"
                          fill="var(--color-brand-orange)"
                        >
                          <path d={STAR_PATH} />
                        </svg>
                      </div>
                    ))}
                    <span
                      className="ml-2 font-medium"
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 600,
                        fontSize: "13px",
                        lineHeight: "16px",
                        color: "var(--color-brand-muted-text)",
                      }}
                    >
                      5.0
                    </span>
                  </div>
                </div>

                {/* Accion principal: enviar mensaje (reemplaza Agregar Producto) */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={alternarSeguimiento}
                    disabled={cargandoSeguimiento}
                    className="flex items-center gap-2 rounded-full font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      padding: "10px 24px",
                      fontSize: "14px",
                      fontFamily: "var(--font-sans)",
                      backgroundColor: siguiendo
                        ? "transparent"
                        : "var(--color-brand-orange)",
                      color: siguiendo
                        ? "var(--color-brand-orange)"
                        : "var(--color-auth-card-bg)",
                      border: siguiendo
                        ? "1.5px solid var(--color-brand-orange)"
                        : "1.5px solid transparent",
                    }}
                  >
                    {siguiendo ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      </svg>
                    )}
                    {cargandoSeguimiento ? "Guardando..." : siguiendo ? "Siguiendo" : "Seguir"}
                  </button>

                  <button
                    onClick={enviarMensaje}
                    className="flex items-center gap-2.5 rounded-full font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
                    style={{
                      padding: "10px 24px",
                      fontSize: "14px",
                      backgroundColor: "var(--color-brand-orange)",
                      color: "var(--color-auth-card-bg)",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                    </svg>
                    Enviar mensaje
                  </button>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-10 mb-6">
                <div className="text-left">
                  <p
                    className="mb-0.5"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                      fontSize: "22px",
                      lineHeight: "28px",
                      color: "var(--color-on-surface)",
                    }}
                  >
                    {productos.length}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 500,
                      fontSize: "11px",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "var(--color-brand-muted-text)",
                    }}
                  >
                    Productos
                  </p>
                </div>

                <div className="text-left">
                  <p
                    className="mb-0.5"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                      fontSize: "22px",
                      lineHeight: "28px",
                      color: "var(--color-on-surface)",
                    }}
                  >
                    {contadores.seguidores}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 500,
                      fontSize: "11px",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "var(--color-brand-muted-text)",
                    }}
                  >
                    Seguidores
                  </p>
                </div>

                <div className="text-left">
                  <p
                    className="mb-0.5"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                      fontSize: "22px",
                      lineHeight: "28px",
                      color: "var(--color-on-surface)",
                    }}
                  >
                    {contadores.siguiendo}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 500,
                      fontSize: "11px",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "var(--color-brand-muted-text)",
                    }}
                  >
                    Seguidos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Titulo de la grilla de productos */}
        <h2
          className="mb-6 text-2xl font-extrabold tracking-tight"
          style={{ color: "var(--color-on-surface)" }}
        >
          Productos en venta
        </h2>

        {cargando && (
          <p
            className="py-10 text-center text-sm font-medium uppercase tracking-wide"
            style={{ color: "var(--color-brand-muted-text)" }}
          >
            Cargando productos...
          </p>
        )}

        {!cargando && error && (
          <p
            className="py-10 text-center text-sm font-semibold"
            style={{ color: "var(--color-error)" }}
          >
            {error}
          </p>
        )}

        {!cargando && !error && productos.length === 0 && (
          <p
            className="py-10 text-center text-sm"
            style={{ color: "var(--color-brand-muted-text)" }}
          >
            Este vendedor no tiene productos publicados por ahora.
          </p>
        )}

        {/* Product grid (mismo diseño y animaciones que la pagina principal) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-7 pb-10">
          {productos.map((product) => (
            <article
              key={product.id}
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

              <div className="relative h-[200px] sm:h-[220px] md:h-[260px] flex-shrink-0 overflow-hidden bg-surface-container-high">
                <img
                  src={product.image}
                  alt={product.imageAlt}
                  data-categoria={product.category}
                  data-product-id={product.id}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  onError={aplicarFallbackImagenProducto}
                  onLoad={replaceInvalidProductImage}
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

              <div className="flex flex-col gap-2 p-5 pt-4">
                <h3
                  className="text-base lg:text-lg font-bold line-clamp-2"
                  style={{ color: "var(--color-on-surface)" }}
                >
                  {product.name}
                </h3>

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
      </main>
    </div>
  );
}
