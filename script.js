/* ================================
   DFL – Script principal (v1.1.5)
   - Login (Email + Google)
   - Carrinho com quantidade
   - Adicionais, Carrossel, Status, Som
   - Salvar pedidos no Firestore
   ================================ */

/* 🔊 Som global */
const clickSound = new Audio("click.wav");
clickSound.volume = 0.4;

/* Helper */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* =======================
   Firebase
   ======================= */
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

/* =======================
   Login UI (Email + Google)
   ======================= */
function buildAuthUI() {
  const header = document.querySelector(".header") || document.body;

  const userChip = document.createElement("button");
  userChip.id = "user-chip";
  userChip.type = "button";
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
    background:#111; color:#fff; border:2px solid #f9d44b;
    border-radius:14px; width:90%; max-width:420px; padding:18px;
    z-index:1210; display:none; box-shadow:0 10px 30px rgba(0,0,0,.5);
  `;
  modal.innerHTML = `
    <h3 style="color:#f9d44b; margin:0 0 10px">Entrar / Criar conta</h3>

    <button id="btn-google" style="
      width:100%; display:flex; align-items:center; justify-content:center;
      gap:10px; padding:10px; border-radius:8px; border:1px solid #ccc;
      background:#fff; color:#111; font-weight:600; margin-bottom:12px;">
      <img src='https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg'
        alt='Google logo' width='20' height='20'>
      <span>Continuar com Google</span>
    </button>

    <div style="height:1px;background:#333;margin:10px 0;"></div>

    <label style="display:block; font-size:.9rem; margin-bottom:6px;">E-mail</label>
    <input id="auth-email" type="email" placeholder="seu@email.com"
      style="width:100%; padding:10px; border-radius:8px; border:1px solid #333;
      background:#1a1a1a; color:#fff; margin-bottom:12px;" />

    <label style="display:block; font-size:.9rem; margin-bottom:6px;">Senha</label>
    <input id="auth-pass" type="password" placeholder="mínimo 6 caracteres"
      style="width:100%; padding:10px; border-radius:8px; border:1px solid #333;
      background:#1a1a1a; color:#fff; margin-bottom:16px;" />

    <div style="display:flex; gap:8px; flex-wrap:wrap;">
      <button id="btn-login" style="flex:1; background:#f9d44b; color:#000; font-weight:700; border:none; border-radius:8px; padding:10px;">Entrar</button>
      <button id="btn-sign"  style="flex:1; background:#f9d44b; color:#000; font-weight:700; border:none; border-radius:8px; padding:10px;">Criar conta</button>
      <button id="btn-close" style="flex:1; background:#333; color:#fff; border:1px solid #444; border-radius:8px; padding:10px;">Fechar</button>
    </div>

    <p id="auth-msg" style="margin-top:12px; min-height:20px; font-size:.9rem; color:#ffb13b;"></p>
  `;
  document.body.appendChild(modal);

  const msg = modal.querySelector("#auth-msg");
  const emailEl = modal.querySelector("#auth-email");
  const passEl = modal.querySelector("#auth-pass");
  const btnGoogle = modal.querySelector("#btn-google");

  const openModal = () => { clickSound.currentTime = 0; clickSound.play().catch(()=>{}); backdrop.style.display = "block"; modal.style.display = "block"; };
  const closeModal = () => { backdrop.style.display = "none"; modal.style.display = "none"; };

  userChip.addEventListener("click", openModal);
  backdrop.addEventListener("click", closeModal);
  modal.querySelector("#btn-close").addEventListener("click", closeModal);

  async function doLogin() {
    msg.textContent = "Entrando...";
    try {
      await auth.signInWithEmailAndPassword(emailEl.value.trim(), passEl.value);
      msg.textContent = "✅ Login realizado!";
      await sleep(600);
      closeModal();
    } catch (e) { msg.textContent = "⚠️ " + (e.message || "Erro ao entrar"); }
  }

  async function doSign() {
    msg.textContent = "Criando conta...";
    try {
      await auth.createUserWithEmailAndPassword(emailEl.value.trim(), passEl.value);
      msg.textContent = "✅ Conta criada!";
      await sleep(700);
      closeModal();
    } catch (e) { msg.textContent = "⚠️ " + (e.message || "Erro ao criar conta"); }
  }

  modal.querySelector("#btn-login").addEventListener("click", doLogin);
  modal.querySelector("#btn-sign").addEventListener("click", doSign);

  btnGoogle.addEventListener("click", async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      msg.textContent = "✅ Logado com Google!";
      await sleep(500);
      closeModal();
    } catch (e) { msg.textContent = "⚠️ " + (e.message || "Erro no Google Sign-In"); }
  });

  auth.onAuthStateChanged((user) => {
    if (user) {
      userChip.textContent = `Olá, ${user.email.split("@")[0]} (Sair)`;
      userChip.onclick = async () => { clickSound.currentTime = 0; clickSound.play().catch(()=>{}); await auth.signOut(); };
    } else {
      userChip.textContent = "Entrar / Cadastro";
      userChip.onclick = openModal;
    }
  });
}

/* =======================
   Carrinho com quantidade
   ======================= */
const cartBtn = document.getElementById("cart-icon");
const miniCart = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");
const cartList = document.getElementById("mini-list");
const cartCount = document.getElementById("cart-count");
const clearCartBtn = document.getElementById("mini-clear");
const finishOrderBtn = document.getElementById("mini-checkout");
const closeCartBtn = document.querySelector(".mini-close");

/* Cart interno (v2 = com qty) */
const CART_KEY = "dflCartV2";
let cart = [];

/* Migração */
function migrateCartIfNeeded() {
  const v2 = localStorage.getItem(CART_KEY);
  if (v2) {
    try { cart = JSON.parse(v2) || []; return; } catch {}
  }
  const old = localStorage.getItem("dflCart");
  if (!old) { cart = []; saveCart(); return; }
  try {
    const arr = JSON.parse(old) || [];
    const map = new Map();
    arr.forEach(it => {
      const id = (it.id || it.nome || it.name || "").toString();
      const key = id || (it.nome + "|" + it.preco);
      const existing = map.get(key);
      if (existing) existing.qty += 1;
      else map.set(key, { id: id || key, name: it.nome, price: Number(it.preco), qty: 1 });
    });
    cart = Array.from(map.values());
    saveCart();
  } catch { cart = []; saveCart(); }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  cartCount.textContent = cart.reduce((s, x) => s + x.qty, 0);
}

function openCart() {
  clickSound.currentTime = 0; clickSound.play().catch(()=>{});
  miniCart.classList.add("active");
  cartBackdrop.classList.add("show");
  document.body.classList.add("no-scroll");
}
function closeCart() {
  miniCart.classList.remove("active");
  cartBackdrop.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

function addItem({ id, name, price }, qty = 1) {
  const key = id || name;
  const i = cart.findIndex(x => (x.id || x.name) === key && x.price === price);
  if (i >= 0) cart[i].qty += qty;
  else cart.push({ id: key, name, price, qty });
  renderCart();
  saveCart();
  showAddedPopup(name);
  if (!miniCart.classList.contains("active")) openCart();
}

function incItem(index) { cart[index].qty += 1; renderCart(); saveCart(); }
function decItem(index) {
  cart[index].qty -= 1;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  renderCart(); saveCart();
}
function removeItem(index) { cart.splice(index, 1); renderCart(); saveCart(); }
function clearCart() { cart = []; renderCart(); saveCart(); }

function renderCart() {
  cartList.innerHTML = "";
  let total = 0;
  cart.forEach((it, idx) => {
    total += it.price * it.qty;
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <span>${it.name}</span>
      <div style="display:flex; align-items:center; gap:8px;">
        <button class="qty-dec" data-idx="${idx}" aria-label="Diminuir">–</button>
        <strong>${it.qty}x</strong>
        <button class="qty-inc" data-idx="${idx}" aria-label="Aumentar">+</button>
        <strong>R$ ${(it.price * it.qty).toFixed(2)}</strong>
        <button class="remove-item" data-idx="${idx}" aria-label="Remover">✕</button>
      </div>
    `;
    cartList.appendChild(li);
  });
  cartCount.textContent = cart.reduce((s, x) => s + x.qty, 0);
  clearCartBtn.style.display = cart.length ? "inline-block" : "none";
  finishOrderBtn.style.display = cart.length ? "inline-block" : "none";
}

