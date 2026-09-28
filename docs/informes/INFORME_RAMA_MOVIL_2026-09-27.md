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

---

## Cierre de pendings 2026-09-28

> Alcance: solo `docs/AVANCES/MOVIL COMMERCITY/commercity-mobile/www/` (`app.js`, `index.html`).
> No se tocó `backend/` ni `docs/AVANCES/ESCRITORIO…`.
> Verificación: `node --check www/app.js` y `node --check www/api.js` OK + smoke tests offline con `api` mockeada (32 aserciones: render de pedidos/historial/chat/notifs, ids reales y llamadas a los 6 endpoints nuevos).

### Cerrados (los 4 pendings de la sección 4: 3, 4, 5 y 6)

| # | Pending | Qué se hizo |
|---|---|---|
| 3 | `calificarVendedor` con `pedido_id` real | `cargarHistorial()` aplana `api.historialCompras` (pedidos → `items[]`) en `HISTORIAL_LINEAS`, guardando **`pedido_id`, `detalle_id` y `vendedor_id` por línea**. Nueva columna **ACCIÓN** con botón `Calificar` → `abrirCalificacion(i)` → `openRatingModal(vendedor, vendedor_id, pedido_id)` → `submitVendorRating()` envía `{pedido_id, vendedor_id, estrellas, comentario}` a `POST /api/calificaciones/vendedor`. Nota: el backend **no expone `vendedor_id` en el historial**, solo el nombre; se resuelve con `resolverVendedorId()`: `/api/vendedores` → `/api/usuarios/directorio` → `vendedor_id` del catálogo (`api.productos`). |
| 6 | `openOrderDetail` con `ORDER_DATA` mock | `ORDER_DATA` **eliminado** y las 4 filas mock de `#pedidos-tbody`/`#historial-tbody` retiradas de `index.html`. `openOrderDetail(pedidoId, detalleId)` es `async` y fusiona dos fuentes reales: **línea del pedido desde `api.historialCompras`** (dirección de envío, producto, cantidad, total, fecha, estado, vendedor) y **`api.ventas`** (nombre/email del comprador, producto, monto, estado, fecha). Nueva fila "Vendedor" en `#od-modal`; si el pedido no existe → toast, sin datos inventados. |
| 4 | Chat sin ids reales | `navigate('mensajes')` llama a **`cargarConversaciones()`**: pinta `api.conversaciones` (nombre, último mensaje, no leídos) + `api.directorio` (usuarios con los que aún no hay chat), todos con **id real**; cada fila usa `abrirChatLista(i)` → `openChat(name, ava, color, userId)` con `userId` real. La lista estática de `index.html` se conserva solo como **fallback offline** (`CHAT_FALLBACK_HTML`). `sendChatMessage()` ahora: con API+id envía `POST /api/chat` y repinta desde `api.mensajes`; la **burbuja local es solo fallback** (sin API o sin id) y si el envío falla se conserva el texto para reintentar. |
| 5 | Endpoints sin UI | **`cancelarCompra`**: botón `Cancelar` por línea en estado *Pendiente* → `cancelarCompraLinea(i)` (confirm → `api.cancelarCompra(detalleId)` → recarga). **`actualizarEstadoPedido`**: en *Pedidos* del vendedor, botón `Enviar` (Pendiente→`'En camino'`) y `Entregado` (`'En camino'`→`'Entregado'`) → `api.actualizarEstadoPedido(pedidoId, estado)`, respetando la transición de un solo nivel del backend. **`marcarNotifLeida`**: al hacer clic en una fila del panel (antes ya existía; ahora además atenúa la fila y evita reenvíos). **`marcarTodasLeidas`**: al abrir el panel desde `toggleNotifs()` → `api.marcarTodasLeidas()`. Extra: **`api.marcarLeido`** al abrir un chat (mensajes entrantes con `leido = 0`). |

### Mejoras de render asociadas
- `filterHTab()` ya filtra de verdad (`data-estado` en las filas del historial); `filterTab()` sigue igual para pedidos.
- Estados normalizados con `claveEstado()`/`claseBadge()` (`pendiente|camino|entregado|cancelado`) y avatares deterministas por nombre (`colorAvatar`).
- `cargarPedidos()` usaba campos inexistentes (`v.comprador`, `v.producto`, `v.total`); ahora lee los reales de `api.ventas` (`nombre_comprador`, `nombre_producto`, `valor_subtotal`, `fecha_pedido`).
- `cargarMensajes()` preserva la tarjeta de producto del chat, repinta solo `.msg-wrap` y marca como leídos los entrantes.
- **`escAttr` en todo lo que pinta datos del servidor (nombres, previews, notificaciones, burbujas)** → *afirmación CORREGIDA el 2026-09-28: era falsa.*
  - **Sí estaba escapado en esta rama (2026-09-27):** tablas de *Pedidos* (`cargarPedidos`, `app.js` ~356-359) y *Historial* (~431-433), fila de notificaciones (~513-515), nombre/preview de conversaciones (~1396-1402) y burbujas de chat salientes (~1478). También el texto del mensaje entrante (`cargarMensajes`, ~477).
  - **Quedaba SIN escapar (detectado por `REVIEW_findings.md`, eje b):** `productCardHTML()` (nombre y atributos `src`/`alt`, 78-82), `renderCart()` (nombre, categoría y `src`, 1071-1078), `renderFollowersList()` (nombre y rol/tipo, 1811-1819), el `href` de archivo adjunto del chat (477) y **todo el panel admin**: `cargarAdminUsuarios()`/`cargarAdminProductos()`/`cargarAdminReportes()` (1999-2058), incluidos los argumentos entre comillas simples de sus `onclick`.
  - **Corregido el 2026-09-28** → ver la sección *Correcciones post-review 2026-09-28* al final de este informe.

