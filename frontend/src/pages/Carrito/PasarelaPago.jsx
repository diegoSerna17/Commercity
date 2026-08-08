import { useState } from "react";

function IconoTarjeta() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-muted-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function IconoUsuario() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-muted-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function formatPeso(valor) {
  return "$" + Math.round(valor).toLocaleString("es-CO");
}

export default function PasarelaPago({ productos, onCancelar, onPagoExitoso }) {
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [nombreTarjeta, setNombreTarjeta] = useState("");
  const [pagado, setPagado] = useState(false);

  const precioPublicadoTotal = productos.reduce(
    (acc, p) => acc + p.precioUnitario * p.cantidad,
    0
  );

  const subtotal = precioPublicadoTotal / 1.19;
  const iva = subtotal * 0.19;

  function manejarNumeroTarjeta(e) {
    const solo = e.target.value.replace(/\D/g, "").slice(0, 16);
    const grupos = solo.match(/.{1,4}/g)?.join(" ") ?? solo;
    setNumeroTarjeta(grupos);
  }

  function manejarPago(e) {
    e.preventDefault();
    setPagado(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">

      <div className="bg-auth-card-bg rounded-card-lg w-[400px] sm:w-[500px] lg:w-[600px] shadow-2xl overflow-hidden border border-figma-divider">

        {pagado ? (
          <div className="p-8 text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-brand-orange">¡Pago exitoso!</h2>
            <p className="text-brand-muted-text text-sm">Tu pedido ha sido procesado correctamente.</p>
            <button
              onClick={onPagoExitoso}
              className="w-full bg-brand-orange text-brand-dark-text font-bold text-base py-3 rounded-card-lg hover:bg-primary-container transition-colors mt-2"
            >
              Volver al carrito
            </button>
          </div>
        ) : (
          <form onSubmit={manejarPago}>

            <div className="px-6 pt-6 pb-4">
              <h2 className="text-2xl font-extrabold text-brand-orange tracking-tight">
                Pasarela de Pago
              </h2>
            </div>

            <div className="px-6 pb-6 flex flex-col gap-5">

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center bg-input-bg rounded-card px-5 py-4">
                  <span className="font-bold text-on-surface text-base">SubTotal</span>
                  <span className="font-bold text-brand-orange text-base">
                    {formatPeso(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-input-bg rounded-card px-5 py-4">
                  <span className="font-bold text-on-surface text-base">IVA incluido (%19)</span>
                  <span className="font-bold text-brand-orange text-base">
                    {formatPeso(iva)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-brand-muted-text text-xs font-extrabold uppercase tracking-widest mb-2">
                  Datos de la Tarjeta
                </p>

                <div className="flex flex-col gap-1 mb-4">
                  <label className="text-brand-muted-text text-sm">
                    Número de la tarjeta
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2">
                      <IconoTarjeta />
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0000 0000 0000 0000"
                      value={numeroTarjeta}
                      onChange={manejarNumeroTarjeta}
                      required
                      className="w-full bg-input-bg border border-surface-container-high rounded-card pl-11 pr-4 py-3.5 text-on-surface placeholder:text-brand-muted-text text-base outline-none focus:border-brand-orange transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-brand-muted-text text-sm">
                    Nombre en la tarjeta
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2">
                      <IconoUsuario />
                    </span>
                    <input
                      type="text"
                      placeholder="NOMBRE APELLIDO"
                      value={nombreTarjeta}
                      onChange={(e) =>
                        setNombreTarjeta(e.target.value.toUpperCase())
                      }
                      required
                      className="w-full bg-input-bg border border-surface-container-high rounded-card pl-11 pr-4 py-3.5 text-on-surface placeholder:text-brand-muted-text text-base outline-none focus:border-brand-orange transition-colors"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-orange text-brand-dark-text font-bold text-lg py-4 rounded-card-lg shadow-lg hover:bg-primary-container active:scale-95 transition-all duration-150"
              >
                Total a Pagar {formatPeso(precioPublicadoTotal)}
              </button>

              <button
                type="button"
                onClick={onCancelar}
                className="w-full bg-transparent border border-surface-container-high text-brand-muted-text font-semibold text-sm py-3 rounded-card-lg hover:border-brand-muted-text hover:text-on-surface transition-colors"
              >
                Cancelar y volver al carrito
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}