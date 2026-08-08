# INFORME DE REVISION - BASE DE DATOS Y REQUERIMIENTOS COMMERCITY (commercity\_v2)

**Autor:** Daniel Palacios (Lider backend web)
**Fecha:** 2026-08-07
**Version informe:** 1.5
**Categoria:** Revision tecnica de la base de datos remota y de los requerimientos oficiales del proyecto
**Dirigido a:** Jose Yepes (Director CommerCity) y Jorge Andres Meneses (Lider Base de Datos)

***

## 1. Contexto

Como lider backend, necesito confirmar que el esquema de la base de datos remota
`commercity_v2` (la oficial de trabajo del proyecto) esta alineado con los
requerimientos (RF) y con las decisiones que tomamos en el grupo de lideres el
2026-08-06, para poder avanzar con el desarrollo de los modulos backend sin
brechas. Realice una revision directa contra el servidor real
(`149.130.178.228`, base `commercity_v2`). Fue una revision de solo lectura
(SELECT / information\_schema); no se modifico ningun dato ni estructura.

Metodologia aplicada:

1. Verificacion de la conexion externa y de la base oficial de trabajo.
2. Lectura del catalogo de tablas y columnas via `information_schema`.
3. Conteo de registros por tabla de negocio (datos reales vs. datos de prueba).
4. Comparacion contra las decisiones de los lideres (IVA, comisiones,
   multi-producto, recuperacion de contrasena).
5. Comparacion contra las brechas criticas documentadas del 2026-08-04.

***

## 2. Estado del esquema

La base tiene **19 tablas** (al momento de la revision; Meneses agrego
`producto_variantes` el 2026-08-06), todas en `utf8mb4` / `utf8mb4_unicode_ci`
(correcto para soportar caracteres especiales y emojis). Las tablas son:

| Tabla                                                                          | Rol en el negocio                         |
| ------------------------------------------------------------------------------ | ----------------------------------------- |
| usuarios                                                                       | Cuentas de compradores y vendedores       |
| roles / usuario\_roles                                                         | RBAC (comprador, vendedor, administrador) |
| productos / categorias / etiquetas / producto\_etiquetas / producto\_variantes | Catalogo con variantes (tallas, colores)  |
| carrito\_items                                                                 | Carrito de compras                        |
| pedidos / detalle\_pedidos                                                     | Pedidos multi-producto y comisiones       |
| pagos\_simulados                                                               | Pasarela de pago simulada                 |
| calificaciones\_productos / calificaciones\_vendedores                         | Calificaciones                            |
| seguidores                                                                     | Seguimiento entre usuarios                |
| mensajes\_chat                                                                 | Chat                                      |
| notificaciones                                                                 | Notificaciones                            |
| reportes                                                                       | Reportes de producto/usuario              |
| datos\_bancarios                                                               | Cuentas bancarias de vendedores           |

Verifique las claves foraneas: todas las columnas FK que revise presentan
indice (`MUL` en `information_schema`), lo cual es correcto para el rendimiento
de los JOINs del backend.

***

## 3. Hallazgos de la revision

### 3.1 RESUELTO - Datos semilla inyectados por Meneses (2026-08-07)

El hallazgo anterior (BD vacia) quedo **resuelto**: Meneses inyecto un lote de
datos de prueba (seed de Cabrera ajustado por Meneses, `seed_commercity.sql`).
Conteo real verificado el 2026-08-07 (tarde):

| Tabla            | Registros |
| ---------------- | --------- |
| usuarios         | 20 (1 admin, 10 vendedores, 9 compradores) |
| productos        | 82        |
| categorias       | 16        |
| producto_variantes | 4      |
| etiquetas        | 5         |
| pedidos          | 8         |
| detalle_pedidos  | 10        |
| datos_bancarios  | 6         |
| notificaciones   | 10        |
| usuario_roles    | 22        |

Usuarios principales para pruebas (contrasena de todos: **123456**, encriptada
con Bcrypt):

| Rol | Correo real en BD |
|---|---|
| Administrador | carlos.munoz@commercity.com |
| Vendedor | juan.giraldo@commercity.com (o alex.rivera, elena.sanz, etc.) |
| Comprador | camila.torres@commercity.com (o sebastian.ruiz, mariana.gomez, etc.) |

