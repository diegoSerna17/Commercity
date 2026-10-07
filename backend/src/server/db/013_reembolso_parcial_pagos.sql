-- 013_reembolso_parcial_pagos.sql
-- S1 (auditoria 2026-10-06): reembolso PROPORCIONAL POR MONTO.
-- La cancelacion de UNA linea reembolsa round2(subtotal * 1.19) (lo que pago
-- el comprador por la linea, IVA incluido - coherente con mig 008 y RF121/RF140,
-- donde subtotal se guarda SIN IVA). El estado parcial se DERIVA:
--   0 < monto_reembolsado < monto  -> parcial (estado queda 'Aprobado')
--   monto_reembolsado >= monto     -> estado 'Reembolsado'
-- No se agrega el valor 'Parcial' al ENUM para minimizar el riesgo sobre la BD
-- en uso (pagos_simulados) y por compatibilidad con los reportes existentes.
-- EJECUTAR contra la BD real (commercity_v2). Operacion online de bajo riesgo
-- (ADD COLUMN con DEFAULT no bloquea lecturas ni escrituras prolongadas).
ALTER TABLE pagos_simulados
  ADD COLUMN monto_reembolsado DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER monto;

-- Rollback:
-- ALTER TABLE pagos_simulados
--   DROP COLUMN monto_reembolsado;
