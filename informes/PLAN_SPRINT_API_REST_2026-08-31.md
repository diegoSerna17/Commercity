# Plan Sprint — Grupo API REST (2026-09-01)

- **Autor**: Daniel Palacios (líder backend)
- **Fecha**: 2026-09-01
- **Objetivo**: conectar las 3 áreas de cliente (web, móvil, escritorio) al backend central, que ya cuenta con **13 routers y 69 endpoints** listos.
- **Alcance**:Grupo API REST.&#x20;
- **Grupo**: 13 personas.

***

## 1. Estado actual (contexto)

| Área                  | Estado                                                                                                                                                                                                                                    | Brecha                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Backend (API)         | 13 routers, 69 endpoints, suite 307/307 tests                                                                                                                                                                                             | Ninguna funcional; cambios solo con RF + aval                     |
| Web (React)           | Parcial: catálogo (Inicio/detalle), historial y cuenta bancaria admin ya consumen `/api/`. Carrito, pedidos, perfil, chat, notificaciones, Mi Tienda y panel admin usan datos estáticos. Chat frontend NO subido al repo (local de Diego) | Conectar módulos restantes a `/api/`; Diego sube el chat frontend |
| Móvil (Ionic)         | Datos estáticos (`www/app.js` con `PRODUCTS`, `ORDER_DATA`)                                                                                                                                                                               | **Documentar en el SRS antes de implementar** (decisión 31/08)    |
| Escritorio (Electron) | Usuarios hardcodeados (`juan_giraldo/1234`, `admin/admin123`)                                                                                                                                                                             | Login real + catálogo contra `/api/`                              |

> **Gobernanza (decisión 31/08)**: las decisiones se toman en conjunto entre los líderes del grupo API REST. Ninguna decisión de alcance, contrato o cronograma se adopta de forma unilateral.

***

## 2. Resumen del trabajo API REST (informe)

**Contexto**: el backend central está completo (13 routers, 69 endpoints, suite 307/307 tests en verde). Las 3 áreas de cliente (web React, móvil Ionic, escritorio Electron) hoy funcionan con datos estáticos/hardcodeados y NO consumen la API real. El objetivo del grupo API REST es cerrar esa brecha conectando los clientes al backend y validando el API contra la BD real `commercy_v2`.

**Qué se va a hacer:**

1. **Conectar los 3 clientes al backend**: reemplazar datos estáticos por llamadas reales a `/api/`.
   - Web: chat + notificaciones + módulos estáticos restantes (carrito, pedidos, perfil, Mi Tienda, panel admin).
   - Móvil: login, catálogo, detalle y flujo transaccional (carrito → pedido → historial).
   - Escritorio: login real (quitar usuarios hardcodeados), catálogo, carrito y pedidos.
2. **Validar el backend contra BD real**: cada módulo se verifica contra `commercy_v2` (Mi Tienda, Usuarios, Productos, Seguidores, Carrito/Pedidos/Historial, Calificaciones/Admin/Reportes).
3. **QA transversal de los 69 endpoints**: contrato `{ success, data }`, paginación, roles y códigos de error (validación E2E).
4. **Flujo E2E completo**: carrito → pedido → historial funcionando en los 3 clientes, incluidas cancelaciones con restitución de stock.
5. **Tests y cobertura**: mantener la suite en verde (307/307) y cobertura ≥93,68% (umbral mínimo 60%).
6. **Cierre**: evidencias por módulo (captura + endpoint + respuesta JSON) y checklist de entrega.

**Equipo**: grupo de 13 personas; **13 con tareas en este plan** (coordinación + apoyo + 3 clientes + 7 backend). **Plazo**: \~28-29 días en 4 fases (1-30 de septiembre).

**Entregables finales**: los 3 clientes consumiendo `/api/` real, QA de los 69 endpoints, suite de tests en verde y evidencias por módulo.

***

## 3. Coordinación del grupo API REST

### 3.1 Daniel — Coordinador API

**Responsabilidades:**

- Revisar PRs y unificar el contrato API `{ success, data }` / `{ success: false, error: { code, message } }`.
- QA transversal de los 69 endpoints (validación E2E contra BD real).
- Mantener el inventario de endpoints y este plan actualizado.
- Centralizar dudas de contrato del grupo.

**Evidencia**: inventario de endpoints (2026-08-28) + reporte QA por módulo.

