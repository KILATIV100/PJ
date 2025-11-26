# 🚀 Railway Deployment - Швидкий Старт

**Розгорніть backend на Railway за 15 хвилин!**

---

## ⚡ 5 КРОКІВ

### Крок 1️⃣: Завантажте на GitHub
```bash
# У папці проекту:
git remote add origin https://github.com/YOUR_USERNAME/pro-jet.git
git branch -M main
git push -u origin main
```

### Крок 2️⃣: Railway Dashboard
```
1. Перейдіть https://railway.app
2. Натисніть "Start building"
3. Виберіть "Deploy from GitHub"
4. Дозвольте доступ до GitHub
5. Виберіть свій "pro-jet" репозиторій
6. Натисніть "Deploy"
```

Railway автоматично:
- ✅ Встановить залежності
- ✅ Запустить build
- ✅ Розгорне сервер

### Крок 3️⃣: Додайте MongoDB (якщо потребується)
```
1. У Railway Dashboard: "New Service"
2. Виберіть "Database" → "MongoDB"
3. "Deploy"
```

**ЛИ! У вас уже є MongoDB на Railway!**

### Крок 4️⃣: Отримайте Backend URL

```
1. Railway Dashboard → Backend (Node.js)
2. Натисніть "Deployments"
3. Скопіюйте URL (приклад):
   https://pro-jet-production.up.railway.app
```

### Крок 5️⃣: Оновіть Frontend API URL

**Варіант А: Автоматично (Рекомендується)**
```bash
node update-api-url.js https://pro-jet-production.up.railway.app
```

**Варіант Б: Вручну**
- Откройте: `checkout.html`, `auth.html`, `profile.html`, `shop.js`
- Замініть: `http://localhost:3000` → `https://pro-jet-production.up.railway.app`

**Потім:**
```bash
git add .
git commit -m "Update API URLs for Railway"
git push
```

Railway автоматично розгорне нову версію! ✨

---

## ✅ ГОТОВО!

Ваша система live:
- Backend: `https://pro-jet-production.up.railway.app`
- Frontend: локально або на Netlify
- MongoDB: Railway Cloud

---

## 🧪 Тестування

### Перевірте Backend
```bash
curl https://pro-jet-production.up.railway.app/api/health
```

Повинна бути відповідь:
```json
{"status":"OK"...}
```

### Тестуйте Frontend
```
1. Откройте локальний сайт (або Netlify)
2. Перейдіть на Shop
3. Додайте товари
4. Натисніть "Оформити"
5. Заповніть форму
6. "Оформити Замовлення"

✅ Замовлення повинно бути створено!
```

---

## 📊 Дивіться Логи Railway

```
1. Railway Dashboard → Backend
2. Натисніть "View Logs"
3. Там ви побачите все що відбувається
```

---

## 🎉 ВСЕ!

Backend розгорнутий на Railway! 🚀

Для деталей див. **RAILWAY_DEPLOYMENT.md**
