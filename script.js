/* ============================================
   PRO JET - СКРИПТИ (JavaScript)
   Оновлено: Інтеграція бізнес-логіки калькуляторів
   ============================================ */

// ============================================
// МОБІЛЬНЕ МЕНЮ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');

    menuToggle.addEventListener('click', function() {
        menuToggle.classList.toggle('active');
        nav.classList.toggle('active');
    });

    // Закрити меню при клацанні на посилання
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            menuToggle.classList.remove('active');
            nav.classList.remove('active');
        });
    });
    
    // Ініціалізація каруселі
    initCarousel();

    // Ініціалізація форми контактів
    setupContactForm();
});

// ============================================
// ОБРОБКА ФОРМИ КОНТАКТІВ
// ============================================

function setupContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Отримуємо дані форми
        const formData = new FormData(this);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            message: formData.get('message')
        };

        const statusDiv = document.getElementById('formStatus');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;

        // Покажемо статус загрузки
        submitBtn.disabled = true;
        submitBtn.textContent = 'Відправлення...';
        statusDiv.innerHTML = '';
        statusDiv.className = 'form-status';

        try {
            // !!! Змініть 'https://formspree.io/f/xyzqwert' на вашу реальну кінцеву точку Formspree або інший бекенд !!!
            const response = await fetch('https://formspree.io/f/xyzqwert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    message: data.message,
                    _subject: `Нова заявка від ${data.name}`
                })
            });

            if (response.ok) {
                // Успіх!
                statusDiv.className = 'form-status success';
                statusDiv.innerHTML = '✅ Спасибі! Ваша заявка відправлена. Ми зв\'яжемось з вами найближчим часом.';
                
                // Очищуємо форму
                form.reset();
                
                // Приховуємо статус через 5 секунд
                setTimeout(() => {
                    statusDiv.innerHTML = '';
                }, 5000);
            } else {
                // Помилка від сервера
                statusDiv.className = 'form-status error';
                statusDiv.innerHTML = '❌ Помилка відправки. Спробуйте ще раз.';
            }
        } catch (error) {
            console.error('Помилка:', error);
            
            // Якщо помилка з мережею, показуємо альтернативне повідомлення
            statusDiv.className = 'form-status error';
            statusDiv.innerHTML = '❌ Помилка з\'єднання. Напишіть нам на kilativ100@gmail.com або позвоніть +38 (067) 617-06-19';
        } finally {
            // Повертаємо кнопку в нормальний стан
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
}

// ============================================
// КАРУСЕЛЬ
// ============================================

let currentSlide = 0;
let totalSlides = 6;
let autoplayInterval;

function initCarousel() {
    // Перевірка, чи існує трек каруселі
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    
    // Оновлюємо totalSlides, якщо слайдів більше
    const slides = track.querySelectorAll('.carousel-slide');
    if (slides.length > 0) {
        totalSlides = slides.length;
    }

    createIndicators();
    updateCarousel();
    startAutoplay();
    
    // Слухачі для кнопок
    document.getElementById('prevBtn').addEventListener('click', prevSlide);
    document.getElementById('nextBtn').addEventListener('click', nextSlide);
}

function createIndicators() {
    const indicatorsContainer = document.getElementById('indicators');
    if (!indicatorsContainer) return;

    // Очистити існуючі індикатори
    indicatorsContainer.innerHTML = ''; 

    for (let i = 0; i < totalSlides; i++) {
        const indicator = document.createElement('div');
        indicator.className = 'carousel-indicator';
        if (i === 0) indicator.classList.add('active');
        indicator.addEventListener('click', () => goToSlide(i));
        indicatorsContainer.appendChild(indicator);
    }
}

function updateCarousel() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    
    // Визначення ширини слайду
    const slideWidth = track.firstElementChild ? track.firstElementChild.offsetWidth : 0;
    const gap = 20; // Дивіться styles.css .carousel-track gap

    // Встановлення позиції
    track.style.transform = `translateX(-${currentSlide * (slideWidth + gap)}px)`;
    
    // Оновити індикатори
    document.querySelectorAll('.carousel-indicator').forEach((ind, i) => {
        ind.classList.toggle('active', i === currentSlide);
    });
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateCarousel();
    resetAutoplay();
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateCarousel();
    resetAutoplay();
}

function goToSlide(n) {
    currentSlide = n % totalSlides;
    updateCarousel();
    resetAutoplay();
}

function startAutoplay() {
    autoplayInterval = setInterval(() => {
        nextSlide();
    }, 4000); // 4 секунди
}

function resetAutoplay() {
    clearInterval(autoplayInterval);
    startAutoplay();
}


// ============================================
// БІЗНЕС-ЛОГІКА ТА ТАБЛИЦІ ЦІН
// ============================================

