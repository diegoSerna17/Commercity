// RE Titulo: Chats - Pagina de conversacion individual con un contacto
//
// RE Implementacion React: useState, useEffect, useNavigate y useLocation
// RE para manejo de estado, persistencia via sessionStorage y navegacion
//
// JS Codigo y componentes: renderiza la conversacion completa con burbujas
// JS de mensajes entrantes y salientes, tarjeta de producto preview, input
// JS bar para escribir. Los datos se obtienen de location.state o sessionStorage
//
// TW Clases Tailwind: tokens personalizados como bg-surface-container-lowest,
// TW bg-surface-container, bg-brand-orange, text-brand-muted-text,
// TW text-report-red-text, bg-report-red-bg, border-border-subtle.
// TW Layout flex con sidebar y main, burbujas con rounded-2xl

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar";

// JS Icono de adjuntar archivo como SVG inline
const PaperclipIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

// JS Icono de camara como SVG inline
const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

// JS Icono de enviar mensaje como SVG inline con rotacion 45deg
const SendIcon = () => (
  <svg className="w-6 h-6 text-brand-dark-text -mt-1 ml-[-2px]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

// TW Renderiza una burbuja de mensaje individual segun su tipo
const MessageBubble = ({ msg }) => {
  // TW Tarjeta de producto preview
  if (msg.type === "product") {
    return (
      <div className="w-full">
        <div className="max-w-80 bg-surface-container rounded-2xl overflow-hidden shadow-2xl">
          <div className="aspect-square bg-[#1a1a20] flex items-center justify-center">
            <img alt={msg.productName} className="object-contain p-4" src={msg.productImage} />
          </div>
          <div className="p-4 space-y-2">
            <h3 className="font-semibold text-lg text-on-surface">{msg.productName}</h3>
            <p className="text-brand-orange font-bold">{msg.productPrice}</p>
            <button className="w-full bg-brand-orange hover:opacity-90 text-brand-dark-text py-2.5 rounded-lg text-sm font-bold transition-opacity">
              Ver Producto
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TW Burbuja de mensaje entrante (izquierda)
  if (msg.type === "incoming") {
    return (
      <div className="flex flex-col items-start">
        <div className="bg-surface-container px-5 py-3 rounded-2xl max-w-[448px] rounded-tl-none border border-border-subtle">
          <p className="text-sm text-on-surface">{msg.text}</p>
          <p className="text-[10px] text-brand-muted-text text-right mt-1">{msg.time}</p>
        </div>
      </div>
    );
  }

  // TW Burbuja de mensaje saliente (derecha)
  if (msg.type === "outgoing") {
    return (
      <div className="flex flex-col items-end">
        <div className="bg-brand-orange px-5 py-3 rounded-2xl max-w-[448px] rounded-tr-none text-brand-dark-text">
          <p className="text-sm font-medium">{msg.text}</p>
          <p className="text-[10px] text-brand-dark-text/60 text-right mt-1">{msg.time}</p>
        </div>
      </div>
    );
  }

  return null;
};

const Chats = () => {
  // RE Hook para navegacion programatica
  const navigate = useNavigate();
  // RE Hook para obtener los datos del contacto desde el state de navegacion
  const location = useLocation();
  // RE Estado local para el mensaje activo con persistencia
  const [message, setMessage] = useState(null);

  // RE Carga el mensaje desde route state o sessionStorage en caso de refresh
  useEffect(() => {
    const stateMsg = location.state?.message;

    if (stateMsg) {
      setMessage(stateMsg);
      sessionStorage.setItem("activeChat", JSON.stringify(stateMsg));
    } else {
      // JS Fallback a sessionStorage si hay refresh
      const stored = sessionStorage.getItem("activeChat");
      if (stored) {
        setMessage(JSON.parse(stored));
      } else {
        navigate("/messages", { replace: true });
      }
    }
  }, [location.state, navigate]);

  // JS Renderiza pantalla de carga mientras se resuelve el estado
  if (!message) {
    return null;
  }

  return (
    <div className="flex h-screen bg-surface-container-lowest">
      <Navbar />
      {/* TW Contenido principal del chat */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* TW Encabezado del chat con informacion del contacto y acciones */}
        <header className="flex items-center justify-between p-6 border-b border-border-subtle bg-surface-container-lowest/60 backdrop-blur-md sticky top-0 z-10">
          {/* TW Avatar y nombre del contacto */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                alt={message.name}
                className="w-10 h-10 rounded-full object-cover border border-white/20"
                src={message.avatar}
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-surface-container-lowest rounded-full" />
            </div>
            <h2 className="font-bold text-lg text-on-surface">{message.name}</h2>
          </div>
          {/* TW Botones de accion: Volver, Ver Perfil, Reportar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="bg-brand-orange hover:bg-orange-500 text-brand-dark-text px-6 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              Volver
            </button>
            <button className="bg-surface-container hover:bg-white/10 px-6 py-2 rounded-lg text-sm font-bold transition-colors border border-border-subtle text-on-surface">
              Ver Perfil
            </button>
            <button className="bg-report-red-bg text-report-red-text hover:bg-report-red-hover px-6 py-2 rounded-lg text-sm font-bold transition-colors border border-report-red-hover/30">
              Reportar
            </button>
          </div>
        </header>

        {/* TW Cuerpo de la conversacion con scroll */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* TW Mapeo de mensajes de la conversacion a burbujas */}
          {message.conversation?.map((msg, index) => (
            <MessageBubble key={index} msg={msg} />
          ))}
          {/* TW Mensaje cuando la conversacion esta vacia */}
          {(!message.conversation || message.conversation.length === 0) && (
            <div className="flex items-center justify-center h-full">
              <p className="text-brand-muted-text text-sm">No hay mensajes en esta conversacion.</p>
            </div>
          )}
        </div>

        {/* TW Barra de entrada de mensajes */}
        <div className="p-6 bg-surface-container-lowest border-t border-border-subtle">
          <div className="bg-surface-container/50 rounded-2xl p-2 flex items-center gap-3 border border-border-subtle shadow-inner">
            {/* TW Boton de adjuntar archivo */}
            <button className="p-2 hover:bg-white/5 rounded-lg text-brand-muted-text" title="Adjuntar archivo">
              <PaperclipIcon />
            </button>
            {/* TW Boton de adjuntar imagen */}
            <button className="p-2 hover:bg-white/5 rounded-lg text-brand-muted-text" title="Adjuntar imagen">
              <CameraIcon />
            </button>
            {/* TW Input de texto */}
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder-brand-muted-text outline-none"
              placeholder="Escribe un mensaje..."
              type="text"
            />
            {/* TW Boton de enviar */}
            <button className="w-12 h-12 bg-brand-orange hover:bg-orange-500 rounded-xl flex items-center justify-center transition-transform active:scale-95">
              <SendIcon />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chats;
