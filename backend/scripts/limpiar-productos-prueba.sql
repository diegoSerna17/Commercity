-- limpiar-productos-prueba.sql — SCRIPT MANUAL (no es una migracion).
-- Retirado de la migracion 012 el 2026-10-11 (TASK-7.3) porque el soft-delete
-- por NOMBRE no es seguro ejecutarlo automaticamente en produccion.
--
-- Proposito: ocultar (borrado logico, reversible) los productos generados por
-- los runners de pruebas E2E, para que no aparezcan en el catalogo publico.
-- Ejecutar SOLO a mano y revisando antes el SELECT de diagnostico.
--
-- Uso:
--   SELECT id, nombre FROM productos
--    WHERE eliminado_por_admin = 0
--      AND (nombre LIKE 'Zz%' OR nombre LIKE 'Producto E2E%'
--           OR nombre LIKE 'Producto Prueba%' OR nombre LIKE 'Producto de prueba%');
--   -- si la lista es la esperada:
--   SOURCE backend/scripts/limpiar-productos-prueba.sql;   -- (o pegar su contenido)

UPDATE productos
SET eliminado_por_admin = 1
WHERE eliminado_por_admin = 0
  AND (nombre LIKE 'Zz%'
       OR nombre LIKE 'Producto E2E%'
       OR nombre LIKE 'Producto Prueba%'
       OR nombre LIKE 'Producto de prueba%');

-- Verificacion:
--   SELECT COUNT(*) FROM productos WHERE eliminado_por_admin = 1;
-- Reversion puntual (por id, nunca por nombre):
--   UPDATE productos SET eliminado_por_admin = 0 WHERE id IN (<ids>);
