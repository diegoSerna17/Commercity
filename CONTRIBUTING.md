# Contribuir en CommerCity

Guia corta; el detalle operativo vive en [`docs/guias/contribucion.md`](docs/guias/contribucion.md).

## Entorno

- Node.js **22.22.2+** (hay `.nvmrc`), npm y MySQL 8.x para la BD local.
- Backend: `cd backend && npm ci` y copia de `.env.example` (nunca subas tu `.env`).
- Frontend: `cd frontend && npm ci`.
- Apps: `cd apps/escritorio && npm ci`; `cd apps/movil && npm ci`.

## Flujo de ramas

`PREVIEW` es la unica rama de integracion. Corta `feature/*` o `fix/*` desde
`PREVIEW`, abre PR y borra la rama al mergear. `main` solo avanza por release.
La proteccion de `PREVIEW` (H-6) se configura con
[`docs/guias/contribucion.md#proteger-preview`](docs/guias/contribucion.md#proteger-preview).

## Antes de abrir el PR

```bash
cd backend && npx vitest run
cd frontend && npm run lint && npx vitest run && npm run build
cd backend && npm run docs:api    # sin drift en docs/api/
node tools/verificar-version.mjs  # si el cambio trae bump
```

Reglas que el CI vuelve a exigir: cobertura sobre umbral, `npm audit` sin
vulnerabilidades de produccion, OpenAPI regenerado y sintaxis valida de las apps.

## Commits y releases

- Mensaje convencional `tipo(alcance): descripcion`; un cambio logico por commit.
- `git add` archivo por archivo. Prohibido `git add .`, `--force` y commitear secretos.
- Cuando hay release: `VERSION`, package.json/lockfiles, Android/iOS, banners,
  `docs/api/`, CHANGELOG y pruebas van en el **mismo commit**.
- Sigue la [guia de contribucion](docs/guias/contribucion.md) y el
  [CHANGELOG](docs/CHANGELOG.md) para el formato de evidencia.

## Seguridad

No reportes vulnerabilidades en issues publicos: usa
[`SECURITY.md`](SECURITY.md).
