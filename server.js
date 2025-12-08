/**
 * Pro Jet - Backend Server
 * Лазерне гравіювання та порізка - платформа для замовлень
 *
 * PostgreSQL + Express + Telegram Bot
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import database service
const db = require('./services/database');

// Import routes
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');
const productRoutes = require('./routes/products');
const novaPoshtaRoutes = require('./routes/novaposhta');
const telegramRoutes = require('./routes/telegram');

// Import Telegram bot
const { initBot } = require('./services/telegram-bot');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// ============================================
// MIDDLEWARE
// ============================================

// Body parser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// CORS - дозволити запити з фронтенду
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Static files - сервіремо фронтенд файли
app.use(express.static(path.join(__dirname, '/')));

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Pro Jet Backend API is running',
    database: db.getPool() ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/novaposhta', novaPoshtaRoutes);
app.use('/api/telegram', telegramRoutes);

// ============================================
// FRONTEND ROUTES (для SPA)
// ============================================

// Основні сторінки
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, 'gallery.html'));
});

app.get('/shop', (req, res) => {
  res.sendFile(path.join(__dirname, 'shop.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'checkout.html'));
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 - Not Found
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Маршрут ${req.method} ${req.originalUrl} не знайдено`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Помилка:', err);

  const status = err.status || 500;
  const message = err.message || 'Внутрішня помилка сервера';

  res.status(status).json({
    error: 'Server Error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    console.log('\n🚀 Запуск Pro Jet Backend...\n');

    // 1. Ініціалізувати PostgreSQL
    console.log('📊 Підключення до PostgreSQL...');
    db.initDatabase();
    await db.testConnection();

    // 2. Застосувати схему (якщо потрібно)
    if (process.env.INIT_DB === 'true') {
      console.log('📋 Застосування схеми бази даних...');
      await db.initSchema();
    }

    // 3. Ініціалізувати Telegram бота
    console.log('🤖 Ініціалізація Telegram бота...');
    const webhookUrl = process.env.WEBHOOK_URL || process.env.RAILWAY_STATIC_URL;
    const useWebhook = process.env.NODE_ENV === 'production' && webhookUrl;

    if (useWebhook) {
      console.log('   Режим: Webhook');
      initBot(true, webhookUrl);
    } else {
      console.log('   Режим: Polling (для локальної розробки)');
      initBot(false);
    }

    // 4. Запустити Express сервер
    app.listen(PORT, HOST, () => {
      console.log(`
╔════════════════════════════════════════╗
║     🚀 Pro Jet Backend Server 🚀       ║
╚════════════════════════════════════════╝

  URL: http://${HOST}:${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  Database: PostgreSQL
  Telegram Bot: ${useWebhook ? 'Webhook' : 'Polling'}

  📌 API Endpoints:
     • GET  /api/health              - Перевірка статусу
     • POST /api/orders              - Створити замовлення
     • GET  /api/orders/:id          - Отримати замовлення
     • POST /api/telegram/webhook    - Telegram webhook
     • GET  /api/telegram/set-webhook - Встановити webhook
     • POST /api/payment/fondy       - Платіж Fondy
     • POST /api/payment/liqpay      - Платіж LiqPay

  ✅ Сервер готовий до роботи!
      `);
    });
  } catch (error) {
    console.error('❌ Помилка запуску сервера:', error);
    process.exit(1);
  }
};

// Запустити сервер
startServer();

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGINT', async () => {
  console.log('\n📍 Отримано сигнал SIGINT, завершення роботи...');
  await db.closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n📍 Отримано сигнал SIGTERM, завершення роботи...');
  await db.closePool();
  process.exit(0);
});

module.exports = app;
