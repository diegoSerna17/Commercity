---
goal: Corregir todos los hallazgos de la auditoria de PREVIEW del 2026-10-11 (2 criticos, 6 altos, 40 medios, bajos/info) y consolidar PREVIEW como unica rama de integracion de todas las apps
version: 1.1
date_created: 2026-10-11
last_updated: 2026-10-12
owner: Daniel Palacios (lider)
status: 'Implemented (pendientes humanos: Fase 0, 10.5/10.10/10.11, 9.3)'
tags: [fix, auditoria, seguridad, backend, frontend, escritorio, movil, bd, docs, devops]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

Plan de remediacion derivado de `docs/informes/INFORME_AUDITORIA_PREVIEW_2026-10-11.md` (commit auditado `4d1873c` de `diegoSerna17/Commercity`, rama `PREVIEW`). Los IDs (R-, A-, M-, M-DB-, M-DOC-, M-GIT-, M-OPS-, F4, H5-H10, A3/A4) son los del informe.

**Base de trabajo (decision del usuario)**: la rama actual `feature/docs-api-zod-openapi` / `origin/PREVIEW` (`ec482bb`, v1.2.0). Se crea `fix/auditoria-preview-2026-10-11` desde ahi. Verificado que **todos los hallazgos Altos siguen vigentes** en esa base (A-1, A-2, A-3, A-4, A-5, A-6, M-16, 7 README/CHANGELOG con la contrasena trivial, `scripts/` ignorado, sin `.github` en la raiz). Ya resueltos en esa base y que NO se repiten: los 2 tests rotos de `client.test.js` (credentials), botones "Ver Perfil"/"Reportar" del chat (`ReportarUsuario.jsx`, RF108-110) y el rating real; la base ademas aporta los contratos Zod (`backend/src/server/schemas/*.schema.js`, 15 archivos) y la generacion OpenAPI (`npm run docs:api`).

Despues de validar en la rama de fix, los cambios se llevan a `PREVIEW` de Diego por cherry-pick/PR **solo con autorizacion explicita** (el remoto `commercycity` solo admite push de BACKEND; ver RISK-003).

## 1. Requirements & Constraints

### Reglas del usuario y del equipo
- **SEC-001** (CLAUDE.md global): no leer `.env`/credenciales ni imprimir secretos; si aparece uno, reportarlo para rotacion. Este plan **no** contiene valores de secretos.
- **SEC-002**: prohibido `npx -y` sin version, `@latest`, `pip install` sin version y pipes de instalacion; **toda dependencia nueva con version exacta** (preferir cero dependencias nuevas).
- **SEC-003**: comandos destructivos (borrado, `git filter-repo`, `git push --force`, `git reset --hard`, DROP/TRUNCATE) solo con aprobacion explicita; nunca ejecutar contra la BD compartida.
- **SEC-004**: no modificar controles de seguridad "a mano" fuera de lo que este plan describe (auth, CORS, permisos): cada cambio de esa familia lleva su test.
- **VER-001** (CLAUDE.md global): el lote incluye una tarea explicita de **bump de version + banner + CHANGELOG** (TASK-9.1) antes de darse por completo; version unica en `VERSION`, `backend/package.json` y banner dinamico (`GET /` en `usuarios.controllers.js`); nunca copiar la version a mano; antes del commit buscar la version anterior (`1.2.0`) en el repo.
- **CON-001**: regla del equipo "en PREVIEW no se sube CHANGELOG" (solo `main`). En la rama de fix el CHANGELOG **si** se actualiza (VER-001); al promover a PREVIEW se excluye ese hunk (`git cherry-pick -n` + `git restore --staged docs/CHANGELOG.md`).
- **CON-002**: contrato de respuesta `{ success, data | error }`; Express 5; Zod `.strict()`; SQL parametrizado; mocks de `mysql2` en tests unitarios existentes.
- **CON-003**: todo cambio de contrato de endpoint se refleja en el schema Zod correspondiente y se regenera `docs/api/openapi.json` y `docs/api/entidades.md` (`npm run docs:api`, `npm run docs:entidades`); `docs.routes.test.js` debe seguir verde.
- **CON-004**: cobertura backend no baja del umbral actual (Lines 95,41 %); cobertura frontend sube respecto a la base.
- **CON-005**: reglas del equipo en `.trae/rules/` (`cobertura-tests-por-cambio.md`, `documentacion-cambios.md`, `revision-requerimientos.md`) y plantilla de CHANGELOG vigente.

### Decisiones de negocio pendientes (con default recomendado; el usuario puede cambiarlas)
- **DEC-001** Adjuntos de chat (M-DB-7, RF105): **default**: mantenerlos desmontados, retirar `config/multer.chat.js` y actualizar RF/docs hasta que el equipo decida restaurarlos con migracion `archivo_url`.
- **DEC-002** Autocompra/autocalificacion (M-4): **default**: bloquear (400) con mensaje claro.
- **DEC-003** Cancelacion del comprador en `En camino` (M-2): **default**: solo `Pendiente`; `En camino` requiere flujo de devolucion/admin.
- **DEC-004** Baneo de vendedor con lineas `En camino` (M-1): **default**: no auto-desembolsar; dejar la linea en revision del admin.
- **DEC-005** Sesion web (F4/M-8): **default**: cookie httpOnly como unico transporte en web (Fase 5) con `token_version` en backend; escritorio/movil conservan Bearer hasta migrar a almacenamiento seguro.
- **DEC-006** Reescritura del historial git (R-2/M-GIT-1): **default**: NO ejecutar; solo rotar credenciales y reportar. Se planifica como fase opcional con compuerta (TASK-8.9).
- **DEC-007** LICENSE (M-OPS-1): **default**: agregar archivo con la licencia que el equipo defina; hasta entonces dejar el README coherente ("sin licencia" o ISC, no ambas).
- **DEC-008** Rol de `main` (Fase 10): **default**: `PREVIEW` es la UNICA rama de integracion; `main` queda solo como puntero de release, avanzado por fast-forward desde `PREVIEW` en cada bump con tag `vX.Y.Z`. Nada de ramas por app.
- **DEC-009** Como traer el movil al monorepo (Fase 10): **default**: port selectivo de los 8 archivos que difieren (3 vias) hacia `apps/movil`, **sin** `git subtree`/merge de historias no relacionadas, para no importar el keystore, los SRS/PDF/audio ni los scripts de debug del repo movil.
- **DEC-010** Version unica (Fase 10): **default**: `VERSION` es la fuente; los `package.json` de apps, `MARKETING_VERSION` iOS y `versionName` Android se sincronizan con un script (`tools/sync-version.mjs`), nunca a mano.

## 2. Implementation Steps

> Convencion: un commit por grupo de tareas (mensaje `fix(<area>): ... (<ID auditoria>)`), tests en el mismo commit, sin push. Orden por riesgo: contener -> dinero -> seguridad -> clientes -> BD -> docs/CI -> cierre.

### Implementation Phase 0 - Contencion inmediata (acciones humanas, no son codigo)

