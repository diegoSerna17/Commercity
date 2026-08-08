import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

// API base del backend (misma convencion que el resto del proyecto).
const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:5000";

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

/**
 * Obtiene el token JWT del administrador (guardado en login como "commercity_token").
 * @returns {string|null}
 */
function obtenerToken() {
  return localStorage.getItem("commercity_token") || null;
}

/**
 * Ajustes del administrador (RF75/RF76): registro de la cuenta bancaria de
 * Commercity contra el backend (cifrado RNF11, es_commercity = 1).
 */
export default function AjustesAdministrador({ onClose }) {
  const [titular, setTitular] = useState("");
  const [banco, setBanco] = useState("");
  const [tipo, setTipo] = useState("");
  const [numero, setNumero] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const { toast, showToast } = useToast();

  // Carga la cuenta bancaria de Commercity desde el backend (RF76).
  useEffect(() => {
    const token = obtenerToken();
    if (!token) {
      setCargando(false);
      showToast("Inicia sesión como administrador para gestionar la cuenta bancaria.", true);
      return;
    }

    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/admin/mi-cuenta-bancaria`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await resp.json().catch(() => null);
        if (resp.ok && body?.data?.registrado && body.data.datos) {
          const d = body.data.datos;
          setTitular(d.titular_nombre || "");
          setBanco(d.banco || "");
          setTipo(d.tipo_cuenta || "");
          setNumero(d.numero_cuenta || "");
        }
      } catch (e) {
        showToast("No se pudo cargar la cuenta bancaria.", true);
      } finally {
        setCargando(false);
      }
    })();
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

  async function guardar() {
    if (!validar()) return;
    const token = obtenerToken();
    if (!token) {
      showToast("Inicia sesión como administrador para guardar.", true);
      return;
    }

    setGuardando(true);
    try {
      const resp = await fetch(`${API_BASE}/api/admin/mi-cuenta-bancaria`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titular_nombre: titular.trim(),
          banco,
          tipo_cuenta: tipo,
          numero_cuenta: numero.trim(),
        }),
      });
      const body = await resp.json().catch(() => null);
      if (resp.ok) {
        showToast(body?.message || "Cuenta bancaria guardada correctamente.", false);
      } else {
        showToast(body?.error?.message || "No se pudo guardar la cuenta bancaria.", true);
      }
    } catch (e) {
      showToast("Error de conexión con el servidor.", true);
    } finally {
      setGuardando(false);
    }
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
                placeholder="Ej: CommerCity SAS"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={cargando}
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
                  disabled={cargando}
                  className="rounded-xl px-4 h-12 text-sm font-sans outline-none w-full appearance-none cursor-pointer"
                  style={{
                    backgroundColor: "var(--color-surface-container-high)",
                    border: "1px solid var(--color-surface-container-high)",
                    color: "var(--color-on-surface)",
                  }}
                >
                  <option value="" disabled>Selecciona un banco</option>
                  <option value="Bancolombia">Bancolombia</option>
                  <option value="Davivienda">Davivienda</option>
                  <option value="BBVA">BBVA</option>
                  <option value="Banco de Bogotá">Banco de Bogotá</option>
                  <option value="Banco de Occidente">Banco de Occidente</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Daviplata">Daviplata</option>
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
                  disabled={cargando}
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
                disabled={cargando}
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
              disabled={cargando || guardando}
              className="font-semibold text-sm rounded-3xl px-8 h-12 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(169deg, var(--color-brand-orange) 0%, #e08a0b 100%)",
                color: "var(--color-brand-dark-text)",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              {guardando ? "Guardando..." : "Guardar cuenta bancaria"}
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
