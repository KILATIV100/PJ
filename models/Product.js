/**
 * Product Model для PostgreSQL
 * Модель для товарів магазину
 */

const db = require('../services/database');

class Product {
  /**
   * Створити новий товар
   */
  static async create(productData) {
    const {
      name,
      description,
      category,
      price,
      stock = 0,
      images,
      mainImage,
      isActive = true,
      isFeatured = false,
      isPopular = false
    } = productData;

    const query = `
      INSERT INTO products (
        name, description, category, price, stock,
        images, main_image, is_active, is_featured, is_popular
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      name,
      description,
      category,
      price,
      stock,
      images ? JSON.stringify(images) : null,
      mainImage || null,
      isActive,
      isFeatured,
      isPopular
    ];

    const result = await db.query(query, values);
    return this.formatProduct(result.rows[0]);
  }

  /**
   * Знайти товар по ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM products WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.formatProduct(result.rows[0]);
  }

  /**
   * Знайти всі товари з фільтрацією
   */
  static async findAll(filters = {}) {
    const { category, isActive = true, page = 1, limit = 50 } = filters;

    let query = 'SELECT * FROM products WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      values.push(isActive);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      values.push(category);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, (page - 1) * limit);

    const result = await db.query(query, values);
    return result.rows.map(row => this.formatProduct(row));
  }

  /**
   * Знайти товари по категорії
   */
  static async getByCategory(category) {
    const query = `
      SELECT * FROM products
      WHERE category = $1 AND is_active = TRUE
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [category]);
    return result.rows.map(row => this.formatProduct(row));
  }

  /**
   * Отримати featured товари
   */
  static async getFeatured(limit = 8) {
    const query = `
      SELECT * FROM products
      WHERE is_featured = TRUE AND is_active = TRUE
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    return result.rows.map(row => this.formatProduct(row));
  }

  /**
   * Отримати популярні товари
   */
  static async getPopular(limit = 8) {
    const query = `
      SELECT * FROM products
      WHERE is_popular = TRUE AND is_active = TRUE
      ORDER BY purchases DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    return result.rows.map(row => this.formatProduct(row));
  }

  /**
   * Оновити товар
   */
  static async update(id, updates) {
    const allowedFields = [
      'name', 'description', 'category', 'price', 'stock',
      'images', 'main_image', 'is_active', 'is_featured', 'is_popular'
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
      UPDATE products
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.formatProduct(result.rows[0]);
  }

  /**
   * Інкрементувати перегляди
   */
  static async incrementViews(id) {
    const query = `
      UPDATE products
      SET views = views + 1
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.formatProduct(result.rows[0]);
  }

  /**
   * Додати відгук
   */
  static async addReview(id, review) {
    const product = await this.findById(id);

    if (!product) {
      throw new Error('Товар не знайдено');
    }

    const reviews = product.reviews || [];
    reviews.push({
      ...review,
      createdAt: new Date()
    });

    // Оновити рейтинг
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = sum / reviews.length;

    const query = `
      UPDATE products
      SET reviews = $1, average_rating = $2
      WHERE id = $3
      RETURNING *
    `;

    const result = await db.query(query, [JSON.stringify(reviews), averageRating, id]);
    return this.formatProduct(result.rows[0]);
  }

  /**
   * Форматування продукту для відповіді
   */
  static formatProduct(row) {
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      price: parseFloat(row.price),
      stock: row.stock,
      images: row.images,
      mainImage: row.main_image,
      isActive: row.is_active,
      isFeatured: row.is_featured,
      isPopular: row.is_popular,
      views: row.views,
      purchases: row.purchases,
      reviews: row.reviews,
      averageRating: row.average_rating ? parseFloat(row.average_rating) : 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Видалити товар (soft delete)
   */
  static async delete(id) {
    return this.update(id, { is_active: false });
  }
}

module.exports = Product;
