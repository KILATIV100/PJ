/**
 * Telegram Bot Service
 * Відправка повідомлень про замовлення у Telegram
 */

const TelegramBot = require('node-telegram-bot-api');

let bot = null;

/**
 * Ініціалізація Telegram бота
 */
function initializeTelegramBot() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN не встановлений. Telegram сповіщення будуть пропущені.');
    return false;
  }

  try {
    bot = new TelegramBot(botToken);
    console.log('✅ Telegram бот ініціалізований');
    return true;
  } catch (error) {
    console.error('❌ Помилка при ініціалізації Telegram бота:', error.message);
    return false;
  }
}

/**
 * Форматування замовлення для Telegram
 */
function formatOrderMessage(orderData) {
  let message = '📦 <b>НОВЕ ЗАМОВЛЕННЯ</b>\n\n';

  // Контактна інформація
  message += '<b>👤 Клієнт:</b>\n';
  message += `Ім\'я: ${orderData.customer.name}\n`;
  message += `Email: ${orderData.customer.email}\n`;
  message += `Телефон: ${orderData.customer.phone}\n\n`;

  // Адреса доставки
  message += '<b>📍 Адреса доставки:</b>\n';
  message += `${orderData.customer.city}, ${orderData.customer.address}\n\n`;

  // Товари
  if (orderData.items && orderData.items.length > 0) {
    message += '<b>🛒 Товари:</b>\n';
    orderData.items.forEach((item, index) => {
      const itemTotal = (item.price || item.basePrice || 0) * (item.quantity || 1);
      message += `${index + 1}. ${item.name || 'Товар'}\n`;
      message += `   Кількість: ${item.quantity || 1}\n`;
      message += `   Ціна за одиницю: ${item.price || item.basePrice || 0}₴\n`;
      message += `   Сума: ${itemTotal}₴\n\n`;
    });
  }

  // Ціна
  message += '<b>💰 Сума замовлення:</b>\n';
  message += `${orderData.pricing.totalPrice}₴ (${orderData.pricing.currency})\n\n`;

  // Коментарі
  if (orderData.notes) {
    message += '<b>📝 Коментарі:</b>\n';
    message += `${orderData.notes}\n\n`;
  }

  // Час
  message += `<i>Час отримання: ${new Date().toLocaleString('uk-UA')}</i>`;

  return message;
}

/**
 * Відправка повідомлення про замовлення у Telegram
 */
async function sendOrderNotification(orderData) {
  if (!bot) {
    console.warn('⚠️  Telegram бот не ініціалізований');
    return false;
  }

  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!chatId) {
    console.warn('⚠️  TELEGRAM_CHAT_ID не встановлений');
    return false;
  }

  try {
    const message = formatOrderMessage(orderData);

    await bot.sendMessage(chatId, message, {
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
 * Відправка тестового повідомлення
 */
async function sendTestMessage() {
  if (!bot) {
    return false;
  }

  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!chatId) {
    console.warn('⚠️  TELEGRAM_CHAT_ID не встановлений');
    return false;
  }

  try {
    await bot.sendMessage(chatId, '✅ Pro Jet бот запущено та працює!');
    console.log('✅ Тестове повідомлення відправлено');
    return true;
  } catch (error) {
    console.error('❌ Помилка при відправці тестового повідомлення:', error.message);
    return false;
  }
}

module.exports = {
  initializeTelegramBot,
  sendOrderNotification,
  sendTestMessage
};
