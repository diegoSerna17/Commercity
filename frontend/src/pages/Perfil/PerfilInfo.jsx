import { Link } from "react-router-dom";

/**
 * Nombre, acciones principales y contadores sociales del perfil.
 */
export default function PerfilInfo({
  nombrePerfil,
  isMisProductos,
  seguidores,
  siguiendo,
  productos,
  onAbrirSeguidores,
  onAgregarProducto,
}) {
  return (
    <div className="flex-1 min-w-0 w-full">
      {/* Top Row: Name + Rating + Actions */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">
        <div className="space-y-3">
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
            {nombrePerfil}
          </h1>

          {/* Sin rating: el backend no expone un promedio real que este perfil pueda mostrar (RF107). */}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/messages"
            className="flex items-center gap-2.5 rounded-full font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
            style={{
              padding: "10px 24px",
              fontSize: "14px",
              backgroundColor: "var(--color-brand-orange)",
              color: "var(--color-auth-card-bg)",
              fontFamily: "var(--font-sans)",
            }}
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
            Mensajes
          </Link>

          {isMisProductos && (
            <button
              onClick={onAgregarProducto}
              className="flex items-center gap-2.5 rounded-full font-semibold text-[13px] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
              style={{
                padding: "10px 20px",
                backgroundColor: "var(--color-brand-orange)",
                color: "var(--color-auth-card-bg)",
                fontFamily: "var(--font-sans)",
              }}
            >
              <svg
                className="flex-shrink-0"
                style={{ width: "18px", height: "18px" }}
                fill="currentColor"
                viewBox="0 0 16.6667 16.6667"
              >
                <path d="M7.5 12.5H9.16667V9.16667H12.5V7.5H9.16667V4.16667H7.5V7.5H4.16667V9.16667H7.5V12.5ZM8.33333 16.6667C7.18056 16.6667 6.09722 16.4479 5.08333 16.0104C4.06944 15.5729 3.1875 14.9792 2.4375 14.2292C1.6875 13.4792 1.09375 12.5972 0.65625 11.5833C0.21875 10.5694 0 9.48611 0 8.33333C0 7.18056 0.21875 6.09722 0.65625 5.08333C1.09375 4.06944 1.6875 3.1875 2.4375 2.4375C3.1875 1.6875 4.06944 1.09375 5.08333 0.65625C6.09722 0.21875 7.18056 0 8.33333 0C9.48611 0 10.5694 0.21875 11.5833 0.65625C12.5972 1.09375 13.4792 1.6875 14.2292 2.4375C14.9792 3.1875 15.5729 4.06944 16.0104 5.08333C16.4479 6.09722 16.6667 7.18056 16.6667 8.33333C16.6667 9.48611 16.4479 10.5694 16.0104 11.5833C15.5729 12.5972 14.9792 13.4792 14.2292 14.2292C13.4792 14.9792 12.5972 15.5729 11.5833 16.0104C10.5694 16.4479 9.48611 16.6667 8.33333 16.6667ZM8.33333 15C10.1944 15 11.7708 14.3542 13.0625 13.0625C14.3542 11.7708 15 10.1944 15 8.33333C15 6.47222 14.3542 4.89583 13.0625 3.60417C11.7708 2.3125 10.1944 1.66667 8.33333 1.66667C6.47222 1.66667 4.89583 2.3125 3.60417 3.60417C2.3125 4.89583 1.66667 6.47222 1.66667 8.33333C1.66667 10.1944 2.3125 11.7708 3.60417 13.0625C4.89583 14.3542 6.47222 15 8.33333 15Z" />
              </svg>
              Agregar Producto
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-10 mb-6">
        <button
          onClick={() => onAbrirSeguidores("seguidores")}
          className="group text-left transition-opacity hover:opacity-80"
        >
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
            {seguidores.length}
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
            Seguidores
          </p>
        </button>
        <div className="w-px h-8" style={{ backgroundColor: "var(--color-surface-container-high)" }} />
        <button
          onClick={() => onAbrirSeguidores("siguiendo")}
          className="group text-left transition-opacity hover:opacity-80"
        >
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
            {siguiendo.length}
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
            Seguidos
          </p>
        </button>
        <div className="w-px h-8" style={{ backgroundColor: "var(--color-surface-container-high)" }} />
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
            {productos.length}
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
            Productos
          </p>
        </div>
      </div>
    </div>
  );
}
