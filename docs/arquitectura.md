# Arquitectura — CommerCity

> Complementa el `README.md` (vision general + Mermaid cliente-servidor). Aqui: el interior del backend, el ciclo de una peticion y donde vive cada contrato.

## Mapa del backend (`backend/src/server/`)

```text
server.js          arranca Express (puerto 3000)
app.js             pipeline: helmet -> CORS allow-list -> /uploads -> rate limits -> routers -> 404 -> errorHandler
routes/            13 routers, 72 endpoints (ver docs/api/inventario-endpoints.md)
controllers/       logica de negocio + autorizacion por ownership
controllers/admin/ panel de administracion (rol administrador)
middleware/        auth (JWT + lista negra) | role (RBAC) | validate (Zod) | error (central) | origin (CSRF A-3)
schemas/           15 archivos, 40 contratos Zod = fuente de la documentacion OpenAPI
docs/              registry + builder OpenAPI + rutas /api/openapi.json y /api/docs
config/            db (pool MySQL2), multer (imagenes; el multer de chat se elimino, B-13)
utils/             response (envoltorio uniforme), finanzas (IVA 90/10), reembolsos, crypto, ids, mailer
__tests__/         25 archivos, 413 pruebas (vitest + supertest)
```

## Ciclo de una peticion autenticada

```text
Peticion
 -> helmet (CSP default, sin cambios) + CORS allow-list (FRONTEND_URL, Capacitor; Electron/file solo con ALLOW_DESKTOP_ORIGINS)
 -> express.json (10mb)
 -> rate limit: 10/min en login/recover; 200/15min en /api (off en test)
 -> authRequired: JWT Bearer + SHA-256 en tokens_invalidados + usuarios.activo fail-closed
 -> requireRoles: RBAC (comprador | vendedor | administrador)
 -> validate(schema Zod): solo en 5 endpoints de auth (el resto valida en controller; ver inventario)
 -> controller: negocio + ownership (el ID siempre sale del token, nunca del body)
 -> { success, data } o errorHandler central { success:false, error:{ code, message } }
```

## Contratos y documentacion (flujo docs-api)

```text
schemas/*.schema.js  (.meta/.describe)
  -> docs/openapi.registry.js  (72 operaciones: metodo, ruta, auth, roles, body/query/params, responses)
  -> docs/openapi.builder.js   (z.toJSONSchema -> OpenAPI 3.1, $defs a components.schemas)
  -> backend/scripts/gen-openapi.mjs  (npm run docs:api -> docs/api/openapi.json, validado, idempotente)
  -> backend/scripts/gen-entidades.mjs (npm run docs:entidades -> docs/api/entidades.md)
  -> docs/docs.routes.js  (GET /api/openapi.json + GET /api/docs con Scalar 1.73.1 pineado+SRI)
```

Regla: el esquema Zod es la unica fuente de verdad. Si cambia un contrato, se regenera (`docs:api` + `docs:entidades`) en el mismo commit.

## Decisiones registradas (ADR resumido)

| Decision | Por que | Donde |
|---|---|---|
| Sin dependencias nuevas para OpenAPI | `z.toJSONSchema` nativo basta; menos cadena de suministro | `docs/openapi.builder.js` |
| Contratos nuevos no cableados como middleware | Cablearlos cambiaria 200->400: es cambio de comportamiento, va en plan aparte | `schemas/*` + inventario |
| `/api/docs` sin relajar CSP | La UI interactiva completa queda pendiente de decision (CSP acotada vs estatico); el JSON siempre sirve | `docs/docs.routes.js` |
| Estado del pedido por linea | RF119: sin `estado_pedido`; `detalle_pedidos.estado_envio` | `docs/bd/modelo-datos.md` |
| Dinero con IVA incluido | Precio publicado con 19%; subtotal/IVA/comision 90/10 solo en pasarela | `utils/finanzas.js`, RF48/RF121/RF140 |

## Referencias

- `README.md` — vision, stack, pipeline resumido, multicanal (web/movil/escritorio).
- `docs/api/inventario-endpoints.md` — verdad terreno de los 72 endpoints.
- `docs/api/openapi.json` + `docs/api/entidades.md` — contratos generados.
- `docs/bd/modelo-datos.md` — las 19 tablas y regla de dinero.
- `docs/guias/` — contribucion, pruebas, despliegue.
