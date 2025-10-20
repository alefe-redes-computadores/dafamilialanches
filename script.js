/* ================================
   DFL – Script principal (Parte 1/2)
   Firebase + Login Google/E-mail + UI
   ================================ */

/* 🔊 Som global */
const clickSound = new Audio("click.wav");
clickSound.volume = 0.4;

/* ========= Helpers ========= */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* ========= Firebase ========= */
async function loadFirebase() {
  const inject = (src) => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });

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
    
    <div style="display:flex; flex-direction:column; gap:8px;">
      <button id="btn-login" style="background:#f9d44b; color:#000; font-weight:700; border:none; border-radius:8px; padding:10px;">Entrar com Email</button>
      <button id="btn-sign"  style="background:#f9d44b; color:#000; font-weight:700; border:none; border-radius:8px; padding:10px;">Criar Conta</button>
      <button id="btn-google" style="background:#fff; color:#000; font-weight:700; border:none; border-radius:8px; padding:10px;">🔐 Entrar com Google</button>
      <button id="btn-close" style="background:#333; color:#fff; border:1px solid #444; border-radius:8px; padding:10px;">Fechar</button>
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

  /* ========= Funções ========= */
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
  async function doGoogle() {
    msg.textContent = "Abrindo login Google...";
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      msg.textContent = "✅ Login com Google realizado!";
      setTimeout(closeModal, 700);
    } catch (e) {
      msg.textContent = "⚠️ " + (e.message || "Falha ao entrar com Google");
    }
  }

  /* ========= Eventos ========= */
  modal.querySelector("#btn-login").addEventListener("click", doLogin);
  modal.querySelector("#btn-sign").addEventListener("click", doSign);
  modal.querySelector("#btn-google").addEventListener("click", doGoogle);

  auth.onAuthStateChanged((user) => {
    if (user) {
      userChip.textContent = `Olá, ${user.displayName || user.email.split("@")[0]} (Sair)`;
      userChip.onclick = async () => { await auth.signOut(); };
    } else {
      userChip.textContent = "Entrar / Cadastro";
      userChip.onclick = openModal;
    }
  });
}

/* ========= Inicialização ========= */
(async function startDFL() {
  try {
    await initFirebase();
    buildAuthUI();
    console.log("✅ Firebase e Login Google/email ativos");
  } catch (e) {
    console.error("Erro ao iniciar Firebase/Login:", e);
  }
})();

/* ================================
   DFL – Script principal (Parte 2/2)
   Carrinho + Adicionais + Firestore + WhatsApp
   ================================ */

/* ===== Elementos principais ===== */
const cartBtn = document.getElementById("cart-icon");
const miniCart = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");
const cartList = document.getElementById("mini-list");
const cartCount = document.getElementById("cart-count");
const clearCartBtn = document.getElementById("mini-clear");
const finishOrderBtn = document.getElementById("mini-checkout");
const closeCartBtn = document.querySelector(".mini-close");

let cart = JSON.parse(localStorage.getItem("dflCart") || "[]");

/* ===== Funções do carrinho ===== */
function atualizarCarrinho() {
  cartList.innerHTML = "";
  let total = 0;
  cart.forEach((item, i) => {
    const li = document.createElement("li");
    li.classList.add("cart-item");
    li.innerHTML = `
      <span>${item.nome}</span>
      <strong>R$ ${item.preco.toFixed(2)}</strong>
      <button class="remove-item" data-index="${i}">✕</button>`;
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

function removerDoCarrinho(i) {
  cart.splice(i, 1);
  atualizarCarrinho();
}
function limparCarrinho() {
  cart = [];
  atualizarCarrinho();
}

/* ===== Abrir / Fechar ===== */
function abrirCarrinho() {
  clickSound.currentTime = 0; clickSound.play().catch(()=>{});
  miniCart.classList.add("active");
  cartBackdrop.classList.add("show");
  document.body.classList.add("no-scroll");
}
function fecharCarrinho() {
  miniCart.classList.remove("active");
  cartBackdrop.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

/* ===== Popup "+1 adicionado!" ===== */
function mostrarPopupAdicionado(nomeProduto = null) {
  const popup = document.createElement("div");
  popup.className = "popup-add";
  popup.textContent = nomeProduto ? `🍔 ${nomeProduto} adicionado!` : "+1 adicionado!";
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1400);
}

/* ===== Modal de Adicionais ===== */
const extrasBackdrop = document.getElementById("extras-backdrop");
const extrasModal = document.getElementById("extras-modal");
const extrasList = document.getElementById("extras-list");
const extrasCancel = document.getElementById("extras-cancel");
const extrasAdd = document.getElementById("extras-add");

let produtoAtual = null;

document.querySelectorAll(".extras-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    produtoAtual = btn.closest(".card");
    abrirExtras(produtoAtual.dataset.name);
  });
});

