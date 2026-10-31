-- 009_limpiar_carritos_inactivos.sql
-- RF109: vaciar automaticamente los carritos sin actividad por 7 dias.
-- B3 (P2 auditoria 2026-10-05): la version anterior usaba
-- carrito_items.updated_at, columna inexistente (migracion ROTA).
-- Esta version crea la columna (M6, idempotente) antes del evento.
-- Requiere event_scheduler = ON.

-- 1) Columna updated_at (idempotente: no falla si ya existe).
SET @columna_existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'carrito_items'
      AND COLUMN_NAME = 'updated_at'
);
SET @ddl := IF(
    @columna_existe = 0,
    'ALTER TABLE carrito_items ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER added_at',
    'SELECT ''carrito_items.updated_at ya existe; nada que hacer'''
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Evento diario de limpieza.
CREATE EVENT IF NOT EXISTS limpiar_carritos_inactivos
ON SCHEDULE EVERY 1 DAY STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 2 HOUR)
ON COMPLETION PRESERVE
DO DELETE FROM carrito_items
   WHERE updated_at < NOW() - INTERVAL 7 DAY;

-- Rollback:
-- DROP EVENT IF EXISTS limpiar_carritos_inactivos;
-- ALTER TABLE carrito_items DROP COLUMN updated_at;
