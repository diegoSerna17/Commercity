import { useState } from "react";
import { useToast } from "../../hooks/useToast.js";
import {
  cardClass,
  inputClass,
  labelClass,
  sectionDivider,
} from "./ajustesEstilos.js";
import AjustesToast from "./AjustesToast.jsx";

/**
 * Seccion "Direccion de entrega". El backend todavia no persiste la direccion
 * (RF39, brecha documentada): la UI lo dice en vez de simular exito.
 */
export default function AjustesDireccion() {
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [depto, setDepto] = useState("");
  const { toast, showToast } = useToast(3500);

  function handleSubmit(event) {
    event.preventDefault();

    if (!direccion.trim() || !ciudad.trim() || !depto.trim()) {
      showToast("Por favor completa todos los campos de direccion.", true);
      return;
    }

    showToast(
      "La direccion aun no se guarda en tu cuenta: la indicas al confirmar el pago en el carrito."
    );
  }

  return (
    <>
      <div className={sectionDivider} />

      <div className="mb-padding-lg">
        <h2 className="text-headline-sm font-bold text-on-surface">
          Direccion de entrega
        </h2>
        <p className="text-brand-muted-text text-body-sm font-medium mt-1">
          Agrega tu direccion para recibir tus pedidos.
        </p>
      </div>

      <AjustesToast toast={toast} />

      <div className={cardClass}>
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <label className={labelClass} htmlFor="input-direccion">
              Direccion
            </label>
            <input
              id="input-direccion"
              type="text"
              placeholder="Ej: Calle 123 # 45 - 07"
              value={direccion}
              onChange={(event) => setDireccion(event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className={labelClass} htmlFor="input-ciudad">
                Ciudad
              </label>
              <input
                id="input-ciudad"
                type="text"
                placeholder="Ej: Cali"
                value={ciudad}
                onChange={(event) => setCiudad(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="input-depto">
                Departamento
              </label>
              <input
                id="input-depto"
                type="text"
                placeholder="Ej: Valle del cauca"
                value={depto}
                onChange={(event) => setDepto(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-button bg-gradient-to-r from-brand-orange to-tertiary-container px-6 py-3 text-body-sm font-bold text-brand-dark-text transition hover:opacity-90 active:scale-[0.99]"
          >
            Cambiar Direccion
          </button>
        </form>
      </div>
    </>
  );
}
