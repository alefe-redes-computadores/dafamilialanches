/* ===================================================
   DFL – Script principal (v1.2)
   - Login (Email + Google)
   - Carrinho com quantidade e extras
   - Histórico de pedidos (painel lateral)
   =================================================== */

const clickSound = new Audio("click.wav");
clickSound.volume = 0.4;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* =======================
   Firebase
   ======================= */
async function loadFirebase() {
  const inject = (src) => new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  await inject("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
  await inject("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js");
  await inject("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js");
}

async function initFirebase() {
  await loadFirebase();
  const config = {
    apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
    authDomain: "da-familia-lanches.firebaseapp.com",
    projectId: "da-familia-lanches",
    storageBucket: "da-familia-lanches.firebasestorage.app",
    messagingSenderId: "106857147317",
    appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
    measurementId: "G-TCZ18HFWGX"
  };
  if (!firebase.apps.length) firebase.initializeApp(config);
  window.db = firebase.firestore();
  window.auth = firebase.auth();
}

/* =======================
   Login UI
   ======================= */
function buildAuthUI() {
  const header = document.querySelector(".header");
  const chip = document.createElement("button");
  chip.id = "user-chip";
  chip.textContent = "Entrar / Cadastro";
  chip.className = "user-chip";
  header.appendChild(chip);

  const modal = document.createElement("div");
  modal.id = "auth-modal";
  modal.innerHTML = `
    <div class="auth-box">
      <h3>Entrar / Criar conta</h3>
      <button id="btn-google" class="google-btn">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20">
        <span>Entrar com Google</span>
      </button>
      <input id="auth-email" type="email" placeholder="E-mail" />
      <input id="auth-pass" type="password" placeholder="Senha (mín. 6 caracteres)" />
      <div class="auth-actions">
        <button id="btn-login">Entrar</button>
        <button id="btn-sign">Cadastrar</button>
        <button id="btn-close">Fechar</button>
      </div>
      <p id="auth-msg"></p>
    </div>`;
  document.body.appendChild(modal);

  const msg = modal.querySelector("#auth-msg");
  const emailEl = modal.querySelector("#auth-email");
  const passEl = modal.querySelector("#auth-pass");

  const openModal = () => modal.classList.add("show");
  const closeModal = () => modal.classList.remove("show");
  chip.onclick = openModal;
  modal.querySelector("#btn-close").onclick = closeModal;

  async function login() {
    msg.textContent = "Entrando...";
    try {
      await auth.signInWithEmailAndPassword(emailEl.value.trim(), passEl.value);
      msg.textContent = "✅ Logado!";
      await sleep(700);
      closeModal();
    } catch (e) { msg.textContent = "⚠️ " + e.message; }
  }

  async function signUp() {
    msg.textContent = "Criando conta...";
    try {
      await auth.createUserWithEmailAndPassword(emailEl.value.trim(), passEl.value);
      msg.textContent = "✅ Conta criada!";
      await sleep(700);
      closeModal();
    } catch (e) { msg.textContent = "⚠️ " + e.message; }
  }

  modal.querySelector("#btn-login").onclick = login;
  modal.querySelector("#btn-sign").onclick = signUp;

  modal.querySelector("#btn-google").onclick = async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      msg.textContent = "✅ Logado com Google!";
      await sleep(700);
      closeModal();
    } catch (e) { msg.textContent = "⚠️ " + e.message; }
  };

  auth.onAuthStateChanged(user => {
    if (user) {
      chip.textContent = `${user.email.split("@")[0]} (Sair)`;
      chip.onclick = () => auth.signOut();
    } else {
      chip.textContent = "Entrar / Cadastro";
      chip.onclick = openModal;
    }
  });
}

/* =======================
   Carrinho (v2)
   ======================= */
const CART_KEY = "dflCartV2";
let cart = [];

const els = {
  btnCart: document.getElementById("cart-icon"),
  mini: document.getElementById("mini-cart"),
  backdrop: document.getElementById("cart-backdrop"),
  list: document.getElementById("mini-list"),
  count: document.getElementById("cart-count"),
  clear: document.getElementById("mini-clear"),
  checkout: document.getElementById("mini-checkout"),
  close: document.querySelector(".mini-close")
};

