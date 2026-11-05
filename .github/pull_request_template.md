## Resumen

<!-- Que cambia y por que. Una o dos frases. -->

## Tipo de cambio

- [ ] `feat` funcionalidad nueva
- [ ] `fix` correccion de un fallo
- [ ] `refactor` sin cambio de contrato
- [ ] `test` pruebas
- [ ] `docs` documentacion
- [ ] `ci` / `chore` infraestructura

## Requerimientos cubiertos

<!-- RF/RNF del documento oficial, o TASK del plan. Ej: RF51, RF55, TASK-8.5. -->

## Como se verifico

<!-- Comandos exactos y resultados reales; nunca cifras estimadas. -->

- [ ] `cd backend && npx vitest run` (incluye cobertura si toca codigo)
- [ ] `cd frontend && npm run lint && npx vitest run`
- [ ] `cd frontend && npm run build`
- [ ] `node tools/verificar-version.mjs` (si hay bump)
- [ ] `npm run docs:api` desde `backend/` sin drift en `docs/api/`

## Checklist

- [ ] `git add` archivo por archivo; sin secretos (`.env`, `*.pem`, `credentials*`) ni dumps
- [ ] Version, banners y `docs/CHANGELOG.md` en el mismo commit cuando hay release
- [ ] Sin `console.log` de depuracion ni TODOs sin dueno
- [ ] La rama sale de `PREVIEW` y se borra al mergear
