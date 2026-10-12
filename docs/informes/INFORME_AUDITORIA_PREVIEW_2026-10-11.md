# INFORME DE AUDITORIA COMPLETA - RAMA PREVIEW (CommerCity) - 2026-10-11

- **Repositorio auditado**: `diegoSerna17/Commercity`, rama `PREVIEW`.
- **Commit exacto**: `4d1873c` (2026-10-07). Verificado con `git ls-remote`: es la punta actual de `PREVIEW` en GitHub.
- **Fuera de alcance**: la rama de trabajo local `feature/docs-api-zod-openapi` y `origin/PREVIEW` (fork propio, `ec482bb`, 15 commits por delante). El commit `ec482bb` (reporte de usuarios, ver perfil desde chats, fix de rating RF108/109/110) **no esta en este snapshot**.
- **Metodologia**: skill `full-project-auditor` (10 fases) con tres revisiones de codigo en paralelo (backend; frontend y apps cliente; BD, documentacion e historial git), mas ejecucion dinamica en un worktree aislado. Los hallazgos criticos y altos se verificaron leyendo el codigo; los demas provienen de lectura de los revisores.
- **Ejecucion dinamica**: `npm ci --ignore-scripts` (lockfile), `npm audit`, Vitest, ESLint y `vite build`. Sin BD, sin servidores, sin leer `.env`.
- **Limitaciones**: (1) no se probo contra MySQL real, por lo que los hallazgos de concurrencia y de semantica SQL (A-1, A-2) se confirmaron por lectura, no por reproduccion; (2) los hallazgos de UI (N-1) son por lectura, la app no se ejecuto; (3) `docs/DRIVE` se excluyo del checkout por rutas demasiado largas para Windows y se reviso con `git ls-tree`/`git show`; (4) la existencia y vigencia de cuentas o BD compartidas citadas en la documentacion no se comprobo (no se accedio a ningun servidor).
- **Secretos**: este informe no reproduce contrasenas, claves, IPs ni usuarios de BD. Donde hay un secreto se indica archivo/commit y que debe **rotarse**.

---

## 1. Resumen ejecutivo

| Area | Veredicto | Hallazgos principales |
|---|---|---|
| Seguridad backend (acceso, SQL, JWT) | **BUENO** | Sin IDOR/BOLA ni inyeccion SQL abiertos; 72 endpoints revisados. Endurecimiento pendiente (rate-limit, sesiones, CORS por defecto). |
| Logica de dinero (reembolsos, pago) | **DEFICIENTE** | 3 Altos: doble conteo en el reembolso por monto, carrera en `confirmarPago`, baneo sin reembolso de lineas. Tests con MySQL mockeado no los detectan. |
| Frontend web | **ACEPTABLE** | Sin `innerHTML`/XSS en React. Bug de disponibilidad por el 401 global (Alto). 2 tests rotos, 1 error de lint, cobertura minima (4 archivos de test). |
| Apps escritorio y movil | **ACEPTABLE** | RCE de la auditoria previa cerrado. XSS residuales en Electron; credenciales de firma Android en el repo. |
| Base de datos y migraciones | **ACEPTABLE** | Esquema alineado con el codigo (0 columnas fantasma en 389 referencias). Migraciones 012-014 con problemas; drift documentado con la BD real. |
| Secretos e historial git | **CRITICO** | Contrasena trivial publicada para cuentas reales; volcado de BD con PII en el historial; peso excesivo (node_modules, uploads). |
| Dependencias npm | **BUENO** | `npm audit`: 0 vulnerabilidades (backend y frontend, con y sin dev). |
| Testing | **ACEPTABLE** | Backend 409/409, Lines 95,41 %; pero requiere `JWT_SECRET` en el entorno y no valida SQL real. Frontend 15/17. |
| DevOps / CI | **DEFICIENTE** | No hay CI efectivo en la raiz; sin Docker, backup ni LICENSE. |
| Documentacion y versionado | **DESALINEADO** | README/CHANGELOG obsoletos frente al codigo; versiones inconsistentes. |

**Conteo (consolidado, sin duplicados)**: 2 Criticos, 6 Altos, 40 Medios (secciones 6) y una lista de Bajos/Info (seccion 7).

**Prioridad de remediacion**: (1) rotar credenciales y contrasenas triviales publicadas y decidir sobre el historial git; (2) corregir la logica de reembolsos y `confirmarPago` y probarla contra MySQL real; (3) arreglar el 401 global; (4) rotar claves de firma Android; (5) cerrar el CORS por defecto, CI, tests y documentacion.

