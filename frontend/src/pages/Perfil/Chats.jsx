import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerConversacion,
  enviarMensaje,
  enviarArchivo,
} from "../../services/chat.service.js";
import { getCurrentUser } from "../../services/api.js";
import { API_BASE_URL } from "../../constants/config.js";

// JS Icono de adjuntar archivo como SVG inline
const PaperclipIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

// JS Icono de enviar mensaje como SVG inline
const SendIcon = () => (
  <svg className="w-6 h-6 text-brand-dark-text -mt-1 ml-[-2px]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

// JS Formatea un timestamp ISO a hora local (HH:MM)
const formatearHora = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
};

// TW Renderiza una burbuja de mensaje individual segun su tipo
const MessageBubble = ({ msg }) => {
  const isOutgoing = msg.type === "outgoing";

  return (
    <div className={`flex flex-col ${isOutgoing ? "items-end" : "items-start"}`}>
      <div
        className={`px-5 py-3 rounded-2xl max-w-[448px] ${
          isOutgoing
            ? "bg-brand-orange rounded-tr-none text-brand-dark-text"
            : "bg-surface-container rounded-tl-none border border-border-subtle"
        }`}
      >
        {/* TW Adjunto: imagen o archivo */}
        {msg.archivoUrl &&
          (msg.tipoMensaje === "imagen" ? (
            <img src={msg.archivoUrl} alt="Imagen" className="rounded-lg max-h-64 mb-2 object-contain" />
          ) : (
            <a
              href={msg.archivoUrl}
              target="_blank"
              rel="noreferrer"
              className={`text-sm underline ${isOutgoing ? "text-brand-dark-text" : "text-brand-orange"}`}
            >
              Ver archivo
            </a>
          ))}
        {msg.text && (
          <p className={`text-sm ${isOutgoing ? "font-medium" : "text-on-surface"}`}>{msg.text}</p>
        )}
        <p
          className={`text-[10px] text-right mt-1 ${
            isOutgoing ? "text-brand-dark-text/60" : "text-brand-muted-text"
          }`}
        >
          {msg.time}
        </p>
      </div>
    </div>
  );
};

const Chats = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // JS Recupera el contacto desde sessionStorage
  const contacto = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("activeChat") || "null");
    } catch {
      return null;
    }
  })();

  const currentUser = getCurrentUser();

  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // RE Si no hay contacto, vuelve a la lista; si lo hay, carga la conversacion
  useEffect(() => {
    if (!contacto) {
      navigate("/messages", { replace: true });
      return;
    }
    const cargar = async () => {
      try {
        const res = await obtenerConversacion(contacto.id);
        setMensajes(res.data?.mensajes || []);
      } catch (e) {
        setError(e.message || "No se pudo cargar la conversación");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [contacto, navigate]);

  // JS Convierte mensajes del backend a burbujas (entrante/saliente)
  const burbujas = mensajes.map((m) => ({
    id: m.id,
    type: currentUser && m.emisor_id === currentUser.id ? "outgoing" : "incoming",
    text: m.mensaje || "",
    archivoUrl: m.archivo_url ? `${API_BASE_URL}${m.archivo_url}` : null,
    tipoMensaje: m.tipo_mensaje,
    time: formatearHora(m.enviado_at),
  }));

  // JS Envia un mensaje de texto y refresca la conversacion
  const handleEnviar = async () => {
    const mensaje = texto.trim();
    if (!mensaje || enviando) return;
    setEnviando(true);
    setError("");
    try {
      await enviarMensaje(contacto.id, mensaje);
      setTexto("");
      const res = await obtenerConversacion(contacto.id);
      setMensajes(res.data?.mensajes || []);
    } catch (e) {
      setError(e.message || "No se pudo enviar el mensaje");
    } finally {
      setEnviando(false);
    }
  };

  // JS Envia un archivo/imagen y refresca la conversacion
  const handleArchivo = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo || enviando) return;
    setEnviando(true);
    setError("");
    try {
      await enviarArchivo(contacto.id, archivo);
      const res = await obtenerConversacion(contacto.id);
      setMensajes(res.data?.mensajes || []);
    } catch (err) {
      setError(err.message || "No se pudo enviar el archivo");
    } finally {
      setEnviando(false);
    }
  };

  if (!contacto) {
    return null;
  }

  return (
    <div className="flex h-screen bg-surface-container-lowest">
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* TW Encabezado del chat */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-border-subtle bg-surface-container-lowest/60 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <img
                alt={contacto.name}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-white/20"
                src={contacto.avatar || ""}
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-success border-2 border-surface-container-lowest rounded-full" />
            </div>
            <h2 className="font-bold text-base sm:text-lg text-on-surface">{contacto.name}</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end max-w-[50%]">
            <button
              onClick={() => navigate(-1)}
              className="bg-brand-orange hover:bg-orange-500 text-brand-dark-text px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors"
            >
              Volver
            </button>
            <button className="bg-surface-container hover:bg-white/10 px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors border border-border-subtle text-on-surface">
              Ver Perfil
            </button>
            <button className="bg-report-red-bg text-report-red-text hover:bg-report-red-hover px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors border border-report-red-hover/30">
              Reportar
            </button>
          </div>
        </header>

        {/* TW Cuerpo de la conversacion */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {cargando && (
            <p className="text-brand-muted-text text-sm text-center py-8">Cargando mensajes...</p>
          )}
          {!cargando && error && (
            <p className="text-report-red-text text-sm text-center py-8">{error}</p>
          )}
          {!cargando && !error && burbujas.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-brand-muted-text text-sm">No hay mensajes en esta conversación.</p>
            </div>
          )}
          {burbujas.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
        </div>

        {/* TW Barra de entrada de mensajes */}
        <div className="p-4 sm:p-6 bg-surface-container-lowest border-t border-border-subtle">
          <div className="bg-surface-container/50 rounded-2xl p-2 flex items-center gap-3 border border-border-subtle shadow-inner">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt,.zip"
              className="hidden"
              onChange={handleArchivo}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-white/5 rounded-lg text-brand-muted-text"
              title="Adjuntar archivo"
            >
              <PaperclipIcon />
            </button>
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder-brand-muted-text outline-none"
              placeholder="Escribe un mensaje..."
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEnviar();
              }}
            />
            <button
              type="button"
              onClick={handleEnviar}
              disabled={enviando}
              className="w-12 h-12 bg-brand-orange hover:bg-orange-500 rounded-xl flex items-center justify-center transition-transform active:scale-95 disabled:opacity-60"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chats;
