# Matriz RF - modulo - endpoints

**Proyecto:** CommerCity
**Alcance:** backend y API REST (74 operaciones HTTP)
**Fecha:** 2026-10-30
**Version del documento de requerimientos:** final 2026-08-20 (RF1 a RF141)

---

## 1. Proposito

Este documento responde una pregunta concreta de la sustentacion: **que requerimiento funcional
(RF) queda cubierto por que endpoint del backend**. No es un documento de diseno ni una
certificacion: es la trazabilidad verificable entre el documento oficial del Director y las
rutas que hoy estan montadas en el servidor.

Se usa para tres cosas:

1. Sostener la diapositiva "Matriz RF" sin afirmar coberturas que no existen.
2. Identificar los RF que no tienen endpoint porque son de interfaz, de base de datos o
   porque quedaron como brecha.
3. Detectar citas de RF equivocadas dentro del codigo (seccion 6).

## 2. Fuentes y metodo

| Fuente | Uso |
|---|---|
| `docs/LAST VERSION/Commercity (optimizado)/Commercity (optimizado).docx.md` | Texto literal de RF1 a RF141. Unica fuente de numeracion. |
| `backend/src/server/app.js` | Montajes reales de los 13 routers. |
| `backend/src/server/routes/*.js` | Metodo y ruta de cada operacion. |
| `backend/src/server/controllers/**` | Comportamiento y permisos por recurso. |
| `docs/api/openapi.json` | 63 paths y 74 operaciones (v1.3.2). |
| `docs/api/inventario-endpoints.md` | Inventario de referencia y estado de validacion Zod. |
| `docs/informes/INFORME_CALIDAD_COMMERCITY_2026-09-06.md`, anexo 6.1 | Primera matriz RF por modulo. Se corrige y amplia. |

Metodo: se leyo cada router, se conto cada operacion y se asigno el RF por comportamiento
observado en el controlador, no por el comentario del archivo. Cuando el RF no describe
exactamente el endpoint se marca **parcial**. Cuando no hay RF aplicable se marca **N/A** o
**RF por confirmar**.

### Leyenda de evidencia

| Codigo | Significado |
|---|---|
| `SU` | Existe suite unitaria del modulo en `backend/src/server/__tests__/`. |
| `INT` | Existe prueba de integracion contra MySQL real, ejecutada y registrada. |
| `E2E` | Cubierto por el runner HTTP de `docs/AVANCES/PRUEBAS/ejecutar_pruebas.mjs`. La corrida esta pendiente. |
| `-` | Sin prueba automatizada directa. |

La evidencia `SU` acredita que el modulo se ejecuta en pruebas con dependencias simuladas.
No acredita el comportamiento contra una base de datos real. Esa distincion se mantiene en
toda la sustentacion.

## 3. Resumen

| Indicador | Valor |
|---|---|
| Operaciones HTTP | 76 (3 nuevas en 1.4.0: RF51 y RF55) |
| Routers montados | 13 |
| RF del documento oficial | 141 |
| RF con al menos un endpoint identificado | 117 (3 de ellos parciales: RF40, RF84, RF118) |
| RF sin endpoint (interfaz, BD, regla o brecha) | 24 |
| RF con evidencia de integracion real | 4 (RF100, RF101, RF102, RF104, via BE-12) |
| RF con corrida E2E HTTP registrada | 0 al corte |

Las 76 operaciones vigentes se reparten asi: Admin 16, Usuarios 14, Productos 10, Tienda 8,
Notificaciones 6, Seguidores 5, Carrito 4, Chat 4, Pedidos 3, Historial 2,
Reportes 1, Calificaciones 2, Base 1.

## 4. Matriz por modulo

### 4.1 Base (1 operacion)

Evidencia del modulo: `app.health.test.js`, `app.cors.test.js`, `app.rate-limit.test.js` (SU).

> El `GET /` diagnostico se retiro en 1.3.7 (duplicaba `GET /api/usuarios/`); la fila 1 se
> conserva como registro historico y la numeracion 2-74 no se reescribe.

| # | Metodo y ruta | RF | Auth | Evidencia |
|---|---|---|---|---|
| 1 | ~~`GET /`~~ (retirado 2026-11-04) | N/A (diagnostico) | Publico | SU |
| 74 | `GET /health` | RNF13 (disponibilidad) | Publico | SU |

Observacion: `GET /` devuelve el estado del servidor (mensaje, estado, marca de tiempo y
version). No lista usuarios, aunque el controlador se llame `getUsuarios`.

### 4.2 Usuarios (14 operaciones) - `/api/usuarios`

