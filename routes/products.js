/**
 * Products Routes
 * API для управління товарами магазину
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// ============================================
// ПУБЛІЧНІ МАРШУТИ (для клієнтів)
// ============================================

/**
 * GET /api/products
 * Отримати список товарів з фільтрацією та пагінацією
 */
router.get('/', async (req, res) => {
  try {
    const {
      category = 'all',
      page = 1,
      limit = 12,
      sort = 'popular',
      search = ''
    } = req.query;

    // Побудова фільтра
    let filter = { isActive: true };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Побудова сортування
    let sortObj = {};
    switch (sort) {
      case 'price-asc':
        sortObj = { price: 1 };
        break;
      case 'price-desc':
        sortObj = { price: -1 };
        break;
      case 'new':
        sortObj = { createdAt: -1 };
        break;
      case 'popular':
      default:
        sortObj = { isPopular: -1, purchases: -1 };
    }

    // Пагінація
    const skip = (page - 1) * limit;

    // Отримати товари
    const products = await Product.find(filter)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(skip);

    // Отримати всього товарів
    const totalCount = await Product.countDocuments(filter);

    res.json({
      success: true,
      count: products.length,
      total: totalCount,
      page: parseInt(page),
      pages: Math.ceil(totalCount / limit),
      products: products.map(p => p.toJSON())
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
 * GET /api/products/featured
 * Отримати рекомендовані товари
 */
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const products = await Product.find({
      isActive: true,
      isFeatured: true
    }).limit(limit);

    res.json({
      success: true,
      products: products.map(p => p.toJSON())
    });
  } catch (error) {
    console.error('Помилка отримання рекомендованих товарів:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/products/:id
 * Отримати товар по ID
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Товар не знайдено'
      });
    }

    // Збільшити кількість переглядів
    product.views += 1;
    await product.save();

    res.json({
      success: true,
      product: product.toJSON()
    });
  } catch (error) {
    console.error('Помилка отримання товара:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/products/category/:category
 * Отримати товари по категорії
 */
router.get('/category/:category', async (req, res) => {
  try {
    const products = await Product.getByCategory(req.params.category);

    res.json({
      success: true,
      count: products.length,
      products: products.map(p => p.toJSON())
    });
  } catch (error) {
    console.error('Помилка отримання товарів категорії:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * POST /api/products/:id/review
 * Додати відгук до товара
 */
router.post('/:id/review', async (req, res) => {
  try {
    const { author, email, rating, comment } = req.body;

    if (!author || !email || !rating) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Необхідні поля: author, email, rating'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Товар не знайдено'
      });
    }

    await product.addReview({
      author,
      email,
      rating,
      comment
    });

    res.json({
      success: true,
      message: 'Відгук додано',
      product: product.toJSON()
    });
  } catch (error) {
    console.error('Помилка додавання відгуку:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

// ============================================
// АДМІНІСТРАТИВНІ МАРШУТИ
// ============================================

/**
 * POST /api/products/admin
 * Створити товар (тільки адмін)
 */
router.post('/admin', async (req, res) => {
  try {
    const productData = req.body;

    // Створити товар
    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Товар створено',
      product: product.toJSON()
    });
  } catch (error) {
    console.error('Помилка створення товара:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * PUT /api/products/:id/admin
 * Оновити товар (тільки адмін)
 */
router.put('/:id/admin', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Товар не знайдено'
      });
    }

    res.json({
      success: true,
      message: 'Товар оновлено',
      product: product.toJSON()
    });
  } catch (error) {
    console.error('Помилка оновлення товара:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/products/:id/admin
 * Видалити товар (тільки адмін)
 */
router.delete('/:id/admin', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Товар не знайдено'
      });
    }

    res.json({
      success: true,
      message: 'Товар видалено',
      product: product.toJSON()
    });
  } catch (error) {
    console.error('Помилка видалення товара:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * PUT /api/products/:id/stock/admin
 * Оновити запас товара (тільки адмін)
 */
router.put('/:id/stock/admin', async (req, res) => {
  try {
    const { stock } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Товар не знайдено'
      });
    }

    product.stock = stock;
    await product.save();

    res.json({
      success: true,
      message: 'Запас оновлено',
      product: product.toJSON()
    });
  } catch (error) {
    console.error('Помилка оновлення запасу:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

module.exports = router;