- GOAL-000: cortar la exposicion antes de tocar codigo. Claude no ejecuta estas acciones; las entrega como checklist.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-0.1 | **Rotar** contrasenas de las cuentas admin reales (ids citados en CHANGELOG) y de todas las cuentas del seed en cualquier BD compartida (R-1). Forzar cambio de contrasena en el siguiente login. | | |
| TASK-0.2 | **Rotar** contrasenas y clave de firma Android (alias/keystore) (A-4); generar keystore nuevo fuera del repo. Hallazgo adicional de la Fase 10: el propio archivo `android/app/commercity.keystore` esta versionado en el repo movil (`BLACK-CODE-JSB/COMMERCITY-2.0-MOBILE-`) desde su primer commit (`0475306`) y sigue en `HEAD` de `movil/main` y `origin/preview-movil`, junto a las contrasenas escritas en `build.gradle`: la identidad de firma esta completa y publica; si la app ya se publico en una tienda, hay que registrar una clave nueva (Play App Signing / actualizacion de firma). Pedir al propietario del repo movil que lo retire de su arbol (y valorar purgar su historial). | | |
| TASK-0.3 | Tratar como comprometidos los usuarios/hashes del volcado versionado (R-2): forzar reseteo de contrasenas de los 183 usuarios y avisar a los titulares si aplica (datos personales, Ley 1581). | | |
| TASK-0.4 | **Rotar** `DB_PASSWORD`, `JWT_SECRET` y definir `CRYPTO_SECRET_KEY` propia en los entornos (nota fuera de alcance: `.env` versionado en `movil/main` y `origin/preview-movil`, otros repos). Antes de rotar `JWT_SECRET`, respaldar/re-cifrar datos bancarios (M-10: rotarlo sin respaldo ya dejo 7 cuentas irrecuperables). | | |
| TASK-0.5 | Restringir red de la BD compartida: cerrar 3306 a IPs conocidas y habilitar TLS (A3 del informe); retirar IP y usuario de la documentacion (se hace en TASK-2.2). | | |

### Implementation Phase 1 - Preparacion y baseline

- GOAL-001: rama limpia, baseline reproducible y tests autonomos.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-1.1 | `git switch -c fix/auditoria-preview-2026-10-11` desde `ec482bb`. Sin push. | | |
| TASK-1.2 | Baseline: `cd backend && npm ci && npm run test:coverage` y `cd frontend && npm ci && npm run lint && npm run test:coverage && npm run build`; guardar conteos en el CHANGELOG final. | | |
| TASK-1.3 | Tests backend autonomos: agregar `backend/vitest.setup.js` (o `test.env` en `vitest.config`) que defina un `JWT_SECRET` de prueba cuando falte, para que `utils/config.js:17` no haga `process.exit(1)` en CI/clones limpios (hoy fallan 7 de 24 suites). Sin tocar `validarJWTSecret` en produccion. | | |
| TASK-1.4 | Corregir el error de lint `no-unused-vars` en `frontend/src/services/carrito.service.js:8` (eliminar el parametro obsoleto `_compradorId` y actualizar los 5 llamadores o usar `// eslint-disable-next-line` justificado). | | |

### Implementation Phase 2 - Secretos y documentacion sensible (R-1, R-2, A3, M-DOC-3, .gitignore)

- GOAL-002: que el arbol de trabajo ya no publique credenciales ni datos de infraestructura.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-2.1 | Seed (R-1): regenerar los hashes de `seed_commercity.sql` a partir de una contrasena tomada de variable de entorno (script one-off `backend/scripts/gen-seed-hashes.mjs` con `bcrypt`, sin imprimir la clave); el seed deja solo hashes y el encabezado deja de afirmar que la clave se comunica fuera del repo. Documentar el procedimiento de obtenerla por canal privado. | | |
| TASK-2.2 | Quitar la contrasena trivial, el host de BD y el usuario de BD de `apps/README.md`, `apps/escritorio/README.md`, `apps/movil/README.md`, `frontend/README.md`, `docs/CHANGELOG.md` (lineas citadas en el informe) e `docs/informes/INFORME_AUDITORIA_PREVIEW_2026-10-05.md`; sustituir por "pidala al lider por canal privado". | | |
| TASK-2.3 | `docs/informes/INFORME_AUDITORIA_PREVIEW_2026-10-05.md` (M-DOC-3): anadir tabla de estado por hallazgo (cerrado/parcial/abierto) o marcarlo "SUPERADO por INFORME_..._2026-10-11". | | |
| TASK-2.4 | `.gitignore` (raiz y `apps/movil/.gitignore`): agregar `.env.production`, `.env.staging`, `*.pem`, `*.key`, `*.jks`, `*.keystore`, `*.p12`, `google-services.json`, `GoogleService-Info.plist`, `keystore.properties`, `*.sql.gz`, `*.dump`; corregir excepciones `!docs/informes/...` que nombran archivos inexistentes y las reglas que fuerzan `git add -f` en `docs/DRIVE` (M-GIT-1). | | |
| TASK-2.5 | `backend/.env.example`: `DB_USER` sin valor `root`; comentar que `JWT_SECRET` y `CRYPTO_SECRET_KEY` deben ser aleatorios y distintos; agregar `NODE_ENV`, `ALLOW_DESKTOP_ORIGINS` y `CORS_ALLOWLIST` documentados. | | |
| TASK-2.6 | `utils/config.js`: rechazar el valor de ejemplo de `JWT_SECRET` y exigir longitud minima (>= 32) fuera de `NODE_ENV=test`; en produccion exigir `CRYPTO_SECRET_KEY` propia (A4, M-10). Test en `config.utils.test.js`. | | |

### Implementation Phase 3 - Logica de dinero y negocio backend (A-1, A-2, A-3, M-1..M-7)

- GOAL-003: eliminar los errores contables y de concurrencia. Cada correccion nace con un test que **falla antes** y pasa despues.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-3.1 | **A-2**: en `controllers/compras.controllers.js:204-210` reordenar el `UPDATE pagos_simulados` para que `estado` se evalue antes de incrementar (`SET estado = IF(monto_reembolsado + ? >= monto,'Reembolsado','Aprobado'), monto_reembolsado = monto_reembolsado + ?`), con parametros en el orden correcto; verificar redondeo (+-0,01, B-10) con `LEAST`/tolerancia. Ajustar la asercion de `historial.controllers.test.js:213-261`. | | |
| TASK-3.2 | **A-2 (lado pedidos)**: en `controllers/pedidos.controllers.js` `actualizarPagoTrasCancelacion` (~l.448-479) usar la misma regla por monto que TASK-3.1 y no salir en early-return cuando el estado ya es `Reembolsado` por error previo; unificar ambas rutas en `utils/reembolsos.js`. | | |
| TASK-3.3 | **A-3 / M-1**: en `controllers/admin/pedidos.controllers.js:60-71` registrar el reembolso por linea cancelada con `importeReembolsoLinea` (acumulando `monto_reembolsado`) aunque queden lineas activas, con guarda `estado IN ('Aprobado','Reembolsado')`; notificar al comprador; (DEC-004) no auto-desembolsar lineas `En camino` (l.43-50). | | |
| TASK-3.4 | **A-1**: en `confirmarPago` (`pedidos.controllers.js:130-172`) leer el carrito con `FOR UPDATE` dentro de la transaccion (`getItemsCarrito`, l.34) y leer precio y stock en la misma sentencia que bloquea `productos`; ademas, idempotencia: cabecera `Idempotency-Key` opcional almacenada en `pagos_simulados` o bloqueo `GET_LOCK` por comprador (elegir la opcion sin migracion si basta). Test de concurrencia (TASK-3.9). | | |
| TASK-3.5 | **M-2 / M-3**: (DEC-003) alinear `cancelarUnaLinea` (`pedidos.controllers.js:329`) con el historial (`compras.controllers.js:176`); `avanzarEnviosVendedor` (l.544-558) debe avanzar solo las lineas vivas ignorando las `Cancelado`. | | |
| TASK-3.6 | **M-4 / M-5**: (DEC-002) rechazar autocompra en `carrito.controllers.js` (agregar) y `confirmarPago`; en `calificaciones.controllers.js` exigir linea `Entregado`, capturar `ER_DUP_ENTRY` como 409 (no 500) y validar `vendedor_id != calificador`. | | |
| TASK-3.7 | **M-6**: en `tienda.controllers.js` (resumen l.219-226, ingresos l.287-308, dashboard l.381-392) filtrar `estado_envio <> 'Cancelado'`, igual que `admin/stats`. | | |
| TASK-3.8 | **M-7**: `eliminarCuentaComprador` (`usuarios.controllers.js:466-517`): exigir contrasena actual, resolver lineas abiertas del usuario como vendedor reutilizando `destinoPedidosVendedor` del baneo y notificar; transaccion unica. | | |
| TASK-3.9 | **Pruebas con MySQL real**: crear `backend/src/server/__tests__/integration/` (Vitest) que se **salta si no hay `TEST_DB_*`** y que corre contra una BD local desechable (nunca la compartida): reembolso proporcional 2 y 3 lineas, doble `confirmarPago` simultaneo, baneo multi-vendedor. Documentar en `docs/guias/pruebas.md` y script `npm run test:integration`. | | |

