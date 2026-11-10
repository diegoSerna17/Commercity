# Changelog

Todos los cambios relevantes de CommerCity se documentan en este archivo.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado [SemVer](https://semver.org/lang/es/).

La version nunca se edita a mano: la fuente es `VERSION` en la raiz y se
propaga con `node tools/sync-version.mjs`; se comprueba con
`node tools/verificar-version.mjs`.

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
