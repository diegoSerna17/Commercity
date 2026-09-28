# Informe Final — Proyecto Productivo CommerCity

- **Fecha**: 2026-09-25
- **Institución**: SENA — Centro de Comercio y Servicios
- **Programa de formación**: Análisis y Desarrollo de Software (ADSO)
- **Tipo de proyecto**: Proyecto Productivo (alternativa de etapa productiva, Conceptos SENA 100257 y 80558 de 2025)
- **Guías metodológicas aplicadas**: GFPI-G-040 (Etapa Productiva) y GFPI-G-048 (Proyectos Productivos)
- **Documento de requerimientos**: `Commercity 2.0 (optimizado 6)`
- **Rol que suscribe**: Líder de Backend
- **Nota de identidad**: este informe se emite sin nombres personales; los aportes se atribuyen por roles e integrantes del equipo según el acta del proyecto.

---

## 1. Resumen ejecutivo

CommerCity es una plataforma de comercio electrónico multiplataforma (web React, app móvil Ionic/Capacitor y aplicación de escritorio Electron) gobernada por un **backend central REST** construido con Express 5 y MySQL, que expone el contrato único `{ success, data }` / `{ success: false, error: { code, message, details? } }` consumido por los tres clientes.

Al cierre de este informe, el backend está **integrado y cubierto por 328 pruebas automatizadas** (22 archivos, última suite ejecutada el 2026-09-28) con **cobertura de sentencias del 92.01%**, muy por encima del umbral del proyecto (60%). La integración web contra la API real quedó aplicada y verificada con una matriz E2E sobre la base de datos real del proyecto (`commercity_v2`, puerto 3000), y **las tres plataformas (web, móvil y escritorio) están cableadas y verificadas** con E2E vivo (runner 129/129, capa de red 102/102, RF4 12/12). Los hallazgos detectados en esas verificaciones fueron corregidos, incluido el último bug latente de los ENUM de estados (ver sección 6).

---

## 2. Fase de Análisis (fase 1 del proyecto formativo)

- **Problema del contexto**: se requiere una plataforma de comercio electrónico que conecte compradores y vendedores con catálogo, carrito, pedidos, pagos simulados, historial, administración y funcionalidades sociales, operable desde web, móvil y escritorio sobre una única fuente de datos.
- **Fuente única de requerimientos**: el documento oficial del proyecto. Ningún módulo se implementó sin requerimiento funcional (RF) respaldado o sin aval del Director del proyecto; las mejoras sin RF se clasificaron como P2 y quedaron documentadas como propuestas formales (control de scope creep).
- **Brecha detectada en el análisis**: coexistencia de versiones y contratos históricos entre los tres clientes y el backend; se resolvió definiendo el backend central como única autoridad de contratos.

## 3. Fase de Planeación (fase 2)

- **Metodología**: Scrum por sprints, con plan consolidado (`informes/PLAN_SPRINT_API_REST_2026-08-31.md`), asignación de módulos por integrante y definición de terminado (DoD): código + pruebas + evidencia + entrada en CHANGELOG.
- **Priorización P0/P1/P2** aplicada a todo hallazgo y propuesta:
  - **P0 (obligatorio)**: brechas que bloquean un RF vigente — ej. el bug de los ENUM de estados que rompía la cancelación de pedidos (sección 6).
  - **P1 (importante)**: mejoras con valor real y costo acotado, con aval formal.
  - **P2 (opcional)**: mejoras sin respaldo de RF; solo se agendan con trámite formal completo (RF redactado, impacto, responsable y fecha).
- **Protocolo de entrega**: cada lote se documenta en `informes/CHANGELOG.md` con fecha real, archivos, motivo, requerimientos, evidencia y estado.

## 4. Fase de Ejecución (fase 3)

### 4.1 Arquitectura del backend central

- **Stack**: Node.js + Express 5, MySQL2 (pool de conexiones y transacciones con `beginTransaction`/`commit`/`rollback`), autenticación JWT con revocación de tokens, validación de entradas con Zod.
- **Seguridad**: consultas 100% parametrizadas (sin concatenación de entrada del usuario), middleware de autenticación y roles, allow-list de orígenes CORS sin comodín `*` (incluye los orígenes estándar de la WebView de Capacitor), sin credenciales en logs ni en repositorio.
- **Integridad de datos**: transacciones con bloqueo `FOR UPDATE` en los flujos de pedido/cancelación, restitución de stock atómica, notificaciones transaccionales en modo fail-soft, y **borrado lógico obligatorio** (nunca DELETE físico de datos históricos).

