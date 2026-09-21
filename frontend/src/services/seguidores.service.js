import { request } from "../api/client.js";

// Seguidores del usuario autenticado (RF106, RF110).

/**
 * Lista de usuarios que el usuario autenticado sigue.
 * @returns {Promise<{success: boolean, data: Array<{id: number, nombre_completo: string, foto_perfil: string|null}>}>}
 */
export const listarSiguiendo = () => request("/api/seguidores/siguiendo");

/**
 * Lista de usuarios que siguen al usuario autenticado.
 * @returns {Promise<{success: boolean, data: Array<{id: number, nombre_completo: string, foto_perfil: string|null}>}>}
 */
export const listarSeguidores = () => request("/api/seguidores/seguidores");

/**
 * Sigue a otro usuario (RF106).
 * Contrato real: POST /api/seguidores con body { seguido_id }. El backend toma
 * el seguidor del JWT (req.userId) y responde 201 si se creo el seguimiento.
 * Si ya lo seguías responde 409 ("Ya sigues a este usuario").
 * @param {number} seguidoId id del usuario a seguir
 * @returns {Promise<{success: boolean, data: {seguidor_id: number, seguido_id: number}}>}
 */
export const seguirUsuario = (seguidoId) =>
  request("/api/seguidores", { method: "POST", body: { seguido_id: seguidoId } });

/**
 * Deja de seguir a otro usuario (RF106).
 * Contrato real: DELETE /api/seguidores/:id. Responde 404 si no lo seguías.
 * @param {number} seguidoId id del usuario a dejar de seguir
 * @returns {Promise<{success: boolean}>}
 */
export const dejarDeSeguir = (seguidoId) =>
  request(`/api/seguidores/${seguidoId}`, { method: "DELETE" });
