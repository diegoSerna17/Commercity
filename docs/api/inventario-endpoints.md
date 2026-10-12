# Inventario de endpoints — CommerCity API (verdad terreno)

> Fase 0 del plan de documentacion apoyada en Zod.
> Fuente: lectura directa de `backend/src/server/routes/*.js`, `backend/src/server/app.js` (montajes) y `backend/src/server/controllers/**`.
> Fecha: 2026-10-08 · Rama: `feature/docs-api-zod-openapi` · Backend: Express 5 + Zod 4.6.5.
> Total: **72 endpoints** en 13 routers.
>
> Addendum TASK-4.3 (M-8, rama `fix/aud-p1-backend`): se agrega
> `POST /api/usuarios/logout-todas` (Bearer; cierra todas las sesiones
> incrementando `token_version`). Total vigente: **73 endpoints**; aparece en
> `openapi.json`/`entidades.md` regenerados.
>
> Addendum TASK-8.4 (rama `fix/aud-p1-backend`): se agrega `GET /health`
> (publico; `SELECT 1` a la BD, 503 si no responde). Total vigente:
> **74 endpoints**.

Leyenda de estado Zod:

- `✅` centralizado en `schemas/` + `validate()` en ruta.
- `⚠️` Zod inline / ad-hoc dentro del controller (no reutilizable para OpenAPI sin refactor).
- `❌` sin contrato Zod formal (validacion manual `Number()`, `typeof`, o ninguna).

Montajes (`app.js`): `/` → router base · `/api/carrito` · `/api/usuarios` · `/api/historial` · `/api/pedidos` · `/api/tienda` · `/api/admin` · `/api/reportes` · `/api/calificaciones` · `/api/chat` · `/api/notificaciones` · `/api/seguidores` · `/api` → productos.

## 0. Base — `GET /` (1)

| # | Metodo + ruta completa | Auth / roles | Entrada | Estado Zod |
|---|---|---|---|---|
| 1 | `GET /` | publico | — | ❌ |

## 1. Usuarios — `/api/usuarios` (13)

| # | Metodo + ruta completa | Auth / roles | Entrada | Estado Zod |
|---|---|---|---|---|
| 2 | `GET /api/usuarios/` | publico (verificacion servidor) | — | ❌ |
| 3 | `GET /api/usuarios/perfil-publico/:id` | publico | params: `id` | ❌ |
| 4 | `GET /api/usuarios/directorio` | Bearer | query `q` (string trim) | ❌ |
| 5 | `DELETE /api/usuarios/cuenta` | Bearer (propietario, RF40) | — (userId del token) | ❌ |
| 6 | `POST /api/usuarios/register` | publico | body: email, password, nombre_completo? | ✅ `registerSchema` |
| 7 | `POST /api/usuarios/login` | publico (rate-limit 10/min) | body: email, password | ✅ `loginSchema` |
| 8 | `POST /api/usuarios/recover` | publico (rate-limit 10/min) | body: email | ✅ `recoverSchema` |
| 9 | `POST /api/usuarios/reset-password` | publico (token) | body: token, password | ✅ `resetSchema` |
| 10 | `POST /api/usuarios/logout` | Bearer (revoca token, RF2) | — | ❌ |
| 11 | `GET /api/usuarios/me` | Bearer | — | ❌ |
| 12 | `PATCH /api/usuarios/me` | Bearer | body: nombre_completo (trim manual) | ❌ |
| 13 | `PATCH /api/usuarios/me/rol` | Bearer | body: rol enum comprador\|vendedor | ✅ `cambiarRolSchema` |
| 14 | `GET /api/usuarios/admin` | Bearer + `administrador` | — | ❌ |

## 2. Productos / catalogo — `/api` (8)

Montado directo en `/api` (no en `/api/productos`).

| # | Metodo + ruta completa | Auth / roles | Entrada | Estado Zod |
|---|---|---|---|---|
| 15 | `GET /api/productos` | publico | query: page, limit, nombre, categoria, vendedor | ❌ (`parseInt` manual) |
| 16 | `GET /api/categorias` | publico | — | ❌ |
| 17 | `GET /api/vendedores` | publico | — | ❌ |
| 18 | `GET /api/productos/mis-productos` | Bearer + `vendedor` | — (vendedor del JWT) | ❌ |
| 19 | `GET /api/productos/:id/validar-stock` | publico | params `id` + query/body `cantidad` (`Number()` manual) | ❌ |
| 20 | `GET /api/productos/:id` | publico | params `id` (`Number()` manual) | ❌ |
| 21 | `POST /api/productos` | Bearer + `vendedor` + multipart `imagen` | body: nombre, descripcion, precio, stock, descuento, categoria (validacion manual H3: `''`/`null` no validos) | ❌ |
| 22 | `PUT /api/productos/:id` | Bearer + `vendedor` + multipart `imagen` | params `id` + body parcial | ❌ |