Evidencia del modulo: `usuarios.controllers.test.js`, `auth.middleware.test.js`,
`role.middleware.test.js`, `role.cache.test.js`, `schemas.contracts.test.js` (SU).

| # | Metodo y ruta | RF | Auth | Evidencia |
|---|---|---|---|---|
| 2 | `GET /api/usuarios/` | N/A (diagnostico) | Publico | SU |
| 3 | `GET /api/usuarios/perfil-publico/:id` | RF110, RF11, RF12 | Publico | SU |
| 4 | `GET /api/usuarios/directorio` | RF105 (parcial: destinatarios del chat) | JWT | SU |
| 5 | `DELETE /api/usuarios/cuenta` | RF42, RF56 | JWT | SU |
| 6 | `POST /api/usuarios/register` | RF1, RF6, RF7, RF8 | Publico | SU |
| 7 | `POST /api/usuarios/login` | RF2, RNF1, RNF10 | Publico | SU |
| 8 | `POST /api/usuarios/recover` | RF3 | Publico | SU |
| 9 | `POST /api/usuarios/reset-password` | RF4 | Publico (token) | SU |
| 10 | `POST /api/usuarios/logout` | RF2, RF41 | JWT | SU |
| 11 | `POST /api/usuarios/logout-todas` | RF2 (derivado; **RF por confirmar**) | JWT | SU |
| 12 | `GET /api/usuarios/me` | RF11, RF37 | JWT | SU |
| 13 | `PATCH /api/usuarios/me` | RF14, RF15, RF16, RF17, RF38, RF39 | JWT + multipart opcional | SU |
| 14 | `PATCH /api/usuarios/me/rol` | RF43 | JWT | SU |
| 15 | `GET /api/usuarios/admin` | RF13 | JWT + administrador | SU |

Brechas del modulo: cerradas en 1.4.0.

- **RF6** (casilla de aceptacion de terminos): cubierto. `POST /register` exige
  `acepta_terminos: true` y guarda `usuarios.terminos_aceptados_en` (migracion 019).
- **RF14 a RF17 y RF39** (foto, descripcion y direccion de perfil): cubiertos.
  `PATCH /me` acepta `descripcion_personal`, `direccion_envio` y el avatar multipart;
  la baja del avatar anterior limpia el archivo huerfano.

### 4.3 Productos y catalogo (10 operaciones) - `/api`

Evidencia del modulo: `productos.controllers.test.js`, `productos.vendedor.test.js` (SU).

| # | Metodo y ruta | RF | Auth | Evidencia |
|---|---|---|---|---|
| 16 | `GET /api/productos` | RF91, RF92, RF93, RF96, RF97 | Publico | SU |
| 17 | `GET /api/categorias` | RF93 | Publico | SU |
| 18 | `GET /api/vendedores` | RF90, RF54 | Publico | SU |
| 19 | `GET /api/productos/mis-productos` | RF55 | JWT + vendedor | SU |
| 20 | `GET /api/productos/:id/validar-stock` | RF83, RF88 | Publico | SU |
| 21 | `GET /api/productos/:id` | RF81, RF82, RF98 | Publico | SU |
| 22 | `POST /api/productos` | RF46, RF47, RF48, RF49 | JWT + vendedor (multipart) | SU |
| 23 | `PUT /api/productos/:id` | RF50 | JWT + vendedor (multipart) | SU |
| 75 | `PATCH /api/productos/:id/estado` | RF55 | JWT + vendedor | SU |
| 76 | `DELETE /api/productos/:id` | RF55 | JWT + vendedor | SU |

Observacion: `productos.estado` es columna generada a partir del stock. El backend la lee y
nunca la escribe, lo que sostiene RF88 sin una actualizacion manual.

### 4.4 Pedidos y pago (3 operaciones) - `/api/pedidos`

Evidencia del modulo: `pedidos.controllers.test.js` (SU), `dinero.integration.test.js` (INT,
5/5 en MySQL local segun CHANGELOG).

| # | Metodo y ruta | RF | Auth | Evidencia |
|---|---|---|---|---|
| 24 | `GET /api/pedidos/resumen` | RF112, RF117, RF118; RF40 **parcial** | JWT | SU + INT |
| 25 | `POST /api/pedidos/confirmar-pago` | RF116, RF117, RF119, RF120, RF121, RF123, RF124, RF140 | JWT | SU + INT |
| 26 | `PATCH /api/pedidos/:id/estado` | RF29, RF127, RF35, RF89 | JWT (vendedor, administrador o comprador propietario) | SU |

