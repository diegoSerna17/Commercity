import { request } from "../api/client.js";

// Perfil publico de usuarios (RF110).
// Se separa de calificaciones.service.js: este modulo cubre solo la lectura
// publica del perfil (sin datos sensibles) y las calificaciones quedan en su
// propio servicio (RF107).

/**
 * Perfil publico de un usuario por su id (RF110).
 * Contrato real: GET /api/usuarios/perfil-publico/:id
 * data { id, nombre, biografia, avatar } (sin email, password ni direccion).
 * Responde 404 si el usuario no existe o esta inactivo.
 * @param {number} id
 * @returns {Promise<{success: boolean, data: {id: number, nombre: string, biografia: string|null, avatar: string}}>}
 */
export const obtenerPerfilPublico = (id) =>
  request(`/api/usuarios/perfil-publico/${id}`);
