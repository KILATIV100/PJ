/**
 * Telegram Bot Routes для Railway
 */

const express = require('express');
const router = express.Router();
const { processWebhookUpdate } = require('../services/telegram-bot');

/**
 * POST /api/telegram/webhook
 * Прийом оновлень від Telegram
 */
router.post('/webhook', async (req, res) => {
  try {
    const update = req.body;

    console.log('📨 Отримано update від Telegram:', JSON.stringify(update, null, 2));

    // Обробляємо update асинхронно
    processWebhookUpdate(update).catch(error => {
      console.error('❌ Помилка обробки update:', error);
    });

    // Відразу відповідаємо Telegram (важливо для уникнення timeout)
    res.status(200).json({ ok: true });

  } catch (error) {
    console.error('❌ Помилка webhook:', error);
    // Все одно відповідаємо 200, щоб Telegram не повторював запит
    res.status(200).json({ ok: false, error: error.message });
  }
});

/**
 * GET /api/telegram/set-webhook
 * Встановлення webhook (викликається вручну або при deploy)
 */
router.get('/set-webhook', async (req, res) => {
  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const WEBHOOK_URL = process.env.WEBHOOK_URL || process.env.RAILWAY_STATIC_URL;

    if (!BOT_TOKEN) {
      return res.status(500).json({
        error: 'TELEGRAM_BOT_TOKEN не встановлений'
      });
    }

    if (!WEBHOOK_URL) {
      return res.status(500).json({
        error: 'WEBHOOK_URL не встановлений. Додайте змінну оточення WEBHOOK_URL'
      });
    }

    const axios = require('axios');
    const webhookUrl = `${WEBHOOK_URL}/api/telegram/webhook`;

    // Встановлюємо webhook
    const setWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
    const response = await axios.post(setWebhookUrl, {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query']
    });

    // Отримуємо інформацію про webhook
    const getWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
    const webhookInfo = await axios.get(getWebhookUrl);

    res.json({
      success: true,
      message: 'Webhook встановлено успішно!',
      webhook_url: webhookUrl,
      telegram_response: response.data,
      webhook_info: webhookInfo.data.result
    });

  } catch (error) {
    console.error('❌ Помилка встановлення webhook:', error);
    res.status(500).json({
      error: 'Помилка встановлення webhook',
      message: error.message
    });
  }
});

/**
 * GET /api/telegram/webhook-info
 * Перевірка статусу webhook
 */
router.get('/webhook-info', async (req, res) => {
  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (!BOT_TOKEN) {
      return res.status(500).json({
        error: 'TELEGRAM_BOT_TOKEN не встановлений'
      });
    }

    const axios = require('axios');
    const getWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
    const webhookInfo = await axios.get(getWebhookUrl);

    res.json({
      success: true,
      webhook_info: webhookInfo.data.result
    });

  } catch (error) {
    console.error('❌ Помилка отримання інформації про webhook:', error);
    res.status(500).json({
      error: 'Помилка отримання інформації',
      message: error.message
    });
  }
});

/**
 * DELETE /api/telegram/webhook
 * Видалення webhook (для тестування з polling)
 */
router.delete('/webhook', async (req, res) => {
  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (!BOT_TOKEN) {
      return res.status(500).json({
        error: 'TELEGRAM_BOT_TOKEN не встановлений'
      });
    }

    const axios = require('axios');
    const deleteWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`;
    const response = await axios.post(deleteWebhookUrl);

    res.json({
      success: true,
      message: 'Webhook видалено успішно!',
      telegram_response: response.data
    });

  } catch (error) {
    console.error('❌ Помилка видалення webhook:', error);
    res.status(500).json({
      error: 'Помилка видалення webhook',
      message: error.message
    });
  }
});

/**
 * GET /api/telegram/bot-info
 * Отримати публічну інформацію про бота (username)
 */
router.get('/bot-info', (req, res) => {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;

  if (!botUsername || botUsername === 'your_bot_username') {
    return res.status(404).json({
      error: 'Bot username not configured',
      message: 'Please set TELEGRAM_BOT_USERNAME in environment variables'
    });
  }

  res.json({
    success: true,
    botUsername: botUsername
  });
});

module.exports = router;
