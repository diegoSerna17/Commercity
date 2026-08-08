# AUDITORIA COMPLETA DEL PROYECTO COMMERCITY - ANALISIS PROFUNDO DE REQUERIMIENTOS

**Autor:** Daniel Palacios (Lider backend web)
**Fecha:** 2026-08-07
**Version informe:** 3.7
**Ubicacion:** `LAST VERSION/` (unica carpeta oficial de insumos)
**Dirigido a:** Director CommerCity y lideres de area (BD, Frontend, Backend, Movil, Escritorio)

***

## 1. De donde salio esta auditoria

Para armar este informe tome como unica fuente la carpeta `LAST VERSION`, que
quedo como el lugar oficial donde estan las versiones finales del proyecto.
Revise los tres archivos de punta a punta:

| Archivo | Contenido | Como lo revise |
| --- | --- | --- |
| `Commercity (optimizado).docx` | Requerimientos oficiales (portada Version 2.0): RF1-RF133 + RNF1-RNF19 | Lo converti a .md y lo lei completo |
| `schema_commercity_3.sql` | Esquema BD v3: 19 tablas + seeders de roles | Lo lei completo (DDL) |
| `seed_commercity.sql` | Semilla re-ejecutable (18 secciones de datos) | Lo lei completo |

Ademas cruce todo contra el codigo real del backend que ya esta integrado
(autenticacion, carrito y perfil publico) para no hablar solo de teoria.

**Como leer las tablas:** `OK` = ya esta soportado / `PARCIAL` = soportado a
medias / `PEND` = todavia no hay soporte / `BLOQUEADO` = depende de aplicar una
migracion o decision que YA esta definida en este informe (en cuanto se aplica,
pasa a PARCIAL) / `N/A` = no necesita base de datos o es un tema de frontend
puro. Cuando la columna Backend dice "Pendiente (integrante)" pero el Estado es
OK, significa que la BD ya soporta el RF y solo falta el endpoint del modulo;
no hay brecha de datos.

***

## 2. Analisis de los requerimientos funcionales (RF1-RF133)

Recorri los 133 requerimientos uno por uno y los puse frente al esquema v3 para
ver que tan listos estamos. Este es el detalle por modulo.

### 2.1 Gestion de usuarios (RF1-RF42)

| RF | Requerimiento (resumen) | BD schema v3 | Backend | Estado |
| --- | --- | --- | --- | --- |
| RF1 | Registro por correo | `usuarios.email` UNIQUE | Diego (register) | OK |
| RF2 | Iniciar/cerrar sesion | `usuarios` + JWT | Diego (login/logout) | OK |
| RF3 | Recuperar cuenta por correo | `usuarios.token_recuperacion` | Diego (recover) | OK |
| RF4 | Link de un solo uso, expira 5 min | Falta `token_recuperacion_expiracion` | Diego (falta validar expiracion) | PARCIAL |
| RF5 | Terminos y condiciones | N/A (frontend) | - | N/A |
| RF7 | Roles comprador/vendedor/admin | `roles` + `usuario_roles` | Diego (requireRoles) | OK |
| RF8 | Rol comprador por defecto | seed roles | Diego (register) | OK |
| RF9 | Admin solo supervisa | Regla RBAC | Requiere `requireRoles(["administrador"])` | PARCIAL |
| RF10 | Vendedores compran y venden | `usuario_roles` multi-rol | OK (multi-rol) | OK |
| RF11 | Perfil personal | `usuarios` | Diego (getPerfil) | OK |
| RF12 | Perfil de vendedor | `usuarios` + `productos` | Pendiente (Yepes) | PEND |
| RF13 | Panel admin | `usuarios` + reportes/productos | Pendiente (Cabrera) | PEND |
| RF14/RF15 | Anadir/editar foto de perfil | `usuarios.foto_perfil` | Diego (getPerfil) - falta update | PARCIAL |
| RF16/RF17 | Anadir/editar descripcion | `usuarios.descripcion_personal` | Diego - falta update | PARCIAL |
| RF18-RF21 | Seguidores / seguidos / listas | `seguidores` (seguidor_id, seguido_id) | Pendiente | PEND |
| RF22/RF23 | Mi feed (scroll productos) | `productos` | Pendiente (Brandon) | PEND |
| RF24 | Carrito en sidebar | `carrito_items` | Yo (carrito) | OK |
| RF25 | Campana de notificaciones | `notificaciones` | Pendiente | PEND |
| RF26 | Historial en sidebar | `pedidos`/`detalle_pedidos` | Pendiente (Jary) | PEND |
| RF27 | Visualizar comprados | `detalle_pedidos` | Pendiente (Jary) | PEND |
| RF28 | Estado de pedidos | `detalle_pedidos.estado_envio` | Pendiente (Jary) | PARCIAL |
| RF29 | Estados Pendiente/En camino/Entregado | ENUM v3 OK | - | OK |
| RF30 | Filtrar pedidos | `detalle_pedidos.estado_envio` | Pendiente (Jary) | PARCIAL |
| RF31 | Datos del pedido | `detalle_pedidos` (falta imagen, ver RF120) | Pendiente (Jary) | PARCIAL |
| RF32 | Resumen de comprados | `pedidos` + `detalle_pedidos` | Pendiente (Jary) | PARCIAL |
| RF33 | Chat | `mensajes_chat` | Pendiente | PEND |
| RF34-RF37 | Ajustes / datos / direccion | `usuarios` | Diego - falta update | PARCIAL |
| RF39 | Cerrar sesion | N/A (JWT stateless) | Diego (logout) | OK |
| RF40 | Comprador elimina su cuenta | `usuarios.activo` (borrado logico) | Falta regla (suspension) | PARCIAL |
| RF41 | Vendedor: borrar datos menos historiales | CONFLICTO: CASCADE borra productos/calificaciones | Falta regla | PEND |
| RF42 | Pasarse de comprador a vendedor | `usuario_roles` | Diego (cambiarRol) | OK |

### 2.2 Perfil vendedor (RF43-RF54)

| RF | Requerimiento | BD schema v3 | Backend | Estado |
| --- | --- | --- | --- | --- |
| RF43 | Vendedor tiene funciones de comprador | Multi-rol | OK | OK |
| RF44 | Funcionalidades adicionales | `productos`/`pedidos` | Pendiente (Yepes) | PEND |
| RF45 | Agregar producto | `productos.vendedor_id` | Pendiente (Perea/Yepes) | PARCIAL |
| RF46 | Formulario (nombre, desc, imagen, stock, descuento, estado, precio, categoria, fecha) | Todas las columnas existen; `estado` es GENERADO (no se inserta) | Pendiente | OK |
| RF47 | **Vendedor calcula IVA 19%** | CONFLICTO con RF132 (precio CON IVA incluido) | Pendiente | PARCIAL (decision B-R1) |
| RF48 | Guardar producto | `productos` | Pendiente | PARCIAL |
| RF49 | Editar producto (reutilizar formulario) | `productos` | Pendiente | PARCIAL |
| RF50 | Ver calificaciones 1-5 | `calificaciones_vendedores` | Pendiente | PEND |
| RF51 | Acceso a mi tienda | `productos`/`datos_bancarios` | Pendiente (Erick) | PEND |
| RF52 | Acceso a pedidos | `detalle_pedidos` | Pendiente (Vidal) | PEND |
| RF53 | Productos publicados en su perfil | `productos` | Pendiente | PEND |
| RF54 | Mis productos (gestion) | `productos` | Pendiente | PEND |

