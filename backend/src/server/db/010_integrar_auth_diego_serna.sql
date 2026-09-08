-- 010_integrar_auth_diego_serna.sql
-- ============================================================
-- RF2 / fix 3.3: tabla de lista negra para invalidar tokens JWT en logout.
-- RF4: garantizar la columna token_recuperacion_expiracion (expiracion de 5 min)
--      en usuarios (idempotente: no falla si ya existe en commercy_v2).
-- ============================================================

-- 1) tokens_invalidados: token_hash = SHA-256 del JWT revocado en logout.
CREATE TABLE IF NOT EXISTS tokens_invalidados (
    token_hash CHAR(64) PRIMARY KEY,
    expira_en DATETIME NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tokens_invalidados_expiracion (expira_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) RF4: agregar token_recuperacion_expiracion si la BD remota aun no la tiene.
SET @columna_existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'usuarios'
      AND COLUMN_NAME = 'token_recuperacion_expiracion'
);
SET @ddl := IF(
    @columna_existe = 0,
    'ALTER TABLE usuarios ADD COLUMN token_recuperacion_expiracion DATETIME NULL AFTER token_recuperacion',
    'SELECT ''token_recuperacion_expiracion ya existe; nada que hacer'''
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Rollback:
-- DROP TABLE IF EXISTS tokens_invalidados;
-- ALTER TABLE usuarios DROP COLUMN token_recuperacion_expiracion;
