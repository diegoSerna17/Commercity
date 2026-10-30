# Memoria del proyecto CommerCity

> Documento portable y versionado. Existe para que **cualquier harness** (Trae, Cursor,
> Copilot, Codex, Claude) lea el contexto estable del proyecto desde el repositorio y no
> desde el perfil del usuario. Ultima actualizacion: 2026-10-25.
>
> Reparto de responsabilidades:
> - **Aqui** vive lo estable y reutilizable: arquitectura, decisiones cerradas, estado verificado, pendientes y lecciones.
> - **`~/.trae/memory/projects/<clave>/project_memory.md`** guarda el detalle diario del harness Trae.
> - **`docs/CHANGELOG.md`** guarda que cambio en el codigo y por que.
> - **`.trae/rules/`** guarda las convenciones obligatorias del proyecto.
>
> Al cerrar una decision o un hito, actualizar este archivo. No duplicar el CHANGELOG.

## 1. Identidad y fuente de verdad

| Elemento | Valor |
|---|---|
| Proyecto | CommerCity, plataforma de comercio electronico para mercados locales |
| Contexto | SENA, Tecnologo ADSO, alternativa Proyecto Productivo (FPI, etapa productiva) |
| Version | 1.3.1 |
| Requerimientos | Documento oficial del Director, version final 2026-08-20 (numeracion vigente) |
| Rama de trabajo | `fix/pendientes-auditoria-2026-10-12` |
| Remotos | `origin` = ECOMMERCE (solo `main`); `commercycity` = PREVIEW (punta de trabajo) |

La numeracion del 20/08 manda. Cambios relevantes frente a versiones descartadas:
cancelacion = RF35, perfil publico = RF110, moneda COP = RF141, IVA en RF48/RF120/RF121/RF140.

## 2. Arquitectura: una sola API, tres clientes

Frase oficial para el instructor: **"una sola API, tres clientes"**. No existen tres APIs.

| Cliente | Carpeta | URL base | Origen CORS permitido |
|---|---|---|---|
| Web (React 19 + Vite) | `frontend/` | `VITE_API_URL` o `http://localhost:3000` | `http://localhost:5173` |
| Movil (Capacitor 8.4, JS puro) | `apps/movil/` | `10.0.2.2:3000` en emulador Android; en dispositivo fisico `http://localhost:3000` con `adb reverse tcp:3000 tcp:3000` (la IP-LAN por HTTP no es valida: `api.js` la rechaza con error `CONFIG` y la CSP no la incluye) | `http://localhost:8080` en navegador |
| Escritorio (Electron 44.7.0) | `apps/escritorio/` | `http://localhost:3000` | `null` / `file://` solo con `ALLOW_DESKTOP_ORIGINS` |

Lo unico que cambia por cliente es la URL base y la allow-list de CORS. El servidor es el
mismo: **13 routers, 74 endpoints, 19 tablas, contrato `{ success, data }` / `{ success, error }`**,
autenticacion JWT con lista negra y RBAC (`comprador | vendedor | administrador`).

Documentacion de la API: `/api/openapi.json` y `/api/docs` (63 paths, 74 operaciones, 40 esquemas Zod).

## 3. Estado verificado

| Medicion | Resultado | Fuente |
|---|---|---|
| Backend | 536/536 pruebas unitarias OK en 36 archivos | CHANGELOG 1.3.1, corrida 2026-10-12 |
| Cobertura backend | Lines 97.02 % (umbral 97) | `backend/vitest.config.js` |
| Frontend | 124/124 pruebas OK en 29 archivos | CHANGELOG 1.3.1 |
| Cobertura frontend real | 41.30 % Lines (888/2150) medido 2026-10-15 | `plan/fix-frontend-pendientes-2026-10-15.md` |
| Integracion MySQL local | 5/5 dinero; 10/10 notificaciones | CHANGELOG 1.3.1 y 2026-10-30 |
| Migraciones | 12/12 aplicadas con ledger `schema_migrations` | CHANGELOG 1.3.1 |

Advertencia: el **75.31 % de cobertura frontend** del CHANGELOG 1.3.1 es **metrica historica
de v8**, no la cobertura real. El umbral configurado es `lines: 70` en
`frontend/vite.config.js` y **M-27 no esta cumplido** (41.30 %). No presentar 75.31 % sin
la salvedad.

## 4. Decisiones cerradas (no reabrir sin el Director)

| Decision | Contenido |
|---|---|
| RF140 | `detalle_pedidos.subtotal` se guarda SIN IVA; `monto_vendedor` y `monto_comision` (90/10) los calcula el backend al aprobar el pago. Sin columna de IVA. |
| RF141 | Moneda COP vigente. El RF141 antiguo (guardar IVA en BD) fue eliminado; su seguimiento queda agendado post-entrega. |
| RF48 | Precio publicado CON IVA incluido; el desglose (subtotal = precio/1.19) ocurre solo en la pasarela. |
| RF46 / RF47 | `productos.estado` es `STORED GENERATED` (deriva de stock): el backend solo lo lee, el formulario lo muestra en solo lectura. Sin migracion. |
| RF36 | Cubierto por frontend: se oculta la linea cancelada en el historial del comprador. |
| RF129 | `getHistorialVentas` excluye por defecto las lineas canceladas (solo con filtro explicito). |
| RF105 | Chat SIN adjuntos: no existe `archivo_url`; el backend rechaza multipart con 400. Los tres clientes deben enviar JSON `{ receptor_id, mensaje }`; movil y escritorio se corrigieron el 2026-10-25 (antes enviaban `FormData` y el chat fallaba). |
| Estados | `detalle_pedidos.estado_envio` por linea; `pedidos.estado_pedido` no existe. |
| Borrado | Prohibido el DELETE fisico de historicos: borrado logico (`activo`, `suspendido`, `deleted_at`). |

