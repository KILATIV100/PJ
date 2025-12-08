/**
 * Database Service
 * Єдиний сервіс для роботи з PostgreSQL
 */

const { Pool } = require('pg');

let pool = null;

/**
 * Ініціалізація connection pool
 */
function initDatabase() {
  if (pool) {
    return pool;
  }

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL не встановлений');
    throw new Error('DATABASE_URL не встановлений у змінних середовища');
  }

  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
      max: 20, // максимальна кількість з'єднань
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Обробка помилок pool
    pool.on('error', (err) => {
      console.error('❌ Неочікувана помилка PostgreSQL pool:', err);
    });

    console.log('✅ PostgreSQL connection pool створено');
    return pool;
  } catch (error) {
    console.error('❌ Помилка створення PostgreSQL pool:', error);
    throw error;
  }
}

/**
 * Виконати SQL запит
 */
async function query(text, params) {
  if (!pool) {
    initDatabase();
  }

  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 SQL Query:', {
        text: text.substring(0, 100),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }

    return result;
  } catch (error) {
    console.error('❌ SQL Query Error:', error.message);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Перевірка підключення до БД
 */
async function testConnection() {
  try {
    const result = await query('SELECT NOW() as now, version() as version');
    console.log('✅ PostgreSQL підключення успішне');
    console.log('  Час сервера:', result.rows[0].now);
    console.log('  Версія:', result.rows[0].version.split(',')[0]);
    return true;
  } catch (error) {
    console.error('❌ Помилка підключення до PostgreSQL:', error.message);
    return false;
  }
}

/**
 * Ініціалізація схеми бази даних
 */
async function initSchema() {
  const fs = require('fs');
  const path = require('path');

  const schemaPath = path.join(__dirname, '../database/schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.warn('⚠️  Файл schema.sql не знайдено');
    return false;
  }

  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await query(schema);
    console.log('✅ Схема бази даних успішно застосована');
    return true;
  } catch (error) {
    console.error('❌ Помилка застосування схеми:', error.message);
    throw error;
  }
}

/**
 * Закрити всі з'єднання
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ PostgreSQL pool закрито');
  }
}

/**
 * Отримати клієнта для транзакцій
 */
async function getClient() {
  if (!pool) {
    initDatabase();
  }
  return pool.connect();
}

/**
 * Виконати транзакцію
 */
async function transaction(callback) {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  initDatabase,
  query,
  testConnection,
  initSchema,
  closePool,
  getClient,
  transaction,
  getPool: () => pool
};
