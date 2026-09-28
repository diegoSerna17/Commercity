# Plan de Integracion API — Movil + Escritorio (paridad 69 endpoints)

> Brief compartido para orquestacion en paralelo. Fecha: 2026-09-27.
> Backend central ya probado: 320/320 tests, contrato `{ success, data }` / `{ success:false, error:{code,message,details} }`.
> Trabajan en directorios DISJUNTOS (sin conflictos git) — ver "Limites de archivos".

## Goal
Cablear las UIs vanilla de la app movil (Capacitor `www/app.js`) y escritorio (Electron `commercity-desktop/src/app.js`) a los 69 endpoints del backend, eliminando mocks `localStorage`/en memoria por llamadas JWT reales.

## Limites de archivos (CRITICO para paralelo — no tocar fuera de tu rama)

| Rama | Directorio / archivos que SÓLO puede tocar |
|---|---|
| **backend** | `backend/src/server/routes/tienda.routes.js`, `backend/src/server/controllers/tienda.controllers.js`, `backend/src/server/app.js`, tests `backend/src/server/__tests__/tienda*.test.js`, `__tests__/cors*.test.js` |
| **movil** | `docs/AVANCES/MOVIL COMMERCITY/commercity-mobile/www/**` (api.js, app.js, index.html) |
| **escritorio** | `docs/AVANCES/ESCRITORIO COMMERCITY/commercity-desktop/src/**` (api.js, app.js, index.html) |
| **build** | solo comandos (`npx cap sync`, gradle, electron-builder) + `informes/` evidencia |

Si necesitas un archivo fuera de tu rama: reportar al coordinador (pane `w4:p1`), NO editarlo.

## Contrato de la API
- Base URL: movil emulador `http://10.0.2.2:3000`, movil fisico `http://<IP-LAN>:3000`, escritorio `http://localhost:3000`.
- Exito: `{ success:true, message, data }`. Error: `{ success:false, error:{code,message,details} }`.
- Codigos: 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 FORBIDDEN, 404 NOT_FOUND, resto INTERNAL_ERROR.
- Auth: header `Authorization: Bearer <JWT>` (expira 7 dias). Sin refresh: 401 -> limpiar token y volver a login.
- Imagenes: la API devuelve ruta relativa `/uploads/archivo.jpg`; URL completa = `API_URL + campo`.
- Campos producto LISTADO usa `imagen`; DETALLE usa `imagen_url` (ojo al mapeo).
- Roles reales: `"comprador" | "vendedor" | "administrador"`.

## api.js — capa de red compartida (copiar IDENTICA a www/api.js y a src/api.js)

```js
// api.js - Capa de red CommerCity (compartida movil + escritorio)
const API_URL = (typeof window !== "undefined" && window.COMMERCITY_API_URL) || "http://10.0.2.2:3000";
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
  listarCarrito: (cid) => apiRequest("/api/carrito?comprador_id=" + cid),
  agregarCarrito: (comprador_id, producto_id, cantidad = 1) => apiRequest("/api/carrito", { method: "POST", body: JSON.stringify({ comprador_id, producto_id, cantidad }) }),
  modificarCantidad: (cid, pid, cantidad) => apiRequest("/api/carrito/" + pid + "?comprador_id=" + cid, { method: "PATCH", body: JSON.stringify({ cantidad }) }),
  eliminarCarrito: (cid, pid) => apiRequest("/api/carrito/" + pid + "?comprador_id=" + cid, { method: "DELETE" }),
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
  seguir: (usuario_id) => apiRequest("/api/seguidores", { method: "POST", body: JSON.stringify({ usuario_id }) }),
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
```

## Mapa endpoints por rama (69)
- usuarios (13): `/`, `/perfil-publico/:id`, `/directorio`, DELETE `/cuenta`, POST `/register`,`/login`,`/recover`,`/reset-password`,`/logout`, GET/PATCH `/me`, PATCH `/me/rol`, GET `/admin`.
- productos (8): GET `/productos`,`/categorias`,`/vendedores`,`/productos/mis-productos`,`/productos/:id/validar-stock`,`/productos/:id`, POST/PUT `/productos(/:id)` (multipart `imagen`).
- admin (16): stats, usuarios, usuarios/:id/estado(PATCH), usuarios/:id(DEL), productos, productos/:id(DEL), productos/:id/restaurar(PATCH), reportes, reportes/:id, reportes/:id(DEL), reportes/:id/resolver(PATCH), busqueda, mi-cuenta-bancaria(GET/POST/PUT), mi-cuenta-bancaria/masked.
- tienda (7 + validacion): mi-cuenta-bancaria(GET/POST/PUT), masked, ventas, ingresos, dashboard/stats, **validacion (RESTAURAR)**.
- carrito (4): POST `/`, DELETE `/:productoId`, PATCH `/:productoId`, GET `/?comprador_id=`.
- pedidos (3): GET `/resumen`, POST `/confirmar-pago`, PATCH `/:id/estado`.
- historial (2): GET `/compras`, POST `/compras/:id/cancelar`.
- chat (4): POST `/` (multipart `archivo`), GET `/conversaciones`, GET `/mensajes/:usuarioId`, PATCH `/mensajes/:id/leido`.
- notificaciones (6): GET `/`, `/no-leidas`, PATCH `/leidas`, `/:id/leida`, DELETE `/`, `/:id`.
- calificaciones (1): POST `/vendedor`.
- seguidores (4): GET `/siguiendo`, `/seguidores`, POST `/`, DELETE `/:id`.
- reportes (1): POST `/` (multipart `evidencia`).
- raiz (1): GET `/`.

