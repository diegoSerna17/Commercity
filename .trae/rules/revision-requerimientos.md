---
description: Checklist unico de revision de codigo contra los requerimientos oficiales (version final 2026-08-20 del Director). Usar en cada revision de entrega de modulo backend.
globs: "**/*.{js,jsx,sql}"
alwaysApply: true
---

## Revision contra Requerimientos (Proyecto CommerCity)

### 1. Documento oficial de requerimientos (unico vigente)

- El documento de referencia para TODAS las revisiones es la **version final 2026-08-20 del Director**: `LAST VERSION/Commercity (optimizado)/Commercity (optimizado).docx.md` (Version 2.0, numeracion actualizada por Yepes).
- Quedan DESCARTADOS como fuente de requerimientos: `Commercity 2.0 (optimizado 6)`, `Commercity 2.0 Final (optimizado)`, `Commercity 2.0 (optimizado4)`, `Análisis del proyecto.pdf` y cualquier otra version.
- La numeracion cambio en la version 20/08: la cancelacion paso de RF135 a RF35, el perfil publico de RF106 a RF110, el IVA/desglose se reparte en RF48/RF120/RF121/RF140 y la moneda COP es RF141. Si un RF citado en codigo, informe o regla no coincide con la numeracion del 20/08, la del 20/08 manda.

### 2. Mapeo RF/RNF por modulo backend (numeros vigentes en el documento 2026-08-20)

| Modulo | RF principales | RNF |
|---|---|---|
| Autenticacion (JWT + RBAC) | RF1-RF10 | RNF1 (JWT) |
| Carrito | RF111-RF116 | - |
| Pedidos y Pago | RF117-RF124, RF140 | RNF ACID (sugerencia Director) |
| Historial de compras | RF26-RF36 | - |
| Catalogo / Producto | RF81-RF90 | - |
| Mi Tienda (90/10) | RF130-RF139, RF140 | RNF11 |
| Reportes | RF63-RF69 (admin), RF85-RF86 (reportar producto), RF108-RF109 (reportar usuario) | - |
| Panel Admin | RF57-RF80 | - |
| Panel Principal + busqueda | RF91-RF98 | - |
| Notificaciones | RF99-RF104 | - |
| Interaccion comprador-vendedor | RF105-RF110 (chat RF105, seguidores RF106, calificar RF107, reportar chat RF108-RF109, perfil publico RF110) | - |
| Perfil Vendedor | RF44-RF56 | - |
| Perfil publico | RF110 | - |

> Nota: los rangos fueron verificados contra el documento 20/08 (`LAST VERSION/Commercity (optimizado)/Commercity (optimizado).docx.md`); ante duda, leer el RF exacto en ese documento antes de citarlo.

### 3. Checklist obligatorio de revision de cada entrega

**Criterio rector (definido 2026-08-08):** los informes de revision solo listan
los **ERRORES REALES** que cometio el integrante (seguridad, logica de negocio,
desalineacion con la BD o con los RF). NO se incluyen como hallazgos los puntos
de la checklist interna de `api-seguridad.md` (helmet, cors cerrado, rate-limit,
x-powered-by, contrato `{ success, data }`, middleware de error central) porque
los integrantes no conocen esas reglas: son convenciones que el lider aplica de
forma centralizada al integrar el modulo. Esos temas pueden aparecer como "notas
de integracion" (responsabilidad del lider), nunca como tarea para el integrante.

**Brechas de seguridad: las cubre el lider, no el integrante.** Si la entrega
tiene una brecha de seguridad que nace de las convenciones del proyecto (cors
abierto, falta de helmet, rutas sin capa global, contrato de respuesta), el
lider la resuelve en la integracion central y NO la asigna al integrante en el
informe. El integrante solo corrige los errores que el mismo introdujo en su
logica (IDs sin validar, DELETE fisico, queries mal formadas, logica de negocio
incorrecta).

- [ ] El codigo implementa los RF/RNF del modulo (tabla anterior), no solo la pantalla
- [ ] Contrato de respuesta `{ success, data/error }` (coordinado con frontend)
- [ ] Consultas parametrizadas con `?` (api-seguridad.md)
- [ ] IVA segun RF48/RF120/RF121/RF140: precio publicado CON IVA incluido; pasarela desglosa subtotal = precio/1.19, IVA = subtotal x 0.19; comisiones 90/10 sobre subtotal (RF140: columnas generadas, pendiente de confirmar con BD)
- [ ] Token de recuperacion con expiracion de 5 minutos (RF4)
- [ ] Estados por linea en `detalle_pedidos.estado_envio` (N a 1 en pedidos, RF125-RF128); `pedidos.estado_pedido` NO existe
- [ ] `productos.estado` solo se lee (STORED GENERATED, RF46/RF47 CERRADO sin migracion), jamas se inserta
- [ ] No DELETE fisico de historiales; borrado logico (activo/suspendido/deleted_at)
- [ ] Changelog con los RF del documento 2026-08-20 citados (documentacion-cambios.md)
- [ ] Tests que cubran los RF del modulo; cobertura no menor a la existente (testing-commercity.md)

### 4. Conflictos abiertos (NO implementar sin confirmacion del Director)

- **RF140 (CERRADO 20/08, SIN migracion)**: el Director aprobo: `detalle_pedidos.subtotal` se guarda SIN IVA (precio/1.19 x cantidad); `monto_vendedor` y `monto_comision` (90/10) los calcula el backend al aprobar el pago; el IVA solo se desglosa en la pasarela (en vuelo). Verificado contra la BD real: el subtotal ya se guarda sin IVA y los montos 90/10 quedan correctos; las columnas NO son generadas (son normales) y se decide NO migrar por ahora — las columnas generadas quedan como mejora opcional post-entrega. No se crea columna de IVA.
- **RF141 (CERRADO 20/08)**: la moneda COP queda VIGENTE como RF141. El RF141 ANTIGUO (almacenar IVA en BD) fue ELIMINADO por el Director; el seguimiento del IVA desde BD queda AGENDADO como mejora post-entrega.
- **RF36 (CERRADO 20/08)**: cubierto por frontend (ocultar linea cancelada del historial del comprador).
- **RF129 (IMPLEMENTADO y VERIFICADO 20/08)**: `getHistorialVentas` excluye por defecto las lineas con estado Cancelado en los Pedidos del vendedor (solo se muestran con filtro explicito `estado=Cancelado`). Verificado con 235/235 tests.
- **RF46/RF47 (CERRADO 21/08, SIN migracion)**: `productos.estado` se mantiene `ENUM('Disponible','Agotado') GENERATED ALWAYS AS (if(stock>0,...)) STORED`. El formulario del vendedor muestra el campo en SOLO LECTURA (RF47 = campo presente e informativo) y el backend nunca lo inserta ni actualiza; la coherencia stock/estado la garantiza la BD (RF88). Sin riesgo sobre los 335 productos existentes; NO hay migracion.
- **RF48**: redaccion "el mismo vendedor debe calcular" el IVA al publicar; interpretada como precio final CON IVA incluido. Confirmar redaccion final.

### 5. Referencias

- Reglas de detalle: `api-seguridad.md`, `mysql-convenciones.md`, `testing-commercity.md`, `backend-estructura.md`, `documentacion-cambios.md`.
- Informe de revision BD/requerimientos: `informes/INFORME DE REVISION - BASE DE DATOS Y REQUERIMIENTOS COMMERCITY (commercity_v2).md` (v1.5).
