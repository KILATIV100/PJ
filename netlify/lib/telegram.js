/**
 * Telegram Bot Service для Netlify Functions
 * Відправка повідомлень через HTTP API (без polling)
 */

const axios = require('axios');

/**
 * Форматування замовлення для Telegram
 */
function formatOrderMessage(orderData) {
  let message = '📦 <b>НОВЕ ЗАМОВЛЕННЯ</b>\n\n';

  // Контактна інформація
  message += '<b>👤 Клієнт:</b>\n';
  message += `Ім'я: ${orderData.customer_name}\n`;
  message += `Email: ${orderData.customer_email}\n`;
  message += `Телефон: ${orderData.customer_phone}\n\n`;

  // Адреса доставки
  if (orderData.customer_city || orderData.customer_address) {
    message += '<b>📍 Адреса доставки:</b>\n';
    message += `${orderData.customer_city || ''}, ${orderData.customer_address || ''}\n\n`;
  }

  // Послуга
  message += '<b>🛠 Послуга:</b>\n';
  message += `${orderData.service}\n\n`;

  // Ціна
  message += '<b>💰 Сума замовлення:</b>\n';
  message += `${orderData.total_price} ${orderData.currency || 'UAH'}\n\n`;

  // Коментарі
  if (orderData.notes) {
    message += '<b>📝 Коментарі:</b>\n';
    message += `${orderData.notes}\n\n`;
  }

  // Номер замовлення
  if (orderData.order_number) {
    message += `<b>📋 Номер замовлення:</b> ${orderData.order_number}\n`;
  }

  // Час
  message += `\n<i>Час: ${new Date().toLocaleString('uk-UA')}</i>`;

  return message;
}

/**
 * Відправка повідомлення у Telegram
 */
async function sendOrderNotification(orderData) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN не встановлений');
    return false;
  }

  if (!chatId) {
    console.warn('⚠️  TELEGRAM_CHAT_ID не встановлений');
    return false;
  }

  try {
    const message = formatOrderMessage(orderData);
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });

    console.log('✅ Замовлення відправлено у Telegram');
    return true;
  } catch (error) {
    console.error('❌ Помилка при відправці у Telegram:', error.message);
    return false;
  }
}

/**
 * Відправка довільного повідомлення
 */
async function sendMessage(text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('⚠️  Telegram credentials не встановлені');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    await axios.post(url, {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    });

    console.log('✅ Повідомлення відправлено у Telegram');
    return true;
  } catch (error) {
    console.error('❌ Помилка при відправці у Telegram:', error.message);
    return false;
  }
}

module.exports = {
  sendOrderNotification,
  sendMessage,
  formatOrderMessage
};
