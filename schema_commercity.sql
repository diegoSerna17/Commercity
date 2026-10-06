CREATE DATABASE IF NOT EXISTS commercity_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE commercity_v2;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS reportes;
DROP TABLE IF EXISTS notificaciones;
DROP TABLE IF EXISTS mensajes_chat;
DROP TABLE IF EXISTS calificaciones_productos;
DROP TABLE IF EXISTS calificaciones_vendedores;
DROP TABLE IF EXISTS pagos_simulados;
DROP TABLE IF EXISTS detalle_pedidos;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS carrito_items;
DROP TABLE IF EXISTS producto_etiquetas;
DROP TABLE IF EXISTS etiquetas;
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
) ENGINE=InnoDB;

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE usuario_roles (
    usuario_id INT NOT NULL,
    rol_id INT NOT NULL,
    PRIMARY KEY (usuario_id, rol_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE seguidores (
    seguidor_id INT NOT NULL, 
    seguido_id INT NOT NULL,  
    fecha_seguimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (seguidor_id, seguido_id),
    FOREIGN KEY (seguidor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (seguido_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_no_seguirse_a_si_mismo CHECK (seguidor_id <> seguido_id)
) ENGINE=InnoDB;

-- ==========================================
-- MÓDULO 2: FINANZAS Y CUENTAS
-- ==========================================

CREATE TABLE datos_bancarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE, 
    titular_nombre VARCHAR(100) NOT NULL,
    -- B1: el codigo (tienda/admin) lee e inserta `banco`; existia en BD real.
    banco VARCHAR(50) NOT NULL,
    tipo_cuenta VARCHAR(50) NOT NULL, 
    numero_cuenta VARCHAR(100) NOT NULL,
    es_commercity TINYINT(1) DEFAULT 0, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==========================================
-- MÓDULO 3: CATÁLOGO, PRODUCTOS Y ETIQUETAS
-- ==========================================

CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NULL,
    categoria_padre_id INT NULL, 
    activo TINYINT(1) DEFAULT 1,
    FOREIGN KEY (categoria_padre_id) REFERENCES categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE etiquetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

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
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE producto_etiquetas (
    producto_id INT NOT NULL,
    etiqueta_id INT NOT NULL,
    PRIMARY KEY (producto_id, etiqueta_id),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (etiqueta_id) REFERENCES etiquetas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comprador_id INT NOT NULL,
    direccion_envio TEXT NOT NULL, 
    total_neto DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    -- B2/RF119: sin estado_pedido a nivel pedido; el estado vive por linea
    -- en detalle_pedidos.estado_envio.
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comprador_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- RESTAURADO: Tabla específica para gestionar la simulación del pago
-- M8 (mig 008): incluye 'Reembolsado' y DEFAULT 'Pendiente' (RF74/RF135).
CREATE TABLE pagos_simulados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL UNIQUE,
    metodo_pago ENUM('tarjeta', 'transferencia', 'pse') NOT NULL,
    referencia_pago VARCHAR(100) NOT NULL UNIQUE,
    monto DECIMAL(12, 2) NOT NULL,
    estado ENUM('Aprobado', 'Rechazado', 'Pendiente', 'Reembolsado') DEFAULT 'Pendiente',
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE detalle_pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    vendedor_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario_historico DECIMAL(12, 2) NOT NULL,
    descuento_aplicado DECIMAL(5, 2) DEFAULT 0.00,
    subtotal DECIMAL(12, 2) NOT NULL,
    
    monto_vendedor DECIMAL(12, 2) AS (subtotal * 0.90) STORED, 
    monto_comision DECIMAL(12, 2) AS (subtotal * 0.10) STORED, 
    -- B1/RF119: estado por linea (el pedido no tiene estado propio).
    estado_envio ENUM('Pendiente', 'En camino', 'Entregado', 'Cancelado') NOT NULL DEFAULT 'Pendiente',
    estado_pago_vendedor ENUM('Pendiente', 'Desembolsado') NOT NULL DEFAULT 'Pendiente',
    fecha_desembolso DATETIME NULL,
    
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ==========================================
-- MÓDULO 5: REPUTACIÓN (VENDEDOR Y PRODUCTO)
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
    UNIQUE KEY uq_pedido_calificacion_vend (pedido_id) 
) ENGINE=InnoDB;

-- RESTAURADO: Tabla específica para calificar productos individualmente
CREATE TABLE calificaciones_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    comprador_id INT NOT NULL,
    producto_id INT NOT NULL,
    estrellas TINYINT NOT NULL CHECK (estrellas BETWEEN 1 AND 5), 
    comentario TEXT NULL,
    fecha_calificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (comprador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE KEY uq_pedido_producto_calif (pedido_id, producto_id)
) ENGINE=InnoDB;

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
    FOREIGN KEY (receptor_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

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
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- RESTAURADO: Tabla reportes
-- B1: evidencia_url, estado_reporte y archivado (mig 011, borrado logico).
CREATE TABLE reportes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    informante_id INT NOT NULL, 
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
    FOREIGN KEY (informante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_reportado_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_target_reporte CHECK (
        (tipo_reporte = 'Producto' AND producto_id IS NOT NULL AND usuario_reportado_id IS NULL) OR
        (tipo_reporte = 'Usuario' AND usuario_reportado_id IS NOT NULL AND producto_id IS NULL)
    )
) ENGINE=InnoDB;

-- RF2 / mig 010: lista negra de JWT revocados en logout.
CREATE TABLE IF NOT EXISTS tokens_invalidados (
    token_hash CHAR(64) PRIMARY KEY,
    expira_en DATETIME NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tokens_invalidados_expiracion (expira_en)
) ENGINE=InnoDB;

-- ==========================================
-- INSERCIÓN DE DATOS SEMILLA (SEEDERS)
-- ==========================================

INSERT INTO roles (nombre, descripcion) VALUES 
('comprador', 'Rol por defecto de navegación e interacción comercial'),
('vendedor', 'Rol comercial con permisos de publicación y tracking'),
('administrador', 'Supervisor global del ecosistema CommerCity');