---

## 2. Resultados de ejecucion (evidencia)

| Comprobacion | Resultado |
|---|---|
| `npm ci` backend / frontend | OK (211 / 259 paquetes) |
| `npm audit` backend (con y sin `--omit=dev`) | 0 vulnerabilidades |
| `npm audit --omit=dev` frontend | 0 vulnerabilidades |
| Backend `vitest run --coverage` **sin** `JWT_SECRET` | **7 de 24 archivos fallan** (`process.exit(1)` en `utils/config.js:17`); 318 tests pasan |
| Backend `vitest run --coverage` con `JWT_SECRET` de relleno en el entorno | **24/24 archivos, 409/409 tests**; Statements 94,94 %, Branches 86,97 %, Functions 100 %, Lines 95,41 % |
| Frontend `eslint .` | **1 error**: `no-unused-vars` en `src/services/carrito.service.js:8` (`_compradorId`) |
| Frontend `vitest run` | **15/17 pasan; 2 fallan** en `src/api/client.test.js` (el cliente agrego `credentials: "include"` y las aserciones comparan el objeto exacto) |
| Frontend `vite build` | OK. Un chunk JS de ~587 kB supera el aviso de 500 kB |

Notas: el README afirma 328 pruebas / 22 archivos; hoy son 24 archivos y 409 pruebas. La cifra "370/370, Lines 93,75 %" solo aparece en un commit revertido (`dabec3e` revertido por `f973017`).

---

## 3. Estado de los hallazgos de la auditoria previa (2026-10-05)

| ID | Tema | Estado | Evidencia |
|---|---|---|---|
| H1 | IDOR carrito | **Cerrado** | `routes/carrito.routes.js:15-18` con `authRequired`; controlador usa `req.userId`; hay tests de regresion. |
| H2 | `/uploads` publico | **Cerrado (matiz)** | `app.js:59-67`: solo imagenes por GET son publicas; el resto exige JWT. La evidencia de reportes es imagen y por tanto publica (nombre aleatorio de 128 bits). |
| H3 | Token de reset en claro / log | **Cerrado** | Se guarda SHA-256; un solo uso; 5 min. Residuo: `mailer.js:19` registra el email. |
| H4 | Multer extension/nombres | **Parcial** | Nombres aleatorios y 5 MB; sigue sin magic bytes y los errores de multer devuelven 500. |
| H5 | Enumeracion de usuarios | **Parcial** | Login uniforme; `register` aun revela "email ya registrado"; `directorio` filtra por email. |
| H6 | CORS `null`/`file://` | **Parcial** | `app.js:43` los permite siempre que `NODE_ENV !== "production"` (fail-open si falta la variable). |
| H7 | Rate-limit | **Parcial** | Limite global 200/15 min en `/api/`; sin limites especificos ni `trust proxy`. |
| H8 | Password minima | **Cerrado** | 8 caracteres con letra y numero. Falta maximo (bcrypt trunca a 72 bytes). |
| H9 | Defaults `root` en BD | **Parcial** | `config/db.js` solo aborta en produccion. |
| H10 | `JWT_SECRET` como clave AES | **Parcial** | Derivacion separada, pero por defecto sale de `JWT_SECRET`; fallbacks de lectura permanentes. |
| A1 | Columnas GENERATED vs RF140 | **Cerrado** | Columnas normales en `schema_commercity.sql:188-189`. |
| A2 | Filtro `archivado` | **Cerrado** | `admin/reportes.controllers.js:12-20`; `getReporte` por id aun devuelve archivados. |
| A3 | Duplicacion cuenta bancaria | **Parcial** | Schema Zod unificado; persisten `buscar*/build*/upsert` duplicados. |
| A4 | `actualizarEstado`, `validarId`, `asyncHandler` | **Parcial** | `actualizarEstado` ~90 lineas (cerrado); `chat` y `notificaciones` aun importan `validarId` via `admin.utils`; `asyncHandler` sigue muerto. |
| F1-F3 | XSS + `nodeIntegration` = RCE (escritorio) | **Cerrado (RCE); XSS residuales** | `main.js:13` con `nodeIntegration:false`, `contextIsolation:true` y preload minimo. Quedan puntos sin escapar (N-3, N-4). |
| F4 | JWT en `localStorage` | **Abierto** | El backend ya emite cookie httpOnly, pero los clientes siguen guardando y leyendo el Bearer en `localStorage`. |
| F5 | Datos bancarios en movil / `allowBackup` | **Cerrado** | `allowBackup=false`; no se persisten datos bancarios. |
| F6 | Contrato de API | **Parcial** | Cliente unico y 401 global, pero el 401 global introduce un bug (N-1). |
| B1 | Objetos usados sin definicion | **Cerrado** | Definidos en `schema_commercity.sql`. Salvedad: `banco` VARCHAR(50) frente a 100 en la BD real. |
| B2 | RF119 / RF140 en el esquema | **Cerrado** | `pedidos.estado_pedido` retirado del schema. |
| B3 | Migraciones 009/012 | **Parcial** | 009 corregida e idempotente; 012 no es atomica (M-DB-2). |

