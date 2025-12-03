/**
 * Netlify Function: Set Telegram Webhook
 * Встановлення webhook для Telegram бота
 */

const axios = require('axios');

const headers = {
  'Content-Type': 'application/json'
};

/**
 * Main Handler
 */
exports.handler = async (event, context) => {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const SITE_URL = process.env.URL || process.env.DEPLOY_URL;

  if (!BOT_TOKEN) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'TELEGRAM_BOT_TOKEN не встановлений'
      })
    };
  }

  if (!SITE_URL) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'URL не встановлений. Додайте змінну оточення URL'
      })
    };
  }

  try {
    const webhookUrl = `${SITE_URL}/.netlify/functions/telegram-webhook`;

    // Встановлюємо webhook
    const setWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
    const response = await axios.post(setWebhookUrl, {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query']
    });

    // Отримуємо інформацію про webhook
    const getWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
    const webhookInfo = await axios.get(getWebhookUrl);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Webhook встановлено успішно!',
        webhook_url: webhookUrl,
        telegram_response: response.data,
        webhook_info: webhookInfo.data.result
      })
    };

  } catch (error) {
    console.error('Помилка встановлення webhook:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Помилка встановлення webhook',
        message: error.message
      })
    };
  }
};
