import { useCallback, useEffect, useRef, useState } from "react";

const DURACION_POR_DEFECTO_MS = 3000;

/**
 * Controla un aviso temporal con mensaje y estado de error.
 * @param {number} [duracionMs] ms que el aviso permanece visible antes de ocultarse
 * @returns {{toast: {visible: boolean, msg: string, isError: boolean}, showToast: (msg: string, isError?: boolean) => void}}
 */
export function useToast(duracionMs = DURACION_POR_DEFECTO_MS) {
  const [toast, setToast] = useState({ visible: false, msg: "", isError: false });
  const timerRef = useRef(null);

  const showToast = useCallback(
    (msg, isError = false) => {
      clearTimeout(timerRef.current);
      setToast({ visible: true, msg, isError });
      timerRef.current = setTimeout(() => {
        setToast((actual) => ({ ...actual, visible: false }));
      }, duracionMs);
    },
    [duracionMs]
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { toast, showToast };
}