### Llamadas API nuevas desde la UI
| Endpoint | Disparador nuevo |
|---|---|
| `POST /api/historial/compras/:detalle_id/cancelar` | botón Cancelar (historial, línea *Pendiente*) |
| `PATCH /api/pedidos/:id/estado` | botones Enviar / Entregado (pedidos del vendedor) |
| `PATCH /api/notificaciones/leidas` | abrir el panel de notificaciones |
| `PATCH /api/notificaciones/:id/leida` | clic en una notificación |
| `PATCH /api/chat/mensajes/:id/leido` | abrir una conversación (mensajes recibidos sin leer) |
| `GET /api/vendedores` y `GET /api/usuarios/directorio` | resolver `vendedor_id` del historial y poblar `page-mensajes` |
| `POST /api/calificaciones/vendedor` (contexto real) | botón Calificar → modal → Enviar |
| `GET /api/chat/conversaciones` | `navigate('mensajes')` |

### Siguen abiertos

> **Cierre E2E (2026-09-28):** los puntos 1 y 2 de esta seccion quedaron **CERRADOS con evidencia en vivo** contra el backend en `http://localhost:3000` (BD real `commercity_v2`):
> - Runner `docs/AVANCES/PRUEBAS/ejecutar_pruebas.mjs` = **129/129 OK** (69 endpoints).
> - Harness de capa red `docs/AVANCES/PRUEBAS/harness_capa_red.mjs` = **102/102 OK** ejecutando el `www/api.js` real de este cliente (incluye B1: 400 direccion corta, 400 formato tarjeta, **402 PAGO_RECHAZADO Luhn**; `validacionTienda` RF130-139; RBAC 403). CORS Electron verificado con preflight `Origin: null` -> 204 + ACAO (commit 14d6056).
> - Evidencia: `docs/informes/EVIDENCIA_E2E_CAPA_RED_2026-09-28.md`.
1. E2E real con la API corriendo en el emulador (`10.0.2.2:3000`): los 69 endpoints del brief más los nuevos de la tabla anterior.
2. Probar el rechazo 400 de `confirmarPago` (tarjeta/dirección) con datos reales.
3. `openChat` desde las 3 tarjetas estáticas de `page-mensajes` sigue sin `userId` (fallback local deliberado): al reemplazarlas por `cargarConversaciones()` todas las filas reales sí llevan id.

---

## Correcciones post-review 2026-09-28

> **Fuente:** `docs/AVANCES/PRUEBAS/REVIEW_findings.md` (tablas de los ejes **a** contrato, **b** seguridad, **c** regresiones).
> **Alcance:** SOLO `docs/AVANCES/MOVIL COMMERCITY/commercity-mobile/www/` (`app.js`, `api.js`, `index.html`) + este informe.
> **No se tocó** `backend/` ni `docs/AVANCES/ESCRITORIO COMMERCITY/…`.
> **Verificación:** `node --check www/app.js` → OK; `node --check www/api.js` → OK.
> Nota: la lista de trabajo marcó el hallazgo 5 como ALTO; en el review figura como MEDIO (se corrigió igual).
> Las referencias de línea citadas son las del review (el `app.js` ya se movió tras estas correcciones).
> Los hallazgos CRÍTICO de `cargarAdminReportes` y la afirmación de este informe (eje d) fueron los que
> `INFORME_RAMA_ESCRITORIO_2026-09-27.md` §7 dejó expresamente pendientes para esta rama.

### Corregidos