function abrirExtras(nome) {
  extrasList.innerHTML = `
    <label><input type="checkbox" value="Cebola" data-price="0.99"> 🧅 Cebola — R$0,99</label>
    <label><input type="checkbox" value="Salada" data-price="1.99"> 🥬 Salada — R$1,99</label>
    <label><input type="checkbox" value="Ovo" data-price="1.99"> 🥚 Ovo — R$1,99</label>
    <label><input type="checkbox" value="Bacon" data-price="2.99"> 🥓 Bacon — R$2,99</label>
    <label><input type="checkbox" value="Cheddar" data-price="3.99"> 🧀 Cheddar — R$3,99</label>`;
  extrasModal.classList.add("show");
  extrasBackdrop.classList.add("show");
}
function fecharExtras() {
  extrasModal.classList.remove("show");
  extrasBackdrop.classList.remove("show");
}
extrasCancel.addEventListener("click", fecharExtras);
extrasBackdrop.addEventListener("click", fecharExtras);
extrasAdd.addEventListener("click", () => {
  clickSound.currentTime = 0; clickSound.play().catch(()=>{});
  const selecionados = extrasList.querySelectorAll("input:checked");
  selecionados.forEach(cb => adicionarAoCarrinho(cb.value, parseFloat(cb.dataset.price)));
  mostrarPopupAdicionado("Adicional");
  fecharExtras();
});

/* ===== Inicialização segura ===== */
document.addEventListener("DOMContentLoaded", () => {
  fecharCarrinho();
  atualizarCarrinho();
  cartBtn.addEventListener("click", abrirCarrinho);
  closeCartBtn.addEventListener("click", fecharCarrinho);
  cartBackdrop.addEventListener("click", fecharCarrinho);
  clearCartBtn.addEventListener("click", limparCarrinho);
  cartList.addEventListener("click", e => {
    if (e.target.classList.contains("remove-item")) removerDoCarrinho(e.target.dataset.index);
  });
  document.querySelectorAll(".add-cart").forEach(btn => {
    btn.addEventListener("click", () => {
      clickSound.currentTime = 0; clickSound.play().catch(()=>{});
      const card = btn.closest(".card");
      adicionarAoCarrinho(card.dataset.name, parseFloat(card.dataset.price));
    });
  });
});