### 2.3 Panel administrativo (RF55-RF77)

| RF | Requerimiento | BD schema v3 | Backend | Estado |
| --- | --- | --- | --- | --- |
| RF55 | Estadisticas | `productos`/`usuarios`/`pedidos` (COUNT) | Pendiente (Cabrera) | OK |
| RF56 | Historial ingresos 10% CommerCity | `detalle_pedidos.monto_comision` (GENERADA 0.10) | Pendiente (Cabrera) | OK |
| RF57-RF59 | Conteos compradores/vendedores/productos | COUNT con roles | Pendiente (Cabrera) | OK |
| RF60 | Seccion de reportes | `reportes` | Pendiente (Mosquera) | OK |
| RF61/RF62 | Visualizar reportes de usuarios | `reportes.tipo_reporte='Usuario'` | Pendiente (Mosquera) | OK |
| RF63 | Datos reporte usuario (tipo, estado, fecha, reportado, reportante, motivo, evidencia, respuesta) | `reportes` completa | Pendiente | OK |
| RF64 | Reportes de productos | `reportes.tipo_reporte='Producto'` | Pendiente (Mosquera) | OK |
| RF65 | Datos reporte producto | `reportes` completa | Pendiente | OK |
| RF66 | Responder reportes | `reportes.respuesta_admin`/`respondido_at` | Pendiente | OK |
| RF67 | Gestionar usuarios | `usuarios.activo` | Pendiente (Cabrera) | PARCIAL |
| RF68 | Gestionar productos | `productos.eliminado_por_admin` | Pendiente (Cabrera) | PARCIAL |
| RF69-RF71 | Buscador admin (usuarios/productos) | Falta indice FULLTEXT | Pendiente | PARCIAL |
| RF72 | Admin elimina productos publicados | `productos.eliminado_por_admin` (existe) - falta regla si hay reportes/compras en curso | Pendiente | PARCIAL |
| RF73 | Admin Banear/Activar/Eliminar usuarios | `usuarios.activo` | Pendiente (Cabrera) | PARCIAL |
| RF74 | Baneo suspende productos y cuenta | Falta regla/estado de suspension por baneo | Pendiente | PEND |
| RF75 | Ajustes admin | N/A | Pendiente | N/A |
| RF76 | Cuenta bancaria de Commercity | `datos_bancarios.es_commercity=1` (seed) | Pendiente | OK |
| RF77 | Cerrar sesion admin | N/A | Pendiente | N/A |

### 2.4 Productos (RF78-RF86)

| RF | Requerimiento | BD schema v3 | Backend | Estado |
| --- | --- | --- | --- | --- |
| RF78 | Detalle de producto (clic) | `productos` | Pendiente (Perea) | OK |
| RF79 | Info completa (nombre, imagen, desc, precio, descuento, stock, estado, categoria) | Todas las columnas | Pendiente | OK |
| RF80 | Cantidad no supere stock | `productos.stock` (backend valida) | Pendiente | PARCIAL |
| RF81 | Agregar al carrito | `carrito_items` | Yo (carrito) | OK |
| RF82 | Reportar producto | `reportes.tipo_reporte='Producto'` | Pendiente | OK |
| RF83 | Formulario reporte (motivo, evidencia) | `reportes.motivo`/`evidencia_url` | Pendiente | OK |
| RF84 | Calificar vendedor tras pago | `calificaciones_vendedores` | Pendiente | OK |
| RF85 | Deshabilitar si agotado | `productos.estado` GENERADO | Pendiente | OK |
| RF86 | Productos en panel y perfil vendedor | `productos` | Pendiente | OK |

### 2.5 Panel principal (RF87-RF94)

| RF | Requerimiento | BD schema v3 | Backend | Estado |
| --- | --- | --- | --- | --- |
| RF87 | Panel principal con productos | `productos` (estado Disponible) | Pendiente (Brandon) | OK |
| RF88 | Buscar por nombre, categoria o vendedor | Falta FULLTEXT/indices | Pendiente (Brandon) | PARCIAL |
| RF89 | Filtrar por categorias | `categorias` + `productos.categoria_id` | Pendiente | OK |
| RF90 | Topbar a perfil | N/A | N/A | N/A |
| RF91 | Sidebar al carrito | N/A | N/A | N/A |
| RF92-RF94 | Tarjetas, info resumida, clic a detalle | `productos` | Pendiente | OK |

### 2.6 Notificaciones (RF95-RF100)

| RF | Requerimiento | BD schema v3 | Backend | Estado |
| --- | --- | --- | --- | --- |
| RF95 | Acceso desde campana | `notificaciones.usuario_id` | Pendiente | OK |
| RF96 | Lista recientes (mas reciente primero) | `notificaciones.fecha_hora` | Pendiente | OK |
| RF97 | Tipo (compra, mensajes, reporte, pedido, en camino, entregado) + descripcion + fecha | **CRITICA**: ENUM v3 NO contiene 'pedido enviado' que usa la semilla; BD real VARCHAR(50); estado con mojibake | Pendiente | **BLOQUEADO** |
| RF98 | Eliminar individual/masiva | `notificaciones` | Pendiente | OK |
| RF99 | Clic redirige | `notificaciones.url_redireccion` | Pendiente | OK |
| RF100 | Indicador de nuevas | COUNT estado 'no leido' | Pendiente | OK |

### 2.7 Interaccion comprador-vendedor (RF101-RF106)

| RF | Requerimiento | BD schema v3 | Backend | Estado |
| --- | --- | --- | --- | --- |
| RF101 | Chat con mensajes, fotos y archivos | `mensajes_chat.tipo_mensaje` + `archivo_url` | Pendiente | OK |
| RF102 | Seguir/dejar de seguir | `seguidores` | Pendiente | OK |
| RF103 | Calificar vendedor 1-5 | `calificaciones_vendedores` | Pendiente | OK |
| RF104 | Reportar por chat | `reportes.tipo_reporte='Usuario'` | Pendiente | OK |
| RF105 | Campos reporte usuario (motivo, evidencia) | `reportes.motivo`/`evidencia_url` | Pendiente | OK |
| RF106 | Perfil publico de vendedores y compradores | `usuarios` | Cristian (integrado) | OK |

