---
goal: Cerrar los pendientes del frontend web de PREVIEW (cobertura real, pruebas faltantes, módulos sin referencias, funciones sin persistencia, endpoints sin consumidor y componentes demasiado grandes), empezando por las pruebas
version: 1.1
date_created: 2026-10-15
last_updated: 2026-11-01
owner: Daniel Palacios (líder)
status: 'In progress'
tags: [fix, frontend, web, tests, cobertura, refactor, versionado]
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In%20progress-yellow)

Plan de ejecución para cerrar lo que falta en `frontend/` (React 19 + Vite + Vitest). **Este documento es solo el plan: no modifica código, versión ni CHANGELOG.** Se ejecuta por lotes, y cada lote termina con su propio bump de versión y entrada de CHANGELOG (VER-001).

## Estado al 2026-11-01

- **Lote A: cerrado** en la versión **1.3.4** (commit `ea9828a`). Cobertura real medida: Lines 95,69 % (2066/2159), Statements 94,20 %, Functions 92,02 %, Branches 84,85 %, con 450/450 pruebas en 59 archivos. La numeración original de este documento (Lote A = 1.3.2) quedó obsoleta porque entre el 1.3.2 y el cierre se publicaron 1.3.3 y 1.3.4.
- **Lote B: cerrado en la versión 1.3.5** para TASK-8.1 a TASK-8.4 (formateadores unificados, `useToast` compartido, `PanelControl` 736 -> 185 líneas y `PerfilVendedor` 859 -> 122 líneas). TASK-8.5 (`Inicio`), TASK-8.6 (`Ajustes`, `FichaProducto`, `AgregarProducto`) y el resto de TASK-8.7 siguen abiertos: esos cinco archivos continúan por encima de 350 líneas.
- **Lote C: se mantiene en 1.4.0**, con versión anterior 1.3.5.
- Las cifras de la sección 0 y las fases del Lote A se conservan como registro histórico fechado (2026-10-15); no describen el estado actual.

**Base**: `PREVIEW` = `commercycity/PREVIEW` = `5b11ce4` (verificado con `git ls-remote`, solo lectura). La rama de trabajo es la actual `fix/pendientes-auditoria-2026-10-12`, que está en ese mismo commit y con el árbol limpio. Al 2026-11-01 la rama acumula los lotes A publicados en local hasta `ea9828a` (sin push).

**Fuentes**:
- `plan/CORRECCIONES_AUDITORIA_PREVIEW_2026-10-12.md` y `docs/informes/INFORME_REAUDITORIA_PREVIEW_2026-10-12.md` (M-27 quedó "parcial").
- `plan/fix-auditoria-preview-2026-10-11.md` (Fase 5, TASK-5.1 a TASK-5.7).
- `plan/feature-web-completar-modulos-1.md` (reporte de usuario y perfil público; ya implementado).
- Revisión directa de `PREVIEW` del 2026-10-15 (lint, build, pruebas, cobertura, búsqueda de referencias y comparación de rutas contra `docs/api/openapi.json`).

**Fuera de alcance**: backend (se listan dependencias en la sección 4), escritorio, móvil, Fase 0 de rotación de secretos, la prueba E2E contra la BD real y la promoción a `commercycity/PREVIEW`. Son tareas de otros responsables y están en la Fase 12.

## 0. Línea base medida (2026-10-15)

| Medición | Resultado |
|----------|-----------|
| `npx eslint .` | 0 errores |
| `npx vite build` | OK en 28,5 s. Bundle `index` 247,17 kB (79,39 kB gzip). Mayor chunk de página: `Home` 131,65 kB (38,33 kB gzip) |
| `npx vitest run` | 29 archivos, 124 pruebas, todas pasan (40 a 60 s) |
| `npm run test:coverage` (métrica histórica: solo archivos que algún test carga) | Lines 75,48 %, Statements 72,33 %, Functions 68,82 %, Branches 59,30 %. Umbral actual `lines: 70` en `frontend/vite.config.js:20` |
| **Cobertura real** (todo `src/**/*.{js,jsx}`, sin tests ni `main.jsx`) | **70 archivos. Lines 41,30 % (888/2150), Statements 39,11 %, Functions 32,09 %, Branches 29,66 %** |

**Hallazgo clave**: el 70 % de Lines de M-27 solo se cumple porque v8 omite los archivos que ningún test importa. Con la medición real, M-27 **no está cumplido**. Las cifras "75,31 % Lines" del CHANGELOG 1.3.1 y del plan anterior corresponden a la métrica histórica.

**Archivos con 0 % de Lines (30)**:
- 21 fuera de `components/admin/`: `PanelControl`, `PerfilVendedor`, `AgregarProducto`, `FichaProducto`, `AjustesAdministrador`, `Inicio`, `BankAccountForm`, `SeguidoresModal`, `HistorialDeCompras`, `Restablecer`, `Mensajes`, `Categorias`, `App.jsx`, `DetalleCompras`, `StatsSection`, `carrito.service`, `historialUtils` (.js y .jsx), `perfilVendedorSocial`, `formatPrice` y `Home`.
- Los 9 de `components/admin/`: `AdminBadges`, `AdminIcons`, `AdminModalConfirmarEliminar`, `AdminModalReporte`, `AdminStatCard`, `AdminTablaProductos`, `AdminTablaReportes`, `AdminTablaUsuarios` y `AdminTopBar`.

**Muy bajos**: `NotificacionesDropdown` 4,4 %, `DetallePedidos` 12,5 %, `productos.service` 53,6 %, `tema.js` 57,7 % (ramas 18 %), `Navbar` 60 %, `ReportarUsuario` 61 %, `PerfilPublico` 61 %.

**Nota sobre servicios**: v8 cuenta como cubierta la línea `export const f = () => ...` por el solo hecho de cargar el módulo. Para servicios pequeños la métrica útil es **Functions**, no Lines.

## 1. Requirements & Constraints

