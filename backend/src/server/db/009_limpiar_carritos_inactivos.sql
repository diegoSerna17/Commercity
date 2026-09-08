-- 009_limpiar_carritos_inactivos.sql
-- RF109: vaciar automaticamente los carritos sin actividad por 7 dias.
-- Usa carrito_items.updated_at (M6). Requiere event_scheduler = ON.
CREATE EVENT IF NOT EXISTS limpiar_carritos_inactivos
ON SCHEDULE EVERY 1 DAY STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 2 HOUR)
ON COMPLETION PRESERVE
DO DELETE FROM carrito_items
   WHERE updated_at < NOW() - INTERVAL 7 DAY;

-- Rollback:
-- DROP EVENT IF EXISTS limpiar_carritos_inactivos;
