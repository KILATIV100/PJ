/**
 * Admin Routes
 * Маршрути для адміністративного управління замовленнями, користувачами та товарами
 */

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

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

/**
 * GET /api/admin/users
 * Отримати всіх користувачів з фільтрацією
 */
router.get('/users', async (req, res) => {
  try {
    const { role = 'all', limit = 20, page = 1, search = '' } = req.query;

    let filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skipCount = (page - 1) * limit;

    const users = await User.find(filter)
      .select('-password -passwordResetToken')
      .limit(parseInt(limit))
      .skip(skipCount)
      .sort('-createdAt');

    const totalCount = await User.countDocuments(filter);

    res.json({
      success: true,
      count: users.length,
      total: totalCount,
      page: parseInt(page),
      pages: Math.ceil(totalCount / limit),
      users: users
    });
  } catch (error) {
    console.error('Помилка отримання користувачів:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/users/:id
 * Отримати профіль користувача
 */
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -passwordResetToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Користувач не знайдений'
      });
    }

    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * PUT /api/admin/users/:id
 * Оновити роль користувача або статус
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const updateData = {};

    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password -passwordResetToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Користувач не знайдений'
      });
    }

    res.json({
      success: true,
      message: 'Користувача оновлено',
      user: user
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/products
 * Отримати всі товари
 */
router.get('/products', async (req, res) => {
  try {
    const { category = 'all', limit = 20, page = 1, search = '' } = req.query;

    let filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const skipCount = (page - 1) * limit;

    const products = await Product.find(filter)
      .limit(parseInt(limit))
      .skip(skipCount)
      .sort('-createdAt');

    const totalCount = await Product.countDocuments(filter);

    res.json({
      success: true,
      count: products.length,
      total: totalCount,
      page: parseInt(page),
      pages: Math.ceil(totalCount / limit),
      products: products
    });
  } catch (error) {
    console.error('Помилка отримання товарів:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * PUT /api/admin/products/:id
 * Оновити товар
 */
router.put('/products/:id', async (req, res) => {
  try {
    const { name, price, stock, description } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (price) updateData.price = price;
    if (typeof stock === 'number') updateData.stock = stock;
    if (description) updateData.description = description;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Товар не знайдений'
      });
    }

    res.json({
      success: true,
      message: 'Товар оновлено',
      product: product
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/dashboard
 * Отримати дані для головної панелі
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Замовлення статистика
    const totalOrders = await Order.countDocuments({ isArchived: false });
    const pendingOrders = await Order.countDocuments({ status: 'pending', isArchived: false });
    const completedOrders = await Order.countDocuments({ status: 'completed', isArchived: false });

    // Користувачі статистика
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) }
    });

    // Товари статистика
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } }).limit(5);

    // Доходи
    const revenue = await Order.aggregate([
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
      dashboard: {
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders
        },
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth
        },
        products: {
          lowStock: lowStockProducts
        },
        revenue: {
          total: revenue[0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Помилка отримання панелі:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

module.exports = router;