### Implementation Phase 4 - Seguridad backend (M-8..M-16, H4-H10, bajos)

- GOAL-004: cerrar el endurecimiento pendiente sin romper clientes.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-4.1 | **M-16 / H6**: invertir el default de `app.js:44` a "cerrado": `ALLOW_DESKTOP_ORIGINS = process.env.ALLOW_DESKTOP_ORIGINS === "true"` (en desarrollo se activa en `.env.example`); mantener `localhost` solo si `NODE_ENV !== "production"`. Actualizar `app.cors.test.js` y `cors.middleware.test.js`. | | |
| TASK-4.2 | **M-9 / H7**: `app.set("trust proxy", <valor por env>)`; rate limits especificos para `register`, `reset-password`, chat, reportes, seguidores y subidas; `express.json({ limit })` reducido (p. ej. 100 kb) con limite mayor solo en rutas con carga; limite por cuenta ademas de IP en login/recover; `recover` con cooldown por usuario. | | |
| TASK-4.3 | **M-8**: migracion `015_token_version.sql` (idempotente): `usuarios.token_version INT NOT NULL DEFAULT 0` y `password_changed_at`; incluirla en el JWT y compararla en `authRequired`; `restablecerPassword`, cambio de contrasena, baneo y "cerrar todas las sesiones" incrementan la version. Anadir tambien `algorithms: ["HS256"]`, `iss`, `aud` (B-4) y unificar 401 para token invalido/expirado. | | |
| TASK-4.4 | **M-10 / H10**: `utils/crypto.js`: `authTagLength: 16` explicito, AAD con `usuario_id`, KDF (HKDF/scrypt nativos de `crypto`) desde `CRYPTO_SECRET_KEY`, prefijo de version de clave (`v2:`), migracion perezosa de los fallbacks de lectura (re-cifrar al leer) y log (sin datos) cuando falle el descifrado. | | |
| TASK-4.5 | **M-11 / M-12**: migracion `016_auditoria_acciones.sql` (tabla `auditoria_acciones`: actor, accion, objetivo, detalle JSON sin datos sensibles, ip, fecha) y servicio `utils/auditoria.js`; registrar baneos, reactivaciones, cambios de cuenta bancaria (vendedor y plataforma), resolucion de reportes y desembolsos. En `admin/usuarios.controllers.js:66-115` impedir banear/eliminar a otro admin o a si mismo y proteger al ultimo admin; el cambio de cuenta bancaria de plataforma exige contrasena (step-up). | | |
| TASK-4.6 | **M-13 / H4**: en `config/multer.js` verificar magic bytes (JPEG/PNG/WEBP/GIF) con una funcion propia sin dependencias; `fileFilter` devuelve error con `httpStatus` 400/413; eliminar archivos huerfanos (`fs.unlink`) cuando el cuerpo es invalido o al reemplazar imagen (`crearReporte`, `crearProductoVendedor`, `editarProductoVendedor`); limite de subidas por usuario. | | |
| TASK-4.7 | **M-14 / M-15**: `crearReporte` deduplica por (informante, objetivo, estado abierto); chat con longitud maxima Zod, rate limit y paginacion (`obtenerConversacion`); enumeracion: `register` responde uniforme (email de aviso al existente), `directorio` no filtra por email, respuestas 403/404 uniformes en `PATCH /pedidos/:id/estado` y `GET /chat/mensajes/:id`. | | |
| TASK-4.8 | **H8 / H9 / H5**: maximo de contrasena (<= 72 bytes) en `auth.schemas.js`; `config/db.js` aborta con credenciales por defecto tambien sin `NODE_ENV`; igualar el tiempo de login existente/inexistente (hash ficticio). | | |
| TASK-4.9 | **Bajos backend**: `errorHandler` respeta `err.status`/`statusCode` (400 JSON malformado, 413, errores de multer); `req.body ?? {}` en controladores que desestructuran; no loguear el objeto `error` completo de mysql2 (`usuarios.controllers.js`) ni el email en `mailer.js:19`; reset atomico (`UPDATE ... WHERE token=? AND expira>NOW()` y revisar `affectedRows`) con indice en `token_recuperacion`; `GET /tienda/mi-cuenta-bancaria` y el upsert devuelven numero enmascarado por defecto (B-5); quitar `email_comprador` del historial de ventas (B-6); paginacion en listados (B-7); `escapeLike` en `productos`, `tienda` y `directorio` (B-8); carrito: coercion numerica antes de sumar (B-9). | | |
| TASK-4.10 | **A3 / A4 del informe previo**: extraer `buscar*/build*Record/upsert` de cuenta bancaria a `utils/cuentaBancaria.js` y usarlo en `tienda.controllers.js` y `admin/cuentaBancaria.controllers.js`; mover `validarId` a `utils/ids.js` en `chat` y `notificaciones`; eliminar `asyncHandler` y `multer.chat.js` (codigo muerto, ver DEC-001) y `JWT_SIGNING_KEY` si no firma. | | |
| TASK-4.11 | **Rendimiento (bajos)**: en `authRequired` combinar lista negra + `activo` + roles en una consulta/cache corta; purga de `tokens_invalidados` (EVENT en TASK-7.4). | | |

### Implementation Phase 5 - Frontend web (A-5, F4, M-20..M-22, M-27, M-28 y bajos)

