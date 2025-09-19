// ====================== CONFIG ======================
const backendUrl = "https://ecommerce-backend-2-qntk.onrender.com/api/";

// ==================== HEADER & FOOTER ====================
document.addEventListener("DOMContentLoaded", () => {
  // Load header
  fetch("partials/header.html")
    .then(r => r.text())
    .then(html => {
      document.getElementById("header").innerHTML = html;
      updateNavbar();
    });

  // Load footer
  fetch("partials/footer.html")
    .then(r => r.text())
    .then(html => {
      document.getElementById("footer").innerHTML = html;
    });

  // Initialize forms
  initSignupForm();
  initLoginForm();
  initCartPage();
  initOrdersPage();
});

// ==================== NAVBAR LOGIN/LOGOUT ====================
function updateNavbar() {
  const authLinks = document.getElementById("auth-links");
  if (!authLinks) return;
  const token = localStorage.getItem("access_token");

  authLinks.innerHTML = token
    ? `<li class="nav-item"><a class="nav-link" href="#" onclick="logout()">Logout</a></li>`
    : `<li class="nav-item"><a class="nav-link" href="login.html">Login</a></li>
       <li class="nav-item"><a class="nav-link" href="signup.html">Signup</a></li>`;
}

function logout() {
  localStorage.removeItem("access_token");
  window.location.href = "index.html";
}

// ==================== SIGNUP ====================
function initSignupForm() {
  const signupForm = document.getElementById("signup-form");
  if (!signupForm) return;

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("signup-username").value;
    const password = document.getElementById("signup-password").value;

    try {
      const res = await fetch(backendUrl + "users/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Signup failed");
      alert("Signup successful! Please login.");
      window.location.href = "login.html";
    } catch (err) {
      alert(err.message);
    }
  });
}

// ==================== LOGIN ====================
function initLoginForm() {
  const loginForm = document.getElementById("login-form");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    try {
      const res = await fetch(backendUrl + "users/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (data.access) {
        localStorage.setItem("access_token", data.access);
        alert("Login successful!");
        window.location.href = "index.html";
      } else {
        alert("Login failed! Check credentials.");
      }
    } catch (err) {
      alert("Login failed!");
    }
  });
}

// ==================== PRODUCTS ====================
async function loadProducts(containerId, limit = null) {
  try {
    const res = await fetch(backendUrl + "products/");
    if (!res.ok) throw new Error("Failed to load products");
    const products = await res.json();

    const container = document.getElementById(containerId);
    container.innerHTML = "";

    products.slice(0, limit || products.length).forEach((p) => {
      container.innerHTML += `
        <div class="col-md-4 mb-3">
          <div class="card h-100">
            <img src="${p.image}" class="card-img-top" alt="${p.name}">
            <div class="card-body">
              <h5>${p.name}</h5>
              <p>$${p.price}</p>
              <p><small>${p.category?.name || "No Category"}</small></p>
            </div>
            <div class="card-footer">
              <button class="btn btn-primary w-100" onclick="addToCart(${p.id}, '${p.name}', ${p.price})">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
  }
}

// ==================== CART ====================
function addToCart(id, name, price) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, qty: 1 });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added to cart!");
}

function initCartPage() {
  const cartItemsContainer = document.getElementById("cartItems");
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (!cartItemsContainer) return;

  renderCart();

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
      }

      try {
        const res = await fetch(`${backendUrl}orders/checkout/`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Checkout failed");
        alert("Order placed successfully!");
        localStorage.removeItem("cart");
        window.location.href = "orders.html";
      } catch (err) {
        alert(err.message);
      }
    });
  }
}

function renderCart() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const container = document.getElementById("cartItems");
  if (!container) return;

  container.innerHTML = "";
  let total = 0;
  cart.forEach((item) => {
    total += item.price * item.qty;
    container.innerHTML += `
      <div class="col-md-6 mb-3">
        <div class="card p-2">
          <div class="d-flex justify-content-between align-items-center">
            <span>${item.name} (x${item.qty})</span>
            <span>$${(item.price * item.qty).toFixed(2)}</span>
            <button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.id})">Remove</button>
          </div>
        </div>
      </div>
    `;
  });

  const totalEl = document.getElementById("cartTotal");
  if (totalEl) totalEl.textContent = total.toFixed(2);
}

function removeFromCart(id) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart = cart.filter((item) => item.id !== id);
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

// ==================== ORDERS ====================
function initOrdersPage() {
  const ordersContainer = document.getElementById("ordersList");
  if (!ordersContainer) return;

  const token = localStorage.getItem("access_token");
  if (!token) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }

  fetchOrders(token, ordersContainer);
}

async function fetchOrders(token, container) {
  try {
    const res = await fetch(`${backendUrl}orders/`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch orders");

    const orders = await res.json();
    renderOrders(orders, container);
  } catch (err) {
    container.innerHTML = "<p>No orders found.</p>";
  }
}

function renderOrders(orders, container) {
  container.innerHTML = "";
  orders.forEach((order) => {
    let itemsHtml = "";
    order.items.forEach((item) => {
      itemsHtml += `<li>${item.product.name} (x${item.quantity}) - $${item.product.price}</li>`;
    });

    container.innerHTML += `
      <div class="card mb-3">
        <div class="card-body">
          <h5>Order #${order.id}</h5>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Total:</strong> $${order.total}</p>
          <ul>${itemsHtml}</ul>
        </div>
      </div>
    `;
  });
}
