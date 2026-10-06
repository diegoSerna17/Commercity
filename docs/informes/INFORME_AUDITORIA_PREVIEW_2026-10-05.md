# INFORME DE AUDITORIA COMPLETA - RAMA PREVIEW (CommerCity)

- **Fecha**: 2026-10-05
- **Alcance**: contenido completo de la rama `PREVIEW` (backend, frontend, apps/escritorio, apps/movil, schema/seed SQL, migraciones, CI).
- **Metodologia**: skill `full-project-auditor` (10 fases: alcance, calidad, seguridad, rendimiento, arquitectura, testing, DevOps, documentacion, dependencias, reporte por severidad).
- **Evidencia**: revision estatica de codigo en PREVIEW, `npm audit --omit=dev` (backend y frontend), lectura del workflow iOS, contraste contra RF documento oficial 2026-08-20 y contra `schema_commercity.sql`.
- **Nota de contexto**: la auditoria cubre el ESTADO del codigo en la rama PREVIEW; los hallazgos de dependencias npm son posteriores al ultimo commit y aun no se corrigen.

---

## Resumen ejecutivo

| Area | Veredicto | Hallazgos criticos/altos |
|---|---|---|
| Seguridad backend | DEFICIENTE | 1 Critico (IDOR carrito), 1 Alto (/uploads publico) |
| Arquitectura / calidad backend | BUENO | 1 Alto condicional (columnas GENERATED vs RF140) |
| Frontend y apps cliente | DEFICIENTE | 3 Criticos encadenados (XSS + nodeIntegration = RCE), 2 Altos |
| Base de datos | DRIFT ALTO | Esquema desalineado del codigo y de los RF (verificacion P0) |
| Dependencias npm | REGRESION | 1 Critico (backend), 2 High (frontend) |
| Testing | BUENO | Cobertura ~93.5% Lines (referencia), suites Vitest+Supertest |
| DevOps / CI | ACEPTABLE | iOS build sin secretos expuestos; sin firma (aceptable para artefacto) |

**Prioridad de remediacion**: (1) IDOR carrito y XSS/RCE en escritorio, (2) drift de BD verificado con `SHOW CREATE TABLE`, (3) `npm audit fix`, (4) resto.

---

## 1. Seguridad backend

### H1 - CRITICO: IDOR completo en el carrito
- **Ubicacion**: `backend/src/server/routes/carrito.routes.js:12-15`; `backend/src/server/controllers/carrito.controllers.js:57,133,173,245`.
- **Hallazgo**: las rutas del carrito no usan `authRequired` y el `comprador_id` se toma del body/query. Cualquier cliente puede leer, modificar o vaciar el carrito de otro usuario enviando un id distinto.
- **Recomendacion**: aplicar `authRequired` a todas las rutas del carrito y derivar `comprador_id` unicamente del `req.user` del JWT, nunca de la entrada del cliente. Agregar test que reprozca el IDOR antes del fix.

### H2 - ALTO: `/uploads` servido sin autenticacion
- **Ubicacion**: `backend/src/server/app.js:45`.
- **Hallazgo**: `express.static` sobre `/uploads` es publico: cualquiera con la URL accede a imagenes y archivos de chat.
- **Recomendacion**: servir uploads tras validacion de sesion o por URLs firmadas de corta duracion.

### H3 - MEDIO: token de recuperacion en claro y volcado a consola
- **Ubicacion**: `backend/src/server/controllers/usuarios.controllers.js:302`; `backend/src/server/utils/mailer.js:17-19`.
- **Hallazgo**: el token de reset (RF4: 5 minutos) se guarda sin hash y se imprime en consola (riesgo en logs).
- **Recomendacion**: persistir solo hash del token y eliminar el `console.log` del mailer. El token nunca debe aparecer en logs.

### H4 - MEDIO: validacion de subida solo por extension y nombres predecibles
- **Ubicacion**: `backend/src/server/config/multer.js:21,29-30`; `backend/src/server/config/multer.chat.js:25,33-34`.
- **Hallazgo**: se valida unicamente la extension y los nombres son `Date.now()+ext` (predecibles, colisionables).
- **Recomendacion**: validar magic bytes/MIME real, generar nombres aleatorios (crypto) y limitar tamano explicito.

### H5-H10 - BAJO (endurecimiento)
- Enumeracion de usuarios via mensajes de login (diferenciar "no existe" de "clave incorrecta").
- CORS permite origenes `"null"` y `"file://"` (`app.js:39-40`) - restringir a la lista real de clientes.
- Rate-limit solo en login/recover (`app.js:56-57`) - extender a endpoints de escritura.
- Politica de password minima de 6 caracteres - elevar a 8+ con complejidad.
- Defaults de conexion a BD con usuario `root` en codigo/config de ejemplo.
- `JWT_SECRET` reutilizado como clave de AES-256-GCM para datos bancarios - separar claves por proposito (KDF distinto).

---

