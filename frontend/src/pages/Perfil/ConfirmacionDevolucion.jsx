import { formatCOP, calcSubtotal, calcTotal } from "../../utils/historialUtils.js";

export default function ConfirmacionDevolucion({ order, onConfirm, onCancel }) {
  const total = calcTotal(calcSubtotal(order.productos));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative bg-auth-card-bg rounded-hero shadow-2xl w-full max-w-[415px] overflow-hidden">
        <div className="px-6 pt-7 pb-2 text-center">
          <h3 className="text-on-surface text-xl font-extrabold">
            Confirmar Devolución
          </h3>
        </div>

        <div className="px-5 sm:px-8 pb-4">
          <p className="text-brand-muted-text text-sm font-semibold text-center leading-relaxed">
            ¿Seguro que quieres solicitar la devolución de este pedido? Se iniciará el proceso de devolución y reembolso.
          </p>
        </div>

        <div className="mx-4 sm:mx-6 bg-surface-container-lowest rounded-card px-4 py-4 mb-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-brand-muted-text text-sm font-medium">Vendedor</span>
            <span className="text-on-surface text-sm font-semibold">{order.vendedor}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-brand-muted-text text-sm font-medium">Monto total</span>
            <span className="text-brand-orange text-sm font-extrabold">{formatCOP(total)}</span>
          </div>
        </div>

        <div className="px-5 sm:px-6 pb-6 flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full bg-brand-orange rounded-card-lg py-3.5 text-brand-dark-text text-lg font-bold hover:bg-primary-container transition-colors cursor-pointer shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
          >
            Confirmar Devolución
          </button>
          <button
            onClick={onCancel}
            className="w-full border border-[#8e8e93] bg-auth-card-bg rounded-card-lg py-3.5 text-brand-muted-text text-lg font-bold hover:bg-input-bg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}