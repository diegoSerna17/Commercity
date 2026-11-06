-- 020_indices_rendimiento.sql
-- Rendimiento (medicion 2026-11-06 con 100.000 productos):
-- el catalogo publico contaba con dos JOIN (categorias y usuarios) que no
-- aportaban nada cuando no se filtraba por sus columnas, y el COUNT recorria
-- la tabla con lookups por fila: 597 ms de p95 en local.
--
-- Este indice cubre los cuatro filtros de visibilidad y el orden por id, de
-- modo que el COUNT se resuelve como covering index (36 ms medidos) y la
-- lista puede recorrer el indice en orden inverso.
--
-- Idempotente: solo crea el indice si no existe.
-- Rollback: ALTER TABLE productos DROP INDEX idx_productos_catalogo;

SET @idx_catalogo := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'productos'
      AND INDEX_NAME = 'idx_productos_catalogo'
);

SET @ddl := IF(
    @idx_catalogo = 0,
    'ALTER TABLE productos ADD INDEX idx_productos_catalogo (eliminado_por_admin, pausado, eliminado_por_vendedor, estado, id)',
    'SELECT ''idx_productos_catalogo ya existe; nada que hacer'' AS resultado'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificacion sugerida:
--   SHOW INDEX FROM productos WHERE Key_name = 'idx_productos_catalogo';
--   EXPLAIN ANALYZE SELECT COUNT(*) FROM productos p
--    WHERE p.eliminado_por_admin = 0 AND p.eliminado_por_vendedor = 0
--      AND p.pausado = 0 AND p.estado = 'Disponible';