### Reglas del usuario y del equipo
- **SEC-001** (CLAUDE.md global): no leer `.env` ni credenciales ni imprimir secretos. Este plan no contiene secretos y las pruebas usan solo datos ficticios.
- **SEC-002**: dependencias con versión exacta; este plan **no agrega dependencias**. Usa las ya instaladas: Vitest 5.0.1, `@testing-library/react` 16.3.3, `@testing-library/user-event` 14.6.7, `@testing-library/jest-dom` 7.0.1, jsdom 30.1.1 y `@vitest/coverage-v8` 5.0.1.
- **SEC-003**: borrar archivos, `git rm`, `git reset`, `git push` y cualquier comando destructivo exigen aprobación explícita en el momento. Prohibido `git add .` y `--force`.
- **SEC-004**: no se modifican controles de seguridad (auth, CORS, permisos) ni se ejecuta contra servidores remotos. Los cambios de backend son otro lote.
- **SEC-005**: capturas de pantalla y OCR están prohibidos sin autorización explícita para esa tarea. La verificación visual de la Fase 12 usa emulación de viewport y el árbol de accesibilidad, no capturas, salvo que el usuario las autorice.
- **VER-001** (CLAUDE.md global): cada lote incluye una tarea explícita de **bump de versión + banner + CHANGELOG** antes de darse por completo, aplicada en el mismo commit; banners con variables dinámicas; buscar la versión anterior en el repo antes del commit. Ver "Procedimiento de release" en el Apéndice A.
- **CON-001**: contrato de respuesta `{ success, data | error }` a través de `request()` de `frontend/src/api/client.js`. Sesión web solo por cookie httpOnly (sin token en storage).
- **CON-002** (convenciones de prueba vigentes): archivo `X.test.jsx` junto al módulo; Vitest con `clearMocks` y `restoreMocks`; `src/test/setup.js` limpia `localStorage` y mocks después de cada prueba; patrón Arrange / Act / Assert como en `pages/Tienda/Tienda.test.jsx`; mocks de `services/*` y de `api/client.js`; `MemoryRouter` para rutas; sin red y sin BD; títulos de `it(...)` en español. `testTimeout` de 15 s.
- **CON-003**: la cobertura no baja respecto al nivel previo en **ninguna** de las dos métricas (histórica y real).
- **CON-004**: formato de CHANGELOG según `.trae/rules/documentacion-cambios.md` (Autor, Archivos, Descripción, Motivo, Requerimientos, Evidencia, Estado); fecha real del sistema; español sin emojis; evidencia **real**, nunca estimada; se inserta al inicio del archivo y se verifica con Grep.
- **CON-005** (`docs/guias/contribucion.md`): commits convencionales `tipo(alcance): descripción`, uno por cambio lógico; `git add` archivo por archivo; PR hacia `PREVIEW`; sin push sin autorización. Según F-10 (2026-10-12) el CHANGELOG vive en `PREVIEW`. Si el líder decide excluir ese hunk al promover a `commercycity/PREVIEW` (CON-001 del plan anterior, TASK-9.3), se hace en ese momento con `git cherry-pick -n` y `git restore --staged docs/CHANGELOG.md`.
- **CON-006**: los conteos passed/total del CHANGELOG salen de una corrida real (la de la sesión o la que pegue el usuario). Para cada paquete se entregan los comandos de las suites afectadas.

### Decisiones pendientes (default recomendado; el usuario puede cambiarlas)
- **DEC-F01** Alcance de versión (**decidido el 2026-11-01**): Lote A = **1.3.4** (cerrado; pruebas, medición real, documentación, honestidad de UI), Lote B = **1.3.5** (refactor sin cambio de contrato), Lote C = **1.4.0** (funciones nuevas de la Fase 10). Un bump por lote cerrado, nunca mezclar lotes. Las versiones 1.3.2 y 1.3.3 que citaba la redacción original ya se publicaron en local, por lo que la numeración se corrió.
- **DEC-F02** Los 5 componentes admin sin referencias (`AdminStatCard`, `AdminTopBar`, `AdminTablaUsuarios`, `AdminTablaProductos`, `AdminTablaReportes`) **no** corresponden exactamente a las secciones inline de `PanelControl.jsx`: les falta restaurar producto suspendido, archivar reporte, el email del usuario y los estados de carga, y usan tokens (`bg-auth-card-bg`) donde el inline usa hex. **Decidido el 2026-11-01 con aprobación explícita: se borran los 5**; los subcomponentes reales se extraen del código inline en TASK-8.3, sin reescribir a ciegas los huérfanos. `pages/Inicio/EstadisticasHero.jsx` (1 línea) se borra.
- **DEC-F03** Medición de cobertura: **default (opción B)**: crear el script `test:coverage:real` (sin umbral) para usarlo durante el lote y, al llegar a la meta, mover `include`/`exclude` y umbrales a `vite.config.js` (TASK-4.2). Alternativa (A): cambiar `vite.config.js` ya y bajar el umbral a la línea base real, subiéndolo por etapas; deja CI rojo o con el umbral aparentemente rebajado.
- **DEC-F04** `Reportar.jsx` acepta un solo archivo con aviso: **default**: mantenerlo así (ya implementado).
- **DEC-F05** Avatar, biografía y dirección no se guardan (el backend solo actualiza `nombre_completo` en `PATCH /api/usuarios/me`): **default A**: en este lote la UI avisa que es vista previa (TASK-6.1); **B**: ampliar el backend (`descripcion_personal`, `direccion_envio`, subida de avatar) en un lote aparte y luego conectar el frontend.
- **DEC-F06** Endpoints sin consumidor (Fase 10), defaults en la tabla de esa fase.
- **DEC-F07** Imágenes de Unsplash en `Inicio.jsx` y `data/fotosProductoPorCategoria.js`: **default**: mantenerlas y documentar la dependencia de terceros; alternativa: autoalojar en `frontend/public/`.
- **DEC-F08** Estrategia de commits y CHANGELOG: **default**: un commit por paquete; **tres entradas de CHANGELOG por lote** con TAG distinto (`TESTS`, `FIX` o `REFACTOR`, `RELEASE`), creadas en el primer commit de su grupo con Estado "En curso" y cerradas en el último con la evidencia final; el commit final del lote lleva **VERSION + sincronización + banners + entrada RELEASE juntos** (patrón del commit `5f80744`). Alternativa literal "todo en un solo commit": exige `git reset --soft` local con aprobación explícita (SEC-003).
- **DEC-F09** `frontend/package.json` está en `0.0.0` y `tools/sync-version.mjs` no lo sincroniza: **default**: no tocarlo y registrarlo como deuda; alternativa: ampliar el script y `verificar-version.mjs`.

## 2. Implementation Steps

> Orden: medir -> probar -> documentar -> limpiar -> refactorizar -> funciones nuevas. Las pruebas van primero porque son la red de seguridad del refactor. Convención de esfuerzo (estimación): S = menos de 1 h, M = 1 a 3 h, L = más de 3 h.

### LOTE A (versión 1.3.4, cerrado): pruebas, medición real, documentación y limpieza

#### Implementation Phase 0 - Preparación y utilidades de prueba

