# Informe de Estado — Entregas Sprint 1 API REST (2026-09-07)

Autor: Daniel Palacios (Lider Backend / QA)
Fecha: 2026-09-07
Alcance: Revision de las entregas del area API REST del proyecto CommerCity 2.0 contra el backend central, la BD real `commercy_v2` y el documento oficial de requerimientos.

## 1. Contexto y objetivo

El Sprint 1 del area API REST asigno a cada integrante un modulo del backend central. Este informe consolida la revision de calidad de cada entrega, las correcciones aplicadas por el lider QA y los pendientes que quedaron para cerrar el sprint. La unica fuente de verdad usada para verificar contratos es el backend central (controllers/rutas) y la BD remota `commercy_v2` (149.130.178.228:3306); las entregas se contrastaron con esa fuente, no con maquetas.

Criterios de cierre aplicados a cada entrega:
- Coherencia con el contrato real del backend central (URLs, body/query, codigos HTTP, formato `{ success, data }`).
- Evidencia de tests unitarios (suite central) y de flujo E2E contra la BD real.
- Ausencia de credenciales (.env) y de archivos temporales en la entrega.
- Respaldo en los RF/RNF del documento oficial.

## 2. Metodo de verificacion

1. Lectura de cada carpeta de entrega en `AVANCES/SPRINT 1 API REST/`.
2. Contraste de endpoints/contratos contra los routes y controllers del backend central.
3. Ejecucion de suites unitarias del central (mock de mysql2/promise + Supertest) por modulo.
4. Flujos E2E reales contra `commercy_v2` con el servidor en `http://localhost:3000` (usuario temporal autolimpiable).
5. Generacion de evidencias (md) y notas de revision por integrante.

Referencia de calidad del backend central: suite completa 307/307 tests; cobertura Lines 93.72%, Statements 93.17%, Branches 82.64%, Functions 99.38%.

## 3. Estado consolidado por integrante

| Integrante | Modulo (plan 5.x) | Entrega | Veredicto | Evidencia |
|---|---|---|---|---|
| Erik Perea | Mi Tienda vendedor (RF130-RF139) | PDF con 8 capturas Postman | APROBADA | E2E real contra `commercy_v2`: login 200, tienda/ventas 200, dashboard/stats 200, POST mi-cuenta-bancaria 201 (usuario 489), GET posterior registrado true |
| Carlos Vidal | Usuarios y Seguridad (5.3) | evidencia.html | APROBADA | Unit 49/49 (central) + E2E real 16/16: register 201 (id 491), login 200, logout 200 con token invalidado, /me revocado 401, recover uniforme 200, reset-password con reuso 400, RBAC admin 200/403 |
| Carlos Perea | Seguidores (5.5, RF106) | controllers/routes/test + evidencias nuevas | CERRADA | Unit 15/15 (central) + E2E real: seguir seguido_id=2 200, siguiendo 200 [Vendedor id 2], dejar de seguir 200, listado final 0 (usuario 493) |
| Juan Sebastian Cabrera | Carrito/Pedidos/Historial (5.6) | documentacion corregida + evidencia E2E nueva | CERRADA | Unit 48/48 (carrito 19 + pedidos 18 + historial 11) + E2E real: carrito 200 (resumen subtotal_global/total), pedidos/resumen (subtotal 16806.72, iva 3193.28, total 20000), confirmar-pago 201 (pedido 87, distribucion_90_10), cancelar 200 (detalle 122, stock 7->6->7) |
| Brandon Perea | Calificaciones/Admin/Reportes (5.7) | clon backend + E2E | CERRADA POR EL LIDER | Clon no integrable (ver 4.4); modulo central validado con E2E real 14/14 (evidencia-E2E-calificaciones-admin-reportes.md) |
| Sebastian Banguera | Modulo Escritorio (Electron) | PDF manual tecnico v2.0.0 | EN CORRECCION | Documentacion corregida por el lider; sin codigo ni evidencia E2E (ver seccion 4.5) |
| Cristian Rosero | Backend Productos | PDF + mocks | NO APROBADA | Controllers mock sin BD (productos vacios, stock fijo); modulo central ya implementado y validado por el lider (E2E real 5/09); tarea asumida |
| Jary Lizeth | QA tests y contratos (5.8) | mini-app Usuarios | REORIENTAR | Patron correcto pero alcance incumplido: demo del modulo usuarios (tarea de Vidal); la tarea 5.8 exige QA de la suite central. QA del sprint 1 completo por el lider: 307/307 |
| Diego Serna | Frontend Web (chat/notificaciones) | rama prueba-backend | VALIDADA (pendiente integracion) | Frontend compatible con la API central (1:1 con rutas RF99-RF104); rama corregida (puerto 3000, sin node_modules/uploads). Integracion a commercycity/main pendiente con Diego/Yepes |