## 2. Arquitectura y calidad backend

Veredicto general: **bueno**. Estructura por capas (routes/controllers/middleware/db), contrato `{ success, data }`, consultas parametrizadas, transaccion ACID en `confirmarPago` (FOR UPDATE + rollback) y calculo RF140 correcto en `utils/finanzas.js` con tests.

### A1 - ALTO (condicional): columnas de dinero GENERATED contradicen la gobernanza RF140
- **Ubicacion**: `schema_commercity.sql` (definicion de `detalle_pedidos`).
- **Hallazgo**: `monto_vendedor` y `monto_comision` estan definidas como GENERATED, pero la decision cerrada RF140 dice que son columnas normales calculadas por el backend al aprobar el pago. Si la BD real las tiene GENERATED, los INSERT del backend fallarian o los reportes de dinero serian incorrectos.
- **Recomendacion (P0)**: verificar con `SHOW CREATE TABLE detalle_pedidos` en la BD real y alinear esquema/codigo/documento. Hasta entonces, los reportes 90/10 no son confiables.

### A2 - MEDIO: filtro `archivado` de reportes sin efecto
- **Ubicacion**: `backend/src/server/controllers/reportes.controllers.js`.
- **Hallazgo**: `getReportes` no filtra `archivado`; la migracion 011 quedo sin efecto en el codigo.
- **Recomendacion**: filtrar por defecto los archivados (borrado logico) y exponer el filtro explicito.

### A3 - MEDIO: duplicacion de logica de cuenta bancaria
- **Ubicacion**: `backend/src/server/controllers/admin/cuentaBancaria.controllers.js` vs `backend/src/server/controllers/tienda.controllers.js` (`bancoSchema`, upsert duplicados).
- **Recomendacion**: extraer el esquema Zod y el upsert a un modulo compartido.

### A4 - BAJO: hotspots y deuda menor
- `controllers/pedidos.controllers.js` - `actualizarEstado` ~290 lineas: separar validacion de transicion de estado y efectos (notificaciones, desembolsos).
- `controllers/reportes.controllers.js` importa `validarId` desde `admin/admin.utils.js` (inversion de capas): mover `validarId` a un `utils` comun.
- `middleware/error.middleware.js` - `asyncHandler` es codigo muerto: eliminarlo o adoptarlo en todas las rutas.

---

## 3. Frontend y apps cliente

### F1-F3 - CRITICOS encadenados: XSS almacenado + `nodeIntegration` = RCE en escritorio
- **Ubicacion**: `apps/escritorio/src/app.js:1260-1287` y `:244-249` (`innerHTML` sin escapar en `renderHistorial`/`renderCart`); `apps/escritorio/main.js:10` (`nodeIntegration: true, contextIsolation: false`).
- **Hallazgo**: cualquier dato de usuario malicioso (nombre de producto, mensaje de chat) que se refleje via `innerHTML` ejecuta JavaScript con acceso completo a Node dentro de Electron: robo de archivos, credenciales y ejecucion de comandos (RCE).
- **Recomendacion**: escapar todo contenido dinamico (textContent o sanitizacion estricta) y activar `contextIsolation: true` + `nodeIntegration: false` con un preload via `contextBridge`. Es el hallazgo de mayor impacto junto con H1.

### F4 - ALTO: JWT en localStorage
- **Hallazgo**: el token de sesion en `localStorage` es accesible ante cualquier XSS (encadena con F1).
- **Recomendacion**: cookies `httpOnly` + `SameSite` (o memoria + refresh), en coordinacion con el backend.

### F5 - ALTO: datos bancarios en localStorage (movil) y `allowBackup`
- **Ubicacion**: `apps/movil/www/app.js:1579-1582`; `apps/movil/android/app/src/main/AndroidManifest.xml:4` (`allowBackup="true"`).
- **Hallazgo**: datos bancarios persisten en localStorage y el backup de Android puede extraerlos.
- **Recomendacion**: no persistir datos bancarios en el cliente; deshabilitar `allowBackup` o excluir el directorio sensible.

### F6 - MEDIO: contrato de API inconsistente en React
- **Ubicacion**: `frontend/src/api/client.js` (no valida `success`, sin manejo global 401); `frontend/src/utils/productosApi.js` (cliente fetch duplicado SIN JWT).
- **Recomendacion**: un unico cliente que valide el contrato `{ success, data }`, maneje 401 globalmente (logout/redireccion) y elimine el cliente duplicado sin autenticacion.

---

## 4. Base de datos - DRIFT ALTO

El `schema_commercity.sql` de la rama NO refleja lo que el codigo usa ni lo que exigen los RF.

