/* ============================================
   PRO JET - СКРИПТИ (JavaScript)
   Оновлено: ВИДАЛЕНО ЛОГІКУ ОБРОБКИ ФОРМИ (тепер використовуємо Google Forms)
   ============================================ */

// ============================================
// МОБІЛЬНЕ МЕНЮ ТА ІНІЦІАЛІЗАЦІЯ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');

    menuToggle.addEventListener('click', function() {
        menuToggle.classList.toggle('active');
        nav.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            menuToggle.classList.remove('active');
            nav.classList.remove('active');
        });
    });
    
    initCarousel();
    // ВИДАЛЕНО: setupContactForm(); - більше не потрібна
});

// ============================================
// КАРУСЕЛЬ
// ============================================

let currentSlide = 0;
let totalSlides = 6;
let autoplayInterval;

function initCarousel() {
    const track = document.getElementById('carouselTrack');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    if (!track || !nextBtn || !prevBtn) return;
    
    const slides = track.querySelectorAll('.carousel-slide');
    if (slides.length > 0) {
        totalSlides = slides.length;
    }

    createIndicators();
    updateCarousel();
    startAutoplay();
    
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    
    window.addEventListener('resize', updateCarousel);
}

function createIndicators() {
    const indicatorsContainer = document.getElementById('indicators');
    if (!indicatorsContainer) return;

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
    
    // Перевіряємо, чи є слайди
    const firstSlide = track.querySelector('.carousel-slide');
    if (!firstSlide) return;

    // Визначаємо ширину одного слайда (з урахуванням gap 20px)
    const slideWidth = firstSlide.offsetWidth;
    const gap = 20; 

    track.style.transform = `translateX(-${currentSlide * (slideWidth + gap)}px)`;
    
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
    autoplayInterval = setInterval(() => { nextSlide(); }, 4000); 
}

function resetAutoplay() {
    clearInterval(autoplayInterval);
    startAutoplay();
}


// ============================================
// БІЗНЕС-ЛОГІКА ТА ТАБЛИЦІ ЦІН
// ============================================

// ============================================
// ТАБЛИЦІ МАТЕРІАЛІВ ДЛЯ ГРАВІЮВАННЯ (для розрахунку ЧАСУ)
// ============================================
const engravingMaterials = {
    plywood: { name: 'Фанера', T_100_MM2: 0.0002, C_MARZH: 0.0005 },
    acrylic: { name: 'Акрил (темний)', T_100_MM2: 0.00015, C_MARZH: 0.0004 },
    leather: { name: 'Шкіра/Фетр', T_100_MM2: 0.0001, C_MARZH: 0.0003 },
    texon: { name: 'Таксон', T_100_MM2: 0.00025, C_MARZH: 0.0006 },
    aluminum: { name: 'Анодований алюміній', T_100_MM2: 0.00005, C_MARZH: 0.0008 },
};

// ============================================
// ФІКСОВАНА ВАРТІСТЬ ЗА ОДИНИЦЮ ГРАВІЮВАННЯ (НОВІ РОЗМІРИ)
// [Площа в мм², Складність (%), Базова ціна за 1 шт (грн), Опис]
// ============================================
const engravingFixedPrices = {
    // 1x2 см = 2 см² = 200 мм²
    S_Low: [200, 30, 15.00, 'S - Малий логотип (1x2 см, до 2 см²)'],
    // 3x5 см = 15 см² = 1500 мм²
    M_Avg: [1500, 50, 35.00, 'M - Етикетка/Напис (3x5 см, до 15 см²)'],
    // 6x10 см = 60 см² = 6000 мм²
    L_High: [6000, 80, 80.00, 'L - Повна графіка/Зображення (6x10 см, до 60 см²)'],
    // 10x15 см = 150 см² = 15000 мм²
    XL_Complex: [15000, 100, 150.00, 'XL - Комплексний дизайн (10x15 см, до 150 см²)'],
};


// ============================================
// ТАБЛИЦІ МАТЕРІАЛІВ ДЛЯ РІЗАННЯ
// ============================================
const cuttingMaterials = {
    plywood3: { name: 'Фанера 3.0 мм', T_RIZU: 8.33, C_MARZH: 8.00 },
    plywood4: { name: 'Фанера 4.0 мм', T_RIZU: 16.67, C_MARZH: 12.00 },
    acrylic3: { name: 'Акрил 3.0 мм', T_RIZU: 6.67, C_MARZH: 6.00 },
    acrylic5: { name: 'Акрил 5.0 мм (товстий)', T_RIZU: 12.50, C_MARZH: 10.00 },
    leather3: { name: 'Шкіра/Фетр 3.0 мм', T_RIZU: 2.50, C_MARZH: 3.50 },
    texon08: { name: 'Таксон 0.8 мм', T_RIZU: 2.50, C_MARZH: 3.00 },
    texon2: { name: 'Таксон 2.0 мм', T_RIZU: 10.00, C_MARZH: 7.00 },
    cardboard: { name: 'Картон/Паперопласт', T_RIZU: 1.67, C_MARZH: 2.50 },
};