## RAMA backend (Tasks 1-2) — prerequisito, NO bloquea auth/catalogo
1. Restaurar `GET /api/tienda/validacion` (RF130-139) en `tienda.routes.js` + `getValidacionTienda` en controller (valida cuenta bancaria completa sin exponer datos, 90/10 tolerancia 1 centavo, devoluciones con reembolso). Ver CHANGELOG 2026-08-24. Test: vendedor 200 / sin token 401 / comprador 403.
2. CORS Electron: en `app.js` `CORS_ORIGINS` agregar `"null"` y `"file://"` (Electron loadFile envia `Origin:null`). Test en `cors.middleware.test.js`.
3. Verificar: `cd backend && npx vitest run __tests__/tienda.controllers.test.js __tests__/cors.middleware.test.js` verde.

## RAMA movil (Tasks 3-9) — dir `docs/AVANCES/MOVIL COMMERCITY/commercity-mobile/www/`
1. Copiar `api.js` identico + `<script src="api.js">` antes de `app.js` en `index.html`. `API_URL` emulador `10.0.2.2`.
2. Auth: `handleLogin()` (276) ELIMINAR admin hardcodeado `admin@gmail.com/admin123`, `handleRegistro()` (330), `handleRecuperar()` (354)->`api.recover`, `handleRestablecer()` (361)->`api.resetPassword`, `handleLogout()` (370)->`api.logout`. Llenar `commercity_token` + claves con `user.roles` real.
3. Catalogo: `PRODUCTS` mock -> `let PRODUCTS={}` + `cargarCatalogoDesdeAPI()` construye `{name,cat,price,stock,disc,img:API_URL+p.imagen,vendor,desc}`. `openProductDetail` (414) + `api.validarStock`.
4. Carrito: `renderCart/cartQty/cartRemove` (486) -> `api.listarCarrito/modificarCantidad/eliminarCarrito`. `openPasarela` (578)->`api.resumenPedido`. `processPago` (627) -> `api.confirmarPago({direccion_envio,metodo_pago,numero_tarjeta,nombre_tarjeta})` (quitar setTimeout fake).
5. Perfil/banco: `savePersonalInfo` (792)->`api.actualizarPerfil`, `saveBankAccount` (822)->`api.guardarCuentaBancaria`, `becomeSeller`->`api.cambiarRol("vendedor")`, `confirmDelete`->`api.eliminarCuenta`.
6. Vendedor: `handleAddProduct` (695)->`api.crearProducto(fd)` con `imagen`, `handleEditProduct` (1116)->`api.editarProducto`. Tienda: `api.statsTienda/ventas/ingresos/validacionTienda`.
7. Admin/social/chat/notifs: `adminAction` (1233/1242)->`api.admin*`, `submitReportModal` (1275)->`api.crearReporte`, seguidores->`api.seguidores*`, `rateProfile`->`api.calificarVendedor`, `sendMsg`->`api.enviarMensaje`, notifs->`api.notificaciones*`.

## RAMA escritorio (Tasks 3,10-13) — dir `docs/AVANCES/ESCRITORIO COMMERCITY/commercity-desktop/src/`
1. Copiar `api.js` identico + `<script src="api.js">` antes de `app.js`. `API_URL` = `http://localhost:3000`.
2. Auth: `doLogin()` (376) + objeto `USERS` (26) -> `api.login`. ELIMINAR `admin/admin123`, `juan_giraldo/1234`. Registro/logout/recuperacion -> `api.*`.
3. Catalogo/carrito: `PRODUCTS` (12)->`api.productos`, `addToCart` (185)->`api.agregarCarrito`, checkout->`api.listarCarrito/resumenPedido/confirmarPago`. `navigate` (498) se conserva.
4. Vendedor/tienda: CRUD productos, `api.guardarCuentaBancaria`, `api.statsTienda/ventas/ingresos/validacionTienda`.
5. Admin/social/chat/notifs: `api.admin*`, `api.crearReporte`, `api.seguidores*`, `api.calificarVendedor`, `api.enviarMensaje/mensajes`, `api.notificaciones*`.

## RAMA build+verify (Tasks 14-16) — despues de movil y escritorio
- E2E smoke 69 endpoints desde cada cliente (preflight CORS + matriz `informes/INVENTARIO_ENDPOINTS_API_2026-09-05.md`).
- APK: `npx cap sync android` -> Build APK(s). ROTAR `commercity.keystore` commiteado (credenciales por env). Release `v1.30.0`.
- EXE: `npm install && npm run build` (electron-builder NSIS). Eliminar secretos antes de empaquetar.

## Seguridad transversal
- Quitar `commercity.keystore` del repo movil + rotar firma.
- Eliminar credenciales hardcodeadas (`admin@gmail.com/admin123`, `admin/admin123`, `juan_giraldo/1234`, `rem_pass` plaintext).
- Quitar `ipcRenderer=require('electron')` muerto en movil y `fix-*.js`/`temp_*` del arbol.

## Grafo de dependencias (para velocidad)
```
Wave 1 (PARALELO, disjunto):  [backend]  [movil]  [escritorio]
Wave 2 (tras wave 1):         [build-APK]  [build-EXE]  [E2E-smoke]
```
Cada agente de wave 1 escribe su propio `api.js` identico -> sin serializacion.
NO ejecutar tests del backend en paralelo con builds (compiten por BD/puerto 3000).
