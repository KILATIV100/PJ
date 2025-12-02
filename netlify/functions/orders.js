/**
 * Netlify Function: Orders API
 * Управління замовленнями
 */

const { query, generateOrderNumber } = require('../lib/db');
const { sendOrderNotification } = require('../lib/telegram');

/**
 * CORS Headers
 */
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

/**
 * Main Handler
 */
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/orders', '');
    const method = event.httpMethod;

    // POST /api/orders - Створити замовлення
    if (method === 'POST' && !path) {
      return await createOrder(event);
    }

    // GET /api/orders/:id - Отримати замовлення
    if (method === 'GET' && path) {
      const id = path.split('/')[1];
      return await getOrder(id);
    }

    // GET /api/orders/by-email/:email - Отримати замовлення за email
    if (method === 'GET' && path.includes('/by-email/')) {
      const email = path.split('/by-email/')[1];
      return await getOrdersByEmail(email);
    }

    // PUT /api/orders/:id - Оновити замовлення
    if (method === 'PUT' && path) {
      const id = path.split('/')[1];
      return await updateOrder(id, event);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: 'Not Found',
        message: `Route ${method} ${path} not found`
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};

/**
 * Створити нове замовлення
 */
async function createOrder(event) {
  try {
    const data = JSON.parse(event.body);
    const {
      customer,
      service,
      engraving,
      cutting,
      design,
      files,
      pricing,
      payment,
      notes
    } = data;

    // Валідація
    if (!customer || !service || !pricing) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Validation Error',
          message: 'Заповніть обов\'язкові поля: customer, service, pricing'
        })
      };
    }

    // Згенерувати номер замовлення
    const orderNumber = await generateOrderNumber();

    // Підготувати деталі послуги
    let serviceDetails = {};
    if (service === 'engraving' && engraving) {
      serviceDetails = engraving;
    } else if (service === 'cutting' && cutting) {
      serviceDetails = cutting;
    } else if (service === 'design' && design) {
      serviceDetails = design;
    }

    // Створити замовлення в БД
    const result = await query(
      `INSERT INTO orders (
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        customer_city,
        customer_address,
        service,
        service_details,
        files,
        total_price,
        currency,
        payment_method,
        payment_status,
        notes,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        orderNumber,
        customer.name,
        customer.email,
        customer.phone,
        customer.city || null,
        customer.address || null,
        service,
        JSON.stringify(serviceDetails),
        JSON.stringify(files || []),
        pricing.totalPrice,
        pricing.currency || 'UAH',
        payment?.method || null,
        payment?.status || 'pending',
        notes || null,
        'new'
      ]
    );

    const order = result.rows[0];

    // Відправити сповіщення у Telegram
    try {
      await sendOrderNotification({
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        customer_city: order.customer_city,
        customer_address: order.customer_address,
        service: order.service,
        total_price: order.total_price,
        currency: order.currency,
        notes: order.notes
      });
    } catch (telegramError) {
      console.error('Помилка відправки у Telegram:', telegramError.message);
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Замовлення успішно створено!',
        order: order
      })
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Server Error',
        message: error.message
      })
    };
  }
}

/**
 * Отримати замовлення по ID або номеру
 */
async function getOrder(id) {
  try {
    const result = await query(
      `SELECT * FROM orders
       WHERE id = $1 OR order_number = $1
       LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Not Found',
          message: 'Замовлення не знайдено'
        })
      };
    }

    const order = result.rows[0];

    // Інкрементувати views
    await query(
      `UPDATE orders SET views = views + 1 WHERE id = $1`,
      [order.id]
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        order: order
      })
    };
  } catch (error) {
    console.error('Error getting order:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Server Error',
        message: error.message
      })
    };
  }
}

/**
 * Отримати замовлення за email
 */
async function getOrdersByEmail(email) {
  try {
    const result = await query(
      `SELECT * FROM orders
       WHERE customer_email = $1 AND is_archived = false
       ORDER BY created_at DESC`,
      [email]
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: result.rows.length,
        orders: result.rows
      })
    };
  } catch (error) {
    console.error('Error getting orders by email:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Server Error',
        message: error.message
      })
    };
  }
}

/**
 * Оновити замовлення
 */
async function updateOrder(id, event) {
  try {
    const data = JSON.parse(event.body);
    const { notes } = data;

    // Дозволяємо тільки оновлення notes
    const result = await query(
      `UPDATE orders
       SET notes = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [notes, id]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Not Found',
          message: 'Замовлення не знайдено'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Замовлення оновлено',
        order: result.rows[0]
      })
    };
  } catch (error) {
    console.error('Error updating order:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Server Error',
        message: error.message
      })
    };
  }
}