### 3.2 Meneses — Apoyo al móvil

**Alcance**: apoyo al área móvil (Ionic) para acelerar la conexión al API.
**Tareas:**

1. **Documentación del SRS del móvil**: junto a Jhon Parra, documentar pantallas, flujo de datos y endpoints que consumirá la app móvil.
2. **Validación de esquema**: confirmar que las columnas que consume el móvil existen en `commercy_v2` (productos, usuarios, pedidos, carrito).
3. **Consultas SQL de apoyo**: preparar consultas de referencia para las pantallas del móvil (catálogo, detalle, historial).

**Evidencia**: documentación SRS del móvil + consultas SQL de referencia.

### 3.3 Yepes — Apoyo al escritorio

**Alcance**: apoyo al área escritorio (Electron) para acelerar la conexión al API.
**Tareas:**

1. **Revisión de flujos**: validar con Sebastian los flujos login, catálogo, carrito y pedidos contra el contrato del API.
2. **Revisión de evidencias**: revisar las capturas y respuestas JSON del escritorio antes de la entrega del domingo.
3. **Desbloqueo de decisiones**: resolver dudas de alcance/contrato que surjan del escritorio con el grupo.

**Evidencia**: revisión de flujos del escritorio + evidencias validadas.

***

## 4. Áreas cliente (cada uno responsable de sus conexiones)

### 4.1 Jhon Parra — Líder móvil (Ionic)

**Alcance**: conexión de la app móvil al backend.
**NOTA (decisión 31/08)**: la app Ionic se **documenta primero en el SRS** y después se implementa. Jhon coordina la documentación (pantallas, flujo, endpoints) antes de conectar pantallas.
**Tareas:**

1. **Documentar en el SRS**: pantallas, flujo de datos y endpoints que consumirá el móvil.
2. Reemplazar los datos estáticos (`www/app.js`: `PRODUCTS`, `ORDER_DATA`) por llamadas reales a `fetch`.
3. Implementar login real contra `POST /api/usuarios/login` (JWT Bearer).
4. Conectar catálogo: `GET /api/productos?page=1&limit=10` y detalle de producto.
5. Conectar flujo transaccional en móvil:
   - Carrito: `GET/POST/PATCH/DELETE /api/carrito`.
   - Pedidos: `GET /api/pedidos/resumen` → `POST /api/pedidos/confirmar-pago`.
   - Historial: `GET /api/historial/compras` y cancelación con `POST /api/historial/compras/:id/cancelar`.
   - Notificaciones: `GET /api/notificaciones?limite=50`, `GET /api/notificaciones/no-leidas`, `PATCH /api/notificaciones/leidas`, `PATCH /api/notificaciones/:id/leida`.
6. Manejar estados loading/error/empty en cada pantalla.

**Contrato de referencia**:

- `GET /api/productos` → `{ success, data: { pagina, limite, totalProductos, totalPaginas, hayPaginaAnterior, hayPaginaSiguiente, productos } }`.
- Auth: enviar `Authorization: Bearer <token>`.

**Cómo ejecutar (paso a paso):**

1. **Prerrequisitos**: backend corriendo en `http://localhost:5000`; usuario de prueba en BD `commercy_v2` (ej. `juan.giraldo@commercity.com` / `123456`); `.env` con `VITE_API_URL=http://localhost:5000` (si el proyecto Ionic usa VITE).
2. **Login**: `POST /api/usuarios/login` con body `{ "email": "...", "password": "..." }` → guardar `data.token` y `data.usuario`.
3. **Catálogo**: `GET /api/productos?page=1&limit=10` → recorrer `data.productos` y renderizar tarjetas. Validar `hayPaginaSiguiente` para el botón "Cargar más".
4. **Detalle**: `GET /api/productos/:id` → mostrar `data` (incluye vendedor).
5. **Carrito** (JWT de comprador): `GET /api/carrito` → listar agrupado por vendedor; `POST /api/carrito` `{ producto_id, cantidad }` (upsert); `PATCH /api/carrito/:productoId` `{ cantidad }`; `DELETE /api/carrito/:productoId`.
6. **Pedido**: `GET /api/pedidos/resumen` (previsualización) → `POST /api/pedidos/confirmar-pago` con `{ metodo_pago, direccion_envio }` (flujo de pago simulado en BD).
7. **Historial**: `GET /api/historial/compras` → listar pedidos del comprador; cancelación con `POST /api/historial/compras/:id/cancelar` (solo si `estado_envio = 'Pendiente'`).
8. **Notificaciones**: `GET /api/notificaciones?limite=50`, `GET /api/notificaciones/no-leidas` (contador badge), `PATCH /api/notificaciones/leidas` (marcar todas), `PATCH /api/notificaciones/:id/leida` (una).
9. **Estados**: cada pantalla con `loading` (spinner), `error` (mensaje `error.message`), `empty` (lista vacía) y `success`.
10. **Verificación**: probar login con credenciales incorrectas (debe dar 401 `{ success:false, error:{code:"UNAUTHORIZED"...}}`) y con correctas (200 + token).