- GOAL-005: sesion consistente, rutas protegidas y cobertura de pruebas.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-5.1 | **A-5**: en `frontend/src/api/client.js:59-69` tratar el 401 como "sesion caducada" solo si habia token/usuario guardado y la ruta no es publica; no redirigir desde rutas publicas. Montar `NotificacionesEnVivo` y las llamadas de `Header.jsx` (~l.51-64) solo con `getCurrentUser()`. Tests: 401 anonimo no redirige; 401 con sesion limpia y redirige. | | |
| TASK-5.2 | **F4 / M-8 (DEC-005)**: quitar el Bearer de `localStorage` en web (`IniciarSesion.jsx`, `client.js`): usar solo la cookie httpOnly + `credentials: "include"`, guardar solo datos no sensibles del usuario; CSRF: `SameSite=Lax` basta para JSON mas verificacion de `Origin` en el backend para metodos mutantes. Logout invalida cookie y `token_version`. | | |
| TASK-5.3 | **M-22**: crear `RutaProtegida` (sesion) y `RutaProtegidaRol` en `frontend/src/components/globales/`; aplicar a `/profile`, `/orders`, `/store`, `/history`, `/settings`, `/cart`, `/messages*`; confirmar rol con `/api/usuarios/me` antes de renderizar rutas de vendedor/admin; filtrar `Navbar.jsx:37-55` por rol. | | |
| TASK-5.4 | **M-20 / M-21**: `PerfilPublico.jsx`: filtrar productos por `vendedor_id` (agregar parametro `vendedor_id` a `GET /api/productos` + Zod + OpenAPI) en vez de `LIKE` por nombre; llamar `listarSiguiendo()` solo con sesion. | | |
| TASK-5.5 | **M-28**: tokenizar/limitar datos de tarjeta: enviar solo los ultimos 4 digitos y marca (la pasarela es simulada) y no registrar el numero; ajustar `pedidos.controllers.js:25,131`, Zod `pedidos.schema.js` y `PasarelaPago.jsx:57-62`. | | |
| TASK-5.6 | **Bajos frontend**: cancelacion/ignorar respuestas viejas en `Inicio.jsx` y `Pedidos.jsx`; `try/catch` en `tema.js` y `client.js` para `localStorage`; limpiar `sessionStorage` del chat al logout; `Reportar.jsx` envia todos los archivos o limita a uno con aviso y valida tipo/tamano; `Ajustes.jsx:120-129` y `PerfilVendedor.jsx` conectar a la API real o retirar el mensaje de exito falso; code-splitting (`React.lazy`) para bajar el chunk de 587 kB; consolidar `mapearProducto/resolverAvatar/calcularPrecioFinal`; borrar modulos sin referencias; `eslint-plugin-jsx-a11y` (version exacta) y correcciones a11y basicas; `Carrito.jsx` responsivo; imagenes de terceros -> avatar local por defecto. | | |
| TASK-5.7 | **M-27**: pruebas nuevas (Vitest + Testing Library, patron de `Carrito.test.jsx`): login/registro/recuperar, `client.js` (401, `success:false`), guards, `NotificacionesEnVivo`, `Header`, `Tienda`, `Pedidos`, `Chats`, `Ajustes`, servicios principales. Meta: pasar de 7 archivos a cobertura Lines >= 70 %. | | |

### Implementation Phase 6 - Escritorio y movil (A-4, M-17..M-19, M-23..M-26)

- GOAL-006: cerrar XSS residual, endurecer Electron y la app movil.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-6.1 | **M-17 / M-18**: `apps/escritorio/src/app.js`: aplicar `escHtml`/`imgSrcSafe` en `verDetalleHistorial` (~l.1314+), `absImg(r.evidencia_url)` (~l.782), badge `${est}` (~l.2326); sustituir los `onclick` inline por delegacion de eventos con `data-*` + `addEventListener` (l.1667-1683, 2404, 2408, 2557, 2701). | | |
| TASK-6.2 | **M-19**: `apps/escritorio/main.js`: `sandbox: true` y `webSecurity: true` explicitos, `setWindowOpenHandler` (denegar) y `will-navigate` (solo origen propio), registrar `ipcMain` fuera de `createWindow` validando `event.senderFrame`, CSP `<meta>` estricta en `src/index.html` (`script-src 'self'`, fuentes locales); actualizar Electron a la version estable vigente (version exacta, `npm ci`) y banner con `app.getVersion()`. | | |
| TASK-6.3 | **A-4**: `apps/movil/android/app/build.gradle`: leer `storeFile/storePassword/keyAlias/keyPassword` de `gradle.properties` local o `System.getenv`, fallar con mensaje claro si faltan; sin valores en el repo. | | |
| TASK-6.4 | **M-23 / M-24 / M-25**: `apps/movil/www/app.js`: `clearSession` borra todas las claves `commercity_*`; no persistir dato personal innecesario; `COMMERCITY_API_URL` por build/entorno, HTTPS obligatorio en release; `network_security_config.xml` con cleartext solo en debug; CSP `<meta>` en `index.html` (escritorio y movil); quitar `user-scalable=0`; `rel="noopener noreferrer"` en `target="_blank"`; eliminar `require('electron')` residual. | | |
| TASK-6.5 | **M-26 / M-GIT**: mover `apps/movil/.github/workflows/ios-build.yml` a `.github/workflows/ios-build.yml` en la raiz con `permissions: contents: read`, acciones fijadas por SHA, `npm ci`, `-project App.xcodeproj` y disparador en `PREVIEW` y PR. | | |
| TASK-6.6 | **Info**: unificar politica de contrasena minima (8) en escritorio (`app.js:1151`); no guardar el token de reset recibido por `/recover` si el backend lo devuelve solo en desarrollo; alinear `MARKETING_VERSION` iOS con `VERSION`. | | |

### Implementation Phase 7 - Base de datos y migraciones (A-6, M-DB-1..M-DB-7)

- GOAL-007: esquema reproducible, seguro de ejecutar y alineado con el codigo.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-7.1 | **A-6**: `schema_commercity.sql` y `seed_commercity.sql`: nombre por defecto `commercity_dev`; guarda al inicio que aborta si la BD objetivo es `commercity_v2` sin variable de sesion `@permitir_destructivo = 1`; documentar en README. | | |
| TASK-7.2 | **M-DB-1**: `datos_bancarios.titular_nombre` a `VARCHAR(255)` (o `TEXT`) y `banco` a `VARCHAR(100)` en schema + migracion `017_datos_bancarios_longitudes.sql` idempotente (`information_schema`). | | |
| TASK-7.3 | **M-DB-2**: corregir `012_normalizar_imagenes_productos.sql`: crear la tabla de respaldo antes de `START TRANSACTION`, rollback completo por ids explicitos, retirar el soft-delete por nombre en produccion o mover a script manual documentado. | | |
| TASK-7.4 | **M-DB-3 / M-DB-4**: hacer idempotentes `013` y `014` (guardas `information_schema`), backfill `monto_reembolsado = monto WHERE estado='Reembolsado'`; crear `schema_migrations` (ledger: id, aplicada_en, checksum) y script de aplicacion ordenada; consolidar en `schema_commercity.sql` el EVENT `limpiar_carritos_inactivos`, un EVENT de purga de `tokens_invalidados`, los indices FULLTEXT (`productos`, `usuarios`) y los indices compuestos (`notificaciones(usuario_id, estado)`, `productos(eliminado_por_admin, estado, fecha_publicacion)`); documentar `event_scheduler=ON`. | | |
| TASK-7.5 | **M-DB-5**: `calificaciones_vendedores` -> `UNIQUE (pedido_id, vendedor_id)` (migracion `018_...sql`) y manejo de duplicado en TASK-3.6. | | |
| TASK-7.6 | **M-DB-6**: seed coherente: cuentas bancarias cifradas con el formato `iv:tag:dato` generadas por script, estados de linea y pago consistentes con `confirmarPago`, `url_redireccion` vigentes, sin tablas muertas. | | |
| TASK-7.7 | **Bajos schema**: `DEFAULT CHARSET utf8mb4` explicito; `reportes` -> `ON DELETE SET NULL`/`RESTRICT` (los reportes no se borran); retirar tablas muertas (`etiquetas`, `producto_etiquetas`, `calificaciones_productos`) o documentarlas; documentar el drift residual con la BD real (`estado_pedido`, `producto_variantes`, `imagen_url`). | | |
| TASK-7.8 | **DEC-001 (M-DB-7)**: eliminar `config/multer.chat.js`; actualizar RF105 en `.trae/rules/revision-requerimientos.md` y docs si se mantiene sin adjuntos. | | |