**NOTA IMPORTANTE**: los correos `admin@commercity.com`, `vendedor1@commercity.com`
y `comprador1@commercity.com` que Meneses anuncio a las 2:54 PM **NO existen en
la BD actual**: el seed final (4:14 PM) uso los 20 usuarios con correos
`nombre.apellido@commercity.com`. Para el endpoint de login usar los correos de
la tabla anterior. Esto se debe comunicar al equipo.

**NOTA (v1.5, verificada con `information_schema` el 2026-08-07)**: la columna
`productos.estado` esta definida como `enum('Disponible','Agotado')` con `EXTRA:
STORED GENERATED` (se calcula sola segun el stock, no se inserta). Por eso el
seed no la incluye: es el comportamiento correcto. El backend debe **leer**
`estado` en las consultas de catalogo pero jamas insertarlo/actualizarlo
directamente. El seed es re-ejecutable (TRUNCATE + re-insert) y los precios son
`decimal(12,2)` (COP).

### 3.2 CRITICO - Mojibake en `notificaciones.estado` (el ENUM de tipo ya fue corregido)

La columna `notificaciones.estado` quedo definida como:

```
enum('le├¡do','no le├¡do')
```

cuando debe ser `enum('leido','no leido')` (o con acentos bien codificados:
`leído` / `no leído`). El charset de la columna es `utf8mb4`, pero el DDL
original se ejecuto con encoding roto y los valores del ENUM quedaron corruptos.
Esto afectara el guardado y lectura de notificaciones desde el backend.

**NOTA**: la columna `notificaciones.tipo` **YA fue resuelta por Meneses** el
2026-08-07: aplico `ALTER TABLE notificaciones MODIFY COLUMN tipo VARCHAR(50)`
(ya no es ENUM; evita los cortes de datos que reporto). Queda pendiente
corregir el ENUM `estado` (mojibake).

**Impacto**: si el backend guarda `'leido'`, MySQL lo rechazara porque el ENUM
no contiene ese valor.

**Recomendacion de solucion**: migracion `ALTER TABLE notificaciones MODIFY
estado ENUM('leido','no leido') NULL`, ejecutada con cliente MySQL en utf8mb4
(sin acentos en los valores para no recaer en mojibake). Auditar con `SELECT
COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE
TABLE_SCHEMA='commercity_v2' AND (COLUMN_TYPE LIKE '%Ã%' OR COLUMN_TYPE LIKE
'%í%')` cualquier otra columna corrupta.

### 3.3 MEDIO - Recuperacion de contrasena: expiracion definida en RF4 (5 min), falta en BD

El requerimiento actualizado (docx `Commercity 2.0 (optimizado4)`, RF4) ya
define la regla: "el usuario solicita el restablecimiento con su correo
electronico y recibe un link de un solo uso. El link **expira a los 5 minutos**
de emitido; al vencer, el usuario debe solicitar uno nuevo." Con esto, la regla
de negocio de expiracion **YA esta en los requerimientos** (resuelve el
hallazgo anterior de la seccion 6).

Sin embargo, la tabla `usuarios` solo tiene `token_recuperacion varchar(100)`;
**no existe** `token_recuperacion_expiracion` en la BD.

**Recomendacion de solucion**: (1) en BD, migracion `ALTER TABLE usuarios ADD
COLUMN token_recuperacion_expiracion DATETIME NULL`; (2) en backend, al emitir
el link con Resend se guarda `token_recuperacion` (hash del token) +
`token_recuperacion_expiracion = NOW() + 5 MINUTES`, y al consumirlo se valida
que no haya expirado ni se use dos veces. Alternativa: JWT con `exp` embebido
en el varchar(100). Valor definido por el grupo: **5 minutos**.

### 3.4 RESUELTO - Decision final de IVA (RF132) - precio con IVA incluido, el sistema desglosa

La regla definitiva quedo **cerrada por Yepes el 2026-08-07** (despues de la
llamada conmigo y Meneses). El RF132 quedo redactado asi:

> RF132: "El sistema en la pasarela de pago sacara primero el %19 del IVA del
> precio base y quedara el subtotal, y del subtotal se sacara el %90 para el
> vendedor y el %10 para CommerCity."

Regla operativa:

1. **El vendedor publica el producto con su IVA incluido** (precio final;
   RF47: el sistema maneja el IVA, el vendedor no calcula).
2. La **pasarela de pago desglosa**: subtotal = precio / 1.19, IVA = subtotal
   x 0.19 (el 19% del precio base). El comprador paga el precio publicado.
3. Las **comisiones 90/10 se calculan sobre el subtotal** (base sin IVA),
   soportado por `detalle_pedidos.monto_vendedor` y `monto_comision`.
4. Yepes actualizo el mockup de Figma con este modelo y agrego a los
   requerimientos el **dato imagen del producto** (en pedidos/linea).

**Implicacion en BD**: NO se requiere columna de IVA (`iva_porcentaje`
descartada). Queda pendiente que Meneses agregue el **dato foto/imagen a
pedidos** (o detalle) que el mismo menciono el 2026-08-07 (aun no existe
columna de imagen en `pedidos`/`detalle_pedidos`; `productos.imagen_url` si
existe).

**ADVERTENCIA (v1.5)**: la ultima version de los requerimientos (`Commercity 2.0
(optimizado 6)`, 2026-08-07) **reactiva un conflicto con esta regla** en dos RF:

1. **RF116**: "Al confirmar el pago de un pedido, el sistema identificará y
   registrará el valor correspondiente al IVA de cada producto **para su
   almacenamiento**." -> exige guardar el IVA por linea, lo que requeriria
   columnas tipo `monto_iva`/`subtotal_con_iva` en `detalle_pedidos` (o
   `iva_porcentaje` en `productos`).
2. **RF47**: "El vendedor publicará su producto teniendo en cuenta que el debe
   hacer el **cálculo adicional del IVA del %19**." -> redaccion que contradice
   el modelo aprobado (precio publicado CON IVA incluido, el sistema desglosa).

Este es el punto mas importante a aclarar con Yepes antes de implementar el
modulo de pagos (ver seccion 3.7).

### 3.5 INFORMATIVO - Multi-producto y precio unitario soportados (N a 1 en pedidos implementado)

`detalle_pedidos` ya tiene `precio_unitario_historico`, `cantidad`, `subtotal`,
`vendedor_id`, `monto_vendedor` y `monto_comision`, y **Meneses agrego el
2026-08-06/07** las columnas `estado_envio ENUM('Pendiente','En camino',
'Entregado')`, `estado_pago_vendedor ENUM('Pendiente','Desembolsado')` y
`fecha_desembolso DATETIME`. Con esto:

- Pedidos multi-producto (1 pedido, N lineas).
- Precio unitario por cantidad (decision del grupo 2026-08-06).
- Comisiones 90/10 por linea.
- **"N a 1 en pedidos"** (lo que Meneses menciono): el estado de envio paso de
  `pedidos.estado_pedido` (eliminado) a `detalle_pedidos.estado_envio`, por
  linea/vendedor. Impacto en RF119/RF120: el vendedor actualiza el estado por
  linea de su pedido, no del pedido global.

### 3.6 Hallazgos de la revision de requerimientos oficiales (RF)

Reviso el documento oficial `Commercity 2.0 Final (optimizado).docx`
(132 RF + 20 RNF) y lo cruce con el esquema real. Hallazgos y su impacto en BD:

| # | Hallazgo | Impacto en BD | Recomendacion de solucion |
|---|---|---|---|
| 1 | **RF115** (optimizado4): mostrar subtotal y IVA 19% en la pasarela (ya NO exige almacenar) | Sin cambio de BD por almacenamiento | RESUELTO - solo desglose en la pasarela; el conflicto de almacenar IVA por producto desaparecio |
| 2 | **RF132** (final): "la pasarela saca el 19% del IVA del precio base, queda el subtotal y de ahi el 90% al vendedor y el 10% a CommerCity" | Sin columna de IVA (descartada `iva_porcentaje`) | RESUELTO - el vendedor publica precio con IVA incluido; pasarela desglosa (subtotal = precio/1.19); comisiones 90/10 sobre subtotal. Backend implementa esta formula |
| 3 | **RF4** (optimizado4): link de un solo uso, **expira a los 5 minutos** | Falta `usuarios.token_recuperacion_expiracion` en la BD | Migracion: `ALTER TABLE usuarios ADD COLUMN token_recuperacion_expiracion DATETIME NULL`; backend valida 5 minutos al consumir el link |
| 4 | **RFX**: modificar cantidad en carrito, sin numero | Sin impacto (`carrito_items.cantidad` existe) | Yepes asigna numero definitivo; backend ya soporta PATCH de cantidad |
| 5 | **RF31** (historial): muestra "Iva del %19 aplicado" | Se calcula en vuelo (subtotal = precio/1.19; IVA = subtotal*0.19) | RESUELTO - el historial usa la formula del RF132; sin columna adicional |
| 6 | **RF97** (notificaciones): tipos compra/mensajes/reporte/pedido/en camino/entregado | `tipo` **YA es VARCHAR(50)** (Meneses); falta corregir `estado` (mojibake) | `ALTER TABLE notificaciones MODIFY estado ENUM('leido','no leido') NULL` |
| 7 | **RF92** (tarjeta de producto): datos incompletos en el documento | Sin impacto en BD | Meneses completa los datos de la tarjeta en requerimientos (nombre, imagen, precio, descuento, stock); el backend de catalogo ya los tiene |

Coherente con el esquema (sin cambios): RF111 carrito multi-vendedor, RF112
envio gratis, RF114 pasarela con IVA 19%, RF56/RF130 comision 10/90, RF132
moneda COP, RF7-RF10 roles, RF29/RF119 estados de pedido (ahora por linea:
`detalle_pedidos.estado_envio`).

### 3.7 NUEVO - Revision de la ultima version de requerimientos (`Commercity 2.0 (optimizado 6)`)

El 2026-08-07 el Director compartio una nueva version del documento de
requerimientos (`Commercity 2.0 (optimizado 6)`). La compare contra la regla
definitiva de IVA (RF132, seccion 3.4) y contra el esquema real. Hallazgos:

| # | Hallazgo | Impacto en BD y backend | Recomendacion |
|---|---|---|---|
| 1 | **RF116** (optimizado 6): "Al confirmar el pago... registrara el valor del IVA de cada producto **para su almacenamiento**" | **CONFLICTO con RF132**: reactiva guardar IVA por producto. Requiere `monto_iva` + `subtotal_con_iva` en `detalle_pedidos` (o `iva_porcentaje` en `productos`) | Confirmar con Yepes si se mantiene RF132 (desglose en vuelo, sin almacenar) o si el RF116 exige persistir el IVA por linea. Si se persiste: migracion de 2 columnas + calculo al confirmar pago |
| 2 | **RF47** (optimizado 6): "El vendedor... debe hacer el **calculo adicional del IVA del %19**" | **CONTRADICE el modelo aprobado** (RF132: precio publicado CON IVA incluido; el sistema desglosa, el vendedor NO calcula) | Aclarar redaccion con Yepes: se interpreta como que el vendedor debe tener en cuenta el IVA al fijar su precio (no que lo calcule y lo sume). Confirma RF132 |
| 3 | **RF4** (optimizado 6): "link de un solo uso, expira a los 5 minutos" | Consistente con la regla definida | Sin cambio; solo falta `usuarios.token_recuperacion_expiracion` (seccion 3.3) |
| 4 | **RF115** (optimizado 6): "mostrar en la pasarela subtotal y IVA desglosado del %19" | Consistente con RF132 | Sin cambio (desglose en vuelo) |
| 5 | **RF132** (optimizado 6): idéntico a la regla cerrada (19% del precio base -> subtotal -> 90/10) | Sin columna de IVA | RESUELTO - mantiene la formula aprobada |
| 6 | **No existe RF de descontar stock** tras la compra (solo RF80 verifica que la cantidad no supere stock y RF85 deshabilita si agotado) | `productos.stock` existe y el seed tiene 82 productos con stock | La sugerencia del docx (ver 3.8) propone crearlo: descontar stock al aprobar el pago. Recomendable incorporarlo como RF nuevo |