- GOAL-000: partir de una base reproducible y tener las utilidades que evitan repetir código en 30 archivos de prueba.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-0.1 | Confirmar rama `fix/pendientes-auditoria-2026-10-12`, `git status` limpio y base `5b11ce4`. Registrar la línea base de la sección 0 (se reutiliza en el CHANGELOG como "antes"). | | |
| TASK-0.2 | Agregar a `frontend/package.json` el script `"test:coverage:real": "vitest run --coverage --coverage.include=src/**/*.{js,jsx} --coverage.exclude=src/**/*.test.* --coverage.exclude=src/test/** --coverage.exclude=src/main.jsx --coverage.thresholds.lines=0"` (DEC-F03, sin dependencias nuevas; en el JSON las comillas internas van escapadas). Verificar que reproduce Lines 41,30 % y que funciona en `cmd` (Windows) y en `sh` (CI). | | |
| TASK-0.3 | Crear `frontend/src/test/utils.jsx` con: `renderConRutas(ui, { ruta, rutas })` (MemoryRouter), `usuarioFalso(rol)`, fábricas `productoFalso`, `pedidoFalso`, `reporteFalso`, `notificacionFalsa` (datos ficticios), y helpers para `FileReader` e imágenes. Probarlo con un test mínimo `utils.test.jsx`. | | |
| TASK-0.4 | Documentar en `src/test/utils.jsx` (comentario de cabecera) los stubs necesarios en jsdom: mock de `swiper/react` y `swiper/modules` (usados por `Inicio.jsx`), `IntersectionObserver`, `matchMedia`, `URL.createObjectURL`. Agregarlos a `src/test/setup.js` solo si más de un archivo los necesita. | | |
| TASK-0.5 | Evaluar el costo de tiempo: la salida de Vitest avisa que jsdom se crea 29 veces (196 s acumulados). Probar `pool: 'vmThreads'` o `isolate: false` solo si la suite supera 120 s al terminar la Fase 3 (DEC aparte; no cambiar antes). | | |

#### Implementation Phase 1 - Pruebas de servicios

- GOAL-001: que cada función de `services/` se invoque en alguna prueba con URL, método y cuerpo verificados. Métrica de aceptación: Functions del archivo >= 90 %.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-1.1 | `services/carrito.service.test.js` (M): `listarCarrito` GET `/api/carrito`; `agregarProducto` POST con `{ producto_id, cantidad }` y cantidad 1 por defecto; `modificarCantidad` PATCH `/api/carrito/:productoId` `{ cantidad }`; `eliminarProducto` DELETE; verifica que nunca se envía `comprador_id` (H1). Mock de `api/client.js`. | | |
| TASK-1.2 | `services/calificaciones.service.test.js` (S): `calificarVendedor` arma el cuerpo esperado y propaga el error 409 de calificación duplicada. | | |
| TASK-1.3 | `services/perfil.service.test.js` (S): `obtenerPerfilPublico(id)` pide `/api/usuarios/perfil-publico/:id`. | | |
| TASK-1.4 | Ampliar `services/pedidos-historial-admin.test.js` o crear archivos por servicio (M): `pedidos.service` (53,6 % Lines): `obtenerResumenPedido`, `confirmarPago` con `ultimos4_tarjeta` y `marca_tarjeta` y comprobar que **nunca** viaja un PAN; `historial.service`: `listarHistorialCompras` con y sin estado, `cancelarCompra`; `admin.service` (ramas 0 %): las 12 funciones, incluidos `por_pagina=100`, `?revelar=completa` y `guardarMiCuentaBancaria` con `actualizar` verdadero y falso. | | |
| TASK-1.5 | Completar `productos.service.test.js` (M): `crearProducto` y `actualizarProducto` con `FormData` y con imagen opcional, `listarMisProductos`, `listarVendedores` y las ramas de parámetros de `listarProductos`. Objetivo: de 53,6 % a >= 90 % Lines. | | |
| TASK-1.6 | Pruebas de `utils/` (S): `formatPrice` (con 0, nulos, decimales), `historialUtils.js` (`formatCOP`, `numProductosLabel`), `historialUtils.jsx` (`EstadoBadge` por estado y `Avatar` con y sin foto), `data/perfilVendedorSocial.js`, y las ramas de `tema.js` (18 % de ramas: tema inválido, `system`, almacenamiento bloqueado). | | |

#### Implementation Phase 2 - Pruebas de componentes

- GOAL-002: cubrir los componentes compartidos con interacción real (`userEvent`) y sus estados de error. Aceptación: Lines del archivo >= 80 %.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-2.1 | `components/globales/NotificacionesDropdown.test.jsx` (M; hoy 4,4 %): abrir y cerrar; carga inicial desde `notificaciones.service`; estados vacío, cargando y error; `handleMarcarTodas`; `handleClearAll`; `handleDismiss` (sin disparar el clic de la fila); `handleNotificationClick` marca como leída y navega; el contador de no leídas se actualiza. | | |
| TASK-2.2 | `components/inicio/Categorias.test.jsx` (S): carga con `listarCategorias`; no renderiza nada mientras carga ni si la lista viene vacía o falla; seleccionar una categoría navega a `/?categoria=<nombre>` (con `encodeURIComponent`) y la opción de todas navega a `/`; la categoría activa sale de `searchParams`; se cierra con `mousedown` fuera del contenedor; no actualiza estado tras desmontar. | | |
| TASK-2.3 | `components/inicio/FichaProducto.test.jsx` (L; 448 líneas): render con `product`; cierre con Escape y con el botón; `handleCart` sin sesión y con sesión (llama `onAgregarCarrito` con la cantidad); el selector de cantidad se detiene en el stock (`Math.min(stock, ...)`) y se deshabilita si el producto está agotado (RF83); `handleCalificar` con `buscarPedidoDelVendedor` (mock de `listarHistorialCompras`) y `calificarVendedor`; errores 400 y 409; `onReportar` y `onIrPerfilVendedor`. | | |
| TASK-2.4 | `components/perfil/AgregarProducto.test.jsx` (L; 446 líneas): `limpiarPrecio` y `formatearPrecio`; `handlePrecioChange`; `handleImagenChange` (tipo y tamaño); `validarFormulario` campo por campo; modo edición con `producto` (`valoresIniciales`); `handleSubmit` llama `onSubmit(datos, imagen)` y muestra el error del backend; `resetForm`; `onCancel`; carga de categorías. | | |
| TASK-2.5 | `components/perfil/SeguidoresModal.test.jsx` (M): `initialTab`; cambio de pestaña; Escape cierra; `alternarSeguimiento` llama `seguirUsuario` o `dejarDeSeguir` según `estaSiguiendo`; `onChanged` se invoca; estados vacíos. | | |
| TASK-2.6 | `components/tienda/BankAccountForm.test.jsx` (M): validación por campo en `onChange` y `onBlur`; envío correcto llama al servicio y a `onGuardado`; error del backend visible; la cuenta se muestra enmascarada. Verificar los imports reales del componente antes de definir los mocks. | | |
| TASK-2.7 | `components/tienda/StatsSection.test.jsx`, `WelcomeBanner` y `TopBar` (S): `tarjetas` nulo, valores monetarios y `formatearFecha`; `primerNombre`; renderizado de la barra. | | |
| TASK-2.8 | Componentes admin (M): `AdminModalConfirmarEliminar.test.jsx` (texto según `tipo`: Usuario, Producto o Reporte; `onConfirmar`; `onCancelar` con el botón y con clic en el fondo), `AdminModalReporte.test.jsx` (`reporte` nulo no renderiza; `handleEnviar` con texto vacío llama a `window.alert`, así que la prueba debe espiarlo; con texto llama a `onEnviarRespuesta` con `trim`, RF69; `onToggleBanear`, `onPedirEliminarUsuario` y `onPedirEliminarProducto`; modos de apertura) y `AdminBadges.test.jsx` (una prueba por estado). `AdminIcons` queda cubierto por su uso. | | |

