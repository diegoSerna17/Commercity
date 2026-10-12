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
--
-- Correccion (2026-10-12): la FK `calificaciones_vendedores_ibfk_1`
-- (pedido_id -> pedidos.id, ON DELETE CASCADE) esta respaldada por el indice
-- unico simple, por lo que MySQL rechaza el DROP INDEX. Orden correcto:
--   1) crear el indice compuesto (cubre la FK por su prefijo pedido_id),
--   2) dropear la FK,
--   3) dropear el indice unico simple,
--   4) re-agregar la FK.

-- 1) Indice compuesto solo si no existe
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

-- 2) Localizar el indice unico simple vigente sobre pedido_id (si existe)
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

-- 3) Localizar la FK sobre pedido_id respaldada por ese indice (si hay)
SET @fk_pedido := (
    SELECT k.CONSTRAINT_NAME
    FROM information_schema.KEY_COLUMN_USAGE k
    WHERE k.TABLE_SCHEMA = DATABASE()
      AND k.TABLE_NAME = 'calificaciones_vendedores'
      AND k.COLUMN_NAME = 'pedido_id'
      AND k.REFERENCED_TABLE_NAME = 'pedidos'
    LIMIT 1
);

-- 4) Si el indice simple existe, dropear primero la FK que lo usa
SET @ddl := IF(
    @idx_unico_pedido IS NOT NULL AND @fk_pedido IS NOT NULL,
    CONCAT('ALTER TABLE calificaciones_vendedores DROP FOREIGN KEY `', @fk_pedido, '`'),
    'SELECT ''sin FK que dropear sobre el indice simple'' AS resultado'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5) Dropear el indice unico simple (ya sin FK que lo respalde)
SET @ddl := IF(
    @idx_unico_pedido IS NOT NULL,
    CONCAT('ALTER TABLE calificaciones_vendedores DROP INDEX `', @idx_unico_pedido, '`'),
    'SELECT ''sin indice unico simple sobre pedido_id; nada que eliminar'' AS resultado'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6) Re-agregar la FK solo si la dropeamos en este mismo pase
SET @reagregar_fk := @idx_unico_pedido IS NOT NULL AND @fk_pedido IS NOT NULL;
SET @ddl := IF(
    @reagregar_fk = 1,
    CONCAT('ALTER TABLE calificaciones_vendedores ADD CONSTRAINT `', @fk_pedido,
           '` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE'),
    'SELECT ''FK no tocada; nada que re-agregar'' AS resultado'
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
