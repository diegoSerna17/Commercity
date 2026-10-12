---
goal: Completar los modulos pendientes del frontend web de CommerCity (reportar usuario y perfil publico)
version: 1.1
date_created: 2026-10-08
last_updated: 2026-10-08
owner: Daniel Palacios (lider)
status: 'Completed'
tags: [feature, frontend, web, commerciudad]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-green)

Plan para cerrar los huecos reales del frontend web del working tree local, verificados contra el backend central. El backend YA expone todos los endpoints necesarios (`POST /api/reportes` con `tipo: "Usuario"`, `GET /api/usuarios/perfil-publico/:id`, `POST/DELETE /api/seguidores`, `POST /api/calificaciones/vendedor`), y el frontend local ya conecta RF4 (recuperar/restablecer), cambio de rol (`PATCH /api/usuarios/me/rol`), perfil publico y calificaciones. Por tanto el alcance se reduce a acciones de UI muertas/sin fuente y a la cobertura de tests del frontend.

Hallazgos verificados (2 fuentes: routers del backend y codigo del frontend local):

| Hueco | Ubicacion exacta | Estado verificado |
|---|---|---|
| Boton "Reportar" sin `onClick` (reportar USUARIO, RF108/RF109) | `frontend/src/pages/Perfil/Chats.jsx` lineas 282-284 | MUERTO (sin handler) |
| Boton "Ver Perfil" sin `onClick` (perfil publico RF110) | `frontend/src/pages/Perfil/Chats.jsx` lineas 279-281 | MUERTO (sin handler) |
| Accion "Reportar usuario" ausente y rating hardcodeado en `5.0` | `frontend/src/pages/Perfil/PerfilPublico.jsx` (rating en linea 315) | INCOMPLETO |
| Cobertura de tests frontend | `frontend/src/**/*.test.{js,jsx}` (solo 4 archivos) | BAJA |

Ya implementado (NO tocar, verificado con grep): tema claro/oscuro en `frontend/src/pages/Perfil/Ajustes.jsx` (`OPCIONES_TEMA`, `obtenerTemaGuardado`, `guardarTema`, `utils/tema.js`); seguir/dejar de seguir y enviar mensaje en `PerfilPublico.jsx`.

## 1. Requirements & Constraints

- **REQ-001**: El boton "Reportar" de `Chats.jsx` (lineas 282-284) debe abrir un modal de reporte de USUARIO (RF108/RF109) reutilizando `crearReporte({ tipo: "Usuario", usuarioReportadoId })` de `frontend/src/services/reportes.service.js` (ya soporta `usuario_reportado_id`).
- **REQ-002**: El boton "Ver Perfil" de `Chats.jsx` (lineas 279-281) debe navegar al perfil publico del contacto (`navigate(\`/vendedor/${contacto.id}\`)`), ruta ya declarada en `frontend/src/App.jsx` linea 70 (RF110).
- **REQ-003**: `PerfilPublico.jsx` debe incorporar la accion "Reportar usuario" (RF108/RF109) con el mismo patron de modal que `components/inicio/Reportar.jsx`.
- **REQ-004**: El rating del vendedor en `PerfilPublico.jsx` (literal `5.0` en linea 315) no debe mostrarse si no proviene de una fuente real; el backend actual no expone el promedio del vendedor (RF49/RF107).
- **REQ-005**: Agregar tests frontend para los modulos tocados (servicios y paginas), siguiendo el patron existente (Vitest + `@testing-library/react` + jsdom).
- **SEC-001**: El informante de un reporte lo determina el backend desde el JWT; el frontend NUNCA envia el id del informante en el body (coherente con `reportes.service.js`).
- **SEC-002**: No exponer datos sensibles del usuario reportado; solo enviar `usuario_reportado_id` y `motivo` (y evidencia opcional).
- **CON-001**: Contrato de respuesta `{ success, data/error }` a traves de `request()` de `frontend/src/api/client.js`.
- **CON-002**: Reutilizar servicios existentes (`reportes.service.js`, `seguidores.service.js`, `calificaciones.service.js`, `perfil.service.js`); NO crear servicios nuevos.
- **CON-003**: El modal no debe reportar a uno mismo; si el contacto es el usuario autenticado, el boton se deshabilita.
- **GUD-001**: Seguir el patron del modal existente `frontend/src/components/inicio/Reportar.jsx` (validacion de sesion, `aria-labelledby`, estados de error/exito).
- **GUD-002**: Usar variables CSS del proyecto (`--color-*`); no introducir colores hardcodeados nuevos.
- **PAT-001**: Patron de modal accesible reutilizable (foco, `role`, cierre con `onClose`).
- **PAT-002**: Patron de test vigente en `frontend/src/pages/Carrito/Carrito.test.jsx` y `frontend/src/api/client.test.js`.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Habilitar el reporte de usuarios (RF108/RF109) desde el chat y el perfil publico.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Crear el componente `frontend/src/components/perfil/ReportarUsuario.jsx`: modal accesible (`role="dialog"`, `aria-labelledby`), props `{ usuario: {id, nombre}, onClose }`, valida `getCurrentUser()` (si no hay sesion, mensaje "Inicia sesion para reportar un usuario."), envia `crearReporte({ tipo: "Usuario", usuarioReportadoId: usuario.id, motivo, evidencia })` y muestra estados de error/exito. NO envia id del informante (SEC-001). | Si | 2026-10-08 |
| TASK-002 | En `frontend/src/pages/Perfil/Chats.jsx`: agregar estado `reportarAbierto` y el handler `onClick` al boton "Reportar" (lineas 282-284) que abre `<ReportarUsuario usuario={{ id: contacto.id, nombre: contacto.name }} onClose={...} />`. Deshabilitar el boton si `contacto.id === getCurrentUser()?.id` (CON-003). | Si | 2026-10-08 |
| TASK-003 | En `frontend/src/pages/Perfil/PerfilPublico.jsx`: agregar un boton "Reportar" (icono + texto) en el bloque de acciones (junto a Seguir/Enviar mensaje, lineas 320-373) que abre `<ReportarUsuario usuario={{ id: vendedor.id, nombre: vendedor.nombre }} onClose={...} />`, oculto/deshabilitado si es el propio perfil. | Si | 2026-10-08 |

