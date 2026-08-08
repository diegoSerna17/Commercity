-- 008_agregar_reembolso_pagos.sql
-- M8: RF74 / RF135 - al cancelar un pedido Pendiente se reembolsa el valor pagado (incluye IVA).
-- La cancelacion se registra como estado; las comisiones 90/10 se excluyen de los reportes por linea Cancelado.
ALTER TABLE pagos_simulados
  MODIFY COLUMN estado ENUM('Aprobado', 'Rechazado', 'Pendiente', 'Reembolsado') DEFAULT 'Pendiente';

-- Rollback:
-- ALTER TABLE pagos_simulados
--   MODIFY COLUMN estado ENUM('Aprobado', 'Rechazado', 'Pendiente') DEFAULT 'Pendiente';
