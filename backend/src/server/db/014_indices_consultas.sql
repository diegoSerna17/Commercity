-- 014_indices_consultas.sql
-- R3 (auditoria 2026-10-06): indices para las consultas mas calientes del codigo.
--
-- En InnoDB cada FK de UNA columna ya crea un indice implicito:
--   detalle_pedidos: pedido_id, producto_id, vendedor_id (uno por FK)
--   mensajes_chat:   emisor_id, receptor_id   (uno por FK)
-- Recrearlos lanza "Duplicate key name" sobre la BD real, por eso NO se
-- recrean: se agregan COMPUESTOS que las consultas del codigo aprovechan:
--   * detalle_pedidos(vendedor_id, estado_envio): historial de ventas/ingresos
--     del vendedor filtra vendedor + estado (RF119/RF120/RF121/RF123).
--   * mensajes_chat(emisor_id, receptor_id) y (receptor_id, emisor_id): listado
--     de conversaciones y conteo de no leidos sargables por direccion (RF105,
--     ver chat.controllers.js tras el fix B2/R2).
-- EJECUTAR contra la BD real (commercity_v2). Verificacion sugerida:
--   SHOW INDEX FROM detalle_pedidos; SHOW INDEX FROM mensajes_chat;
ALTER TABLE detalle_pedidos
  ADD INDEX idx_vendedor_estado (vendedor_id, estado_envio);

ALTER TABLE mensajes_chat
  ADD INDEX idx_chat_emisor (emisor_id, receptor_id);

ALTER TABLE mensajes_chat
  ADD INDEX idx_chat_receptor (receptor_id, emisor_id);

-- Rollback:
-- ALTER TABLE detalle_pedidos DROP INDEX idx_vendedor_estado;
-- ALTER TABLE mensajes_chat DROP INDEX idx_chat_emisor;
-- ALTER TABLE mensajes_chat DROP INDEX idx_chat_receptor;