---

## 4. Hallazgos CRITICOS

### R-1 - CRITICO: contrasena trivial publicada para cuentas reales y de seed
- **Ubicacion**: `docs/CHANGELOG.md:760` (documenta cuentas admin reales de la BD compartida con su contrasena); `apps/README.md:48-54`, `apps/escritorio/README.md:29-35`, `apps/movil/README.md:46-52`, `frontend/README.md:39-43` (usuarios de prueba admin/vendedor/comprador con la misma contrasena de 6 digitos).
- **Evidencia**: los 20 hashes de `seed_commercity.sql` corresponden a esa contrasena (comprobado con `bcrypt.compare`). El encabezado del seed afirma que la contrasena se comunica fuera del repo; es falso. El README raiz la retiro (commit `ad805d9`) pero los demas no.
- **Impacto**: toma de cuentas administrador en cualquier instancia que use el seed o la BD compartida; vendedores y compradores incluidos.
- **Recomendacion**: **rotar ya** las contrasenas de las cuentas admin y de seed en toda BD compartida; eliminar la contrasena de README y CHANGELOG; generar el hash del seed desde una variable o forzar cambio en el primer login.

### R-2 - CRITICO (si el repositorio es publico): volcado de BD con PII en el historial de PREVIEW
- **Ubicacion**: commit `e6355a8` (2026-08-10) agrego `LAST VERSION/2/commercity_v2.sql` (345 KB). Otros commits agregaron `LAST VERSION/seed_commercity.sql` y `schema_commercity_3.sql`. Un commit posterior los quito del arbol, pero siguen recuperables del historial.
- **Contenido (segun el revisor)**: 183 usuarios con email y hash bcrypt (174 equivalen a la contrasena trivial de R-1), `datos_bancarios`, mensajes, reportes y pedidos con direcciones.
- **Recomendacion**: asumir datos y hashes comprometidos; forzar reseteo de contrasenas; si se quiere purgar, reescribir el historial (`git filter-repo`) con aprobacion explicita y coordinando a todos los colaboradores.

---

## 5. Hallazgos ALTOS

### A-1 - ALTO: `confirmarPago` admite doble pedido por concurrencia
- **Ubicacion**: `backend/src/server/controllers/pedidos.controllers.js:147` (lee el carrito sin `FOR UPDATE`) y `:164-172` (bloquea `productos` despues).
- **Hallazgo**: dos peticiones simultaneas (doble clic, replay) leen el mismo carrito; la segunda espera el bloqueo de productos y, al liberarse, crea un segundo pedido con la lista antigua si el stock alcanza. No hay clave de idempotencia. El precio se lee antes de bloquear los productos (TOCTOU con edicion de precio).
- **Recomendacion**: `SELECT ... FROM carrito_items WHERE comprador_id = ? FOR UPDATE` dentro de la transaccion, leer precio y stock en la misma sentencia bloqueante, y agregar idempotency-key o bloqueo por comprador.
- **Verificacion**: confirmado por lectura del orden de consultas; no reproducido con MySQL real.

### A-2 - ALTO: reembolso por monto cuenta el importe dos veces y marca `Reembolsado` de forma prematura
- **Ubicacion**: `backend/src/server/controllers/compras.controllers.js:204-210`.
- **Hallazgo**: en `UPDATE pagos_simulados SET monto_reembolsado = monto_reembolsado + ?, estado = IF(monto_reembolsado + ? >= monto, ...)`, MySQL evalua las asignaciones de izquierda a derecha; la segunda ya ve el valor incrementado, asi que la comparacion usa `viejo + 2 x importe`. Con dos lineas iguales, cancelar una deja el pago en `Reembolsado` con solo el 50 % devuelto; despues `actualizarPagoTrasCancelacion` (`pedidos.controllers.js:465-467`) sale sin registrar el reembolso de la segunda linea.
- **Por que los tests no lo ven**: todos usan `mysql2` mockeado; `historial.controllers.test.js:213-261` fija la cadena SQL erronea.
- **Recomendacion**: escribir `estado` antes que `monto_reembolsado` en el `SET` (o calcular en JS bajo `FOR UPDATE`) y anadir un test de integracion contra MySQL real.