Notas de defensa:

- El precio no viaja desde el cliente: se relee de `productos` dentro de la transaccion.
- El IVA se calcula en vuelo (RF121) y **no** se almacena; solo se guarda `subtotal`
  (RF140). El documento oficial se contradice entre RF121 ("sin almacenarlos") y RF140
  ("el backend solo almacenara el subtotal"). Prevalece RF140, decision cerrada.
- El pago es simulado (RF119); no hay pasarela real.

### 4.5 Tienda del vendedor (8 operaciones) - `/api/tienda`

Evidencia del modulo: `tienda.controllers.test.js`, `cuentaBancaria.utils.test.js` (SU).

| # | Metodo y ruta | RF | Auth | Evidencia |
|---|---|---|---|---|
| 27 | `GET /api/tienda/mi-cuenta-bancaria` | RF131, RF138 | JWT + vendedor | SU |
| 28 | `GET /api/tienda/mi-cuenta-bancaria/masked` | RF138 | JWT + vendedor | SU |
| 29 | `POST /api/tienda/mi-cuenta-bancaria` | RF131, RF132 | JWT + vendedor | SU |
| 30 | `PUT /api/tienda/mi-cuenta-bancaria` | RF133 | JWT + vendedor | SU |
| 31 | `GET /api/tienda/ventas` | RF135, RF126, RF128 | JWT + vendedor | SU |
| 32 | `GET /api/tienda/ingresos` | RF136, RF139, RF140 | JWT + vendedor | SU |
| 33 | `GET /api/tienda/dashboard/stats` | RF134, RF137 | JWT + vendedor | SU |
| 34 | `GET /api/tienda/validacion` | RF130, RF137, RF140 | JWT + vendedor | SU |

Observacion: la cuenta bancaria se devuelve enmascarada por defecto; la version completa
exige rol y queda cifrada en reposo (RF138, RNF12).

### 4.6 Administracion (16 operaciones) - `/api/admin`

Evidencia del modulo: `admin.controllers.test.js`, `admin.cuentaBancaria.test.js` (SU).
Todas las rutas del router exigen `authRequired` y `requireRoles(["administrador"])`.

| # | Metodo y ruta | RF | Auth | Evidencia |
|---|---|---|---|---|
| 35 | `GET /api/admin/stats` | RF57, RF58, RF60, RF61, RF62 | admin | SU |
| 36 | `GET /api/admin/usuarios` | RF70, RF73 | admin | SU |
| 37 | `PATCH /api/admin/usuarios/:id/estado` | RF76, RF77 | admin | SU |
| 38 | `DELETE /api/admin/usuarios/:id` | RF76 (borrado logico) | admin | SU |
| 39 | `GET /api/admin/productos` | RF71, RF74 | admin | SU |
| 40 | `DELETE /api/admin/productos/:id` | RF75 (suspension logica) | admin | SU |
| 41 | `PATCH /api/admin/productos/:id/restaurar` | RF75 | admin | SU |
| 42 | `GET /api/admin/reportes` | RF63, RF64, RF65, RF67 | admin | SU |
| 43 | `GET /api/admin/reportes/:id` | RF66, RF68 | admin | SU |
| 44 | `DELETE /api/admin/reportes/:id` | RF63 (**RF por confirmar**) | admin | SU |
| 45 | `PATCH /api/admin/reportes/:id/resolver` | RF69 | admin | SU |
| 46 | `GET /api/admin/busqueda` | RF72, RF73, RF74 | admin | SU |
| 47 | `GET /api/admin/mi-cuenta-bancaria` | RF79 | admin | SU |
| 48 | `GET /api/admin/mi-cuenta-bancaria/masked` | RF79, RF138 | admin | SU |
| 49 | `POST /api/admin/mi-cuenta-bancaria` | RF79 | admin | SU |
| 50 | `PUT /api/admin/mi-cuenta-bancaria` | RF79 | admin | SU |

### 4.7 Reportes (1 operacion) - `/api/reportes`

Evidencia del modulo: `reportes.controllers.test.js` (SU).

| # | Metodo y ruta | RF | Auth | Evidencia |
|---|---|---|---|---|
| 51 | `POST /api/reportes/` | RF85, RF86, RF108, RF109 | JWT (multipart opcional) | SU |

Observacion: `tipo` distingue reporte de producto y de usuario; la evidencia es una imagen
opcional validada por firma real y MIME.

### 4.8 Calificaciones (2 operaciones) - `/api/calificaciones`

Evidencia del modulo: `calificaciones.controllers.test.js` (SU).