## 3. Pedidos / pago — `/api/pedidos` (3)

| # | Metodo + ruta completa | Auth / roles | Entrada | Estado Zod |
|---|---|---|---|---|
| 23 | `GET /api/pedidos/resumen` | Bearer | — (carrito del token, RF113/114/117/134) | ❌ (solo lectura) |
| 24 | `POST /api/pedidos/confirmar-pago` | Bearer (checkout ACID RF134) | body: direccion_envio, metodo_pago enum tarjeta\|transferencia\|pse, ultimos4_tarjeta? (4 digitos, M-28), marca_tarjeta? enum Visa\|Mastercard\|Amex\|Otra, nombre_tarjeta? (el PAN nunca viaja) | ⚠️ `confirmarPagoSchema` inline |
| 25 | `PATCH /api/pedidos/:id/estado` | Bearer (RBAC por ownership en controller) | params `id` (`paramsIdSchema` inline) + body: estado enum En camino\|Entregado\|Cancelado, detalle_id? (`estadoSchema` inline) | ⚠️ inline |

## 4. Tienda vendedor — `/api/tienda` (8, todo `vendedor`)

| # | Metodo + ruta completa | Auth / roles | Entrada | Estado Zod |
|---|---|---|---|---|
| 26 | `GET /api/tienda/mi-cuenta-bancaria` | Bearer + `vendedor` | — | ❌ (lectura) |
| 27 | `GET /api/tienda/mi-cuenta-bancaria/masked` | Bearer + `vendedor` | — | ❌ (lectura) |
| 28 | `POST /api/tienda/mi-cuenta-bancaria` | Bearer + `vendedor` | body: titular_nombre, banco, tipo_cuenta, numero_cuenta | ⚠️ `bancoSchema.parse` en controller |
| 29 | `PUT /api/tienda/mi-cuenta-bancaria` | Bearer + `vendedor` | idem | ⚠️ idem |
| 30 | `GET /api/tienda/ventas` | Bearer + `vendedor` | — (RF119-123) | ❌ |
| 31 | `GET /api/tienda/ingresos` | Bearer + `vendedor` | — | ❌ |
| 32 | `GET /api/tienda/dashboard/stats` | Bearer + `vendedor` | — | ❌ |
| 33 | `GET /api/tienda/validacion` | Bearer + `vendedor` | — (RF130-139) | ❌ |

## 5. Admin — `/api/admin` (16, todo `administrador`)

`router.use(authRequired, requireRoles(["administrador"]))`.

| # | Metodo + ruta completa | Entrada | Estado Zod |
|---|---|---|---|
| 34 | `GET /api/admin/stats` | — (RF55-59) | ❌ |
| 35 | `GET /api/admin/usuarios` | — (RF67/73/74) | ❌ |
| 36 | `PATCH /api/admin/usuarios/:id/estado` | params `id` + body estado | ❌ |
| 37 | `DELETE /api/admin/usuarios/:id` | params `id` | ❌ |
| 38 | `GET /api/admin/productos` | — (RF68/72) | ❌ |
| 39 | `DELETE /api/admin/productos/:id` | params `id` | ❌ |
| 40 | `PATCH /api/admin/productos/:id/restaurar` | params `id` | ❌ |
| 41 | `GET /api/admin/reportes` | — (RF60-66) | ❌ |
| 42 | `GET /api/admin/reportes/:id` | params `id` | ❌ |
| 43 | `DELETE /api/admin/reportes/:id` | params `id` | ❌ |
| 44 | `PATCH /api/admin/reportes/:id/resolver` | params `id` + body resolucion | ❌ |
| 45 | `GET /api/admin/busqueda` | query global (RF69-71) | ❌ |
| 46 | `GET /api/admin/mi-cuenta-bancaria` | — (RF75/76) | ❌ |
| 47 | `GET /api/admin/mi-cuenta-bancaria/masked` | — | ❌ |
| 48 | `POST /api/admin/mi-cuenta-bancaria` | body cuenta bancaria | ⚠️ `bancoSchema.parse` en controller |
| 49 | `PUT /api/admin/mi-cuenta-bancaria` | idem | ⚠️ idem |

## 6. Reportes — `/api/reportes` (1)

| # | Metodo + ruta completa | Auth / roles | Entrada | Estado Zod |
|---|---|---|---|---|
| 50 | `POST /api/reportes/` | Bearer + multipart `evidencia` (opcional) | body: producto o usuario reportado + motivo | ❌ |

## 7. Calificaciones — `/api/calificaciones` (1)