### 4.2 Módulos implementados y verificados

| Módulo (prefijo API) | Estado | Observaciones |
|---|---|---|
| Usuarios (`/api/usuarios`) | Integrado | Evidencia histórica aprobada |
| Productos (`/api/productos`) | Integrado | Validación de imágenes y migración de esquema |
| Carrito (`/api/carrito`) | Integrado | Revalidado en matriz E2E web |
| Pedidos e historial (`/api/pedidos`, `/api/historial`) | Integrado | Corrección de ENUM aplicada (sección 6) |
| Mi Tienda (`/api/tienda`) | Integrado | Contrato verificado en puerto 3000 |
| Administración (`/api/admin`) | Integrado | Acceso por rol |
| Reportes y calificaciones (`/api/reportes`) | Integrado | Funcionalidad sin RF respaldada no integrada |
| Chat (`/api/chat`) | Integrado | — |
| Notificaciones (`/api/notificaciones`) | Integrado | Fail-soft transaccional |
| Seguidores — RF106 (`/api/seguidores`) | Integrado | Reincorporado y verificado con 15 pruebas propias |

**Contrato del módulo Seguidores (RF106)** como ejemplo de trazabilidad RF → código → pruebas: listados de seguidos/seguidores, alta con validación de entero positivo, prohibición de auto-seguimiento, 404 para usuario inexistente, 409 para duplicado, baja del seguimiento propio.

### 4.3 Integración de clientes

- **Web React**: integración completa contra la API real aplicada en la rama de trabajo del sprint (cliente `frontend/src/api/client.js` con JWT Bearer; 17/17 pruebas frontend).
- **Móvil (Ionic + Capacitor)**: **CABLEADO Y VERIFICADO (2026-09-28)** — `www/api.js` con los 69 endpoints y migración de todos los handlers a la API real (auth, catálogo, carrito, pasarela con IVA 19% del servidor, perfil, cuenta bancaria, vendedor, admin, social, chat, notifs); credenciales hardcodeadas y `setTimeout` de pago fake eliminados; pendings de la rama cerrados (calificar con `pedido_id` real, chat con ids reales, `ORDER_DATA`→API, botones de cancelar/avanzar estado/marcar notifs). Snapshot versionado en `apps/movil/`.
- **Escritorio (Electron)**: **CABLEADO Y VERIFICADO (2026-09-28)** — `src/api.js` con los 69 endpoints y migración equivalente (precarga de cuentas bancarias, filtro de categorías desde API, perfil público, badge de no-leídas, chat dinámico); objeto `USERS` con credenciales eliminado. Snapshot versionado en `apps/escritorio/`.
- **Verificación por cliente (2026-09-28)**: harness de la capa de red que ejecuta los `api.js` reales = **102/102** y RF4 (recuperación/reset) = **12/12**; guía previa en `docs/informes/GUIA_INTEGRACION_MOBILE_2026-09-25.md`; evidencia en `docs/informes/EVIDENCIA_E2E_CAPA_RED_2026-09-28.md` e `docs/informes/INFORME_ESTADO_INTEGRACION_2026-09-28.md`.

## 5. Fase de Evaluación (fase 4)

### 5.1 Pruebas automatizadas (evidencia principal)

| Indicador | Resultado | Umbral del proyecto |
|---|---|---|
| Pruebas backend (Vitest + supertest) | 328/328 PASSED en 22 archivos (2026-09-28) | — |
| Cobertura de sentencias | 92.01% | ≥ 60% |
| Cobertura de ramas | 81.31% | ≥ 60% |
| Cobertura de funciones | 98.21% | ≥ 60% |
| Cobertura de líneas | 92.55% | ≥ 60% |
| Pruebas frontend | 17/17 PASSED en 4 archivos | — |
| E2E runner (69 endpoints) + capa de red de clientes + RF4 | 129/129 + 102/102 + 12/12 (2026-09-28) | — |

**Validado (2026-09-28)**: la suite completa `npx vitest run --coverage` desde `backend/` (328/328) ya **incluye las 4 pruebas de regresión de ENUM** (casos a–d) de la sección 6; todos los umbrales ≥ 60% cumplidos (proveedor v8).

### 5.2 Verificación E2E

