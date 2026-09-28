# Informe Rama BACKEND — Plan Integración API Móvil + Escritorio (2026-09-27)

> Agente: rama BACKEND. Alcance estricto: solo `backend/**` + este informe.
> Brief: `docs/informes/PLAN_INTEGRACION_API_MOVIL_ESCRITORIO_2026-09-27.md`, sección "RAMA backend".

## 1. Tareas ejecutadas

### 1) RESTAURAR `GET /api/tienda/validacion` (RF130–139)
- **Origen:** commit `eaf9c91` ("FEAT: endpoint de validacion Mi Tienda RF130-RF139", CHANGELOG 2026-08-24). El endpoint había sido eliminado en HEAD (diff `eaf9c91..HEAD` lo confirma); se restauró íntegro.
- **`backend/src/server/controllers/tienda.controllers.js`**: añadido handler **`getValidacionTienda`** (solo lectura, opera sobre `req.userId` del token) + alias histórico `getValidacionMiTienda = getValidacionTienda` (nombre original del commit de referencia).
  - Cuenta bancaria (RF131–RF133, RF138): `validarCuentaBancaria()` — registrada/completa, **nunca expone número ni titular en claro** (usa `maskBankAccount` / `maskFullName`, solo `ultimos4` + enmascarados).
  - Flujo 90/10 por línea (RF136/RF139): `monto_vendedor + monto_comision == subtotal` con **tolerancia de 1 centavo** (`TOLERANCIA_CENTAVOS = 0.01`), más chequeo global acumulado con tolerancia `0.01 × líneas_activas`.
  - Devoluciones con reembolso (RF35/RF129/RF137): líneas `Cancelado`, unidades restituidas a stock, `monto_reembolsado` (subtotal) y `monto_vendedor_descontado` (90%), exige pagos marcados `Reembolsado`.
- **`backend/src/server/routes/tienda.routes.js`**: import + `router.get("/validacion", ...vendedor, getValidacionTienda)` bajo el guard existente `vendedor = [authRequired, requireRoles(["vendedor"])]` → sin token 401, rol comprador 403.

### 2) CORS Electron
- **`backend/src/server/app.js`**: añadidos `"null"` y `"file://"` al array `CORS_ORIGINS` (Electron `loadFile` envía `Origin: null`). **Sin comodín `'*'`** — lista blanca cerrada: `FRONTEND_URL`, `https://localhost`, `http://localhost`, `capacitor://localhost`, `null`, `file://`.

### 3) Tests ampliados
- **`backend/src/server/__tests__/tienda.controllers.test.js`**: nuevo bloque `describe("Validacion de Mi Tienda (RF130-RF139)")` con 6 casos:
  - sin token → 401; rol comprador → 403; vendedor 200 con cuenta completa + 90/10 válido (verifica no-exposición de datos sensibles); sin cuenta → `RF131`; línea incoherente → `RF136/RF139` con `diferencia > 0.01`; cancelada sin reembolso → `RF35` con montos de reembolso.
- **`backend/src/server/__tests__/cors.middleware.test.js`**: 2 casos nuevos — preflight `Origin: null` → 204 con `Access-Control-Allow-Origin: null`; preflight `Origin: file://` → 204 con `ACAO: file://`.

## 2. Verificación
- Comando (solo los dos archivos, sin suite completa):
  `cd backend && npx vitest run src/server/__tests__/tienda.controllers.test.js src/server/__tests__/cors.middleware.test.js`
- **Resultado: 2 archivos, 28 tests, todo en verde** (tienda 20 + cors 8). Duración ~33 s.

## 3. Reporte final (resumen)
- **Archivos tocados (5, todos en `backend/**`):**
  1. `backend/src/server/controllers/tienda.controllers.js` (handler `getValidacionTienda` + alias `getValidacionMiTienda`)
  2. `backend/src/server/routes/tienda.routes.js` (ruta `GET /validacion`)
  3. `backend/src/server/app.js` (`CORS_ORIGINS` + `null`, `file://`)
  4. `backend/src/server/__tests__/tienda.controllers.test.js` (+6 tests validación)
  5. `backend/src/server/__tests__/cors.middleware.test.js` (+2 tests Electron)
- **Endpoints afectados (1 restaurado):**
  - `GET /api/tienda/validacion` — auth vendedor; 200 `{ success, data: { vendedor_id, cuenta_bancaria, flujo_90_10, devoluciones, validado, observaciones } }`; 401 sin token; 403 rol no vendedor.
- **Resultado de tests:** VERDE — 28/28 pasados en los dos archivos indicados. Suite completa del backend NO ejecutada (orden explícita).
- **No tocado:** `frontend/**`, `docs/AVANCES/**` ni otros informes (límite respetado; `git status` solo muestra los 5 archivos backend + este informe).
