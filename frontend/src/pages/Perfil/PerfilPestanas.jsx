/**
 * Pestanas Mi Feed / Mis Productos del perfil del vendedor.
 */
export default function PerfilPestanas({ isMisProductos, onCambiarTab }) {
  return (
    <div
      className="flex mb-8 w-full mx-auto"
      style={{
        maxWidth: "847px",
        backgroundColor: "var(--color-auth-card-bg)",
        borderRadius: "var(--radius-figma-card)",
        padding: "4px",
      }}
    >
      <button
        onClick={() => onCambiarTab("mi-feed")}
        className="flex-1 min-w-0 flex items-center justify-center gap-2 rounded-2xl transition-all duration-200"
        style={{
          padding: "13px 16px",
          backgroundColor: !isMisProductos
            ? "var(--color-auth-card-bg)"
            : "transparent",
          boxShadow: !isMisProductos
            ? "0px 1px 1px rgba(0,0,0,0.05)"
            : "none",
        }}
      >
        <svg
          className="flex-shrink-0"
          style={{ width: "18px", height: "18px" }}
          fill={
            !isMisProductos
              ? "var(--color-brand-orange)"
              : "var(--color-brand-muted-text)"
          }
          viewBox="0 0 18 18"
        >
          <path d="M0 8V0H8V8H0ZM0 18V10H8V18H0ZM10 8V0H18V8H10ZM10 18V10H18V18H10Z" />
        </svg>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "14px",
            fontWeight: !isMisProductos ? 600 : 400,
            color: !isMisProductos
              ? "var(--color-brand-orange)"
              : "var(--color-brand-muted-text)",
          }}
        >
          Mi Feed
        </span>
      </button>

      <button
        onClick={() => onCambiarTab("mis-productos")}
        className="flex-1 min-w-0 flex items-center justify-center gap-2 rounded-2xl transition-all duration-200"
        style={{
          padding: "13px 16px",
          backgroundColor: isMisProductos
            ? "var(--color-auth-card-bg)"
            : "transparent",
          boxShadow: isMisProductos
            ? "0px 1px 1px rgba(0,0,0,0.05)"
            : "none",
        }}
      >
        <svg
          className="flex-shrink-0"
          style={{ width: "18px", height: "18px" }}
          fill={
            isMisProductos
              ? "var(--color-brand-orange)"
              : "var(--color-brand-muted-text)"
          }
          viewBox="0 0 20 18"
        >
          <path d="M3 20C2.45 20 1.97917 19.8042 1.5875 19.4125C1.19583 19.0208 1 18.55 1 18V6.725C0.7 6.54167 0.458333 6.30417 0.275 6.0125C0.0916667 5.72083 0 5.38333 0 5V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H18C18.55 0 19.0208 0.195833 19.4125 0.5875C19.8042 0.979167 20 1.45 20 2V5C20 5.38333 19.9083 5.72083 19.725 6.0125C19.5417 6.30417 19.3 6.54167 19 6.725V18C19 18.55 18.8042 19.0208 18.4125 19.4125C18.0208 19.8042 17.55 20 17 20H3ZM2 5H18V2H2V5ZM7 12H13V10H7V12Z" />
        </svg>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "16px",
            fontWeight: isMisProductos ? 600 : 400,
            color: isMisProductos
              ? "var(--color-brand-orange)"
              : "var(--color-brand-muted-text)",
          }}
        >
          Mis Productos
        </span>
      </button>
    </div>
  );
}
