/**
 * Payment Routes
 * Маршрути для обробки платежів через Fondy та LiqPay
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');

/**
 * POST /api/payment/fondy
 * Обробка платежу через Fondy
 */
router.post('/fondy', async (req, res) => {
  try {
    const { orderId, amount, currency = 'UAH', email, phone } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'orderId та amount обов\'язкові'
      });
    }

    // Знайти замовлення
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Замовлення не знайдено'
      });
    }

    // TODO: Реальна інтеграція з Fondy API
    // На даний момент це заглушка

    res.json({
      success: true,
      message: 'Платіж через Fondy ініціалізований',
      paymentUrl: 'https://api.fondy.ua/pay',
      orderId: orderId,
      amount: amount,
      currency: currency,
      note: 'Повна інтеграція Fondy в розробці'
    });
  } catch (error) {
    console.error('Помилка платежу Fondy:', error);
    res.status(500).json({
      error: 'Payment Error',
      message: error.message
    });
  }
});

/**
 * POST /api/payment/liqpay
 * Обробка платежу через LiqPay
 */
router.post('/liqpay', async (req, res) => {
  try {
    const { orderId, amount, currency = 'UAH' } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'orderId та amount обов\'язкові'
      });
    }

    // Знайти замовлення
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Замовлення не знайдено'
      });
    }

    // TODO: Реальна інтеграція з LiqPay API
    // На даний момент це заглушка

    res.json({
      success: true,
      message: 'Платіж через LiqPay ініціалізований',
      paymentUrl: 'https://www.liqpay.ua/api/3/checkout',
      orderId: orderId,
      amount: amount,
      currency: currency,
      note: 'Повна інтеграція LiqPay в розробці'
    });
  } catch (error) {
    console.error('Помилка платежу LiqPay:', error);
    res.status(500).json({
      error: 'Payment Error',
      message: error.message
    });
  }
});

/**
 * POST /api/payment/callback/fondy
 * Callback від Fondy для підтвердження платежу
 */
router.post('/callback/fondy', async (req, res) => {
  try {
    const { order_id, payment_id, order_status } = req.body;

    // Найти замовлення
    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Оновити статус платежу
    if (order_status === 'approved') {
      order.payment.status = 'completed';
      order.payment.transactionId = payment_id;
      order.payment.paidAt = new Date();
      order.status = 'accepted';
    } else if (order_status === 'declined') {
      order.payment.status = 'failed';
    }

    await order.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Помилка callback Fondy:', error);
    res.status(500).json({ error: 'Callback processing error' });
  }
});

/**
 * POST /api/payment/callback/liqpay
 * Callback від LiqPay для підтвердження платежу
 */
router.post('/callback/liqpay', async (req, res) => {
  try {
    const { order_id, status } = req.body;

    // Найти замовлення
    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Оновити статус платежу
    if (status === 'success') {
      order.payment.status = 'completed';
      order.payment.paidAt = new Date();
      order.status = 'accepted';
    } else if (status === 'failure') {
      order.payment.status = 'failed';
    }

    await order.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Помилка callback LiqPay:', error);
    res.status(500).json({ error: 'Callback processing error' });
  }
});

module.exports = router;