- Matriz E2E web ejecutada contra la base de datos real del proyecto (`commercity_v2`, puerto 3000), con usuarios temporales y evidencia sanitizada (sin tokens, contraseñas ni credenciales).
- Reporte E2E verificado por el líder de backend; los bugs reportados fueron corregidos. Las evidencias históricas que usan el esquema/puerto anteriores (`commercy_v2`, puerto 5000) **no** se presentan como evidencia vigente.
- **Actualización 2026-09-28 (backend vivo `localhost:3000`, BD real `commercity_v2`)**: runner de los 69 endpoints = **129/129** (corregidas 2 causas raíz del propio runner, no del backend: stock mínimo ≥3 en el descubrimiento de `productoA` y expectativa P034 403→404 por RBAC ownership DEF-05).
- **Capa de red de los clientes** (harness que ejecuta el `api.js` real de móvil y escritorio con `localStorage`/`fetch` nativos) = **102/102**, incluidos los rechazos reales de pago B1 (400 dirección corta, 400 formato de tarjeta, **402 PAGO_RECHAZADO** por Luhn), `validacionTienda` (RF130-139) y RBAC 403. **RF4** (recuperación/reset de contraseña) = **12/12** con token de un solo uso y anti-enumeración.
- **Review independiente del código de clientes**: 34 hallazgos (1 crítico de XSS en el panel de admin, 6 altos, resto medio/leve) — todos los bloqueantes corregidos y re-verificados (suite 328/328 + harness 102/102); los 3 residuales (carrito offline, `direccion_envio` en ventas, duplicados de código) cerrados el mismo día. Evidencia: `docs/informes/INFORME_ESTADO_INTEGRACION_2026-09-28.md`.

### 5.3 Evaluación estilo instructor (autoevaluación del entregable)

- [x] Los módulos cumplen los RF/RNF asignados, no solo la interfaz.
- [x] Coherencia entre el documento oficial, la BD real y el código (verificado contra `information_schema` en el caso de los ENUM).
- [x] Evidencias verificables: suites automatizadas con cobertura, matriz E2E, consultas de esquema y CHANGELOG fechado.
- [x] Hallazgos reales (integridad de datos, seguridad, desalineación BD/RF) separados de las notas de integración por convenciones del líder.
- [x] Cobertura de pruebas no inferior a la existente (92.01% > 60%).

## 6. Corrección de calidad destacada: bug latente de los ENUM de estados

En la cancelación de pedidos (por línea y general) el código histórico escribía dos literales **fuera de los ENUM reales** de la BD, lo que rompía la transacción completa con error de MySQL:

| Columna | ENUM real | Literal inválido |
|---|---|---|
| `detalle_pedidos.estado_pago_vendedor` | `('Pendiente','Desembolsado')` | `'Reembolsado'` |
| `pagos_simulados.estado` | `('Aprobado','Rechazado','Pendiente','Reembolsado')` | `'Parcial'` |

**Solución aplicada (sin DDL sobre la BD compartida)**: mapeo a valores válidos en el código — línea cancelada no desembolsada pasa a `'Pendiente'` (se conserva `'Desembolsado'` si ya se desembolsó); el pago pasa a `'Reembolsado'` si se cancelan todas las líneas o permanece `'Aprobado'` si quedan líneas vivas. Se añadieron 4 pruebas de regresión que verifican que jamás se escriben literales fuera de los ENUM.

**Mejora propuesta (P1, pendiente de aval)**: migración `ALTER TABLE` para ampliar ambos ENUM con `'Reembolsado'` y `'Parcial'`, con scripts, impacto y rollback documentados en `informes/PROPUESTA_MIGRACION_ENUM_ESTADOS.md`, para validación conjunta del líder de BD y el instructor. La decisión de mantener el mapeo o aplicar la migración es formal y queda deliberadamente fuera del alcance de este informe.

## 7. Evidencias del portafolio