#### Implementation Phase 3 - Pruebas de páginas

- GOAL-003: cubrir las páginas sin pruebas y las ramas pendientes de las que ya tienen. Aceptación: Lines >= 75 % por página y sin `act()` warnings.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-3.1 | `pages/IniciarSesion/Restablecer.test.jsx` (S): sin `?token=` muestra "falta el token"; contraseña menor de 8; contraseñas distintas; éxito muestra el mensaje y ofrece volver a iniciar sesión; error del backend (enlace vencido o usado); el token no se guarda en storage. | | |
| TASK-3.2 | `pages/Home.test.jsx` y `App.test.jsx` (M): smoke de `Home`; en `App.jsx` (0 %) probar la tabla de rutas con las páginas perezosas mockeadas: rutas públicas accesibles, rutas protegidas redirigen sin sesión, rutas de vendedor y admin exigen rol (integra M-22 sobre las rutas reales). | | |
| TASK-3.3 | `pages/Perfil/Mensajes.test.jsx` (S): carga con `listarConversaciones`; estados vacío y error; `abrirChat` guarda `activeChat` (`id`, `name`, `avatar`) en `sessionStorage` y navega a `/messages/chat`; el error de carga muestra el mensaje del servicio. | | |
| TASK-3.4 | `pages/Perfil/HistorialDeCompras.test.jsx` y `DetalleCompras.test.jsx` (M): `cargarHistorial` y filtro por estado (si falla, vacía la lista y muestra el mensaje); `mapearPedido`, `etiquetaEstado`, `formatearFecha`, `iniciales`; `manejarCancelar` (RF135: cancela la línea Pendiente, marca `cancelandoId` mientras corre y recarga el historial; error visible); estados vacío y error; `DetalleCompras` cierra con Escape. | | |
| TASK-3.5 | `pages/Perfil/DetallePedidos.test.jsx` (S; hoy 12,5 %): sin `pedido` no renderiza; Escape llama a `onClose` y el listener se retira al desmontar; chip por estado (Entregado, En Camino, Pendiente y estado desconocido); total calculado desde `pedido.productos` con formato `es-CO`. El avance de estado (RF122 y RF124) vive en `Pedidos.jsx`, que ya está cubierto en 90 %. | | |
| TASK-3.6 | `pages/Inicio/Inicio.test.jsx` (L; 660 líneas): mocks de `swiper/react`, `Header`, `FichaProducto`, `Categorias`; carga de la primera página; búsqueda y categoría por `searchParams`; `cargarMasProductos` y paginación; **respuestas fuera de orden** (la guarda `solicitudRef` descarta la más vieja); `manejarAgregarCarrito` sin sesión navega a `/login` y lanza el error, con sesión llama `agregarProducto`; `irPerfilVendedor` navega a `/vendedor/:id` con `state`; `manejarSeleccionBusqueda`; mensaje de error de red. | | |
| TASK-3.7 | `pages/Perfil/PerfilVendedor.test.jsx` (L; 830 líneas): carga paralela con fallos parciales (cada lista cae a vacío y el perfil sigue visible); la bandera `activo` evita actualizar estado tras desmontar; cambio de pestañas; avatar: archivo no imagen avisa, imagen genera vista previa; biografía: editar, cancelar, guardar con `trim` y tope `BIO_MAX_LENGTH`; `abrirSeguidores("seguidores" y "siguiendo")`; alta y edición de producto con recarga (`crearProducto`, `actualizarProducto`). | | |
| TASK-3.8 | `pages/Administrador/PanelControl.test.jsx` (L; 736 líneas): carga de estadísticas, usuarios, productos y reportes; estado de error con reintento; filtros locales de cada sección; `cambiarEstadoUsuario`; eliminar usuario y producto con modal (confirmar y cancelar); `restaurarProducto`; abrir el modal de reporte en cada modo; archivar reporte; `ejecutarAccion` con error; formato de números. | | |
| TASK-3.9 | `pages/Administrador/AjustesAdministrador.test.jsx` (M): carga de la cuenta con `obtenerMiCuentaBancaria`; `validar`; `guardar` crea o actualiza (POST o PUT); Escape cierra; toast con `vi.useFakeTimers` (3 s); `mensajeDeError`. | | |
| TASK-3.10 | Ramas pendientes de pruebas existentes (M cada una), tomadas de las líneas sin cubrir de la sección 0: `Header.jsx` (128-141, 210-281), `Navbar.jsx` (82-102, 139), `PerfilPublico.jsx` (451-583), `ReportarUsuario.jsx` (99-103, 207-210), `Chats.jsx` (80-292), `Carrito.jsx` (105, 117-125, 317), `Pedidos.jsx` (51-153, 318-350), `Ajustes.jsx` (444-457, 500). | | |

#### Implementation Phase 4 - Cobertura real como puerta de calidad y documentación

- GOAL-004: dejar la métrica real como criterio oficial y corregir los números publicados.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-4.1 | Correr `npm run test:coverage:real` y registrar el resultado. **Meta del lote**: Lines >= 80 %, Statements >= 78 %, Functions >= 75 %, Branches >= 60 %. Si alguna no se alcanza, documentar el valor real y los archivos que faltan (no ajustar la meta a posteriori sin dejarlo escrito). | | |
| TASK-4.2 | Mover la medición real a `vite.config.js` (`coverage.include`, `coverage.exclude` y `thresholds`) con cada umbral igual al valor medido menos 2 puntos, y retirar `test:coverage:real` o dejarlo como alias. Verificar que el job `frontend` de `.github/workflows/ci.yml` sigue verde (DEC-F03). | | |
| TASK-4.3 | Corregir `docs/guias/pruebas.md:34` ("Suite: 17 pruebas"): conteos reales, descripción de ambas métricas y comando de cobertura real. | | |
| TASK-4.4 | Corregir `README.md` líneas 3, 307 y 308 ("Frontend: 25/25 pruebas OK (7 archivos)"). Las cifras de backend de esas mismas líneas (413/413) también están desfasadas respecto al CHANGELOG 1.3.1 (536/536): actualizarlas solo con una corrida propia o marcarlas como pendientes. Revisar `frontend/README.md` por la misma razón. | | |
| TASK-4.5 | Buscar con Grep cifras obsoletas de pruebas o cobertura de frontend (`git grep -n -E "25/25\|17 pruebas\|75[.,][0-9]+ ?%"` fuera de `docs/CHANGELOG.md`) y corregirlas. No se reescriben entradas históricas del CHANGELOG: la entrada nueva aclara que 75,31 % era la métrica histórica y que la real era 41,30 %. | | |
| TASK-4.6 | Verificación completa del lote: `npm run lint`, `npm test`, `npm run test:coverage` y `npm run build` en verde; sin `console.error` inesperados en la salida de pruebas. | | |