### 2.8 Compra / carrito (RF107-RF118)

| RF | Requerimiento | BD schema v3 | Backend | Estado |
| --- | --- | --- | --- | --- |
| RF107 | Agregar al carrito | `carrito_items` | Yo (integrado) | OK |
| RF108 | Visualizar carrito | `carrito_items` | Yo (integrado) | OK |
| RF109 | Eliminar del carrito | `carrito_items` | Yo (integrado) | OK |
| RF110 | Modificar cantidad | `carrito_items.cantidad` | Yo (integrado) | OK |
| RF111 | Generar pedido desde carrito | `pedidos` + `detalle_pedidos` | Pendiente (Vidal) | PARCIAL |
| RF112 | Multi-vendedor en un pedido | `detalle_pedidos.vendedor_id` | Pendiente (Vidal) | OK |
| RF113 | Resumen (cantidad, precio, descuento, envio gratis, total) | `detalle_pedidos.subtotal`/`descuento_aplicado` | Pendiente | OK |
| RF114 | Simular pago | `pagos_simulados` - DEFAULT 'Aprobado' debe ser 'Pendiente' | Pendiente (Vidal) | PARCIAL |
| RF115 | Mostrar subtotal y IVA 19% | Calculado en vuelo (sin columna) | Pendiente (Vidal) | PARCIAL |
| RF116 | **Registrar IVA de cada producto para almacenamiento** | CONFLICTO con RF132; sin columnas | Pendiente | PARCIAL (decision B-R2) |
| RF117 | Datos tarjeta (numero, nombre) | `pagos_simulados.metodo_pago` | Pendiente | OK |
| RF118 | Mostrar total del pedido | `pedidos.total_neto` | Pendiente | OK |

### 2.9 Pedidos del vendedor (RF119-RF122)

| RF | Requerimiento | BD schema v3 | Backend | Estado |
| --- | --- | --- | --- | --- |
| RF119 | Acceso a pedidos | `detalle_pedidos.vendedor_id` | Pendiente (Vidal) | OK |
| RF120 | Info minima + **imagen del producto** | **Falta `imagen_url` en `detalle_pedidos`** (snapshot) | Pendiente (Vidal) | PARCIAL |
| RF121 | Actualizar estado por pedido | `detalle_pedidos.estado_envio` | Pendiente (Vidal) | OK |
| RF122 | Historial y filtros de pedidos | `estado_envio` | Pendiente | OK |

### 2.10 Mi tienda / finanzas (RF123-RF131)

| RF | Requerimiento | BD schema v3 | Backend | Estado |
| --- | --- | --- | --- | --- |
| RF123 | Seccion mi tienda | `datos_bancarios`/`productos` | Pendiente (Erick) | PEND |
| RF124 | Registrar cuenta bancaria | `datos_bancarios` | Pendiente (Erick) | OK |
| RF125 | Datos: titular, banco, tipo, numero | `titular_nombre`+`banco`+`tipo_cuenta`+`numero_cuenta` | Pendiente | OK |
| RF126 | Actualizar cuenta bancaria | `datos_bancarios` | Pendiente | OK |
| RF127 | Estadisticas del vendedor | COUNT `detalle_pedidos` | Pendiente (Erick) | OK |
| RF128 | Historial de ventas | `detalle_pedidos` | Pendiente | OK |
| RF129 | Dinero recaudado | `detalle_pedidos.monto_vendedor` (GENERADA) | Pendiente | OK |
| RF130 | No exponer cuenta bancaria | Backend no expone `datos_bancarios` | Pendiente | OK |
| RF131 | Ingresos 90% por transaccion | `monto_vendedor = subtotal*0.90` | Pendiente | OK |

### 2.11 Ganancias / IVA (RF132-RF133)

| RF | Requerimiento | BD schema v3 | Backend | Estado |
| --- | --- | --- | --- | --- |
| RF132 | Pasarela: 19% IVA del precio base -> subtotal -> 90% vendedor / 10% CommerCity | `detalle_pedidos.monto_vendedor`/`monto_comision` (0.90/0.10 sobre subtotal) | Pendiente (Vidal) | PARCIAL (decisiones B-R1/B-R2 cerradas) |
| RF133 | Moneda colombiana COP | `DECIMAL(12,2)` en precios | OK | OK |

***

## 3. Analisis de los requerimientos no funcionales (RNF1-RNF19)

Los no funcionales tambien los revise. La mayoria de los de frontend son temas
visuales que no bloquean, y los de backend ya tienen base, aunque hay un par de
huecos que anote.

| RNF | Requerimiento | Area | Soporte actual | Estado |
| --- | --- | --- | --- | --- |
| RNF1 | Interfaz intuitiva | Frontend | - | N/A (FE) |
| RNF2 | Mensajes claros ante errores | Frontend/Backend | Contrato `{success, message}` (Diego) vs `{success, data/error}` (acordado) | PARCIAL |
| RNF3 | Consistencia visual | Frontend | - | N/A (FE) |
| RNF4 | Navegacion sencilla | Frontend | - | N/A (FE) |
| RNF5 | Carga < 2s | Backend | Pool mysql2 (10 conexiones) | OK (por validar) |
| RNF6 | Multiples usuarios simultaneos | Backend | Pool + transacciones pendientes (ACID) | PARCIAL |
| RNF7 | Optimizar imagenes | Frontend | - | N/A (FE) |
| RNF8 | Cifrado de contrasenas | Backend | bcrypt (10 rounds) - Diego | OK |
| RNF9 | Solo autenticados segun rol | Backend | JWT + requireRoles - Diego | OK |
| RNF10 | Validar datos (evitar entradas invalidas) | Backend | Falta Zod (validacion manual) | PARCIAL |
| RNF11 | Proteger datos sensibles | Backend | No exponer email en perfil publico (Cristian); cuenta bancaria nunca se expone | PARCIAL |
| RNF12 | Disponible mientras servidor activo | DevOps | - | N/A |
| RNF13 | Consistencia y validez de datos | BD | FK + UNIQUE + CHECK | OK (falta ACID en compra) |
| RNF14 | Evitar duplicacion | BD | UNIQUE en email, referencia_pago, uq_comprador_producto, uq_pedido | OK |
| RNF15 | Responsive | Frontend | - | N/A (FE) |
| RNF16 | Compatibilidad navegadores | Frontend | - | N/A (FE) |
| RNF17 | Estructura modular | Backend | routes/ + controllers/ por modulo | OK |
| RNF18 | Codigo legible | Backend | Convenciones JS | OK |
| RNF19 | Nuevas funcionalidades sin afectar existentes | Backend | Modularidad | OK |

***

## 4. Brechas que hay que cerrar

