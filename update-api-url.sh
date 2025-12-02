#!/bin/bash

# Script для оновлення API URLs у всіх frontend файлах
# Використання: ./update-api-url.sh https://your-railway-url.up.railway.app

if [ -z "$1" ]; then
    echo "❌ Помилка: Потрібен Railway URL"
    echo ""
    echo "Використання:"
    echo "  ./update-api-url.sh https://your-railway-url.up.railway.app"
    echo ""
    echo "Приклад:"
    echo "  ./update-api-url.sh https://pro-jet-production.up.railway.app"
    exit 1
fi

RAILWAY_URL=$1
OLD_URL="http://localhost:3000"
NEW_URL="${RAILWAY_URL}/api"

echo "🔄 Оновлення API URLs..."
echo "Старий URL: $OLD_URL"
echo "Новий URL: $NEW_URL"
echo ""

# Файли для оновлення
FILES=(
    "checkout.html"
    "auth.html"
    "profile.html"
    "shop.js"
    "script.js"
)

for FILE in "${FILES[@]}"; do
    if [ -f "$FILE" ]; then
        echo "📝 Оновлення $FILE..."
        sed -i "s|$OLD_URL|$RAILWAY_URL|g" "$FILE"
        if grep -q "$RAILWAY_URL" "$FILE"; then
            echo "✅ $FILE успішно оновлено"
        else
            echo "⚠️  $FILE не містить API URL"
        fi
    else
        echo "⚠️  Файл $FILE не знайдений"
    fi
done

echo ""
echo "✅ Оновлення завершено!"
echo ""
echo "Наступні кроки:"
echo "1. Перевірте файли вручну (git diff)"
echo "2. Закомітьте зміни: git add . && git commit -m 'Update API URLs for Railway'"
echo "3. Виконайте push: git push"
echo "4. Railway автоматично розгорне нову версію"
