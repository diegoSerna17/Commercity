import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
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

  function volver() {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  }

  function salir() {
    localStorage.removeItem("commercity_admin_session");
    sessionStorage.clear();
    navigate("/login");
  }

  const inputClass = "w-full rounded-xl px-4 h-12 text-sm font-sans outline-none";
  const inputStyle = {
    backgroundColor: "var(--color-input-bg)",
    border: "1px solid var(--color-input-bg)",
    color: "var(--color-on-surface)",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-surface-container-lowest">
      <header
        className="sticky top-0 z-50 h-14 flex items-center justify-between px-5 bg-auth-card-bg"
        style={{ borderBottom: "1px solid var(--color-figma-divider)" }}
      >
        <span className="font-sans font-extrabold text-2xl tracking-tight" style={{ color: "var(--color-brand-orange)" }}>
          CommerCity
        </span>
        <button
          onClick={volver}
          className="font-sans font-bold text-sm rounded-xl px-5 py-2 hover:brightness-110 active:scale-95 transition-all bg-brand-orange text-brand-dark-text"
        >
          Volver
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-7">
        <h1 className="font-sans font-extrabold text-3xl tracking-tight leading-tight text-on-surface">Ajustes</h1>
        <p className="font-sans font-semibold text-lg mt-1 text-brand-muted-text">Administra los datos importantes de CommerCity.</p>

        <h2 className="font-sans font-bold text-xl mt-7 text-on-surface">Registro de cuenta bancaria</h2>
        <p className="font-sans font-medium text-base mt-0.5 text-brand-muted-text">Registra la cuenta bancaria de Commercity.</p>

        <div className="rounded-card-lg mt-4 p-6 bg-auth-card-bg" style={{ border: "1px solid var(--color-auth-card-bg)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
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
                className={inputClass}
                style={inputStyle}
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
                  className={`${inputClass} appearance-none cursor-pointer`}
                  style={inputStyle}
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
                  className={`${inputClass} appearance-none cursor-pointer`}
                  style={inputStyle}
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
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>

          <div
            className="mt-6 pt-4 flex justify-end"
            style={{ borderTop: "1px solid var(--color-input-bg)" }}
          >
            <button
              onClick={guardar}
              className="font-sans font-semibold text-sm rounded-3xl px-8 h-12 hover:brightness-110 active:scale-95 transition-all"
              style={{
                background: "linear-gradient(169deg, var(--color-brand-orange) 0%, #e08a0b 100%)",
                color: "var(--color-brand-dark-text)",
              }}
            >
              Guardar cuenta bancaria
            </button>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-sans font-bold text-2xl tracking-tight text-on-surface">SALIR</h2>
          <p className="font-sans font-medium text-lg mt-1 text-brand-muted-text">En este lugar puedes salir del panel administrador.</p>
          <button
            onClick={salir}
            className="mt-4 font-sans font-extrabold text-xl rounded-xl px-7 py-2.5 shadow hover:brightness-110 active:scale-95 transition-all"
            style={{
              border: "1px solid var(--color-brand-orange)",
              background: "var(--color-sidebar-active-bg)",
              color: "var(--color-brand-orange)",
            }}
          >
            Salir
          </button>
        </div>
      </main>

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
  );
}
