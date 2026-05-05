CREATE DATABASE IF NOT EXISTS auto_store_manager;
USE auto_store_manager;

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone_number VARCHAR(30) DEFAULT '',
    address VARCHAR(255) DEFAULT '',
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('owner', 'admin') DEFAULT 'owner',
    business_name VARCHAR(150),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    supplier_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) DEFAULT '',
    phone_number VARCHAR(30) DEFAULT '',
    location VARCHAR(200),
    district VARCHAR(100),
    state VARCHAR(100),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    product_category VARCHAR(100),
    unit_price DECIMAL(10,2) DEFAULT 0,
    auto_order_enabled BOOLEAN DEFAULT TRUE,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS raw_events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    source ENUM('newsapi','gdelt','owm') NOT NULL,
    title TEXT,
    description TEXT,
    location_raw VARCHAR(200),
    published_at DATETIME,
    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    url TEXT
);

CREATE TABLE IF NOT EXISTS classified_risks (
    risk_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    risk_category ENUM('weather','unrest','price','transport') NOT NULL,
    confidence DECIMAL(4,3),
    classifier_used ENUM('distilbert','zeroshot') DEFAULT 'zeroshot',
    classified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES raw_events(event_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS supplier_risk_scores (
    score_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    risk_score DECIMAL(5,2) DEFAULT 0.00,
    risk_level ENUM('low','medium','high') DEFAULT 'low',
    contributing_events JSON,
    scored_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    supplier_id INT NOT NULL,
    message TEXT,
    alert_type ENUM('email','inapp') DEFAULT 'inapp',
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shop_settings (
    settings_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    shop_name VARCHAR(200) NOT NULL DEFAULT '',
    shop_type VARCHAR(120) NOT NULL DEFAULT '',
    shop_address VARCHAR(255) NOT NULL DEFAULT '',
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