// ============================================
// ТАБЛИЦІ МАТЕРІАЛІВ ДЛЯ ГРАВІЮВАННЯ (за мм²)
// [Матеріал]: { T_100_MM2: час_1мм2_100%_заповн (хв/мм²), C_MARZH: маржа_за_1мм2 (грн/мм²) }
// ============================================
const engravingMaterials = {
    plywood: { name: 'Фанера', T_100_MM2: 0.0002, C_MARZH: 0.0005 },
    acrylic: { name: 'Акрил (темний)', T_100_MM2: 0.00015, C_MARZH: 0.0004 },
    leather: { name: 'Шкіра/Фетр', T_100_MM2: 0.0001, C_MARZH: 0.0003 },
    texon: { name: 'Таксон', T_100_MM2: 0.00025, C_MARZH: 0.0006 },
    aluminum: { name: 'Анодований алюміній', T_100_MM2: 0.00005, C_MARZH: 0.0008 },
};

// ============================================
// ТАБЛИЦІ МАТЕРІАЛІВ ДЛЯ РІЗАННЯ (за метри)
// [Матеріал-Товщина]: { T_RIZU: час_різання_1м (хв/м), C_MARZH: маржа_за_1м (грн/м) }
// ============================================
const cuttingMaterials = {
    plywood3: { name: 'Фанера 3.0 мм', T_RIZU: 8.33, C_MARZH: 8.00 },
    plywood4: { name: 'Фанера 4.0 мм', T_RIZU: 16.67, C_MARZH: 12.00 },
    acrylic3: { name: 'Акрил 3.0 мм', T_RIZU: 6.67, C_MARZH: 6.00 },
    leather3: { name: 'Шкіра/Фетр 3.0 мм', T_RIZU: 2.50, C_MARZH: 3.50 },
    texon08: { name: 'Таксон 0.8 мм', T_RIZU: 2.50, C_MARZH: 3.00 },
    texon2: { name: 'Таксон 2.0 мм', T_RIZU: 10.00, C_MARZH: 7.00 },
};

// ============================================
// КОНСТАНТИ (Бізнес-логіка)
// ============================================

const generalConstants = {
    Ctime: 0.83,      // грн/хв (C_CHAS)
    Cmin: 150.0,      // грн (Мінімальне замовлення)
    Kopt: 15,         // % знижка за великі обсяги
};

const engravingConstants = {
    optimalArea: 100000, // мм² для застосування знижки (1000 см²)
};

const cuttingConstants = {
    Cdetail: 0.50,    // грн/шт (Штраф за дрібний об'єкт)
    optimalLength: 500 // м для застосування знижки
};

// ============================================
// ДОПОМІЖНІ ФУНКЦІЇ
// ============================================

