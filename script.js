/* ================================
   DFL v1.1 – Script principal
   (Carrinho com Quantidade + Login + Som)
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
    <div style="display:flex; gap:8px; flex-wrap:wrap;">
      <button id="btn-login" style="flex:1; background:#f9d44b; color:#000; font-weight:700; border:none; border-radius:8px; padding:10px;">Entrar</button>
      <button id="btn-sign"  style="flex:1; background:#f9d44b; color:#000; font-weight:700; border:none; border-radius:8px; padding:10px;">Criar</button>
      <button id="btn-google" style="flex:1; background:#db4437; color:#fff; border:none; border-radius:8px; padding:10px;">Login Google</button>
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

  async function doGoogleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
      msg.textContent = "✅ Login Google realizado!";
      setTimeout(closeModal, 700);
    } catch (e) { msg.textContent = "⚠️ " + (e.message || "Erro no Google Login"); }
  }

  modal.querySelector("#btn-login").addEventListener("click", doLogin);
  modal.querySelector("#btn-sign").addEventListener("click", doSign);
  modal.querySelector("#btn-google").addEventListener("click", doGoogleLogin);

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

/* ========= Carrinho ========= */
let cart = JSON.parse(localStorage.getItem("dfl_cart")) || [];

function saveCart() {
  localStorage.setItem("dfl_cart", JSON.stringify(cart));
}

function playClick() {
  try { clickSound.currentTime = 0; clickSound.play(); } catch {}
}

/* Atualiza contador e lista do mini-carrinho */
function updateCartUI() {
  const count = document.getElementById("cart-count");
  const list = document.getElementById("mini-list");
  const totalEl = document.querySelector("#mini-foot-total");
  if (!count || !list) return;

  count.textContent = cart.reduce((a, i) => a + i.qtd, 0);

  if (cart.length === 0) {
    list.innerHTML = "<p style='text-align:center;color:#888'>Carrinho vazio</p>";
  } else {
    list.innerHTML = cart.map((item, i) => `
      <div class="mini-item">
        <div class="info">
          <strong>${item.nome}</strong><br>
          <small>${item.qtd}x R$ ${item.preco.toFixed(2).replace('.', ',')}</small>
        </div>
        <div class="qtd">
          <button class="qbtn minus" data-i="${i}">−</button>
          <span>${item.qtd}</span>
          <button class="qbtn plus" data-i="${i}">+</button>
        </div>
      </div>
    `).join("");
  }

  const total = cart.reduce((a, i) => a + i.preco * i.qtd, 0);
  const foot = document.querySelector(".mini-foot");
  if (foot) {
    foot.querySelector("#mini-checkout").textContent = `Fechar pedido – R$ ${total.toFixed(2).replace('.', ',')}`;
  }

  saveCart();
}

/* Adicionar item ao carrinho */
function addToCart(el) {
  playClick();
  const card = el.closest(".card");
  const id = card.dataset.id;
  const nome = card.dataset.name;
  const preco = parseFloat(card.dataset.price);

  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qtd++;
  } else {
    cart.push({ id, nome, preco, qtd: 1 });
  }
  updateCartUI();
}

/* Botões de quantidade dentro do carrinho */
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("qbtn")) {
    const i = e.target.dataset.i;
    const item = cart[i];
    if (e.target.classList.contains("plus")) {
      item.qtd++;
    } else if (e.target.classList.contains("minus")) {
      item.qtd--;
      if (item.qtd <= 0) cart.splice(i, 1);
    }
    updateCartUI();
  }
});

/* Limpar carrinho */
document.getElementById("mini-clear").addEventListener("click", () => {
  playClick();
  if (confirm("Limpar carrinho?")) {
    cart = [];
    updateCartUI();
  }
});

