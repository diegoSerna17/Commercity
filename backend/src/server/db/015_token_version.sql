-- ============================================================================
-- Migracion 015 - token_version + password_changed_at (M-8, TASK-4.3)
-- Auditoria PREVIEW 2026-10-11.
--
-- Objetivo: sesiones revocables. El JWT incluye `token_version` y authRequired
-- lo compara contra usuarios.token_version: al incrementarlo (reset de
-- contrasena, cambio de contrasena, baneo o "cerrar todas las sesiones") todos
-- los tokens ya emitidos quedan invalidos sin tocar la lista negra.
--
-- Idempotente: solo agrega la columna si no existe (information_schema).
-- NO destructiva: no borra ni modifica datos existentes.
-- ============================================================================

SET @db_actual := DATABASE();

-- usuarios.token_version
SET @existe_token_version := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db_actual
     AND TABLE_NAME = 'usuarios'
     AND COLUMN_NAME = 'token_version'
);
SET @sql := IF(
  @existe_token_version = 0,
  'ALTER TABLE usuarios ADD COLUMN token_version INT NOT NULL DEFAULT 0 AFTER activo',
  'SELECT ''token_version ya existe'' AS aviso'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- usuarios.password_changed_at (auditoria de cambios de contrasena)
SET @existe_password_changed := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db_actual
     AND TABLE_NAME = 'usuarios'
     AND COLUMN_NAME = 'password_changed_at'
);
SET @sql := IF(
  @existe_password_changed = 0,
  'ALTER TABLE usuarios ADD COLUMN password_changed_at DATETIME NULL AFTER token_version',
  'SELECT ''password_changed_at ya existe'' AS aviso'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- B-* (TASK-4.9): indice para el reset atomico por token_recuperacion
-- (UPDATE ... WHERE token_recuperacion = ? AND expiracion > NOW()).
SET @existe_indice_token := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = @db_actual
     AND TABLE_NAME = 'usuarios'
     AND INDEX_NAME = 'idx_usuarios_token_recuperacion'
);
SET @sql := IF(
  @existe_indice_token = 0,
  'ALTER TABLE usuarios ADD INDEX idx_usuarios_token_recuperacion (token_recuperacion)',
  'SELECT ''idx_usuarios_token_recuperacion ya existe'' AS aviso'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
