# Inventario de Endpoints — API REST CommerCity

Fecha: 2026-08-28
Autor: Daniel Palacios (líder backend)
Versión: 1.0 (para el grupo API REST)

## Convenciones generales

- **Base URL**: `http://localhost:3000` (desarrollo; puerto real del backend, ver `backend/src/server/server.js`). Producción según despliegue.
- **Prefijo**: todos los endpoints bajo `/api`.
- **Autenticación**: `Authorization: Bearer <token>` (JWT). `401` sin token, `403` rol insuficiente.
- **Respuesta estándar**:
  - Éxito: `{ "success": true, "data": ... }`
  - Error: `{ "success": false, "error": { "code": "UNAUTHORIZED|FORBIDDEN|NOT_FOUND|VALIDATION_ERROR|INTERNAL_ERROR", "message": "..." } }`
- **Subida de archivos**: campos multipart `archivo` (chat), `imagen` (productos) y `evidencia` (reportes). Archivos servidos desde `/uploads`.
- **Moneda**: COP (`DECIMAL(10,2)`). El precio publicado incluye IVA 19%: `subtotal = precio / 1.19`; comisiones 90/10 sobre el subtotal.
- **Paginación**: coexisten dos contratos según el módulo (catálogo vs Mi Tienda), ver sección 13.

## 0. Health check (raíz)

| Método | Ruta | Acceso | Recibe | Devuelve |
|---|---|---|---|---|
| GET | `/` | Público | - | `{ success, data }` listado básico (sirve de health check del API) |

## 1. Autenticación y usuarios — `/api/usuarios`

| Método | Ruta | Acceso | Recibe | Devuelve |
|---|---|---|---|---|
| GET | `/` | Público | - | `{ success, data }` listado básico |
| POST | `/register` | Público | `{ nombre_completo, email, password }` | `201 { success, data: { usuario, token } }` (rol NO se envía; se asigna "comprador" por defecto) |
| POST | `/login` | Público | `{ email, password }` | `200 { success, data: { token, usuario } }` |
| POST | `/recover` | Público | `{ email }` | `200 { success }` (link expira 5 min, RF4) |
| POST | `/reset-password` | Público | `{ token, nueva_password }` | `200 { success }` |
| POST | `/logout` | JWT | - | `200 { success }` (revoca token) |
| GET | `/me` | JWT | - | `{ success, data: perfil }` |
| PATCH | `/me/rol` | JWT | `{ rol: "comprador"\|"vendedor" }` | `200 { success, data }` |
| GET | `/perfil-publico/:id` | Público | param `id` | `{ success, data }` perfil sin email (RF110) |
| DELETE | `/cuenta` | JWT | - | `200 { success }` (borrado lógico RF40) |
| GET | `/admin` | Admin | - | `{ success, data }` datos admin |

## 2. Carrito — `/api/carrito`

| Método | Ruta | Acceso | Recibe | Devuelve |
|---|---|---|---|---|
| POST | `/` | JWT | `{ producto_id, cantidad }` | `201 { success, data }` |
| GET | `/` | JWT | - | `{ success, data }` agrupado por vendedor con resumen (IVA/90-10 en vuelo) |
| PATCH | `/:productoId` | JWT | `{ cantidad }` | `200 { success, data }` |
| DELETE | `/:productoId` | JWT | - | `200 { success }` |

## 3. Pedidos y pago — `/api/pedidos`

| Método | Ruta | Acceso | Recibe | Devuelve |
|---|---|---|---|---|
| GET | `/resumen` | JWT | - | `{ success, data }` resumen carrito con desglose |
| POST | `/confirmar-pago` | JWT | `{ direccion_envio, metodo_pago, numero_tarjeta?, nombre_tarjeta? }` | `201 { success, data }` (transacción ACID: pedido+stock+pago) |
| PATCH | `/:id/estado` | Vendedor/Admin | `{ estado: "En camino"\|"Entregado" }` | `200 { success, data }` avance de estado por línea |

