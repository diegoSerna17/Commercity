# REPORTE DE BASE DE DATOS - COMMERCITY_V2 SEGUN AUDITORIA

**Autor:** Daniel Palacios (Lider backend web)
**Fecha:** 2026-08-07
**Version informe:** 1.0
**Ubicacion:** BD remota `commercity_v2` (149.130.178.228)
**Dirigido a:** Director CommerCity y lideres de area (BD, Backend, Frontend)

***

## 1. De donde sale este reporte

Verifique la base de datos real `commercity_v2` contra la auditoria completa
(`INFORME_AUDITORIA_COMPLETA_2026-08-07.md`, seccion 4.2 y decisiones B-R1 a
B-R5). La verificacion se hizo con consultas directas a `information_schema` de
la BD remota: columnas, tipos, DEFAULT, indices y columnas GENERADAS. Este
reporte es el estado **real y actual**, no teorico.

## 2. Resultado integral

**11/11 puntos en OK.** La base de datos esta alineada con la auditoria. No
quedan brechas de esquema pendientes.

## 3. Migraciones M1-M7 (todas aplicadas)

| Migracion | Que hace | Requerimiento | Estado real |
| --- | --- | --- | --- |
| M1 | `notificaciones.tipo` pasa a `VARCHAR(50)` | RF97 | OK - `varchar(50)` |
| M2 | Corrige mojibake de `notificaciones.estado` a `('leido','no leido')` | RF97 | OK - sin caracteres corruptos |
| M3 | `usuarios.token_recuperacion_expiracion` (DATETIME NULL) | RF4 | OK - columna existe |
| M4 | `detalle_pedidos.imagen_url` (VARCHAR(500) NULL) | RF120/RF31 | OK - columna existe |
| M5 | `pagos_simulados.estado` DEFAULT 'Pendiente' | RF114 | OK - DEFAULT 'Pendiente' |
| M6 | `carrito_items.updated_at` con ON UPDATE | RF136 | OK - columna existe |
| M7 | Indice FULLTEXT `ft_productos_busqueda` en productos | RF88 | OK - indice existe |

## 4. Decisiones de la auditoria (B-R1 a B-R5) verificadas en la BD

| Decision | Que se acordo | Estado real en la BD |
| --- | --- | --- |
| B-R1 | IVA incluido en el precio publicado (RF47) | OK - sin columnas de IVA en `productos` |
| B-R2 | IVA se calcula en vuelo, NO se almacena (RF116/RF132) | OK - `pedidos.iva_total` **eliminado** |
| B-R3 | Productos se suspenden con `eliminado_por_admin = 1`, jamas DELETE | OK - columna existe; `productos.estado` es STORED GENERATED |
| B-R4 | Cuentas se desactivan con `activo = 0`, jamas DELETE | OK - `usuarios.estado` **eliminado**; `activo` es el unico mecanismo |
| B-R5 | Baneo: pagados se completan, Pendientes se cancelan con stock | OK - `estado_envio` incluye 'Cancelado' (RF135) |

## 5. Cambios reversados (correccion a lo que se habia desviado)

Durante la auditoria se detectaron cambios en la BD que contradijeron las
decisiones cerradas. Todos fueron corregidos y verificados:

| Cambio que se habia aplicado | Problema | Estado final |
| --- | --- | --- |
| `pedidos.iva_total` | Contradecia B-R2 (el IVA no se almacena) | **ELIMINADO** - ya no existe |
| `usuarios.estado` ENUM('activo','suspendido','baneado','eliminado') | Duplicaba `activo` (B-R4) y generaba dos mecanismos | **ELIMINADO** - `activo` es el unico |
| `productos.estado` como ENUM editable | Perdia la generacion automatica (B-R3, regla mysql-convenciones) | **RESTAURADA** como STORED GENERATED |

## 6. Detalle de columnas clave verificadas

### usuarios (desactivacion logica, B-R4)
- `activo TINYINT(1)` - unico mecanismo de estado (1 activo / 0 desactivado).
- `token_recuperacion VARCHAR(100)` + `token_recuperacion_expiracion DATETIME` (M3, RF4).

### productos (suspension, B-R3)
- `estado ENUM('Disponible','Agotado') AS (IF(stock > 0,'Disponible','Agotado')) STORED` - **GENERADA**: el backend jamas la inserta ni actualiza.
- `eliminado_por_admin TINYINT(1)` - suspension por admin (B-R3).
- Indice FULLTEXT `ft_productos_busqueda` (nombre, descripcion) (M7, RF88).

### detalle_pedidos (lineas de pedido)
- `estado_envio ENUM('Pendiente','En camino','Entregado','Cancelado')` (RF119/RF120/RF135).
- `monto_vendedor DECIMAL(12,2) STORED GENERATED` = `subtotal * 0.90` (RF131).
- `monto_comision DECIMAL(12,2) STORED GENERATED` = `subtotal * 0.10` (RF56).
- `imagen_url VARCHAR(500) NULL` (M4, RF120/RF31).

### pagos_simulados (pago, RF114)
- `estado ENUM('Aprobado','Rechazado','Pendiente') DEFAULT 'Pendiente'` (M5).

### carrito_items (carrito abandonado, RF136)
- `added_at TIMESTAMP` + `updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` (M6).

### notificaciones (RF97)
- `tipo VARCHAR(50)` (M1) y `estado ENUM('leido','no leido')` sin mojibake (M2).

## 7. Que NO se borro

Ninguna tabla, registro ni historial fue eliminado. Los cambios fueron DDL
(ALTER TABLE) y la data de prueba del seed sigue intacta (172 usuarios, 332
productos, 38 pedidos, 10 notificaciones verificados).

## 8. Conclusion

La base de datos `commercity_v2` queda **100% alineada con la auditoria**:
las 7 migraciones M1-M7 estan aplicadas, las 5 decisiones B-R1 a B-R5 estan
verificadas en el esquema real, y los 3 cambios que se habian desviado de las
decisiones (iva_total, usuarios.estado, productos.estado editable) fueron
corregidos. Los modulos de backend (auth, historial, carrito) ya son
consistentes con esta BD. No quedan brechas de esquema para la entrega del
martes 11/08.

---

*Reporte generado el 2026-08-07 por Daniel Palacios tras verificar la BD real
`commercy_v2` (information_schema, indices y columnas GENERADAS) contra la
auditoria completa. Evidencia: 11/11 puntos OK.*