**Conclusion de la seccion**: los puntos 1 y 2 de la tabla anterior son los dos
**conflictos vigentes mas importantes** para el backend de pagos. Sin su
aclaracion, no se puede cerrar el diseno del modulo de checkout (columnas de
IVA, formula y persistencia).

### 3.8 NUEVO - Sugerencias de agregados y mejoras (docx de Yepes)

El Director compartio tambien el documento `SUGERENCIAS DE AGREGADOS Y
MEJORAS.docx`, que propone 3 RF y 3 RNF nuevos. Los evalue frente al esquema y
a los RF existentes:

| # | Sugerencia | Estado frente al esquema | Mi recomendacion |
|---|---|---|---|
| 1 | **RF Nuevo (Inventario)**: descontar stock del producto al aprobar el pago | `productos.stock` existe; hoy ningun RF lo ordena (RF80/RF85 solo verifican) | **ACEPTAR** como RF nuevo (o fusionar con RF80). Implementar con transaccion + `UPDATE ... SET stock = stock - ?` parametrizado (evita race conditions) |
| 2 | **RF Nuevo (Devoluciones/Cancelaciones)**: cancelar pedido en estado "Pendiente" y restituir stock | `detalle_pedidos.estado_envio ENUM('Pendiente','En camino','Entregado')` soporta el estado | **ACEPTAR** con alcance limitado: solo cancelable mientras `estado_envio = 'Pendiente'` y pago no desembolsado. Restituir stock y registrar `estado_pago_vendedor` |
| 3 | **RF Nuevo (Carritos abandonados)**: vaciar carritos inactivos tras 7 dias | `carrito_items` no tiene `actualizado_en` visible (verificar) | **ACEPTAR** condicionado: requiere `actualizado_en` en `carrito_items` (menor costo) o un job que use `created_at`. Recomiendo migracion de 1 columna |
| 4 | **RNF Nuevo (JWT)**: autenticacion con JWT firmado y con expiracion | Ya decidido en backend (auth-implementation-patterns) | **ACEPTAR** como RNF (cubre RNF8/RNF9). Se implementa en backend; sin impacto en BD |
| 5 | **RNF Nuevo (Transacciones ACID)**: rollback si falla un detalle o pago | Es requerido por el RF nuevo de inventario y por `detalle_pedidos` | **ACEPTAR** como RNF: toda la compra (crear pedido + lineas + descontar stock + pagos) en una transaccion con `ROLLBACK` |
| 6 | **RNF Nuevo (Sanitizacion)**: validaciones estrictas con Joi/Zod | Sin impacto en BD (backend) | **ACEPTAR** como RNF complementario al RNF10. En nuestro backend se usa Zod (regla api-seguridad.md) |

**Recomendacion general**: incorporar estos 6 items al documento oficial de
requerimientos (el Director decide los numeros RF/RNF definitivos). Los puntos
1, 2, 3 y 5 tienen impacto directo en BD y en el modulo de compra; los puntos 4
y 6 son de backend puro.

***

## 4. Verificaciones adicionales realizadas

| Verificacion                                                 | Resultado                                                                                                                                                      |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conexion externa (usuario remoto)                            | OK - `commercy_user@%` accede desde IP externa (permisos habilitados por Meneses el 2026-08-06)                                                                |
| Charset de la base                                           | utf8mb4 / utf8mb4\_unicode\_ci - CORRECTO                                                                                                                      |
| Roles disponibles                                            | comprador (1), vendedor (2), administrador (3) - CORRECTO                                                                                                      |
| Columnas de usuarios                                         | id, email, password, nombre\_completo, foto\_perfil, descripcion\_personal, direccion\_envio, activo, token\_recuperacion, created\_at, updated\_at - CORRECTO |
| Endpoint perfil publico (GET /api/usuarios/perfil-publico/3) | HTTP 200 contra BD real - FUNCIONA                                                                                                                             |
| Indices en FK                                                | Presentes (MUL) - CORRECTO                                                                                                                                     |
| Moneda en precios                                            | DECIMAL(10,2) en productos y detalle\_pedidos (COP) - CORRECTO                                                                                                 |