Aqui va lo que realmente hay que hacer. Lo dividi en decisiones de
requerimientos, cosas de la base de datos, la semilla, el backend y el frontend.

### 4.1 Conflictos de requerimientos (decisiones definitivas)

Estos son los puntos que traian choques entre si. Ya los deje definidos como
deben quedar, listos para implementar:

| # | Brecha | Impacto | Decision definitiva |
| --- | --- | --- | --- |
| B-R1 | RF47 "vendedor calcula IVA" vs RF132 "precio con IVA incluido" | Confusion al publicar productos | **RF47 queda asi**: "el vendedor publica el precio final con IVA 19% incluido; el sistema desglosa el IVA en la pasarela". El vendedor NO calcula ni suma nada. El backend guarda `productos.precio` tal cual y nunca le aplica IVA. |
| B-R2 | RF116 "almacenar IVA por producto" vs RF132 "desglose en vuelo" | Bloquea el modulo de checkout | **NO se almacena IVA por producto**. Se mantiene RF132: en la pasarela se calcula en vuelo `subtotal = precio / 1.19` e `IVA = subtotal * 0.19`; comisiones 90/10 sobre el subtotal. El RF116 se alinea a RF132. Sin columnas nuevas. |
| B-R3 | RF72/RF73/RF74: eliminar/banear sin regla para productos con reportes o compras en curso | Perdida de datos o pedidos rotos | **Los productos nunca se eliminan fisicamente**: se suspenden con `eliminado_por_admin = 1` y quedan fuera de catalogo y carrito. Un producto con reporte pendiente NO se suspende por el reporte; solo el admin decide. Reportes, pedidos y calificaciones se conservan. |
| B-R4 | RF41: eliminar cuenta del vendedor sin definir destino de sus productos | CASCADE borra productos/calificaciones y rompe el historial | **Eliminar cuenta = desactivacion logica**: `usuarios.activo = 0` + suspension automatica de todos sus productos (`eliminado_por_admin = 1`). Se conservan pedidos, pagos, comisiones, reportes e historial. Prohibido DELETE fisico del usuario. |
| B-R5 | RF74: que pasa con los pedidos pagados de un vendedor baneado | Indeterminado | **Al banear a un vendedor**: (1) sus productos se suspenden de inmediato; (2) los pedidos YA PAGADOS en curso se completan (envio y desembolso incluidos); (3) los pedidos en "Pendiente" se cancelan con restitucion de stock al comprador. El admin no interviene pedido a pedido. |

### 4.2 Lo que falta en la base de datos (migraciones listas)

Un solo bloque SQL: se copia completo y se guarda como `003_auditoria_v2.sql`.

```sql
-- ============================================================
-- MIGRACIONES AUDITORIA v2 - commercity_v2 (003_auditoria_v2.sql)
-- Ejecutar: mysql -u <usuario> -p --default-character-set=utf8mb4 commercity_v2 < 003_auditoria_v2.sql
-- ANTES de M2: si notificaciones tiene el estado corrupto (le├¡do), ejecutar: DELETE FROM notificaciones;
-- ============================================================

-- M1: notificaciones.tipo pasa a VARCHAR(50) (refleja el cambio ya aplicado en la BD real)
ALTER TABLE notificaciones MODIFY COLUMN tipo VARCHAR(50) NOT NULL;

-- M2: corregir el mojibake de notificaciones.estado
ALTER TABLE notificaciones MODIFY COLUMN estado ENUM('leido','no leido') NULL;

-- M3: expiracion del link de recuperacion (RF4)
ALTER TABLE usuarios ADD COLUMN token_recuperacion_expiracion DATETIME NULL;

-- M4: imagen del producto en el detalle (RF120) - snapshot al comprar
ALTER TABLE detalle_pedidos ADD COLUMN imagen_url VARCHAR(500) NULL;

-- M5: el pago nace Pendiente (RF114)
ALTER TABLE pagos_simulados ALTER COLUMN estado SET DEFAULT 'Pendiente';

-- M6: soporte de carritos abandonados (sugerencia del Director)
ALTER TABLE carrito_items ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- M7: rendimiento del buscador (RF88/RF70/RF71)
ALTER TABLE productos ADD FULLTEXT ft_productos_busqueda (nombre, descripcion);

-- M8: NO SE APLICA. La decision B-R3 usa la columna eliminado_por_admin que ya
-- existe en el schema v3. (Solo se agregaria si a futuro se quiere distinguir
-- "suspendido por baneo" de "eliminado por admin".)
-- ALTER TABLE productos ADD COLUMN suspendido TINYINT(1) NOT NULL DEFAULT 0;
```

### 4.3 Ajustes a la semilla (`seed_commercity.sql`) - cambios exactos

Para que no haya dudas, dejo el SQL listo para pegar. Son 4 reemplazos en el
archivo `seed_commercity.sql`.

**S1 + S2 - Reemplazar TODO el bloque `NOTIFICACIONES` del seed por este** (el
`tipo 'pedido enviado'` se cambia a `'pedido'` y el estado se escribe SIN
acentos, porque el ENUM corregido en M2 es `('leido','no leido')`):

```sql
-- ============ REEMPLAZAR la seccion NOTIFICACIONES del seed por esto ============
INSERT INTO notificaciones (usuario_id, tipo, descripcion, estado, url_redireccion) VALUES
(7, 'compra', 'Tu pedido #1 ha sido confirmado', 'leido', '/perfil/historial'),
(7, 'pedido', 'Tu pedido #1 esta en camino', 'leido', '/perfil/historial'),
(8, 'compra', 'Tu pedido #2 ha sido confirmado', 'leido', '/perfil/historial'),
(9, 'compra', 'Tu pedido #3 ha sido confirmado', 'no leido', '/perfil/historial'),
(10, 'compra', 'Tu pedido #4 ha sido confirmado', 'leido', '/perfil/historial'),
(9, 'mensajes', 'Tienes un nuevo mensaje de Marco Rossi', 'no leido', '/chats'),
(8, 'mensajes', 'Tienes un nuevo mensaje de Julian Thorne', 'no leido', '/chats'),
(2, 'compra', 'Vendiste 2 unidades de Zapatos Deportivos', 'leido', '/vendedor/ventas'),
(3, 'compra', 'Vendiste 1 MacBook Air M2', 'leido', '/vendedor/ventas'),
(11, 'pedido', 'Tu pedido #5 esta pendiente de pago', 'no leido', '/perfil/historial');
```

**S3 + S5 - Reemplazar TODO el bloque `REPORTES` del seed por este** (se agrega
la columna `estado_reporte` con 'Resuelto' solo donde hay `respuesta_admin`, y
`evidencia_url` en 2 reportes de producto):

