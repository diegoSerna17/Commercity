import { request } from "../api/client.js";

// Acciones de la cuenta del usuario autenticado (RF2, RF4, RF20/RF21, RF40).

export const actualizarPerfil = (nombre_completo) =>
  request("/api/usuarios/me", {
    method: "PATCH",
    body: { nombre_completo },
  });

/**
 * Solicita el enlace de recuperacion de contrasena (RF4: expira en 5 minutos).
 * El backend responde siempre el mismo mensaje, sin revelar si el correo existe.
 * @param {string} email Correo de la cuenta a recuperar
 * @returns {Promise<{success: boolean, message: string}>} Respuesta uniforme de la API
 */
export const solicitarRecuperacion = (email) =>
  request("/api/usuarios/recover", {
    method: "POST",
    body: { email },
  });

/**
 * Restablece la contrasena con el token del enlace de un solo uso (RF4).
 * El backend espera el campo "password" (backend/src/server/schemas/auth.schemas.js).
 * @param {string} token Token leido de la URL del enlace de recuperacion
 * @param {string} nuevaPassword Nueva contrasena (minimo 8 caracteres en el cliente)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const restablecerPassword = (token, nuevaPassword) =>
  request("/api/usuarios/reset-password", {
    method: "POST",
    body: { token, password: nuevaPassword },
  });

/**
 * Cierra la sesion y revoca el JWT en el backend (RF2: lista negra de tokens).
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const cerrarSesion = () =>
  request("/api/usuarios/logout", {
    method: "POST",
  });

/**
 * Cambia el rol del usuario autenticado entre comprador y vendedor (RF20/RF21).
 * Un administrador no puede autodegradarse: el backend responde 403.
 * @param {"comprador"|"vendedor"} rol Rol destino
 * @returns {Promise<{success: boolean, data: {roles: string[]}}>}
 */
export const cambiarRol = (rol) =>
  request("/api/usuarios/me/rol", {
    method: "PATCH",
    body: { rol },
  });

/**
 * Elimina la cuenta del comprador autenticado (RF40: desactivacion logica).
 * @returns {Promise<{success: boolean, data: {id: number, estado: string}}>}
 */
export const eliminarCuenta = () =>
  request("/api/usuarios/cuenta", {
    method: "DELETE",
  });
