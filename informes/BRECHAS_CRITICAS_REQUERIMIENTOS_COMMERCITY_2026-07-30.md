# BRECHAS CRITICAS EN REQUERIMIENTOS COMMERCITY 2.0

**Fecha:** 2026-08-03
**Categoria:** CRITICO - Afecta el esquema de BD y logica de backend
**Fuente:** Analisis del documento `Commercity 2.0 (optimizado).docx` (125 RF + 20 RNF)

---

## Contexto

El documento de requerimientos entregado por el lider de desarrollo contiene 145 requerimientos (125 funcionales + 20 no funcionales). Sin embargo, se identificaron 8 brechas criticas que **deben ser aclaradas antes de disenar el esquema de base de datos**, porque afectan directamente la estructura de las tablas de `pedidos`, `pedido_items`, `envios`, `productos` y `usuarios`, asi como la logica de negocio del backend.

---

## Brechas criticas

### 1. Multi-vendedor en carrito

| Atributo | Detalle |
|----------|---------|
| **Requerimiento relacionado** | RF106 |
| **Problema** | No se define que pasa si el carrito contiene productos de 2 o mas vendedores distintos |
| **Verificar** | Se genera 1 pedido por vendedor (pedidos separados) o 1 pedido combinado con items de varios vendedores? |
| **Propuesta de solucion** | Generar 1 pedido por vendedor al confirmar compra: tabla `pedidos` con campo `vendedor_id`, y tabla `pedido_items` con los productos. Ventajas: cada vendedor gestiona solo sus pedidos (RF111-RF114), simplifica la distribucion 90/10 (RF124), y el historial por vendedor queda aislado |
| **Impacto en BD** | Define si la tabla `pedidos` necesita campo `vendedor_id` (1 pedido = 1 vendedor) o si se requiere tabla intermedia `pedido_items` con `vendedor_id` por item (pedido combinado) |
| **Impacto en backend** | La logica de generacion de pedido cambia completamente: agrupar por vendedor vs. un solo pedido con referencia a multiples vendedores |

### 2. Envios y costos de envio

| Atributo | Detalle |
|----------|---------|
| **Requerimiento relacionado** | RF107, RF112 |
| **Problema** | RF107 menciona "envio gratis" pero no hay regla definida para el calculo de envio |
| **Verificar** | El envio es gratis siempre? Es gratis sobre cierto monto minimo? Se cobra costo fijo? Depende del peso o dimensiones? |
| **Propuesta de solucion** | Costo fijo por vendedor (ej. $8.000) + envio gratis sobre monto minimo (ej. > $100.000). Tabla `envios` con `costo_envio` calculado al generar pedido y persistido en `pedidos` |
| **Impacto en BD** | Necesidad de tabla `envios` con campos: costo_envio, metodo_envio, direccion_envio, estado_envio |
| **Impacto en backend** | Logica de calculo de costo de envio en el total del pedido (RF107 requiere mostrar "envio gratis" en el resumen) |

### 3. Inventario / Concurrencia

| Atributo | Detalle |
|----------|---------|
| **Requerimiento relacionado** | RF44, RF76, RF81 |
| **Problema** | No se define que pasa si 2 compradores intentan comprar el ultimo item en stock simultaneamente (condicion de carrera) |
| **Verificar** | Se usa transaccion con bloqueo de fila (SELECT ... FOR UPDATE)? Se valida stock en el momento de agregar al carrito o al generar el pedido? Que pasa si el stock cambia entre carrito y pago? |
| **Propuesta de solucion** | Validacion de stock en 2 puntos: (1) al agregar al carrito como verificacion informativa, (2) al generar el pedido con transaccion `SELECT ... FOR UPDATE` y decremento atomico `UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?`. Si falla, rechazar el pedido |
| **Impacto en BD** | Campo `stock` en tabla `productos` debe tener control de concurrencia atomico |
| **Impacto en backend** | Transacciones SQL con bloqueo, validacion de stock en 2 puntos: carrito y generacion de pedido (RF76: verificar que no supere stock disponible) |

### 4. Moneda