/* Fechar pedido via WhatsApp */
document.getElementById("mini-checkout").addEventListener("click", () => {
  playClick();
  if (cart.length === 0) return alert("Carrinho vazio!");

  const texto = cart.map(i => `${i.qtd}x ${i.nome} - R$ ${(i.preco * i.qtd).toFixed(2).replace('.', ',')}`)
    .join("%0A");
  const total = cart.reduce((a, i) => a + i.preco * i.qtd, 0);
  const msg = `🛒 *Pedido DFL*%0A${texto}%0A———————%0ATotal: *R$ ${total.toFixed(2).replace('.', ',')}*`;
  window.open(`https://wa.me/5534997178336?text=${msg}`, "_blank");
});

/* Carrinho abre/fecha */
const miniCart = document.getElementById("mini-cart");
const backdrop = document.getElementById("cart-backdrop");
const cartIcon = document.getElementById("cart-icon");

function openCart() {
  miniCart.classList.add("open");
  backdrop.style.display = "block";
}
function closeCart() {
  miniCart.classList.remove("open");
  backdrop.style.display = "none";
}

cartIcon.addEventListener("click", () => { playClick(); openCart(); });
document.querySelector(".mini-close").addEventListener("click", () => { playClick(); closeCart(); });
backdrop.addEventListener("click", closeCart);

updateCartUI();

/* ========= ADICIONAIS (modal) ========= */
const extrasBackdrop = document.getElementById("extras-backdrop");
const extrasModal = document.getElementById("extras-modal");
const extrasList = document.getElementById("extras-list");
const extrasCancel = document.getElementById("extras-cancel");
const extrasAdd = document.getElementById("extras-add");

let produtoAtual = null;

/* abre modal preenchendo opções de adicionais */
function abrirExtras(nomeProduto) {
  playClick();
  // (pode ajustar os itens e preços aqui)
  extrasList.innerHTML = `
    <label><input type="checkbox" value="Cebola" data-price="0.99"> 🧅 Cebola — R$ 0,99</label>
    <label><input type="checkbox" value="Salada" data-price="1.99"> 🥬 Salada — R$ 1,99</label>
    <label><input type="checkbox" value="Ovo" data-price="1.99"> 🥚 Ovo — R$ 1,99</label>
    <label><input type="checkbox" value="Salsicha" data-price="1.99"> 🌭 Salsicha — R$ 1,99</label>
    <label><input type="checkbox" value="Bacon" data-price="2.99"> 🥓 Bacon — R$ 2,99</label>
    <label><input type="checkbox" value="Molho Verde" data-price="2.99"> 🌿 Molho Verde — R$ 2,99</label>
    <label><input type="checkbox" value="Cheddar" data-price="3.99"> 🧀 Cheddar — R$ 3,99</label>
  `;
  extrasBackdrop.classList.add("show");
  extrasModal.classList.add("show");
}

/* fecha modal */
function fecharExtras() {
  extrasBackdrop.classList.remove("show");
  extrasModal.classList.remove("show");
}

/* abre modal ao clicar em “➕ Adicionais” no card */
document.querySelectorAll(".extras-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".card");
    produtoAtual = {
      id: card.dataset.id,
      nome: card.dataset.name
    };
    abrirExtras(produtoAtual.nome);
  });
});

/* botões do modal */
extrasCancel?.addEventListener("click", () => { playClick(); fecharExtras(); });
extrasBackdrop?.addEventListener("click", fecharExtras);

/* adiciona extras no carrinho (agrupando por extra) */
extrasAdd?.addEventListener("click", () => {
  playClick();
  const checks = extrasList.querySelectorAll("input[type='checkbox']:checked");
  if (!checks.length) { fecharExtras(); return; }

  checks.forEach(cb => {
    const nomeExtra = `Adicional: ${cb.value}`;
    const precoExtra = parseFloat(cb.dataset.price);
    const idExtra = `extra-${cb.value.toLowerCase().replace(/\s+/g,'-')}`;

    const existing = cart.find(i => i.id === idExtra);
    if (existing) {
      existing.qtd++;
    } else {
      cart.push({ id: idExtra, nome: nomeExtra, preco: precoExtra, qtd: 1 });
    }
  });

  updateCartUI();
  fecharExtras();
  // abre o carrinho para o cliente ver os extras
  const miniCart = document.getElementById("mini-cart");
  const backdrop = document.getElementById("cart-backdrop");
  miniCart.classList.add("open","active");
  backdrop.style.display = "block";
});