## 5. Gobernanza

- Sin RF respaldado y sin aval del Director no se implementa nada nuevo; se documenta y se agenda.
- Priorizacion P0 (bloquea RF vigente), P1 (valor real con aval), P2 (sin RF, solo con propuesta formal).
- `git push` a `main`/`master` solo con confirmacion explicita. Nunca `--force`, nunca `git add .`.
- Nada de secretos en prompts, logs, commits ni archivos versionados.
- Sin comandos en servidores remotos: se entregan redactados para copiar.

## 6. Pendientes abiertos (2026-10-25)

1. **TypeScript (propuesta externa, sin RF)**: decision documentada el 2026-10-24 en
   `docs/guias/typescript-adopcion-incremental.md`: NO migrar en este ciclo (el proyecto esta
   en cierre con 74 endpoints y 13 routers); queda una ruta incremental por niveles (0 a 3) con
   su riesgo y costo. No implementado: no se instalo TypeScript ni se creo `tsconfig.json`.
   Pendiente: aval del lider Backend/API y linea base de errores con Node instalado.
2. **Avance semanal**: cada semana debe exponerse un avance con evidencia fresca (tests,
   endpoints, capturas). El reporte de Backend y API deja de ser opcional.
3. **Companero bloqueado**: sus pruebas corrieron contra BD local, no la del equipo; los
   archivos del frontend viven en `frontend/src/` y se modifican, no se crean.
4. **Rotacion de credenciales H-1..H-4** y keystore Android A-4.
5. Cifras desactualizadas: corregidas el 2026-10-24 en `README.md` (salvedad de cobertura
   frontend), `docs/arquitectura.md` (36 archivos unitarios / 536 pruebas) y `apps/README.md`
   (Electron 44.7.0).
6. Re-medir cobertura de backend y frontend con Node instalado y registrar la salida real.
7. **Sprint 3 (26 al 30 de octubre, asignado por el lider de movil)**: registro y
   seguimiento en `plan/sprint-3-backend-api-rest-2026-10-26.md`. Cubre repositorio al dia y
   publicacion/proteccion de `PREVIEW` (Daniel), estado de la BD del equipo y aclaracion de
   que BD se uso en las pruebas (Meneses, cierra B-2), numeros reales de las suites backend
   y frontend (Jary), primera corrida de CI/contenedores y `/health` (Cristian Rosero), y
   prueba del movil en dispositivo fisico mas correccion del contrato movil (Jhon Parra).
   La tarea de Jhon Parra llego truncada en el mensaje ("resumen de t") y requiere
   confirmacion del lider antes de implementarse.
8. **Verificacion funcional del chat (movil y escritorio)**: el fix del 2026-10-25 dejo el
   envio en JSON, pero falta la prueba real entre dos usuarios con backend y Node corriendo.
   La entrada del CHANGELOG permanece en `Estado: En curso` hasta que exista esa corrida.
9. **APK de Releases no reproducible desde `PREVIEW`**: el binario publicado funciona en el
   celular del lider, pero el repositorio no contiene ningun `config.js` con una URL de API
   alcanzable desde un dispositivo fisico. Queda pendiente que el lider indique la URL usada
   en ese build y se versione el `config.js` de build (decision: documentar la brecha, no
   corregirla en este ciclo).
10. **Prueba de contrato del movil incompleta**: `apps/movil/tests/contrato.mjs` solo coteja
    rutas contra el OpenAPI; no valida metodo ni `Content-Type`, por lo que no habria
    detectado el defecto del chat. Extension registrada como mejora opcional no asignada.

## 7. Lecciones

- Decir "una sola API, tres clientes", nunca "tres APIs".
- El frontend vive en `frontend/src/`, no en `src/` de la raiz.
- PowerShell 5 no soporta `&&`: usar `;`.
- En esta sesion no habia Node instalado: no se usaron binarios `node.exe` de otras aplicaciones.
- Citar cifras solo si estan en el CHANGELOG o en una corrida pegada por el usuario; nunca estimarlas.
- Una prueba de contrato que solo coteja rutas da falsa seguridad: hay que validar metodo y `Content-Type`.
- Antes de proponer una IP-LAN para probar en fisico, revisar las cuatro capas que la bloquean: validacion en `api.js` (error `CONFIG`), CSP de `index.html`, `config.js` que solo actua en el puerto 8080 y cleartext deshabilitado en release. Ruta valida: `adb reverse`.
- Un APK que funciona en un solo dispositivo no es evidencia reproducible mientras el repositorio no contenga la configuracion de red que ese binario usa.

## 8. Enlaces

- Convenciones: `.trae/rules/` (memoria, documentacion de cambios, revision de requerimientos, seguridad, testing).
- Cambios del producto: `docs/CHANGELOG.md`.
- Arquitectura tecnica: `docs/arquitectura.md`.
- Inventario de endpoints: `docs/api/inventario-endpoints.md`.
- Modelo de datos: `docs/bd/modelo-datos.md`.
- Adopcion de TypeScript (decision y niveles): `docs/guias/typescript-adopcion-incremental.md`.
