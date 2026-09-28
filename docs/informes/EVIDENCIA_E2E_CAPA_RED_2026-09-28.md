# Evidencia E2E - Capa de red de los clientes (2026-09-28)

> Backend vivo: `http://localhost:3000` (BD `commercity_v2`). Generado por `docs/AVANCES/PRUEBAS/harness_capa_red.mjs`.
> Ejecuta los **api.js reales** de cada cliente (con shim localStorage/window y fetch nativo), no fetch crudo.
> Runner complementario (69 endpoints, contrato backend): `ejecutar_pruebas.mjs` = 129/129 OK.

**Resultado: 102 OK / 0 FAIL** en 9.719s

| Cliente | # | Metodo api.* | Descripcion | Esperado | Obtenido | ms | Resultado |
|---|---|---|---|---|---|---|---|
| movil | 1 | `register` | POST /api/usuarios/register (cuenta efimera) | ok | ok | 252 | OK |
| movil | 2 | `login` | POST /api/usuarios/login -> JWT | ok | ok | 153 | OK |
| movil | 3 | `me` | GET /api/usuarios/me (Bearer del cliente) | ok | ok | 92 | OK |
| movil | 4 | `productos` | GET /api/productos?limit=100 -> descubre A/B/vendedor | ok | ok | 70 | OK |
| movil | 5 | `categorias` | GET /api/categorias | ok | ok | 32 | OK |
| movil | 6 | `vendedores` | GET /api/vendedores | ok | ok | 25 | OK |
| movil | 7 | `producto` | GET /api/productos/id detalle A | ok | ok | 55 | OK |
| movil | 8 | `validarStock` | GET /api/productos/582/validar-stock | ok | ok | 28 | OK |
| movil | 9 | `actualizarPerfil` | PATCH /api/usuarios/me | ok | ok | 77 | OK |
| movil | 10 | `perfilPublico` | GET /api/usuarios/perfil-publico/vendedor | ok | ok | 25 | OK |
| movil | 11 | `directorio` | GET /api/usuarios/directorio | ok | ok | 68 | OK |
| movil | 12 | `agregarCarrito` | POST /api/carrito (A=#582 x1) | ok | ok | 131 | OK |
| movil | 13 | `listarCarrito` | GET /api/carrito (agrupado por vendedor) | ok | ok | 40 | OK |
| movil | 14 | `resumenPedido` | GET /api/pedidos/resumen (IVA/90-10 servidor) | ok | ok | 78 | OK |
| movil | 15 | `confirmarPago` | B1: direccion_envio <5 chars -> 400 zod | error 400 | error 400 (direccion_envio: Too small: expected string to have >=5 characters) | 68 | OK |
| movil | 16 | `confirmarPago` | B1: tarjeta fuera de formato (1234) -> 400 RF118 | error 400 | error 400 (Número de tarjeta (13-19 dígitos) y nombre del titular son obligatorios (RF118)) | 38 | OK |
| movil | 17 | `confirmarPago` | B1: Luhn invalido (16 dig) -> 402 PAGO_RECHAZADO | error 402 | error 402 (La pasarela rechazó la tarjeta (Luhn inválido)) | 47 | OK |
| movil | 18 | `modificarCantidad` | PATCH /api/carrito/:id -> 2 | ok | ok | 109 | OK |
| movil | 19 | `eliminarCarrito` | DELETE /api/carrito/:id (limpieza) | ok | ok | 24 | OK |
| movil | 20 | `agregarCarrito` | POST /api/carrito (A=#582 x1, pre-pago) | ok | ok | 104 | OK |
| movil | 21 | `confirmarPago` | POS: tarjeta valida 4111... (Luhn) -> pedido creado | ok | ok | 227 | OK |
| movil | 22 | `calificarVendedor` | POST /api/calificaciones/vendedor (pedido #id) | ok | ok | 127 | OK |
| movil | 23 | `historialCompras` | GET /api/historial/compras | ok | ok | 51 | OK |
| movil | 24 | `conversaciones` | GET /api/chat/conversaciones | ok | ok | 81 | OK |
| movil | 25 | `enviarMensaje` | POST /api/chat (multipart al vendedor #id) | ok | ok | 126 | OK |
| movil | 26 | `mensajes` | GET /api/chat/mensajes/:usuarioId | ok | ok | 75 | OK |
| movil | 27 | `notificaciones` | GET /api/notificaciones | ok | ok | 69 | OK |
| movil | 28 | `notifsNoLeidas` | GET /api/notificaciones/no-leidas | ok | ok | 56 | OK |
| movil | 29 | `marcarTodasLeidas` | PATCH /api/notificaciones/leidas | ok | ok | 73 | OK |
| movil | 30 | `eliminarTodasNotifs` | DELETE /api/notificaciones (limpieza propia) | ok | ok | 68 | OK |
| movil | 31 | `crearReporte` | POST /api/reportes (multipart tipo Producto) | ok | ok | 113 | OK |
| movil | 32 | `siguiendo` | GET /api/seguidores/siguiendo | ok | ok | 71 | OK |
| movil | 33 | `seguidores` | GET /api/seguidores/seguidores | ok | ok | 57 | OK |
| movil | 34 | `seguir` | POST /api/seguidores {seguido_id} (fix post-review: antes {usuario_id} daba 400) | ok | ok | 88 | OK |
| movil | 35 | `seguir(raw)` | reintento del contrato real tras api.seguir OK -> 409 duplicado | error 200/201/409 | error 409 (Ya sigues a este usuario) | 73 | OK |
| movil | 36 | `dejarSeguir` | DELETE /api/seguidores/:id (limpieza) | 200/404 | ok | 63 | OK |
| movil | 37 | `cambiarRol` | PATCH /api/usuarios/me/rol -> vendedor | ok | ok | 161 | OK |
| movil | 38 | `misProductos` | GET /api/productos/mis-productos | ok | ok | 76 | OK |
| movil | 39 | `statsTienda` | GET /api/tienda/dashboard/stats | ok | ok | 114 | OK |
| movil | 40 | `ventas` | GET /api/tienda/ventas | ok | ok | 117 | OK |
| movil | 41 | `ingresos` | GET /api/tienda/ingresos (90/10) | ok | ok | 127 | OK |
| movil | 42 | `cuentaBancaria` | GET /api/tienda/mi-cuenta-bancaria | ok | ok | 100 | OK |
| movil | 43 | `guardarCuentaBancaria` | POST /api/tienda/mi-cuenta-bancaria (efimera cifrada) | ok | ok | 134 | OK |
| movil | 44 | `validacionTienda` | GET /api/tienda/validacion (RF130-139 restaurado) | ok | ok | 116 | OK |
| movil | 45 | `adminCuentaBancaria` | RBAC: vendedor en GET /api/admin/mi-cuenta-bancaria -> 403 | error 403 | error 403 (No tienes permisos para esta accion) | 92 | OK |
| movil | 46 | `crearProducto` | POST /api/productos (multipart con imagen) | ok | ok | 133 | OK |
| movil | 47 | `editarProducto` | PUT /api/productos/:id -> stock 0 (queda Agotado) | ok | ok | 98 | OK |
| movil | 48 | `logout` | POST /api/usuarios/logout (revoca JWT) | ok | ok | 75 | OK |
| movil | 49 | `register2` | POST /api/usuarios/register (cuenta 2) | ok | ok | 211 | OK |
| movil | 50 | `login2` | POST /api/usuarios/login (cuenta 2) | ok | ok | 131 | OK |
| movil | 51 | `eliminarCuenta` | DELETE /api/usuarios/cuenta (RF40 baja logica) | ok | ok | 157 | OK |
| escritorio | 52 | `register` | POST /api/usuarios/register (cuenta efimera) | ok | ok | 251 | OK |
| escritorio | 53 | `login` | POST /api/usuarios/login -> JWT | ok | ok | 187 | OK |
| escritorio | 54 | `me` | GET /api/usuarios/me (Bearer del cliente) | ok | ok | 73 | OK |
| escritorio | 55 | `productos` | GET /api/productos?limit=100 -> descubre A/B/vendedor | ok | ok | 74 | OK |
| escritorio | 56 | `categorias` | GET /api/categorias | ok | ok | 33 | OK |
| escritorio | 57 | `vendedores` | GET /api/vendedores | ok | ok | 32 | OK |
| escritorio | 58 | `producto` | GET /api/productos/id detalle A | ok | ok | 61 | OK |
| escritorio | 59 | `validarStock` | GET /api/productos/582/validar-stock | ok | ok | 39 | OK |
| escritorio | 60 | `actualizarPerfil` | PATCH /api/usuarios/me | ok | ok | 69 | OK |
| escritorio | 61 | `perfilPublico` | GET /api/usuarios/perfil-publico/vendedor | ok | ok | 26 | OK |
| escritorio | 62 | `directorio` | GET /api/usuarios/directorio | ok | ok | 85 | OK |
| escritorio | 63 | `agregarCarrito` | POST /api/carrito (A=#582 x1) | ok | ok | 134 | OK |
| escritorio | 64 | `listarCarrito` | GET /api/carrito (agrupado por vendedor) | ok | ok | 19 | OK |
| escritorio | 65 | `resumenPedido` | GET /api/pedidos/resumen (IVA/90-10 servidor) | ok | ok | 67 | OK |
| escritorio | 66 | `confirmarPago` | B1: direccion_envio <5 chars -> 400 zod | error 400 | error 400 (direccion_envio: Too small: expected string to have >=5 characters) | 58 | OK |
| escritorio | 67 | `confirmarPago` | B1: tarjeta fuera de formato (1234) -> 400 RF118 | error 400 | error 400 (Número de tarjeta (13-19 dígitos) y nombre del titular son obligatorios (RF118)) | 52 | OK |
| escritorio | 68 | `confirmarPago` | B1: Luhn invalido (16 dig) -> 402 PAGO_RECHAZADO | error 402 | error 402 (La pasarela rechazó la tarjeta (Luhn inválido)) | 43 | OK |
| escritorio | 69 | `modificarCantidad` | PATCH /api/carrito/:id -> 2 | ok | ok | 97 | OK |
| escritorio | 70 | `eliminarCarrito` | DELETE /api/carrito/:id (limpieza) | ok | ok | 41 | OK |
| escritorio | 71 | `agregarCarrito` | POST /api/carrito (A=#582 x1, pre-pago) | ok | ok | 142 | OK |
| escritorio | 72 | `confirmarPago` | POS: tarjeta valida 4111... (Luhn) -> pedido creado | ok | ok | 269 | OK |
| escritorio | 73 | `calificarVendedor` | POST /api/calificaciones/vendedor (pedido #id) | ok | ok | 123 | OK |
| escritorio | 74 | `historialCompras` | GET /api/historial/compras | ok | ok | 78 | OK |
| escritorio | 75 | `conversaciones` | GET /api/chat/conversaciones | ok | ok | 87 | OK |
| escritorio | 76 | `enviarMensaje` | POST /api/chat (multipart al vendedor #id) | ok | ok | 112 | OK |
| escritorio | 77 | `mensajes` | GET /api/chat/mensajes/:usuarioId | ok | ok | 84 | OK |
| escritorio | 78 | `notificaciones` | GET /api/notificaciones | ok | ok | 72 | OK |
| escritorio | 79 | `notifsNoLeidas` | GET /api/notificaciones/no-leidas | ok | ok | 62 | OK |
| escritorio | 80 | `marcarTodasLeidas` | PATCH /api/notificaciones/leidas | ok | ok | 68 | OK |
| escritorio | 81 | `eliminarTodasNotifs` | DELETE /api/notificaciones (limpieza propia) | ok | ok | 56 | OK |
| escritorio | 82 | `crearReporte` | POST /api/reportes (multipart tipo Producto) | ok | ok | 112 | OK |
| escritorio | 83 | `siguiendo` | GET /api/seguidores/siguiendo | ok | ok | 59 | OK |
| escritorio | 84 | `seguidores` | GET /api/seguidores/seguidores | ok | ok | 57 | OK |
| escritorio | 85 | `seguir` | POST /api/seguidores {seguido_id} (fix post-review: antes {usuario_id} daba 400) | ok | ok | 97 | OK |
| escritorio | 86 | `seguir(raw)` | reintento del contrato real tras api.seguir OK -> 409 duplicado | error 200/201/409 | error 409 (Ya sigues a este usuario) | 78 | OK |
| escritorio | 87 | `dejarSeguir` | DELETE /api/seguidores/:id (limpieza) | 200/404 | ok | 65 | OK |
| escritorio | 88 | `cambiarRol` | PATCH /api/usuarios/me/rol -> vendedor | ok | ok | 140 | OK |
| escritorio | 89 | `misProductos` | GET /api/productos/mis-productos | ok | ok | 85 | OK |
| escritorio | 90 | `statsTienda` | GET /api/tienda/dashboard/stats | ok | ok | 121 | OK |
| escritorio | 91 | `ventas` | GET /api/tienda/ventas | ok | ok | 115 | OK |
| escritorio | 92 | `ingresos` | GET /api/tienda/ingresos (90/10) | ok | ok | 113 | OK |
| escritorio | 93 | `cuentaBancaria` | GET /api/tienda/mi-cuenta-bancaria | ok | ok | 74 | OK |
| escritorio | 94 | `guardarCuentaBancaria` | POST /api/tienda/mi-cuenta-bancaria (efimera cifrada) | ok | ok | 167 | OK |
| escritorio | 95 | `validacionTienda` | GET /api/tienda/validacion (RF130-139 restaurado) | ok | ok | 121 | OK |
| escritorio | 96 | `adminCuentaBancaria` | RBAC: vendedor en GET /api/admin/mi-cuenta-bancaria -> 403 | error 403 | error 403 (No tienes permisos para esta accion) | 66 | OK |
| escritorio | 97 | `crearProducto` | POST /api/productos (multipart con imagen) | ok | ok | 93 | OK |
| escritorio | 98 | `editarProducto` | PUT /api/productos/:id -> stock 0 (queda Agotado) | ok | ok | 94 | OK |
| escritorio | 99 | `logout` | POST /api/usuarios/logout (revoca JWT) | ok | ok | 61 | OK |
| escritorio | 100 | `register2` | POST /api/usuarios/register (cuenta 2) | ok | ok | 208 | OK |
| escritorio | 101 | `login2` | POST /api/usuarios/login (cuenta 2) | ok | ok | 198 | OK |
| escritorio | 102 | `eliminarCuenta` | DELETE /api/usuarios/cuenta (RF40 baja logica) | ok | ok | 166 | OK |

## Notas de evidencia
- **B1**: rechazos reales de pago con carrito no vacio: direccion <5 -> 400 (zod), tarjeta fuera de formato -> 400 (RF118), Luhn invalido -> 402 PAGO_RECHAZADO.
- **RF130-139**: `validacionTienda` probado por cliente (endpoint restaurado en commit 14d6056).
- **Seguidores (fix post-review)**: la desviacion original (`api.seguir` enviaba `{usuario_id}` y el backend valida `{seguido_id}`) quedo **CORREGIDA en ambos clientes** (2026-09-28); `api.seguir` ahora devuelve 2xx verificado por check. El reintento raw con el mismo `{seguido_id}` responde 409 duplicado (comportamiento esperado).
- **RBAC**: `adminCuentaBancaria` con rol vendedor -> 403 en ambos clientes.
- Residuos efimeros (iguales a los del runner): 2 cuentas por cliente (una dada de baja), 1 pedido real, 1 calificacion, 1 reporte, 1 producto ZzHARNESS Agotado, 1 cuenta bancaria cifrada efimera, 1 chat message al vendedor.
- Cobertura delegada al runner (raw fetch): recover/reset-password, leido de chat, admin completo, cancelar compra.