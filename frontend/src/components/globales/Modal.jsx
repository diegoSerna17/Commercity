import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const FOCUSABLES = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Modal accesible compartido (WCAG 2.1):
 *  - role="dialog" + aria-modal + aria-labelledby (o aria-label);
 *  - cierre con Escape y clic en el fondo;
 *  - foco atrapado dentro del panel y devuelto al elemento que lo abrio.
 *
 * @param {object} props
 * @param {boolean} props.abierto
 * @param {Function} props.onClose
 * @param {string} [props.tituloId] id del titulo visible (aria-labelledby)
 * @param {string} [props.etiqueta] aria-label si no hay titulo visible
 * @param {string} [props.panelClassName] clases extra del panel
 * @param {string} [props.zIndex] clase de z-index del contenedor
 */
export default function Modal({
  abierto,
  onClose,
  tituloId,
  etiqueta,
  children,
  panelClassName = "",
  zIndex = "z-[999999]",
}) {
  const panelRef = useRef(null);
  const focoPrevioRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;

    focoPrevioRef.current = document.activeElement;
    const panel = panelRef.current;
    const primerFoco = panel?.querySelector(FOCUSABLES) || panel;
    primerFoco?.focus?.();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const focusables = Array.from(panel.querySelectorAll(FOCUSABLES));
      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus?.();
        return;
      }
      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === primero) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowPrevio;
      const previo = focoPrevioRef.current;
      if (previo && typeof previo.focus === "function") previo.focus();
    };
  }, [abierto, onClose]);

  if (!abierto) return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/70 p-4`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-label={tituloId ? undefined : etiqueta}
        tabIndex={-1}
        className={`w-full outline-none ${panelClassName}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
