/**
 * Shop Module
 * Обробник магазину сувенірної продукції з функціями кошика та замовлення
 */

// База товарів
const products = [
  {
    id: 1,
    name: 'Керамічна кружка',
    category: 'cups',
    price: 149,
    emoji: '☕',
    description: 'Якісна керамічна кружка 350 мл з можливістю гравіювання',
    specs: ['350 мл', 'Керамія', 'Гравіювання безплатне'],
    popular: true
  },
  {
    id: 2,
    name: 'Металева ручка',
    category: 'pens',
    price: 89,
    emoji: '✒️',
    description: 'Преміум ручка з гравіюванням вашого логотипу',
    specs: ['Метал', 'Чорнило', 'Гравіювання'],
    popular: true
  },
  {
    id: 3,
    name: 'Значок 50 мм',
    category: 'badges',
    price: 49,
    emoji: '📍',
    description: 'Пластиковий значок з пінтом для гравіювання',
    specs: ['50 мм', 'Пластик', 'Булавка'],
    popular: false
  },
  {
    id: 4,
    name: 'Шкіряний брелок',
    category: 'keychains',
    price: 129,
    emoji: '🔑',
    description: 'Натуральна шкіра, персоналізація гравіюванням',
    specs: ['Шкіра', '80×50 мм', 'Карабін'],
    popular: true
  },
  {
    id: 5,
    name: 'Стеклянний набір кружок',
    category: 'cups',
    price: 299,
    emoji: '🥤',
    description: 'Набір з 2 скляних кружок для гарячих напоїв',
    specs: ['2 шт', '300 мл', 'Скло'],
    popular: false
  },
  {
    id: 6,
    name: 'Шариковая ручка премиум',
    category: 'pens',
    price: 159,
    emoji: '✏️',
    description: 'Преміум класу ручка з позолотою та гравіюванням',
    specs: ['Позолота', 'Метал', 'Подарункова упаковка'],
    popular: true
  },
  {
    id: 7,
    name: 'Дерев\'яний брелок',
    category: 'keychains',
    price: 99,
    emoji: '🪵',
    description: 'Натуральне дерево з гравіюванням логотипу',
    specs: ['Дерево', '60×40 мм', 'Карабін'],
    popular: false
  },
  {
    id: 8,
    name: 'Металевий значок',
    category: 'badges',
    price: 69,
    emoji: '⭐',
    description: 'Металевий значок з емалью і гравіюванням',
    specs: ['35 мм', 'Метал', 'Булавка'],
    popular: true
  }
];

// Кошик
let cart = [];
let currentFilter = 'all';

// Ініціалізація
document.addEventListener('DOMContentLoaded', function() {
  loadCart();
  renderProducts();
  setupMenuToggle();
});

/**
 * Обробка мобільного меню
 */
function setupMenuToggle() {
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');

  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      menuToggle.classList.toggle('active');
      nav.classList.toggle('active');
    });
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function() {
      if (menuToggle) menuToggle.classList.remove('active');
      if (nav) nav.classList.remove('active');
    });
  });
}

/**
 * Відтворити товари
 */
function renderProducts(filtered = false) {
  const grid = document.getElementById('productsGrid');
  let displayProducts = products;

  if (filtered && currentFilter !== 'all') {
    displayProducts = products.filter(p => p.category === currentFilter);
  }

  if (displayProducts.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Товари не знайдені</p>';
    return;
  }

  grid.innerHTML = displayProducts.map(product => `
    <div class="product-card">
      <div class="product-image">${product.emoji}</div>
      <div class="product-info">
        <span class="product-category">${getCategoryName(product.category)}</span>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-specs">
          ${product.specs.map(spec => `<span>• ${spec}</span>`).join('')}
        </div>
        <div class="product-price">
          <span class="price-tag">${formatPrice(product.price)}</span>
          <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
            В кошик
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Отримати назву категорії
 */
function getCategoryName(category) {
  const names = {
    'cups': 'Кружки',
    'pens': 'Ручки',
    'badges': 'Значки',
    'keychains': 'Брелки'
  };
  return names[category] || category;
}

/**
 * Фільтрувати товари
 */
function filterProducts(category) {
  currentFilter = category;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  renderProducts(true);
}

/**
 * Сортувати товари
 */
function sortProducts(sortType) {
  const sorted = [...products];

  switch(sortType) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'new':
      sorted.sort((a, b) => b.id - a.id);
      break;
    case 'popular':
    default:
      sorted.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
  }

  document.getElementById('productsGrid').innerHTML = sorted.map(product => `
    <div class="product-card">
      <div class="product-image">${product.emoji}</div>
      <div class="product-info">
        <span class="product-category">${getCategoryName(product.category)}</span>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-specs">
          ${product.specs.map(spec => `<span>• ${spec}</span>`).join('')}
        </div>
        <div class="product-price">
          <span class="price-tag">${formatPrice(product.price)}</span>
          <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
            В кошик
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Додати товар у кошик
 */
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }

  saveCart();
  updateCartUI();

  // Анімація
  showNotification(`${product.name} додано в кошик!`);
}

