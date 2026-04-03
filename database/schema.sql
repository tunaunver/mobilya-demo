CREATE DATABASE IF NOT EXISTS mobilya_demo;
USE mobilya_demo;

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id VARCHAR(50) NULL,
    img_base64 LONGTEXT NULL,
    seo_title VARCHAR(255) NULL,
    seo_description TEXT NULL,
    slug VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('simple', 'modular', 'configurator') DEFAULT 'simple',
    category_id VARCHAR(50),
    price DECIMAL(10, 2) DEFAULT 0.00,
    stock INT DEFAULT 0,
    images JSON NULL, -- Array of image URLs or Base64
    description TEXT NULL,
    is_new BOOLEAN DEFAULT FALSE,
    dimensions JSON NULL, -- Min, Max, Default for W, H, D
    colors JSON NULL, -- Array of color objects
    materials JSON NULL, -- Array of material objects
    modules JSON NULL, -- Array of module objects
    door_models JSON NULL, -- Array of door model objects
    handles JSON NULL, -- Array of handle objects
    partitions JSON NULL, -- Min, Max partitions
    pricing_rules JSON NULL, -- Pricing per CM or partition
    visual_type VARCHAR(50) NULL, -- 'wardrobe', 'shelf'
    seo_title VARCHAR(255) NULL,
    seo_description TEXT NULL,
    slug VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (category_id),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Profiles (Users) Table - Replacing Supabase Auth Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(100) PRIMARY KEY, -- Can take Supabase ID or unique string
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NULL, -- For local auth later
    full_name VARCHAR(255) NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(100),
    items JSON NOT NULL, -- Order items with config
    status VARCHAR(50) DEFAULT 'Hazırlanıyor',
    total_price DECIMAL(10, 2) DEFAULT 0.00,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (customer_id),
    FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Theme Settings Table
CREATE TABLE IF NOT EXISTS theme_settings (
    id VARCHAR(50) PRIMARY KEY, -- 'aura_theme_settings' or specific theme ID
    active_theme_id VARCHAR(50) DEFAULT 'theme-default',
    themes JSON NOT NULL, -- The entire themes array
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
