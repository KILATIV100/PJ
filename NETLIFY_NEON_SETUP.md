# Налаштування Pro Jet на Netlify з Neon PostgreSQL

## 📋 Що потрібно:

1. **Neon Account** - вже є (kilativ100@gmail.com)
2. **Netlify Account** - потрібен для деплою
3. **Telegram Bot** - вже налаштований

---

## 🚀 Крок 1: Налаштування Neon Database

### 1.1 Створення бази даних

1. Зайдіть на [neon.tech](https://neon.tech)
2. Натисніть "Add new database" або оберіть існуючу
3. Скопіюйте **Connection String** (має вигляд: `postgresql://user:password@...`)

### 1.2 Отримання Database URL

У Neon консолі знайдіть Connection String в форматі:
```
postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## 🌐 Крок 2: Налаштування Netlify

### 2.1 Підключення GitHub репозиторію

1. Зайдіть на [netlify.com](https://netlify.com)
2. Натисніть "Add new site" → "Import an existing project"
3. Оберіть GitHub та репозиторій `KILATIV100/PJ`
4. Оберіть branch: `claude/add-telegram-config-01DGvadaJyogYePX9Mubj5AP`

### 2.2 Build Settings

```
Build command: npm install
Publish directory: .
Functions directory: netlify/functions
```

### 2.3 Environment Variables

У Netlify Dashboard → Site settings → Environment variables додайте:

```env
DATABASE_URL=postgresql://your-neon-connection-string
TELEGRAM_BOT_TOKEN=8431861415:AAF7UZOEXy_1XstmE5x--ahJPSxwQ9QtOfA
TELEGRAM_CHAT_ID=7363233852
INIT_TOKEN=pro-jet-init-2024
NODE_ENV=production
```

**ВАЖЛИВО:** Замініть `DATABASE_URL` на ваш реальний Connection String з Neon!

---

## 🔧 Крок 3: Ініціалізація бази даних

Після першого деплою потрібно ініціалізувати таблиці:

### Спосіб 1: Через браузер
```
https://your-site.netlify.app/.netlify/functions/init-db?token=pro-jet-init-2024
```

### Спосіб 2: Через curl
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/init-db \
  -H "x-init-token: pro-jet-init-2024"
```

---

## ✅ Крок 4: Перевірка роботи

### 4.1 Health Check
```
https://your-site.netlify.app/.netlify/functions/health
```

Відповідь має бути:
```json
{
  "status": "OK",
  "database": "Connected",
  "message": "Pro Jet API is running"
}
```

### 4.2 Створення тестового замовлення

```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "Тест",
      "email": "test@example.com",
      "phone": "+380501234567",
      "city": "Київ",
      "address": "вул. Тестова 1"
    },
    "service": "engraving",
    "pricing": {
      "totalPrice": 100,
      "currency": "UAH"
    },
    "notes": "Тестове замовлення"
  }'
```

**Ви маєте отримати повідомлення в Telegram!** 📱

---

## 📊 Структура API Endpoints

Всі endpoints доступні через Netlify Functions:

### Health Check
```
GET /.netlify/functions/health
```

### Замовлення
```
POST   /.netlify/functions/orders              # Створити замовлення
GET    /.netlify/functions/orders/:id          # Отримати замовлення
GET    /.netlify/functions/orders/by-email/:email  # Замовлення за email
PUT    /.netlify/functions/orders/:id          # Оновити замовлення
```

### Ініціалізація БД
```
POST   /.netlify/functions/init-db?token=xxx   # Ініціалізувати таблиці
```

---

## 🔄 Як працює Netlify + Neon

### Netlify Functions (Serverless)
- Кожен запит до API запускає окрему функцію
- Немає постійно працюючого сервера
- Автоматичне масштабування

### Neon PostgreSQL
- Serverless PostgreSQL база даних
- Автоматично "засинає" коли не використовується
- Швидко "прокидається" при запиті

### Telegram Bot
- Використовує HTTP API (без polling)
- Працює через `axios.post` до Telegram API
- Підходить для serverless середовища

---

## 🛠 Troubleshooting

### Помилка: "DATABASE_URL not set"
→ Перевірте Environment Variables в Netlify

### Помилка: "TELEGRAM_BOT_TOKEN not set"
→ Додайте Telegram credentials в Netlify Environment Variables

### База даних не підключається
→ Переконайтеся, що Connection String правильний та містить `?sslmode=require`

### Функції не працюють
→ Перевірте Netlify Functions logs в Dashboard → Functions

---

## 📱 Telegram Integration

Бот автоматично відправляє повідомлення при кожному новому замовленні.

Формат повідомлення:
```
📦 НОВЕ ЗАМОВЛЕННЯ

👤 Клієнт:
Ім'я: ...
Email: ...
Телефон: ...

📍 Адреса доставки:
...

💰 Сума замовлення:
... UAH

📋 Номер замовлення: PJ-XXX-XXX
```

---

## 🎉 Готово!

Тепер ваш сайт працює на:
- ✅ Netlify (безкоштовний хостинг + CDN)
- ✅ Neon PostgreSQL (serverless база даних)
- ✅ Telegram Bot (автоматичні сповіщення)

Всі зміни в GitHub автоматично деплояться на Netlify! 🚀