#### Implementation Phase 5 - Módulos sin referencias (requiere aprobación explícita)

- GOAL-005: no dejar código muerto, o aprovecharlo si ya implementa el refactor (DEC-F02).

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-5.1 | Re-verificar que ninguna página importa `AdminStatCard`, `AdminTopBar`, `AdminTablaUsuarios`, `AdminTablaProductos`, `AdminTablaReportes` ni `EstadisticasHero`: `git grep -n -E "AdminStatCard\|AdminTopBar\|AdminTablaUsuarios\|AdminTablaProductos\|AdminTablaReportes\|EstadisticasHero" -- frontend apps` y revisar ramas abiertas con `git log -S`. Comparar sus props y su JSX con las secciones inline de `PanelControl.jsx` (barra superior, tarjetas, usuarios, productos y reportes) y anotar si son equivalentes. | | |
| TASK-5.2 | **Con aprobación del usuario**: si NO son equivalentes, `git rm` archivo por archivo de los 5 componentes; `EstadisticasHero.jsx` se borra siempre (1 línea sin uso). `AdminBadges` y `AdminIcons` siguen en uso (`AdminModalReporte` importa `AdminBadges`). Si SÍ son equivalentes, se conservan y se adoptan en la Fase 8 (se les escriben pruebas aquí: una por componente). | | |
| TASK-5.3 | Tras borrar o adoptar: `npm run lint`, `npm test` y `npm run build`; la cobertura real no baja. | | |

#### Implementation Phase 6 - Honestidad de la interfaz (DEC-F05)

- GOAL-006: que ninguna pantalla aparente guardar algo que no se guarda.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-6.1 | `PerfilVendedor.jsx`: `handleAvatarChange` solo genera una vista previa local (`FileReader`) y `saveBio` solo cambia estado en memoria; ambos se pierden al recargar. Mostrar un aviso visible y accesible ("Vista previa: aún no se guarda en tu cuenta", mismo criterio que la dirección en `Ajustes.jsx:128`) y reemplazar `alert()` por un mensaje en línea, tanto en `PerfilVendedor` como en `AdminModalReporte.handleEnviar` (hoy bloquea con `window.alert`). Pruebas que verifican el aviso y el mensaje en línea. | | |
| TASK-6.2 | El backend devuelve `https://via.placeholder.com/150` como avatar por defecto en `perfil-publico` (`usuarios.controllers.js:527`), un servicio externo ajeno al proyecto. En el frontend normalizar esa URL a `AVATAR_POR_DEFECTO` (`utils/mapearProducto.js:10`, archivo local `public/avatar-placeholder.svg`) con prueba; dejar anotado el seguimiento de backend (devolver `null`). | | |
| TASK-6.3 | Registrar el seguimiento de backend (otro lote, DEC-F05 opción B): ampliar `PATCH /api/usuarios/me` (hoy solo `nombre_completo`, `usuarios.controllers.js:663-676`) con `descripcion_personal` y `direccion_envio`, endpoint de avatar, esquema Zod, OpenAPI y pruebas. `GET /api/usuarios/me` ya devuelve `descripcion_personal`, `direccion_envio` y `foto_perfil` (`usuarios.controllers.js:294-295`). | | |

#### Implementation Phase 7 - Release 1.3.4 (bump de versión + banner + CHANGELOG)

- GOAL-007: cumplir VER-001 para el Lote A. Todo en el **mismo commit** final del lote (DEC-F08).

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-7.1 | Ejecutar el "Procedimiento de release" del Apéndice A con la versión nueva **1.3.4** (anterior: 1.3.3). | Sí | 2026-10-31 |
| TASK-7.2 | Cerrar las entradas de CHANGELOG `TESTS` y `FIX` del lote con la evidencia real y crear la entrada `RELEASE 1.3.4`. Estado "Completado" solo si todo está verde; si queda algo pendiente, indicarlo. | Sí | 2026-10-31 |
| TASK-7.3 | Commit final `chore(release): bump 1.3.4 con CHANGELOG (pruebas frontend y cobertura real)`. Sin push; reportar SHA corto y rama. | Sí (`547e837`; cierre en `ea9828a`) | 2026-10-31 |

### LOTE B (versión 1.3.5): consolidación y división de componentes

> Depende del Lote A: ningún refactor se inicia sin las pruebas de la Fase 3 en verde. Regla: **no se cambia comportamiento**; las pruebas existentes no se editan salvo rutas de importación.

#### Implementation Phase 8 - Consolidación y refactor

- GOAL-008: reducir tamaño y duplicación sin riesgo funcional.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-8.1 | Consolidar formateadores de precio. Hoy hay copias locales en `Header.jsx:10`, `FichaProducto.jsx:14`, `AgregarProducto.jsx:4`, `PerfilVendedor.jsx:42` y `PanelControl.jsx:20` (`formatearNumero`), además de `utils/formatPrice.js` y `utils/historialUtils.js:3` (`formatCOP`). Primero pruebas de caracterización con las salidas actuales de cada copia; luego unificar en `utils/formatPrice.js` solo donde la salida sea idéntica y documentar las diferencias. | Sí | 2026-11-01 |
| TASK-8.2 | Unificar los dos toasts temporizados (`Ajustes.jsx` y `AjustesAdministrador.jsx`, uno con 3,5 s y otro con 3 s) en `src/hooks/useToast.js` con prueba de temporizador. | Sí | 2026-11-01 |
| TASK-8.3 | `PanelControl.jsx` (736 líneas): adoptar `AdminTopBar`, `AdminStatCard`, `AdminTablaUsuarios`, `AdminTablaProductos` y `AdminTablaReportes` si TASK-5.1 los dio por equivalentes; extraer el hook `useAdminPanel` (`cargarDatos`, `ejecutarAccion`, estados de los 4 modales). Meta: menos de 300 líneas. | Sí (185 líneas; los 5 admin se eliminaron y las secciones se extrajeron del inline) | 2026-11-01 |
| TASK-8.4 | `PerfilVendedor.jsx` (830 en el corte del plan; 859 al dividirlo): extraer `usePerfilVendedor` (carga y estado social), `PerfilCabecera` (avatar, datos, estadísticas), `BioEditor`, pestañas y `GrillaMisProductos`. `PerfilPublico.jsx` (588) comparte la misma estructura (tarjeta, avatar, datos, estadísticas): evaluar reutilizar `PerfilCabecera` con las diferencias como props. | Sí (122 líneas; `PerfilPublico` no se tocó) | 2026-11-01 |
| TASK-8.5 | `Inicio.jsx` (660): extraer `HeroCarrusel` (datos de slides a `data/heroSlides.js`), `useCatalogo` (carga, paginación y guarda `solicitudRef`) y `PaginacionCatalogo`. | | |
| TASK-8.6 | `Ajustes.jsx` (499): separar `AjustesPersonales`, `AjustesDireccion`, `AjustesTema`, `AjustesRol` y `AjustesCuenta`. `FichaProducto.jsx` (445): extraer `useCalificacion` y `SelectorCantidad`. `AgregarProducto.jsx` (443): extraer `utils/precioProducto.js` (`limpiarPrecio`, `formatearPrecio`) y `useFormularioProducto`. | | |
| TASK-8.7 | Verificar el tamaño del bundle después de cada extracción (`vite build`): `index` no debe crecer más de 5 % y ningún chunk de página debe superar su tamaño actual. Meta de forma: ningún archivo de componente por encima de 350 líneas. | | |

