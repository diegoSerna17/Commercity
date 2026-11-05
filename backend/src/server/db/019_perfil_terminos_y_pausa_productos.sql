-- 019_perfil_terminos_y_pausa_productos.sql
-- Lote 5 (auditoria 2026-11-04): funciones faltantes de perfil y catalogo.
--   * usuarios.terminos_aceptados_en (RF6): fecha de aceptacion de terminos.
--   * productos.pausado (RF55): el vendedor pausa su publicacion sin borrarla.
--   * productos.eliminado_por_vendedor (RF55): baja logica propia del vendedor.
--
-- Idempotente: cada columna se agrega solo si no existe.

SET @db_actual := DATABASE();

SET @existe_terminos := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db_actual
     AND TABLE_NAME = 'usuarios'
     AND COLUMN_NAME = 'terminos_aceptados_en'
);
SET @sql := IF(
  @existe_terminos = 0,
  'ALTER TABLE usuarios ADD COLUMN terminos_aceptados_en DATETIME NULL AFTER password_changed_at',
  'SELECT ''usuarios.terminos_aceptados_en ya existe'' AS aviso'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe_pausado := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db_actual
     AND TABLE_NAME = 'productos'
     AND COLUMN_NAME = 'pausado'
);
SET @sql := IF(
  @existe_pausado = 0,
  'ALTER TABLE productos ADD COLUMN pausado TINYINT(1) NOT NULL DEFAULT 0 AFTER eliminado_por_admin',
  'SELECT ''productos.pausado ya existe'' AS aviso'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe_eliminado_vendedor := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db_actual
     AND TABLE_NAME = 'productos'
     AND COLUMN_NAME = 'eliminado_por_vendedor'
);
SET @sql := IF(
  @existe_eliminado_vendedor = 0,
  'ALTER TABLE productos ADD COLUMN eliminado_por_vendedor TINYINT(1) NOT NULL DEFAULT 0 AFTER pausado',
  'SELECT ''productos.eliminado_por_vendedor ya existe'' AS aviso'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Indice para el catalogo publico (visibles + no pausados).
SET @existe_indice := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = @db_actual
     AND TABLE_NAME = 'productos'
     AND INDEX_NAME = 'idx_productos_pausado_vendedor'
);
SET @sql := IF(
  @existe_indice = 0,
  'ALTER TABLE productos ADD INDEX idx_productos_pausado_vendedor (pausado, eliminado_por_vendedor)',
  'SELECT ''idx_productos_pausado_vendedor ya existe'' AS aviso'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Rollback (solo si no hay datos que dependan de las columnas):
-- ALTER TABLE productos DROP INDEX idx_productos_pausado_vendedor;
-- ALTER TABLE productos DROP COLUMN eliminado_por_vendedor;
-- ALTER TABLE productos DROP COLUMN pausado;
-- ALTER TABLE usuarios DROP COLUMN terminos_aceptados_en;
