# BRECHAS CRITICAS EN REQUERIMIENTOS COMMERCITY 2.0 - ESTADO DE RESOLUCION

**Fecha:** 2026-08-04
**Version informe:** 2.0
**Categoria:** CRITICO - Afecta el esquema de BD y logica de backend
**Fuentes:**
- Documento `Commercity 2.0 (optimizado).docx` (125 RF + 20 RNF) - version original
- Documento `Commercity 2.0 (optimizado) REVISION.docx` (129 RF + 20 RNF) - version revisada
- Documento `Cambios de Brechas Criticas REVISION.docx` - respuesta del lider punto por punto

---

## Contexto

Se identificaron 8 brechas criticas en los requerimientos que afectan el esquema de base de datos y la logica de backend. El lider de desarrollo (Yepes) respondio cada punto en el documento `Cambios de Brechas Criticas REVISION.docx` con codificacion de colores:

- **VERDE**: Cambio implementado en la REVISION de requerimientos
- **AMARILLO**: Se puede cambiar, se evalua implementar
- **ROJO**: No se podra cambiar por cuestion de tiempo (pero posible en el futuro)

**Resultado global: 4 resueltas, 2 en proceso, 2 pospuestas, 1 rechazada temporalmente.**

---

## Estado de las brechas

### 1. Multi-vendedor en carrito - RESUELTA (VERDE)

| Atributo | Detalle |
|----------|---------|
| **Requerimiento relacionado** | RF109 (REVISION) - antes RF106 |
| **Problema** | No se definia que pasa si el carrito contiene productos de 2 o mas vendedores distintos |
| **Respuesta del lider** | Ya especificado: una persona puede pagar varios productos en el carrito pero cada producto o pedido ira a su respectivo vendedor |
| **Propuesta de solucion** | 1 pedido por vendedor al confirmar compra: tabla `pedidos` con campo `vendedor_id`, y tabla `pedido_items` con los productos. Ventajas: cada vendedor gestiona solo sus pedidos, simplifica la distribucion 90/10 (RF127-RF128), historial por vendedor aislado |
| **Impacto en BD** | Tabla `pedidos` con campo `vendedor_id` (1 pedido = 1 vendedor) + tabla `pedido_items` |
| **Impacto en backend** | Logica de agrupacion por vendedor al generar pedidos desde el carrito |

### 2. Envios y costos de envio - RESUELTA (VERDE)

| Atributo | Detalle |
|----------|---------|
| **Requerimiento relacionado** | RF110 (REVISION) - antes RF107, RF112 |
| **Problema** | No habia regla definida para el calculo de envio |
| **Respuesta del lider** | Por el momento envio gratis para siempre. En el futuro, al terminar el proyecto, se evalua cambiar esa parte |
| **Propuesta de solucion** | No se requiere tabla de costos de envio. Solo campo `direccion_envio` en pedidos (RF115). Si en el futuro se cobra, se agrega campo `costo_envio` |
| **Impacto en BD** | Sin tabla de costos de envio por ahora. Campo `direccion_envio` en pedidos |
| **Impacto en backend** | Sin calculo de costo de envio. RF110 muestra "envio gratis siempre" en el resumen |

### 3. Inventario / Concurrencia - NO IMPLEMENTADA (ROJO)

| Atributo | Detalle |
|----------|---------|
| **Requerimiento relacionado** | RF78 (REVISION) - antes RF44, RF76, RF81 |
| **Problema** | No se define que pasa si 2 compradores intentan comprar el ultimo item en stock simultaneamente |
| **Respuesta del lider** | Buena propuesta pero es muy especifica y se escapa de sus manos: requiere modificar la base de datos y actualmente no lidera esa area; el grupo no quiere corregir errores en la BD |
| **Propuesta de solucion** | Validacion de stock en 2 puntos: (1) al agregar al carrito (informativa), (2) al generar el pedido con transaccion `SELECT ... FOR UPDATE` y decremento atomico `UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?` |
| **Impacto en BD** | Campo `stock` en tabla `productos` con control de concurrencia atomico |
| **Impacto en backend** | Transacciones SQL con bloqueo. RECOMENDACION: implementar de forma defensiva en el backend aun sin aprobacion formal, para evitar errores de stock al lanzar |

