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

Al cierre de este informe, el backend está **integrado y cubierto por 302 pruebas automatizadas** (20 archivos, última suite ejecutada el 2026-09-25) con **cobertura de sentencias del 91.81%**, muy por encima del umbral del proyecto (60%). La integración web contra la API real quedó aplicada y verificada con una matriz E2E sobre la base de datos real del proyecto (`commercity_v2`, puerto 3000). Los hallazgos detectados en esa verificación fueron corregidos, incluido el último bug latente de los ENUM de estados (ver sección 6).

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

- **Web React**: integración completa contra la API real aplicada en la rama de trabajo del sprint.
- **Móvil (Ionic + Capacitor)**: guía de integración entregada (`informes/GUIA_INTEGRACION_MOBILE_2026-09-25.md`); CORS habilitado para la WebView.
- **Escritorio (Electron)**: cliente API y evidencia en revisión documental.

## 5. Fase de Evaluación (fase 4)

### 5.1 Pruebas automatizadas (evidencia principal)

| Indicador | Resultado | Umbral del proyecto |
|---|---|---|
| Pruebas backend (Vitest + supertest) | 302/302 PASSED en 20 archivos | — |
| Cobertura de sentencias | 91.81% | ≥ 60% |
| Cobertura de ramas | 81.46% | ≥ 60% |
| Cobertura de funciones | 97.54% | ≥ 60% |
| Cobertura de líneas | 92.31% | ≥ 60% |
| Pruebas frontend | 17/17 PASSED en 4 archivos | — |

**Pendiente de validación al cierre**: 4 pruebas de regresión nuevas de los ENUM (casos a–d del test del controlador de pedidos), agregadas con la corrección de la sección 6, en cola para la siguiente ejecución manual de la suite completa (`npx vitest run --coverage` desde `backend/`).

### 5.2 Verificación E2E

- Matriz E2E web ejecutada contra la base de datos real del proyecto (`commercity_v2`, puerto 3000), con usuarios temporales y evidencia sanitizada (sin tokens, contraseñas ni credenciales).
- Reporte E2E verificado por el líder de backend; los bugs reportados fueron corregidos. Las evidencias históricas que usan el esquema/puerto anteriores (`commercy_v2`, puerto 5000) **no** se presentan como evidencia vigente.

### 5.3 Evaluación estilo instructor (autoevaluación del entregable)

- [x] Los módulos cumplen los RF/RNF asignados, no solo la interfaz.
- [x] Coherencia entre el documento oficial, la BD real y el código (verificado contra `information_schema` en el caso de los ENUM).
- [x] Evidencias verificables: suites automatizadas con cobertura, matriz E2E, consultas de esquema y CHANGELOG fechado.
- [x] Hallazgos reales (integridad de datos, seguridad, desalineación BD/RF) separados de las notas de integración por convenciones del líder.
- [x] Cobertura de pruebas no inferior a la existente (91.81% > 60%).

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
| Plan del Sprint API REST | `informes/PLAN_SPRINT_API_REST_2026-08-31.md` |
| Inventario de endpoints y contratos | `informes/INVENTARIO_ENDPOINTS_API_2026-08-28.md` |
| Estado consolidado de entregas | `informes/INFORME_ESTADO_ENTREGAS_SPRINT_API_REST_2026-09-07.md` |
| Propuesta de migración ENUM (decisión técnica) | `informes/PROPUESTA_MIGRACION_ENUM_ESTADOS.md` |
| Guía de integración móvil | `informes/GUIA_INTEGRACION_MOBILE_2026-09-25.md` |
| Bitácora de cambios (fecha real, evidencia y estado) | `informes/CHANGELOG.md` |
| Suites automatizadas backend | `backend/src/server/__tests__/` (20 archivos) |
| Documentación de instalación y ejecución | `README.md` raíz del repositorio |

## 8. Pendientes al cierre del informe

| # | Pendiente | Prioridad | Responsable |
|---|---|---|---|
| 1 | Ejecutar la suite completa backend con cobertura (incluye las 4 regresiones de ENUM) | P0 | Líder de backend (ejecución manual) |
| 2 | Validar y decidir la migración de ENUM (Opción A vs Opción B) | P1 | Líder de BD + instructor |
| 3 | Regenerar el APK móvil con la configuración CORS vigente | P1 | Integrante de móvil |
| 4 | Cierre documental de escritorio (revisión M4) | P1 | Integrante de escritorio |
| 5 | Demo integrada antes de la fecha de inspección | P0 | Equipo completo |
| 6 | Comparación final con `commercycity/main` y merge con confirmación explícita del Director | P0 | Líder de backend + Director |

## 9. Conclusiones (enfoque por competencias FPI)

- **Saber**: el equipo demostró dominio de arquitectura REST, modelado de datos relacional, seguridad de APIs (JWT, consultas parametrizadas, CORS allow-list) y trazabilidad de requerimientos (RF → código → pruebas → evidencia).
- **Saber hacer**: la integración de tres clientes sobre un backend único, con 302 pruebas automatizadas y cobertura del 91.81% en sentencias, evidencia la capacidad de resolver problemas reales del contexto productivo simulado exigido por el proyecto formativo.
- **Saber ser**: la disciplina de entrega (CHANGELOG fechado, priorización P0/P1/P2, control de scope creep, decisión técnica documentada con rollback y validación conjunta antes de tocar la BD compartida) refleja responsabilidad, trabajo en equipo y ética profesional.
- El proyecto se encuentra en condiciones de sustentación técnica para la inspección de entregas, con los pendientes de la sección 8 explícitos, priorizados y con responsable asignado.

---

*Informe generado como evidencia del proyecto formativo (FPI) — Acuerdo 009 de 2024, art. 26; guías GFPI-G-040 y GFPI-G-048.*