| # | Metodo y ruta | RF | Auth | Evidencia |
|---|---|---|---|---|
| 52 | `POST /api/calificaciones/vendedor` | RF87, RF107, RF51 | JWT (comprador con compra) | SU |
| 77 | `GET /api/calificaciones/vendedor/:id` | RF51 | Publico | SU |

Observacion: una calificacion por vendedor y pedido, validada por indice unico (migracion 018).

### 4.9 Chat interno (4 operaciones) - `/api/chat`

Evidencia del modulo: `chat.controllers.test.js` (SU).

| # | Metodo y ruta | RF | Auth | Evidencia |
|---|---|---|---|---|
| 53 | `POST /api/chat/` | RF105 (texto) | JWT | SU |
| 54 | `GET /api/chat/conversaciones` | RF105 | JWT | SU |
| 55 | `GET /api/chat/mensajes/:usuarioId` | RF105 | JWT | SU |
| 56 | `PATCH /api/chat/mensajes/:id/leido` | RF105 | JWT | SU |

Observacion: el chat solo acepta JSON. RF105 menciona fotos y archivos; el contrato actual
rechaza multipart con 400. Es una restriccion deliberada de alcance, no un defecto oculto.

### 4.10 Notificaciones (6 operaciones) - `/api/notificaciones`

Evidencia del modulo: `notificaciones.controllers.test.js` (SU) y
`integration/notificaciones.integration.test.js` (INT, 10/10 en MySQL local, BE-12).

| # | Metodo y ruta | RF | Auth | Evidencia |
|---|---|---|---|---|
| 57 | `GET /api/notificaciones/` | RF100, RF101 | JWT | SU + INT |
| 58 | `GET /api/notificaciones/no-leidas` | RF104 | JWT | SU + INT |
| 59 | `PATCH /api/notificaciones/leidas` | RF102 | JWT | SU + INT |
| 60 | `PATCH /api/notificaciones/:id/leida` | RF102 | JWT | SU + INT |
| 61 | `DELETE /api/notificaciones/` | RF102 | JWT | SU + INT |
| 62 | `DELETE /api/notificaciones/:id` | RF102 | JWT | SU + INT |

Este es el unico modulo con integracion real ejecutada y registrada al corte.

### 4.11 Seguidores (5 operaciones) - `/api/seguidores`

Evidencia del modulo: `seguidores.controllers.test.js` (SU).

| # | Metodo y ruta | RF | Auth | Evidencia |
|---|---|---|---|---|
| 63 | `GET /api/seguidores/siguiendo` | RF19, RF21 | JWT | SU |
| 64 | `GET /api/seguidores/seguidores` | RF18, RF20 | JWT | SU |
| 65 | `POST /api/seguidores/` | RF106 | JWT | SU |
| 66 | `DELETE /api/seguidores/:id` | RF106 | JWT | SU |
| 67 | `GET /api/seguidores/:id/contadores` | RF18, RF19, RF106 | Publico | SU |

### 4.12 Carrito (4 operaciones) - `/api/carrito`

Evidencia del modulo: `carrito.controllers.test.js` (SU).

| # | Metodo y ruta | RF | Auth | Evidencia |
|---|---|---|---|---|
| 68 | `POST /api/carrito/` | RF111, RF83, RF84 | JWT | SU |
| 69 | `DELETE /api/carrito/:productoId` | RF114 | JWT | SU |
| 70 | `PATCH /api/carrito/:productoId` | RF115 | JWT | SU |
| 71 | `GET /api/carrito/` | RF112, RF117, RF118 | JWT | SU |

Observacion: el carrito agrupa por vendedor y calcula el resumen en el servidor; el comprador
sale del token, nunca del cuerpo (H1).

### 4.13 Historial de compras (2 operaciones) - `/api/historial`

Evidencia del modulo: `historial.controllers.test.js`, `reembolsos.utils.test.js` (SU).

| # | Metodo y ruta | RF | Auth | Evidencia |
|---|---|---|---|---|
| 72 | `GET /api/historial/compras` | RF26, RF27, RF28, RF30, RF31, RF32 | JWT | SU |
| 73 | `POST /api/historial/compras/:id/cancelar` | RF35, RF36, RF89, RF129, RF137 | JWT | SU |

Observacion: la cancelacion solo procede en estado `Pendiente`, restituye stock y calcula el
reembolso sobre lo pagado. El historial financiero no se borra: cambia de estado.

## 5. RF sin endpoint

De los 141 RF, 24 no tienen una operacion HTTP propia. Se clasifican asi para que la
sustentacion no los presente como pendientes por igual.