#### Implementation Phase 9 - Release 1.3.5

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-9.1 | Procedimiento de release del Apéndice A con la versión **1.3.5** (anterior: 1.3.4) y entrada `RELEASE` con la evidencia del Lote B (misma cobertura o mayor; bundle medido). Commit `chore(release): bump 1.3.5 con CHANGELOG (refactor frontend)`. | | |

### LOTE C (versión 1.4.0): funciones nuevas para endpoints sin consumidor

> Requiere la decisión DEC-F06 por endpoint. Cada función se hace con prueba primero y, si toca un contrato, con su esquema Zod y el OpenAPI regenerado.

#### Implementation Phase 10 - Endpoints sin consumidor en la web

Comparación de rutas entre `docs/api/openapi.json` (61 rutas `/api`) y el código de `frontend/src` (método ignorado): el frontend llama 53 y 8 quedan sin consumidor.

| Endpoint sin consumidor | Estado en backend | Default recomendado (DEC-F06) |
|-------------------------|-------------------|-------------------------------|
| `GET /api/productos/:id/validar-stock` | `productos.routes.js:37` | Conectar en `FichaProducto` y `Carrito` antes de confirmar (RF83: la cantidad no puede superar el stock). Evita errores tardíos en el pago |
| `POST /api/usuarios/logout-todas` | `usuarios.routes.js:53` | Conectar un botón "Cerrar sesión en todos los dispositivos" en `Ajustes.jsx` con modal de confirmación; coherente con `token_version` (M-8). No hay RF explícito |
| `GET /api/admin/busqueda` | `admin.routes.js:54` | No conectar por ahora: no hay RF de búsqueda global (RF69 a RF71 son responder reportes, gestionar usuarios y gestionar productos) y el panel ya filtra localmente |
| `GET /api/admin/mi-cuenta-bancaria/masked` y `GET /api/tienda/mi-cuenta-bancaria/masked` | `admin.routes.js:58`, `tienda.routes.js:21` | Verificar el contrato y usar la versión enmascarada para **mostrar**; pedir la completa solo al editar (hoy el frontend lee la completa: `admin.service.js:88` con `revelar=completa` y `tienda.service.js:63`) |
| `GET /api/usuarios/directorio` | `usuarios.routes.js:38` | Sin consumidor web: documentarlo en `docs/api/inventario-endpoints.md` |
| `GET /api/usuarios/admin` | `usuarios.routes.js:59` | Sin consumidor web: documentarlo; el panel usa `/api/admin/*` |
| `GET /api/usuarios` | `usuarios.routes.js:32`, **sin `authRequired`** | No consumir. Avisar al responsable de backend para revisar qué devuelve y si debe exigir sesión |

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-10.1 | Para cada endpoint con decisión "conectar": leer su esquema en `docs/api/openapi.json`, agregar la función al servicio correspondiente (`usuarios.service`, `productos.service`, `admin.service` o `tienda.service`), escribir primero las pruebas del servicio y de la pantalla, e implementar. | | |
| TASK-10.2 | `logout-todas`: función `cerrarTodasLasSesiones` en `usuarios.service.js`; en `Ajustes.jsx` modal de confirmación; al responder OK limpiar la sesión local y redirigir a `/login`; prueba del flujo y del error. | | |
| TASK-10.3 | `validar-stock`: validar al agregar desde `FichaProducto` y antes de abrir la pasarela en `Carrito.jsx`; mostrar el stock real si hay conflicto; pruebas de éxito, conflicto y error de red. | | |
| TASK-10.4 | Cuentas bancarias enmascaradas: vista enmascarada en `BankAccountForm` y `AjustesAdministrador`; la lectura completa solo al entrar en modo edición y nunca persistida en estado más tiempo del necesario. Pruebas de que el valor completo no se renderiza fuera de la edición. | | |
| TASK-10.5 | Registrar en `docs/api/inventario-endpoints.md` qué endpoints no tienen consumidor web y por qué (directorio, usuarios/admin, búsqueda admin si se decide no conectarla). | | |

#### Implementation Phase 11 - Release 1.4.0

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-11.1 | Procedimiento de release del Apéndice A con la versión **1.4.0** (anterior: 1.3.5). Entrada `RELEASE` con los endpoints conectados, pruebas nuevas y OpenAPI regenerado. Commit `chore(release): bump 1.4.0 con CHANGELOG (funciones nuevas frontend)`. | | |

### Transversal

#### Implementation Phase 12 - Verificación manual y pendientes humanos

- GOAL-012: lo que no se puede probar con Vitest y lo que no es de este equipo.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-12.1 | Verificar el responsive de `Carrito`, `Inicio`, `PerfilVendedor`, `PanelControl` y `Ajustes` en 375, 768 y 1280 px usando emulación de viewport y el árbol de accesibilidad (sin capturas, SEC-005; si el usuario las autoriza para esta tarea, se pueden usar). Pendiente histórico: "`Carrito.jsx` responsivo" de TASK-5.6. | | |
| TASK-12.2 | Accesibilidad de modales (`FichaProducto`, `SeguidoresModal`, `DetalleCompras`, `DetallePedidos`, `ReportarUsuario`, modales admin): foco inicial, cierre con Escape, `role="dialog"` y `aria-labelledby`, retorno del foco al disparador. Registrar los hallazgos como tareas nuevas si los hay. | | |
| TASK-12.3 | **Humano (líder)**: ejecutar la matriz E2E de 69 endpoints de `docs/informes/EVIDENCIA_E2E_ENDPOINTS_2026-09-23.md` contra la BD real; registrar el resultado `X/69 OK`. No se encontró en el repositorio el avance "62 de 69" citado en conversaciones. | | |
| TASK-12.4 | **Humano**: Fase 0 (rotación de secretos), `commercity.keystore` del repo móvil, TASK-10.5/10.10/10.11 del plan anterior y TASK-9.3 (promoción a `commercycity/PREVIEW`, con autorización explícita). Ningún `push` de este plan se ejecuta sin esa autorización. | | |

## 3. Alternatives

- **ALT-001**: dejar M-27 "cumplido" con la métrica histórica (75 %). Descartada: es engañosa; el 41 % real indica que más de la mitad del código nunca se ejecuta en pruebas.
- **ALT-002**: pruebas end-to-end con navegador (Playwright o Cypress). Descartada para este plan: requiere dependencia nueva con versión exacta y BD de pruebas; se evalúa aparte. Vitest + Testing Library cubre la lógica de UI.
- **ALT-003**: borrar todos los módulos sin referencias de inmediato. Descartada para los 5 admin: implementan las secciones de `PanelControl` y ahorran trabajo en la Fase 8 (DEC-F02).
- **ALT-004**: refactor antes de las pruebas. Descartada: sin red de pruebas el riesgo de regresión es alto.
- **ALT-005**: persistir avatar, bio y dirección ya mismo en el frontend. Descartada: sin backend no hay dónde guardarlos (DEC-F05 B).

