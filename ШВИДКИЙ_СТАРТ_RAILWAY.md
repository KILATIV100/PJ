# 🚀 Швидкий старт: Netlify + Railway PostgreSQL + Telegram

## ✅ Що потрібно зробити:

### Крок 1: Отримати DATABASE_URL з Railway

1. Зайдіть на https://railway.app
2. Відкрийте ваш PostgreSQL проект
3. Перейдіть на вкладку **PostgreSQL**
4. Натисніть **Connect** → **Database URL**
5. Скопіюйте URL (виглядає так):
   ```
   postgresql://postgres:password@containers-us-west-xxx.railway.app:6543/railway
   ```

### Крок 2: Деплой на Netlify

1. Йдіть на https://netlify.com
2. Натисніть **"Add new site"** → **"Import an existing project"**
3. Виберіть **GitHub** → репозиторій **KILATIV100/PJ**
4. Branch: `claude/add-telegram-config-01DGvadaJyogYePX9Mubj5AP`
5. Netlify автоматично знайде налаштування з `netlify.toml`

### Крок 3: Додати Environment Variables в Netlify

У Netlify Dashboard → **Site settings** → **Environment variables** → **Add a variable**

Додайте ці змінні (одну за одною):

```
DATABASE_URL = postgresql://ваш-url-з-railway
TELEGRAM_BOT_TOKEN = 8431861415:AAF7UZOEXy_1XstmE5x--ahJPSxwQ9QtOfA
TELEGRAM_CHAT_ID = 7363233852
INIT_TOKEN = pro-jet-init-2024
NODE_ENV = production
```

**ВАЖЛИВО:** Замініть `DATABASE_URL` на реальний з Railway!

### Крок 4: Deploy

Netlify автоматично задеплоїть сайт після додавання змінних.

### Крок 5: Ініціалізуйте базу даних

Після деплою відкрийте в браузері:
```
https://ваш-сайт.netlify.app/.netlify/functions/init-db?token=pro-jet-init-2024
```

**Відповідь має бути:**
```json
{
  "success": true,
  "message": "Database tables initialized successfully"
}
```

### Крок 6: Перевірте роботу

Відкрийте:
```
https://ваш-сайт.netlify.app/.netlify/functions/health
```

**Має показати:**
```json
{
  "status": "OK",
  "database": "Connected",
  "message": "Pro Jet API is running"
}
```

---

## 🎉 Готово!

Тепер при кожному замовленні ви будете отримувати повідомлення в Telegram! 📱

---

## 📊 API Endpoints

```
GET    /.netlify/functions/health                      # Health check
POST   /.netlify/functions/orders                      # Створити замовлення
GET    /.netlify/functions/orders/:id                  # Отримати замовлення
GET    /.netlify/functions/orders/by-email/:email      # Замовлення за email
PUT    /.netlify/functions/orders/:id                  # Оновити замовлення
POST   /.netlify/functions/init-db?token=xxx           # Ініціалізувати БД
```

---

## 🧪 Тестування

Створіть тестове замовлення через curl або Postman:

```bash
curl -X POST https://ваш-сайт.netlify.app/.netlify/functions/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "Тест Тестович",
      "email": "test@example.com",
      "phone": "+380501234567",
      "city": "Київ",
      "address": "вул. Тестова 1"
    },
    "service": "engraving",
    "pricing": {
      "totalPrice": 150,
      "currency": "UAH"
    },
    "notes": "Тестове замовлення для перевірки"
  }'
```

**Ви маєте отримати повідомлення в Telegram!** 📲

---

## 💡 Переваги Railway + Netlify:

- **Безкоштовно** - обидва сервіси мають generous free tier
- **Автоматичний деплой** - Push до GitHub = автоматичний деплой
- **Швидко** - CDN від Netlify + швидка БД від Railway
- **Надійно** - Обидва сервіси мають high uptime
- **Масштабування** - Автоматичне при навантаженні

---

## 🔧 Troubleshooting

### Помилка: "DATABASE_URL not set"
→ Перевірте Environment Variables в Netlify Dashboard

### Помилка: "Connection timeout"
→ Переконайтеся, що DATABASE_URL правильний з Railway

### База даних не підключається
→ Перевірте, що Railway PostgreSQL працює (не в sleep mode)

### Функції повертають 500
→ Перевірте Netlify Functions logs: Dashboard → Functions → View logs

---

## 📱 Формат Telegram повідомлення

```
📦 НОВЕ ЗАМОВЛЕННЯ

👤 Клієнт:
Ім'я: Тест Тестович
Email: test@example.com
Телефон: +380501234567

📍 Адреса доставки:
Київ, вул. Тестова 1

🛠 Послуга:
engraving

💰 Сума замовлення:
150 UAH

📝 Коментарі:
Тестове замовлення для перевірки

📋 Номер замовлення: PJ-XXX-XXX

Час: 02.12.2025, 14:30:00
```

---

## 🎯 Наступні кроки

1. ✅ Перевірте що всі endpoints працюють
2. ✅ Створіть тестове замовлення
3. ✅ Переконайтеся що Telegram повідомлення приходять
4. 🔜 Підключіть фронтенд до нових API endpoints
5. 🔜 Налаштуйте custom domain (якщо потрібно)

---

Успіхів! 🚀
