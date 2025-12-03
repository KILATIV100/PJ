/**
 * Telegram Bot для прийому замовлень
 * Використовується через Webhook для Netlify Functions
 */

const axios = require('axios');
const { query, generateOrderNumber } = require('./db');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Тимчасове сховище для conversation state (в production використовувати Redis/DB)
const userStates = new Map();

/**
 * Відправка повідомлення
 */
async function sendMessage(chatId, text, options = {}) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: chatId,
      text: text,
      parse_mode: options.parse_mode || 'HTML',
      reply_markup: options.reply_markup || undefined,
      disable_web_page_preview: options.disable_web_page_preview || true
    });
    return response.data;
  } catch (error) {
    console.error('Помилка відправки повідомлення:', error.message);
    throw error;
  }
}

/**
 * Редагування повідомлення
 */
async function editMessage(chatId, messageId, text, options = {}) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`;
    const response = await axios.post(url, {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: options.parse_mode || 'HTML',
      reply_markup: options.reply_markup || undefined
    });
    return response.data;
  } catch (error) {
    console.error('Помилка редагування повідомлення:', error.message);
    throw error;
  }
}

/**
 * Відповідь на callback query
 */
async function answerCallbackQuery(callbackQueryId, text = '') {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`;
    await axios.post(url, {
      callback_query_id: callbackQueryId,
      text: text
    });
  } catch (error) {
    console.error('Помилка відповіді на callback:', error.message);
  }
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
      [
        { text: '✨ Лазерне гравіювання', callback_data: 'service_engraving' }
      ],
      [
        { text: '✂️ Лазерна різка', callback_data: 'service_cutting' }
      ],
      [
        { text: '🎨 Дизайн', callback_data: 'service_design' }
      ],
      [
        { text: '🛍 Магазин товарів', callback_data: 'service_shop' }
      ],
      [
        { text: '⬅️ Назад', callback_data: 'main_menu' }
      ]
    ]
  };
}

/**
 * Обробка команди /start
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
 * Обробка команди /help
 */
