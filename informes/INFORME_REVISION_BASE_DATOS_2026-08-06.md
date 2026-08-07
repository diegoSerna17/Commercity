# INFORME DE REVISION - BASE DE DATOS COMMERCITY (commercity\_v2)

**Autor:** Daniel Palacios (Lider backend web)
**Fecha:** 2026-08-06
**Version informe:** 1.0
**Categoria:** Revision tecnica de la base de datos remota del equipo
**Dirigido a:** Jorge Andres Meneses (Lider Base de Datos) y grupo de lideres

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

### 3.1 CRITICO - La BD no tiene datos de negocio para probar

Conteo real de registros consultado el 2026-08-06:

| Tabla            | Registros                              |
| ---------------- | -------------------------------------- |
| usuarios         | 4 (todos de prueba de vitest)          |
| productos        | 0                                      |
| categorias       | 0                                      |
| pedidos          | 0                                      |
| detalle\_pedidos | 0                                      |
| carrito\_items   | 0                                      |
| roles            | 3 (comprador, vendedor, administrador) |

Los unicos usuarios existentes son `vitest_user_*` y `vend_*` creados por las
pruebas automaticas, con contraseñas de prueba. No existe ningun usuario real
de comprador, vendedor o administrador para validar flujos de autenticacion,
catalogo, carrito, pedidos o historial.

**Impacto**: ningun integrante puede probar su modulo contra la BD real hasta
que existan datos semilla (categorias, productos, vendedores, administrador).

### 3.2 CRITICO - Mojibake en un ENUM (caracteres corruptos)

La columna `notificaciones.estado` quedo definida como:

```
enum('le├¡do','no le├¡do')
```

cuando debe ser `enum('leido','no leido')` (o con acentos bien codificados:
`leído` / `no leído`). El charset de la columna es `utf8mb4`, pero el DDL
original se ejecuto con encoding roto y los valores del ENUM quedaron corruptos.
Esto afectara el guardado y lectura de notificaciones desde el backend.

**Impacto**: si el backend guarda `'leido'` en esa columna, MySQL lo rechazara
porque el ENUM no contiene ese valor. Hay que corregir el ENUM y verificar que
ninguna otra columna tenga caracteres rotos (revisar todas las columnas con
acentos, en especial las de tipo ENUM y VARCHAR con texto en espanol).

### 3.3 MEDIO - Recuperacion de contrasena sin expiracion

La tabla `usuarios` tiene la columna `token_recuperacion varchar(100)` (ya
existe, correcto para el flujo con Resend aprobado por el grupo). Sin embargo,
no existe columna de expiracion. Para que el link de recuperacion caduque, se
requiere una de estas opciones:

- Agregar `token_recuperacion_expiracion DATETIME NULL`, o
- Que el backend guarde un JWT con expiracion embebida en el varchar(100).

### 3.4 INFORMATIVO - Decision oficial de IVA (no requiere migracion)

Confirmado con Yepes el 2026-08-06 (8:12 PM), la regla definitiva del proyecto es:

1. El precio publicado por el vendedor **ya incluye el IVA 19%** (precio final).
2. El detalle del pedido muestra **solo el monto total**, sin desglose.
3. Las comisiones (10% admin / 90% vendedor) se calculan sobre el **subtotal
   sin IVA**, soportado por `detalle_pedidos.monto_vendedor` y
   `detalle_pedidos.monto_comision`.

**Implicacion tecnica**: NO se requiere crear tabla ni columna de IVA para el
flujo de pedidos. Queda descartada la migracion que se habia propuesto
anteriormente (categoria "POSPUESTA" de la brecha 5 del informe 2026-08-04).

### 3.5 INFORMATIVO - Multi-producto y precio unitario ya soportados

`detalle_pedidos` ya tiene `precio_unitario_historico`, `cantidad`, `subtotal`,
`vendedor_id`, `monto_vendedor` y `monto_comision`. Esto cubre:

- Pedidos multi-producto (1 pedido, N lineas).
- Precio unitario por cantidad (decision del grupo 2026-08-06).
- Comisiones 90/10 por linea.

No se requiere migracion para estas decisiones.

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

| # | Accion                                                                                                                                                                                            | Urgencia                                                         |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1 | Crear **datos semilla** en `commercity_v2`: categorias (3-5), productos de ejemplo (10+, varios vendedores, stock, precio final con IVA 19% incluido), 2-3 vendedores de prueba y 1 administrador | ALTA - bloquea pruebas de catalogo, carrito, pedidos e historial |
| 2 | Corregir **mojibake** en `notificaciones.estado`: cambiar a `enum('leido','no leido')` y auditar otras columnas con acentos                                                                       | ALTA                                                             |
| 3 | Definir expiracion de `token_recuperacion` (columna `token_recuperacion_expiracion DATETIME NULL` o JWT con `exp`)                                                                                | MEDIA                                                            |
| 4 | Confirmar que las 19 tablas permanezcan en `utf8mb4_unicode_ci` y que las FK conserven indice                                                                                                     | BAJA (verificacion)                                              |
| 5 | NO crear tabla/columna de IVA (decision oficial 2026-08-06)                                                                                                                                       | INFORMATIVA                                                      |

