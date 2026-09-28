# Informe de estado de integración API — las 3 plataformas (2026-09-28)

> Cierre de la fase "conectado y verificado". Repo: `danielpalacios665-sys/ECOMMERCE`.
> Backend vivo en `http://localhost:3000`, BD real `commercity_v2`.

## Tabla final plataforma × verificación

| Plataforma | Conectada | Verificación | Evidencia |
|---|---|---|---|
| Web (React) | Sí | `client.js` + `API_BASE_URL` + Bearer; 17/17 unit frontend | integrada desde 2026-09-21 |
| Móvil (Capacitor) | Sí | `www/api.js` (69 endpoints) + **capa de red 102/102** (run del harness sobre su `api.js` real); `node --check` OK; pendings 6/6 cerrados | `INFORME_RAMA_MOVIL` s."Cierre de pendings 2026-09-28" |
| Escritorio (Electron) | Sí | `src/api.js` (69 endpoints) + **capa de red 102/102**; `node --check` OK; pendings 5.x cerrados (smoke 31/31 del agente) | `INFORME_RAMA_ESCRITORIO` s."Cierre de pendings 2026-09-28" |
| Backend (soporte) | Sí | 328/328 tests; runner **129/129** (69 endpoints); CORS Electron `Origin:null`→204 verificado | commit `14d6056` + `EVIDENCIA_E2E_CAPA_RED_2026-09-28.md` |

## E2E con backend vivo (cerrado hoy)

1. **Runner HTTP 69 endpoints: 129/129 OK** (`docs/AVANCES/PRUEBAS/ejecutar_pruebas.mjs`). Corrección previa de 2 causas raíz del runner (no del backend): descubrimiento `productoA` ahora exige `stock>=3` (P020/P023 fallaban con `stock=1` en la BD compartida) y expectativa P034 `403`→`404` (RBAC ownership DEF-05 reemplazó a `requireRoles`, CHANGELOG 2026-09-24).
2. **Capa de red de ambos clientes: 102/102 OK** (`docs/AVANCES/PRUEBAS/harness_capa_red.mjs`) ejecutando los `api.js` reales con shim `localStorage`/`window` y `fetch` nativo, cuentas efímeras, incluye:
   - **B1 pagos reales**: dirección <5 → `400` (zod), tarjeta fuera de formato → `400` (RF118), Luhn inválido → **`402 PAGO_RECHAZADO`**, pago positivo con `4111…` → pedido creado.
   - `validacionTienda` (RF130-139 restaurado) por cliente; RBAC `adminCuentaBancaria` → `403` con rol vendedor.
   - Pago positivo → `calificarVendedor` con `pedido_id` real (RF107) por cliente.
   - Desviación seguidores (`api.seguir` envía `{usuario_id}`, backend valida `{seguido_id}`) demostrada en ambos sentidos.

## Pendings de los informes de rama — estado

| Rama | Pendings | Estado hoy |
|---|---|---|
| Móvil (6) | #1 E2E, #2 rechazo 400, #3 calificar `pedido_id`, #4 chat con ids, #5 4 endpoints con UI, #6 `ORDER_DATA`→API | **6/6 cerrados** (#3-#6 por agente hoy; #1-#2 por E2E/B1 de este informe) |
| Escritorio (6) | 5.1 E2E, 5.2 rechazos 400, 5.3 precarga banco, 5.4 categorías/perfilPublico/badge, 5.5 chat con ids, 5.6 CORS | **6/6 cerrados** (5.3-5.5 por agente; 5.1/5.2 por E2E/B1; 5.6 por commit `14d6056`) |

Nuevas llamadas `api.*` cableadas desde UI hoy: cancelar compra, avanzar estado de envío (1 nivel), marcar notif leída/todas, conversaciones/directorio con ids reales, precarga de cuentas bancarias, filtro de categorías, perfil público, badge de no-leídas, resolución de `vendedor_id` para calificar.

## Versionado

- Snapshot trackeable en **`apps/movil/` y `apps/escritorio/`** (126 archivos, ~2.4MB; ver `apps/README.md` con builds). Excluidos: keystore, dist, node_modules, `assets/public` (regenerable con `cap sync`), temporales.
- Informes y evidencia versionados: `docs/informes/PLAN_*`, `INFORME_RAMA_*` (con sus cierres), `EVIDENCIA_E2E_CAPA_RED_2026-09-28.md` (excepciones en `.gitignore`).

## Builds

- **EXE: HECHO** — `dist/CommerCity Setup 2.0.0.exe` (85.7MB, NSIS, sin firma por privilegio de symlinks; documentado en `apps/README.md`).
- **APK: NO construida** (decisión; esta máquina sin Android SDK/gradle). `npx cap sync android` ya ejecutado sobre el código cableado. Pasos documentados en `apps/README.md`; **rotar `commercity.keystore` antes de release público** (el archivo nunca se versiona).

## Notas de ejecución (honestidad de evidencia)

- **Modelo de agentes**: la instrucción fue `opencode/muse-spark-1.3-contributor-free` (+`xhigh` vía `opencode.jsonc`). Ese modelo fue aceptado por el CLI pero **no respondió** (hang de 240s en prueba trivial "Responde unicamente: OK"); el TUI de los agentes hizo **fallback a MiMo V2.6 Flash** (visible en la barra de estado de los paneles) y todo el trabajo se completó con él. La preferencia muse-spark queda pendiente de un pase de review cuando el endpoint responda.
- Residuos efímeros en la BD compartida (clase runner, sin riesgo): cuentas `harness.*`/`harness2.*` (una dada de baja), pedidos pagados de prueba, calificaciones, reportes, productos `ZzHARNESS` (quedan **Agotados**), cuentas bancarias cifradas efímeras.
- Backend dejado corriendo en el pane Herdr `w4:pG` (`npm start`); detenerlo con Ctrl+C en ese pane si ya no se necesita.