function showAddedPopup(name) {
  const popup = document.createElement("div");
  popup.className = "popup-add";
  popup.textContent = `🍔 ${name} adicionado!`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1400);
}

/* =======================
   Adicionais
   ======================= */
const extrasBackdrop = document.getElementById("extras-backdrop");
const extrasModal = document.getElementById("extras-modal");
const extrasList = document.getElementById("extras-list");
const extrasCancel = document.getElementById("extras-cancel");
const extrasAdd = document.getElementById("extras-add");
let produtoAtual = null;

function openExtras(nomeProduto) {
  extrasList.innerHTML = `
    <label><input type="checkbox" value="Cebola" data-price="0.99"> 🧅 Cebola — R$0,99</label>
    <label><input type="checkbox" value="Salada" data-price="1.99"> 🥬 Salada — R$1,99</label>
    <label><input type="checkbox" value="Ovo" data-price="1.99"> 🥚 Ovo — R$1,99</label>
    <label><input type="checkbox" value="Salsicha" data-price="1.99"> 🌭 Salsicha — R$1,99</label>
    <label><input type="checkbox" value="Bacon" data-price="2.99"> 🥓 Bacon — R$2,99</label>
    <label><input type="checkbox" value="Molho Verde" data-price="2.99"> 🌿 Molho Verde — R$2,99</label>
    <label><input type="checkbox" value="Cheddar" data-price="3.99"> 🧀 Cheddar — R$3,99</label>
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

/* =======================
   Pedido (Firestore + WhatsApp)
   ======================= */
function montarObjetoPedido() {
  const itens = cart.map((it, idx) => ({
    ordem: idx + 1,
    nome: String(it.name),
    preco: Number(it.price),
    quantidade: Number(it.qty),
    subtotal: Number(it.price * it.qty)
  }));
  const total = itens.reduce((s, x) => s + x.subtotal, 0);
  const user = (window.auth && window.auth.currentUser) || null;
  return {
    itens,
    total,
    moeda: "BRL",
    origem: "site",
    status: "aberto",
    uid: user ? user.uid : null,
    email: user ? user.email : null,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
  };
}

async function salvarPedidoNoFirestore(pedido) {
  try {
    const ref = await db.collection("pedidos").add(pedido);
    return { ok: true, id: ref.id };
  } catch (err) {
    console.error("Erro ao salvar pedido:", err);
    return { ok: false, id: null };
  }
}

function montarMensagemWhats(pedido) {
  let msg = "🧾 *Pedido – Da Família Lanches*%0A%0A";
  pedido.itens.forEach((item) => {
    msg += `${item.ordem}. ${item.nome} (${item.quantidade}x) — R$ ${item.subtotal.toFixed(2)}%0A`;
  });
  msg += `%0A💰 *Total:* R$ ${pedido.total.toFixed(2)}%0A📍 Patos de Minas`;
  return msg;
}

async function handleFecharPedido() {
  if (!cart.length) return alert("Seu carrinho está vazio!");
  const pedido = montarObjetoPedido();
  const salvar = await salvarPedidoNoFirestore(pedido);
  if (salvar.ok) {
    const numero = "5534997178336";
    const mensagem = montarMensagemWhats(pedido);
    window.open(`https://wa.me/${numero}?text=${mensagem}`, "_blank");
    closeCart();
    clearCart();
  } else {
    alert("⚠️ Erro ao registrar o pedido no servidor.");
  }
}

