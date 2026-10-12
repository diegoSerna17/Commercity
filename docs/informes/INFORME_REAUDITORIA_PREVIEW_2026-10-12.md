# Informe de reauditoria PREVIEW — 2026-10-12

- **Rama auditada**: `fix/auditoria-preview-2026-10-11` (tip `1af8cb9` + bump 1.3.0), base `feature/docs-api-zod-openapi` / `origin/PREVIEW` (`ec482bb`, v1.2.0).
- **Fuente**: `docs/informes/INFORME_AUDITORIA_PREVIEW_2026-10-11.md` y plan `plan/fix-auditoria-preview-2026-10-11.md` (v1.1).
- **Metodo**: verificacion estatica + suites dirigidas (sin acceso a la BD compartida ni a servidores; Fase 0 sigue siendo humana).

## Tabla de cierre por ID

| ID | Tema | Estado | Evidencia |
|----|------|--------|-----------|
| R-1 | Seed con hashes triviales + contrasena en docs | Cerrado en codigo | `seed_commercity.sql` 20 hashes bcrypt unicos + `gen-seed-hashes.mjs`; READMEs y CHANGELOG sanitizados. Pendiente humano: rotar cuentas reales (TASK-0.1/0.3). |
| R-2 | Volcado SQL versionado con 183 usuarios | Mitigado, no reescrito | DEC-006: no se reescribe historial (TASK-8.9 con compuerta). Pendiente humano: resets + aviso Ley 1581 (TASK-0.3). |
| A-1 | Carrera en confirmarPago | Cerrado | `FOR UPDATE` en carrito + batch de productos; test de concurrencia en `__tests__/integration/` (TASK-3.9, requiere MySQL local). |
| A-2 | Reembolso por estado en vez de por monto | Cerrado | `SET estado = IF(...)` antes de incrementar + `utils/reembolsos.js` unificado; redondeo +-0,01. |
| A-3 | Baneo/cancelacion sin reembolso por linea | Cerrado | `importeReembolsoLinea` por linea cancelada + guarda de estado; DEC-004 sin auto-desembolso en `En camino`. |
| A-4 | Firma Android con credenciales en repo + keystore versionado en repo movil | Cerrado en este arbol / externo pendiente | `build.gradle` por entorno; keystore fuera del arbol. Pendiente del propietario del repo movil: retirar `commercity.keystore` y registrar clave nueva (TASK-0.2/10.5). |
| A-5 | 401 global redirige desde rutas publicas | Cerrado | `client.js` solo redirige con sesion y ruta no publica; tests 401 anonimo/con sesion. |
| A-6 | Schema/seed destructivos sin guarda | Cerrado | Guarda `@permitir_destructivo` + default `commercity_dev` en schema y seed. |
| M-1..M-7 | Cancelacion, autocompra, calificaciones, tienda, eliminar cuenta | Cerrado | DEC-002/DEC-003 aplicados; `UNIQUE (pedido_id, vendedor_id)` + 409; tienda filtra `Cancelado`. |
| M-8 (F4) | Sesion web con Bearer en localStorage | Cerrado | Cookie httpOnly + `credentials: include`; `token_version` + `HS256/iss/aud`; logout invalida. Escritorio/movil conservan Bearer (DEC-005). |
| M-9/M-16 | CORS abierto + rate limits | Cerrado | Default cerrado (`ALLOW_DESKTOP_ORIGINS`), `trust proxy` por env, limits por endpoint. |
| M-10 | Cifrado sin AAD/KDF, rotacion con perdida | Cerrado | `crypto.js` v2 (`authTagLength:16`, AAD `usuario_id`, KDF, prefijo `v2:`, re-cifrado perezoso). Rotar claves solo con respaldo (RISK-002). |
| M-11/M-12 | Sin auditoria + baneo a admins | Cerrado | `auditoria_acciones` + `utils/auditoria.js`; proteccion de admins y step-up en cuenta plataforma. |
| M-13 | Uploads sin magic bytes, huerfanos | Cerrado | Magic bytes propios (JPEG/PNG/WEBP/GIF), 400/413, `unlink` de huerfanos, cupo por usuario. |
| M-14/M-15 | Reportes duplicados, chat sin pagina, enumeracion | Cerrado | Dedup por (informante, objetivo, abierto); chat paginado + limite Zod; respuestas uniformes. |
| M-17/M-18 | XSS escritorio + onclick inline | Cerrado | `escHtml`/`imgSrcSafe` + delegacion `data-*`; `contrato.mjs` escritorio verifica ausencia de `onclick=` en HTML. |
| M-19 | Electron sin sandbox/CSP | Cerrado | `sandbox:true`, `webSecurity:true`, `setWindowOpenHandler`, CSP estricta, Electron 44.7.0 exacto. |
| M-20/M-21 | Perfil publico por LIKE + siguiendo sin sesion | Cerrado | Filtro por `vendedor_id` + `listarSiguiendo` solo con sesion. |
| M-22 | Rutas web sin guard | Cerrado | `RutaProtegida` + `RutaProtegidaRol` (`/api/usuarios/me`), Navbar por rol. |
| M-23/M-24/M-25 | Movil: sesion, HTTP, CSP | Cerrado | `clearSession` total, HTTPS por entorno, cleartext solo debug, CSP, sin `user-scalable=0`. |
| M-26 | Workflow iOS en apps/movil | Cerrado | Movido a raiz con `contents: read`, SHAs fijos, trigger PREVIEW/PR. |
| M-27 | Cobertura frontend baja | Parcial | 29 ficheros de test; umbral 70% Lines no acreditado con reporte global (solo `v8` sin thresholds). |
| M-28 | PAN de tarjeta al backend | Cerrado (2026-10-12) | Web unificada a `ultimos4_tarjeta`/`marca_tarjeta` (enum); movil sin PAN + direccion >= 5. `PasarelaPago.test.jsx` 5/5. |
| M-DB-1..M-DB-7 | Longitudes, 012, idempotencia, UNIQUE, seed, adjuntos | Cerrado | 015-018 idempotentes + ledger + `aplicar-migraciones.mjs`; `multer.chat.js` eliminado; RF105 sin adjuntos. Idempotencia real pendiente de MySQL local. |
| M-DOC/M-OPS/M-GIT | README, CHANGELOG, CI, Docker, backup, LICENSE, ramas | Cerrado | CI raiz, Dockerfile/compose, `backup.ps1`, LICENSE ISC, `ramas-obsoletas.md`, DRIVE documentado, historial con compuerta. |
| Bajos/Info | B-4..B-9, frontend, schema, contrasena movil (8) | Cerrado | `errorHandler` con status, `escapeLike`, coercion carrito, cuenta enmascarada, code-splitting/a11y, `utf8mb4`, FKs reportes. |
| Fase 10 | PREVIEW unica con todas las apps | Funcional, control activo | `ramas-estado.mjs --check`, `traer-movil.mjs`, `sync/version.mjs`, `rama-unica.yml`, CI 4 jobs, CODEOWNERS, politica DEC-008/DEC-010, port funcional movil (login/catalogo/RF4/endurecimiento). Pendientes con propietarios: archivar ramas (10.10), proteccion PREVIEW (10.11), congelar repo movil (10.5). |
| VER-001 | Bump 1.3.0 + banner + CHANGELOG | Cerrado | VERSION/package.json/apps/MARKETING/versionName en 1.3.0; `verificar-version.mjs 1.2.0` OK; OpenAPI 63 paths v1.3.0; banner dinamico desde `package.json`. |

## Trabajo humano pendiente (no es codigo)

- TASK-0.1..0.5 (rotaciones, red BD), TASK-10.5/10.10/10.11 (propietarios de repos), TASK-9.3 (promocion a `commercycity/PREVIEW` con autorizacion explicita, excluyendo el hunk de CHANGELOG por CON-001), primera corrida de CI/Docker y prueba en dispositivo del movil (RISK-010).
