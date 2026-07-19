import { useState } from "react";
import { formatPrice } from "../../utils/formatPrice";
import { calculateTotals } from "../../utils/calcularTotal";

export default function PaymentModal({ onClose, onConfirm, carrito }) {
  const { total } = calculateTotals(carrito);

  const [numTarjeta, setNumTarjeta]       = useState("");
  const [nombreTarjeta, setNombreTarjeta] = useState("");
  const [errNum, setErrNum]               = useState(false);
  const [errNombre, setErrNombre]         = useState(false);
  const [procesando, setProcesando]       = useState(false);

  function handleNumTarjeta(e) {
    let val = e.target.value.replace(/\D/g, "").slice(0, 16);
    val = val.replace(/(.{4})/g, "$1 ").trim();
    setNumTarjeta(val);
  }

  function procesarPago(e) {
    e.preventDefault();
    const numLimpio = numTarjeta.replace(/\s/g, "");
    const numOk  = /^\d{16}$/.test(numLimpio);
    const nomOk  = nombreTarjeta.trim().length >= 2;
    setErrNum(!numOk);
    setErrNombre(!nomOk);
    if (!numOk || !nomOk) return;
    setProcesando(true);
    setTimeout(() => {
      onConfirm();
    }, 1500);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm px-3 sm:px-4 py-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-8 md:p-12 shadow-2xl relative flex flex-col transition-all bg-auth-card-bg border border-figma-divider">
        <div>
          <h2 id="payment-modal-title" className="font-sans font-extrabold text-2xl sm:text-3xl mb-5 sm:mb-6 text-brand-orange">
            Pasarela de Pago
          </h2>

          <div className="w-full flex items-center justify-between rounded-xl px-4 sm:px-6 py-3 sm:py-4 mb-6 sm:mb-8 bg-surface-container">
            <span className="font-sans font-extrabold text-sm sm:text-base md:text-lg text-brand-muted-text">
              Total a pagar
            </span>
            <span className="font-sans font-extrabold text-lg sm:text-xl md:text-2xl text-brand-orange">
              {formatPrice(total)}
            </span>
          </div>

          <form onSubmit={procesarPago} noValidate className="w-full">
            <p className="font-sans font-bold text-white text-xs sm:text-sm tracking-widest uppercase mb-4 sm:mb-6">
              Datos de la tarjeta
            </p>

            <div className="mb-5 sm:mb-6 w-full">
              <label
                className="block text-xs sm:text-sm font-sans mb-1.5 sm:mb-2 text-brand-muted-text"
                htmlFor="numTarjeta"
              >
                Número de la tarjeta
              </label>
              <input
                id="numTarjeta"
                type="text"
                inputMode="numeric"
                maxLength={19}
                placeholder="EJ: 0000 0000 0000 0000"
                value={numTarjeta}
                onChange={handleNumTarjeta}
                className={`w-full block rounded-xl px-4 py-3 sm:py-4 text-white font-sans text-sm sm:text-base focus:outline-none transition-colors bg-surface-container ${errNum ? "border border-error" : "border border-figma-divider"}`}
              />
              {errNum && (
                <p className="text-red-500 text-xs mt-1">
                  Ingresa un número de tarjeta válido (16 dígitos).
                </p>
              )}
            </div>

            <div className="mb-6 sm:mb-10 w-full">
              <label
                className="block text-xs sm:text-sm font-sans mb-1.5 sm:mb-2 text-brand-muted-text"
                htmlFor="nombreTarjeta"
              >
                Nombre de la tarjeta
              </label>
              <input
                id="nombreTarjeta"
                type="text"
                placeholder="Ej: JUAN GIRALDO"
                value={nombreTarjeta}
                onChange={(e) => setNombreTarjeta(e.target.value.toUpperCase())}
                className={`w-full block rounded-xl px-4 py-3 sm:py-4 text-white font-sans text-sm sm:text-base focus:outline-none transition-colors uppercase bg-surface-container ${errNombre ? "border border-error" : "border border-figma-divider"}`}
              />
              {errNombre && (
                <p className="text-red-500 text-xs mt-1">
                  Ingresa el nombre del titular.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={procesando}
              className="w-full block font-sans font-bold text-base sm:text-lg rounded-2xl py-3 sm:py-4 mb-3 sm:mb-4 hover:brightness-110 active:scale-95 transition-all duration-150 disabled:opacity-60 bg-brand-orange text-surface-container-lowest"
            >
              {procesando ? "Procesando..." : `Pagar ${formatPrice(total)}`}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full block font-sans font-semibold text-sm sm:text-base rounded-2xl py-3 sm:py-4 transition-colors hover:bg-white/5 border border-brand-muted-text text-brand-muted-text bg-transparent"
            >
              Cancelar y volver al carrito
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}