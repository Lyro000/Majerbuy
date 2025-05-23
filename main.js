// main.js

// --- LocalStorage helpers ---
function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser'));
}

function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem('currentUser');
}

function getOrders() {
  return JSON.parse(localStorage.getItem('orders') || '{}'); 
  // orders stored as { userEmail1: [order1, order2], userEmail2: [...] }
}

function saveOrders(orders) {
  localStorage.setItem('orders', JSON.stringify(orders));
}

// Koszyk per user
function getCart() {
  const user = getCurrentUser();
  if (!user) return [];
  const carts = JSON.parse(localStorage.getItem('carts') || '{}');
  return carts[user.email] || [];
}

function saveCart(cart) {
  const user = getCurrentUser();
  if (!user) return;
  const carts = JSON.parse(localStorage.getItem('carts') || '{}');
  carts[user.email] = cart;
  localStorage.setItem('carts', JSON.stringify(carts));
}

// --- Aktualizacja UI paska nawigacji (email lub logowanie) ---
function updateNavBar() {
  const navAuth = document.getElementById('navAuthLinks');
  const user = getCurrentUser();
  if (user) {
    navAuth.innerHTML = `
      <span style="color:#bfdbfe; font-weight:700;">${user.email}</span>
      <a href="#" id="logoutLink" style="margin-left:15px; color:#bfdbfe; cursor:pointer;">Wyloguj</a>
    `;
    document.getElementById('logoutLink').addEventListener('click', e => {
      e.preventDefault();
      logoutUser();
    });
  } else {
    navAuth.innerHTML = `
      <a href="#" id="showLogin">Logowanie</a>
      <a href="#" id="showRegister" style="margin-left:15px;">Rejestracja</a>
    `;
    // Powiąż kliknięcia z formularzami
    document.getElementById('showLogin').addEventListener('click', e => {
      e.preventDefault();
      showLoginForm();
    });
    document.getElementById('showRegister').addEventListener('click', e => {
      e.preventDefault();
      showRegisterForm();
    });
  }
}

// --- Pokaż/ukryj formularze na index.html ---
function showLoginForm() {
  document.getElementById('loginForm').style.display = 'flex';
  document.getElementById('registerForm').style.display = 'none';
  clearMessages();
}

function showRegisterForm() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'flex';
  clearMessages();
}

function clearMessages() {
  document.getElementById('loginError').textContent = '';
  document.getElementById('registerError').textContent = '';
}

// --- Logowanie ---
function loginUser(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return { success: false, message: 'Nie znaleziono użytkownika o tym emailu.' };
  }
  if (user.password !== password) {
    return { success: false, message: 'Niepoprawne hasło.' };
  }
  setCurrentUser(user);
  return { success: true };
}

// --- Rejestracja ---
function registerUser(username, email, password) {
  let users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, message: 'Email jest już zajęty.' };
  }
  const newUser = { username, email, password };
  users.push(newUser);
  saveUsers(users);
  setCurrentUser(newUser);
  return { success: true };
}

// --- Wylogowanie ---
function logoutUser() {
  clearCurrentUser();
  location.reload();
}

// --- Aktualizacja panelu użytkownika na index.html ---
function updateUserPanel() {
  const userPanel = document.getElementById('userPanel');
  const authForms = document.getElementById('authForms');
  const user = getCurrentUser();
  if (user) {
    authForms.style.display = 'none';
    userPanel.style.display = 'flex';
    document.getElementById('userNameDisplay').textContent = user.username;
    document.getElementById('userEmailDisplay').textContent = user.email;
    renderUserOrders(user.email);
  } else {
    userPanel.style.display = 'none';
    authForms.style.display = 'flex';
  }
}

