# Informe Critico: Incompatibilidad del Modulo Carrito Backend con el Esquema de Base de Datos

| Campo | Detalle |
|---|---|
| Autor | Daniel Palacios |
| Fecha | 2026-08-05 |
| Severidad | CRITICA |
| Alcance | Backend - Modulo carrito (`backend/src/server/controllers/carrito.controllers.js`) |
| Referencia | `schema_commercity.sql` (base de datos del proyecto) |
| Tarea asignada | Carrito - Daniel Palacios (Agregar, Eliminar, Modificar cantidad, Agrupar por vendedor + resumen) - Entrega martes 11 de agosto |

---

## 1. Resumen ejecutivo

Durante la revision del esquema `schema_commercity.sql` (fuente de verdad de la base de datos del proyecto), detecte que **el modulo de carrito backend que implemente no es compatible con el modelo de datos real**. Las consultas SQL del controlador referencian una tabla `carrito` y columnas (`carrito_id`, `usuario_id`, `precio_original`, `imagen`) que **no existen** en el esquema definido por el equipo.

Esta incompatibilidad impide que la tarea asignada (carrito) funcione contra la base de datos real. Al ejecutar cualquier endpoint contra MySQL, se producira un error de servidor (`ER_BAD_TABLE_ERROR` o `ER_BAD_FIELD_ERROR`), devolviendo HTTP 500.

## 2. Contexto

- El lider de desarrollo definio el esquema `schema_commercity.sql` con 17 tablas normalizadas.
- Yo implemente el modulo carrito (4 endpoints: POST, DELETE, PATCH, GET) bajo la regla "solo backend, solo lo asignado", pero **sin verificar previamente el esquema real de la base de datos**.
- Esta es la causa raiz del hallazgo: la implementacion se baso en un modelo de datos asumido (tabla `carrito` intermedia) en lugar del modelo oficial (carrito implicito por comprador).

## 3. Detalle de la incompatibilidad

| Referencia en el backend actual | Esquema real (`schema_commercity.sql`) | Estado |
|---|---|---|
| Tabla `carrito` (`id`, `usuario_id`) | **No existe** - el carrito es implicito por comprador | Incompatible |
| `carrito_items.carrito_id` (FK a `carrito`) | `carrito_items.comprador_id` (FK a `usuarios`) | Incompatible |
| `carrito_items.usuario_id` | `carrito_items.comprador_id` | Incompatible |
| `productos.precio_original` | **No existe** - existe `descuento_porcentaje` | Incompatible |
| `productos.imagen` | `productos.imagen_url` | Incompatible |
| `JOIN usuarios u ON u.id = p.vendedor_id` | `productos.vendedor_id` existe | Compatible |

### Estructura real de `carrito_items` (esquema oficial)

