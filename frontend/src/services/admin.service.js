import { request } from "../api/client.js";

// Panel de administrador. Todas las rutas exigen JWT con rol administrador.

/**
 * Estadisticas globales del panel (RF55-RF59). Las comisiones excluyen los
 * pedidos cancelados (RF56).
 * @returns {Promise<{success: boolean, data: {totalVendedores: number, totalCompradores: number, totalProductos: number, totalComisiones: number}}>}
 */
export const obtenerStatsAdmin = () => request("/api/admin/stats");

/**
 * Lista todos los usuarios con su rol principal y estado (RF67, RF73, RF74).
 * @returns {Promise<{success: boolean, data: Array<{id: number, nombre: string, email: string, rol: string, estado: "activo"|"baneado"}>}>}
 */
export const listarUsuariosAdmin = () => request("/api/admin/usuarios");

/**
 * Cambia el estado de un usuario. Reactivar solo deja activo=1; banear desactiva
 * la cuenta, suspende sus productos y resuelve sus pedidos como vendedor (RF74).
 * @param {number} id
 * @param {"activo"|"baneado"} estado
 */
export const cambiarEstadoUsuarioAdmin = (id, estado) =>
  request(`/api/admin/usuarios/${id}/estado`, { method: "PATCH", body: { estado } });

/**
 * Elimina un usuario: el backend aplica borrado logico (activo=0 y suspende sus
 * productos), nunca un DELETE fisico (RF73).
 * @param {number} id
 */
export const eliminarUsuarioAdmin = (id) =>
  request(`/api/admin/usuarios/${id}`, { method: "DELETE" });

/**
 * Lista los productos, incluidos los suspendidos por el administrador (RF68, RF72).
 * @returns {Promise<{success: boolean, data: Array<{id: number, nombre: string, precio: number, vendedor: string, suspendido: boolean}>}>}
 */
export const listarProductosAdmin = () => request("/api/admin/productos");

/**
 * Suspende un producto de forma logica, nunca DELETE fisico (RF72).
 * @param {number} id
 */
export const eliminarProductoAdmin = (id) =>
  request(`/api/admin/productos/${id}`, { method: "DELETE" });

/**
 * Restaura un producto suspendido por error del administrador (RF68).
 * @param {number} id
 */
export const restaurarProductoAdmin = (id) =>
  request(`/api/admin/productos/${id}/restaurar`, { method: "PATCH" });

/**
 * Lista los reportes de usuarios y productos (RF60-RF63).
 * Cada reporte trae el tipo, el reportado, el informante, la fecha, el estado,
 * el motivo, el numero de evidencias y la respuesta del administrador.
 * @returns {Promise<{success: boolean, data: Array<object>}>}
 */
export const listarReportesAdmin = () => request("/api/admin/reportes");

/**
 * Resuelve un reporte pendiente guardando la respuesta del administrador (RF66).
 * @param {number} id
 * @param {string} respuesta
 */
export const resolverReporteAdmin = (id, respuesta) =>
  request(`/api/admin/reportes/${id}/resolver`, {
    method: "PATCH",
    body: { respuesta },
  });

/**
 * Archiva un reporte: es historial de moderacion, nunca DELETE fisico (RF60-RF66).
 * @param {number} id
 */
export const eliminarReporteAdmin = (id) =>
  request(`/api/admin/reportes/${id}`, { method: "DELETE" });

/**
 * Cuenta bancaria de Commercity, la que recibe la comision del 10% (RF75/RF76).
 * Llega descifrada porque el formulario de ajustes permite editarla.
 * @returns {Promise<{success: boolean, data: {registrado: boolean, datos: {titular_nombre: string, banco: string, tipo_cuenta: string, numero_cuenta: string}|null}}>}
 */
export const obtenerMiCuentaBancaria = () =>
  request("/api/admin/mi-cuenta-bancaria");

/**
 * Registra (POST) o actualiza (PUT) la cuenta bancaria de Commercity. El backend
 * valida con Zod y cifra titular y numero (RF75/RF76, RNF11).
 * @param {{titular_nombre: string, banco: string, tipo_cuenta: string, numero_cuenta: string}} datos
 * @param {{actualizar?: boolean}} [opciones] true para PUT cuando ya existe registro
 */
export const guardarMiCuentaBancaria = (datos, { actualizar = false } = {}) =>
  request("/api/admin/mi-cuenta-bancaria", {
    method: actualizar ? "PUT" : "POST",
    body: datos,
  });
