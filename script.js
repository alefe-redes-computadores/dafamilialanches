/* ================================
   DFL – Script principal (com Login + Carrinho corrigido)
   ================================ */

/* 🔊 Som global */
const clickSound = new Audio("click.wav");
clickSound.volume = 0.4;

/* ========= Helpers ========= */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* ========= Firebase ========= */
async function loadFirebase() {
  function inject(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  await inject("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
  await inject("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js");
  await inject("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js");
}

async function initFirebase() {
  await loadFirebase();
  const firebaseConfig = {
    apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
    authDomain: "da-familia-lanches.firebaseapp.com",
    projectId: "da-familia-lanches",
    storageBucket: "da-familia-lanches.firebasestorage.app",
    messagingSenderId: "106857147317",
    appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
    measurementId: "G-TCZ18HFWGX"
  };
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  window.db = firebase.firestore();
  window.auth = firebase.auth();
}

/* ========= UI de Login ========= */
function buildAuthUI() {
  const header = document.querySelector(".header") || document.body;
  const userChip = document.createElement("button");
  userChip.id = "user-chip";
  userChip.textContent = "Entrar / Cadastro";
  userChip.style.cssText = `
    position: fixed; top: 12px; right: 12px; z-index: 1100;
    background:#f9d44b; color:#000; font-weight:700; border:none;
    border-radius:999px; padding:8px 12px; cursor:pointer;
    box-shadow:0 2px 6px rgba(0,0,0,.4);
  `;
  header.appendChild(userChip);

  const backdrop = document.createElement("div");
  backdrop.id = "auth-backdrop";
  backdrop.style.cssText = `position:fixed; inset:0; background:rgba(0,0,0,.55); display:none; z-index:1200;`;
  document.body.appendChild(backdrop);

  const modal = document.createElement("div");
  modal.id = "auth-modal";
  modal.style.cssText = `
    position:fixed; left:50%; top:50%; transform:translate(-50%,-50%);
    background:#111; color:#fff; border:2px solid #f9d44b; border-radius:14px;
    width:90%; max-width:420px; padding:18px; z-index:1210; display:none;
  `;
  modal.innerHTML = `
    <h3 style="color:#f9d44b;">Entrar / Criar conta</h3>
    <label>Email</label>
    <input id="auth-email" type="email" placeholder="seu@email.com"
      style="width:100%; padding:10px; margin-bottom:10px; border-radius:8px; border:1px solid #333; background:#1a1a1a; color:#fff;" />
    <label>Senha</label>
    <input id="auth-pass" type="password" placeholder="mínimo 6 caracteres"
      style="width:100%; padding:10px; margin-bottom:16px; border-radius:8px; border:1px solid #333; background:#1a1a1a; color:#fff;" />
    <div style="display:flex; gap:8px;">
      <button id="btn-login" style="flex:1; background:#f9d44b; color:#000; font-weight:700; border:none; border-radius:8px; padding:10px;">Entrar</button>
      <button id="btn-sign"  style="flex:1; background:#f9d44b; color:#000; font-weight:700; border:none; border-radius:8px; padding:10px;">Criar</button>
      <button id="btn-close" style="flex:1; background:#333; color:#fff; border:1px solid #444; border-radius:8px; padding:10px;">Fechar</button>
    </div>
    <p id="auth-msg" style="margin-top:10px; font-size:.9rem; color:#ffb13b;"></p>
  `;
  document.body.appendChild(modal);

  const msg = modal.querySelector("#auth-msg");
  const emailEl = modal.querySelector("#auth-email");
  const passEl = modal.querySelector("#auth-pass");

  const openModal = () => { backdrop.style.display = "block"; modal.style.display = "block"; };
  const closeModal = () => { backdrop.style.display = "none"; modal.style.display = "none"; };

  userChip.addEventListener("click", openModal);
  backdrop.addEventListener("click", closeModal);
  modal.querySelector("#btn-close").addEventListener("click", closeModal);

  async function doLogin() {
    msg.textContent = "Entrando...";
    try {
      await auth.signInWithEmailAndPassword(emailEl.value.trim(), passEl.value);
      msg.textContent = "✅ Login realizado!";
      setTimeout(closeModal, 700);
    } catch (e) { msg.textContent = "⚠️ " + (e.message || "Erro ao entrar"); }
  }

  async function doSign() {
    msg.textContent = "Criando conta...";
    try {
      await auth.createUserWithEmailAndPassword(emailEl.value.trim(), passEl.value);
      msg.textContent = "✅ Conta criada!";
      setTimeout(closeModal, 700);
    } catch (e) { msg.textContent = "⚠️ " + (e.message || "Erro ao criar conta"); }
  }

  modal.querySelector("#btn-login").addEventListener("click", doLogin);
  modal.querySelector("#btn-sign").addEventListener("click", doSign);

  auth.onAuthStateChanged((user) => {
    if (user) {
      userChip.textContent = `Olá, ${user.email.split("@")[0]} (Sair)`;
      userChip.onclick = async () => { await auth.signOut(); };
    } else {
      userChip.textContent = "Entrar / Cadastro";
      userChip.onclick = openModal;
    }
  });
}

/* ========= Carrinho ========= */
const cartBtn = document.getElementById("cart-icon");
const miniCart = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");
const cartList = document.getElementById("mini-list");
const cartCount = document.getElementById("cart-count");
const clearCartBtn = document.getElementById("mini-clear");
const finishOrderBtn = document.getElementById("mini-checkout");
const closeCartBtn = document.querySelector(".mini-close");

let cart = JSON.parse(localStorage.getItem("dflCart") || "[]");

function abrirCarrinho() {
  clickSound.currentTime = 0; clickSound.play().catch(() => {});
  miniCart.classList.add("active");
  cartBackdrop.classList.add("show");
  document.body.classList.add("no-scroll");
}
function fecharCarrinho() {
  miniCart.classList.remove("active");
  cartBackdrop.classList.remove("show");
  document.body.classList.remove("no-scroll");
}
function atualizarCarrinho() {
  cartList.innerHTML = "";
  let total = 0;
  cart.forEach((item, index) => {
    const li = document.createElement("li");
    li.classList.add("cart-item");
    li.innerHTML = `
      <span>${item.nome}</span>
      <strong>R$ ${item.preco.toFixed(2)}</strong>
      <button class="remove-item" data-index="${index}">✕</button>`;
    cartList.appendChild(li);
    total += item.preco;
  });
  cartCount.textContent = cart.length;
  clearCartBtn.style.display = cart.length ? "inline-block" : "none";
  finishOrderBtn.style.display = cart.length ? "inline-block" : "none";
  localStorage.setItem("dflCart", JSON.stringify(cart));
}
function adicionarAoCarrinho(nome, preco) {
  cart.push({ nome, preco });
  atualizarCarrinho();
  mostrarPopupAdicionado(nome);
  if (!miniCart.classList.contains("active")) abrirCarrinho();
}
function mostrarPopupAdicionado(nomeProduto = null) {
  const popup = document.createElement("div");
  popup.className = "popup-add";
  popup.textContent = nomeProduto ? `🍔 ${nomeProduto} adicionado!` : "+1 adicionado!";
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1400);
}
function removerDoCarrinho(index) {
  cart.splice(index, 1);
  atualizarCarrinho();
}
function limparCarrinho() {
  cart = [];
  atualizarCarrinho();
}

document.addEventListener("DOMContentLoaded", () => {
  fecharCarrinho();
  atualizarCarrinho();
  cartBtn.addEventListener("click", abrirCarrinho);
  closeCartBtn.addEventListener("click", fecharCarrinho);
  cartBackdrop.addEventListener("click", fecharCarrinho);
  clearCartBtn.addEventListener("click", limparCarrinho);
  cartList.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-item")) removerDoCarrinho(e.target.dataset.index);
  });
  document.querySelectorAll(".add-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      adicionarAoCarrinho(card.dataset.name, parseFloat(card.dataset.price));
    });
  });
});