### 4. Moneda - RESUELTA (VERDE)

| Atributo | Detalle |
|----------|---------|
| **Requerimiento relacionado** | RF129 (REVISION, nuevo) - antes RF31, RF44, RF112, RF123 |
| **Problema** | No se especificaba la moneda de los precios |
| **Respuesta del lider** | Ya lo habia implementado (moneda colombiana COP) pero se le paso documentarlo en los requerimientos. Agradece el aporte |
| **Propuesta de solucion** | Precios en COP como `DECIMAL(10,2)`. Formateo con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })`. Calculos en centavos para evitar errores de punto flotante |
| **Impacto en BD** | Campo `precio` tipo DECIMAL(10,2) |
| **Impacto en backend** | Formateo COP, calculo 90/10 (RF127-RF128) en enteros |

### 5. Impuestos (IVA) - POSPUESTA (AMARILLO)

| Atributo | Detalle |
|----------|---------|
| **Requerimiento relacionado** | RF110, RF127, RF128 (REVISION) - antes RF107, RF124, RF125 |
| **Problema** | No se menciona IVA ni impuestos sobre transacciones |
| **Respuesta del lider** | El IVA por el momento no se va a implementar. Lo hablara en el salon; si seria bueno hacerlo en el futuro o lo mas pronto posible |
| **Propuesta de solucion** | Precio mostrado incluye IVA (estandar retail colombiano). Comision 10% sobre valor total de venta. A implementar cuando el lider lo apruebe |
| **Impacto en BD** | Campo `impuesto`/`iva` en productos y pedidos (futuro) |
| **Impacto en backend** | Calculo de impuestos en totales, afecta distribucion 90/10 (futuro) |

### 6. Devoluciones / Reembolsos - POSPUESTA (AMARILLO)

| Atributo | Detalle |
|----------|---------|
| **Requerimiento relacionado** | RF109-RF113, RF115-RF117 (REVISION) - antes RF106-RF110, RF112-RF114 |
| **Problema** | No existe proceso de devolucion, cancelacion o reembolso |
| **Respuesta del lider** | Si seria bueno: que el usuario pueda cancelar el pedido despues de que no este "En camino". Se podria implementar al terminar el proyecto. El reembolso requiere numero de guia para productos y es demorado; si da el tiempo se implementa |
| **Propuesta de solucion** | Estados: Pendiente, En camino, Entregado, Cancelado. Cancelacion permitida si estado = Pendiente. Al cancelar: reversa de comision y restitucion de stock |
| **Impacto en BD** | Campo `estado` en pedidos contempla Cancelado (futuro) |
| **Impacto en backend** | Logica de cancelacion y reversa de comisiones (futuro) |

### 7. Eliminacion de cuenta y datos - EN PROCESO (AMARILLO)

| Atributo | Detalle |
|----------|---------|
| **Requerimiento relacionado** | RF40 (REVISION, nuevo) - antes RF39 |
| **Problema** | RF40 ahora dice: "borrara todos los datos del vendedor despues de que elimine su cuenta, menos las cosas relacionadas con historiales como pedidos y reportes" |
| **Respuesta del lider** | Va a definir mucho mas que pasa si alguien elimina su cuenta |
| **Propuesta de solucion** | Borrado logico (soft delete `deleted_at`) O borrado fisico selectivo: eliminar datos personales pero conservar pedidos y reportes. Validar con el lider el mecanismo |
| **Impacto en BD** | Campo `deleted_at` en `usuarios` + conservar pedidos/reportes con datos preservados |
| **Impacto en backend** | Al eliminar cuenta: desactivar productos, conservar historial de pedidos/reportes |

### 8. Suspension de vendedores - EN PROCESO (AMARILLO)

| Atributo | Detalle |
|----------|---------|
| **Requerimiento relacionado** | RF72 (REVISION, nuevo) - antes RF70 |
| **Problema** | RF72 ahora dice: "Si el administrador Banea a un vendedor sus productos quedaran suspendidos y tambien su cuenta" |
| **Respuesta del lider** | Productos se desactivan (lo especificara en requerimientos). Sobre pedidos: tema complejo; tal vez dejar habilitado solo el panel de pedidos para que pueda gestionarlos, pero no podra publicar productos ni comprar mientras su situacion sea definida |
| **Propuesta de solucion** | Campo `estado` en `usuarios` (activo/baneado). Al banear: ocultar productos, conservar acceso solo al panel de pedidos para resolver pendientes. No puede publicar ni comprar |
| **Impacto en BD** | Campo `estado` en `usuarios` + logica de visibilidad de productos por estado del vendedor |
| **Impacto en backend** | Middleware de autorizacion valida estado del usuario: acceso restringido a panel de pedidos |

---

## Matriz de prioridad actualizada

| # | Brecha | Estado | Urgencia |
|---|--------|:------:|:--------:|
| 1 | Multi-vendedor en carrito | RESUELTA | ALTA - implementar agrupacion por vendedor |
| 2 | Envios (gratis siempre) | RESUELTA | ALTA - sin costo, solo direccion |
| 3 | Inventario / concurrencia | NO IMPLEMENTADA | ALTA - riesgo en produccion, implementar defensivo |
| 4 | Moneda COP | RESUELTA | ALTA - DECIMAL(10,2) |
| 5 | Impuestos (IVA) | POSPUESTA | MEDIA - futuro |
| 6 | Devoluciones | POSPUESTA | MEDIA - futuro |
| 7 | Eliminacion de cuenta | EN PROCESO | MEDIA - definir mecanismo |
| 8 | Suspension de vendedores | EN PROCESO | MEDIA - definir alcance de panel |

---

## Cambios de numeracion RF (original -> REVISION)

La REVISION agrego 4 nuevos RF, desplazando la numeracion:

| RF original | RF REVISION | Descripcion |
|:-----------:|:-----------:|-------------|
| - | RF40 (nuevo) | Eliminar cuenta borra datos del vendedor, conserva historiales |
| - | RF72 (nuevo) | Baneo suspende productos y cuenta del vendedor |
| - | RF109 (nuevo) | Carrito con multiples vendedores, pedidos por vendedor |
| - | RF129 (nuevo) | Moneda colombiana COP (simulado) |
| RF106 | RF109 | Generar pedidos desde carrito |
| RF107 | RF110 | Resumen con envio gratis siempre |
| RF44 | RF45 | Formulario producto con stock |
| RF76 | RF78 | Seleccionar cantidad sin superar stock |
| RF70 | RF72 | Banear/activar/eliminar usuarios |
| RF39 | RF40 | Eliminar cuenta |

---

## Acciones recomendadas

1. **Revisar antes de iniciar el diseno del esquema de BD**: considerar los 8 puntos con su estado de resolucion actual.
2. **Priorizar implementacion**: puntos 1, 2 y 4 (resueltos) son la base del esquema: `pedidos` con `vendedor_id`, `pedido_items`, `precio DECIMAL(10,2)`, `direccion_envio`.
3. **Implementar punto 3 (inventario) de forma defensiva** en el backend aunque no este aprobado formalmente: evitar errores de stock al lanzar es critico.
4. **Esperar definicion de puntos 7 y 8** (en proceso) antes de definir el campo `estado` de usuarios.
5. **Documentar decisiones** en una nueva version de requerimientos (REVISION) para evitar ambiguedades.

---

*Documento generado el 2026-08-04 a partir de la version 1.0 y la respuesta del lider (documento Cambios de Brechas Criticas REVISION).*
