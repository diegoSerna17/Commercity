import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function Reportar({ onClose }) {
  const [descripcion, setDescripcion] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [errorDescripcion, setErrorDescripcion] = useState(false);
  const [errorEvidencia, setErrorEvidencia] = useState(false);
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
    setErrorEvidencia(false);
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

  function manejarEnviar() {
    let valido = true;

    if (!descripcion.trim()) {
      setErrorDescripcion(true);
      valido = false;
    } else {
      setErrorDescripcion(false);
    }

    if (archivos.length === 0) {
      setErrorEvidencia(true);
      valido = false;
    } else {
      setErrorEvidencia(false);
    }

    if (!valido) return;

    const formData = new FormData();
    formData.append("descripcion", descripcion.trim());
    archivos.forEach((archivo) => formData.append("evidencia", archivo));

    console.log("Reporte enviado:", {
      descripcion: descripcion.trim(),
      archivos: archivos.map((f) => f.name),
    });

    setExitoEnvio(true);
    setTimeout(() => {
      setExitoEnvio(false);
      onClose?.();
    }, 2000);

    setDescripcion("");
    setArchivos([]);
  }

  function manejarCancelar() {
    setDescripcion("");
    setArchivos([]);
    setErrorDescripcion(false);
    setErrorEvidencia(false);
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
              La descripción es requerida.
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
              Debes subir al menos un archivo de evidencia.
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
            className="font-semibold text-sm rounded-full px-6 py-3 active:scale-95 transition-all"
            style={{
              backgroundColor: "var(--color-brand-orange)",
              color: "var(--color-brand-dark-text)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Enviar reporte
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}