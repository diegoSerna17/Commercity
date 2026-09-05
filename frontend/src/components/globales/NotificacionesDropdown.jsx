import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCheck } from "lucide-react";
import {
  listarNotificaciones,
  marcarTodasLeidas,
  marcarLeida,
  eliminarNotificacion,
  eliminarTodas,
} from "../../services/notificaciones.service.js";

const VISIBLE_LIMIT = 4;

const mapearRuta = (url) => {
  const mapa = {
    "/perfil/historial": "/history",
    "/perfil/pedidos": "/orders",
    "/mensajes": "/messages",
    "/perfil": "/profile",
    "/carrito": "/cart",
  };
  return mapa[url] || "/";
};

const tiempoRelativo = (iso) => {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";

  const segundos = Math.floor((Date.now() - fecha.getTime()) / 1000);
  if (segundos < 60) return "Ahora";

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `Hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  return `Hace ${dias} d`;
};

export default function NotificacionesDropdown({ onChange }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const notificarCambio = () => {
    if (typeof onChange === "function") onChange();
  };

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await listarNotificaciones(50);
        setNotifications(res.data?.notificaciones || []);
      } catch (e) {
        setError(e.message || "No se pudieron cargar las notificaciones");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const noLeidas = notifications.filter((n) => !n.leida).length;
  const visibleNotifications = showAll
    ? notifications
    : notifications.slice(0, VISIBLE_LIMIT);
  const hasHiddenNotifs = notifications.length > VISIBLE_LIMIT;

  const handleMarcarTodas = async () => {
    try {
      await marcarTodasLeidas();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, leida: true }))
      );
      notificarCambio();
    } catch {
      // silencio
    }
  };

  const handleClearAll = async () => {
    try {
      await eliminarTodas();
      setNotifications([]);
      setShowAll(false);
      notificarCambio();
    } catch {
      // silencio
    }
  };

  const handleDismiss = async (e, id) => {
    e.stopPropagation();
    try {
      await eliminarNotificacion(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      notificarCambio();
    } catch {
      // silencio
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.leida) {
      try {
        await marcarLeida(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, leida: true } : n))
        );
        notificarCambio();
      } catch {
        /* ignore */
      }
    }
    if (notif.tipo === "mensajes") {
      navigate("/messages");
      return;
    }
    navigate(mapearRuta(notif.url_redireccion));
  };

  return (
    <div className="w-full max-w-[390px] min-w-[320px] rounded-xl overflow-hidden shadow-2xl border border-surface-container bg-surface-container-low">
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container">
        <span className="font-sans text-body-sm font-medium tracking-wide select-none text-on-surface">
          NOTIFICACIONES
        </span>
        <div className="flex items-center gap-3">
          {noLeidas > 0 && (
            <button
              onClick={handleMarcarTodas}
              className="font-sans text-body-xs hover:opacity-75 transition-opacity focus:outline-none text-brand-muted-text"
            >
              Marcar leídas
            </button>
          )}
          <button
            onClick={handleClearAll}
            className="font-sans text-body-xs hover:opacity-75 transition-opacity focus:outline-none text-brand-orange"
          >
            Limpiar todo
          </button>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: showAll ? "378px" : "none" }}>
        {cargando && (
          <div className="flex items-center justify-center py-12 font-sans text-body-xs text-brand-muted-text">
            Cargando notificaciones...
          </div>
        )}

        {!cargando && error && (
          <div className="flex items-center justify-center py-12 font-sans text-body-xs text-report-red-text">
            {error}
          </div>
        )}

        {!cargando && !error && notifications.length === 0 && (
          <div className="flex items-center justify-center py-12 font-sans text-body-xs text-brand-muted-text">
            No hay notificaciones
          </div>
        )}

        {!cargando &&
          !error &&
          visibleNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`relative flex items-center justify-between px-5 py-3.5 border-b border-surface-container transition-colors cursor-pointer ${
                !notif.leida
                  ? "bg-brand-orange/10 hover:bg-brand-orange/15"
                  : "hover:bg-surface-container-high"
              }`}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-0.5">
                  {!notif.leida ? (
                    <span className="w-2 h-2 rounded-full bg-brand-orange shrink-0" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5 shrink-0 text-brand-muted-text" />
                  )}
                  <p className="font-sans text-body-xs leading-snug truncate text-on-surface font-medium">
                    {notif.tipo || "Notificación"}
                  </p>
                </div>
                <p className="font-sans text-body-xs leading-snug mb-0.5 truncate text-brand-muted-text">
                  {notif.descripcion}
                </p>
                <p className="font-sans text-[12px] leading-snug mt-1 text-brand-orange">
                  {tiempoRelativo(notif.fecha_hora)}
                </p>
              </div>

              <div className="flex items-center h-full">
                <button
                  onClick={(e) => handleDismiss(e, notif.id)}
                  className="font-sans text-body-sm transition-colors focus:outline-none px-1 text-brand-muted-text hover:text-on-surface"
                  aria-label="Cerrar notificación"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
      </div>

      {hasHiddenNotifs && (
        <div className="border-t border-surface-container px-5 py-4 flex justify-center bg-surface-container-low">
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="font-sans text-body-xs text-center transition-colors focus:outline-none text-brand-muted-text hover:text-on-surface"
          >
            {showAll ? "Ver menos" : "Ver todas las notificaciones"}
          </button>
        </div>
      )}
    </div>
  );
}
