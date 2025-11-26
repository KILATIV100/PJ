#!/usr/bin/env node

/**
 * Скрипт для оновлення API URLs у всіх frontend файлах
 * Використання:
 *   node update-api-url.js https://your-railway-url.up.railway.app
 */

const fs = require('fs');
const path = require('path');

// Отримати Railway URL з аргументів командного рядку
const railwayUrl = process.argv[2];

if (!railwayUrl) {
    console.error('❌ Помилка: Потрібен Railway URL');
    console.error('');
    console.error('Використання:');
    console.error('  node update-api-url.js https://your-railway-url.up.railway.app');
    console.error('');
    console.error('Приклад:');
    console.error('  node update-api-url.js https://pro-jet-production.up.railway.app');
    process.exit(1);
}

const oldUrl = 'http://localhost:3000';
const newUrl = railwayUrl;

console.log('🔄 Оновлення API URLs...');
console.log(`Старий URL: ${oldUrl}`);
console.log(`Новий URL: ${newUrl}`);
console.log('');

// Файли для оновлення
const files = [
    'checkout.html',
    'auth.html',
    'profile.html',
    'shop.js',
    'script.js',
    'admin.html'
];

let updatedCount = 0;
let notFoundCount = 0;

files.forEach(filename => {
    const filepath = path.join(__dirname, filename);

    // Перевірити, чи існує файл
    if (!fs.existsSync(filepath)) {
        console.warn(`⚠️  Файл ${filename} не знайдений`);
        notFoundCount++;
        return;
    }

    try {
        // Прочитати вміст файлу
        let content = fs.readFileSync(filepath, 'utf8');

        // Перевірити, чи містить файл старий URL
        if (!content.includes(oldUrl)) {
            console.warn(`⚠️  ${filename} не містить URL ${oldUrl}`);
            return;
        }

        // Замінити URL
        content = content.replace(
            new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            newUrl
        );

        // Записати оновлений контент
        fs.writeFileSync(filepath, content, 'utf8');

        console.log(`✅ ${filename} успішно оновлено`);
        updatedCount++;
    } catch (error) {
        console.error(`❌ Помилка при оновленні ${filename}: ${error.message}`);
    }
});

console.log('');
console.log('═══════════════════════════════════════');
console.log(`✅ Оновлено файлів: ${updatedCount}`);
console.log(`⚠️  Не знайдено файлів: ${notFoundCount}`);
console.log('═══════════════════════════════════════');
console.log('');
console.log('📝 Наступні кроки:');
console.log('1. Перевірте файли вручну: git diff');
console.log('2. Закомітьте зміни:');
console.log('   git add .');
console.log('   git commit -m "Update API URLs for Railway deployment"');
console.log('3. Виконайте push:');
console.log('   git push');
console.log('4. Railway автоматично розгорне нову версію ✨');
console.log('');
console.log('🎉 Готово!');