```sql
-- ============ REEMPLAZAR la seccion REPORTES del seed por esto ============
INSERT INTO reportes (informante_id, tipo_reporte, producto_id, usuario_reportado_id, motivo, evidencia_url, estado_reporte, respuesta_admin, respondido_at) VALUES
(7, 'Producto', 21, NULL, 'El producto se muestra disponible pero no tiene stock', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop', 'Resuelto', 'Gracias por el reporte, ya fue marcado como agotado', NOW()),
(8, 'Producto', 8, NULL, 'La descripcion no coincide con la imagen', NULL, 'Pendiente', NULL, NULL),
(9, 'Usuario', NULL, 2, 'El vendedor no responde los mensajes', NULL, 'Pendiente', NULL, NULL),
(10, 'Usuario', NULL, 4, 'Publica productos de otro vendedor', NULL, 'Resuelto', 'Se envio advertencia al vendedor', NOW()),
(11, 'Producto', 6, NULL, 'El precio subio sin aviso', NULL, 'Pendiente', NULL, NULL),
(12, 'Usuario', NULL, 5, 'Respuestas groseras en el chat', NULL, 'Pendiente', NULL, NULL),
(8, 'Producto', 3, NULL, 'El producto llego defectuoso', NULL, 'Resuelto', 'Se contacto al vendedor para reposicion', NOW()),
(10, 'Usuario', NULL, 6, 'Vendedor no cumple con los tiempos de envio', NULL, 'Pendiente', NULL, NULL),
(12, 'Producto', 18, NULL, 'La lampara llego sin adaptador', NULL, 'Pendiente', NULL, NULL),
(7, 'Usuario', NULL, 3, 'Envio un mensaje inapropiado', NULL, 'Resuelto', 'Advertencia aplicada al vendedor', NOW()),
(9, 'Producto', 9, NULL, 'No especifica si incluye instalacion', NULL, 'Pendiente', NULL, NULL),
(11, 'Usuario', NULL, 2, 'Publica productos falsificados', NULL, 'Pendiente', NULL, NULL),
(18, 'Producto', 10, NULL, 'La licuadora hace ruido excesivo', NULL, 'Resuelto', 'En revision por calidad', NOW());
```

**S4 - Agregar al final del seed el bloque de variantes** (tallas y colores de
ejemplo para probar el flujo de variantes):

```sql
-- ============ AGREGAR al final del seed (variantes de ejemplo) ============
INSERT INTO producto_variantes (producto_id, nombre_variante, valor_variante, stock_adicional) VALUES
(5, 'Talla', '38', 10),
(5, 'Talla', '40', 15),
(6, 'Talla', '42', 8),
(12, 'Color', 'Negro', 20),
(12, 'Color', 'Blanco', 15);
```

**Regla fija**: el `estado` de las notificaciones se escribe SIEMPRE sin acentos
(`'leido'` / `'no leido'`), coherente con la migracion M2. Asi el seed corre
igual contra el schema v3 y contra la BD real.

### 4.4 Lo que falta en el backend (checklist `revision-requerimientos.md`)

| # | Brecha | Modulo | Accion |
| --- | --- | --- | --- |
| BE-1 | Expiracion de 5 min del token (RF4) | Autenticacion (Diego) | Implementar con M3: guardar `token_recuperacion_expiracion` y validar al consumir |
| BE-2 | JWT_SECRET con fallback hardcodeado | Autenticacion | `if (!process.env.JWT_SECRET) throw` en el arranque |
| BE-3 | `cors()` abierto, sin helmet, sin rate-limit | Autenticacion | Aplicar checklist api-seguridad.md en server.js |
| BE-4 | Validacion Zod (RNF10) | Todos los modulos | Schemas Zod por endpoint |
| BE-5 | `cambiarRol` sin transaccion y con autodegradacion de admin | Autenticacion | Transaccion + prohibir degradar admin |
| BE-6 | Contrato `{success,data/error}` vs `{success,message,data}` | Todos | El contrato unico del proyecto sera `{ success, data/error }`; el modulo de autenticacion (que usa `{success,message,data/errors}`) se migra a ese formato |
| BE-7 | Transaccion ACID en compra + descuento de stock (RNF13 + sugerencia) | Pedidos/Pago (Vidal) | 1 transaccion: pedido + lineas + stock + pago |
| BE-8 | Tests de los modulos pendientes | Todos | Segun testing-commercity.md (min 60%, no bajar cobertura) |

### 4.5 Lo que depende del frontend

| # | Brecha | Requerimiento | Depende de |
| --- | --- | --- | --- |
| FE-1 | Pasarela desglosa subtotal + IVA 19% | RF115/RF132 | Decision B-R2 |
| FE-2 | Lista de pedidos del vendedor con imagen | RF120 | M4 |
| FE-3 | Tarjeta de producto con datos completos | RF93 | OK (BD soporta) |
| FE-4 | Notificaciones con tipos correctos | RF97 | M1/M2 |

### 4.6 Solucion definitiva por requerimiento pendiente

Aca dejo, para cada requerimiento que no esta OK, que es exactamente lo que hay
que implementar. Las referencias M1-M8 son las migraciones de la seccion 4.2 y
B-R1 a B-R5 las decisiones de la seccion 4.1.

**Gestion de usuarios**

| RF | Estado | Solucion definitiva |
| --- | --- | --- |
| RF4 | PARCIAL | M3 + en el backend: al emitir el link guardar `token_recuperacion_expiracion = NOW() + 5 MINUTES` y al consumirlo validar que no haya expirado ni se use dos veces |
| RF9 | PARCIAL | Proteger las rutas de administrador con `requireRoles(["administrador"])` (ya existe el middleware) |
| RF12 | PEND | Endpoint de perfil de vendedor (datos + productos publicados), modulo Perfil Vendedor |
| RF13 | PEND | Panel admin: endpoints de estadisticas y gestion, modulo Panel Admin |
| RF14/RF15 | PARCIAL | Endpoint `PATCH /api/usuarios/me/foto` (subir/editar foto) |
| RF16/RF17 | PARCIAL | Endpoint `PATCH /api/usuarios/me/descripcion` |
| RF18-RF21 | PEND | Endpoints de seguidores: `POST/DELETE /api/usuarios/:id/seguir`, `GET /api/usuarios/me/seguidores|seguidos` |
| RF22/RF23 | PEND | Endpoint de feed: `GET /api/productos` filtrado por preferencias, modulo Panel Principal |
| RF25 | PEND | Endpoint de notificaciones: `GET /api/notificaciones` (requiere M1/M2 de RF97) |
| RF26-RF32 | PARCIAL/PEND | Endpoint de historial: `GET /api/usuarios/me/historial` con detalle por pedido (modulo Historial). El RF31 incluira la imagen cuando se aplique M4 |
| RF33 | PEND | Chat: `POST /api/mensajes` (texto/archivo) y `GET /api/mensajes/:usuarioId` |
| RF34-RF37 | PARCIAL | Endpoint `PATCH /api/usuarios/me` (datos personales y direccion) |
| RF40 | PARCIAL | Decision B-R4: desactivar cuenta con `activo = 0` en vez de borrar |
| RF41 | PEND | Decision B-R4: al desactivar al vendedor, suspender sus productos (`eliminado_por_admin = 1`) y revisar las FK `ON DELETE CASCADE` de `productos`/`calificaciones` para que nunca borren historial |

