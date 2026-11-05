import { Check, CheckCheck, Download } from "lucide-react";

// Componentes de la conversacion de chat (RF105). Extraidos de Chats.jsx para
// mantener la pagina por debajo de 350 lineas. Los helpers de fecha viven en
// utils/formatDate.js.

// JS Icono de adjuntar archivo como SVG inline
export const PaperclipIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

// JS Icono de enviar mensaje como SVG inline
export const SendIcon = () => (
  <svg className="w-6 h-6 text-brand-dark-text -mt-1 ml-[-2px]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const EXTENSIONES = {
  pdf: "PDF",
  doc: "DOC",
  docx: "DOCX",
  xls: "XLS",
  xlsx: "XLSX",
  txt: "TXT",
  zip: "ZIP",
  rar: "RAR",
  jpg: "JPG",
  jpeg: "JPG",
  png: "PNG",
  webp: "WEBP",
  gif: "GIF",
};

const infoArchivo = (url) => {
  const nombre = (url || "").split("/").pop() || "archivo";
  const ext = (nombre.split(".").pop() || "").toLowerCase();
  return {
    nombre,
    etiqueta: EXTENSIONES[ext] || ext.toUpperCase() || "ARCHIVO",
  };
};

const FileAttachment = ({ url, isOutgoing }) => {
  const { nombre, etiqueta } = infoArchivo(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`mt-2 flex items-center gap-3 rounded-xl border p-3 transition-colors ${
        isOutgoing
          ? "border-brand-dark-text/30 bg-brand-dark-text/10 hover:bg-brand-dark-text/20"
          : "border-border-subtle bg-surface-container-lowest hover:bg-surface-container"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold tracking-wide ${
          isOutgoing
            ? "bg-brand-dark-text/20 text-brand-dark-text"
            : "bg-brand-orange/15 text-brand-orange"
        }`}
      >
        {etiqueta}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${
            isOutgoing ? "text-brand-dark-text" : "text-on-surface"
          }`}
        >
          {nombre}
        </p>
        <p
          className={`text-xs ${
            isOutgoing ? "text-brand-dark-text/60" : "text-brand-muted-text"
          }`}
        >
          Archivo adjunto
        </p>
      </div>
      <Download
        className={`h-5 w-5 shrink-0 ${
          isOutgoing ? "text-brand-dark-text" : "text-brand-orange"
        }`}
      />
    </a>
  );
};

/** Burbuja individual de mensaje (texto, imagen o archivo). */
export const MessageBubble = ({ msg }) => {
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
        {msg.archivoUrl &&
          (msg.tipoMensaje === "imagen" ? (
            <img
              src={msg.archivoUrl}
              alt="Imagen"
              loading="lazy"
              className="rounded-lg max-h-64 mb-2 object-contain"
            />
          ) : (
            <FileAttachment url={msg.archivoUrl} isOutgoing={isOutgoing} />
          ))}
        {msg.text && (
          <p className={`text-sm ${isOutgoing ? "font-medium" : "text-on-surface"}`}>{msg.text}</p>
        )}
        <div className="mt-1 flex items-center justify-end gap-1">
          <p
            className={`text-[10px] ${
              isOutgoing ? "text-brand-dark-text/60" : "text-brand-muted-text"
            }`}
          >
            {msg.time}
          </p>
          {isOutgoing &&
            (msg.leido ? (
              <CheckCheck className="h-3.5 w-3.5 text-brand-dark-text" />
            ) : (
              <Check className="h-3.5 w-3.5 text-brand-dark-text/50" />
            ))}
        </div>
      </div>
    </div>
  );
};
