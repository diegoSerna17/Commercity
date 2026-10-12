# Correcciones de la auditoría PREVIEW — resumen de lo corregido

- **Fecha**: 2026-10-12
- **Rama**: `fix/auditoria-preview-2026-10-11`
- **Base**: `ec482bb` (v1.2.0, `origin/PREVIEW`) → **versión 1.3.0**
- **Alcance**: 38 commits, 233 archivos (+13.325 / −3.382 líneas) entre `ec482bb` y el tip
- **Fuentes**: `docs/informes/INFORME_AUDITORIA_PREVIEW_2026-10-11.md` (hallazgos), `plan/fix-auditoria-preview-2026-10-11.md` (plan), `docs/informes/INFORME_REAUDITORIA_PREVIEW_2026-10-12.md` (tabla de cierre por ID) y `docs/CHANGELOG.md` (entrada RELEASE 1.3.0)

Este documento resume **qué se corrigió**. No reemplaza al plan ni a la reauditoría: la tabla ID por ID está en la reauditoría. No contiene secretos, hosts ni usuarios de base de datos.

## 1. Resumen ejecutivo

| Severidad | Hallazgos | Estado en código |
|-----------|-----------|------------------|
| Críticos | 2 (R-1, R-2) | R-1 cerrado en código; R-2 mitigado (no se reescribe el historial, DEC-006) |
| Altos | 6 (A-1 … A-6) | Cerrados; A-4 queda pendiente del propietario del repo móvil (keystore) |
| Medios | 40 (M-*) | Cerrados, salvo M-27 (cobertura frontend) que queda **parcial** |
| Bajos / Info | varios | Cerrados |

Además se consolidó `PREVIEW` como única rama de integración con todas las apps (Fase 10) y se hizo el bump a 1.3.0.

## 2. Correcciones por área

### 2.1 Dinero y reglas de negocio (backend)
- **A-1** `confirmarPago`: lectura del carrito con `FOR UPDATE` dentro de la transacción; elimina la carrera de doble confirmación. Test de concurrencia en `__tests__/integration/` (requiere MySQL local desechable).
- **A-2** Reembolso por **monto** y no por estado: el `UPDATE` evalúa `estado` antes de incrementar `monto_reembolsado`; reglas unificadas en `utils/reembolsos.js` (tolerancia ±0,01).
- **A-3** Baneo y cancelación registran el reembolso por línea (`importeReembolsoLinea`) y notifican al comprador; las líneas `En camino` no se desembolsan solas (DEC-004).
- **M-1 … M-7**: cancelación coherente con el historial (DEC-003), autocompra bloqueada (DEC-002), calificaciones solo sobre líneas entregadas con 409 en duplicado, reportes de tienda sin líneas canceladas, eliminación de cuenta con contraseña y resolución de líneas abiertas.
- Commit principal: `4085aaa`; pruebas con MySQL real: `6b3c875`.

### 2.2 Seguridad backend
- **M-16 / H6 / M-9 / H7**: CORS cerrado por defecto (`ALLOW_DESKTOP_ORIGINS`), `trust proxy` por entorno y rate limits por endpoint (`867b309`).
- **M-8 / B-4**: `token_version` en el JWT, `HS256` + `iss` + `aud`, 401 unificado (`8e07e3d`).
- **M-10 / H10**: cifrado v2 (AAD por usuario, KDF, prefijo `v2:`) con re-cifrado perezoso; `utils/cuentaBancaria.js` compartido (`3c33758`).
- **M-11 / M-12**: tabla `auditoria_acciones`, protección de administradores y contraseña adicional para la cuenta bancaria de plataforma (`bb3ef96`).
- **M-13 / H4**: subidas con verificación de magic bytes propia, sin archivos huérfanos y con cupo por usuario (`4d3f2f0`).
- **M-14 / M-15**: reportes sin duplicados, chat paginado y respuestas uniformes contra enumeración (`61ae741`).
- **H5 / H8 / H9 y B-5 … B-9**: contraseña ≤ 72 bytes, BD sin credenciales por defecto, `errorHandler` con estado, cuenta bancaria enmascarada, `escapeLike`, coerción en carrito (`0f4a92a`).
- Consulta única en `authRequired` y limpieza de código muerto (`e92c1d9`).

### 2.3 Frontend web
- **A-5**: el 401 solo redirige cuando había sesión y la ruta no es pública (`e8fb0d2`).
- **F4 / M-8**: cookie httpOnly como único transporte en web, sin Bearer en `localStorage`.
- **M-22**: `RutaProtegida` y `RutaProtegidaRol`, Navbar por rol y code-splitting (`9a842b5`).
- **M-20 / M-21**: perfil público por `vendedor_id`; "siguiendo" solo con sesión (`e570403`).
- **M-28**: la pasarela envía solo `ultimos4_tarjeta` y `marca_tarjeta` (enum Visa/Mastercard/Amex/Otra) (`222c02c`, `1af8cb9`).
- **M-27** (parcial): pruebas de páginas, guards y servicios (`cfd7c93`); bajos de frontend, avatares locales y a11y (`8035784`).

### 2.4 Escritorio y móvil
- **M-17 / M-18**: saneamiento XSS (`escHtml`, `imgSrcSafe`) y delegación de eventos en lugar de `onclick` inline (`e28dd70`).
- **M-19**: Electron con `sandbox`, `webSecurity`, manejo de ventanas y navegación, CSP estricta y Electron 44.7.0 con versión exacta (`da2c1c6`).
- **A-4**: firma Android por entorno, sin credenciales en el repo (`64ef6f3`).
- **M-23 / M-24 / M-25**: `clearSession` total, HTTPS por entorno, cleartext solo en debug, CSP, sin `user-scalable=0` (`dc8fcf1`).
- **M-26**: workflow iOS movido a la raíz con permisos mínimos y acciones fijadas por SHA (`5c4d9c0`).
- Política de contraseña única (8) y token de reset sin persistir (`e6fdbe9`).

