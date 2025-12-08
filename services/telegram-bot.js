/**
 * Telegram Bot - Об'єднаний сервіс
 * Інтерактивний бот + сповіщення про замовлення
 */

const TelegramBot = require('node-telegram-bot-api');
const db = require('./database');
const Order = require('../models/Order');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Тимчасове сховище для conversation state
const userStates = new Map();

/**
 * Створення бота
 */
let bot = null;

function initBot(webhook = false, webhookUrl = null) {
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN не встановлений');
    return null;
  }

  try {
    if (webhook && webhookUrl) {
      // Webhook mode для production
      bot = new TelegramBot(BOT_TOKEN);
      bot.setWebHook(`${webhookUrl}/api/telegram/webhook`);
      console.log(`✅ Telegram бот запущено (webhook: ${webhookUrl}/api/telegram/webhook)`);
    } else {
      // Polling mode для development
      bot = new TelegramBot(BOT_TOKEN, { polling: true });
      console.log('✅ Telegram бот запущено (polling mode)');
    }

    // Ініціалізуємо database
    initDatabase();

    // Обробники подій
    setupHandlers();

    return bot;
  } catch (error) {
    console.error('❌ Помилка ініціалізації бота:', error);
    return null;
  }
}

/**
 * Налаштування обробників
 */
function setupHandlers() {
  // Команда /start (з можливим параметром для замовлення з магазину)
  bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name;
    const param = match[1].trim();

    // Перевірка чи є параметр замовлення
    if (param.startsWith('order_')) {
      const orderDataEncoded = param.replace('order_', '');
      await handleShopOrder(chatId, userId, firstName, orderDataEncoded);
    } else {
      await handleStart(chatId, firstName);
    }
  });

  // Команда /help
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    await handleHelp(chatId);
  });

  // Команда /cancel
  bot.onText(/\/cancel/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    userStates.delete(userId);
    await sendMessage(chatId, '❌ Дія скасована', {
      reply_markup: getMainMenuKeyboard()
    });
  });

  // Обробка контакту
  bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    await handleContactInfo(chatId, userId, msg);
  });

  // Обробка текстових повідомлень
  bot.on('message', async (msg) => {
    // Пропускаємо команди та контакти
    if (msg.text && msg.text.startsWith('/')) return;
    if (msg.contact) return;

    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    const state = userStates.get(userId);

    if (state) {
      if (state.step === 'get_contact_info') {
        await handleContactInfo(chatId, userId, msg);
      } else if (state.step === 'get_email') {
        await handleEmail(chatId, userId, text);
      } else if (state.step === 'get_city') {
        await handleCity(chatId, userId, text);
      } else if (state.step === 'get_description') {
        await handleDescription(chatId, userId, text);
      }
    }
  });

  // Обробка callback queries
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    // Відповідаємо на callback
    await bot.answerCallbackQuery(callbackQuery.id);

    // Обробка різних callback
    if (data === 'main_menu') {
      await handleMainMenu(chatId, messageId);
    } else if (data === 'new_order') {
      await handleNewOrder(chatId, messageId, userId);
    } else if (data.startsWith('service_')) {
      const service = data.replace('service_', '');
      await handleServiceChoice(chatId, messageId, userId, service);
    } else if (data === 'confirm_order') {
      await handleConfirmOrder(chatId, messageId, userId);
    } else if (data === 'cancel_order') {
      await handleCancelOrder(chatId, messageId, userId);
    } else if (data === 'my_orders') {
      await handleMyOrders(chatId, messageId, userId);
    } else if (data === 'price_list') {
      await handlePriceList(chatId, messageId);
    } else if (data === 'about') {
      await handleAbout(chatId, messageId);
    } else if (data === 'contacts') {
      await handleContacts(chatId, messageId);
    }
  });
}

/**
 * Відправка повідомлення
 */
async function sendMessage(chatId, text, options = {}) {
  return bot.sendMessage(chatId, text, {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...options
  });
}

/**
 * Редагування повідомлення
 */
async function editMessage(chatId, messageId, text, options = {}) {
  return bot.editMessageText(text, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'HTML',
    ...options
  });
}

/**
 * Головне меню
 */
function getMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🛒 Нове замовлення', callback_data: 'new_order' },
        { text: '📦 Мої замовлення', callback_data: 'my_orders' }
      ],
      [
        { text: '💰 Прайс-лист', callback_data: 'price_list' },
        { text: 'ℹ️ Про нас', callback_data: 'about' }
      ],
      [
        { text: '📞 Контакти', callback_data: 'contacts' }
      ]
    ]
  };
}

