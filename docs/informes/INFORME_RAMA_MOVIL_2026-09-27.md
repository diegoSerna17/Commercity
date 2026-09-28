# Informe RAMA Móvil — Integración API CommerCity (2026-09-27)

> Alcance: SOLO `docs/AVANCES/MOVIL COMMERCITY/commercity-mobile/www/` (`api.js`, `app.js`, `index.html`).
> No se tocó `backend/` ni el repo escritorio (`git status` limpio salvo 3 untracked preexistentes; `docs/` está gitignorado).
> Base: `docs/informes/PLAN_INTEGRACION_API_MOVIL_ESCRITORIO_2026-09-27.md` (bloque api.js + sección RAMA móvil, tasks 3-9).
> Verificación: `node --check` OK en `www/api.js` y `www/app.js`. Sin backend en vivo: no hay E2E (queda para rama build+verify).

## 1. Capa de red (task 3.1)

- `www/api.js` NUEVO: copia idéntica del bloque del brief (69 endpoints, `apiRequest` + objeto `api`).
  `API_URL = window.COMMERCITY_API_URL || "http://10.0.2.2:3000"` (emulador Android).
- `www/index.html`: `<script src="api.js"></script>` insertado ANTES de `<script src="app.js"></script>` (líneas 1536-1537).
- Extras mínimos en `index.html`: `<input type="file" id="report-evidence">` en modal de reportes (evidencia multipart),
  `id="historial-tbody"` al tbody de historial (render dinámico), botón banco-admin → `saveAdminBankAccount()`.

## 2. Handlers reemplazados → llamadas reales

### Auth (task 3.2) — mock eliminado, incluido `admin@gmail.com/admin123`
| Handler | Antes (mock) | Ahora (API) | Endpoints |
|---|---|---|---|
| `handleLogin` | rama hardcodeada admin + `includes('vendedor')` | `api.login` → guarda `commercity_token`, `commercity_user_id`, `commercity_user` (nombre_completo), `commercity_email`, `commercity_roles` (reales), flags seller/admin; remember solo email (se purga `commercity_rem_pass` en claro) | `POST /api/usuarios/login` |
| `handleRegistro` | solo localStorage | `api.register` + si ☑ vender → `api.cambiarRol('vendedor')` | `POST /api/usuarios/register`, `PATCH /api/usuarios/me/rol` |
| `handleRecuperar` | toast fake | `api.recover` | `POST /api/usuarios/recover` |
| `handleRestablecer` | toast fake | `api.resetPassword(token, pass)`; token desde `?token=` o `commercity_reset_token` (flujo email, expira 5 min) | `POST /api/usuarios/reset-password` |
| `handleLogout` | solo local | `api.logout` (best-effort) + `clearSession()` | `POST /api/usuarios/logout` |
| (nuevo) `refreshPerfilDesdeAPI` / `saveSessionFromAuth` / `applyRoles` / `clearSession` | — | `api.me`; 401 → limpia sesión y vuelve a login | `GET /api/usuarios/me` |

### Catálogo (task 3.3)
| Handler | Antes | Ahora | Endpoints |
|---|---|---|---|
| `PRODUCTS` (const mock 10 ítems) | hardcodeado | `let PRODUCTS = {}` + `cargarCatalogoDesdeAPI()`; mapeo `{name,cat,price,stock,disc,img:API_URL+imagen,vendor,desc}` (+`id`,`vendorId`); `FALLBACK_PRODUCTS` solo contingencia offline; `renderHomeGrid()` / `renderMisProductos()` | `GET /api/productos?page&limit`, `GET /api/productos/mis-productos` |
| `openProductDetail` | solo local | igual + `api.validarStock(id,1)` refresca stock real | `GET /api/productos/:id/validar-stock` |
| `addToCart` | push local | `api.validarStock` (si qty>1) + `api.agregarCarrito` | `POST /api/carrito` |

### Carrito / pago (task 3.4)
| Handler | Antes | Ahora | Endpoints |
|---|---|---|---|
| `renderCart` | `commercity_cart` local | `api.listarCarrito(comprador_id)` (id JWT de `commercity_user_id`) | `GET /api/carrito?comprador_id=` |
| `cartQty` | `qty±1` local | `api.modificarCantidad` | `PATCH /api/carrito/:productoId` |
| `cartRemove` | `splice` local | `api.eliminarCarrito` | `DELETE /api/carrito/:productoId` |
| `openPasarela` | IVA calculado local (/1.19) | `api.resumenPedido` — subtotal/IVA/total DEL SERVIDOR | `GET /api/pedidos/resumen` |
| `processPago` | `setTimeout` fake 1600 ms | `api.confirmarPago({direccion_envio,metodo_pago:'tarjeta',numero_tarjeta (13-19 dígitos),nombre_tarjeta})`; setTimeout fake ELIMINADO | `POST /api/pedidos/confirmar-pago` |