/* ===== Contagem regressiva ===== */
function atualizarContagem() {
  const t = document.getElementById("timer");
  if (!t) return;
  const agora = new Date();
  const fim = new Date(); fim.setHours(23,59,59,999);
  const diff = fim - agora;
  if (diff <= 0) return t.textContent = "00:00:00";
  const h = Math.floor(diff/1000/60/60);
  const m = Math.floor((diff/1000/60)%60);
  const s = Math.floor((diff/1000)%60);
  t.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
setInterval(atualizarContagem,1000); atualizarContagem();

/* ===== Status aberto/fechado ===== */
function atualizarStatus() {
  const b = document.getElementById("status-banner");
  if (!b) return;
  const d = new Date(), dia = d.getDay(), h = d.getHours(), m = d.getMinutes();
  let aberto = false, msg = "";
  if (dia === 2) msg = "❌ Fechado — abrimos amanhã às 18h";
  else if ([1,3,4].includes(dia)) {
    aberto = h>=18 && (h<23 || (h===23&&m<=15));
    msg = aberto ? "🟢 Aberto até 23h15" : "🔴 Fechado — abrimos às 18h";
  } else if ([5,6,0].includes(dia)) {
    aberto = h>=17 && (h<23 || (h===23&&m<=30));
    msg = aberto ? "🟢 Aberto até 23h30" : "🔴 Fechado — abrimos às 17h30";
  }
  b.textContent = msg;
  b.className = aberto ? "status-banner aberto" : "status-banner fechado";
}
setInterval(atualizarStatus,60000); atualizarStatus();

/* ===== Carrossel ===== */
(function(){
  const slides = document.querySelectorAll("#promoCarousel .slide");
  const prev = document.querySelector("#promoCarousel .c-prev");
  const next = document.querySelector("#promoCarousel .c-next");
  if(!slides.length) return;
  let i=0; slides[i].classList.add("active");
  function show(k){ slides.forEach((s,j)=>s.style.display=j===k?"block":"none"); }
  prev.addEventListener("click",()=>{ clickSound.play().catch(()=>{}); i=(i-1+slides.length)%slides.length; show(i); });
  next.addEventListener("click",()=>{ clickSound.play().catch(()=>{}); i=(i+1)%slides.length; show(i); });
  setInterval(()=>{ i=(i+1)%slides.length; show(i); },5000);
})();

/* ===== Clique nas promoções (WhatsApp) ===== */
document.querySelectorAll(".carousel .slide").forEach(img=>{
  img.addEventListener("click",()=>{
    clickSound.play().catch(()=>{});
    const msg = encodeURIComponent(img.dataset.wa || "Olá! Quero aproveitar a promoção 🍔");
    window.open(`https://wa.me/5534997178336?text=${msg}`,"_blank");
  });
});

/* ===== Pedido Firestore + WhatsApp ===== */
function montarPedido() {
  const itens = cart.map((x,i)=>({ ordem:i+1, nome:x.nome, preco:x.preco }));
  const total = itens.reduce((s,x)=>s+x.preco,0);
  const user = window.auth?.currentUser;
  return {
    itens, total, status:"aberto", origem:"site",
    uid:user?.uid||null, email:user?.email||null,
    criadoEm:(window.firebase?.firestore?.FieldValue.serverTimestamp())||new Date()
  };
}
async function salvarPedido(p) {
  try {
    if(!window.db) return {ok:false};
    const ref = await db.collection("pedidos").add(p);
    return {ok:true,id:ref.id};
  } catch(e){ console.error(e); return {ok:false}; }
}
async function handleFecharPedido() {
  clickSound.play().catch(()=>{});
  if(!cart.length) return alert("Seu carrinho está vazio!");
  const pedido = montarPedido();
  const res = await salvarPedido(pedido);
  if(res.ok) console.log("Pedido salvo:",res.id);
  const msg = encodeURIComponent(
    `🧾 *Pedido – Da Família Lanches*\n\n${pedido.itens.map(i=>`${i.ordem}. ${i.nome} — R$ ${i.preco.toFixed(2)}`).join("\n")}\n\n💰 *Total:* R$ ${pedido.total.toFixed(2)}\n📍 Patos de Minas`
  );
  window.open(`https://wa.me/5534997178336?text=${msg}`,"_blank");
  fecharCarrinho();
}
finishOrderBtn.addEventListener("click", handleFecharPedido);
console.log("✅ Parte 2 carregada com sucesso");

/* ================================
   HISTÓRICO DE PEDIDOS – Etapa 1
   ================================ */
let ordersPanel, ordersBackdrop;

function buildOrdersPanel() {
  // Evita duplicar
  if (document.getElementById("orders-panel")) return;

  // Backdrop
  ordersBackdrop = document.createElement("div");
  ordersBackdrop.id = "orders-backdrop";
  ordersBackdrop.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,.55);
    opacity:0; visibility:hidden; transition:.25s ease;
    z-index:9998;
  `;
  document.body.appendChild(ordersBackdrop);

  // Painel lateral
  ordersPanel = document.createElement("aside");
  ordersPanel.id = "orders-panel";
  ordersPanel.style.cssText = `
    position:fixed; top:0; right:-100%; width:340px; height:100vh;
    background:#111; color:#fff; border-left:2px solid #f9d44b;
    z-index:9999; display:flex; flex-direction:column;
    transition:right .35s ease;
  `;
  ordersPanel.innerHTML = `
    <header style="display:flex;justify-content:space-between;align-items:center;
      padding:12px 14px;border-bottom:1px solid #262626;background:#000;">
      <h3 style="margin:0;color:#f9d44b;">📜 Meus Pedidos</h3>
      <button id="orders-close"
        style="background:#f9d44b;color:#000;border:none;border-radius:8px;
        padding:6px 10px;font-weight:800;cursor:pointer;">✕</button>
    </header>
    <div id="orders-list" style="flex:1;overflow:auto;padding:12px;">
      <p style="color:#aaa;">Nenhum pedido ainda.</p>
    </div>
  `;
  document.body.appendChild(ordersPanel);

  // Fechar painel
  const close = () => {
    ordersPanel.style.right = "-100%";
    ordersBackdrop.style.opacity = "0";
    ordersBackdrop.style.visibility = "hidden";
  };
  document.getElementById("orders-close").onclick = close;
  ordersBackdrop.onclick = close;

  console.log("✅ Painel de pedidos criado");
}

/* Mostrar ou esconder botão “Meus Pedidos” */
setTimeout(() => {
  if (typeof auth === "undefined") {
    console.warn("⚠️ Firebase ainda não carregou — aguardando...");
    return;
  }

  /* Mostrar ou esconder botão “Meus Pedidos” */
setTimeout(() => {
  if (typeof auth === "undefined") {
    console.warn("⚠️ Firebase ainda não carregou — aguardando...");
    return;
  }

  auth.onAuthStateChanged((user) => {
    let ordersBtn = document.getElementById("orders-btn");

    if (user && !ordersBtn) {
      ordersBtn = document.createElement("button");
      ordersBtn.id = "orders-btn";
      ordersBtn.textContent = "📜 Meus Pedidos";
      ordersBtn.style.cssText = `
        position: fixed;
        bottom: 120px;  /* ficou escondido antes, agora sobe */
        right: 18px;
        background: #f9d44b;
        color: #000;
        font-weight: 700;
        border: none;
        border-radius: 999px;
        padding: 10px 16px;
        box-shadow: 0 4px 14px rgba(0,0,0,.4);
        cursor: pointer;
        z-index: 3000; /* mais alto que o carrinho */
        transition: transform .2s ease, opacity .2s ease;
        opacity: 0; transform: translateY(20px);
      `;
      document.body.appendChild(ordersBtn);

      // animação suave ao aparecer
      setTimeout(() => {
        ordersBtn.style.opacity = "1";
        ordersBtn.style.transform = "translateY(0)";
      }, 100);

      ordersBtn.onclick = () => {
        clickSound.play().catch(() => {});
        buildOrdersPanel();
        ordersPanel.style.right = "0";
        ordersBackdrop.style.opacity = "1";
        ordersBackdrop.style.visibility = "visible";
      };
    }

    if (!user && ordersBtn) ordersBtn.remove();
  });
}, 2000);