import SelectorCantidad from "./SelectorCantidad";
import { formatPrice } from "../../utils/formatPrice";

export default function ItemCarrito({
  producto,
  cambiarCantidad,
  eliminarProducto,
}) {
  const precioLinea = producto.precio * producto.cantidad;
  const tieneDescuento = producto.precioOriginal !== null;

  return (
    <div className="rounded-2xl flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 px-3 py-3 sm:px-6 sm:py-4 transition-all hover:brightness-110 bg-auth-card-bg border border-figma-divider">
      {/* Imagen */}
      <img src={producto.imagen} alt={producto.nombre} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border border-figma-divider" onError={(e) => { e.target.src = "https://via.placeholder.com/80x80/1a1a26/797998?text=IMG"; }} />

      {/* Info del producto */}
      <div className="flex-1 min-w-0 order-3 sm:order-2 w-full sm:w-auto">
        <h3 className="font-sans font-semibold text-white text-base sm:text-lg truncate">
          {producto.nombre}
        </h3>
        <p className="font-sans font-extrabold text-xs uppercase tracking-wider mt-0.5 text-brand-muted-text">
          {producto.categoria}
        </p>
        <div className="flex items-baseline gap-2 mt-2 flex-wrap">
          <span className="font-sans font-bold text-base sm:text-lg text-brand-orange">
            {formatPrice(precioLinea)}
          </span>
          {tieneDescuento && (
            <span className="text-blue-400 font-sans text-sm line-through">
              {formatPrice(producto.precioOriginal * producto.cantidad)}
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 shrink-0 order-2 sm:order-3 ml-auto sm:ml-0">
        {/* Botón eliminar */}
        <button onClick={() => eliminarProducto(producto.id)} className="transition-colors hover:text-red-400 cursor-pointer text-brand-muted-text" aria-label={`Eliminar ${producto.nombre}`} title="Eliminar">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        {/* Selector de cantidad */}
        <SelectorCantidad
          cantidad={producto.cantidad}
          onDecrease={() => cambiarCantidad(producto.id, -1)}
          onIncrease={() => cambiarCantidad(producto.id, 1)}
        />
      </div>
    </div>
  );
}