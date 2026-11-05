import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { listarCalificacionesVendedor } from "../../services/calificaciones.service.js";

/** Calificaciones por pagina en el perfil publico. */
const POR_PAGINA = 5;

/**
 * Calificaciones recibidas por el vendedor (RF51): promedio y ultimos
 * comentarios. Si la API falla, la seccion no se muestra (no bloquea el perfil).
 */
export default function PerfilCalificaciones({ vendedorId }) {
  const [datos, setDatos] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargandoMas, setCargandoMas] = useState(false);

  useEffect(() => {
    let activo = true;
    if (!vendedorId) return undefined;

    setDatos(null);
    setPagina(1);
    setTotalPaginas(1);

    listarCalificacionesVendedor(vendedorId, { page: 1, limit: POR_PAGINA })
      .then((res) => {
        if (!activo) return;
        setDatos(res?.data || null);
        setTotalPaginas(Number(res?.paginacion?.total_paginas) || 1);
      })
      .catch(() => {
        // La reputacion es informativa: un fallo no bloquea el perfil.
      });

    return () => {
      activo = false;
    };
  }, [vendedorId]);

  /** Carga la siguiente pagina y la agrega al final de la lista. */
  async function cargarMas() {
    setCargandoMas(true);
    try {
      const siguiente = pagina + 1;
      const res = await listarCalificacionesVendedor(vendedorId, {
        page: siguiente,
        limit: POR_PAGINA,
      });
      setDatos((actual) => ({
        resumen: res?.data?.resumen ?? actual?.resumen,
        calificaciones: [
          ...(actual?.calificaciones ?? []),
          ...(res?.data?.calificaciones ?? []),
        ],
      }));
      setPagina(siguiente);
      setTotalPaginas(Number(res?.paginacion?.total_paginas) || totalPaginas);
    } catch {
      // Un fallo al paginar conserva lo ya mostrado.
    } finally {
      setCargandoMas(false);
    }
  }

  if (!datos || Number(datos.resumen?.total || 0) === 0) return null;

  return (
    <section
      className="rounded-3xl p-6 md:p-8 mb-8"
      style={{ backgroundColor: "var(--color-auth-card-bg)" }}
      aria-labelledby="calificaciones-vendedor-titulo"
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2
          id="calificaciones-vendedor-titulo"
          className="text-xl font-extrabold text-on-surface"
        >
          Calificaciones
        </h2>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-brand-orange text-brand-orange" aria-hidden="true" />
          <span className="text-lg font-bold text-on-surface">
            {datos.resumen.promedio ?? "-"}
          </span>
          <span className="text-sm text-brand-muted-text">
            ({datos.resumen.total})
          </span>
        </div>
      </div>

      <ul className="space-y-3">
        {datos.calificaciones.map((calificacion) => (
          <li
            key={calificacion.id}
            className="rounded-card border border-border-subtle p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-on-surface">
                {calificacion.comprador}
              </span>
              <span
                className="text-sm text-brand-orange"
                aria-label={`${calificacion.estrellas} de 5 estrellas`}
              >
                {"★".repeat(calificacion.estrellas)}
                {"☆".repeat(5 - calificacion.estrellas)}
              </span>
            </div>
            {calificacion.comentario && (
              <p className="mt-1 text-sm text-brand-muted-text">
                {calificacion.comentario}
              </p>
            )}
          </li>
        ))}
      </ul>

      {pagina < totalPaginas && (
        <button
          type="button"
          onClick={cargarMas}
          disabled={cargandoMas}
          className="mt-4 w-full rounded-card border border-border-subtle px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-input-bg disabled:opacity-60"
        >
          {cargandoMas ? "Cargando..." : "Ver mas calificaciones"}
        </button>
      )}
    </section>
  );
}
