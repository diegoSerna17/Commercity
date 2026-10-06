import { API_BASE_URL, TOKEN_KEY, USER_KEY } from "../constants/config.js";

// Gestión del token y usuario autenticado en localStorage.
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const getCurrentUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
export const setCurrentUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));

/**
 * Cliente HTTP base contra la API del backend.
 * Agrega el header Authorization con el token cuando existe.
 * F6 (P2): valida el contrato { success, data } y maneja 401 globalmente
 * (limpia sesion y redirige a /login). Incluye credenciales para la cookie
 * httpOnly (F4) manteniendo compatibilidad con el token en localStorage.
 */
export async function request(path, { method = "GET", body, headers, isForm = false } = {}) {
  const token = getToken();

  const config = {
    method,
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body !== undefined) {
    if (isForm) {
      config.body = body; // FormData para archivos
    } else {
      config.headers["Content-Type"] = "application/json";
      config.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, config);

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    // F6: 401 global. Limpia sesion y redirige a /login (solo navegador).
    if (res.status === 401) {
      try {
        clearToken();
        localStorage.removeItem(USER_KEY);
      } catch { /* almacenamiento no disponible */ }
      if (typeof window !== "undefined" && window.location && !String(window.location.pathname).includes("/login")) {
        window.location.assign("/login");
      }
    }
    const message = data?.error?.message || data?.message || `Error ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  // F6: valida el contrato { success, data } del backend.
  if (data && typeof data === "object" && "success" in data && data.success !== true) {
    const message = data?.error?.message || data?.message || "Respuesta inesperada del servidor";
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}