### A-3 - ALTO: el baneo de un vendedor no registra el reembolso de las lineas canceladas cuando el pedido conserva lineas activas
- **Ubicacion**: `backend/src/server/controllers/admin/pedidos.controllers.js:60-71`.
- **Hallazgo**: solo actualiza `pagos_simulados` si `restantes == 0`. En pedidos multi-vendedor el comprador no recibe `monto_reembolsado` ni notificacion por las lineas canceladas. El `UPDATE` de la linea 67 no tiene guarda de estado y puede sobrescribir pagos `Rechazado` o `Pendiente` como `Reembolsado`.
- **Recomendacion**: reutilizar `importeReembolsoLinea` y la logica de `reembolsos.js` por cada linea cancelada; anadir guarda de estado.

### A-4 - ALTO: credenciales de firma Android escritas en el repositorio
- **Ubicacion**: `apps/movil/android/app/build.gradle:19-23` (`signingConfigs.release`: `storePassword` y `keyPassword` literales; alias y nombre del keystore a la vista); `apps/movil/.gitignore` no excluye `*.keystore` ni `*.jks`.
- **Impacto**: quien obtenga el keystore puede firmar APK con la identidad de la app; el build release falla si falta el archivo.
- **Recomendacion**: **rotar clave y contrasenas**; leerlas de `gradle.properties` local o de variables de entorno; agregar `*.keystore`/`*.jks` al `.gitignore`.

### A-5 - ALTO: el 401 global expulsa a usuarios anonimos a `/login`
- **Ubicacion**: `frontend/src/api/client.js:59-69`; `NotificacionesEnVivo.jsx:10,65` (polling cada 7 s montado en toda la app); `Header.jsx:51-64`; endpoints en `notificaciones.routes.js:14-15` con `authRequired`.
- **Hallazgo**: cualquier 401 (con o sin sesion previa) limpia la sesion y hace `window.location.assign("/login")`. Un visitante anonimo en `/register`, `/recover` o `/restore` puede ser redirigido en el siguiente ciclo de polling (hasta 7 s); en `/` y `/vendedor/:id` lo dispara el `Header`.
- **Verificacion**: confirmado por lectura del codigo; no se ejecuto la app.
- **Recomendacion**: tratar el 401 como sesion caducada solo si habia token/usuario guardado; montar el polling y las llamadas del `Header` solo con sesion; anadir test del caso anonimo.

### A-6 - ALTO: scripts destructivos sin guarda sobre la BD con el nombre de la BD compartida
- **Ubicacion**: `schema_commercity.sql:1-23` (`CREATE DATABASE`/`USE`/`DROP TABLE` de 18 tablas) y `seed_commercity.sql:18-44` (`TRUNCATE` de 18 tablas) sobre `commercity_v2`.
- **Impacto**: ejecutarlos contra la BD compartida destruye datos; la unica proteccion es un comentario.
- **Recomendacion**: nombre por defecto distinto (`commercity_dev`) o una comprobacion que aborte si no es un entorno de desarrollo.

---

## 6. Hallazgos MEDIOS

### Backend - dinero y negocio
- **M-1**: auto-desembolso al vendedor baneado en lineas `En camino` sin confirmar entrega (`admin/pedidos.controllers.js:43-50`).
- **M-2**: politica de cancelacion inconsistente: el historial solo cancela `Pendiente` (`compras.controllers.js:176`); `PATCH /pedidos/:id/estado` tambien acepta `En camino` (`pedidos.controllers.js:329`), con reembolso y restitucion de stock con la mercancia en transito.
- **M-3**: tras una cancelacion parcial el vendedor no puede enviar ni entregar las lineas vivas (`avanzarEnviosVendedor`, `pedidos.controllers.js:544-558`).
- **M-4**: autocompra y autocalificacion permitidas (`carrito.controllers.js:54-127`, `pedidos.controllers.js:175-199`, `calificaciones.controllers.js`).
- **M-5**: calificacion demasiado permisiva (acepta lineas `Pendiente`/`En camino`; `UNIQUE(pedido_id)` impide calificar a mas de un vendedor por pedido, ver M-DB-5; carrera check-then-insert que acaba en 500).
- **M-6**: reportes del vendedor incluyen lineas canceladas (`tienda.controllers.js:219-226, 287-308, 381-392`); ingresos y comision sobreestimados.
- **M-7**: `eliminarCuentaComprador` ignora el rol vendedor y deja lineas `Pendiente`/`En camino` huerfanas (`usuarios.controllers.js:466-517`); no pide contrasena.

