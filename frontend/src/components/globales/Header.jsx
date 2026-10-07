import { Bell, Search, User, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import NotificacionesDropdown from "./NotificacionesDropdown";
import { contarNoLeidas } from "../../services/notificaciones.service.js";
import { listarProductos } from "../../services/productos.service.js";
import { API_BASE_URL } from "../../constants/config.js";
import { resolverImagenRespaldoProducto } from "../../utils/productImageFallback.js";

function formatearPrecio(numero) {
  return `$${Math.round(numero).toLocaleString("es-CO")}`;
}

// JS Imagen de un resultado de busqueda: ruta del backend o foto de respaldo.
function resolverImagenResultado(imagen, categoria, id) {
  if (!imagen) return resolverImagenRespaldoProducto(categoria, id);
  if (/^https?:\/\//i.test(imagen)) return imagen;
  return `${API_BASE_URL}${imagen}`;
}

const Header = ({ title, showSearch = true, onSelectProduct }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  const notifRef = useRef(null);
  // JS Texto del buscador.
  const [busqueda, setBusqueda] = useState("");
  // JS Resultados de la busqueda en vivo (productos crudos de la API).
  const [resultados, setResultados] = useState([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const searchRef = useRef(null);

  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setMobileSearchOpen(false);
  }

  const cargarNoLeidas = useCallback(async () => {
    try {
      const res = await contarNoLeidas();
      setNoLeidas(res.data?.total_no_leidas ?? 0);
    } catch {
      // silencio
    }
  }, []);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const res = await contarNoLeidas();
        if (!cancelado) setNoLeidas(res.data?.total_no_leidas ?? 0);
      } catch {
        // silencio
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const displayTitle = title || (location.pathname === "/" ? "Inicio" : "");

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setMostrarResultados(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // JS Busqueda en vivo: consulta el catalogo por nombre mientras el usuario escribe.
  useEffect(() => {
    const q = busqueda.trim();
    if (!q) {
      setResultados([]);
      setMostrarResultados(false);
      setBuscando(false);
      return;
    }

    setBuscando(true);
    const timer = setTimeout(async () => {
      try {
        const res = await listarProductos({ nombre: q, limit: 8 });
        const data = res?.data || {};
        setResultados(data.productos || []);
        setMostrarResultados(true);
      } catch {
        setResultados([]);
        setMostrarResultados(true);
      } finally {
        setBuscando(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda]);

  // JS Navega a la pagina principal con el termino de busqueda como query param.
  const buscar = () => {
    const q = busqueda.trim();
    setMostrarResultados(false);
    navigate(q ? `/?busqueda=${encodeURIComponent(q)}` : "/");
  };

  // JS Abre el detalle del producto seleccionado desde la busqueda en vivo.
  const abrirResultado = (producto) => {
    setMostrarResultados(false);
    onSelectProduct?.(producto);
  };

  return (
    <header className="sticky top-0 z-10 bg-surface-container-lowest/60 backdrop-blur-lg border-b border-figma-divider h-[68px] flex items-center justify-between px-4 sm:px-6 md:px-padding-xl gap-3">
      {/* TW Titulo */}
      <div className="flex items-center gap-md min-w-0 flex-1 max-lg:justify-center">
        {mobileSearchOpen ? (
          <div className="relative w-full flex items-center sm:hidden" role="search">
            <label htmlFor="mobile-search-input" className="sr-only">Buscar productos</label>
            <input
              id="mobile-search-input"
              autoFocus
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") buscar();
              }}
              className="bg-figma-input-bg border border-figma-divider/60 rounded-button py-[9px] pl-10 pr-10 text-body-sm w-full text-figma-text-primary placeholder-figma-text-search outline-none transition-colors focus:bg-figma-input-bg-focus"
              placeholder="Buscar productos..."
              type="search"
              autoComplete="off"
            />
            <Search className="text-figma-search-icon absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none w-[15px] h-[15px]" />
            <button
              type="button"
              aria-label="Cerrar busqueda"
              onClick={() => setMobileSearchOpen(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-brand-muted-text hover:text-on-surface"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : displayTitle ? (
          <span className="text-brand-muted-text border-b-2 border-primary-container pb-4 mt-4 text-sm sm:text-body-md truncate">
            {displayTitle}
          </span>
        ) : null}
      </div>

      {/* TW Acciones derecha: busqueda + notificaciones + perfil */}
      <div className="flex items-center gap-3 sm:gap-lg justify-end shrink-0">
        {/* TW Campo de busqueda desktop (ventana larga) */}
        {showSearch && (
          <div
            ref={searchRef}
            className="relative hidden sm:block w-[320px] md:w-[440px] lg:w-[520px]"
            role="search"
          >
            <label htmlFor="search-input" className="sr-only">Buscar productos</label>
            <input
              id="search-input"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") buscar();
              }}
              onFocus={() => {
                if (busqueda.trim()) setMostrarResultados(true);
              }}
              className="bg-figma-input-bg border border-figma-divider/60 rounded-button py-[9px] pl-10 pr-4 text-body-sm w-full text-figma-text-primary placeholder-figma-text-search outline-none transition-colors focus:bg-figma-input-bg-focus"
              placeholder="Buscar productos..."
              type="search"
              autoComplete="off"
            />
            <svg
              className="text-figma-search-icon absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none w-[15px] h-[15px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            {mostrarResultados && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-figma-divider bg-auth-card-bg shadow-2xl overflow-hidden max-h-[420px] overflow-y-auto">
                {buscando && (
                  <p className="px-4 py-3 text-body-sm text-brand-muted-text">
                    Buscando...
                  </p>
                )}
                {!buscando && resultados.length === 0 && (
                  <p className="px-4 py-3 text-body-sm text-brand-muted-text">
                    Sin resultados para "{busqueda}"
                  </p>
                )}
                {!buscando &&
                  resultados.map((p) => {
                    const descuento = Number(p.descuento_porcentaje) || 0;
                    const precio = Number(p.precio) || 0;
                    const precioFinal = precio * (1 - descuento / 100);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => abrirResultado(p)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors hover:bg-surface-container"
                      >
                        <img
                          src={resolverImagenResultado(p.imagen, p.categoria, p.id)}
                          alt={p.nombre}
                          className="w-11 h-11 rounded-lg object-cover bg-surface-container-high shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm font-semibold text-on-surface truncate">
                            {p.nombre}
                          </p>
                          <p className="text-xs text-brand-muted-text truncate">
                            {p.vendedor}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {descuento > 0 && (
                            <p className="text-xs line-through text-brand-muted-text">
                              {formatearPrecio(precio)}
                            </p>
                          )}
                          <p className="text-body-sm font-bold text-brand-orange">
                            {formatearPrecio(precioFinal)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* TW Boton busqueda movil */}
        {showSearch && !mobileSearchOpen && (
          <button
            type="button"
            aria-label="Abrir busqueda"
            onClick={() => setMobileSearchOpen(true)}
            className="sm:hidden flex items-center justify-center text-brand-muted-text hover:text-on-surface transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        {/* TW Iconos */}
        <div className="flex items-center gap-3 sm:gap-md text-brand-muted-text shrink-0 relative">
          <div ref={notifRef} className="relative flex items-center">
            <button
              className="hover:text-on-surface transition-colors relative flex items-center justify-center"
              onClick={() => setShowNotifs(!showNotifs)}
              aria-label="Notificaciones"
            >
              <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              {noLeidas > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-accent-red text-white text-[10px] font-bold rounded-full">
                  {noLeidas > 99 ? "99+" : noLeidas}
                </span>
              ) : (
                <span className="absolute top-0 right-0 w-2 h-2 bg-accent-red rounded-full" />
              )}
            </button>
            {showNotifs && (
              <div className="fixed top-[68px] right-4 z-50 w-[calc(100vw-2rem)] max-w-[390px]">
                <NotificacionesDropdown onChange={cargarNoLeidas} />
              </div>
            )}
          </div>
          <button
            className="hover:text-on-surface transition-colors flex items-center justify-center"
            onClick={() => navigate("/login")}
            aria-label="Perfil"
          >
            <User className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
