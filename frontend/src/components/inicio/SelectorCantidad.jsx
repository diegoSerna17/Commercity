import { Minus, Plus } from "lucide-react";

/**
 * Selector de cantidad de la ficha del producto: respeta el stock y el estado
 * agotado.
 */
export default function SelectorCantidad({ cantidad, stock, agotado, onChange }) {
  return (
    <div className="text-center">
      <p className="mb-1 text-xs font-extrabold uppercase text-brand-muted-text">
        Cantidad
      </p>
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, cantidad - 1))}
          disabled={cantidad <= 1}
          aria-label="Quitar una unidad"
          className="flex h-8 w-8 items-center justify-center border-2 border-figma-divider bg-input-bg text-on-surface transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="flex h-8 w-9 items-center justify-center border-y-2 border-figma-divider bg-auth-card-bg text-body-sm font-bold text-on-surface">
          {cantidad}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(stock, cantidad + 1))}
          disabled={agotado || cantidad >= stock}
          aria-label="Agregar una unidad"
          className="flex h-8 w-8 items-center justify-center border-2 border-figma-divider bg-input-bg text-on-surface transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
