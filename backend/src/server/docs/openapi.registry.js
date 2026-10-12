import { paramsIdSchema } from "../schemas/common.schema.js";
import {
  registerSchema,
  loginSchema,
  recoverSchema,
  resetSchema,
  cambiarRolSchema,
} from "../schemas/auth.schemas.js";
import {
  perfilPublicoParamsSchema,
  directorioQuerySchema,
  actualizarPerfilSchema,
} from "../schemas/usuarios.schema.js";
import {
  catalogoQuerySchema,
  productoIdParamsSchema,
  validarStockQuerySchema,
  crearProductoSchema,
  editarProductoSchema,
} from "../schemas/productos.schema.js";
import {
  confirmarPagoSchema,
  estadoSchema,
  pedidoIdParamsSchema,
} from "../schemas/pedidos.schema.js";
import {
  agregarAlCarritoSchema,
  carritoProductoParamsSchema,
  modificarCantidadSchema,
} from "../schemas/carrito.schema.js";
import {
  upsertCuentaBancariaSchema,
  historialVentasQuerySchema,
  historialIngresosQuerySchema,
} from "../schemas/tienda.schema.js";
import {
  historialComprasQuerySchema,
  cancelarPedidoParamsSchema,
} from "../schemas/compras.schema.js";
import {
  enviarMensajeSchema,
  conversacionParamsSchema,
  conversacionQuerySchema,
  conversacionesQuerySchema,
  mensajeIdParamsSchema,
} from "../schemas/chat.schema.js";
import { listarNotificacionesQuerySchema } from "../schemas/notificaciones.schema.js";
import { calificacionSchema } from "../schemas/calificaciones.schema.js";
import { seguirSchema, seguidorIdParamSchema } from "../schemas/seguidores.schema.js";
import { crearReporteSchema } from "../schemas/reportes.schema.js";
import {
  adminUsuariosQuerySchema,
  cambiarEstadoUsuarioSchema,
  adminProductosQuerySchema,
  adminReportesQuerySchema,
  resolverReporteSchema,
  busquedaAdminQuerySchema,
  upsertCuentaBancariaAdminSchema,
} from "../schemas/admin.schema.js";

// ============================================================================
// Registro de las 72 operaciones de la API (fuente del OpenAPI 3.1).
// Cada operacion referencia esquemas Zod de schemas/ (contratos de entrada).
// Convencion: auth=false publico; auth=true exige JWT Bearer;
// roles=[...] exige ademas esos roles (RBAC).
// ============================================================================

const R401 = { 401: { description: "No autenticado: falta el JWT Bearer o es invalido/revocado." } };
const R403 = { 403: { description: "Prohibido: sin rol suficiente o sin ownership del recurso." } };
const R404 = { 404: { description: "Recurso no encontrado." } };
const R400 = { 400: { description: "Datos invalidos o regla de negocio (detalle en error.code)." } };

const ok = (description, extra = {}) => ({ 200: { description }, ...extra });
const creado = (description, extra = {}) => ({ 201: { description }, ...extra });

/**
 * @typedef {object} Operacion
 * @property {string} method
 * @property {string} path
 * @property {string} operationId
 * @property {string} tag
 * @property {string} summary
 * @property {string} description
 * @property {boolean} [auth]
 * @property {string[]} [roles]
 * @property {import("zod").ZodType} [params]
 * @property {import("zod").ZodType} [query]
 * @property {import("zod").ZodType} [body]
 * @property {string} [multipart]
 * @property {Record<string, { description: string }>} responses
 */