// --- Renderowanie poprzednich zamówień ---
function renderUserOrders(email) {
  const ordersContainerId = 'userOrders';
  let ordersContainer = document.getElementById(ordersContainerId);
  if (!ordersContainer) {
    // Dodaj kontener pod userEmailDisplay
    ordersContainer = document.createElement('div');
    ordersContainer.id = ordersContainerId;
    ordersContainer.style.marginTop = '20px';
    ordersContainer.style.textAlign = 'left';
    ordersContainer.style.width = '100%';
    ordersContainer.style.maxWidth = '400px';
    ordersContainer.style.color = '#374151';
    document.getElementById('userPanel').appendChild(ordersContainer);
  }

  const orders = getOrders();
  const userOrders = orders[email] || [];

  if (userOrders.length === 0) {
    ordersContainer.innerHTML = '<p><i>Brak poprzednich zamówień.</i></p>';
    return;
  }

  // Renderuj listę zamówień
  ordersContainer.innerHTML = '<h3>Twoje poprzednie zamówienia:</h3>';
  userOrders.forEach((order, index) => {
    const date = new Date(order.date).toLocaleString();
    const orderDiv = document.createElement('div');
    orderDiv.style.border = '1px solid #2563eb';
    orderDiv.style.padding = '10px';
    orderDiv.style.marginBottom = '10px';
    orderDiv.style.borderRadius = '8px';
    orderDiv.innerHTML = `
      <strong>Zamówienie #${index + 1} (${date})</strong>
      <ul style="padding-left: 20px; margin: 8px 0;">
        ${order.items.map(i => `<li>${i.name} x${i.quantity}</li>`).join('')}
      </ul>
      <p><strong>Dane do wysyłki:</strong><br>
      ${order.shipping.name}<br>
      ${order.shipping.address}<br>
      ${order.shipping.city} ${order.shipping.zip}<br>
      Tel: ${order.shipping.phone}</p>
    `;
    ordersContainer.appendChild(orderDiv);
  });
}

// --- Obsługa formularza logowania ---
function setupLoginForm() {
  const loginForm = document.getElementById('loginForm');
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const result = loginUser(email, password);
    if (!result.success) {
      document.getElementById('loginError').textContent = result.message;
    } else {
      document.getElementById('loginError').textContent = '';
      updateNavBar();
      updateUserPanel();
    }
  });
}

// --- Obsługa formularza rejestracji ---
function setupRegisterForm() {
  const registerForm = document.getElementById('registerForm');
  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    if(username.length < 3) {
      document.getElementById('registerError').textContent = 'Nazwa użytkownika musi mieć co najmniej 3 znaki.';
      return;
    }
    if(password.length < 6) {
      document.getElementById('registerError').textContent = 'Hasło musi mieć co najmniej 6 znaków.';
      return;
    }

    const result = registerUser(username, email, password);
    if (!result.success) {
      document.getElementById('registerError').textContent = result.message;
    } else {
      document.getElementById('registerError').textContent = '';
      updateNavBar();
      updateUserPanel();
    }
  });
}

// --- Funkcje koszyka ---

// Dodaj produkt do koszyka użytkownika
function addToCart(product) {
  const user = getCurrentUser();
  if (!user) {
    alert('Musisz być zalogowany, aby dodawać produkty do koszyka!');
    return;
  }
  let cart = getCart();
  const existing = cart.find(p => p.id === product.id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({...product, quantity: 1});
  }
  saveCart(cart);
  alert(`Dodano ${product.name} do koszyka.`);
}

// Pobierz koszyk i pokaż (można wykorzystać na stronie koszyka)
function getCartItems() {
  return getCart();
}

// Składanie zamówienia (przyjmuje dane do wysyłki)
function placeOrder(shippingData) {
  const user = getCurrentUser();
  if (!user) {
    alert('Musisz być zalogowany, aby złożyć zamówienie!');
    return false;
  }
  let cart = getCart();
  if (cart.length === 0) {
    alert('Twój koszyk jest pusty!');
    return false;
  }
  const orders = getOrders();

  const orderData = {
    date: new Date().toISOString(),
    items: cart,
    shipping: shippingData
  };

  if (!orders[user.email]) orders[user.email] = [];
  orders[user.email].push(orderData);

  saveOrders(orders);
  saveCart([]); // wyczyść koszyk po złożeniu zamówienia
  alert('Zamówienie zostało złożone. Dziękujemy!');
  updateUserPanel();
  return true;
}

// --- Inicjalizacja na starcie ---
function init() {
  updateNavBar();
  updateUserPanel();
  setupLoginForm();
  setupRegisterForm();
}

// Wywołaj inicjalizację po załadowaniu strony
window.addEventListener('DOMContentLoaded', init);