### 2.5 Base de datos
- **A-6**: guarda `@permitir_destructivo` y base por defecto `commercity_dev` en schema y seed.
- **M-DB-1 … M-DB-7**: migraciones 000–018 idempotentes con ledger `schema_migrations` y `aplicar-migraciones.mjs`, longitudes de datos bancarios, `UNIQUE (pedido_id, vendedor_id)`, seed coherente y retiro de `multer.chat.js` (RF105 sin adjuntos) (`9965717`).

### 2.6 Secretos, documentación y DevOps
- **R-1**: seed con hashes únicos generados por script y contraseña trivial retirada de READMEs y CHANGELOG (`79ed918`).
- Tests autónomos sin `.env`, `.env.example` sin `root` y validación de secretos al arrancar (`da31058`).
- **M-OPS / M-DOC / M-GIT**: CI raíz, Dockerfile y compose, script de backup, LICENSE, READMEs y `.gitignore` (`7b268aa`); `GET /health` y tarjeta enmascarada (`ab5bd12`).

### 2.7 PREVIEW como única rama (Fase 10)
- Herramientas: `tools/ramas-estado.mjs` (con `--check` y `ramas-permitidas.json`), `traer-movil.mjs`, `sync-version.mjs`, `verificar-version.mjs`.
- Contratos estáticos de móvil (46 rutas) y escritorio contra `docs/api/openapi.json`.
- Workflows `rama-unica.yml` y CI con 4 jobs, `CODEOWNERS` y política de ramas en `docs/guias/contribucion.md` (DEC-008, DEC-010).
- Port funcional del móvil: login JWT, catálogo dinámico y flujo RF4 conservando el endurecimiento.

### 2.8 Versión (VER-001)
- `VERSION`, `backend/package.json`, `apps/*/package.json`, `MARKETING_VERSION` (iOS) y `versionName` (Android) en **1.3.0**; banner dinámico desde `package.json`; OpenAPI regenerado (63 paths, 74 operaciones, 39 esquemas).
- Entrada RELEASE 1.3.0 en `docs/CHANGELOG.md`; el único comentario residual "1.2.0" se actualizó en `c116ed4`.

## 3. Cambios de contrato y de comportamiento a comunicar al equipo

| Cambio | Impacto |
|--------|---------|
| CORS cerrado por defecto | En desarrollo con escritorio/móvil hay que activar `ALLOW_DESKTOP_ORIGINS=true` |
| Cookie httpOnly en web | La web ya no guarda el token en `localStorage`; escritorio y móvil conservan Bearer (DEC-005) |
| Tarjeta | El backend solo acepta `ultimos4_tarjeta` y `marca_tarjeta`; ningún cliente debe enviar el PAN |
| `GET /api/productos` | Nuevo filtro `vendedor_id` |
| `GET /health` | Nuevo endpoint con verificación de BD |
| Migraciones 015–018 | `token_version`, `auditoria_acciones`, longitudes bancarias, `UNIQUE` de calificaciones; aplicar en orden |
| Electron 44.7.0 | Reinstalar dependencias de `apps/escritorio` con `npm ci` |
| Adjuntos de chat | Siguen desmontados (DEC-001) |

## 4. Evidencia registrada

Estos datos provienen de lo ya documentado en la reauditoría y el CHANGELOG. **No se volvieron a ejecutar las suites al redactar este documento.**

- `PasarelaPago.test.jsx` 5/5; pruebas backend del área de pago 45/45.
- `contrato.mjs` de móvil (46 rutas) y de escritorio: OK.
- `verificar-version.mjs 1.2.0`: OK (sin textos de versión obsoleta).
- `docs:api`: 63 paths, 74 operaciones, 39 esquemas, v1.3.0.
- La auditoría base (sobre `4d1873c`) midió 0 vulnerabilidades en `npm audit` y backend con Lines 95,41 %.

## 5. Lo que no se corrigió o queda abierto

| Pendiente | Responsable |
|-----------|-------------|
| Fase 0: rotar contraseñas (admin y seed), clave de firma Android, `JWT_SECRET`, `CRYPTO_SECRET_KEY`, y cerrar la red de la BD | Líder / infraestructura |
| R-2: volcado de BD con datos personales en el historial; reseteo de contraseñas y aviso a titulares (Ley 1581). El historial no se reescribe (DEC-006) | Líder |
| A-4 externo: retirar `commercity.keystore` del repo móvil y registrar clave nueva | Propietario del repo móvil |
| TASK-10.5 congelar el repo móvil, TASK-10.10 archivar/borrar ramas, TASK-10.11 proteger `PREVIEW` | Propietarios de cada repo |
| TASK-9.3 promoción a `commercycity/PREVIEW` de Diego, excluyendo el hunk de CHANGELOG (CON-001) | Requiere autorización explícita |
| M-27: umbral de 70 % Lines del frontend sin reporte global acreditado | Equipo web |
| Idempotencia de migraciones y test de concurrencia contra MySQL real; primera corrida de CI y Docker | Quien tenga MySQL local |
| Prueba del móvil en dispositivo (RISK-010) | Equipo móvil |
| Worktree temporal de la auditoría | Aprobación del usuario para retirarlo |
