// Gestión del tema visual (Light / Dark / System).
// La preferencia se guarda en localStorage; "system" es el valor por defecto
// cuando el usuario nunca ha elegido un tema o el almacenamiento no esta disponible.

const THEME_KEY = "commercity-theme";

export const TEMAS = ["light", "dark", "system"];

function leerTemaGuardado() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function escribirTemaGuardado(tema) {
  try {
    localStorage.setItem(THEME_KEY, tema);
  } catch {
    // localStorage no disponible (modo privado/cuota): el tema sigue aplicado en memoria.
  }
}

export function obtenerTemaGuardado() {
  const guardado = leerTemaGuardado();
  return TEMAS.includes(guardado) ? guardado : "system";
}

export function temaDelSistema() {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolverTema(tema) {
  return tema === "system" ? temaDelSistema() : tema;
}

export function aplicarTema(tema) {
  document.documentElement.setAttribute("data-theme", resolverTema(tema));
}

export function guardarTema(tema) {
  const normalizado = TEMAS.includes(tema) ? tema : "system";
  escribirTemaGuardado(normalizado);
  aplicarTema(normalizado);
  return normalizado;
}

export function inicializarTema() {
  aplicarTema(obtenerTemaGuardado());

  if (typeof window === "undefined" || !window.matchMedia) return;

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const manejarCambio = () => {
    if (obtenerTemaGuardado() === "system") aplicarTema("system");
  };

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", manejarCambio);
  } else if (typeof media.addListener === "function") {
    media.addListener(manejarCambio);
  }
}
