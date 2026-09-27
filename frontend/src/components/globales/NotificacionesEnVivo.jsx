import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import {
  listarNotificaciones,
  marcarLeida,
} from "../../services/notificaciones.service.js";

// JS Intervalo de consulta de nuevas notificaciones en milisegundos
const INTERVALO_MS = 7000;
const DURACION_TOAST_MS = 6000;

const mapearRuta = (url, tipo) => {
  if (tipo === "mensajes") return "/messages";
  const mapa = {
    "/perfil/historial": "/history",
    "/perfil/pedidos": "/orders",
    "/mensajes": "/messages",
    "/perfil": "/profile",
    "/carrito": "/cart",
  };
  return mapa[url] || "/";
};

// RE Componente global: consulta periodicamente si hay notificaciones nuevas
// RE y muestra un toast automatico (mensajes, compras, pedidos, etc.)
export default function NotificacionesEnVivo() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const maxIdRef = useRef(null);

  useEffect(() => {
    let cancelado = false;

    const consultar = async () => {
      try {
        const res = await listarNotificaciones(10);
        if (cancelado) return;

        const notificaciones = res.data?.notificaciones || [];
        if (notificaciones.length === 0) return;

        // Primera carga: solo recordar la notificacion mas reciente, sin toast.
        if (maxIdRef.current === null) {
          maxIdRef.current = Math.max(...notificaciones.map((n) => n.id));
          return;
        }

        const nuevas = notificaciones.filter(
          (n) => n.id > maxIdRef.current && !n.leida
        );
        if (nuevas.length === 0) {
          maxIdRef.current = Math.max(...notificaciones.map((n) => n.id));
          return;
        }

        maxIdRef.current = Math.max(...notificaciones.map((n) => n.id));
        setToast(nuevas[0]);
      } catch {
        // silencio
      }
    };

    consultar();
    const timer = setInterval(consultar, INTERVALO_MS);

    return () => {
      cancelado = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), DURACION_TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  const handleClick = async () => {
    if (!toast) return;
    if (!toast.leida) {
      try {
        await marcarLeida(toast.id);
      } catch {
        // silencio
      }
    }
    navigate(mapearRuta(toast.url_redireccion, toast.tipo));
    setToast(null);
  };

  if (!toast) return null;

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-5 right-5 z-[60] flex w-[calc(100vw-2.5rem)] max-w-[360px] items-center gap-3 rounded-2xl border border-surface-container bg-auth-card-bg p-4 text-left shadow-2xl transition-transform"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange/15 text-brand-orange">
        <Bell className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-sm font-semibold text-on-surface">
          Nueva notificación
        </span>
        <span className="block truncate text-body-xs text-brand-muted-text">
          {toast.descripcion}
        </span>
      </span>
    </button>
  );
}
