/**
 * Netlify Function: Telegram Webhook
 * Обробка вхідних повідомлень від Telegram Bot
 */

const { handleUpdate } = require('../lib/bot');

/**
 * CORS Headers
 */
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  // Тільки POST запити
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method Not Allowed',
        message: 'Only POST requests are allowed'
      })
    };
  }

  try {
    // Парсимо body
    const update = JSON.parse(event.body);

    console.log('Отримано update від Telegram:', JSON.stringify(update, null, 2));

    // Обробляємо update
    await handleUpdate(update);

    // Telegram очікує статус 200
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true })
    };

  } catch (error) {
    console.error('Помилка обробки webhook:', error);

    // Повертаємо 200 навіть у разі помилки, щоб Telegram не повторював запит
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: false,
        error: error.message
      })
    };
  }
};