| # | Metodo + ruta completa | Auth / roles | Entrada | Estado Zod |
|---|---|---|---|---|
| 51 | `POST /api/calificaciones/vendedor` | Bearer (RF107, 1-5 estrellas tras compra) | body: pedido_id, vendedor_id, estrellas 1-5, comentario? max 500 | ⚠️ `calificacionSchema` inline (`safeParse`) |

## 8. Chat — `/api/chat` (4)

| # | Metodo + ruta completa | Auth / roles | Entrada | Estado Zod |
|---|---|---|---|---|
| 52 | `POST /api/chat/` | Bearer (rechaza multipart en puerta, RF101) | body JSON: receptor_id, mensaje (trim manual) | ❌ |
| 53 | `GET /api/chat/conversaciones` | Bearer | — | ❌ |
| 54 | `GET /api/chat/mensajes/:usuarioId` | Bearer | params `usuarioId` (`Number()` manual) | ❌ |
| 55 | `PATCH /api/chat/mensajes/:id/leido` | Bearer | params `id` (`Number()` manual) | ❌ |

## 9. Notificaciones — `/api/notificaciones` (6)

| # | Metodo + ruta completa | Auth / roles | Entrada | Estado Zod |
|---|---|---|---|---|
| 56 | `GET /api/notificaciones/` | Bearer | query: tipo?, limite? (validacion manual `TIPOS_VALIDOS` + `Number()`) | ❌ |
| 57 | `GET /api/notificaciones/no-leidas` | Bearer | — | ❌ |
| 58 | `PATCH /api/notificaciones/leidas` | Bearer | — | ❌ |
| 59 | `PATCH /api/notificaciones/:id/leida` | Bearer | params `id` (`Number()` manual) | ❌ |
| 60 | `DELETE /api/notificaciones/` | Bearer | — | ❌ |
| 61 | `DELETE /api/notificaciones/:id` | Bearer | params `id` (`Number()` manual) | ❌ |

## 10. Seguidores — `/api/seguidores` (5)

| # | Metodo + ruta completa | Auth / roles | Entrada | Estado Zod |
|---|---|---|---|---|
| 62 | `GET /api/seguidores/siguiendo` | Bearer | — | ❌ |
| 63 | `GET /api/seguidores/seguidores` | Bearer | — | ❌ |
| 64 | `POST /api/seguidores/` | Bearer | body: seguido_id (coerce int+) | ⚠️ `seguirSchema` inline (`safeParse`) |
| 65 | `DELETE /api/seguidores/:id` | Bearer | params `id` | ⚠️ `idParamSchema` inline (`safeParse`) |
| 66 | `GET /api/seguidores/:id/contadores` | publico (RF106, perfil publico) | params `id` | ⚠️ `idParamSchema` inline |

## 11. Carrito — `/api/carrito` (4)

| # | Metodo + ruta completa | Auth / roles | Entrada | Estado Zod |
|---|---|---|---|---|
| 67 | `POST /api/carrito/` | Bearer (comprador_id del token, H1) | body: producto_id, cantidad=1 (`Number()` + `isInteger` manual) | ❌ |
| 68 | `DELETE /api/carrito/:productoId` | Bearer | params `productoId` (`Number()` manual) | ❌ |
| 69 | `PATCH /api/carrito/:productoId` | Bearer | params `productoId` + body cantidad | ❌ |
| 70 | `GET /api/carrito/` | Bearer | — (agrupa por vendedor + resumen) | ❌ |

## 12. Historial / compras — `/api/historial` (2)

| # | Metodo + ruta completa | Auth / roles | Entrada | Estado Zod |
|---|---|---|---|---|
| 71 | `GET /api/historial/compras` | Bearer | — | ❌ |
| 72 | `POST /api/historial/compras/:id/cancelar` | Bearer (RF135: solo Pendiente, restituye stock + reembolso) | params `id` | ❌ |

## Resumen de cobertura Zod (base para Fase 1)

| Estado | Cantidad | Endpoints |
|---|---|---|
| ✅ centralizado | 5 | 6, 7, 8, 9, 13 (auth) |
| ⚠️ inline / ad-hoc | 9 | 24, 25, 28, 29, 48, 49, 51, 64, 65, 66 (10 usos en 9 endpoints; el 25 usa 2 esquemas) |
| ❌ sin contrato | 58 | resto |

> Nota: el conteo ⚠️ es 10 usos de esquema en 9 endpoints (el PATCH `/:id/estado` usa `estadoSchema` + `paramsIdSchema`).
> Fase 1 debe **extraer** los 10 usos a `schemas/` y **definir** contratos nuevos para los 58 sin validar, priorizando escrituras (POST/PATCH/PUT/DELETE) sobre lecturas.