***

## 5. Acciones solicitadas a base de datos (pendientes para Meneses)

Priorizadas por urgencia:

| # | Accion | Urgencia |
|---|---|---|
| 1 | Corregir **mojibake** en `notificaciones.estado`: cambiar a `enum('leido','no leido')` y auditar otras columnas con acentos (`tipo` ya fue resuelto como VARCHAR(50)) | ALTA |
| 2 | Agregar `token_recuperacion_expiracion DATETIME NULL` en `usuarios` (la regla de 5 minutos ya esta en el RF4 del optimizado4) | MEDIA |
| 3 | Agregar el **dato foto/imagen a pedidos** (o detalle de pedido) que Meneses anuncio (RF imagen del producto; `productos.imagen_url` ya existe) | MEDIA |
| 4 | Confirmar que las 19 tablas permanezcan en `utf8mb4_unicode_ci` y que las FK conserven indice | BAJA (verificacion) |
| 5 | (Cerrado) Seed de datos y modelo de IVA | RESUELTO - seed inyectado (20 usuarios, 82 productos); RF132 definido (precio con IVA incluido, pasarela desglosa, 90/10 sobre subtotal) |
| 6 | **Confirmar con el Director** si el RF116 del optimizado 6 exige **persistir el IVA por producto** (columna `monto_iva`/`subtotal_con_iva` en `detalle_pedidos` o `iva_porcentaje` en `productos`) o si se mantiene el desglose en vuelo del RF132 | ALTA (bloquea checkout) |
| 7 | **Aclarar redaccion del RF47** del optimizado 6 ("el vendedor hace el calculo adicional del IVA") para confirmar que el precio se publica CON IVA incluido y el sistema desglosa | ALTA (bloquea checkout) |
| 8 | (Condicionado a decision del Director) Si se aceptan las sugerencias del docx: descontar stock al aprobar pago (transaccion), cancelacion solo en "Pendiente" con restitucion de stock, y `actualizado_en` en `carrito_items` para carritos abandonados | MEDIA (despues de IVA) |

***

## 6. Clasificacion de los pendientes frente a los requerimientos

Para aclarar el alcance de cada pendiente frente al documento de requerimientos
(125/129 RF + 20 RNF), los clasifique asi:

| # | Pendiente                                              | ¿Va en requerimientos?   | Justificacion                                                                                                                                                                                                                                                                                                |
| - | ------------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | Datos semilla                                          | **NO como RF/RNF**       | No describe comportamiento del sistema; es un artefacto de desarrollo/pruebas. Se maneja como tarea tecnica del area BD (derivada de los RF de catalogo, carrito y pedidos para poder probarlos). Si el proyecto exige demostracion funcional, se registra en el DoD de entrega, no como RF                  |
| 2 | Correccion del ENUM corrupto (`notificaciones.estado`) | **NO como RF/RNF nuevo** | Es un defecto de integridad del esquema (datos corruptos). Se vincula al RF existente de notificaciones (listar con estado leido/no leido): la correccion es condicion para cumplir ese RF. Se documenta como correccion en acta/changelog + migracion SQL                                                   |
| 3 | Expiracion del token de recuperacion                   | **SI - YA INCLUIDA**     | La regla ya quedo escrita en el RF4 del docx `Commercity 2.0 (optimizado4)`: "link de un solo uso que expira a los 5 minutos". Lo pendiente es solo la implementacion en BD (`token_recuperacion_expiracion`) y el backend |

### Texto del requerimiento (punto 3) - ya incorporado en RF4 del optimizado4

El RF4 del docx optimizado4 quedo redactado asi (confirma el texto que yo
propuse, con 5 minutos):

> RF4 - Restablecer contrasena: el usuario solicita el restablecimiento con su
> correo electronico y recibe un link de un solo uso. El link expira a los 5
> minutos de emitido; al vencer, el usuario debe solicitar uno nuevo. Implica
> columna `usuarios.token_recuperacion_expiracion DATETIME NULL` o token JWT
> con expiracion embebida.

***