**Evidencia**: captura de pantalla de cada pantalla funcionando contra `/api/` + endpoint usado + respuesta JSON.

### 4.2 Sebastian (@seb4ssb / Sevas18C) — Líder escritorio (Electron)

**Alcance**: conexión de la app de escritorio al backend.
**Tareas:**

1. Reemplazar los usuarios hardcodeados (`juan_giraldo/1234`, `admin/admin123`) por login real contra la API.
2. Conectar catálogo y detalle de producto con `GET /api/productos`.
3. Conectar carrito: `GET/POST/PATCH/DELETE /api/carrito`.
4. Conectar pedidos: creación y consulta con `POST /api/pedidos` y `GET /api/pedidos`.
5. Mantener sesión con JWT (almacenar token de forma segura).

**Cómo ejecutar (paso a paso):**

1. **Prerrequisitos**: backend en `http://localhost:5000`; `VITE_API_URL` o constante de base en la app Electron apuntando a esa URL; usuarios reales de BD (NO los hardcodeados).
2. **Login real**: `POST /api/usuarios/login` → guardar `data.token` en memoria/almacen seguro. Reemplazar la validación local `juan_giraldo/1234` y `admin/admin123`.
3. **Catálogo**: `GET /api/productos?page=1&limit=12` → renderizar grid. Detalle con `GET /api/productos/:id`.
4. **Carrito** (requiere JWT): `GET /api/carrito` (resumen agrupado por vendedor), `POST /api/carrito` `{ producto_id, cantidad }`, `PATCH /api/carrito/:productoId` `{ cantidad }`, `DELETE /api/carrito/:productoId`.
5. **Pedidos**: `POST /api/pedidos/confirmar-pago` (flujo de pago simulado) y `GET /api/pedidos/resumen` para el resumen previo.
6. **Sesión**: enviar `Authorization: Bearer <token>` en cada petición autenticada; en 401, redirigir a login (manejar token expirado).

**Evidencia**: captura de pantalla de login real + flujo de compra completo (catálogo → carrito → pedido) con endpoint y respuesta JSON.

***

## 5. Web + Backend

### 5.1 Diego Serna — Web (líder) + Chat/Notificaciones

**Alcance**: frontend web conectado y backend de chat.
**Tareas:**

1. **Subir el frontend del chat al repositorio** (actualmente está en local, no está subido). Quitar `node_modules` de la rama y corregir mojibake.
2. Conectar el chat web al backend: `GET/POST /api/chat` (RF105). En el working tree el chat usa datos estáticos (`frontend/src/constants/chats.js` → `MESSAGES`).
3. Backend Chat: revisar y validar contra BD real (integrado de Diego).
4. Backend Notificaciones: validar `GET /api/notificaciones?limite=`, marcar leídas, eliminar.
5. Coordinar la conexión de los módulos web restantes que aún usan datos estáticos: carrito, pedidos, perfil, notificaciones, Mi Tienda y panel admin.

**Cómo ejecutar (paso a paso) — Chat:**

1. **Subir frontend**: mover la rama del chat a `commercycity`, verificar que `frontend/node_modules` NO se sube (agregar a `.gitignore`), revisar mojibake (caracteres corruptos en UI).
2. **Conversaciones**: `GET /api/chat/conversaciones` (JWT) → lista de conversaciones del usuario.
3. **Abrir conversación**: `GET /api/chat/mensajes/:usuarioId` → historial de mensajes con el contacto.
4. **Enviar mensaje**: `POST /api/chat` con FormData `{ usuario_id_destino, contenido }` y opcional `archivo` (multipart, multer).
5. **Leído**: `PATCH /api/chat/mensajes/:id/leido` → marcar mensaje como leído.

