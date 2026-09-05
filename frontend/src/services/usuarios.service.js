import { request } from "../api/client.js";

export const actualizarPerfil = (nombre_completo) =>
  request("/api/usuarios/me", {
    method: "PATCH",
    body: { nombre_completo },
  });