### Backend - seguridad
- **M-8**: sesiones sin revocacion global: JWT de 7 dias; `restablecerPassword` no invalida sesiones vivas; sin `token_version`.
- **M-9**: abuso y fuerza bruta: sin limites especificos para register, reset-password, chat, reportes, seguidores y subidas; sin `trust proxy`; `express.json({limit:"10mb"})` antes del limitador; `recover` permite mail-bombing (10/min).
- **M-10**: cifrado de datos bancarios (`utils/crypto.js`): clave por defecto derivada de `JWT_SECRET`; sin `authTagLength` ni AAD; sin KDF; `decryptSensitive` devuelve `null` en silencio ante clave incorrecta; fallbacks de lectura permanentes. Ya causo 7 cuentas irrecuperables (segun CHANGELOG 2026-10-06).
- **M-11**: sin auditoria de acciones criticas (baneos, cambios de cuenta bancaria propia y de plataforma, resolucion de reportes, desembolsos); cualquier admin puede reemplazar la cuenta que recibe las comisiones.
- **M-12**: un administrador puede banear o eliminar a otro administrador o a si mismo (`admin/usuarios.controllers.js:66-115`).
- **M-13**: uploads sin magic bytes; archivos huerfanos cuando el cuerpo es invalido (`reportes.controllers.js:32`, `productos.controllers.js:436-444`); `fileFilter` lanza `Error` plano (500 en lugar de 400/413).
- **M-14**: reportes sin deduplicacion (mass-reporting); chat sin limite de longitud ni frecuencia ni paginacion (`chat.controllers.js:23-82, 181-187`).
- **M-15**: enumeracion residual en `register`, `directorio` (`email LIKE`) y por diferencias 403/404 en `PATCH /pedidos/:id/estado`.
- **M-16**: CORS fail-open si falta `NODE_ENV` (`app.js:43`); `.env.example` y README no mencionan `NODE_ENV` ni `ALLOW_DESKTOP_ORIGINS`. Recomendacion: invertir el default (cerrado salvo `ALLOW_DESKTOP_ORIGINS=true`).

### Frontend y apps
- **M-17 (N-3)**: XSS residual en `apps/escritorio/src/app.js:1325-1344` (`verDetalleHistorial` inserta `h.id`, `h.estado`, `h.vendedor`, `h.fecha`, `h.dir`, `h.producto` con `innerHTML` sin escapar). Ya no hay RCE, pero permite robar el JWT de `localStorage`.
- **M-18 (N-4)**: otros puntos sin escapar o en contexto incorrecto en Electron (`app.js:782-783`, `2326`, `2404`, `2408`, `1667-1683`, `2557`, `2701`); eliminar `onclick` inline.
- **M-19 (N-5)**: Electron sin defensa en profundidad: sin `sandbox:true` explicito, sin `setWindowOpenHandler`/`will-navigate`, sin CSP, handlers IPC dentro de `createWindow` y sin validar sender; Electron 35.x fuera de soporte (verificar version estable vigente).
- **M-20 (N-6)**: el perfil publico filtra productos por nombre de vendedor (`PerfilPublico.jsx:129` con `LIKE %nombre%`) en lugar de `vendedor_id`; mezcla vendedores homonimos.
- **M-21 (N-7)**: `PerfilPublico.jsx:157-165` llama a `listarSiguiendo()` sin sesion (dispara el 401 global); calificacion fija de 5 estrellas para todos (el fix esta en `ec482bb`, no incluido).
- **M-22 (N-8)**: el rol que decide guards y menus sale de `localStorage`; solo `/admin` y `/admin/dashboard` tienen guard de ruta; el resto (`/profile`, `/orders`, `/store`, `/history`, `/settings`, `/cart`, `/messages*`) no. El backend protege los datos, pero la UI es manipulable.
- **M-23 (N-9)**: movil guarda JWT, nombre, email, direccion y foto de perfil en `localStorage`; `clearSession` no borra todas las claves `commercity_*`.
- **M-24 (N-10)**: movil usa `http://10.0.2.2:3000` por defecto, sin politica de red ni HTTPS forzado en release.
- **M-25 (N-11)**: movil y escritorio sin CSP.
- **M-26 (N-12)**: el unico workflow (`apps/movil/.github/workflows/ios-build.yml`) no se ejecuta porque GitHub solo lee `.github/workflows` en la raiz; dispara en `main/master`, usa `npm install`, acciones por tag y sin bloque `permissions:`; usa `-workspace App.xcworkspace` aunque solo hay `App.xcodeproj`.
- **M-27 (N-13)**: tests de frontend: 2 fallan, 1 error de lint, solo 4 archivos de test; sin tests de login, registro, chat, perfil publico, tienda, pedidos, panel admin ni los 13 servicios; escritorio y movil sin tests.
- **M-28 (N-14)**: el numero completo de tarjeta viaja por la API (`PasarelaPago.jsx:57-62`, `pedidos.controllers.js:25,131`); no se persiste. Tokenizar con una pasarela real o enviar solo los ultimos 4 digitos.