| # | Sev. (REVIEW) | Hallazgo | Corrección aplicada |
|---|---|---|---|
| 1 | **CRÍTICO** | `cargarAdminReportes()` (app.js:2050,2054): `motivo`, `rep`, `fecha` y `estado` —texto libre de cualquier usuario— se interpolaban crudos en `innerHTML` **y** dentro del argumento del `onclick` → XSS almacenado en la sesión del admin | `escAttr()` en los 6 campos del HTML; el `onclick` ahora solo lleva el **id numérico** (`openAdminReportDetailById(${rid})`) y el resto se lee de `ADMIN_REPORTES_CACHE` en memoria. El `data-report-id` (usado por `adminAction`) también va con `escAttr` |
| 2 | **ALTO** | `cargarAdminUsuarios()`/`cargarAdminProductos()` (1999-2028): `nombre`, `rol`, `email`, `vend`, `estado` crudos, también como argumentos entre comillas simples del `onclick` | `escAttr()` en todo el texto **y** en los `data-*` de la tarjeta; los argumentos del `onclick` se pasan ahora por `this.dataset.*` (patrón `data-*` + lectura, la alternativa que propone el propio review y la única realmente segura dentro de un atributo) |
| 3 | **ALTO** | `api.seguir()` (api.js:72) enviaba `{usuario_id}`; el zod de `seguidores.controllers.js` exige `{seguido_id}` → **400 siempre** | Cuerpo cambiado a `{ seguido_id }` (firma `seguir(seguido_id)`) |
| 4 | **ALTO** | `openPasarela()` (1177) leía `data.subtotal/iva/total`, pero `GET /api/pedidos/resumen` devuelve `data.totales.{subtotal,iva,total}` → subtotal/IVA/total pintados en 0 | `const t = (body.data \|\| {}).totales \|\| body.data \|\| {}` y se leen `t.subtotal`/`t.iva`/`t.total` con fallback a `subtotal + iva` y guarda `NaN → 0` |
| 5 | **MEDIO** | `cargarTienda()` (306) leía `ventas_totales`/`dinero_recaudado` en la raíz de `data`; el backend expone `data.tarjetas.{unidades_vendidas,total_neto_vendedor,total_comision}` y `data.por_estado` → nunca se pintaban | Se lee `data.tarjetas` + `data.por_estado`. Las 2 tarjetas existentes pintan `unidades_vendidas` y `total_neto_vendedor`; se añadieron en `index.html` 3 tarjetas (`#tienda-comision`, `#tienda-entregados`, `#tienda-pendientes`, ids iguales a los del escritorio) para `total_comision` y el desglose `por_estado` |
| 6 | **MEDIO/LEVE** | XSS por falta de escape: `productCardHTML()` (78-82), `renderCart()` (1071-1078), `renderFollowersList()` (1811-1819) y `href` de `archivo_url` (477) | `escAttr()` en texto y en atributos (`src`, `alt`, `href`). En `renderFollowersList` el `onclick` de *Seguir* solo recibe `uid` numérico validado con `Number.isFinite` |
| 7 | **LEVE** | (a) `calificarVendedor` no limpiaba `currentRatingContext` tras el éxito (`pedido_id` es UNIQUE → error sin contexto en un 2.º intento); (b) `saveBankAccount` no validaba `tipo_cuenta` contra el placeholder; (c) `toggleNotifs` marcaba y repintaba en paralelo | (a) `currentRatingContext = null` tras el toast de éxito (2305). (b) valida `tipo_cuenta ∈ {ahorros, corriente}` y rechaza el placeholder (`Selecciona tipo`) antes de enviar. (c) `toggleNotifs` es `async` y **espera** `api.marcarTodasLeidas()` antes de `cargarNotificaciones()` |
| 8 | **ALTO** | Este informe afirmaba (sección *Mejoras de render*) "`escAttr` en todo lo que pinta datos del servidor" | Afirmación corregida con el detalle de lo que sí estaba escapado y lo que no; añadida esta sección |

### Quedan pendientes (hallazgos móviles del review NO corregidos en esta corrida)

| Sev. | Hallazgo | Motivo |
|---|---|---|
| MEDIO | `app.js:123, 1025-1035` — el fallback offline del carrito quedó eliminado (`saveCart` no-op, `renderCart` fuerza carrito vacío sin API/sesión) | Requiere decisión de producto (restaurar caché local de solo lectura vs. documentar el cambio de comportamiento); fuera de la lista de correcciones pedida |
| LEVE | `app.js:367` — `actualizarEstadoPedido()` no envía `detalle_id`: si el comprador canceló una línea, el backend responde 409 y el vendedor no puede avanzar ninguna | Cambio de contrato/UX (enviar `detalle_id` por fila y/o excluir `Cancelado`); fuera de la lista pedida |
| INFO | `app.js:289-296, 441-444` — `resolverVendedorId()` resuelve el `vendedor_id` por **nombre**; con vendedores homónimos se envía un id ajeno (403/404) | Se arregla exponiendo `vendedor_id` en `GET /api/historial/compras` (toque de backend, fuera de alcance) |

### Observación adicional (no estaba en el review)

- `switchPerfilTab()` → tarjeta "Mi Feed" (`app.js` ~2265-2280) pinta `p.img` (src), `p.name` y `p.vendor` **sin escapar**, mismo patrón que `productCardHTML()` antes de la corrección 6. No pertenecía a la lista exacta de correcciones de esta corrida; queda anotado para la siguiente iteración.

### Residual del review cerrado (2026-09-28 tarde)
- **Fallback offline del carrito restaurado** (hallazgo MEDIO del review): `saveCart()` ahora persiste `commercity_cart` (solo lectura, unicamente tras carga exitosa de la API) y `renderCart()` usa `loadCartFallback()` cuando no hay sesion/API o la llamada falla, en vez de forzar carrito vacio. El servidor sigue siendo la fuente de verdad; el cache jamas viaja al backend.
