# Guia de despliegue — CommerCity

## Componentes
- **API**: `backend/` (Node 22+, Express, puerto 3000). `npm start`.
- **Web**: `frontend/` (Vite; dev puerto 5173, `npm run build` + `preview`).
- **BD**: MySQL 8 (`schema_commercity.sql` + `seed_commercity.sql`, BD `commercity_v2`).
- **Movil/Escritorio**: `apps/movil` (Capacitor), `apps/escritorio` (Electron).

## Variables de entorno (backend)
Plantilla en `backend/.env.example` (nunca commitear `.env` real):

| Variable | Efecto |
|---|---|
| `NODE_ENV` | `production` activa gates estrictos (docs off salvo `DOCS_ENABLED=true`) |
| `FRONTEND_URL` | Origen web permitido por CORS (default `http://localhost:5173`) |
| `ALLOW_DESKTOP_ORIGINS` | `true` acepta `null`/`file://` (dev/entorno controlado) |
| `DOCS_ENABLED` | `true` fuerza `/api/openapi.json` y `/api/docs` aun en produccion |
| DB / JWT / correo | Ver `.env.example` (pool MySQL, secreto JWT, Resend con modo simulacion sin key) |

## Documentacion en despliegue
- Generar antes de publicar: `npm run docs:api` y `npm run docs:entidades` (artefactos versionados en `docs/api/`).
- `/api/docs` y `/api/openapi.json` responden solo si `DOCS_ENABLED=true` o `NODE_ENV !== "production"`. La pagina usa Scalar 1.73.1 (CDN pineado + SRI) con CSP acotada a esa ruta (el init vive en `/api/docs.js` para no necesitar `unsafe-inline`); la config global de helmet no se modifica.
- Produccion: exponer la referencia desde un estatico (`docs/api/index.html` + `openapi.json`) en lugar de habilitarla en la API, salvo decision explicita.

## Checklist previo a release
1. Suites verde (backend 413, frontend 17) y cobertura sobre el umbral.
2. `VERSION` y `backend/package.json` sincronizados; sin textos con la version anterior en el repo.
3. Entrada en `docs/CHANGELOG.md`.
4. Sin secretos en el repo (`git status` limpio de `.env`, dumps con bcrypt, `uploads/`).