### Implementation Phase 8 - Documentacion, versionado, DevOps e historial (M-DOC-1/2, M-OPS-1, M-GIT-1)

- GOAL-008: documentacion veraz y entorno reproducible.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-8.1 | README raiz y de apps: conteos reales de pruebas, tabla de dependencias con versiones vigentes, `CORS_ALLOWLIST` (no `CORS_ORIGINS`), `NODE_ENV`/`ALLOW_DESKTOP_ORIGINS`, comandos de carga de SQL compatibles con PowerShell (`Get-Content ... | mysql`), quitar referencias a archivos inexistentes. | | |
| TASK-8.2 | CHANGELOG: recuperar la entrada del lote P0+P1 perdida en el merge `f5451d0` (RF140, migraciones 013/014, reembolso proporcional) y anadir la entrada del lote de esta auditoria con plantilla canonica. | | |
| TASK-8.3 | **CI raiz** `.github/workflows/ci.yml`: backend (`npm ci`, `npm run test:coverage`, `npm audit --omit=dev`) y frontend (`npm ci`, `lint`, `test:coverage`, `build`) en PR y push a `PREVIEW`/`main`; `permissions: contents: read`; acciones fijadas por SHA; sin secretos; tests de integracion con servicio MySQL efimero. | | |
| TASK-8.4 | `Dockerfile` backend multi-stage + `docker-compose.yml` de desarrollo con MySQL local (`commercity_dev`), healthcheck `GET /health` con `SELECT 1` a la BD (nuevo endpoint documentado en Zod/OpenAPI). | | |
| TASK-8.5 | Backup/restore documentado en `docs/guias/despliegue.md` (mysqldump con usuario de solo lectura, cifrado, retencion) y versionar el script de backup (excepcion en `.gitignore` para `backend/scripts/backup.*`). | | |
| TASK-8.6 | LICENSE (DEC-007) y coherencia `backend/package.json`/README. | | |
| TASK-8.7 | Higiene de ramas: documentar ramas obsoletas (`commercycity/backend`, `REVISION`, `frontend-modulos-s1`, `limpiar-chat`) y proponer su cierre al lider (no se borra nada sin aprobacion). | | |
| TASK-8.8 | Quitar `docs/DRIVE` duplicado/forzado del indice solo si el equipo lo decide (M-GIT-1); por defecto, documentar que pesa 32,5 MB y que sus rutas largas rompen el checkout en Windows. | | |
| TASK-8.9 | **Opcional con compuerta (DEC-006)**: plan de reescritura de historial con `git filter-repo` para eliminar el volcado SQL, `backend/node_modules`, `uploads/` y credenciales. Requiere aprobacion explicita del lider, ventana de congelamiento, backup espejo (`git clone --mirror`), re-clonado de todos los colaboradores y force-push coordinado. **No se ejecuta como parte de este plan.** | | |

### Implementation Phase 10 - PREVIEW como unica rama con todas las apps

- GOAL-010: que `PREVIEW` sea la unica rama de integracion con backend, web, escritorio y movil, con una "funcion" de control que lo mantenga asi. Se ejecuta **despues de las Fases 3-6** (para portar el movil sobre el contrato ya corregido) y **antes de la Fase 9** (el bump y la reauditoria cubren el resultado).

**Diagnostico verificado (solo lectura)**
- `PREVIEW` ya es un monorepo (`backend/`, `frontend/`, `apps/escritorio/`, `apps/movil/`), pero el movil se sigue desarrollando en un repo aparte (`BLACK-CODE-JSB/COMMERCITY-2.0-MOBILE-`) con **historia independiente, sin ancestro comun** con `PREVIEW`: `movil/main` (8 commits unicos) y `origin/preview-movil` (11 unicos, ultimo 2026-10-09).
- Contenido: `apps/movil` en `PREVIEW` es un subconjunto del repo movil; **solo 8 archivos difieren**: `android/app/build.gradle`, `android/app/src/main/AndroidManifest.xml`, `package.json`, `package-lock.json`, `README.md`, `www/api.js`, `www/app.js`, `www/index.html`. `PREVIEW` tiene el endurecimiento (sin datos bancarios, `allowBackup=false`, 2026-10-05); el repo movil tiene la integracion real con la API (login JWT, catalogo dinamico, RF4, v1.29.11, 2026-09/10) que `PREVIEW` no tiene. Hoy ninguna rama contiene todo.
- 24 ramas remotas. Con **0 commits unicos** (ya integradas): `commercycity/feature/{borrar-ventana-de-vite,hero,navbar,web-integracion-api,seguidores-perfil-publico-tema}`, `commercycity/{master,prueba-backend}`, `origin/main`, `origin/fix/auditoria-preview-2026-10-05`. **Duplicadas** (mismo tip `b18d495`, 5 commits de agosto de Diego): `commercycity/main`, `feature/api-rest`, `feature/editar-producto-drawer`, `integrar-diego`. Con trabajo propio sin integrar: `commercycity/REVISION` (6, descartada por contrato incompatible), `commercycity/backend` (8), `commercycity/limpiar-chat` (1), `commercycity/feature/frontend-modulos-s1` (2), `fix/command-code-write-eof-resiliente` (2, herramienta local), `origin/preview-movil` (11) y `movil/main` (8).

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-10.1 | **Funcion de inventario** `tools/ramas-estado.mjs` (Node sin dependencias, solo lectura, `git` por `child_process`): para cada rama remota/local calcula commits unicos y faltantes frente a `PREVIEW`, fecha, autor del ultimo commit y tips duplicados; clasifica `INTEGRADA` (0 unicos), `DUPLICADA`, `PENDIENTE` (unicos) u `OBSOLETA` (>60 dias); imprime tabla Markdown y con `--check` sale con codigo 1 si hay ramas `PENDIENTE`/`OBSOLETA` fuera de la lista permitida (`tools/ramas-permitidas.json`). No borra ni modifica nada. Excepcion en `.gitignore` para `tools/`. | | |
| TASK-10.2 | **Politica de ramas** en `docs/guias/contribucion.md` y README: `PREVIEW` unica rama de integracion; `feature/*` y `fix/*` cortas, creadas desde `PREVIEW`, entran por PR y se borran al mergear; `main` solo puntero de release por fast-forward con tag `vX.Y.Z` (DEC-008); prohibido mantener ramas o repos paralelos por app. | | |
| TASK-10.3 | **Traer el movil a `apps/movil`** (DEC-009): por cada uno de los 8 archivos, merge de 3 vias (base = estado de `apps/movil` en la importacion inicial; A = `PREVIEW` actual; B = `origin/preview-movil`) con `git merge-file` y revision manual. Reglas: conservar el endurecimiento de `PREVIEW` (sin datos bancarios, `allowBackup=false`, sin credenciales de firma, TASK-6.3/6.4) y adoptar la integracion de API de preview-movil (login JWT, catalogo dinamico, flujo RF4 sin la clave extra `nuevaPassword`). **No importar**: `android/app/commercity.keystore`, `*.pdf`, `SRS_*`, `Guion_*`, `assets/audio_*`, `www/index_original.html`, scripts de debug. `test_e2e_backend.js` solo si aporta, movido a `apps/movil/tests/`. Un commit por tema, con la autoria de los cambios indicada en el mensaje (Jhon Jairo Parra / Daniel Palacios). | | |
| TASK-10.4 | **Alinear movil y escritorio con el backend ya corregido**: verificar rutas, cuerpo de `reset-password`, login (Bearer; cookie solo web, DEC-005) y tarjeta enmascarada (TASK-5.5) contra `docs/api/openapi.json`; script `apps/movil/tests/contrato.mjs` y `apps/escritorio/tests/contrato.mjs` que validan las llamadas del cliente contra el OpenAPI **sin levantar servidor**. | | |
| TASK-10.5 | **Congelar el repo movil independiente**: tras TASK-10.3, entregar al propietario del repo movil un texto para su README ("desarrollo movido a `PREVIEW/apps/movil`") y la peticion de pasarlo a solo lectura/archivado. Claude no modifica ni empuja a ese repo (no es del usuario). | | |
| TASK-10.6 | **Funcion de control en `PREVIEW`**: workflow `.github/workflows/rama-unica.yml` (permisos `contents: read`, acciones fijadas por SHA, sin secretos ni tokens entre repos) que en PR a `PREVIEW` y semanalmente (`schedule`) ejecuta `tools/ramas-estado.mjs --check` y `tools/verificar-version.mjs` (TASK-10.9) y falla o abre aviso si: (a) existen ramas con commits no integrados fuera de la lista permitida; (b) `VERSION`, `backend/package.json`, `apps/*/package.json`, `MARKETING_VERSION` y `versionName` no coinciden; (c) `apps/movil` o `apps/escritorio` no compilan/lintean. | | |
| TASK-10.7 | **Un solo pipeline para todas las apps** (ampliacion de TASK-8.3): `ci.yml` con jobs `backend`, `frontend`, `escritorio` y `movil` y filtros `paths:` por carpeta, de modo que un PR a `PREVIEW` valide solo lo tocado y `PREVIEW` en conjunto siempre quede verde. | | |
| TASK-10.8 | **Auxiliar de sincronizacion manual** `tools/traer-movil.mjs` (DEC-009): `git fetch movil`, lista los commits del repo movil aun no portados (por patch-id) y genera por archivo el diff contra `apps/movil` para revision; no hace merge ni push. Alternativa descartada: Action con PAT entre repos (secreto de larga vida, ver ALT-006). | | |
| TASK-10.9 | **Version unica (DEC-010)**: `tools/sync-version.mjs` escribe la version de `VERSION` en `backend/package.json`, `apps/escritorio/package.json`, `apps/movil/package.json`, `MARKETING_VERSION` (iOS) y `versionName` (Android); `tools/verificar-version.mjs` falla si hay desfase o si queda la version anterior en textos. Reemplaza los literales (banner del escritorio `main.js:31`, etc.) por lectura dinamica. | | |
| TASK-10.10 | **Archivar y retirar ramas (con aprobacion explicita por rama, SEC-003)**: primero crear tags `archive/<rama>` que conservan el commit (reversible) y despues eliminar. En `origin` (repo propio): `fix/auditoria-preview-2026-10-05`, `main` obsoleta tras DEC-008, `feature/docs-api-zod-openapi` y `fix/*` una vez integradas, `preview-movil` tras TASK-10.3. En local: `feature/api-rest`, `integrar-diego`, `feature/seguidores-perfil-publico-tema`, `fix/auditoria-preview-2026-10-05` (ya integradas/duplicadas). En `commercycity` (repo de Diego): **solo se propone** la limpieza y se entrega la lista; no se borra nada ahi. | | |
| TASK-10.11 | **Proteccion de `PREVIEW`** (la configura el propietario del repo en GitHub; Claude entrega el checklist): PR obligatorio, 1 revision, CI verde, sin force-push ni borrado de la rama, `CODEOWNERS` por carpeta (`backend/`: Diego; `frontend/` y `apps/escritorio/`: Daniel; `apps/movil/`: Jhon), prohibido subir `.env`, keystores y dumps (secret scanning / push protection). | | |

