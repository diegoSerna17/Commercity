# Informe de Pruebas - Modulo Carrito

| Campo | Detalle |
|---|---|
| Autor | Daniel Palacios |
| Fecha | 2026-08-05 |
| Modulo | Carrito de compras (backend + BD) |
| Alcance | Pruebas unitarias (Vitest + Supertest) y prueba funcional en vivo contra la BD real |
| Requerimientos | RF103, RF104, RF105, RFX, RF109 (REVISION), RF76 |

---

## 1. Resumen

Se ejecutaron dos niveles de prueba sobre el modulo carrito:

1. **Pruebas unitarias** (Vitest + Supertest, con mock de base de datos): **19/19 tests en verde**. Cobertura por encima del umbral del proyecto (60): Statements 93%, Branches 84.9%, Functions 100%, Lines 92.92%.
2. **Prueba funcional en vivo** contra la base de datos real (`commercy_v2`, servidor remoto del equipo): flujo completo de 8 pasos, todos exitosos.

Resultado general: **el modulo cumple los requerimientos asignados y esta listo para integracion con el frontend.**

## 2. Entorno de pruebas

| Elemento | Valor |
|---|---|
| Framework unitario | Vitest 4.1.10 + Supertest 7.2.2 |
| Cobertura | @vitest/coverage-v8 (provider v8) |
| BD en pruebas funcionales | `commercy_v2` en `149.130.178.228:3306` (remota del equipo) |
| Servidor | Express en puerto 5000 |
| Comando unitario | `npm test` (vitest run) |
| Comando cobertura | `npm run test:coverage` |

## 3. Pruebas unitarias (19 tests)

Archivo: `backend/src/server/__tests__/carrito.controllers.test.js`. La BD se simula con `vi.mock('mysql2/promise')` (sin conexion real).

### 3.1 Resultado general

```
Test Files  1 passed (1)
     Tests  19 passed (19)
Duration    713ms
```

### 3.2 Cobertura

| Indicador | Resultado | Umbral del proyecto |
|---|---|---|
| Statements | 93% | 60% |
| Branches | 84.9% | 60% |
| Functions | 100% | 60% |
| Lines | 92.92% | 60% |

### 3.3 Casos por grupo

| Grupo | # | Casos | Resultado |
|---|---|---|---|
| POST /api/carrito (agregar) | 7 | validacion 400; producto inexistente 404; comprador inactivo 404; stock insuficiente 400; agregar nuevo 201; acumular con upsert 201; error interno 500 | Todos OK |
| GET /api/carrito (listar) | 3 | validacion 400; agrupacion por vendedor con descuento (precio_final 90000, total 450000); carrito vacio | Todos OK |
| PATCH /api/carrito/:productoId (modificar) | 5 | validacion 400; producto inexistente 404; stock excedido 400; item ausente 404; actualizacion 200 | Todos OK |
| DELETE /api/carrito/:productoId (eliminar) | 3 | validacion 400; item ausente 404; eliminacion 200 | Todos OK |
| GET / | 1 | respuesta del servidor | OK |

## 4. Prueba funcional en vivo (BD real `commercy_v2`)

Flujo completo ejecutado contra la BD remota con datos semilla temporales (eliminados al final):

| # | Paso | Resultado | Detalle |
|---|---|---|---|
| 1 | POST agregar (cantidad 2) | 201 | `{"success":true,"message":"Producto agregado al carrito"}` |
| 2 | POST agregar (cantidad 3) | 201 | Upsert: acumulo a 5 unidades |
| 3 | POST excede stock (100 > 10) | 400 | `INSUFFICIENT_STOCK: Stock insuficiente. Disponible: 10` |
| 4 | GET listar agrupado | 200 | 1 vendedor, subtotal 450000, precio_final 90000 (10% descuento), cantidad 5 |
| 5 | PATCH cantidad a 4 | 200 | `Cantidad actualizada` |
| 6 | PATCH excede stock (50) | 400 | `INSUFFICIENT_STOCK` |
| 7 | DELETE producto | 200 | `Producto eliminado del carrito` |
| 8 | GET final | 200 | Carrito vacio (`vendedores: []`) |
| 9 | Limpieza | OK | Datos de prueba eliminados de la BD compartida |

### Verificacion del calculo de agrupacion (paso 4)

```json
"vendedores": [{
  "vendedor_id": 2,
  "vendedor_nombre": "Vendedor Prueba Daniel",
  "subtotal": 450000,
  "items": [{
    "precio": 100000, "precio_final": 90000,
    "descuento_porcentaje": 10, "cantidad": 5,
    "subtotal_linea": 450000
  }]
}],
"resumen": {"cantidad_vendedores": 1, "cantidad_items": 1, "subtotal_global": 450000, "total": 450000}
```

## 5. Pruebas de contrato y validacion (sin BD)

| Caso | Resultado |
|---|---|
| GET / | 200 `servidor creado` |
| GET /api/carrito?comprador_id=abc | 400 `VALIDATION_ERROR: comprador_id debe ser entero positivo` |
| POST body con cantidad 0 | 400 `VALIDATION_ERROR` |
| DELETE sin comprador_id | 400 `VALIDATION_ERROR` |
| Conexion a BD remota (SHOW TABLES) | Acceso OK - 18 tablas del esquema oficial |

## 6. Conclusiones

1. **El modulo carrito funciona correctamente** contra la base de datos real: agregar, acumular, validar stock, agrupar por vendedor, modificar y eliminar.
2. **La agrupacion por vendedor (RF109)** y el calculo con descuento producen montos exactos (precio_final 90000 sobre 100000 con 10%).
3. **La cobertura supera el umbral** del proyecto (92.92% lines vs 60% requerido), por lo que el flujo post-cambio de testing se cumple.
4. **Sin dependencia de BD en pruebas unitarias**: los 19 tests corren con mock, permitiendo CI sin conexion externa.
5. La validacion de entrada (400) y los errores estructurados (`{success, error:{code,message}}`) se comportan segun la politica de gestion de errores del proyecto.

## 7. Pendientes

| Item | Estado |
|---|---|
| Integracion del frontend con `/api/carrito` | Responsabilidad del area de frontend |
| Ejecutar suite en CI (GitHub Actions) | No configurado aun (proceso) |
