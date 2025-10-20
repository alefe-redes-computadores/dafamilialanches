/* =======================================
   DFL v1.2 – Script Principal
   Correções: clique.wav, login Google, adicionais com ícones
   ======================================= */

// ========================
// CONFIGURAÇÃO FIREBASE
// ========================
const firebaseConfig = {
  apiKey: "AIzaSyF-XXXXXX",
  authDomain: "dafamilia-lanches.firebaseapp.com",
  projectId: "dafamilia-lanches",
  storageBucket: "dafamilia-lanches.appspot.com",
  messagingSenderId: "XXXXXX",
  appId: "1:XXXXXX:web:XXXXXX"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ========================
// VARIÁVEIS GLOBAIS
// ========================
const cartIcon = document.getElementById("cart-icon");
const cartCount = document.getElementById("cart-count");
const clickSound = new Audio("click.wav");
clickSound.volume = 0.3;
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

// ========================
// FUNÇÕES GERAIS
// ========================
function updateCartCount() {
  cartCount.textContent = cart.length;
}
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}
function showPopup(msg) {
  const popup = document.createElement("div");
  popup.className = "popup-add";
  popup.textContent = msg;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1400);
}
updateCartCount();

// ========================
// ADIÇÃO AO CARRINHO
// ========================
document.querySelectorAll(".add-cart").forEach(btn => {
  btn.addEventListener("click", e => {
    const card = e.target.closest(".card");
    const item = {
      id: card.dataset.id,
      name: card.dataset.name,
      price: parseFloat(card.dataset.price),
      quantidade: 1
    };
    cart.push(item);
    saveCart();
    showPopup(`🍔 ${item.name} adicionado!`);
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  });
});

// ========================
// CARRINHO LATERAL
// ========================
const cartPanel = document.createElement("div");
cartPanel.id = "mini-cart";
cartPanel.innerHTML = `
  <div class="cart-head">
    <h3>🛒 Seu Carrinho</h3>
    <button id="close-cart">✕</button>
  </div>
  <div id="cart-items"></div>
  <div class="cart-foot">
    <strong>Total: R$ <span id="cart-total">0.00</span></strong>
    <button id="checkout-btn" class="btn-primario">Fechar Pedido</button>
  </div>
`;
document.body.appendChild(cartPanel);

cartIcon.addEventListener("click", () => {
  renderCart();
  cartPanel.classList.add("show");
});
document.addEventListener("click", e => {
  if (e.target.id === "close-cart") cartPanel.classList.remove("show");
});

function renderCart() {
  const container = document.getElementById("cart-items");
  container.innerHTML = "";
  let total = 0;
  if (!cart.length) {
    container.innerHTML = "<p style='text-align:center;margin:15px;'>Carrinho vazio 😔</p>";
  } else {
    cart.forEach((item, i) => {
      const line = document.createElement("div");
      line.className = "cart-line";
      line.innerHTML = `
        <span>${item.name}</span>
        <span>R$ ${item.price.toFixed(2)}</span>
      `;
      container.appendChild(line);
      total += item.price;
    });
  }
  document.getElementById("cart-total").textContent = total.toFixed(2);
}

// ========================
// CONTADOR DE PROMOÇÃO
// ========================
function updateCountdown() {
  const now = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const diff = end - now;

  if (diff <= 0) {
    document.getElementById("timer").textContent = "00:00:00";
    return;
  }
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);
  document.getElementById("timer").textContent =
    `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
setInterval(updateCountdown, 1000);

// ========================
// STATUS “ABERTO / FECHADO”
// ========================
(function() {
  const statusEl = document.getElementById("status-banner");
  if (!statusEl) return;

  const agora = new Date();
  const dia = agora.getDay();
  const hora = agora.getHours();
  let aberto = false;

  if (dia >= 1 && dia <= 4 && hora >= 18 && hora < 23) aberto = true; // Seg–Qui
  if (dia >= 5 && dia <= 0 && hora >= 17 && hora < 23) aberto = true; // Sex–Dom

  statusEl.textContent = aberto ? "✅ Estamos abertos! Faça seu pedido!" : "⏰ Fechado no momento";
  statusEl.style.background = aberto ? "#ffcc00" : "#999";
})();

// ========================
// LOGIN COM GOOGLE (POP-UP)
// ========================
function buildAuthUI() {
  const header = document.querySelector(".header");
  let userBtn = document.querySelector("#user-btn");
  if (!userBtn) {
    userBtn = document.createElement("button");
    userBtn.id = "user-btn";
    userBtn.className = "user-button";
    header.appendChild(userBtn);
  }

  auth.onAuthStateChanged(user => {
    if (user) {
      userBtn.innerHTML = `👋 Olá, ${user.displayName || user.email.split("@")[0]} (Sair)`;
      userBtn.onclick = () => auth.signOut();
    } else {
      userBtn.textContent = "Entrar / Cadastro";
      userBtn.style.fontSize = "0.85em";
      userBtn.style.padding = "6px 10px";
      userBtn.style.borderRadius = "8px";
      userBtn.onclick = loginGoogle;
    }
  });
}

function loginGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => {
    console.error("Erro no login Google:", err.message);
    alert("Erro ao autenticar com o Google. Verifique o pop-up.");
  });
}
buildAuthUI();

// ========================
// MODAL DE ADICIONAIS
// ========================
const extrasModal = document.createElement("div");
extrasModal.id = "extras-modal";
document.body.appendChild(extrasModal);

document.querySelectorAll(".extras-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    extrasModal.innerHTML = `
      <div class="extras-head">
        <span>Escolha seus adicionais</span>
        <button onclick="document.getElementById('extras-modal').classList.remove('show')">✕</button>
      </div>
      <div class="extras-list">
        <label><img src="icons/bacon.png" alt="Bacon" /> <span>Bacon</span><input type="checkbox" data-extra="Bacon" data-price="3"></label>
        <label><img src="icons/cheddar.png" alt="Cheddar" /> <span>Cheddar</span><input type="checkbox" data-extra="Cheddar" data-price="2"></label>
        <label><img src="icons/ovo.png" alt="Ovo" /> <span>Ovo</span><input type="checkbox" data-extra="Ovo" data-price="1.5"></label>
        <label><img src="icons/cebola.png" alt="Cebola" /> <span>Cebola</span><input type="checkbox" data-extra="Cebola" data-price="1"></label>
      </div>
      <div class="extras-foot">
        <button id="extras-add" class="btn-primario">Adicionar</button>
      </div>
    `;
    extrasModal.classList.add("show");
  });
});

document.addEventListener("click", e => {
  if (e.target.id === "extras-add") {
    const checks = document.querySelectorAll("#extras-modal input:checked");
    if (!checks.length) {
      extrasModal.classList.remove("show");
      return;
    }

    let extrasTotal = 0;
    let extrasNames = [];

    checks.forEach(chk => {
      extrasTotal += parseFloat(chk.dataset.price);
      extrasNames.push(chk.dataset.extra);
    });

    cart.push({
      id: "extra-" + Date.now(),
      name: "Adicionais: " + extrasNames.join(", "),
      price: extrasTotal,
      quantidade: 1
    });

    saveCart();
    extrasModal.classList.remove("show");
    showPopup("➕ Adicionais adicionados!");
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  }
});

// ========================
// EXECUÇÃO INICIAL
// ========================
window.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  updateCountdown();
});