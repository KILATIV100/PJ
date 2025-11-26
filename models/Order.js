/**
 * Order Model
 * Модель для зберігання замовлень у MongoDB
 */

const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  // Базова інформація
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    default: () => 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
  },

  // Контактна інформація
  customer: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    company: String,
    address: String,
    city: String
  },

  // Тип послуги
  service: {
    type: String,
    enum: ['engraving', 'cutting', 'design', 'shop', 'consultation'],
    required: true
  },

  // Параметри гравіювання
  engraving: {
    material: String,
    size: String,
    quantity: Number,
    complexity: String,
    basePrice: Number,
    description: String
  },

  // Параметри різання
  cutting: {
    material: String,
    length: Number,
    detailCount: Number,
    description: String
  },

  // Дизайн послуга
  design: {
    description: String,
    requirements: String
  },

  // Товари з магазину
  shopItems: [{
    productId: mongoose.Schema.Types.ObjectId,
    name: String,
    price: Number,
    quantity: Number,
    category: String
  }],

  // Файли
  files: [{
    filename: String,
    originalName: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Вартість
  pricing: {
    basePrice: Number,
    discount: Number,
    discountPercent: Number,
    totalPrice: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'UAH'
    }
  },

  // Платіж
  payment: {
    method: {
      type: String,
      enum: ['fondy', 'liqpay', 'bank-transfer', 'cash'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },

  // Статус замовлення
  status: {
    type: String,
    enum: ['new', 'accepted', 'in-progress', 'ready', 'shipped', 'completed', 'cancelled'],
    default: 'new'
  },

  // Доставка (Nova Poshta)
  delivery: {
    method: {
      type: String,
      enum: ['novaposhta', 'pickup', 'courier'],
      default: 'novaposhta'
    },
    trackingNumber: String,
    shipmentRef: String,
    status: String,
    cost: Number,
    city: String,
    department: String,
    createdAt: Date,
    lastUpdate: Date
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
  deliveryDate: Date,

  // Примітки
  notes: String,
  internalNotes: String,

  // Статистика
  views: {
    type: Number,
    default: 0
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Індекси для пошуку
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ 'customer.email': 1 });
OrderSchema.index({ 'customer.phone': 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1 });

// Middleware - оновити дату updatedAt
OrderSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Метод для форматування замовлення для відповіді
OrderSchema.methods.toJSON = function () {
  const order = this.toObject();
  delete order.__v;
  return order;
};

// Статичний метод для отримання статистики
OrderSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalPrice' }
      }
    }
  ]);
  return stats;
};

module.exports = mongoose.model('Order', OrderSchema);
