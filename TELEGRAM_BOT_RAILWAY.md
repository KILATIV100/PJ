# 🚂 Налаштування Telegram Бота на Railway

Повний гайд по deployment інтерактивного Telegram бота на Railway.com з підключенням PostgreSQL.

---

## 📋 Зміст

1. [Огляд](#огляд)
2. [Створення бота](#створення-бота)
3. [Підключення Railway](#підключення-railway)
4. [Налаштування бази даних](#налаштування-бази-даних)
5. [Змінні оточення](#змінні-оточення)
6. [Deployment](#deployment)
7. [Встановлення Webhook](#встановлення-webhook)
8. [Тестування](#тестування)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Огляд

### Переваги Railway:

✅ **Безкоштовний план** - $5 credits/місяць
✅ **Автоматичний deployment** з GitHub
✅ **Вбудована PostgreSQL** база даних
✅ **HTTPS** з автоматичним SSL
✅ **Логи в real-time**
✅ **Webhook підтримка** для Telegram бота
✅ **Постійне з'єднання** (не serverless)

### Архітектура:

```
Telegram → Webhook → Railway (Express) → PostgreSQL
            HTTPS      Node.js            Railway DB
```

---

## 🤖 КРОК 1: Створення Telegram бота

### 1.1 Відкрийте BotFather

1. Знайдіть `@BotFather` в Telegram
2. Відправте `/start`
3. Відправте `/newbot`

### 1.2 Налаштуйте бота

**Назва:**
```
ProJet Orders Bot
```

**Username (має закінчуватися на "bot"):**
```
projet_orders_bot
```

### 1.3 Збережіть токен

BotFather надасть токен:
```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz_123456
```

⚠️ **ВАЖЛИВО:** Збережіть цей токен - він знадобиться!

### 1.4 Отримайте Chat ID адміністратора

**Спосіб 1:** Через `@userinfobot`
1. Напишіть `@userinfobot`
2. Відправте `/start`
3. Збережіть ваш ID

**Спосіб 2:** Через API
```
https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
```

---

## 🚂 КРОК 2: Підключення до Railway

### 2.1 Створіть акаунт

1. Перейдіть на [railway.app](https://railway.app/)
2. Натисніть **Start a New Project**
3. Увійдіть через GitHub

### 2.2 Створіть новий проект

1. **New Project** → **Deploy from GitHub repo**
2. Виберіть ваш репозиторій `KILATIV100/PJ`
3. Railway автоматично визначить Node.js проект

### 2.3 Налаштуйте deployment

Railway автоматично:
- Встановить залежності (`npm install`)
- Запустить сервер (`npm start`)
- Надасть HTTPS URL

---

## 💾 КРОК 3: Налаштування бази даних

### 3.1 Додайте PostgreSQL

1. У вашому проекті натисніть **+ New**
2. Виберіть **Database** → **Add PostgreSQL**
3. Railway автоматично створить базу даних

### 3.2 Отримайте DATABASE_URL

1. Відкрийте PostgreSQL service
2. Перейдіть на вкладку **Variables**
3. Скопіюйте значення `DATABASE_URL`:

```
postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway
```

### 3.3 Створіть таблицю orders

1. Відкрийте **Data** tab
2. Або підключіться через клієнт (pgAdmin, TablePlus)
3. Виконайте SQL:

```sql
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(255) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50) NOT NULL,
  customer_city VARCHAR(255),
  customer_address TEXT,
  service VARCHAR(100) NOT NULL,
  service_details JSONB,
  notes TEXT,
  total_price NUMERIC(10, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'UAH',
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  status VARCHAR(50) DEFAULT 'new',
  files JSONB,
  views INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Індекси
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

---

## ⚙️ КРОК 4: Змінні оточення

### 4.1 Відкрийте Variables

1. У вашому Railway проекті
2. Виберіть ваш service
3. Перейдіть на вкладку **Variables**

### 4.2 Додайте змінні

Додайте наступні змінні:

```env
# Node.js
NODE_ENV=production
PORT=3000

# Database (автоматично створюється Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Telegram Bot
TELEGRAM_BOT_TOKEN=ваш_токен_з_botfather
TELEGRAM_CHAT_ID=ваш_chat_id

# Webhook URL (замініть на ваш Railway URL)
WEBHOOK_URL=https://ваш-проект.up.railway.app

# Railway автоматично надає:
RAILWAY_STATIC_URL=https://ваш-проект.up.railway.app
```

### 4.3 Отримайте Railway URL

Після першого deployment Railway надасть URL:
```
https://projet-production.up.railway.app
```

Додайте його як `WEBHOOK_URL`.

---

## 🚀 КРОК 5: Deployment

### 5.1 Автоматичний deployment

Railway автоматично деплоїть при push до GitHub:

```bash
git add -A
git commit -m "Додано Telegram бот"
git push origin main
```

### 5.2 Перевірка deployment

1. Railway Dashboard → **Deployments**
2. Перевірте логи build:
   ```
   ✅ Installing dependencies...
   ✅ Building project...
   ✅ Starting server...
   ```

3. Перевірте статус:
   ```
   ✅ Deploy successful
   ```

### 5.3 Перевірка здоров'я сервера

Відкрийте у браузері:
```
https://ваш-проект.up.railway.app/api/health
```

Очікувана відповідь:
```json
{
  "status": "OK",
  "timestamp": "2024-12-03T10:00:00.000Z",
  "message": "Pro Jet Backend API is running"
}
```

---

## 🔗 КРОК 6: Встановлення Webhook

### 6.1 Автоматично (рекомендується)

Відкрийте у браузері:
```
https://ваш-проект.up.railway.app/api/telegram/set-webhook
```

Очікувана відповідь:
```json
{
  "success": true,
  "message": "Webhook встановлено успішно!",
  "webhook_url": "https://ваш-проект.up.railway.app/api/telegram/webhook",
  "webhook_info": {
    "url": "https://ваш-проект.up.railway.app/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40
  }
}
```

### 6.2 Вручну (альтернативний спосіб)

Використайте curl:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://ваш-проект.up.railway.app/api/telegram/webhook",
    "allowed_updates": ["message", "callback_query"]
  }'
```

### 6.3 Перевірка webhook

```
https://ваш-проект.up.railway.app/api/telegram/webhook-info
```

Або через API:
```
https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo
```

---

## 🧪 КРОК 7: Тестування

### 7.1 Знайдіть бота

1. Відкрийте Telegram
2. Знайдіть `@projet_orders_bot`
3. Натисніть `/start`

### 7.2 Очікуваний результат

```
👋 Вітаю, Ім'я!

Я бот компанії Pro Jet - вашого партнера у світі
лазерного гравіювання та різки! 🎯

[🛒 Нове замовлення] [📦 Мої замовлення]
[💰 Прайс-лист] [ℹ️ Про нас]
[📞 Контакти]
```

### 7.3 Тест створення замовлення

1. Натисніть `🛒 Нове замовлення`
2. Виберіть `✨ Лазерне гравіювання`
3. Введіть контактні дані:
   ```
   Ім'я: Іван Тестовий
   Телефон: +380501234567
   Email: test@example.com
   Місто: Київ
   ```
4. Опишіть замовлення:
   ```
   Тестове замовлення для перевірки бота
   ```
5. Підтвердіть замовлення

### 7.4 Перевірка результату

✅ Ви отримали підтвердження з номером замовлення
✅ Адмін отримав сповіщення
✅ Замовлення збережено в базі даних

Перевірити в БД:
```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
```

---

## 📊 Моніторинг

### Перегляд логів

1. Railway Dashboard → **Deployments**
2. Виберіть активний deployment
3. Відкрийте **View Logs**

Ви побачите:
```
✅ Telegram бот запущено (webhook mode)
✅ PostgreSQL pool ініціалізовано
🚀 Pro Jet Backend Server запущено
📨 Отримано update від Telegram...
✅ Замовлення створено успішно
```

### Метрики

Railway показує:
- CPU usage
- Memory usage
- Network traffic
- Response time

---

## 🐛 Troubleshooting

### Проблема 1: Бот не відповідає

**Можливі причини:**
- Webhook не встановлено
- Невірний `TELEGRAM_BOT_TOKEN`
- Невірний `WEBHOOK_URL`

**Рішення:**

1. Перевірте webhook:
   ```
   https://ваш-проект.up.railway.app/api/telegram/webhook-info
   ```

2. Перевірте логи Railway:
   ```
   Railway Dashboard → Deployments → View Logs
   ```

3. Перевстановіть webhook:
   ```
   https://ваш-проект.up.railway.app/api/telegram/set-webhook
   ```

### Проблема 2: "Database connection failed"

**Рішення:**

1. Перевірте `DATABASE_URL` в Variables
2. Переконайтеся, що PostgreSQL service запущений
3. Перевірте чи таблиця `orders` існує:
   ```sql
   SELECT tablename FROM pg_tables
   WHERE schemaname = 'public';
   ```

### Проблема 3: "pending_update_count" > 0

Це означає, що є необроблені повідомлення.

**Рішення:**

1. Видаліть webhook:
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
   ```

2. Встановіть знову:
   ```
   https://ваш-проект.up.railway.app/api/telegram/set-webhook
   ```

### Проблема 4: Deployment fails

**Можливі причини:**
- Помилка в коді
- Відсутні залежності
- Неправильний `package.json`

**Рішення:**

1. Перевірте логи build в Railway
2. Перевірте `package.json`:
   ```json
   {
     "scripts": {
       "start": "node server.js"
     }
   }
   ```

3. Локальне тестування:
   ```bash
   npm install
   npm start
   ```

### Проблема 5: ECONNREFUSED при запитах до БД

**Рішення:**

1. Перевірте чи змінна `DATABASE_URL` правильна
2. В Railway Variables використовуйте:
   ```
   ${{Postgres.DATABASE_URL}}
   ```
   (Railway автоматично підставить правильне значення)

---

## 🔐 Безпека

### Важливо:

❌ **НЕ КОММІТЬТЕ** `.env` файл
❌ **НЕ ПУБЛІКУЙТЕ** токени в коді
✅ **ВИКОРИСТОВУЙТЕ** Railway Variables
✅ **HTTPS** включено автоматично
✅ **SSL** сертифікат автоматичний

### .gitignore

Переконайтеся, що `.gitignore` містить:
```
.env
.env.local
.env*.local
node_modules/
```

---

## 💰 Ціни Railway

**Безкоштовний план:**
- $5 credits/місяць
- 500 годин виконання
- Достатньо для бота

**Приблизне споживання:**
- Node.js сервер: ~$0.01/год
- PostgreSQL: ~$0.01/год
- = ~$14.40/міс (при 24/7)

**Підказка:** Використовуйте sleep mode для економії.

---

## 📁 Структура проекту

```
PJ/
├── server.js                    # Основний сервер
├── package.json                 # Залежності
├── railway.json                 # Railway конфігурація
├── routes/
│   ├── telegram.js              # Telegram роути
│   ├── orders.js                # API замовлень
│   └── ...
├── services/
│   ├── telegram-bot.js          # Логіка бота
│   └── telegram.js              # Сповіщення
└── netlify/                     # (ігнорується на Railway)
```

---

## ✅ Чекліст

- [ ] Створено бота через @BotFather
- [ ] Отримано BOT_TOKEN
- [ ] Отримано CHAT_ID
- [ ] Створено проект на Railway
- [ ] Додано PostgreSQL
- [ ] Створено таблицю orders
- [ ] Додано змінні оточення
- [ ] Виконано deploy
- [ ] Встановлено webhook
- [ ] Протестовано команду /start
- [ ] Створено тестове замовлення
- [ ] Адмін отримав сповіщення
- [ ] Перевірено БД

---

## 🚀 Швидкі команди

### Перевірка статусу

```bash
# Health check
curl https://ваш-проект.up.railway.app/api/health

# Webhook info
curl https://ваш-проект.up.railway.app/api/telegram/webhook-info

# Telegram webhook info
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

### Управління webhook

```bash
# Встановити
curl https://ваш-проект.up.railway.app/api/telegram/set-webhook

# Видалити
curl -X DELETE https://ваш-проект.up.railway.app/api/telegram/webhook
```

---

## 📞 Підтримка

### Корисні посилання:

- [Railway Docs](https://docs.railway.app/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Якщо потрібна допомога:

1. Перевірте логи в Railway Dashboard
2. Перевірте webhook info
3. Перевірте змінні оточення
4. Перегляньте код помилки

---

**Версія:** 1.0.0
**Дата:** 03.12.2024

🎉 **Готово!** Ваш Telegram бот працює на Railway!