/**
 * Меню вибору послуги
 */
function getServiceMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '✨ Лазерне гравіювання', callback_data: 'service_engraving' }],
      [{ text: '✂️ Лазерна різка', callback_data: 'service_cutting' }],
      [{ text: '🎨 Дизайн', callback_data: 'service_design' }],
      [{ text: '🛍 Магазин товарів', callback_data: 'service_shop' }],
      [{ text: '⬅️ Назад', callback_data: 'main_menu' }]
    ]
  };
}

/**
 * Обробка /start
 */
async function handleStart(chatId, firstName) {
  const text = `👋 Вітаю, ${firstName}!

Я бот компанії <b>Pro Jet</b> - вашого партнера у світі лазерного гравіювання та різки! 🎯

Ми можемо допомогти вам з:
• ✨ Лазерне гравіювання на різних матеріалах
• ✂️ Лазерна різка високої точності
• 🎨 Розробка дизайну
• 🛍 Готові вироби з магазину

Що бажаєте зробити?`;

  await sendMessage(chatId, text, {
    reply_markup: getMainMenuKeyboard()
  });
}

/**
 * Обробка замовлення з магазину (через deep link)
 */
async function handleShopOrder(chatId, userId, firstName, orderDataEncoded) {
  try {
    // Декодування даних замовлення
    const orderDataJson = Buffer.from(orderDataEncoded, 'base64').toString('utf-8');
    const orderData = JSON.parse(orderDataJson);

    if (!orderData || !orderData.items || orderData.items.length === 0) {
      await sendMessage(chatId, '❌ Помилка: неможливо прочитати дані замовлення. Спробуйте ще раз.');
      return;
    }

    // Формування опису замовлення
    const itemsList = orderData.items.map(item =>
      `• ${item.name} x${item.quantity} - ${item.price * item.quantity} ₴`
    ).join('\n');

    const confirmText = `🛍 <b>Замовлення з магазину</b>

<b>Товари:</b>
${itemsList}

<b>💰 Загальна сума:</b> ${orderData.total} ₴

📝 Тепер надішліть ваші контактні дані для оформлення замовлення:

<b>Ім'я:</b> Ваше ім'я
<b>Телефон:</b> +380XXXXXXXXX
<b>Email:</b> your@email.com
<b>Місто:</b> Назва міста

<i>Або скористайтеся кнопкою нижче</i>`;

    const keyboard = {
      keyboard: [[{ text: '📱 Відправити контакт', request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true
    };

    // Зберігаємо дані замовлення у стан користувача
    userStates.set(userId, {
      step: 'get_contact_info',
      data: {
        service: 'shop',
        shopOrder: orderData
      }
    });

    await sendMessage(chatId, confirmText, { reply_markup: keyboard });

  } catch (error) {
    console.error('Помилка обробки замовлення з магазину:', error);
    await sendMessage(chatId, `❌ Помилка обробки замовлення. Будь ласка, спробуйте оформити замовлення через сайт або зв'яжіться з нами напряму.

👋 Вітаю, ${firstName}! Ви можете створити нове замовлення через меню:`, {
      reply_markup: getMainMenuKeyboard()
    });
  }
}

/**
 * Обробка /help
 */
async function handleHelp(chatId) {
  const text = `📖 <b>Довідка по боту</b>

<b>Доступні команди:</b>
/start - Головне меню
/help - Ця довідка
/cancel - Скасувати поточну дію

<b>Як зробити замовлення:</b>
1. Натисніть "🛒 Нове замовлення"
2. Виберіть тип послуги
3. Заповніть необхідні дані
4. Підтвердіть замовлення

<b>Питання?</b>
Використовуйте кнопку "📞 Контакти" для зв'язку з нами!`;

  await sendMessage(chatId, text, {
    reply_markup: getMainMenuKeyboard()
  });
}

/**
 * Головне меню
 */
async function handleMainMenu(chatId, messageId) {
  const text = `🏠 <b>Головне меню</b>

Виберіть потрібну опцію:`;

  await editMessage(chatId, messageId, text, {
    reply_markup: getMainMenuKeyboard()
  });
}

/**
 * Нове замовлення
 */
async function handleNewOrder(chatId, messageId, userId) {
  const text = `🛒 <b>Нове замовлення</b>

Виберіть тип послуги, яка вас цікавить:`;

  userStates.set(userId, {
    step: 'choose_service',
    data: {}
  });

  await editMessage(chatId, messageId, text, {
    reply_markup: getServiceMenuKeyboard()
  });
}

/**
 * Вибір послуги
 */
async function handleServiceChoice(chatId, messageId, userId, service) {
  const serviceNames = {
    'engraving': 'Лазерне гравіювання',
    'cutting': 'Лазерна різка',
    'design': 'Дизайн',
    'shop': 'Магазин товарів'
  };

  const serviceName = serviceNames[service];

  const state = userStates.get(userId) || { data: {} };
  state.data.service = service;
  state.step = 'get_contact_info';
  userStates.set(userId, state);

  const text = `✅ Ви обрали: <b>${serviceName}</b>

📝 Тепер надішліть мені ваші контактні дані у форматі:

<b>Ім'я:</b> Ваше ім'я
<b>Телефон:</b> +380XXXXXXXXX
<b>Email:</b> your@email.com
<b>Місто:</b> Назва міста

<i>Або скористайтеся кнопкою нижче для відправки контакту</i>`;

  const keyboard = {
    keyboard: [[{ text: '📱 Відправити контакт', request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true
  };

  await editMessage(chatId, messageId, text);
  await sendMessage(chatId, 'Натисніть кнопку нижче або введіть дані вручну:', {
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

/**
 * Обробка контактної інформації
 */
async function handleContactInfo(chatId, userId, message) {
  const state = userStates.get(userId);

  if (!state || state.step !== 'get_contact_info') {
    await sendMessage(chatId, 'Почніть спочатку - /start');
    return;
  }

  let contactData = {};

  if (message.contact) {
    contactData = {
      name: `${message.contact.first_name} ${message.contact.last_name || ''}`.trim(),
      phone: message.contact.phone_number,
      email: '',
      city: ''
    };

    state.data.contact = contactData;
    state.step = 'get_email';
    userStates.set(userId, state);

    await sendMessage(chatId, `✅ Контакт отримано!\n\nТепер введіть ваш email:`, {
      reply_markup: { remove_keyboard: true }
    });
    return;
  }

  const text = message.text;
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.toLowerCase().includes('ім\'я:') || line.toLowerCase().includes('имя:')) {
      contactData.name = line.split(':')[1]?.trim() || '';
    } else if (line.toLowerCase().includes('телефон:')) {
      contactData.phone = line.split(':')[1]?.trim() || '';
    } else if (line.toLowerCase().includes('email:')) {
      contactData.email = line.split(':')[1]?.trim() || '';
    } else if (line.toLowerCase().includes('місто:') || line.toLowerCase().includes('город:')) {
      contactData.city = line.split(':')[1]?.trim() || '';
    }
  }

  if (!contactData.name || !contactData.phone) {
    await sendMessage(chatId, '❌ Будь ласка, вкажіть принаймні ім\'я та телефон. Спробуйте ще раз.');
    return;
  }

  state.data.contact = contactData;
  state.step = 'get_description';
  userStates.set(userId, state);

  await sendMessage(chatId, `✅ Дані отримано!

📝 Тепер опишіть детально ваше замовлення:
- Що потрібно зробити?
- Які матеріали?
- Розміри, кількість?
- Будь-які особливі побажання?`, {
    reply_markup: { remove_keyboard: true }
  });
}

/**
 * Обробка email
 */
async function handleEmail(chatId, userId, email) {
  const state = userStates.get(userId);

  if (!state || state.step !== 'get_email') return;

  if (!email.includes('@')) {
    await sendMessage(chatId, '❌ Невірний формат email. Спробуйте ще раз:');
    return;
  }

  state.data.contact.email = email;
  state.step = 'get_city';
  userStates.set(userId, state);

  await sendMessage(chatId, '✅ Email отримано!\n\nВведіть назву вашого міста:');
}

/**
 * Обробка міста
 */
async function handleCity(chatId, userId, city) {
  const state = userStates.get(userId);

  if (!state || state.step !== 'get_city') return;

  state.data.contact.city = city;
  state.step = 'get_description';
  userStates.set(userId, state);

  await sendMessage(chatId, `✅ Місто отримано!

📝 Тепер опишіть детально ваше замовлення:
- Що потрібно зробити?
- Які матеріали?
- Розміри, кількість?
- Будь-які особливі побажання?`);
}

/**
 * Обробка опису
 */
async function handleDescription(chatId, userId, description) {
  const state = userStates.get(userId);

  if (!state || state.step !== 'get_description') return;

  state.data.description = description;
  state.step = 'confirm';
  userStates.set(userId, state);

  const contact = state.data.contact;
  const serviceNames = {
    'engraving': 'Лазерне гравіювання',
    'cutting': 'Лазерна різка',
    'design': 'Дизайн',
    'shop': 'Магазин товарів'
  };

  const confirmText = `📋 <b>Підтвердження замовлення</b>

<b>Послуга:</b> ${serviceNames[state.data.service]}

<b>Контактні дані:</b>
👤 Ім'я: ${contact.name}
📱 Телефон: ${contact.phone}
📧 Email: ${contact.email || 'не вказано'}
🏙 Місто: ${contact.city || 'не вказано'}

<b>Опис замовлення:</b>
${description}

Все вірно?`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Підтвердити', callback_data: 'confirm_order' },
        { text: '❌ Скасувати', callback_data: 'cancel_order' }
      ]
    ]
  };

  await sendMessage(chatId, confirmText, { reply_markup: keyboard });
}

/**
 * Підтвердження замовлення
 */
async function handleConfirmOrder(chatId, messageId, userId) {
  const state = userStates.get(userId);

  if (!state || state.step !== 'confirm') {
    await editMessage(chatId, messageId, '❌ Помилка: стан замовлення не знайдено');
    return;
  }

  try {
    const contact = state.data.contact;
    const shopOrder = state.data.shopOrder;

    // Підготовка даних замовлення
    let orderData = {
      customer: {
        name: contact.name,
        email: contact.email || '',
        phone: contact.phone,
        city: contact.city || ''
      },
      service: state.data.service,
      pricing: {
        totalPrice: shopOrder ? shopOrder.total : 0,
        currency: 'UAH'
      },
      payment: {
        method: 'pending'
      },
      notes: state.data.description || ''
    };

    // Якщо є замовлення з магазину, додаємо деталі товарів
    if (shopOrder && shopOrder.items) {
      orderData.items = shopOrder.items;
      orderData.notes = `Замовлення з магазину:\n${shopOrder.items.map(item =>
        `${item.name} x${item.quantity} - ${item.price * item.quantity} ₴`
      ).join('\n')}\n\n${orderData.notes}`;
    }

    // Створити замовлення через Order model
    const order = await Order.create(orderData);

    // Сповіщення адміністратору
    if (ADMIN_CHAT_ID) {
      let adminText = `📦 <b>НОВЕ ЗАМОВЛЕННЯ #${order.orderNumber}</b>

<b>👤 Клієнт:</b>
Ім'я: ${contact.name}
Телефон: ${contact.phone}
Email: ${contact.email || 'не вказано'}
Місто: ${contact.city || 'не вказано'}

<b>🛠 Послуга:</b> ${state.data.service}`;

      // Додаємо список товарів для замовлень з магазину
      if (shopOrder && shopOrder.items) {
        adminText += `\n\n<b>🛍 Товари:</b>\n`;
        shopOrder.items.forEach(item => {
          adminText += `• ${item.name} x${item.quantity} - ${item.price * item.quantity} ₴\n`;
        });
        adminText += `\n<b>💰 Всього:</b> ${shopOrder.total} ₴`;
      }

      if (state.data.description) {
        adminText += `\n\n<b>📝 Опис:</b>\n${state.data.description}`;
      }

      adminText += `\n\n<b>🕐 Час:</b> ${new Date().toLocaleString('uk-UA')}`;

      await sendMessage(ADMIN_CHAT_ID, adminText);
    }

    const successText = `✅ <b>Замовлення прийнято!</b>

📋 Номер замовлення: <b>#${order.orderNumber}</b>

Ми зв'яжемося з вами найближчим часом для уточнення деталей${shopOrder ? '' : ' та розрахунку вартості'}.

Дякуємо за замовлення! 🎉`;

    await editMessage(chatId, messageId, successText, {
      reply_markup: getMainMenuKeyboard()
    });

    userStates.delete(userId);

  } catch (error) {
    console.error('Помилка створення замовлення:', error);
    await editMessage(chatId, messageId, '❌ Помилка при створенні замовлення. Спробуйте пізніше.');
  }
}

/**
 * Скасування замовлення
 */
async function handleCancelOrder(chatId, messageId, userId) {
  userStates.delete(userId);
  await editMessage(chatId, messageId, '❌ Замовлення скасовано.', {
    reply_markup: getMainMenuKeyboard()
  });
}

/**
 * Мої замовлення
 */
async function handleMyOrders(chatId, messageId, userId) {
  try {
    // Використовуємо Order model для пошуку
    const orders = await Order.findByPhone(userId.toString());

    if (orders.length === 0) {
      await editMessage(chatId, messageId, `📦 У вас поки немає замовлень.

Створіть нове замовлення, щоб почати! 🚀`, {
        reply_markup: getMainMenuKeyboard()
      });
      return;
    }

    const statusEmojis = {
      'new': '🆕', 'accepted': '✅', 'in-progress': '⏳',
      'ready': '📦', 'completed': '✅'
    };

    let text = '📦 <b>Ваші замовлення:</b>\n\n';

    orders.forEach((order, index) => {
      const status = statusEmojis[order.status] || '❓';
      text += `${index + 1}. ${status} #${order.orderNumber}\n`;
      text += `   Послуга: ${order.service}\n`;
      text += `   Дата: ${new Date(order.createdAt).toLocaleDateString('uk-UA')}\n\n`;
    });

    await editMessage(chatId, messageId, text, {
      reply_markup: getMainMenuKeyboard()
    });

  } catch (error) {
    console.error('Помилка отримання замовлень:', error);
    await editMessage(chatId, messageId, '❌ Помилка при отриманні замовлень');
  }
}

/**
 * Прайс-лист
 */
async function handlePriceList(chatId, messageId) {
  const text = `💰 <b>Прайс-лист Pro Jet</b>

<b>✨ Лазерне гравіювання:</b>
• Дерево - від 150 ₴
• Метал - від 200 ₴
• Шкіра - від 180 ₴
• Пластик - від 120 ₴

<b>✂️ Лазерна різка:</b>
• Фанера (3мм) - від 50 ₴/м
• Акрил - від 80 ₴/м
• МДФ - від 60 ₴/м

<b>🎨 Дизайн:</b>
• Простий - від 300 ₴
• Середній - від 500 ₴
• Складний - від 1000 ₴

<i>* Остаточна ціна залежить від складності та обсягу роботи</i>`;

  await editMessage(chatId, messageId, text, {
    reply_markup: getMainMenuKeyboard()
  });
}

/**
 * Про нас
 */
async function handleAbout(chatId, messageId) {
  const text = `ℹ️ <b>Про Pro Jet</b>

Ми - команда професіоналів у сфері лазерного гравіювання та різки! 🎯

<b>Наші переваги:</b>
✅ Сучасне обладнання
✅ Швидке виконання
✅ Висока якість
✅ Доступні ціни
✅ Індивідуальний підхід

<b>Працюємо з матеріалами:</b>
🌳 Дерево • 🔩 Метал • 👜 Шкіра • 🎨 Акрил

Створюємо унікальні вироби для бізнесу та особистого користування! 🚀`;

  await editMessage(chatId, messageId, text, {
    reply_markup: getMainMenuKeyboard()
  });
}

/**
 * Контакти
 */
async function handleContacts(chatId, messageId) {
  const text = `📞 <b>Контакти Pro Jet</b>

<b>Телефон:</b> +380 XX XXX XX XX
<b>Email:</b> info@projet.ua
<b>Сайт:</b> https://projet.ua

<b>Графік роботи:</b>
Пн-Пт: 9:00 - 18:00
Сб: 10:00 - 15:00
Нд: вихідний

Чекаємо на ваші замовлення! 🎉`;

  await editMessage(chatId, messageId, text, {
    reply_markup: getMainMenuKeyboard()
  });
}

/**
 * Обробка webhook update (для Express роуту)
 */
async function processWebhookUpdate(update) {
  try {
    // Обробка повідомлень
    if (update.message) {
      const chatId = update.message.chat.id;
      const userId = update.message.from.id;
      const text = update.message.text;
      const firstName = update.message.from.first_name;

      if (text && text.startsWith('/start')) {
        const param = text.replace('/start', '').trim();
        if (param.startsWith('order_')) {
          const orderDataEncoded = param.replace('order_', '');
          return await handleShopOrder(chatId, userId, firstName, orderDataEncoded);
        } else {
          return await handleStart(chatId, firstName);
        }
      }
      if (text === '/help') {
        return await handleHelp(chatId);
      }
      if (text === '/cancel') {
        userStates.delete(userId);
        return await sendMessage(chatId, '❌ Дія скасована', {
          reply_markup: getMainMenuKeyboard()
        });
      }

      if (update.message.contact) {
        return await handleContactInfo(chatId, userId, update.message);
      }

      const state = userStates.get(userId);
      if (state) {
        if (state.step === 'get_contact_info') {
          return await handleContactInfo(chatId, userId, update.message);
        }
        if (state.step === 'get_email') {
          return await handleEmail(chatId, userId, text);
        }
        if (state.step === 'get_city') {
          return await handleCity(chatId, userId, text);
        }
        if (state.step === 'get_description') {
          return await handleDescription(chatId, userId, text);
        }
      }
    }

    // Обробка callback query
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;
      const userId = callbackQuery.from.id;
      const data = callbackQuery.data;

      await bot.answerCallbackQuery(callbackQuery.id);

      if (data === 'main_menu') await handleMainMenu(chatId, messageId);
      else if (data === 'new_order') await handleNewOrder(chatId, messageId, userId);
      else if (data.startsWith('service_')) {
        const service = data.replace('service_', '');
        await handleServiceChoice(chatId, messageId, userId, service);
      }
      else if (data === 'confirm_order') await handleConfirmOrder(chatId, messageId, userId);
      else if (data === 'cancel_order') await handleCancelOrder(chatId, messageId, userId);
      else if (data === 'my_orders') await handleMyOrders(chatId, messageId, userId);
      else if (data === 'price_list') await handlePriceList(chatId, messageId);
      else if (data === 'about') await handleAbout(chatId, messageId);
      else if (data === 'contacts') await handleContacts(chatId, messageId);
    }

  } catch (error) {
    console.error('Помилка обробки update:', error);
    throw error;
  }
}

/**
 * Відправка сповіщення про нове замовлення з сайту
 * (замінює старий telegram.js)
 */
async function sendOrderNotification(orderData) {
  if (!bot) {
    console.warn('⚠️  Telegram бот не ініціалізований');
    return false;
  }

  if (!ADMIN_CHAT_ID) {
    console.warn('⚠️  TELEGRAM_CHAT_ID не встановлений');
    return false;
  }

  try {
    let message = '📦 <b>НОВЕ ЗАМОВЛЕННЯ З САЙТУ</b>\n\n';

    // Контактна інформація
    message += '<b>👤 Клієнт:</b>\n';
    message += `Ім'я: ${orderData.customer.name}\n`;
    message += `Email: ${orderData.customer.email}\n`;
    message += `Телефон: ${orderData.customer.phone || 'не вказано'}\n\n`;

    // Послуга
    const serviceNames = {
      'engraving': 'Лазерне гравіювання',
      'cutting': 'Лазерна різка',
      'design': 'Дизайн',
      'shop': 'Магазин товарів'
    };
    message += `<b>🛠 Послуга:</b> ${serviceNames[orderData.service] || orderData.service}\n\n`;

    // Деталі послуги
    if (orderData.engraving) {
      message += '<b>📝 Гравіювання:</b>\n';
      message += `Матеріал: ${orderData.engraving.material}\n`;
      message += `Розмір: ${orderData.engraving.size}\n`;
      message += `Кількість: ${orderData.engraving.quantity}\n\n`;
    }

    if (orderData.cutting) {
      message += '<b>✂️ Різка:</b>\n';
      message += `Матеріал: ${orderData.cutting.material}\n`;
      message += `Довжина: ${orderData.cutting.length} м\n`;
      message += `Деталей: ${orderData.cutting.detailCount}\n\n`;
    }

    // Ціна
    if (orderData.pricing) {
      message += '<b>💰 Вартість:</b>\n';
      message += `${orderData.pricing.totalPrice} ${orderData.pricing.currency || 'UAH'}\n\n`;
    }

    // Коментарі
    if (orderData.notes) {
      message += '<b>📝 Коментарі:</b>\n';
      message += `${orderData.notes}\n\n`;
    }

    // Час
    message += `<i>Час отримання: ${new Date().toLocaleString('uk-UA')}</i>`;

    await sendMessage(ADMIN_CHAT_ID, message);

    console.log('✅ Замовлення відправлено у Telegram');
    return true;
  } catch (error) {
    console.error('❌ Помилка при відправці у Telegram:', error.message);
    return false;
  }
}

module.exports = {
  initBot,
  bot,
  processWebhookUpdate,
  sendMessage,
  sendOrderNotification
};