```sql
CREATE TABLE carrito_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comprador_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_comprador_producto (comprador_id, producto_id),
    FOREIGN KEY (comprador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

### Estructura real de `productos` (columnas relevantes)

```sql
precio DECIMAL(12, 2) NOT NULL,
stock INT NOT NULL DEFAULT 0,
descuento_porcentaje DECIMAL(5, 2) DEFAULT 0.00,
imagen_url VARCHAR(255) NOT NULL,
vendedor_id INT NOT NULL
```

## 4. Impacto tecnico (antes de la correccion)

- `POST /api/carrito` -> Error 500 (`ER_NO_SUCH_TABLE`: tabla `carrito` no existe).
- `DELETE /api/carrito/:productoId` -> Error 500 (misma causa).
- `PATCH /api/carrito/:productoId` -> Error 500 (misma causa).
- `GET /api/carrito` -> Error 500 (`ER_BAD_FIELD_ERROR`: columnas `precio_original` e `imagen` inexistentes).
- La validacion de stock y la respuesta JSON estructurada funcionaban, pero la capa de datos fallaba.

> **ESTADO: RESUELTO el 2026-08-05.** El controlador fue realineado al esquema real (ver seccion 6).

## 5. Analisis de causa raiz

1. **Premisa incorrecta**: asumi que el carrito necesitaba una tabla contenedora `carrito`, cuando el esquema oficial modela el carrito directamente como items asociados al comprador.
2. **Falta de verificacion del esquema**: implemente sin contrastar nombres de tablas y columnas contra `schema_commercity.sql`.
3. **Convencion no aplicada**: el esquema ya provee `UNIQUE KEY uq_comprador_producto`, disenada para operaciones de *upsert* (agregar producto que ya existe incrementa cantidad). Mi implementacion hace SELECT + UPDATE/INSERT separados y sin transaccion.

## 6. Plan de correccion aplicado (backend, sin modificar el esquema del lider)

| Paso | Accion | Estado |
|---|---|---|
| 1 | Eliminada la tabla `carrito` intermedia: el carrito usa directamente `carrito_items.comprador_id` | Aplicado |
| 2 | Parametro renombrado `usuario_id` -> `comprador_id` en body y query de los 4 endpoints | Aplicado |
| 3 | Upsert atomico: `INSERT ... ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)` aprovechando `uq_comprador_producto` | Aplicado |
| 4 | Columnas corregidas: `imagen` -> `imagen_url`; eliminado `precio_original`; precio final calculado con `descuento_porcentaje`; `u.nombre` -> `u.nombre_completo` | Aplicado |
| 5 | Validacion de stock mantenida en backend + verificacion de comprador activo (`usuarios.activo`) y producto no eliminado (`eliminado_por_admin`) | Aplicado |
| 6 | Transacciones con `FOR UPDATE` en `agregarProducto` y `modificarCantidad` (BEGIN/COMMIT/ROLLBACK) para evitar inconsistencias por concurrencia | Aplicado |

### Cambios adicionales de robustez

- Redondeo monetario a 2 decimales en lineas, subtotales y total (evita errores de coma flotante).
- `modificarCantidad` verifica existencia con `SELECT ... FOR UPDATE` en vez de depender de `affectedRows` del UPDATE (evita falso 404 cuando la cantidad no cambia).
- `agregarProducto` devuelve 404 `COMPRADOR_NOT_FOUND` / `PRODUCT_NOT_FOUND` en vez de error 500 por FK.

### Consulta corregida de ejemplo (GET agrupado por vendedor)

```sql
SELECT
    ci.producto_id,
    ci.cantidad,
    p.nombre           AS producto_nombre,
    p.precio,
    p.descuento_porcentaje,
    p.imagen_url       AS imagen,
    p.vendedor_id,
    u.nombre           AS vendedor_nombre
FROM carrito_items ci
JOIN productos  p ON p.id = ci.producto_id
JOIN usuarios   u ON u.id = p.vendedor_id
WHERE ci.comprador_id = ?
ORDER BY u.nombre, p.nombre;
```

## 7. Hallazgos secundarios detectados en el esquema (para coordinacion con el lider)

| # | Severidad | Ubicacion | Observacion |
|---|---|---|---|
| 1 | MEDIA | `notificaciones.tipo` | Valor ENUM con espacio: `'pedido enviado'` -> usar `'pedido_enviado'` |
| 2 | MEDIA | `notificaciones.estado` | ENUM con acentos: `'leido'`, `'no leido'` - riesgo de mojibake |
| 3 | MEDIA | `pagos_simulados.estado` | `DEFAULT 'Aprobado'` -> deberia ser `'Pendiente'` |
| 4 | MEDIA | `carrito_items.cantidad` | Sin `CHECK (cantidad > 0)` - defensa en profundidad |
| 5 | BAJA | `detalle_pedidos` | Comision 10% hardcodeada en columna generada - calcular en aplicacion |
| 6 | BAJA | Seeders | Faltan categorias, usuarios y productos de prueba |

## 8. Leccion aprendida y accion preventiva

- **Regla nueva**: antes de implementar cualquier modulo backend, verificar nombres de tablas y columnas contra `schema_commercity.sql`.
- Documentar en la regla `mysql-convenciones.md` la nomenclatura oficial del esquema (`created_at`, `updated_at`, `comprador_id`, `imagen_url`) para alinear convenciones.

## 9. Estado

| Item | Estado |
|---|---|
| Deteccion del hallazgo | Completado |
| Informe documentado | Completado |
| Correccion del controlador (B1) | Completado (2026-08-05) |
| Validacion de arranque y contrato | Completado (GET / 200; validacion 400 con `comprador_id`) |
| Prueba de flujo completo contra MySQL real | Pendiente (no hay BD configurada en el entorno local) |
| Entrega de la tarea | Martes 11 de agosto |
