/**
 * Authentication Routes
 * Маршрути для входу/виходу та управління сесіями
 */

const express = require('express');
const router = express.Router();

/**
 * POST /api/auth/login
 * Вхід адміністратора
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email та пароль обов\'язкові'
      });
    }

    // Простая проверка (в реальной системе нужна БД с хешированием паролей)
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      // В реальной системе здесь нужно создать JWT токен
      return res.json({
        success: true,
        message: 'Успішний вхід!',
        user: {
          email: email,
          role: 'admin'
        },
        token: 'temporary_token_' + Math.random().toString(36).substr(2)
      });
    }

    res.status(401).json({
      error: 'Authentication Failed',
      message: 'Невірний email або пароль'
    });
  } catch (error) {
    console.error('Помилка входу:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * Вихід
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Вихід успішний'
  });
});

/**
 * GET /api/auth/me
 * Отримати інформацію про поточного користувача
 */
router.get('/me', (req, res) => {
  res.json({
    success: false,
    message: 'Необхідна аутентифікація',
    user: null
  });
});

module.exports = router;
