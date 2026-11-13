-- 021_check_stock_no_negativo.sql
-- Lote 3 (1.5.8): el stock es una invariante del negocio (nunca negativo).
-- La aplicacion ya valida antes de descontar, pero un UPDATE manual, una
-- carrera o un bug futuro podian dejarlo en negativo. La BD pasa a ser la
-- ultima linea de defensa con un CHECK.
--
-- Idempotente: solo agrega la restriccion si no existe.
-- Rollback: ALTER TABLE productos DROP CHECK chk_productos_stock_no_negativo;
--
-- Aplicar con `npm run db:migrate` SOLO en una BD local/desechable: si la tabla
-- ya tiene filas con stock negativo, el ALTER falla y hay que corregirlas antes.

SET @chk_stock := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'productos'
      AND CONSTRAINT_NAME = 'chk_productos_stock_no_negativo'
      AND CONSTRAINT_TYPE = 'CHECK'
);

SET @ddl := IF(
    @chk_stock = 0,
    'ALTER TABLE productos ADD CONSTRAINT chk_productos_stock_no_negativo CHECK (stock >= 0)',
    'SELECT ''chk_productos_stock_no_negativo ya existe; nada que hacer'' AS resultado'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificacion sugerida:
--   SELECT CONSTRAINT_NAME, CHECK_CLAUSE
--     FROM information_schema.CHECK_CONSTRAINTS
--    WHERE CONSTRAINT_SCHEMA = DATABASE()
--      AND CONSTRAINT_NAME = 'chk_productos_stock_no_negativo';
