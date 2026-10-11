// Configuración central de la API del backend.
// Para apuntar a otro servidor (producción) crea un archivo .env en la raíz
// del frontend con:  VITE_API_URL=https://tu-dominio
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Clave de localStorage donde se guardan los datos no sensibles del usuario.
// F4: el JWT vive en una cookie httpOnly; nunca en localStorage.
export const USER_KEY = "commercity_user";