function formatCurrency(value) {
    return new Intl.NumberFormat('uk-UA', {
        style: 'currency',
        currency: 'UAH',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function formatTime(minutes) {
    if (minutes < 1) {
        return (minutes * 60).toFixed(0) + ' сек';
    }
    const totalSeconds = Math.round(minutes * 60);
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    if (min >= 60) {
        const hours = Math.floor(min / 60);
        const remainingMin = min % 60;
        return `${hours} год ${remainingMin} хв`;
    }
    return `${min} хв ${sec} сек`;
}

function formatArea(mm2) {
    if (mm2 < 10000) {
        return mm2.toFixed(0) + ' мм²';
    }
    const cm2 = mm2 / 100;
    return cm2.toFixed(0) + ' см²';
}


// ============================================
// КАЛЬКУЛЯТОР ГРАВІЮВАННЯ
// ============================================

function calculateEngraving() {
    const materialValue = document.getElementById('engMaterial').value;
    const area = parseFloat(document.getElementById('engArea').value); // мм²
    const complexity = parseFloat(document.getElementById('engComplexity').value);

    // Валідація
    if (!materialValue || !area || area <= 0 || !complexity) {
        alert('Будь ласка, заповніть усі поля коректно');
        return;
    }

    const material = engravingMaterials[materialValue];
    
    // Крок 1: Розрахунок часу гравіювання (в хвилинах)
    // T_заг = Площа × T_100_MM2 × (Складність / 100)
    const Ttotal = area * material.T_100_MM2 * (complexity / 100);

    // Крок 2: Собівартість за часом
    // C_собіварт = C_час × T_заг
    const Ccost = generalConstants.Ctime * Ttotal;

    // Крок 3: Розрахунок маржі
    // C_марж_заг = C_МАРЖ × Площа
    const Cmargin_total = material.C_MARZH * area;

    // Крок 4: Загальна попередня вартість
    // C_поперед = C_собіварт + C_марж_заг
    const Cpreliminary = Ccost + Cmargin_total;

    // Крок 5: Перевірка мінімуму
    let Cfinal = Cpreliminary;
    const minOrderApplied = (Cpreliminary < generalConstants.Cmin);
    if (minOrderApplied) {
        Cfinal = generalConstants.Cmin;
    }

    // Крок 6: Застосування знижки
    let Cfinal_result = Cfinal;
    let discount = 0;
    if (area >= engravingConstants.optimalArea) {
        discount = Cfinal * (generalConstants.Kopt / 100);
        Cfinal_result = Cfinal - discount;
    }

    // Відображення результату
    const resultDiv = document.getElementById('engravingResult');
    
    document.getElementById('resultEngMaterial').textContent = material.name;
    document.getElementById('resultEngArea').textContent = formatArea(area) + ` (${complexity}% заповнення)`;
    document.getElementById('resultEngTime').textContent = formatTime(Ttotal);
    
    // Додаємо інформацію про знижку, якщо вона є
    let finalNote = `* Мінімальне замовлення: ${formatCurrency(generalConstants.Cmin)}. `;
    if (minOrderApplied) {
        finalNote = `*** Застосовано мінімальне замовлення ${formatCurrency(generalConstants.Cmin)}. Попередня вартість: ${formatCurrency(Cpreliminary)}.`;
    }
    if (discount > 0) {
        finalNote += ` *** Застосовано оптову знижку ${generalConstants.Kopt}% (${formatCurrency(discount)}).`;
    }
    
    // Вартість за мм2 - покажемо лише маржу (як в оригінальній логіці)
    document.getElementById('resultEngUnitPrice').textContent = formatCurrency(material.C_MARZH) + ' / мм²'; 
    document.getElementById('resultEngTotal').textContent = formatCurrency(Cfinal_result);
    resultDiv.querySelector('.calc-note').innerHTML = finalNote;
    
    resultDiv.style.display = 'block';
    
    // Скролл до результату
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// КАЛЬКУЛЯТОР РІЗАННЯ
// ============================================

function calculateCutting() {
    const materialValue = document.getElementById('cutMaterial').value;
    const length = parseFloat(document.getElementById('cutLength').value);
    const details = parseInt(document.getElementById('cutDetails').value);

    // Валідація
    if (!materialValue || !length || length <= 0) {
        alert('Будь ласка, заповніть усі поля коректно');
        return;
    }

    const material = cuttingMaterials[materialValue];

    // Крок 1: Розрахунок часу різання (T_заг)
    const Ttotal = material.T_RIZU * length;

    // Крок 2: Базова вартість 1 метра (Собівартість + Маржа)
    // C_базова = (C_час × T_різу) + C_марж
    const Cbase = (generalConstants.Ctime * material.T_RIZU) + material.C_MARZH;

    // Крок 3: Вартість різання за довжину
    // C_різ = C_базова × Довжина різу
    const Ccut = Cbase * length;

    // Крок 4: Вартість штрафу за деталі
    // C_штраф = C_др × Кількість отворів/об'єктів
    const Cpenalty = cuttingConstants.Cdetail * details;

    // Крок 5: Загальна попередня вартість
    // C_поперед = C_різ + C_штраф
    const Cpreliminary = Ccut + Cpenalty;

    // Крок 6: Перевірка мінімуму
    let Cfinal = Cpreliminary;
    const minOrderApplied = (Cpreliminary < generalConstants.Cmin);
    if (minOrderApplied) {
        Cfinal = generalConstants.Cmin;
    }

    // Крок 7: Застосування знижки
    let Cfinal_result = Cfinal;
    let discount = 0;
    if (length >= cuttingConstants.optimalLength) {
        discount = Cfinal * (generalConstants.Kopt / 100);
        Cfinal_result = Cfinal - discount;
    }

    // Відображення результату
    const resultDiv = document.getElementById('cuttingResult');
    
    document.getElementById('resultCutMaterial').textContent = material.name;
    document.getElementById('resultCutLength').textContent = length.toFixed(2) + ' м';
    document.getElementById('resultCutPrice').textContent = formatCurrency(Ccut);
    document.getElementById('resultCutPenalty').textContent = formatCurrency(Cpenalty);
    document.getElementById('resultCutTotal').textContent = formatCurrency(Cfinal_result);

    // Додаємо інформацію про знижку/мінімалку
    let finalNote = `* Мінімальне замовлення: ${formatCurrency(generalConstants.Cmin)}. Знижка від ${cuttingConstants.optimalLength} м: ${generalConstants.Kopt}%.`;
    if (minOrderApplied) {
        finalNote = `*** Застосовано мінімальне замовлення ${formatCurrency(generalConstants.Cmin)}. Попередня вартість: ${formatCurrency(Cpreliminary)}.`;
    }
    if (discount > 0) {
        finalNote += ` *** Застосовано оптову знижку ${generalConstants.Kopt}% (${formatCurrency(discount)}).`;
    }
    
    resultDiv.querySelector('.calc-note').innerHTML = finalNote;

    resultDiv.style.display = 'block';
    
    // Скролл до результату
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// ОБРОБКА ФОРМ ТА СКРИТТЯ РЕЗУЛЬТАТІВ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Обробка клавіші Enter у формах
    if (document.getElementById('engravingForm')) {
        document.getElementById('engravingForm').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                calculateEngraving();
            }
        });
    }

    if (document.getElementById('cuttingForm')) {
        document.getElementById('cuttingForm').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                calculateCutting();
            }
        });
    }

    // Видалення результату при зміні даних
    const inputs = ['engMaterial', 'engArea', 'engComplexity', 'cutMaterial', 'cutLength', 'cutDetails'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(element.type === 'select-one' ? 'change' : 'input', function() {
                const resultId = id.startsWith('eng') ? 'engravingResult' : 'cuttingResult';
                document.getElementById(resultId).style.display = 'none';
            });
        }
    });
});

console.log('Pro Jet Scripts Loaded Successfully ✅');
