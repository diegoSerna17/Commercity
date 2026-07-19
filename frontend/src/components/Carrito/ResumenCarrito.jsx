import { calculateTotals } from "../../utils/calcularTotal";
import { formatPrice } from "../../utils/formatPrice";

export default function CartSummary({ carrito, onComprar }) {
  const { subtotal, descuento, total } = calculateTotals(carrito);

  return (
    <>
      {/* Totales */}
      <div className="pt-5 sm:pt-6 space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 border-t border-figma-divider">
        {/* Total artículos */}
        <div className="flex justify-between items-center gap-3 font-sans font-extrabold text-base sm:text-lg md:text-xl text-brand-muted-text">
          <span>Total de artículos</span>
          <span className="whitespace-nowrap">{formatPrice(subtotal + descuento)}</span>
        </div>

        {/* Descuentos - solo si hay */}
        {descuento > 0 && (
          <div className="flex justify-between items-center gap-3 font-sans font-extrabold text-base sm:text-lg md:text-xl">
            <span className="text-brand-muted-text">Descuentos aplicados</span>
            <span className="text-brand-orange whitespace-nowrap">- {formatPrice(descuento)}</span>
          </div>
        )}

        {/* Envío */}
        <div className="flex justify-between items-center gap-3 font-sans font-extrabold text-base sm:text-lg md:text-xl text-brand-muted-text">
          <span>Envío</span>
          <span className="text-green-400 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap">Gratis</span>
        </div>

        {/* Total final */}
        <div className="flex justify-between items-center gap-3 font-sans font-extrabold text-lg sm:text-xl md:text-2xl pt-2 border-t border-figma-divider">
          <span className="text-white">Total</span>
          <span className="text-brand-orange whitespace-nowrap">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Botón comprar */}
      <button onClick={onComprar} className="w-full font-sans font-bold text-lg sm:text-xl md:text-2xl rounded-3xl py-3.5 sm:py-4 shadow-lg hover:brightness-110 active:scale-95 transition-all duration-150 cursor-pointer bg-brand-orange text-surface-container-lowest">
        Comprar
      </button>
    </>
  );
}