### Perfil / banco / vendedor (tasks 3.5-3.6)
| Handler | Ahora | Endpoints |
|---|---|---|
| `savePersonalInfo` | `api.actualizarPerfil({nombre_completo})` (el backend solo acepta ese campo; email/desc siguen locales) | `PATCH /api/usuarios/me` |
| `saveBankAccount` | `api.guardarCuentaBancaria({titular_nombre,banco,tipo_cuenta lower (ahorros\|corriente),numero_cuenta solo dígitos})` | `POST /api/tienda/mi-cuenta-bancaria` |
| `becomeSeller` | `api.cambiarRol('vendedor')` + `applyRoles` | `PATCH /api/usuarios/me/rol` |
| `confirmDelete` | `api.eliminarCuenta()` + `clearSession()` | `DELETE /api/usuarios/cuenta` |
| `handleAddProduct` | `FormData{nombre,descripcion,precio,stock,descuento,categoria,imagen obligatoria}` → `api.crearProducto` + recarga catálogo | `POST /api/productos` (multipart `imagen`) |
| `handleEditProduct` | `FormData` (imagen solo si se elige nueva) → `api.editarProducto` | `PUT /api/productos/:id` |
| (nuevo) `cargarTienda` | stats + cuenta + validación al entrar a Tienda | `GET /api/tienda/dashboard/stats`, `GET /api/tienda/mi-cuenta-bancaria`, `GET /api/tienda/validacion` |
| (nuevo) `cargarPedidos` / `cargarHistorial` | ventas del vendedor / compras del comprador | `GET /api/tienda/ventas`, `GET /api/historial/compras` |

### Admin / social / chat / notifs (task 3.7)
| Handler | Ahora | Endpoints |
|---|---|---|
| `adminAction` (se unificaron las 2 definiciones) | Banear/Activar → `adminCambiarEstado`; Eliminar usuario → `adminEliminarUsuario`; Eliminar/Suspender producto → `adminEliminarProducto`; Restaurar → `adminRestaurarProducto`; Resolver/Responder → `adminResolverReporte`; Eliminar reporte → `adminEliminarReporte`; Ver → `adminReporte`. Lee ids de `data-user-id/product-id/report-id` de la tarjeta | `PATCH /api/admin/usuarios/:id/estado`, `DELETE /api/admin/usuarios/:id`, `DELETE /api/admin/productos/:id`, `PATCH /api/admin/productos/:id/restaurar`, `PATCH /api/admin/reportes/:id/resolver`, `DELETE /api/admin/reportes/:id`, `GET /api/admin/reportes/:id` |
| `cargarAdminDashboard/Usuarios/Productos/Reportes` (nuevo, hook en `switchAdminTab` y `navigate('admin')`) | listados reales | `GET /api/admin/stats`, `/api/admin/usuarios`, `/api/admin/productos`, `/api/admin/reportes` |
| `saveAdminBankAccount` (nuevo) | cuenta Commercity | `POST /api/admin/mi-cuenta-bancaria` |
| `submitReportModal` / `openReportModal(tipo,id)` | `FormData{tipo,motivo,producto_id\|usuario_reportado_id,evidencia?}` → `api.crearReporte` | `POST /api/reportes` (multipart `evidencia`) |
| `renderFollowersList` / `toggleFollow` | `api.seguidores` / `api.siguiendo` + seguir/dejar | `GET /api/seguidores/seguidores`, `/siguiendo`, `POST /api/seguidores`, `DELETE /api/seguidores/:id` |
| `rateProfile` / `submitVendorRating` / `openRatingModal(nombre,vendorId,pedidoId)` | `api.calificarVendedor({pedido_id,vendedor_id,estrellas,comentario})`; sin contexto de compra → solo pinta + avisa | `POST /api/calificaciones/vendedor` |
| `sendChatMessage` / `sendMsg` / `openChat(...,userId)` / `cargarMensajes` | `FormData{receptor_id,mensaje}` → `api.enviarMensaje`; historial vía `api.mensajes` | `POST /api/chat` (multipart `archivo`), `GET /api/chat/mensajes/:usuarioId` |
| `toggleNotifs`→`cargarNotificaciones`, `clearNotifs`, `eliminarNotif` | listado, borrado total y por id (+`marcarNotifLeida` al abrir) | `GET /api/notificaciones`, `DELETE /api/notificaciones`, `DELETE /api/notificaciones/:id`, `PATCH /api/notificaciones/:id/leida` |

## 3. Seguridad transversal aplicada (rama móvil)
- Eliminado `admin@gmail.com/admin123` y la heurística `includes('vendedor')`.
- `commercity_rem_pass` (contraseña en claro) ya no se guarda; se purga el valor legacy al iniciar y al cerrar sesión. Remember-me conserva solo el email.
- Eliminado carrito semilla mock (`sneaker`/`earbuds`) y `saveCart` local (servidor = fuente de verdad).
- Eliminado `setTimeout` fake de pago.
- Nota: queda `require('electron').ipcRenderer` en try/catch (muerto en móvil, inofensivo) y tarjetas HTML estáticas iniciales (se reemplazan al cargar catálogo/API). `commercity.keystore` no existe en `www/` (nada que quitar aquí).

## 4. Pendiente / riesgos para build+verify
1. Sin backend en vivo no hubo E2E: validar con API corriendo (emulador `10.0.2.2:3000`) los 69 endpoints desde el cliente.
2. `confirmarPago` exige tarjeta 13-19 dígitos y `direccion_envio` ≥5 chars: la UI ya lo exige, pero probar rechazo 400 real.
3. `calificarVendedor` exige `pedido_id` real del comprador: hoy el modal solo tendrá contexto si se abre con `(nombre, vendorId, pedidoId)` — cablear apertura desde historial cuando exista id de pedido.
4. `openChat` sin `userId` (tarjetas estáticas de mensajes) solo pinta local: pasar ids reales al renderizar conversaciones (`api.conversaciones` aún sin UI dedicada).
5. `actualizarEstadoPedido` / `cancelarCompra` / `marcarLeido` / `marcarTodasLeidas` están en `api.js` pero sin botón que los invoque (sin UI origen).
6. `openOrderDetail` sigue mostrando `ORDER_DATA` mock en el modal de pedido (detalle vendedor). Migrar a `api.ventas` cuando el modal tenga ids reales.