/** @type {Operacion[]} */
export const operaciones = [
  // ── Base (2) ──────────────────────────────────────────────
  {
    method: "get", path: "/", operationId: "verificarServidor", tag: "Base",
    summary: "Verificacion del servidor",
    description: "Endpoint raiz de verificacion (responde el modulo usuarios).",
    responses: ok("Servidor en linea."),
  },
  {
    method: "get", path: "/health", operationId: "healthCheck", tag: "Base",
    summary: "Healthcheck",
    description: "Estado del servicio y de la BD (SELECT 1). Publico; 503 si la BD no responde (TASK-8.4).",
    responses: ok("Servicio y BD operativos.", {
      503: { description: "Base de datos no disponible (DB_UNAVAILABLE)." },
    }),
  },

  // ── Usuarios (13) ─────────────────────────────────────────
  {
    method: "get", path: "/api/usuarios/", operationId: "verificarModuloUsuarios", tag: "Usuarios",
    summary: "Verificacion del modulo usuarios",
    description: "Verificacion del modulo de usuarios.",
    responses: ok("Modulo usuarios en linea."),
  },
  {
    method: "get", path: "/api/usuarios/perfil-publico/{id}", operationId: "verPerfilPublico", tag: "Usuarios",
    summary: "Ver perfil publico de un usuario",
    description: "Perfil publico de otro usuario por su ID (RF110).",
    params: perfilPublicoParamsSchema,
    responses: ok("Perfil publico.", { ...R400, ...R404 }),
  },
  {
    method: "get", path: "/api/usuarios/directorio", operationId: "listarDirectorio", tag: "Usuarios",
    summary: "Directorio de usuarios",
    description: "Directorio de usuarios para iniciar un chat con cualquier persona.",
    auth: true, query: directorioQuerySchema,
    responses: ok("Directorio de usuarios.", { ...R401 }),
  },
  {
    method: "delete", path: "/api/usuarios/cuenta", operationId: "eliminarMiCuenta", tag: "Usuarios",
    summary: "Eliminar mi cuenta (comprador)",
    description: "Desactivacion logica de la cuenta propia; el comprador_id sale del token (RF40).",
    auth: true,
    responses: ok("Cuenta desactivada.", { ...R401 }),
  },
  {
    method: "post", path: "/api/usuarios/register", operationId: "registrarUsuario", tag: "Usuarios",
    summary: "Registrar usuario",
    description: "Crea un comprador. Valida con registerSchema (H5: min 8 + letra y numero).",
    body: registerSchema,
    responses: creado("Usuario registrado.", { ...R400 }),
  },
  {
    method: "post", path: "/api/usuarios/login", operationId: "iniciarSesion", tag: "Usuarios",
    summary: "Iniciar sesion",
    description: "Emite el JWT Bearer. Rate limit 10/min. Valida con loginSchema.",
    body: loginSchema,
    responses: ok("Sesion iniciada (JWT).", { ...R400, ...R401, 429: { description: "Demasiadas peticiones (rate limit 10/min)." } }),
  },
  {
    method: "post", path: "/api/usuarios/recover", operationId: "solicitarRecuperacion", tag: "Usuarios",
    summary: "Solicitar recuperacion de contraseña",
    description: "Envia el correo de restablecimiento (modo simulacion sin API key). Rate limit 10/min.",
    body: recoverSchema,
    responses: ok("Correo de recuperacion enviado.", { ...R400, 429: { description: "Demasiadas peticiones (rate limit 10/min)." } }),
  },
  {
    method: "post", path: "/api/usuarios/reset-password", operationId: "restablecerPassword", tag: "Usuarios",
    summary: "Restablecer contraseña",
    description: "Restablece la contraseña con el token recibido por correo. Valida con resetSchema.",
    body: resetSchema,
    responses: ok("Contraseña restablecida.", { ...R400 }),
  },
  {
    method: "post", path: "/api/usuarios/logout", operationId: "cerrarSesion", tag: "Usuarios",
    summary: "Cerrar sesion",
    description: "Revoca el token actual (lista negra en BD, RF2). Exige token.",
    auth: true,
    responses: ok("Sesion cerrada.", { ...R401 }),
  },
  {
    method: "post", path: "/api/usuarios/logout-todas", operationId: "cerrarTodasLasSesiones", tag: "Usuarios",
    summary: "Cerrar todas mis sesiones",
    description: "Incrementa token_version: invalida todos los JWT emitidos antes (M-8). Exige token.",
    auth: true,
    responses: ok("Todas las sesiones fueron cerradas.", { ...R401 }),
  },
  {
    method: "get", path: "/api/usuarios/me", operationId: "obtenerMiPerfil", tag: "Usuarios",
    summary: "Obtener mi perfil",
    description: "Perfil del usuario autenticado.",
    auth: true,
    responses: ok("Perfil propio.", { ...R401 }),
  },
  {
    method: "patch", path: "/api/usuarios/me", operationId: "actualizarMiPerfil", tag: "Usuarios",
    summary: "Actualizar mi nombre de perfil",
    description: "Actualiza unicamente el nombre de perfil (obligatorio, max 100).",
    auth: true, body: actualizarPerfilSchema,
    responses: ok("Perfil actualizado.", { ...R400, ...R401 }),
  },
  {
    method: "patch", path: "/api/usuarios/me/rol", operationId: "cambiarMiRol", tag: "Usuarios",
    summary: "Cambiar mi rol",
    description: "Alterna entre comprador y vendedor. Valida con cambiarRolSchema.",
    auth: true, body: cambiarRolSchema,
    responses: ok("Rol actualizado.", { ...R400, ...R401 }),
  },
  {
    method: "get", path: "/api/usuarios/admin", operationId: "obtenerDatosAdmin", tag: "Usuarios",
    summary: "Datos del panel admin (atajo)",
    description: "Atajo al panel de administracion; exige rol administrador.",
    auth: true, roles: ["administrador"],
    responses: ok("Datos de administracion.", { ...R401, ...R403 }),
  },

  // ── Productos / catalogo (8) ──────────────────────────────
  {
    method: "get", path: "/api/productos", operationId: "listarCatalogo", tag: "Productos",
    summary: "Listar catalogo",
    description: "Catalogo publico con busqueda, filtros y paginacion (RF87-RF94).",
    query: catalogoQuerySchema,
    responses: ok("Pagina del catalogo.", { ...R400 }),
  },
  {
    method: "get", path: "/api/categorias", operationId: "listarCategorias", tag: "Productos",
    summary: "Listar categorias",
    description: "Categorias del catalogo.",
    responses: ok("Lista de categorias."),
  },
  {
    method: "get", path: "/api/vendedores", operationId: "listarVendedores", tag: "Productos",
    summary: "Listar vendedores",
    description: "Vendedores con tienda activa.",
    responses: ok("Lista de vendedores."),
  },
  {
    method: "get", path: "/api/productos/mis-productos", operationId: "listarMisProductos", tag: "Productos",
    summary: "Listar mis productos (vendedor)",
    description: "Productos del vendedor autenticado (el ID sale del JWT, Fix 4.1).",
    auth: true, roles: ["vendedor"],
    responses: ok("Productos del vendedor.", { ...R401, ...R403 }),
  },
  {
    method: "get", path: "/api/productos/{id}/validar-stock", operationId: "validarStock", tag: "Productos",
    summary: "Validar stock de un producto",
    description: "Valida si hay stock suficiente para una cantidad (RF86).",
    params: productoIdParamsSchema, query: validarStockQuerySchema,
    responses: ok("Resultado de la validacion de stock.", { ...R400, ...R404 }),
  },
  {
    method: "get", path: "/api/productos/{id}", operationId: "verDetalleProducto", tag: "Productos",
    summary: "Ver detalle de producto",
    description: "Detalle con calificacion promedio y total de calificaciones (RF78/RF79).",
    params: productoIdParamsSchema,
    responses: ok("Detalle del producto.", { ...R400, ...R404 }),
  },
  {
    method: "post", path: "/api/productos", operationId: "crearProducto", tag: "Productos",
    summary: "Crear producto (vendedor)",
    description: "Publica un producto con imagen obligatoria (multipart). Precio con IVA incluido (RF45/RF46/RF48).",
    auth: true, roles: ["vendedor"], body: crearProductoSchema, multipart: "imagen",
    responses: creado("Producto creado.", { ...R400, ...R401, ...R403 }),
  },
  {
    method: "put", path: "/api/productos/{id}", operationId: "editarProducto", tag: "Productos",
    summary: "Editar producto (vendedor)",
    description: "Edicion parcial; conserva los valores de BD no enviados. Imagen opcional (multipart).",
    auth: true, roles: ["vendedor"], params: productoIdParamsSchema, body: editarProductoSchema, multipart: "imagen",
    responses: ok("Producto actualizado.", { ...R400, ...R401, ...R403, ...R404 }),
  },

  // ── Pedidos / pago (3) ────────────────────────────────────
  {
    method: "get", path: "/api/pedidos/resumen", operationId: "obtenerResumenCarrito", tag: "Pedidos",
    summary: "Resumen del carrito con desglose",
    description: "Resumen agrupado por vendedor con IVA 19% y reparto 90/10 en vuelo (RF113/RF114/RF117/RF134). Solo lectura.",
    auth: true,
    responses: ok("Resumen del carrito.", { ...R401 }),
  },
  {
    method: "post", path: "/api/pedidos/confirmar-pago", operationId: "confirmarPago", tag: "Pedidos",
    summary: "Confirmar pago (checkout)",
    description: "Crea pedido + lineas + descuenta stock + registra pago en UNA transaccion ACID (RF134). Tarjeta validada con Luhn (RF118).",
    auth: true, body: confirmarPagoSchema,
    responses: creado("Pedido y pago registrados.", { ...R400, ...R401 }),
  },
  {
    method: "patch", path: "/api/pedidos/{id}/estado", operationId: "actualizarEstadoPedido", tag: "Pedidos",
    summary: "Actualizar estado del pedido",
    description: "Dos caminos con RBAC por ownership en el controller: vendedor/admin avanza 1 nivel (RF122/RF124); comprador cancela por linea o total con reembolso (RF35).",
    auth: true, params: pedidoIdParamsSchema, body: estadoSchema,
    responses: ok("Estado actualizado.", { ...R400, ...R401, ...R403, ...R404 }),
  },

  // ── Carrito (4) ───────────────────────────────────────────
  {
    method: "post", path: "/api/carrito/", operationId: "agregarAlCarrito", tag: "Carrito",
    summary: "Agregar producto al carrito",
    description: "Upsert atomico con validacion de stock. El comprador_id sale del JWT (H1).",
    auth: true, body: agregarAlCarritoSchema,
    responses: creado("Producto agregado al carrito.", { ...R400, ...R401, ...R404 }),
  },
  {
    method: "delete", path: "/api/carrito/{productoId}", operationId: "eliminarDelCarrito", tag: "Carrito",
    summary: "Eliminar producto del carrito",
    description: "Elimina una linea del carrito del comprador autenticado.",
    auth: true, params: carritoProductoParamsSchema,
    responses: ok("Producto eliminado del carrito.", { ...R400, ...R401, ...R404 }),
  },
  {
    method: "patch", path: "/api/carrito/{productoId}", operationId: "modificarCantidadCarrito", tag: "Carrito",
    summary: "Modificar cantidad en el carrito",
    description: "Fija la cantidad validando stock disponible.",
    auth: true, params: carritoProductoParamsSchema, body: modificarCantidadSchema,
    responses: ok("Cantidad actualizada.", { ...R400, ...R401, ...R404 }),
  },
  {
    method: "get", path: "/api/carrito/", operationId: "listarCarrito", tag: "Carrito",
    summary: "Listar carrito",
    description: "Carrito agrupado por vendedor con resumen de totales.",
    auth: true,
    responses: ok("Carrito del comprador.", { ...R401 }),
  },

  // ── Tienda vendedor (8) ───────────────────────────────────
  {
    method: "get", path: "/api/tienda/mi-cuenta-bancaria", operationId: "obtenerMiCuentaBancaria", tag: "Tienda",
    summary: "Ver mi cuenta bancaria",
    description: "Cuenta bancaria del vendedor ENMASCARADA por defecto (B-5: nunca el numero completo).",
    auth: true, roles: ["vendedor"],
    responses: ok("Cuenta bancaria.", { ...R401, ...R403, ...R404 }),
  },
  {
    method: "get", path: "/api/tienda/mi-cuenta-bancaria/masked", operationId: "obtenerMiCuentaBancariaEnmascarada", tag: "Tienda",
    summary: "Ver mi cuenta bancaria enmascarada",
    description: "Version enmascarada para mostrar (RF122).",
    auth: true, roles: ["vendedor"],
    responses: ok("Cuenta bancaria enmascarada.", { ...R401, ...R403, ...R404 }),
  },
  {
    method: "post", path: "/api/tienda/mi-cuenta-bancaria", operationId: "crearMiCuentaBancaria", tag: "Tienda",
    summary: "Crear mi cuenta bancaria",
    description: "Alta de cuenta bancaria del vendedor (RNF9/RNF11). La respuesta va enmascarada (B-5).",
    auth: true, roles: ["vendedor"], body: upsertCuentaBancariaSchema,
    responses: creado("Cuenta bancaria creada.", { ...R400, ...R401, ...R403 }),
  },
  {
    method: "put", path: "/api/tienda/mi-cuenta-bancaria", operationId: "actualizarMiCuentaBancaria", tag: "Tienda",
    summary: "Actualizar mi cuenta bancaria",
    description: "Actualiza la cuenta bancaria del vendedor. La respuesta va enmascarada (B-5).",
    auth: true, roles: ["vendedor"], body: upsertCuentaBancariaSchema,
    responses: ok("Cuenta bancaria actualizada.", { ...R400, ...R401, ...R403 }),
  },
  {
    method: "get", path: "/api/tienda/ventas", operationId: "historialVentas", tag: "Tienda",
    summary: "Historial de ventas",
    description: "Ventas del vendedor con filtros y resumen 90/10 (RF119/RF120).",
    auth: true, roles: ["vendedor"], query: historialVentasQuerySchema,
    responses: ok("Historial de ventas.", { ...R401, ...R403 }),
  },
  {
    method: "get", path: "/api/tienda/ingresos", operationId: "historialIngresos", tag: "Tienda",
    summary: "Historial de ingresos",
    description: "Ingresos del 90% del vendedor, por transaccion o por dia (RF121/RF123).",
    auth: true, roles: ["vendedor"], query: historialIngresosQuerySchema,
    responses: ok("Historial de ingresos.", { ...R401, ...R403 }),
  },
  {
    method: "get", path: "/api/tienda/dashboard/stats", operationId: "dashboardTienda", tag: "Tienda",
    summary: "Estadisticas del dashboard",
    description: "Estadisticas de ventas de la tienda del vendedor.",
    auth: true, roles: ["vendedor"],
    responses: ok("Estadisticas de la tienda.", { ...R401, ...R403 }),
  },
  {
    method: "get", path: "/api/tienda/validacion", operationId: "validarMiTienda", tag: "Tienda",
    summary: "Validacion integral de Mi Tienda",
    description: "Verifica cuenta bancaria, reparto 90/10 y devoluciones (RF130-RF139).",
    auth: true, roles: ["vendedor"],
    responses: ok("Resultado de la validacion.", { ...R401, ...R403 }),
  },

  // ── Historial / compras (2) ───────────────────────────────
  {
    method: "get", path: "/api/historial/compras", operationId: "historialCompras", tag: "Historial",
    summary: "Historial de compras",
    description: "Compras del comprador agrupadas por pedido con IVA y totales (RF26-RF32, paginado B-9).",
    auth: true, query: historialComprasQuerySchema,
    responses: ok("Historial de compras.", { ...R401 }),
  },
  {
    method: "post", path: "/api/historial/compras/{id}/cancelar", operationId: "cancelarPedido", tag: "Historial",
    summary: "Cancelar un pedido",
    description: "Cancela un pedido en estado Pendiente: restituye stock y reembolsa (RF135).",
    auth: true, params: cancelarPedidoParamsSchema,
    responses: ok("Pedido cancelado.", { ...R400, ...R401, ...R403, ...R404 }),
  },

  // ── Admin (16) ────────────────────────────────────────────
  {
    method: "get", path: "/api/admin/stats", operationId: "estadisticasAdmin", tag: "Admin",
    summary: "Estadisticas globales",
    description: "Estadisticas de la plataforma (RF55-RF59).",
    auth: true, roles: ["administrador"],
    responses: ok("Estadisticas.", { ...R401, ...R403 }),
  },
  {
    method: "get", path: "/api/admin/usuarios", operationId: "listarUsuariosAdmin", tag: "Admin",
    summary: "Listar usuarios (admin)",
    description: "Gestion de usuarios con busqueda (RF67/RF73/RF74, paginado B-9).",
    auth: true, roles: ["administrador"], query: adminUsuariosQuerySchema,
    responses: ok("Lista de usuarios.", { ...R401, ...R403 }),
  },
  {
    method: "patch", path: "/api/admin/usuarios/{id}/estado", operationId: "cambiarEstadoUsuarioAdmin", tag: "Admin",
    summary: "Cambiar estado de usuario",
    description: "Activa o banea un usuario; el motivo lo genera el servidor.",
    auth: true, roles: ["administrador"], params: paramsIdSchema, body: cambiarEstadoUsuarioSchema,
    responses: ok("Estado actualizado.", { ...R400, ...R401, ...R403, ...R404 }),
  },
  {
    method: "delete", path: "/api/admin/usuarios/{id}", operationId: "eliminarUsuarioAdmin", tag: "Admin",
    summary: "Eliminar usuario (admin)",
    description: "Desactivacion de un usuario por el administrador.",
    auth: true, roles: ["administrador"], params: paramsIdSchema,
    responses: ok("Usuario desactivado.", { ...R400, ...R401, ...R403, ...R404 }),
  },
  {
    method: "get", path: "/api/admin/productos", operationId: "listarProductosAdmin", tag: "Admin",
    summary: "Listar productos (admin)",
    description: "Moderacion de productos con busqueda (RF68/RF72).",
    auth: true, roles: ["administrador"], query: adminProductosQuerySchema,
    responses: ok("Lista de productos.", { ...R401, ...R403 }),
  },
  {
    method: "delete", path: "/api/admin/productos/{id}", operationId: "suspenderProductoAdmin", tag: "Admin",
    summary: "Suspender producto",
    description: "Suspende un producto (eliminado_por_admin).",
    auth: true, roles: ["administrador"], params: paramsIdSchema,
    responses: ok("Producto suspendido.", { ...R400, ...R401, ...R403, ...R404 }),
  },
  {
    method: "patch", path: "/api/admin/productos/{id}/restaurar", operationId: "restaurarProductoAdmin", tag: "Admin",
    summary: "Restaurar producto",
    description: "Levanta la suspension de un producto.",
    auth: true, roles: ["administrador"], params: paramsIdSchema,
    responses: ok("Producto restaurado.", { ...R400, ...R401, ...R403, ...R404 }),
  },
  {
    method: "get", path: "/api/admin/reportes", operationId: "listarReportesAdmin", tag: "Admin",
    summary: "Listar reportes (admin)",
    description: "Bandeja de reportes de contenido (RF60-RF66).",
    auth: true, roles: ["administrador"], query: adminReportesQuerySchema,
    responses: ok("Lista de reportes.", { ...R400, ...R401, ...R403 }),
  },
  {
    method: "get", path: "/api/admin/reportes/{id}", operationId: "verReporteAdmin", tag: "Admin",
    summary: "Ver reporte (admin)",
    description: "Detalle de un reporte.",
    auth: true, roles: ["administrador"], params: paramsIdSchema,
    responses: ok("Detalle del reporte.", { ...R400, ...R401, ...R403, ...R404 }),
  },
  {
    method: "delete", path: "/api/admin/reportes/{id}", operationId: "eliminarReporteAdmin", tag: "Admin",
    summary: "Eliminar reporte (admin)",
    description: "Descarta un reporte.",
    auth: true, roles: ["administrador"], params: paramsIdSchema,
    responses: ok("Reporte eliminado.", { ...R400, ...R401, ...R403, ...R404 }),
  },
  {
    method: "patch", path: "/api/admin/reportes/{id}/resolver", operationId: "resolverReporteAdmin", tag: "Admin",
    summary: "Resolver reporte (admin)",
    description: "Resuelve un reporte con respuesta obligatoria.",
    auth: true, roles: ["administrador"], params: paramsIdSchema, body: resolverReporteSchema,
    responses: ok("Reporte resuelto.", { ...R400, ...R401, ...R403, ...R404 }),
  },
  {
    method: "get", path: "/api/admin/busqueda", operationId: "buscarAdmin", tag: "Admin",
    summary: "Buscador global (admin)",
    description: "Buscador unificado de usuarios y productos con FULLTEXT y fallback LIKE (RF69-RF71).",
    auth: true, roles: ["administrador"], query: busquedaAdminQuerySchema,
    responses: ok("Resultados de busqueda.", { ...R400, ...R401, ...R403 }),
  },
  {
    method: "get", path: "/api/admin/mi-cuenta-bancaria", operationId: "obtenerCuentaBancariaPlataforma", tag: "Admin",
    summary: "Ver cuenta bancaria de la plataforma",
    description: "Cuenta bancaria de CommerCity para la comision del 10% (RF75/RF76, RNF11 cifrado). Enmascarada por defecto (B-7); ?revelar=completa devuelve los datos para edicion.",
    auth: true, roles: ["administrador"],
    responses: ok("Cuenta bancaria.", { ...R401, ...R403, ...R404 }),
  },
  {
    method: "get", path: "/api/admin/mi-cuenta-bancaria/masked", operationId: "obtenerCuentaBancariaPlataformaEnmascarada", tag: "Admin",
    summary: "Ver cuenta de la plataforma enmascarada",
    description: "Version enmascarada de la cuenta de la plataforma.",
    auth: true, roles: ["administrador"],
    responses: ok("Cuenta bancaria enmascarada.", { ...R401, ...R403, ...R404 }),
  },
  {
    method: "post", path: "/api/admin/mi-cuenta-bancaria", operationId: "crearCuentaBancariaPlataforma", tag: "Admin",
    summary: "Crear cuenta bancaria de la plataforma",
    description: "Alta de la cuenta que recibe la comision (RF75/RF76).",
    auth: true, roles: ["administrador"], body: upsertCuentaBancariaAdminSchema,
    responses: creado("Cuenta bancaria creada.", { ...R400, ...R401, ...R403 }),
  },
  {
    method: "put", path: "/api/admin/mi-cuenta-bancaria", operationId: "actualizarCuentaBancariaPlataforma", tag: "Admin",
    summary: "Actualizar cuenta bancaria de la plataforma",
    description: "Actualiza la cuenta que recibe la comision.",
    auth: true, roles: ["administrador"], body: upsertCuentaBancariaAdminSchema,
    responses: ok("Cuenta bancaria actualizada.", { ...R400, ...R401, ...R403 }),
  },

  // ── Reportes (1) ──────────────────────────────────────────
  {
    method: "post", path: "/api/reportes/", operationId: "crearReporte", tag: "Reportes",
    summary: "Crear reporte",
    description: "Reporta un producto o un usuario con evidencia opcional (multipart). El informante sale del JWT (RF62/RF63, RF79, RF101).",
    auth: true, body: crearReporteSchema, multipart: "evidencia",
    responses: creado("Reporte creado.", { ...R400, ...R401, ...R404 }),
  },

  // ── Calificaciones (1) ────────────────────────────────────
  {
    method: "post", path: "/api/calificaciones/vendedor", operationId: "calificarVendedor", tag: "Calificaciones",
    summary: "Calificar a un vendedor",
    description: "Calificacion de 1 a 5 estrellas tras una compra; una por pedido (RF107).",
    auth: true, body: calificacionSchema,
    responses: creado("Calificacion registrada.", { ...R400, ...R401, ...R403 }),
  },

  // ── Chat (4) ──────────────────────────────────────────────
  {
    method: "post", path: "/api/chat/", operationId: "enviarMensaje", tag: "Chat",
    summary: "Enviar mensaje",
    description: "Mensaje de texto al otro usuario; el multipart se rechaza en puerta con 400 (RF101).",
    auth: true, body: enviarMensajeSchema,
    responses: creado("Mensaje enviado.", { ...R400, ...R401, ...R404 }),
  },
  {
    method: "get", path: "/api/chat/conversaciones", operationId: "listarConversaciones", tag: "Chat",
    summary: "Listar conversaciones",
    description: "Conversaciones del usuario con ultimo mensaje y no leidos (paginado, B-9).",
    auth: true, query: conversacionesQuerySchema,
    responses: ok("Lista de conversaciones.", { ...R400, ...R401 }),
  },
  {
    method: "get", path: "/api/chat/mensajes/{usuarioId}", operationId: "obtenerConversacion", tag: "Chat",
    summary: "Ver historial con un usuario",
    description: "Mensajes entre el autenticado y otro usuario (paginado; M-14).",
    auth: true, params: conversacionParamsSchema, query: conversacionQuerySchema,
    responses: ok("Historial de mensajes.", { ...R400, ...R401, ...R404 }),
  },
  {
    method: "patch", path: "/api/chat/mensajes/{id}/leido", operationId: "marcarMensajeLeido", tag: "Chat",
    summary: "Marcar mensaje como leido",
    description: "Marca como leido un mensaje recibido por el autenticado.",
    auth: true, params: mensajeIdParamsSchema,
    responses: ok("Mensaje marcado.", { ...R400, ...R401, ...R404 }),
  },

  // ── Notificaciones (6) ────────────────────────────────────
  {
    method: "get", path: "/api/notificaciones/", operationId: "listarNotificaciones", tag: "Notificaciones",
    summary: "Listar notificaciones",
    description: "Notificaciones del usuario con filtros opcionales de tipo y limite.",
    auth: true, query: listarNotificacionesQuerySchema,
    responses: ok("Lista de notificaciones.", { ...R400, ...R401 }),
  },
  {
    method: "get", path: "/api/notificaciones/no-leidas", operationId: "contarNoLeidas", tag: "Notificaciones",
    summary: "Contar no leidas",
    description: "Total de notificaciones no leidas.",
    auth: true,
    responses: ok("Total de no leidas.", { ...R401 }),
  },
  {
    method: "patch", path: "/api/notificaciones/leidas", operationId: "marcarTodasLeidas", tag: "Notificaciones",
    summary: "Marcar todas como leidas",
    description: "Marca todas las notificaciones del usuario como leidas.",
    auth: true,
    responses: ok("Notificaciones actualizadas.", { ...R401 }),
  },
  {
    method: "patch", path: "/api/notificaciones/{id}/leida", operationId: "marcarLeida", tag: "Notificaciones",
    summary: "Marcar una como leida",
    description: "Marca una notificacion como leida.",
    auth: true, params: paramsIdSchema,
    responses: ok("Notificacion actualizada.", { ...R400, ...R401, ...R404 }),
  },
  {
    method: "delete", path: "/api/notificaciones/", operationId: "eliminarTodas", tag: "Notificaciones",
    summary: "Eliminar todas",
    description: "Elimina todas las notificaciones del usuario.",
    auth: true,
    responses: ok("Notificaciones eliminadas.", { ...R401 }),
  },
  {
    method: "delete", path: "/api/notificaciones/{id}", operationId: "eliminarNotificacion", tag: "Notificaciones",
    summary: "Eliminar una notificacion",
    description: "Elimina una notificacion del usuario.",
    auth: true, params: paramsIdSchema,
    responses: ok("Notificacion eliminada.", { ...R400, ...R401, ...R404 }),
  },

  // ── Seguidores (5) ────────────────────────────────────────
  {
    method: "get", path: "/api/seguidores/siguiendo", operationId: "listarSiguiendo", tag: "Seguidores",
    summary: "Listar a quienes sigo",
    description: "Usuarios seguidos por el autenticado.",
    auth: true,
    responses: ok("Lista de seguidos.", { ...R401 }),
  },
  {
    method: "get", path: "/api/seguidores/seguidores", operationId: "listarSeguidores", tag: "Seguidores",
    summary: "Listar mis seguidores",
    description: "Usuarios que siguen al autenticado.",
    auth: true,
    responses: ok("Lista de seguidores.", { ...R401 }),
  },
  {
    method: "post", path: "/api/seguidores/", operationId: "seguirUsuario", tag: "Seguidores",
    summary: "Seguir a un usuario",
    description: "Sigue a otro usuario (no a si mismo).",
    auth: true, body: seguirSchema,
    responses: creado("Seguimiento creado.", { ...R400, ...R401, ...R404 }),
  },
  {
    method: "delete", path: "/api/seguidores/{id}", operationId: "dejarDeSeguir", tag: "Seguidores",
    summary: "Dejar de seguir",
    description: "Elimina el seguimiento a un usuario.",
    auth: true, params: seguidorIdParamSchema,
    responses: ok("Seguimiento eliminado.", { ...R400, ...R401, ...R404 }),
  },
  {
    method: "get", path: "/api/seguidores/{id}/contadores", operationId: "contarSeguidores", tag: "Seguidores",
    summary: "Contadores publicos de un usuario",
    description: "Totales de seguidores/siguiendo para el perfil publico (RF106). Sin autenticacion.",
    params: seguidorIdParamSchema,
    responses: ok("Contadores del usuario.", { ...R400, ...R404 }),
  },
];
