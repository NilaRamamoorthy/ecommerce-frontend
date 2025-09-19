// ------------------------------
// Configuration
// ------------------------------
const backendUrl = "https://ecommerce-backend-2-qntk.onrender.com/api/"; 

// ------------------------------
// Load header & footer
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Header
  fetch("partials/header.html")
    .then(r => r.text())
    .then(html => {
      document.getElementById("header").innerHTML = html;
      updateNavbar();
    });

  // Footer
  fetch("partials/footer.html")
    .then(r => r.text())
    .then(html => {
      document.getElementById("footer").innerHTML = html;
    });

  // Initialize forms if present
  initSignup();
  initLogin();
  loadProducts("products-container", 12); // optional limit
  renderCart();
  loadOrders();
});

// ------------------------------
// Signup
// ------------------------------
function initSignup() {
  const signupForm = document.getElementById("signup-form");
  if (!signupForm) return;

  signupForm.addEventListener("submit", async e => {
    e.preventDefault();

    const username = document.getElementById("signup-username").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const password2 = document.getElementById("signup-password2").value;

    try {
      const res = await fetch(backendUrl + "users/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, password2 })
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Signup successful! Please login.");
        window.location.href = "login.html";
      } else {
        alert("❌ Signup failed: " + JSON.stringify(data));
      }
    } catch (error) {
      console.error(error);
    }
  });
}

// ------------------------------
// Login
// ------------------------------
function initLogin() {
  const loginForm = document.getElementById("login-form");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async e => {
    e.preventDefault();

    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    try {
      const res = await fetch(backendUrl + "users/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.access) {
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        alert("✅ Login successful!");
        window.location.href = "index.html";
      } else {
        alert("❌ Login failed: " + JSON.stringify(data));
      }
    } catch (error) {
      console.error(error);
    }
  });
}

// ------------------------------
// Navbar login/logout
// ------------------------------
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
  localStorage.removeItem("refresh_token");
  window.location.href = "index.html";
}

// ------------------------------
// Load products
// ------------------------------
async function loadProducts(containerId, limit = null) {
  try {
    const res = await fetch(backendUrl + "products/");
    const products = await res.json();
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    products.slice(0, limit || products.length).forEach(p => {
      container.innerHTML += `
        <div class="col-md-4 mb-3">
          <div class="card h-100">
            <img src="${backendUrl.replace('/api/', '')}${p.image}" class="card-img-top" alt="${p.name}">
            <div class="card-body">
              <h5>${p.name}</h5>
              <p>$${p.price}</p>
            </div>
            <div class="card-footer">
              <button class="btn btn-primary w-100" onclick="addToCart(${p.id}, '${p.name}', ${p.price})">Add to Cart</button>
            </div>
          </div>
        </div>`;
    });
  } catch (error) {
    console.error(error);
  }
}

// ------------------------------
// Cart functions
// ------------------------------
function addToCart(id, name, price) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }

  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const existing = cart.find(item => item.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id, name, price, qty: 1 });

  localStorage.setItem("cart", JSON.stringify(cart));
  alert("✅ Added to cart!");
  renderCart();
}

function renderCart() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const container = document.getElementById("cart-items");
  if (!container) return;

  container.innerHTML = cart.map(item =>
    `<div class="d-flex justify-content-between border p-2">
      <span>${item.name} (x${item.qty})</span>
      <span>$${item.price * item.qty}</span>
    </div>`).join("");
}

async function placeOrder() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    alert("Please login to place order!");
    return;
  }

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  try {
    const res = await fetch(backendUrl + "orders/checkout/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ items: cart })
    });

    if (res.ok) {
      alert("✅ Order placed successfully!");
      localStorage.removeItem("cart");
      renderCart();
      window.location.href = "orders.html";
    } else {
      const data = await res.json();
      alert("❌ Order failed: " + JSON.stringify(data));
    }
  } catch (error) {
    console.error(error);
  }
}

// ------------------------------
// Load Orders
// ------------------------------
async function loadOrders() {
  const token = localStorage.getItem("access_token");
  const container = document.getElementById("orders-list");
  if (!container || !token) return;

  try {
    const res = await fetch(backendUrl + "orders/", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) {
      container.innerHTML = "<p>No orders yet.</p>";
      return;
    }

    const orders = await res.json();
    container.innerHTML = orders.map(o =>
      `<div class="border p-2 mb-2">
        <h5>Order #${o.id}</h5>
        <p>Date: ${o.date_created}</p>
        <p>Items:</p>
        <ul>
          ${o.items.map(i => `<li>${i.name} x${i.qty} - $${i.price * i.qty}</li>`).join("")}
        </ul>
        <p>Total: $${o.total}</p>
      </div>`
    ).join("");
  } catch (error) {
    console.error(error);
  }
}
