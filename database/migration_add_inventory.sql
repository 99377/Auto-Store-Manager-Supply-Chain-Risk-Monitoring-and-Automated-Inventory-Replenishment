-- Run in MySQL Workbench if your DB was created before shop inventory existed.
USE watchtower;

CREATE TABLE IF NOT EXISTS shop_settings (
    settings_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    shop_name VARCHAR(200) NOT NULL DEFAULT '',
    shop_type VARCHAR(120) NOT NULL DEFAULT '',
    auto_order_enabled BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory_products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) DEFAULT '',
    quantity DECIMAL(12,2) DEFAULT 0,
    threshold_qty DECIMAL(12,2) DEFAULT 10,
    unit VARCHAR(20) DEFAULT 'pcs',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS billing_integrations (
    integration_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    machine_name VARCHAR(150) NOT NULL DEFAULT '',
    machine_token VARCHAR(128) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- MySQL Workbench-safe conditional column adds
SET @sql = IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'unit_price'
  ),
  'SELECT 1',
  'ALTER TABLE suppliers ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number'
  ),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN phone_number VARCHAR(30) DEFAULT '''''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'address'
  ),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN address VARCHAR(255) DEFAULT '''''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'auto_order_enabled'
  ),
  'SELECT 1',
  'ALTER TABLE suppliers ADD COLUMN auto_order_enabled BOOLEAN DEFAULT TRUE'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'email'
  ),
  'SELECT 1',
  'ALTER TABLE suppliers ADD COLUMN email VARCHAR(150) DEFAULT '''''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'phone_number'
  ),
  'SELECT 1',
  'ALTER TABLE suppliers ADD COLUMN phone_number VARCHAR(30) DEFAULT '''''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shop_settings' AND COLUMN_NAME = 'auto_order_enabled'
  ),
  'SELECT 1',
  'ALTER TABLE shop_settings ADD COLUMN auto_order_enabled BOOLEAN DEFAULT TRUE'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shop_settings' AND COLUMN_NAME = 'shop_address'
  ),
  'SELECT 1',
  'ALTER TABLE shop_settings ADD COLUMN shop_address VARCHAR(255) NOT NULL DEFAULT '''''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_products' AND COLUMN_NAME = 'threshold_qty'
  ),
  'SELECT 1',
  'ALTER TABLE inventory_products ADD COLUMN threshold_qty DECIMAL(12,2) DEFAULT 10'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS supply_orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NULL,
    supplier_id INT NULL,
    product_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) DEFAULT '',
    quantity_ordered DECIMAL(12,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'pcs',
    unit_price DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'placed',
    auto_created BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES inventory_products(product_id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS supplier_product_catalog (
    catalog_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    supplier_id INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    unit_price DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE
);
