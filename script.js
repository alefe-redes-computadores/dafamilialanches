/* ================================
   DFL – Script principal (PARTE 1/3)
   Firebase + Autenticação + UI de Login
   ==================================== */

/* 🔊 Som global */
const clickSound = new Audio("click.wav");
clickSound.volume = 0.4;

// --- Correção hard: garante que o carrinho nunca inicie aberto ---
window.addEventListener("load", () => {
  const miniCart = document.getElementById("mini-cart");
  const cartBackdrop = document.getElementById("cart-backdrop");
  if (miniCart && cartBackdrop) {
    miniCart.classList.remove("active");
    cartBackdrop.classList.remove("show");
    document.body.classList.remove("no-scroll");
  }
});

/* ========= Helpers ========= */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* ========= Carregar Firebase ========= */
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

/* ========= Inicializar Firebase ========= */
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
  userChip.type = "button";
  userChip.style.cssText = `
    position: fixed; top: 12px; right: 12px; z-index: 1100;
    background:#f9d44b; color:#000; font-weight:700; border:none;
    border-radius:999px; padding:8px 12px; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,.4);
  `;
  userChip.textContent = "Entrar / Cadastro";
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
  const passEl  = modal.querySelector("#auth-pass");

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

(async function bootstrapParte1() {
  try {
    await initFirebase();
    buildAuthUI();
    console.log("✅ Firebase + Auth prontos (PARTE 1/3).");
  } catch (err) {
    console.error("Erro ao iniciar Firebase/Auth:", err);
  }
})();
/* ================================
   DFL – Script principal (PARTE 2/3)
   Carrinho, popup, adicionais, contador etc.
   ==================================== */

/* ========= Elementos principais ========= */
const cartBtn = document.getElementById("cart-icon");
const miniCart = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");
const cartList = document.getElementById("mini-list");
const cartCount = document.getElementById("cart-count");
const clearCartBtn = document.getElementById("mini-clear");
const finishOrderBtn = document.getElementById("mini-checkout");
const closeCartBtn = document.querySelector(".mini-close");

let cart = JSON.parse(localStorage.getItem("dflCart") || "[]");

/* ========= Funções do carrinho ========= */
function atualizarCarrinho() {
  cartList.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    const li = document.createElement("li");
    li.classList.add("cart-item");
    li.innerHTML = `
      <span>${item.nome}</span>
      <strong>R$ ${item.preco.toFixed(2)}</strong>
      <button class="remove-item" data-index="${index}">✕</button>
    `;
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

function removerDoCarrinho(index) {
  cart.splice(index, 1);
  atualizarCarrinho();
}

function limparCarrinho() {
  cart = [];
  atualizarCarrinho();
}

/* ========= Abrir / Fechar ========= */
function abrirCarrinho() {
  miniCart.classList.add("active");
  cartBackdrop.classList.add("show");
  document.body.classList.add("no-scroll");
}

function fecharCarrinho() {
  miniCart.classList.remove("active");
  cartBackdrop.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

/* ========= Inicialização segura ========= */
document.addEventListener("DOMContentLoaded", () => {
  fecharCarrinho();
  atualizarCarrinho();

  cartBtn.addEventListener("click", () => {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
    abrirCarrinho();
  });

  const fecharCarrinhoSeguro = () => {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
    fecharCarrinho();
  };

  cartBackdrop.addEventListener("click", fecharCarrinhoSeguro);
  closeCartBtn.addEventListener("click", fecharCarrinhoSeguro);
  clearCartBtn.addEventListener("click", limparCarrinho);

  cartList.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-item")) {
      removerDoCarrinho(e.target.dataset.index);
    }
  });

  document.querySelectorAll(".add-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      clickSound.currentTime = 0;
      clickSound.play().catch(() => {});
      const card = btn.closest(".card");
      const nome = card.dataset.name;
      const preco = parseFloat(card.dataset.price);
      adicionarAoCarrinho(nome, preco);
    });
  });
});

