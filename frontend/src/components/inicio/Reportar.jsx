import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { getCurrentUser } from "../../api/client.js";
import { crearReporte } from "../../services/reportes.service.js";

// Longitud maxima del motivo aceptada por el backend (POST /api/reportes).
const MOTIVO_MAX = 2000;

/**
 * Modal para reportar un producto del catalogo (RF62/RF63, RF79, RF101).
 * Recibe el producto reportado por prop y envia el reporte real a la API.
 * @param {{producto?: {id: number|string, name?: string}, onClose?: Function}} props
 */
export default function Reportar({ producto, onClose }) {
  const [descripcion, setDescripcion] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [errorDescripcion, setErrorDescripcion] = useState("");
  const [errorEvidencia, setErrorEvidencia] = useState("");
  const [errorEnvio, setErrorEnvio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exitoEnvio, setExitoEnvio] = useState(false);
  const [enfocado, setEnfocado] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  const fileInputRef = useRef(null);

  function agregarArchivos(nuevosArchivos) {
    setArchivos((prev) => {
      const combinados = [...prev];
      nuevosArchivos.forEach((nuevo) => {
        const yaExiste = combinados.some(
          (existente) =>
            existente.name === nuevo.name && existente.size === nuevo.size
        );
        if (!yaExiste) combinados.push(nuevo);
      });
      return combinados;
    });
    setErrorEvidencia("");
  }

  function manejarClickDropZone() {
    fileInputRef.current?.click();
  }

  function manejarCambioInput(e) {
    agregarArchivos(Array.from(e.target.files));
    e.target.value = "";
  }

  function manejarDrop(e) {
    e.preventDefault();
    setArrastrando(false);
    agregarArchivos(Array.from(e.dataTransfer.files));
  }

  async function manejarEnviar() {
    if (enviando) return;

    const motivo = descripcion.trim();
    let valido = true;

    if (!motivo) {
      setErrorDescripcion("La descripción es requerida.");
      valido = false;
    } else if (motivo.length > MOTIVO_MAX) {
      setErrorDescripcion(
        `La descripción no puede superar los ${MOTIVO_MAX} caracteres.`
      );
      valido = false;
    } else {
      setErrorDescripcion("");
    }

    if (archivos.length === 0) {
      setErrorEvidencia("Debes subir al menos un archivo de evidencia.");
      valido = false;
    } else {
      setErrorEvidencia("");
    }

    setErrorEnvio("");
    if (!valido) return;

    if (!producto?.id) {
      setErrorEnvio("No se pudo identificar el producto reportado.");
      return;
    }

    if (!getCurrentUser()) {
      setErrorEnvio("Inicia sesión para reportar un producto.");
      return;
    }

    try {
      setEnviando(true);
      await crearReporte({
        tipo: "Producto",
        motivo,
        productoId: producto.id,
        evidencia: archivos[0],
      });

      setExitoEnvio(true);
      setDescripcion("");
      setArchivos([]);
      setTimeout(() => {
        setExitoEnvio(false);
        onClose?.();
      }, 2000);
    } catch (error) {
      setErrorEnvio(error.message || "No se pudo enviar el reporte.");
    } finally {
      setEnviando(false);
    }
  }

  function manejarCancelar() {
    setDescripcion("");
    setArchivos([]);
    setErrorDescripcion("");
    setErrorEvidencia("");
    setErrorEnvio("");
    onClose?.();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="relative w-full max-w-[560px] rounded-3xl p-6 flex flex-col gap-5 border"
        style={{
          backgroundColor: "var(--color-surface-container-lowest)",
          borderColor: "rgba(239,153,24,0.4)",
          boxShadow: "0px 4px 4px 0px rgba(0,0,0,0.25)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reportar-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2
            id="reportar-title"
            className="font-bold text-lg"
            style={{
              fontFamily: "var(--font-sans)",
              color: "var(--color-on-surface)",
            }}
          >
            Reportar producto
          </h2>
          <button
            onClick={manejarCancelar}
            className="flex items-center justify-center rounded-full transition-colors p-1"
            style={{ color: "var(--color-brand-muted-text)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MOTIVO */}
        <div>
          <p
            className="text-sm uppercase tracking-widest mb-2 font-extrabold"
            style={{ fontFamily: "var(--font-sans)", color: "var(--color-brand-muted-text)" }}
          >
            Motivo
          </p>
          <div
            className="rounded-xl transition-all"
            style={{
              backgroundColor: "var(--color-input-bg)",
              border: "1px solid",
              borderColor: enfocado ? "var(--color-brand-orange)" : "transparent",
              boxShadow: "0px 4px 2px rgba(0,0,0,0.25)",
            }}
          >
            <textarea
              rows={5}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              onFocus={() => setEnfocado(true)}
              onBlur={() => setEnfocado(false)}
              placeholder="Describe el motivo del reporte..."
              className="w-full bg-transparent outline-none rounded-xl p-4 resize-none overflow-y-auto font-medium text-sm"
              style={{ fontFamily: "var(--font-sans)", color: "var(--color-on-surface)" }}
            />
          </div>
          {errorDescripcion && (
            <p className="text-xs mt-1" style={{ color: "var(--color-error)" }}>
              {errorDescripcion}
            </p>
          )}
        </div>

        {/* EVIDENCIA */}
        <div>
          <p
            className="text-sm uppercase tracking-widest mb-2 font-extrabold"
            style={{ fontFamily: "var(--font-sans)", color: "var(--color-brand-muted-text)" }}
          >
            Evidencia
          </p>
          <div
            onClick={manejarClickDropZone}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={manejarDrop}
            className="rounded-xl h-36 flex flex-col items-center justify-center gap-2 cursor-pointer border-2 transition-all"
            style={{
              backgroundColor: "var(--color-input-bg)",
              borderColor: arrastrando ? "var(--color-brand-orange)" : "transparent",
              boxShadow: "0px 4px 2px rgba(0,0,0,0.25)",
            }}
          >
            <svg
              className="w-8 h-8 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="var(--color-brand-orange)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="font-medium text-sm text-center px-6" style={{ color: "var(--color-on-surface)" }}>
              Haz click para subir tus archivos aquí
            </p>
            <p className="text-xs text-center px-6 truncate max-w-full" style={{ color: "var(--color-placeholder-gray-600)" }}>
              {archivos.map((f) => f.name).join(", ") || "Sin archivos seleccionados"}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={manejarCambioInput}
            />
          </div>
          {errorEvidencia && (
            <p className="text-xs mt-1" style={{ color: "var(--color-error)" }}>
              {errorEvidencia}
            </p>
          )}
          {exitoEnvio && (
            <p className="text-xs mt-1" style={{ color: "var(--color-brand-orange)" }}>
              Reporte enviado exitosamente
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <button
            onClick={manejarCancelar}
            className="font-semibold text-sm rounded-full px-6 py-3 active:scale-95 transition-all"
            style={{
              backgroundColor: "var(--color-surface-container-high)",
              color: "var(--color-on-surface)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={manejarEnviar}
            disabled={enviando}
            className="font-semibold text-sm rounded-full px-6 py-3 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--color-brand-orange)",
              color: "var(--color-brand-dark-text)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {enviando ? "Enviando..." : "Enviar reporte"}
          </button>
        </div>

        {errorEnvio && (
          <p className="text-xs text-right" style={{ color: "var(--color-error)" }}>
            {errorEnvio}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