### Base de datos y documentacion
- **M-DB-1**: `datos_bancarios.titular_nombre VARCHAR(100)` (`schema_commercity.sql:76`) no cabe con el cifrado AES-GCM (`iv:tag:dato`): el limite real ronda 45 bytes de nombre; `banco` es VARCHAR(50) frente a 100 en la BD real.
- **M-DB-2**: migracion 012: `START TRANSACTION` seguido de `CREATE TABLE ... AS SELECT` provoca commit implicito; no es atomica. Su rollback no revierte todos los productos ocultados por nombre.
- **M-DB-3**: migraciones 013 y 014 no son idempotentes; 013 no hace backfill de `monto_reembolsado` para pagos ya reembolsados; no existe ledger de migraciones y las migraciones 001-007 no estan en el repo.
- **M-DB-4**: el schema no incluye el EVENT `limpiar_carritos_inactivos` ni purga para `tokens_invalidados`; drift con la BD real (`estado_pedido`, `detalle_pedidos.imagen_url`, `producto_variantes`, indices FULLTEXT).
- **M-DB-5**: `calificaciones_vendedores UNIQUE (pedido_id)` (`schema_commercity.sql:217`) impide calificar a varios vendedores de un mismo pedido; proponer `UNIQUE (pedido_id, vendedor_id)`.
- **M-DB-6**: seed incoherente con el codigo: cuentas bancarias en texto plano (`decryptSensitive` devuelve `null`), lineas todas `Pendiente`, pagos `Pendiente` con stock ya descontado, rutas `url_redireccion` obsoletas.
- **M-DB-7**: el chat perdio los adjuntos (`chat.controllers.js:12-15,36-38`) aunque RF105 los exige; `config/multer.chat.js` es codigo muerto. Decision pendiente: agregar `archivo_url` al schema o retirar el requisito.
- **M-DOC-1**: README y CHANGELOG desalineados: el lote P0+P1 (RF140, migraciones 013/014, reembolso proporcional) no esta en `docs/CHANGELOG.md` de PREVIEW (se perdio en la resolucion del merge `f5451d0`); README cita 328 pruebas/22 archivos (hoy 409/24), `CORS_ORIGINS` (inexistente; es `CORS_ALLOWLIST`) y archivos que no existen en la rama.
- **M-DOC-2**: versionado inconsistente: `VERSION` = 1.1.0 sin entrada versionada en el CHANGELOG; `package.json` backend 1.0.0, frontend 0.0.0, escritorio 2.0.0, movil 1.29.8; banner del escritorio con version fija (`main.js:31`, "v2.0.0"); `GET /` devuelve "Commercity API v1" fijo.
- **M-GIT-1**: higiene del historial: `backend/node_modules` completo (3866 archivos) en el commit `3dbcf53`; `backend/src/server/uploads/*` (jpg/png/pdf de usuarios, posible PII); `docs/DRIVE` con 315 archivos y 32,5 MB forzados contra el `.gitignore`; commits duplicados (`5997ea3` = `3c501de`, `028ec9e` = `a7abf2c`).
- **M-OPS-1**: sin Dockerfile, sin backup (`scripts/` esta en `.gitignore`), sin LICENSE (README dice "sin licencia comercial", `backend/package.json` declara ISC), healthcheck `GET /` sin ping a la BD, `package-lock.json` de la raiz vacio.
- **M-DOC-3**: el informe `INFORME_AUDITORIA_PREVIEW_2026-10-05.md` describe como abiertos hallazgos ya corregidos y contiene datos de la BD compartida; agregarle marca de estado o archivarlo (ver tabla de la seccion 3).

