import { request } from "../api/client.js";

export const listarNotificaciones = (limite = 50) =>
  request(`/api/notificaciones?limite=${limite}`);

export const contarNoLeidas = () => request("/api/notificaciones/no-leidas");

export const marcarTodasLeidas = () =>
  request("/api/notificaciones/leidas", { method: "PATCH" });

export const marcarLeida = (id) =>
  request(`/api/notificaciones/${id}/leida`, { method: "PATCH" });

export const eliminarNotificacion = (id) =>
  request(`/api/notificaciones/${id}`, { method: "DELETE" });

export const eliminarTodas = () =>
  request("/api/notificaciones", { method: "DELETE" });
