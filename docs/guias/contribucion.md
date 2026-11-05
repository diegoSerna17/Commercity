# Guia de contribucion — CommerCity

## Ramas (DEC-008, Fase 10: PREVIEW unica rama de integracion)

- `PREVIEW` es la UNICA rama de integracion (backend, web, escritorio y movil).
- Trabajo en `feature/*` y `fix/*` cortas, creadas desde `PREVIEW`; entran por PR y se borran al mergear.
- `main` es solo puntero de release: avanza por fast-forward desde `PREVIEW` en cada bump con tag `vX.Y.Z`.
- Prohibido mantener ramas o repos paralelos por app.

## Commits (uno por cambio logico)
- Mensaje convencional: `tipo(alcance): descripcion` (p. ej. `docs(api): ...`, `refactor(backend): ...`, `feat(backend): ...`).
- `git add` archivo por archivo. **Prohibido**: `git add .`, `--force`, commitear secretos (`.env`, `*.pem`, `credentials*`).
- Cada cambio cierra con commit + push; reportar SHA corto y rama.

## Que se versiona en `docs/`
Por `.gitignore` la carpeta `docs/` esta excluida salvo excepciones aprobadas:
- `docs/CHANGELOG.md`, `docs/informes/` (lista cerrada de informes),
- `docs/api/**`, `docs/bd/**`, `docs/guias/**`, `docs/arquitectura.md` (documentacion tecnica docs-api),
- `backend/scripts/gen-openapi.mjs`, `backend/scripts/gen-entidades.mjs`.
- El resto (LAST VERSION, DRIVE, Audios, AVANCES...) vive en el repositorio ECOMMERCE paralelo, no aqui.

## Contratos Zod (regla docs-api)
- Nuevo endpoint o cambio de contrato: editar/crear el `*.schema.js`, con `.meta({ id, title, description, examples })` (el `id` debe ser unico).
- Regenerar en el mismo commit: `npm run docs:api` y `npm run docs:entidades` desde `backend/`.
- No cablear `validate()` en rutas existentes sin plan aparte (cambia respuestas 200->400).
- Codificacion: UTF-8. Si ves mojibake (`electrnico`, `catlogo`), es deuda pre-existente: no la propagues, reportala.

## Proteger PREVIEW (H-6)

La proteccion se configura **en GitHub**, una sola vez, sobre la rama
`PREVIEW`. Sin esto un push directo puede saltarse el CI y los PRs.

1. Entra a **Settings > Rules > Rulesets > New branch ruleset** (o
   **Settings > Branches > Add branch protection rule** en la UI clasica).
2. Nombre: `proteger-preview`. Enforcement: **Active**. Target: **Include
   by pattern** con `PREVIEW` (una sola rama, no `PREVIEW*`).
3. Activa:
   - **Require a pull request before merging** con **1 aprobacion**.
   - **Dismiss stale pull request approvals when new commits are pushed**.
   - **Require review from Code Owners** (`.github/CODEOWNERS` ya existe).
   - **Require status checks to pass**: selecciona los jobs del workflow CI
     (`Backend (tests, cobertura, audit)`, `Frontend (lint, tests, build, audit)`,
     `Docs (OpenAPI y entidades sin drift)`). Marca **Require branches to be up to date**.
   - **Require conversation resolution before merging**.
   - **Block force pushes** y **Restrict deletions**.
   - **Do not allow bypassing the above settings** (incluye administradores).
4. Guarda y verifica:
   ```bash
   gh api repos/diegoSerna17/Commercity/rulesets --jq '.[].name'
   gh api repos/diegoSerna17/Commercity/branches/PREVIEW/protection
   ```
   Un `git push --force origin PREVIEW` debe ser rechazado y un PR sin el job
   de CI en verde no debe poder mergear.
5. Si el repositorio es de organizacion, revisa que el plan permita rulesets;
   si no, usa la UI clasica de branch protection con los mismos campos.

El responsable de esta configuracion es el lider (H-6). Se documenta el cambio
en el CHANGELOG con la fecha y la evidencia (`gh api ...`).

## Versionado (DEC-010, Fase 10)
- `VERSION` (raiz) es la fuente; `backend/package.json`, `apps/*/package.json`,
  `MARKETING_VERSION` iOS y `versionName` Android se sincronizan con
  `node tools/sync-version.mjs` y se verifican con `node tools/verificar-version.mjs`.
- Nunca editar la version a mano en varios lugares.
- Entrada en `docs/CHANGELOG.md` con formato Autor / Archivos / Descripcion / Motivo / Requerimientos / Evidencia / Estado.
- F-10 (2026-10-12): el CHANGELOG vive en `PREVIEW` (no en rama de release):
  cada cambio —incluido el bump— trae su entrada en el MISMO commit.
