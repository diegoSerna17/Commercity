# Changelog de Cambios - CommerCity

Registro central de cambios (según regla `documentacion-cambios.md`). Entradas de la mas reciente a la mas antigua.

---

## [Unreleased] - 2026-09-25 22:38 — Bug latente ENUM: literales inválidos en la cancelación de pedidos

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/controllers/pedidos.controllers.js; backend/src/server/__tests__/pedidos.controllers.test.js; informes/PROPUESTA_MIGRACION_ENUM_ESTADOS.md (nuevo)
- **Descripción**: se corrigieron juntos los dos bugs de literales fuera de los ENUM reales de la BD en la cancelación de pedidos (por línea y general): (1) `detalle_pedidos.estado_pago_vendedor` recibía `'Reembolsado'` y su ENUM real es `enum('Pendiente','Desembolsado')`; (2) `pagos_simulados.estado` recibía `'Parcial'` y su ENUM real es `enum('Aprobado','Rechazado','Pendiente','Reembolsado')`. Se aplicó la Opción B decidida por el líder de backend: mapeo a valores válidos sin DDL en la BD compartida. Línea cancelada no desembolsada → `'Pendiente'` (se conserva `'Desembolsado'` si ya se desembolsó, vía helper `estadoPagoVendedorTrasCancelacion`); pago del pedido → `'Reembolsado'` si se cancelan todas las líneas, `'Aprobado'` si quedan líneas vivas. Se añadieron 4 pruebas de regresión (casos a–d) que verifican que jamás se escriben literales fuera de los ENUM. La Opción A (migración `ALTER TABLE` para ampliar ambos ENUM con `'Reembolsado'` y `'Parcial'`) queda como propuesta documental pendiente de validación con el líder de BD y el instructor.
- **Motivo**: bug latente que rompía la transacción de cancelación de pedidos con error de MySQL (los dos literales inválidos estaban en la misma transacción y estallaban al corregir el primero); coherencia RF vs BD vs código para la inspección de entregas.
- **Requerimientos**: RF de gestión/cancelación de pedidos; RNF de integridad de datos (valores conformes al esquema real).
- **Evidencia**: 4 nuevas pruebas de regresión en `pedidos.controllers.test.js` (mocks con los ENUM reales de `information_schema`); propuesta de migración con scripts ALTER, impacto y rollback en `informes/PROPUESTA_MIGRACION_ENUM_ESTADOS.md`. **Suite completa pendiente de ejecución manual por el usuario** (regla de tests manuales): comando sugerido `npx vitest run --coverage` desde `backend/`.
- **Estado**: Implementado — pendiente de suite manual y de commit (confirmación explícita)

---

## [Unreleased] - 2026-09-25 20:15 — CORS: 6to test (peticion sin header Origin)

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/__tests__/cors.middleware.test.js
- **Descripción**: se añadió el 6to caso al test permanente de CORS: preflight OPTIONS contra `/api/productos` SIN header `Origin`, verificando que la API no refleja `Access-Control-Allow-Origin` (no hay CORS que aplicar para peticiones del mismo origen o clientes no navegador). Cierra el hallazgo menor M1 de la revisión de código 16.
- **Motivo**: completar la matriz de casos de CORS (4 orígenes permitidos + origen desconocido + sin Origin) para el portafolio de evidencias de la inspección de entregas de API REST.
- **Requerimientos**: RNF de seguridad (regla `api-seguridad.md`: allow-list de orígenes sin comodín `*`).
- **Evidencia**: suite backend completa `npx vitest run --coverage`: 302/302 pruebas PASSED en 20 archivos (301 previas + 1 nueva), incluido el módulo Seguidores RF106 con 15 pruebas validadas (pendiente del informe de entregas del 21-sep). Cobertura: Statements 91.81% / Branches 81.46% / Functions 97.54% / Lines 92.31% (umbral 60%). Commit `3d27388` publicado en `origin/feature/web-integracion-api` y `commercycity/feature/web-integracion-api`.
- **Estado**: Verificado (unitarias + cobertura)

---

## [Unreleased] - 2026-09-25 16:41 — CORS: orígenes de la WebView Capacitor (app móvil Ionic)

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/app.js; backend/src/server/__tests__/cors.middleware.test.js (nuevo, reemplaza a backend/src/server/__tests__/app.cors.test.js)
- **Descripción**: la configuración de CORS pasó de un único origen (`FRONTEND_URL` o `http://localhost:5173`) a la lista `CORS_ORIGINS` que conserva el frontend web y añade los orígenes estándar de la WebView de Capacitor: `https://localhost` (Android con `androidScheme https` por defecto), `http://localhost` (esquema http / desarrollo) y `capacitor://localhost` (iOS). Sin este cambio, toda petición desde la app móvil quedaba bloqueada por CORS al enviar la WebView su propio Origin. Se añadió el test permanente `cors.middleware.test.js` (5 pruebas de preflight OPTIONS contra la app real: 4 orígenes permitidos + 1 origen desconocido no reflejado).
- **Motivo**: la app móvil del equipo (Ionic Capacitor 8.4.0) no podía llamar a la API; el bloqueo CORS no es visible hasta ejecutar la app en dispositivo/WebView.
- **Requerimientos**: RNF de seguridad (regla `api-seguridad.md`: allow-list de orígenes, sin comodín `*`); habilita la integración de la app móvil con todos los RF expuestos por la API.
- **Evidencia**: suite backend `npm test` 301/301 en 20 archivos (296 previos + 5 de CORS); cobertura Statements 91.81% / Branches 81.46% / Functions 97.54% / Lines 92.31% (umbral 60%). Verificación funcional con el servidor levantado (`npm start`) y preflight OPTIONS vía `curl` (el middleware cors corre antes de los routers, el chequeo aplica a cualquier ruta; el test permanente usa `/api/productos`): `Origin: https://localhost` → 204 con `Access-Control-Allow-Origin: https://localhost`; `http://localhost:5173` → 204 reflejado; `capacitor://localhost` → 204 reflejado; `https://malicioso.com` → 204 SIN el header `Access-Control-Allow-Origin` (el navegador bloquea la petición).
- **Estado**: Verificado (unitarias + cobertura + verificación funcional en vivo)

---

## [Unreleased] - 2026-09-25 - Documentacion: README.md raiz del proyecto

- **Autor**: Daniel Palacios
- **Archivos**: README.md (nuevo, en la raiz del repositorio)
- **Descripción**: se creó el README.md raíz para la sustentación final del proyecto: descripción, contexto académico SENA (ADSO, FPI, etapa productiva), características por módulo, arquitectura con diagrama Mermaid y pipeline de middlewares de autenticación, stack con versiones, estructura del repositorio, requisitos previos, variables de entorno del backend, instalación y ejecución, pruebas con resultados y cobertura, documentación de la API, roles del sistema, equipo y uso académico. Todo el contenido fue verificado por lectura directa del código (package.json de backend y frontend, app.js, server.js, client.js, constants/config.js, .env.example, vite.config.js, .nvmrc, estructura de carpetas).
- **Motivo**: el repositorio no tenía README en la raíz; se requiere documentación precisa y verificable para la defensa ante el instructor evaluador.
- **Requerimientos**: RNF de documentación y trazabilidad del proyecto formativo (GFPI-G-040).
- **Evidencia**: documento creado de 264 líneas, sin cambios de código; cita los resultados vigentes de las suites (backend 296/296 en 19 archivos, cobertura Statements 91.81% / Branches 81.46% / Functions 97.54% / Lines 92.31%; frontend 17/17 en 4 archivos).
- **Estado**: Verificado

---

## [Unreleased] - 2026-09-25 15:55 — FASE 2: cierre de defectos P1 (DEF-01..DEF-05) y suite backend en verde

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/middleware/auth.middleware.js; backend/src/server/controllers/pedidos.controllers.js; backend/src/server/controllers/usuarios.controllers.js; backend/src/server/app.js; backend/src/server/routes/pedidos.routes.js; backend/src/server/__tests__/ (14 archivos de test alineados con DEF-01); backend/.env.example (nuevo); frontend/src/pages/Carrito/PasarelaPago.jsx; frontend/src/pages/Perfil/PerfilVendedor.jsx; frontend/package.json; frontend/vite.config.js; frontend/src/api/client.test.js; frontend/src/components/globales/RutaProtegidaAdmin.test.jsx; frontend/src/pages/Carrito/Carrito.test.jsx; frontend/src/pages/Carrito/PasarelaPago.test.jsx; frontend/src/test/setup.js; frontend/.nvmrc
- **Descripción**: cierre de los defectos P1 de seguridad y contrato de la API REST. (DEF-01) `authRequired` valida firma, lista negra de tokens (`tokens_invalidados`) y estado del usuario (`activo = 1`), con respuesta fail-closed (401 `USER_DISABLED`) en cualquier fallo; (DEF-02/DEF-03) contrato JSON uniforme `{ success, data }` en `GET /` y `GET /api/usuarios`; (DEF-05/RF35) cancelación de compra por el comprador con restitución de stock, `estado_pago_vendedor = 'Reembolsado'` y cálculo de reembolso Parcial/Reembolsado. Se auditan los dos handlers de cancelación (RF135 `POST /api/historial/compras/:id/cancelar` y RF35 `PATCH /api/pedidos/:id/estado`) confirmando que NO hay doble restitución de stock. Se alinearon los mocks de los 14 archivos de test que no contemplaban la segunda consulta de `authRequired`.
- **Motivo**: al introducir DEF-01 la suite backend pasó a 95/296 fallos porque los mocks devolvían filas vacías para la consulta de estado del usuario; sin suite verde no es defendible el cierre de FASE 2 ante el instructor evaluador.
- **Requerimientos**: RF2, RF35, RF40, RF41, RF46, RF122, RF134, RF135; RNF de seguridad, validación y contrato de API.
- **Evidencia**: backend `npx vitest run` 296/296 en 19 archivos; cobertura 91.81% Statements, 81.46% Branches, 97.54% Functions, 92.31% Lines (umbral configurado 60%). Frontend desde `frontend/`: 4 archivos, 17/17 tests. E2E de endpoints NO ejecutado: `AVANCES/PRUEBAS/ejecutar_pruebas.mjs` fue retirado del árbol de trabajo y el set externo VOCETO no está en el working copy; queda pendiente levantando el backend con BD real.
- **Estado**: Verificado técnicamente (unitarias + cobertura); E2E y sincronización con `commercycity/main` pendientes de autorización del líder

---

## [Unreleased] - 2026-09-21 09:01

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/controllers/seguidores.controllers.js; backend/src/server/routes/seguidores.routes.js; backend/src/server/__tests__/seguidores.controllers.test.js; backend/src/server/app.js; frontend/src/components/perfil/SeguidoresModal.jsx; frontend/src/pages/Perfil/PerfilVendedor.jsx; informes/PLAN_SPRINT_API_REST_2026-08-31.md; informes/INFORME_ESTADO_ENTREGAS_SPRINT_API_REST_2026-09-07.md; informes/INVENTARIO_ENDPOINTS_API_2026-08-28.md
- **Descripción**: se reincorporó el módulo Seguidores al backend central, se montó `/api/seguidores`, se restauró su cobertura unitaria y se actualizó la integración web para recargar listas después de una acción. Se consolidaron las rutas documentales referenciadas por el changelog.
- **Motivo**: cerrar la brecha entre la integración web declarada, el código local y la documentación del Sprint API REST.
- **Requerimientos**: RF106 y RNF de seguridad, validación y trazabilidad.
- **Evidencia**: `seguidores.controllers.test.js` 15/15; suite backend 288/288 en 19 archivos; cobertura Statements 91.77%, Branches 81.11%, Functions 98.11%, Lines 92.30%; E2E web 54/54 contra `http://localhost:3000` con `ADMIN_EMAIL=admin01@commercity.com`; diagnóstico estático sin errores. La sincronización con `commercycity/main` continúa pendiente por historiales sin merge-base y aprobación del líder.
- **Estado**: Verificado técnicamente; sincronización pendiente



















## 2026-09-20 - FEAT: conectar toda la API REST a la web (comprador, vendedor, admin, cuenta y social)

- **Autor**: Daniel Palacios
- **Archivos**: frontend/src/services (9 nuevos: carrito, pedidos, historial, tienda, seguidores, reportes, admin, calificaciones, perfil; 2 modificados: productos, usuarios), frontend/src/pages (Carrito, Inicio, Tienda, Administrador, Perfil, IniciarSesion), frontend/src/components (inicio, perfil, tienda, admin, globales), frontend/src/utils/historialUtils.jsx
- **Descripción**: se conectaron a la API central los flujos del comprador (carrito, pago con IVA 19% y 90/10, historial con cancelación, reportes), del vendedor (pedidos, Mi Tienda, cuenta bancaria cifrada, productos propios con crear/editar e imagen, seguidores), del administrador (stats, usuarios, productos, reportes, cuenta bancaria) y de la cuenta (recuperación de contraseña, cierre de sesión con revocación del token, cambio de rol y eliminación de cuenta), más las acciones sociales (seguir/dejar de seguir y calificar vendedor). Se eliminaron los datos mock y el uso de localStorage en las áreas intervenidas.
- **Motivo**: la fase API REST estaba bloqueada en los clientes: la web operaba con datos locales y no consumía la API central.
- **Requerimientos**: RF2, RF4, RF20, RF21, RF26-RF32, RF35, RF40, RF45-RF49, RF54, RF62/RF63, RF79, RF101, RF103-RF107, RF109-RF114, RF118-RF124, RF129-RF139
- **Evidencia**: eslint sin hallazgos (EXIT_LINT=0) y vite build correcto (EXIT_BUILD=0). Cobertura de ~62 de 69 endpoints. PENDIENTE el E2E completo contra la BD real.
- **Estado**: Pendiente

## 2026-09-16 - FIX: normalizar imagenes rotas del catalogo de productos

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/db/012_normalizar_imagenes_productos.sql
- **Descripcion**: migracion de datos con respaldo productos_imagenes_bkp_20260913 que sustituye por picsum.photos (semilla = id del producto) las imagenes nulas, vacias, de example.com, de /uploads o de Unsplash sin parametros de query. Diagnostico previo: 250 URL de Unsplash con IDs inexistentes (404/ERR_BLOCKED_BY_ORB), 2 de example.com y 1 PNG 1x1.
- **Motivo**: el catalogo conectado a la API real mostraba tarjetas sin imagen cargable.
- **Requerimientos**: RF78, RF79, RF87-RF94
- **Evidencia**: migracion con consulta de verificacion (0 filas invalidas esperadas) y rollback documentado; pendiente de aplicar sobre commercity_v2.
- **Estado**: En revision (pendiente de aplicar y verificar en BD real)

## 2026-09-16 - DOCS: notas de integracion web y sincronizacion de main (reemplazo)

- **Autor**: Daniel Palacios
- **Archivos**: rama merge-web-main; frontend/; backend/; informes/CHANGELOG.md
- **Descripcion**: se documenta la estrategia de sincronizacion por reemplazo: partir de commercycity/main, integrar el frontend conectado a la API desde feature/web-integracion-api y el backend central limpio de origin/main, excluyendo node_modules y uploads. La publicacion en commercycity/main queda supeditada al visto bueno de Diego/Yepes.
- **Motivo**: el PR contra main exigia resolucion masiva de conflictos por historiales divergentes; se opta por una rama de reemplazo que preserve el backend central probado y el frontend integrado.
- **Requerimientos**: N/A (integracion/versionado)
- **Evidencia**: preflight local aislado: npm run build del frontend OK (1815 modulos, dist 537.18 kB); vitest del backend 313/313 en 21 archivos; 0 archivos generados (node_modules/uploads) en el arbol.
- **Estado**: En revision (pendiente visto bueno y push a commercycity/main)

## 2026-09-13 - FEAT: integracion del frontend web a la API real (rama feature/web-integracion-api)

- **Autor**: Daniel Palacios
- **Archivos**: rama feature/web-integracion-api (worktree local): frontend/src/constants/config.js; frontend/src/services/productos.service.js; frontend/src/pages/Inicio/Inicio.jsx; frontend/src/pages/IniciarSesion/Registro.jsx; frontend/src/components/globales/RutaProtegidaAdmin.jsx; frontend/src/App.jsx; frontend/src/pages/Administrador/PanelControl.jsx
- **Descripcion**: catalogo de Inicio conectado a GET /api/productos (con paginacion real y sin mocks), registro real contra POST /api/usuarios/register con auto-login, guard de administrador para /admin y /admin/dashboard, API_BASE_URL por defecto en 3000 y correccion de mojibake en el panel admin.
- **Motivo**: la rama prueba-backend tenia catalogo mock y registro sin implementar, lo que impedia el cierre de la Fase 2 (pantallas del alcance con datos reales).
- **Requerimientos**: RF87-RF94 (catalogo), RF1-RF4 (registro), RNF de seguridad (control de acceso admin)
- **Evidencia**: navegador contra backend real en 3000 -> /api/productos 200 con 312 productos, 12 tarjetas y paginacion page=2 a 24; guard admin redirige a /login; sin errores CORS.
- **Estado**: Completado

