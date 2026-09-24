CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('buyer', 'vendor', 'admin') NOT NULL DEFAULT 'buyer',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  settings JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_role_active (role, active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sessions_user_expiry (user_id, expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  seller_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  category VARCHAR(100) NOT NULL,
  image VARCHAR(2048) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_products_seller (seller_id),
  INDEX idx_products_category_created (category, created_at),
  INDEX idx_products_created (created_at),
  CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_products_price CHECK (price >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('PENDING_PAYMENT', 'PAID', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING_PAYMENT',
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orders_user_created (user_id, created_at),
  INDEX idx_orders_status (status),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_orders_total CHECK (total >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  product_name VARCHAR(180) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT chk_order_items_price CHECK (unit_price >= 0),
  CONSTRAINT chk_order_items_quantity CHECK (quantity > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS return_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  reason VARCHAR(1000) NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_return_requests_order (order_id),
  INDEX idx_return_requests_user_created (user_id, created_at),
  CONSTRAINT fk_return_requests_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_return_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  reason VARCHAR(180) NOT NULL,
  status ENUM('PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reports_status_created (status, created_at),
  INDEX idx_reports_product (product_id),
  CONSTRAINT fk_reports_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (conversation_id, user_id),
  INDEX idx_conversation_participants_user (user_id, conversation_id),
  CONSTRAINT fk_conversation_participants_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversation_participants_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_messages_conversation_created (conversation_id, created_at, id),
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
