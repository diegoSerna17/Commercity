// api.js - Capa de red CommerCity (compartida movil + escritorio)
// Escritorio (Electron loadFile): API_URL http://localhost:3000
const API_URL = (typeof window !== "undefined" && window.COMMERCITY_API_URL) || "http://localhost:3000";
async function apiRequest(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = localStorage.getItem("commercity_token");
  if (token) headers["Authorization"] = "Bearer " + token;
  if (options.isForm) delete headers["Content-Type"];
  let response;
  try { response = await fetch(API_URL + path, { ...options, headers }); }
  catch (e) { throw { status: 0, code: "NETWORK", message: "Sin conexion con la API (" + API_URL + ")." }; }
  let body = null;
  try { body = await response.json(); } catch (e) { body = null; }
  if (!response.ok || !body || body.success !== true) {
    const err = (body && body.error) || {};
    if (response.status === 401) localStorage.removeItem("commercity_token");
    throw { status: response.status, code: err.code || "UNKNOWN", message: err.message || ("Error HTTP " + response.status), details: err.details || [] };
  }
  return body;
}
const api = {
  login: (email, password) => apiRequest("/api/usuarios/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (email, password, nombre_completo) => apiRequest("/api/usuarios/register", { method: "POST", body: JSON.stringify({ email, password, nombre_completo }) }),
  recover: (email) => apiRequest("/api/usuarios/recover", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token, password) => apiRequest("/api/usuarios/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),
  logout: () => apiRequest("/api/usuarios/logout", { method: "POST" }),
  me: () => apiRequest("/api/usuarios/me"),
  actualizarPerfil: (d) => apiRequest("/api/usuarios/me", { method: "PATCH", body: JSON.stringify(d) }),
  cambiarRol: (rol) => apiRequest("/api/usuarios/me/rol", { method: "PATCH", body: JSON.stringify({ rol }) }),
  eliminarCuenta: () => apiRequest("/api/usuarios/cuenta", { method: "DELETE" }),
  perfilPublico: (id) => apiRequest("/api/usuarios/perfil-publico/" + id),
  directorio: () => apiRequest("/api/usuarios/directorio"),
  productos: (o = {}) => { const p = new URLSearchParams({ page: String(o.page||1), limit: String(o.limit||12) }); if(o.nombre)p.set("nombre",o.nombre); if(o.categoria)p.set("categoria",o.categoria); if(o.vendedor)p.set("vendedor",o.vendedor); return apiRequest("/api/productos?"+p); },
  categorias: () => apiRequest("/api/categorias"),
  vendedores: () => apiRequest("/api/vendedores"),
  producto: (id) => apiRequest("/api/productos/" + id),
  validarStock: (id, cantidad) => apiRequest("/api/productos/" + id + "/validar-stock" + (cantidad ? "?cantidad=" + cantidad : "")),
  misProductos: () => apiRequest("/api/productos/mis-productos"),
  crearProducto: (fd) => apiRequest("/api/productos", { method: "POST", body: fd, isForm: true }),
  editarProducto: (id, fd) => apiRequest("/api/productos/" + id, { method: "PUT", body: fd, isForm: true }),
  listarCarrito: (_cid) => apiRequest("/api/carrito"),
  agregarCarrito: (_comprador_id, producto_id, cantidad = 1) => apiRequest("/api/carrito", { method: "POST", body: JSON.stringify({ producto_id, cantidad }) }),
  modificarCantidad: (_cid, pid, cantidad) => apiRequest("/api/carrito/" + pid, { method: "PATCH", body: JSON.stringify({ cantidad }) }),
  eliminarCarrito: (_cid, pid) => apiRequest("/api/carrito/" + pid, { method: "DELETE" }),
  resumenPedido: () => apiRequest("/api/pedidos/resumen"),
  confirmarPago: (datos) => apiRequest("/api/pedidos/confirmar-pago", { method: "POST", body: JSON.stringify(datos) }),
  actualizarEstadoPedido: (id, estado, detalle_id) => apiRequest("/api/pedidos/" + id + "/estado", { method: "PATCH", body: JSON.stringify(detalle_id ? { estado, detalle_id } : { estado }) }),
  historialCompras: (estado) => apiRequest("/api/historial/compras" + (estado ? "?estado=" + encodeURIComponent(estado) : "")),
  cancelarCompra: (detalleId) => apiRequest("/api/historial/compras/" + detalleId + "/cancelar", { method: "POST" }),
  validacionTienda: () => apiRequest("/api/tienda/validacion"),
  ventas: (o = {}) => { const p = new URLSearchParams({ pagina: String(o.pagina||1), por_pagina: String(o.porPagina||20) }); if(o.estado)p.set("estado",o.estado); return apiRequest("/api/tienda/ventas?"+p); },
  ingresos: (o = {}) => { const p = new URLSearchParams({ pagina: String(o.pagina||1), por_pagina: String(o.porPagina||5), por_agrupar: o.agruparPor||"transaccion" }); return apiRequest("/api/tienda/ingresos?"+p); },
  statsTienda: () => apiRequest("/api/tienda/dashboard/stats"),
  cuentaBancaria: () => apiRequest("/api/tienda/mi-cuenta-bancaria"),
  guardarCuentaBancaria: (d) => apiRequest("/api/tienda/mi-cuenta-bancaria", { method: "POST", body: JSON.stringify(d) }),
  adminStats: () => apiRequest("/api/admin/stats"),
  adminUsuarios: () => apiRequest("/api/admin/usuarios"),
  adminCambiarEstado: (id, estado) => apiRequest("/api/admin/usuarios/" + id + "/estado", { method: "PATCH", body: JSON.stringify({ estado }) }),
  adminEliminarUsuario: (id) => apiRequest("/api/admin/usuarios/" + id, { method: "DELETE" }),
  adminProductos: () => apiRequest("/api/admin/productos"),
  adminEliminarProducto: (id) => apiRequest("/api/admin/productos/" + id, { method: "DELETE" }),
  adminRestaurarProducto: (id) => apiRequest("/api/admin/productos/" + id + "/restaurar", { method: "PATCH" }),
  adminReportes: () => apiRequest("/api/admin/reportes"),
  adminReporte: (id) => apiRequest("/api/admin/reportes/" + id),
  adminEliminarReporte: (id) => apiRequest("/api/admin/reportes/" + id, { method: "DELETE" }),
  adminResolverReporte: (id) => apiRequest("/api/admin/reportes/" + id + "/resolver", { method: "PATCH" }),
  adminBusqueda: (q) => apiRequest("/api/admin/busqueda?q=" + encodeURIComponent(q)),
  adminCuentaBancaria: () => apiRequest("/api/admin/mi-cuenta-bancaria"),
  adminGuardarCuentaBancaria: (d) => apiRequest("/api/admin/mi-cuenta-bancaria", { method: "POST", body: JSON.stringify(d) }),
  crearReporte: (fd) => apiRequest("/api/reportes", { method: "POST", body: fd, isForm: true }),
  siguiendo: () => apiRequest("/api/seguidores/siguiendo"),
  seguidores: () => apiRequest("/api/seguidores/seguidores"),
  seguir: (seguido_id) => apiRequest("/api/seguidores", { method: "POST", body: JSON.stringify({ seguido_id }) }),
  dejarSeguir: (id) => apiRequest("/api/seguidores/" + id, { method: "DELETE" }),
  calificarVendedor: (d) => apiRequest("/api/calificaciones/vendedor", { method: "POST", body: JSON.stringify(d) }),
  enviarMensaje: (fd) => apiRequest("/api/chat", { method: "POST", body: fd, isForm: true }),
  conversaciones: () => apiRequest("/api/chat/conversaciones"),
  mensajes: (usuarioId) => apiRequest("/api/chat/mensajes/" + usuarioId),
  marcarLeido: (id) => apiRequest("/api/chat/mensajes/" + id + "/leido", { method: "PATCH" }),
  notificaciones: () => apiRequest("/api/notificaciones"),
  notifsNoLeidas: () => apiRequest("/api/notificaciones/no-leidas"),
  marcarTodasLeidas: () => apiRequest("/api/notificaciones/leidas", { method: "PATCH" }),
  marcarNotifLeida: (id) => apiRequest("/api/notificaciones/" + id + "/leida", { method: "PATCH" }),
  eliminarTodasNotifs: () => apiRequest("/api/notificaciones", { method: "DELETE" }),
  eliminarNotif: (id) => apiRequest("/api/notificaciones/" + id, { method: "DELETE" }),
};
if (typeof window !== "undefined") { window.api = api; window.API_URL = API_URL; }