### Implementation Phase 2

- GOAL-002: Conectar el boton "Ver Perfil" y corregir el rating sin fuente en el perfil publico.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-004 | En `frontend/src/pages/Perfil/Chats.jsx`: agregar `onClick={() => navigate(\`/vendedor/${contacto.id}\`)}` al boton "Ver Perfil" (lineas 279-281). `navigate` ya esta disponible en el componente (linea 38). | Si | 2026-10-08 |
| TASK-005 | En `frontend/src/pages/Perfil/PerfilPublico.jsx` linea 315: reemplazar el literal `5.0` por un valor derivado de una fuente real o, si no existe, ocultar el bloque de estrellas. El backend NO expone el promedio del vendedor (`getVendedores` solo devuelve `id`/`nombre`); ver ASSUMPTION-001 y RISK-001 antes de decidir. Opcion por defecto: ocultar el bloque cuando no haya promedio disponible. | Si | 2026-10-08 |

### Implementation Phase 3

- GOAL-003: Cubrir con tests frontend los modulos tocados.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-006 | Crear `frontend/src/services/reportes.service.test.js`: verifica que `crearReporte({ tipo: "Usuario", usuarioReportadoId, motivo })` arma el `FormData` con `tipo=Usuario` y `usuario_reportado_id`, y NO incluye el id del informante (SEC-001); mockear `api/client.js`. | Si | 2026-10-08 |
| TASK-007 | Crear `frontend/src/pages/Perfil/PerfilPublico.test.jsx`: render con `react-router-dom` (mock de `useParams`), mock de `perfil.service.js`, `productos.service.js`, `seguidores.service.js`; verificar que se renderiza el nombre, que el boton "Reportar" abre el modal y que no se muestra un rating sin fuente. | Si | 2026-10-08 |
| TASK-008 | Crear `frontend/src/components/perfil/ReportarUsuario.test.jsx`: verificar validacion de sesion (sin usuario), envio exitoso (llamada a `crearReporte`) y estado de error. | Si | 2026-10-08 |

### Implementation Phase 4

- GOAL-004: Documentar el cambio y verificar cierre.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | Agregar entrada en `docs/CHANGELOG.md` con la plantilla canonica (fecha real del sistema, RF108/RF109/RF110, evidencia con conteo `passed` que pegue el usuario). La entrada se inserta SOLO en `main`, nunca en `PREVIEW`. | Si | 2026-10-08 |
| TASK-010 | Verificar que no queden textos de version obsoletos si el cambio toca `APP_VERSION`; bump solo si el lote lo requiere (regla de version manual). Entregar comandos de test y de cobertura para que el usuario los ejecute. | Si | 2026-10-08 |

## 3. Alternatives

- **ALT-001**: Extender `components/inicio/Reportar.jsx` con una prop `tipo` en lugar de crear `ReportarUsuario.jsx`. Descartada: el componente actual esta acoplado a `producto` (titulo "Reportar producto", campo `producto_id`); forzarlo duplica ramas y aumenta el riesgo de romper el flujo de productos.
- **ALT-002**: Exponer `calificacion_promedio` del vendedor agregando un endpoint de backend y consumirlo en `PerfilPublico.jsx`. Descartada en este plan por requerir cambio de contrato fuera del alcance web; queda como mejora (ver RISK-001).
- **ALT-003**: Reusar `admin/components/AdminModalReporte.jsx`. Descartada: es un modal de administracion con otra semantica (bandeja de reportes), no de creacion de reporte por el usuario.

## 4. Dependencies