/* ========= Popup "+1 adicionado!" ========= */
function mostrarPopupAdicionado(nomeProduto = null) {
  const popup = document.createElement("div");
  popup.className = "popup-add";
  popup.textContent = nomeProduto ? `🍔 ${nomeProduto} adicionado!` : "+1 adicionado!";
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1400);
}

/* ========= Modal de Adicionais ========= */
const extrasBackdrop = document.getElementById("extras-backdrop");
const extrasModal = document.getElementById("extras-modal");
const extrasList = document.getElementById("extras-list");
const extrasCancel = document.getElementById("extras-cancel");
const extrasAdd = document.getElementById("extras-add");

let extrasSelecionados = [];
let produtoAtual = null;

document.querySelectorAll(".extras-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    produtoAtual = btn.closest(".card");
    abrirExtras(produtoAtual.dataset.name);
  });
});

function abrirExtras(nomeProduto) {
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

function fecharExtras() {
  extrasModal.classList.remove("show");
  extrasBackdrop.classList.remove("show");
  extrasSelecionados = [];
}

extrasCancel.addEventListener("click", fecharExtras);
extrasBackdrop.addEventListener("click", fecharExtras);

extrasAdd.addEventListener("click", () => {
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
  const checkboxes = extrasList.querySelectorAll("input[type='checkbox']:checked");
  extrasSelecionados = Array.from(checkboxes).map((cb) => ({
    nome: cb.value,
    preco: parseFloat(cb.dataset.price),
  }));
  extrasSelecionados.forEach((extra) => adicionarAoCarrinho(extra.nome, extra.preco));
  mostrarPopupAdicionado("Adicional");
  fecharExtras();
});

/* ========= Contagem regressiva ========= */
function atualizarContagem() {
  const agora = new Date();
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  const diff = fim - agora;
  if (diff <= 0) return (document.getElementById("timer").textContent = "00:00:00");

  const horas = Math.floor(diff / 1000 / 60 / 60);
  const minutos = Math.floor((diff / 1000 / 60) % 60);
  const segundos = Math.floor((diff / 1000) % 60);
  document.getElementById("timer").textContent =
    `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}
setInterval(atualizarContagem, 1000);
atualizarContagem();

/* ========= Status aberto/fechado ========= */
function atualizarStatus() {
  const banner = document.getElementById("status-banner");
  const agora = new Date();
  const dia = agora.getDay();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();

  let aberto = false;
  let msg = "";

  if (dia === 2) msg = "❌ Fechado — abrimos amanhã às 18h";
  else if ([1, 3, 4].includes(dia)) {
    aberto = hora >= 18 && (hora < 23 || (hora === 23 && minuto <= 15));
    msg = aberto ? "🟢 Aberto até 23h15" : "🔴 Fechado — abrimos às 18h";
  } else if ([5, 6, 0].includes(dia)) {
    aberto = hora >= 17 && (hora < 23 || (hora === 23 && minuto <= 30));
    msg = aberto ? "🟢 Aberto até 23h30" : "🔴 Fechado — abrimos às 17h30";
  }

  banner.textContent = msg;
  banner.className = aberto ? "status-banner aberto" : "status-banner fechado";
}
setInterval(atualizarStatus, 60000);
atualizarStatus();

/* ========= Promoções (som + WhatsApp) ========= */
document.querySelectorAll(".carousel .slide").forEach((img) => {
  img.addEventListener("click", () => {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
    const msg = encodeURIComponent(img.dataset.wa || "Olá! Quero aproveitar a promoção 🍔");
    const phone = "5534997178336";
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  });
});

/* ========= Ajuste mobile ========= */
function ajustarCarrinhoMobile() {
  if (window.innerWidth <= 768) {
    miniCart.style.width = "100%";
    miniCart.style.height = "85vh";
    miniCart.style.bottom = "0";
    miniCart.style.borderRadius = "16px 16px 0 0";
  } else {
    miniCart.style.width = "320px";
    miniCart.style.height = "100vh";
    miniCart.style.top = "0";
    miniCart.style.borderRadius = "0";
  }
}
ajustarCarrinhoMobile();
window.addEventListener("resize", ajustarCarrinhoMobile);
/* ================================
   DFL – Script principal (PARTE 3/3)
   Firestore: salvar pedido + abrir WhatsApp
   ==================================== */

/**
 * Esperados da PARTE 1:
 * - window.db = firebase.firestore()
 * - window.auth = firebase.auth()
 */

/* ========= Montar objeto do pedido ========= */
function montarObjetoPedido() {
  const itens = cart.map((it, idx) => ({
    ordem: idx + 1,
    nome: String(it.nome),
    preco: Number(it.preco),
  }));

  const total = itens.reduce((s, x) => s + x.preco, 0);
  const user = (window.auth && window.auth.currentUser) || null;

  return {
    itens,
    total,
    moeda: "BRL",
    origem: "site",
    status: "aberto",
    uid: user ? user.uid : null,
    email: user ? user.email : null,
    criadoEm: (window.firebase && window.firebase.firestore)
      ? window.firebase.firestore.FieldValue.serverTimestamp()
      : new Date(),
  };
}

/* ========= Montar mensagem do WhatsApp ========= */
function montarMensagemWhats(pedido) {
  let msg = "🧾 *Pedido – Da Família Lanches*%0A%0A";
  pedido.itens.forEach((item) => {
    msg += `${item.ordem}. ${item.nome} — R$ ${item.preco.toFixed(2)}%0A`;
  });
  msg += `%0A💰 *Total:* R$ ${pedido.total.toFixed(2)}%0A📍 Patos de Minas`;
  return msg;
}

/* ========= Salvar no Firestore ========= */
async function salvarPedidoNoFirestore(pedido) {
  try {
    if (!window.db || !window.firebase) {
      console.warn("Firestore não disponível, seguindo sem salvar.");
      return { ok: false, id: null };
    }
    const ref = await window.db.collection("pedidos").add(pedido);
    return { ok: true, id: ref.id };
  } catch (err) {
    console.error("Erro ao salvar no Firestore:", err);
    return { ok: false, id: null };
  }
}

/* ========= Finalizar Pedido ========= */
async function handleFecharPedido() {
  try {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});

    if (!cart.length) {
      alert("Seu carrinho está vazio!");
      return;
    }

    const pedido = montarObjetoPedido();
    const resultado = await salvarPedidoNoFirestore(pedido);

    if (resultado.ok) {
      console.log("✅ Pedido salvo no Firestore com ID:", resultado.id);
    }

    const numero = "5534997178336";
    const mensagem = montarMensagemWhats(pedido);
    const link = `https://wa.me/${numero}?text=${mensagem}`;
    window.open(link, "_blank");

    fecharCarrinho();
    // limparCarrinho(); // descomente se quiser limpar após enviar
  } catch (e) {
    console.error(e);
    alert("Não foi possível finalizar o pedido agora. Tente novamente em instantes.");
  }
}

/* ========= Atribuir evento ao botão ========= */
if (finishOrderBtn) {
  finishOrderBtn.removeEventListener("click", handleFecharPedido);
  finishOrderBtn.addEventListener("click", handleFecharPedido);
}

/* ========= Registrar interesse em promoções (opcional) ========= */
// Exemplo: salvar cliques em slides como interações
document.querySelectorAll(".carousel .slide").forEach((img) => {
  img.addEventListener("click", async () => {
    try {
      if (!window.db) return;
      await window.db.collection("interacoes").add({
        tipo: "clique_promo",
        promo: img.getAttribute("alt") || "(sem alt)",
        data: window.firebase.firestore.FieldValue.serverTimestamp(),
        uid: window.auth?.currentUser?.uid || null,
      });
    } catch (_) {}
  });
});

console.log("✅ Script principal (PARTE 3/3) carregado com sucesso.");