function loadCart() {
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { cart = []; }
  saveCart();
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  els.count.textContent = cart.reduce((s, x) => s + x.qty, 0);
}

function openCart() {
  clickSound.play().catch(()=>{});
  els.mini.classList.add("active");
  els.backdrop.classList.add("show");
}
function closeCart() {
  els.mini.classList.remove("active");
  els.backdrop.classList.remove("show");
}

function renderCart() {
  els.list.innerHTML = "";
  let total = 0;
  cart.forEach((it, i) => {
    total += it.price * it.qty;
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${it.name}</span>
      <div class="qty-box">
        <button class="dec" data-i="${i}">-</button>
        <strong>${it.qty}</strong>
        <button class="inc" data-i="${i}">+</button>
        <span>R$ ${(it.price * it.qty).toFixed(2)}</span>
        <button class="rm" data-i="${i}">✕</button>
      </div>`;
    els.list.appendChild(li);
  });
  els.clear.style.display = cart.length ? "inline-block" : "none";
  els.checkout.style.display = cart.length ? "inline-block" : "none";
  els.count.textContent = cart.reduce((s, x) => s + x.qty, 0);
}

function addItem({ id, name, price }, qty=1) {
  const i = cart.findIndex(x => x.id === id);
  if (i >= 0) cart[i].qty += qty;
  else cart.push({ id, name, price, qty });
  saveCart(); renderCart();
}

function incItem(i) { cart[i].qty++; saveCart(); renderCart(); }
function decItem(i) {
  cart[i].qty--;
  if (cart[i].qty <= 0) cart.splice(i, 1);
  saveCart(); renderCart();
}
function removeItem(i) { cart.splice(i, 1); saveCart(); renderCart(); }
function clearCart() { cart = []; saveCart(); renderCart(); }

function showAddedPopup(name) {
  const pop = document.createElement("div");
  pop.className = "popup-add";
  pop.textContent = `🍔 ${name} adicionado!`;
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 1400);
}

/* =======================
   Adicionais
   ======================= */
const extrasModal = document.getElementById("extras-modal");
const extrasBackdrop = document.getElementById("extras-backdrop");
const extrasList = document.getElementById("extras-list");
const extrasAdd = document.getElementById("extras-add");
const extrasCancel = document.getElementById("extras-cancel");
let produtoAtual = null;

function openExtras(nome) {
  extrasList.innerHTML = `
    <label><input type="checkbox" value="Bacon" data-price="2.99"> 🥓 Bacon — R$2,99</label>
    <label><input type="checkbox" value="Cheddar" data-price="3.99"> 🧀 Cheddar — R$3,99</label>
    <label><input type="checkbox" value="Molho Verde" data-price="2.99"> 🌿 Molho Verde — R$2,99</label>
  `;
  extrasModal.classList.add("show");
  extrasBackdrop.classList.add("show");
}
function closeExtras() {
  extrasModal.classList.remove("show");
  extrasBackdrop.classList.remove("show");
}
extrasCancel?.addEventListener("click", closeExtras);
extrasBackdrop?.addEventListener("click", closeExtras);

extrasAdd?.addEventListener("click", () => {
  const checks = extrasList.querySelectorAll("input:checked");
  checks.forEach(cb => {
    addItem({ id: "extra-" + cb.value, name: cb.value, price: parseFloat(cb.dataset.price) }, 1);
  });
  closeExtras();
});

/* =======================
   Pedido (WhatsApp + Histórico)
   ======================= */
function montarPedido() {
  const itens = cart.map((x, i) => ({
    n: i + 1, nome: x.name, preco: x.price, qtd: x.qty, sub: x.qty * x.price
  }));
  const total = itens.reduce((s, x) => s + x.sub, 0);
  return { itens, total, criado: new Date().toISOString() };
}

function gerarMensagemWhats(p) {
  let msg = "🧾 *Pedido – Da Família Lanches*%0A%0A";
  p.itens.forEach(i => msg += `${i.n}. ${i.nome} (${i.qtd}x) — R$ ${i.sub.toFixed(2)}%0A`);
  msg += `%0A💰 *Total:* R$ ${p.total.toFixed(2)}%0A📍 Patos de Minas`;
  return msg;
}

async function handleCheckout() {
  if (!cart.length) return alert("Seu carrinho está vazio!");
  const pedido = montarPedido();
  salvarNoHistorico(pedido);
  const msg = gerarMensagemWhats(pedido);
  const numero = "5534997178336";
  window.open(`https://wa.me/${numero}?text=${msg}`, "_blank");
  closeCart();
}

/* =======================
   Histórico de Pedidos
   ======================= */
const HIST_KEY = "dflPedidos";
let historico = [];

function carregarHistorico() {
  try { historico = JSON.parse(localStorage.getItem(HIST_KEY)) || []; }
  catch { historico = []; }
}
function salvarNoHistorico(pedido) {
  historico.unshift(pedido);
  if (historico.length > 20) historico.pop();
  localStorage.setItem(HIST_KEY, JSON.stringify(historico));
}

/* Painel lateral */
function criarPainelHistorico() {
  const painel = document.createElement("aside");
  painel.id = "painel-historico";
  painel.innerHTML = `
    <div class="painel-head">
      <h3>📜 Meus Pedidos</h3>
      <button id="fechar-historico">✕</button>
    </div>
    <div id="lista-historico" class="painel-lista"></div>`;
  document.body.appendChild(painel);

  const botao = document.createElement("button");
  botao.id = "btn-historico";
  botao.textContent = "📜 Meus Pedidos";
  botao.className = "btn-historico";
  document.querySelector(".header").appendChild(botao);

  botao.onclick = () => {
    renderHistorico();
    painel.classList.add("show");
  };
  document.getElementById("fechar-historico").onclick = () =>
    painel.classList.remove("show");
}

function renderHistorico() {
  const lista = document.getElementById("lista-historico");
  if (!lista) return;
  carregarHistorico();

  if (!historico.length) {
    lista.innerHTML = `<p style="color:#bbb;text-align:center;margin-top:20px;">
      Nenhum pedido salvo ainda.</p>`;
    return;
  }

  lista.innerHTML = historico.map((p, idx) => `
    <div class="pedido-item">
      <h4>Pedido #${idx + 1}</h4>
      <ul>${p.itens.map(i => `<li>${i.qtd}x ${i.nome} — R$ ${i.sub.toFixed(2)}</li>`).join("")}</ul>
      <p><b>Total:</b> R$ ${p.total.toFixed(2)}</p>
      <p class="data">${new Date(p.criado).toLocaleString("pt-BR")}</p>
    </div>
  `).join("");
}

/* =======================
   Inicialização principal
   ======================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCart(); renderCart(); carregarHistorico(); criarPainelHistorico();

  els.btnCart.onclick = openCart;
  els.close.onclick = closeCart;
  els.backdrop.onclick = closeCart;
  els.clear.onclick = clearCart;
  els.checkout.onclick = handleCheckout;

  els.list.onclick = (e) => {
    const t = e.target;
    if (t.classList.contains("inc")) incItem(Number(t.dataset.i));
    if (t.classList.contains("dec")) decItem(Number(t.dataset.i));
    if (t.classList.contains("rm")) removeItem(Number(t.dataset.i));
  };

  document.querySelectorAll(".add-cart").forEach(btn => {
    btn.onclick = () => {
      const c = btn.closest(".card");
      addItem({
        id: c.dataset.id, name: c.dataset.name, price: parseFloat(c.dataset.price)
      }, 1);
      showAddedPopup(c.dataset.name);
    };
  });

  document.querySelectorAll(".extras-btn").forEach(btn => {
    btn.onclick = () => {
      produtoAtual = btn.closest(".card");
      openExtras(produtoAtual.dataset.name);
    };
  });
});

/* Firebase + Login */
(async function startDFL() {
  try {
    await initFirebase();
    buildAuthUI();
    console.log("✅ Firebase e Login prontos");
  } catch (e) {
    console.error("Erro Firebase/Login:", e);
  }
})();