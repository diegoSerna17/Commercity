import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NOTIFICATIONS = [
  {
    id: 1,
    title: 'Nueva compra recibida',
    body: "!Tu producto 'Reloj Casio' ha sido vendido",
    time: 'Hace 5 min',
    link: '/ventas/1',
  },
  {
    id: 2,
    title: 'Nuevo mensaje de Juan',
    body: 'Hola, ¿Tienes mas stock del producto?',
    time: 'Hace 2 horas',
    link: '/mensajes/juan',
  },
  {
    id: 3,
    title: 'Pedido enviado',
    body: 'Tu pedido Audifonos Pro ya está en camino',
    time: '1 dia',
    link: '/pedidos/3',
  },
  {
    id: 4,
    title: 'Reporte recibido',
    body: 'El administrador a respondido a tu reporte',
    time: '3 dias',
    link: '/seguridad',
  },
  {
    id: 5,
    title: 'Nuevo seguidor',
    body: 'Mariana Torres ahora te sigue',
    time: '3 dias',
    link: '/perfil/mariana-torres',
  },
  {
    id: 6,
    title: 'Pedido entregado',
    body: 'Tu pedido Mochila Urbana fue entregado',
    time: '4 dias',
    link: '/pedidos/6',
  },
  {
    id: 7,
    title: 'Nuevo mensaje de Camila',
    body: '¿En que ciudad estan ubicados?',
    time: '4 dias',
    link: '/mensajes/camila',
  },
  {
    id: 8,
    title: 'Nuevo seguidor',
    body: 'Andrés Gómez ahora te sigue',
    time: '5 dias',
    link: '/perfil/andres-gomez',
  },
  {
    id: 9,
    title: 'Pedido enviado',
    body: 'Tu pedido Teclado Mecánico ya esta en camino',
    time: '5 dias',
    link: '/pedidos/9',
  },
  {
    id: 10,
    title: 'Nuevo mensaje de Laura',
    body: '¿El producto tiene garantía?',
    time: '6 dias',
    link: '/mensajes/laura',
  },
  {
    id: 11,
    title: 'Nuevo seguidor',
    body: 'Felipe Ramírez ahora te sigue',
    time: '6 dias',
    link: '/perfil/felipe-ramirez',
  },
  {
    id: 12,
    title: 'Nuevo seguidor',
    body: 'Elon Musk ahora te sigue',
    time: '1 semana',
    link: '/pedidos/12',
  },
  {
    id: 13,
    title: 'Nuevo mensaje de Sebastián',
    body: 'Tienes mas Stock de este producto?',
    time: '1 semana',
    link: '/mensajes/sebastian',
  },
  {
    id: 14,
    title: 'Nuevo seguidor',
    body: 'Valentina Ríos ahora te sigue',
    time: '1 semana',
    link: '/perfil/valentina-rios',
  },
];

const VISIBLE_LIMIT = 4;

export default function NotificacionesDropdown() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [showAll, setShowAll] = useState(false);

  const visibleNotifications = showAll
    ? notifications
    : notifications.slice(0, VISIBLE_LIMIT);

  const hasHiddenNotifs = notifications.length > VISIBLE_LIMIT;

  function handleDismiss(e, id) {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function handleClearAll() {
    setNotifications([]);
    setShowAll(false);
  }

  function handleNotificationClick(notif) {
    navigate(notif.link);
  }

  return (
    <div className="w-full max-w-[390px] min-w-[320px] rounded-xl overflow-hidden shadow-2xl border border-surface-container bg-surface-container-low">
      {/* Encabezado */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container">
        <span className="font-sans text-body-sm font-medium tracking-wide select-none text-on-surface">
          NOTIFICACIONES
        </span>
        <button
          onClick={handleClearAll}
          className="font-sans text-body-xs hover:opacity-75 transition-opacity focus:outline-none text-brand-orange"
        >
          Limpiar todo
        </button>
      </div>

      {/* Lista de notificaciones */}
      <div className="overflow-y-auto" style={{ maxHeight: showAll ? "378px" : "none" }}>
        {notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12 font-sans text-body-xs text-brand-muted-text">
            No hay notificaciones
          </div>
        ) : (
          visibleNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className="relative flex items-center justify-between px-5 py-3.5 border-b border-surface-container transition-colors cursor-pointer hover:bg-surface-container-high"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="font-sans text-body-xs leading-snug mb-0.5 truncate text-brand-muted-text">
                  {notif.title}
                </p>
                <p className="font-sans text-body-xs leading-snug mb-0.5 truncate text-brand-muted-text">
                  {notif.body}
                </p>
                <p className="font-sans text-[12px] leading-snug mt-1 text-brand-orange">
                  {notif.time}
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
          ))
        )}
      </div>

      {/* Footer con botón Ver todas / Ver menos */}
      {hasHiddenNotifs && (
        <div className="border-t border-surface-container px-5 py-4 flex justify-center bg-surface-container-low">
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="font-sans text-body-xs text-center transition-colors focus:outline-none text-brand-muted-text hover:text-on-surface"
          >
            {showAll ? 'Ver menos' : 'Ver todas las notificaciones'}
          </button>
        </div>
      )}
    </div>
  );
}