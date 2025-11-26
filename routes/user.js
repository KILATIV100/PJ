/**
 * User Routes
 * Маршрути для реєстрації, входу та управління профілем користувачів
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware для перевірки JWT токена
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен не знайдений'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pro-jet-secret-key');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Користувач не знайдений'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Невалідний токен'
    });
  }
};

/**
 * POST /api/users/register
 * Реєстрація нового користувача
 */
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, passwordConfirm } = req.body;

    // Валідація
    if (!firstName || !lastName || !email || !password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Будь ласка, заповніть всі обов\'язкові поля'
      });
    }

    // Перевірка совпадения паролей
    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Паролі не совпадають'
      });
    }

    // Перевірка довжини пароля
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Пароль повинен містити мінімум 6 символів'
      });
    }

    // Перевірка email формату
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Невалідний email'
      });
    }

    // Перевірка чи користувач уже існує
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Користувач з таким email уже зареєстрований'
      });
    }

    // Створення нового користувача
    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      isVerified: true, // Для простоти, без email верифікації
      role: 'customer'
    });

    await newUser.save();

    // Генерація JWT токена
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || 'pro-jet-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Реєстрація успішна!',
      user: newUser.getPublicProfile(),
      token: token
    });
  } catch (error) {
    console.error('Помилка реєстрації:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/users/login
 * Вхід користувача
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Валідація
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email та пароль обов\'язкові'
      });
    }

    // Пошук користувача
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Невірний email або пароль'
      });
    }

    // Перевірка пароля
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Невірний email або пароль'
      });
    }

    // Оновлення часу останнього входу
    user.lastLogin = new Date();
    await user.save();

    // Генерація JWT токена
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'pro-jet-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Вхід успішний!',
      user: user.getPublicProfile(),
      token: token
    });
  } catch (error) {
    console.error('Помилка входу:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/users/profile
 * Отримати профіль поточного користувача
 */
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/users/profile
 * Оновити профіль користувача
 */
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, city, region, street, postalCode } = req.body;

    const user = await User.findById(req.user._id);

    // Оновлення базової інформації
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;

    // Оновлення адреси
    if (city || region || street || postalCode) {
      user.address = {
        ...user.address,
        ...(city && { city }),
        ...(region && { region }),
        ...(street && { street }),
        ...(postalCode && { postalCode })
      };
    }

    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Профіль оновлено',
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/users/address
 * Оновити адресу для Нова Пошта
 */
router.put('/address', verifyToken, async (req, res) => {
  try {
    const { recipient, phone, department, departmentCity } = req.body;

    const user = await User.findById(req.user._id);

    // Валідація
    if (!recipient || !phone || !department || !departmentCity) {
      return res.status(400).json({
        success: false,
        message: 'Усі поля адреси обов\'язкові'
      });
    }

    user.novaPoshtaInfo = {
      recipient,
      phone,
      department,
      departmentCity
    };

    await user.save();

    res.json({
      success: true,
      message: 'Адресу Нова Пошта оновлено',
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/users/logout
 * Вихід користувача
 */
router.post('/logout', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Вихід успішний'
  });
});

/**
 * GET /api/users/:id
 * Отримати публічний профіль користувача (для маркетплейсу)
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('firstName lastName shop avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Користувач не знайдений'
      });
    }

    // Если це продавець, повернути інформацію про магазин
    if (user.role === 'seller' && user.shop) {
      return res.json({
        success: true,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          shop: user.shop
        }
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