***

## 6. Clasificacion de los pendientes frente a los requerimientos

Para aclarar el alcance de cada pendiente frente al documento de requerimientos
(125/129 RF + 20 RNF), los clasifique asi:

| # | Pendiente                                              | ¿Va en requerimientos?   | Justificacion                                                                                                                                                                                                                                                                                                |
| - | ------------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | Datos semilla                                          | **NO como RF/RNF**       | No describe comportamiento del sistema; es un artefacto de desarrollo/pruebas. Se maneja como tarea tecnica del area BD (derivada de los RF de catalogo, carrito y pedidos para poder probarlos). Si el proyecto exige demostracion funcional, se registra en el DoD de entrega, no como RF                  |
| 2 | Correccion del ENUM corrupto (`notificaciones.estado`) | **NO como RF/RNF nuevo** | Es un defecto de integridad del esquema (datos corruptos). Se vincula al RF existente de notificaciones (listar con estado leido/no leido): la correccion es condicion para cumplir ese RF. Se documenta como correccion en acta/changelog + migracion SQL                                                   |
| 3 | Expiracion del token de recuperacion                   | **SI (RF o RNF)**        | Es una regla de negocio y de seguridad del producto: "el link de recuperacion de contrasena caduca en X tiempo". Debe quedar escrita en el RF de recuperacion de contrasena (modulo autenticacion) o como RNF de seguridad (caducidad de tokens). Es decision que debe confirmar Yepes (duracion de validez) |

### Texto propuesto para el requerimiento (punto 3)

Para la proxima revision de requerimientos, propongo registrar en el RF de
recuperacion de contrasena:

> RF - Recuperacion de contrasena: el usuario solicita el restablecimiento con
> su correo electronico y recibe un link de un solo uso. El link expira a los
> N minutos de emitido (por definir con el Director: 10, 60 o 1440); al vencer,
> el usuario debe solicitar uno nuevo. Implica columna
> `usuarios.token_recuperacion_expiracion DATETIME NULL` o token JWT con
> expiracion embebida.

***

## 7. Estado de las brechas criticas del informe 2026-08-04

| Brecha                       | Estado anterior | Estado al 2026-08-06                                                        |
| ---------------------------- | --------------- | --------------------------------------------------------------------------- |
| 1. Multi-vendedor en carrito | RESUELTA        | Soportada (agrupacion por vendedor implementada en el carrito)              |
| 2. Envios gratis             | RESUELTA        | Sin costo, solo `direccion_envio`                                           |
| 3. Inventario/concurrencia   | NO IMPLEMENTADA | Pendiente de implementar de forma defensiva en backend                      |
| 4. Moneda COP                | RESUELTA        | Confirmada DECIMAL(10,2)                                                    |
| 5. Impuestos (IVA)           | POSPUESTA       | **CERRADA por decision oficial**: precio final incluye 19%, sin columna IVA |
| 6. Devoluciones              | POSPUESTA       | Sin cambios (futuro)                                                        |
| 7. Eliminacion de cuenta     | EN PROCESO      | Sin cambios                                                                 |
| 8. Suspension de vendedores  | EN PROCESO      | Sin cambios                                                                 |

***

## 8. Conclusion

El esquema de `commercity_v2` (oficial de trabajo) esta **estructuralmente sano**
(19 tablas, charset correcto, FKs con indice, columnas alineadas al contrato
que usa el backend, conexion externa habilitada). Lo que falta para poder
trabajar bien el backend es:

1. **Datos semilla** en `commercity_v2` (bloqueante para las pruebas de todos
   los modulos).
2. **Correccion del ENUM corrupto** de `notificaciones.estado`.
3. **Definir la expiracion del token de recuperacion** (flujo Resend).

No hay pendiente de migracion de IVA (decision oficial 2026-08-06). Con esos
tres puntos resueltos, los integrantes del backend pueden desarrollar y probar
sus modulos contra la BD real sin fricciones.

***

*Informe generado el 2026-08-06 a partir de consultas de solo lectura a la base
oficial `commercity_v2` del servidor `149.130.178.228` (information_schema +
conteos de registros + prueba del endpoint perfil publico + verificacion de
conexion externa). No se modifico ningun dato ni estructura.*
