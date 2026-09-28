# Informe RAMA Escritorio — Integración API CommerCity (2026-09-27)

> Alcance: SOLO `docs/AVANCES/ESCRITORIO COMMERCITY/commercity-desktop/src/` (`api.js`, `app.js`, `index.html`).
> No se tocó `backend/` ni el repo móvil (`docs/` está gitignorado; `git status` limpio salvo `TEST.MD` untracked preexistente).
> Base: `docs/informes/PLAN_INTEGRACION_API_MOVIL_ESCRITORIO_2026-09-27.md` (bloque api.js + sección 'RAMA escritorio', tasks 3 y 10-13).
> Verificación: `node --check` OK en `src/api.js` y `src/app.js` (2505 líneas); smoke Node con stubs DOM/fetch: **50/50 passed**
> (contrato `{success,data}`, 401 limpia token, `doLogin` guarda JWT+roles, forma de error `NETWORK`). Sin backend en vivo: no hay E2E (queda para rama build+verify).

## 1. Capa de red (task 10)

- `src/api.js` NUEVO: copia del bloque del brief (62 métodos, `apiRequest` + objeto `api`).
  `API_URL = window.COMMERCITY_API_URL || "http://localhost:3000"` (única diferencia vs móvil: default escritorio).
  Expone `window.api` / `window.API_URL`.
- `src/index.html`: `<script src='api.js'></script>` insertado ANTES de `<script src="app.js"></script>` (líneas 1371-1372).
- Extras mínimos en `index.html` (solo ids + wiring, sin cambios visuales): modal producto
  (`prod-nombre/descripcion/precio/stock/estado/descuento/categoria/imagen`, botón → `handleAddProduct()`),
  banco tienda (`bank-titular/banco/tipo/numero`), banco admin (`admin-bank-*`, botón → `guardarCuentaAdmin()`),
  ajustes (`ajustes-dir`, Guardar → `guardarPerfil()`, Dirección → `guardarDireccion()`, Eliminar → `eliminarCuenta()`),
  búsquedas admin (Enter → `adminBuscar()`), overlay reporte (Responder → `adminResponderReporte()`,
  Banear/Eliminar → `adminAccionReporte()`), chat (`chat-archivo` oculto para multipart `archivo`).
- `navigate()` se conserva (ahora `async`; precarga API por página con fallback local). Renders conservados:
  `renderCart`, `renderHistorial`, `renderPedidos` (cuerpo de filas intacto), `renderProductsHome`,
  `filtrarProductos` (filtro local intacto), `renderNotifPanel`, `renderAdminStats` (tbody fiscal intacto como fallback).

## 2. Handlers reemplazados → llamadas reales

### Auth (task 11) — mock eliminado, incluidos `admin/admin123` y `juan_giraldo/1234`
| Handler | Antes (mock) | Ahora (API) | Endpoints |
|---|---|---|---|
| objeto `USERS` | `juan_giraldo/1234`, `admin/admin123` en claro | **ELIMINADO**; sesión JWT en `commercity_token` + `commercity_user` (helpers `saveSession/clearSession/getSessionUser/primaryRole/applySessionToUI`) | — |
| `doLogin` | lookup en `USERS` | `api.login(email,password)` → guarda token + `user{id,email,nombre_completo,roles}` reales; rol `administrador→admin`; 401 limpia sesión; precarga catálogo+carrito+notifs | `POST /api/usuarios/login` |
| `doRegistro` (había 2 definiciones; queda 1) | `USERS[username]=…` en memoria | `api.register(email,pass,nombre)`; si ☑ vender → `api.cambiarRol('vendedor')` | `POST /api/usuarios/register`, `PATCH /api/usuarios/me/rol` |
| `doLogout` | solo local | `api.logout` (best-effort) + `clearSession()` | `POST /api/usuarios/logout` |
| `doRecuperar` | lookup `USERS[username]` | `api.recover(email)`; guarda token devuelto (dev) en `commercity_recovery` | `POST /api/usuarios/recover` |
| `doRestablecer` | `USERS[recoveryUser].pass=p1` | `api.resetPassword(token,password)` | `POST /api/usuarios/reset-password` |
| `convertirAVendedor` | mutaba `USERS` en memoria | `api.cambiarRol('vendedor')` + re-sesión | `PATCH /api/usuarios/me/rol` |
| (nuevo) `guardarPerfil` / `guardarDireccion` / `eliminarCuenta` | sin wiring | `api.actualizarPerfil` / `api.eliminarCuenta` + `clearSession` | `PATCH /api/usuarios/me`, `DELETE /api/usuarios/cuenta` |
| init `DOMContentLoaded` | semillas estáticas | restaura sesión y revalida con `api.me()`; precarga catálogo/carrito/notifs | `GET /api/usuarios/me` |

