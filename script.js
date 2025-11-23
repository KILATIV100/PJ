/* ============================================
   PRO JET - СКРИПТИ (JavaScript)
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

    // Ініціалізація калькуляторів
    populateThickness();
    
    // Ініціалізація каруселі
    initCarousel();
});

// ============================================
// КАРУСЕЛЬ
// ============================================

let currentSlide = 0;
let totalSlides = 6;
let autoplayInterval;

function initCarousel() {
    createIndicators();
    updateCarousel();
    startAutoplay();
    
    // Слухачі для кнопок
    document.getElementById('prevBtn').addEventListener('click', prevSlide);
    document.getElementById('nextBtn').addEventListener('click', nextSlide);
}

function createIndicators() {
    const indicatorsContainer = document.getElementById('indicators');
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
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    
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
// ТАБЛИЦІ МАТЕРІАЛІВ ДЛЯ ГРАВІЮВАННЯ
// ============================================

const engravingMaterials = {
    plywood: {
        name: 'Фанера',
        T100: 0.00002,     // хв/мм²
        Cmargin: 0.000005, // грн/мм²
        thicknesses: ['3.0', '4.0', '5.0']
    },
    acrylic: {
        name: 'Акрил (темний)',
        T100: 0.000015,
        Cmargin: 0.000004,
        thicknesses: ['3.0', '4.0']
    },
    leather: {
        name: 'Шкіра/Фетр',
        T100: 0.00001,
        Cmargin: 0.000003,
        thicknesses: ['1.0', '2.0', '3.0']
    },
    texon: {
        name: 'Таксон',
        T100: 0.000025,
        Cmargin: 0.000006,
        thicknesses: ['0.8', '1.0', '2.0']
    },
    aluminum: {
        name: 'Анодований алюміній',
        T100: 0.000005,
        Cmargin: 0.000008,
        thicknesses: ['1.0', '2.0']
    }
};

// ============================================
// ТАБЛИЦІ МАТЕРІАЛІВ ДЛЯ РІЗАННЯ
// ============================================

const cuttingMaterials = {
    plywood3: {
        name: 'Фанера 3.0 мм',
        speedEffective: 120,  // мм/хв
        Cmargin: 8.0          // грн/м
    },
    plywood4: {
        name: 'Фанера 4.0 мм',
        speedEffective: 60,
        Cmargin: 12.0
    },
    acrylic3: {
        name: 'Акрил (чорний) 3.0 мм',
        speedEffective: 150,
        Cmargin: 6.0
    },
    leather3: {
        name: 'Шкіра/Фетр 3.0 мм',
        speedEffective: 400,
        Cmargin: 3.5
    },
    texon08: {
        name: 'Таксон 0.8 мм',
        speedEffective: 400,
        Cmargin: 3.0
    },
    texon2: {
        name: 'Таксон 2.0 мм',
        speedEffective: 100,
        Cmargin: 7.0
    }
};

// ============================================
// КОНСТАНТИ ДЛЯ ГРАВІЮВАННЯ
// ============================================

const engravingConstants = {
    Ctime: 0.83,      // грн/хв
    Cmin: 150.0,      // грн (мінімальне замовлення)
    Cprep: 50.0,      // грн (підготовка)
    Kopt: 15,         // % знижка за великі обсяги
    optimalArea: 100000 // мм² для застосування знижки (була 1000 см² = 100000 мм²)
};

// ============================================
// КОНСТАНТИ ДЛЯ РІЗАННЯ
// ============================================

const cuttingConstants = {
    Ctime: 0.83,      // грн/хв
    Cmin: 150.0,      // грн
    Cprep: 50.0,      // грн
    Cdetail: 0.50,    // грн/шт (штраф за деталі)
    Kopt: 10,         // % знижка
    optimalLength: 500 // м для застосування знижки
};

// ============================================
// ДОПОМІЖНІ ФУНКЦІЇ
// ============================================

function populateThickness() {
    const materialSelect = document.getElementById('engMaterial');
    
    materialSelect.addEventListener('change', function() {
        const thicknessSelect = document.getElementById('engThickness');
        thicknessSelect.innerHTML = '<option value="">-- Виберіть товщину --</option>';
        
        if (this.value && engravingMaterials[this.value]) {
            const thicknesses = engravingMaterials[this.value].thicknesses;
            thicknesses.forEach(thickness => {
                const option = document.createElement('option');
                option.value = thickness;
                option.text = thickness + ' мм';
                thicknessSelect.appendChild(option);
            });
        }
    });
}

function formatCurrency(value) {
    return new Intl.NumberFormat('uk-UA', {
        style: 'currency',
        currency: 'UAH'
    }).format(value);
}

function formatTime(minutes) {
    if (minutes < 1) {
        return Math.round(minutes * 60) + ' сек';
    }
    return minutes.toFixed(2) + ' хв';
}

function formatArea(mm2) {
    if (mm2 < 10000) {
        return mm2.toFixed(0) + ' мм²';
    }
    const cm2 = mm2 / 100;
    return cm2.toFixed(1) + ' см²';
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
    // T_заг = Площа × T_100% × (Складність / 100)
    const Ttotal = area * material.T100 * (complexity / 100);

    // Крок 2: Собівартість за часом
    // C_собіварт = C_час × T_заг
    const Ccost = engravingConstants.Ctime * Ttotal;

    // Крок 3: Маржа
    // C_марж_заг = C_марж × Площа
    const Cmargin_total = material.Cmargin * area;

    // Крок 4: Загальна попередня вартість
    // C_поперед = C_собіварт + C_марж_заг
    const Cprefore = Ccost + Cmargin_total;

    // Крок 5: Перевірка мінімуму
    let Cfinal = Cprefore;
    if (Cprefore < engravingConstants.Cmin) {
        Cfinal = engravingConstants.Cmin;
    }

    // Крок 6: Застосування знижки
    let Cfinal_result = Cfinal;
    if (area >= engravingConstants.optimalArea) {
        Cfinal_result = Cfinal * (1 - engravingConstants.Kopt / 100);
    }

    // Розрахунок вартості за мм²
    const unitPrice = Cfinal_result / area;

    // Відображення результату
    const resultDiv = document.getElementById('engravingResult');
    document.getElementById('resultEngMaterial').textContent = material.name;
    document.getElementById('resultEngArea').textContent = formatArea(area);
    document.getElementById('resultEngTime').textContent = formatTime(Ttotal);
    document.getElementById('resultEngUnitPrice').textContent = formatCurrency(material.Cmargin * 100) + '/мм²';
    document.getElementById('resultEngTotal').textContent = formatCurrency(Cfinal_result);
    
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

    // Крок 1: Розрахунок часу різання
    // T_різу = 1000 / Швидкість_ефективна (хв/м)
    const Tcut = 1000 / material.speedEffective / 60; // перетворюємо в хвилини

    // Крок 2: Базова вартість 1 метра
    // C_базова = (C_час × T_різу) + C_марж
    const Cbase = (cuttingConstants.Ctime * Tcut) + material.Cmargin;

    // Крок 3: Вартість різання за довжину
    // C_різ = C_базова × Довжина різу
    const Ccut = Cbase * length;

    // Крок 4: Вартість штрафу за деталі
    // C_штраф = C_др × Кількість отворів/об'єктів
    const Cpenalty = cuttingConstants.Cdetail * details;

    // Крок 5: Загальна попередня вартість
    // C_поперед = C_різ + C_штраф
    const Cprefore = Ccut + Cpenalty;

    // Крок 6: Перевірка мінімуму
    let Cfinal = Cprefore;
    if (Cprefore < cuttingConstants.Cmin) {
        Cfinal = cuttingConstants.Cmin;
    }

    // Крок 7: Застосування знижки
    let Cfinal_result = Cfinal;
    if (length >= cuttingConstants.optimalLength) {
        Cfinal_result = Cfinal * (1 - cuttingConstants.Kopt / 100);
    }

    // Відображення результату
    const resultDiv = document.getElementById('cuttingResult');
    document.getElementById('resultCutMaterial').textContent = material.name;
    document.getElementById('resultCutLength').textContent = length.toFixed(2) + ' м';
    document.getElementById('resultCutPrice').textContent = formatCurrency(Ccut);
    document.getElementById('resultCutPenalty').textContent = formatCurrency(Cpenalty);
    document.getElementById('resultCutTotal').textContent = formatCurrency(Cfinal_result);
    
    resultDiv.style.display = 'block';
    
    // Скролл до результату
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// ОБРОБКА ФОРМ
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
});

// ============================================
// ВИДАЛЕННЯ РЕЗУЛЬТАТУ ПРИ ЗМІНІ ДАНИХ
// ============================================

if (document.getElementById('engMaterial')) {
    document.getElementById('engMaterial').addEventListener('change', function() {
        document.getElementById('engravingResult').style.display = 'none';
    });
}

if (document.getElementById('engArea')) {
    document.getElementById('engArea').addEventListener('input', function() {
        document.getElementById('engravingResult').style.display = 'none';
    });
}

if (document.getElementById('engComplexity')) {
    document.getElementById('engComplexity').addEventListener('change', function() {
        document.getElementById('engravingResult').style.display = 'none';
    });
}

if (document.getElementById('cutMaterial')) {
    document.getElementById('cutMaterial').addEventListener('change', function() {
        document.getElementById('cuttingResult').style.display = 'none';
    });
}

if (document.getElementById('cutLength')) {
    document.getElementById('cutLength').addEventListener('input', function() {
        document.getElementById('cuttingResult').style.display = 'none';
    });
}

if (document.getElementById('cutDetails')) {
    document.getElementById('cutDetails').addEventListener('input', function() {
        document.getElementById('cuttingResult').style.display = 'none';
    });
}

console.log('Pro Jet Scripts Loaded Successfully ✅');
