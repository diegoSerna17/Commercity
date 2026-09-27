import { request } from "../api/client.js";

/**
 * Historial de ventas del vendedor autenticado (RF119/RF120).
 * El backend excluye por defecto las lineas canceladas y devuelve el resumen
 * con el neto del vendedor (90%) y la comision de la plataforma (10%).
 * @param {{ estado?: string, pagina?: number, porPagina?: number }} [opciones]
 */
export const listarVentas = ({ estado, pagina = 1, porPagina = 20 } = {}) => {
  const params = new URLSearchParams({
    pagina: String(pagina),
    por_pagina: String(porPagina),
  });
  if (estado) params.set("estado", estado);

  return request(`/api/tienda/ventas?${params.toString()}`);
};

/**
 * Avanza UN nivel el estado de los envios del vendedor en el pedido
 * (RF122/RF124): Pendiente -> En camino -> Entregado. El backend valida la
 * transicion y responde 409 si no es valida.
 * @param {number} pedidoId
 * @param {"En camino"|"Entregado"} estado
 */
export const avanzarEstadoPedido = (pedidoId, estado) =>
  request(`/api/pedidos/${pedidoId}/estado`, {
    method: "PATCH",
    body: { estado },
  });

/**
 * Historial de ingresos 90% del vendedor autenticado (RF121/RF123) con el
 * resumen y la validacion de consistencia del flujo 90/10.
 * @param {{ pagina?: number, porPagina?: number, agruparPor?: "transaccion"|"dia" }} [opciones]
 */
export const listarIngresos = ({
  pagina = 1,
  porPagina = 5,
  agruparPor = "transaccion",
} = {}) => {
  const params = new URLSearchParams({
    pagina: String(pagina),
    por_pagina: String(porPagina),
    agrupar_por: agruparPor,
  });

  return request(`/api/tienda/ingresos?${params.toString()}`);
};

/** Estadisticas de la tienda del vendedor (tarjetas, por estado y 6 meses). */
export const obtenerEstadisticasTienda = () =>
  request("/api/tienda/dashboard/stats");

/** Validacion integral de Mi Tienda contra la BD real (RF130-RF139, RF138). */
export const validarMiTienda = () => request("/api/tienda/validacion");

/**
 * Cuenta bancaria del vendedor autenticado (RF131-RF133).
 * @returns {Promise<{success: boolean, data: {registrado: boolean, datos: object|null}}>}
 */
export const obtenerMiCuentaBancaria = () =>
  request("/api/tienda/mi-cuenta-bancaria");

/**
 * Registra o actualiza la cuenta bancaria (upsert transaccional, RNF11:
 * el backend cifra titular y numero).
 * @param {{ titular_nombre: string, banco: string, tipo_cuenta: "ahorros"|"corriente", numero_cuenta: string }} datos
 */
export const guardarMiCuentaBancaria = (datos) =>
  request("/api/tienda/mi-cuenta-bancaria", { method: "POST", body: datos });