## 7. Estado de las brechas criticas del informe 2026-08-04

| Brecha                       | Estado anterior | Estado al 2026-08-06                                                        |
| ---------------------------- | --------------- | --------------------------------------------------------------------------- |
| 1. Multi-vendedor en carrito | RESUELTA        | Soportada (agrupacion por vendedor implementada en el carrito)              |
| 2. Envios gratis             | RESUELTA        | Sin costo, solo `direccion_envio`                                           |
| 3. Inventario/concurrencia   | NO IMPLEMENTADA | Pendiente de implementar de forma defensiva en backend                      |
| 4. Moneda COP                | RESUELTA        | Confirmada DECIMAL(10,2)                                                    |
| 5. Impuestos (IVA)           | POSPUESTA       | **EN DECISION (7/08)** - regla cerrada RF132 (precio con IVA incluido, desglose en vuelo, 90/10 sobre subtotal), pero el RF116 del optimizado 6 exige almacenar el IVA por producto: **requiere confirmacion del Director** |
| 6. Devoluciones              | POSPUESTA       | Sin cambios (futuro)                                                        |
| 7. Eliminacion de cuenta     | EN PROCESO      | Sin cambios                                                                 |
| 8. Suspension de vendedores  | EN PROCESO      | Sin cambios                                                                 |

***

## 8. Conclusion

El esquema de `commercity_v2` (oficial de trabajo) esta **estructuralmente sano**
(19 tablas, charset correcto, FKs con indice, conexion externa habilitada).
Meneses avanzo el 2026-08-06/07: corregio `notificaciones.tipo` (ahora
VARCHAR(50)), agrego `estado_envio`, `estado_pago_vendedor` y
`fecha_desembolso` en `detalle_pedidos` ("N a 1 en pedidos"), inyecto el seed
de datos (20 usuarios, 82 productos, 16 categorias, 8 pedidos) y quedo definida
la semilla de roles. **El modelo de IVA quedo cerrado el 2026-08-07 (RF132)**:
precio publicado con IVA incluido, la pasarela desglosa el 19% y las comisiones
90/10 se calculan sobre el subtotal. Lo que falta para terminar de alinear la
BD es:

1. **Corregir el mojibake** de `notificaciones.estado` (unico pendiente de
   notificaciones).
2. **Agregar `token_recuperacion_expiracion`** en `usuarios` (la regla de 5
   minutos ya esta en el RF4 del optimizado 6).
3. **Agregar el dato foto/imagen a pedidos** (anunciado por Meneses) - aun no
   existe columna en `pedidos`/`detalle_pedidos`.
4. **Resolver con el Director (Yepes) el conflicto del optimizado 6**: el RF116
   exige almacenar el IVA por producto (frente al RF132 que lo calcula en
   vuelo) y el RF47 cambia la redaccion de quien calcula el IVA. Esta
   aclaracion **bloquea el modulo de checkout**.
5. **Decidir los RF/RNF sugeridos en el docx** (inventario con descuento de
   stock, cancelaciones en "Pendiente", carritos abandonados, JWT, ACID y
   sanitizacion) - los numeros definitivos los asigna el Director.

Con esos cinco puntos resueltos, los integrantes del backend pueden desarrollar
y probar sus modulos contra la BD real sin fricciones.

---

*Informe generado el 2026-08-06, actualizado el 2026-08-07 (madrugada, tarde y
noche), a partir de consultas de solo lectura a la base oficial `commercity_v2`
del servidor `149.130.178.228` (information_schema + conteos de registros +
prueba del endpoint perfil publico + verificacion de conexion externa), de la
revision de los requerimientos (`Commercity 2.0 Final (optimizado)`,
`Commercity 2.0 (optimizado4)` y la ultima version `Commercity 2.0 (optimizado
6)`), del `seed_commercity.sql` (re-ejecutable, 20 usuarios, 82 productos,
`productos.estado` STORED GENERATED) y de las `SUGERENCIAS DE AGREGADOS Y
MEJORAS.docx` (3 RF y 3 RNF propuestos), mas la transcripcion de los audios 12
y 13 del grupo de lideres. No se modifico ningun dato ni estructura de la base.*
