/**
 * Pie del catalogo: cuantos productos se han mostrado, avance de la paginacion
 * y boton para cargar la siguiente pagina.
 */
export default function PaginacionCatalogo({
  pagina,
  totalPaginas,
  totalProductos,
  cantidadMostrada,
  hayPaginaSiguiente,
  cargandoMas,
  onCargarMas,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 pb-16 md:pb-20">
      <span
        className="text-xs font-medium tracking-wide uppercase"
        style={{ color: "var(--color-brand-muted-text)" }}
      >
        Mostrando {cantidadMostrada} de {totalProductos} productos
      </span>
      <div
        className="w-32 h-1 rounded-full overflow-hidden"
        style={{
          backgroundColor: "var(--color-surface-container-high)",
        }}
        role="progressbar"
        aria-valuenow={pagina}
        aria-valuemin={1}
        aria-valuemax={totalPaginas}
        aria-label="Pagina del catalogo"
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.min((pagina / totalPaginas) * 100, 100)}%`,
            backgroundColor: "var(--color-brand-orange)",
          }}
        />
      </div>
      {hayPaginaSiguiente ? (
        <button
          type="button"
          onClick={onCargarMas}
          disabled={cargandoMas}
          className="px-6 py-2.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            border: "1px solid var(--color-border-subtle)",
            color: "var(--color-brand-orange)",
          }}
        >
          {cargandoMas ? "Cargando piezas..." : "Cargar mas productos"}
        </button>
      ) : (
        <span className="text-xs" style={{ color: "var(--color-brand-muted-text)" }}>
          Has visto todo el catalogo
        </span>
      )}
    </div>
  );
}