### Implementation Phase 9 - Cierre, versionado y reauditoria

- GOAL-009: dejar el lote verificado y versionado.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-9.1 | **Bump de version + banner + CHANGELOG (VER-001)**: `VERSION` 1.2.0 -> 1.3.0; `backend/package.json` y `package-lock.json` sincronizados; banner dinamico de `GET /` y de `server.js` (leer la version del `package.json`, sin literal); `frontend/src/constants/*.css` (`@version`); `apps/*/package.json` y `MARKETING_VERSION` coherentes; README (bloque "Referencia generada desde Zod (v1.2.0)"); entrada en `docs/CHANGELOG.md`; regenerar `docs/api/openapi.json` y `docs/api/entidades.md`. Buscar `1.2.0` en el repo y confirmar que no queda texto obsoleto. | | |
| TASK-9.2 | Reauditoria: repetir la revision con `full-project-auditor` sobre la rama de fix y generar `docs/informes/INFORME_REAUDITORIA_PREVIEW_<fecha>.md` con la tabla de cierre de cada ID. | | |
| TASK-9.3 | Promocion: preparar el PR/cherry-pick hacia `PREVIEW` de Diego (excluyendo el hunk de CHANGELOG, CON-001) y esperar autorizacion explicita antes de cualquier push. | | |

## 3. Alternatives

- **ALT-001**: aplicar los fixes sobre `commercycity/PREVIEW` (`4d1873c`). Descartada por decision del usuario: obliga a rehacer arreglos ya presentes en la rama actual (tests de `client.js`, reporte de usuarios, rating) y a resolver conflictos despues.
- **ALT-002**: reescribir el historial ya (R-2/M-GIT-1). Descartada por riesgo y por requerir coordinacion del equipo; queda como TASK-8.9 con compuerta. La rotacion de credenciales (Fase 0) mitiga el riesgo real sin tocar el historial.
- **ALT-003**: dejar el Bearer en `localStorage` y solo escapar XSS. Descartada: mantiene el robo de sesion ante cualquier XSS; se prefiere cookie httpOnly (DEC-005).
- **ALT-004**: usar `mysql2.execute` para toda la capa. Descartada en este lote (cambio transversal de bajo beneficio; hoy no hay inyeccion); se anota como mejora (B-15).
- **ALT-005**: libreria externa para magic bytes (`file-type`). Descartada: funcion propia de ~30 lineas evita dependencia nueva (SEC-002).
- **ALT-006**: sincronizar automaticamente el repo movil hacia `PREVIEW` con una GitHub Action y un PAT entre repos. Descartada: exige un secreto de larga vida con acceso a otro repo y un merge automatico de historias no relacionadas; se prefiere el port selectivo (TASK-10.3) y el auxiliar manual de solo lectura (TASK-10.8).
- **ALT-007**: `git subtree add/pull` del repo movil dentro de `apps/movil`. Descartada: arrastra el keystore, los PDF y el audio al historial del monorepo y duplica 11 commits sin ancestro comun.
- **ALT-008**: mantener `main` y `PREVIEW` como lineas paralelas de integracion. Descartada: es la causa de que hoy existan 12/15/149 commits de diferencia entre ramas; DEC-008 deja una sola.

## 4. Dependencies

