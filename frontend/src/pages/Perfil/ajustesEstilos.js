import { Monitor, SunDim, MoonIcon } from "lucide-react";

// Estilos compartidos por las secciones de Ajustes (mismo look que el archivo
// original, ahora reutilizado por los componentes extraidos).
export const sectionDivider = "border-t-2 border-auth-card-bg mb-padding-lg";
export const cardClass =
  "bg-auth-card-bg rounded-card-lg p-padding-lg sm:p-padding-xl mb-padding-xl shadow-lg";
export const labelClass =
  "block mb-2 text-body-sm font-bold text-brand-muted-text";
export const inputClass =
  "input-field bg-input-bg border-input-bg text-on-surface placeholder:text-brand-muted-text focus:ring-border-focus";

export const OPCIONES_TEMA = [
  { id: "light", icono: SunDim, nombre: "Claro", detalle: "Light" },
  { id: "dark", icono: MoonIcon, nombre: "Oscuro", detalle: "Dark" },
  { id: "system", icono: Monitor, nombre: "Sistema", detalle: "System" },
];