**Perfil vendedor**

| RF | Estado | Solucion definitiva |
| --- | --- | --- |
| RF44 | PEND | Funcionalidades extra del perfil vendedor, modulo Perfil Vendedor |
| RF45 | PARCIAL | Endpoint `POST /api/productos` con validacion de que el usuario sea vendedor |
| RF47 | BLOQUEADO | Decision B-R1: el vendedor publica precio con IVA incluido; el backend guarda `precio` tal cual y nunca le aplica IVA |
| RF48 | PARCIAL | Endpoint `POST /api/productos` completo (insertar en `productos`, sin insertar `estado` que es generado) |
| RF49 | PARCIAL | Endpoint `PUT /api/productos/:id` (editar con los mismos campos del formulario) |
| RF50 | PEND | Endpoint `GET /api/vendedor/calificaciones` (promedio 1-5 estrellas) |
| RF51 | PEND | Modulo Mi Tienda (Erick) |
| RF52 | PEND | Endpoint `GET /api/vendedor/pedidos` (lineas donde el vendedor_id sea el autenticado) |
| RF53 | PEND | Endpoint `GET /api/vendedor/:id/productos` (productos publicados visibles) |
| RF54 | PEND | Endpoint de gestion de "mis productos" (listar/editar/suspender propios) |

**Panel administrativo**

| RF | Estado | Solucion definitiva |
| --- | --- | --- |
| RF67 | PARCIAL | Endpoints de gestion de usuarios (banear/activar) aplicando B-R3/B-R4 |
| RF68 | PARCIAL | Endpoint de gestion de productos (suspender con `eliminado_por_admin = 1`) |
| RF69-RF71 | PARCIAL | Buscador: aplicar M7 (FULLTEXT) + endpoint `GET /api/admin/buscar?q=` |
| RF72 | PARCIAL | Endpoint de "eliminar producto" = borrado logico (`eliminado_por_admin = 1`), regla B-R3 |
| RF73 | PARCIAL | Endpoint de banear/activar/eliminar usuario (usa `activo = 0`), regla B-R4 |
| RF74 | PEND | Regla B-R5: al banear, suspender sus productos y definir el destino de sus pedidos |

**Productos y panel principal**

| RF | Estado | Solucion definitiva |
| --- | --- | --- |
| RF80 | PARCIAL | En el backend validar `cantidad <= stock` al agregar al carrito y al generar el pedido |
| RF88 | PARCIAL | Aplicar M7 (FULLTEXT) + endpoint `GET /api/productos?q=nombre|categoria|vendedor` |

**Notificaciones**

| RF | Estado | Solucion definitiva |
| --- | --- | --- |
| RF97 | BLOQUEADO | Aplicar M1 (tipo VARCHAR(50)) y M2 (estado sin mojibake); luego endpoint `GET /api/notificaciones` ordenado por fecha |

**Compra, pedidos y finanzas**

| RF | Estado | Solucion definitiva |
| --- | --- | --- |
| RF111 | PARCIAL | Endpoint `POST /api/pedidos` con transaccion ACID (pedido + lineas + stock + pago), modulo Pedidos/Pago |
| RF114 | PARCIAL | Aplicar M5 (DEFAULT 'Pendiente') + endpoint de pago simulado |
| RF115 | PARCIAL | En la pasarela calcular en vuelo: `subtotal = precio / 1.19` e `IVA = subtotal * 0.19` (decision B-R2) |
| RF116 | PARCIAL | Decision B-R2 (ya cerrada): NO almacenar IVA; alinear el RF116 a RF132 |
| RF132 | PARCIAL | En la pasarela calcular: `subtotal = precio / 1.19`, `IVA = subtotal * 0.19`, `monto_vendedor = subtotal * 0.90`, `monto_comision = subtotal * 0.10` (las dos ultimas ya son columnas GENERADAS; el backend solo inserta el subtotal) |
| RF120 | PARCIAL | Aplicar M4 (imagen en `detalle_pedidos`) + el backend debe guardar la imagen al crear la linea y mostrarla en la lista de pedidos |
| RF123 | PEND | Modulo Mi Tienda (Erick): seccion con productos, cuenta bancaria y estadisticas |

**No funcionales**

| RNF | Estado | Solucion definitiva |
| --- | --- | --- |
| RNF2 | PARCIAL | Normalizar el contrato de respuesta a `{ success, data/error }` en todos los modulos |
| RNF6 | PARCIAL | Transacciones ACID en la compra (se resuelve con RF111) |
| RNF10 | PARCIAL | Schemas Zod por endpoint (BE-4) |
| RNF11 | PARCIAL | No exponer email ni cuenta bancaria en respuestas publicas (ya aplicado en perfil publico; replicar en los modulos nuevos) |

### 4.7 Texto final de los RF para copiar y pegar en el documento oficial

La seccion 4.6 es la guia de implementacion (que hace el backend). Esta seccion
es el **texto que debe quedar en el documento de requerimientos**, redactado con
el mismo formato del docx (`**RF###:** ...`). Se puede copiar y pegar tal cual.

**RF41 - Corregir (eliminar cuenta del vendedor):**

> **RF41:** El sistema desactivara la cuenta del vendedor cuando este la elimine desde ajustes, conservando los historiales (pedidos, pagos, comisiones, reportes y calificaciones). Sus productos publicados quedaran suspendidos y fuera del catalogo.

**RF47 - Corregir (IVA):**

> **RF47:** El vendedor publicara su producto con el precio final que ya incluye el IVA del 19%; el sistema desglosara el IVA en la pasarela de pago.

**RF72 - Corregir (eliminar productos del admin):**

> **RF72:** El sistema permitira al administrador suspender productos publicados (eliminacion logica). El producto dejara de aparecer en el catalogo y no podra agregarse al carrito, pero su historial (pedidos, reportes, calificaciones) se conservara.

**RF73 - Corregir (eliminar usuarios del admin):**

> **RF73:** El sistema permitira al administrador banear, activar o eliminar (desactivar) usuarios. La eliminacion sera logica: la cuenta queda inactiva y nunca se borran fisicamente sus datos.

**RF74 - Corregir (baneo de vendedor):**

> **RF74:** Si el administrador banea a un vendedor, sus productos quedaran suspendidos y su cuenta inactiva. Los pedidos ya pagados se completaran (envio y desembolso incluidos); los pedidos en estado "Pendiente" se cancelaran restituyendo el stock al comprador.

