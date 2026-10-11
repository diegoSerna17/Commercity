-- 000_schema_migrations.sql
-- M-DB-3 (auditoria 2026-10-11, TASK-7.4): ledger de migraciones aplicadas.
-- Lo usan `backend/scripts/aplicar-migraciones.mjs` (aplicacion ordenada con
-- checksum SHA-256) y las aplicaciones manuales para dejar registro.
-- El esquema canonico (schema_commercity.sql) ya crea esta tabla; este archivo
-- existe para que una BD preexistente sin ledger pueda incorporarse al flujo.
CREATE TABLE IF NOT EXISTS schema_migrations (
    id VARCHAR(120) PRIMARY KEY,
    aplicada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checksum CHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rollback (destructivo; normalmente NO se revierte):
-- DROP TABLE schema_migrations;
