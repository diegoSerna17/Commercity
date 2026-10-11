# Guia de pruebas — CommerCity

## Backend (`backend/`, vitest + supertest)
| Comando | Uso |
|---|---|
| `npx vitest run` (o `npm test`) | Suite unitaria completa (mocks de mysql2, sin BD) |
| `npx vitest run <archivo>` | Un archivo (p. ej. `src/server/__tests__/docs.routes.test.js`) |
| `npm run test:coverage` | Cobertura (umbral 60% lineas/funciones/ramas; real ~92%+) |
| `npm run test:integration` | Integracion con MySQL real desechable (se salta sin `TEST_DB_*`) |

- `NODE_ENV=test` desactiva el rate limit de escritura (no rompe supertest).
- Los tests unitarios usan mocks de `pool.query` (no requieren MySQL vivo).
- Nuevo controller/endpoint: su `*.test.js` con casos 200/400/401/403/404/500 segun aplique.

### Pruebas de integracion (`src/server/__tests__/integration/`)
- **Solo contra una BD local desechable**. Nunca apuntar a la BD compartida.
- Variables: `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USER`,
  `TEST_DB_PASSWORD`, `TEST_DB_NAME`. Sin ellas la suite se salta (verde).
- Preparar la BD (una vez, en un MySQL local):
  ```powershell
  mysql -h localhost -u <usuario> -p -e "CREATE DATABASE commercity_itest"
  Get-Content schema_commercity.sql | mysql -h localhost -u <usuario> -p commercity_itest
  $env:TEST_DB_HOST="localhost"; $env:TEST_DB_USER="<usuario>"
  $env:TEST_DB_PASSWORD="<clave>"; $env:TEST_DB_NAME="commercity_itest"
  cd backend; npm run test:integration
  ```
- Cubre dinero y concurrencia: reembolso proporcional de 2 y 3 lineas,
  doble `confirmarPago` simultaneo y baneo de un vendedor con pedidos abiertos.
- Los fixtures crean usuarios/productos con marca unica y se limpian solos.

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
