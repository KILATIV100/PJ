/**
 * Neon PostgreSQL Connection Library
 * Підключення до Neon database через serverless
 */

const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// Налаштування для WebSocket (потрібно для serverless)
neonConfig.webSocketConstructor = ws;

let pool;

/**
 * Отримати connection pool
 */
function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL або POSTGRES_URL не встановлений');
    }

    pool = new Pool({
      connectionString,
      ssl: true
    });
  }

  return pool;
}

/**
 * Виконати SQL запит
 */
async function query(text, params) {
  const pool = getPool();
  const start = Date.now();

  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Ініціалізувати таблиці бази даних
 */
async function initializeTables() {
  const pool = getPool();

  try {
    // Таблиця замовлень
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,

        -- Customer information
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_city VARCHAR(255),
        customer_address TEXT,

        -- Service details
        service VARCHAR(50) NOT NULL,
        service_details JSONB,

        -- Files
        files JSONB,

        -- Pricing
        total_price DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'UAH',

        -- Payment
        payment_method VARCHAR(50),
        payment_status VARCHAR(50) DEFAULT 'pending',

        -- Status
        status VARCHAR(50) DEFAULT 'new',
        notes TEXT,

        -- Metadata
        views INTEGER DEFAULT 0,
        is_archived BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Індекси для швидшого пошуку
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_email
      ON orders(customer_email);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status
      ON orders(status);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_created
      ON orders(created_at DESC);
    `);

    console.log('✅ Database tables initialized');
    return true;
  } catch (error) {
    console.error('❌ Error initializing tables:', error);
    throw error;
  }
}

/**
 * Згенерувати унікальний номер замовлення
 */
async function generateOrderNumber() {
  const prefix = 'PJ';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

module.exports = {
  getPool,
  query,
  initializeTables,
  generateOrderNumber
};
