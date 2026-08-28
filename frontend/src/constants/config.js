// Configuración central de la API del backend.
// Para apuntar a otro servidor (producción) crea un archivo .env en la raíz
// del frontend con:  VITE_API_URL=https://tu-dominio
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Clave de localStorage donde se guarda el JWT al iniciar sesión.
export const TOKEN_KEY = "token";

// Clave de localStorage donde se guarda el usuario autenticado.
export const USER_KEY = "commercity_user";
