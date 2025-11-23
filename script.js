/* ============================================
   PRO JET - СКРИПТИ (JavaScript)
   Оновлено: ФІКСОВАНА ЦІНА ЗА ПРОДУКТ ДЛЯ ГРАВІЮВАННЯ
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

        submitBtn.disabled = true;
        submitBtn.textContent = 'Відправлення...';
        statusDiv.innerHTML = '';
        statusDiv.className = 'form-status';

        try {
            // !!! Змініть 'https://formspree.io/f/xyzqwert' на вашу реальну кінцеву точку Formspree або інший бекенд !!!
            const response = await fetch('https://formspree.io/f/xyzqwert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    message: data.message,
                    _subject: `Нова заявка від ${data.name}`
                })
            });

            if (response.ok) {
                statusDiv.className = 'form-status success';
                statusDiv.innerHTML = '✅ Спасибі! Ваша заявка відправлена. Ми зв\'яжемось з вами найближчим часом.';
                form.reset();
                setTimeout(() => { statusDiv.innerHTML = ''; }, 5000);
            } else {
                statusDiv.className = 'form-status error';
                statusDiv.innerHTML = '❌ Помилка відправки. Спробуйте ще раз.';
            }
        } catch (error) {
            console.error('Помилка:', error);
            statusDiv.className = 'form-status error';
            statusDiv.innerHTML = '❌ Помилка з\'єднання. Напишіть нам на kilativ100@gmail.com або позвоніть +38 (067) 617-06-19';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
}

// ============================================
// КАРУСЕЛЬ (ЛОГІКА ЗАЛИШАЄТЬСЯ)
// ============================================

let currentSlide = 0;
let totalSlides = 6;
let autoplayInterval;

function initCarousel() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    
    const slides = track.querySelectorAll('.carousel-slide');
    if (slides.length > 0) {
        totalSlides = slides.length;
    }

    createIndicators();
    updateCarousel();
    startAutoplay();
    
    document.getElementById('prevBtn').addEventListener('click', prevSlide);
    document.getElementById('nextBtn').addEventListener('click', nextSlide);
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
    
    const slideWidth = track.firstElementChild ? track.firstElementChild.offsetWidth : 0;
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
// ФІКСОВАНА ВАРТІСТЬ ЗА ОДИНИЦЮ ГРАВІЮВАННЯ
// [Площа в мм², Складність (%), Базова ціна за 1 шт (грн), Опис]
// ============================================
const engravingFixedPrices = {
    S_Low: [2500, 30, 60.00, 'S - Малий логотип (до 25 см²)'],   
    M_Avg: [10000, 50, 120.00, 'M - Етикетка/Напис (до 100 см²)'], 
    L_High: [40000, 80, 250.00, 'L - Повна графіка/Зображення (до 400 см²)'],
};


// ============================================
// ТАБЛИЦІ МАТЕРІАЛІВ ДЛЯ РІЗАННЯ
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
    const cm2 = mm2 / 100;
    return cm2.toFixed(0) + ' см²';
}


// ============================================
// КАЛЬКУЛЯТОР ГРАВІЮВАННЯ (НОВА ФІКСОВАНА ЛОГІКА)
// ============================================

function calculateEngraving() {
    const materialValue = document.getElementById('engMaterial').value;
    const productValue = document.getElementById('engProduct').value;
    const quantity = parseInt(document.getElementById('engQuantity').value); 
    
    if (!materialValue || !productValue || !quantity || quantity <= 0) {
        alert('Будь ласка, заповніть усі поля коректно');
        return;
    }

    const material = engravingMaterials[materialValue];
    const productDetails = engravingFixedPrices[productValue]; 
    
    const area_mm2 = productDetails[0];
    const complexity = productDetails[1];
    const basePricePerUnit = productDetails[2]; 
    const productText = productDetails[3];

    // Крок 1: Розрахунок часу (для інформації)
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
    document.getElementById('resultEngTime').textContent = formatTime(Ttotal);
    
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
                document.getElementById(resultId).style.display = 'none';
            });
        }
    });
});

console.log('Pro Jet Scripts Loaded Successfully ✅');
