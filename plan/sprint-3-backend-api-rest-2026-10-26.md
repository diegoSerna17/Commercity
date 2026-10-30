---
goal: Registrar el Sprint 3 (Backend y API REST, 26 al 30 de octubre) asignado por el lider de movil, con responsables, entregables, evidencia esperada y el estado real conocido de cada frente
version: 1.1
date_created: 2026-10-25
last_updated: 2026-10-25
owner: Daniel Palacios (lider)
status: 'Assigned'
tags: [sprint, backend, api, preview, bd, tests, ci, movil]
---

# Sprint 3 - Backend y API REST (26 al 30 de octubre)

Registro de la asignacion recibida del **lider de movil** para el cierre de validaciones
pendientes del proyecto. Este documento es solo registro y seguimiento: no modifica codigo,
version ni el alcance de ningun RF.

**Base del repositorio al registrar el sprint (verificado 2026-10-25)**

| Dato | Valor |
|---|---|
| `PREVIEW` local | `5b11ce4` |
| `commercycity/PREVIEW` | `5b11ce4` (sincronizado) |
| Divergencia local vs `PREVIEW` | `0 / 0` |
| `VERSION` | `1.3.1` |
| Rama de trabajo | `fix/pendientes-auditoria-2026-10-12` (mismo commit que `PREVIEW`) |
| Arbol de trabajo | 6 archivos modificados y 4 sin seguimiento (cierre documental del 2026-10-24 sin commit) |

## 1. Asignacion de tareas

| Responsable | Tarea asignada | Entregable esperado | Estado real conocido al 2026-10-25 |
|---|---|---|---|
| **Daniel Palacios** | Dejar el repositorio al dia y publicar la rama; proteccion de ramas; publicar en PREVIEW; avance semanal | Rama publicada, proteccion activa en `PREVIEW`, push a `PREVIEW` y reporte de avance con evidencia | Pendiente. El arbol tiene 17 rutas sin versionar (12 modificadas y 5 sin seguimiento: `AGENTS.md`, `docs/MEMORIA_PROYECTO.md`, `docs/guias/typescript-adopcion-incremental.md`, `plan/fix-frontend-pendientes-2026-10-15.md` y `plan/sprint-3-backend-api-rest-2026-10-26.md`; entre las modificadas estan `docs/CHANGELOG.md`, el par `api.js`/`app.js` de movil y de escritorio, y `apps/movil/README.md`). La proteccion de `PREVIEW` figura como pendiente H-6 desde el cierre 1.3.1 |
| **Meneses** | Verificar el estado de la base de datos del equipo y aclarar cual BD se uso en las pruebas | Inventario de la BD real del equipo (tablas, migraciones aplicadas, ledger) y aclaracion explicita de la BD usada por las pruebas | Pendiente y con antecedente abierto: **B-2** (contradiccion del CHANGELOG sobre la BD compartida) sigue sin cerrar. Tras el paquete A-2, `DB_NAME` por defecto paso de `commercity_v2` (compartida) a `commercity_dev` (local). La integracion 5/5 se corrio en `commercity_dev` local, no en la BD del equipo |
| **Jary** | Ejecutar la suite completa del backend y del frontend y registrar los numeros reales de la corrida | Salida pegada de ambas suites con conteo `passed/total` y cobertura | Ultima cifra registrada: backend **536/536** en 37 archivos (cobertura 97.02 % Lines) y frontend **124/124** en 29 archivos (cobertura real 41.30 % Lines). No hay corrida nueva desde el 2026-10-15; la sesion del 2026-10-24 no tuvo Node instalado |
| **Cristian Rosero** | Primera corrida de integracion continua y contenedores; verificar el chequeo de salud del servidor | Corrida real de CI, build de contenedores y respuesta de `/health` | Pendiente. CI y Docker estan escritos pero **nunca se ejecutaron**; el endpoint `GET /health` existe y esta montado en la raiz de la API |
| **Jhon Parra** | Prueba del movil en dispositivo fisico (login, catalogo y detalle) y correccion del contrato movil (roles en minuscula, resumen de t[**texto truncado en el mensaje original**]) | Evidencia de la prueba en dispositivo y correcciones de contrato aplicadas | Pendiente la prueba en dispositivo. Revision del repositorio movil (2026-10-25): **roles ya en minuscula** en `applyRoles` (`vendedor`/`administrador`, coherente con `roles.nombre` de la BD) y **resumen de totales ya alineado** (`/api/pedidos/resumen` devuelve `totales:{subtotal,iva,total}` y el movil lo lee igual); el segundo punto de la tarea sigue sin confirmar |

> **Nota de fidelidad**: la asignacion de Jhon Parra llego cortada en el mensaje original
> ("resumen de t"). No se completa por inferencia: se registra tal como se recibio y se
> solicita la confirmacion del lider antes de implementar ese punto.

## 2. Contexto del estado movil reportado por el lider

