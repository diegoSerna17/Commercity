// RE Titulo: Mensajes - Pagina de bandeja de mensajes
//
// RE Implementacion React: useNavigate para navegacion programatica,
// RE compone el componente Navbar como sidebar
//
// JS Codigo y componentes: lista de conversaciones importada desde
// JS constants/chats.js incluyendo avatar, nombre, hora, preview,
// JS contador de no leidos y conversacion con mensajes
//
// TW Clases Tailwind: tokens personalizados como bg-surface-container-lowest,
// TW bg-surface-container-low, bg-brand-orange, text-brand-muted-text,
// TW border-border-subtle. Items de mensaje con hover y estado activo,
// TW badge de no leidos con rounded-full

import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import MESSAGES from "../../constants/chats";

const Mensajes = () => {
  // RE Hook para navegacion programatica
  const navigate = useNavigate();

  // JS Manejador de clic en conversacion: persiste en sessionStorage y navega
  const handleOpenChat = (msg) => {
    sessionStorage.setItem("activeChat", JSON.stringify(msg));
    navigate("/messages/chat", { state: { message: msg } });
  };

  return (
    <div className="flex h-screen bg-surface-container-lowest">
      <Navbar />
      {/* TW Contenido principal de la pagina */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* TW Encabezado con titulo y boton de retorno */}
        <header className="flex items-center justify-between px-padding-xl py-padding-lg border-b border-border-subtle shrink-0">
          <div className="flex-1 text-center">
            <h2 className="text-brand-orange text-headline-sm font-bold">
              Mensajes
            </h2>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-padding-lg py-padding-sm bg-brand-orange text-auth-card-bg font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            Volver
          </button>
        </header>

        {/* TW Lista de conversaciones con avatares y previsualizacion */}
        <div className="flex-1 overflow-y-auto p-padding-lg md:p-padding-2xl max-w-5xl mx-auto w-full">
          {/* TW Mapeo de datos de mensajes a articulos de la lista */}
          <div className="space-y-md">
            {MESSAGES.map((msg) => (
              <article
                key={msg.id}
                onClick={() => handleOpenChat(msg)}
                className={`group flex items-center gap-md p-padding-md rounded-card-lg transition-all cursor-pointer ${
                  msg.active
                    ? "border border-brand-orange/40 bg-surface-container-low hover:bg-surface-container"
                    : "border border-transparent hover:border-surface-container hover:bg-surface-container-low"
                }`}
              >
                {/* TW Avatar del remitente */}
                <div className="relative shrink-0">
                  <img
                    alt={msg.name}
                    src={msg.avatar}
                    // TW Aplica filtro de escala de grises a avatares inactivos
                    className={`w-14 h-14 rounded-full object-cover border border-surface-container-high ${
                      msg.grayscale ? "grayscale" : ""
                    }`}
                  />
                </div>

                {/* TW Nombre, hora, previsualizacion y badge de no leidos */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-xs">
                    <h4
                      className={`font-bold text-base ${
                        msg.active ? "text-on-surface" : "text-brand-muted-text"
                      }`}
                    >
                      {msg.name}
                    </h4>
                    <span
                      className={`text-[10px] uppercase tracking-tighter ${
                        msg.active ? "text-app-text-muted" : "text-brand-muted-text"
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p
                      className={`text-sm truncate pr-md ${
                        msg.active ? "text-brand-muted-text" : "text-app-text-muted"
                      }`}
                    >
                      {msg.preview}
                    </p>
                    {/* TW Renderiza badge con numero de mensajes no leidos */}
                    {msg.unread > 0 && (
                      <span className="bg-brand-orange text-auth-card-bg font-bold text-[11px] h-5 w-5 flex items-center justify-center rounded-full shrink-0">
                        {msg.unread}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Mensajes;