## 4. Correcciones aplicadas por el lider en esta revision (7/09)

### 4.1 Contrato real del carrito (verificado en carrito.controllers.js)

El carrito NO usa JWT. Documentacion de Cabrera y Sebastian corregida al contrato real:

| Operacion | Contrato real |
|---|---|
| POST /api/carrito | body `{ comprador_id, producto_id, cantidad }` -> 201 (upsert ON DUPLICATE KEY, transaccion FOR UPDATE) |
| GET /api/carrito | query `?comprador_id=<id>` -> 200 agrupado por vendedor; resumen `{ subtotal_global, total }` (SIN IVA) |
| PATCH /api/carrito/:productoId | query `?comprador_id=<id>` + body `{ cantidad }` -> 200 |
| DELETE /api/carrito/:productoId | query `?comprador_id=<id>` -> 200 |

Errores normalizados: producto suspendido/eliminado -> 404 `PRODUCT_NOT_FOUND`; comprador inactivo -> 404 `COMPRADOR_NOT_FOUND`; producto fuera del carrito -> 404 `ITEM_NOT_FOUND`; stock insuficiente -> 400 `INSUFFICIENT_STOCK`.

### 4.2 Desglose de IVA y comision (donde vive realmente)

- GET /api/carrito NUNCA devuelve IVA ni comision (RF109: agrupa por vendedor con subtotal_global/total).
- GET /api/pedidos/resumen devuelve `{ subtotal, iva, total }` (total = precio publicado con IVA 19% incluido; subtotal = total / 1.19).
- POST /api/pedidos/confirmar-pago devuelve `distribucion_90_10 { total_vendedores, total_comision_commercity }` (90/10 sobre subtotal, campos monto_vendedor/monto_comision en detalle_pedidos).
- En E2E real: precio 20000 -> subtotal 16806.72 + iva 3193.28 = 20000.

### 4.3 Documentos corregidos/creados

- `AVANCES/.../JUAN CABRERA/.../`: README, checklist-entrega, endpoints-validados y endpoints-para-frontend corregidos (puerto 3000, comprador_id, codigos reales, conteos 48/48); nueva evidencia `evidencia-E2E-carrito-pedidos-historial.md`.
- `AVANCES/.../CARLOS PEREA/entrega/entrega/`: nuevas evidencias `evidencia-tests-seguidores.md` (15/15) y `evidencia-E2E-seguidores.md`.
- `AVANCES/.../SEBASTIAN/DOCUMENTACION_COMMERCITY_DESKTOP.md`: contrato de carrito corregido y anexo "CORRECCIONES DEL LIDER QA (2026-09-07)" con el mapeo endpoint->contrato verificado.

### 4.4 Brandon Perea (5.7) - hallazgos y cierre por el lider

**Cierre (2026-09-07): CERRADA POR EL LIDER QA.** El clon no se integra; los modulos del backend central (Calificaciones/Admin/Reportes) se validaron con E2E real 14/14 contra `commercy_v2` (evidencia nueva en su carpeta). `calificarProducto` queda agendado como P2 sin RF pendiente de decision del Director.

Nota completa: `AVANCES/.../BRANDON/REVISION_ENTREGA_BRANDON_2026-09-07.md`.

