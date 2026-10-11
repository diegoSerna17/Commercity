# Contratos de datos — CommerCity

> Generado con `npm run docs:api` + `npm run docs:entidades` desde `backend/src/server/schemas/`. No editar a mano.
> 42 contratos documentados. Fuente de verdad: los esquemas Zod.

## Indice

- [EnvoltorioError](#envoltorioerror)
- [EnvoltorioOk](#envoltoriook)
- [IdParam](#idparam)
- [Paginacion](#paginacion)
- [PaginacionTienda](#paginaciontienda)
- [ParamsId](#paramsid)
- [CambiarRol](#cambiarrol)
- [Login](#login)
- [Recuperacion](#recuperacion)
- [Registro](#registro)
- [RestablecerPassword](#restablecerpassword)
- [CuentaBancariaPlataforma](#cuentabancariaplataforma)
- [CuentaBancaria](#cuentabancaria)
- [ActualizarPerfil](#actualizarperfil)
- [DirectorioQuery](#directorioquery)
- [CatalogoQuery](#catalogoquery)
- [CrearProducto](#crearproducto)
- [EditarProducto](#editarproducto)
- [ProductoIdParams](#productoidparams)
- [ValidarStock](#validarstock)
- [ConfirmarPago](#confirmarpago)
- [ActualizarEstadoPedido](#actualizarestadopedido)
- [AgregarAlCarrito](#agregaralcarrito)
- [CarritoProductoParams](#carritoproductoparams)
- [ModificarCantidadCarrito](#modificarcantidadcarrito)
- [HistorialIngresosQuery](#historialingresosquery)
- [HistorialVentasQuery](#historialventasquery)
- [HistorialComprasQuery](#historialcomprasquery)
- [ConversacionParams](#conversacionparams)
- [ConversacionQuery](#conversacionquery)
- [EnviarMensaje](#enviarmensaje)
- [MensajeIdParams](#mensajeidparams)
- [ListarNotificacionesQuery](#listarnotificacionesquery)
- [CalificacionVendedor](#calificacionvendedor)
- [SeguirUsuario](#seguirusuario)
- [CrearReporte](#crearreporte)
- [AdminProductosQuery](#adminproductosquery)
- [AdminReportesQuery](#adminreportesquery)
- [AdminUsuariosQuery](#adminusuariosquery)
- [BusquedaAdminQuery](#busquedaadminquery)
- [CambiarEstadoUsuario](#cambiarestadousuario)
- [ResolverReporte](#resolverreporte)

## EnvoltorioError (`EnvoltorioError`)

> Envoltorio uniforme de respuestas de error

- **Fuente:** `backend/src/server/schemas/common.schema.js`
- **Usado en:** envoltorio comun / base

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `success` | const: false | si | Siempre false en errores |
| `error` | object | si |  |

## EnvoltorioOk (`EnvoltorioOk`)

> Envoltorio uniforme de respuestas exitosas

- **Fuente:** `backend/src/server/schemas/common.schema.js`
- **Usado en:** envoltorio comun / base

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `success` | const: true | si | Siempre true en respuestas exitosas |
| `message` | string | no | Mensaje humano opcional |
| `data` | — | si | Carga util (forma por endpoint) |

## IdParam (`idParam`)

> Identificador entero positivo de ruta o cuerpo

- **Fuente:** `backend/src/server/schemas/common.schema.js`
- **Usado en:** `DELETE /api/seguidores/{id}`, `GET /api/seguidores/{id}/contadores`

## Paginacion (`Paginacion`)

> Paginacion del catalogo publico (?page, ?limit)

- **Fuente:** `backend/src/server/schemas/common.schema.js`
- **Usado en:** envoltorio comun / base

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `page` | integer [min 1, max 9007199254740991] | no | Pagina, base 1 |
| `limit` | integer [min 1, max 100] | no | Registros por pagina (max 100) |

**Ejemplo:**

```json
{
  "page": 1,
  "limit": 4
}
```

## PaginacionTienda (`PaginacionTienda`)

> Paginacion de historiales de tienda (?pagina, ?por_pagina)

- **Fuente:** `backend/src/server/schemas/common.schema.js`
- **Usado en:** envoltorio comun / base

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `pagina` | integer [min 1, max 9007199254740991] | no | Pagina, base 1 |
| `por_pagina` | integer [min 1, max 100] | no | Registros por pagina (max 100) |

**Ejemplo:**

```json
{
  "pagina": 1,
  "por_pagina": 10
}
```

## ParamsId (`ParamsId`)

> Parametro de ruta :id (entero positivo)

- **Fuente:** `backend/src/server/schemas/common.schema.js`
- **Usado en:** `GET /api/usuarios/perfil-publico/{id}`, `PATCH /api/pedidos/{id}/estado`, `POST /api/historial/compras/{id}/cancelar`, `PATCH /api/admin/usuarios/{id}/estado`, `DELETE /api/admin/usuarios/{id}`, `DELETE /api/admin/productos/{id}`, `PATCH /api/admin/productos/{id}/restaurar`, `GET /api/admin/reportes/{id}`, `DELETE /api/admin/reportes/{id}`, `PATCH /api/admin/reportes/{id}/resolver`, `PATCH /api/notificaciones/{id}/leida`, `DELETE /api/notificaciones/{id}`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `id` | integer [max 9007199254740991, > 0] | si | Identificador entero positivo de ruta o cuerpo |

**Ejemplo:**

```json
{
  "id": 12
}
```

## CambiarRol (`CambiarRol`)

> Body de PATCH /api/usuarios/me/rol (comprador <-> vendedor)

- **Fuente:** `backend/src/server/schemas/auth.schemas.js`
- **Usado en:** `PATCH /api/usuarios/me/rol`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `rol` | enum: "comprador" \| "vendedor" | si | Rol destino del usuario |

**Ejemplo:**

```json
{
  "rol": "vendedor"
}
```

## Login (`Login`)

> Body de POST /api/usuarios/login (emite JWT)

- **Fuente:** `backend/src/server/schemas/auth.schemas.js`
- **Usado en:** `POST /api/usuarios/login`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `email` | string (email) | si | Correo del usuario |
| `password` | string [longitud >= 8] | si | Contraseña: minimo 8 caracteres, con letra y numero |

**Ejemplo:**

```json
{
  "email": "comprador@ejemplo.com",
  "password": "Clave1234"
}
```

## Recuperacion (`Recuperacion`)

> Body de POST /api/usuarios/recover (envia correo de restablecimiento)

- **Fuente:** `backend/src/server/schemas/auth.schemas.js`
- **Usado en:** `POST /api/usuarios/recover`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `email` | string (email) | si | Correo del usuario |

**Ejemplo:**

```json
{
  "email": "comprador@ejemplo.com"
}
```

## Registro (`Registro`)

> Body de POST /api/usuarios/register (crea comprador)

- **Fuente:** `backend/src/server/schemas/auth.schemas.js`
- **Usado en:** `POST /api/usuarios/register`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `email` | string (email) | si | Correo del usuario |
| `password` | string [longitud >= 8] | si | Contraseña: minimo 8 caracteres, con letra y numero |
| `nombre_completo` | string [longitud >= 2] | no | Nombre completo (opcional, min 2) |

**Ejemplo:**

```json
{
  "email": "comprador@ejemplo.com",
  "password": "Clave1234",
  "nombre_completo": "Ana Compradora"
}
```

## RestablecerPassword (`RestablecerPassword`)

> Body de POST /api/usuarios/reset-password

- **Fuente:** `backend/src/server/schemas/auth.schemas.js`
- **Usado en:** `POST /api/usuarios/reset-password`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `token` | string [longitud >= 10] | si | Token de restablecimiento recibido por correo |
| `password` | string [longitud >= 8] | si | Contraseña: minimo 8 caracteres, con letra y numero |

**Ejemplo:**

```json
{
  "token": "0123456789abcdef",
  "password": "Nueva1234"
}
```

## CuentaBancariaPlataforma (`CuentaBancariaPlataforma`)

> Body de alta/actualizacion de la cuenta bancaria de Commercity (admin + contrasena)

- **Fuente:** `backend/src/server/schemas/cuentaBancaria.schema.js`
- **Usado en:** `POST /api/admin/mi-cuenta-bancaria`, `PUT /api/admin/mi-cuenta-bancaria`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `titular_nombre` | string [longitud >= 3, longitud <= 100] | si | Nombre del titular (solo letras y espacios) |
| `banco` | string [longitud >= 3, longitud <= 50] | si | Nombre del banco |
| `tipo_cuenta` | enum: "ahorros" \| "corriente" | si | Tipo de cuenta |
| `numero_cuenta` | string [longitud >= 6, longitud <= 20] | si | Numero de cuenta (solo digitos, 6-20) |
| `password` | string [longitud >= 8, longitud <= 72] | si | Contrasena del administrador (step-up obligatorio) |

**Ejemplo:**

```json
{
  "titular_nombre": "CommerCity SAS",
  "banco": "Bancolombia",
  "tipo_cuenta": "corriente",
  "numero_cuenta": "1234567890",
  "password": "ClaveAdmin123"
}
```

## CuentaBancaria (`CuentaBancaria`)

> Body de alta/actualizacion de cuenta bancaria (vendedor y admin). RNF11: se cifra en BD.

- **Fuente:** `backend/src/server/schemas/cuentaBancaria.schema.js`
- **Usado en:** `POST /api/tienda/mi-cuenta-bancaria`, `PUT /api/tienda/mi-cuenta-bancaria`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `titular_nombre` | string [longitud >= 3, longitud <= 100] | si | Nombre del titular (solo letras y espacios) |
| `banco` | string [longitud >= 3, longitud <= 50] | si | Nombre del banco |
| `tipo_cuenta` | enum: "ahorros" \| "corriente" | si | Tipo de cuenta |
| `numero_cuenta` | string [longitud >= 6, longitud <= 20] | si | Numero de cuenta (solo digitos, 6-20) |

**Ejemplo:**

```json
{
  "titular_nombre": "Ana Compradora",
  "banco": "Bancolombia",
  "tipo_cuenta": "ahorros",
  "numero_cuenta": "1234567890"
}
```

## ActualizarPerfil (`ActualizarPerfil`)

> Body de PATCH /api/usuarios/me (actualiza unicamente el nombre)

- **Fuente:** `backend/src/server/schemas/usuarios.schema.js`
- **Usado en:** `PATCH /api/usuarios/me`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `nombre_completo` | string [longitud >= 1, longitud <= 100] | si | Nombre de perfil (obligatorio, max 100) |

**Ejemplo:**

```json
{
  "nombre_completo": "Ana Compradora"
}
```

## DirectorioQuery (`DirectorioQuery`)

> Query de GET /api/usuarios/directorio (directorio para iniciar chat)

- **Fuente:** `backend/src/server/schemas/usuarios.schema.js`
- **Usado en:** `GET /api/usuarios/directorio`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `q` | string | no | Texto a buscar en nombre o correo |

**Ejemplo:**

```json
{
  "q": "ana"
}
```

## CatalogoQuery (`CatalogoQuery`)

> Query de GET /api/productos (busqueda, filtros y paginacion)

- **Fuente:** `backend/src/server/schemas/productos.schema.js`
- **Usado en:** `GET /api/productos`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `page` | integer [min 1, max 9007199254740991] | no | Pagina, base 1 |
| `limit` | integer [min 1, max 100] | no | Registros por pagina (max 100) |
| `nombre` | string | no | Filtro por nombre |
| `categoria` | string | no | Filtro por categoria |
| `vendedor` | string | no | Filtro por vendedor |

**Ejemplo:**

```json
{
  "page": 1,
  "limit": 4,
  "nombre": "cafe",
  "categoria": "Alimentos"
}
```

## CrearProducto (`CrearProducto`)

> Body de POST /api/productos (vendedor; imagen multipart obligatoria, RF45/RF46/RF48)

- **Fuente:** `backend/src/server/schemas/productos.schema.js`
- **Usado en:** `POST /api/productos`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `nombre` | string [longitud >= 1] | si | Nombre del producto |
| `descripcion` | string [longitud >= 1] | si | Descripcion |
| `precio` | number [> 0] | si | Precio publicado (ya incluye IVA 19%, RF48) |
| `stock` | integer [min 0, max 9007199254740991] | si | Stock disponible (entero >= 0) |
| `descuento` | number [min 0, max 100] | no | Descuento porcentual (opcional) |
| `categoria` | string [longitud >= 1] | si | Categoria (se crea si no existe) |

**Ejemplo:**

```json
{
  "nombre": "Cafe especial",
  "descripcion": "Libra de cafe de origen",
  "precio": 25000,
  "stock": 10,
  "categoria": "Alimentos"
}
```

## EditarProducto (`EditarProducto`)

> Body de PUT /api/productos/:id (edicion parcial del vendedor)

- **Fuente:** `backend/src/server/schemas/productos.schema.js`
- **Usado en:** `PUT /api/productos/{id}`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `nombre` | string [longitud >= 1] | no | Nombre del producto |
| `descripcion` | string [longitud >= 1] | no | Descripcion |
| `precio` | number [> 0] | no | Precio publicado (ya incluye IVA 19%, RF48) |
| `stock` | integer [min 0, max 9007199254740991] | no | Stock disponible (entero >= 0) |
| `descuento` | number [min 0, max 100] | no | Descuento porcentual 0-100 |
| `categoria` | string [longitud >= 1] | no | Categoria |

**Ejemplo:**

```json
{
  "precio": 27000,
  "stock": 8
}
```

## ProductoIdParams (`ProductoIdParams`)

> Params de GET /api/productos/:id y /:id/validar-stock

- **Fuente:** `backend/src/server/schemas/productos.schema.js`
- **Usado en:** `GET /api/productos/{id}/validar-stock`, `GET /api/productos/{id}`, `PUT /api/productos/{id}`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `id` | integer [max 9007199254740991, > 0] | si | Identificador entero positivo de ruta o cuerpo |

**Ejemplo:**

```json
{
  "id": 5
}
```

## ValidarStock (`ValidarStock`)

> Cantidad de GET /api/productos/:id/validar-stock (RF86)

- **Fuente:** `backend/src/server/schemas/productos.schema.js`
- **Usado en:** `GET /api/productos/{id}/validar-stock`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `cantidad` | integer [max 9007199254740991, > 0] | si | Cantidad a validar contra el stock |

**Ejemplo:**

```json
{
  "cantidad": 2
}
```

## ConfirmarPago (`ConfirmarPago`)

> Body de POST /api/pedidos/confirmar-pago (checkout ACID RF134)

- **Fuente:** `backend/src/server/schemas/pedidos.schema.js`
- **Usado en:** `POST /api/pedidos/confirmar-pago`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `direccion_envio` | string [longitud >= 5, longitud <= 1000] | si | Direccion de envio (5-1000) |
| `metodo_pago` | enum: "tarjeta" \| "transferencia" \| "pse" | si | Metodo de pago simulado |
| `numero_tarjeta` | string | no | Requerido si metodo_pago=tarjeta (se valida Luhn, RF118) |
| `nombre_tarjeta` | string [longitud <= 100] | no | Nombre en la tarjeta |

**Ejemplo:**

```json
{
  "direccion_envio": "Calle 10 #20-30, Medellin",
  "metodo_pago": "tarjeta",
  "numero_tarjeta": "4111111111111111",
  "nombre_tarjeta": "Ana Compradora"
}
```

## ActualizarEstadoPedido (`ActualizarEstadoPedido`)

> Body de PATCH /api/pedidos/:id/estado (vendedor avanza nivel; comprador cancela RF35)

- **Fuente:** `backend/src/server/schemas/pedidos.schema.js`
- **Usado en:** `PATCH /api/pedidos/{id}/estado`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `estado` | enum: "En camino" \| "Entregado" \| "Cancelado" | si | Transicion de estado solicitada |
| `detalle_id` | integer [max 9007199254740991, > 0] | no | Linea a cancelar (solo con estado=Cancelado) |

**Ejemplo:**

```json
{
  "estado": "En camino"
}
```

## AgregarAlCarrito (`AgregarAlCarrito`)

> Body de POST /api/carrito/ (upsert atomico, valida stock)

- **Fuente:** `backend/src/server/schemas/carrito.schema.js`
- **Usado en:** `POST /api/carrito/`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `producto_id` | integer [max 9007199254740991, > 0] | si | Producto a agregar |
| `cantidad` | integer [max 9007199254740991, > 0] | no | Cantidad (default 1) |

**Ejemplo:**

```json
{
  "producto_id": 5,
  "cantidad": 2
}
```

## CarritoProductoParams (`CarritoProductoParams`)

> Params de DELETE/PATCH /api/carrito/:productoId

- **Fuente:** `backend/src/server/schemas/carrito.schema.js`
- **Usado en:** `DELETE /api/carrito/{productoId}`, `PATCH /api/carrito/{productoId}`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `productoId` | integer [max 9007199254740991, > 0] | si | Identificador entero positivo de ruta o cuerpo |

**Ejemplo:**

```json
{
  "productoId": 5
}
```

## ModificarCantidadCarrito (`ModificarCantidadCarrito`)

> Body de PATCH /api/carrito/:productoId

- **Fuente:** `backend/src/server/schemas/carrito.schema.js`
- **Usado en:** `PATCH /api/carrito/{productoId}`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `cantidad` | integer [max 9007199254740991, > 0] | si | Nueva cantidad (valida stock) |

**Ejemplo:**

```json
{
  "cantidad": 3
}
```

## HistorialIngresosQuery (`HistorialIngresosQuery`)

> Query de GET /api/tienda/ingresos (ingresos 90/10 agrupados)

- **Fuente:** `backend/src/server/schemas/tienda.schema.js`
- **Usado en:** `GET /api/tienda/ingresos`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `fecha_desde` | string | no | Fecha inicial (YYYY-MM-DD) |
| `fecha_hasta` | string | no | Fecha final (YYYY-MM-DD) |
| `agrupar_por` | enum: "transaccion" \| "dia" | no | Agrupacion de ingresos (default transaccion) |
| `pagina` | integer [min -9007199254740991, max 9007199254740991] | no | Pagina base 1 (alias: page) |
| `por_pagina` | integer [min -9007199254740991, max 9007199254740991] | no | Registros por pagina, max 100 (alias: limit) |

**Ejemplo:**

```json
{
  "agrupar_por": "dia",
  "pagina": 1,
  "por_pagina": 10
}
```

## HistorialVentasQuery (`HistorialVentasQuery`)

> Query de GET /api/tienda/ventas (filtros + paginacion del vendedor)

- **Fuente:** `backend/src/server/schemas/tienda.schema.js`
- **Usado en:** `GET /api/tienda/ventas`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `estado` | enum: "Pendiente" \| "En camino" \| "Entregado" \| "Cancelado" | no | Filtra por estado (otro valor = sin filtro) |
| `fecha_desde` | string | no | Fecha inicial (YYYY-MM-DD) |
| `fecha_hasta` | string | no | Fecha final (YYYY-MM-DD) |
| `q` | string | no | Busca en producto, comprador o referencia de pago |
| `pagina` | integer [min -9007199254740991, max 9007199254740991] | no | Pagina base 1 (alias: page) |
| `por_pagina` | integer [min -9007199254740991, max 9007199254740991] | no | Registros por pagina, max 100 (alias: limit) |

**Ejemplo:**

```json
{
  "estado": "Pendiente",
  "pagina": 1,
  "por_pagina": 10
}
```

## HistorialComprasQuery (`HistorialComprasQuery`)

> Query de GET /api/historial/compras (filtro opcional por estado RF30)

- **Fuente:** `backend/src/server/schemas/compras.schema.js`
- **Usado en:** `GET /api/historial/compras`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `estado` | enum: "Pendiente" \| "En camino" \| "Entregado" \| "Cancelado" | no | Filtra lineas por estado (otro valor = sin filtro) |

**Ejemplo:**

```json
{
  "estado": "Pendiente"
}
```

## ConversacionParams (`ConversacionParams`)

> Params de GET /api/chat/mensajes/:usuarioId (historial con otro usuario)

- **Fuente:** `backend/src/server/schemas/chat.schema.js`
- **Usado en:** `GET /api/chat/mensajes/{usuarioId}`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `usuarioId` | integer [max 9007199254740991, > 0] | si | Identificador entero positivo de ruta o cuerpo |

**Ejemplo:**

```json
{
  "usuarioId": 7
}
```

## ConversacionQuery (`ConversacionQuery`)

> Query de GET /api/chat/mensajes/:usuarioId (paginado)

- **Fuente:** `backend/src/server/schemas/chat.schema.js`
- **Usado en:** `GET /api/chat/mensajes/{usuarioId}`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `pagina` | integer [max 9007199254740991, > 0] | no | Pagina (default 1) |
| `por_pagina` | integer [max 100, > 0] | no | Mensajes por pagina (default 50, max 100) |

**Ejemplo:**

```json
{
  "pagina": 1,
  "por_pagina": 50
}
```

## EnviarMensaje (`EnviarMensaje`)

> Body de POST /api/chat/ (solo texto; el multipart se rechaza con 400)

- **Fuente:** `backend/src/server/schemas/chat.schema.js`
- **Usado en:** `POST /api/chat/`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `receptor_id` | integer [max 9007199254740991, > 0] | si | Destinatario (distinto del usuario autenticado) |
| `mensaje` | string [longitud >= 1, longitud <= 2000] | si | Texto del mensaje (1-2000) |

**Ejemplo:**

```json
{
  "receptor_id": 7,
  "mensaje": "Hola, sigue disponible?"
}
```

## MensajeIdParams (`MensajeIdParams`)

> Params de PATCH /api/chat/mensajes/:id/leido (marca mensaje recibido como leido)

- **Fuente:** `backend/src/server/schemas/chat.schema.js`
- **Usado en:** `PATCH /api/chat/mensajes/{id}/leido`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `id` | integer [max 9007199254740991, > 0] | si | Identificador entero positivo de ruta o cuerpo |

**Ejemplo:**

```json
{
  "id": 15
}
```

## ListarNotificacionesQuery (`ListarNotificacionesQuery`)

> Query de GET /api/notificaciones/ (tipo y limite opcionales)

- **Fuente:** `backend/src/server/schemas/notificaciones.schema.js`
- **Usado en:** `GET /api/notificaciones/`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `tipo` | enum: "compra" \| "pedido enviado" \| "en camino" \| "entregado" \| "devolucion" \| "mensajes" \| "reporte" | no | Filtra por tipo de notificacion |
| `limite` | integer [min 1, max 50] | no | Maximo de registros (default 50) |

**Ejemplo:**

```json
{
  "tipo": "mensajes",
  "limite": 20
}
```

## CalificacionVendedor (`CalificacionVendedor`)

> Body de POST /api/calificaciones/vendedor (RF107: calificar tras comprar)

- **Fuente:** `backend/src/server/schemas/calificaciones.schema.js`
- **Usado en:** `POST /api/calificaciones/vendedor`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `pedido_id` | integer [max 9007199254740991, > 0] | si | Pedido comprado por el usuario autenticado |
| `vendedor_id` | integer [max 9007199254740991, > 0] | si | Vendedor a calificar (con linea no cancelada en el pedido) |
| `estrellas` | integer [min 1, max 5] | si | Calificacion de 1 a 5 estrellas |
| `comentario` | string [longitud <= 500] | no | Comentario opcional (max 500) |

**Ejemplo:**

```json
{
  "pedido_id": 10,
  "vendedor_id": 4,
  "estrellas": 5,
  "comentario": "Excelente vendedor"
}
```

## SeguirUsuario (`SeguirUsuario`)

> Body de POST /api/seguidores/ (seguir a un usuario)

- **Fuente:** `backend/src/server/schemas/seguidores.schema.js`
- **Usado en:** `POST /api/seguidores/`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `seguido_id` | integer [max 9007199254740991, > 0] | si | Usuario a seguir (distinto del autenticado) |

**Ejemplo:**

```json
{
  "seguido_id": 7
}
```

## CrearReporte (`CrearReporte`)

> Body de POST /api/reportes/ (multipart: evidencia opcional; informante del JWT)

- **Fuente:** `backend/src/server/schemas/reportes.schema.js`
- **Usado en:** `POST /api/reportes/`

Union discriminada con 2 variantes (ver `openapi.json#/components/schemas/CrearReporte`).

**Ejemplo:**

```json
{
  "tipo": "Producto",
  "motivo": "Producto falsificado",
  "producto_id": 9
}
```

## AdminProductosQuery (`AdminProductosQuery`)

> Query de GET /api/admin/productos (RF68/RF72)

- **Fuente:** `backend/src/server/schemas/admin.schema.js`
- **Usado en:** `GET /api/admin/productos`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `q` | string | no | Busca por producto o vendedor |
| `soloActivos` | string | no | "true" para excluir suspendidos |

**Ejemplo:**

```json
{
  "q": "cafe",
  "soloActivos": "true"
}
```

## AdminReportesQuery (`AdminReportesQuery`)

> Query de GET /api/admin/reportes (RF60-RF66)

- **Fuente:** `backend/src/server/schemas/admin.schema.js`
- **Usado en:** `GET /api/admin/reportes`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `q` | string | no | Texto a buscar |
| `estado` | enum: "pendiente" \| "resuelto" | no | Filtra por estado |
| `incluir_archivados` | string | no | Valores que incluyen archivados: "1", "true", "si" |

**Ejemplo:**

```json
{
  "estado": "pendiente"
}
```

## AdminUsuariosQuery (`AdminUsuariosQuery`)

> Query de GET /api/admin/usuarios (RF67/RF73/RF74)

- **Fuente:** `backend/src/server/schemas/admin.schema.js`
- **Usado en:** `GET /api/admin/usuarios`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `q` | string | no | Busca por nombre o correo |

**Ejemplo:**

```json
{
  "q": "ana"
}
```

## BusquedaAdminQuery (`BusquedaAdminQuery`)

> Query de GET /api/admin/busqueda (buscador unificado, limite 20 por tipo)

- **Fuente:** `backend/src/server/schemas/admin.schema.js`
- **Usado en:** `GET /api/admin/busqueda`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `q` | string | si | Texto a buscar (vacio = listas vacias) |
| `scope` | enum: "all" \| "usuario" \| "producto" | no | Alcance de la busqueda |

**Ejemplo:**

```json
{
  "q": "cafe",
  "scope": "all"
}
```

## CambiarEstadoUsuario (`CambiarEstadoUsuario`)

> Body de PATCH /api/admin/usuarios/:id/estado (banear/suspender/reactivar)

- **Fuente:** `backend/src/server/schemas/admin.schema.js`
- **Usado en:** `PATCH /api/admin/usuarios/{id}/estado`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `estado` | enum: "activo" \| "baneado" | si | Nuevo estado del usuario |

**Ejemplo:**

```json
{
  "estado": "baneado"
}
```

## ResolverReporte (`ResolverReporte`)

> Body de PATCH /api/admin/reportes/:id/resolver

- **Fuente:** `backend/src/server/schemas/admin.schema.js`
- **Usado en:** `PATCH /api/admin/reportes/{id}/resolver`

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `respuesta` | string [longitud >= 1, longitud <= 2000] | si | Respuesta de resolucion del admin (max 2000) |

**Ejemplo:**

```json
{
  "respuesta": "Contenido retirado tras revision"
}
```