| Atributo | Detalle |
|----------|---------|
| **Requerimiento relacionado** | RF31, RF44, RF112, RF123 |
| **Problema** | No se especifica la moneda de los precios y montos |
| **Verificar** | La moneda es Peso colombiano (COP)? Se usan enteros o decimales para precios? (Ejemplo: $79.000 COP) |
| **Propuesta de solucion** | Precios en COP como `DECIMAL(10,2)` para soportar centimos y redondeo exacto. Formateo de salida con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })`. Calculos de total y comisiones en el backend usando numeros enteros (centavos) para evitar errores de punto flotante |
| **Impacto en BD** | Tipo de dato del campo `precio`: DECIMAL(10,2) o INT (centavos/centimos) |
| **Impacto en backend** | Formateo de precios, redondeo en calculos de total y comisiones (RF124: 90/10) |

### 5. Impuestos

| Atributo | Detalle |
|----------|---------|
| **Requerimiento relacionado** | RF107, RF124, RF125 |
| **Problema** | No se menciona IVA, impuestos o cargos adicionales sobre las transacciones |
| **Verificar** | Se aplica IVA (19% en Colombia) sobre los productos? El precio mostrado incluye o excluye impuestos? La comision del 10% se calcula antes o despues de impuestos? |
| **Propuesta de solucion** | Precio mostrado incluye IVA (estandar retail colombiano). Comision del 10% se calcula sobre el valor total de la venta (con IVA incluido) para simplificar el calculo de ganancias 90/10 (RF124-RF125). Validar con el lider si la comision debe excluir IVA |
| **Impacto en BD** | Campo `impuesto` o `iva` en productos y pedidos, o tabla de impuestos |
| **Impacto en backend** | Calculo de impuestos en totales, afecta la distribucion 90/10 (RF124-RF125) |

### 6. Devoluciones / Reembolsos

| Atributo | Detalle |
|----------|---------|
| **Requerimiento relacionado** | RF106-RF110, RF112-RF114 |
| **Problema** | No existe proceso de devolucion, cancelacion de pedido o reembolso definido |
| **Verificar** | Puede el comprador cancelar un pedido antes de ser enviado? Existe politica de devolucion? Como se revierte la comision del 10% si hay reembolso? |
| **Propuesta de solucion** | Estados de pedido: Pendiente, En camino, Entregado, Cancelado, Reembolsado. Cancelacion permitida solo si estado = Pendiente. Al cancelar: reversa de comision (RF124-RF125) y restitucion de stock al producto. El comprador ve el estado en su historial (RF27-RF28) |
| **Impacto en BD** | Campo `estado` en pedidos debe contemplar: Pendiente, En camino, Entregado, Cancelado, Reembolsado |
| **Impacto en backend** | Logica de cancelacion, reversa de comisiones y ganancias en caso de reembolso |

### 7. Eliminacion de cuenta y datos

| Atributo | Detalle |
|----------|---------|
| **Requerimiento relacionado** | RF39 |
| **Problema** | RF39 permite eliminar la cuenta, pero no se define que pasa con los datos asociados |
| **Verificar** | Al eliminar la cuenta: se eliminan los productos publicados? Que pasa con pedidos historicos y ventas pendientes? Se usa borrado logico (soft delete) para conservar integridad referencial? |
| **Propuesta de solucion** | Soft delete con campo `deleted_at` en `usuarios`. Al eliminar cuenta: desactivar productos activos del vendedor, conservar pedidos historicos (los datos del usuario se preservan en el pedido), bloquear login. El historial de compras del comprador (RF27) se conserva como registro historico |
| **Impacto en BD** | Campo `eliminado` / `deleted_at` en `usuarios` (soft delete) para conservar historial de pedidos y ventas |
| **Impacto en backend** | Al eliminar cuenta: desactivar productos activos, manejar pedidos en curso, conservar integridad de historial de compras del comprador |

### 8. Suspension de vendedores

| Atributo | Detalle |
|----------|---------|
| **Requerimiento relacionado** | RF70 |
| **Problema** | El admin puede banear/desactivar usuarios (RF70) pero no se define que pasa con los productos y pedidos del vendedor baneado |
| **Verificar** | Al banear a un vendedor: se ocultan o eliminan sus productos publicados? Que pasa con sus pedidos en curso (Pendiente/En camino)? Puede el vendedor baneado acceder a su panel para resolver pedidos pendientes? |
| **Propuesta de solucion** | Campo `estado` en `usuarios` (activo/baneado). Al banear: ocultar productos del vendedor en el panel principal y busqueda, pero conservar pedidos en curso hasta completarse. El vendedor baneado conserva acceso de solo-lectura para resolver pedidos pendientes pero no puede publicar ni generar nuevos pedidos |
| **Impacto en BD** | Campo `estado` en `usuarios` (activo/baneado), logica de visibilidad de productos por estado del vendedor |
| **Impacto en backend** | Middleware de autorizacion debe validar estado del usuario, ocultar productos de vendedores baneados, gestionar pedidos en transito |

---

## Matriz de prioridad

| Prioridad | Brecha | Urgencia | Impacto |
|:---------:|--------|:--------:|:-------:|
| 1 | Multi-vendedor en carrito | ALTA | Define estructura de `pedidos` y `pedido_items` |
| 2 | Envios y costos | ALTA | Define tabla `envios` |
| 3 | Inventario / concurrencia | ALTA | Define control atomico de stock |
| 4 | Moneda | MEDIA | Define tipo de dato de precios |
| 5 | Impuestos | MEDIA | Define calculo de totales y comisiones |
| 6 | Devoluciones | MEDIA | Define estados adicionales de pedidos |
| 7 | Eliminacion de cuenta | MEDIA | Define soft delete y manejo de datos |
| 8 | Suspension de vendedores | MEDIA | Define estado de usuario y visibilidad |

---

## Acciones recomendadas

1. **Revisar antes de iniciar el diseño del esquema de BD**
2. **Priorizar las brechas 1-3** (multi-vendedor, envios, inventario): son las que mas impacto tienen en la arquitectura de datos.
3. **Documentar las decisiones**  en una nueva version del documento de requerimientos para evitar ambiguedades durante el desarrollo.

---

*Documento generado el 2026-07-30 a partir del analisis del documento de requerimientos CommerCity 2.0.*
