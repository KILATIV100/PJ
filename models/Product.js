/**
 * Product Model
 * Модель для товарів магазину сувенірної продукції
 */

const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  // Основна інформація
  name: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['cups', 'pens', 'badges', 'keychains', 'other'],
    required: true
  },

  // Ціна та залишки
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    default: null
  },
  stock: {
    type: Number,
    default: 100
  },
  lowStockThreshold: {
    type: Number,
    default: 20
  },

  // Характеристики
  specifications: [{
    key: String,
    value: String
  }],
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      default: 'mm'
    }
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      default: 'g'
    }
  },

  // Зображення та медіа
  images: [{
    url: String,
    alt: String,
    isPrimary: Boolean
  }],
  emoji: String,

  // Персоналізація
  isCustomizable: {
    type: Boolean,
    default: true
  },
  customizationOptions: [{
    name: String,
    type: String, // 'engraving', 'print', 'embroidery'
    additionalPrice: Number
  }],

  // SEO
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],

  // Статус
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPopular: {
    type: Boolean,
    default: false
  },

  // Рейтинги та відгуки
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    author: String,
    email: String,
    rating: Number,
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Логістика
  shippingInfo: {
    weight: Number,
    dimensions: String,
    shippingCost: Number,
    freeShippingThreshold: Number
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

  // Статистика
  views: {
    type: Number,
    default: 0
  },
  purchases: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Індекси
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ sku: 1 });

// Middleware - оновити дату updatedAt
ProductSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Метод для перевірки наявності товару
ProductSchema.methods.isInStock = function () {
  return this.stock > 0;
};

// Метод для отримання ціни з урахуванням знижки
ProductSchema.methods.getPrice = function () {
  return this.discountPrice || this.price;
};

// Метод для отримання відсотка знижки
ProductSchema.methods.getDiscount = function () {
  if (!this.discountPrice) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
};

// Статичний метод для отримання товарів по категорії
ProductSchema.statics.getByCategory = async function (category) {
  return await this.find({ category, isActive: true }).sort({ createdAt: -1 });
};

// Статичний метод для пошуку по названию
ProductSchema.statics.search = async function (query) {
  return await this.find({
    $text: { $search: query },
    isActive: true
  });
};

// Статичний метод для отримання популярних товарів
ProductSchema.statics.getPopular = async function (limit = 8) {
  return await this.find({ isPopular: true, isActive: true })
    .sort({ purchases: -1 })
    .limit(limit);
};

// Статичний метод для отримання новинок
ProductSchema.statics.getNew = async function (limit = 8, days = 30) {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return await this.find({
    createdAt: { $gte: date },
    isActive: true
  }).sort({ createdAt: -1 }).limit(limit);
};

// Метод для додавання відгуку
ProductSchema.methods.addReview = function (review) {
  this.reviews.push(review);
  this.updateRating();
  return this.save();
};

// Метод для оновлення рейтингу
ProductSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
  } else {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.rating.average = sum / this.reviews.length;
    this.rating.count = this.reviews.length;
  }
};

// Метод для зменшення запасів
ProductSchema.methods.decreaseStock = function (quantity = 1) {
  this.stock -= quantity;
  this.purchases += 1;
  return this.save();
};

// Метод для форматування для відповіді
ProductSchema.methods.toJSON = function () {
  const product = this.toObject();
  delete product.__v;
  return product;
};

module.exports = mongoose.model('Product', ProductSchema);
