import { request } from "../api/client.js";

// Funciones del módulo de Chat interno (RF101).

// Lista de conversaciones del usuario autenticado.
export const listarConversaciones = () => request("/api/chat/conversaciones");

// Historial de mensajes con otro usuario.
export const obtenerConversacion = (usuarioId) => request(`/api/chat/mensajes/${usuarioId}`);

// Marca un mensaje recibido como leído.
export const marcarMensajeLeido = (id) =>
  request(`/api/chat/mensajes/${id}/leido`, { method: "PATCH" });

// Envía un mensaje de texto.
export const enviarMensaje = (receptorId, mensaje) =>
  request("/api/chat", {
    method: "POST",
    body: { receptor_id: receptorId, mensaje },
  });

// Envía un archivo/imagen (multipart). El backend guarda el archivo y responde 201.
export const enviarArchivo = (receptorId, archivo) => {
  const form = new FormData();
  form.append("receptor_id", String(receptorId));
  form.append("archivo", archivo);
  return request("/api/chat", { method: "POST", body: form, isForm: true });
};