async function handleHelp(chatId) {
  const text = `📖 <b>Довідка по боту</b>

<b>Доступні команди:</b>
/start - Головне меню
/help - Ця довідка
/neworder - Створити нове замовлення
/myorders - Мої замовлення
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
 * Обробка callback - головне меню
 */
async function handleMainMenu(chatId, messageId) {
  const text = `🏠 <b>Головне меню</b>

Виберіть потрібну опцію:`;

  await editMessage(chatId, messageId, text, {
    reply_markup: getMainMenuKeyboard()
  });
}

/**
 * Обробка нового замовлення
 */
async function handleNewOrder(chatId, messageId, userId) {
  const text = `🛒 <b>Нове замовлення</b>

Виберіть тип послуги, яка вас цікавить:`;

  // Ініціалізуємо стан користувача
  userStates.set(userId, {
    step: 'choose_service',
    data: {}
  });

  await editMessage(chatId, messageId, text, {
    reply_markup: getServiceMenuKeyboard()
  });
}

/**
 * Обробка вибору послуги
 */
async function handleServiceChoice(chatId, messageId, userId, service) {
  const serviceNames = {
    'engraving': 'Лазерне гравіювання',
    'cutting': 'Лазерна різка',
    'design': 'Дизайн',
    'shop': 'Магазин товарів'
  };

  const serviceName = serviceNames[service];

  // Оновлюємо стан користувача
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
    keyboard: [
      [{ text: '📱 Відправити контакт', request_contact: true }]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  };

  await editMessage(chatId, messageId, text);

  // Відправляємо окреме повідомлення з клавіатурою
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

  // Якщо відправлено контакт через кнопку
  if (message.contact) {
    contactData = {
      name: `${message.contact.first_name} ${message.contact.last_name || ''}`.trim(),
      phone: message.contact.phone_number,
      email: '', // потрібно буде запитати окремо
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

  // Якщо відправлено текстом
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

  // Перевірка валідності
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

  if (!state || state.step !== 'get_email') {
    return;
  }

  // Проста валідація email
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

  if (!state || state.step !== 'get_city') {
    return;
  }

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
 * Обробка опису замовлення
 */
async function handleDescription(chatId, userId, description) {
  const state = userStates.get(userId);

  if (!state || state.step !== 'get_description') {
    return;
  }

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

  await sendMessage(chatId, confirmText, {
    reply_markup: keyboard
  });
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
    // Генеруємо номер замовлення
    const orderNumber = await generateOrderNumber();

    const contact = state.data.contact;

    // Зберігаємо замовлення в БД
    const result = await query(
      `INSERT INTO orders (
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        customer_city,
        service,
        notes,
        total_price,
        currency,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        orderNumber,
        contact.name,
        contact.email || '',
        contact.phone,
        contact.city || '',
        state.data.service,
        state.data.description,
        0, // ціна буде розрахована пізніше
        'UAH',
        'new'
      ]
    );

    const order = result.rows[0];

    // Відправляємо сповіщення адміністратору
    if (ADMIN_CHAT_ID) {
      const adminText = `📦 <b>НОВЕ ЗАМОВЛЕННЯ #${orderNumber}</b>

<b>👤 Клієнт:</b>
Ім'я: ${contact.name}
Телефон: ${contact.phone}
Email: ${contact.email || 'не вказано'}
Місто: ${contact.city || 'не вказано'}

<b>🛠 Послуга:</b> ${state.data.service}

<b>📝 Опис:</b>
${state.data.description}

<b>🕐 Час:</b> ${new Date().toLocaleString('uk-UA')}`;

      await sendMessage(ADMIN_CHAT_ID, adminText);
    }

    // Повідомляємо клієнта
    const successText = `✅ <b>Замовлення прийнято!</b>

📋 Номер замовлення: <b>#${orderNumber}</b>

Ми зв'яжемося з вами найближчим часом для уточнення деталей та розрахунку вартості.

Дякуємо за замовлення! 🎉`;

    await editMessage(chatId, messageId, successText, {
      reply_markup: getMainMenuKeyboard()
    });

    // Очищаємо стан
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
    // Отримуємо замовлення користувача (за chat_id або phone)
    const result = await query(
      `SELECT * FROM orders
       WHERE customer_phone LIKE $1 OR customer_email LIKE $2
       ORDER BY created_at DESC
       LIMIT 10`,
      [`%${userId}%`, `%${userId}%`]
    );

    if (result.rows.length === 0) {
      await editMessage(chatId, messageId, `📦 У вас поки немає замовлень.

Створіть нове замовлення, щоб почати! 🚀`, {
        reply_markup: getMainMenuKeyboard()
      });
      return;
    }

    const statusEmojis = {
      'new': '🆕',
      'accepted': '✅',
      'in-progress': '⏳',
      'ready': '📦',
      'completed': '✅'
    };

    let text = '📦 <b>Ваші замовлення:</b>\n\n';

    result.rows.forEach((order, index) => {
      const status = statusEmojis[order.status] || '❓';
      text += `${index + 1}. ${status} #${order.order_number}\n`;
      text += `   Послуга: ${order.service}\n`;
      text += `   Дата: ${new Date(order.created_at).toLocaleDateString('uk-UA')}\n`;
      text += `   Статус: ${order.status}\n\n`;
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
🌳 Дерево
🔩 Метал
👜 Шкіра
🎨 Акрил
📄 Картон та багато іншого!

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

<b>Адреса:</b>
м. Київ, вул. Прикладна, 1

Чекаємо на ваші замовлення! 🎉`;

  await editMessage(chatId, messageId, text, {
    reply_markup: getMainMenuKeyboard()
  });
}

/**
 * Головний обробник повідомлень
 */
async function handleUpdate(update) {
  try {
    // Обробка повідомлення
    if (update.message) {
      const chatId = update.message.chat.id;
      const userId = update.message.from.id;
      const text = update.message.text;
      const firstName = update.message.from.first_name;

      // Команди
      if (text === '/start') {
        return await handleStart(chatId, firstName);
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

      // Обробка контакту
      if (update.message.contact) {
        return await handleContactInfo(chatId, userId, update.message);
      }

      // Обробка стану conversation
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

      // Якщо немає активного стану, показуємо меню
      return await sendMessage(chatId, 'Використовуйте /start для початку роботи', {
        reply_markup: getMainMenuKeyboard()
      });
    }

    // Обробка callback query
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;
      const userId = callbackQuery.from.id;
      const data = callbackQuery.data;

      // Відповідаємо на callback
      await answerCallbackQuery(callbackQuery.id);

      // Обробка callback
      if (data === 'main_menu') {
        return await handleMainMenu(chatId, messageId);
      }
      if (data === 'new_order') {
        return await handleNewOrder(chatId, messageId, userId);
      }
      if (data.startsWith('service_')) {
        const service = data.replace('service_', '');
        return await handleServiceChoice(chatId, messageId, userId, service);
      }
      if (data === 'confirm_order') {
        return await handleConfirmOrder(chatId, messageId, userId);
      }
      if (data === 'cancel_order') {
        return await handleCancelOrder(chatId, messageId, userId);
      }
      if (data === 'my_orders') {
        return await handleMyOrders(chatId, messageId, userId);
      }
      if (data === 'price_list') {
        return await handlePriceList(chatId, messageId);
      }
      if (data === 'about') {
        return await handleAbout(chatId, messageId);
      }
      if (data === 'contacts') {
        return await handleContacts(chatId, messageId);
      }
    }

  } catch (error) {
    console.error('Помилка обробки update:', error);
    throw error;
  }
}

module.exports = {
  handleUpdate,
  sendMessage
};
