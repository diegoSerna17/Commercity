export default function QuantitySelector({ cantidad, onDecrease, onIncrease }) {
  return (
    <div className="inline-flex items-center">
      <span className="text-[10px] sm:text-xs font-extrabold mr-1.5 sm:mr-2 hidden sm:inline text-brand-muted-text">
        CANTIDAD
      </span>
      <button
        onClick={onDecrease}
        className="w-8 h-8 sm:w-8 sm:h-8 flex items-center justify-center font-sans font-medium text-white text-lg rounded-l transition-colors bg-surface-container border border-figma-divider"
        aria-label="Reducir cantidad"
      >
        −
      </button>
      <span className="w-8 h-8 flex items-center justify-center font-sans font-medium text-white text-sm sm:text-base bg-auth-card-bg border-t border-b border-figma-divider">
        {cantidad}
      </span>
      <button
        onClick={onIncrease}
        className="w-8 h-8 flex items-center justify-center font-sans font-medium text-white text-lg rounded-r transition-colors bg-surface-container border border-figma-divider"
        aria-label="Aumentar cantidad"
      >
        +
      </button>
    </div>
  );
}