(async function startDFL() {
  try {
    await initFirebase();
    buildAuthUI();
    console.log("✅ Firebase e login ativos");
  } catch (e) {
    console.error("Erro ao iniciar Firebase/Login:", e);
  }
})();

/* ========= Contador regressivo ========= */
function iniciarContador() {
  const contadorEl = document.getElementById("contador");
  if (!contadorEl) return;

  function atualizarContador() {
    const agora = new Date();
    const fim = new Date();
    fim.setHours(23, 59, 59, 999);
    const diff = fim - agora;
    if (diff <= 0) {
      contadorEl.textContent = "00:00:00";
      return;
    }
    const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
    contadorEl.textContent = `${h}:${m}:${s}`;
  }

  atualizarContador();
  setInterval(atualizarContador, 1000);
}

/* ========= Status aberto/fechado ========= */
function atualizarStatus() {
  const status = document.getElementById("status");
  if (!status) return;

  const agora = new Date();
  const dia = agora.getDay();
  const hora = agora.getHours();
  const min = agora.getMinutes();
  let aberto = false;

  if (dia >= 1 && dia <= 4) {
    aberto = (hora > 18 || (hora === 18 && min >= 0)) && hora < 23;
  } else if (dia === 5 || dia === 6) {
    aberto = (hora > 17 || (hora === 17 && min >= 30)) && hora < 23;
  }

  if (aberto) {
    status.textContent = "🟢 Aberto — peça agora!";
    status.style.color = "#00ff84";
  } else {
    status.textContent = "🔴 Fechado — abrimos às 17h30";
    status.style.color = "#ff6464";
  }
}

