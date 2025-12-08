/**
 * User Model для PostgreSQL
 * Модель для користувачів системи
 */

const db = require('../services/database');

class User {
  /**
   * Створити нового користувача
   */
  static async create(userData) {
    const {
      email,
      name,
      phone,
      role = 'customer',
      passwordHash = null,
      telegramChatId = null
    } = userData;

    const query = `
      INSERT INTO users (
        email, name, phone, role, password_hash, telegram_chat_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      email.toLowerCase(),
      name,
      phone || null,
      role,
      passwordHash,
      telegramChatId
    ];

    const result = await db.query(query, values);
    return this.formatUser(result.rows[0]);
  }

  /**
   * Знайти користувача по ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.formatUser(result.rows[0]);
  }

  /**
   * Знайти користувача по email
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email.toLowerCase()]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.formatUser(result.rows[0]);
  }

  /**
   * Знайти користувача по Telegram Chat ID
   */
  static async findByTelegramChatId(chatId) {
    const query = 'SELECT * FROM users WHERE telegram_chat_id = $1';
    const result = await db.query(query, [chatId.toString()]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.formatUser(result.rows[0]);
  }

  /**
   * Оновити користувача
   */
  static async update(id, updates) {
    const allowedFields = [
      'name', 'phone', 'role', 'password_hash',
      'telegram_chat_id', 'is_active', 'email_verified', 'last_login'
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
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.formatUser(result.rows[0]);
  }

  /**
   * Видалити користувача (soft delete)
   */
  static async delete(id) {
    return this.update(id, { is_active: false });
  }

  /**
   * Оновити час останнього входу
   */
  static async updateLastLogin(id) {
    const query = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.formatUser(result.rows[0]);
  }

  /**
   * Отримати всіх користувачів з фільтрацією
   */
  static async findAll(filters = {}) {
    const { role, isActive = true, page = 1, limit = 50 } = filters;

    let query = 'SELECT * FROM users WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      values.push(isActive);
      paramIndex++;
    }

    if (role) {
      query += ` AND role = $${paramIndex}`;
      values.push(role);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, (page - 1) * limit);

    const result = await db.query(query, values);
    return result.rows.map(row => this.formatUser(row));
  }

  /**
   * Форматування користувача для відповіді
   */
  static formatUser(row) {
    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      role: row.role,
      telegramChatId: row.telegram_chat_id,
      isActive: row.is_active,
      emailVerified: row.email_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLogin: row.last_login
    };
  }

  /**
   * Отримати публічний профіль (без чутливих даних)
   */
  static formatPublicProfile(row) {
    const user = this.formatUser(row);
    if (!user) return null;

    // Видалити чутливі дані
    delete user.telegramChatId;

    return user;
  }
}

module.exports = User;