| Evidencia | Ubicación en el repositorio |
|---|---|
| Plan del Sprint API REST | `docs/informes/PLAN_SPRINT_API_REST_2026-08-31.md` |
| Inventario de endpoints y contratos | `docs/informes/INVENTARIO_ENDPOINTS_API_2026-08-28.md` |
| Estado consolidado de entregas | `docs/informes/INFORME_ESTADO_ENTREGAS_SPRINT_API_REST_2026-09-07.md` |
| Propuesta de migración ENUM (decisión técnica) | `docs/informes/PROPUESTA_MIGRACION_ENUM_ESTADOS.md` |
| Guía de integración móvil | `docs/informes/GUIA_INTEGRACION_MOBILE_2026-09-25.md` |
| Plan de integración API móvil/escritorio | `docs/informes/PLAN_INTEGRACION_API_MOVIL_ESCRITORIO_2026-09-27.md` |
| Informes de rama con cierres (backend/móvil/escritorio) | `docs/informes/INFORME_RAMA_{BACKEND,MOVIL,ESCRITORIO}_2026-09-27.md` |
| Evidencia E2E de la capa de red (102/102, RF4 12/12) | `docs/informes/EVIDENCIA_E2E_CAPA_RED_2026-09-28.md` |
| Estado de la integración: review, fixes y residuales | `docs/informes/INFORME_ESTADO_INTEGRACION_2026-09-28.md` |
| Snapshot versionado de las apps (móvil/escritorio) y builds | `apps/` (ver `apps/README.md`) |
| Bitácora de cambios (fecha real, evidencia y estado) | `docs/CHANGELOG.md` |
| Suites automatizadas backend | `backend/src/server/__tests__/` (22 archivos) |
| Documentación de instalación y ejecución | `README.md` raíz del repositorio |

## 8. Pendientes al cierre del informe

| # | Pendiente | Prioridad | Estado al 2026-09-28 | Responsable |
|---|---|---|---|---|
| 1 | Ejecutar la suite completa backend con cobertura (incluye las 4 regresiones de ENUM) | P0 | ✅ **Cerrado** — 328/328 en 22 archivos, cobertura 92.01% stmts / 92.55% líneas | Líder de backend |
| 2 | Validar y decidir la migración de ENUM (Opción A vs Opción B) | P1 | 🟡 **Código resuelto** (Opción B aplicada, sin DDL); falta la validación formal | Líder de BD + instructor |
| 3 | Regenerar el APK móvil con la configuración CORS vigente | P1 | 🟡 **Documentado** (hoy `cap sync` hecho y pasos completos en `apps/README.md`); falta compilar en un entorno con Android SDK/CI y **rotar `commercity.keystore`** | Integrante de móvil |
| 4 | Cierre documental de escritorio (revisión M4) | P1 | ✅ **Cerrado** — informe de rama, pendings 6/6, review con fixes, snapshot en `apps/escritorio/` | Integrante de escritorio |
| 5 | Demo integrada antes de la fecha de inspección | P0 | ❌ **Pendiente** — requiere demo humana: smoke de UI en emulador (APK) y EXE instalado con capturas | Equipo completo |
| 6 | Comparación final con `commercycity/main` y merge con confirmación explícita del Director | P0 | ❌ **Pendiente** — gobernanza, fuera del alcance técnico | Líder de backend + Director |
| 7 | Sincronizar el trabajo de las apps en los repos BLACK-CODE-JSB (6 archivos c/u sin commitear) | P2 | 📌 **Decisión de equipo** — el snapshot versionado vive en `apps/` (decisión 2026-09-28: no tocar esos remotos por ahora) | Equipo móvil/escritorio |
| 8 | Revisiones/meloras opcionales: pase de review con muse-spark (endpoint sin responder), exponer `vendedor_id` en `GET /api/historial/compras` (hoy se resuelve por nombre), firma real del EXE (`signAndEditExecutable: false`) | P3 | 📌 **Opcionales/bloqueados**, documentados en `INFORME_ESTADO_INTEGRACION_2026-09-28.md` | Líder técnico |

## 9. Conclusiones (enfoque por competencias FPI)

- **Saber**: el equipo demostró dominio de arquitectura REST, modelado de datos relacional, seguridad de APIs (JWT, consultas parametrizadas, CORS allow-list) y trazabilidad de requerimientos (RF → código → pruebas → evidencia).
- **Saber hacer**: la integración de tres clientes sobre un backend único, con 328 pruebas automatizadas y cobertura del 92.01% en sentencias, evidencia la capacidad de resolver problemas reales del contexto productivo simulado exigido por el proyecto formativo.
- **Saber ser**: la disciplina de entrega (CHANGELOG fechado, priorización P0/P1/P2, control de scope creep, decisión técnica documentada con rollback y validación conjunta antes de tocar la BD compartida) refleja responsabilidad, trabajo en equipo y ética profesional.
- El proyecto se encuentra en condiciones de sustentación técnica para la inspección de entregas, con los pendientes de la sección 8 explícitos, priorizados y con responsable asignado.

---

*Informe generado como evidencia del proyecto formativo (FPI) — Acuerdo 009 de 2024, art. 26; guías GFPI-G-040 y GFPI-G-048.*
