-- ============================================================
-- SEED CommerCity - Inyeccion de registros de prueba
-- Base de datos por defecto: commercity_dev (schema_commercity.sql)
--
-- Uso (PowerShell):
--   Get-Content .\seed_commercity.sql -Raw | mysql -u root -p --default-character-set=utf8mb4
-- REQUISITOS: schema_commercity.sql ya aplicado en la MISMA base (commercity_dev
-- por defecto) o, en una BD preexistente, sus migraciones aplicadas con
-- backend/scripts/aplicar-migraciones.mjs.
-- RE-EJECUTABLE: vacia todas las tablas del seed y carga desde cero.
--
-- *** ADVERTENCIA: EJECUTAR SOLO EN ENTORNO DE DESARROLLO. ***
-- *** ESTE SCRIPT DESTRUYE TODOS LOS DATOS (TRUNCATE de 15 tablas). ***
--
-- GUARDA A-6 (auditoria 2026-10-11): aborta si la base objetivo es una de las
-- COMPARTIDAS (commercity_v2 / commercycity_v2 / commercy_v2) salvo que la
-- sesion declare `SET @permitir_destructivo = 1;` de forma explicita:
--   "SET @permitir_destructivo = 1;" + (Get-Content .\seed_commercity.sql -Raw) | mysql -u root -p
--
-- NOTA DE SEGURIDAD (R-1, auditoria 2026-10-11): este seed SOLO contiene hashes
-- bcrypt (uno distinto por usuario, sal aleatoria); la contrasena semilla NO
-- esta en el repositorio ni en este archivo: se solicita al lider por canal
-- privado. Para rotarla: `SEED_PASSWORD=<nueva> node backend/scripts/gen-seed-hashes.mjs`
-- (la clave solo entra por variable de entorno, nunca por argumentos, y jamas
-- se imprime).
-- NOTA DE DATOS BANCARIOS (M-DB-6): numero_cuenta y titular_nombre se guardan
-- CIFRADOS con el mismo esquema de la app (AES-256-GCM, iv:tag:dato). Se
-- regeneran con backend/scripts/gen-seed-cuentas.mjs usando la clave de
-- desarrollo (CRYPTO_SECRET_KEY, canal privado). Sin esa clave, el backend
-- muestra la cuenta como no registrada y pide re-registrarla.
-- ============================================================

CREATE DATABASE IF NOT EXISTS commercity_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE commercity_dev;

-- Guarda A-6: mismo mecanismo que schema_commercity.sql (aborta con error 1146).
SET @bd_actual := DATABASE();
SET @es_compartida := @bd_actual IN ('commercity_v2', 'commercycity_v2', 'commercy_v2');
SET @permitido := IFNULL(@permitir_destructivo, 0);
SET @sql_guarda := IF(
    @es_compartida AND @permitido <> 1,
    'SELECT 1 FROM __ABORTA_A6_BD_COMPARTIDA_SIN_PERMITIR_DESTRUCTIVO__',
    'SELECT ''Guarda A-6 OK: base de desarrollo'' AS guarda'
);
PREPARE stmt_guarda FROM @sql_guarda;
EXECUTE stmt_guarda;
DEALLOCATE PREPARE stmt_guarda;

SET NAMES utf8mb4;

-- ============================================================
-- LIMPIEZA PREVIA: el seed es re-ejecutable, resetea y carga
-- desde cero en cada ejecucion (evita "Duplicate entry")
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE reportes;
TRUNCATE TABLE notificaciones;
TRUNCATE TABLE mensajes_chat;
TRUNCATE TABLE calificaciones_vendedores;
TRUNCATE TABLE pagos_simulados;
TRUNCATE TABLE detalle_pedidos;
TRUNCATE TABLE pedidos;
TRUNCATE TABLE carrito_items;
TRUNCATE TABLE productos;
TRUNCATE TABLE categorias;
TRUNCATE TABLE datos_bancarios;
TRUNCATE TABLE seguidores;
TRUNCATE TABLE usuario_roles;
TRUNCATE TABLE usuarios;
TRUNCATE TABLE roles;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- ROLES (idempotente: ya existen si se ejecuto el schema)
-- 1 = comprador | 2 = vendedor | 3 = administrador
-- ------------------------------------------------------------
INSERT IGNORE INTO roles (id, nombre, descripcion) VALUES
(1, 'comprador', 'Rol por defecto de navegación e interacción comercial'),
(2, 'vendedor', 'Rol comercial con permisos de publicación y tracking'),
(3, 'administrador', 'Supervisor global del ecosistema CommerCity');