// ============================================
// КОНСТАНТИ (Бізнес-логіка)
// ============================================

const generalConstants = {
    Ctime: 0.83,      // грн/хв (C_CHAS) - Залишаємо для різання
    Cmin: 150.0,      // грн (Мінімальне замовлення)
    Kopt: 15,         // % знижка за великі обсяги
};

const engravingConstants = {
    optimalQuantity: 1000, // Кількість об'єктів для застосування знижки
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

// ============================================
// КАЛЬКУЛЯТОР ГРАВІЮВАННЯ (НОВА ФІКСОВАНА ЛОГІКА)
// ============================================

function calculateEngraving() {
    const materialValue = document.getElementById('engMaterial').value;
    const productValue = document.getElementById('engProduct').value;
    const quantity = parseInt(document.getElementById('engQuantity').value); 
    
    if (!materialValue || !productValue || isNaN(quantity) || quantity <= 0) {
        alert('Будь ласка, заповніть усі поля коректно');
        return;
    }

    const material = engravingMaterials[materialValue];
    const productDetails = engravingFixedPrices[productValue]; 
    
    const area_mm2 = productDetails[0];
    const complexity = productDetails[1];
    const basePricePerUnit = productDetails[2]; 
    const productText = productDetails[3];

    // Розрахунок часу (для внутрішньої інформації, не відображається)
    const T_per_unit = area_mm2 * material.T_100_MM2 * (complexity / 100);
    const Ttotal = T_per_unit * quantity;

    // Крок 2: Загальна попередня вартість 
    const Cpreliminary = basePricePerUnit * quantity;

    // Крок 3: Перевірка мінімуму
    let Cfinal = Cpreliminary;
    const minOrderApplied = (Cpreliminary < generalConstants.Cmin);
    if (minOrderApplied) {
        Cfinal = generalConstants.Cmin;
    }

    // Крок 4: Застосування знижки (за кількість)
    let Cfinal_result = Cfinal;
    let discount = 0;
    if (quantity >= engravingConstants.optimalQuantity) { 
        discount = Cfinal * (generalConstants.Kopt / 100);
        Cfinal_result = Cfinal - discount;
    }

    // Відображення результату
    const resultDiv = document.getElementById('engravingResult');
    
    document.getElementById('resultEngMaterial').textContent = material.name;
    document.getElementById('resultEngArea').textContent = `${productText} (Кількість ${quantity} шт.)`;
    
    document.getElementById('resultEngTotal').textContent = formatCurrency(Cfinal_result);
    
    // Формування примітки
    let finalNote = `* Вартість 1 шт (базова): ${formatCurrency(basePricePerUnit)}. `;
    if (minOrderApplied) {
        finalNote = `*** Застосовано мінімальне замовлення ${formatCurrency(generalConstants.Cmin)}. Попередня вартість: ${formatCurrency(Cpreliminary)}.`;
    }
    if (discount > 0) {
        finalNote += ` *** Застосовано оптову знижку ${generalConstants.Kopt}% (${formatCurrency(discount)}).`;
    }
    
    resultDiv.querySelector('.calc-note').innerHTML = finalNote;
    resultDiv.style.display = 'block';
    
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// КАЛЬКУЛЯТОР РІЗАННЯ
// ============================================

function calculateCutting() {
    const materialValue = document.getElementById('cutMaterial').value;
    const length = parseFloat(document.getElementById('cutLength').value);
    const details = parseInt(document.getElementById('cutDetails').value);

    if (!materialValue || !length || length <= 0) {
        alert('Будь ласка, заповніть усі поля коректно');
        return;
    }

    const material = cuttingMaterials[materialValue];

    // Крок 1: Розрахунок часу різання (T_заг)
    const Ttotal = material.T_RIZU * length;

    // Крок 2: Базова вартість 1 метра (Собівартість + Маржа)
    const Cbase = (generalConstants.Ctime * material.T_RIZU) + material.C_MARZH;

    // Крок 3: Вартість різання за довжину
    const Ccut = Cbase * length;

    // Крок 4: Вартість штрафу за деталі
    const Cpenalty = cuttingConstants.Cdetail * details;

    // Крок 5: Загальна попередня вартість
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
    
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// ОБРОБКА ФОРМ ТА СКРИТТЯ РЕЗУЛЬТАТІВ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    
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

    const inputs = ['engMaterial', 'engProduct', 'engQuantity', 'cutMaterial', 'cutLength', 'cutDetails'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(element.type === 'select-one' ? 'change' : 'input', function() {
                const resultId = id.startsWith('eng') ? 'engravingResult' : 'cuttingResult';
                const resultElement = document.getElementById(resultId);
                if (resultElement) {
                    resultElement.style.display = 'none';
                }
            });
        }
    });
});

console.log('Pro Jet Scripts Loaded Successfully ✅');
