# Налаштування Pro Jet на Netlify з Railway PostgreSQL

## 📋 Що потрібно:

1. **Railway PostgreSQL** - вже є ✅
2. **Netlify Account** - для деплою
3. **Telegram Bot** - вже налаштований ✅

---

## 🗄️ Крок 1: Налаштування Railway PostgreSQL

### 1.1 Отримання Database URL

1. Зайдіть на [railway.app](https://railway.app)
2. Відкрийте ваш проект з PostgreSQL
3. Клікніть на **PostgreSQL service**
4. Перейдіть на вкладку **Connect**
5. Скопіюйте **Database URL** (Postgres Connection URL)

Формат URL:
```
postgresql://postgres:password@containers-us-west-xxx.railway.app:6543/railway
```

### 1.2 Перевірка підключення (опціонально)

Ви можете перевірити підключення локально через psql:
```bash
psql postgresql://your-database-url
```

---

## 🌐 Крок 2: Налаштування Netlify

### 2.1 Підключення GitHub репозиторію

1. Зайдіть на [netlify.com](https://netlify.com)
2. Натисніть **"Add new site"** → **"Import an existing project"**
3. Оберіть **GitHub** та репозиторій `KILATIV100/PJ`
4. Оберіть branch: `claude/add-telegram-config-01DGvadaJyogYePX9Mubj5AP`

### 2.2 Build Settings

Netlify автоматично використає налаштування з `netlify.toml`:

```toml
[build]
  command = "npm install"
  functions = "netlify/functions"
  publish = "."
```

### 2.3 Environment Variables

У Netlify Dashboard → **Site settings** → **Environment variables** додайте:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:...@railway.app:6543/railway` |
| `TELEGRAM_BOT_TOKEN` | `8431861415:AAF7UZOEXy_1XstmE5x--ahJPSxwQ9QtOfA` |
| `TELEGRAM_CHAT_ID` | `7363233852` |
| `INIT_TOKEN` | `pro-jet-init-2024` |
| `NODE_ENV` | `production` |

**ВАЖЛИВО:** Замініть `DATABASE_URL` на ваш реальний URL з Railway!

---

## 🔧 Крок 3: Ініціалізація бази даних

Після першого деплою на Netlify потрібно створити таблиці в Railway PostgreSQL.

### Спосіб 1: Через браузер
```
https://your-site.netlify.app/.netlify/functions/init-db?token=pro-jet-init-2024
```

### Спосіб 2: Через curl
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/init-db \
  -H "x-init-token: pro-jet-init-2024"
```

**Очікувана відповідь:**
```json
{
  "success": true,
  "message": "Database tables initialized successfully",
  "timestamp": "2025-12-02T12:00:00.000Z"
}
```

---

## ✅ Крок 4: Перевірка роботи

### 4.1 Health Check
```
https://your-site.netlify.app/.netlify/functions/health
```

**Очікувана відповідь:**
```json
{
  "status": "OK",
  "database": "Connected",
  "message": "Pro Jet API is running",
  "environment": "production"
}
```

### 4.2 Створення тестового замовлення

```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "Іван Тестовий",
      "email": "test@example.com",
      "phone": "+380501234567",
      "city": "Київ",
      "address": "вул. Хрещатик 1"
    },
    "service": "engraving",
    "pricing": {
      "totalPrice": 100,
      "currency": "UAH"
    },
    "notes": "Тестове замовлення"
  }'
```

**Ви маєте отримати:**
1. ✅ JSON відповідь з деталями замовлення
2. ✅ Повідомлення в Telegram! 📱

---

## 📊 Структура API Endpoints

Всі endpoints доступні через Netlify Functions:

### Health Check
```
GET /.netlify/functions/health
```

### Замовлення
```
POST   /.netlify/functions/orders                    # Створити замовлення
GET    /.netlify/functions/orders/:id                # Отримати замовлення по ID
GET    /.netlify/functions/orders/by-email/:email    # Отримати замовлення за email
PUT    /.netlify/functions/orders/:id                # Оновити замовлення (notes)
```

### Ініціалізація БД
```
POST   /.netlify/functions/init-db?token=xxx         # Створити таблиці
```

---

## 🏗️ Архітектура проекту

```
Pro Jet Application
│
├── Frontend (HTML/CSS/JS)
│   └── Netlify CDN (статичні файли)
│
├── Backend (Netlify Functions)
│   ├── orders.js        → Railway PostgreSQL
│   ├── health.js        → Railway PostgreSQL
│   └── init-db.js       → Railway PostgreSQL
│
├── Database (Railway PostgreSQL)
│   └── orders table
│
└── Telegram Bot
    └── HTTP API (повідомлення про замовлення)
```

---

## 🔄 Як працює Netlify + Railway

### Netlify Functions (Serverless)
- Кожен API запит запускає окрему функцію
- Немає постійно працюючого сервера
- Автоматичне масштабування
- Оплата тільки за використання

### Railway PostgreSQL
- Повноцінна PostgreSQL база даних
- Завжди доступна (не засинає як Neon free tier)
- Швидке підключення
- Automatic backups

### Telegram Bot
- Використовує HTTP API (axios)
- Працює без polling
- Ідеально для serverless

---

## 🛠 Troubleshooting

### Помилка: "DATABASE_URL not set"
**Рішення:**
1. Перевірте Environment Variables в Netlify Dashboard
2. Переконайтеся що змінна `DATABASE_URL` додана
3. Redeploy сайт після додавання змінної

### Помилка: "Connection timeout"
**Рішення:**
1. Переконайтеся що Railway PostgreSQL працює
2. Перевірте що DATABASE_URL правильний
3. Перевірте firewall налаштування в Railway

### База даних не підключається
**Рішення:**
1. Перевірте що URL містить правильний порт (зазвичай 6543)
2. Переконайтеся що SSL налаштований (`ssl: { rejectUnauthorized: false }`)
3. Спробуйте підключитися через `psql` локально

### Telegram повідомлення не приходять
**Рішення:**
1. Перевірте `TELEGRAM_BOT_TOKEN` в Environment Variables
2. Перевірте `TELEGRAM_CHAT_ID` (має бути числом)
3. Перевірте що бот не заблокований
4. Перевірте Netlify Functions logs

### Функції повертають 500
**Рішення:**
1. Перегляньте Netlify Functions logs: Dashboard → Functions
2. Перевірте що всі Environment Variables встановлені
3. Перевірте синтаксис в коді функцій

---

## 📱 Telegram Integration

### Формат повідомлення про замовлення:

```
📦 НОВЕ ЗАМОВЛЕННЯ

👤 Клієнт:
Ім'я: Іван Тестовий
Email: test@example.com
Телефон: +380501234567

📍 Адреса доставки:
Київ, вул. Хрещатик 1

🛠 Послуга:
engraving

💰 Сума замовлення:
100 UAH

📝 Коментарі:
Тестове замовлення

📋 Номер замовлення: PJ-12345-ABCD

Час: 02.12.2025, 14:30:00
```

### Як працює:
1. Клієнт створює замовлення через API
2. Замовлення зберігається в Railway PostgreSQL
3. Автоматично відправляється повідомлення в Telegram
4. Ви отримуєте сповіщення на телефон

---

## 🎉 Переваги нового стеку

### Railway PostgreSQL
- ✅ Повноцінна PostgreSQL (не обмежена)
- ✅ Швидке підключення
- ✅ Automatic backups
- ✅ Легке масштабування

### Netlify
- ✅ Безкоштовний CDN
- ✅ Автоматичний деплой з GitHub
- ✅ HTTPS out of the box
- ✅ Serverless functions
- ✅ 100GB bandwidth/місяць (free tier)

### Загальні переваги
- 💰 Майже безкоштовно для малих проектів
- 🚀 Швидко та надійно
- 🔄 Автоматичний CI/CD
- 📈 Легко масштабувати

---

## 🎯 Наступні кроки

1. ✅ Перевірте що health endpoint повертає "Connected"
2. ✅ Створіть тестове замовлення
3. ✅ Переконайтеся що Telegram працює
4. 🔜 Оновіть фронтенд для роботи з новими API endpoints
5. 🔜 Налаштуйте custom domain (опціонально)
6. 🔜 Додайте Google Analytics (опціонально)

---

## 📚 Додаткові ресурси

- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Railway Docs](https://docs.railway.app/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

Готово! Ваш сайт працює на modern serverless stack! 🎉