## 4. Dependencies

- **DEP-001**: pruebas y medición no dependen de backend ni de BD (todo mockeado).
- **DEP-002**: Fase 6.3 y DEC-F05 B dependen de un lote de backend (ampliar `PATCH /api/usuarios/me`, endpoint de avatar, Zod, OpenAPI, pruebas).
- **DEP-003**: Fase 10 depende de los contratos de `docs/api/openapi.json` (v1.3.4 al cierre del Lote A; usar la versión vigente al ejecutar la fase) y de la decisión DEC-F06.
- **DEP-004**: Lote B depende de que el Lote A deje la Fase 3 en verde.
- **DEP-005**: la revisión de `GET /api/usuarios` sin `authRequired` y el placeholder externo del avatar son tareas de backend para su responsable.
- **DEP-006**: el job `frontend` de `.github/workflows/ci.yml` ejecuta `lint`, `test:coverage` y `build`; cualquier cambio en `vite.config.js` debe mantenerlo verde.

## 5. Files

- **FILE-001** (nuevos, pruebas de servicios): `services/carrito.service.test.js`, `services/calificaciones.service.test.js`, `services/perfil.service.test.js`; ampliaciones en `services/pedidos-historial-admin.test.js` y `services/productos.service.test.js`.
- **FILE-002** (nuevos, utilidades): `src/test/utils.jsx`, `src/test/utils.test.jsx`, `utils/formatPrice.test.js`, `utils/historialUtils.test.jsx`.
- **FILE-003** (nuevos, componentes): `NotificacionesDropdown.test.jsx`, `Categorias.test.jsx`, `FichaProducto.test.jsx`, `AgregarProducto.test.jsx`, `SeguidoresModal.test.jsx`, `BankAccountForm.test.jsx`, `StatsSection.test.jsx`, `AdminModalConfirmarEliminar.test.jsx`, `AdminModalReporte.test.jsx`, `AdminBadges.test.jsx` (cada uno junto a su componente).
- **FILE-004** (nuevos, páginas): `Restablecer.test.jsx`, `Home.test.jsx`, `App.test.jsx`, `Mensajes.test.jsx`, `HistorialDeCompras.test.jsx`, `DetalleCompras.test.jsx`, `DetallePedidos.test.jsx`, `Inicio.test.jsx`, `PerfilVendedor.test.jsx`, `PanelControl.test.jsx`, `AjustesAdministrador.test.jsx`.
- **FILE-005** (ampliados): pruebas de `Header`, `Navbar`, `PerfilPublico`, `ReportarUsuario`, `Chats`, `Carrito`, `Pedidos`, `Ajustes` y `tema`.
- **FILE-006** (configuración): `frontend/package.json` (script), `frontend/vite.config.js` (cobertura real).
- **FILE-007** (documentación): `docs/guias/pruebas.md`, `README.md` (líneas 3, 307, 308 y 344), `frontend/README.md`, `docs/api/inventario-endpoints.md`, `docs/CHANGELOG.md`.
- **FILE-008** (código de producción, según fase): `PerfilVendedor.jsx`, `utils/mapearProducto.js` o el mapeo de `perfil-publico` (Fase 6); archivos sin referencias (Fase 5); componentes y hooks nuevos (Fase 8); `usuarios.service.js`, `productos.service.js`, `Ajustes.jsx`, `FichaProducto.jsx`, `Carrito.jsx`, `BankAccountForm.jsx`, `AjustesAdministrador.jsx` (Fase 10).
- **FILE-009** (versión, por lote): `VERSION`, `backend/package.json` y `package-lock.json`, `apps/escritorio/package.json` y `package-lock.json`, `apps/movil/package.json` y `package-lock.json`, `apps/movil/android/app/build.gradle`, `apps/movil/ios/App/App.xcodeproj/project.pbxproj`, `frontend/src/constants/buttons.css` y `inputs.css`, `README.md`, `docs/api/openapi.json`, `docs/api/entidades.md`.

## 6. Testing

- **TEST-001**: toda tarea de prueba cierra cuando el archivo nuevo pasa en solitario (`npx vitest run <ruta>`) y la suite completa sigue en verde.
- **TEST-002**: ninguna prueba depende de red, BD, hora real ni orden de ejecución; los temporizadores usan `vi.useFakeTimers`.
- **TEST-003**: cada prueba de página verifica al menos un camino de éxito, un camino de error y un estado vacío.
- **TEST-004**: regresión: las 124 pruebas actuales siguen pasando en cada commit.
- **TEST-005**: criterio de calidad del lote A: cobertura real >= meta de TASK-4.1 y ninguna de las dos métricas por debajo de la línea base de la sección 0.
- **TEST-006**: antes de cada commit: `npm run lint`, `npm test`, `npm run test:coverage:real` (o `test:coverage` después de TASK-4.2) y `npm run build` desde `frontend/`.

Comandos de referencia (el usuario los puede ejecutar o pegar la salida; la evidencia del CHANGELOG usa el conteo real):

```bash
cd frontend
npm run lint
npm test
npm run test:coverage
npm run test:coverage:real
npm run build
```

## 7. Risks & Assumptions

- **RISK-001**: `Inicio.jsx` usa Swiper (ESM y CSS) y animaciones; si no se mockean, las pruebas fallan o tardan. Mitigación: TASK-0.4.
- **RISK-002**: la suite crece y puede pasar de 60 s a más de 120 s (jsdom se crea una vez por archivo). Mitigación: TASK-0.5, `fireEvent` donde no se necesite tipeo realista, `testTimeout` ya en 15 s.
- **RISK-003**: medir la cobertura real hace bajar el número visible (de 75 % a 41 %) y puede generar alarma. Mitigación: explicarlo en el CHANGELOG, en `docs/guias/pruebas.md` y en el reporte final del lote.
- **RISK-004**: refactor sin red de seguridad. Mitigación: Lote B depende del Lote A; extracciones pequeñas, un commit por componente.
- **RISK-005**: borrar un módulo que otra rama use. Mitigación: TASK-5.1 revisa `git grep` en todo el repo y `git log -S` en ramas abiertas; el borrado exige aprobación.
- **RISK-006**: cambiar `vite.config.js` o `package.json` puede dejar CI en rojo. Mitigación: DEP-006 y TASK-4.2 con verificación.
- **RISK-007**: bump de versión mezclado con otro lote. Mitigación: DEC-F01 y DEC-F08; un bump por lote.
- **RISK-008**: las líneas del `package-lock.json` pueden cambiar más de lo previsto al sincronizar la versión. Mitigación: editar solo los dos campos de versión del lockfile y comprobar con `git diff --stat` que cada lockfile cambia 2 líneas.
- **RISK-009**: datos personales en pruebas. Mitigación: usar solo datos ficticios de las fábricas de `src/test/utils.jsx`.
- **ASSUMPTION-001**: `PREVIEW` no cambia durante el lote; si cambia, se integra con `git merge` desde `PREVIEW` antes del release.
- **ASSUMPTION-002**: la versión vigente es **1.3.4** (`VERSION`); el Lote A quedó cerrado en 1.3.4 y los lotes restantes se numeran 1.3.5 (Lote B) y 1.4.0 (Lote C) según DEC-F01.
- **ASSUMPTION-003**: el frontend no muestra la versión en la interfaz (sin `APP_VERSION` en `src/`); el banner dinámico existe solo en backend (y escritorio) y se verifica, no se modifica.
- **ASSUMPTION-004**: los números de Lines de v8 representan líneas ejecutables, no líneas físicas; por eso los porcentajes por archivo no equivalen al número de líneas del archivo.