/* ========= CARROSSEL PROMO ========= */
(function initCarousel() {
  const wrap = document.getElementById("promoCarousel");
  if (!wrap) return;

  const container = wrap.querySelector(".slides");
  const prevBtn  = wrap.querySelector(".c-prev");
  const nextBtn  = wrap.querySelector(".c-next");
  const slides   = Array.from(container.querySelectorAll(".slide"));
  if (!slides.length) return;

  let index = 0;
  function showSlide(i) {
    slides.forEach((s, idx) => (s.style.display = idx === i ? "block" : "none"));
  }
  showSlide(index);

  prevBtn.addEventListener("click", () => {
    playClick();
    index = (index - 1 + slides.length) % slides.length;
    showSlide(index);
  });
  nextBtn.addEventListener("click", () => {
    playClick();
    index = (index + 1) % slides.length;
    showSlide(index);
  });

  // clique no slide abre WhatsApp com texto da promoção
  slides.forEach(img => {
    img.addEventListener("click", () => {
      playClick();
      const msg = encodeURIComponent(img.dataset.wa || "Olá! Quero aproveitar a promoção 🍔");
      window.open(`https://wa.me/5534997178336?text=${msg}`, "_blank");
    });
  });

  // auto-rotaciona a cada 5s
  setInterval(() => {
    index = (index + 1) % slides.length;
    showSlide(index);
  }, 5000);
})();

/* ========= STATUS ABERTO / FECHADO ========= */
function atualizarStatus() {
  const banner = document.getElementById("status-banner");
  if (!banner) return;

  const agora = new Date();
  const dia = agora.getDay();   // 0=Dom … 6=Sáb
  const h = agora.getHours();
  const m = agora.getMinutes();

  let aberto = false;
  let msg = "";

  if (dia === 2) { // terça
    msg = "❌ Fechado — abrimos amanhã às 18h";
  } else if ([1, 3, 4].includes(dia)) { // seg, qua, qui
    aberto = h >= 18 && (h < 23 || (h === 23 && m <= 15));
    msg = aberto ? "🟢 Aberto até 23h15" : "🔴 Fechado — abrimos às 18h";
  } else { // sex, sáb, dom
    aberto = h >= 17 && (h < 23 || (h === 23 && m <= 30));
    msg = aberto ? "🟢 Aberto até 23h30" : "🔴 Fechado — abrimos às 17h30";
  }

  banner.textContent = msg;
  banner.className = aberto ? "status-banner aberto" : "status-banner fechado";
}
setInterval(atualizarStatus, 60000);
atualizarStatus();

/* ========= CONTAGEM REGRESSIVA (ticker promo) ========= */
function atualizarContagem() {
  const el = document.getElementById("timer");
  if (!el) return;

  const agora = new Date();
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);

  const diff = fim - agora;
  if (diff <= 0) { el.textContent = "00:00:00"; return; }

  const h = Math.floor(diff / 1000 / 60 / 60);
  const m = Math.floor((diff / 1000 / 60) % 60);
  const s = Math.floor((diff / 1000) % 60);
  el.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
setInterval(atualizarContagem, 1000);
atualizarContagem();

/* ========= REFORÇO COMPATIBILIDADE DO CARRINHO ========= */
/* (em alguns CSS antigos a classe usada é .active. Mantemos as duas) */
(function compatCartClasses(){
  const miniCart = document.getElementById("mini-cart");
  const backdrop = document.getElementById("cart-backdrop");
  if (!miniCart || !backdrop) return;

  // se alguém chamar .open, garantimos .active também
  const observer = new MutationObserver(() => {
    if (miniCart.classList.contains("open")) {
      miniCart.classList.add("active");
      backdrop.style.display = "block";
    } else {
      miniCart.classList.remove("active");
      backdrop.style.display = "";
    }
  });
  observer.observe(miniCart, { attributes: true, attributeFilter: ["class"] });
})();