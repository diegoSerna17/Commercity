import {
  aplicarFallbackImagenProducto,
  replaceInvalidProductImage,
} from "../../utils/productImageFallback.js";
import { calcularPrecioFinal } from "../../utils/mapearProducto.js";
import { formatPriceRounded } from "../../utils/formatPrice.js";

/**
 * Tarjeta de un producto del catalogo: imagen, descuento, vendedor, precio y stock.
 */
export default function TarjetaProducto({ product, onAbrir, onIrPerfilVendedor }) {
  return (
    <article
      role="listitem"
      className="group relative rounded-3xl overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-2"
      style={{
        backgroundColor: "var(--color-auth-card-bg)",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)",
      }}
    >
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05)",
        }}
      />

      <button
        type="button"
        onClick={() => onAbrir(product)}
        className="text-left relative overflow-hidden"
        aria-label={`Ver ficha de ${product.name}`}
      >
        <div className="relative h-[200px] sm:h-[220px] md:h-[260px] flex-shrink-0 overflow-hidden bg-surface-container-high">
          <img
            src={product.image}
            alt={product.imageAlt}
            data-categoria={product.category}
            data-product-id={product.id}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            onError={aplicarFallbackImagenProducto}
            onLoad={replaceInvalidProductImage}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {product.badge && (
            <span
              className="absolute top-4 left-4 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg"
              style={{
                backgroundColor: "var(--color-brand-orange)",
                color: "var(--color-auth-card-bg)",
              }}
            >
              {product.badge}
            </span>
          )}

          <span
            className="absolute top-4 right-4 text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md uppercase tracking-wider"
            style={{
              backgroundColor: "var(--color-bg-glass)",
              color: "var(--color-on-surface-variant)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            {product.category}
          </span>
        </div>
      </button>

      <div className="flex flex-col gap-2 p-5 pt-4">
        <button
          type="button"
          onClick={() => onAbrir(product)}
          className="text-left group/btn"
        >
          <h3
            className="text-base lg:text-lg font-bold line-clamp-2 transition-colors duration-200 group-hover/btn:text-brand-orange"
            style={{ color: "var(--color-on-surface)" }}
          >
            {product.name}
          </h3>
        </button>

        <button
          type="button"
          onClick={() => onIrPerfilVendedor(product)}
          className="flex items-center gap-2 mt-0.5 text-left group/vendor transition-opacity hover:opacity-80"
          aria-label={`Ver perfil de ${product.vendedorNombre}`}
        >
          <img
            src={product.vendedorAvatar}
            alt={product.vendedorNombre}
            loading="lazy"
            className="w-5 h-5 rounded-full"
          />
          <span
            className="text-xs font-medium group-hover/vendor:text-brand-orange transition-colors"
            style={{ color: "var(--color-brand-muted-text)" }}
          >
            {product.vendedorNombre}
          </span>
        </button>

        <div className="flex items-baseline gap-2.5 mt-1.5">
          {product.descuento > 0 && (
            <span
              className="text-sm font-medium line-through"
              style={{ color: "var(--color-brand-muted-text)" }}
            >
              {formatPriceRounded(product.precioBase)}
            </span>
          )}
          <span
            className="text-lg lg:text-xl font-bold"
            style={{ color: "var(--color-brand-orange)" }}
          >
            {formatPriceRounded(calcularPrecioFinal(product))}
          </span>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: "var(--color-brand-muted-text)" }}
            >
              Stock disponible
            </span>
            <span
              className="text-[10px] font-bold"
              style={{ color: "var(--color-brand-orange)" }}
            >
              {product.stock} unidades
            </span>
          </div>
          <div
            className="w-full h-1 rounded-full overflow-hidden"
            style={{
              backgroundColor: "var(--color-surface-container-high)",
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min((product.stock / 50) * 100, 100)}%`,
                backgroundColor: "var(--color-brand-orange)",
                opacity: 0.6,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
