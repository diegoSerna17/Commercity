export default function SuccessModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm px-3 sm:px-4 py-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-success-title"
    >
      <div className="w-full sm:w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-10 md:p-14 shadow-2xl text-center flex flex-col justify-center items-center transition-all bg-auth-card-bg border border-figma-divider">
        <h2 id="payment-success-title" className="font-sans font-extrabold text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4 text-brand-orange">
          ¡Pago exitoso!
        </h2>
        <p className="font-sans text-sm sm:text-base md:text-lg mb-6 sm:mb-8 w-full block text-brand-muted-text">
          Tu pedido ha sido procesado correctamente. ¡Gracias por comprar en CommerCity!
        </p>
        <button
          onClick={onClose}
          className="w-full sm:w-auto font-sans font-bold text-base sm:text-lg rounded-xl px-8 sm:px-12 py-3 sm:py-4 hover:brightness-110 active:scale-95 transition cursor-pointer bg-brand-orange text-surface-container-lowest"
        >
          Volver al carrito
        </button>
      </div>
    </div>
  );
}