-- ------------------------------------------------------------
-- USUARIOS
-- ------------------------------------------------------------
INSERT INTO usuarios (id, email, password, nombre_completo, foto_perfil, descripcion_personal, direccion_envio, activo) VALUES
(1, 'carlos.munoz@commercity.com', '$2b$10$Bt3m9iSWgBmwmjeQELm.Be67qnjXP4FR2UWL5vSLbCDvUovKtlAfC', 'Administrador Carlos Muñoz', NULL, 'Administrador general de CommerCity', 'Calle 10 # 5-20, Bogotá', 1),
(2, 'juan.giraldo@commercity.com', '$2b$10$ahL85vVo6wWHdX8g9tAHtuhxBMRdA3ea4c8V0/t75olcdk.sqwZoG', 'Vendedor Juan Giraldo', NULL, 'Vendedor de calzado deportivo y moda urbana', 'Carrera 43 # 12-45, Medellín', 1),
(3, 'alex.rivera@commercity.com', '$2b$10$rgPrjpVFpDTQgIYW2dsQjeJpKLdM54XQlmMKIZYgYnPfQ0wRfsime', 'Vendedor Alex Rivera', NULL, 'Especialista en computadores y accesorios', 'Av. El Poblado # 8A-99, Medellín', 1),
(4, 'elena.sanz@commercity.com', '$2b$10$VBX72KokKsWgWktfco.NOeieEUNTm2pfVgCDTj8N3RBuxhpTKLzw.', 'Vendedora Elena Sanz', NULL, 'Tienda de electrodomésticos y hogar', 'Calle 72 # 10-34, Bogotá', 1),
(5, 'julian.thorne@commercity.com', '$2b$10$XSzcjIF6dM4bsIRdLYnDY.utyF0G.FxMiCOo6pql9u/didCtDjlky', 'Vendedor Julian Thorne', NULL, 'Celulares y tecnología de punta', 'Carrera 15 # 93-60, Bogotá', 1),
(6, 'marco.rossi@commercity.com', '$2b$10$/Jhx1kTO4bhNCRAr/zSguuA.O.XN7B7GCrCKi9V3ilO3SrkgqtDt6', 'Vendedor Marco Rossi', NULL, 'Accesorios y periféricos gaming', 'Calle 53 # 45-112, Barranquilla', 1),
(7, 'camila.torres@commercity.com', '$2b$10$s5qAhdz3g7YKrhCWKnaQgOL6KXQOQB/Z4/zbBQBGjnOEC4eGY/Az2', 'Compradora Camila Torres', NULL, 'Compradora frecuente', 'Calle 5 # 20-10, Cali', 1),
(8, 'sebastian.ruiz@commercity.com', '$2b$10$CQuLJJz8z/ODam9/Z14z6usRAv1ejXBOOPoMRiRNQXeT5l5HrrRru', 'Comprador Sebastian Ruiz', NULL, NULL, 'Carrera 21 # 40-15, Cali', 1),
(9, 'mariana.gomez@commercity.com', '$2b$10$RXx3k9McsgZymD0f1w2hkORh8O5T90XYEzN/FDZnFaYnIA8ubMBNy', 'Compradora Mariana Gomez', NULL, NULL, 'Calle 44 # 9-30, Barranquilla', 1),
(10, 'felipe.restrepo@commercity.com', '$2b$10$dUQ29oPRdWVn.ZcLygybCO0gDMp5y9GVdaOnZvBNe2k09cizPaX8m', 'Comprador Felipe Restrepo', NULL, NULL, 'Av. 30 # 22-18, Medellín', 1),
(11, 'laura.jimenez@commercity.com', '$2b$10$QsL2LgSOGoSa9OTIRMR4z.rk0eBeKSd/xpZdUekHJNgbRCBHrF4D6', 'Compradora Laura Jimenez', NULL, NULL, 'Calle 63 # 5-40, Bogotá', 1),
(12, 'daniela.perez@commercity.com', '$2b$10$3.6QuGFPeV1ek87Eet0uC.Yo5D6goWAhbf9ntddsjJtb5x2qKhdNK', 'Compradora Daniela Perez', NULL, NULL, 'Carrera 80 # 30-11, Bogotá', 1),
(13, 'andres.bedoya@commercity.com', '$2b$10$JZZzMDjQOdQ.eHhiWr4bNej3GUaecxf/UoMQlBOIvv57FHcwsQs/u', 'Vendedor Andres Bedoya', NULL, 'Vendedor de tecnología y accesorios', 'Calle 33 # 14-70, Medellín', 1),
(14, 'paula.castano@commercity.com', '$2b$10$N3N4zB2b4HJimIq.c071w.zXp9tJh6Jcnj/5D/t/NiHCaCK5lgEOe', 'Vendedora Paula Castaño', NULL, 'Vendedora de moda y accesorios', 'Carrera 13 # 67-80, Bogotá', 1),
(15, 'tomas.herrera@commercity.com', '$2b$10$PRekDvNlS6Bv6ReNykBbHeaYWKKQRcRX1EgQq3m/iviT3L9JRhETm', 'Vendedor Tomas Herrera', NULL, 'Vendedor de juguetes y juegos de mesa', 'Calle 52 # 18-40, Bucaramanga', 1),
(16, 'isabela.quintero@commercity.com', '$2b$10$cqF9h4qcZog9VU2EQuRbM.PqbEJhLHflRtTD3qMn2l1xCpkfZV2wq', 'Vendedora Isabela Quintero', NULL, 'Belleza y productos de cuidado personal', 'Av. Ciudad de Cali # 25-10, Cali', 1),
(17, 'santiago.velez@commercity.com', '$2b$10$Gwf8zP3s.pVoWxQcvgpPWOcPStgfcCSz9sBFohkOXwcJod6ueDVb2', 'Vendedor Santiago Velez', NULL, 'Vendedor de mascotas y accesorios', 'Calle 29 # 31-20, Barranquilla', 1),
(18, 'esteban.cardenas@commercity.com', '$2b$10$zlMph3WYD8rMf0Kba7VrVODZ8Jhosv28RhcM5F.ghQoDk9DjK6HXy', 'Comprador Esteban Cardenas', NULL, NULL, 'Carrera 70 # 45-12, Medellín', 1),
(19, 'natalia.vargas@commercity.com', '$2b$10$0jetlgKzeCE1ugpHDxO1Ku2bP5RexS2jqMurSRX8LwnKeHtP.a1V2', 'Compradora Natalia Vargas', NULL, NULL, 'Calle 93 # 15-33, Bogotá', 1),
(20, 'valeria.rios@commercity.com', '$2b$10$8VjsmPq99blDj6HSTsa2buro3q6sP82.Tq/bohmGq9YdKExAieRCm', 'Compradora Valeria Rios', NULL, NULL, 'Av. 6N # 22-40, Cali', 1);

