/* ==================================================
   DFL v1.3.4 – Script principal completo
   Inclui: Login Modal, Carrinho, Adicionais, Countdown, Som
   ================================================== */

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
clickSound.volume = 0.35;
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

// ========================
// ATUALIZAÇÕES GERAIS
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
  setTimeout(() => popup.remove(), 1500);
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
    `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}
setInterval(updateCountdown, 1000);

// ========================
// LOGIN E USUÁRIO (MODAL)
// ========================
function createLoginModal() {
  if (document.getElementById("login-modal")) return;

  const modal = document.createElement("div");
  modal.id = "login-modal";
  modal.innerHTML = `
    <div class="login-backdrop" onclick="closeLoginModal()"></div>
    <div class="login-box">
      <h3>Bem-vindo(a) 😊</h3>
      <p>Entre ou crie sua conta para continuar</p>
      <input type="email" id="loginEmail" placeholder="E-mail" />
      <input type="password" id="loginPass" placeholder="Senha" />
      <button id="btnLoginEmail" class="btn-primario">Entrar</button>
      <p class="divider">ou</p>
      <button id="btnGoogle" class="btn-google">
        <img src="google-icon.svg" alt=""> Entrar com Google
      </button>
      <button class="close-login" onclick="closeLoginModal()">✕</button>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("btnGoogle").onclick = loginGoogle;
  document.getElementById("btnLoginEmail").onclick = loginEmail;
}

function openLoginModal() {
  createLoginModal();
  document.getElementById("login-modal").classList.add("show");
}

function closeLoginModal() {
  document.getElementById("login-modal")?.classList.remove("show");
}

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
      userBtn.innerHTML = `Olá, ${user.displayName || user.email.split("@")[0]} (Sair)`;
      userBtn.onclick = () => auth.signOut();
    } else {
      userBtn.innerHTML = "Entrar / Cadastro";
      userBtn.onclick = openLoginModal;
    }
  });
}
buildAuthUI();
// ========================
// LOGIN COM GOOGLE / EMAIL
// ========================
function loginGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(() => closeLoginModal())
    .catch(err => alert("Erro ao logar: " + err.message));
}
function loginEmail() {
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPass").value;
  auth.signInWithEmailAndPassword(email, pass)
    .then(() => closeLoginModal())
    .catch(err => {
      if (err.code === "auth/user-not-found") {
        firebase.auth().createUserWithEmailAndPassword(email, pass)
          .then(() => alert("Conta criada com sucesso!"))
          .catch(e => alert("Erro: " + e.message));
      } else alert("Erro: " + err.message);
    });
}

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
        <label><span>Bacon</span><input type="checkbox" data-extra="Bacon" data-price="3"></label>
        <label><span>Cheddar</span><input type="checkbox" data-extra="Cheddar" data-price="2"></label>
        <label><span>Ovo</span><input type="checkbox" data-extra="Ovo" data-price="1.5"></label>
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
  }
});

// ========================
// FECHAR PEDIDO
// ========================
document.addEventListener("click", e => {
  if (e.target.classList.contains("close-cart")) {
    document.getElementById("cart-panel")?.classList.remove("active");
  }
});

// ========================
// EXECUÇÃO INICIAL
// ========================
window.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  updateCountdown();
});