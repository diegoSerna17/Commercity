# Informe Completo: Requerimientos, Base de Datos y Backend CommerCity

| Campo | Detalle |
|---|---|
| Autor | Daniel Palacios |
| Fecha | 2026-08-05 |
| Versión documento requerimientos | 2.0 (12/05/2026) - "Commercity 2.0 (optimizado)" |
| Alcance | Cruzamiento de 125 RF + 20 RNF con el esquema `schema_commercity.sql` (17 tablas) y el backend implementado |
| Referencias | `informes/Commercity 2.0 (optimizado)/`, `schema_commercity.sql`, `backend/src/server/` |

---

## 1. Resumen ejecutivo

- El documento define **125 requerimientos funcionales y 20 no funcionales** distribuidos en 11 módulos, cada uno asignado a un integrante del equipo (entrega martes 11 de agosto).
- La base de datos (`schema_commercity.sql`) tiene **17 tablas** que cubren la mayoría de los módulos, con decisiones de diseño válidas (columna generada `productos.estado`, columnas generadas 90/10 en `detalle_pedidos`, `UNIQUE KEY uq_comprador_producto` para upsert del carrito).
- El backend solo tiene implementado **el módulo carrito (incompatible con el esquema real)** y un placeholder de usuarios. El resto de módulos (11 de 12) está pendiente.
- Se detectaron **4 brechas de modelado en BD** que afectan módulos asignados y **1 incompatibilidad crítica** ya documentada en `INFORME_CRITICO_INCOMPATIBILIDAD_CARRITO_2026-08-05.md`.

## 2. Estado actual del backend (`backend/src/server/`)