---

## 7. Hallazgos BAJOS / INFO (resumen)

- **Logs**: `console.error(..., error)` con el objeto completo en `usuarios.controllers.js` (los errores de mysql2 incluyen el SQL con valores); `mailer.js:19` registra el email.
- **Reset de contrasena** no atomico (SELECT + UPDATE) y `token_recuperacion` sin indice.
- **Errores HTTP**: `errorHandler` solo respeta `err.httpStatus`; JSON malformado, payload grande y errores de multer devuelven 500; en Express 5 `req.body` sin parsear es `undefined` y varios controladores lanzan `TypeError` (carrito, chat, reportes, admin).
- **JWT** sin `algorithms`, `iss`, `aud`; token invalido 403 y expirado 401; 2-3 consultas por peticion autenticada.
- **Datos de mas**: `GET /tienda/mi-cuenta-bancaria` devuelve el numero completo descifrado; el historial de ventas expone `email_comprador` al vendedor.
- **Rendimiento**: listados sin paginacion (historial, seguidores, admin, `getValidacionTienda`, `getMisProductos`); `LIKE %q%` sin escapar en rutas publicas; el chunk JS del frontend (587 kB) sin code-splitting.
- **Carrito**: `esEnteroPositivo("2")` acepta strings y `existentes[0].cantidad + cantidad` concatena; `redondear2` duplica `round2`.
- **Redondeo**: `montoVendedor + montoComision` puede diferir del subtotal en +-0,01.
- **Uploads**: `tokens_invalidados` nunca se purga; `dotenv` depende del orden de importacion.
- **Todo usa `pool.query`** (interpolacion de cliente) en lugar de `execute`; hoy no hay inyeccion porque todo se castea.
- **Frontend**: condiciones de carrera en efectos de carga (`Inicio.jsx`, `Pedidos.jsx`), funciones que simulan guardar (`Ajustes.jsx:120-129`, `PerfilVendedor.jsx`), `Reportar.jsx` sube solo el primer archivo, componentes de 500-900 lineas, tres copias de `mapearProducto`, modulos sin referencias, `localStorage` sin `try/catch` en `tema.js`.
- **Accesibilidad**: `<article onClick>` sin rol/teclado, `aria-modal` sin trampa de foco, `user-scalable=0` en movil, uso de `alert()`.
- **Privacidad**: imagenes de terceros (`ui-avatars.com`, `picsum.photos`, `via.placeholder.com`, `lh3.googleusercontent.com`) envian datos de vendedores/usuarios.
- **`.gitignore`**: faltan `.env.production`/`.env.staging`, `*.pem`, `*.key`, `*.jks`, `*.p12`, `google-services.json`, `GoogleService-Info.plist`, `*.sql.gz`, `*.dump`; las excepciones `!docs/informes/...` nombran archivos inexistentes.
- **`.env.example`**: `DB_USER=root` y un `JWT_SECRET` de ejemplo se aceptan sin error (sin longitud minima ni rechazo del valor de ejemplo).
- **Schema**: sin `DEFAULT CHARSET` declarado; `reportes ON DELETE CASCADE` contradice "los reportes nunca se borran"; tablas muertas (`etiquetas`, `producto_etiquetas`, `calificaciones_productos`); faltan indices compuestos para `notificaciones(usuario_id, estado)` y `productos`.
- **Escritorio**: contrasena minima de 6 (la web exige 8); acepta un token de reset desde la respuesta de `/recover` y lo guarda en `localStorage` (verificar que el backend no lo devuelva fuera de desarrollo).
- **Nota fuera de alcance (otros repositorios)**: el revisor encontro commits con un `backend/.env` versionado en `movil/main` y `origin/preview-movil`, que pertenecen a otros repositorios (`BLACK-CODE-JSB/COMMERCITY-2.0-MOBILE-` y el fork propio), **no a `diegoSerna17/Commercity`**. Si esas credenciales son las mismas que usa el backend, deben rotarse igualmente. No se reprodujo ningun valor.

---

## 8. Puntos positivos

