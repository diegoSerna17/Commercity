# Changelog

Todos los cambios relevantes de CommerCity se documentan en este archivo.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado [SemVer](https://semver.org/lang/es/).

La version nunca se edita a mano: la fuente es `VERSION` en la raiz y se
propaga con `node tools/sync-version.mjs`; se comprueba con
`node tools/verificar-version.mjs`.

## [1.5.5] - 2026-11-11

Fase B del plan de corrección 1.5.x: cerrar los huecos que hacían que «verde»
no significara «probado», más la verificación en ejecución disponible.

### Agregado

- `backend/scripts/verificar-entorno.mjs` y `npm run env:check`: revisan el
  `.env` y reportan `presente`/`ausente`/`inválida` sin imprimir nunca un
  valor. Aplican las mismas reglas que `utils/config.js` y `config/db.js`
  (`JWT_SECRET` de 32 caracteres o más y distinto de los valores de ejemplo;
  `DB_USER`/`DB_PASSWORD` distintos de root sin clave; `JWT_EXPIRES_IN` con
  formato `30m`/`24h`/`7d`; `CRYPTO_SECRET_KEY` obligatoria en producción).
  Con `--db` ejecuta `SELECT 1` con timeout y reporta `ok` o el código de
  error, nunca la cadena de conexión.
- Avisos de correo (P4): sin `RESEND_API_KEY` el envío es simulado; con
  `RESEND_FROM` en `resend.dev`, Resend solo entrega al dueño de la cuenta.
- `backend/src/server/utils/secretos.js`: `VALORES_DE_EJEMPLO` y
  `LONGITUD_MINIMA_SECRET` compartidos por `config.js` y `env:check`, sin
  efectos secundarios al importarlos.
- `requisitos.integration.test.js`: con `REQUIRE_TEST_DB=true` falla si faltan
  `TEST_DB_HOST`, `TEST_DB_USER` o `TEST_DB_NAME`; el job `backend` del CI
  define la variable. Perder las credenciales de la BD efímera ahora deja el
  pipeline en rojo en vez de saltar la integración en silencio.
- `README.md`: sección «Entorno local de pruebas» (env:check, BD, migraciones,
  unitarias/integración, `dev`, smoke, cuentas del seed, móvil, escritorio,
  rate limits y Resend) y corrección de la nota móvil: `http://<IP-LAN>` se
  rechaza por diseño (fail-closed); solo valen HTTPS o el loopback del
  emulador.

### Cambiado

- `utils/config.js` importa las constantes desde `utils/secretos.js` (mismo
  comportamiento, sin listas duplicadas).
- Resultados del README actualizados a la corrida real del 2026-11-11:
  backend 44 archivos / 628 pruebas y frontend 65 archivos / 500 pruebas;
  cobertura backend 96.91 % sentencias, 90.28 % ramas, 100 % funciones y
  97.31 % líneas.
- `docs/api/entidades.md` regenerado (49 contratos) y `openapi.json` a 1.5.5.

### Pruebas

- Backend: 44 archivos / 628 pruebas en verde; cobertura sobre los umbrales
  (96 / 90 / 99 / 97).
- Frontend: 65 archivos / 500 pruebas en verde; `eslint .` sin errores.
- Integración local sin `TEST_DB_*`: 5 archivos / 25 pruebas saltadas en verde
  (comportamiento documentado). Con `REQUIRE_TEST_DB=true` y sin `TEST_DB_*`
  falla como se espera (exit 1).
- `env:check`: OK y sin valores; `env:check -- --db` reporta `ECONNREFUSED`
  porque este equipo no tiene MySQL/Docker levantado. Queda pendiente la
  corrida en vivo de `/health`, login con los tres roles y endpoints
  protegidos contra la BD desechable.

## [1.5.4] - 2026-11-10

Fase 2 del plan de correccion 1.5.x: cobertura de ramas (ítem 10).

### Cambiado

- `backend/vitest.config.js`: el umbral de `branches` sube de 88 % a 90 %.

### Pruebas

- `error.middleware.test.js`: tres casos nuevos para los caminos sin
  `message`/`expose` (`status` 400, `status` 413 y `httpStatus` sin texto).
- `historial.controllers.test.js`: página vacía sin consultar ítems y líneas
  con campos nulos normalizados a 0 / «Pendiente».
- Cobertura del backend: ramas 90.28 % (1125/1246), líneas 97.31 %,
  sentencias 96.91 %, funciones 100 %. Suite: 43 archivos / 615 pruebas.

## [1.5.3] - 2026-11-10

Fase 2 del plan de correccion 1.5.x: capa `services/` en el backend (ítem 7).

### Cambiado

- Nuevo `backend/src/server/services/` con un archivo por dominio. El
  controlador queda en tres pasos —validar en la ruta, llamar al servicio y
  responder— y el servicio concentra el SQL y las reglas de negocio, tomando
  el pool de `config/db.js` para que las pruebas con pool mockeado no cambien.
- Dominio **usuarios**: `usuarios.service.js` absorbe registro, login, logout,
  cierre de sesiones, perfil, cambio de rol, recuperación de contraseña,
  perfil público, baja de cuenta, directorio y actualización de perfil. El
  contrato HTTP, los mensajes y los códigos de estado no cambian.
- Dominio **pedidos**: `pedidos.service.js` absorbe el resumen del carrito, la
  confirmación de pago (pedido + líneas + stock + pago en una transacción con
  `FOR UPDATE`) y el cambio de estado (avance del vendedor y cancelación del
  comprador con reembolso y notificaciones). El contrato HTTP no cambia.
- Dominio **productos**: `productos.service.js` absorbe el catálogo paginado,
  categorías, vendedores, detalle público, validación de stock y la gestión del
  vendedor (crear, editar con reemplazo de imagen, pausar, eliminar). El
  contrato HTTP no cambia.
- Dominio **admin**: `admin.service.js` absorbe estadísticas, usuarios
  (listado, baneo/reactivación con protección del último administrador),
  productos (suspensión y restauración), reportes (listado, archivo y
  resolución), buscador FULLTEXT con fallback LIKE y la cuenta bancaria de la
  plataforma. `destinoPedidosVendedor` pasa a `pedidos.service.js` y se
  re-exporta por su ruta histórica. El contrato HTTP no cambia.

### Pruebas

- Suite completa del backend en verde tras la extracción: 43 archivos /
  610 pruebas.

## [1.5.2] - 2026-11-10

Corrección de la paginación de tienda introducida en 1.5.1.

### Corregido

- `GET /api/tienda/ventas` y `GET /api/tienda/ingresos` vuelven a tolerar
  valores no numéricos en la paginación: los alias `?page` y `?limit` usan
  `numeroTolerante()` igual que `pagina` y `por_pagina`, así que `?page=abc`
  ya no responde 400 y el controlador aplica sus valores por defecto
  (página 1, 10 registros por página).

### Pruebas

- Dos pruebas nuevas en `tienda.controllers.test.js`: paginación no numérica
  en ventas (`pagina`/`por_pagina`) e ingresos (alias `page`/`limit`).

## [1.5.1] - 2026-11-10

Fase 2 (parcial): validación de entrada uniforme en la capa de rutas.

### Cambiado

- Los `safeParse` que vivían dentro de los controladores se movieron al
  middleware `validate()` de las rutas, reutilizando los esquemas existentes:
  - `POST /api/calificaciones/vendedor` → `calificacionSchema`;
  - `POST /api/chat/`, `GET /api/chat/conversaciones` y
    `GET /api/chat/mensajes/:usuarioId` (params + query) → `chat.schema.js`;
  - `GET /api/historial/compras` y `POST /api/historial/compras/:id/cancelar`
    → `compras.schema.js`;
  - `POST /api/pedidos/confirmar-pago` y `PATCH /api/pedidos/:id/estado`
    (params + body) → `pedidos.schema.js`;
  - `POST /api/seguidores/`, `DELETE /api/seguidores/:id` y
    `GET /api/seguidores/:id/contadores` → `seguidores.schema.js`;
  - `POST|PUT /api/tienda/mi-cuenta-bancaria`, `GET /api/tienda/ventas` y
    `GET /api/tienda/ingresos` → `tienda.schema.js`.
- Los controladores quedan en «validar en la ruta → consultar → responder» y
  ya no importan esquemas Zod ni ejecutan `Number()` sobre la query.
- La paginación de tienda conserva el truncado a entero y el clamp (R2) al
  validarse en la ruta; `?estado` y `agrupar_por` siguen tolerando valores
  desconocidos (sin filtro / transacción), igual que antes.
- Los errores de validación de estos endpoints pasan a usar el contrato
  uniforme de `validate()`: primer mensaje de Zod en `error.message` y
  `error.details` con `{ campo, mensaje }`.

### Agregado

- `seguidorIdParamsSchema` en `seguidores.schema.js`: objeto `{ id }` para
  `validate(..., "params")`. El alias escalar existente no servía para validar
  el objeto completo de params.

### Documentación

- `docs/api/openapi.json` regenerado (64 paths / 76 operaciones / 43 esquemas).
- Comentarios de los esquemas actualizados: ya no dicen «sin cablear
  validate()».

### Pruebas

- Suite completa del backend en verde: 43 archivos / 608 pruebas; cobertura
  97.23 % líneas y 88.37 % ramas (umbrales 97/96/88/99).

## [1.5.0] - 2026-11-10

Fase 1 del plan de correccion 1.5.x (auditoria del 2026-11-10): cierre de las
brechas de seguridad y de navegacion de mayor riesgo.

### Seguridad

- **JWT por canal.** `POST /api/usuarios/login` y `POST /api/usuarios/register`
  devuelven el token en el body **solo** si la peticion trae
  `X-Client-Type: movil` o `X-Client-Type: escritorio`. La web recibe
  unicamente la cookie httpOnly, de modo que el token deja de quedar expuesto
  al JavaScript de la pagina.
- `apps/movil/www/api.js` y `apps/escritorio/src/api.js` envian la cabecera
  `X-Client-Type` en todas sus peticiones.
- `X-Client-Type` se agrego a `allowedHeaders` de CORS; sin declararla, el
  preflight bloqueaba el login de las apps nativas.
- **Expiracion configurable.** El JWT usa `JWT_EXPIRES_IN` (24 h por defecto)
  en lugar del valor fijo de 7 dias. El valor se valida al arrancar en
  `src/server/utils/config.js` y la cookie httpOnly caduca con el mismo
  margen. Queda documentado en `backend/.env.example`.
- **Guard de rutas fail-closed.** `RutaProtegidaRol` ya no deja navegar cuando
  `GET /api/usuarios/me` falla por red o 5xx: limpia la sesion local y
  redirige a `/login` con un aviso visible. Antes, un fallo de red mantenia la
  sesion local y permitia entrar a rutas de vendedor o de administrador sin
  verificar el rol.

### Agregado

- **Pagina 404** (`components/globales/NoEncontrado.jsx`) conectada con
  `path="*"` en `App.jsx`.
- **ErrorBoundary** (`components/globales/ErrorBoundary.jsx`), componente de
  clase que envuelve el `Suspense` raiz y ofrece un boton "Reintentar" en
  lugar de una pantalla en blanco.
- **CHANGELOG versionado** en `docs/CHANGELOG.md`, enlazado desde el README.

### Corregido

- La validacion de la query de `GET /api/notificaciones/` se movio del
  controlador al middleware `validate()` con
  `schemas/notificaciones.schema.js`. Se conservan los mensajes de error
  (`Tipo de notificación inválido`, `El límite debe estar entre 1 y 50`,
  `La página debe ser un entero positivo`) y los defaults de limite y pagina.
- `tools/sync-version.mjs` ahora tambien sincroniza `frontend/package.json`,
  que `tools/verificar-version.mjs` ya validaba. Sin este cambio, el chequeo
  de version fallaba en cada bump.

### Pruebas

- Nuevo `backend/src/server/__tests__/usuarios.canal.test.js` con los casos de
  canal del token: web sin cabecera (solo cookie), movil, escritorio,
  normalizacion de mayusculas/espacios y valor desconocido.
- Pruebas de `JWT_EXPIRES_IN` y de la conversion a milisegundos para la cookie.
- Pruebas de la query de notificaciones con los mensajes contractuales.
- `RutaProtegidaRol` y `App` verifican el fail-closed y el aviso en `/login`.
- Pruebas nuevas para `NoEncontrado` y `ErrorBoundary`.
- Backend: 43 archivos / 607 pruebas en verde. Frontend: suite completa en
  verde (ver README para el conteo vigente).

### Limitaciones conocidas

- La pasarela de pago real y los adjuntos del chat quedan fuera de alcance por
  decision academica del proyecto. El pago simulado sigue siendo el flujo
  soportado.

### Notas de migracion

- Si una integracion consumia el token del body de login/registro desde el
  navegador, debe enviar `X-Client-Type: movil` o `X-Client-Type: escritorio`,
  o pasar a usar la cookie httpOnly con `credentials: "include"`.
- Si el entorno definia una expiracion distinta de 7 dias, configurar
  `JWT_EXPIRES_IN` de forma explicita.
