import { useEffect } from "react";
import { createPortal } from "react-dom";
import { formatCOP, calcSubtotal, calcIVA, calcTotal } from "../../utils/historialUtils.js";
import { EstadoBadge, Avatar } from "../../utils/historialUtils.jsx";

export default function DetalleCompras({ order, onClose }) {
  const subtotal = calcSubtotal(order.productos);
  const iva = calcIVA(subtotal);
  const total = calcTotal(subtotal);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const hasManyProducts = order.productos.length > 5;
  const productListClass = hasManyProducts
    ? "bg-input-bg rounded-card overflow-x-hidden overflow-y-auto max-h-64 divide-y divide-surface-container/30"
    : "bg-input-bg rounded-card overflow-hidden divide-y divide-surface-container/30";

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div
        className="min-h-full flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-auth-card-bg rounded-hero shadow-2xl w-[400px] sm:w-[500px]">
        <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
          <h2 className="text-on-surface text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
            Detalle de la compra
          </h2>
          <p className="text-brand-muted-text font-bold text-xs sm:text-sm mt-1 mb-2 sm:mb-3">
            Fecha: {order.fechaLarga}
          </p>
          <EstadoBadge estado={order.estado} withBorder />
        </div>

        <div className="px-4 sm:px-6 pb-3 sm:pb-4">
          <p className="text-brand-muted-text font-bold text-xs sm:text-sm mb-2">Vendedor</p>
          <div className="bg-input-bg rounded-card p-3 flex items-center gap-3">
            <Avatar order={order} />
            <span className="text-on-surface font-semibold text-sm sm:text-base">{order.vendedor}</span>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-3 sm:pb-4">
          <p className="text-brand-muted-text font-bold text-xs sm:text-sm mb-2">Tu dirección de envío</p>
          <div className="bg-input-bg rounded-card px-3 sm:px-4 py-2 sm:py-3">
            <p className="text-on-surface font-semibold text-xs sm:text-sm">{order.direccion}</p>
            <p className="text-brand-muted-text text-[11px] sm:text-xs mt-0.5">{order.ciudad}</p>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-3 sm:pb-4">
          <p className="text-brand-muted-text font-bold text-xs sm:text-sm mb-2">Productos comprados</p>
          <div className={productListClass}>
            {order.productos.map((p, i) => (
              <div key={i} className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-on-surface font-semibold text-xs sm:text-sm">{p.nombre}</p>
                  <p className="text-brand-muted-text text-[11px] sm:text-xs mt-0.5">Cantidad {p.cantidad}</p>
                </div>
                <span className="text-brand-orange font-extrabold text-xs sm:text-sm flex-shrink-0">
                  {formatCOP(p.cantidad * p.precioUnit)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-3">
          <div className="bg-input-bg border border-brand-orange rounded-card px-4 py-3 flex justify-between items-center">
            <span className="text-brand-muted-text font-bold text-sm">IVA incluido (%19)</span>
            <span className="text-brand-orange font-extrabold text-base">{formatCOP(iva)}</span>
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="bg-sidebar-active-bg/70 border border-brand-orange rounded-card px-4 py-4 flex justify-between items-center">
            <span className="text-brand-muted-text font-bold text-base">Precio total del pedido</span>
            <span className="text-brand-orange font-extrabold text-lg">{formatCOP(total)}</span>
          </div>
        </div>

        <div className="border-t border-figma-divider mx-6 mb-4" />
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full border border-[#8e8e93] rounded-card-lg py-3 text-brand-muted-text font-bold text-lg hover:bg-on-surface/5 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}