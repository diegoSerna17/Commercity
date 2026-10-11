-- 018_calificaciones_unique_vendedor.sql
-- M-DB-5 (auditoria 2026-10-11): `calificaciones_vendedores` tenia
-- UNIQUE (pedido_id), lo que impedia calificar a MAS de un vendedor de un
-- pedido multi-vendedor. Se sustituye por UNIQUE (pedido_id, vendedor_id):
-- cada comprador califica una vez a cada vendedor del pedido.
--
-- Idempotente (TASK-7.5): detecta por information_schema el indice unico
-- vigente sobre pedido_id (cualquiera sea su nombre) y lo elimina; crea el
-- compuesto solo si no existe. El cambio es menos restrictivo que el anterior,
-- por lo que no puede violar datos existentes.
-- EJECUTAR contra la BD real (commercity_v2) segun TASK-7.4.

SET @idx_unico_pedido := (
    SELECT s.INDEX_NAME
    FROM information_schema.STATISTICS s
    WHERE s.TABLE_SCHEMA = DATABASE()
      AND s.TABLE_NAME = 'calificaciones_vendedores'
      AND s.NON_UNIQUE = 0
      AND s.COLUMN_NAME = 'pedido_id'
      AND s.SEQ_IN_INDEX = 1
      AND s.INDEX_NAME NOT IN ('PRIMARY', 'uq_pedido_vendedor_calif')
    LIMIT 1
);
SET @ddl := IF(
    @idx_unico_pedido IS NOT NULL,
    CONCAT('ALTER TABLE calificaciones_vendedores DROP INDEX `', @idx_unico_pedido, '`'),
    'SELECT ''sin indice unico simple sobre pedido_id; nada que eliminar'' AS resultado'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_compuesto := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'calificaciones_vendedores'
      AND INDEX_NAME = 'uq_pedido_vendedor_calif'
);
SET @ddl := IF(
    @idx_compuesto = 0,
    'ALTER TABLE calificaciones_vendedores ADD UNIQUE KEY uq_pedido_vendedor_calif (pedido_id, vendedor_id)',
    'SELECT ''uq_pedido_vendedor_calif ya existe; nada que hacer'' AS resultado'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificacion sugerida:
--   SHOW INDEX FROM calificaciones_vendedores;
--   SELECT pedido_id, vendedor_id, COUNT(*) FROM calificaciones_vendedores
--    GROUP BY pedido_id, vendedor_id HAVING COUNT(*) > 1;  -- debe dar 0 filas

-- Rollback (DESTRUCTIVO: fallara si ya hay varias calificaciones por pedido):
-- ALTER TABLE calificaciones_vendedores DROP INDEX uq_pedido_vendedor_calif;
-- ALTER TABLE calificaciones_vendedores ADD UNIQUE KEY uq_pedido_calificacion_vend (pedido_id);
