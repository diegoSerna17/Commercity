-- 017_datos_bancarios_longitudes.sql
-- M-DB-1 (auditoria 2026-10-11): `datos_bancarios.titular_nombre` se guarda
-- CIFRADO (AES-256-GCM, formato iv:tag:dato en base64url) y con VARCHAR(100)
-- solo cabian ~45 bytes de nombre en claro (el ciphertext ocupa mucho mas).
-- `banco` pasa a VARCHAR(100) para alinear con la longitud de la BD real.
--
-- Idempotente (TASK-7.2): cada ALTER se aplica solo si la longitud actual es
-- menor que la objetivo; repetir la migracion no hace nada.
-- EJECUTAR contra la BD real (commercity_v2) segun TASK-7.4.

SET @largo_titular := (
    SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'datos_bancarios'
      AND COLUMN_NAME = 'titular_nombre'
);
SET @ddl := IF(
    @largo_titular IS NOT NULL AND @largo_titular < 255,
    'ALTER TABLE datos_bancarios MODIFY COLUMN titular_nombre VARCHAR(255) NOT NULL',
    'SELECT ''datos_bancarios.titular_nombre ya tiene longitud suficiente; nada que hacer'' AS resultado'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @largo_banco := (
    SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'datos_bancarios'
      AND COLUMN_NAME = 'banco'
);
SET @ddl := IF(
    @largo_banco IS NOT NULL AND @largo_banco < 100,
    'ALTER TABLE datos_bancarios MODIFY COLUMN banco VARCHAR(100) NOT NULL',
    'SELECT ''datos_bancarios.banco ya tiene longitud suficiente; nada que hacer'' AS resultado'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificacion sugerida:
--   SELECT COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS
--    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'datos_bancarios'
--      AND COLUMN_NAME IN ('titular_nombre', 'banco');

-- Rollback (solo si no hubiera valores mas largos; verificar antes):
-- ALTER TABLE datos_bancarios MODIFY COLUMN titular_nombre VARCHAR(100) NOT NULL;
-- ALTER TABLE datos_bancarios MODIFY COLUMN banco VARCHAR(50) NOT NULL;
