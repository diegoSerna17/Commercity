-- 012_normalizar_imagenes_productos.sql
-- Proposito: dejar el catalogo con imagenes que carguen de verdad.
-- Contexto (diagnostico 2026-09-13 sobre commercity_v2):
--   * 82 productos con URL de Unsplash valida (responden 200 image/jpeg).
--   * 250 productos con URL de Unsplash SIN parametros cuyos IDs no existen
--     (responden 404 text/html; el navegador las bloquea con ERR_BLOCKED_BY_ORB).
--   * 2 productos con URL de ejemplo (https://example.com/...) y 1 con un PNG
--     de 1x1 px en /uploads.
-- Solucion: los que no funcionan se sustituyen por una imagen real y unica del
-- servicio publico picsum.photos usando el id del producto como semilla
-- (determinista, sin API key, verificado: GET 200 image/jpeg).
-- Aplicar: como usuario con permisos de escritura sobre la base de datos.

-- 1) Respaldo para rollback (solo id + imagen_url; no modifica datos).
CREATE TABLE IF NOT EXISTS productos_imagenes_bkp_20260913 AS
SELECT id, imagen_url FROM productos;

-- 2) Normalizar las imagenes rotas o basura.
UPDATE productos
SET imagen_url = CONCAT('https://picsum.photos/seed/commercity-', id, '/900/900')
WHERE imagen_url IS NULL
   OR TRIM(imagen_url) = ''
   OR imagen_url LIKE 'https://example.com/%'
   OR imagen_url LIKE '%/uploads/%'
   OR (imagen_url LIKE 'https://images.unsplash.com/%' AND imagen_url NOT LIKE '%?%');

-- 3) Verificacion: deben quedar 0 filas con imagen invalida.
SELECT
  SUM(CASE WHEN imagen_url IS NULL OR TRIM(imagen_url) = '' THEN 1 ELSE 0 END) AS sin_imagen,
  SUM(CASE WHEN imagen_url LIKE 'https://example.com/%' THEN 1 ELSE 0 END) AS example_com,
  SUM(CASE WHEN imagen_url LIKE '%/uploads/%' THEN 1 ELSE 0 END) AS uploads_local,
  SUM(CASE WHEN imagen_url LIKE 'https://images.unsplash.com/%' AND imagen_url NOT LIKE '%?%' THEN 1 ELSE 0 END) AS unsplash_rotas,
  SUM(CASE WHEN imagen_url LIKE 'https://picsum.photos/%' THEN 1 ELSE 0 END) AS picsum_nuevas
FROM productos;

-- ROLLBACK (si se requiere revertir):
--   UPDATE productos p JOIN productos_imagenes_bkp_20260913 b ON b.id = p.id
--     SET p.imagen_url = b.imagen_url;
--   DROP TABLE productos_imagenes_bkp_20260913;
