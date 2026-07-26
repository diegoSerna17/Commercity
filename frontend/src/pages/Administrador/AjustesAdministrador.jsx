import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

function useToast() {
  const [toast, setToast] = useState({ visible: false, msg: "", isError: false });
  const timerRef = useRef(null);

  function showToast(msg, isError = false) {
    clearTimeout(timerRef.current);
    setToast({ visible: true, msg, isError });
    timerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, 3000);
  }

  return { toast, showToast };
}

export default function AjustesAdministrador({ onClose }) {
  const [titular, setTitular] = useState("");
  const [banco, setBanco] = useState("");
  const [tipo, setTipo] = useState("");
  const [numero, setNumero] = useState("");
  const { toast, showToast } = useToast();

  useEffect(() => {
    const datos = JSON.parse(localStorage.getItem("commercity_banco") || "null");
    if (!datos) return;
    setTitular(datos.titular || "");
    setBanco(datos.banco || "");
    setTipo(datos.tipo || "");
    setNumero(datos.numero || "");
  }, []);

  function validar() {
    if (!titular.trim()) {
      showToast("El nombre del titular es obligatorio.", true);
      return false;
    }
    if (!banco) {
      showToast("Selecciona un banco.", true);
      return false;
    }
    if (!tipo) {
      showToast("Selecciona el tipo de cuenta.", true);
      return false;
    }
    if (!numero.trim()) {
      showToast("El número de cuenta es obligatorio.", true);
      return false;
    }
    if (!/^\d{6,20}$/.test(numero.trim())) {
      showToast("El número de cuenta debe tener entre 6 y 20 dígitos.", true);
      return false;
    }
    return true;
  }

  function guardar() {
    if (!validar()) return;
    localStorage.setItem(
      "commercity_banco",
      JSON.stringify({ titular: titular.trim(), banco, tipo, numero: numero.trim() })
    );
    showToast("Cuenta bancaria guardada correctamente.", false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") guardar();
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl p-6 border"
        style={{
          backgroundColor: "var(--color-auth-card-bg)",
          borderColor: "rgba(30,41,59,0.5)",
          boxShadow: "0px 4px 4px 0px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2
            className="font-sans font-extrabold text-xl"
            style={{ color: "var(--color-figma-text-primary)" }}
          >
            Ajustes
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full transition-colors p-1"
            style={{ color: "var(--color-brand-muted-text)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banco card */}
        <div
          className="rounded-2xl p-5 border"
          style={{ backgroundColor: "var(--color-surface-container-lowest)", borderColor: "var(--color-surface-container-lowest)" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre del titular */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans font-medium text-sm" style={{ color: "var(--color-brand-muted-text)" }} htmlFor="titular">Nombre del titular</label>
              <input
                id="titular"
                type="text"
                placeholder="Ej: Daniel Stivens Palacios"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                onKeyDown={handleKeyDown}
                className="rounded-xl px-4 h-12 text-sm font-sans outline-none w-full"
                style={{
                  backgroundColor: "var(--color-surface-container-high)",
                  border: "1px solid var(--color-surface-container-high)",
                  color: "var(--color-on-surface)",
                }}
              />
            </div>

            {/* Banco */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans font-medium text-sm" style={{ color: "var(--color-brand-muted-text)" }} htmlFor="banco">Banco</label>
              <div className="relative">
                <select
                  id="banco"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  className="rounded-xl px-4 h-12 text-sm font-sans outline-none w-full appearance-none cursor-pointer"
                  style={{
                    backgroundColor: "var(--color-surface-container-high)",
                    border: "1px solid var(--color-surface-container-high)",
                    color: "var(--color-on-surface)",
                  }}
                >
                  <option value="" disabled>Selecciona un banco</option>
                  <option value="bancolombia">Bancolombia</option>
                  <option value="davivienda">Davivienda</option>
                  <option value="bbva">BBVA</option>
                  <option value="bogota">Banco de Bogotá</option>
                  <option value="occidente">Banco de Occidente</option>
                  <option value="nequi">Nequi</option>
                  <option value="daviplata">Daviplata</option>
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4L6 8L10 4" stroke="var(--color-brand-muted-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Tipo de cuenta */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans font-medium text-sm" style={{ color: "var(--color-brand-muted-text)" }} htmlFor="tipo">Tipo de cuenta</label>
              <div className="relative">
                <select
                  id="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="rounded-xl px-4 h-12 text-sm font-sans outline-none w-full appearance-none cursor-pointer"
                  style={{
                    backgroundColor: "var(--color-surface-container-high)",
                    border: "1px solid var(--color-surface-container-high)",
                    color: "var(--color-on-surface)",
                  }}
                >
                  <option value="" disabled>Selecciona tipo</option>
                  <option value="ahorros">Ahorros</option>
                  <option value="corriente">Corriente</option>
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4L6 8L10 4" stroke="var(--color-brand-muted-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Número de cuenta */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans font-medium text-sm" style={{ color: "var(--color-brand-muted-text)" }} htmlFor="numero">Número de cuenta</label>
              <input
                id="numero"
                type="text"
                placeholder="Ej: 1234567890"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                onKeyDown={handleKeyDown}
                className="rounded-xl px-4 h-12 text-sm font-sans outline-none w-full"
                style={{
                  backgroundColor: "var(--color-surface-container-high)",
                  border: "1px solid var(--color-surface-container-high)",
                  color: "var(--color-on-surface)",
                }}
              />
            </div>
          </div>

          {/* Save */}
          <div
            className="mt-5 pt-4 flex justify-end"
            style={{ borderTop: "1px solid var(--color-surface-container-high)" }}
          >
            <button
              onClick={guardar}
              className="font-semibold text-sm rounded-3xl px-8 h-12 hover:brightness-110 active:scale-95 transition-all"
              style={{
                background: "linear-gradient(169deg, var(--color-brand-orange) 0%, #e08a0b 100%)",
                color: "var(--color-brand-dark-text)",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Guardar cuenta bancaria
            </button>
          </div>
        </div>

        {/* Toast */}
        <div
          className="fixed bottom-6 right-6 text-sm px-5 py-3 rounded-xl shadow-lg z-[60] transition-opacity duration-300 font-sans"
          style={{
            backgroundColor: "var(--color-auth-card-bg)",
            border: `1px solid ${toast.isError ? "var(--color-error)" : "var(--color-brand-orange)"}`,
            color: "var(--color-on-surface)",
            opacity: toast.visible ? 1 : 0,
            pointerEvents: toast.visible ? "auto" : "none",
          }}
        >
          {toast.msg}
        </div>
      </div>
    </div>
  );
}