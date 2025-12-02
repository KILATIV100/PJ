/**
 * Pro Jet - Backend Server
 * Лазерне гравіювання та порізка - платформа для замовлень
 *
 * Основний файл сервера з Express та MongoDB
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import routes
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');
const productRoutes = require('./routes/products');
const novaPoshtaRoutes = require('./routes/novaposhta');

// Import services
const { initializeTelegramBot } = require('./services/telegram');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

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
// DATABASE CONNECTION
// ============================================

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pro-jet';

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ MongoDB підключена успішно!');
  } catch (error) {
    console.error('❌ Помилка підключення MongoDB:', error.message);
    process.exit(1);
  }
};

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Pro Jet Backend API is running'
  });
});

// API Routes
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/novaposhta', novaPoshtaRoutes);

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
    // Підключитися до БД
    await connectDatabase();

    // Ініціалізувати Telegram бота
    initializeTelegramBot();

    // Запустити сервер
    app.listen(PORT, HOST, () => {
      console.log(`
╔════════════════════════════════════════╗
║     🚀 Pro Jet Backend Server 🚀       ║
╚════════════════════════════════════════╝

  URL: http://${HOST}:${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}

  📌 API Endpoints:
     • GET  /api/health              - Перевірка статусу
     • POST /api/orders              - Створити замовлення
     • GET  /api/orders/:id          - Отримати замовлення
     • POST /api/auth/login          - Вхід
     • POST /api/admin/orders        - Управління замовленнями
     • POST /api/payment/fondy       - Платіж Fondy
     • POST /api/payment/liqpay      - Платіж LiqPay
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
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
