/**
 * User Model
 * Модель для користувачів системи
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // Базова інформація
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },

  // Контактна інформація
  phone: String,
  avatar: String,

  // Адреса
  address: {
    street: String,
    city: String,
    region: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Ukraine'
    }
  },

  // Доставка Нова Пошта
  novaPoshtaInfo: {
    recipient: String, // Ім'я отримувача
    phone: String,     // Телефон отримувача
    department: String, // Номер відділення
    departmentCity: String // Місто відділення
  },

  // Роль користувача
  role: {
    type: String,
    enum: ['customer', 'seller', 'admin'],
    default: 'customer'
  },

  // Статус
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,

  // Пароль
  passwordResetToken: String,
  passwordResetExpires: Date,

  // Вподобання та кошик
  favoriteProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  savedAddresses: [{
    label: String, // Home, Work, etc.
    street: String,
    city: String,
    region: String,
    postalCode: String,
    isDefault: Boolean
  }],

  // Статистика
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },

  // Для продавців
  shop: {
    name: String,
    description: String,
    logo: String,
    isVerified: Boolean,
    rating: Number,
    followers: Number
  },

  // Дати
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Індекси
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

// Middleware - хешування пароля перед збереженням
UserSchema.pre('save', async function (next) {
  // Якщо пароль не був змінений, пропустити
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Метод для перевірки пароля
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Метод для отримання публічної інформації користувача
UserSchema.methods.getPublicProfile = function () {
  const user = this.toObject();
  delete user.password;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.verificationToken;
  delete user.__v;
  return user;
};

// Статичний метод для пошуку по email
UserSchema.statics.findByEmail = async function (email) {
  return await this.findOne({ email: email.toLowerCase() });
};

// Статичний метод для отримання профілю
UserSchema.statics.getProfile = async function (userId) {
  return await this.findById(userId).select('-password -verificationToken -passwordResetToken');
};

module.exports = mongoose.model('User', UserSchema);
