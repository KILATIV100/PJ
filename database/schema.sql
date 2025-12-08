-- Pro Jet Database Schema
-- PostgreSQL Database для Railway/Neon

-- ============================================
-- ORDERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE NOT NULL,

  -- Контактна інформація клієнта
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_company VARCHAR(255),
  customer_address TEXT,
  customer_city VARCHAR(100),

  -- Тип послуги
  service VARCHAR(50) NOT NULL CHECK (service IN ('engraving', 'cutting', 'design', 'shop', 'consultation')),

  -- Параметри гравіювання (JSON)
  engraving_data JSONB,

  -- Параметри різання (JSON)
  cutting_data JSONB,

  -- Дизайн послуга (JSON)
  design_data JSONB,

  -- Товари з магазину (JSON array)
  shop_items JSONB,

  -- Файли (JSON array)
  files JSONB,

  -- Вартість
  base_price NUMERIC(10, 2) DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  total_price NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'UAH',

  -- Платіж
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('fondy', 'liqpay', 'bank-transfer', 'cash', 'pending')),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id VARCHAR(255),
  paid_at TIMESTAMP,

  -- Статус замовлення
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'accepted', 'in-progress', 'ready', 'shipped', 'completed', 'cancelled')),

  -- Доставка (JSON)
  delivery_data JSONB,

  -- Примітки
  notes TEXT,
  internal_notes TEXT,

  -- Статистика
  views INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,

  -- Дати
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivery_date TIMESTAMP
);

-- Індекси для швидкого пошуку
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_service ON orders(service);

-- Тригер для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PRODUCTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,

  -- Ціна та наявність
  price NUMERIC(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,

  -- Зображення
  images JSONB,
  main_image VARCHAR(500),

  -- Статус
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_popular BOOLEAN DEFAULT FALSE,

  -- Статистика
  views INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,

  -- Відгуки (JSON array)
  reviews JSONB,
  average_rating NUMERIC(3, 2) DEFAULT 0,

  -- Дати
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- USERS TABLE (для майбутньої аутентифікації)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  phone VARCHAR(50),

  -- Роль
  role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'manager')),

  -- Telegram
  telegram_chat_id VARCHAR(100),

  -- Статус
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,

  -- Дати
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_telegram_chat_id ON users(telegram_chat_id);

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ФУНКЦІЇ ДЛЯ ГЕНЕРАЦІЇ ORDER NUMBER
-- ============================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  timestamp_part TEXT;
  random_part TEXT;
BEGIN
  timestamp_part := FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)::TEXT;
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
  RETURN 'ORD-' || timestamp_part || '-' || random_part;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ПОЧАТКОВІ ДАНІ (опціонально)
-- ============================================

-- Приклад створення адмін користувача
-- INSERT INTO users (email, name, role, is_active, email_verified)
-- VALUES ('admin@projet.ua', 'Admin', 'admin', TRUE, TRUE)
-- ON CONFLICT (email) DO NOTHING;