| Clase | RF | Explicacion |
|---|---|---|
| Interfaz (el backend solo entrega datos) | 5, 22, 23, 24, 25, 33, 34, 52, 53, 78, 80, 94, 95, 99, 103, 125 | Se resuelven en el cliente; el backend expone los datos o el cierre de sesion correspondiente. |
| Regla de rol o de negocio | 9, 10, 44, 45 | Se aplican con RBAC y con la herencia de funcionalidades del vendedor; no requieren ruta. |
| Efecto dentro de otra operacion | 59 | La devolucion se descuenta en las estadisticas del administrador al cancelar un pedido. |
| Base de datos o evento | 113, 141 | Limpieza programada de carritos inactivos y moneda COP; no requieren ruta. |
| **Desviacion deliberada** | 122 | El contrato no acepta el numero completo de tarjeta (solo ultimos 4, marca y titular). Decision de seguridad M-28. |

Ademas, tres RF estan cubiertos solo de forma parcial y asi se marcan en la matriz:
RF40 (la direccion se pide en el checkout, no en ajustes), RF84 (agregar al carrito comparte
el endpoint de RF111) y RF118 (el resumen se calcula en `GET /pedidos/resumen`).

## 6. Discrepancias detectadas en los comentarios del codigo

Los routers citan numeros de RF que **no coinciden** con el documento del 2026-08-20. No
afectan el funcionamiento, pero son un riesgo en sustentacion: un jurado que cruce el
comentario con el documento encontrara la inconsistencia.

| Archivo y linea | Cita actual | RF correcto segun documento |
|---|---|---|
| `admin.routes.js:34` | "Estadisticas (RF55-RF59)" | RF57 a RF62 |
| `admin.routes.js:37` | "Usuarios (RF67, RF73, RF74)" | RF70, RF73, RF76 |
| `admin.routes.js:42` | "Productos (RF68, RF72)" | RF71, RF74, RF75 |
| `admin.routes.js:47` | "Reportes (RF60-RF66)" | RF63 a RF69 |
| `admin.routes.js:53` | "Buscador (RF69-RF71)" | RF72 a RF74 |
| `admin.routes.js:56` | "Cuenta bancaria (RF75/RF76)" | RF79 |
| `productos.routes.js:18` | "Panel Principal (RF87-RF94)" | RF91 a RF98 |
| `productos.routes.js:34` | "Detalle (RF78/RF79) y stock (RF86)" | RF81, RF82 y RF83, RF88 |
| `pedidos.routes.js:14` | "Checkout ACID (RF134)" | RF116 a RF124 y RF140 |
| `pedidos.routes.js:18` | "Vendedor/Admin (RF122/RF124)" | RF127 |
| `pedidos.routes.js:19` | "Comprador (RF35)" | correcto |
| `tienda.routes.js:25` | "Ventas e ingresos (RF119-RF123)" | RF135 a RF139 |
| `historial.routes.js:10` | "RF135: cancelar un pedido" | RF35, RF89 |
| `chat.routes.js:14` | "Chat (RF101)" | RF105 |
| `reportes.routes.js:8` | "RF62/RF63, RF79, RF101" | RF63 a RF69, RF85, RF86, RF108, RF109 |
| `calificaciones.routes.js:8` | "RF107 del documento 20/08" | correcto |

Recomendacion: corregir los comentarios en un cambio aparte, sin tocar comportamiento y con
la suite en verde. No se hace antes de la sustentacion para no introducir riesgo.

> **Actualizacion 2026-11-04 (version 1.3.7):** las 16 discrepancias de la tabla se
> corrigieron en los routers durante el Lote 2 de la auditoria. La tabla queda como registro
> de lo detectado y corregido.

## 7. Como usarlo en la sustentacion

1. Abrir esta matriz y decir: "cada RF tiene su endpoint; estos 112 lo tienen y estos 29 no
   lo necesitan o son brecha declarada".
2. Si preguntan por un RF puntual, buscar el numero y mostrar la fila.
3. Si preguntan por cobertura: "trazabilidad documentada, no certificacion". La evidencia de
   integracion real existe solo para notificaciones (10/10) y dinero (5/5).
4. No afirmar que los 74 endpoints estan probados de punta a punta: la corrida E2E HTTP esta
   pendiente y se presenta como tal.

---

**Nota de alcance:** este documento no reemplaza el SRS ni el informe de calidad. Es un anexo
de trazabilidad elaborado sobre el codigo montado al 2026-10-30, sin cambios de codigo.
