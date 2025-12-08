/**
 * Orders Routes
 * API для управління замовленнями
 */

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const nodemailer = require('nodemailer');
const { sendOrderNotification } = require('../services/telegram-bot');

// ============================================
// EMAIL CONFIGURATION
// ============================================

let transporter = null;

// Ініціалізація email транспорту
const initializeEmailTransport = () => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('⚠️  Email config не встановлено. Email сповіщення відключені.');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    return transporter;
  } catch (error) {
    console.error('❌ Помилка ініціалізації email транспорту:', error.message);
    return null;
  }
};

// Ініціалізувати при запуску
initializeEmailTransport();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Відправити email клієнту
 */
const sendOrderEmail = async (order, customerEmail) => {
  if (!transporter) {
    console.warn('⚠️  Email транспорт недоступний, пропуск відправки');
    return false;
  }

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: customerEmail,
      subject: `Замовлення ${order.orderNumber} прийнято!`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
          <h2 style="color: #2c3e50;">Дякуємо за замовлення!</h2>
          <p>Ваше замовлення <strong style="color: #e74c3c;">${order.orderNumber}</strong> успішно прийнято.</p>
          
          <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Номер замовлення:</strong> ${order.orderNumber}</p>
            <p><strong>Дата:</strong> ${new Date(order.createdAt).toLocaleString('uk-UA')}</p>
            <p><strong>Статус:</strong> ${order.status}</p>
            <p><strong>Сума:</strong> ${order.pricing.totalPrice} ${order.pricing.currency || 'UAH'}</p>
          </div>

          <p>Ми скоро зв'яжемося з вами для уточнення деталей виробництва.</p>
          
          <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
            З повагою,<br/>
            <strong>Pro Jet Team</strong><br/>
            Платформа для лазерного гравіювання та різки
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email відправлено на:', customerEmail);
    return true;
  } catch (error) {
    console.error('❌ Помилка відправки email:', error.message);
    return false;
  }
};

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/orders
 * Створити нове замовлення
 */
router.post('/', async (req, res) => {
  try {
    const {
      customer,
      service,
      engraving,
      cutting,
      design,
      files,
      pricing,
      payment,
      notes
    } = req.body;

    // Валідація обов'язкових полів
    if (!customer || !service || !pricing) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Заповніть обов\'язкові поля: customer, service, pricing'
      });
    }

    // Валідація email
    if (!customer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Невірний формат email'
      });
    }

    // Валідація послуги
    const validServices = ['engraving', 'cutting', 'design', 'combined'];
    if (!validServices.includes(service)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Послуга повинна бути однією з: ${validServices.join(', ')}`
      });
    }

    // Створити замовлення через Order model
    const savedOrder = await Order.create({
      customer: {
        name: customer.name || 'N/A',
        email: customer.email,
        phone: customer.phone || null,
        company: customer.company || null,
        address: customer.address || null,
        city: customer.city || null
      },
      service,
      engraving: service === 'engraving' || service === 'combined' ? engraving : undefined,
      cutting: service === 'cutting' || service === 'combined' ? cutting : undefined,
      design: service === 'design' || service === 'combined' ? design : undefined,
      shopItems: req.body.shopItems || undefined,
      files: files || [],
      pricing: {
        basePrice: pricing.basePrice || 0,
        discount: pricing.discount || 0,
        discountPercent: pricing.discountPercent || 0,
        totalPrice: pricing.totalPrice || 0,
        currency: pricing.currency || 'UAH'
      },
      payment: {
        method: payment?.method || 'pending',
        status: 'pending',
        transactionId: payment?.transactionId || null
      },
      notes: notes || ''
    });

    console.log('✅ Замовлення створено:', savedOrder.orderNumber);

    // Відправити сповіщення у Telegram (асинхронно)
    try {
      await sendOrderNotification(req.body);
      console.log('✅ Telegram сповіщення відправлено');
    } catch (telegramError) {
      console.error('❌ Помилка відправки у Telegram:', telegramError.message);
      // Не блокуємо відповідь через помилку Telegram
    }

    // Відправити email клієнту (асинхронно)
    try {
      await sendOrderEmail(savedOrder, customer.email);
    } catch (emailError) {
      console.error('❌ Помилка відправки email:', emailError.message);
      // Не блокуємо відповідь через помилку email
    }

    // Відповідь з успіхом
    res.status(201).json({
      success: true,
      message: 'Замовлення успішно створено!',
      order: savedOrder
    });
  } catch (error) {
    console.error('❌ Помилка створення замовлення:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/orders/:id
 * Отримати замовлення по ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Валідація ID
    if (!id || id.length < 3) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Невірний ID замовлення'
      });
    }

    // Інкрементувати views і отримати замовлення
    const order = await Order.incrementViews(id);

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Замовлення не знайдено'
      });
    }

    res.json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error('❌ Помилка отримання замовлення:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/orders/by-email/:email
 * Отримати замовлення за email
 */
router.get('/by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Валідація email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Невірний формат email'
      });
    }

    const orders = await Order.findByEmail(email);

    res.json({
      success: true,
      count: orders.length,
      orders: orders
    });
  } catch (error) {
    console.error('❌ Помилка отримання замовлень:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * PUT /api/orders/:id
 * Оновити замовлення (тільки клієнт)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Дозволити тільки оновлення notes та статусу (обмежено)
    const updates = {};
    const allowedStatuses = ['new', 'accepted', 'in-progress', 'ready', 'completed', 'cancelled'];

    if (status !== undefined && allowedStatuses.includes(status)) {
      updates.status = status;
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    const order = await Order.update(id, updates);

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Замовлення не знайдено'
      });
    }

    res.json({
      success: true,
      message: 'Замовлення оновлено',
      order: order
    });
  } catch (error) {
    console.error('❌ Помилка оновлення замовлення:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/orders/stats/all
 * Отримати статистику замовлень
 */
router.get('/stats/all', async (req, res) => {
  try {
    const stats = await Order.getStats();

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('❌ Помилка отримання статистики:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

module.exports = router;
