import { Bell, Search, User, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import NotificacionesDropdown from "./NotificacionesDropdown";

const Header = ({ title, showSearch = true, showCategories = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const notifRef = useRef(null);

  const displayTitle = title || (location.pathname === "/" ? "Inicio" : "");
  const isHome = location.pathname === "/";
  const shouldShowCategories = showCategories || isHome;

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileSearchOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-10 bg-surface-container-lowest/60 backdrop-blur-lg border-b border-figma-divider h-[68px] flex items-center justify-between px-4 sm:px-6 md:px-padding-xl gap-3">
      {/* TW Titulo o dropdown de categorias */}
      <div className="flex items-center gap-md min-w-0 flex-1 max-lg:justify-center">
        {mobileSearchOpen ? (
          <div className="relative w-full flex items-center sm:hidden" role="search">
            <label htmlFor="mobile-search-input" className="sr-only">Buscar productos</label>
            <input
              id="mobile-search-input"
              autoFocus
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
        ) : shouldShowCategories ? (
          <nav aria-label="Menú de categorías">
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded="false"
              className="flex items-center gap-1.5 bg-transparent border-none text-brand-muted-text text-body-sm font-medium hover:text-on-surface transition-colors"
            >
              Categorías
              <svg
                className="w-4 h-4 transition-transform"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </nav>
        ) : displayTitle ? (
          <span className="text-brand-muted-text border-b-2 border-primary-container pb-4 mt-4 text-sm sm:text-body-md truncate">
            {displayTitle}
          </span>
        ) : null}
      </div>

      {/* TW Acciones derecha: busqueda + notificaciones + perfil */}
      <div className="flex items-center gap-3 sm:gap-lg justify-end shrink-0">
        {/* TW Campo de busqueda desktop */}
        {showSearch && (
          <div className="relative hidden sm:block flex-1 max-w-[300px]" role="search">
            <label htmlFor="search-input" className="sr-only">Buscar productos</label>
            <input
              id="search-input"
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
              <span className="absolute top-0 right-0 w-2 h-2 bg-accent-red rounded-full" />
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 z-50">
                <NotificacionesDropdown />
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