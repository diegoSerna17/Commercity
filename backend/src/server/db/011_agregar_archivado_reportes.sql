-- 011_agregar_archivado_reportes.sql
-- Fix 4.2 del informe de Cabrera (Panel Admin): los reportes son historial de
-- moderacion; se archivan (borrado logico), nunca se borran fisicamente.
-- Idempotente: no falla si la columna ya existe.

SET @columna_existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'reportes'
      AND COLUMN_NAME = 'archivado'
);
SET @ddl := IF(
    @columna_existe = 0,
    'ALTER TABLE reportes ADD COLUMN archivado TINYINT(1) NOT NULL DEFAULT 0 AFTER respondido_at',
    'SELECT ''reportes.archivado ya existe; nada que hacer'''
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Rollback:
-- ALTER TABLE reportes DROP COLUMN archivado;