### Catálogo / carrito / checkout (task 12)
| Handler | Antes | Ahora | Endpoints |
|---|---|---|---|
| `PRODUCTS` (const, 11 ítems Unsplash) | hardcodeado | `let PRODUCTS` + `cargarCatalogoDesdeAPI()`; mapeo `{nombre,cat,vendedor(+vendedor_id),precio/old fmtCOP,stock,pct,img:API_URL+imagen(Listado usa `imagen`),txt}` + `_apiId`; `STOCK_PRODUCTOS` se sincroniza | `GET /api/productos?page&limit` |
| `filtrarProductos` | solo local | igual + búsqueda servidor (`nombre/categoria`) cuando hay catálogo API | `GET /api/productos?nombre&categoria` |
| `openProd` | solo local | igual + en vivo `api.producto(id)` (refresca `imagen_url`+descripción; Detalle usa `imagen_url`) y `api.validarStock(id,qty)` (re-pinta stock y botón RF85) | `GET /api/productos/:id`, `GET /api/productos/:id/validar-stock` |
| `refrescarCarritoDesdeAPI` (nuevo) | — | normaliza `por_vendedor[].items` a `cartItems` | `GET /api/carrito?comprador_id=` (id de sesión JWT) |
| `addToCart` | push local | `api.agregarCarrito(comprador_id,producto_id,qty)` + refresco | `POST /api/carrito` |
| `cartQty` | `qty±1` local | `api.modificarCantidad` + refresco | `PATCH /api/carrito/:productoId` |
| `cartRemove` | `splice` local | `api.eliminarCarrito` + refresco | `DELETE /api/carrito/:productoId` |
| `abrirPago` | total `calcCart()` local | `api.resumenPedido` — total DEL SERVIDOR (guarda `_resumenVendedores`); fallback local | `GET /api/pedidos/resumen` |
| `confirmarPago` | mutaba `STOCK/pedidosVendedor/historial/ADMIN_DB` en memoria | `api.confirmarPago({direccion_envio,metodo_pago:'tarjeta',numero_tarjeta,nombre_tarjeta})` (RF116/RF118); guarda `_ultimoPedidoId/_ultimoVendedorId`; refresca carrito+historial+tienda+admin+notifs | `POST /api/pedidos/confirmar-pago` |

