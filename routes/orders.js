/**
 * Orders Routes
 * API для управління замовленнями
 */

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const nodemailer = require('nodemailer');
const { sendOrderNotification } = require('../services/telegram');

// ============================================
// EMAIL CONFIGURATION
// ============================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

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

    // Валідація
    if (!customer || !service || !pricing) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Заповніть обов\'язкові поля: customer, service, pricing'
      });
    }

    // Створити замовлення
    const order = new Order({
      customer,
      service,
      engraving: service === 'engraving' ? engraving : undefined,
      cutting: service === 'cutting' ? cutting : undefined,
      design: service === 'design' ? design : undefined,
      files,
      pricing,
      payment: {
        ...payment,
        status: 'pending'
      },
      notes,
      status: 'new'
    });

    // Зберегти в БД
    await order.save();

    // Відправити сповіщення у Telegram
    try {
      await sendOrderNotification(req.body);
    } catch (telegramError) {
      console.error('Помилка відправки у Telegram:', telegramError.message);
    }

    // Відправити email клієнту (опціонально)
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: customer.email,
        subject: `Замовлення ${order.orderNumber} прийнято!`,
        html: `
          <h2>Дякуємо за замовлення!</h2>
          <p>Ваше замовлення <strong>${order.orderNumber}</strong> прийнято.</p>
          <p><strong>Статус:</strong> ${order.status}</p>
          <p><strong>Сума:</strong> ${order.pricing.totalPrice} ${order.pricing.currency}</p>
          <p>Ми скоро зв'яжемося з вами для уточнення деталей.</p>
          <p>З повагою,<br/>Pro Jet Team</p>
        `
      });
    } catch (emailError) {
      console.error('⚠️  Помилка відправки email:', emailError.message);
    }

    // Відповідь
    res.status(201).json({
      success: true,
      message: 'Замовлення успішно створено!',
      order: order.toJSON()
    });
  } catch (error) {
    console.error('Помилка створення замовлення:', error);
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

    // Пошук по ID або orderNumber
    const order = await Order.findOne({
      $or: [
        { _id: id },
        { orderNumber: id }
      ]
    });

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Замовлення не знайдено'
      });
    }

    // Інкрементувати views
    order.views = (order.views || 0) + 1;
    await order.save();

    res.json({
      success: true,
      order: order.toJSON()
    });
  } catch (error) {
    console.error('Помилка отримання замовлення:', error);
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

    const orders = await Order.find({
      'customer.email': email,
      isArchived: false
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders: orders.map(o => o.toJSON())
    });
  } catch (error) {
    console.error('Помилка отримання замовлень:', error);
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

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Замовлення не знайдено'
      });
    }

    // Дозволити тільки оновлення notes
    if (notes !== undefined) {
      order.notes = notes;
    }

    await order.save();

    res.json({
      success: true,
      message: 'Замовлення оновлено',
      order: order.toJSON()
    });
  } catch (error) {
    console.error('Помилка оновлення замовлення:', error);
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
    console.error('Помилка отримання статистики:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

module.exports = router;
