/* =======================================
   DFL v1.3 – Correção de Som e Login (visual mantido)
   ======================================= */

// ========================
// FIREBASE CONFIG
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
const db = firebase.firestore();

// ========================
// VARIÁVEIS GLOBAIS
// ========================
const cartIcon = document.getElementById("cart-icon");
const cartCount = document.getElementById("cart-count");
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

// ========================
// SOM DE CLIQUE (.wav)
// ========================
let clickSound;
try {
  clickSound = new Audio("click.wav");
  clickSound.preload = "auto";
  clickSound.volume = 0.4;
} catch (err) {
  console.warn("Erro ao carregar som:", err);
}

function playClick() {
  if (clickSound) {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  }
}

// ========================
// FUNÇÕES DE CARRINHO
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
    playClick();
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
  });
});

// ========================
// MODAL DE ADICIONAIS
// ========================
const extrasModal = document.createElement("div");
extrasModal.id = "extras-modal";
document.body.appendChild(extrasModal);

document.querySelectorAll(".extras-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    playClick();
    extrasModal.innerHTML = `
      <div class="extras-head">
        <span>Escolha seus adicionais</span>
        <button id="extras-close">✕</button>
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
  if (e.target.id === "extras-close") {
    playClick();
    extrasModal.classList.remove("show");
  }
  if (e.target.id === "extras-add") {
    playClick();
    const checks = document.querySelectorAll("#extras-modal input:checked");
    if (!checks.length) {
      extrasModal.classList.remove("show");
      return;
    }
    let total = 0;
    let nomes = [];
    checks.forEach(chk => {
      total += parseFloat(chk.dataset.price);
      nomes.push(chk.dataset.extra);
    });
    cart.push({
      id: "extra-" + Date.now(),
      name: "Adicionais: " + nomes.join(", "),
      price: total,
      quantidade: 1
    });
    saveCart();
    extrasModal.classList.remove("show");
    showPopup("➕ Adicionais adicionados!");
  }
});
// ========================
// LOGIN GOOGLE + USUÁRIO
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
      userBtn.innerHTML = `👋 ${user.displayName || user.email.split("@")[0]} (Sair)`;
      userBtn.onclick = () => {
        playClick();
        auth.signOut();
      };
      ensureOrdersFab(user);
    } else {
      userBtn.innerHTML = "🔐 Entrar / Cadastro";
      userBtn.onclick = loginGoogle;
      ensureOrdersFab(null);
    }
  });
}

function loginGoogle() {
  playClick();
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => alert("Erro: " + err.message));
}
buildAuthUI();

// ========================
// BOTÃO “MEUS PEDIDOS”
// ========================
function ensureOrdersFab(user) {
  let fab = document.getElementById("orders-fab");
  if (user && !fab) {
    fab = document.createElement("button");
    fab.id = "orders-fab";
    fab.innerHTML = "📜 <span>Meus Pedidos</span>";
    document.body.appendChild(fab);
    requestAnimationFrame(() => fab.classList.add("show"));

    fab.onclick = async () => {
      playClick();
      try {
        const list = await loadUserOrders(user.uid);
        renderOrders(list);
        document.getElementById("orders-panel")?.classList.add("active");
      } catch (e) {
        console.error(e);
        alert("Erro ao abrir seus pedidos.");
      }
    };
  }
  if (!user && fab) fab.remove();
}

// ========================
// CARREGAR PEDIDOS DO FIRESTORE
// ========================
async function loadUserOrders(uid) {
  try {
    const snap = await db
      .collection("pedidos")
      .where("uid", "==", uid)
      .orderBy("criadoEm", "desc")
      .limit(20)
      .get();

    const arr = [];
    snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }));
    return arr;
  } catch (e) {
    console.error("Erro ao buscar pedidos:", e);
    return [];
  }
}

// ========================
// RENDERIZAR PEDIDOS
// ========================
function renderOrders(list) {
  const content = document.getElementById("orders-content");
  if (!content) return;

  if (!list.length) {
    content.innerHTML = `<p class="empty-orders">Nenhum pedido foi encontrado.</p>`;
    return;
  }

  content.innerHTML = "";
  list.forEach(p => {
    const total = (p.total || 0).toFixed(2);
    const quando = p.criadoEm?.toDate
      ? p.criadoEm.toDate().toLocaleString("pt-BR")
      : new Date().toLocaleString("pt-BR");

    const box = document.createElement("div");
    box.className = "order-item";
    box.innerHTML = `
      <h4>Pedido #${p.id.slice(-6).toUpperCase()} <small>${quando}</small></h4>
      <ul style="margin:4px 0 8px 16px;">
        ${(p.itens || [])
          .map(
            (it, i) =>
              `<li>${i + 1}. ${it.nome} — ${it.quantidade}x (R$ ${(it.subtotal || 0).toFixed(2)})</li>`
          )
          .join("")}
      </ul>
      <strong>Total: R$ ${total}</strong>
    `;
    content.appendChild(box);
  });
}

// ========================
// BOTÃO FECHAR DO PAINEL
// ========================
document.addEventListener("click", e => {
  if (e.target.classList.contains("orders-close")) {
    playClick();
    document.getElementById("orders-panel")?.classList.remove("active");
  }
});

// ========================
// CONTADOR DE PROMOÇÃO
// ========================
function updateCountdown() {
  const timer = document.getElementById("timer");
  if (!timer) return;
  const now = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const diff = end - now;
  if (diff <= 0) {
    timer.textContent = "00:00:00";
    return;
  }
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff / 60_000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  timer.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
setInterval(updateCountdown, 1000);

// ========================
// EXECUÇÃO INICIAL
// ========================
window.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  updateCountdown();
  playClick(); // pré-carrega o som
});