### Vendedor / tienda (task 13a)
| Handler | Ahora | Endpoints |
|---|---|---|
| `handleAddProduct` (nuevo; el botón solo cerraba el modal) | `FormData{nombre,descripcion,precio,stock,categoria,descuento_porcentaje,imagen}` → crear o editar (modo `editingProductId`) + `cargarMisProductos` + recarga catálogo | `POST /api/productos` (multipart `imagen`), `PUT /api/productos/:id` |
| `handleEditProduct` / `cargarMisProductos` (nuevo) | precarga form desde `mis-productos`; re-pinta `vendedor-grid` con ✏ → `handleEditProduct(id)` | `GET /api/productos/mis-productos` |
| `guardarCuentaBancaria` | `api.guardarCuentaBancaria({titular_nombre,banco,tipo_cuenta(ahorros\|corriente),numero_cuenta solo dígitos})` | `POST /api/tienda/mi-cuenta-bancaria` |
| `guardarCuentaAdmin` (nuevo) | cuenta Commercity | `POST /api/admin/mi-cuenta-bancaria` |
| `renderTiendaStats` (async; `renderTiendaStatsLocal` = fallback offline intacto) | tarjetas desde `statsTienda` + tbody ventas + aviso si `validacionTienda.cuentaBancaria.completa===false` | `GET /api/tienda/dashboard/stats`, `GET /api/tienda/ventas`, `GET /api/tienda/ingresos`, `GET /api/tienda/validacion` |
| `renderPedidos` (async; filas intactas) | sincroniza `pedidosVendedor` desde ventas (guarda `_pedidoId/_detalleId`) | `GET /api/tienda/ventas` |
| `updatePedidoEstado` | `api.actualizarEstadoPedido(pedidoId,estado,detalle_id)` + recarga pedidos/tienda | `PATCH /api/pedidos/:id/estado` |
| `cargarHistorialDesdeAPI` (nuevo) | aplana `pedidos[].items` a filas (`_detalleId/_pedidoId`, IVA 19%) | `GET /api/historial/compras?estado=` |
| `cancelarPedidoComprador` | `api.cancelarCompra(detalleId)` (reembolso+stock en servidor) + recarga historial/tienda/admin/notifs; réplica local solo para semillas sin `_detalleId` | `POST /api/historial/compras/:id/cancelar` |

### Admin / social / chat / notifs (task 13b)
| Handler | Ahora | Endpoints |
|---|---|---|
| `renderAdminStats` (async; fallback `ADMIN_DB` intacto) | vendedores/compradores/comisiones reales (IVA/devoluciones/tbody fiscal siguen locales) | `GET /api/admin/stats` |
| `cargarAdminTablas` (nuevo, hook en `navigate('admin')`) | usuarios (Banear/Activar/Eliminar), productos (🗑/Restaurar), reportes (merge a `REPORTES` como `api-<id>`) | `GET /api/admin/usuarios`, `/api/admin/productos`, `/api/admin/reportes` |
| `adminCambiarEstadoUsuario` / `adminEliminarUsuarioAccion` / `adminEliminarProductoAccion` / `adminRestaurarProductoAccion` / `adminBuscar` | acciones vivas + recarga tablas | `PATCH /api/admin/usuarios/:id/estado`, `DELETE /api/admin/usuarios/:id`, `DELETE /api/admin/productos/:id`, `PATCH /api/admin/productos/:id/restaurar`, `GET /api/admin/busqueda?q=` |
| `openReporte` | igual + `_reporteActual` y refresco vía `api.adminReporte` para reportes reales | `GET /api/admin/reportes/:id` |
| `adminResponderReporte` / `adminAccionReporte` (nuevos) | resolver con `{respuesta}`, banear/eliminar usuario, eliminar producto/reporte | `PATCH /api/admin/reportes/:id/resolver`, `DELETE /api/admin/reportes/:id` |
| `enviarReporte` | `FormData{tipo:'Producto',motivo,producto_id,evidencia}` → `api.crearReporte`; réplica local solo si el producto no es de la API | `POST /api/reportes` (multipart `evidencia`) |
| `openSeguidores` | `api.seguidores` / `api.siguiendo` con fallback `SEGUIDOS` | `GET /api/seguidores/seguidores`, `/siguiendo` |
| `toggleFollowSeller` (+`resolverUsuarioId`/`estaSiguiendo`/`_directorioCache`) | seguir/dejar por id (resuelto por `vendedor_id` del producto o `api.directorio`); fallback local | `POST /api/seguidores`, `DELETE /api/seguidores/:id`, `GET /api/usuarios/directorio` |
| `rateSeller` | `api.calificarVendedor({pedido_id,vendedor_id,estrellas})` con ids del último pago; sin contexto → solo pinta + avisa | `POST /api/calificaciones/vendedor` |
| `openChat` | resuelve receptor, carga `api.mensajes` (texto+`archivo_url` con `API_URL+`), marca leídos; fallback burbujas locales | `GET /api/chat/mensajes/:usuarioId`, `PATCH /api/chat/mensajes/:id/leido` |
| `sendMsg` | `FormData{receptor_id,mensaje,archivo?}` → `api.enviarMensaje`; pinta burbuja al éxito | `POST /api/chat` (multipart `archivo`) |
| `cargarNotificaciones` (nuevo) / `toggleNotif` / `deleteNotif` / `clearAllNotifs` / `clickNotif` | listado real (`descripcion/dias_horas/leida`), marcar todas al abrir, borrado total/por id, leída al click | `GET /api/notificaciones`, `PATCH /api/notificaciones/leidas`, `DELETE /api/notificaciones`, `DELETE /api/notificaciones/:id`, `PATCH /api/notificaciones/:id/leida` |