## 4. Historial de compras — `/api/historial`

| Método | Ruta | Acceso | Recibe | Devuelve |
|---|---|---|---|---|
| GET | `/compras` | JWT | query `?estado=` | `{ success, data }` historial agrupado con IVA 19% (RF26-RF32) |
| POST | `/compras/:id/cancelar` | JWT | - | `200 { success, data }` cancela línea Pendiente, restituye stock y reembolsa (RF35) |

## 5. Catálogo / Panel Principal — `/api/productos`

| Método | Ruta | Acceso | Recibe | Devuelve |
|---|---|---|---|---|
| GET | `/productos` | Público | query `?q=&categoria=&vendedor=&pagina=&limite=` | `{ success, data }` paginado (RF87-RF94) |
| GET | `/categorias` | Público | - | `{ success, data }` |
| GET | `/vendedores` | Público | - | `{ success, data }` |
| GET | `/productos/mis-productos` | Vendedor | - | `{ success, data }` (RF45-RF49) |
| GET | `/productos/:id` | Público | param `id` | `{ success, data }` detalle (RF78/RF79) |
| GET | `/productos/:id/validar-stock` | Público | param `id` + query `?cantidad=` | `{ success, data }` (RF86) |
| POST | `/productos` | Vendedor | multipart: campos + `imagen` | `201 { success, data }` (RF44) |
| PUT | `/productos/:id` | Vendedor | multipart: campos + `imagen` | `200 { success, data }` |

## 6. Mi Tienda — `/api/tienda`

| Método | Ruta | Acceso | Recibe | Devuelve |
|---|---|---|---|---|
| GET | `/mi-cuenta-bancaria` | Vendedor | - | `{ success, data }` cuenta completa (RNF11 cifrado) |
| GET | `/mi-cuenta-bancaria/masked` | Vendedor | - | `{ success, data }` cuenta enmascarada (RF122) |
| POST/PUT | `/mi-cuenta-bancaria` | Vendedor | `{ titular_nombre, banco, tipo_cuenta, numero_cuenta }` | `201/200 { success, data }` upsert transaccional |
| GET | `/ventas` | Vendedor | query `?estado=&fecha_desde=&fecha_hasta=&q=&pagina=` | `{ success, data }` historial ventas + resumen 90/10 (RF129 oculta canceladas) |
| GET | `/ingresos` | Vendedor | query `?fecha_desde=&fecha_hasta=&agrupar_por=` | `{ success, data }` ingresos 90% + consistencia |
| GET | `/dashboard/stats` | Vendedor | - | `{ success, data }` tarjetas, por estado, 6 meses |
| GET | `/validacion` | Vendedor | - | `{ success, data }` validación RF130-RF139 (cuenta, 90/10, devoluciones) |

## 7. Chat — `/api/chat`

| Método | Ruta | Acceso | Recibe | Devuelve |
|---|---|---|---|---|
| POST | `/` | JWT | multipart: `receptor_id`, `mensaje`, `archivo?` | `201 { success, data: { id } }` (RF105) |
| GET | `/conversaciones` | JWT | - | `{ success, data }` lista con último mensaje y no leídos |
| GET | `/mensajes/:usuarioId` | JWT | param `usuarioId` | `{ success, data }` historial con el usuario |
| PATCH | `/mensajes/:id/leido` | JWT | param `id` | `200 { success, data }` |

## 8. Notificaciones — `/api/notificaciones`

| Método | Ruta | Acceso | Recibe | Devuelve |
|---|---|---|---|---|
| GET | `/` | JWT | query `?tipo=&limite=` | `{ success, data }` listado (RF100/RF101) |
| GET | `/no-leidas` | JWT | - | `{ success, data }` contador (RF104) |
| PATCH | `/leidas` | JWT | - | `200 { success, data }` |
| PATCH | `/:id/leida` | JWT | param `id` | `200 { success, data }` |
| DELETE | `/` | JWT | - | `200 { success }` limpiar todas (RF102) |
| DELETE | `/:id` | JWT | param `id` | `200 { success }` (RF102) |