### B1 - ALTO: objetos usados por el codigo sin definicion en el esquema
Faltan en el schema (el codigo las usa): `detalle_pedidos.estado_envio` (RF119), `detalle_pedidos.estado_pago_vendedor`, `detalle_pedidos.fecha_desembolso`, `reportes.evidencia_url`, `reportes.estado_reporte`, `datos_bancarios.banco` y la tabla `tokens_invalidados` (lista negra JWT).
- **Riesgo**: un despliegue limpio desde el schema fallaria en tiempo de ejecucion.
- **Recomendacion (P0)**: ejecutar los `SHOW CREATE TABLE` de verificacion (ver seccion 6) y regenerar `schema_commercity.sql` consolidando migraciones 008-012.

### B2 - ALTO: RF119 y RF140 no reflejadas en el esquema
- Existe `pedidos.estado_pedido`, que RF119 reemplaza por estados por linea en `detalle_pedidos.estado_envio`.
- `monto_vendedor`/`monto_comision` GENERATED vs decision RF140 "normales, calculadas por el backend" (ver A1).

### B3 - MEDIO: migraciones defectuosas
- `db/009-*.sql` usa `carrito_items.updated_at`, columna inexistente: migracion ROTA.
- `db/012-*.sql` sin transaccion (riesgo de schema parcial si falla a mitad).
- ENUMs de `notificaciones` con acentos en el schema vs el codigo que escribe sin acentos: valores no coinciden.

---

## 5. Dependencias npm (regresion posterior al ultimo commit)

`npm audit --omit=dev` ejecutado sobre el contenido de PREVIEW:

| Paquete | Ubicacion | Severidad | Advisories | Fix |
|---|---|---|---|---|
| `proxy-addr` 1.1.0-2.0.7 | backend | CRITICAL | GHSA-jqcg-44mw-7w3h (IP spoofing) | `npm audit fix` |
| `react-router` 6.0.0-7.18.1 | frontend | HIGH | 7 advisories (DoS, CSRF, open redirect, XSS) | `npm audit fix` |
| `react-router-dom` 7.0.0-pre.0-7.14.2 | frontend | HIGH | relacionado | `npm audit fix` |

- Ya remediado en commits anteriores: `braces` (GHSA-vfj7-8cjw-p6xm) via override `nodemon.chokidar: ^4.0.3`.
- Recordar el bug de arborist: instalaciones con `--legacy-peer-deps`.
- **Recomendacion**: aprobar y ejecutar `npm audit fix` en backend y frontend, re-correr suites y actualizar CHANGELOG.

## 6. DevOps / CI

- `apps/movil/.github/workflows/ios-build.yml`: sin secretos expuestos, `actions/checkout@v4`/`setup-node@v4`/`upload-artifact@v4`, node 20. Build iOS sin firma de codigo: aceptable para artefacto interno, no para distribucion App Store.

## 7. Testing

- Suites Vitest + Supertest con mock de `mysql2/promise` (sin BD real, segun regla del proyecto). Cobertura de referencia ~93.5% Lines (umbral minimo 60%).
- Gap: no hay tests que reproduzcan H1 (IDOR carrito) ni el XSS del escritorio; agregarlos como regresion antes de cerrar los fixes.

---

## Plan de remediacion priorizado

| Prioridad | Hallazgo | Accion |
|---|---|---|
| P0 | H1 IDOR carrito | `authRequired` + `comprador_id` desde JWT; test de regresion |
| P0 | F1-F3 XSS + nodeIntegration (RCE escritorio) | escapar render + `contextIsolation`/preload |
| P0 | B1/B2 drift de BD | `SHOW CREATE TABLE` de verificacion y regenerar schema consolidado; resolver A1 (GENERATED vs RF140) |
| P1 | Dependencias npm | `npm audit fix` backend y frontend + suites |
| P1 | H2 `/uploads` publico, F4-F5 tokens/datos bancarios en localStorage | acceso autenticado / cookies httpOnly / quitar datos bancarios del cliente |
| P2 | H3-H4 token en claro, multer | hash del token, validacion real de archivos |
| P2 | A2-A4, F6, B3 | filtros, deduplicacion, contrato unico, migracion 009/012 |

## Verificacion pendiente (requiere usuario, BD real 149.130.178.228/commercity_v2)

```sql
SHOW CREATE TABLE detalle_pedidos\G
SHOW CREATE TABLE pedidos\G
SHOW CREATE TABLE reportes\G
SHOW CREATE TABLE datos_bancarios\G
SHOW CREATE TABLE usuarios\G
SHOW CREATE TABLE pagos_simulados\G
SHOW CREATE TABLE carrito_items\G
SHOW TABLES LIKE 'tokens_invalidados';
```

## Conclusión

El backend presenta buena arquitectura y calidad general (transacciones ACID, RF140 implementado con tests, contrato consistente), pero la rama PREVIEW no esta lista para produccion: conviven un IDOR critico en el carrito, una cadena XSS->RCE en la app de escritorio y un drift de esquema de BD que invalida temporalmente los reportes de dinero hasta verificacion con `SHOW CREATE TABLE`. Se recomienda cerrar los tres P0 y la regresion de dependencias npm antes de cualquier despliegue o entrega formal.