**Cómo ejecutar (paso a paso) — Notificaciones:**

1. `GET /api/notificaciones?limite=50` (JWT) → lista.
2. `GET /api/notificaciones/no-leidas` → contador para el badge del dropdown.
3. `PATCH /api/notificaciones/leidas` → marcar todas; `PATCH /api/notificaciones/:id/leida` → una.
4. `DELETE /api/notificaciones` y `DELETE /api/notificaciones/:id` → limpiar.

**Verificación backend**: ejecutar suite `node node_modules\vitest\vitest.mjs run src/server/__tests__/chat.controllers.test.js` y `.../notificaciones.controllers.test.js`.

**Evidencia**: chat web funcionando contra `/api/chat` + capturas; backend con tests Vitest del módulo.

### 5.2 Erik — Backend Mi Tienda

**Alcance**: módulo `tienda` (validación RF130-RF139).
**Tareas:**

1. Validar los endpoints de Mi Tienda contra BD real (ya hizo evidencia E2E de RF130-139).
2. Corregir hallazgos que surjan de la validación.
3. Respetar paginación de Mi Tienda: `?pagina/?por_pagina` (alias `page`/`limit`), default 10.

**Cómo ejecutar (paso a paso):**

1. **Login de vendedor**: `POST /api/usuarios/login` con un vendedor real (ej. `alex.rivera@commercity.com`). Guardar token.
2. **Ventas**: `GET /api/tienda/ventas?pagina=1&por_pagina=10` (JWT vendedor) → verificar `{ total_registros, total_paginas, pagina_actual, registros_por_pagina, resumen, filtros_aplicados }`.
3. **Ingresos**: `GET /api/tienda/ingresos?pagina=1&por_pagina=10` → verificar desglose de comisiones (90/10) y montos desembolsados.
4. **Dashboard**: `GET /api/tienda/dashboard/stats` → KPIs del vendedor.
5. **Validación RF130-139**: `GET /api/tienda/validacion` → confirmar que responde el checklist de validación de Mi Tienda.
6. **Cuenta bancaria**: `GET /api/tienda/mi-cuenta-bancaria/masked` (oculto), `POST /api/tienda/mi-cuenta-bancaria` (crear/actualizar).
7. **Verificación**: probar los alias `?page=1&limit=5` y confirmar que responden igual que `?pagina/?por_pagina`; validar que sin token da 401.

**Evidencia**: evidencia E2E actualizada de Mi Tienda (capturas + respuestas).

### 5.3 Carlos Vidal Sena — Backend Usuarios

**Alcance**: módulo `usuarios` (auth + perfil).
**Tareas:**

1. Revisar y testear registro, login (JWT), perfil y actualización de datos.
2. Recuperación de contraseña RF4: link de un solo uso que expira en 5 minutos; validar que el token se limpie tras el reset.
3. Verificar RBAC: cambio de rol solo comprador <-> vendedor, con transacción, y prohibido que un administrador se autodegrade.

**Cómo ejecutar (paso a paso):**

1. **Registro**: `POST /api/usuarios/register` `{ email, password, nombre_completo, rol }` → 201/200 + token. Validar que el esquema rechaza campos inválidos (400 VALIDATION\_ERROR).
2. **Login**: `POST /api/usuarios/login` `{ email, password }` → `{ success, data: { token, usuario } }`. Con password incorrecta → 401 UNAUTHORIZED.
3. **Perfil**: `GET /api/usuarios/me` (JWT) → datos del usuario autenticado. Actualizar datos con `PATCH /api/usuarios/me` (si existe el endpoint; verificar en el router).
4. **Cambio de rol**: `PATCH /api/usuarios/me/rol` `{ nuevo_rol }` → solo comprador/vendedor; si el usuario es `administrador` el backend debe rechazar (403 FORBIDDEN).
5. **Recuperación RF4**: `POST /api/usuarios/recover` `{ email }` → respuesta uniforme (no revelar si el email existe). El link expira en 5 minutos. `POST /api/usuarios/reset-password` `{ token, nueva_password }` → 200; el token debe limpiarse tras usarlo (no reutilizable).
6. **Logout**: `POST /api/usuarios/logout` (JWT) → invalida el token en `tokens_invalidados`.
7. **Admin (solo rol administrador)**: `GET /api/usuarios/admin` → 403 si el token es comprador/vendedor.

