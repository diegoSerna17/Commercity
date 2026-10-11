-- ============================================================
-- ESQUEMA CommerCity - schema_commercity.sql
-- Base de datos por defecto: commercity_dev (desarrollo local)
--
-- Uso (PowerShell):
--   Get-Content .\schema_commercity.sql -Raw | mysql -u root -p --default-character-set=utf8mb4
--
-- GUARDA A-6 (auditoria 2026-10-11): este script DROPea las tablas del esquema
-- en la base de datos objetivo. Si el objetivo es una de las bases COMPARTIDAS
-- (commercity_v2 / commercycity_v2 / commercy_v2) aborta, salvo que la sesion
-- declare la variable de forma explicita:
--   "SET @permitir_destructivo = 1;" + (Get-Content .\schema_commercity.sql -Raw) | mysql -u root -p
-- El nombre por defecto es commercity_dev: nunca apuntes este script a la BD del equipo.
--
-- DRIFT CONOCIDO con la BD compartida real (auditoria 2026-10-11, TASK-7.7):
-- la BD real conserva objetos historicos que este esquema canonico ya no crea:
--   * pedidos.estado_pedido (sin uso por el codigo; decision 2026-10-06: no migrar)
--   * detalle_pedidos.imagen_url (M4 de la auditoria 2026-08-07)
--   * producto_variantes (4 filas) y el indice FULLTEXT legado ft_nombre
--   * tablas en desuso retiradas del esquema y del seed el 2026-10-11:
--     etiquetas, producto_etiquetas y calificaciones_productos. Siguen en la BD
--     real; su DROP es opcional y requiere aprobacion (SEC-003).
--
-- EVENTOS: los dos EVENT de este esquema requieren event_scheduler = ON en el
-- servidor MySQL (ver README, seccion Base de datos).
-- ============================================================

CREATE DATABASE IF NOT EXISTS commercity_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE commercity_dev;