| Módulo | Archivo | Estado | Observaciones |
|---|---|---|---|
| Entrada | [server.js](file:///c:/Users/dpalaciosr/OneDrive%20-%20Ufinet%20Latam/Escritorio/COMMER%20CITY/backend/src/server/server.js) | Implementado | Puerto 3000, CORS abierto, sin helmet/rate-limit |
| Router base | [routes.js](file:///c:/Users/dpalaciosr/OneDrive%20-%20Ufinet%20Latam/Escritorio/COMMER%20CITY/backend/src/server/routes/routes.js) | Implementado | Solo GET / |
| Usuarios | [usuarios.controllers.js](file:///c:/Users/dpalaciosr/OneDrive%20-%20Ufinet%20Latam/Escritorio/COMMER%20CITY/backend/src/server/controllers/usuarios.controllers.js) | Placeholder | Devuelve texto plano "servidor creado" |
| Carrito | [carrito.controllers.js](file:///c:/Users/dpalaciosr/OneDrive%20-%20Ufinet%20Latam/Escritorio/COMMER%20CITY/backend/src/server/controllers/carrito.controllers.js) + [carrito.routes.js](file:///c:/Users/dpalaciosr/OneDrive%20-%20Ufinet%20Latam/Escritorio/COMMER%20CITY/backend/src/server/routes/carrito.routes.js) | Implementado | **Incompatible con el esquema real** (ver informe crítico) |
| BD | [db.js](file:///c:/Users/dpalaciosr/OneDrive%20-%20Ufinet%20Latam/Escritorio/COMMER%20CITY/backend/src/server/config/db.js) | Implementado | Pool MySQL parametrizado, listo |

**Módulos pendientes (11):** autenticación, perfil público, historial compras, pedidos y pago, perfil vendedor, panel principal, reportes, panel administrativo, catálogo, tienda, chat/notificaciones.

## 3. Inventario de la base de datos (17 tablas)

| Módulo BD | Tablas | Módulos de requerimientos que atiende |
|---|---|---|
| 1. Usuarios y roles | `roles`, `usuarios`, `usuario_roles`, `seguidores` | Autenticación, Perfil público, Panel Admin |
| 2. Finanzas y cuentas | `datos_bancarios` | Tienda (Erick), Panel Admin (RF72) |
| 3. Catálogo y productos | `categorias`, `etiquetas`, `productos`, `producto_etiquetas` | Perfil Vendedor, Panel Principal, Catálogo |
| 4. Compras y pagos | `carrito_items`, `pedidos`, `pagos_simulados`, `detalle_pedidos` | Carrito, Pedidos y Pago, Historial compras |
| 5. Reputación | `calificaciones_vendedores`, `calificaciones_productos` | Perfil público, Catálogo |
| 6. Comunicación y moderación | `mensajes_chat`, `notificaciones`, `reportes` | Chat, Reportes, Notificaciones |

## 4. Matriz Requerimientos ↔ Base de Datos ↔ Backend por módulo

### 4.1 Autenticacion - Diego Serna

| Requerimientos | Tablas BD | Endpoints requeridos | Estado |
|---|---|---|---|
| RF1-RF10, RF38, RF40; RNF8-RNF10 | `usuarios` (con `token_recuperacion`), `roles`, `usuario_roles` | POST `/api/auth/registro`, POST `/api/auth/login`, POST `/api/auth/logout`, POST `/api/auth/recuperar`, POST `/api/auth/reset-password`; middleware JWT + RBAC | No implementado |
| **Cobertura BD**: completa. `usuarios.password VARCHAR(255)` apta para bcryptjs; `usuarios.activo` para baneo; `usuario_roles` para RBAC. | | | |
| **Nota**: envío de correo de recuperación requiere servicio SMTP (sin definir). El rol por defecto "comprador" (RF8) debe insertarse en `usuario_roles` en el registro. | | | |

### 4.2 Perfil publico - Cristian Rosero

| Requerimientos | Tablas BD | Endpoints requeridos | Estado |
|---|---|---|---|
| RF102, RF18-RF21, RF47 | `usuarios`, `seguidores`, `calificaciones_vendedores` (agregado), `productos` | GET `/api/usuarios/:id/publico` (perfil + seguidores/seguidos + calificaciones + productos publicados) | No implementado |
| **Cobertura BD**: completa. | | | |

### 4.3 Historial de compras del comprador - Jary

| Requerimientos | Tablas BD | Endpoints requeridos | Estado |
|---|---|---|---|
| RF26-RF31 (vendedor, producto, fecha, estado, cantidad, monto; filtro por estado) | `pedidos`, `detalle_pedidos`, `productos`, `usuarios` | GET `/api/usuarios/:id/compras?estado=` | No implementado |
| **Cobertura BD**: completa. `detalle_pedidos` guarda vendedor, cantidad, subtotal; `pedidos.estado_pedido` y `fecha_pedido` cubren filtro y ordenamiento. | | | |

### 4.4 Pedidos y Pago - Carlos Vidal

| Requerimientos | Tablas BD | Endpoints requeridos | Estado |
|---|---|---|---|
| RF106-RF110, RF111-RF114 (generar pedido del carrito, simular pago, estados Pendiente→En camino→Entregado, historial con filtros) | `carrito_items`, `pedidos`, `detalle_pedidos`, `pagos_simulados` | POST `/api/pedidos` (desde carrito), POST `/api/pedidos/:id/pago`, PATCH `/api/pedidos/:id/estado`, GET `/api/pedidos` (vendedor) con filtros | No implementado |
| **Cobertura BD**: completa. `detalle_pedidos.vendedor_id` permite a cada vendedor ver sus pedidos (RF111-RF112). `pagos_simulados` modela la simulación. | | | |
| **Nota**: RF109 pide datos de tarjeta (número y nombre) - el esquema no los almacena (correcto para simulación académica, no guardar tarjetas). | | | |

### 4.5 Carrito - Daniel Palacios

| Requerimientos | Tablas BD | Endpoints requeridos | Estado |
|---|---|---|---|
| RF103-RF105, RFX (modificar cantidad), agrupación por vendedor + resumen (REVISION) | `carrito_items`, `productos`, `usuarios` | POST `/api/carrito`, DELETE `/api/carrito/:productoId`, PATCH `/api/carrito/:productoId`, GET `/api/carrito` (agrupado) | **Implementado y alineado al esquema (B1 resuelto)** |
| **Correccion aplicada (2026-08-05)**: se elimino la tabla `carrito` intermedia; parametro `comprador_id`; upsert `ON DUPLICATE KEY UPDATE` con `uq_comprador_producto`; columnas `imagen_url`, `descuento_porcentaje` y `nombre_completo`; precio final calculado con descuento; transacciones con `FOR UPDATE`; redondeo monetario. Detalle en [informe critico](file:///c:/Users/dpalaciosr/OneDrive%20-%20Ufinet%20Latam/Escritorio/COMMER%20CITY/informes/INFORME_CRITICO_INCOMPATIBILIDAD_CARRITO_2026-08-05.md). | | | |
| **Pendiente**: probar el flujo completo contra MySQL real (no hay BD configurada en el entorno local). | | | |

### 4.6 Perfil Vendedor - Jose Yepes

| Requerimientos | Tablas BD | Endpoints requeridos | Estado |
|---|---|---|---|
| RF43-RF46 (crear/editar producto con formulario), RF50, RF51 (mis productos) | `productos`, `categorias`, `etiquetas`, `producto_etiquetas` | POST `/api/productos`, GET `/api/vendedores/:id/productos`, PATCH `/api/productos/:id`, DELETE `/api/productos/:id` | No implementado |
| **Cobertura BD**: completa. Formulario RF44 (nombre, descripción, imagen, stock, descuento, estado, precio, categoría, fecha) mapea a `productos` + `categorias`. El `estado` es columna generada (RF45/RF75). | | | |

### 4.7 Panel Principal - Brandon

| Requerimientos | Tablas BD | Endpoints requeridos | Estado |
|---|---|---|---|
| RF83-RF90 (feed con paginación, buscador por nombre/categoría/vendedor, filtro por categoría) | `productos`, `categorias`, `usuarios`, `producto_etiquetas` | GET `/api/productos?pagina=&busqueda=&categoria=` | No implementado |
| **Cobertura BD**: completa. **Riesgo rendimiento**: el buscador (RF84) sobre `nombre`, `categorias.nombre` y `usuarios.nombre_completo` requiere índices FULLTEXT o LIKE optimizado; hoy no existen. | | | |

### 4.8 Reportes - Mosquera Flor

| Requerimientos | Tablas BD | Endpoints requeridos | Estado |
|---|---|---|---|
| RF78-RF79, RF100-RF101 (crear reportes de producto/usuario con motivo y evidencia), RF57-RF63 (admin: listar y responder) | `reportes`, `productos`, `usuarios` | POST `/api/reportes` (producto/usuario), GET `/api/reportes` (admin), PATCH `/api/reportes/:id/respuesta` | No implementado |
| **BRECHA BD**: los RF60, RF62, RF79 y RF101 exigen **evidencias (foto)** en los reportes; la tabla `reportes` no tiene campo de evidencia (falta `evidencia_url` o tabla `reporte_evidencias`). | | | |
| **Nota**: el estado Resuelto/Pendiente (RF60/RF62) se deriva de `respondido_at` (NULL = Pendiente); funcional pero conviene documentarlo o agregar columna explícita. | | | |

### 4.9 Panel Administrativo - Juan Cabrera

| Requerimientos | Tablas BD | Endpoints requeridos | Estado |
|---|---|---|---|
| RF52-RF73 (estadísticas, reportes, gestión de usuarios/productos, buscador, baneo, ajustes con cuenta bancaria Commercity) | `usuarios`, `roles`, `usuario_roles`, `productos`, `reportes`, `pedidos`, `detalle_pedidos`, `pagos_simulados`, `datos_bancarios` | GET `/api/admin/estadisticas`, GET `/api/admin/usuarios`, GET `/api/admin/productos`, PATCH `/api/admin/usuarios/:id/estado`, DELETE `/api/admin/productos/:id`, GET/PATCH `/api/admin/reportes` | No implementado |
| **Cobertura BD**: completa. `usuarios.activo` soporta banear/activar (RF70); `productos.eliminado_por_admin` soporta eliminar (RF69); `datos_bancarios.es_commercity` soporta cuenta de Commercity (RF72); comisión 10% vía `detalle_pedidos.monto_comision` (RF53). | | | |
| **Nota**: "Suspender productos al banear vendedor" (tarea de Cabrera) no tiene campo explícito; se resuelve filtrando por `usuarios.activo = 1` en las consultas de productos, o reutilizando `eliminado_por_admin`. | | | |

### 4.10 Catalogo / Producto - Carlos Perea

| Requerimientos | Tablas BD | Endpoints requeridos | Estado |
|---|---|---|---|
| RF74-RF77, RF81-RF82 (detalle de producto, validar stock, estado automático) | `productos` (con columna generada `estado`), `categorias` | GET `/api/productos/:id` | No implementado |
| **Cobertura BD**: completa. El estado Disponible/Agotado ya es columna generada a partir de `stock` (RF75/RF81). La validación de stock al seleccionar cantidad (RF76) debe implementarse en backend (no hay CHECK en BD). | | | |

### 4.11 Tienda - Erick

| Requerimientos | Tablas BD | Endpoints requeridos | Estado |
|---|---|---|---|
| RF115-RF125 (cuenta bancaria del vendedor, distribución 90/10, historial de ventas e ingresos) | `datos_bancarios`, `pedidos`, `detalle_pedidos` | POST/PATCH `/api/tienda/cuenta-bancaria`, GET `/api/tienda/ventas`, GET `/api/tienda/ingresos` | No implementado |
| **Cobertura BD**: casi completa. `detalle_pedidos.monto_vendedor`/`monto_comision` (columnas generadas 90/10) cubren RF123-RF125. | | | |
| **BRECHA BD**: RF117 pide registrar **Banco** (nombre del banco); `datos_bancarios` solo tiene `titular_nombre`, `tipo_cuenta` y `numero_cuenta` - falta columna `banco`. | | | |

## 5. Brechas detectadas en la base de datos

| # | Severidad | Ubicacion | Brecha | Modulo afectado |
|---|---|---|---|---|
| B1 | CRITICA | Backend vs `carrito_items`/`productos`/`usuarios` | Incompatibilidad del controlador carrito (tablas/columnas inexistentes) | Carrito (Daniel) - **RESUELTA 2026-08-05** |
| B2 | ALTA | `reportes` | Falta modelar **evidencias (foto)** exigidas por RF60/RF62/RF79/RF101 | Reportes (Mosquera) |
| B3 | MEDIA | `datos_bancarios` | Falta columna **banco** exigida por RF117 | Tienda (Erick) |
| B4 | MEDIA | `notificaciones.tipo` | ENUM incompleto vs RF93: faltan `pedido`, `en camino`, `entregado`; tiene `pedido enviado` con espacio | Notificaciones |
| B5 | MEDIA | `mensajes_chat` | RF97 exige enviar fotos/archivos; solo hay `mensaje TEXT` sin campo de adjunto | Chat |
| B6 | MEDIA | `productos`/`categorias`/`usuarios` | Buscador RF84 sin indices FULLTEXT (rendimiento) | Panel Principal (Brandon) |
| B7 | BAJA | `pagos_simulados` | `estado DEFAULT 'Aprobado'` - deberia ser `Pendiente` | Pedidos y Pago (Vidal) |
| B8 | BAJA | `reportes` | Estado Resuelto/Pendiente derivado de `respondido_at`, sin columna explicita | Reportes |

## 6. Brechas transversales del backend (seguridad y arquitectura)

| # | Severidad | Hallazgo | Regla del proyecto |
|---|---|---|---|
| S1 | ALTA | No existe middleware JWT ni RBAC (RNF8-RNF9, RF7) | `api-seguridad.md` |
| S2 | ALTA | CORS abierto (`app.use(cors())`) | Requiere `cors({ origin: URL_FRONTEND })` |
| S3 | MEDIA | Sin `helmet()`, sin `express-rate-limit`, `x-powered-by` activo | `api-seguridad.md` |
| S4 | MEDIA | Middleware de error centralizado no implementado | `gestion-errores-commercity.md` |
| S5 | MEDIA | Validacion de entrada sin Zod/express-validator en los endpoints existentes (solo validacion manual del carrito) | `api-seguridad.md` |
| S6 | MEDIA | `usuarios.controllers.js` es placeholder; el registro/login no existen | Autenticacion (Diego) |

## 7. Cobertura de requerimientos

| Modulo | Responsable | RF cubiertos | Cobertura BD | Implementacion backend |
|---|---|---|---|---|
| Autenticacion | Diego Serna | RF1-RF10, RF38, RF40 | Completa | 0% |
| Perfil publico | Cristian Rosero | RF18-RF21, RF47, RF102 | Completa | 0% |
| Historial compras | Jary | RF26-RF31 | Completa | 0% |
| Pedidos y Pago | Carlos Vidal | RF106-RF114 | Completa (B7) | 0% |
| Carrito | Daniel Palacios | RF103-RF105, RFX | Completa | 100% (B1 resuelto) |
| Perfil Vendedor | Jose Yepes | RF43-RF46, RF50-RF51 | Completa | 0% |
| Panel Principal | Brandon | RF83-RF90 | Completa (B6) | 0% |
| Reportes | Mosquera Flor | RF57-RF63, RF78-RF79, RF100-RF101 | Incompleta (B2) | 0% |
| Panel Admin | Juan Cabrera | RF52-RF73 | Completa | 0% |
| Catalogo | Carlos Perea | RF74-RF77, RF81-RF82 | Completa | 0% |
| Tienda | Erick | RF115-RF125 | Incompleta (B3) | 0% |

## 8. Recomendaciones priorizadas

1. ~~**Resolver B1 (critica)**~~: **RESUELTO (2026-08-05)** - el controlador carrito fue realineado al esquema real (detalle en informe critico).
2. **Coordinar con el lider las brechas B2, B3, B4, B5**: proponer migraciones SQL versionadas en `backend/src/server/db/` (convencion `001_*.sql`) para evidencias de reportes, columna `banco`, ENUM de notificaciones y adjuntos de chat.
3. **Definir orden de implementacion por dependencias**: Autenticacion (Diego) primero, porque todos los demás módulos requieren JWT y RBAC; luego Carrito/Pedidos (Vidal depende del carrito), Perfil Vendedor (Yepes), Panel Principal (Brandon), y los módulos de consulta (Jary, Erick, Cabrera) al final.
4. **Aplicar seguridad transversal** (S1-S6) al crear cada endpoint, usando el checklist de `api-seguridad.md`.
5. **Crear seeders completos** (categorias, usuarios de prueba, productos) para que los 11 módulos puedan desarrollarse en paralelo contra datos reales.

## 9. Estado del informe

| Item | Estado |
|---|---|
| Revision de requerimientos (125 RF + 20 RNF) | Completado |
| Revision de base de datos (17 tablas) | Completado |
| Revision de backend (estado real) | Completado |
| Matriz por modulo del equipo | Completado |
| Brechas BD y backend | Documentadas (B1-B8, S1-S6) |
| Correccion del carrito (B1) | **Completado (2026-08-05)** - controlador alineado al esquema real |
