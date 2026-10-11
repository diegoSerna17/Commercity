import { API_BASE_URL, USER_KEY } from "../constants/config.js";

// F4 (DEC-005): la sesion web viaja en una cookie httpOnly; el JWT no se guarda
// ni se lee en localStorage. Solo se persisten datos no sensibles del usuario.

/** @returns {object|null} Usuario de la sesion guardado para la UI. */
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setCurrentUser = (user) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // localStorage no disponible: la sesion sigue valida por la cookie httpOnly.
  }
};

export const clearCurrentUser = () => {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    // silencio: almacenamiento no disponible
  }
};

// Rutas publicas: un 401 aqui (credenciales o enlace invalido) no es "sesion caducada".
const RUTAS_PUBLICAS = ["/login", "/register", "/recover", "/restore"];

const esRutaPublica = (pathname) =>
  RUTAS_PUBLICAS.some((ruta) => String(pathname || "").toLowerCase().startsWith(ruta));

/**
 * Cliente HTTP base contra la API del backend.
 * Envia la cookie httpOnly de sesion (credentials: include) y valida el
 * contrato { success, data | error }. A-5: el 401 global solo limpia la sesion
 * y redirige cuando habia sesion previa y la ruta no es publica.
 */
export async function request(path, { method = "GET", body, headers, isForm = false } = {}) {
  const config = {
    method,
    credentials: "include",
    headers: { ...headers },
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
    // A-5: 401 global. Solo es "sesion caducada" si habia sesion y no es ruta publica.
    if (res.status === 401) {
      const teniaSesion = Boolean(getCurrentUser());
      const hayNavegador = typeof window !== "undefined" && Boolean(window.location);
      if (teniaSesion && hayNavegador && !esRutaPublica(window.location.pathname)) {
        clearCurrentUser();
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
