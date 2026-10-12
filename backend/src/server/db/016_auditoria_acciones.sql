-- ============================================================================
-- Migracion 016 - auditoria_acciones (M-11/M-12, TASK-4.5)
-- Auditoria PREVIEW 2026-10-11.
--
-- Registro de acciones sensibles de administracion y de dinero: baneos,
-- reactivaciones, cambios de cuenta bancaria (vendedor y plataforma),
-- resolucion/archivado de reportes y desembolsos. `detalle` es JSON y NUNCA
-- debe contener datos sensibles (numeros de cuenta, contrasenas, etc.).
--
-- Idempotente (CREATE TABLE IF NOT EXISTS) y no destructiva.
-- ============================================================================

CREATE TABLE IF NOT EXISTS auditoria_acciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    actor_id INT NULL,
    accion VARCHAR(60) NOT NULL,
    objetivo_tipo VARCHAR(30) NULL,
    objetivo_id INT NULL,
    detalle JSON NULL,
    ip VARCHAR(45) NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_auditoria_accion_fecha (accion, fecha),
    INDEX idx_auditoria_actor (actor_id)
) ENGINE=InnoDB;
