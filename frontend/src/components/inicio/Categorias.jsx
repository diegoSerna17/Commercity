import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { listarCategorias } from "../../services/productos.service.js";

/**
 * Selector de categorias (RF88: filtro por categoria del catalogo).
 * Ahora es una ventana/desplegable estilo header en lugar de una fila de pills:
 * un boton que abre un panel con "Todos" y cada categoria. Seleccionar navega a
 * /?categoria=...; "Todos" limpia el filtro.
 */
export default function Categorias() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoriaActiva = searchParams.get("categoria") || "";

  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    let activo = true;
    listarCategorias()
      .then((res) => {
        if (activo) setCategorias(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {
        if (activo) setCategorias([]);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const seleccionar = (nombre) => {
    setAbierto(false);
    navigate(nombre ? `/?categoria=${encodeURIComponent(nombre)}` : "/");
  };

  if (cargando) return null;
  if (categorias.length === 0) return null;

  return (
    <div
      ref={contenedorRef}
      className="relative px-4 sm:px-6 md:px-padding-lg lg:px-padding-xl pb-4 md:pb-6"
    >
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
        style={{
          backgroundColor: categoriaActiva
            ? "var(--color-brand-orange)"
            : "var(--color-auth-card-bg)",
          color: categoriaActiva
            ? "var(--color-auth-card-bg)"
            : "var(--color-on-surface)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        {categoriaActiva || "Categorías"}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${abierto ? "rotate-180" : ""}`}
        />
      </button>

      {abierto && (
        <div className="absolute left-4 sm:left-6 md:left-10 top-full mt-2 z-50 w-[240px] rounded-2xl border border-figma-divider bg-auth-card-bg shadow-2xl overflow-hidden max-h-[360px] overflow-y-auto">
          <button
            type="button"
            onClick={() => seleccionar("")}
            className="w-full text-left px-4 py-3 text-sm font-semibold transition-colors hover:bg-surface-container"
            style={{
              color: !categoriaActiva
                ? "var(--color-brand-orange)"
                : "var(--color-on-surface)",
            }}
          >
            Todos
          </button>

          {categorias.map((cat) => {
            const activa = categoriaActiva === cat.nombre;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => seleccionar(cat.nombre)}
                className="w-full text-left px-4 py-3 text-sm font-semibold transition-colors hover:bg-surface-container"
                style={{
                  color: activa
                    ? "var(--color-brand-orange)"
                    : "var(--color-on-surface)",
                }}
              >
                {cat.nombre}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
