import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";

import { formatSocialCount } from "../data/perfilVendedorSocial";

function Avatar({ usuario }) {
  if (usuario.avatar) {
    return (
      <img
        src={usuario.avatar}
        alt={usuario.nombre}
        className="w-12 h-12 rounded-full object-cover shrink-0"
      />
    );
  }

  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
      style={{ backgroundColor: usuario.color }}
    >
      {usuario.inicial}
    </div>
  );
}

export default function SeguidoresModal({ datos, initialTab = "seguidores", onClose }) {
  const [tabActiva, setTabActiva] = useState(initialTab);
  const [busqueda, setBusqueda] = useState("");
  const buscadorRef = useRef(null);

  useEffect(() => {
    document.body.classList.add("overflow-hidden");
    const timer = setTimeout(() => buscadorRef.current?.focus(), 100);

    function manejarEscape(event) {
      if (event.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", manejarEscape);

    return () => {
      document.body.classList.remove("overflow-hidden");
      document.removeEventListener("keydown", manejarEscape);
      clearTimeout(timer);
    };
  }, [onClose]);

  const fuente = tabActiva === "seguidores" ? datos.seguidores : datos.siguiendo;
  const busquedaNormalizada = busqueda.trim().toLowerCase();
  const filtrados = fuente.filter(
    (usuario) =>
      usuario.nombre.toLowerCase().includes(busquedaNormalizada) ||
      usuario.usuario.toLowerCase().includes(busquedaNormalizada)
  );

  function cambiarTab(tab) {
    setTabActiva(tab);
    setBusqueda("");
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative flex max-h-[90vh] w-full max-w-[520px] flex-col overflow-hidden rounded-card-lg border border-figma-divider bg-auth-card-bg shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="seguidores-title"
        >
          <div className="flex items-center justify-between border-b border-figma-divider px-padding-lg py-4 shrink-0">
            <span className="w-8" />
            <h2 id="seguidores-title" className="text-headline-sm font-bold text-brand-orange">
              {datos.usuario}
            </h2>
            <button
              onClick={() => onClose?.()}
              className="flex h-8 w-8 items-center justify-center rounded-full text-brand-muted-text transition hover:bg-surface-container hover:text-on-surface"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex border-b border-figma-divider shrink-0">
            <button
              onClick={() => cambiarTab("seguidores")}
              className={`flex-1 border-b-2 py-3 text-body-sm font-bold transition-colors ${
                tabActiva === "seguidores"
                  ? "border-brand-orange text-on-surface"
                  : "border-transparent text-brand-muted-text hover:text-on-surface"
              }`}
            >
              Seguidores {formatSocialCount(datos.seguidores.length)}
            </button>
            <button
              onClick={() => cambiarTab("siguiendo")}
              className={`flex-1 border-b-2 py-3 text-body-sm font-bold transition-colors ${
                tabActiva === "siguiendo"
                  ? "border-brand-orange text-on-surface"
                  : "border-transparent text-brand-muted-text hover:text-on-surface"
              }`}
            >
              Siguiendo {formatSocialCount(datos.siguiendo.length)}
            </button>
          </div>

          <div className="px-padding-md pt-padding-md pb-padding-xs shrink-0">
            <label className="relative block">
              <span className="sr-only">Buscar usuario</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted-text" />
              <input
                ref={buscadorRef}
                type="text"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-card border border-figma-divider bg-surface-container/70 py-2.5 pl-9 pr-4 text-body-sm text-on-surface outline-none placeholder:text-brand-muted-text focus:border-border-focus focus:ring-1 focus:ring-border-focus"
              />
            </label>
          </div>

          {filtrados.length === 0 ? (
            <p className="px-padding-lg py-padding-2xl text-center text-body-sm text-brand-muted-text">
              Sin resultados para tu busqueda
            </p>
          ) : (
            <ul className="min-h-[160px] flex-1 overflow-y-auto px-padding-sm py-padding-xs" role="list">
              {filtrados.map((usuario) => (
                <li
                  key={usuario.id}
                  className="flex cursor-pointer items-center gap-3 rounded-card px-padding-sm py-2.5 transition-colors hover:bg-white/5"
                  role="listitem"
                >
                  <Avatar usuario={usuario} />
                  <div className="min-w-0">
                    <span className="block truncate text-body-md font-bold text-on-surface">
                      {usuario.nombre}
                    </span>
                    <span className="block truncate text-body-sm text-brand-muted-text">
                      @{usuario.usuario}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
