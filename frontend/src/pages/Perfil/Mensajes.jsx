import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarConversaciones } from "../../services/chat.service.js";

const formatearHora = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
};

const previewDe = (conv) => {
  const ultimo = conv.ultimo_mensaje || {};
  if (ultimo.mensaje) return ultimo.mensaje;
  if (ultimo.tipo_mensaje === "imagen") return "Imagen";
  if (ultimo.archivo_url) return "Archivo";
  return "";
};

const Avatar = ({ usuario }) => {
  if (usuario.foto_perfil) {
    return (
      <img
        alt={usuario.nombre_completo}
        src={usuario.foto_perfil}
        className="w-14 h-14 rounded-full object-cover border border-surface-container-high"
      />
    );
  }
  return (
    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-brand-orange text-auth-card-bg font-bold text-lg border border-surface-container-high">
      {(usuario.nombre_completo || "?").charAt(0).toUpperCase()}
    </div>
  );
};

const Mensajes = () => {
  const navigate = useNavigate();
  const [conversaciones, setConversaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await listarConversaciones();
        setConversaciones(res.data || []);
      } catch (e) {
        setError(e.message || "No se pudieron cargar las conversaciones");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const abrirChat = (usuario) => {
    sessionStorage.setItem(
      "activeChat",
      JSON.stringify({
        id: usuario.id,
        name: usuario.nombre_completo,
        avatar: usuario.foto_perfil || "",
      })
    );
    navigate("/messages/chat");
  };

  return (
    <div className="flex h-screen bg-surface-container-lowest">
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 md:px-padding-xl py-3 md:py-padding-lg border-b border-border-subtle shrink-0">
          <div className="flex-1 text-center">
            <h2 className="text-brand-orange text-headline-sm font-bold">Mensajes</h2>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-padding-lg py-padding-sm bg-brand-orange text-auth-card-bg font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            Volver
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-padding-lg lg:p-padding-2xl max-w-5xl mx-auto w-full">
          {cargando && (
            <p className="text-brand-muted-text text-sm text-center py-8">
              Cargando conversaciones...
            </p>
          )}

          {!cargando && error && (
            <p className="text-report-red-text text-sm text-center py-8">{error}</p>
          )}

          {!cargando && !error && conversaciones.length === 0 && (
            <p className="text-brand-muted-text text-sm text-center py-8">
              No tienes conversaciones.
            </p>
          )}

          <div className="space-y-md">
            {conversaciones.map((conv) => (
              <article
                key={conv.usuario.id}
                onClick={() => abrirChat(conv.usuario)}
                className={`group flex items-center gap-md p-padding-md rounded-card-lg transition-all cursor-pointer ${
                  conv.no_leidos > 0
                    ? "border border-brand-orange/40 bg-surface-container-low hover:bg-surface-container"
                    : "border border-transparent hover:border-surface-container hover:bg-surface-container-low"
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar usuario={conv.usuario} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-xs">
                    <h4
                      className={`font-bold text-base ${
                        conv.no_leidos > 0 ? "text-on-surface" : "text-brand-muted-text"
                      }`}
                    >
                      {conv.usuario.nombre_completo}
                    </h4>
                    <span className="text-[10px] uppercase tracking-tighter text-brand-muted-text">
                      {formatearHora(conv.ultimo_mensaje?.enviado_at)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm truncate pr-md text-brand-muted-text">{previewDe(conv)}</p>
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