- **DEP-001**: acceso del lider a la BD compartida para TASK-0.1/0.3/0.4 (rotaciones); Claude no accede a servidores remotos.
- **DEP-002**: MySQL local desechable (`commercity_dev`) para TASK-3.9 y CI.
- **DEP-003**: decisiones DEC-001..DEC-007 (defaults indicados; cambian solo las tareas citadas).
- **DEP-004**: Fase 4 y Fase 7 comparten migraciones numeradas 015-018; aplicar en orden y registrar en `schema_migrations`.
- **DEP-005**: TASK-5.2 (cookie unica) depende de TASK-4.3 (`token_version`) y de TASK-4.1 (CORS cerrado) para no abrir CSRF/CORS.
- **DEP-006**: dependencias npm nuevas permitidas: solo `eslint-plugin-jsx-a11y` (version exacta) y la actualizacion de Electron (version exacta); cualquier otra requiere aprobacion. Los scripts de `tools/` usan solo Node y `git`.
- **DEP-007**: Fase 10 depende de Fases 3-6 (contrato corregido) y de TASK-0.2 (rotacion de la firma Android); el port del movil (TASK-10.3) debe hacerse sobre el `build.gradle` ya sin credenciales (TASK-6.3).
- **DEP-008**: acciones sobre el repo movil (`BLACK-CODE-JSB`), sobre `commercycity` (Diego) y la proteccion de rama en GitHub las ejecutan sus propietarios; Claude solo entrega listas y textos.

## 5. Files

- **Backend (modificar)**: `backend/src/server/app.js`, `server.js`, `config/{db,multer}.js`, `middleware/{auth,error}.middleware.js`, `utils/{config,crypto,reembolsos,mailer,finanzas}.js`, `controllers/{pedidos,compras,carrito,calificaciones,tienda,usuarios,chat,reportes,productos}.controllers.js`, `controllers/admin/{pedidos,usuarios,cuentaBancaria,reportes}.controllers.js`, `schemas/{auth,pedidos,productos,chat,tienda}.schema*.js`.
- **Backend (nuevo)**: `utils/auditoria.js`, `utils/cuentaBancaria.js`, `db/015_token_version.sql`, `016_auditoria_acciones.sql`, `017_datos_bancarios_longitudes.sql`, `018_calificaciones_unique_vendedor.sql`, `backend/vitest.setup.js`, `__tests__/integration/*`, `backend/scripts/gen-seed-hashes.mjs`.
- **Backend (eliminar)**: `config/multer.chat.js`, `asyncHandler` de `error.middleware.js`.
- **Frontend**: `src/api/client.js`, `components/globales/{NotificacionesEnVivo,Header,Navbar}.jsx`, nuevos `RutaProtegida*.jsx`, `pages/{Inicio,Pedidos,Carrito,Perfil/*}`, `services/carrito.service.js`, `utils/tema.js`, `App.jsx`, tests nuevos.
- **Escritorio**: `apps/escritorio/main.js`, `preload.js`, `src/app.js`, `src/index.html`, `package.json`.
- **Movil**: `apps/movil/android/app/build.gradle`, `AndroidManifest.xml`, `res/xml/network_security_config.xml` (nuevo), `www/{app.js,api.js,index.html}`, `ios/App/App.xcodeproj/project.pbxproj`, `.gitignore`.
- **Consolidacion (Fase 10, nuevos)**: `tools/{ramas-estado,traer-movil,sync-version,verificar-version}.mjs`, `tools/ramas-permitidas.json`, `.github/workflows/{rama-unica,ci}.yml`, `apps/movil/tests/contrato.mjs`, `apps/escritorio/tests/contrato.mjs`; modificar `apps/movil/{android/app/build.gradle,android/app/src/main/AndroidManifest.xml,package.json,package-lock.json,README.md,www/api.js,www/app.js,www/index.html}`, `.gitignore`, `docs/guias/contribucion.md`, `README.md`.
- **BD y docs**: `schema_commercity.sql`, `seed_commercity.sql`, `backend/.env.example`, `.gitignore`, `README.md`, `apps/**/README.md`, `frontend/README.md`, `docs/CHANGELOG.md`, `docs/informes/*`, `docs/guias/{pruebas,despliegue}.md`, `docs/api/*` (regenerados), `VERSION`, `.github/workflows/{ci,ios-build}.yml` (nuevos), `Dockerfile`, `docker-compose.yml`, `LICENSE`.

## 6. Testing

- **TEST-001**: regresion de dinero: reembolso parcial 2 y 3 lineas (unitario con mock + integracion MySQL real), baneo multi-vendedor, cancelacion en `En camino`, redondeo +-0,01.
- **TEST-002**: concurrencia: dos `confirmarPago` simultaneos del mismo comprador generan un solo pedido (integracion).
- **TEST-003**: seguridad: CORS cerrado por defecto sin `NODE_ENV`; `token_version` invalida sesiones tras reset/baneo; `alg:none` y firma manipulada rechazadas; magic bytes rechazan archivo con extension falsa; rate limits por endpoint; enumeracion uniforme; admin no puede banear a admin.
- **TEST-004**: frontend: 401 anonimo no redirige; guards por rol; perfil publico filtra por `vendedor_id`; flujos de login/registro/recuperar; cobertura Lines >= 70 %.
- **TEST-005**: escritorio/movil: pruebas de `escHtml`/delegacion de eventos (funciones puras extraidas) y verificacion estatica (grep) de ausencia de `onclick` inline y de credenciales en `build.gradle`.
- **TEST-006**: BD: aplicar `schema_commercity.sql` + migraciones 008-018 dos veces sobre BD local limpia (idempotencia); comparar columnas usadas por el codigo contra el schema (script de la auditoria que dio 0 fantasmas).
- **TEST-008** (Fase 10): `tools/ramas-estado.mjs` sobre este repo reproduce la tabla del diagnostico (9 integradas, 4 duplicadas con tip `b18d495`, resto pendientes) y `--check` falla/pasa segun `ramas-permitidas.json`; `verificar-version.mjs` detecta un desfase provocado en un `package.json` de prueba; tras TASK-10.3, `git diff --stat origin/preview-movil -- <8 archivos>` contra `apps/movil` queda limitado a los endurecimientos conservados a proposito; `grep` confirma que no hay `*.keystore`, `*.pdf` ni credenciales de firma en el arbol; los `contrato.mjs` de movil y escritorio pasan contra `docs/api/openapi.json`; el workflow `ci.yml` valida las 4 apps en un PR de prueba.
- **TEST-007**: suite completa: backend `npm run test:coverage` (>= 95 % Lines, sin necesitar `.env`), frontend `npm run lint && npm run test:coverage && npm run build`, `npm audit` (0), `docs.routes.test.js` verde.

## 7. Risks & Assumptions