- **Control de acceso solido**: 72 endpoints revisados; todos los autenticados derivan el actor de `req.userId`; `/api/admin` protegido con `authRequired` + `requireRoles(["administrador"])`; roles y estado `activo` leidos de BD en cada peticion (el baneo surte efecto al instante).
- **SQL 100 % parametrizado**; Zod `.strict()` evita mass assignment; sin ReDoS, SSRF ni open redirect.
- **`confirmarPago` transaccional** con `FOR UPDATE` batch sobre productos, montos 90/10 calculados en el backend y tarjeta nunca persistida (sujeto a A-1).
- **Recuperacion de contrasena bien resuelta**: token de 256 bits, solo el hash en BD, 5 min, un solo uso, respuesta anti-enumeracion.
- **Cifrado de datos bancarios** con AES-256-GCM e IV aleatorio por cifrado; cuentas enmascaradas por defecto.
- **Cadena XSS->RCE de Electron cerrada**: sin `nodeIntegration`, con `contextIsolation` y preload minimo; sin `dangerouslySetInnerHTML`/`innerHTML` en `frontend/src`.
- **Esquema y codigo alineados** (0 columnas fantasma en 389 referencias); RF140 aplicado y seed numericamente coherente con IVA 19 % y 90/10.
- **Dependencias limpias** (`npm audit` en 0) y `.env` real no versionado en PREVIEW.
- **Cobertura backend** del 95,41 % en lineas y 100 % en funciones; CHANGELOG muy detallado con decisiones trazables.

---

## 9. Plan de remediacion priorizado

### P0 - inmediato
1. **Rotar** contrasenas de las cuentas admin y de seed en toda BD compartida (R-1); retirar la contrasena de README y CHANGELOG; hash del seed desde variable o cambio forzado en el primer login.
2. **Rotar** las contrasenas y la clave de firma Android (A-4); mover los secretos a variables de entorno o `gradle.properties` local; ignorar `*.keystore`/`*.jks`.
3. **Decidir sobre el historial** (R-2): forzar reseteo de contrasenas de los usuarios del volcado y, si se desea purgar, `git filter-repo` con aprobacion explicita y coordinacion del equipo.
4. Revisar la exposicion de red de la BD compartida (puerto abierto, sin TLS) y retirar de la documentacion la IP y el usuario.

### P1 - proximo lote
5. Corregir A-2 (orden del `SET`) y A-3 (reembolso por linea en el baneo); agregar tests de integracion contra MySQL real.
6. Corregir A-1 (bloqueo del carrito dentro de la transaccion e idempotency-key).
7. Corregir A-5 (401 solo con sesion; polling solo con sesion) y los 2 tests rotos + el error de lint.
8. Invertir el default de CORS de escritorio (M-16); exigir `CRYPTO_SECRET_KEY` propia en produccion.
9. Escapar los puntos pendientes de Electron (M-17, M-18) y agregar CSP, `sandbox:true` y bloqueo de navegacion (M-19).
10. Guardas en `schema_commercity.sql`/`seed_commercity.sql` (A-6).

### P2 - planificado
11. Sesiones: `token_version` o `password_changed_at`; limites por endpoint y `trust proxy` (M-8, M-9).
12. Auditoria de acciones criticas y proteccion entre administradores (M-11, M-12).
13. Migraciones idempotentes, ledger de migraciones y consolidacion de EVENT/FULLTEXT en el schema (M-DB-2 a M-DB-4); `UNIQUE (pedido_id, vendedor_id)` en calificaciones; ampliar `titular_nombre`.
14. CI en la raiz (`.github/workflows`) con `npm ci`, tests, lint, `npm audit`, permisos minimos y acciones fijadas por SHA; Docker/backup/LICENSE.
15. Guards de ruta por rol en React, unico almacenamiento de sesion (cookie httpOnly) y retirada del Bearer en `localStorage` (F4).
16. Ampliar la cobertura del frontend y agregar tests que no dependan de mocks de SQL para dinero y concurrencia.
17. Actualizar README/CHANGELOG/versionado; unificar `VERSION` y `package.json`; banners con version dinamica (cuando se apliquen cambios de codigo, bump de version + banner + CHANGELOG en el mismo commit).
18. Limpieza del historial/peso del repo (`node_modules`, `uploads`, `docs/DRIVE`) segun decision del equipo.

---

## 10. Reproducibilidad

- Snapshot: `git worktree add --detach <ruta> 4d1873c` con checkout disperso que excluye `docs/DRIVE` (rutas largas en Windows).
- Backend: `npm ci --ignore-scripts && npm audit && JWT_SECRET=<valor de relleno> npm run test:coverage`.
- Frontend: `npm ci --ignore-scripts && npm audit --omit=dev && npm run lint && npm run test:coverage && npm run build`.
- El `JWT_SECRET` usado para ejecutar los tests fue un valor de relleno pasado solo por entorno; no se leyo ni creo ningun `.env`.