- La aplicacion Android funciona con normalidad en el dispositivo del lider; se solicita
  probarla en otros celulares Android para confirmar compatibilidad.
- Se invita a todo el equipo a probar desde sus celulares, **solo Android**.
- La version para Apple esta preparada pero **no ha sido probada**.
- El lider esta cerrando los ultimos detalles solicitados para la publicacion y
  actualizacion de la aplicacion.
- La version Android mas reciente esta en la seccion **Releases de GitHub**, firmada con su
  keystore desde el inicio de la estructura del proyecto.
- Esta en curso la actualizacion de los archivos y el APK en GitHub, y de la version para
  Apple en la App Store.

## 2.1 Hallazgos de la revision del repositorio movil (2026-10-25)

- **Corregido**: el chat enviaba `FormData` (multipart) a `POST /api/chat` y el backend responde
  **400** (`rechazarMultipartChat`, decision RF105 sin adjuntos). Se cambio a JSON en
  `apps/movil/www/api.js` y `apps/escritorio/src/api.js`, con sus llamadores. El chat no funcionaba
  en ninguno de los dos clientes.
- **Ruta de prueba en dispositivo fisico (decidida)**: USB + `adb reverse tcp:3000 tcp:3000` y
  `window.COMMERCITY_API_URL = "http://localhost:3000"` en un `config.js` de desarrollo. La IP-LAN
  por HTTP no es viable: `api.js` la rechaza (error `CONFIG`) y la CSP de `index.html` no la incluye.
- **Brecha abierta (APK de Releases)**: el APK publicado funciona en el celular del lider, pero el
  repositorio no contiene ningun `config.js` ni URL de API alcanzable desde un dispositivo fisico.
  El binario no es reproducible desde `PREVIEW`; falta que el lider indique la URL usada en ese build.
- **Cobertura**: la unica prueba del movil es `apps/movil/tests/contrato.mjs` (estatica, valida rutas
  contra el OpenAPI); no detecta el defecto del chat porque no revisa metodo ni `Content-Type`.

## 3. Dependencias y riesgos detectados

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| El cierre documental del 2026-10-24 no esta commiteado | "Repositorio al dia" y "publicar en PREVIEW" no se pueden cumplir sin commit | Commit por cambio logico con archivos nombrados uno a uno y push a la rama de trabajo |
| B-2 sin cerrar (BD compartida vs local) | La aclaracion de Meneses y el numero de Jary pueden quedar sobre BD distintas | Meneses debe reportar `schema_migrations` de la BD del equipo y el `DB_NAME` efectivo de la corrida |
| Cobertura frontend real 41.30 % vs meta 80 % | El avance semanal no es defendible sin plan de cierre | Lotes A/B/C de `plan/fix-frontend-pendientes-2026-10-15.md` (no asignados en este sprint) |
| Tarea de Jhon Parra truncada | Riesgo de implementar alcance inventado | Confirmacion explicita del lider antes de tocar el contrato movil |
| CI y contenedores nunca ejecutados | Un fallo de CI puede aparecer en la primera corrida | Cristian ejecuta y pega la salida real; no se reporta como exitoso sin evidencia |
| El APK de Releases no es reproducible desde `PREVIEW` | La prueba en otros celulares no estaria validando el codigo del repositorio | El lider indica la URL/config usada en el build publicado y se versiona el `config.js` de build |

## 4. Trazabilidad con pendientes ya abiertos

- H-6 (proteger `PREVIEW`) queda cubierto por la tarea de Daniel Palacios.
- B-2 (contradiccion de BD compartida) queda cubierto por la tarea de Meneses.
- Primera corrida de CI/Docker queda cubierta por la tarea de Cristian Rosero.
- Prueba en dispositivo fisico y contrato movil quedan cubiertos por la tarea de Jhon Parra.
- Numeros reales de las suites quedan cubiertos por la tarea de Jary.
- **No cubierto en este sprint**: Lote A/B/C del frontend web (cobertura), E2E de los 74
  endpoints contra BD real, rotacion de credenciales H-1..H-4 y keystore Android A-4.

## 5. Criterio de cierre del sprint

Cada tarea se considera cerrada solo con evidencia pegada por su responsable: salida real de
la suite, `SHOW CREATE TABLE` / `SELECT` sobre la BD del equipo, log de la corrida de CI,
respuesta de `/health`, o captura de la prueba en dispositivo. Sin evidencia no se marca como
terminada y no se reporta avance en el consolidado semanal.

## 6. Referencias

- Estado verificado y decisiones cerradas: `docs/MEMORIA_PROYECTO.md`.
- Registro de cambios: `docs/CHANGELOG.md`.
- Pendientes de frontend: `plan/fix-frontend-pendientes-2026-10-15.md`.
- Auditoria PREVIEW: `plan/CORRECCIONES_AUDITORIA_PREVIEW_2026-10-12.md`.
- Inventario de endpoints: `docs/api/inventario-endpoints.md`.