/* =======================
   Carrossel, Status, Timer
   ======================= */
function atualizarContagem() {
  const el = document.getElementById("timer");
  if (!el) return;
  const agora = new Date();
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  const diff = fim - agora;
  if (diff <= 0) return (el.textContent = "00:00:00");
  const h = Math.floor(diff / 1000 / 60 / 60);
  const m = Math.floor((diff / 1000 / 60) % 60);
  const s = Math.floor((diff / 1000) % 60);
  el.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
setInterval(atualizarContagem, 1000);

function atualizarStatus() {
  const banner = document.getElementById("status-banner");
  if (!banner) return;
  const agora = new Date();
  const dia = agora.getDay();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();
  let aberto = false;
  let msg = "";
  if (dia === 2) msg = "❌ Fechado — abrimos amanhã às 18h";
  else if ([1,3,4].includes(dia)) {
    aberto = hora >= 18 && (hora < 23 || (hora === 23 && minuto <= 15));
    msg = aberto ? "🟢 Aberto até 23h15" : "🔴 Fechado — abrimos às 18h";
  } else if ([5,6,0].includes(dia)) {
    aberto = hora >= 17 && (hora < 23 || (hora === 23 && minuto <= 30));
    msg = aberto ? "🟢 Aberto até 23h30" : "🔴 Fechado — abrimos às 17h30";
  }
  banner.textContent = msg;
  banner.className = aberto ? "status-banner aberto" : "status-banner fechado";
}
setInterval(atualizarStatus, 60000);

function initCarousel() {
  const container = document.querySelector("#promoCarousel .slides");
  if (!container) return;
  const prevBtn = document.querySelector("#promoCarousel .c-prev");
  const nextBtn = document.querySelector("#promoCarousel .c-next");
  const slides = Array.from(container.querySelectorAll(".slide"));
  if (!slides.length) return;
  let index = 0;
  function showSlide(i) { slides.forEach((s, idx) => s.style.display = (idx === i ? "block" : "none")); }
  showSlide(index);
  prevBtn.addEventListener("click", () => {
    clickSound.currentTime = 0; clickSound.play().catch(()=>{});
    index = (index - 1 + slides.length) % slides.length; showSlide(index);
  });
  nextBtn.addEventListener("click", () => {
    clickSound.currentTime = 0; clickSound.play().catch(()=>{});
    index = (index + 1) % slides.length; showSlide(index);
  });
  setInterval(() => { index = (index + 1) % slides.length; showSlide(index); }, 5000);
}

/* =======================
   Inicialização
   ======================= */
document.addEventListener("DOMContentLoaded", () => {
  miniCart?.classList.remove("active");
  cartBackdrop?.classList.remove("show");
  document.body.classList.remove("no-scroll");

  migrateCartIfNeeded();
  renderCart();
  atualizarContagem();
  atualizarStatus();
  initCarousel();

  cartBtn?.addEventListener("click", openCart);
  closeCartBtn?.addEventListener("click", closeCart);
  cartBackdrop?.addEventListener("click", closeCart);
  clearCartBtn?.addEventListener("click", clearCart);
  finishOrderBtn?.addEventListener("click", handleFecharPedido);

  cartList?.addEventListener("click", (e) => {
    const t = e.target;
    if (t.classList.contains("qty-inc")) incItem(Number(t.dataset.idx));
    else if (t.classList.contains("qty-dec")) decItem(Number(t.dataset.idx));
    else if (t.classList.contains("remove-item")) removeItem(Number(t.dataset.idx));
  });

  document.querySelectorAll(".add-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      if (!card) return;
      const id = card.dataset.id || card.dataset.name;
      const name = card.dataset.name;
      const price = parseFloat(card.dataset.price);
      addItem({ id, name, price }, 1);
    });
  });

  document.querySelectorAll(".extras-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      produtoAtual = btn.closest(".card");
      openExtras(produtoAtual?.dataset?.name || "Produto");
    });
  });

  extrasAdd?.addEventListener("click", () => {
    clickSound.currentTime = 0; clickSound.play().catch(()=>{});
    const checks = extrasList.querySelectorAll("input[type='checkbox']:checked");
    checks.forEach((cb) => {
      const name = cb.value;
      const price = parseFloat(cb.dataset.price);
      addItem({ id: "extra:"+name, name, price }, 1);
    });
    closeExtras();
  });
});

/* Firebase + Login */
(async function startDFL() {
  try {
    await initFirebase();
    buildAuthUI();
    console.log("✅ Firebase e Login prontos");
  } catch (e) {
    console.error("Erro ao iniciar Firebase/Login:", e);
  }
})();