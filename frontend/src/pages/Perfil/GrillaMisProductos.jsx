import { calcularPrecioFinal } from "../../utils/mapearProducto.js";
import { formatPriceRounded } from "../../utils/formatPrice.js";
import { PENCIL_PATH } from "./perfilConstantes.js";

/**
 * Grilla de productos propios con accion de edicion cuando la pestana activa
 * es "Mis Productos".
 */
export default function GrillaMisProductos({
  productos,
  brokenImages,
  onImagenRota,
  isMisProductos,
  onEditar,
  onCambiarEstado,
  onEliminar,
}) {
  return (
    <div
      className="grid gap-6 pb-10"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      }}
    >
      {productos.map((p) => (
        <div
          key={p.id}
          className="rounded-2xl overflow-hidden cursor-pointer transition-shadow"
          style={{
            backgroundColor: "var(--color-auth-card-bg)",
            boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="relative overflow-hidden"
            style={{
              height: "240px",
              backgroundColor: "#f1f1f4",
            }}
          >
            {!brokenImages[p.id] && (
              <img
                src={p.image}
                alt={p.name}
                className="w-full h-full object-cover"
                onError={() => onImagenRota(p.id)}
              />
            )}
            {p.badge && (
              <div
                className="absolute top-2 left-2 rounded-full flex items-center justify-center"
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "var(--color-app-badge)",
                  boxShadow: "0px 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              >
                <span
                  className="text-white text-center leading-tight"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontWeight: 700,
                    fontSize: "10px",
                  }}
                >
                  {p.badge}
                </span>
              </div>
            )}
            {isMisProductos && (
              <button
                title="Editar producto"
                onClick={() => onEditar(p.raw)}
                className="absolute top-3 right-3 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                style={{
                  width: "31px",
                  height: "31px",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.1)",
                }}
              >
                <svg
                  className="w-[15px] h-[15px]"
                  viewBox="0 0 15 15"
                  fill="var(--color-app-badge)"
                >
                  <path d={PENCIL_PATH} />
                </svg>
              </button>
            )}
          </div>

          <div className="p-4">
            <h3
              className="mb-2"
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: "18px",
                lineHeight: "24px",
                color: "var(--color-on-surface)",
              }}
            >
              {p.name}
            </h3>
            {p.descuento > 0 && (
              <p
                className="mb-1"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 700,
                  fontSize: "15px",
                  lineHeight: "20px",
                  color: "var(--color-app-badge)",
                  textDecoration: "line-through",
                }}
              >
                {formatPriceRounded(p.precioBase)}
              </p>
            )}
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: "22px",
                lineHeight: "28px",
                color: "var(--color-brand-orange)",
              }}
            >
              {formatPriceRounded(calcularPrecioFinal(p))}
            </p>

            {isMisProductos && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onCambiarEstado(p.id, p.raw?.pausado ? "activo" : "pausado")
                  }
                  className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-input-bg"
                >
                  {p.raw?.pausado ? "Reactivar" : "Pausar"}
                </button>
                <button
                  type="button"
                  onClick={() => onEliminar(p.id)}
                  className="rounded-full border border-report-red-text/40 px-3 py-1.5 text-xs font-semibold text-report-red-text hover:bg-report-red-bg/30"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