## 8. Related Specifications / Further Reading

- `plan/CORRECCIONES_AUDITORIA_PREVIEW_2026-10-12.md` y `docs/informes/INFORME_REAUDITORIA_PREVIEW_2026-10-12.md`.
- `plan/fix-auditoria-preview-2026-10-11.md` (Fase 5 y TEST-004).
- `plan/feature-web-completar-modulos-1.md`.
- `docs/guias/pruebas.md`, `docs/guias/contribucion.md`, `docs/api/openapi.json`, `docs/api/inventario-endpoints.md`.
- `.trae/rules/cobertura-tests-por-cambio.md`, `.trae/rules/documentacion-cambios.md`, `.trae/rules/revision-requerimientos.md`.
- `tools/sync-version.mjs` y `tools/verificar-version.mjs`.
- `docs/informes/EVIDENCIA_E2E_ENDPOINTS_2026-09-23.md`.
- Requerimientos citados (documento oficial 2026-08-20): RF69, RF70, RF71, RF83, RF108 a RF110, RF122, RF124.

---

## Apéndice A - Procedimiento de release (se repite al cerrar cada lote)

Se ejecuta con `VERSION_NUEVA` y `VERSION_ANTERIOR` del lote. Todo va en el **mismo commit**.

| Paso | Acción |
|------|--------|
| 1 | Editar `VERSION` con la versión nueva (única fuente). |
| 2 | `node tools/sync-version.mjs`: actualiza `backend/package.json`, `apps/escritorio/package.json`, `apps/movil/package.json`, `MARKETING_VERSION` (iOS) y `versionName` (Android). |
| 3 | Actualizar a mano solo los dos campos de versión de cada `package-lock.json` de backend, escritorio y móvil, y comprobar con `git diff --stat` que son 2 líneas por archivo. |
| 4 | Actualizar `@version` en `frontend/src/constants/buttons.css` y `inputs.css` (los lista `verificar-version.mjs`). |
| 5 | `README.md:344` ("Referencia generada desde Zod (vX.Y.Z)"): reemplazar el número a mano por una referencia que no copie la versión (por ejemplo "ver `VERSION`") para no repetir el problema; si el equipo prefiere conservarlo, actualizarlo. |
| 6 | `cd backend && npm run docs:api && npm run docs:entidades` para regenerar `docs/api/openapi.json` y `docs/api/entidades.md` con la versión nueva. |
| 7 | Banner y consola: comprobar que el banner de arranque y `GET /` del backend y el banner del escritorio leen la versión de `package.json` (variables dinámicas) y que el frontend no muestra ninguna versión fija. No se escribe la versión a mano en ningún texto. |
| 8 | Buscar la versión anterior: `node tools/verificar-version.mjs VERSION_ANTERIOR` debe terminar en `VERSION-CHECK: OK`, y `git grep -n -F "VERSION_ANTERIOR" -- . ':!docs/CHANGELOG.md' ':!*package-lock.json'` no debe devolver textos con la versión obsoleta. |
| 9 | Insertar la entrada `RELEASE` al inicio de `docs/CHANGELOG.md` (después del encabezado `---`) y verificar con Grep el encabezado insertado. |
| 10 | Commit con `git add` archivo por archivo y mensaje `chore(release): bump X.Y.Z con CHANGELOG (...)`. Sin push. |

### Borrador de entrada de CHANGELOG (los valores entre `<>` se completan con datos reales; no se inventan)

```markdown
## <FECHA REAL> - TESTS: cobertura real del frontend y pruebas faltantes (M-27)

- **Autor**: Daniel Palacios (líder) — rama fix/pendientes-auditoria-2026-10-12
- **Archivos**: <lista de archivos de prueba nuevos y modificados>; frontend/package.json; frontend/vite.config.js; docs/guias/pruebas.md; README.md
- **Descripción**: se agregaron <N> archivos de prueba para servicios, componentes y páginas sin cobertura; se mide la cobertura sobre todo `src/` (antes solo sobre archivos cargados por algún test).
- **Motivo**: M-27 figuraba como cumplido con 75,31 % de Lines, pero esa cifra omitía los archivos que ningún test importa; la medición real era 41,30 % Lines, 29,66 % Branches, 32,09 % Functions.
- **Requerimientos**: M-27, CON-004
- **Evidencia**: frontend <passed>/<total> pruebas en <N> archivos; cobertura real Lines <x> %, Statements <x> %, Functions <x> %, Branches <x> % (antes: 41,30 / 39,11 / 32,09 / 29,66); lint y build verdes.
- **Estado**: Completado | En curso
```

## Apéndice B - Definición de terminado por lote

- **Lote A (1.3.4, cerrado el 2026-10-31)**: Fases 0 a 7 hechas; lint, pruebas, cobertura real y build en verde; metas de TASK-4.1 superadas (Lines 95,69 %); README y guía de pruebas con cifras reales; avisos de vista previa en `PerfilVendedor`; `verificar-version.mjs 1.3.3` en OK; entradas `TESTS`, `FIX` y `RELEASE 1.3.4` en el CHANGELOG; commit final sin push. Los 5 componentes admin huérfanos se conservaron como deuda por decisión del líder y se resuelven en el Lote B.
- **Lote B (1.3.5)**: los 5 componentes admin sin referencias eliminados; formateadores de precio unificados con prueba de caracterización; toasts unificados; ningún componente de página por encima de 350 líneas; pruebas del Lote A sin editar (salvo importaciones); bundle dentro de los límites de TASK-8.7; entrada `RELEASE 1.3.5`.
- **Lote C (1.4.0)**: cada endpoint decidido como "conectar" tiene servicio, pantalla y pruebas; OpenAPI regenerado; `inventario-endpoints.md` actualizado; entrada `RELEASE 1.4.0`.
- **Transversal**: pendientes humanos (TASK-12.3 y TASK-12.4) entregados al líder con la lista exacta; nada se publica sin autorización.
