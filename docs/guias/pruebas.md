# Guia de pruebas — CommerCity

## Backend (`backend/`, vitest + supertest)
| Comando | Uso |
|---|---|
| `npx vitest run` (o `npm test`) | Suite completa: 25 archivos, **413 pruebas** |
| `npx vitest run <archivo>` | Un archivo (p. ej. `src/server/__tests__/docs.routes.test.js`) |
| `npm run test:coverage` | Cobertura (umbral 60% lineas/funciones/ramas; real ~92%+) |

- `NODE_ENV=test` desactiva el rate limit de escritura (no rompe supertest).
- Los tests usan mocks de `pool.query` (no requieren MySQL vivo).
- Nuevo controller/endpoint: su `*.test.js` con casos 200/400/401/403/404/500 segun aplique.

## Frontend (`frontend/`, vitest + jsdom)
| Comando | Uso |
|---|---|
| `npm test` | Suite: 17 pruebas |
| `npm run test:coverage` | Cobertura |

## Movil / escritorio
Apps Capacitor (movil) y Electron (escritorio) contra la misma API; capa de red verificada (102/102) y RF4 (12/12). Ver `docs/informes/PLAN_INTEGRACION_API_MOVIL_ESCRITORIO_2026-09-27.md`.

## Puerta de calidad antes de cada commit
1. Suite afectada en verde.
2. `npm run docs:api` + `npm run docs:entidades` sin diffs inesperados (si tocaste contratos).
3. Full backend en verde si tocaste `controllers/`, `middleware/` o `app.js`.