/**
 * Видалити товар з кошика
 */
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCartUI();
}

/**
 * Оновити кількість товара
 */
function updateQuantity(productId, change) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += change;
  if (item.quantity <= 0) {
    removeFromCart(productId);
  } else {
    saveCart();
  }
  updateCartUI();
}

/**
 * Оновити UI кошика
 */
function updateCartUI() {
  const cartCount = document.getElementById('cartCount');
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Оновити лічильник
  if (totalItems > 0) {
    cartCount.textContent = totalItems;
    cartCount.style.display = 'flex';
  } else {
    cartCount.style.display = 'none';
  }

  // Оновити вміст кошика
  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="cart-empty">Кошик порожній</div>';
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="product-image" style="width: 60px; height: 60px; margin: 0;">${item.emoji}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${formatPrice(item.price)}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
            <span style="width: 20px; text-align: center;">${item.quantity}</span>
            <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            <button style="margin-left: auto; background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; padding: 4px 8px; cursor: pointer; border-radius: 2px;" onclick="removeFromCart(${item.id})">Видалити</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  cartTotal.textContent = formatPrice(totalPrice);
}

/**
 * Відкрити/закрити кошик
 */
function toggleCart() {
  const modal = document.getElementById('cartModal');
  modal.classList.toggle('active');
}

/**
 * Оформити замовлення
 */
async function checkout() {
  if (cart.length === 0) {
    showNotification('Кошик порожній!', 'error');
    return;
  }

  // Отримати інформацію про клієнта
  const name = prompt('Ваше ім\'я:');
  if (!name) return;

  const email = prompt('Ваш email:');
  if (!email) return;

  const phone = prompt('Ваш телефон (+380...):');
  if (!phone) return;

  // Форматування замовлення
  const orderData = {
    customer: {
      name: name,
      email: email,
      phone: phone
    },
    service: 'shop',
    shopItems: cart.map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })),
    pricing: {
      basePrice: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      discount: 0,
      totalPrice: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      currency: 'UAH'
    },
    payment: {
      method: 'fondy',
      status: 'pending'
    }
  };

  // Отправить на сервер
  try {
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const data = await response.json();

    if (data.success) {
      showNotification(`✅ Замовлення ${data.order.orderNumber} оформлено успішно!`);
      cart = [];
      saveCart();
      updateCartUI();
      toggleCart();

      // Редірект на платіж
      setTimeout(() => {
        window.location.href = `index.html#payment?order=${data.order._id}`;
      }, 2000);
    } else {
      showNotification('❌ Помилка при оформленні замовлення', 'error');
    }
  } catch (error) {
    console.error('Помилка:', error);
    showNotification('❌ Помилка сервера', 'error');
  }
}

/**
 * Зберегти кошик у localStorage
 */
function saveCart() {
  localStorage.setItem('pro-jet-cart', JSON.stringify(cart));
}

/**
 * Загрузити кошик з localStorage
 */
function loadCart() {
  const saved = localStorage.getItem('pro-jet-cart');
  if (saved) {
    try {
      cart = JSON.parse(saved);
      updateCartUI();
    } catch (e) {
      console.error('Помилка завантаження кошика:', e);
    }
  }
}

/**
 * Форматування ціни
 */
function formatPrice(price) {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0
  }).format(price);
}

/**
 * Показати сповіщення
 */
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'error' ? '#ef4444' : '#10b981'};
    color: white;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 2000;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

console.log('✅ Shop Module Loaded');
