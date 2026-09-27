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
 */
export async function request(path, { method = "GET", body, headers, isForm = false } = {}) {
  const token = getToken();

  const config = {
    method,
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
    const message = data?.error?.message || data?.message || `Error ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}
