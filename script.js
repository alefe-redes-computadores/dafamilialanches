/* =======================================
   🍔 DFL v1.2 – Script principal completo
   Inclui: Login, Carrinho com Quantidade, Adicionais, Meus Pedidos, Firebase
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
const db = firebase.firestore();

// ========================
// VARIÁVEIS GLOBAIS
// ========================
const cartIcon = document.getElementById("cart-icon");
const cartCount = document.getElementById("cart-count");
const backdrop = document.getElementById("cart-backdrop");
const miniCart = document.getElementById("mini-cart");
const cartList = document.getElementById("cart-items");
const finalizeBtn = document.getElementById("finalize-order");
const clearBtn = document.getElementById("clear-cart");
const closeCart = document.getElementById("close-cart");
const clickSound = new Audio("click.mp3");
clickSound.volume = 0.3;

let cart = JSON.parse(localStorage.getItem("cart") || "[]");

// ========================
// FUNÇÕES GERAIS
// ========================
function updateCartCount() {
  let totalQtd = cart.reduce((sum, item) => sum + item.quantidade, 0);
  cartCount.textContent = totalQtd;
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
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
// ABRIR E FECHAR CARRINHO
// ========================
cartIcon.addEventListener("click", () => {
  miniCart.classList.add("show");
  backdrop.classList.add("show");
});

if (closeCart) {
  closeCart.addEventListener("click", () => {
    miniCart.classList.remove("show");
    backdrop.classList.remove("show");
  });
}

if (backdrop) {
  backdrop.addEventListener("click", () => {
    miniCart.classList.remove("show");
    backdrop.classList.remove("show");
  });
}

// ========================
// ADICIONAR AO CARRINHO
// ========================
document.querySelectorAll(".add-cart").forEach(btn => {
  btn.addEventListener("click", e => {
    const card = e.target.closest(".card");
    const id = card.dataset.id;
    const name = card.dataset.name;
    const price = parseFloat(card.dataset.price);

    // Se já existe o item, apenas aumenta a quantidade
    const existing = cart.find(i => i.id === id);
    if (existing) {
      existing.quantidade += 1;
    } else {
      cart.push({ id, name, price, quantidade: 1 });
    }

    saveCart();
    showPopup(`🍔 ${name} adicionado!`);
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  });
});

// ========================
// RENDERIZAR CARRINHO
// ========================
function renderCart() {
  if (!cartList) return;

  if (!cart.length) {
    cartList.innerHTML = "<p>Seu carrinho está vazio 😔</p>";
    return;
  }

  cartList.innerHTML = "";
  cart.forEach((item, index) => {
    const li = document.createElement("div");
    li.className = "cart-item";
    li.innerHTML = `
      <div>
        <strong>${item.name}</strong><br>
        <small>${item.quantidade}x — R$ ${(item.price * item.quantidade).toFixed(2)}</small>
      </div>
      <div class="cart-actions">
        <button class="dec">−</button>
        <button class="inc">+</button>
        <button class="rem">✕</button>
      </div>
    `;
    li.querySelector(".dec").onclick = () => {
      if (item.quantidade > 1) item.quantidade--;
      else cart.splice(index, 1);
      saveCart();
    };
    li.querySelector(".inc").onclick = () => {
      item.quantidade++;
      saveCart();
    };
    li.querySelector(".rem").onclick = () => {
      cart.splice(index, 1);
      saveCart();
    };
    cartList.appendChild(li);
  });
}

renderCart();

// ========================
// LIMPAR CARRINHO
// ========================
clearBtn?.addEventListener("click", () => {
  cart = [];
  saveCart();
  showPopup("Carrinho limpo 🧼");
});

// ========================
// FECHAR PEDIDO (FINALIZAR)
// ========================
finalizeBtn?.addEventListener("click", async () => {
  if (!cart.length) {
    alert("Seu carrinho está vazio!");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("Por favor, entre com sua conta Google antes de finalizar o pedido 🙏");
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantidade, 0);
  const pedido = {
    uid: user.uid,
    nome: user.displayName || user.email.split("@")[0],
    itens: cart.map(i => ({
      nome: i.name,
      quantidade: i.quantidade,
      subtotal: i.price * i.quantidade
    })),
    total,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    const ref = await db.collection("pedidos").add(pedido);
    showPopup(`✅ Pedido enviado com sucesso! (#${ref.id.slice(-6).toUpperCase()})`);

    cart = [];
    saveCart();
    miniCart.classList.remove("show");
    backdrop.classList.remove("show");

  } catch (e) {
    console.error("Erro ao salvar pedido:", e);
    alert("Erro ao enviar o pedido. Tente novamente mais tarde.");
  }
});

// ========================
// CONTADOR PROMOCIONAL (00:00 reset)
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
updateCountdown();

// ========================
// LOGIN COM GOOGLE
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
      userBtn.innerHTML = `Olá, ${user.displayName || user.email.split("@")[0]} (Sair)`;
      userBtn.onclick = () => auth.signOut();
      ensureOrdersFab(user);
    } else {
      userBtn.innerHTML = "Entrar / Cadastro";
      userBtn.onclick = loginGoogle;
      ensureOrdersFab(null);
    }
  });
}

function loginGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => alert("Erro ao entrar: " + err.message));
}

buildAuthUI();

// ========================
// BOTÃO FLUTUANTE “MEUS PEDIDOS”
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
// LISTAR PEDIDOS DO FIREBASE
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
// FECHAR PAINEL “MEUS PEDIDOS”
// ========================
const closeBtn = document.querySelector(".orders-close");
if (closeBtn) closeBtn.onclick = () => document.getElementById("orders-panel").classList.remove("active");

// ========================
// EXECUÇÃO INICIAL
// ========================
window.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  renderCart();
  updateCountdown();
});