- Su clon agrega `POST /api/calificaciones/producto` + `calificarProducto` que NO existen en el backend central (solo `POST /api/calificaciones/vendedor`, RF107). Sin RF que respalde calificar producto: alcance P2 sin aval del Director; NO se integra.
- Su E2E inserta directo en `pedidos` con columnas viejas (`total/estado/metodo_pago`); el esquema real `commercy_v2` usa `total_neto` y registra en `pagos_simulados`; por eso su E2E no puede pasar contra la BD real.
- Incluyo `.env` con credenciales dentro de la entrega (riesgo).
- Correcciones requeridas: (1) descartar o agendar `calificarProducto` como P2 con aval del Director; (2) reescribir el E2E contra endpoints/esquema reales (`POST /api/calificaciones/vendedor`, `total_neto`, `pagos_simulados`) con flujo autolimpiable contra `commercy_v2`; (3) quitar `.env` (dejar `.env.example`); (4) adjuntar capturas de la suite central (calificaciones 8, admin.controllers 35, admin.cuentaBancaria 8, reportes 13 = 64 tests) y cobertura global.

### 4.5 Sebastian Banguera (Escritorio) - hallazgos y correcciones requeridas

Nota completa: `AVANCES/.../SEBASTIAN/REVISION_ENTREGA_SEBASTIAN_2026-09-07.md`.

- Positivo: arquitectura Offline-First correcta (Electron + apiService); parametros de conexion ya correctos (localhost:3000, `commercy_v2`).
- Hallazgos: (1) carrito documentado sin `comprador_id`; (2) IVA/90-10 atribuido al GET /carrito (corresponde a /api/pedidos/*); (3) sin codigo de `src/api.js` en AVANCES ni en su repo oficial (repo de escritorio VACIO); (4) sin evidencia E2E; (5) matriz RF con numeracion antigua (RF47/RF131; oficial RF48/RF120/RF121/RF140).
- Correcciones requeridas: ajustar `src/api.js` al contrato canonico del anexo; subir el codigo del modulo; ejecutar E2E real contra `commercy_v2` con el backend en 3000 y adjuntar capturas.

## 5. Pendientes

### Por integrante

| Responsable | Pendiente | Para cuando |
|---|---|---|
| Brandon Perea | Decision del Director sobre calificarProducto (P2, agendado); capturas unitarias/coverage HTML opcionales | Definir con el Director |
| Sebastian Banguera | Subir codigo Electron + apiService; ajustar contrato carrito; E2E real con capturas; actualizar numeracion RF | Definir con Yepes (plazo trabajo 9/09) |
| Diego Serna / Yepes | Integrar rama frontend (chat/notificaciones) a commercycity/main | Pendiente de coordinacion |
| Jhon Parra | Complementar SRS con seccion de integracion a la API real | Antes del martes 9/09 |
| Carlos Perea / Cabrera | Capturas de pantalla y coverage HTML para portafolio (no bloqueante) | Opcional |

### Del grupo

- Suite del backend central: 307/307 tests en verde; cobertura Lines 93.72% (sobre umbral minimo 60%).
- El frontend local del repo de trabajo sigue en Fase 2 (conexion de pantallas); la integracion la coordinan Diego/Yepes sobre commercycity/main.

## 6. Conclusion

Del equipo de la fase API REST, 5 entregas quedan aprobadas y cerradas con evidencia verificable (Erik Perea, Carlos Vidal, Carlos Perea, Juan Sebastian Cabrera y Brandon Perea por validacion del modulo central con E2E 14/14), 1 validada pendiente de integracion (Diego Serna), 1 en correccion (Sebastian Banguera) y 2 reorientadas/asumidas por el lider (Cristian Rosero y Jary Lizeth). El backend central mantiene su suite completa en verde (307/307, Lines 93.72%) y los flujos criticos del negocio (carrito, pedidos ACID con IVA 19% y distribucion 90/10, cancelaciones con restitucion de stock, seguidores, usuarios y seguridad) quedaron verificados contra la BD real `commercy_v2`.
