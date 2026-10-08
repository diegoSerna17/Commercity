# Guia de contribucion — CommerCity

## Ramas
- `main`: estable. **Push directo prohibido sin confirmacion explicita.**
- Trabajo en `feature/<tema>` desde `main`; push con `-u` la primera vez.
- Referencia: integracion por PR hacia `PREVIEW` y luego merge a `main` (historial del proyecto).

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

## Versionado
- `VERSION` (raiz) y `backend/package.json` van sincronizados; bump en el mismo commit que el cambio (ver `docs/guias/despliegue.md`).
- Entrada en `docs/CHANGELOG.md` con formato Autor / Archivos / Descripcion / Motivo / Requerimientos / Evidencia / Estado.
