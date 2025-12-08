/**
 * Order Model для PostgreSQL
 * Робота з замовленнями через SQL
 */

const db = require('../services/database');

class Order {
  /**
   * Створити нове замовлення
   */
  static async create(orderData) {
    const {
      customer,
      service,
      engraving,
      cutting,
      design,
      shopItems,
      files,
      pricing,
      payment,
      notes,
      internalNotes
    } = orderData;

    // Генерувати order_number
    const orderNumber = await this.generateOrderNumber();

    const query = `
      INSERT INTO orders (
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        customer_company,
        customer_address,
        customer_city,
        service,
        engraving_data,
        cutting_data,
        design_data,
        shop_items,
        files,
        base_price,
        discount,
        discount_percent,
        total_price,
        currency,
        payment_method,
        payment_status,
        transaction_id,
        notes,
        internal_notes,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24
      )
      RETURNING *
    `;

    const values = [
      orderNumber,
      customer.name,
      customer.email,
      customer.phone,
      customer.company || null,
      customer.address || null,
      customer.city || null,
      service,
      engraving ? JSON.stringify(engraving) : null,
      cutting ? JSON.stringify(cutting) : null,
      design ? JSON.stringify(design) : null,
      shopItems ? JSON.stringify(shopItems) : null,
      files ? JSON.stringify(files) : null,
      pricing.basePrice || 0,
      pricing.discount || 0,
      pricing.discountPercent || 0,
      pricing.totalPrice,
      pricing.currency || 'UAH',
      payment?.method || 'pending',
      payment?.status || 'pending',
      payment?.transactionId || null,
      notes || null,
      internalNotes || null,
      'new'
    ];

    const result = await db.query(query, values);
    return this.formatOrder(result.rows[0]);
  }

  /**
   * Знайти замовлення по ID або order_number
   */
  static async findById(identifier) {
    const query = `
      SELECT * FROM orders
      WHERE id = $1 OR order_number = $1
      LIMIT 1
    `;

    const result = await db.query(query, [identifier]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.formatOrder(result.rows[0]);
  }

  /**
   * Знайти замовлення по email
   */
  static async findByEmail(email) {
    const query = `
      SELECT * FROM orders
      WHERE customer_email = $1
      AND is_archived = FALSE
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [email]);
    return result.rows.map(row => this.formatOrder(row));
  }

  /**
   * Знайти замовлення по телефону
   */
  static async findByPhone(phone) {
    const query = `
      SELECT * FROM orders
      WHERE customer_phone LIKE $1
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const result = await db.query(query, [`%${phone}%`]);
    return result.rows.map(row => this.formatOrder(row));
  }

  /**
   * Оновити замовлення
   */
  static async update(id, updates) {
    const allowedFields = [
      'status',
      'notes',
      'internal_notes',
      'payment_status',
      'payment_method',
      'transaction_id',
      'paid_at',
      'delivery_data'
    ];

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('Немає полів для оновлення');
    }

    values.push(id);
    const query = `
      UPDATE orders
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.formatOrder(result.rows[0]);
  }

  /**
   * Інкрементувати перегляди
   */
  static async incrementViews(id) {
    const query = `
      UPDATE orders
      SET views = views + 1
      WHERE id = $1 OR order_number = $1
      RETURNING *
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.formatOrder(result.rows[0]);
  }

  /**
   * Отримати статистику
   */
  static async getStats() {
    const query = `
      SELECT
        status,
        COUNT(*) as count,
        SUM(total_price) as total_revenue
      FROM orders
      WHERE is_archived = FALSE
      GROUP BY status
    `;

    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Отримати всі замовлення з фільтрацією
   */
  static async findAll(filters = {}) {
    const { status, service, page = 1, limit = 50 } = filters;

    let query = 'SELECT * FROM orders WHERE is_archived = FALSE';
    const values = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    if (service) {
      query += ` AND service = $${paramIndex}`;
      values.push(service);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, (page - 1) * limit);

    const result = await db.query(query, values);
    return result.rows.map(row => this.formatOrder(row));
  }

  /**
   * Генерувати унікальний номер замовлення
   */
  static async generateOrderNumber() {
    const result = await db.query('SELECT generate_order_number() as order_number');
    return result.rows[0].order_number;
  }

  /**
   * Форматування замовлення для відповіді
   */
  static formatOrder(row) {
    if (!row) return null;

    return {
      id: row.id,
      orderNumber: row.order_number,
      customer: {
        name: row.customer_name,
        email: row.customer_email,
        phone: row.customer_phone,
        company: row.customer_company,
        address: row.customer_address,
        city: row.customer_city
      },
      service: row.service,
      engraving: row.engraving_data,
      cutting: row.cutting_data,
      design: row.design_data,
      shopItems: row.shop_items,
      files: row.files,
      pricing: {
        basePrice: parseFloat(row.base_price || 0),
        discount: parseFloat(row.discount || 0),
        discountPercent: row.discount_percent || 0,
        totalPrice: parseFloat(row.total_price),
        currency: row.currency
      },
      payment: {
        method: row.payment_method,
        status: row.payment_status,
        transactionId: row.transaction_id,
        paidAt: row.paid_at
      },
      status: row.status,
      delivery: row.delivery_data,
      notes: row.notes,
      internalNotes: row.internal_notes,
      views: row.views,
      isArchived: row.is_archived,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deliveryDate: row.delivery_date
    };
  }

  /**
   * Архівувати замовлення
   */
  static async archive(id) {
    const query = `
      UPDATE orders
      SET is_archived = TRUE
      WHERE id = $1 OR order_number = $1
      RETURNING *
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.formatOrder(result.rows[0]);
  }
}

module.exports = Order;