**Evidencia**: tests Vitest del módulo usuarios + E2E de login/registro/recuperación.

### 5.4 Cristian Rosero — Backend Productos

**Alcance**: módulo `productos` (catálogo).
**Tareas:**

1. Revisar y testear listado, detalle y paginación del catálogo.
2. Paginación catálogo: `?page=` (default 1) y `?limit=` (default 4, máx 100).
3. Verificar que `productos.estado` (STORED GENERATED) se lea, nunca se inserte/actualice.

**Cómo ejecutar (paso a paso):**

1. **Listado**: `GET /api/productos?page=1&limit=4` → `{ success, data: { pagina, limite, totalProductos, totalPaginas, hayPaginaAnterior, hayPaginaSiguiente, productos } }`. Validar que con `limit=200` el backend lo limita a 100.
2. **Filtros** (si los soporta el controlador): `GET /api/productos?vendedorId=3&categoriaId=6&page=1&limit=10`.
3. **Detalle**: `GET /api/productos/:id` → incluye datos del vendedor (RF78/RF79).
4. **Validar stock**: `GET /api/productos/:id/validar-stock?cantidad=N` → `{ valido, stock_disponible, estado, mensaje }`.
5. **Categorías**: `GET /api/productos/categorias` → árbol de categorías (padre/hija).
6. **Vendedores**: `GET /api/productos/vendedores` → listado para el filtro.
7. **Alta/edición (vendedor)**: `POST /api/productos` y `PUT /api/productos/:id` con multipart `{ vendedor_id, categoria_id, nombre, descripcion, precio, stock, descuento_porcentaje }` + imagen. Verificar que **NO** se envía `estado` (columna STORED GENERATED; el backend la ignora/rechaza).

**Evidencia**: tests Vitest del módulo + E2E con paginación verificada.

### 5.5 Carlos Perea (+57 301 9244473) — Backend Seguidores (RF106)

**Alcance**: módulo `seguidores` (RF106).
**Tareas:**

1. Seguidores RF106: seguir/dejar de seguir, listar seguidores y seguidos. Validar restricción de no auto-seguirse.
2. Entregar la evidencia de RF106 que quedó pendiente en Sprint 2.

**Cómo ejecutar (paso a paso) — Seguidores (RF106):**

1. `POST /api/seguidores` `{ seguido_id }` (JWT) → seguir. Intentar `seguido_id = mi propio id` → debe rechazar (CHECK `chk_no_seguirse_a_si_mismo`).
2. `GET /api/seguidores/siguiendo` → usuarios que sigo; `GET /api/seguidores/seguidores` → mis seguidores.
3. `DELETE /api/seguidores/:id` → dejar de seguir.

**Evidencia**: tests Vitest + E2E del flujo de seguidores contra BD real.

### 5.6 Juan Cabrera — Backend Carrito/Pedidos/Historial

**Alcance**: módulos `carrito`, `pedidos`, `historial`.
**Tareas:**

1. Carrito: upsert por `comprador_id`+`producto_id`, transacciones con `FOR UPDATE`.
2. Pedidos: crear pedido + líneas + descontar stock + registrar pago en UNA transacción con ROLLBACK si falla (RF132).
3. Cancelaciones: solo si `estado_envio = 'Pendiente'`; restituir stock (lógica existente).
4. Historial de compras.

**Cómo ejecutar (paso a paso) — Carrito:**

1. `POST /api/carrito` `{ producto_id, cantidad }` → upsert (ON DUPLICATE KEY UPDATE); validar stock real y vendedor activo (RF74).
2. `GET /api/carrito` → agrupado por vendedor con resumen (subtotal, IVA implícito, total).
3. `PATCH /api/carrito/:productoId` `{ cantidad }` y `DELETE /api/carrito/:productoId`.

**Cómo ejecutar (paso a paso) — Pedidos/Historial:**

1. `GET /api/pedidos/resumen` → detalle de lo que se va a comprar (JWT comprador).
2. `POST /api/pedidos/confirmar-pago` → crea pedido + líneas + descuenta stock + registra pago en UNA transacción (si una parte falla, ROLLBACK total). Verificar que el stock disminuye tras confirmar.
3. `GET /api/historial/compras` → historial del comprador.
4. `POST /api/historial/compras/:id/cancelar` → solo si `estado_envio='Pendiente'`; verificar que el stock se restituye y la línea queda `Cancelado`.