- **DEP-001**: `POST /api/reportes` acepta `tipo: "Usuario"` y `usuario_reportado_id` (verificado en `backend/src/server/routes/reportes.routes.js` y `reportes.controllers.js`).
- **DEP-002**: `crearReporte` de `frontend/src/services/reportes.service.js` ya arma `usuario_reportado_id` (verificado, lineas 32-38).
- **DEP-003**: Ruta `/vendedor/:id` registrada en `frontend/src/App.jsx` linea 70 y resuelta por `PerfilPublico.jsx`.
- **DEP-004**: `getCurrentUser` de `frontend/src/api/client.js` para validacion de sesion y regla de auto-reporte.
- **DEP-005**: `contacto` disponible en `Chats.jsx` (proviene de `sessionStorage.activeChat`); contiene `{ id, name, avatar }`.

## 5. Files

- **FILE-001**: `frontend/src/components/perfil/ReportarUsuario.jsx` (nuevo) - modal de reporte de usuario.
- **FILE-002**: `frontend/src/pages/Perfil/Chats.jsx` - wire de "Ver Perfil" y "Reportar".
- **FILE-003**: `frontend/src/pages/Perfil/PerfilPublico.jsx` - boton "Reportar" y rating sin fuente.
- **FILE-004**: `frontend/src/components/perfil/ReportarUsuario.test.jsx` (nuevo).
- **FILE-005**: `frontend/src/pages/Perfil/PerfilPublico.test.jsx` (nuevo).
- **FILE-006**: `frontend/src/services/reportes.service.test.js` (nuevo).
- **FILE-007**: `docs/CHANGELOG.md` - entrada del cambio (solo en `main`).
- **FILE-008**: `frontend/src/api/client.test.js` - ajuste de expect por `credentials: "include"` (desfasado tras el commit de cookie F4).

## 6. Testing

- **TEST-001**: `reportes.service.test.js` - `crearReporte` con `tipo: "Usuario"` arma `FormData` correcto y omite el informante.
- **TEST-002**: `ReportarUsuario.test.jsx` - sin sesion muestra aviso; con sesion llama `crearReporte` y muestra exito; error de red muestra mensaje.
- **TEST-003**: `PerfilPublico.test.jsx` - render de nombre y acciones (Seguir, Enviar mensaje, Reportar); no renderiza rating sin fuente.
- **TEST-004**: Regresion - la suite frontend existente (`frontend/src/api/client.test.js`, `Carrito.test.jsx`, `PasarelaPago.test.jsx`, `RutaProtegidaAdmin.test.jsx`) debe seguir verde.
- **TEST-005 (EJECUTADO 2026-10-08)**: suite frontend 25/25 tests passed en 7 archivos; cobertura Lines 62.96% (umbral 60%).

## 7. Risks & Assumptions

- **RISK-001**: No existe endpoint que devuelva el promedio de calificaciones del vendedor (`getVendedores` solo devuelve `id`/`nombre`; el promedio solo se calcula en el detalle de producto `GET /api/productos/:id`). Mostrar el `5.0` actual es informacion falsa. RESUELTO con la opcion por defecto: bloque de estrellas oculto hasta que exista fuente real (mejora post-entrega: ALT-002).
- **RISK-002**: `PerfilPublico.jsx` filtra productos por `vendedor: nombre` (no por id), por lo que puede incluir productos homonimos; fuera del alcance de este plan, registrar como deuda.
- **RISK-003**: El remoto `commercycity` (Diego) solo admite push para actividades de BACKEND; este plan toca FRONTEND. El push debe definirse con el Director (posible `origin`) y NO ejecutarse sin autorizacion explicita.
- **RISK-004**: Regla vigente "EN PREVIEW NO DEBEMOS SUBIR CHANGELOG": el commit del CHANGELOG va unicamente a `main`.
- **ASSUMPTION-001**: Se asume que ocultar el rating cuando no hay fuente es aceptable para el usuario; si requiere el promedio real, aplica RISK-001 y cambia el alcance.
- **ASSUMPTION-002**: `contacto.id` en `Chats.jsx` corresponde al `id` de usuario del contacto (no al id de conversacion), necesario para `usuario_reportado_id`.
- **ASSUMPTION-003**: El backend central (no `commercycity/REVISION`) es la fuente de contrato; `REVISION` quedo descartada por contrato incompatible.

## 8. Related Specifications / Further Reading

- Documento oficial de requerimientos 2026-08-20: `docs/LAST VERSION/Commercity (optimizado)/Commercity (optimizado).docx.md` (RF108/RF109 reportar chat/usuario, RF110 perfil publico, RF49/RF107 calificaciones).
- `.trae/rules/revision-requerimientos.md` (mapeo RF/RNF y decisiones cerradas).
- `.trae/rules/cobertura-tests-por-cambio.md` y `.trae/rules/testing-commercity.md` (umbral y flujo de tests).
- `.trae/rules/documentacion-cambios.md` (plantilla de CHANGELOG).
- `docs/api/inventario-endpoints.md` (inventario de endpoints del backend).