**RF116 - Corregir (IVA):**

> **RF116:** Al confirmar el pago de un pedido, el sistema calculara en vuelo el IVA del 19% y el subtotal de cada producto y los mostrara en la pasarela, sin almacenarlos en la base de datos.

**RF nuevo - Inventario (descuento de stock):**

> **RF134:** El sistema descontara automaticamente la cantidad comprada del stock del producto una vez que el pago sea aprobado.

**RF nuevo - Cancelaciones:**

> **RF135:** El sistema permitira cancelar un pedido si se encuentra en estado "Pendiente", restituyendo automaticamente el stock.

**RF nuevo - Carritos abandonados:**

> **RF136:** El sistema vaciara automaticamente los carritos de compra inactivos despues de 7 dias.

> **Nota**: RF134-RF136 usan los siguientes numeros libres tras RF133; el Director
> puede reordenarlos sin cambiar el texto.

***

## 5. Como vamos por modulo en el backend

| Modulo | Integrante | RF a cubrir | Estado | Bloqueo |
| --- | --- | --- | --- | --- |
| Autenticacion | Diego Serna | RF1-RF13, RF34-RF42 | Revisado (pendientes BE-1 a BE-6) | No |
| Carrito | Daniel Palacios | RF107-RF110 | Integrado (19 tests) | No |
| Perfil publico | Cristian Rosero | RF106 | Integrado (7 tests) | No |
| Catalogo/Producto | Carlos Perea | RF45-RF49, RF78-RF86 | Pendiente | No |
| Pedidos y Pago | Carlos Vidal | RF111-RF118, RF119-RF122 | Pendiente | No (decision de IVA cerrada) |
| Historial | Jary | RF26-RF32 | Pendiente (corte 8/08, entrega 11/08) | No |
| Mi Tienda | Erick | RF123-RF131 | Pendiente | No |
| Reportes | Mosquera Flor | RF60-RF66, RF82-RF83 | Pendiente | No |
| Panel Admin | Juan Cabrera | RF55-RF77 | Pendiente | No (regla de suspension definida) |
| Panel Principal | Brandon | RF87-RF94 | Pendiente | No |
| Perfil Vendedor | Jose Yepes | RF43-RF54 | Pendiente | No (RF47 definido) |

***

## 6. Que si necesitamos y que no (mi criterio)

### 6.1 Lo que SI necesitamos para que todo funcione

| Necesidad | Tipo | Por que |
| --- | --- | --- |
| Un unico contrato de respuesta `{ success, data/error }` | Backend/Frontend | Evita fricciones al integrar modulos (hoy hay `{success,message,data}` en un modulo) |
| Aplicar la decision de IVA (B-R1/B-R2): precio con IVA incluido, desglose en vuelo, 90/10 sobre subtotal | Requerimientos | Desbloquea checkout y pedidos; la formula de comisiones queda estable |
| Regla de suspension (no eliminacion) de productos y cuentas (B-R3/B-R4/B-R5) | Requerimientos + BD | Protege historiales, reportes y pedidos (RNF13) |
| Aplicar las 7 migraciones M1-M7 y los 5 ajustes de semilla S1-S5 | BD | El seed actual NO corre contra el schema v3 (ENUM de `notificaciones.tipo`) y faltan columnas de RF4/RF120. M8 no se aplica (B-R3 usa `eliminado_por_admin` existente) |
| Expiracion del token de recuperacion (RF4) | BD + Backend | Requisito de seguridad (link de un solo uso, 5 min) |
| Transacciones ACID en la compra (pedido + lineas + stock + pago) | Backend | RNF13 + sugerencia del Director; evita pedidos a medias |
| Descontar stock al aprobar el pago (con condicion `stock >= ?`) | Backend | Evita sobreventa (race conditions) |
| Checklist de seguridad por endpoint (helmet, cors cerrado, rate-limit, JWT_SECRET desde `.env`, Zod) | Backend | RNF8-RNF11 + api-seguridad.md |
| Cobertura de tests por modulo (min 60%, sin bajar la actual 94%) | Testing | testing-commercity.md |

### 6.2 Lo que NO necesitamos (para no sobre-ingeniar)

| No necesitamos | Por que |
| --- | --- |
| Columna/tabla de IVA en la BD | RF116 se alinea a RF132 (decision B-R2): el IVA se calcula en vuelo; no hay dato que almacenar |
| Columna de imagen en `productos` | `productos.imagen_url` ya existe; solo falta el snapshot en `detalle_pedidos` (M4) |
| Tablas adicionales a las 19 | El esquema v3 cubre todos los RF; las brechas se cierran con migraciones, no redisenando |
| Eliminar fisicamente registros historicos | Prohibido por integridad (RNF13); se usa borrado logico (activo/suspendido/deleted_at) |
| Pasarela de pago real / datos completos de tarjeta | RF114 es pago simulado y RF117 solo pide numero y nombre (RNF11: no guardar CVV) |
| Buscador FULLTEXT ya | Se aplica M7 junto con el endpoint de busqueda (RF88); con 82 productos un indice normal basta, pero se deja preparado para cuando crezca el catalogo |
| Reescribir los requerimientos desde cero | El documento `Commercity (optimizado)` es valido; solo falta corregir B-R1/B-R2 y documentar B-R3/B-R4/B-R5 |

***

## 7. Guia paso a paso para solucionarlo todo

Aca esta el procedimiento completo, en orden, con la verificacion de cada paso.
No se debe saltar ninguno.

### PASO 1 - Registrar los RF en el documento oficial (Director)

1. Abrir el docx `Commercity (optimizado).docx`.
2. Reemplazar los RF que se corrigen con el texto de la seccion 4.7: RF41, RF47,
   RF72, RF73, RF74 y RF116.
3. Agregar al final los RF nuevos: RF134 (inventario), RF135 (cancelaciones) y
   RF136 (carritos abandonados).
4. Guardar el archivo en `LAST VERSION` con nombre versionado, por ejemplo
   `Commercity (optimizado 7).docx`.
5. Verificacion: en el documento ya no debe existir la frase "calculo adicional
   del IVA" del RF47 ni "para su almacenamiento" del RF116.

### PASO 2 - Aplicar las migraciones M1-M7 en la BD (BD)

1. Crear el archivo de migracion `backend/src/server/db/003_auditoria_v2.sql` con
   los ALTER de la seccion 4.2, en este orden exacto: M1, M2, M3, M4, M5, M6, M7.
   (M8 NO se incluye: no aplica).
2. Si la BD es NUEVA: ejecutar primero `schema_commercity_3.sql`.
3. ANTES de M2: si `notificaciones` tiene registros con el estado corrupto
   (`le├¡do` / `no le├¡do`), limpiar la tabla para que el MODIFY no falle:
   `DELETE FROM notificaciones;` (el seed la repoblara en el PASO 3).