-- ------------------------------------------------------------
-- USUARIO - ROLES
-- ------------------------------------------------------------
INSERT INTO usuario_roles (usuario_id, rol_id) VALUES
(1, 1), (1, 2), (1, 3),        -- admin con todos los roles
(2, 2), (3, 2), (4, 2), (5, 2), (6, 2),  -- vendedores
(7, 1), (8, 1), (9, 1), (10, 1), (11, 1), (12, 1),  -- compradores
(13, 2), (14, 2),            -- ex-administradores ahora vendedores
(15, 2), (16, 2), (17, 2),    -- vendedores nuevos
(18, 1), (19, 1), (20, 1);    -- compradores nuevos

-- ------------------------------------------------------------
-- SEGUIDORES (sin auto-seguimiento)
-- ------------------------------------------------------------
INSERT INTO seguidores (seguidor_id, seguido_id) VALUES
(7, 2), (8, 2), (9, 2), (10, 2), (11, 2), (12, 2),
(7, 3), (9, 3), (11, 3),
(8, 4), (10, 4), (12, 4),
(7, 5), (9, 5),
(8, 6), (11, 6),
(18, 2), (19, 2), (20, 2),
(18, 15), (19, 15),
(18, 16), (20, 16),
(19, 17), (20, 17);

-- ------------------------------------------------------------
-- DATOS BANCARIOS (uno por vendedor + cuenta commercy)
-- M-DB-6: titular_nombre y numero_cuenta van CIFRADOS (iv:tag:dato); se
-- regeneran con backend/scripts/gen-seed-cuentas.mjs y la clave de desarrollo.
-- ------------------------------------------------------------
INSERT INTO datos_bancarios (usuario_id, banco, titular_nombre, tipo_cuenta, numero_cuenta, es_commercity) VALUES
(1, 'Bancolombia', 'sk1Ebde8fXyolJ4n:p_BaRiKNi2BqPNs0m4Su3w:LsJFIjCCbh0ErZEVnT0', 'ahorros', 'R5sLWA4sdVzTgCDm:7DC4_JAij0gxXu4z7RkevA:1As9uEdjR0kfdg', 1),
(2, 'Davivienda', 'ASQ0A_lMANYjDcKN:Y2mOGR8KVC471bQGFtD6Bw:QXrVS3PHRiyF1UE_', 'corriente', 'va258Jl2uRLgn27Q:a98zzYFam5t22aXsnqs6wQ:XbxQzbbLR08FIQ', 0),
(3, 'Banco de Bogotá', 'wkcG7NXuAw4uj__T:RTrnqP8utP2pmhHvfiyOGA:4pHw-CV5o0B7n-0', 'ahorros', 't3ZOHWCUjBPVjqPu:OI9hFip8TaGhyOrsn3tx_Q:wm3WvL_wJxpXZQ', 0),
(4, 'Nequi', 'X0rj3XYA9FYKe01m:i3nY2ivnN2Jpezf93uv82A:XIxFUDGT280p2g', 'corriente', 'RulnOgH8xlcQ9Gg4:aljj8OdZq_SNGsmXLQPcCQ:j2TnAGZbNwvT_w', 0),
(5, 'DaviPlata', 'Y3Vn2H3hg6yVxuum:mEhBTaTfZNXDZCwMGWWmMQ:XfRDyFZOF2i8yhNWuA', 'ahorros', 'LHlWqzEng2jD81Jw:79szBEc3eBNuYy2n383JgA:YUpgPxgmhEOFQA', 0),
(6, 'Bancolombia', 'YimFqB5xzpWyknU5:MUOSbeQat2ewE5hRwCsf6A:Gdxd6xjVRUwD8z0', 'corriente', 'ANFdFeEC0R_-mRoT:yfDsqM4yikoRGR2SczMciA:NBOVo0Zb4iibmQ', 0);

-- ------------------------------------------------------------
-- CATEGORIAS (con subcategorias)
-- ------------------------------------------------------------
INSERT INTO categorias (id, nombre, descripcion, categoria_padre_id, activo) VALUES
(1, 'Tecnología', 'Productos tecnológicos en general', NULL, 1),
(2, 'Calzado', 'Zapatos, botas y sandalias', NULL, 1),
(3, 'Hogar', 'Artículos para el hogar', NULL, 1),
(4, 'Moda', 'Ropa y accesorios', NULL, 1),
(5, 'Deportes', 'Artículos deportivos', NULL, 1),
(6, 'Computación', 'Computadores y periféricos', 1, 1),
(7, 'Celulares', 'Smartphones y accesorios móviles', 1, 1),
(8, 'Electrodomésticos', 'Electrodomésticos de línea blanca', 3, 1),
(9, 'Belleza', 'Maquillaje, perfumería y cuidado personal', NULL, 1),
(10, 'Mascotas', 'Alimentos, juguetes y accesorios para mascotas', NULL, 1),
(11, 'Juguetes', 'Juguetes y juegos de mesa', NULL, 1),
(12, 'Libros y Papelería', 'Libros, cuadernos y útiles escolares', NULL, 1),
(13, 'Salud y Bienestar', 'Vitaminas, equipos y bienestar', NULL, 1),
(14, 'Ferretería', 'Herramientas y materiales de construcción', NULL, 1),
(15, 'Audio', 'Audífonos, parlantes y equipos de sonido', 1, 1),
(16, 'Videojuegos', 'Consolas, videojuegos y accesorios', 1, 1);