- **RISK-001**: las rotaciones de Fase 0 son humanas y bloquean el cierre real de R-1/R-2/A-4; sin ellas el codigo limpio no reduce la exposicion ya publicada.
- **RISK-002**: rotar `JWT_SECRET` o `CRYPTO_SECRET_KEY` sin respaldo vuelve a perder cuentas bancarias cifradas (ya ocurrio con 7); TASK-4.4 incluye re-cifrado perezoso y se hace **antes** de rotar claves en produccion.
- **RISK-003**: el remoto `commercycity` (Diego) solo admite push de BACKEND y exige autorizacion; este plan toca frontend/apps/BD/docs. Ningun push sin autorizacion explicita (TASK-9.3).
- **RISK-004**: TASK-5.2 (cookie unica) puede romper clientes que dependen del Bearer (escritorio/movil); por eso esas apps conservan Bearer hasta migrar (DEC-005). Probar CORS con `credentials` por origen.
- **RISK-005**: `token_version` en cada peticion agrega lectura a BD; mitigado con TASK-4.11 (consulta unica/cache corta).
- **RISK-006**: los hallazgos de concurrencia (A-1) y semantica SQL (A-2) se confirmaron por lectura de codigo, no con MySQL real; TASK-3.9 debe reproducirlos **antes** de corregir (test rojo).
- **RISK-007**: A-5 se baso en lectura del codigo; confirmar en navegador antes del fix con un test de componente.
- **RISK-008**: regla del equipo "sin CHANGELOG en PREVIEW" frente a regla global del usuario (CHANGELOG en el mismo commit): se resuelve segun CON-001.
- **RISK-010**: el port del movil mezcla dos lineas de trabajo con autores distintos (Daniel: endurecimiento; Jhon Jairo Parra: integracion de API). Posibles conflictos en `www/app.js` (~2400 lineas): resolver por tema y probar en dispositivo/emulador antes de dar por cerrado TASK-10.3 (no automatizable aqui).
- **RISK-011**: borrar ramas pierde trabajo si algun colaborador depende de ellas; por eso primero tags `archive/<rama>` y aprobacion por rama (TASK-10.10). En `commercycity` y en el repo movil no se borra nada sin su propietario.
- **RISK-012**: `main` en `commercycity` tiene 5 commits de agosto que `PREVIEW` no tiene (frontend antiguo de Diego); antes de retirar `main` (DEC-008) confirmar con el autor que estan superados.
- **RISK-013**: si se reescribe el historial de `PREVIEW` (TASK-8.9) todas las ramas y tags `archive/*` quedan desalineados; hacer la Fase 10 antes y dejar TASK-8.9 como ultima, con re-clonado general.
- **RISK-009**: cambios de contrato (`vendedor_id` en productos, tarjeta enmascarada, `Idempotency-Key`, `/health`) exigen regenerar OpenAPI y actualizar clientes en el mismo lote.
- **ASSUMPTION-001**: la contrasena trivial y las cuentas citadas en el CHANGELOG siguen vigentes en la BD compartida (no verificado: no se accedio a ningun servidor).
- **ASSUMPTION-002**: el repositorio `diegoSerna17/Commercity` es publico o accesible a terceros; si es privado, R-2 baja de severidad pero la rotacion sigue siendo necesaria.
- **ASSUMPTION-003**: los defaults de DEC-001..DEC-007 son aceptables hasta que el usuario indique lo contrario.

## 8. Orden de ejecucion y commits sugeridos

1. Fase 0 (humana) en paralelo con Fases 1-2.
2. `fix(security): saneamiento de secretos, README y .gitignore (R-1, M-GIT-1)`.
3. `fix(dinero): reembolso por monto, baneo multi-vendedor y carrera en confirmarPago (A-1, A-2, A-3)` + `test(integracion): ...`.
4. `fix(negocio): cancelacion, autocompra, calificaciones y reportes de tienda (M-1..M-7)`.
5. `fix(security): CORS cerrado, rate limits, token_version, cifrado v2, auditoria, uploads (M-8..M-16)`.
6. `fix(web): 401 global, guards por rol, cookie unica y cobertura (A-5, F4, M-20..M-28)`.
7. `fix(desktop-mobile): XSS residual, Electron endurecido, firma Android por entorno, CSP (A-4, M-17..M-26)`.
8. `fix(bd): guardas destructivas, migraciones 013-018 idempotentes y schema consolidado (A-6, M-DB-*)`.
9. `chore(ci): CI raiz, Docker, backup, LICENSE, docs (M-OPS-1, M-DOC-*)`.
10. `chore(tools): ramas-estado, sync-version y verificar-version (Fase 10)`.
11. `feat(movil): integra API real y flujo RF4 del repo movil conservando el endurecimiento (TASK-10.3/10.4)` (uno por tema, con autoria indicada).
12. `chore(ci): pipeline unico por app y control de rama unica (TASK-10.6/10.7)`.
13. `docs(ramas): politica de PREVIEW como unica rama de integracion (TASK-10.2)`.
14. `chore(release): bump 1.3.0, banner y changelog de remediacion de auditoria` (TASK-9.1).
15. Limpieza de ramas (TASK-10.10) y proteccion de `PREVIEW` (TASK-10.11): acciones aprobadas una a una; no son commits.

## 9. Related Specifications / Further Reading

- `docs/informes/INFORME_AUDITORIA_PREVIEW_2026-10-11.md` (fuente de todos los IDs) y `INFORME_AUDITORIA_PREVIEW_2026-10-05.md` (auditoria previa).
- `plan/feature-web-completar-modulos-1.md` (plantilla y contexto RF108-110).
- `.trae/rules/revision-requerimientos.md` (RF105, RF119, RF135, RF140), `cobertura-tests-por-cambio.md`, `documentacion-cambios.md`.
- `docs/api/inventario-endpoints.md`, `docs/bd/modelo-datos.md`, `docs/guias/{pruebas,despliegue,contribucion}.md`, `docs/arquitectura.md`.
- OWASP Top 10 2021 y OWASP API Security Top 10 2023 (BOLA, rate limiting, inventario).

## 10. Entrega del .md

Tras la aprobacion, este plan se copia a `plan/fix-auditoria-preview-2026-10-11.md` (carpeta `plan/` del repo, junto a `feature-web-completar-modulos-1.md`), sin commitear. Los hallazgos sin tarea propia (Bajos/Info del informe) estan cubiertos por TASK-4.9, TASK-5.6, TASK-6.6 y TASK-7.7. La consolidacion de ramas (peticion posterior del usuario) es la Fase 10; el informe de auditoria se complementa con el hallazgo del keystore versionado en el repo movil (TASK-0.2).

## 11. Cierre 2026-10-12 (rama `fix/auditoria-preview-2026-10-11`)

- Verificado por frentes: Fase 2 completa (2.1-2.6); Fase 7 completa (7.1-7.8); Fase 1 (1.1/1.3/1.4) y Fase 5 OK salvo M-28; Fase 8 cumple (8.1-8.9).
- Faltantes cerrados en este cierre: **M-28** (web unificada a `ultimos4_tarjeta`/`marca_tarjeta` con enum; movil sin PAN; `PasarelaPago.test.jsx` 5/5) — commit `1af8cb9`; **Fase 10 funcional** (`tools/ramas-estado.mjs`, `ramas-permitidas.json`, `traer-movil.mjs`, `sync-version.mjs`, `verificar-version.mjs`, `contrato.mjs` movil/escritorio, `rama-unica.yml`, CI 4 jobs, CODEOWNERS, politica PREVIEW unica) — commit `1af8cb9`; **Fase 9** (bump 1.2.0->1.3.0, `verificar-version.mjs 1.2.0` OK, OpenAPI 63 paths v1.3.0, `INFORME_REAUDITORIA_PREVIEW_2026-10-12.md`) — commit `6df7703`.
- Port movil (TASK-10.3): verificado en el arbol (login JWT, catalogo dinamico, RF4 sin `nuevaPassword`, HTTPS por entorno, `clearSession` total, tarjeta enmascarada); el diff amplio de UI se revisa con `traer-movil.mjs` y exige prueba en dispositivo (RISK-010).
- Pendientes que exigen humanos (no ejecutables aqui): Fase 0 (rotaciones), TASK-10.5/10.10/10.11 (propietarios de repos), TASK-9.3 (promocion a `commercycity/PREVIEW` con autorizacion explicita, excluyendo CHANGELOG por CON-001), M-27 (reporte global 70% Lines), idempotencia MySQL real e idempotencia de migraciones.