## 3. Seguridad transversal aplicada (rama escritorio)
- Eliminados `admin/admin123` y `juan_giraldo/1234` (objeto `USERS` suprimido; grep confirma cero restos).
- Sin contraseñas en claro en reposo: solo JWT en `commercity_token` (+ `commercity_user` sin password).
- 401 global → limpia token y vuelve a login (igual que móvil).
- Pago sin `setTimeout` fake ni mutaciones locales en el path feliz (servidor = fuente de verdad).
- Nota: quedan semillas estáticas como fallback offline (catálogo Unsplash, `cartItems`, `historialCompras`, `pedidosVendedor`, `SEGUIDOS`, `REPORTES`, `ADMIN_DB`, burbujas de chat): se reemplazan al primer 200 de la API y nunca se envían al servidor. `require('electron').ipcRenderer` (línea 1) se conserva intacto.

## 4. Desviaciones documentadas vs brief (incompatibilidades reales del backend)
1. `api.seguir` del brief envía `{usuario_id}`, pero `seguidores.controllers.js` valida `{seguido_id}` (zod): el caller intenta `api.seguir` y reintenta con `{seguido_id}` vía `apiRequest` ante 400. Idem `api.adminResolverReporte` (brief sin body) vs backend que exige `{respuesta}`: el caller usa `apiRequest PATCH …/resolver` con cuerpo.
2. `api.js` copiado idéntico al brief salvo `API_URL` default (`http://localhost:3000` para Electron, según el propio brief §RAMA escritorio).
3. `calificarVendedor` exige `{pedido_id,vendedor_id}` de compra real: se cableó desde el último pago (`_ultimoPedidoId/_ultimoVendedorId`); fuera de ese flujo, la UI pinta estrellas y avisa (igual que móvil).

## 5. Pendiente / riesgos para build+verify
1. Sin backend en vivo no hubo E2E: validar con API en `http://localhost:3000` los 62 métodos `api.*` usados por el cliente (matriz `INVENTARIO_ENDPOINTS_API_2026-09-05.md`).
2. `confirmarPago` exige `direccion_envio ≥5` y Luhn en tarjeta: la UI valida 16 dígitos + nombre; probar rechazo 400 real.
3. `cuentaBancaria` (`GET /api/tienda/mi-cuenta-bancaria`) y `adminCuentaBancaria` están en `api.js` pero sin precarga de formulario (solo guardado); cablear lectura al abrir Tienda/Ajustes-admin.
4. `api.conversaciones` / `api.notifsNoLeidas` / `api.perfilPublico` / `api.vendedores` / `api.categorias` están en `api.js` sin UI dedicada (page-mensajes es estática; categorías del filtro son fijas).
5. `openChat` con tarjetas estáticas de mensajes (sin id resoluble en directorio) opera en modo local.
6. CORS Electron: depende de la rama backend (`"null"`/`"file://"` en `CORS_ORIGINS`).