4. Ejecutar la migracion con cliente MySQL en utf8mb4:
   `mysql -u <usuario> -p --default-character-set=utf8mb4 commercity_v2 < 003_auditoria_v2.sql`
5. Verificacion M1+M2:
   `SELECT COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='commercity_v2' AND TABLE_NAME='notificaciones';`
   Debe mostrar `tipo varchar(50)` y `estado enum('leido','no leido')` (sin mojibake).
6. Verificacion M3: `SHOW COLUMNS FROM usuarios LIKE 'token_recuperacion_expiracion';` -> debe existir.
7. Verificacion M4: `SHOW COLUMNS FROM detalle_pedidos LIKE 'imagen_url';` -> debe existir.
8. Verificacion M5: `SHOW COLUMNS FROM pagos_simulados LIKE 'estado';` -> DEFAULT 'Pendiente'.
9. Verificacion M6: `SHOW COLUMNS FROM carrito_items LIKE 'updated_at';` -> debe existir.
10. Verificacion M7: `SHOW INDEX FROM productos WHERE Key_name='ft_productos_busqueda';` -> debe existir.

### PASO 3 - Ajustar y ejecutar el seed (BD)

1. En `seed_commercity.sql` reemplazar el bloque `NOTIFICACIONES` por el de la
   seccion 4.3 (S1+S2).
2. Reemplazar el bloque `REPORTES` por el de la seccion 4.3 (S3+S5).
3. Agregar al final el bloque de `producto_variantes` (S4).
4. Ejecutar: `mysql -u <usuario> -p --default-character-set=utf8mb4 < seed_commercity.sql`
5. Verificacion: el script debe terminar SIN errores. Luego:
   `SELECT COUNT(*) FROM notificaciones;` -> 10
   `SELECT COUNT(*) FROM reportes;` -> 13
   `SELECT COUNT(*) FROM producto_variantes;` -> 5
   `SELECT COUNT(*) FROM usuarios;` -> 20
   `SELECT COUNT(*) FROM productos;` -> 82

### PASO 4 - Cerrar las brechas de backend (Backend)

4.1 **BE-1 - Expiracion del token (RF4)** en `controllers/usuarios.controllers.js`:
1. En `solicitarRecuperacion`: guardar ademas `token_recuperacion_expiracion = DATE_ADD(NOW(), INTERVAL 5 MINUTE)`.
2. En `restablecerPassword`: buscar con `WHERE token_recuperacion = ? AND token_recuperacion_expiracion >= NOW()`.
3. Al restablecer: limpiar `token_recuperacion` y `token_recuperacion_expiracion` a NULL.
4. Verificacion: consumir un link despues de 5 minutos debe devolver 400.

4.2 **BE-2 - JWT_SECRET** en `server.js`:
1. Al arrancar: `if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET es obligatorio en .env");`
2. Quitar el fallback `|| "secreto_super_seguro_dev"` de auth.middleware.js y usuarios.controllers.js.
3. Verificacion: arrancar sin la variable debe fallar; con la variable, funcionar.

4.3 **BE-3 - Seguridad** en `server.js`:
1. Agregar `helmet()`, `app.disable("x-powered-by")` y `cors({ origin: process.env.FRONTEND_URL })`.
2. Agregar `express-rate-limit` sobre `/api/login` y `/api/recover` (max 10 por minuto).
3. Verificacion: headers con helmet presentes; request cross-origin no autorizado fuera del origin.

4.4 **BE-4 - Validacion Zod** (todos los modulos):
1. Instalar `zod` y crear `middleware/validate.js` + `schemas/` por endpoint.
2. Aplicar el middleware en register, login, recover, reset, cambiarRol, pedidos, productos.
3. Verificacion: enviar `email` invalido o campos extra debe devolver 400 VALIDATION_ERROR.

4.5 **BE-5 - cambiarRol** en `usuarios.controllers.js`:
1. Envolver DELETE + INSERT en transaccion (`connection.beginTransaction()` / `commit()` / `rollback()`).
2. Antes de ejecutar: si el usuario tiene rol `administrador`, devolver 403 (no se autodegrada).
3. Verificacion: degradar admin da 403; cambiar comprador<->vendedor funciona.

4.6 **BE-6 - Contrato de respuesta** en `utils/response.js`:
1. Migrar a `{ success, data }` (exito) y `{ success, error: { code, message } }` (error).
2. Actualizar los controllers que usen `message`/`errors`.
3. Verificacion: `GET /api/me` devuelve `{ success, data }` y los errores `{ success, error }`.

4.7 **BE-7 - Transaccion ACID en la compra** en `controllers/pedidos.controllers.js`:
1. Una transaccion: insertar `pedidos` -> insertar lineas en `detalle_pedidos` ->
   `UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?` -> insertar `pagos_simulados`.
2. Si algo falla: `ROLLBACK`.
3. Verificacion: crear un pedido duplicado sobre el mismo stock no debe sobrevender.

4.8 **BE-8 - Tests**:
1. Test por modulo con `vi.mock('mysql2/promise')`.
2. Ejecutar `npm run test:coverage` -> cobertura >= 60% y no menor a la anterior.
3. Verificacion: `vitest run` en verde.

### PASO 5 - Verificacion integral

1. `npm test` y `npm run test:coverage` en el backend -> en verde, cobertura >= 60%.
2. Probar contra la BD real: login con los correos del seed (password `123456`),
   `GET /api/usuarios/perfil-publico/3`, carrito, y (al integrar) pedidos e historial.
3. Actualizar `informes/CHANGELOG.md` con cada cambio aplicado y su RF.

***

## 8. Mi conclusion

Despues de recorrer los 133 RF y los 19 RNF, mi lectura es que el **esquema v3 ya
cubre casi todo el modelo de datos**: las 19 tablas, las FKs, las columnas
generadas del 90/10, las variantes, las evidencias de los reportes y el chat con
archivos. Lo que falta se reduce a tres frentes: (1) **registrar en el documento
oficial las decisiones que ya quedaron tomadas** (IVA en RF47/RF116 y la regla de
suspension), (2) **aplicar las 7 migraciones (M1-M7) y los 5 ajustes de semilla**
que deje listos aqui, y (3) **cerrar los pendientes de backend** que ya tienen
checklist.
Con eso, el proyecto queda sin brechas y todas las areas trabajan sobre una unica
fuente de verdad: `LAST VERSION`.

---

*Informe redactado el 2026-08-07 por Daniel Palacios a partir de la revision de
los archivos de `LAST VERSION` (requerimientos RF1-RF133/RNF1-RNF19, schema v3 y
seed) y del codigo real del backend. No se modifico ningun archivo oficial.*
