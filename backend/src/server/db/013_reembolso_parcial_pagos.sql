-- 013_reembolso_parcial_pagos.sql
-- S1 (auditoria 2026-10-06): reembolso PROPORCIONAL POR MONTO.
-- La cancelacion de UNA linea reembolsa round2(subtotal * 1.19) (lo que pago
-- el comprador por la linea, IVA incluido - coherente con mig 008 y RF121/RF140,
-- donde subtotal se guarda SIN IVA). El estado parcial se DERIVA:
--   0 < monto_reembolsado < monto  -> parcial (estado queda 'Aprobado')
--   monto_reembolsado >= monto     -> estado 'Reembolsado'
-- No se agrega el valor 'Parcial' al ENUM para minimizar el riesgo sobre la BD
-- en uso (pagos_simulados) y por compatibilidad con los reportes existentes.
--
-- Idempotente (TASK-7.4, auditoria 2026-10-11): el ADD COLUMN solo se ejecuta
-- si la columna no existe, y el backfill solo toca filas 'Reembolsado' que
-- quedaron sin acumular monto (pagos previos a la logica proporcional).
-- EJECUTAR contra la BD real (commercity_v2). Operacion online de bajo riesgo
-- (ADD COLUMN con DEFAULT no bloquea lecturas ni escrituras prolongadas).

SET @col_reembolso := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pagos_simulados'
      AND COLUMN_NAME = 'monto_reembolsado'
);
SET @ddl := IF(
    @col_reembolso = 0,
    'ALTER TABLE pagos_simulados ADD COLUMN monto_reembolsado DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER monto',
    'SELECT ''pagos_simulados.monto_reembolsado ya existe; nada que hacer'' AS resultado'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill (TASK-7.4): los pagos ya marcados 'Reembolsado' por la logica
-- anterior (todo-o-nada) representan un reembolso completo: si quedaron en 0,
-- se acumula el monto total devuelto.
UPDATE pagos_simulados
   SET monto_reembolsado = monto
 WHERE estado = 'Reembolsado'
   AND monto_reembolsado = 0.00;

-- Verificacion sugerida:
--   SELECT COUNT(*) FROM pagos_simulados
--    WHERE estado = 'Reembolsado' AND monto_reembolsado = 0.00;  -- debe dar 0

-- Rollback (destructivo: pierde el acumulado):
-- ALTER TABLE pagos_simulados
--   DROP COLUMN monto_reembolsado;