**Evidencia**: tests Vitest + E2E de flujo compra/cancelación contra BD real.

### 5.7 Brandon Perea — Backend Calificaciones + Admin + Reportes

**Alcance**: módulos `calificaciones`, `admin`, `reportes`.
**Tareas:**

1. Calificaciones: calificar producto/vendedor (1-5 estrellas, una por pedido-producto).
2. Admin: gestión de usuarios y productos (borrado lógico, nunca `DELETE` físico).
3. Reportes: reportar producto/usuario y gestión admin con archivado (`reportes.archivado`).

**Cómo ejecutar (paso a paso) — Calificaciones:**

1. `POST /api/calificaciones/vendedor` `{ pedido_id, estrellas (1-5), comentario }` (JWT comprador que compró ese pedido). Validar CHECK `estrellas between 1 and 5`.
2. Intentar calificar un pedido que no le pertenece → 403/404. Calificar dos veces el mismo pedido-producto → rechazo (UNIQUE `uq_pedido_calificacion_vend`).

**Cómo ejecutar (paso a paso) — Admin (rol administrador):**

1. `GET /api/admin/stats` → métricas globales.
2. Usuarios: `GET /api/admin/usuarios`, `PATCH /api/admin/usuarios/:id/estado` (activar/suspender = borrado lógico), `DELETE /api/admin/usuarios/:id` → debe ser lógico (NO `DELETE FROM usuarios`).
3. Productos: `GET /api/admin/productos`, `DELETE /api/admin/productos/:id` (lógico, `eliminado_por_admin=1`), `PATCH /api/admin/productos/:id/restaurar`.
4. Reportes: `GET /api/admin/reportes`, `GET /api/admin/reportes/:id`, `PATCH /api/admin/reportes/:id/resolver`, `DELETE /api/admin/reportes/:id` → respetar `archivado`.
5. Búsqueda global: `GET /api/admin/busqueda?q=...`.

**Cómo ejecutar (paso a paso) — Reportes:**

1. `POST /api/reportes` `{ tipo_reporte, producto_id | usuario_reportado_id, motivo }` + opcional `evidencia` (multipart) → crear reporte.

**Evidencia**: tests Vitest + E2E de flujo de reportes y administración.

### 5.8 Jary Lizeth — Backend Tests y contratos

**Alcance**: QA de calidad del backend.
**Tareas:**

1. Tests Vitest de los módulos que se modifiquen en el Sprint (patrón: mock de `mysql2/promise` + Supertest).
2. Validar el contrato `{ success, data }` en cada endpoint modificado.
3. No bajar la cobertura existente (referencia vigente: 307/307 tests, Lines 93,68%).

**Cómo ejecutar (paso a paso):**

1. **Suite completa**: desde `backend/`, ejecutar `node node_modules\vitest\vitest.mjs run`. Referencia: 307/307 en verde.
2. **Cobertura**: `node node_modules\vitest\vitest.mjs run --coverage` → Lines NO inferior a 93,68% (umbral mínimo del proyecto: 60%).
3. **Módulo afectado**: ante cada cambio de un compañero, correr la suite del módulo, ej. `node node_modules\vitest\vitest.mjs run src/server/__tests__/pedidos.controllers.test.js`.
4. **Contrato**: verificar que toda respuesta exitosa sea `{ success: true, data: ... }` y todo error `{ success: false, error: { code, message } }`, con códigos UNAUTHORIZED/FORBIDDEN/NOT\_FOUND/VALIDATION\_ERROR/INTERNAL\_ERROR.
5. **Reporte**: consolidar el conteo `passed` por módulo y el % de cobertura para el cierre del Sprint.

**Nota**: los tests NO requieren BD real (mock de `mysql2/promise` + Supertest); la validación E2E contra BD real es capa aparte que coordina Daniel.

**Evidencia**: conteo `passed` por módulo + % de cobertura.

***

## 6. Herramientas de prueba y verificación (común a todos)

**1. Probar endpoints (opción A — curl en PowerShell):**

```powershell
# Login y capturar token
$r = Invoke-RestMethod -Uri "http://localhost:5000/api/usuarios/login" -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"camila.torres@commercity.com","password":"123456"}'
$r.data.token   # copiar el token

# GET autenticado
$h = @{ Authorization = "Bearer $($r.data.token)" }
Invoke-RestMethod -Uri "http://localhost:5000/api/carrito" -Headers $h

# POST con body
Invoke-RestMethod -Uri "http://localhost:5000/api/carrito" -Method Post -Headers $h `
  -ContentType "application/json" -Body '{"producto_id":1,"cantidad":2}'