-- Guarda A-6: aborta (error 1146) si la BD objetivo es una base compartida y la
-- sesion no declaro @permitir_destructivo = 1. El nombre de la tabla del error
-- es el mensaje: __ABORTA_A6_BD_COMPARTIDA_SIN_PERMITIR_DESTRUCTIVO__.
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

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS schema_migrations;
DROP TABLE IF EXISTS reportes;
DROP TABLE IF EXISTS notificaciones;
DROP TABLE IF EXISTS mensajes_chat;
DROP TABLE IF EXISTS calificaciones_vendedores;
DROP TABLE IF EXISTS pagos_simulados;
DROP TABLE IF EXISTS detalle_pedidos;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS carrito_items;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS datos_bancarios;
DROP TABLE IF EXISTS seguidores;
DROP TABLE IF EXISTS usuario_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- MÓDULO 1: GESTIÓN DE USUARIOS Y ROLES
-- ==========================================

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE, 
    descripcion VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE, 
    password VARCHAR(255) NOT NULL, -- Para el hash de bcryptjs
    nombre_completo VARCHAR(100) NULL,
    foto_perfil VARCHAR(255) NULL, 
    descripcion_personal TEXT NULL, 
    direccion_envio TEXT NULL, 
    activo TINYINT(1) DEFAULT 1, 
    token_recuperacion VARCHAR(100) NULL,
    -- RF4 (mig 010): expira a los 5 minutos. Se guarda el SHA-256 (H3 P2).
    token_recuperacion_expiracion DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- RF69-RF71 (M7): busqueda global admin (MATCH nombre_completo, email).
    FULLTEXT KEY ft_usuario (nombre_completo, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuario_roles (
    usuario_id INT NOT NULL,
    rol_id INT NOT NULL,
    PRIMARY KEY (usuario_id, rol_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE seguidores (
    seguidor_id INT NOT NULL, 
    seguido_id INT NOT NULL,  
    fecha_seguimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (seguidor_id, seguido_id),
    FOREIGN KEY (seguidor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (seguido_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_no_seguirse_a_si_mismo CHECK (seguidor_id <> seguido_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- MÓDULO 2: FINANZAS Y CUENTAS
-- ==========================================

CREATE TABLE datos_bancarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE, 
    -- M-DB-1 (mig 017): titular_nombre y numero_cuenta se guardan CIFRADOS
    -- (AES-256-GCM, formato iv:tag:dato en base64url); 255 cubre el ciphertext
    -- de un nombre largo. banco se guarda en claro (100 = longitud de la BD real).
    titular_nombre VARCHAR(255) NOT NULL,
    -- B1: el codigo (tienda/admin) lee e inserta `banco`; existia en BD real.
    banco VARCHAR(100) NOT NULL,
    tipo_cuenta VARCHAR(50) NOT NULL, 
    numero_cuenta VARCHAR(100) NOT NULL,
    es_commercity TINYINT(1) DEFAULT 0, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- MÓDULO 3: CATÁLOGO Y PRODUCTOS
-- ==========================================

CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NULL,
    categoria_padre_id INT NULL, 
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (categoria_padre_id) REFERENCES categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendedor_id INT NOT NULL, 
    categoria_id INT NOT NULL, 
    nombre VARCHAR(150) NOT NULL, 
    descripcion TEXT NOT NULL, 
    imagen_url VARCHAR(255) NOT NULL, 
    precio DECIMAL(12, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0, 
    descuento_porcentaje DECIMAL(5, 2) DEFAULT 0.00, 
    estado ENUM('Disponible', 'Agotado') AS (IF(stock > 0, 'Disponible', 'Agotado')) STORED, 
    fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP, 
    eliminado_por_admin TINYINT(1) DEFAULT 0, 
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    -- RF69-RF71 (M7): busqueda global admin (MATCH nombre, descripcion).
    FULLTEXT KEY ft_productos_busqueda (nombre, descripcion),
    -- R3 (auditoria 2026-10-11, TASK-7.4): listado publico del catalogo filtra
    -- por visibles (no eliminados) + estado + orden por fecha.
    INDEX idx_productos_visibles (eliminado_por_admin, estado, fecha_publicacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- MÓDULO 4: COMPRAS Y PAGOS SIMULADOS
-- ==========================================

CREATE TABLE carrito_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comprador_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1, 
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- M6 (mig 009): updated_at para limpiar carritos inactivos (RF109).
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_comprador_producto (comprador_id, producto_id),
    FOREIGN KEY (comprador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comprador_id INT NOT NULL,
    direccion_envio TEXT NOT NULL, 
    total_neto DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    -- B2/RF119: sin estado_pedido a nivel pedido; el estado vive por linea
    -- en detalle_pedidos.estado_envio.
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comprador_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RESTAURADO: Tabla específica para gestionar la simulación del pago
-- M8 (mig 008): incluye 'Reembolsado' y DEFAULT 'Pendiente' (RF74/RF135).
CREATE TABLE pagos_simulados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL UNIQUE,
    metodo_pago ENUM('tarjeta', 'transferencia', 'pse') NOT NULL,
    referencia_pago VARCHAR(100) NOT NULL UNIQUE,
    monto DECIMAL(12, 2) NOT NULL,
    -- S1 (auditoria 2026-10-06): reembolso proporcional por monto (mig 013).
    -- El estado parcial se DERIVA (0 < monto_reembolsado < monto); 'Reembolsado'
    -- solo cuando monto_reembolsado >= monto.
    monto_reembolsado DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    estado ENUM('Aprobado', 'Rechazado', 'Pendiente', 'Reembolsado') DEFAULT 'Pendiente',
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE detalle_pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    vendedor_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario_historico DECIMAL(12, 2) NOT NULL,
    descuento_aplicado DECIMAL(5, 2) DEFAULT 0.00,
    subtotal DECIMAL(12, 2) NOT NULL,
    
    -- RF140 (CERRADO 20/08): los montos 90/10 los calcula el backend
    -- (calcularLinea, utils/finanzas.js) al aprobar el pago; columnas normales,
    -- SIN IVA, sin expresion GENERATED (la BD real ya opera con columnas normales;
    -- precedente pedidos.estado_pedido: alineacion de archivo SIN migracion).
    monto_vendedor DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    monto_comision DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    -- B1/RF119: estado por linea (el pedido no tiene estado propio).
    estado_envio ENUM('Pendiente', 'En camino', 'Entregado', 'Cancelado') NOT NULL DEFAULT 'Pendiente',
    estado_pago_vendedor ENUM('Pendiente', 'Desembolsado') NOT NULL DEFAULT 'Pendiente',
    fecha_desembolso DATETIME NULL,
    
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    -- R3 (mig 014): historial de ventas del vendedor filtra vendedor + estado.
    INDEX idx_vendedor_estado (vendedor_id, estado_envio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- MÓDULO 5: REPUTACIÓN (VENDEDOR)
-- ==========================================

CREATE TABLE calificaciones_vendedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    comprador_id INT NOT NULL,
    vendedor_id INT NOT NULL,
    estrellas TINYINT NOT NULL CHECK (estrellas BETWEEN 1 AND 5), 
    comentario TEXT NULL,
    fecha_calificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (comprador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    -- M-DB-5 (mig 018): un pedido multi-vendedor permite calificar a CADA
    -- vendedor una vez. Antes UNIQUE (pedido_id) lo impedia.
    UNIQUE KEY uq_pedido_vendedor_calif (pedido_id, vendedor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- MÓDULO 6: COMUNICACIÓN, NOTIFICACIONES Y MODERACIÓN
-- ==========================================

-- CORREGIDO: Cierre correcto de la tabla mensajes_chat
CREATE TABLE mensajes_chat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emisor_id INT NOT NULL,
    receptor_id INT NOT NULL,
    mensaje TEXT NOT NULL, 
    enviado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leido TINYINT(1) DEFAULT 0,
    FOREIGN KEY (emisor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (receptor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    -- R3 (mig 014): conversaciones y no leidos sargables por direccion (RF105).
    INDEX idx_chat_emisor (emisor_id, receptor_id),
    INDEX idx_chat_receptor (receptor_id, emisor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RESTAURADO: Tabla notificaciones
-- M1: tipo como VARCHAR(50) (el ENUM truncaba 'pedido enviado', etc.) y
-- estado sin acentos (el codigo escribe 'no leido'/'leido').
CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL, 
    tipo VARCHAR(50) NOT NULL, 
    descripcion TEXT NOT NULL, 
    estado VARCHAR(20) DEFAULT 'no leido', 
    url_redireccion VARCHAR(255) NULL, 
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    -- R3 (auditoria 2026-10-11, TASK-7.4): conteo de no leidos por usuario.
    INDEX idx_notificaciones_usuario_estado (usuario_id, estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RESTAURADO: Tabla reportes
-- B1: evidencia_url, estado_reporte y archivado (mig 011, borrado logico).
-- TASK-7.7 (auditoria 2026-10-11): los reportes son historial de moderacion y
-- NO se borran: el informante queda anonimizable (SET NULL) y los objetivos
-- (producto/usuario) se protegen con RESTRICT (no se puede borrar la entidad
-- reportada mientras exista el reporte).
CREATE TABLE reportes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    informante_id INT NULL, 
    tipo_reporte ENUM('Producto', 'Usuario') NOT NULL,
    producto_id INT NULL, 
    usuario_reportado_id INT NULL, 
    motivo TEXT NOT NULL, 
    evidencia_url VARCHAR(255) NULL,
    estado_reporte ENUM('Pendiente', 'Resuelto') NOT NULL DEFAULT 'Pendiente',
    archivado TINYINT(1) NOT NULL DEFAULT 0,
    respuesta_admin TEXT NULL, 
    respondido_at DATETIME NULL,
    fecha_reporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (informante_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_reportado_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT chk_target_reporte CHECK (
        (tipo_reporte = 'Producto' AND producto_id IS NOT NULL AND usuario_reportado_id IS NULL) OR
        (tipo_reporte = 'Usuario' AND usuario_reportado_id IS NOT NULL AND producto_id IS NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RF2 / mig 010: lista negra de JWT revocados en logout.
CREATE TABLE IF NOT EXISTS tokens_invalidados (
    token_hash CHAR(64) PRIMARY KEY,
    expira_en DATETIME NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tokens_invalidados_expiracion (expira_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- M-DB-3 (auditoria 2026-10-11, TASK-7.4): ledger de migraciones aplicadas.
-- Lo llena backend/scripts/aplicar-migraciones.mjs (id = archivo, checksum SHA-256).
CREATE TABLE IF NOT EXISTS schema_migrations (
    id VARCHAR(120) PRIMARY KEY,
    aplicada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checksum CHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- EVENTOS PROGRAMADOS (requieren event_scheduler = ON)
-- ==========================================

-- RF109: vaciar automaticamente los carritos sin actividad por 7 dias (mig 009).
CREATE EVENT IF NOT EXISTS limpiar_carritos_inactivos
ON SCHEDULE EVERY 1 DAY STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 2 HOUR)
ON COMPLETION PRESERVE
DO DELETE FROM carrito_items
   WHERE updated_at < NOW() - INTERVAL 7 DAY;

-- M-DB-4 (auditoria 2026-10-11, TASK-7.4): purga de la lista negra de JWT
-- vencidos (hoy crecia sin limite).
CREATE EVENT IF NOT EXISTS purgar_tokens_invalidados
ON SCHEDULE EVERY 1 DAY STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 3 HOUR)
ON COMPLETION PRESERVE
DO DELETE FROM tokens_invalidados
   WHERE expira_en < NOW();

-- ==========================================
-- INSERCIÓN DE DATOS SEMILLA (SEEDERS)
-- ==========================================

INSERT INTO roles (nombre, descripcion) VALUES 
('comprador', 'Rol por defecto de navegación e interacción comercial'),
('vendedor', 'Rol comercial con permisos de publicación y tracking'),
('administrador', 'Supervisor global del ecosistema CommerCity');