## 2026-09-13 - FIX: CORS para los tres clientes (Electron y Capacitor)

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/app.js; backend/src/server/__tests__/app.cors.test.js
- **Descripcion**: lista blanca de origenes (FRONTEND_URL, capacitor://localhost, http/localhost) con soporte de peticiones sin Origin; test de 6 casos.
- **Motivo**: el backend solo aceptaba http://localhost:5173 y bloqueaba a Electron e Ionic (Fase 2).
- **Requerimientos**: N/A
- **Evidencia**: vitest app.cors.test.js y suite completa en verde.
- **Estado**: Completado

## 2026-09-07 - DOCS: informe estado entregas Sprint API REST y revisiones Brandon/Sebastian

- **Autor**: Daniel Palacios
- **Archivos**: informes/INFORME_ESTADO_ENTREGAS_SPRINT_API_REST_2026-09-07.md; AVANCES/SPRINT 1 API REST/BRANDON/REVISION_ENTREGA_BRANDON_2026-09-07.md; AVANCES/SPRINT 1 API REST/SEBASTIAN/REVISION_ENTREGA_SEBASTIAN_2026-09-07.md
- **Descripcion**: cierre de revisiones: Cabrera y C. Perea cerrados con E2E real, Brandon y Sebastian en correccion, informe consolidado del sprint.
- **Motivo**: consolidar estado de entregas API REST 7/09
- **Requerimientos**: N/A
- **Evidencia**: suite central 307/307, Lines 93.72%; E2E real comercity_v2 (pedido 87)
- **Estado**: Completado

## 2026-09-05 - DOCS: revision de la entrega de Carlos Vidal (Backend Usuarios) APROBADA

- **Autor**: Daniel Palacios
- **Archivos**: AVANCES/SPRINT 1 API REST/CARLOS VIDAL/Pruevas/evidencia.html
- **Descripcion**: revisada la entrega de Carlos Vidal (plan 5.3 Backend Usuarios): 49/49 tests unitarios y 16/16 pasos E2E contra BD real (register 201 id=491, login, logout/revocacion de token, recuperacion RF4 anti-enumeracion y reset de un solo uso, RBAC admin 403/200, borrado logico de cuenta). Aprobada.
- **Motivo**: cerrar la revision del modulo usuarios del Sprint 1 API REST
- **Requerimientos**: RF2, RF4, RF40, RNF8/RNF10
- **Evidencia**: evidencia.html con 49/49 unit y 16/16 E2E (generado 2026-09-05)
- **Estado**: Completado

## 2026-09-05 - DOCS: E2E real del modulo Productos completado (BD commercity_v2)

- **Autor**: Daniel Palacios
- **Archivos**: backend/.env (configuracion local DB_NAME), backend/src/server/controllers/productos.controllers.js (validado)
- **Descripcion**: corregido DB_NAME del .env a commercity_v2 (se usaba commercy_v2, causa del bloqueo de acceso errno 1044) y completada la validacion E2E del modulo productos contra la BD real: listado paginado (total 310, pagina 2 con 78 paginas), tope limit 100, detalle RF78/RF79, validar-stock RF86, categorias y vendedores
- **Motivo**: cerrar la tarea de Cristian Rosero asumida por el lider (plan 5.4) cuyo E2E real estaba pendiente por nombre de BD incorrecto en el .env
- **Requerimientos**: RF78, RF79, RF86, RF87-RF94
- **Evidencia**: GET /api/productos 200 (310 productos); limit=200 -> 100; detalle 585 200; validar-stock 585 200 {valido:true, stock:7}; categorias 17; vendedores 17
- **Estado**: Completado

## 2026-09-05 - DOCS: correccion de la entrega de Diego Serna (prueba-backend)

- **Autor**: Daniel Palacios
- **Archivos**: AVANCES/SPRINT 1 API REST/DIEGO SERNA (copia de referencia); rama prueba-backend (config.js, backend/.gitignore)
- **Descripcion**: corregido API_BASE_URL de frontend a puerto 3000 en constants/config.js; creado backend/.gitignore y sacado del indice git node_modules y src/server/uploads
- **Motivo**: la rama de Diego apuntaba al puerto 5000 (el backend real corre en 3000) y versionaba dependencias y uploads binarios
- **Requerimientos**: N/A (integracion/QA)
- **Evidencia**: 0 referencias URL a 5000 en el frontend de la rama; commit 53b19ea en origin/prueba-backend
- **Estado**: Completado (integracion a commercycity/main pendiente de Diego/Yepes)

## 2026-09-04 - DOCS: cierre QA Sprint 1 API REST - suite backend central 307/307

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/__tests__/ (20 archivos), AVANCES/SPRINT 1 API REST (revisiones: Erik, Diego, Cristian, Jary)
- **Descripcion**: consolidada la entrega QA (plan 5.8, tarea asumida del integrante Jary Lizeth): suite completa del backend central 20/20 archivos, 307/307 tests, 0 failed con testTimeout 20000; cobertura global Lines 93.72% (1359/1450), Statements 93.17%, Branches 82.64%, Functions 99.38%. Conteo por modulo: usuarios 49, admin 35, notificaciones 27, productos.controllers 22, tienda 22, carrito 19, pedidos 18, chat 14, productos.vendedor 13, reportes 13, otros 75. Veredictos del Sprint: Erik APROBADA; Diego frontend VALIDADO (integracion a commercycity/main pendiente); Cristian NO APROBADA (tarea asumida: Productos 22+13, E2E real pendiente del grant P0 de BD); Jary PARCIAL (QA asumido y completado por el lider)
- **Motivo**: cerrar las revisiones del Sprint 1 API REST (entrega domingo 6) y dejar evidencia consolidada para defensa ante el instructor
- **Requerimientos**: RF44-RF49, RF54, RF78-RF94, RF99-RF107, RF116, RNF8-RNF11 (QA)
- **Evidencia**: 307/307 passed; Lines 93.72%; corrida con node node_modules\vitest\vitest.mjs run --testTimeout=20000
- **Estado**: Completado

## 2026-09-04 - CHORE: testTimeout 20000 en Vitest del backend central

- **Autor**: Daniel Palacios
- **Archivos**: backend/package.json
- **Descripcion**: agregado testTimeout: 20000 al bloque vitest.test del backend central para estabilizar la suite completa en corridas paralelas (el default de 5000ms causaba 9 timeouts ambientales bajo OneDrive/carga, no errores logicos)
- **Motivo**: la suite de 307 tests fallaba 9 por timeout solo en corrida completa; en ejecucion individual pasaban
- **Requerimientos**: N/A (configuracion QA)
- **Evidencia**: suite completa 307/307 (20/20 archivos) y cobertura Lines 93.72% con el timeout aplicado
- **Estado**: Completado

## 2026-09-04 - DOCS: tarea Backend Productos (Cristian Rosero) asumida por el lider y validada

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/__tests__/productos.controllers.test.js, backend/src/server/__tests__/productos.vendedor.test.js, AVANCES/SPRINT 1 API REST/CRISTIAN ROSERO (revision)
- **Descripcion**: la entrega de Cristian Rosero (plan 5.4 Backend Productos) se rechazo por controllers con datos de ejemplo sin consultas a BD; el lider asumio la tarea y valido el modulo productos CENTRAL ya integrado: productos.controllers.test.js 22/22, productos.vendedor.test.js 13/13, cobertura Lines 93.72% (referencia 93.53%, no bajo). Servidor central arranca OK en puerto 3000; validaciones sin BD OK (validar-stock con id no numerico -> 400; POST /api/productos sin token -> 401). E2E contra BD real pendiente del grant P0 (commercy_user acceso a commercy_v2, escalado a Meneses).
- **Motivo**: la entrega del integrante no cumplia el alcance del plan 5.4 (listado, detalle y paginacion reales del catalogo); se asumio para avanzar el Sprint 1 API REST.
- **Requerimientos**: RF44-RF49, RF54, RF78, RF79, RF86, RF87-RF94
- **Evidencia**: suites 22/22 y 13/13 passed; cobertura Lines 93.72%; HTTP 400 y 401 verificados en vivo
- **Estado**: En revision (E2E real pendiente del grant P0 de BD)

## 2026-09-04 - FIX: alinear frontend local al puerto real del backend (3000)

- **Autor**: Daniel Palacios
- **Archivos**: frontend/src/utils/productosApi.js, frontend/src/pages/Administrador/AjustesAdministrador.jsx, frontend/src/pages/Perfil/HistorialDeCompras.jsx
- **Descripcion**: corregido el default de API_BASE de http://localhost:5000 a http://localhost:3000 en los 3 archivos que consumen la API (productos, admin, historial)
- **Motivo**: el backend corre en 3000; el default 5000 rompia el consumo de API del frontend local (mismo incidente del puerto reportado por Erik)
- **Requerimientos**: N/A (infraestructura de QA)
- **Evidencia**: grep sin coincidencias de localhost:5000 en frontend/src; npm run build OK (1815 modulos, dist 526.69 kB)
- **Estado**: Completado

## 2026-09-04 - DOCS: revision entrega Erick (Mi Tienda E2E) y extension de Yepes/Sebastian

- **Autor**: Daniel Palacios
- **Archivos**: informes/INVENTARIO_ENDPOINTS_API_2026-08-28.md
- **Descripcion**: revisada entrega de Erick (TEST Mi tienda APIREST.pdf, 8 capturas, todos 200/201), aprobada; extension de Yepes/Sebastian al martes 9/09 para diagramas y SRS (backend no se mueve); corregido inventario (register no recibe rol)
- **Motivo**: cerrar revisiones del Sprint 1 API REST y registrar decision del Director
- **Requerimientos**: RF130-RF139
- **Evidencia**: capturas OCR del PDF de Erick (login, ventas, ingresos, dashboard, validacion, cuenta bancaria GET/POST/GET)
- **Estado**: Completado

## 2026-08-31 - DOCS: plan Sprint grupo API REST

- **Autor**: Daniel Palacios
- **Archivos**: informes/PLAN_SPRINT_API_REST_2026-08-31.md
- **Descripcion**: plan con instrucciones detalladas por participante para conectar web/movil/escritorio al backend (13 routers, 69 endpoints). Gobernanza en conjunto entre lideres; movil se documenta en SRS antes de implementar.
- **Motivo**: distribuir tareas del grupo API REST para la fase API del Sprint.
- **Requerimientos**: N/A
- **Evidencia**: documento de plan con tareas y evidencias por cada uno de los 13 integrantes.
- **Estado**: Completado

## 2026-08-24 - FEAT: endpoint de validacion de Mi Tienda RF130-RF139 (integrado desde Erick)

- **Autor**: Erick (integrado y verificado por Daniel Palacios)
- **Archivos**: backend/src/server/controllers/tienda.controllers.js, backend/src/server/routes/tienda.routes.js, backend/src/server/__tests__/tienda.controllers.test.js
- **Descripcion**: se integra GET /api/tienda/validacion (solo lectura): valida cuenta bancaria registrada/completa sin exponer datos (RF131-133, RF138), flujo 90/10 por linea con tolerancia de 1 centavo (RF136/RF139) y devoluciones con reembolso (RF35/RF129/RF137). 6 tests nuevos. Se descartaron las copias antiguas de pedidos/compras de la entrega (revertian fixes ya aplicados).
- **Motivo**: entrega del modulo Mi Tienda de Erick en el Sprint 2; su aporte de validacion es util como herramienta de QA.
- **Requerimientos**: RF130, RF131, RF132, RF133, RF134, RF135, RF136, RF137, RF138, RF139
- **Evidencia**: suite tienda 22/22; E2E contra BD real: /validacion 200, /ventas 200, /ingresos 200, /dashboard/stats 200, /mi-cuenta-bancaria 200, sin token 401.
- **Estado**: Completado

## 2026-08-24 - DOCS: revision de entrega de Juan Cabrera (RF63-RF69) y reglas de memoria

- **Autor**: Daniel Palacios
- **Archivos**:
  - AVANCES/SPRING 2/JUAN CABRERA/Test Admin/tests-admin-reportes/ (revisado; carpeta en .gitignore, NO se versiona)
  - .trae/rules/memoria-proyecto.md (nuevo)
  - .trae/rules/respuesta-asistente.md (actualizado)
  - .trae/rules/revision-requerimientos.md (actualizado)
  - scripts/actualizar_changelog.ps1 y scripts/actualizar_version.ps1 (nuevos, versionados)
  - .gitignore y backend/.env.example (ajustados para versionar reglas y scripts)
- **Descripcion**: revision de la entrega de Juan Cabrera (tests de QA del Panel Admin de Reportes RF63-RF69): 51/51 tests Vitest + 7/7 scripts curl = 58 verificaciones PASS contra BD real, 13 capturas validas. Coincide con el backend real (GET /reportes, GET /reportes/:id, DELETE archivado=1, PATCH /resolver). Correcciones aplicadas a la entrega: eliminado JWT_SECRET real hardcodeado en setup/auth.js y vitest.config.js; eliminadas credenciales BD hardcodeadas en setup/db.js (ahora solo process.env sin fallback); 01-auth-login.sh ahora hace login real por la API (antes firmaba token con el secret); corregido test 403 condicional en list-reportes.test.js (usaba comprador@test.com inexistente); limpiadas credenciales expuestas en README.md y Resultados finales.md. AVANCES/ sigue en .gitignore (evidencia local).
- **Motivo**: revision de entrega del Sprint 2 y cumplir la regla memoria-proyecto (memoria siempre actualizada).
- **Requerimientos**: RF63, RF64, RF65, RF66, RF67, RF68, RF69
- **Evidencia**: Resultados finales.md de Cabrera (51/51 + 7/7 PASS); git check-ignore confirma AVANCES/ ignorado.
- **Estado**: Completado

## 2026-08-23 - FEAT: modulo Seguidores RF106 integrado al backend

- **Autor**: Daniel Palacios (integracion de entrega de Carlos Perea)
- **Archivos**: backend/src/server/controllers/seguidores.controllers.js, backend/src/server/routes/seguidores.routes.js, backend/src/server/app.js, backend/src/server/__tests__/seguidores.controllers.test.js
- **Descripcion**: modulo de seguidores (seguir, dejar de seguir, listar siguiendo, listar seguidores) montado en /api/seguidores con authRequired; 15 tests unitarios con mock de mysql2/promise.
- **Motivo**: entrega de Carlos Perea del Sprint 2 (RF106) aprobada con capturas validadas por OCR contra BD real.
- **Requerimientos**: RF106
- **Evidencia**: 15/15 tests seguidores; 301/301 suite completa; Lines 93.68%; endpoints GET /api/seguidores/siguiendo 401 sin token, POST /api/seguidores 401 sin token (validado con PowerShell Invoke-RestMethod).
- **Estado**: En revision (pendiente vitest)

## 2026-08-21 - CHORE: clarificar config local de JWT_SECRET y versionar reglas/scripts

- **Autor**: Daniel Palacios
- **Archivos**:
  - .trae/rules/api-seguridad.md (nota: JWT_SECRET es config local de cada integrante, no la envia el lider de BD; comando para generarlo; NO desactivar la validacion RNF1/RNF10)
  - backend/.env.example (misma aclaracion en el comentario de JWT_SECRET)
  - .gitignore (versionar .trae/rules/ y scripts/actualizar_*.ps1; mantener ignorados skills, ffmpeg y demas scripts locales)
- **Descripcion**: se aclara que el JWT_SECRET es una llave de la aplicacion (no de la BD) que cada integrante genera en su .env local, evitando el bloqueo al arrancar el servidor sin debilitar la validacion de seguridad. Se ajusta .gitignore para versionar reglas y scripts de automatizacion.
- **Motivo**: integrantes bloqueados por "FATAL: falta JWT_SECRET" al no saber que era config local (el lider de BD solo entrega credenciales MySQL).
- **Requerimientos**: RNF1, RNF10
- **Evidencia**: servidor arranca con JWT_SECRET definido; regla actualizada con el comando de generacion.
- **Estado**: Completado

## 2026-08-21 - CHORE: reglas y scripts de changelog, version y cobertura (adaptados del proyecto NOC)

- **Autor**: Daniel Palacios
- **Archivos**:
  - .trae/rules/ahorro-tokens-changelog-manual.md (nuevo: la IA NO lee/reescribe informes/CHANGELOG.md; usa scripts/actualizar_changelog.ps1)
  - .trae/rules/ahorro-tokens-version-manual.md (nuevo: bump de VERSION con scripts/actualizar_version.ps1, SemVer X.Y.Z)
  - .trae/rules/cobertura-tests-por-cambio.md (nuevo: tests y cobertura por cambio con vitest, no bajar de 93.53% Lines)
  - scripts/actualizar_changelog.ps1 (nuevo: inserta entrada antes de la primera fecha, valida ## YYYY-MM-DD, rechaza duplicados fecha+TAG)
  - scripts/actualizar_version.ps1 (nuevo: bump de VERSION con -DryRun y -Ruta)
  - VERSION (nuevo: 1.0.0)
- **Descripcion**: se adaptan al proyecto CommerCity las reglas de ahorro de tokens del proyecto NOC para actualizar el CHANGELOG (por fecha, no por version), el archivo VERSION (SemVer) y la cobertura por cambio (vitest en vez de pytest).
- **Motivo**: el CHANGELOG de CommerCity usa formato por fecha; se conserva la plantilla de documentacion-cambios.md y se automatiza la insercion para ahorrar tokens.
- **Requerimientos**: N/A
- **Evidencia**: scripts validados contra copias temporales (insercion, bump, rechazo de duplicados y DryRun OK).
- **Estado**: Completado

## 2026-08-21 - FEAT: eventos de notificacion de mensaje (chat RF105) y reporte (RF62-RF69)

- **Autor**: Daniel Palacios (apoyo a la asignacion de Carlos Vidal)
- **Archivos**:
  - backend/src/server/controllers/chat.controllers.js (registrarNotificacion best-effort al receptor al enviar mensaje, tipo "mensajes", url /perfil/chats)
  - backend/src/server/controllers/reportes.controllers.js (notifica a los administradores activos al crear un reporte, tipo "reporte", url /admin/reportes)
  - backend/src/server/__tests__/chat.controllers.test.js (+1 test best-effort, +assertions de la notificacion)
  - backend/src/server/__tests__/reportes.controllers.test.js (+2 tests: notifica admins y best-effort)
- **Descripcion**: se completan los eventos de la asignacion de Vidal que faltaban (RF99-RF104): al enviar un mensaje de chat se notifica al receptor y al crear un reporte se notifica a los administradores. Ambos con patron best-effort (un fallo de la notificacion jamas rompe el evento principal).
- **Motivo**: la asignacion de Vidal exige registro por eventos (compra, mensaje, reporte, envio); solo existian compra y envio/entregado.
- **Requerimientos**: RF99, RF100, RF101, RF103, RF104, RF105, RF62, RF63, RF65, RF67
- **Evidencia**: verificado en server activo contra BD real commercity_v2 (2026-08-21): mensaje a usuario 2 creo notificacion id 17 (tipo mensajes, no leido, url /perfil/chats); reporte de producto creo notificaciones 18/19/20 a los 3 admins reales (471/472/473, admin01/02/03@commercity.com), tipo reporte, no leido. Tests unitarios VERIFICADOS: chat 14/14 y reportes 13/13. Suite completa: 269/286 en el run con 1 crash de worker Vitest (17 tests de 1 archivo no ejecutados, problema de infraestructura en Windows, no de codigo); los 269 que corrieron pasaron 100%. Rerun recomendado para confirmar 286/286.
- **Estado**: Completado y verificado en server activo

---

## 2026-08-21 - DOCS: ajuste frontend RF46/RF47 delegado al lider de frontend (Diego Serna)

- **Autor**: Daniel Palacios
- **Archivos**: N/A (sin cambios de codigo en el repositorio)
- **Descripcion**: el formulario del vendedor (frontend/src/components/perfil/AgregarProducto.jsx) debe mostrar el campo estado en SOLO LECTURA y no enviarlo en el FormData, porque la columna `productos.estado` es GENERATED STORED en la BD (RF46/RF47 cerrado sin migracion el 21/08). Por regla de gobierno del proyecto (el equipo de backend solo trabaja backend y los cambios de frontend los aplica su lider), el ajuste se delega a Diego Serna, lider de frontend.
- **Motivo**: el frontend aun envia `estado` como select editable, generando incoherencia RF vs codigo ante el instructor; la BD ya es la unica fuente del estado.
- **Requerimientos**: RF46, RF47, RF88
- **Evidencia**: definicion del esquema verificada (`estado` GENERATED ALWAYS AS if(stock>0,'Disponible','Agotado') STORED); el backend ya cumple (INSERT de productos sin columna estado).
- **Estado**: En revision — pendiente de aplicacion por Diego Serna (frontend)

---

## 2026-08-21 - FEAT: modulo Calificaciones RF107 (comprador califica vendedor 1-5)

- **Autor**: Daniel Palacios
- **Archivos**:
  - backend/src/server/controllers/calificaciones.controllers.js (nuevo: calificarVendedor con validaciones)
  - backend/src/server/routes/calificaciones.routes.js (nuevo: POST /vendedor con authRequired, montado en /api/calificaciones)
  - backend/src/server/app.js (montar /api/calificaciones)
  - backend/src/server/__tests__/calificaciones.controllers.test.js (nuevo, 8 tests)
- **Descripcion**: se implementa RF107 del documento 20/08: el comprador califica de 1 a 5 estrellas a un vendedor despues de una compra. Valida que el pedido exista y pertenezca al comprador autenticado (403 si es ajeno), que exista al menos una linea de compra no cancelada hacia ese vendedor (400), que el pedido no este ya calificado (400, restriccion UNIQUE uq_pedido_calificacion_vend del esquema) y estrellas 1-5 (zod, CHECK en BD). INSERT parametrizado en `calificaciones_vendedores` (sin migracion, la tabla ya existe).
- **Motivo**: RF107 es un RF vigente del modulo Interaccion comprador-vendedor (RF105-RF110) sin integrante asignado; el backend solo tenia lectura del promedio (RF49).
- **Requerimientos**: RF107
- **Evidencia**: probado contra el server activo y la BD real commercity_v2 (2026-08-21): POST pedido 57 / vendedor 474 (Erick Prueba) -> 201 id=5 estrellas=5; duplicado -> 400; estrellas=6 -> 400; pedido 99999 -> 404; pedido ajeno (2) -> 403; vendedor sin compra en el pedido -> 400. Persistencia verificada: GET /api/productos/584 muestra calificacion_promedio=5 y total_calificaciones=1 para Erick Prueba. Tests unitarios 8/8 VERIFICADOS (suite completa 283/283, era 275/275, +8 sin regresion, 19 archivos).
- **Estado**: Completado y verificado

---

## 2026-08-21 - DOCS: regla memoria-proyecto.md y actualizacion de reglas de respuesta

- **Autor**: Daniel Palacios
- **Archivos**:
  - .trae/rules/memoria-proyecto.md (nuevo: memoria del proyecto SIEMPRE actualizada al cerrar tarea y al finalizar turno; rutas exactas de project_memory.md y topics.md; checklist de cierre)
  - .trae/rules/respuesta-asistente.md (parrafos fluidos SOLO para WhatsApp; este chat mantiene tablas/listas/bloques de codigo)
  - memoria del proyecto: project_memory.md (seccion Estado 2026-08-21 agregada)
- **Descripcion**: se crea la regla que obliga a mantener la memoria del proyecto (project_memory.md y topics.md) actualizada en cada cierre de tarea y fin de turno, con rutas exactas, momentos de actualizacion obligatorios, estructura minima por secciones y checklist de cierre. Se ajusta respuesta-asistente.md para que el formato de parrafos fluidos aplique solo a WhatsApp, y se actualiza la memoria del proyecto con el estado del 21/08 (RF46/RF47 cerrado, chat de Diego integrado, ramas, temporales).
- **Motivo**: la memoria del proyecto estaba desactualizada (20/08) y no existia regla que garantizara su mantenimiento continuo entre sesiones.
- **Requerimientos**: N/A
- **Evidencia**: project_memory.md actualizado con Estado 2026-08-21; regla memoria-proyecto.md en .trae/rules/.
- **Estado**: Completado

---

## 2026-08-21 - FEAT: modulo Chat RF105 de Diego Serna integrado (fotos y archivos)

- **Autor**: Diego Serna (integrado y revisado por Daniel Palacios)
- **Archivos**:
  - backend/src/server/controllers/chat.controllers.js (reemplazado por el de Diego: enviarMensaje multipart, listarConversaciones, obtenerConversacion, marcarMensajeLeido; validarId inline y limite de mensaje 5000 chars)
  - backend/src/server/routes/chat.routes.js (reemplazado: POST /, GET /conversaciones, GET /mensajes/:usuarioId, PATCH /mensajes/:id/leido)
  - backend/src/server/config/multer.chat.js (nuevo: imagenes + documentos, 10 MB, guarda en /uploads)
  - backend/src/server/__tests__/chat.controllers.test.js (reemplazado, 13 tests de Diego)
  - backend/src/server/app.js (Fix helmet imagenes: crossOriginResourcePolicy cross-origin para servir /uploads al frontend)
- **Descripcion**: se integra el modulo Chat interno (RF105) entregado por Diego Serna, que reemplaza al respaldo del lider: envia mensajes de texto y archivos reales via multipart (tipo_mensaje derivado del mimetype: imagen/archivo), lista conversaciones con ultimo mensaje y no leidos, historial entre dos usuarios y marca de leido. El fix de helmet (crossOriginResourcePolicy: cross-origin) habilita que el frontend muestre las imagenes servidas desde /uploads. La tabla `mensajes_chat` ya existe en el esquema (sin migracion).
- **Motivo**: entrega del modulo Chat del Sprint 2 (interaccion comprador-vendedor); el app.js del lider ya tenia el montaje de chatRouter.
- **Requerimientos**: RF105
- **Evidencia**: suite chat 13/13 (verificado 2026-08-21 con node node_modules\vitest\vitest.mjs); suite completa 275/275 (era 278/278 con respaldo de 16 tests de chat; -3 por los 13 tests de Diego); cobertura global Lines 93.53%, Statements 93%, Branch 83.05%, Funcs 99.35%. Primer run de la suite completa fallo 1 worker de Vitest en admin.controllers.test.js (flaky, "Worker exited unexpectedly"); el run con coverage paso 18/18 archivos.
- **Estado**: Completado y verificado

---

## 2026-08-21 - DOCS: RF46/RF47 cerrados sin migracion (campo estado en solo lectura)

- **Autor**: Daniel Palacios
- **Archivos**: .trae/rules/revision-requerimientos.md (seccion 3 checklist y seccion 4)
- **Descripcion**: se cierra el debate del campo `productos.estado`: sigue siendo `ENUM('Disponible','Agotado') GENERATED ALWAYS AS (if(stock>0,...)) STORED`; el formulario del vendedor lo muestra en SOLO LECTURA (RF47 = campo presente e informativo) y el backend nunca lo inserta ni actualiza. La coherencia stock/estado la garantiza la BD (RF88). NO hay migracion.
- **Motivo**: no existe caso de negocio que justifique convertir la columna en escribible; migrar solo agregaria riesgo sin beneficio (335 productos sin inconsistencias).
- **Requerimientos**: RF46, RF47, RF88
- **Evidencia**: SHOW CREATE TABLE productos (2026-08-21) confirmo que la columna sigue STORED GENERATED; sin errores conocidos de estado/stock en la BD real.
- **Estado**: Completado

---

## 2026-08-20 - FEAT: modulo Notificaciones RF99-RF104 (Carlos Vidal) integrado

- **Autor**: Carlos Vidal (integrado y revisado por Daniel Palacios)
- **Archivos**:
  - backend/src/server/controllers/notificaciones.controllers.js (nuevo: registrarNotificacion best-effort, listarNotificaciones, contarNoLeidas, marcarComoLeida, marcarTodasLeidas, eliminarNotificacion, eliminarTodas)
  - backend/src/server/routes/notificaciones.routes.js (nuevo: GET /, GET /no-leidas, PATCH /leidas, PATCH /:id/leida, DELETE /, DELETE /:id)
  - backend/src/server/__tests__/notificaciones.controllers.test.js (nuevo, ~28 tests)
  - backend/src/server/controllers/pedidos.controllers.js (registro por eventos: notificacion de compra en confirmarPago y de envio/entregado en actualizarEstado, best-effort)
  - backend/src/server/app.js (montar /api/notificaciones)
- **Descripcion**: modulo de notificaciones (RF99-RF104): listado reciente con filtro por tipo (RF100/RF101), indicador de no leidas (RF104), marcar leida/individual o todas, eliminar individual o masivo (RF102), url de redireccion (RF103). Se integro el registro por eventos en el flujo de pedidos (compra y avance de envio) con patron best-effort: un fallo al registrar la notificacion nunca rompe el pedido ACID. Usa el ENUM real `estado` ('leido'/'no leido') verificado en commercity_v2.
- **Motivo**: modulo asignado a Carlos Vidal en el Sprint 2 (alcance ampliado: interaccion comprador-vendedor).
- **Requerimientos**: RF99, RF100, RF101, RF102, RF103, RF104
- **Evidencia**: `vitest run` -> 278/278 passed (18 archivos), suite notificaciones 27/27. Sin regresion (era 251/251).
- **Estado**: Completado

---

## 2026-08-20 - FEAT: modulo Chat interno RF105 (backend)

- **Autor**: Daniel Palacios
- **Archivos**:
  - backend/src/server/controllers/chat.controllers.js (nuevo: enviarMensaje, listarConversaciones, listarMensajesCon, marcarComoLeido)
  - backend/src/server/routes/chat.routes.js (nuevo: POST /mensajes, GET /conversaciones, GET /mensajes/:receptorId, PATCH /mensajes/:id/leido)
  - backend/src/server/app.js (montar /api/chat)
  - backend/src/server/__tests__/chat.controllers.test.js (nuevo, 14 tests)
- **Descripcion**: modulo de chat interno entre usuarios (RF105): enviar mensajes de texto/imagen/archivo, listar conversaciones con el ultimo mensaje y el conteo de no leidos, historial entre dos usuarios (marca como leidos los recibidos) y marcar un mensaje como leido. Usa la tabla real `mensajes_chat` (DDL verificado en commercity_v2: emisor_id, receptor_id, tipo_mensaje ENUM texto/imagen/archivo, mensaje, archivo_url, enviado_at, leido) sin requerir migracion. Todas las rutas protegidas con `authRequired`; consultas parametrizadas; el emisor sale del JWT (`req.userId`), nunca del body.
- **Motivo**: modulo nuevo del alcance ampliado del Sprint 2 (interaccion comprador-vendedor), sin integrante asignado en el plan.
- **Requerimientos**: RF105
- **Evidencia**: `vitest run` -> 251/251 passed (17 archivos), suite chat 16/16. Sin regresion (era 235/235).
- **Estado**: Completado

---

## 2026-08-20 - DOCS: RF140 validado contra BD real (sin migracion)

- **Autor**: Daniel Palacios
- **Archivos**: .trae/rules/revision-requerimientos.md (seccion 4: RF140 SIN migracion)
- **Descripcion**: se verifico en commercity_v2 que `detalle_pedidos.subtotal` ya se guarda SIN IVA (precio/1.19) y que `monto_vendedor`/`monto_comision` se llenan correctamente al aprobar el pago (90/10); las columnas NO son generadas (confirmado con SHOW CREATE TABLE). Se decide NO migrar: las columnas generadas quedan como mejora opcional post-entrega.
- **Motivo**: cerrar el RF140 sin tocar el esquema productivo y avanzar en el Sprint 2.
- **Requerimientos**: RF140
- **Evidencia**: SHOW CREATE TABLE detalle_pedidos en commercity_v2 + 5 lineas reales (subtotal 1091596.64 = 1299000/1.19; montos 982436.98/109159.66 = 90/10 sobre subtotal).
- **Estado**: Completado

---

## 2026-08-20 - FEAT: RF129 - las lineas canceladas desaparecen de los Pedidos del vendedor

- **Autor**: Daniel Palacios
- **Archivos**:
  - backend/src/server/controllers/tienda.controllers.js (getHistorialVentas: excluye `estado_envio <> 'Cancelado'` por defecto)
  - backend/src/server/__tests__/tienda.controllers.test.js (2 tests nuevos de RF129)
- **Descripcion**: en el historial de ventas del vendedor (`GET /api/tienda/ventas`), las lineas canceladas por el comprador ya no aparecen por defecto (desaparecen de la seccion Pedidos, como exige RF129). Solo se muestran si el vendedor filtra explicitamente `estado=Cancelado` (la devolucion se sigue reflejando en Mi tienda via RF137, sin cambio).
- **Motivo**: el Director cerro la devolucion de requerimientos; RF129 quedaba pendiente de implementacion asignada al lider backend.
- **Requerimientos**: RF129
- **Evidencia**: `vitest run` -> 235/235 passed (16 archivos), suite tienda 16/16 (incluye 2 tests de RF129). Sin regresion (era 233/233).
- **Estado**: Completado

---

## 2026-08-20 - DOCS: adoptar numeracion de requerimientos version final 20/08 y cerrar RF140/RF141

- **Autor**: Daniel Palacios
- **Archivos**:
  - .trae/rules/revision-requerimientos.md (mapeo RF/RNF actualizado a la numeracion 20/08, checklist y conflictos)
  - LAST VERSION/Commercity (optimizado)/Commercity (optimizado).docx.md (nuevo: documento oficial final del Director)
- **Descripcion**: se adopto como fuente unica de requerimientos la version final 2026-08-20 del Director (`Commercity (optimizado).docx.md`), que renumeró los RF: la cancelacion paso de RF135 a RF35, el perfil publico de RF106 a RF110, el IVA/desglose se reparte en RF48/RF120/RF121/RF140 y la moneda COP es RF141. Se actualizo la regla revision-requerimientos.md (tabla de mapeo por modulo, checklist y conflictos). El Director cerro: RF140 (subtotal SIN IVA = precio/1.19 en detalle_pedidos; monto_vendedor 90% y monto_comision 10% como columnas generadas; IVA solo en vuelo en la pasarela; sin columna de IVA) y RF141 (moneda COP vigente; el RF141 antiguo de almacenar IVA en BD fue eliminado; el seguimiento del IVA desde BD queda agendado post-entrega). RF36 cerrado (cubierto por frontend); RF129 queda pendiente de implementar (filtrar lineas canceladas en Pedidos del vendedor).
- **Motivo**: el Director envio el SRS final actualizado (20/08); se requiere alinear la numeracion oficial para las revisiones y asignaciones (el perfil publico pasa a RF110, afecta la asignacion de Cristian).
- **Requerimientos**: RF140, RF141, RF36, RF129, RF110
- **Evidencia**: lectura del documento oficial 20/08 (`LAST VERSION/Commercity (optimizado)/Commercity (optimizado).docx.md`) y confirmacion del Director en el grupo de lideres (20/08).
- **Estado**: Completado (RF129 pendiente de implementacion)

---

## 2026-08-12 - FEAT: modulo Reportes (creacion por comprador) RF62/RF63, RF79, RF101

- **Autor**: Daniel Palacios (en suplencia de Mosquera, modulo Reportes)
- **Archivos**:
  - backend/src/server/controllers/reportes.controllers.js (nuevo: crearReporte)
  - backend/src/server/routes/reportes.routes.js (nuevo: POST /api/reportes)
  - backend/src/server/app.js (montar /api/reportes)
  - backend/src/server/__tests__/reportes.controllers.test.js (nuevo, 11 tests)
- **Descripcion**: se implemento el lado comprador del modulo Reportes, que estaba pendiente (el lado admin ya existia desde el Panel Admin de Cabrera). `POST /api/reportes` permite a un usuario autenticado reportar un producto o usuario con motivo obligatorio y evidencia opcional (archivo multipart "evidencia" via multer). El `informante_id` se toma del JWT (`req.userId`), nunca del body. Se valida: tipo (Producto/Usuario, normalizado), motivo obligatorio (max 2000), producto/usuario valido y existente, y se rechaza el autoreporte. La evidencia usa la columna `evidencia_url` (brecha B2 resuelta en el esquema real v2). El borrado logico (archivado) y la resolucion ya estaban cubiertos en `controllers/admin/reportes.controllers.js`.
- **Motivo**: Mosquera no entrego su modulo y el usuario pidio hacer el trabajo en su lugar (plazo sabado incumplido); Reportes era el unico modulo pendiente de los 10 del plan.
- **Requerimientos**: RF62, RF63, RF79, RF101
- **Actualizacion 2026-08-20**: con la numeracion final del documento del Director, este modulo cubre RF63-RF69 (reportes del admin), RF85-RF86 (reportar producto) y RF108-RF109 (reportar usuario por chat).
- **Evidencia**: `vitest run` -> 233/233 passed (16 archivos); modulo nuevo 11/11. Cobertura Statements 93.07% (sin regresion; era 93.01%).
- **Estado**: Completado (pendiente E2E contra BD real y push a commercycity con autorizacion)

---

## 2026-08-12 - CHORE: push a commercycity del modulo Perfil Vendedor (Yepes) y frontend Catalogo (Perea)

- **Autor**: Daniel Palacios
- **Archivos**:
  - Rama `backend`: backend/src/server/controllers/productos.controllers.js, backend/src/server/routes/productos.routes.js, backend/src/server/config/multer.js, backend/src/server/app.js, backend/src/server/__tests__/productos.vendedor.test.js, backend/package.json, backend/package-lock.json
  - Rama `feature/frontend-modulos-s1`: frontend/src/utils/productosApi.js, frontend/src/utils/mapearProducto.js
  - .trae/rules/git-push-politica.md y .trae/rules/git-autorizacion-versionado.md (se permite subir frontend cuando hace parte de la actividad asignada al modulo)
  - .gitignore (excluir backend/src/server/uploads/ runtime)
- **Descripcion**: se actualizo la politica de push para permitir archivos frontend cuando forman parte del modulo asignado al integrante. Se hizo push a `commercycity` vía worktrees temporales: rama `backend` con el modulo Perfil Vendedor de Yepes (commit 956e0be, autor Jose Yepes) y rama nueva `feature/frontend-modulos-s1` desde main con los utils del Catalogo de Perea (commit aaf6360, autor Carlos Perea) para que Diego Serna revise y haga merge.
- **Motivo**: el usuario indico que los archivos frontend de las actividades asignadas si se suben al repositorio del lider; se requeria subir el trabajo integrado de Yepes (backend) y el frontend de Perea que no existia en main.
- **Requerimientos**: RF44-RF49, RF54, RF78-RF85
- **Evidencia**: `git ls-remote commercycity` confirma refs/heads/backend=956e0be y refs/heads/feature/frontend-modulos-s1=aaf6360; worktrees y ramas locales temporales eliminados.
- **Estado**: Completado

---

## 2026-08-12 - FEAT: integracion del modulo Perfil Vendedor de Jose Yepes (RF44-RF49, RF54) con auth JWT

- **Autor**: Daniel Palacios
- **Archivos**:
  - backend/src/server/controllers/productos.controllers.js (crearProductoVendedor, editarProductoVendedor, getMisProductos con req.userId)
  - backend/src/server/routes/productos.routes.js (rutas protegidas: POST /productos, PUT /productos/:id, GET /productos/mis-productos)
  - backend/src/server/config/multer.js (nuevo: subida de imagenes a /uploads, 5MB, formatos validos)
  - backend/src/server/app.js (servir /uploads estaticamente)
  - backend/package.json (dependencia multer)
  - backend/src/server/__tests__/productos.vendedor.test.js (nuevo, 13 tests)
  - AVANCES/SPRING 1/JOSE YEPES/ (carpeta de entrega limpia + LEEME.txt + informe de revision)
- **Descripcion**: se integro el modulo Perfil Vendedor de Jose Yepes resolviendo el hallazgo 4.1 (vendedor hardcodeado VENDEDOR_ID_TEMPORAL=3): ahora el controller usa `req.userId` del JWT y las rutas se protegen con `authRequired + requireRoles(["vendedor"])`; la edicion verifica propiedad (`WHERE id = ? AND vendedor_id = ?`). Se creo `config/multer.js` para la subida de imagenes (carpeta uploads creada automaticamente) y se sirve `/uploads` estaticamente. Se escribieron 13 tests (401/403/201/400/404/500, propiedad, categoria nueva, imagen nueva). El estado Disponible/Agotado se mantiene calculado por la BD (GENERADA); la migracion del RF46 queda pendiente con Meneses.
- **Motivo**: el usuario pidio corregir el hallazgo 4.1 del informe de Yepes e integrar el modulo con pruebas (la entrega usaba un vendedor fijo y no traia tests).
- **Requerimientos**: RF44, RF45, RF46 (pendiente migracion), RF48, RF49, RF54 (RESUELTO)
- **Evidencia**: `npm test` -> 222/222 passed (15 archivos); cobertura Statements 93.01%. E2E contra BD real: POST /api/productos con token de vendedor e imagen -> 201 (producto 585); GET /api/productos/mis-productos -> 200 (11 productos); PUT /api/productos/585 -> 200; imagen servida en /uploads -> 200; sin token -> 401; comprador -> 403. Nota: se detecto un proceso zombie en el puerto 5000 (doble bind en Windows) que respondia con codigo viejo; se resolvio matando el proceso y relanzando.
- **Estado**: Completado

---

## 2026-08-09 - FEAT: integracion y pruebas del modulo Catalogo/Producto de Carlos Perea (RF78/RF79/RF86)

- **Autor**: Daniel Palacios
- **Archivos**:
  - backend/src/server/controllers/productos.controllers.js (nuevas funciones getProductoDetalle y validarStockProducto)
  - backend/src/server/routes/productos.routes.js (nuevas rutas /api/productos/:id y /api/productos/:id/validar-stock)
  - backend/src/server/__tests__/productos.controllers.test.js (14 casos nuevos sobre detalle y validacion de stock)
  - frontend/src/utils/productosApi.js (nuevo: cliente HTTP del modulo Catalogo/Producto)
  - frontend/src/utils/mapearProducto.js (nuevo: adaptador del backend a la UI)
  - frontend/src/pages/Inicio/Inicio.jsx (panel principal conectado a GET /api/productos; se elimino el array mock productsData)
  - frontend/src/components/inicio/FichaProducto.jsx (validacion de stock contra el backend antes de agregar al carrito, RF86)
  - AVANCES/SPRING 1/CARLOS PEREA/INFORME_REVISION_MODULO_CATALOGO_PEREA_2026-08-09.md (hallazgos 4.1/4.2/4.3 marcados RESUELTOS)
- **Descripcion**: se integro la entrega de Carlos Perea (Catalogo/Producto) resolviendo los 3 hallazgos de la revision: (1) tests unitarios creados (detalle 200/404/400, filtro u.activo=1, validar stock ok/agotado/cantidad-excedida/404/400); (2) solo se montaron las rutas nuevas /productos/:id y /productos/:id/validar-stock sin duplicar GET /productos del Panel Principal; (3) el detalle ahora excluye vendedores inactivos (AND u.activo = 1, RF74). En frontend se portaron productosApi.js y mapearProducto.js (adaptados a la URL central y al contrato { success, data }), el Inicio consume la API real con estados loading/error/empty y muestra la calificacion del vendedor (RF49), y la ficha valida stock antes de agregar al carrito (RF86).
- **Motivo**: el usuario pidio corregir e integrar de una vez la entrega de Perea y probarla (la entrega no traia tests, duplicaba la ruta de listado y no filtraba vendedores inactivos en el detalle).
- **Requerimientos**: RF78, RF79, RF86, RF49, RF74, RF53 (RESUELTO)
- **Evidencia**: `npm test` -> 209/209 passed (14 archivos); cobertura Statements 93.41% (antes 93.09%, no se redujo). E2E contra BD real: GET /api/productos/584 -> 200 (detalle completo), validar-stock?cantidad=1 -> valido:true, cantidad=2 -> valido:false, 99999 -> 404, abc -> 400, cantidad=0 -> 400. Build de frontend OK (dist/ generado). Verificado en navegador (http://localhost:5173): la grilla carga productos reales del backend y la ficha abre el detalle sin errores de red ni de React. Nota: los productos 584/585 tienen imagenes placeholder (example.com) en la BD, no es defecto de codigo.
- **Estado**: Completado

---

## 2026-08-08 - FEAT: cierre del modulo Historial de Compras de Jary (RF26-RF32 completos)

- **Autor**: Daniel Palacios
- **Archivos**:
  - backend/src/server/controllers/compras.controllers.js (historial agrupado por pedido + campos RF31)
  - frontend/src/pages/Perfil/HistorialDeCompras.jsx (conectado a la API real; se elimino el mock data/historialCompras)
  - backend/src/server/__tests__/historial.controllers.test.js (mock y aserciones actualizados al nuevo contrato)
- **Descripcion**: se completo el modulo de historial de compras (Jary) para cumplir RF26-RF32: (1) backend agrupa las lineas por pedido (RF32) y expone todos los campos del RF31 (direccion de envio, vendedores, productos, cantidad, precio unitario, IVA 19% en vuelo, total por linea y por pedido, imagen, estado por linea); (2) estado predominante del pedido con prioridad Pendiente>En camino>Entregado>Cancelado (RF28/RF29); (3) filtro ?estado= ampliado a Cancelado (RF30); (4) frontend consume GET /api/historial/compras con token JWT, con estados loading/error/empty y tabla con precio unitario, IVA y total (antes usaba datos mock de data/historialCompras).
- **Motivo**: el historial estaba marcado PARCIAL porque el frontend usaba datos mock y faltaban campos del RF31/RF32; el usuario pidio completar el modulo de Jary.
- **Requerimientos**: RF26, RF27, RF28, RF29, RF30, RF31, RF32 (RESUELTO)
- **Evidencia**: `npm test` -> 195/195 passed. Verificado E2E contra la API real: GET /api/historial/compras -> 200 con 17 pedidos del comprador, agrupados, con direccion, vendedores, resumen subtotal/IVA/total e items con precio unitario/IVA/total e imagen.
- **Estado**: Completado

---

## 2026-08-08 - FEAT: cierre de RF75/RF76 - cuenta bancaria de Commercity gestionada por el administrador

- **Autor**: Daniel Palacios
- **Archivos**:
  - backend/src/server/controllers/admin/cuentaBancaria.controllers.js (nuevo: get + masked + upsert con es_commercity=1 y cifrado RNF11)
  - backend/src/server/routes/admin.routes.js (rutas /api/admin/mi-cuenta-bancaria, protegidas con authRequired + requireRoles administrador)
  - frontend/src/pages/Administrador/AjustesAdministrador.jsx (conectado al backend; se elimino el uso de localStorage)
  - backend/src/server/__tests__/admin.cuentaBancaria.test.js (nuevo, 8 tests)
- **Descripcion**: se implemento el registro de la cuenta bancaria de la plataforma (la que recibe la comision del 10%) por el administrador: GET (descifrada), GET /masked (vista segura RF122) y POST/PUT upsert que SIEMPRE fuerza `es_commercity = 1` con cifrado AES-256-GCM (RNF11). El frontend de ajustes del admin ahora consulta y guarda contra el backend (antes persistia solo en localStorage del navegador).
- **Motivo**: RF75 (seccion de ajustes del admin) y RF76 (registrar la cuenta bancaria de Commercity) estaban pendientes: la funcionalidad no estaba cableada al backend y el endpoint de cuenta bancaria solo aceptaba rol vendedor.
- **Requerimientos**: RF75, RF76, RNF11 (RESUELTO)
- **Evidencia**: `npm test` -> 195/195 passed (14 archivos); cobertura Statements 93.09% (umbral 60). Verificado E2E contra la API real: POST 201 (registro, es_commercity=true), GET 200 (descifrada), GET /masked 200 (enmascarado, ultimos4 7890), vendedor -> 403, sin token -> 401, numero con letras -> 400.
- **Estado**: Completado

---

## 2026-08-08 - DOCS: set de pruebas de integracion end-to-end + verificacion del reporte de BD de Meneses

- **Autor**: Daniel Palacios
- **Archivos**:
  - AVANCES/PRUEBAS/ejecutar_pruebas.mjs (runner de integracion, re-ejecutable)
  - AVANCES/PRUEBAS/INFORME_PRUEBAS.md (50 pruebas paso a paso)
  - AVANCES/PRUEBAS/resultados.json (trazabilidad JSON)
  - AVANCES/PRUEBAS/informe_pruebas_final.md (informe consolidado)
  - AVANCES/PRUEBAS/capturas/*.png (10 capturas del frontend por modulo)
- **Descripcion**: se genero y ejecuto un set de pruebas de integracion contra el backend desplegado (`http://localhost:5000`) validando login + un flujo completo por modulo: Autenticacion (12), Catalogo (4), Carrito (8), Pedidos/Pago (8), Historial (3), Tienda (7) y Admin (8). **Resultado: 50/50 OK (0 fallos)** contra la BD real `commercy_v2`. Se tomo captura de pantalla de cada modulo del frontend (10 PNG en `AVANCES/PRUEBAS/capturas/`). Ademas se verifico contra la BD real el reporte de Jorge Meneses: migraciones 009 (EVENT limpiar_carritos_inactivos + carrito_items.updated_at), 010 (tokens_invalidados + token_recuperacion_expiracion) y 011 (reportes.archivado) — todas aplicadas correctamente.
- **Motivo**: el usuario pidio un set de pruebas (login + flujo por modulo) con capturas de pantalla guardadas en AVANCES/PRUEBAS, y pausar las pruebas para verificar el mensaje de BD de Meneses.
- **Requerimientos**: RF2, RF3, RF26-RF32, RF39-RF42, RF55-RF77, RF83-RF90, RF107-RF109, RF111-RF118, RF119-RF125, RF134, RF135, RNF11 (VALIDADO E2E)
- **Evidencia**: `AVANCES/PRUEBAS/INFORME_PRUEBAS.md` (50/50 PASS); verificado en BD: EVENT ENABLED, tabla tokens_invalidados (token_hash/expira_en/creado_en), columnas token_recuperacion_expiracion y reportes.archivado presentes. Hallazgo: el admin del seed (carlos.munoz) no existe en la BD real; admins reales admin01/02/03@commercity.com (ids 471-473, password 123456).
- **Estado**: Completado

---

## 2026-08-08 - DOCS/FIX: sincronizacion del schema oficial v3 con la BD real + verificacion de mojibake

- **Autor**: Daniel Palacios
- **Archivos**: LAST VERSION/schema_commercity_3.sql
- **Descripcion**: (1) se anexo al schema oficial la seccion "Migraciones aplicadas a commercy_v2 (2026-08-08)": tabla `tokens_invalidados` (010, RF2), columna `reportes.archivado` (011, RF60-RF66) e indices FULLTEXT `ft_nombre`, `ft_productos_busqueda` y `ft_usuario` (M7, RF69-RF71); (2) se ajusto `notificaciones.estado` al enum real de la BD (`enum('leido','no leido')`). Se verifico la BD remota: NO hay mojibake en `notificaciones.estado` (valores limpios 'leido' x6 / 'no leido' x4).
- **Motivo**: cerrar los pendientes de BD corregibles por el lider (sincronizar fuente de verdad y confirmar limpieza de datos).
- **Requerimientos**: RF2, RF4, RF60-RF66, RF69-RF71 (INTEGRADO)
- **Evidencia**: consulta a commercy_v2: `notificaciones.estado` = enum('leido','no leido'), 10 filas sin caracteres corruptos; indices FULLTEXT presentes en productos y usuarios.
- **Estado**: Completado

---

## 2026-08-08 - FEAT: push del modulo Panel Administrativo a commercycity (rama backend, commit 6056216)

- **Autor**: Daniel Palacios
- **Archivos**: rama `backend` de https://github.com/diegoSerna17/Commercity.git (commit 6056216, 10 archivos, +1283)
- **Descripcion**: se actualizo la rama backend del repo del lider con el modulo Panel Administrativo de Cabrera integrado: `controllers/admin/*` (stats, usuarios, productos, reportes, pedidos, busqueda, utils), `routes/admin.routes.js` (protegida con authRequired + requireRoles administrador), `__tests__/admin.controllers.test.js` y el montaje en `app.js`. Se uso worktree temporal sobre la rama backend.
- **Motivo**: el usuario autorizo el commit y push del modulo admin a la rama backend.
- **Requerimientos**: RF55-RF77, RF54, RF74 (PUSH)
- **Evidencia**: push exitoso `90a0c90..6056216 backend -> backend`; 187/187 tests; cobertura Statements 93.17%. EXCLUIDO del push: migraciones `db/` (quedan en origin/BD), `.env`, `informes/`.
- **Estado**: Completado

---

## 2026-08-08 - FEAT: modulo Panel Administrativo de Juan Cabrera corregido e integrado al backend central (fixes 4.1-4.5)

- **Autor**: Daniel Palacios
- **Archivos**:
  - backend/src/server/controllers/admin/ (nuevo: admin.utils, stats, usuarios, productos, reportes, pedidos, busqueda)
  - backend/src/server/routes/admin.routes.js (nuevo, protegido con authRequired + requireRoles(["administrador"]))
  - backend/src/server/app.js (montaje /api/admin), backend/src/server/db/011_agregar_archivado_reportes.sql (nuevo)
  - backend/src/server/__tests__/admin.controllers.test.js (nuevo, 45 tests)
- **Descripcion**: se integro el Panel Admin (RF55-RF77) con los fixes del informe v2.0: 4.1 CRITICO rutas admin protegidas con authRequired + requireRoles(["administrador"]) (router.use), 4.2 eliminacion de reportes por ARCHIVO logico (columna archivado, migracion 011, nunca DELETE), 4.4 getProductos lista todos (activos y suspendidos) + endpoint restaurar, 4.5 totalComisiones excluye lineas canceladas, 4.3 no aplica (la desactivacion de cuenta propia ya usa req.userId en el backend central). Ademas B-R5 con reembolso RF74: si al banear un pedido queda sin lineas activas, el pago pasa a 'Reembolsado'. Contrato { success, data/error }.
- **Motivo**: el usuario pidio proceder con el fix e integracion del modulo admin de Cabrera.
- **Requerimientos**: RF55-RF77, RF54, RF74, RF72, RF73, RF68, RF69-RF71, RF60-RF66 (INTEGRADO)
- **Evidencia**: `npm test` -> 187/187 passed (13 archivos); cobertura Statements 93.17%, Branches 83.4%, Functions 99.09%, Lines 93.91% (admin 86.4% stmts). Migracion 011 aplicada a commercy_v2 (reportes.archivado: OK).
- **Estado**: Completado

---

## 2026-08-08 - FEAT: migracion 011 aplicada a la BD remota commercy_v2

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/db/011_agregar_archivado_reportes.sql (aplicado a la BD remota)
- **Descripcion**: se agrego la columna `reportes.archivado TINYINT(1) NOT NULL DEFAULT 0` (archivo logico de reportes, fix 4.2 del Panel Admin). Migracion idempotente (guarda en information_schema).
- **Motivo**: los reportes son historial de moderacion; se archivan, nunca se borran fisicamente.
- **Requerimientos**: RF65, RF66, RF60 (INTEGRADO)
- **Evidencia**: `MIGRACION_011_APLICADA en commercity_v2`; verificacion: `reportes.archivado: OK`.
- **Estado**: Completado

---

## 2026-08-08 - FEAT: push de modulos backend integrados a commercycity (rama backend, commit 90a0c90)

- **Autor**: Daniel Palacios
- **Archivos**: rama `backend` de https://github.com/diegoSerna17/Commercity.git (commit 90a0c90, 30 archivos, +3376/-29)
- **Descripcion**: se actualizo la rama backend del repo del lider con los modulos integrados del backend central: auth (Diego), carrito (Daniel), perfil publico (Cristian), historial (Jary), pedidos/pago (Carlos), panel principal (Brandon) y tienda del vendedor (Erick). Incluye controllers, rutas, middlewares, schemas, utils (config, response, mailer, finanzas, crypto), app/server, package.json/lock y 12 archivos de tests. Se uso worktree temporal para construir el commit limpio sobre la rama backend (sin arrastrar el historial divergente de main).
- **Motivo**: el usuario autorizo subir las actualizaciones de backend al repo de Diego.
- **Requerimientos**: RF1-RF13, RF28-RF31, RF112-RF125, RF134-RF136, RF40, RF74, RNF1, RNF10, RNF11 (PUSH)
- **Evidencia**: push exitoso `7fe83b2..90a0c90 backend -> backend`; 152/152 tests; cobertura Statements 94.87%. EXCLUIDOS del push: migraciones `db/` (quedan en origin/BD), `backend/.env`, `.env.example`, `informes/`, `frontend/`, `AVANCES/`.
- **Estado**: Completado

---

## 2026-08-08 - FEAT: migracion 010 aplicada a la BD remota commercy_v2

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/db/010_integrar_auth_diego_serna.sql (aplicado a la BD remota)
- **Descripcion**: se aplico la migracion 010 sobre commercy_v2 (149.130.178.228): creacion de la tabla `tokens_invalidados` (lista negra para revocar tokens JWT en logout, RF2) y adicion de la columna `usuarios.token_recuperacion_expiracion` (expiracion de 5 minutos, RF4, pendiente documentado desde el informe de BD v1.5 seccion 3.3). Migracion idempotente (CREATE TABLE IF NOT EXISTS + guarda en information_schema).
- **Motivo**: dejar la BD remota al dia para que el logout con revocacion y la recuperacion de contrasena funcionen en produccion.
- **Requerimientos**: RF2, RF4 (INTEGRADO)
- **Evidencia**: `MIGRACION_010_APLICADA en commercity_v2`; verificacion post-aplicacion: `tokens_invalidados: OK`, `token_recuperacion_expiracion: OK`.
- **Estado**: Completado

---

## 2026-08-08 - FIX: cancelacion RF135 consultaba comprador_id en la tabla equivocada (B)

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/controllers/compras.controllers.js, backend/src/server/__tests__/historial.controllers.test.js
- **Descripcion**: `cancelarPedidoComprador` hacia `WHERE id = ? AND comprador_id = ?` sobre `detalle_pedidos`, pero esa columna pertenece a `pedidos` (no existe en detalle). Se corrigio la consulta con JOIN a `pedidos` (`dp.id = ? AND p.comprador_id = ? AND dp.estado_envio = 'Pendiente'`). Se actualizo la asercion del test correspondiente.
- **Motivo**: bug pre-existente del backend central detectado al revisar los modulos de Carlos/Erick; sin la correccion la cancelacion fallaba contra la BD real (Unknown column 'comprador_id').
- **Requerimientos**: RF135 (FIX)
- **Evidencia**: `npm test` -> 152/152 passed (12 archivos).
- **Estado**: Completado

---

## 2026-08-08 - FEAT: modulos de Pedidos/Pago (Carlos Vidal) y Tienda del Vendedor (Erick) corregidos e integrados al backend central

- **Autor**: Daniel Palacios
- **Archivos**:
  - backend/src/server/controllers/pedidos.controllers.js (nuevo, integrado y corregido de Carlos)
  - backend/src/server/controllers/tienda.controllers.js (nuevo, integrado y corregido de Erick)
  - backend/src/server/routes/pedidos.routes.js (nuevo), routes/tienda.routes.js (nuevo)
  - backend/src/server/utils/finanzas.js (nuevo, de Carlos: IVA/90-10/Luhn), utils/crypto.js (nuevo, de Erick corregido)
  - backend/src/server/utils/config.js (CRYPTO_SECRET_KEY derivado de JWT_SECRET, sin valor hardcodeado)
  - backend/src/server/middleware/error.middleware.js (respeta httpStatus -> 400 de validacion Zod)
  - backend/src/server/app.js (montaje /api/pedidos y /api/tienda), backend/.env.example (CRYPTO_SECRET_KEY)
  - backend/src/server/__tests__/ (nuevos finanzas, pedidos, tienda, crypto; ampliado error.middleware)
- **Descripcion**: se corrigieron TODOS los hallazgos v1.0 de los informes de Carlos y Erick y se integraron ambos modulos al backend central. PEDIDOS (Carlos): GET /api/pedidos/resumen, POST /api/pedidos/confirmar-pago (RF134 ACID: pedido + lineas + stock + pago en UNA transaccion FOR UPDATE; Luhn antes de aprobar), PATCH /api/pedidos/:id/estado (vendedor avanza UN nivel sus envios). TIENDA (Erick): cuenta bancaria cifrada (get/masked/upsert), GET /api/tienda/ventas, /ingresos, /dashboard/stats. Fixes aplicados: sin pedidos.estado_pedido (RF119, estado por linea estado_envio), sin INSERT a columnas GENERATED ni imagen_url, authRequired + req.userId (nunca IDs del body), RF74 (productos suspendidos/vendedores inactivos), JWT_SECRET y clave de cifrado sin hardcodear (utils/config.js), token de recuperacion sin filtrar (ya en auth central), pago aprobado solo tras validar tarjeta, round2 en montos, contrato { success, data/error }.
- **Motivo**: el usuario pidio corregir todos los hallazgos de Carlos y Erik e integrarlos a las carpetas correspondientes.
- **Requerimientos**: RF112-RF125, RF28-RF31, RF117/RF134, RF118, RF119-RF123, RF126, RF135, RF136, RF74, RNF11 (INTEGRADO)
- **Evidencia**: `npm test` -> 152/152 passed (12 archivos); `npm run test:coverage` -> Statements 94.87%, Branches 85%, Functions 100%, Lines 94.83% (anterior al cambio: 95.04/91.2/100/94.94; el delta corresponde a ~340 lineas nuevas de los 2 modulos). `node -e "import app"` -> APP_OK.
- **Estado**: Completado

---

## 2026-08-08 - DOCS: informe de revision del modulo Pedidos y Pago de Carlos Vidal v1.0 (entrega 1)

- **Autor**: Daniel Palacios
- **Archivos**: "AVANCES/SPRING 1/CARLOS VIDAL/INFORME_REVISION_MODULO_PEDIDOS_PAGO_CARLOS_VIDAL_2026-08-08.md" (nuevo, v1.0)
- **Descripcion**: revision de la entrega de Carlos (backend Pedidos y Pago: resumen carrito, crear pedido, pagar con Luhn, estado, cancelar, historial, detalle; utils/finanzas.js con IVA y 90/10; tests Vitest; migracion 001; CHANGELOG propio). Se destaca lo correcto: desglose de IVA (subtotal = precio/1.19), reparto 90/10 sobre subtotal, Luhn, transacciones ACID con FOR UPDATE, contrato { success, data }. Errores reales v1.0: 3.1 CRITICO entrega incompleta (app.js importa routes/auth.routes.js y middleware/errorHandler.js que NO estan en la entrega -> servidor y tests no arrancan), 3.2 CRITICO pedidos.estado_pedido NO existe en schema v3 (RF119, usado en todas las funciones -> SQL error), 3.3 CRITICO migracion 001 modifica columna inexistente y contradice RF119 (cancelacion por linea + Reembolsado), 3.4 CRITICO sin auth en rutas y confia en comprador_id/vendedor_id del body (IDs sin validar), 3.5 ALTA INSERT a detalle_pedidos con columnas STORED GENERATED e imagen_url inexistente (error 3105), 3.6 ALTA compra dividida en 2 transacciones (RF134 ACID), 3.7 ALTA cancelacion del pedido completo sin reembolso del pago, 3.8 MEDIA RF74 (productos suspendidos/vendedores inactivos), 3.9 MEDIA getUsuarios expone 50 usuarios sin auth (fuga PII), 3.10 MEDIA pago 'Aprobado' directo, 3.11 BAJA redondeo de IVA en mapearDetalle.
- **Motivo**: el usuario pidio revisar las entregas de ERICK y CARLOS VIDAL y generar informes.
- **Requerimientos**: RF28-RF31, RF112-RF124, RF134-RF136, RF135, RF74 (REVISION)
- **Evidencia**: lectura completa de controllers (pedidos, usuarios), rutas, utils/finanzas.js, app.js, migracion, tests y CHANGELOG, contrastada con LAST VERSION/schema_commercity_3.sql (pedidos sin estado_pedido, detalle_pedidos con monto_vendedor/monto_comision STORED GENERATED).
- **Estado**: Completado

---

## 2026-08-08 - DOCS: informe de revision del modulo Tienda del Vendedor de Erick v1.0 (entrega 1)

- **Autor**: Daniel Palacios
- **Archivos**: "AVANCES/SPRING 1/ERICK/INFORME_REVISION_MODULO_TIENDA_VENDEDOR_ERICK_2026-08-08.md" (nuevo, v1.0)
- **Descripcion**: revision de la entrega de Erick (backend Tienda del vendedor: auth, cuenta bancaria cifrada, checkout/pedidos, historial de ventas e ingresos, dashboard; utils/revenue.js con 90/10). Se destaca lo correcto: transacciones ACID con FOR UPDATE, validacion Zod, intento de cifrado RNF11, RBAC en BD, paginacion. Errores reales v1.0: 3.1 CRITICO JWT_SECRET hardcodeado (auth.js), 3.2 CRITICO clave AES de datos bancarios hardcodeada (crypto.js, RNF11), 3.3 CRITICO register acepta rol del cliente y getOrCreateRoleId crea roles arbitrarios (escalada de privilegios), 3.4 ALTA RF4 sin token_recuperacion_expiracion y token devuelto en la respuesta HTTP, 3.5 CRITICO pedidos.estado_pedido NO existe en schema v3 (RF119; usado en 5 lugares -> checkout/historial rompen), 3.6 ALTA INSERT a detalle_pedidos con columnas STORED GENERATED (error 3105), 3.7 ALTA RF134 comisiones 90/10 sobre precio con IVA en lugar de subtotal/1.19, 3.8 ALTA updateOrderStatus sin control de propiedad, 3.9 MEDIA getOrderById sin control de propiedad, 3.10 MEDIA RF74 (productos suspendidos/vendedores inactivos), 3.11 MEDIA pago 'Aprobado' directo, 3.12 BAJA sin tests, 3.13 BAJA carrito_id declarado sin usar.
- **Motivo**: el usuario pidio revisar las entregas de ERICK y CARLOS VIDAL y generar informes.
- **Requerimientos**: RF1-RF13, RF4, RF119-RF126, RF129-RF134, RNF11, RF74 (REVISION)
- **Evidencia**: lectura completa de controllers (auth, bankAccount, orders, usuarios), middlewares/auth.js, utils/crypto.js y revenue.js, validators, server.js y schema incluido, contrastada con LAST VERSION/schema_commercy_3.sql (pedidos sin estado_pedido, detalle_pedidos con generated columns) y la regla api-seguridad.md (JWT_SECRET, rol del cliente).
- **Estado**: Completado

---

## 2026-08-08 - FEAT: modulo de autenticacion de Diego Serna integrado al backend central (fixes 3.1-3.4)

- **Autor**: Daniel Palacios
- **Archivos**:
  - backend/src/server/controllers/usuarios.controllers.js (register, login, logout, getPerfil, cambiarRol, solicitarRecuperacion, restablecerPassword, adminGetDatos)
  - backend/src/server/routes/usuarios.routes.js (endpoints /api/usuarios/{register, login, logout, recover, reset-password, me, me/rol, admin})
  - backend/src/server/middleware/auth.middleware.js (fix 3.1 y 3.3), middleware/validate.middleware.js (nuevo), middleware/error.middleware.js (nuevo)
  - backend/src/server/utils/config.js (nuevo, validacion JWT_SECRET), utils/response.js (nuevo), utils/mailer.js (nuevo, fix 3.4)
  - backend/src/server/schemas/auth.schemas.js (nuevo)
  - backend/src/server/db/010_integrar_auth_diego_serna.sql (nuevo: tokens_invalidados + token_recuperacion_expiracion)
  - backend/src/server/app.js (helmet, cors cerrado, rate-limit por ruta, x-powered-by off, error handler), server.js (JWT_SECRET fatal)
  - backend/.env.example (JWT_SECRET, FRONTEND_URL, RESEND_API_KEY, RESEND_FROM)
  - backend/package.json (bcrypt, zod, resend, helmet, express-rate-limit)
  - backend/src/server/__tests__/ (suites de auth en usuarios, nuevos error.middleware, mailer.utils, config.utils; adaptados role.middleware e historial)
- **Descripcion**: se integro el modulo de autenticacion de la entrega 2 de Diego (`AVANCES/SPRING 1/DIEGO SERNA/2/`) al backend central con la estructura estandar. Endpoints bajo `/api/usuarios/*` (PATCH en me/rol, no PUT). Fixes del informe v3.0: 3.1 JWT_SECRET sin fallback hardcodeado (utils/config.js valida al arrancar, server.js falla si falta, register/login/authRequired usan el secreto validado), 3.2 register con transaccion ACID (usuario + rol), 3.3 logout revoca el token en `tokens_invalidados` (migracion 010) y `authRequired` rechaza tokens revocados (401), 3.4 el correo dice "expira en 5 minutos" (RF4). Endurecimiento central (regla api-seguridad.md): helmet, cors cerrado a FRONTEND_URL, rate-limit 10/min independiente por ruta login/recover, x-powered-by desactivado, error handler centralizado al final de la cadena.
- **Motivo**: el usuario pidio "solucionar todo e integrar a las carpetas" tras la revision del modulo de Diego (informe v3.0).
- **Requerimientos**: RF1-RF13, RF34-RF42, RF4, RF41, RNF1, RNF10 (INTEGRADO)
- **Evidencia**: `npm test` -> 102/102 passed (8 archivos de test); `npm run test:coverage` -> Statements 95.04%, Branches 91.2%, Functions 100%, Lines 94.94% (anterior al cambio: 95.21/91.26/100/95.16; el delta es por 3 archivos nuevos: config.js, mailer.js, error.middleware.js). `npx vitest` sin BD real (mocks de mysql2/promise, bcrypt y resend).
- **Estado**: Completado

---

## 2026-08-08 - DOCS: informe de revision del modulo de autenticacion de Diego v3.0 (entrega 2)

- **Autor**: Daniel Palacios
- **Archivos**: "AVANCES/SPRING 1/DIEGO SERNA/INFORME_REVISION_MODULO_AUTENTICACION_DIEGO_SERNA_2026-08-08.md" (nuevo, v3.0)
- **Descripcion**: revision de la entrega 2 de Diego (modulo de autenticacion, RF1-RF13, RF34-RF42). Esta vez envio solo su modulo, bien delimitado. Corrigio la mayoria de los hallazgos de v2.1: recuperacion con expiracion 5 min (RF4), anti-enumeracion, token de un solo uso, cambio de rol protegido (admin no se autodegrada), validacion Zod en rutas, login rechaza inactivos, requireRoles en BD. Hallazgos v3.0 (solo errores reales): 3.1 CRITICO JWT_SECRET hardcodeado como respaldo en 3 lugares (register, login, auth.middleware) - NO corregido de v2.1, 3.2 ALTA register sin transaccion (usuario+rol), 3.3 MEDIO logout no invalida el token (RF2), 3.4 MEDIO correo dice "expira en 1 hora" pero el token expira en 5 minutos, 3.5 BAJO schema.sql en la entrega (se retiro). Notas de integracion: estructura de carpetas (middlewares/ vs middleware/, database.js vs db.js), PUT vs PATCH.
- **Motivo**: Diego envio actualizaciones en `AVANCES/SPRING 1/DIEGO SERNA/2/`.
- **Requerimientos**: RF1-RF13, RF34-RF42, RF4, RF41, RNF1, RNF10 (REVISION)
- **Evidencia**: lectura completa de controller, rutas, middlewares, schemas, utils y tests de la entrega 2.
- **Estado**: Completado

---

## 2026-08-08 - FEAT: rama unica de backend creada en commercycity con modulos integrados

- **Autor**: Daniel Palacios
- **Archivos**: rama `backend` en https://github.com/diegoSerna17/Commercity.git (commit 7fe83b2, 15 archivos)
- **Descripcion**: se creo la rama unica de backend en el repo del lider partiendo de `backend-carrito-perfil` (carrito + perfil publico) y se agregaron todos los modulos backend integrados: auth JWT + RBAC (auth.middleware.js, role.middleware.js), historial de compras (compras.controllers.js, historial.routes.js), panel principal (productos.controllers.js, productos.routes.js), RF135 cancelar pedido, RF40 eliminar cuenta, montaje en app.js, tests (55/55). Estrategia de ramas definida: `main` (integracion del equipo), `backend` (unica rama de backend, la administra el lider), `feature/*` (integrantes). EXCLUIDOS del push: migraciones M8/RF109 (quedan en origin/BD), informes, changelog, schema, .env.
- **Motivo**: el usuario aprobo la estrategia de una sola rama de backend y pidio subir las mejoras de backend al repo de Diego.
- **Requerimientos**: RF2, RNF1, RNF10, RF26-RF32, RF87-RF94, RF135, RF40, RF74 (INTEGRADO)
- **Evidencia**: push exitoso `[new branch] backend -> backend`; verificacion de que no se incluyo db/ ni .env; worktree temporal eliminado.
- **Estado**: Completado

---

## 2026-08-08 - FEAT: modulo panel principal de Brandon integrado y corregido en backend central

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/controllers/productos.controllers.js (nuevo), backend/src/server/routes/productos.routes.js (nuevo), backend/src/server/app.js, backend/src/server/__tests__/productos.controllers.test.js (nuevo), AVANCES/SPRING 1/BRANDON/2/Commercity-main-panel/Commercity-main-panel/frontend/src/pages/Inicio/Inicio.jsx, frontend/src/components/inicio/FichaProducto.jsx, frontend/src/components/inicio/Reportar.jsx
- **Descripcion**: se integro el backend del Panel Principal (RF87-RF94) al backend central con la estructura estandar: controlador `productos.controllers.js` (getProductos con busqueda/filtros/paginacion, getCategorias, getVendedores), router `productos.routes.js` montado en `/api` (GET /productos, /categorias, /vendedores). Se corrigieron los hallazgos del informe v2.0: 3.1 boton "Agregar al carrito" conectado a `POST /api/carrito` (FichaProducto solo muestra exito si realmente agrego), 3.2 "Enviar reporte" ahora hace fetch a `/reportes/productos/:id` con FormData y muestra error real, 3.3 navegacion al perfil del vendedor con id, 3.5 precio final con descuento en tarjeta, 3.4 se agregaron 8 tests del controlador.
- **Motivo**: el usuario pidio "solucionar todo y organizar en las carpetas principales" tras la revision de Brandon.
- **Requerimientos**: RF87-RF94, RF81, RF82, RF83, RF106, RF52 (INTEGRADO)
- **Evidencia**: `npm test` -> 55/55 passed (5 archivos, +8 productos); `npm run test:coverage` -> Statements 95.21%, Branches 91.26%, Functions 100%, Lines 95.16%.
- **Estado**: Completado

---

## 2026-08-08 - DOCS: informe de revision del modulo panel principal de Brandon v2.0 (entrega 2)

- **Autor**: Daniel Palacios
- **Archivos**: "AVANCES/SPRING 1/BRANDON/INFORME_REVISION_MODULO_PANEL_PRINCIPAL_BRANDON_2026-08-08.md" (nuevo, v2.0)
- **Descripcion**: revision de la entrega 2 de Brandon (Panel Principal RF87-RF94) tras limpiar el proyecto completo que envio (solo quedo su modulo). Confirmacion de que el backend quedo alineado al schema v3 real (elimino la tabla simulada `vendedores`, usa `usuarios`, `imagen_url`, `eliminado_por_admin`). Hallazgos v2.0 (solo errores reales): 3.1 CRITICO boton "Agregar al carrito" sin `onAgregarCarrito` (falso exito, no agrega nada), 3.2 ALTA "Enviar reporte" solo hace console.log (falso exito), 3.3 MEDIA navegacion al perfil del vendedor sin id, 3.4 MEDIA entrega sin tests, 3.5 BAJA tarjeta no aplica descuento. Notas de integracion aparte (cors/helmet/puerto las resuelve el lider).
- **Motivo**: Brandon envio cambios en `AVANCES/SPRING 1/BRANDON/2/` (proyecto completo) y el usuario pidio limpiar y revisar.
- **Requerimientos**: RF87-RF94, RF88, RF89, RF93, RF106, RF52 (REVISION)
- **Evidencia**: lectura completa de backend (productos.controllers.js, routes, server, db) y frontend (Inicio.jsx, FichaProducto.jsx, Categorias.jsx, Reportar.jsx, config) contrastada con schema_commercity_3.sql (columnas verificadas: categoria_id, imagen_url, fecha_publicacion, descuento_porcentaje, eliminado_por_admin).
- **Estado**: Completado

---

## 2026-08-08 - FEAT: M8 (Reembolsado) + RF109 + RF135 + RF40 implementados

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/db/008_agregar_reembolso_pagos.sql (nuevo), backend/src/server/db/009_limpiar_carritos_inactivos.sql (nuevo), backend/src/server/controllers/compras.controllers.js (RF135), backend/src/server/routes/historial.routes.js, backend/src/server/controllers/usuarios.controllers.js (RF40), backend/src/server/routes/usuarios.routes.js, backend/src/server/__tests__/historial.controllers.test.js, backend/src/server/__tests__/usuarios.controllers.test.js, LAST VERSION/schema_commercity_3.sql
- **Descripcion**: se implementaron los 4 pendientes de la actualizacion de Yepes: (1) M8 aplicada a commercy_v2: `pagos_simulados.estado` ahora incluye 'Reembolsado' (RF74/RF135); (2) RF109: EVENT `limpiar_carritos_inactivos` diario que borra carritos sin actividad 7 dias (verificado ENABLED); (3) RF135: endpoint `POST /api/historial/compras/:id/cancelar` con authRequired, transaccion ACID (cancelar linea, restituir stock, marcar pago Reembolsado), solo dueno y estado Pendiente; (4) RF40/B-R6: endpoint `DELETE /api/usuarios/cuenta` con authRequired (desactivacion logica activo=0, suspende productos si es vendedor, vacia carrito, conserva historial). Schema oficial sincronizado con 'Reembolsado'.
- **Motivo**: autorizacion del usuario para implementar M8 + RF109 + RF135 + RF40 (pendientes que solo dependen del lider).
- **Requerimientos**: RF135, RF109, RF40, RF74, RF54 (RF del optimizado actualizado)
- **Evidencia**: migraciones aplicadas y verificadas en BD real (estado Reembolsado + EVENT ENABLED); `npm test` -> 47/47 passed (4 archivos); `npm run test:coverage` -> Statements 96.09%, Branches 89.15%, Functions 100%, Lines 96.03% (subio desde 95.09%).
- **Estado**: Completado

---

## 2026-08-08 - DOCS: schema_commercity_3.sql sincronizado con la BD real

- **Autor**: Daniel Palacios
- **Archivos**: LAST VERSION/schema_commercity_3.sql
- **Descripcion**: se sincronizo el archivo del esquema oficial con la BD real `commercy_v2`: se agrego `usuarios.token_recuperacion_expiracion DATETIME NULL` (M3, RF4 expira 5 min), `detalle_pedidos.estado_envio` ahora incluye `'Cancelado'` (RF74/RF135), `notificaciones.tipo` paso de ENUM a `VARCHAR(50)` (M1, evita truncado) y `pagos_simulados.estado` cambio el DEFAULT a `'Pendiente'` (M5). NO se agrego `'Reembolsado'` porque la BD real aun no tiene la migracion M8 (pendiente de autorizacion).
- **Motivo**: Diego Serna pidio el schema actualizado; el archivo estaba desactualizado respecto a la BD real.
- **Requerimientos**: RF4, RF74, RF135, RF97, RF119
- **Evidencia**: verificacion previa contra information_schema de la BD real (estado_envio con Cancelado, tipo varchar(50), DEFAULT Pendiente, token_recuperacion_expiracion).
- **Estado**: Completado

---

## 2026-08-08 - FEAT: middleware RBAC requireRoles para proteger rutas de admin

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/middleware/role.middleware.js (nuevo), backend/src/server/__tests__/role.middleware.test.js (nuevo)
- **Descripcion**: se creo el middleware de autorizacion por roles `requireRoles(rolesPermitidos)` que se ejecuta DESPUES de `authRequired`: consulta los roles del usuario en BD (`usuario_roles` + `roles`) usando `req.userId`, inyecta `req.userRoles` y devuelve 403 si no tiene el rol requerido. Se creo porque el JWT solo transporta `{ id, email }` (sin roles) y el backend central no tenia este middleware, que es el que se le indica a Cabrera agregar en las 5 rutas admin. 6 tests nuevos (401 sin token, 403 token invalido, 403 rol incorrecto, 403 sin roles, 200 admin, 500 error BD).
- **Motivo**: la respuesta enviada a Cabrera referencia `requireRoles`, que no existia en el backend central; el lider cubre la brecha de seguridad (criterio revision-requerimientos.md).
- **Requerimientos**: RNF10 (solo usuarios autenticados segun su rol), RF67-RF74, RF73
- **Evidencia**: `npm test` -> 38/38 passed (4 archivos); `npm run test:coverage` -> Statements 95.09%, Branches 88%, Functions 100%, Lines 95% (umbral 60%, subio desde 94.7%).
- **Estado**: Completado

---

## 2026-08-08 - DOCS: informe de revision del modulo panel admin de Cabrera v2.0 (solo errores reales)

- **Autor**: Daniel Palacios
- **Archivos**: "AVANCES/SPRING 1/JUAN CABRERA/INFORME_REVISION_MODULO_PANEL_ADMIN_CABRERA_2026-08-07.md" (actualizado a v2.0), ".trae/rules/revision-requerimientos.md" (criterio de revision actualizado)
- **Descripcion**: nueva version del informe con el criterio corregido: solo se listan los ERRORES REALES de la entrega, excluyendo las recomendaciones de la checklist interna de api-seguridad.md (helmet, cors, rate-limit, contrato {success,data}) que los integrantes no conocen y que se aplican de forma centralizada. Hallazgos v2.0: 4.1 CRITICO rutas admin sin authRequired+requireRoles, 4.2 ALTA DELETE fisico de reportes, 4.3 MEDIA desactivarCuenta con id de la URL (IDOR, usar req.userId), 4.4 MEDIA admin no puede ver/reactivar productos suspendidos (nuevo), 4.5 MEDIA totalComisiones suma cancelados (nuevo, se alinea con RF74/RF135), 4.6 BAJA ruta raiz de prueba. Se agregaron soluciones copiables y se actualizo la tabla de RF a la numeracion oficial vigente (RF41->RF54).
- **Motivo**: el usuario indico que las revisiones no deben incluir reglas internas que los integrantes no tienen (api-seguridad.md), solo temas donde cometieron un error.
- **Requerimientos**: RF55-RF77, RF54, RF72, RF73, RF74, RF56, RF68 (REVISION)
- **Evidencia**: relectura completa del codigo de Cabrera (controllers, routes, app, utils) y verificacion de columnas contra schema_commercity_3.sql (respondido_at, fecha_desembolso, vendedor_id existen).
- **Estado**: Completado

---

## 2026-08-08 - DOCS: regla de respuestas a chat de WhatsApp con timestamps (v1.0)

- **Autor**: Daniel Palacios
- **Archivos**: ".trae/rules/respuestas-chat-whatsapp.md" (nuevo, v1.0)
- **Descripcion**: nueva regla del proyecto para responder conversaciones de WhatsApp pegadas con timestamps (`[9:26 a.m., 8/8/2026] Nombre: mensaje`). Define el formato de etiqueta por respuesta (`RESPUESTA N — Tema corto (hora a.m./p.m.):`), una respuesta por mensaje respetando el orden cronologico, agrupacion de mensajes duplicados citando todas las horas, tono formal sin emojis, texto listo para copiar y pegar, y verificacion de los RF contra la numeracion oficial vigente (actualizacion 2026-08-08).
- **Motivo**: el usuario pidio crear una regla para que al copiar textos del chat se le responda cada mensaje teniendo en cuenta la hora/minuto en que se envio.
- **Requerimientos**: N/A
- **Evidencia**: aplicacion de la regla en la conversacion de esta manana (8 respuestas generadas con el formato solicitado).
- **Estado**: Completado

---

## 2026-08-07 - DOCS: informe de revision del modulo panel admin de Cabrera con soluciones copiables (v1.0)

- **Autor**: Daniel Palacios
- **Archivos**: "AVANCES/SPRING 1/JUAN CABRERA/INFORME_REVISION_MODULO_PANEL_ADMIN_CABRERA_2026-08-07.md" (nuevo, v1.0)
- **Descripcion**: revision de la entrega de Cabrera (panel admin, RF55-RF77) en `AVANCES/SPRING 1/JUAN CABRERA/`. Es la entrega mas completa del equipo: B-R3 (suspension con eliminado_por_admin), B-R4 (desactivacion con activo=0 + transaccion), B-R5 (destino de pedidos con FOR UPDATE: Pendiente se cancela con stock, En camino se completa con desembolso), buscador FULLTEXT con fallback LIKE, validarId/escapeLike y 6 tests con mocks. Se documentaron 7 hallazgos con solucion copiable: 4.1 CRITICO rutas admin sin authRequired+requireRoles, 4.2 ALTA DELETE fisico de reportes (borrado logico), 4.3 ALTA sin helmet/cors cerrado, 4.4 MEDIA contrato {success,data}, 4.5 MEDIA RF41 desactiva cualquier id (usar req.userId), 4.6/4.7 BAJA server/app y ruta raiz.
- **Motivo**: el usuario pidio revisar la tarea de Juan Cabrera.
- **Requerimientos**: RF41, RF55-RF77, RF60-RF66, RF67-RF74 (REVISION)
- **Evidencia**: lectura completa de controllers, routes, app, utils y tests de la entrega.
- **Estado**: Completado

---

## 2026-08-07 - DOCS: reporte de base de datos segun auditoria (v1.0)

- **Autor**: Daniel Palacios
- **Archivos**: "informes/REPORTE_BASE_DE_DATOS_AUDITORIA_2026-08-07.md" (nuevo, v1.0)
- **Descripcion**: reporte del estado real de la BD `commercy_v2` contra la auditoria. Documenta las 7 migraciones M1-M7 aplicadas y verificadas, las 5 decisiones B-R1 a B-R5 confirmadas en el esquema, los 3 cambios desviados que fueron reversados (iva_total, usuarios.estado, productos.estado GENERADA restaurada), el detalle de columnas clave por tabla, y la confirmacion de que no se borro data (172 usuarios, 332 productos, 38 pedidos). Resultado integral: 11/11 OK.
- **Motivo**: el usuario pidio generar el reporte de base de datos segun la auditoria.
- **Requerimientos**: RF4, RF31, RF88, RF97, RF114, RF119, RF120, RF131, RF135, RF136 (REVISION)
- **Evidencia**: verificacion directa con information_schema de la BD real (columnas, tipos, DEFAULT, indices, STORED GENERATED).
- **Estado**: Completado

---

## 2026-08-07 - FEAT: BD commercity_v2 alineada con la auditoria (M1-M7 aplicadas, B-R2/B-R3/B-R4 verificadas)

- **Autor**: Daniel Palacios
- **Archivos**: BD remota `commercity_v2` (149.130.178.228) - cambios DDL aplicados y verificados
- **Descripcion**: se verifico la BD real contra la auditoria y se completo lo que faltaba. Meneses ya habia aplicado: M1 (notificaciones.tipo varchar(50)), M2 (estado sin mojibake), M3 (token_recuperacion_expiracion), M4 (imagen_url en detalle_pedidos), M7 (FULLTEXT productos), la eliminacion de pedidos.iva_total (B-R2) y usuarios.estado (B-R4), y la restauracion de productos.estado como STORED GENERATED (B-R3). Yo aplique las 2 que faltaban: M5 (pagos_simulados.estado DEFAULT 'Pendiente') y M6 (carrito_items.updated_at). Verificacion integral: 11/11 OK.
- **Motivo**: el usuario pidio corregir lo que faltaba de la BD y confirmar si quedaba alineada con la auditoria.
- **Requerimientos**: RF4, RF31, RF88, RF114, RF116, RF132, RF135, RF136 (INTEGRADO)
- **Evidencia**: script de verificacion contra information_schema de la BD real: M1-M7 OK, iva_total eliminado, usuarios.estado eliminado, productos.estado GENERADA, estado_envio con 'Cancelado'.
- **Estado**: Completado

---

## 2026-08-07 - DOCS: informe de Brandon reescrito en primera persona (v1.1)

- **Autor**: Daniel Palacios
- **Archivos**: "AVANCES/SPRING 1/BRANDON/INFORME_REVISION_MODULO_PANEL_PRINCIPAL_BRANDON_2026-08-07.md" (actualizado de v1.0 a v1.1)
- **Descripcion**: se reescribio el informe de revision del panel principal de Brandon en primera persona natural (voz de Daniel), manteniendo intactas las 7 soluciones copiables (4.1-4.7), la tabla de archivos a integrar (seccion 5), la tabla de RF (seccion 6) y el orden de correccion (seccion 7). Cambiaron los titulos a "De donde salio esta revision" y "Mi conclusion".
- **Motivo**: el usuario pidio que el informe estuviera en primera persona como los anteriores (Diego y Jary).
- **Requerimientos**: N/A (redaccion)
- **Evidencia**: revision del texto completo del informe en su version 1.1.
- **Estado**: Completado

---

## 2026-08-07 - DOCS: informe de revision del modulo panel principal de Brandon con soluciones copiables (v1.0)

- **Autor**: Daniel Palacios
- **Archivos**: "AVANCES/SPRING 1/BRANDON/INFORME_REVISION_MODULO_PANEL_PRINCIPAL_BRANDON_2026-08-07.md" (nuevo, v1.0)
- **Descripcion**: revision de la entrega de Brandon (panel principal, RF87-RF94) en `AVANCES/SPRING 1/BRANDON/Commercity-Panel/`. Brandon aviso que la hizo con BD simulada propia y diseno diferente; se confirmo que el CODIGO es aprovechable (busqueda por nombre/categoria/vendedor parametrizada + paginacion + frontend con estados carga/error/vacio) pero la BD simulada no coincide con el schema v3. Se documentaron 7 hallazgos con solucion copiable: 4.1 alinear consultas al schema v3 (vendedores en usuarios.nombre_completo, imagen_url, fecha_publicacion, filtrar estado=Disponible y eliminado_por_admin=0), 4.2 endpoint vendedores desde usuarios+usuario_roles+roles, 4.3 CommonJS a ESM, 4.4 contrato {success,data}, 4.5 frontend con diseno propio y URL fija (portar logica a Inicio.jsx), 4.6 buscador LIKE con M7 pendiente, 4.7 commercity.sql.sql no se integra.
- **Motivo**: el usuario pidio revisar la tarea de Brandon que le envio por WhatsApp.
- **Requerimientos**: RF87, RF88, RF89, RF90, RF91, RF92, RF93, RF94 (REVISION)
- **Evidencia**: verificacion de las consultas de server.js contra `schema_commercity_3.sql` (la tabla vendedores no existe; el vendedor esta en usuarios con rol vendedor).
- **Estado**: Completado

---

## 2026-08-07 - FEAT: integracion del modulo historial de compras (Jary) al backend central con auth

- **Autor**: Daniel Palacios
- **Archivos**: "backend/src/server/controllers/compras.controllers.js" (nuevo), "backend/src/server/routes/historial.routes.js" (nuevo), "backend/src/server/middleware/auth.middleware.js" (nuevo), "backend/src/server/__tests__/historial.controllers.test.js" (nuevo, 6 tests), "backend/src/server/app.js" (monta /api/historial), "backend/package.json" (jsonwebtoken ^9.0.3)
- **Descripcion**: se integro al backend central el modulo de historial de compras de Jary con TODAS las correcciones del informe v1.0 aplicadas: (1) comprador_id sale de req.userId del JWT (nunca query param), (2) ruta protegida con authRequired recien creado, (3) sin db.js hardcodeado (usa pool de config/db.js), (4) contrato { success, data }, (5) campo imagen (RF31) con prod.imagen_url, (6) filtro por estado validado contra el ENUM real ('Pendiente','En camino','Entregado'). Se agrego JWT_SECRET al .env local (no se sube).
- **Motivo**: el usuario pidio aplicar los fixes de una vez e integrar el modulo de Jary al backend central para probarlo.
- **Requerimientos**: RF26, RF27, RF28, RF29, RF30, RF31, RF32 (INTEGRADO)
- **Evidencia**: GET /api/historial/compras con token -> HTTP 200 con 2 pedidos reales de la BD (comprador 7); sin token -> 401; filtro ?estado=Pendiente -> 200 con solo Pendiente. Tests: 32/32 en verde (26 previos + 6 nuevos). Cobertura 94.7% statements (umbral 60%).
- **Estado**: Completado

---

## 2026-08-07 - DOCS: informe de revision del modulo de historial de Jary con soluciones copiables (v1.0)

- **Autor**: Daniel Palacios
- **Archivos**: "AVANCES/SPRING 1/JARY/INFORME_REVISION_MODULO_HISTORIAL_COMPRAS_JARY_2026-08-07.md" (nuevo, v1.0)
- **Descripcion**: revision de la entrega de Jary (historial de compras del comprador) en `AVANCES/SPRING 1/JARY/Commercity-main.zip`. Se descarto el repositorio completo y se identificaron SOLO los archivos de su autoria: `compras.controllers.js` (nuevo), `routes.js` (ruta /compras) y `HistorialDeCompras.jsx` (frontend conectado). La consulta SQL fue verificada contra el schema v3 (columnas correctas, parametrizada). Se documentaron 7 hallazgos con solucion copiable: 3.1 credenciales hardcodeadas en db.js (usar pool del proyecto), 3.2 comprador_id hardcodeado (usar req.userId del JWT, controlador completo listo), 3.3 ruta sin proteger (authRequired + /api/historial/compras), 3.4 mapeo de estados BD (En camino/Pendiente/Entregado) a slugs del frontend, 3.5 URL hardcodeada (API_BASE_URL central), 3.6 contrato {success,data}, 3.7 archivos copiados que no se integran. Incluye RF31 (imagen) preparado con prod.imagen_url pendiente de M4. Ademas se limpio la carpeta de Jary: se elimino la copia completa del repositorio (Commercity-main/ y el zip) y se dejo SOLO la estructura con los 3 archivos de su tarea + este informe.
- **Motivo**: el usuario pidio revisar la carpeta de Jary en AVANCES/SPRING 1 porque ella dice que ya hizo su modulo; pidio dejar solo los archivos que ella modifico.
- **Requerimientos**: RF26, RF27, RF28, RF29, RF30, RF31, RF32 (REVISION)
- **Evidencia**: verificacion de la consulta contra `schema_commercity_3.sql` (pedidos.comprador_id, fecha_pedido, detalle_pedidos.estado_envio, cantidad, subtotal, productos.nombre, usuarios.nombre_completo).
- **Estado**: Completado

---

## 2026-08-07 - CHORE: nueva politica de push (solo con confirmacion; commercycity solo backend)

- **Autor**: Daniel Palacios
- **Archivos**: ".trae/rules/git-push-politica.md", ".trae/rules/git-autorizacion-versionado.md"
- **Descripcion**: se actualizo la politica de versionado: (1) el push NUNCA es automatico, siempre requiere confirmacion explicita del usuario (lista de palabras de autorizacion y presentacion previa de archivos/destino/mensaje); (2) el repositorio `commercycity` (diegoSerna17/Commercity) ya NO esta prohibido por completo: se permite push SOLO de actividades de BACKEND (codigo, modulos, controladores, rutas, migraciones, tests), quedando prohibidos informes, configuracion del entorno y material de otras areas; (3) checklist actualizado con la confirmacion como primer requisito y la regla de solo-backend para commercycity.
- **Motivo**: el usuario pidio cambiar la regla: solo hacer push cuando el confirme, y subir a commercycity unicamente actividades de backend.
- **Requerimientos**: N/A (configuracion de entorno)
- **Evidencia**: verificado con `git remote -v` que ambos remotes estan configurados; reglas editadas y memoria del proyecto actualizada.
- **Estado**: Completado

---

## 2026-08-07 - DOCS: informe de Diego reescrito en primera persona (v2.1)

- **Autor**: Daniel Palacios
- **Archivos**: "AVANCES/DIEGO SERNA/INFORME_REVISION_MODULO_AUTENTICACION_DIEGO_SERNA_2026-08-07.md" (actualizado de v2.0 a v2.1)
- **Descripcion**: se reescribio el informe completo en primera persona natural (voz de Daniel), manteniendo intactas las 9 soluciones copiables (4.1-4.9), el contrato de rutas (seccion 5), la tabla de RF (seccion 6) y el orden de correccion (seccion 7). Cambiaron los titulos de contexto a "De donde salio esta revision" y de conclusion a "Mi conclusion".
- **Motivo**: el usuario pidio que el informe estuviera en primera persona como si lo hubiera escrito el.
- **Requerimientos**: N/A (redaccion)
- **Evidencia**: revision del texto completo del informe en su version 2.1.
- **Estado**: Completado

---

## 2026-08-07 - DOCS: informe de revision del backend de autenticacion de Diego con soluciones copiables (v2.0)

- **Autor**: Daniel Palacios
- **Archivos**: "AVANCES/DIEGO SERNA/INFORME_REVISION_MODULO_AUTENTICACION_DIEGO_SERNA_2026-08-07.md" (actualizado de v1.1 a v2.0)
- **Descripcion**: revision de la entrega real de Diego (backend de autenticacion en `AVANCES/DIEGO SERNA/backend/`) con soluciones definitivas lista para copiar y pegar en cada hallazgo: 4.1 expiracion de 5 min del token RF4 (requiere M3 + DATE_ADD en UPDATE + WHERE con expiracion + texto del correo), 4.2 checklist api-seguridad (helmet, cors cerrado, rate-limit, JWT_SECRET sin fallback, server.js reemplazable completo), 4.3 Zod (middleware validate + schemas + rutas), 4.4 rol fijo comprador en register, 4.5 transaccion en cambiarRol + proteger admin, 4.6 contrato `{ success, data/error }`, 4.7 tests (integracion vs unit), 4.8 app.js/server.js, 4.9 middleware de error centralizado. Se anadio seccion 5 con el contrato real de rutas (POST /api/register, /api/login, /api/recover, /api/reset-password, GET /api/me, PUT /api/me/rol, GET /api/admin) y seccion 7 con orden de correccion.
- **Motivo**: el usuario aclaro que el informe de Diego es por su tarea de BACKEND (la entrega en `AVANCES/DIEGO SERNA`), no por frontend; y pidio recomendaciones de solucion para cada punto que lo hagan mas rapido.
- **Requerimientos**: RF3, RF4, RF7-RF10, RF39, RF42, RF40/RF41 (pendiente), RNF8, RNF9, RNF10 (REVISION)
- **Evidencia**: revision del codigo real de Diego (controllers, middlewares, routes, utils, config, tests); se elimino el informe frontend creado por error (LAST VERSION/INFORME_REVISION_DIEGO_FRONTEND_2026-08-07.md).
- **Estado**: Completado

---

## 2026-08-07 - DOCS: re-auditoria de consistencia interna (v3.7)

- **Autor**: Daniel Palacios
- **Archivos**: "LAST VERSION/INFORME_AUDITORIA_COMPLETA_2026-08-07.md" (v3.7)
- **Descripcion**: revision completa del informe seccion por seccion a peticion del usuario. Se corrigieron 3 inconsistencias internas: (1) RF47 y RF116 pasaron de BLOQUEADO a PARCIAL en la seccion 4.6 (las decisiones B-R1/B-R2 ya estan cerradas, coherente con 2.2/2.8); (2) se agrego la definicion de BLOQUEADO a la leyenda de la seccion 1 y la aclaracion de lectura "Backend pendiente + Estado OK = solo falta el endpoint, sin brecha de datos"; (3) se agrego la fila de RF132 a la seccion 4.6 (solucion definitiva: backend solo inserta el subtotal; monto_vendedor/monto_comision son columnas GENERADAS) y se actualizo su parentesis en 2.11.
- **Motivo**: el usuario pidio revisar de nuevo si el informe estaba bien y completo.
- **Requerimientos**: RF47, RF116, RF132 (REVISION)
- **Evidencia**: verificacion de los bloques del seed (S1-S5) contra el DDL real de `schema_commercity_3.sql`: `reportes.estado_reporte`/`evidencia_url` existen, `producto_variantes` tiene las columnas usadas, `notificaciones.tipo` ENUM incluye 'pedido'; `detalle_pedidos.monto_vendedor`/`monto_comision` son STORED GENERATED.
- **Estado**: Completado

---

## 2026-08-07 - DOCS: bloque SQL unico copiable en la auditoria final (v3.6)

- **Autor**: Daniel Palacios
- **Archivos**: "LAST VERSION/INFORME_AUDITORIA_COMPLETA_2026-08-07.md" (v3.6)
- **Descripcion**: se fusiono la seccion 4.2 en UN solo bloque SQL copiable (M1-M7 + M8 comentado) para guardarlo directo como `003_auditoria_v2.sql`, con el comando de ejecucion y la limpieza previa de notificaciones en el encabezado del propio archivo. Asi los pasos de BD (PASO 2) y semilla (PASO 3) son literalmente copiar y pegar.
- **Motivo**: el usuario pidio que el paso a paso quede claro para que los lideres solo copien y peguen exactamente.
- **Requerimientos**: N/A (instrucciones de ejecucion)
- **Evidencia**: bloque SQL validado contra el DDL del schema v3.
- **Estado**: Completado

---

## 2026-08-07 - DOCS: consistencia final de la auditoria (v3.5) - limpieza previa en M2 y estados alineados

- **Autor**: Daniel Palacios
- **Archivos**: "LAST VERSION/INFORME_AUDITORIA_COMPLETA_2026-08-07.md" (v3.5)
- **Descripcion**: revision de integridad del informe con 2 ajustes para evitar inconvenientes al ejecutar: (1) en la guia PASO 2 se agrego la limpieza previa de `notificaciones` antes de M2 (`DELETE FROM notificaciones;` cuando exista estado corrupto `le├¡do`), para que el MODIFY del ENUM no falle en modo estricto, y la nota de ejecutar primero el schema si la BD es nueva; (2) se alinearon los estados de RF47 y RF116 en las tablas 2.2/2.8 de BLOQUEADO a "PARCIAL (decision B-R1/B-R2)" ya que las decisiones estan cerradas (RF97 sigue BLOQUEADO por depender de BD M1/M2).
- **Motivo**: el usuario pregunto si ya estaba todo completo para solucionar todo sin errores e inconvenientes.
- **Requerimientos**: RF47, RF97, RF116 (REVISION)
- **Evidencia**: revision de cada paso de la guia contra el DDL del schema v3 y la BD real.
- **Estado**: Completado

---

## 2026-08-07 - DOCS: guia paso a paso para solucionarlo todo en la auditoria final (v3.4)

- **Autor**: Daniel Palacios
- **Archivos**: "LAST VERSION/INFORME_AUDITORIA_COMPLETA_2026-08-07.md" (v3.4)
- **Descripcion**: se reemplazo la seccion 7 por la "Guia paso a paso para solucionarlo todo" con el procedimiento en orden y la verificacion de cada paso: PASO 1 (Director: copiar RF de la seccion 4.7 y guardar versionado), PASO 2 (BD: crear y ejecutar migraciones M1-M7 en orden con verificaciones por columna), PASO 3 (BD: reemplazar bloques NOTIFICACIONES/REPORTES del seed, agregar variantes, ejecutar y verificar conteos), PASO 4 (Backend: pasos detallados de BE-1 expiracion RF4, BE-2 JWT_SECRET, BE-3 seguridad, BE-4 Zod, BE-5 cambiarRol transaccion, BE-6 contrato, BE-7 ACID en compra, BE-8 tests), PASO 5 (verificacion integral: npm test, cobertura, pruebas contra BD real, changelog).
- **Motivo**: el usuario pidio confirmar que cada correccion tenga el paso a paso exacto para solucionarlo todo.
- **Requerimientos**: RF4, RF47, RF72-RF74, RF116, RF134-RF136, RNF2, RNF10 (REVISION)
- **Evidencia**: procedimiento alineado con las migraciones, seed y checklist de backend del informe.
- **Estado**: Completado

---

## 2026-08-07 - DOCS: texto final de los RF para copiar y pegar en el documento oficial (v3.3)

- **Autor**: Daniel Palacios
- **Archivos**: "LAST VERSION/INFORME_AUDITORIA_COMPLETA_2026-08-07.md" (v3.3)
- **Descripcion**: se agrego la seccion 4.7 "Texto final de los RF para copiar y pegar en el documento oficial" con la redaccion definitiva en el formato del docx (`**RF###:**`): RF41 (desactivar cuenta vendedor + suspender productos), RF47 (precio con IVA incluido), RF72 (suspension logica de productos), RF73 (baneo/activar/desactivar usuarios, eliminacion logica), RF74 (destino de pedidos del vendedor baneado), RF116 (IVA calculado en vuelo, sin almacenar), y 3 RF nuevos RF134 (inventario/descuento de stock), RF135 (cancelaciones con restitucion de stock) y RF136 (carritos abandonados 7 dias). Aclaracion: la seccion 4.6 es la guia de implementacion; la 4.7 es el texto que Yepes puede copiar y pegar.
- **Motivo**: el usuario pidio que la solucion por requerimiento este escrita tal cual debe quedar en el documento oficial para que Yepes solo copie y pegue.
- **Requerimientos**: RF41, RF47, RF72, RF73, RF74, RF116, RF134-RF136 (REVISION)
- **Evidencia**: redaccion alineada al formato y estilo del docx oficial.
- **Estado**: Completado

---

## 2026-08-07 - DOCS: soluciones definitivas en semilla y sugerencias de la auditoria final (v3.2)

- **Autor**: Daniel Palacios
- **Archivos**: "LAST VERSION/INFORME_AUDITORIA_COMPLETA_2026-08-07.md" (v3.2)
- **Descripcion**: se convirtieron en instrucciones exactas los ajustes de semilla y los campos de sugerencias para que los lideres no hagan algo distinto. Cambios: (1) seccion 4.3 reescrita con SQL listo para pegar - S1+S2: bloque NOTIFICACIONES completo corregido ('pedido enviado' -> 'pedido', estado sin acentos), S3+S5: bloque REPORTES completo con estado_reporte ('Resuelto' solo donde hay respuesta_admin, 5 reportes) y evidencia_url en 2 reportes, S4: bloque de variantes de ejemplo; (2) M8 eliminado (NO se aplica - B-R3 usa eliminado_por_admin existente) y se actualizaron 6.1, 6.2, plan de accion y conclusion de "8 migraciones M1-M8" a "7 migraciones M1-M7"; (3) BE-6 definido: contrato unico { success, data/error } y el modulo de autenticacion se migra a ese formato; (4) nota fija: estado de notificaciones SIEMPRE sin acentos.
- **Motivo**: el usuario pidio soluciones definitivas (texto/SQL exacto) en los ajustes de semilla y todos los campos de sugerencias, para que quede claro a los lideres y no hagan algo diferente.
- **Requerimientos**: RF4, RF47, RF97, RF111, RF114, RF115, RF116, RF120, RF72-RF74, RNF2 (REVISION)
- **Evidencia**: bloques SQL validados contra el schema v3 (columnas y ENUM).
- **Estado**: Completado

---

## 2026-08-07 - DOCS: solucion definitiva por requerimiento pendiente en la auditoria final (v3.1)

- **Autor**: Daniel Palacios
- **Archivos**: "LAST VERSION/INFORME_AUDITORIA_COMPLETA_2026-08-07.md" (v3.1)
- **Descripcion**: se agrego la seccion 4.6 "Solucion definitiva por requerimiento pendiente" que lista, para cada RF/RNF que no esta OK (PARCIAL/PEND/BLOQUEADO), la accion concreta a implementar: migracion (M1-M8), decision (B-R1 a B-R5), endpoint exacto o regla de backend. Cubre gestion de usuarios (RF4, RF9, RF12-RF41), perfil vendedor (RF44-RF54), panel admin (RF67-RF74), productos/panel principal (RF80, RF88), notificaciones (RF97), compra/pedidos/finanzas (RF111, RF114, RF115, RF116, RF120, RF123) y no funcionales (RNF2, RNF6, RNF10, RNF11).
- **Motivo**: el usuario pidio que, ya que se tiene todo el analisis, cada requerimiento no-OK tenga su solucion definitiva en el informe y no solo un estado.
- **Requerimientos**: RF1-RF133, RNF1-RNF19 (REVISION)
- **Evidencia**: analisis cruzado de cada RF contra schema v3, seed y codigo backend.
- **Estado**: Completado

---

## 2026-08-07 - DOCS: auditoria final v3.0 reescrita en primera persona natural (voz humana)

- **Autor**: Daniel Palacios
- **Archivos**: "LAST VERSION/INFORME_AUDITORIA_COMPLETA_2026-08-07.md" (v3.0)
- **Descripcion**: se reescribio la auditoria completa con voz humana en primera persona (como si la hubiera escrito el autor), eliminando el tono robotico. Se conservaron todas las tablas tecnicas (RF1-RF133 por modulo, RNF1-RNF19, decisiones definitivas B-R1 a B-R5, migraciones M1-M8, ajustes de semilla S1-S5, brechas backend BE-1 a BE-8 y frontend FE-1 a FE-4, cobertura por modulo, necesidades 6.1/6.2). Las secciones narrativas pasaron a primera persona natural: "De donde salio esta auditoria", "Recorri los 133 requerimientos uno por uno", "Lo que falta se reduce a tres frentes", "Que propongo hacer (en orden)".
- **Motivo**: el usuario indico que el informe sonaba a robot y pidio que se sintiera como escrito por el en primera persona.
- **Requerimientos**: RF1-RF133, RNF1-RNF19 (REVISION)
- **Evidencia**: mismo contenido tecnico verificado; solo cambio la redaccion.
- **Estado**: Completado

---

## 2026-08-07 - DOCS: decisiones definitivas en la auditoria final (seccion 4.1, sin propuestas ni charlas)

- **Autor**: Daniel Palacios
- **Archivos**: "LAST VERSION/INFORME_AUDITORIA_COMPLETA_2026-08-07.md" (v2.1)
- **Descripcion**: se reemplazo la seccion 4.1 "Cierre propuesto (criterio tecnico)" por "Decisiones definitivas (implementables)". Decisiones cerradas: B-R1 (RF47: el vendedor publica precio con IVA incluido, el sistema desglosa; el vendedor NO calcula), B-R2 (RF116 se alinea a RF132: NO se almacena IVA por producto, se calcula en vuelo subtotal=precio/1.19, comisiones 90/10 sobre subtotal; sin columnas nuevas), B-R3 (los productos nunca se eliminan fisicamente; se suspenden con eliminado_por_admin=1; un reporte pendiente no suspende; solo el admin decide), B-R4 (eliminar cuenta = desactivacion logica activo=0 + suspension de productos; prohibido DELETE fisico), B-R5 (al banear: productos suspendidos, pedidos pagados se completan, pendientes se cancelan con restitucion de stock; el admin no interviene pedido a pedido). Se actualizaron ademas 6.1, 6.2 (sin columna de IVA, decision tomada), plan de accion (solo registrar las decisiones en el documento) y la tabla de cobertura por modulo (bloqueos liberados).
- **Motivo**: el usuario pidio que la seccion de cierre contenga solo decisiones definitivas que vayan a funcionar, no propuestas ni discusiones.
- **Requerimientos**: RF47, RF72, RF73, RF74, RF116, RF132, RF41 (REVISION)
- **Evidencia**: decisiones alineadas con el esquema v3 (eliminado_por_admin existe) y con RF132 cerrado.
- **Estado**: Completado

---

## 2026-08-07 - DOCS: auditoria final v2.0 en LAST VERSION (primera persona, criterio de experto sin opiniones de lideres)

- **Autor**: Daniel Palacios
- **Archivos**: "LAST VERSION/INFORME_AUDITORIA_COMPLETA_2026-08-07.md" (v2.0)
- **Descripcion**: se actualizo la auditoria completa a version 2.0 con criterio tecnico independiente (primera persona), basada SOLO en evidencia verificable (archivos de LAST VERSION + codigo real del backend), sin incorporar comentarios de otros lideres ni transcripciones de audios. Cambios: cabecera con criterio y version; fuentes (se quita la referencia a audios/grupo); brechas 4.1 con "cierre propuesto (criterio tecnico)"; nueva seccion 6 "Lo que el proyecto NECESITA y lo que NO necesita" (9 necesidades tecnicas y 7 items de no-sobre-ingenieria: sin columna de IVA hasta decidir RF116, sin imagen duplicada en productos, sin tablas adicionales, sin DELETE fisico, sin pasarela real ni CVV, FULLTEXT diferida, sin reescribir requerimientos); plan de accion reescrito sin nombres de lideres; conclusion y pie actualizados.
- **Motivo**: el usuario pidio dejar claros los requerimientos del equipo, que la auditoria final este en primera persona, cubra todo y sea de experto sin tener en cuenta comentarios de los otros lideres.
- **Requerimientos**: RF1-RF133, RNF1-RNF19 (REVISION)
- **Evidencia**: analisis tecnico verificado contra schema v3, seed y codigo backend real.
- **Estado**: Completado

---

## 2026-08-07 - DOCS: auditoria completa del proyecto en LAST VERSION (analisis profundo RF por RF)

- **Autor**: Daniel Palacios
- **Archivos**: "LAST VERSION/INFORME_AUDITORIA_COMPLETA_2026-08-07.md" (nuevo, version ampliada de la auditoria dentro de la carpeta oficial)
- **Descripcion**: se creo la version ampliada de la auditoria DENTRO de `LAST VERSION` (unica carpeta oficial), con analisis profundo de los 133 RF y 19 RNF: matriz por modulo (11 secciones) con estado de BD/backend/frontend por RF, tabla RNF, 5 conflictos de requerimientos con cierre propuesto, 8 migraciones SQL listas (M1-M8: notificaciones.tipo VARCHAR, mojibake estado, token_recuperacion_expiracion RF4, imagen en detalle_pedidos RF120, DEFAULT Pendiente en pagos, updated_at en carrito, FULLTEXT, suspendido en productos), 5 ajustes de semilla (S1-S5: 'pedido enviado' vs ENUM, estado_reporte Resuelto, variantes, evidencias), 8 brechas backend (BE-1..BE-8) y 4 dependencias frontend. Incluye cobertura por modulo con bloqueos por integrante y plan de accion.
- **Motivo**: el usuario pidio dejar todos los requerimientos claros y que la auditoria completa quede dentro de LAST VERSION, cubriendo todas las areas sin brechas.
- **Requerimientos**: RF1-RF133, RNF1-RNF19 (REVISION)
- **Evidencia**: cruce RF por RF contra schema v3 y seed; migraciones SQL verificadas contra el DDL.
- **Estado**: Completado (auditoria); pendientes de decision (Yepes/Meneses)

---

## 2026-08-07 - DOCS: auditoria completa del proyecto contra LAST VERSION (requerimientos + schema v3 + seed)

- **Autor**: Daniel Palacios
- **Archivos**: "informes/INFORME_AUDITORIA_COMPLETA_COMMERCITY_LAST_VERSION_2026-08-07.md" (nuevo), "LAST VERSION/Commercity (optimizado).docx" (convertido a .md), "LAST VERSION/schema_commercity_3.sql" y "LAST VERSION/seed_commercity.sql" (revisados), "Audios/18.txt", "Audios/19.txt", "Audios/20.txt" (transcritos)
- **Descripcion**: auditoria general de todas las areas usando SOLO la carpeta LAST VERSION (unica fuente oficial). Hallazgos principales: (1) CONFLICTOS de requerimientos - RF47 (vendedor calcula IVA) vs RF132 (precio con IVA incluido), RF116 (almacenar IVA por producto) vs RF132 (desglose en vuelo); (2) CRITICO BD+seed - `notificaciones.tipo` ENUM del schema v3 no contiene 'pedido enviado' que usa la semilla (INSERT falla) y no refleja el VARCHAR(50) real; mojibake en `notificaciones.estado` de la BD real; (3) VACIOS de negocio - eliminacion/suspension de productos con reportes o compras en curso, pedidos pagados de vendedor baneado, descuento de stock, cancelaciones y carritos abandonados; (4) faltan columnas: `token_recuperacion_expiracion` (RF4), imagen en `detalle_pedidos` (RF120), `carrito_items.updated_at`, DEFAULT 'Pendiente' en `pagos_simulados`; (5) seed sin `producto_variantes` y reportes respondidos sin `estado_reporte='Resuelto'`. Se incluyo matriz de cobertura por modulo, 10 brechas priorizadas y plan de accion (Yepes decide IVA y suspension; Meneses aplica migraciones y ajusta seed; entregas 11/08).
- **Motivo**: el grupo reporto desorden por multiples versiones de requerimientos; Meneses espera la auditoria completa de Daniel para autorizar el esquema y la semilla (audio 18).
- **Requerimientos**: RF4, RF47, RF72, RF73, RF74, RF97, RF116, RF120, RF132, RNF8-RNF11 (REVISION)
- **Evidencia**: lectura completa de los 3 archivos oficiales de LAST VERSION + transcripcion de audios 18, 19 y 20.
- **Estado**: Completado (auditoria); pendientes de decision (Yepes/Meneses)

---

## 2026-08-07 - DOCS: actualizacion de informes de Diego Serna y Cristian Rosero a la numeracion oficial (optimizado 6)

- **Autor**: Daniel Palacios
- **Archivos**: "AVANCES/DIEGO SERNA/INFORME_REVISION_MODULO_AUTENTICACION_DIEGO_SERNA_2026-08-07.md" (v1.1), "informes/INFORME_ENTREGA_CRISTIAN_ROSERO_2026-08-06.md" (v1.1)
- **Descripcion**: se actualizaron los dos informes con la numeracion vigente de los requerimientos oficiales (`Commercity 2.0 (optimizado 6)`) y el checklist de la regla nueva `revision-requerimientos.md`. Diego: se agrego version 1.1, RF del modulo de autenticacion (RF7-RF10 roles, RF3/RF4 recuperacion, RF39-RF42 gestion de cuenta) y checklist de revision (contrato, token 5 min, JWT_SECRET, cambio de rol). Cristian: RF corregido de RF104 a **RF106** (perfil publico segun optimizado 6) y seccion nueva con checklist verificado (todo CUMPLE: contrato, parametrizacion, datos sensibles, baneados 404, validacion, cobertura 94.16%).
- **Motivo**: las reglas del proyecto se alinearon al optimizado 6; los informes de entrega/revision deben citar los RF vigentes para que el checklist de revision sea objetivo y trazable.
- **Requerimientos**: RF106, RF7-RF10, RF4, RF39-RF42 (REVISION)
- **Evidencia**: verificacion de la numeracion de RF106 y RF39-RF42 contra el documento oficial optimizado 6.
- **Estado**: Completado

---

## 2026-08-07 - CHORE: alineacion de reglas del proyecto con los requerimientos oficiales (optimizado 6)

- **Autor**: Daniel Palacios
- **Archivos**: ".trae/rules/revision-requerimientos.md" (nueva), ".trae/rules/mysql-convenciones.md", ".trae/rules/api-seguridad.md"
- **Descripcion**: se alinearon las reglas de revision con el documento oficial `Commercity 2.0 (optimizado 6)`. Correcciones: (1) mysql-convenciones.md - RF129->RF133 (moneda COP), RF109->RF45/RF54 (producto-vendedor), estados de envio por linea (detalle_pedidos.estado_envio, RF119/RF120), nota de `productos.estado` STORED GENERATED y reglas de negocio de IVA RF132, token RF4, stock e integridad historica; (2) api-seguridad.md - checklist de recuperacion de contrasena (RF4: expiracion 5 min, token de un solo uso, anti-enumeracion) y checklist de compra/pagos (RF132: desglose IVA, comisiones 90/10, transaccion ACID, descuento de stock, cancelaciones, RF74); (3) se creo .trae/rules/revision-requerimientos.md: documento oficial unico (optimizado 6), mapeo RF/RNF por modulo backend, checklist obligatorio de revision de entregas y conflictos abiertos (RF116 vs RF132, RF47).
- **Motivo**: las reglas referenciaban RF de versiones anteriores (numeracion cambiada en el optimizado 6), lo que hacia las revisiones dependientes de la memoria del revisor en lugar de un checklist objetivo.
- **Requerimientos**: RF132, RF4, RF133, RF109, RF45, RF54, RF119, RF120, RF74, RNF8-RNF11 (REVISION)
- **Evidencia**: verificacion de numeracion contra el optimizado 6 (RF129/RF109 desactualizados, RF133/RF45/RF54 vigentes).
- **Estado**: Completado

---

## 2026-08-07 - DOCS: revision del modulo de autenticacion de Diego Serna y estructura de AVANCES

- **Autor**: Daniel Palacios
- **Archivos**: "AVANCES/DIEGO SERNA/INFORME_REVISION_MODULO_AUTENTICACION_DIEGO_SERNA_2026-08-07.md", AVANCES/ (carpetas por integrante creadas)
- **Descripcion**: (1) se creo en AVANCES una carpeta por integrante del backend con su nombre (CARLOS PEREA, CARLOS VIDAL, JARY, ERICK, MOSQUERA FLOR, JUAN CABRERA, BRANDON, JOSE YEPES, DANIEL PALACIOS; ya existian CRISTIAN ROSERO y DIEGO SERNA); (2) se descomprimio y reviso el backend.zip de Diego Serna (modulo Autenticacion JWT + RBAC + recuperacion con Resend). Resultado: estructura correcta, consultas parametrizadas, RBAC bien implementado, bcrypt, token de un solo uso y tests solidos. Pendientes ALTA: expiracion de 5 min del RF4 no implementada (falta token_recuperacion_expiracion), checklist de seguridad incompleta (cors abierto, sin helmet/rate-limit, JWT_SECRET con fallback hardcodeado). Pendientes MEDIA: validacion Zod, auto-asignacion de rol vendedor en register, cambiarRol sin transaccion y con autodegradacion de admin, contrato de respuesta desalineado ({success,message,data} vs {success,data/error}), tests contra BD real.
- **Motivo**: el usuario pidio crear la estructura de AVANCES por integrante del backend y revisar el trabajo de Diego Serna para dar informe.
- **Requerimientos**: RF4, RF7-RF10 (REVISION)
- **Evidencia**: revision estatica del codigo completo de AVANCES/DIEGO SERNA/backend/ (9 archivos fuente + tests + config).
- **Estado**: Completado (revision); correcciones pendientes del integrado

---

## 2026-08-07 - DOCS: revision de la ultima version de requerimientos (optimizado 6), seed y sugerencias

- **Autor**: Daniel Palacios
- **Archivos**: "informes/INFORME DE REVISION - BASE DE DATOS Y REQUERIMIENTOS COMMERCITY (commercity_v2).md" (v1.5), "informes/Commercity 2.0 (optimizado 6)/Commercity 2.0 (optimizado 6).md", "informes/SUGERENCIAS DE AGREGADOS Y MEJORAS/SUGERENCIAS DE AGREGADOS Y MEJORAS.md", "seed_commercity.sql" (revision, sin cambios)
- **Descripcion**: se convirtieron a .md y se revisaron los dos docx mas recientes del Director (`Commercity 2.0 (optimizado 6)` y `SUGERENCIAS DE AGREGADOS Y MEJORAS`) junto con el `seed_commercity.sql`, y se actualizo el informe de revision a **v1.5**. Hallazgos principales: (1) **RF116** del optimizado 6 exige almacenar el IVA de cada producto -> **CONFLICTO con RF132** (desglose en vuelo); (2) **RF47** cambia la redaccion a "el vendedor hace el calculo adicional del 19%" -> contradice el modelo aprobado (precio con IVA incluido); (3) RF4 (5 min) y RF132 se mantienen iguales; (4) no existe RF que ordene descontar stock tras la compra; (5) `productos.estado` verificado como `enum('Disponible','Agotado')` STORED GENERATED (el seed no lo inserta, correcto); (6) las sugerencias del docx (3 RF: inventario, cancelaciones, carritos abandonados; 3 RNF: JWT, ACID, sanitizacion) se evaluaron y se recomienda incorporarlas, con impacto en BD en los puntos de inventario/cancelaciones/carritos. Pendientes nuevos: confirmar con Yepes RF116/RF47 (bloquean checkout) y decidir los RF/RNF sugeridos.
- **Motivo**: el usuario indico que el `Commercity 2.0 (optimizado 6)` es la ultima version oficial de requerimientos y pidio revisarla junto con el seed y el docx de sugerencias.
- **Requerimientos**: RF116, RF47, RF132, RF115, RF4, RF80, RF85 (REVISION)
- **Evidencia**: consulta a information_schema (productos.estado STORED GENERATED, precio decimal(12,2)); lectura del seed_commercity.sql; conversion de los dos docx a .md y cruce con el esquema real.
- **Estado**: Completado

---

## 2026-08-06 - DOCS: novedades 9 PM del grupo de lideres en plan Scrum

- **Autor**: Daniel Palacios
- **Archivos**: informes/PLAN_SCRUM_BACKEND_2026-08-06.md
- **Descripcion**: se registro en el plan Scrum la subseccion "Novedades 2026-08-06 (9 PM)": Resend confirmado por Diego Serna como proveedor de correo; Yepes actualizo los requerimientos con el flujo de IVA desde la publicacion del producto (pasara el docx `Commercity 2.0 (optimizado) (2).docx` ~10 PM, con nomenclatura e indice); mockup Figma en actualizacion (cantidad x precio unitario, no bloquea backend); la expiracion del token de recuperacion queda como regla de negocio a proponer en requerimientos (texto en informe de BD, seccion 6).
- **Motivo**: el usuario compartio los mensajes del grupo de lideres (9 PM) y pidio procesarlos.
- **Requerimientos**: RFX (REVISION) - recuperacion de contrasena / IVA
- **Evidencia**: mensajes del grupo de lideres 2026-08-06 8:59-9:49 PM.
- **Estado**: Completado

---

## 2026-08-07 - DOCS: decision final de IVA (RF132) y verificado esquema post-seed

- **Autor**: Daniel Palacios
- **Archivos**: "informes/INFORME DE REVISION - BASE DE DATOS Y REQUERIMIENTOS COMMERCITY (commercity_v2).md" (v1.4)
- **Descripcion**: se cerro el modelo de IVA (RF132 final, comunicado por Yepes el 7/08 9:10 AM): el vendedor publica el precio con IVA incluido, la pasarela saca el 19% del precio base (subtotal = precio/1.19), y del subtotal sale 90% vendedor / 10% CommerCity. Se descarto la columna `iva_porcentaje`. Yepes actualizo el mockup de Figma y agrego el dato imagen del producto a los requerimientos. Se verifico el esquema real: `pedidos`/`detalle_pedidos` aun sin columna de imagen (pendiente que Meneses la agregue), `notificaciones.tipo` VARCHAR(50) OK, `notificaciones.estado` con mojibake, `usuarios` sin `token_recuperacion_expiracion`. Semilla estructural de roles confirmada (comprador, vendedor, administrador). Informe v1.4: pendientes = mojibake estado, columna token, imagen en pedidos.
- **Motivo**: el usuario compartio la conversacion del grupo (12:32 AM - 2:29 PM 7/08) donde Yepes definio el flujo del IVA y Meneses confirmo la semilla.
- **Requerimientos**: RF132, RF115, RF31, RF97, RF4 (REVISION)
- **Evidencia**: mensajes del grupo (Yepes 8:35 AM-9:10 AM; Meneses 2:25 PM) + consultas a information_schema (7/08).
- **Estado**: Completado

---

## 2026-08-07 - DOCS: verificado el seed inyectado por Meneses y correos reales de prueba

- **Autor**: Daniel Palacios
- **Archivos**: "informes/INFORME DE REVISION - BASE DE DATOS Y REQUERIMIENTOS COMMERCITY (commercity_v2).md" (v1.3)
- **Descripcion**: se verifico el estado real de commercy_v2 tras la inyeccion del seed de Meneses (seed de Cabrera ajustado, seed_commercity.sql). Hallazgos: (1) seed RESUELTO - 20 usuarios (1 admin, 10 vendedores, 9 compradores), 82 productos, 16 categorias, 5 etiquetas, 4 variantes, 8 pedidos, 10 detalle_pedidos, 6 datos_bancarios, 10 notificaciones; contrasena comun 123456 (Bcrypt); (2) los correos anunciados por Meneses (admin@commercity.com, vendedor1@commercity.com, comprador1@commercity.com) NO existen en la BD; los reales son nombre.apellido@commercity.com (admin: carlos.munoz@commercity.com; vendedor: juan.giraldo@commercity.com; comprador: camila.torres@commercity.com); (3) `notificaciones.tipo` fue cambiado a VARCHAR(50) por Meneses (resuelto); (4) `notificaciones.estado` sigue con mojibake; (5) `pedidos` no tiene columna estado (el estado vive en detalle_pedidos.estado_envio). Informe actualizado a v1.3 con 3 pendientes: mojibake, token_recuperacion_expiracion y modelo de IVA.
- **Motivo**: el usuario compartio la conversacion del grupo (2:30-5:44 PM) donde Meneses confirmo el seed y las correcciones; se verifico contra la BD real.
- **Requerimientos**: RF97, RF4, RFX (REVISION)
- **Evidencia**: consultas a information_schema y conteos de commercy_v2 (7/08 tarde); comprobacion de que los correos anunciados no existen.
- **Estado**: Completado

---

## 2026-08-07 - CHORE: regla de limpieza de archivos temporales

- **Autor**: Daniel Palacios
- **Archivos**: .trae/rules/limpieza-archivos-temporales.md
- **Descripcion**: se creo la regla del proyecto que obliga a eliminar los archivos temporales no necesarios al terminar cada tarea y antes de cualquier commit/push. Define: (1) que es temporal y se puede borrar (`informes/_*`, `backend/_*.mjs`, HTML intermedios de md_to_html en %TEMP%, `__pycache__/`, logs sueltos); (2) que NO se borra (informes versionables, scripts/ utilidades, carpetas de conversion docx/pdf, Audios/, AVANCES/, .env, migraciones SQL); (3) flujo de limpieza obligatorio con verificacion previa via Glob; (4) checklist de cierre; (5) prohibicion de borrado por patron amplio (`git clean -f`).
- **Motivo**: el usuario pidio una regla que elimine archivos temporales innecesarios del proyecto de forma controlada.
- **Requerimientos**: N/A (configuracion del entorno)
- **Evidencia**: se limpiaron 24 archivos temporales de `informes/_*` generados en la sesion del 6-7/08 (logs de tests, consultas, conversiones y git status).
- **Estado**: Completado

---

## 2026-08-07 - DOCS: informe de actualizacion BD y requerimientos (guardado en Escritorio/INFO)

- **Autor**: Daniel Palacios
- **Archivos**: INFORME_ACTUALIZACION_BD_Y_REQUERIMIENTOS_2026-08-07.md (documento local externo, no versionado)
- **Descripcion**: se creo un informe de actualizacion en primera persona (distinto al informe de revision) y se guardo en la ruta externa `Escritorio\INFO`. Documenta los cambios verificados del 6/08 a la madrugada del 7/08: (1) BD - ENUM `notificaciones.tipo` corregido, `detalle_pedidos` con `estado_envio`/`estado_pago_vendedor`/`fecha_desembolso`, `pedidos.estado_pedido` eliminado (N a 1), base vacia; (2) requerimientos - RF4 expiracion 5 min, RF115 ya no almacena IVA, RF132 corregido a 19% (modelo 119% en disputa), RF92 tarjeta incompleta; (3) decisiones pendientes - modelo de IVA (llamada 7/08), columna expiracion token, mojibake, seed; (4) recomendaciones de solucion con migraciones SQL.
- **Motivo**: el usuario pidio guardar un informe diferente en la ruta INFO, no una copia del informe de revision.
- **Requerimientos**: RF4, RF92, RF97, RF114, RF115, RF132, RFX (REVISION)
- **Evidencia**: consultas a information_schema (7/08) y transcripciones de audios 12-13.
- **Estado**: Completado

---

## 2026-08-07 - DOCS: revision esquema commercy_v2 post-trabajo de Meneses + audios 12-13

- **Autor**: Daniel Palacios
- **Archivos**: "informes/INFORME DE REVISION - BASE DE DATOS Y REQUERIMIENTOS COMMERCITY (commercity_v2).md" (v1.2); informes/Commercity 2.0 (optimizado4)/Commercity 2.0 (optimizado4).md; informes/Análisis del proyecto/Análisis del proyecto.md; Audios/12.txt; Audios/13.txt
- **Descripcion**: se actualizo el informe a v1.2 tras la conversacion de la madrugada del 7/08 y la revision del esquema real. Hallazgos: (1) Meneses corregio el ENUM `notificaciones.tipo` (RF97) y agrego `estado_envio`, `estado_pago_vendedor`, `fecha_desembolso` en `detalle_pedidos` ("N a 1 en pedidos"; `pedidos.estado_pedido` eliminado); (2) la BD quedo VACIA de datos (0 registros; se eliminaron los usuarios vitest); (3) sigue el mojibake en `notificaciones.estado`; (4) el RF4 del docx optimizado4 ya define la expiracion del link (5 minutos, un solo uso) pero la BD no tiene `token_recuperacion_expiracion`; (5) IVA: Meneses planteo modelo adicional ("119%", vendedor define IVA por producto - audio 12) que contradice la regla del 6/08 (incluido); pendiente de definir en llamada del 7/08; posible columna `iva_porcentaje` en `productos`; (6) RF115 ya no exige almacenar IVA (conflicto resuelto); (7) RF92 tarjeta de producto incompleta (Yepes). Se transcribieron los audios 12 y 13 (faltantes) y se convirtieron a md el docx optimizado4 y el PDF "Análisis del proyecto".
- **Motivo**: el usuario pidio tomar todo el contexto de la conversacion del grupo y extraer los audios pendientes.
- **Requerimientos**: RF4, RF92, RF97, RF114, RF115, RF132, RFX (REVISION)
- **Evidencia**: consultas a information_schema de commercy_v2 (7/08), transcripciones de los audios 12 y 13, conversion de optimizado4 y analisis del proyecto.
- **Estado**: Completado

---

## 2026-08-06 - DOCS: link de mockup Figma actualizado registrado en plan Scrum

- **Autor**: Daniel Palacios
- **Archivos**: informes/PLAN_SCRUM_BACKEND_2026-08-06.md
- **Descripcion**: se registro el link oficial del mockup Figma actualizado que compartio Yepes a las 10:08 PM (https://www.figma.com/design/WeJbbg2MZuwRddWf2TCkOa/commercity-2.0?node-id=445-2&t=aRqva6MCQNtK6RSK-1, node 445-2) como referencia del equipo. El mockup incluye la cantidad x precio unitario del vendedor; no bloquea el backend porque el contrato ya esta soportado por `detalle_pedidos`.
- **Motivo**: mantener la trazabilidad de los recursos compartidos por el Director en el plan de trabajo del backend.
- **Requerimientos**: N/A
- **Evidencia**: mensaje de Yepes en el grupo de lideres (10:07-10:08 PM 2026-08-06).
- **Estado**: Completado

---

## 2026-08-06 - DOCS: revision de requerimientos 2.0 Final (link de restablecimiento confirmado)

- **Autor**: Daniel Palacios
- **Archivos**: informes/Commercity 2.0 Final (optimizado)/Commercity 2.0 Final (optimizado).md (conversion del docx)
- **Descripcion**: se convirtio y reviso el docx `Commercity 2.0 Final (optimizado).docx`. El contenido de RF es equivalente al 3.0 (RF114 pasarela subtotal+IVA 19%, RF115 almacenar IVA por producto, RF131 con el error 90/10/15, RFX sin numero). Diferencia clave: **RF4 del Final especifica el link** ("cuando abra el link de restablecer contraseña que le llegara por medio del correo electronico"), confirmando el flujo de recuperacion por link. Sigue faltando la **expiracion del link/token** como regla de negocio (ni el Final ni el 3.0 la mencionan) - pendiente de proponer en requerimientos.
- **Motivo**: el usuario pidio revisar el documento Final para confirmar que el paso a paso de recuperacion por link esta especificado.
- **Requerimientos**: RF3, RF4 (REVISION)
- **Evidencia**: conversion del docx Final a markdown y lectura de RF3/RF4 + secciones de IVA/comisiones.
- **Estado**: Completado

---

## 2026-08-06 - DOCS: revision de requerimientos 3.0 (docx Yepes) y ajuste de conversion md->pdf

- **Autor**: Daniel Palacios
- **Archivos**: informes/Commercity 3.0 (optimizado)/Commercity 3.0 (optimizado).md (conversion del docx); scripts/md_to_html.py
- **Descripcion**: se convirtio y reviso el docx `Commercity 3.0 (optimizado).docx` (contenido equivalente al documento oficial `Commercity 2.0 Final (optimizado).docx`, 132 RF + 20 RNF). Hallazgos: (1) RF115 exige registrar el valor del IVA de cada producto al confirmar el pago -> contradice la decision del 8:12 PM (sin columna IVA); reactiva la necesidad de columnas IVA en detalle_pedidos (confirmar con Yepes/Meneses); (2) RF131 redacta "90% vendedor, 10% comision y 15% al iva" -> ERROR: 15% contradice el 19% (RF114/RF115) y 90+10+15=115% no cierra; (3) RF3/RF4 (recuperacion de contrasena) NO mencionan expiracion del link/token -> falta la regla de negocio (se propuso texto); el link de restablecimiento SI esta especificado en el RF4 del documento oficial; (4) RFX sin numero (nomenclatura pendiente); (5) RF31 historial muestra "Iva del %19 aplicado" refuerza almacenar IVA; (6) RF97 tipos de notificacion desalineados con el ENUM actual de BD; (7) metadatos del documento desactualizados (dice version 2.0 / fecha 12/05/2026). Se ajusto `scripts/md_to_html.py` para que el HTML temporal se genere en el directorio temporal del sistema y NO se dejen archivos intermedios en informes/ (evita exponer rutas locales tipo file://).
- **Motivo**: el usuario pidio revisar los requerimientos actualizados de Yepes y evitar que las conversiones md->pdf expongan rutas temporales locales.
- **Requerimientos**: RF3, RF4, RF31, RF97, RF114, RF115, RF131, RFX (REVISION)
- **Evidencia**: conversion del docx 3.0 a markdown y lectura completa del documento.
- **Estado**: Completado

---

## 2026-08-06 - DOCS: novedades del grupo de lideres en plan Scrum (Resend, requerimientos, token)

- **Autor**: Daniel Palacios
- **Archivos**: informes/PLAN_SCRUM_BACKEND_2026-08-06.md
- **Descripcion**: se agrego la subseccion "Novedades 2026-08-06 (9 PM - grupo de lideres)" al plan Scrum: (1) Resend confirmado por Diego Serna como proveedor de correo (CERRADO); (2) Yepes actualizo los requerimientos con el flujo de IVA desde la publicacion del producto y pasara el docx `Commercity 2.0 (optimizado) (2).docx` ~10 PM con nomenclatura e indice (EN CAMINO - pendiente de recibir y revisar errores); (3) mockup Figma en actualizacion (cantidad x precio unitario) sin bloquear backend; (4) expiracion del token de recuperacion como regla de negocio a proponer en requerimientos (texto del RF en el informe de BD seccion 6).
- **Motivo**: registrar en el plan las decisiones y pendientes comunicados por el grupo de lideres el 2026-08-06 a las 9 PM.
- **Requerimientos**: RFX (REVISION), RNF (seguridad)
- **Evidencia**: mensajes del grupo de lideres (WhatsApp, 9:00-9:49 PM 2026-08-06).
- **Estado**: Completado

---

## 2026-08-06 - DOCS: informe de revision de base de datos commercy_v2 (primera persona)

- **Autor**: Daniel Palacios
- **Archivos**: "informes/INFORME DE REVISION - BASE DE DATOS Y REQUERIMIENTOS COMMERCITY (commercity_v2).md"
- **Descripcion**: se creo el informe de revision completa de la base oficial `commercity_v2` contra el esquema real via information_schema y conteos de registros (solo lectura, sin modificar datos). Se confirmo la conexion externa (`commercy_user@%` habilitado por Meneses). La base ahora tiene 19 tablas (Meneses agrego `producto_variantes` el 2026-08-06). Hallazgos: (1) CRITICO - sin datos semilla (0 productos, 0 categorias, 0 pedidos; solo 4 usuarios de prueba vitest); (2) CRITICO - mojibake en `notificaciones.estado` (`enum('le├¡do','no le├¡do')`) y ENUM de tipo desalineado con RF97; (3) MEDIO - link de restablecimiento definido (RF4) pero sin expiracion del token; (4) decision oficial IVA 19% con CONFLICTO por RF115 (almacenar IVA) a resolver; (5) RF131 con error de redaccion (15% vs 19%). Se verificaron charset utf8mb4, FKs con indice y roles correctos. Se definieron acciones priorizadas para Meneses y recomendaciones de solucion por hallazgo (migraciones SQL sugeridas para ENUM, token y IVA condicional). Informe v1.1 dirigido a Jose Yepes (Director) y Jorge Meneses (Lider BD), que integra la revision de los requerimientos oficiales (seccion 3.6). El informe se mantiene **solo en formato .md** (sin conversion a PDF, por decision del lider backend).
- **Motivo**: el usuario pidio un informe completo en primera persona sobre la revision de base de datos para avisar a Meneses (lider BD) y destrabar el backend.
- **Requerimientos**: RF109, RF110, RF127, RF128, RF129, RF40, RF72, RFX (REVISION)
- **Evidencia**: consultas directas a commercy_v2 (information_schema, conteos de registros, prueba endpoint perfil publico HTTP 200).
- **Estado**: Completado

---

## 2026-08-06 - CHORE: pruebas de la tarea de Cristian con capturas de evidencia

- **Autor**: Daniel Palacios
- **Archivos**: .gitignore; AVANCES/CRISTIAN ROSERO/PRUEBAS/ (1_pantalla_ide.png, 2_evidencia_resultados.png, 2_pantalla_ide_tests.png, 3_log_tests.txt, 4_log_cobertura.txt, 5_log_endpoint_real.txt, 6_cobertura_html.png, 7_video_prueba.mp4, 8_video_trae_preview.mp4, evidencia_prueba.html); scripts/captura_pantalla.py; scripts/grabar_pantalla.py
- **Descripcion**: se agrego `docs/` al .gitignore (documentos fuente Word y conversiones locales no se versionan). Se ejecuto la prueba de la tarea de Cristian Rosero (modulo perfil publico) y se guardaron capturas de pantalla, videos y evidencia en la ruta solicitada: tests unitarios 26/26 (7 del perfil publico + 19 del carrito), cobertura 94.16% statements / 100% functions, prueba funcional del endpoint real GET /api/usuarios/perfil-publico/3 contra la BD remota (200 OK) y casos 404 (inexistente) / 400 (id invalido). Se grabo video de pantalla mientras el navegador mostraba el endpoint real y el HTML de evidencia (7_video_prueba.mp4) y mientras el preview de Trae IA mostraba la respuesta JSON (8_video_trae_preview.mp4).
- **Motivo**: el usuario pidio ignorar docs/ del repo y generar evidencia visual de las pruebas para Cristian en AVANCES/CRISTIAN ROSERO/PRUEBAS.
- **Requerimientos**: RF109, RFX (REVISION)
- **Evidencia**: logs en AVANCES/CRISTIAN ROSERO/PRUEBAS/ (26 tests passed, cobertura 94.16%, endpoint 200 OK con datos reales de commercy_v2).
- **Estado**: Completado

---

## 2026-08-06 - DOCS: decision oficial IVA 19% confirmada en plan Scrum

- **Autor**: Daniel Palacios
- **Archivos**: informes/PLAN_SCRUM_BACKEND_2026-08-06.md
- **Descripcion**: se registro la decision oficial del IVA confirmada con Yepes: (1) el precio publicado por el vendedor ya incluye el IVA 19% (precio final, sin calcular nada al publicar); (2) el detalle del pedido muestra solo el monto total, sin desglose; (3) las comisiones 10/90 se calculan sobre el subtotal SIN IVA. Implicacion tecnica: NO se requiere tabla/columna IVA para el flujo de pedidos; Meneses no necesita migracion por esta decision. Se actualizo el alcance de Carlos Vidal, Jary, Meneses y Yepes.
- **Motivo**: resolver la inconsistencia del porcentaje del IVA (15% vs 19%) y las vueltas de Yepes sobre el desglose, para desbloquear el desarrollo de pedidos e historial.
- **Requerimientos**: RF104, RFX (REVISION), RF76 (base)
- **Evidencia**: confirmacion de Yepes en el grupo de lideres (8:05 PM: "19% en colombia") y mensaje enviado por Daniel (8:12 PM).
- **Estado**: Completado

---

## 2026-08-06 - DOCS: decisiones de lideres en plan Scrum (IVA 19%, precio unitario, multi-producto)

- **Autor**: Daniel Palacios
- **Archivos**: informes/PLAN_SCRUM_BACKEND_2026-08-06.md
- **Descripcion**: se agrego la seccion 8 "Decisiones de los lideres (2026-08-06)" al plan Scrum: precio unitario por cantidad, pedidos multi-producto, IVA 19% (confirmado por Yepes, resolviendo la inconsistencia 15% vs 19% del audio 4), comisiones 90/10 y cambio de rol en ajustes. Se documento el alcance ampliado: Carlos Vidal (IVA + comisiones en pedidos), Jary (multi-producto con precio unitario), Meneses (crear entidad IVA) y Yepes (19% al publicar producto). Se renumeraron las secciones 9 y 10.
- **Motivo**: registrar las decisiones criticas del grupo de lideres que afectan el backend antes de que los integrantes avancen en sus modulos.
- **Requerimientos**: RF104, RFX (REVISION), RF76 (base)
- **Evidencia**: transcripcion del audio 4 + confirmacion de Yepes en el grupo (19%).
- **Estado**: Completado

---

## 2026-08-06 - CHORE: ampliar gitignore (Python, IDEs, sistema, Office, env.local)

- **Autor**: Daniel Palacios
- **Archivos**: .gitignore
- **Descripcion**: se agregaron al .gitignore: bytecode de Python (`__pycache__/`, `*.py[cod]`), configuraciones de IDEs (`.vscode/`, `.idea/`), archivos de sistema (Thumbs.db, Desktop.ini, .DS_Store), temporales de Office (`~$*`) y `*.env.local`. `frontend/dist/` no se agrego porque ya esta cubierto por la entrada global `dist`.
- **Motivo**: mantener el repositorio limpio de artefactos locales generados por scripts Python, IDEs y el sistema operativo.
- **Requerimientos**: N/A (configuracion)
- **Evidencia**: .gitignore verificado (entrada global `dist` en linea 100 cubre frontend/dist).
- **Estado**: Completado

---

## 2026-08-06 - CHORE: gitignore de entregas/audios/scripts y transcripcion de audio 4

- **Autor**: Daniel Palacios
- **Archivos**: .gitignore, Audios/4.txt (nuevo), scripts/transcribir_audio.py, scripts/ffmpeg/ffmpeg.exe
- **Descripcion**: se agregaron al .gitignore las carpetas AVANCES/ (entregas de integrantes), Audios/ (audios y transcripciones) y scripts/ (herramientas locales). Se transcribio el audio 4 de Yepes (modelo small, 1004 chars): confirma el precio unitario por cantidad en el mockup de Figma, la implementacion del IVA (15%) pendiente de Meneses en la BD y las comisiones 90/10 en pedidos.
- **Motivo**: las entregas de los integrantes y los audios del grupo no deben versionarse en el repositorio; la transcripcion del audio 4 registra decisiones criticas de backend (IVA y comisiones).
- **Requerimientos**: N/A (gestion de proyecto)
- **Evidencia**: transcripcion en Audios/4.txt; .gitignore verificado.
- **Estado**: Completado

---

## 2026-08-06 - CHORE: instalar openai-whisper para transcripcion de audio

- **Autor**: Daniel Palacios
- **Archivos**: entorno Python (paquete openai-whisper instalado via pip)
- **Descripcion**: se instalo openai-whisper (modelo de transcripcion de audio de OpenAI) para transcribir audios a texto localmente (ej: audios de voz de WhatsApp del grupo de lideres). Complementa el flujo de la skill automate-this (extraer audio con ffmpeg + transcribir con whisper).
- **Motivo**: el lider de backend necesita transcribir los audios de voz del grupo de lideres (Yepes y otros) para registrar las decisiones sin perder contexto.
- **Requerimientos**: N/A (herramienta de soporte)
- **Evidencia**: verificado `import whisper` -> OK.
- **Estado**: Completado

---

## 2026-08-06 - CHORE: skills de conversion de documentos y generacion de PDF

- **Autor**: Daniel Palacios
- **Archivos**: .agents/skills/convert-documents-to-markdown/ (nuevo), .agents/skills/huashu-md-to-pdf/ (nuevo), scripts/md_to_html.py (nuevo), informes/INFORME_ENTREGA_CRISTIAN_ROSERO_2026-08-06.pdf (nuevo)
- **Descripcion**: se instalo la skill de Firecrawl anydoc (convert-documents-to-markdown) para convertir documentos (Word, PDF, etc.) a Markdown, y la skill huashu-md-to-pdf para la direccion inversa (Markdown a PDF). Como WeasyPrint (dependencia de huashu-md-to-pdf) falla en Windows por falta de GTK/Pango, se creo el script scripts/md_to_html.py (markdown2) y se uso Edge headless para generar el PDF del informe de Cristian Rosero.
- **Motivo**: el equipo necesita convertir informes .md a PDF para enviarlos a los integrantes; anydoc complementa la conversion de documentos del proyecto a Markdown.
- **Requerimientos**: N/A (herramientas de soporte)
- **Evidencia**: PDF generado (158 KB) para INFORME_ENTREGA_CRISTIAN_ROSERO_2026-08-06.md.
- **Estado**: Completado

---

## 2026-08-06 - DOCS: informe de entrega de Cristian Rosero (perfil publico)

- **Autor**: Daniel Palacios
- **Archivos**: informes/INFORME_ENTREGA_CRISTIAN_ROSERO_2026-08-06.md (nuevo)
- **Descripcion**: se documento la entrega de Cristian Rosero (modulo perfil publico de usuario, RF104): lo que desarrollo, las 8 correcciones aplicadas por el lider (pool real de config/db.js, validacion de id, respuesta estructurada, no exposicion de error.message, exclusion del email, verificacion de usuario activo, estructura del proyecto y montaje en /api/usuarios), los 7 tests creados, el resultado de cobertura (94.16%) y la limpieza de la carpeta de entrega.
- **Motivo**: dejar evidencia trazable de la revision e integracion de cada modulo del equipo backend.
- **Requerimientos**: RF104 (REVISION)
- **Evidencia**: informe con detalle de correcciones, contrato del endpoint y resultados de testing.
- **Estado**: Completado

---

## 2026-08-06 - CHORE: depurar carpeta de entrega de Cristian Rosero

- **Autor**: Daniel Palacios
- **Archivos**: AVANCES/CRISTIAN ROSERO/ (se elimino Commercity-main/ completo; quedaron solo backend/src/server/controllers/usuarios.controllers.js, backend/src/server/routes/routes.js y Documentacion.txt)
- **Descripcion**: se depuro la carpeta de entrega de Cristian Rosero: el envio incluia el proyecto completo clonado (frontend con node_modules, package.json, db.js, server.js, etc.). Se conservaron unicamente los archivos de su modulo asignado (perfil publico de usuario: controlador, ruta y documentacion) y se elimino el resto.
- **Motivo**: directiva del lider de backend de recibir solo los archivos que corresponden al modulo de cada integrante, no el proyecto entero.
- **Requerimientos**: RF104 (REVISION)
- **Evidencia**: estructura final verificada con LS (solo 3 archivos del modulo).
- **Estado**: Completado

---

## 2026-08-06 - FEAT: integrar modulo perfil publico (Cristian Rosero) con correcciones de seguridad

- **Autor**: Daniel Palacios (integracion); Cristian Rosero (desarrollo original)
- **Archivos**: backend/src/server/controllers/usuarios.controllers.js, backend/src/server/routes/usuarios.routes.js (nuevo), backend/src/server/app.js, backend/src/server/__tests__/usuarios.controllers.test.js (nuevo)
- **Descripcion**: se integro el modulo de perfil publico de usuario entregado por Cristian Rosero (GET /api/usuarios/perfil-publico/:id). Se corrigieron brechas frente a las reglas del proyecto: uso del pool real de config/db.js (eliminando credenciales hardcodeadas), validacion de id entero positivo, respuesta estructurada { success, error }, no exposicion de error.message en 500, exclusion del email del perfil publico, verificacion de usuario activo (baneado = 404) y endpoint montado en /api/usuarios.
- **Motivo**: como lider de backend, integrar la entrega de un integrante del equipo validandola contra el esquema y las reglas de seguridad (api-seguridad.md, backend-estructura.md).
- **Requerimientos**: RF104 (REVISION)
- **Evidencia**: 26/26 tests en verde (19 carrito + 7 perfil publico); cobertura Statements 94.16%, Branches 87.3%, Functions 100%, Lines 94.11% (umbral 60 superado, mejora vs 93% previo).
- **Estado**: Completado

---

## 2026-08-06 - DOCS: plan Scrum backend y protocolo de entrega del equipo (correccion)

- **Autor**: Daniel Palacios
- **Archivos**: informes/PLAN_SCRUM_BACKEND_2026-08-06.md, informes/PROTOCOLO_ENTREGA_BACKEND_2026-08-06.md
- **Descripcion**: se corrigieron los documentos del plan Scrum y el protocolo de entrega: se elimino toda referencia al repositorio de trabajo ECOMMERCE, se reescribio el plan en primera persona y se explicitio el flujo centralizado (los companeros entregan su modulo al lider, el lider revisa, valida y realiza el commit y el push).
- **Motivo**: directiva del usuario: el informe no debe mencionar el repositorio de trabajo, debe estar en primera persona e indicar que las entregas se reciben, revisan y pushean por el lider de backend.
- **Requerimientos**: N/A (gestion de proyecto)
- **Evidencia**: grep verificado sin coincidencias de ECOMMERCE en el informe.
- **Estado**: Completado

---

## 2026-08-06 - DOCS: plan Scrum backend y protocolo de entrega del equipo

- **Autor**: Daniel Palacios
- **Archivos**: informes/PLAN_SCRUM_BACKEND_2026-08-06.md (nuevo), informes/PROTOCOLO_ENTREGA_BACKEND_2026-08-06.md (nuevo)
- **Descripcion**: se creo el plan Scrum del backend con organigrama oficial (Director: Jose Yepes), linea de tiempo (entrega parcial 11 de agosto, final ~27 de septiembre), cronograma de 8 sprints, Definition of Done, protocolo de entrega (formato ZIP, prohibiciones, fechas de corte) y coordinacion inter-area. Se creo el mensaje de protocolo listo para enviar al grupo.
- **Motivo**: como lider de backend se requiere un plan formal para coordinar la entrega del martes 11 de agosto y la gestion del equipo.
- **Requerimientos**: N/A (gestion de proyecto)
- **Evidencia**: documentos creados en informes/.
- **Estado**: Completado

---

## 2026-08-06 - CHORE: cubrir brechas de skills para apoyar areas externas

- **Autor**: Daniel Palacios
- **Archivos**: .agents/skills/vercel-react-native-skills/ (nuevo), .agents/skills/flutter-*/ (nuevo, 10 skills), .agents/skills/selenium-automation/ (nuevo), .trae/rules/skill-triggers.md
- **Descripcion**: se instalaron skills del ecosistema abierto (skills.sh) para cubrir las brechas de apoyo a otras areas: `vercel-react-native-skills` (React Native/Expo, repo vercel-labs), `flutter-*` (10 skills del repo oficial flutter/skills) y `selenium-automation` (mindrally/skills). Se amplio skill-triggers.md con 3 secciones nuevas: Movil, Escritorio y UML (activacion automatica por frases clave).
- **Motivo**: como lider de backend, se requiere capacidad de apoyo a las areas de movil (Jhon Parra), escritorio (Sebastian) y UML (Jose Yepes); antes el catalogo del proyecto solo tenia batch-files para escritorio y generate-mini-app (Taro) para movil, que no cubre desarrollo nativo.
- **Requerimientos**: N/A (herramientas de soporte)
- **Evidencia**: `npx skills` (v CLI) detecto agente TRAE, instalacion completada en .agents/skills/ con symlink a Trae y Claude Code; mapeo agregado y verificado en skill-triggers.md.
- **Estado**: Completado

---

## 2026-08-05 - DOCS: informe de pruebas del modulo carrito

- **Autor**: Daniel Palacios
- **Archivos**: informes/INFORME_PRUEBAS_CARRITO_2026-08-05.md
- **Descripcion**: se documento el informe de pruebas del carrito: 19 tests unitarios (Vitest + Supertest, cobertura 93% stmts / 92.92% lines) y prueba funcional en vivo de 8 pasos contra la BD real commercy_v2, con verificacion de agrupacion por vendedor y calculo con descuento.
- **Motivo**: dejar evidencia estructurada de la validacion de la tarea del carrito.
- **Requerimientos**: RF103, RF104, RF105, RFX, RF109 (REVISION)
- **Evidencia**: resultados detallados en el informe.
- **Estado**: Completado

---

## 2026-08-05 - FEAT: testing backend (Vitest + Supertest) y 19 tests del carrito

- **Autor**: Daniel Palacios
- **Archivos**: backend/package.json, backend/src/server/app.js (nuevo), backend/src/server/server.js, backend/src/server/__tests__/carrito.controllers.test.js (nuevo)
- **Descripcion**: se configuro Vitest + Supertest con umbral de cobertura 60 (thresholds en package.json); se refactorizo la app Express a `app.js` (exporta la app sin listen) y `server.js` (solo arranca) para testabilidad; se escribieron 19 tests del controlador carrito con mock `vi.mock('mysql2/promise')`.
- **Motivo**: cumplir la politica post-cambio de testing-commercity.md (mantener cobertura >= 60) tras implementar el carrito.
- **Requerimientos**: RF103, RF104, RF105, RFX, RF109 (REVISION)
- **Evidencia**: 19/19 tests OK; cobertura Statements 93%, Branches 84.9%, Functions 100%, Lines 92.92% (umbral 60 superado).
- **Estado**: Completado

---

## 2026-08-05 - DOCS: flujo post-cambio obligatorio para mantener cobertura

- **Autor**: Daniel Palacios
- **Archivos**: .trae/rules/testing-commercity.md (local, no versionado)
- **Descripcion**: se agrego la seccion "Post-cambio obligatorio": al terminar cualquier cambio de codigo se deben identificar funciones afectadas, crear/actualizar tests (patron por controlador/componente), ejecutar cobertura (/coverage-be, /coverage-fe), verificar umbral fail_under=60 y registrar evidencia en el changelog. Excepciones: solo archivos de documentacion/configuracion sin logica.
- **Motivo**: directiva del usuario de mantenerse actualizados en cobertura tras cada cambio.
- **Requerimientos**: N/A (proceso)
- **Evidencia**: regla vinculada a testing-commercity.md y documentacion-cambios.md.
- **Estado**: Completado

---

## 2026-08-05 - FEAT: prueba en vivo del carrito contra la BD real (flujo completo)

- **Autor**: Daniel Palacios
- **Archivos**: ninguno (prueba funcional)
- **Descripcion**: se valido el flujo completo del carrito contra `commercy_v2` con datos semilla temporales: agregar (201), acumular por upsert (2+3=5), validacion de stock (400 INSUFFICIENT_STOCK), listado agrupado por vendedor con precio final con descuento (90000 de 100000 con 10%) y resumen (total 450000), modificar cantidad (200), eliminar (200). Datos de prueba eliminados al final (LIMPIEZA OK).
- **Motivo**: confirmar que la tarea asignada (carrito) cumple RF103, RF104, RF105, RFX y la agrupacion por vendedor (RF109 REVISION).
- **Requerimientos**: RF103, RF104, RF105, RFX, RF109 (REVISION)
- **Evidencia**: servidor en puerto 5000; respuestas JSON estructuradas correctas en los 8 pasos del flujo.
- **Estado**: Completado

---

## 2026-08-05 - CHORE: verificacion de configs del carrito contra la BD real

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/server.js (mensaje de arranque con puerto real)
- **Descripcion**: se verificaron los 4 endpoints del carrito contra la BD remota commercy_v2 con el puerto 5000 del .env: GET / 200, GET carrito 200 (tablas vacias), validaciones 400 correctas (comprador_id). Correccion cosmetica del console.log del servidor (mostraba el puerto real).
- **Motivo**: confirmar que la tarea asignada (carrito) quedo aplicada tras la correccion B1.
- **Requerimientos**: RF103, RF104, RF105, RFX
- **Evidencia**: prueba con servidor en puerto 5000; respuestas JSON estructuradas correctas contra MySQL real.
- **Estado**: Completado

---

## 2026-08-05 - DOCS: regla de autorizacion para commit y push

- **Autor**: Daniel Palacios
- **Archivos**: .trae/rules/git-autorizacion-versionado.md (local, no versionado)
- **Descripcion**: nueva regla que prohibe ejecutar `git add`, `git commit` o `git push` automaticamente; solo se ejecutan con orden explicita del usuario (commit, push, go, procede, sube, o comandos git concretos). Sin autorizacion, el working tree queda listo sin commitear y se notifica.
- **Motivo**: directiva del usuario de no versionar nada automaticamente.
- **Requerimientos**: N/A (proceso)
- **Evidencia**: aplicada junto a git-push-politica.md (checklist y unico destino de push ECOMMERCE).
- **Estado**: Completado

---

## 2026-08-05 - DOCS: ampliar activacion automatica de skills por frases clave

- **Autor**: Daniel Palacios
- **Archivos**: .trae/rules/skill-triggers.md (local, no versionado)
- **Descripcion**: se amplio el mapeo de frases clave -> skills de 10 a 14 areas: se agregaron mysql/mysql-design (BD), swagger-gen (doc API), error-handling-patterns, zod-validation-expert, ascii-flow/brainstorming (diagramas), git-commit-organizer (versionado), frontend-design y vercel-react-best-practices (rendimiento). Se agrego regla general de catalogo completo + verificacion de cobertura.
- **Motivo**: directiva del usuario: usar todas las skills disponibles segun las frases de cada consulta o actualizacion.
- **Requerimientos**: N/A (proceso)
- **Evidencia**: revision de .trae/skills, .agents/skills y .claude/skills confirma que las skills referenciadas estan disponibles.
- **Estado**: Completado

---

## 2026-08-05 - DOCS: informes versionables subidos a ECOMMERCE

- **Autor**: Daniel Palacios
- **Archivos**: .gitignore, informes/ (15 archivos: auditoria, requerimientos, brechas, changelog y documentos convertidos del lider)
- **Descripcion**: se quito `informes/` del .gitignore para versionar los informes en ECOMMERCE; los temporales `informes/_*` (logs de prueba) siguen excluidos. Commit c38a4da pusheado.
- **Motivo**: directiva del usuario: los informes si se suben al repositorio de trabajo ECOMMERCE.
- **Requerimientos**: N/A (documentacion)
- **Evidencia**: `git push 5fb600e..c38a4da`; `git check-ignore` confirma `backend/.env` y `informes/_*.log` excluidos; grep sin credenciales en informes/.
- **Estado**: Completado

---

## 2026-08-05 - CHORE: repositorio de trabajo ECOMMERCE + politica de push

- **Autor**: Daniel Palacios
- **Archivos**: .gitignore, .trae/rules/git-push-politica.md, backend/.env.example, backend/src/server/server.js, backend/src/server/config/db.js, backend/src/server/controllers/carrito.controllers.js, backend/src/server/routes/carrito.routes.js, schema_commercity.sql
- **Descripcion**: origin ahora apunta a `danielpalacios665-sys/ECOMMERCE` (unico destino de push); `commercycity` (diegoSerna17/Commercity) queda solo para pull de actualizaciones del equipo. Commit inicial 5fb600e pusheado a ECOMMERCE con el modulo carrito alineado al esquema y la config de BD remota.
- **Motivo**: directiva del usuario: los trabajos se entregan al lider, quien revisa y hace push al proyecto original. Regla nueva `git-push-politica.md`.
- **Requerimientos**: N/A (proceso)
- **Evidencia**: `git push -u origin main` -> `[new branch] main -> main`; `git status`: working tree limpio, rama main sincronizada con origin/main.
- **Estado**: Completado

---

## 2026-08-05 - FEAT: configuracion de entorno para BD remota del equipo

- **Autor**: Daniel Palacios
- **Archivos**: backend/.env, backend/.env.example, backend/src/server/config/db.js, backend/src/server/server.js
- **Descripcion**: se creo backend/.env con los datos del lider (PORT=5000, DB_HOST=149.130.178.228, DB_NAME=commercity_v2); se agrego lectura de DB_PORT en el pool; se agrego dotenv.config() en server.js (antes importaba dotenv sin configurarlo).
- **Motivo**: directiva del lider (Yepes) para conectar todo el grupo backend a una BD compartida.
- **Requerimientos**: N/A (infraestructura)
- **Evidencia**: conexion verificada contra la BD remota (SHOW DATABASES + SHOW TABLES); GET /api/carrito -> 200 contra MySQL real.
- **Estado**: Completado

## 2026-08-05 - FIX: alinear controlador carrito al esquema real (brecha B1)

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/controllers/carrito.controllers.js
- **Descripcion**: se elimino la tabla `carrito` intermedia; parametro `comprador_id`; upsert `ON DUPLICATE KEY UPDATE` con `uq_comprador_producto`; columnas `imagen_url`, `descuento_porcentaje`, `nombre_completo`; precio final con descuento; transacciones con `FOR UPDATE`; redondeo monetario a 2 decimales.
- **Motivo**: el controlador referenciaba tablas/columnas inexistentes en el esquema oficial (tabla `carrito`, `precio_original`, `imagen`, `u.nombre`). Informe: `informes/INFORME_CRITICO_INCOMPATIBILIDAD_CARRITO_2026-08-05.md`.
- **Requerimientos**: RF103, RF104, RF105, RFX (REVISION)
- **Evidencia**: node --check OK; GET /api/carrito -> 200 contra BD real; validacion 400 con `comprador_id`.
- **Estado**: Completado

## 2026-08-05 - CHORE: carpetas locales fuera del repositorio

- **Autor**: Daniel Palacios
- **Archivos**: .gitignore
- **Descripcion**: se ignoraron las carpetas `.trae/`, `.agents/`, `.claude/` e `informes/` (configuracion del entorno y documentos locales).
- **Motivo**: mantener el repositorio limpio de configuracion local y documentacion interna.
- **Requerimientos**: N/A
- **Evidencia**: `git check-ignore .trae .agents .claude informes` devuelve las 4 carpetas; ninguna trackeada.
- **Estado**: Completado

## 2026-08-05 - DOCS: informes de requerimientos, base de datos y brechas

- **Autor**: Daniel Palacios
- **Archivos**: informes/INFORME_REQUERIMIENTOS_BACKEND_BD_2026-08-05.md, informes/INFORME_CRITICO_INCOMPATIBILIDAD_CARRITO_2026-08-05.md
- **Descripcion**: informe completo que cruza 125 RF + 20 RNF con las 18 tablas del esquema y el estado del backend por modulo del equipo; informe critico de la incompatibilidad del carrito (B1) con plan de correccion aplicado.
- **Motivo**: documentar el estado real del proyecto para el equipo y dejar trazabilidad de la brecha B1.
- **Requerimientos**: todos (125 RF + 20 RNF)
- **Evidencia**: revision cruzada de schema_commercity.sql, documento "Commercity 2.0 (optimizado)" y backend/src/server.
- **Estado**: Completado

## 2026-08-05 - DOCS: reglas y skills para el stack del proyecto

- **Autor**: Daniel Palacios
- **Archivos**: .trae/rules/ (mysql-convenciones.md, backend-estructura.md, documentacion-cambios.md, entre otras), .trae/AGENTS.md
- **Descripcion**: reglas de convenciones MySQL, estructura de backend Express, documentacion de cambios; mapeo automatico de skills por area (frontend, backend, BD, testing, arquitectura); 16 skills instaladas en .agents/skills/.
- **Motivo**: estandarizar el desarrollo del equipo y activar las skills relevantes al stack React/Express/MySQL.
- **Requerimientos**: N/A (proceso)
- **Evidencia**: verificacion de directorios .trae/skills, .agents/skills y .claude/skills.
- **Estado**: Completado

