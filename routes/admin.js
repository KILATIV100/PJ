/**
 * Admin Routes
 * Маршрути для адміністративного управління замовленнями
 */

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

/**
 * GET /api/admin/orders
 * Отримати все замовлення з фільтрацією та пагінацією
 */
router.get('/orders', async (req, res) => {
  try {
    const { status = 'all', limit = 20, page = 1, sort = '-createdAt' } = req.query;

    // Побудова фільтра
    let filter = { isArchived: false };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const skipCount = (page - 1) * limit;

    // Отримати замовлення
    const orders = await Order.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skipCount);

    // Отримати всього замовлень
    const totalCount = await Order.countDocuments(filter);

    res.json({
      success: true,
      count: orders.length,
      total: totalCount,
      page: parseInt(page),
      pages: Math.ceil(totalCount / limit),
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
 * GET /api/admin/orders/:id
 * Отримати деталі замовлення для адміністратора
 */
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Замовлення не знайдено'
      });
    }

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
 * PUT /api/admin/orders/:id
 * Оновити замовлення (адміністратор)
 */
router.put('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, internalNotes, deliveryDate, payment } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Замовлення не знайдено'
      });
    }

    // Оновити поля
    if (status) order.status = status;
    if (internalNotes) order.internalNotes = internalNotes;
    if (deliveryDate) order.deliveryDate = deliveryDate;
    if (payment) {
      order.payment = { ...order.payment, ...payment };
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
 * DELETE /api/admin/orders/:id
 * Архівувати замовлення
 */
router.delete('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByIdAndUpdate(
      id,
      { isArchived: true },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Замовлення не знайдено'
      });
    }

    res.json({
      success: true,
      message: 'Замовлення архівовано',
      order: order.toJSON()
    });
  } catch (error) {
    console.error('Помилка архівування замовлення:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/stats
 * Отримати статистику замовлень
 */
router.get('/stats', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({ isArchived: false });
    const pendingOrders = await Order.countDocuments({ status: 'pending', isArchived: false });
    const completedOrders = await Order.countDocuments({ status: 'completed', isArchived: false });

    const stats = await Order.aggregate([
      { $match: { isArchived: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalPrice' }
        }
      }
    ]);

    const totalRevenue = await Order.aggregate([
      { $match: { 'payment.status': 'completed', isArchived: false } },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.totalPrice' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        byStatus: stats
      }
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
