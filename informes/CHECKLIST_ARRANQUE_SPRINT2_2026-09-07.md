# Checklist de Arranque — Sprint 2 / Fase 2 (inicio efectivo 10 sep, cierre martes 15 sep 2026)

Proyecto: CommerCity 2.0 — Area API REST y clientes
Responsable de seguimiento: Daniel Palacios (Lider backend / QA)
Actualizado: 2026-09-10 (inicio efectivo de la Fase 2; cierre martes 15 — 6 dias: 10, 11, 12, 13, 14 y 15)
Objetivo de la fase: que los tres clientes consuman la API REST real (`/api/`) — Web (chat, notificaciones y modulos estaticos), Escritorio (login real + catalogo + carrito) y Movil (login + catalogo + detalle).

## 1. Condiciones de entrada globales (habilitadores)

| # | Condicion | Responsable | Estado |
|---|---|---|---|
| G1 | API central en `/api/` con suite en verde (307/307, Lines 93.72%) | Lider backend | LISTO |
| G2 | BD `commercity_v2` operativa con password rotada y probada (CONEXION OK, 335 productos) | Meneses / Lider | LISTO |
| G3 | Cada integrante actualiza `DB_PASSWORD` en su `backend/.env` local y reinicia su backend | Todos | PENDIENTE |
| G4 | Todos re-inician sesion (rotacion de `JWT_SECRET` invalida tokens previos) | Todos | PENDIENTE |
| G5 | Remotos sincronizados y clones actualizados (`git fetch --force` tras purga de historial) | Todos | PENDIENTE |
| G6 | Inventario de endpoints v1.1 como fuente de contrato | Lider | LISTO |
| G7 | Purge de cache en GitHub del commit expuesto + revocacion de alerta | Diego | PENDIENTE |
| G8 | `FRONTEND_URL` en `.env` del backend coincide con el origen del cliente web (CORS) | Diego / Lider | VERIFICAR |

Nota: el backend ya expone todo lo necesario para la Fase 2 (usuarios/login, catalogo, carrito, pedidos, historial, chat, notificaciones, tienda, admin). No es cuello de botella.

## 2. Condiciones de entrada por cliente

| Cliente | Requisito previo | Estado actual | Bloqueo | Evidencia esperada |
|---|---|---|---|---|
| Web | Rama frontend integrada a `commercycity/main` | `main` en b18d495 (28/08); rama limpia `prueba-backend` 2a57bf0 y `feature/frontend-modulos-s1` aaf6360 sin merge | Merge pendiente (Diego/Yepes) | Capturas + peticiones a `/api` |
| Escritorio | `apiService` (src/api.js) + login real subidos | Repo oficial SI existe: `BLACK-CODE-JSB/VOCETO-E-COMERCITY-SENA-ADSO-35` (Electron: main.js, src/app.js, index.html, styles.css, HANDOFF.md; ultimo push 22/08). Es la MAQUETA con usuarios en memoria (`USERS`: juan_giraldo/1234, admin/admin123); NO tiene `src/api.js` ni integracion API | Sebastian no ha publicado el cliente API | Capturas + E2E login/catalogo/carrito |
| Movil | SRS alineado al contrato real | SRS v4 (10/09): corrigio 12 de 14 puntos. Quedan: roles en minuscula (ALTA), `tienda/resumen` residual (MEDIA) y flujos `/historial/cancelar`, `/usuarios/registro` (MEDIA) | Parra | Capturas + E2E login/catalogo/detalle |

## 3. Tareas por cliente