## 9. Calificaciones — `/api/calificaciones`

| Método | Ruta | Acceso | Recibe | Devuelve |
|---|---|---|---|---|
| POST | `/vendedor` | JWT | `{ pedido_id, vendedor_id, estrellas: 1-5 }` | `201 { success, data }` (RF107) |

## 10. Seguidores — `/api/seguidores`

| Método | Ruta | Acceso | Recibe | Devuelve |
|---|---|---|---|---|
| POST | `/` | JWT | `{ usuario_id }` | `201 { success, data }` (RF106) |
| DELETE | `/:id` | JWT | param `id` | `200 { success }` |
| GET | `/siguiendo` | JWT | - | `{ success, data }` |
| GET | `/seguidores` | JWT | - | `{ success, data }` |

## 11. Reportes — `/api/reportes`

| Método | Ruta | Acceso | Recibe | Devuelve |
|---|---|---|---|---|
| POST | `/` | JWT | multipart: `tipo_reporte`, `producto_id?`, `usuario_reportado_id?`, `motivo`, `evidencia?` | `201 { success, data }` (RF62/RF63/RF79/RF101) |

## 12. Panel Admin — `/api/admin` (todas exigen rol administrador)

| Método | Ruta | Recibe | Devuelve |
|---|---|---|---|
| GET | `/stats` | - | `{ success, data }` estadísticas (RF55-RF59) |
| GET | `/usuarios` | - | `{ success, data }` |
| PATCH | `/usuarios/:id/estado` | `{ estado }` | `200 { success, data }` |
| DELETE | `/usuarios/:id` | - | `200 { success }` |
| GET | `/productos` | - | `{ success, data }` |
| DELETE | `/productos/:id` | - | `200 { success }` (soft) |
| PATCH | `/productos/:id/restaurar` | - | `200 { success, data }` |
| GET | `/reportes` | query `?q=&estado=` | `{ success, data }` (RF63-RF69) |
| GET | `/reportes/:id` | - | `{ success, data }` |
| DELETE | `/reportes/:id` | - | `200 { success }` (archivado) |
| PATCH | `/reportes/:id/resolver` | `{ respuesta }` | `200 { success, data }` |
| GET | `/busqueda` | query `?q=` | `{ success, data }` |
| GET/POST/PUT | `/mi-cuenta-bancaria` | igual que tienda | cuenta de CommerCity (RF75/RF76) |

## 13. Contrato de paginación

Existen dos contratos distintos según el módulo (implementados en `productos.controllers.js` y `tienda.controllers.js`):

- **Catálogo de productos** — `GET /api/productos/productos`: query `?page=` y `?limit=` (default `limit=4`, máx 100). Respuesta:
  `{ success, data: { pagina, limite, totalProductos, totalPaginas, hayPaginaAnterior, hayPaginaSiguiente, productos } }`.
- **Mi Tienda** — `GET /api/tienda/ventas` y `GET /api/tienda/ingresos`: query `?pagina=` (alias `page`) y `?por_pagina=` (alias `limit`), default `10`, máx 100. Respuesta:
  `{ success, data: { ..., total_registros, total_paginas, pagina_actual, registros_por_pagina } }`.
- **Notificaciones** — `GET /api/notificaciones`: solo `?limite=` (default 50, máx 100); sin paginación por páginas.

## Resumen

- **Módulos**: 14 (health check, usuarios, carrito, pedidos, historial, productos, tienda, chat, notificaciones, calificaciones, seguidores, reportes, admin + router base).
- **Total endpoints**: 69.
- **Verificación**: suite completa 307/307 tests (20 archivos), cobertura Lines 93,68%.
- **Rama oficial**: COMMERCITY, rama `backend` (commit `eaf9c91`).
