# Evidencia E2E - Capa de red de los clientes (2026-09-28)

> Backend vivo: `http://localhost:3000` (BD `commercity_v2`). Generado por `docs/AVANCES/PRUEBAS/harness_capa_red.mjs`.
> Ejecuta los **api.js reales** de cada cliente (con shim localStorage/window y fetch nativo), no fetch crudo.
> Runner complementario (69 endpoints, contrato backend): `ejecutar_pruebas.mjs` = 129/129 OK.

**Resultado: 102 OK / 0 FAIL** en 8.787s

| Cliente | # | Metodo api.* | Descripcion | Esperado | Obtenido | ms | Resultado |
|---|---|---|---|---|---|---|---|
| movil | 1 | `register` | POST /api/usuarios/register (cuenta efimera) | ok | ok | 253 | OK |
| movil | 2 | `login` | POST /api/usuarios/login -> JWT | ok | ok | 133 | OK |
| movil | 3 | `me` | GET /api/usuarios/me (Bearer del cliente) | ok | ok | 108 | OK |
| movil | 4 | `productos` | GET /api/productos?limit=100 -> descubre A/B/vendedor | ok | ok | 78 | OK |
| movil | 5 | `categorias` | GET /api/categorias | ok | ok | 28 | OK |
| movil | 6 | `vendedores` | GET /api/vendedores | ok | ok | 31 | OK |
| movil | 7 | `producto` | GET /api/productos/id detalle A | ok | ok | 45 | OK |
| movil | 8 | `validarStock` | GET /api/productos/583/validar-stock | ok | ok | 31 | OK |
| movil | 9 | `actualizarPerfil` | PATCH /api/usuarios/me | ok | ok | 82 | OK |
| movil | 10 | `perfilPublico` | GET /api/usuarios/perfil-publico/vendedor | ok | ok | 26 | OK |
| movil | 11 | `directorio` | GET /api/usuarios/directorio | ok | ok | 51 | OK |
| movil | 12 | `agregarCarrito` | POST /api/carrito (A=#583 x1) | ok | ok | 99 | OK |
| movil | 13 | `listarCarrito` | GET /api/carrito (agrupado por vendedor) | ok | ok | 26 | OK |
| movil | 14 | `resumenPedido` | GET /api/pedidos/resumen (IVA/90-10 servidor) | ok | ok | 57 | OK |
| movil | 15 | `confirmarPago` | B1: direccion_envio <5 chars -> 400 zod | error 400 | error 400 (direccion_envio: Too small: expected string to have >=5 characters) | 48 | OK |
| movil | 16 | `confirmarPago` | B1: tarjeta fuera de formato (1234) -> 400 RF118 | error 400 | error 400 (Número de tarjeta (13-19 dígitos) y nombre del titular son obligatorios (RF118)) | 32 | OK |
| movil | 17 | `confirmarPago` | B1: Luhn invalido (16 dig) -> 402 PAGO_RECHAZADO | error 402 | error 402 (La pasarela rechazó la tarjeta (Luhn inválido)) | 46 | OK |
| movil | 18 | `modificarCantidad` | PATCH /api/carrito/:id -> 2 | ok | ok | 76 | OK |
| movil | 19 | `eliminarCarrito` | DELETE /api/carrito/:id (limpieza) | ok | ok | 26 | OK |
| movil | 20 | `agregarCarrito` | POST /api/carrito (A=#583 x1, pre-pago) | ok | ok | 113 | OK |
| movil | 21 | `confirmarPago` | POS: tarjeta valida 4111... (Luhn) -> pedido creado | ok | ok | 204 | OK |
| movil | 22 | `calificarVendedor` | POST /api/calificaciones/vendedor (pedido #id) | ok | ok | 138 | OK |
| movil | 23 | `historialCompras` | GET /api/historial/compras | ok | ok | 69 | OK |
| movil | 24 | `conversaciones` | GET /api/chat/conversaciones | ok | ok | 80 | OK |
| movil | 25 | `enviarMensaje` | POST /api/chat (multipart al vendedor #id) | ok | ok | 115 | OK |
| movil | 26 | `mensajes` | GET /api/chat/mensajes/:usuarioId | ok | ok | 62 | OK |
| movil | 27 | `notificaciones` | GET /api/notificaciones | ok | ok | 61 | OK |
| movil | 28 | `notifsNoLeidas` | GET /api/notificaciones/no-leidas | ok | ok | 60 | OK |
| movil | 29 | `marcarTodasLeidas` | PATCH /api/notificaciones/leidas | ok | ok | 63 | OK |
| movil | 30 | `eliminarTodasNotifs` | DELETE /api/notificaciones (limpieza propia) | ok | ok | 59 | OK |
| movil | 31 | `crearReporte` | POST /api/reportes (multipart tipo Producto) | ok | ok | 102 | OK |
| movil | 32 | `siguiendo` | GET /api/seguidores/siguiendo | ok | ok | 60 | OK |
| movil | 33 | `seguidores` | GET /api/seguidores/seguidores | ok | ok | 66 | OK |
| movil | 34 | `seguir` | DESVIACION: api.js envia {usuario_id}, backend valida {seguido_id} -> 400 | error 400 | error 400 (Datos inválidos) | 42 | OK |
| movil | 35 | `seguir(raw)` | contrato real {seguido_id} -> POST /api/seguidores | 200/201 | ok | 103 | OK |
| movil | 36 | `dejarSeguir` | DELETE /api/seguidores/:id (limpieza) | 200/404 | ok | 56 | OK |
| movil | 37 | `cambiarRol` | PATCH /api/usuarios/me/rol -> vendedor | ok | ok | 148 | OK |
| movil | 38 | `misProductos` | GET /api/productos/mis-productos | ok | ok | 75 | OK |
| movil | 39 | `statsTienda` | GET /api/tienda/dashboard/stats | ok | ok | 99 | OK |
| movil | 40 | `ventas` | GET /api/tienda/ventas | ok | ok | 107 | OK |
| movil | 41 | `ingresos` | GET /api/tienda/ingresos (90/10) | ok | ok | 96 | OK |
| movil | 42 | `cuentaBancaria` | GET /api/tienda/mi-cuenta-bancaria | ok | ok | 81 | OK |
| movil | 43 | `guardarCuentaBancaria` | POST /api/tienda/mi-cuenta-bancaria (efimera cifrada) | ok | ok | 162 | OK |
| movil | 44 | `validacionTienda` | GET /api/tienda/validacion (RF130-139 restaurado) | ok | ok | 104 | OK |
| movil | 45 | `adminCuentaBancaria` | RBAC: vendedor en GET /api/admin/mi-cuenta-bancaria -> 403 | error 403 | error 403 (No tienes permisos para esta accion) | 69 | OK |
| movil | 46 | `crearProducto` | POST /api/productos (multipart con imagen) | ok | ok | 97 | OK |
| movil | 47 | `editarProducto` | PUT /api/productos/:id -> stock 0 (queda Agotado) | ok | ok | 107 | OK |
| movil | 48 | `logout` | POST /api/usuarios/logout (revoca JWT) | ok | ok | 58 | OK |
| movil | 49 | `register2` | POST /api/usuarios/register (cuenta 2) | ok | ok | 202 | OK |
| movil | 50 | `login2` | POST /api/usuarios/login (cuenta 2) | ok | ok | 129 | OK |
| movil | 51 | `eliminarCuenta` | DELETE /api/usuarios/cuenta (RF40 baja logica) | ok | ok | 136 | OK |
| escritorio | 52 | `register` | POST /api/usuarios/register (cuenta efimera) | ok | ok | 186 | OK |
| escritorio | 53 | `login` | POST /api/usuarios/login -> JWT | ok | ok | 125 | OK |
| escritorio | 54 | `me` | GET /api/usuarios/me (Bearer del cliente) | ok | ok | 68 | OK |
| escritorio | 55 | `productos` | GET /api/productos?limit=100 -> descubre A/B/vendedor | ok | ok | 44 | OK |
| escritorio | 56 | `categorias` | GET /api/categorias | ok | ok | 27 | OK |
| escritorio | 57 | `vendedores` | GET /api/vendedores | ok | ok | 32 | OK |
| escritorio | 58 | `producto` | GET /api/productos/id detalle A | ok | ok | 53 | OK |
| escritorio | 59 | `validarStock` | GET /api/productos/582/validar-stock | ok | ok | 33 | OK |
| escritorio | 60 | `actualizarPerfil` | PATCH /api/usuarios/me | ok | ok | 73 | OK |
| escritorio | 61 | `perfilPublico` | GET /api/usuarios/perfil-publico/vendedor | ok | ok | 23 | OK |
| escritorio | 62 | `directorio` | GET /api/usuarios/directorio | ok | ok | 68 | OK |
| escritorio | 63 | `agregarCarrito` | POST /api/carrito (A=#582 x1) | ok | ok | 116 | OK |
| escritorio | 64 | `listarCarrito` | GET /api/carrito (agrupado por vendedor) | ok | ok | 20 | OK |
| escritorio | 65 | `resumenPedido` | GET /api/pedidos/resumen (IVA/90-10 servidor) | ok | ok | 76 | OK |
| escritorio | 66 | `confirmarPago` | B1: direccion_envio <5 chars -> 400 zod | error 400 | error 400 (direccion_envio: Too small: expected string to have >=5 characters) | 97 | OK |
| escritorio | 67 | `confirmarPago` | B1: tarjeta fuera de formato (1234) -> 400 RF118 | error 400 | error 400 (Número de tarjeta (13-19 dígitos) y nombre del titular son obligatorios (RF118)) | 50 | OK |
| escritorio | 68 | `confirmarPago` | B1: Luhn invalido (16 dig) -> 402 PAGO_RECHAZADO | error 402 | error 402 (La pasarela rechazó la tarjeta (Luhn inválido)) | 54 | OK |
| escritorio | 69 | `modificarCantidad` | PATCH /api/carrito/:id -> 2 | ok | ok | 87 | OK |
| escritorio | 70 | `eliminarCarrito` | DELETE /api/carrito/:id (limpieza) | ok | ok | 41 | OK |
| escritorio | 71 | `agregarCarrito` | POST /api/carrito (A=#582 x1, pre-pago) | ok | ok | 108 | OK |
| escritorio | 72 | `confirmarPago` | POS: tarjeta valida 4111... (Luhn) -> pedido creado | ok | ok | 211 | OK |
| escritorio | 73 | `calificarVendedor` | POST /api/calificaciones/vendedor (pedido #id) | ok | ok | 133 | OK |
| escritorio | 74 | `historialCompras` | GET /api/historial/compras | ok | ok | 57 | OK |
| escritorio | 75 | `conversaciones` | GET /api/chat/conversaciones | ok | ok | 74 | OK |
| escritorio | 76 | `enviarMensaje` | POST /api/chat (multipart al vendedor #id) | ok | ok | 117 | OK |
| escritorio | 77 | `mensajes` | GET /api/chat/mensajes/:usuarioId | ok | ok | 69 | OK |
| escritorio | 78 | `notificaciones` | GET /api/notificaciones | ok | ok | 68 | OK |
| escritorio | 79 | `notifsNoLeidas` | GET /api/notificaciones/no-leidas | ok | ok | 62 | OK |
| escritorio | 80 | `marcarTodasLeidas` | PATCH /api/notificaciones/leidas | ok | ok | 65 | OK |
| escritorio | 81 | `eliminarTodasNotifs` | DELETE /api/notificaciones (limpieza propia) | ok | ok | 53 | OK |
| escritorio | 82 | `crearReporte` | POST /api/reportes (multipart tipo Producto) | ok | ok | 117 | OK |
| escritorio | 83 | `siguiendo` | GET /api/seguidores/siguiendo | ok | ok | 66 | OK |
| escritorio | 84 | `seguidores` | GET /api/seguidores/seguidores | ok | ok | 55 | OK |
| escritorio | 85 | `seguir` | DESVIACION: api.js envia {usuario_id}, backend valida {seguido_id} -> 400 | error 400 | error 400 (Datos inválidos) | 54 | OK |
| escritorio | 86 | `seguir(raw)` | contrato real {seguido_id} -> POST /api/seguidores | 200/201 | ok | 90 | OK |
| escritorio | 87 | `dejarSeguir` | DELETE /api/seguidores/:id (limpieza) | 200/404 | ok | 67 | OK |
| escritorio | 88 | `cambiarRol` | PATCH /api/usuarios/me/rol -> vendedor | ok | ok | 131 | OK |
| escritorio | 89 | `misProductos` | GET /api/productos/mis-productos | ok | ok | 61 | OK |
| escritorio | 90 | `statsTienda` | GET /api/tienda/dashboard/stats | ok | ok | 126 | OK |
| escritorio | 91 | `ventas` | GET /api/tienda/ventas | ok | ok | 95 | OK |
| escritorio | 92 | `ingresos` | GET /api/tienda/ingresos (90/10) | ok | ok | 96 | OK |
| escritorio | 93 | `cuentaBancaria` | GET /api/tienda/mi-cuenta-bancaria | ok | ok | 75 | OK |
| escritorio | 94 | `guardarCuentaBancaria` | POST /api/tienda/mi-cuenta-bancaria (efimera cifrada) | ok | ok | 131 | OK |
| escritorio | 95 | `validacionTienda` | GET /api/tienda/validacion (RF130-139 restaurado) | ok | ok | 106 | OK |
| escritorio | 96 | `adminCuentaBancaria` | RBAC: vendedor en GET /api/admin/mi-cuenta-bancaria -> 403 | error 403 | error 403 (No tienes permisos para esta accion) | 52 | OK |
| escritorio | 97 | `crearProducto` | POST /api/productos (multipart con imagen) | ok | ok | 108 | OK |
| escritorio | 98 | `editarProducto` | PUT /api/productos/:id -> stock 0 (queda Agotado) | ok | ok | 97 | OK |
| escritorio | 99 | `logout` | POST /api/usuarios/logout (revoca JWT) | ok | ok | 51 | OK |
| escritorio | 100 | `register2` | POST /api/usuarios/register (cuenta 2) | ok | ok | 203 | OK |
| escritorio | 101 | `login2` | POST /api/usuarios/login (cuenta 2) | ok | ok | 121 | OK |
| escritorio | 102 | `eliminarCuenta` | DELETE /api/usuarios/cuenta (RF40 baja logica) | ok | ok | 136 | OK |

## Notas de evidencia
- **B1**: rechazos reales de pago con carrito no vacio: direccion <5 -> 400 (zod), tarjeta fuera de formato -> 400 (RF118), Luhn invalido -> 402 PAGO_RECHAZADO.
- **RF130-139**: `validacionTienda` probado por cliente (endpoint restaurado en commit 14d6056).
- **Desviacion seguidores** (INFORME rama escritorio s4): `api.seguir` envia `{usuario_id}` y el backend valida `{seguido_id}`; el cliente lo resuelve en el caller con retry. Este harness demuestra ambos contratos.
- **RBAC**: `adminCuentaBancaria` con rol vendedor -> 403 en ambos clientes.
- Residuos efimeros (iguales a los del runner): 2 cuentas por cliente (una dada de baja), 1 pedido real, 1 calificacion, 1 reporte, 1 producto ZzHARNESS Agotado, 1 cuenta bancaria cifrada efimera, 1 chat message al vendedor.
- Cobertura delegada al runner (raw fetch): recover/reset-password, leido de chat, admin completo, cancelar compra.