### 3.1 Web — Diego Serna (lider web) / Yepes
- [ ] Merge de la rama frontend (`prueba-backend` o `feature/frontend-modulos-s1`) a `commercycity/main`
- [ ] `API_BASE_URL = http://localhost:3000` en `constants/config.js` (ya corregido en la rama; confirmar)
- [ ] Login real: `POST /api/usuarios/login`, guardar token y usuario (rol desde `usuario.roles`)
- [ ] Chat conectado: `GET /api/chat/conversaciones`, `GET /api/chat/mensajes/:usuarioId`, `PATCH /api/chat/mensajes/:id/leido`, `POST /api/chat` (multipart)
- [ ] Notificaciones: `GET /api/notificaciones`, `GET /no-leidas`, `PATCH /leidas` (polling)
- [ ] Modulos estaticos del alcance: catalogo (`GET /api/productos` con `page/limit/nombre/categoria/vendedor`), carrito (con `comprador_id`), historial (`GET /api/historial/compras`), tienda (`/api/tienda/*`)
- [ ] Manejo 401/403 con cierre de sesion y redireccion a login
- [ ] Evidencia: capturas pantalla + respuesta JSON de cada endpoint consumido

### 3.2 Escritorio — Sebastian Banguera
- [ ] Subir el cliente API `src/api.js` al repo oficial `BLACK-CODE-JSB/VOCETO-E-COMERCITY-SENA-ADSO-35` (ya contiene la maqueta Electron; falta el apiService)
- [ ] Reemplazar los usuarios en memoria (`USERS`: juan_giraldo/1234, admin/admin123) por login real contra `POST /api/usuarios/login` con JWT
- [ ] `api.js` con contrato canonico: carrito con `comprador_id` (sin JWT), IVA/90-10 solo en `/api/pedidos/*`
- [ ] Login real contra `http://localhost:3000`
- [ ] Catalogo (`GET /api/productos`, detalle `GET /api/productos/:id`) y carrito (POST/GET/PATCH/DELETE)
- [ ] E2E con capturas contra `commercity_v2`
- [ ] Actualizar matriz RF a numeracion oficial (RF48/RF120/RF121/RF140)

### 3.3 Movil — Jhon Parra (lider movil) / Meneses (apoyo)
- [ ] Corregir los 14 puntos del SRS v3.0 y la matriz de la seccion 4 (contrato real)
- [ ] `api.js` movil centralizado con el contrato real y wrapper `{ success, data }`
- [ ] Login real (`POST /api/usuarios/login`) + almacenamiento seguro del token
- [ ] Catalogo (`GET /api/productos?page&limit&nombre&categoria`) + detalle (`GET /api/productos/:id`) + validar stock (`/validar-stock`)
- [ ] E2E con capturas contra `commercity_v2`

## 4. Tareas transversales (backend / QA)

- [ ] Publicar la nueva `DB_PASSWORD` por canal privado y confirmar actualizacion en los `.env` de todos
- [ ] Smoke test de `/api` por cliente: login + catalogo + carrito (script de verificacion)
- [ ] Confirmar CORS: `FRONTEND_URL` del backend = origen real del cliente web
- [ ] Revisar que ningun cliente use `localhost:5000` (solo 3000)
- [ ] Registrar evidencia por modulo (capturas + endpoint + JSON) para el portafolio de la Fase 4

## 5. Criterios de aceptacion de la Fase 2

- [ ] Web, escritorio y movil obtienen datos reales de `/api` (sin datos estaticos en las pantallas del alcance)
- [ ] Login real con JWT funcionando en los tres clientes
- [ ] Sin errores de contrato (URLs, body/query, codigos HTTP) en las pantallas conectadas
- [ ] Suite del backend sin regresiones (307/307) y cobertura sin bajar de la referencia (Lines 93.72%)
- [ ] Evidencia por cliente adjunta (capturas + JSON)

## 6. Riesgos y mitigacion

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| Merge del frontend se retrasa | Web no arranca | Fijar fecha con Diego/Yepes; integrar en `main` en un solo PR |
| Sebastian no sube el codigo | Escritorio no arranca | Plazo martes 9; si no, se reasigna/avanza sin su rama |
| SRS movil sin corregir | Movil conecta contra contrato equivocado | Correcciones ya enviadas; validar antes de codificar |
| `.env` sin actualizar tras rotacion | Errores de conexion en cascada | Aviso al grupo + verificacion de conexion por integrante |
| Clave de BD publicada en el chat | Riesgo de seguridad | Evaluar rotacion a clave aleatoria fuera del chat (Director) |
