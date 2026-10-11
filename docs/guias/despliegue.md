# Guia de despliegue — CommerCity

## Componentes
- **API**: `backend/` (Node 22+, Express, puerto 3000). `npm start`.
- **Web**: `frontend/` (Vite; dev puerto 5173, `npm run build` + `preview`).
- **BD**: MySQL 8. `schema_commercity.sql` + `seed_commercity.sql` crean la base **local** `commercity_dev` (TASK-7.1) y llevan guarda A-6 contra las bases COMPARTIDAS del equipo (`commercity_v2` / `commercycity_v2` / `commercy_v2`): solo se ejecutan sobre ellas con `SET @permitir_destructivo = 1;` explicito. Contra la base compartida solo se configuran las variables `DB_*`.
- **Movil/Escritorio**: `apps/movil` (Capacitor), `apps/escritorio` (Electron).
- **Contenedores (desarrollo)**: `Dockerfile` + `docker-compose.yml` (TASK-8.4): `docker compose up --build` levanta MySQL (`commercity_dev`) y la API con healthcheck `GET /health`.

## Variables de entorno (backend)
Plantilla en `backend/.env.example` (nunca commitear `.env` real):

| Variable | Efecto |
|---|---|
| `NODE_ENV` | `production` activa gates estrictos (docs off salvo `DOCS_ENABLED=true`) |
| `FRONTEND_URL` | Origen web permitido por CORS (default `http://localhost:5173`) |
| `ALLOW_DESKTOP_ORIGINS` | `true` acepta `null`/`file://` (dev/entorno controlado) |
| `DOCS_ENABLED` | `true` fuerza `/api/openapi.json` y `/api/docs` aun en produccion |
| `CRYPTO_SECRET_KEY` | Clave propia de cifrado de datos bancarios (recomendada; sin ella se deriva de `JWT_SECRET`) |
| DB / JWT / correo | Ver `.env.example` (pool MySQL, secreto JWT, Resend con modo simulacion sin key) |

## Migraciones y eventos de BD
- Las migraciones incrementales viven en `backend/src/server/db/` (`000` y `008`-`018`), son **idempotentes** y llevan su rollback en comentarios (TASK-7.2 a TASK-7.5).
- Se aplican en orden con `npm run db:migrate` (desde `backend/`): usa `DB_*` (`DB_NAME` por defecto `commercity_dev`), registra cada archivo en `schema_migrations` con checksum SHA-256 y se niega a tocar una base compartida sin `--permitir-compartida` explicito (SEC-003).
- Los dos EVENT del esquema (`limpiar_carritos_inactivos`, `purgar_tokens_invalidados`) requieren **`event_scheduler = ON`** en el servidor MySQL de produccion (`SET GLOBAL event_scheduler = ON;` o `event_scheduler=ON` en `my.cnf`).

## Documentacion en despliegue
- Generar antes de publicar: `npm run docs:api` y `npm run docs:entidades` (artefactos versionados en `docs/api/`).
- `/api/docs` y `/api/openapi.json` responden solo si `DOCS_ENABLED=true` o `NODE_ENV !== "production"`. La pagina usa Scalar 1.73.1 (CDN pineado + SRI) con CSP acotada a esa ruta (el init vive en `/api/docs.js` para no necesitar `unsafe-inline`); la config global de helmet no se modifica.
- Produccion: exponer la referencia desde un estatico (`docs/api/index.html` + `openapi.json`) en lugar de habilitarla en la API, salvo decision explicita.

## Backup y restauracion (TASK-8.5)
- Script versionado: `backend/scripts/backup.ps1`. Comprime con GZip nativo (sin dependencias), aplica retencion (`-RetentionDays`, 30 por defecto) y, si se pasa `-EncryptPassword` y hay 7-Zip, cifra con AES-256. Requiere `mysqldump` en el PATH.
- Usuario de BD de SOLO LECTURA (crear una vez, como root):
  ```sql
  CREATE USER 'backup_ro'@'%' IDENTIFIED BY '<clave-aleatoria>';
  GRANT SELECT, LOCK TABLES, SHOW VIEW, TRIGGER, EVENT ON *.* TO 'backup_ro'@'%';
  ```
- Ejecucion (la clave va por `MYSQL_PWD`, nunca como argumento):
  ```powershell
  $env:MYSQL_PWD = "<clave de backup_ro>"
  .\backend\scripts\backup.ps1 -DbHost <host> -DbUser backup_ro -DbName commercity_v2 -RetentionDays 30
  ```
  Resultado: `backups/backup_<db>_<marca>.sql.gz` (o `.sql.gz.7z` si se cifro).
- Restauracion:
  ```powershell
  7z x .\backups\backup_<db>_<marca>.sql.gz.7z   # si quedo cifrado (pide la clave)
  7z x .\backups\backup_<db>_<marca>.sql.gz
  $env:MYSQL_PWD = "<clave admin>"
  Get-Content .\backups\backup_<db>_<marca>.sql -Raw | mysql -u root --default-character-set=utf8mb4 <db-destino>
  ```
- Los respaldos **NUNCA** se versionan (`backups/` esta en `.gitignore`): contienen hashes bcrypt y datos personales (R-2/M-GIT-1). Conservarlos cifrados y fuera del repositorio; retencion sugerida 30 dias.

## Checklist previo a release
1. Suites verde (backend 413/413 en 25 archivos; frontend 25/25 en 7) y cobertura sobre el umbral.
2. `VERSION` y `backend/package.json` sincronizados; sin textos con la version anterior en el repo.
3. Entrada en `docs/CHANGELOG.md`.
4. Sin secretos en el repo (`git status` limpio de `.env`, dumps con bcrypt, `uploads/`, keystores).
5. `event_scheduler = ON` en el MySQL de produccion (EVENTs de limpieza de carritos y purga de tokens).
