# Guia de pruebas — CommerCity

## Backend (`backend/`, vitest + supertest)
| Comando | Uso |
|---|---|
| `npx vitest run` (o `npm test`) | Suite unitaria completa (mocks de mysql2, sin BD) |
| `npx vitest run <archivo>` | Un archivo (p. ej. `src/server/__tests__/docs.routes.test.js`) |
| `npm run test:coverage` | Cobertura (umbral 97 lineas / 96 sentencias / 90 ramas / 99 funciones; real 97,17 / 96,36 / 90,45 / 99,33 en 1.5.9) |
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
- Estado actual: 5 archivos / 23 casos. La ultima corrida registrada es del
  2026-11-05; en 1.5.9 no se re-ejecuto por falta de `TEST_DB_*`.
- Los fixtures crean usuarios/productos con marca unica y se limpian solos.

## Frontend (`frontend/`, vitest + jsdom)
| Comando | Uso |
|---|---|
| `npm test` | Suite completa: 500 pruebas en 65 archivos |
| `npm run test:coverage` | Cobertura de `src/**/*.{js,jsx}` con umbrales en `vite.config.js` (Lines 93 %, Statements 92 %, Functions 89 %, Branches 82 %) |
| `npm run test:coverage:real` | Alias del comando anterior |

- Cobertura real medida el 2026-11-10: Lines 96,95 % (500 pruebas). Los umbrales configurados en `vite.config.js` son Lines 93 / Statements 92 / Functions 89 / Branches 82.
- La cifra histórica de 75,31 % de Lines medía solo los archivos que ya tenían pruebas; la línea base real de todo `src/` era 41,30 %. Ambas quedaron superadas por este lote.

## Movil / escritorio
Apps Capacitor (movil) y Electron (escritorio) contra la misma API. El contrato de red de cada app se verifica con sus pruebas (`apps/movil/tests` y `apps/escritorio/tests/contrato.mjs`).

## Puerta de calidad antes de cada commit
1. Suite afectada en verde.
2. `npm run docs:api` + `npm run docs:entidades` sin diffs inesperados (si tocaste contratos).
3. Full backend en verde si tocaste `controllers/`, `middleware/` o `app.js`.
