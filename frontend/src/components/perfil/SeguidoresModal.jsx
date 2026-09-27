import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";

import { formatSocialCount } from "../../data/perfilVendedorSocial";
import { dejarDeSeguir, seguirUsuario } from "../../services/seguidores.service.js";

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

export default function SeguidoresModal({ datos, initialTab = "seguidores", onClose, onChanged }) {
  const [tabActiva, setTabActiva] = useState(initialTab);
  const [busqueda, setBusqueda] = useState("");
  // Estado por fila de la accion seguir / dejar de seguir: { cargando, siguiendo, error }
  const [acciones, setAcciones] = useState({});
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

  const listaSeguidores = datos?.seguidores ?? [];
  const listaSiguiendo = datos?.siguiendo ?? [];
  const fuente = tabActiva === "seguidores" ? listaSeguidores : listaSiguiendo;
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

  // En la pestana "siguiendo" el usuario ya lo sigue; en "seguidores" se asume
  // que aun no (la API no expone el estado de seguimiento en estas listas).
  function estaSiguiendo(usuario) {
    const estado = acciones[usuario.id];
    if (estado) return estado.siguiendo;
    return tabActiva === "siguiendo";
  }

  /**
   * Alterna el seguimiento contra la API (RF106).
   * El 409 de POST /api/seguidores significa "ya lo sigues": se refleja como
   * estado ya seguido, sin tratarlo como error. De igual forma, el 404 de
   * DELETE significa que ya no lo seguías.
   * @param {{id: number, nombre: string}} usuario
   */
  async function alternarSeguimiento(usuario) {
    const estadoActual = acciones[usuario.id];
    if (estadoActual?.cargando) return;

    const siguiendo = estaSiguiendo(usuario);
    setAcciones((previas) => ({
      ...previas,
      [usuario.id]: { siguiendo, cargando: true, error: "" },
    }));

    try {
      if (siguiendo) {
        try {
          await dejarDeSeguir(usuario.id);
        } catch (err) {
          // 404: ya no lo seguías, el estado deseado ya esta aplicado.
          if (err.status !== 404) throw err;
        }
        setAcciones((previas) => ({
          ...previas,
          [usuario.id]: { siguiendo: false, cargando: false, error: "" },
        }));
        onChanged?.();
      } else {
        try {
          await seguirUsuario(usuario.id);
        } catch (err) {
          // 409: ya seguías a este usuario, se refleja como seguido.
          if (err.status !== 409) throw err;
        }
        setAcciones((previas) => ({
          ...previas,
          [usuario.id]: { siguiendo: true, cargando: false, error: "" },
        }));
        onChanged?.();
      }
    } catch (err) {
      setAcciones((previas) => ({
        ...previas,
        [usuario.id]: {
          siguiendo,
          cargando: false,
          error: err.message || "No se pudo actualizar el seguimiento",
        },
      }));
    }
  }

  // MENSAJE Lista vacia segun la pestana activa (API real sin registros).
  const mensajeVacio =
    tabActiva === "seguidores"
      ? "Aun no tienes seguidores"
      : "Aun no sigues a ningun usuario";

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
              {datos?.usuario}
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
              Seguidores {formatSocialCount(listaSeguidores.length)}
            </button>
            <button
              onClick={() => cambiarTab("siguiendo")}
              className={`flex-1 border-b-2 py-3 text-body-sm font-bold transition-colors ${
                tabActiva === "siguiendo"
                  ? "border-brand-orange text-on-surface"
                  : "border-transparent text-brand-muted-text hover:text-on-surface"
              }`}
            >
              Siguiendo {formatSocialCount(listaSiguiendo.length)}
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

          {fuente.length === 0 ? (
            <p className="px-padding-lg py-padding-2xl text-center text-body-sm text-brand-muted-text">
              {mensajeVacio}
            </p>
          ) : filtrados.length === 0 ? (
            <p className="px-padding-lg py-padding-2xl text-center text-body-sm text-brand-muted-text">
              Sin resultados para tu busqueda
            </p>
          ) : (
            <ul className="min-h-[160px] flex-1 overflow-y-auto px-padding-sm py-padding-xs" role="list">
              {filtrados.map((usuario) => {
                const estadoFila = acciones[usuario.id];
                const siguiendo = estaSiguiendo(usuario);

                return (
                  <li
                    key={usuario.id}
                    className="flex cursor-pointer items-center gap-3 rounded-card px-padding-sm py-2.5 transition-colors hover:bg-white/5"
                    role="listitem"
                  >
                    <Avatar usuario={usuario} />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-body-md font-bold text-on-surface">
                        {usuario.nombre}
                      </span>
                      <span className="block truncate text-body-sm text-brand-muted-text">
                        {usuario.usuario}
                      </span>
                      {estadoFila?.error && (
                        <span className="block text-body-sm text-error">{estadoFila.error}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => alternarSeguimiento(usuario)}
                      disabled={Boolean(estadoFila?.cargando)}
                      className={`shrink-0 rounded-card border px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        siguiendo
                          ? "border-figma-divider bg-transparent text-brand-muted-text hover:bg-surface-container"
                          : "border-brand-orange bg-brand-orange text-brand-dark-text hover:opacity-90"
                      }`}
                    >
                      {estadoFila?.cargando
                        ? "Guardando..."
                        : siguiendo
                          ? "Dejar de seguir"
                          : "Seguir"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