/* ========= Carrossel de promoções ========= */
function iniciarCarrossel() {
  const slides = document.querySelectorAll(".slide");
  const btnPrev = document.querySelector(".prev");
  const btnNext = document.querySelector(".next");
  if (!slides.length) return;

  let i = 0;
  function mostrarSlide(idx) {
    slides.forEach((s, j) => s.style.display = j === idx ? "block" : "none");
  }
  mostrarSlide(i);

  btnNext?.addEventListener("click", () => {
    i = (i + 1) % slides.length;
    mostrarSlide(i);
  });
  btnPrev?.addEventListener("click", () => {
    i = (i - 1 + slides.length) % slides.length;
    mostrarSlide(i);
  });
  setInterval(() => { i = (i + 1) % slides.length; mostrarSlide(i); }, 6000);
}

/* ========= Painel "Meus Pedidos" ========= */
function buildOrdersPanel() {
  let existing = document.getElementById("orders-panel");
  if (existing) existing.remove();

  const backdrop = document.createElement("div");
  backdrop.id = "orders-backdrop";
  backdrop.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,.55);
    opacity:0; visibility:hidden; transition:.3s; z-index:1200;
  `;

  const panel = document.createElement("div");
  panel.id = "orders-panel";
  panel.style.cssText = `
    position:fixed; top:0; right:-100%; height:100%; width:85%; max-width:420px;
    background:#111; color:#fff; box-shadow:-4px 0 12px rgba(0,0,0,.6);
    border-left:2px solid #f9d44b; transition:.4s ease; z-index:1210;
    display:flex; flex-direction:column;
  `;
  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:14px;">
      <h3 style="color:#f9d44b;">📜 Meus Pedidos</h3>
      <button id="orders-close" style="background:none; border:none; color:#fff; font-size:1.4rem;">✕</button>
    </div>
    <div id="orders-content" style="flex:1; overflow-y:auto; padding:10px;">
      <p>Seus pedidos recentes aparecerão aqui.</p>
    </div>
  `;
  document.body.append(backdrop, panel);

  const close = () => {
    panel.style.right = "-100%";
    backdrop.style.opacity = "0";
    backdrop.style.visibility = "hidden";
  };
  document.getElementById("orders-close").onclick = close;
  backdrop.onclick = close;

  return { panel, backdrop };
}

/* ========= Botão “📜 Meus Pedidos” ========= */
try {
  auth.onAuthStateChanged((user) => {
    let ordersBtn = document.getElementById("orders-btn");

    if (user && !ordersBtn) {
      ordersBtn = document.createElement("button");
      ordersBtn.id = "orders-btn";
      ordersBtn.textContent = "📜 Meus Pedidos";
      ordersBtn.style.cssText = `
        position:fixed; bottom:120px; right:18px;
        background:#f9d44b; color:#000; font-weight:700;
        border:none; border-radius:999px; padding:10px 16px;
        box-shadow:0 4px 14px rgba(0,0,0,.4);
        cursor:pointer; z-index:3000;
        transition:transform .2s ease, opacity .2s ease;
        opacity:0; transform:translateY(20px);
      `;
      document.body.appendChild(ordersBtn);

      // animação suave
      setTimeout(() => {
        ordersBtn.style.opacity = "1";
        ordersBtn.style.transform = "translateY(0)";
      }, 100);

      ordersBtn.onclick = () => {
        clickSound.play().catch(() => {});
        const { panel, backdrop } = buildOrdersPanel();
        panel.style.right = "0";
        backdrop.style.opacity = "1";
        backdrop.style.visibility = "visible";
      };
    }

    if (!user && ordersBtn) ordersBtn.remove();
  });
} catch (err) {
  console.error("Erro ao exibir botão Meus Pedidos:", err);
}

/* ========= Teste simples de execução ========= */
setTimeout(() => {
  console.log("✅ Script carregado até o final!");
  const marker = document.createElement("div");
  marker.textContent = "⚡ OK";
  marker.style.cssText = `
    position:fixed; bottom:10px; left:10px;
    background:#f9d44b; color:#000;
    padding:6px 8px; border-radius:8px;
    font-weight:bold; z-index:5000;
  `;
  document.body.appendChild(marker);
}, 1500);

/* ========= Inicialização ========= */
document.addEventListener("DOMContentLoaded", () => {
  iniciarContador();
  atualizarStatus();
  iniciarCarrossel();
  setInterval(atualizarStatus, 60000);
});