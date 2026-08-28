import { request } from "./api.js";

// Funciones del módulo de usuarios.

// Busca usuarios activos para iniciar una conversación con cualquier persona.
export const buscarUsuarios = (q = "") =>
  request(`/api/usuarios/directorio${q ? `?q=${encodeURIComponent(q)}` : ""}`);

// Actualiza únicamente el nombre de perfil del usuario autenticado.
export const actualizarPerfil = (nombre_completo) =>
  request("/api/usuarios/me", {
    method: "PATCH",
    body: { nombre_completo },
  });
