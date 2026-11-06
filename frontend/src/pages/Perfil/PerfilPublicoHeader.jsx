import { AVATAR_POR_DEFECTO } from "../../utils/mapearProducto.js";

/**
 * Tarjeta superior del perfil publico: avatar, nombre, acciones (seguir,
 * mensaje, reportar) y contadores sociales.
 */
export default function PerfilPublicoHeader({
  vendedor,
  contadores,
  productos,
  siguiendo,
  cargandoSeguimiento,
  esPerfilPropio,
  onAlternarSeguimiento,
  onEnviarMensaje,
  onReportar,
}) {
  return (
    <div
      className="rounded-3xl p-6 md:p-10 mb-8"
      style={{
        backgroundColor: "var(--color-auth-card-bg)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12">
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
              onError={(event) => {
                event.currentTarget.src = AVATAR_POR_DEFECTO;
              }}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">
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

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={onAlternarSeguimiento}
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
                type="button"
                onClick={onEnviarMensaje}
                className="flex items-center gap-2.5 rounded-full font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
                style={{
                  padding: "10px 24px",
                  fontSize: "14px",
                  backgroundColor: "var(--color-brand-orange)",
                  color: "var(--color-auth-card-bg)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
                Enviar mensaje
              </button>

              {!esPerfilPropio && (
                <button
                  type="button"
                  onClick={onReportar}
                  className="flex items-center gap-2 rounded-full font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
                  style={{
                    padding: "10px 24px",
                    fontSize: "14px",
                    fontFamily: "var(--font-sans)",
                    backgroundColor: "transparent",
                    color: "var(--color-report-red-text)",
                    border: "1.5px solid var(--color-report-red-text)",
                  }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                  </svg>
                  Reportar
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-10 mb-6">
            <Contador valor={productos.length} etiqueta="Productos" />
            <Contador valor={contadores.seguidores} etiqueta="Seguidores" />
            <Contador valor={contadores.siguiendo} etiqueta="Seguidos" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Contador({ valor, etiqueta }) {
  return (
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
        {valor}
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
        {etiqueta}
      </p>
    </div>
  );
}
