/**
 * Order Handler
 * Розширений обробник замовлень з валідацією та інтеграцією
 */

class OrderHandler {
  constructor() {
    // Динамічне визначення API URL
    // На production використовується поточний host, локально - localhost:3000
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    this.apiUrl = isProduction ? `${window.location.origin}/api` : 'http://localhost:3000/api';

    this.currentOrder = null;
    this.validationErrors = [];

    console.log('📡 API URL:', this.apiUrl);
  }

  /**
   * Створити замовлення з фронтенду
   */
  async submitOrder(orderData) {
    console.log('📝 Обробка замовлення:', orderData);

    // Валідація
    this.validationErrors = [];
    if (!this.validate(orderData)) {
      return {
        success: false,
        errors: this.validationErrors,
        message: 'Будь ласка, виправте помилки перед відправкою'
      };
    }

    try {
      // Відправити на сервер
      const response = await fetch(`${this.apiUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Помилка сервера');
      }

      this.currentOrder = data.order;
      console.log('✅ Замовлення успішно створено:', data.order);

      return {
        success: true,
        order: data.order,
        message: `Замовлення ${data.order.orderNumber} прийнято!`
      };
    } catch (error) {
      console.error('❌ Помилка при створенні замовлення:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Валідація даних замовлення
   */
  validate(data) {
    let isValid = true;

    // Перевірка клієнта
    if (!data.customer) {
      this.validationErrors.push('Необхідна інформація про клієнта');
      isValid = false;
    } else {
      if (!data.customer.name || data.customer.name.trim() === '') {
        this.validationErrors.push('Ім\'я клієнта обов\'язкове');
        isValid = false;
      }
      if (!data.customer.email || !this.isValidEmail(data.customer.email)) {
        this.validationErrors.push('Email невалідний');
        isValid = false;
      }
      if (!data.customer.phone || data.customer.phone.trim() === '') {
        this.validationErrors.push('Номер телефону обов\'язковий');
        isValid = false;
      }
    }

    // Перевірка послуги
    if (!data.service) {
      this.validationErrors.push('Виберіть послугу');
      isValid = false;
    }

    // Перевірка вартості
    if (!data.pricing || !data.pricing.totalPrice || data.pricing.totalPrice < 150) {
      this.validationErrors.push('Мінімальне замовлення 150 грн');
      isValid = false;
    }

    // Перевірка платежу
    if (!data.payment || !data.payment.method) {
      this.validationErrors.push('Виберіть спосіб оплати');
      isValid = false;
    }

    return isValid;
  }

  /**
   * Перевірка email формату
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Форматування замовлення з калькулятора гравіювання
   */
  formatEngravingOrder(formData) {
    const materialValue = formData.material;
    const productValue = formData.product;
    const quantity = parseInt(formData.quantity);

    // Отримати інформацію про матеріал та продукт з глобальних змінних
    const material = window.engravingMaterials ? window.engravingMaterials[materialValue] : null;
    const product = window.engravingFixedPrices ? window.engravingFixedPrices[productValue] : null;

    if (!material || !product) {
      throw new Error('Невалідна конфігурація матеріалу або продукту');
    }

    // Розрахувати вартість (копія з script.js)
    const basePrice = product[2];
    const price = basePrice * quantity;
    const discount = quantity >= 1000 ? price * 0.15 : 0;
    const totalPrice = Math.max(price - discount, 150);

    return {
      customer: formData.customer,
      service: 'engraving',
      engraving: {
        material: materialValue,
        size: productValue,
        quantity: quantity,
        complexity: product[1],
        basePrice: basePrice,
        description: product[3]
      },
      pricing: {
        basePrice: price,
        discount: discount,
        discountPercent: discount > 0 ? 15 : 0,
        totalPrice: totalPrice,
        currency: 'UAH'
      },
      payment: {
        method: formData.paymentMethod || 'fondy',
        status: 'pending'
      },
      files: formData.files || [],
      notes: formData.notes || ''
    };
  }

  /**
   * Форматування замовлення з калькулятора різання
   */
  formatCuttingOrder(formData) {
    const materialValue = formData.material;
    const length = parseFloat(formData.length);
    const details = parseInt(formData.details);

    const material = window.cuttingMaterials ? window.cuttingMaterials[materialValue] : null;
    if (!material) {
      throw new Error('Невалідний матеріал');
    }

    // Розрахувати вартість (копія з script.js)
    const ctime = 0.83;
    const cdetail = 0.50;

    const basePerMeter = (ctime * material.T_RIZU) + material.C_MARZH;
    const cuttingPrice = basePerMeter * length;
    const detailPrice = cdetail * details;
    const price = cuttingPrice + detailPrice;
    const discount = length >= 500 ? price * 0.15 : 0;
    const totalPrice = Math.max(price - discount, 150);

    return {
      customer: formData.customer,
      service: 'cutting',
      cutting: {
        material: materialValue,
        length: length,
        detailCount: details,
        description: `Різання ${length} м з ${details} деталями`
      },
      pricing: {
        basePrice: price,
        discount: discount,
        discountPercent: discount > 0 ? 15 : 0,
        totalPrice: totalPrice,
        currency: 'UAH'
      },
      payment: {
        method: formData.paymentMethod || 'fondy',
        status: 'pending'
      },
      files: formData.files || [],
      notes: formData.notes || ''
    };
  }

  /**
   * Форматування замовлення для дизайну
   */
  formatDesignOrder(formData) {
    const basePrice = 500; // Базова ціна дизайну

    return {
      customer: formData.customer,
      service: 'design',
      design: {
        description: formData.description || 'Дизайн послуга',
        requirements: formData.requirements || ''
      },
      pricing: {
        basePrice: basePrice,
        discount: 0,
        discountPercent: 0,
        totalPrice: Math.max(basePrice, 150),
        currency: 'UAH'
      },
      payment: {
        method: formData.paymentMethod || 'bank-transfer',
        status: 'pending'
      },
      files: formData.files || [],
      notes: formData.notes || ''
    };
  }

  /**
   * Отримати замовлення по ID або номеру
   */
  async getOrder(identifier) {
    try {
      const response = await fetch(`${this.apiUrl}/orders/${identifier}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Замовлення не знайдено');
      }

      return {
        success: true,
        order: data.order
      };
    } catch (error) {
      console.error('❌ Помилка при отриманні замовлення:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Отримати замовлення по email
   */
  async getOrdersByEmail(email) {
    try {
      const response = await fetch(`${this.apiUrl}/orders/by-email/${email}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Помилка при отриманні замовлень');
      }

      return {
        success: true,
        orders: data.orders,
        count: data.count
      };
    } catch (error) {
      console.error('❌ Помилка:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Ініціювати платіж
   */
  async initiatePayment(orderId, paymentMethod) {
    try {
      const endpoint = paymentMethod === 'fondy' ? '/fondy' : '/liqpay';
      const response = await fetch(`${this.apiUrl}/payment${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          amount: this.currentOrder?.pricing?.totalPrice || 0,
          currency: 'UAH'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Помилка при ініціюванні платежу');
      }

      return {
        success: true,
        paymentUrl: data.paymentUrl,
        message: 'Платіж ініціалізований'
      };
    } catch (error) {
      console.error('❌ Помилка платежу:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Форматування вартості
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  /**
   * Отримати статистику (для адміна)
   */
  async getStats() {
    try {
      const response = await fetch(`${this.apiUrl}/admin/stats`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Помилка при отриманні статистики');
      }

      return {
        success: true,
        stats: data.stats
      };
    } catch (error) {
      console.error('❌ Помилка:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// Створити глобальний екземпляр
const orderHandler = new OrderHandler();

console.log('✅ Order Handler Loaded');