-- ------------------------------------------------------------
-- (Las tablas muertas etiquetas/producto_etiquetas se retiraron del esquema
--  y del seed el 2026-10-11: TASK-7.6/TASK-7.7. No hay INSERT de etiquetas.)
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- PRODUCTOS (la columna estado es GENERADA -> no se inserta)
-- ------------------------------------------------------------
INSERT INTO productos (id, vendedor_id, categoria_id, nombre, descripcion, imagen_url, precio, stock, descuento_porcentaje) VALUES
(1, 3, 6, 'MacBook Air M2', 'Laptop ultraliviana con chip M2, 8GB RAM y 256GB SSD', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop', 1299000.00, 12, 0.00),
(2, 4, 8, 'TV LG 45 pulgadas', 'Televisor 4K UHD Smart TV 45 pulgadas', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&h=300&fit=crop', 950000.00, 8, 0.00),
(3, 5, 7, 'iPhone 15 Pro', 'Smartphone Apple 128GB titanio natural', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&h=300&fit=crop', 3000000.00, 10, 0.00),
(4, 6, 6, 'iPad Pro 11"', 'Tablet Apple con chip M2, 128GB y lápiz compatible', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop', 2799000.00, 7, 0.00),
(5, 2, 2, 'Zapatos Deportivos', 'Tenis deportivos ligeros para entrenamiento diario', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop', 79000.00, 50, 5.00),
(6, 2, 2, 'Botas Urbanas', 'Botas de cuero sintético estilo urbano', 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=300&h=300&fit=crop', 145000.00, 30, 10.00),
(7, 3, 5, 'Balón de Fútbol Profesional', 'Balón talla 5 con costuras reforzadas', 'https://images.unsplash.com/photo-1614632537190-23e4146777db?w=300&h=300&fit=crop', 85000.00, 40, 0.00),
(8, 3, 5, 'Bicicleta Montañera', 'Bicicleta de montaña 21 velocidades aro 29', 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=300&h=300&fit=crop', 1850000.00, 5, 0.00),
(9, 4, 8, 'Nevera No Frost 300L', 'Nevera eficiencia A+ con dispensador de agua', 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=300&h=300&fit=crop', 2150000.00, 4, 3.00),
(10, 4, 8, 'Licuadora Industrial', 'Licuadora 1200W con vaso de vidrio 2L', 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=300&h=300&fit=crop', 210000.00, 25, 8.00),
(11, 5, 7, 'Samsung Galaxy S24', 'Smartphone Android 256GB con IA integrada', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&h=300&fit=crop', 2650000.00, 9, 5.00),
(12, 5, 6, 'Teclado Mecánico RGB', 'Teclado mecánico switch rojo retroiluminado', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop', 320000.00, 60, 0.00),
(13, 6, 6, 'Mouse Inalámbrico', 'Mouse ergonómico 2.4GHz silencioso', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop', 95000.00, 80, 0.00),
(14, 6, 6, 'Monitor 27" 4K', 'Monitor UHD 4K 60Hz panel IPS', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=300&fit=crop', 1200000.00, 15, 0.00),
(15, 2, 4, 'Chaqueta Deportiva', 'Chaqueta impermeable con capucha desmontable', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop', 180000.00, 20, 15.00),
(16, 2, 4, 'Gorra Clásica', 'Gorra de algodón con ajuste trasero', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&h=300&fit=crop', 45000.00, 100, 0.00),
(17, 4, 3, 'Juego de Ollas Antihierro', 'Set de 5 ollas con tapa de vidrio templado', 'https://images.unsplash.com/photo-1584990347449-a1a4a5d3d3d3?w=300&h=300&fit=crop', 350000.00, 12, 5.00),
(18, 5, 3, 'Lámpara LED de Escritorio', 'Lámpara con luz regulable y puerto USB', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300&h=300&fit=crop', 120000.00, 35, 0.00),
(19, 3, 2, 'Sandalias Verano', 'Sandalias de playa con suela antideslizante', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=300&fit=crop', 69000.00, 45, 10.00),
(20, 6, 1, 'Audífonos Bluetooth Pro', 'Audífonos over-ear con cancelación de ruido', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop', 199000.00, 28, 0.00),
(21, 2, 2, 'Zapatillas Edición Limitada', 'Edición limitada agotada para probar el estado Agotado', 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=300&h=300&fit=crop', 320000.00, 0, 0.00),
(22, 5, 1, 'Smartwatch Fit Pro', 'Reloj inteligente con GPS y monitoreo de salud', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop', 450000.00, 18, 0.00),
(23, 3, 1, 'Cámara Digital Canon EOS', 'Cámara réflex con lente 18-55mm', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=300&fit=crop', 2400000.00, 6, 0.00),
(24, 6, 1, 'Router WiFi 6 Dual Band', 'Router de alta velocidad para el hogar', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=300&h=300&fit=crop', 210000.00, 22, 0.00),
(25, 6, 1, 'Batería Externa 20000mAh', 'Carga rápida para celulares y tablets', 'https://images.unsplash.com/photo-1609592806590-1b0d74aee2ea?w=300&h=300&fit=crop', 115000.00, 40, 10.00),
(26, 5, 1, 'Cargador Inalámbrico 15W', 'Base de carga rápida universal', 'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=300&h=300&fit=crop', 85000.00, 55, 0.00),
(27, 2, 2, 'Tenis Urbanos Retro', 'Tenis clásicos de lona con suela de goma', 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300&h=300&fit=crop', 110000.00, 35, 0.00),
(28, 2, 2, 'Zapatos de Vestir', 'Zapatos formales de cuero para oficina', 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=300&h=300&fit=crop', 165000.00, 14, 5.00),
(29, 4, 3, 'Juego de Sábanas King', 'Set de sábanas suaves 200 hilos', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=300&h=300&fit=crop', 130000.00, 25, 0.00),
(30, 4, 3, 'Cortinas Blackout', 'Cortinas opacas con riel incluido', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&h=300&fit=crop', 98000.00, 30, 0.00),
(31, 4, 3, 'Set de Toallas Premium', 'Pack de 4 toallas de baño absorbentes', 'https://images.unsplash.com/photo-1583845112203-29329902332e?w=300&h=300&fit=crop', 76000.00, 48, 8.00),
(32, 2, 4, 'Camiseta Básica Algodón', 'Camiseta de algodón premium tallas S-M-L', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop', 42000.00, 90, 0.00),
(33, 2, 4, 'Jeans Slim Fit', 'Jean elástico corte slim talle medio', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop', 125000.00, 42, 12.00),
(34, 2, 4, 'Bufanda de Lana', 'Bufanda tejida unisex invierno', 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=300&h=300&fit=crop', 55000.00, 33, 0.00),
(35, 3, 5, 'Mancuernas 10kg Pack', 'Par de mancuernas con recubrimiento de goma', 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=300&h=300&fit=crop', 140000.00, 20, 0.00),
(36, 3, 5, 'Yoga Mat Profesional', 'Colchoneta antideslizante con correa', 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=300&h=300&fit=crop', 88000.00, 38, 0.00),
(37, 3, 5, 'Guantes de Boxeo', 'Guantes de boxeo con muñequera reforzada', 'https://images.unsplash.com/photo-1517438322307-e67111335449?w=300&h=300&fit=crop', 135000.00, 16, 0.00),
(38, 5, 7, 'Xiaomi Redmi Note 13', 'Smartphone Android 128GB pantalla AMOLED', 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=300&h=300&fit=crop', 950000.00, 25, 0.00),
(39, 5, 7, 'Huawei Pura 70', 'Smartphone con cámara de 50MP y 256GB', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop', 1750000.00, 12, 5.00),
(40, 5, 7, 'Funda Protectora iPhone', 'Funda silicona antigolpes con borde reforzado', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop', 35000.00, 120, 0.00),
(41, 4, 8, 'Horno Microondas 25L', 'Microondas digital con grill y 8 programas', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=300&h=300&fit=crop', 420000.00, 10, 0.00),
(42, 4, 8, 'Aspiradora Vertical', 'Aspiradora inalámbrica con batería 60min', 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=300&h=300&fit=crop', 680000.00, 9, 7.00),
(43, 16, 9, 'Set de Maquillaje Completo', 'Kit de maquillaje con 24 sombras y brochas', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&h=300&fit=crop', 98000.00, 60, 0.00),
(44, 16, 9, 'Perfume Essence 100ml', 'Perfume floral duradero de 12 horas', 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop', 165000.00, 32, 10.00),
(45, 16, 9, 'Crema Facial Hidratante', 'Crema con ácido hialurónico 50ml', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=300&fit=crop', 62000.00, 70, 0.00),
(46, 16, 9, 'Kit de Manicure Profesional', 'Set de 12 piezas para cuidado de uñas', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop', 58000.00, 45, 0.00),
(47, 16, 9, 'Secador de Cabello Profesional', 'Secador 2200W con difusor y 3 temperaturas', 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=300&h=300&fit=crop', 175000.00, 22, 0.00),
(48, 17, 10, 'Croquetas Perro Adulto 10kg', 'Alimento balanceado sabor pollo', 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=300&h=300&fit=crop', 145000.00, 28, 0.00),
(49, 17, 10, 'Cama para Mascotas Grande', 'Cama ortopédica lavable para perros', 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=300&h=300&fit=crop', 110000.00, 26, 5.00),
(50, 17, 10, 'Arenero para Gatos', 'Caja sanitaria con pala y filtro de olor', 'https://images.unsplash.com/photo-1568871391726-712c0cb604d0?w=300&h=300&fit=crop', 75000.00, 34, 0.00),
(51, 17, 10, 'Juguete Mordedor Perro', 'Hueso de caucho resistente y rellenable', 'https://images.unsplash.com/photo-1563409238963-e6d8ea91418d?w=300&h=300&fit=crop', 28000.00, 85, 0.00),
(52, 17, 10, 'Correa Reflectiva 1.5m', 'Correa resistente con arnés ajustable', 'https://images.unsplash.com/photo-1553799282-2e6e48a3c5f8?w=300&h=300&fit=crop', 32000.00, 50, 0.00),
(53, 15, 11, 'Robot Educativo Programable', 'Robot para aprender a programar con bloques', 'https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?w=300&h=300&fit=crop', 190000.00, 15, 0.00),
(54, 15, 11, 'Set de Bloques 500 piezas', 'Bloques de construcción compatible con clásicos', 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=300&h=300&fit=crop', 135000.00, 24, 0.00),
(55, 15, 11, 'Muñeca Interactiva', 'Muñeca que habla y canta 100 frases', 'https://images.unsplash.com/photo-1558556249-0762a4c5b81c?w=300&h=300&fit=crop', 89000.00, 30, 0.00),
(56, 15, 11, 'Juego de Mesa Monopoly', 'Edición clásica familiar con tarjetas bancarias', 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=300&h=300&fit=crop', 75000.00, 40, 0.00),
(57, 15, 11, 'Carro a Control Remoto', 'Carro todoterreno 4x4 con batería recargable', 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=300&h=300&fit=crop', 120000.00, 18, 15.00),
(58, 3, 12, 'Novela Cien Años de Soledad', 'Obra maestra de Gabriel García Márquez, edición de lujo', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=300&fit=crop', 65000.00, 55, 0.00),
(59, 3, 12, 'Cuaderno Universitario', 'Cuaderno de 100 hojas rayado tapa dura', 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300&h=300&fit=crop', 14000.00, 200, 0.00),
(60, 3, 12, 'Kit de Acuarelas 24 colores', 'Acuarelas profesionales con pinceles', 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&h=300&fit=crop', 48000.00, 65, 0.00),
(61, 15, 12, 'Mochila Escolar Antiagua', 'Mochila con compartimento para portátil 15.6', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop', 95000.00, 36, 0.00),
(62, 15, 12, 'Agendas 2027', 'Agenda semanal con separadores de colores', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&h=300&fit=crop', 38000.00, 70, 0.00),
(63, 16, 13, 'Termómetro Digital', 'Termómetro infrarrojo sin contacto', 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=300&h=300&fit=crop', 45000.00, 60, 0.00),
(64, 16, 13, 'Tensiómetro de Brazo', 'Monitor de presión arterial con memoria', 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=300&h=300&fit=crop', 95000.00, 28, 0.00),
(65, 16, 13, 'Multivitamínico 60 cápsulas', 'Complejo vitamínico para adultos', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop', 55000.00, 80, 0.00),
(66, 16, 13, 'Almohada Ortopédica', 'Almohada cervical viscoelástica', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300&h=300&fit=crop', 85000.00, 44, 0.00),
(67, 16, 13, 'Masajeador Cervical', 'Masajeador eléctrico con calor infrarrojo', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=300&fit=crop', 99000.00, 31, 10.00),
(68, 4, 14, 'Taladro Inalámbrico 20V', 'Taladro percutor con batería y cargador', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=300&fit=crop', 320000.00, 12, 0.00),
(69, 4, 14, 'Juego de Destornilladores 32 piezas', 'Set de precisión con estuche magnético', 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=300&h=300&fit=crop', 68000.00, 46, 0.00),
(70, 4, 14, 'Martillo de Seguridad', 'Martillo con mango de fibra de vidrio', 'https://images.unsplash.com/photo-1517120026326-db8c35d2a0d0?w=300&h=300&fit=crop', 42000.00, 52, 0.00),
(71, 4, 14, 'Cinta Métrica 5m', 'Flexómetro con bloqueo y clip de cinturón', 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=300&h=300&fit=crop', 18000.00, 130, 0.00),
(72, 4, 14, 'Lámpara de Trabajo LED', 'Lámpara recargable 2000 lúmenes con gancho', 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=300&h=300&fit=crop', 78000.00, 38, 0.00),
(73, 6, 15, 'Parlante Bluetooth Portátil', 'Parlante 30W resistente al agua IPX7', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop', 155000.00, 33, 0.00),
(74, 5, 15, 'Audífonos Inalámbricos Sport', 'Earbuds con cancelación de ruido y estuche', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=300&fit=crop', 135000.00, 47, 20.00),
(75, 5, 15, 'Micrófono de Condensador', 'Micrófono USB para streaming y podcast', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&h=300&fit=crop', 220000.00, 19, 0.00),
(76, 4, 15, 'Soundbar 2.1 con Subwoofer', 'Barra de sonido 200W con Bluetooth', 'https://images.unsplash.com/photo-1600494448919-4d53d29f3b8c?w=300&h=300&fit=crop', 550000.00, 11, 0.00),
(77, 5, 15, 'Tornamesa Vintage', 'Tocadiscos de vinilo con parlantes integrados', 'https://images.unsplash.com/photo-1600848507298-975a43a9b2ed?w=300&h=300&fit=crop', 780000.00, 5, 0.00),
(78, 6, 16, 'Consola PS5 Slim', 'Consola de videojuegos 1TB con control DualSense', 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300&h=300&fit=crop', 2850000.00, 8, 0.00),
(79, 6, 16, 'Control Inalámbrico Pro', 'Control compatible con PC y consolas', 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=300&h=300&fit=crop', 210000.00, 26, 0.00),
(80, 6, 16, 'Videojuego FIFA 2027', 'Última entrega del simulador de fútbol', 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&h=300&fit=crop', 240000.00, 58, 0.00),
(81, 6, 16, 'Silla Gamer Ergonomica', 'Silla reclinable 180° con soporte lumbar', 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=300&h=300&fit=crop', 850000.00, 7, 5.00),
(82, 6, 16, 'Tarjeta de Regalo PSN 50USD', 'Saldo digital para la tienda PlayStation', 'https://images.unsplash.com/photo-1616553926536-07a9b46dd729?w=300&h=300&fit=crop', 235000.00, 100, 0.00);

-- ------------------------------------------------------------
-- CARRITO (se deja vacio: se llena cuando el comprador agrega
-- productos desde la tienda)
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- PEDIDOS
-- ------------------------------------------------------------

INSERT INTO pedidos (id, comprador_id, direccion_envio, total_neto) VALUES
(1, 7, 'Calle 5 # 20-10, Cali', 1091596.64),
(2, 8, 'Carrera 21 # 40-15, Cali', 2680672.27),
(3, 9, 'Calle 44 # 9-30, Barranquilla', 798319.33),
(4, 10, 'Av. 30 # 22-18, Medellín', 2352100.84),
(5, 11, 'Calle 63 # 5-40, Bogotá', 126134.45),
(6, 12, 'Carrera 80 # 30-11, Bogotá', 128571.43),
(7, 7, 'Calle 5 # 20-10, Cali', 2115546.22),
(8, 9, 'Calle 44 # 9-30, Barranquilla', 411764.70);

-- ------------------------------------------------------------
-- DETALLE PEDIDOS
-- S2/RF140: subtotal SIN IVA y montos 90/10 calculados por el backend,
-- identico a lo que confirmarPago graba (precio_unitario_historico ya lleva
-- el descuento aplicado; el IVA nunca se persiste).
-- M-DB-6 (TASK-7.6): estados coherentes con el flujo real. confirmarPago crea
-- las lineas en 'Pendiente' + 'Pendiente'; el vendedor avanza 'En camino' y
-- 'Entregado' (con desembolso). Los pedidos con pago Aprobado avanzan; los
-- pedidos recien pagados (5, 7) quedan Pendientes como en la vida real.
-- ------------------------------------------------------------
INSERT INTO detalle_pedidos (pedido_id, producto_id, vendedor_id, cantidad, precio_unitario_historico, descuento_aplicado, subtotal, monto_vendedor, monto_comision, estado_envio, estado_pago_vendedor, fecha_desembolso) VALUES
(1, 1, 3, 1, 1299000.00, 0.00, 1091596.64, 982436.98, 109159.66, 'Entregado', 'Desembolsado', NOW() - INTERVAL 5 DAY),
(2, 3, 5, 1, 3000000.00, 0.00, 2521008.40, 2268907.56, 252100.84, 'Entregado', 'Desembolsado', NOW() - INTERVAL 4 DAY),
(2, 13, 6, 2, 95000.00, 0.00, 159663.87, 143697.48, 15966.39, 'Entregado', 'Desembolsado', NOW() - INTERVAL 4 DAY),
(3, 2, 4, 1, 950000.00, 0.00, 798319.33, 718487.40, 79831.93, 'En camino', 'Pendiente', NULL),
(4, 4, 6, 1, 2799000.00, 0.00, 2352100.84, 2116890.76, 235210.08, 'Entregado', 'Desembolsado', NOW() - INTERVAL 3 DAY),
(5, 5, 2, 2, 75050.00, 5.00, 126134.45, 113521.01, 12613.45, 'Pendiente', 'Pendiente', NULL),
(6, 15, 2, 1, 153000.00, 15.00, 128571.43, 115714.29, 12857.14, 'En camino', 'Pendiente', NULL),
(7, 11, 5, 1, 2517500.00, 5.00, 2115546.22, 1903991.60, 211554.62, 'Pendiente', 'Pendiente', NULL),
(8, 7, 3, 2, 85000.00, 0.00, 142857.14, 128571.43, 14285.71, 'Entregado', 'Desembolsado', NOW() - INTERVAL 2 DAY),
(8, 12, 5, 1, 320000.00, 0.00, 268907.56, 242016.80, 26890.76, 'Entregado', 'Desembolsado', NOW() - INTERVAL 2 DAY);

-- ------------------------------------------------------------
-- PAGOS SIMULADOS (uno por pedido, referencia unica)
-- monto = lo que pago el comprador (CON IVA); monto_reembolsado (mig 013).
-- M-DB-6: todos 'Aprobado' porque confirmarPago solo registra ese estado al
-- aceptar la pasarela (los 'Pendiente' con stock ya descontado eran incoherentes).
-- ------------------------------------------------------------
INSERT INTO pagos_simulados (pedido_id, metodo_pago, referencia_pago, monto, monto_reembolsado, estado) VALUES
(1, 'tarjeta', 'PAG-CC-0001', 1299000.00, 0.00, 'Aprobado'),
(2, 'pse', 'PAG-CC-0002', 3190000.01, 0.00, 'Aprobado'),
(3, 'tarjeta', 'PAG-CC-0003', 950000.00, 0.00, 'Aprobado'),
(4, 'transferencia', 'PAG-CC-0004', 2799000.00, 0.00, 'Aprobado'),
(5, 'pse', 'PAG-CC-0005', 150100.00, 0.00, 'Aprobado'),
(6, 'tarjeta', 'PAG-CC-0006', 153000.00, 0.00, 'Aprobado'),
(7, 'transferencia', 'PAG-CC-0007', 2517500.00, 0.00, 'Aprobado'),
(8, 'tarjeta', 'PAG-CC-0008', 490000.00, 0.00, 'Aprobado');

-- ------------------------------------------------------------
-- CALIFICACIONES VENDEDORES (una por pedido entregado)
-- ------------------------------------------------------------
INSERT INTO calificaciones_vendedores (pedido_id, comprador_id, vendedor_id, estrellas, comentario) VALUES
(1, 7, 3, 5, 'Excelente atención y envío rapidísimo'),
(2, 8, 5, 4, 'Buen producto, empaque muy seguro'),
(4, 10, 6, 5, 'Totalmente recomendado'),
(8, 9, 3, 3, 'Todo bien, pero tardó un poco el envío');

-- ------------------------------------------------------------
-- MENSAJES CHAT (emisor <> receptor)
-- ------------------------------------------------------------
INSERT INTO mensajes_chat (emisor_id, receptor_id, mensaje, leido) VALUES
(7, 3, 'Hola Alex, ¿el MacBook Air tiene garantía?', 1),
(3, 7, 'Hola Camila, sí tiene 1 año de garantía', 1),
(8, 5, '¿Tienen el iPhone 15 Pro en color natural?', 1),
(5, 8, 'Sí, tenemos stock disponible', 0),
(9, 6, '¿Cuánto demora el envío del mouse?', 1),
(6, 9, 'Entre 2 y 4 días hábiles', 0),
(10, 4, '¿La nevera incluye instalación?', 0),
(2, 11, 'Tu pedido de zapatos ya fue despachado', 0);

-- ------------------------------------------------------------
-- NOTIFICACIONES
-- M-DB-6: url_redireccion con las rutas REALES del frontend web
-- (/history, /messages, /store): antes apuntaban a rutas inexistentes.
-- ------------------------------------------------------------
INSERT INTO notificaciones (usuario_id, tipo, descripcion, estado, url_redireccion) VALUES
(7, 'compra', 'Tu pedido #1 ha sido confirmado', 'leido', '/history'),
(7, 'pedido enviado', 'Tu pedido #1 está en camino', 'leido', '/history'),
(8, 'compra', 'Tu pedido #2 ha sido confirmado', 'leido', '/history'),
(9, 'compra', 'Tu pedido #3 ha sido confirmado', 'no leido', '/history'),
(10, 'compra', 'Tu pedido #4 ha sido confirmado', 'leido', '/history'),
(9, 'mensajes', 'Tienes un nuevo mensaje de Marco Rossi', 'no leido', '/messages'),
(8, 'mensajes', 'Tienes un nuevo mensaje de Julian Thorne', 'no leido', '/messages'),
(2, 'compra', '¡Vendiste 2 unidades de Zapatos Deportivos!', 'leido', '/store'),
(3, 'compra', '¡Vendiste 1 MacBook Air M2!', 'leido', '/store'),
(11, 'pedido enviado', 'Tu pedido #5 está pendiente de pago', 'no leido', '/history');

-- ------------------------------------------------------------
-- REPORTES (CHECK: Producto -> solo producto_id | Usuario -> solo usuario_reportado_id)
-- ------------------------------------------------------------
INSERT INTO reportes (informante_id, tipo_reporte, producto_id, usuario_reportado_id, motivo, estado_reporte, respuesta_admin, respondido_at) VALUES
(7, 'Producto', 21, NULL, 'El producto se muestra disponible pero no tiene stock', 'Resuelto', 'Gracias por el reporte, ya fue marcado como agotado', NOW()),
(8, 'Producto', 8, NULL, 'La descripción no coincide con la imagen', 'Pendiente', NULL, NULL),
(9, 'Usuario', NULL, 2, 'El vendedor no responde los mensajes', 'Pendiente', NULL, NULL),
(10, 'Usuario', NULL, 4, 'Publica productos de otro vendedor', 'Resuelto', 'Se envió advertencia al vendedor', NOW()),
(11, 'Producto', 6, NULL, 'El precio subió sin aviso', 'Pendiente', NULL, NULL),
(12, 'Usuario', NULL, 5, 'Respuestas groseras en el chat', 'Pendiente', NULL, NULL),
(8, 'Producto', 3, NULL, 'El producto llegó defectuoso', 'Resuelto', 'Se contactó al vendedor para reposición', NOW()),
(10, 'Usuario', NULL, 6, 'Vendedor no cumple con los tiempos de envío', 'Pendiente', NULL, NULL),
(12, 'Producto', 18, NULL, 'La lámpara llegó sin adaptador', 'Pendiente', NULL, NULL),
(7, 'Usuario', NULL, 3, 'Envió un mensaje inapropiado', 'Resuelto', 'Advertencia aplicada al vendedor', NOW()),
(9, 'Producto', 9, NULL, 'No especifica si incluye instalación', 'Pendiente', NULL, NULL),
(11, 'Usuario', NULL, 2, 'Publica productos falsificados', 'Pendiente', NULL, NULL),
(18, 'Producto', 10, NULL, 'La licuadora hace ruido excesivo', 'Resuelto', 'En revisión por calidad', NOW());

-- Fin del seed
