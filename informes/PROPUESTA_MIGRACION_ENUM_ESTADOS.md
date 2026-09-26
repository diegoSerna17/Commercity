# Propuesta de Migración — ENUMs de estados (cancelación de pedidos)

**Fecha**: 2026-09-25
**Estado**: PROPUESTA PENDIENTE DE VALIDACIÓN (no aplicada)
**Responsables de validación**: líder de BD del equipo + instructor/asesor del proyecto
**Clasificación**: P0 (brecha código vs BD que bloqueaba el flujo de cancelación de pedidos)

---

## 1. Problema detectado

Al cancelar pedidos (por línea o general) en `backend/src/server/controllers/pedidos.controllers.js`, el código escribía dos literales que **no existen** en los ENUM reales de la BD `commerccity_v2`:

| Columna | ENUM real (`information_schema`) | Literal inválido escrito por el código anterior | Efecto |
|---|---|---|---|
| `detalle_pedidos.estado_pago_vendedor` | `enum('Pendiente','Desembolsado')` | `'Reembolsado'` | Error de MySQL en la transacción de cancelación |
| `pagos_simulados.estado` | `enum('Aprobado','Rechazado','Pendiente','Reembolsado')` | `'Parcial'` | Error de MySQL en la misma transacción (bug latente: estallaba al corregir el primero) |

Ambos bugs se corrigieron **juntos** (no era posible desacoplarlos sin dejar el flujo roto).

## 2. Decisión adoptada

Vía consulta al líder de backend se eligió la **Opción B en código + Opción A como propuesta documental**:

- **Opción B (aplicada ya)**: el código mapea la cancelación a valores válidos dentro de los ENUM actuales. Es reversible, no requiere DDL en la BD compartida y no rompe nada hoy.
- **Opción A (este documento)**: propuesta de migración DDL para enriquecer los ENUM con los estados semánticos correctos, sujeta a validación del líder de BD y del instructor antes de aplicarse.

## 3. Opción B aplicada (mapeo actual del código)

### 3.1 `detalle_pedidos.estado_pago_vendedor` (línea cancelada)

| Estado previo de la línea | Valor escrito | Justificación |
|---|---|---|
| No desembolsada | `'Pendiente'` | El pago al vendedor queda pendiente de nuevo tras la cancelación |
| Ya `'Desembolsado'` | `'Desembolsado'` (se conserva) | No se le retira al vendedor un dinero ya desembolsado |

Helper en el controlador: `estadoPagoVendedorTrasCancelacion(estadoActual)`.

### 3.2 `pagos_simulados.estado` (pago del pedido)

| Escenario | Valor escrito | Justificación |
|---|---|---|
| Todas las líneas canceladas | `'Reembolsado'` | Reembolso total |
| Quedan líneas vivas (entregadas/en camino) | `'Aprobado'` | El pago sigue vigente por las líneas no canceladas |

**Nunca se escribe `'Parcial'` ni `'Reembolsado'` en `detalle_pedidos`**: es el objeto de los tests de regresión (casos a–d del archivo de pruebas del controlador de pedidos).

## 4. Opción A propuesta (migración DDL — NO APLICADA)

> Estos scripts están **pendientes de validación**. La IA no ejecuta DDL en el servidor de BD; los aplica el líder de BD tras el aval del instructor, en ventana coordinada con el equipo.

### 4.1 Ampliar `detalle_pedidos.estado_pago_vendedor`

```sql
-- Agrega 'Reembolsado' como estado explícito para líneas canceladas con reembolso
ALTER TABLE detalle_pedidos
  MODIFY COLUMN estado_pago_vendedor
  ENUM('Pendiente','Desembolsado','Reembolsado')
  NOT NULL DEFAULT 'Pendiente';
```

### 4.2 Ampliar `pagos_simulados.estado`

```sql
-- Agrega 'Parcial' como estado explícito para cancelaciones parciales
ALTER TABLE pagos_simulados
  MODIFY COLUMN estado
  ENUM('Aprobado','Rechazado','Pendiente','Reembolsado','Parcial')
  NOT NULL DEFAULT 'Aprobado';
```

### 4.3 Datos históricos

No se migra ningún dato existente: los valores actuales ya son válidos dentro de los ENUM ampliados. **Sin DELETE ni UPDATE de datos históricos** (borrado lógico obligatorio en el proyecto; aquí ni siquiera aplica).

## 5. Impacto estimado de aplicar la Opción A

| Área | Impacto |
|---|---|
| BD | 2 `ALTER TABLE` en columnas ENUM; sin pérdida de datos; compatible con valores existentes |
| Backend | Cambio menor en el helper `estadoPagoVendedorTrasCancelacion` y en la rama de cancelación parcial para escribir `'Reembolsado'` / `'Parcial'` cuando aplique |
| Frontend / Móvil | Solo si muestran etiquetas de estado: añadir textos para "Reembolsado" (línea) y "Parcial" (pago) |
| Tests | Actualizar las expectativas de regresión (a–d) al nuevo mapeo; los ENUM reales se verifican contra `information_schema` |

## 6. Rollback

La migración es reversible y sin pérdida de datos:

```sql
-- Revertir 4.1 (solo si NO existen filas con 'Reembolsado')
ALTER TABLE detalle_pedidos
  MODIFY COLUMN estado_pago_vendedor
  ENUM('Pendiente','Desembolsado')
  NOT NULL DEFAULT 'Pendiente';

-- Revertir 4.2 (solo si NO existen filas con 'Parcial')
ALTER TABLE pagos_simulados
  MODIFY COLUMN estado
  ENUM('Aprobado','Rechazado','Pendiente','Reembolsado')
  NOT NULL DEFAULT 'Aprobado';
```

Antes de revertir, verificar ausencia de valores nuevos:

```sql
SELECT COUNT(*) FROM detalle_pedidos WHERE estado_pago_vendedor = 'Reembolsado';
SELECT COUNT(*) FROM pagos_simulados WHERE estado = 'Parcial';
```

Si existen filas con los valores nuevos, el rollback del código consiste en volver al mapeo de la Opción B (ya implementado y cubierto por tests).

## 7. Plan de validación (próxima reunión de equipo)

1. Presentar este documento al líder de BD y al instructor/asesor.
2. Decidir: aplicar Opción A (estados semánticos) o mantener Opción B (mapeo a ENUM actuales).
3. Si se aprueba: el líder de BD agenda los 2 `ALTER TABLE` en ventana coordinada y confirma la ejecución con evidencia (`SHOW COLUMNS FROM detalle_pedidos` / `SHOW COLUMNS FROM pagos_simulados`).
4. Tras aplicar: el backend ajusta el helper y los tests de regresión (lote menor, con su entrada en CHANGELOG).

## 8. Trazabilidad

- Código con Opción B: `backend/src/server/controllers/pedidos.controllers.js`.
- Tests de regresión de los ENUM: `backend/src/server/__tests__/pedidos.controllers.test.js` (casos a–d: línea no desembolsada, línea desembolsada, reembolso total, cancelación parcial).
- Fuente de los ENUM reales: consulta a `information_schema` sobre la BD del proyecto (2026-09-25).