```

**2. Probar endpoints (opción B — Postman/Thunder Client):**

1. Crear colección con variable `base_url = http://localhost:5000`.
2. Request Login `POST {{base_url}}/api/usuarios/login` → en Tests guardar `pm.environment.set("token", pm.response.json().data.token)`.
3. En cada request autenticado: Header `Authorization: Bearer {{token}}`.

**3. Credenciales de prueba en BD** **`commercy_v2`** (password `123456`):

| Rol           | Usuario                                         | id |
| ------------- | ----------------------------------------------- | -- |
| Comprador     | <camila.torres@commercity.com>                  | 7  |
| Vendedor      | <alex.rivera@commercity.com>                    | 3  |
| Administrador | (consultar el admin vigente con el líder de BD) | —  |

**4. Verificación de contrato esperado:**

- Éxito: `200` → `{ "success": true, "data": ... }`.
- Error de validación: `400` → `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }`.
- No autenticado: `401` `UNAUTHORIZED`. Sin permiso: `403` `FORBIDDEN`. No existe: `404` `NOT_FOUND`.

***

## 7. Reglas de trabajo obligatorias

1. **Backend**: nadie modifica lógica ni BD sin RF respaldado y aval.
2. **SQL**: consultas siempre parametrizadas con `?` (mysql2). NUNCA concatenar strings.
3. **Contrato API**: `{ success: true, data }` / `{ success: false, error: { code, message } }`.
4. **Paginación**: catálogo `?page/?limit`; Mi Tienda `?pagina/?por_pagina`; notificaciones solo `?limite=` (default 50).
5. **Evidencia**: cada entregable con captura de pantalla + endpoint usado + respuesta JSON.
6. **BD**: cambios de esquema como migración `NNN_descripcion.sql` versionada y documentada en el changelog.
7. **Móvil y escritorio**: reemplazar datos estáticos/hardcodeados por `/api/` real.
8. **Borrado lógico**: prohibido `DELETE` físico de datos históricos (pedidos, pagos, reportes).
9. **Dudas de contrato**: centralizadas en el grupo.

***

## 8. Cronograma del Sprint (plazos, 1-30 de septiembre)

Disponibles \~28-29 días hasta la entrega. **Fase 1 con 5 días (1-6 sep): entrega de la semana el domingo 6 de septiembre.**

| Fase       | Fechas    | Días | Foco                                               | Entregables esperados                                                                                                                                             |
| ---------- | --------- | ---- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fase 1** | 1-6 sep   | 5    | Levantamiento contra BD real y documentación móvil | Cada quien valida su módulo/área contra `commercy_v2` y reporta bloqueos; Jhon documenta el móvil en el SRS; integrar rama `limpiar-chat`. **Entrega: domingo 6** |
| **Fase 2** | 7-13 sep  | 7    | Conexión de clientes                               | Web (chat, notificaciones, módulos estáticos), escritorio (login real + catálogo + carrito), móvil (login + catálogo + detalle) contra `/api/`                    |
| **Fase 3** | 14-20 sep | 7    | Flujo transaccional y QA                           | E2E carrito → pedido → historial en los 3 clientes; QA de los 69 endpoints; tests y cobertura ≥93,68%; correcciones                                               |
| **Fase 4** | 21-27 sep | 7    | Cierre y evidencias                                | Evidencias por módulo (captura + endpoint + JSON); checklist de cierre; entrega                                                                                   |
| **Margen** | 28-30 sep | 3    | Imprevistos y sustentación                         | Correcciones de última hora y ensayo                                                                                                                              |

***

## 9. Checklist de cierre del Sprint

- [ ] Los 13 integrantes del grupo con tarea asignada y entregable definido.
- [ ] Web, móvil y escritorio consumen `/api/` real (sin datos estáticos).
- [ ] Suite de tests completa en verde y cobertura sin bajar del nivel previo.
- [ ] Evidencias (capturas + endpoint + respuesta JSON) por cada módulo.
- [ ] Inventario de endpoints actualizado si hubo cambios de contrato.
- [ ] Migraciones SQL versionadas si hubo cambios de esquema.
- [ ] Cambios documentados en `informes/CHANGELOG.md`.

