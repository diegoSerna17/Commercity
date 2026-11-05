import { OPCIONES_TEMA, cardClass, sectionDivider } from "./ajustesEstilos.js";

/**
 * Seccion "Tema": claro, oscuro o sistema. Persiste via guardarTema en el
 * contenedor para no duplicar la logica de storage.
 */
export default function AjustesTema({ tema, onSeleccionar }) {
  return (
    <>
      <div className={sectionDivider} />

      <div className="mb-padding-lg">
        <h2 className="text-headline-sm font-bold text-on-surface">Tema</h2>
        <p className="text-brand-muted-text text-body-sm font-medium mt-1">
          Elige como quieres ver tu Commercity.
        </p>
      </div>

      <div className={cardClass}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {OPCIONES_TEMA.map((opcion) => {
            const seleccionada = tema === opcion.id;
            return (
              <button
                key={opcion.id}
                type="button"
                onClick={() => onSeleccionar(opcion.id)}
                aria-pressed={seleccionada}
                className="flex flex-col items-center justify-center gap-3 rounded-card-lg p-padding-lg text-center transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  backgroundColor: seleccionada
                    ? "var(--color-sidebar-active-bg)"
                    : "var(--color-surface-container-low)",
                  border: seleccionada
                    ? "2px solid var(--color-brand-orange)"
                    : "1px solid var(--color-figma-divider)",
                  boxShadow: seleccionada ? "0 4px 16px rgba(0,0,0,0.08)" : "none",
                }}
              >
                <span
                  className="leading-none"
                  style={{ color: "var(--color-on-surface)" }}
                  aria-hidden="true"
                >
                  <opcion.icono className="w-8 h-8" />
                </span>
                <span
                  className="font-bold"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "16px",
                    lineHeight: "20px",
                    color: "var(--color-on-surface)",
                  }}
                >
                  {opcion.nombre}
                </span>
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-brand-muted-text)" }}
                >
                  {opcion.detalle}
                </span>
                {seleccionada && (
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ backgroundColor: "var(--color-brand-orange)" }}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="var(--color-auth-card-bg)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
