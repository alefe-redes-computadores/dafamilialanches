/* =========================================================
   DFL – Script estável completo
   (som, status, countdown, carrossel, carrinho, adicionais,
   login com Google no Firebase v8 – compatível com <script> CDN)
   ========================================================= */

/* ---------------------------
   ÁUDIO DE CLIQUE
--------------------------- */
const clickSfx = new Audio("click.wav");
clickSfx.volume = 0.35;
function playClick() { try { clickSfx.currentTime = 0; clickSfx.play(); } catch (_) {} }

/* ---------------------------
   ESTADO / UTIL
--------------------------- */
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
}
function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (badge) badge.textContent = cart.reduce((a, i) => a + (i.qtd || 1), 0);
}
function money(n) {
  const val = Number(n || 0);
  return `R$ ${val.toFixed(2).replace(".", ",")}`;
}
function popup(msg) {
  const el = document.createElement("div");
  el.className = "popup-add";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

/* =========================================================
   STATUS ABERTO/FECHADO  +  COUNTDOWN PROMO
   Seg-Qui: 18–23:15 | Sex-Dom: 17:30–23:30 | Ter: fechado
========================================================= */
function setStatusBanner() {
  const el = document.getElementById("status-banner");
  if (!el) return;

  const d = new Date();
  const dow = d.getDay(); // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  const mins = d.getHours() * 60 + d.getMinutes();

  if (dow === 2) { // Terça
    el.textContent = "⏰ Fechado hoje (Terça). Voltamos amanhã!";
    el.style.background = "#ff3d00";
    el.style.color = "#fff";
    return;
  }

  let openMins, closeMins, abreTxt;
  if (dow >= 1 && dow <= 4) { // Seg-Qua-Qui
    openMins = 18 * 60;
    closeMins = 23 * 60 + 15;
    abreTxt = "18h";
  } else { // Sex(5), Sáb(6), Dom(0)
    openMins = 17 * 60 + 30;
    closeMins = 23 * 60 + 30;
    abreTxt = "17h30";
  }

  if (mins < openMins) {
    const rest = openMins - mins;
    const h = Math.floor(rest / 60);
    const m = rest % 60;
    el.textContent = `⏳ Abrimos às ${abreTxt} • falta ${h}h${String(m).padStart(2,"0")}m`;
    el.style.background = "#ffcc00";
    el.style.color = "#111";
  } else if (mins <= closeMins) {
    el.textContent = "✅ Estamos abertos! Faça seu pedido 🍔";
    el.style.background = "#00c853";
    el.style.color = "#fff";
  } else {
    el.textContent = "⏰ Fechado agora — voltamos no próximo horário";
    el.style.background = "#ff3d00";
    el.style.color = "#fff";
  }
}
function updateCountdown() {
  const box = document.getElementById("timer");
  if (!box) return;
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const diff = end - new Date();
  if (diff <= 0) { box.textContent = "00:00:00"; return; }
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  box.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

/* =========================================================
   CARROSSEL (setas + clique abre WhatsApp)
========================================================= */
function initCarousel() {
  const rail = document.querySelector(".slides");
  if (!rail) return;

  const prev = document.querySelector(".c-prev");
  const next = document.querySelector(".c-next");
  const step = () => Math.min(rail.clientWidth * 0.9, 320);

  prev?.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
  next?.addEventListener("click", () => rail.scrollBy({ left:  step(), behavior: "smooth" }));

  rail.querySelectorAll(".slide").forEach(img => {
    img.addEventListener("click", () => {
      playClick();
      const wa = img.getAttribute("data-wa") || "Quero saber mais sobre a promoção!";
      const url = `https://wa.me/5534997178336?text=${encodeURIComponent(wa)}`;
      window.open(url, "_blank");
    });
  });
}

/* =========================================================
   MINI-CARRINHO (usar estrutura JÁ existente no HTML)
========================================================= */
function openMiniCart() {
  const panel = document.getElementById("mini-cart");
  const backdrop = document.getElementById("cart-backdrop");
  if (!panel || !backdrop) return;
  renderMiniCart();
  panel.classList.add("active");
  backdrop.classList.add("show");
  document.body.classList.add("no-scroll");
}
function closeMiniCart() {
  const panel = document.getElementById("mini-cart");
  const backdrop = document.getElementById("cart-backdrop");
  if (!panel || !backdrop) return;
  panel.classList.remove("active");
  backdrop.classList.remove("show");
  document.body.classList.remove("no-scroll");
}
function hookMiniCartChrome() {
  const backdrop = document.getElementById("cart-backdrop");
  const closeBtn = document.querySelector(".mini-close");
  const icon = document.getElementById("cart-icon");
  backdrop?.addEventListener("click", closeMiniCart);
  closeBtn?.addEventListener("click", closeMiniCart);
  icon?.addEventListener("click", () => { playClick(); openMiniCart(); });

  // Rodapé do carrinho (IDs fixos no seu HTML)
  const clearBtn = document.getElementById("mini-clear");
  const checkoutBtn = document.getElementById("mini-checkout");
  clearBtn?.addEventListener("click", () => { cart = []; saveCart(); renderMiniCart(); });
  checkoutBtn?.addEventListener("click", fecharPedidoWhatsApp);
}
function renderMiniCart() {
  const list = document.getElementById("mini-list");
  if (!list) return;

  if (!cart.length) {
    list.innerHTML = `<p class="empty-cart">Seu carrinho está vazio.</p>`;
  } else {
    list.innerHTML = "";
    cart.forEach((it, idx) => {
      const li = document.createElement("div");
      li.className = "cart-item";
      li.innerHTML = `
        <div style="flex:1;min-width:0">
          <span>${it.nome}</span><br>
          <small>${money(it.preco)}</small>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <button class="qty-dec" aria-label="Diminuir">−</button>
          <span>${it.qtd}</span>
          <button class="qty-inc" aria-label="Aumentar">+</button>
          <strong>${money(it.preco * it.qtd)}</strong>
          <button class="remove-item" title="Remover">x</button>
        </div>
      `;
      li.querySelector(".qty-inc").addEventListener("click", () => { it.qtd++; saveCart(); renderMiniCart(); });
      li.querySelector(".qty-dec").addEventListener("click", () => { it.qtd = Math.max(1, it.qtd-1); saveCart(); renderMiniCart(); });
      li.querySelector(".remove-item").addEventListener("click", () => { cart.splice(idx,1); saveCart(); renderMiniCart(); });
      list.appendChild(li);
    });
  }

  // Atualiza rótulo do botão “Fechar pedido” com o total
  const checkoutBtn = document.getElementById("mini-checkout");
  if (checkoutBtn) {
    const total = cart.reduce((a,i)=>a + (i.preco||0)*(i.qtd||1), 0);
    checkoutBtn.textContent = `Fechar pedido (${money(total)})`;
  }
}
function fecharPedidoWhatsApp() {
  if (!cart.length) return;
  const linhas = cart.map(i => `• ${i.nome}${i.qtd>1?` x${i.qtd}`:""} — ${money(i.preco*i.qtd)}`);
  const total = cart.reduce((a,i)=>a+i.preco*i.qtd,0);
  const txt = `🍔 Pedido DFL:%0A%0A${linhas.join("%0A")}%0A%0ATotal: ${money(total)}`;
  window.open(`https://wa.me/5534997178336?text=${txt}`, "_blank");
}

/* =========================================================
   ADICIONAR AO CARRINHO  +  ADICIONAIS
========================================================= */
// Sua tabela oficial de adicionais
const ADICIONAIS = [
  { nome: "Cebola",                       preco: 0.99 },
  { nome: "Salada",                       preco: 1.99 },
  { nome: "Ovo",                          preco: 1.99 },
  { nome: "Bacon",                        preco: 2.99 },
  { nome: "Hambúrguer Tradicional 56g",   preco: 2.99 },
  { nome: "Cheddar Cremoso",              preco: 3.99 },
  { nome: "Filé de frango",               preco: 5.99 },
  { nome: "Hambúrguer Artesanal 120g",    preco: 7.99 },
];

function bindAddButtons() {
  document.querySelectorAll(".add-cart").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      if (!card) return;
      const nome  = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";
      const preco = parseFloat(card.dataset.price || "0");

      // Se já existe igual (mesmo nome/preço), só soma
      const found = cart.find(i => i.nome === nome && i.preco === preco);
      if (found) found.qtd += 1;
      else cart.push({ nome, preco, qtd: 1 });

      saveCart();
      renderMiniCart();
      playClick();
      popup(`➕ ${nome} adicionado!`);
    });
  });
}

function bindExtrasButtons() {
  const modal = document.getElementById("extras-modal");
  const list  = document.getElementById("extras-list");
  const add   = document.getElementById("extras-add");
  const closes= document.querySelectorAll(".extras-close");

  if (!modal || !list || !add) return;

  document.querySelectorAll(".extras-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      if (!card) return;
      const base = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";

      // Lista renderizada sempre com seus adicionais oficiais
      list.innerHTML = ADICIONAIS.map((a, i) => (
        `<label>
          <span>${a.nome} — ${money(a.preco)}</span>
          <input type="checkbox" value="${i}">
        </label>`
      )).join("");

      modal.dataset.base = base;
      modal.classList.add("show");
      document.body.classList.add("no-scroll");
    });
  });

  closes.forEach(c => c.addEventListener("click", () => {
    modal.classList.remove("show");
    document.body.classList.remove("no-scroll");
  }));

  add.addEventListener("click", () => {
    const base = modal.dataset.base || "Item";
    const checks = [...list.querySelectorAll("input:checked")];
    if (checks.length) {
      checks.forEach(c => {
        const a = ADICIONAIS[Number(c.value)];
        cart.push({ nome: `${base} + ${a.nome}`, preco: a.preco, qtd: 1 });
      });
      saveCart();
      renderMiniCart();
      popup("➕ Adicionais adicionados!");
    }
    modal.classList.remove("show");
    document.body.classList.remove("no-scroll");
  });
}

/* =========================================================
   LOGIN COM GOOGLE (Firebase v8)
   - injeta modal se não existir
   - usa a sua config (v8 compatível)
========================================================= */
function ensureLoginUI() {
  // Botão no header (se não existir)
  let btn = document.getElementById("user-btn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "user-btn";
    btn.className = "user-button";
    btn.textContent = "Entrar / Cadastrar";
    document.querySelector(".header")?.appendChild(btn);
  }

  // Modal de login (injeta se não existir)
  let modal = document.getElementById("login-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "login-modal";
    modal.innerHTML = `
      <div class="login-backdrop"></div>
      <div class="login-box">
        <button class="login-x" aria-label="Fechar">✕</button>
        <h3>Entrar no DFL</h3>
        <p>Acesse para salvar seus pedidos e agilizar seu checkout.</p>
        <div class="login-form">
          <input type="email" placeholder="Seu e-mail" disabled />
          <input type="password" placeholder="Senha" disabled />
          <button class="btn-primario" disabled>Entrar (em breve)</button>
        </div>
        <div class="divider">ou</div>
        <button class="btn-google">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 31.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.7 3l5.7-5.7C34.4 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 18.6-7.3 19.9-16.8.1-.7.1-1.3.1-1.7z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.4 16.6 18.8 14 24 14c3 0 5.7 1.1 7.7 3l5.7-5.7C34.4 6.1 29.5 4 24 4 15.5 4 8.2 8.8 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.1C29.3 36 26.8 37 24 37c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C8.1 39.1 15.4 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.4-4.4 6-8.3 6-5.2 0-9.6-4.3-9.6-9.5S18.8 15 24 15c3 0 5.7 1.1 7.7 3l5.7-5.7C34.4 6.1 29.5 4 24 4c-10 0-18.6 7.3-19.9 16.8-.1.7-.1 1.3-.1 1.7z"/></svg>
          &nbsp; Continuar com Google
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const open = () => { modal.classList.add("show"); document.body.classList.add("no-scroll"); };
  const close = () => { modal.classList.remove("show"); document.body.classList.remove("no-scroll"); };

  btn.addEventListener("click", () => { playClick(); open(); });
  modal.querySelector(".login-x")?.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target.classList.contains("login-backdrop")) close(); });

  // Firebase v8 – usar sua config (corrigido storageBucket .appspot.com)
  const firebaseConfig = {
    apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
    authDomain: "da-familia-lanches.firebaseapp.com",
    projectId: "da-familia-lanches",
    storageBucket: "da-familia-lanches.appspot.com",
    messagingSenderId: "106857147317",
    appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
    measurementId: "G-TCZ18HFWGX"
  };

  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  } catch (e) {
    console.warn("Firebase já inicializado ou erro silencioso:", e?.message);
  }
  const auth = firebase.auth();

  // Login Google
  modal.querySelector(".btn-google")?.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(res => {
        const user = res.user;
        alert(`Bem-vindo, ${user.displayName}!`);
        btn.textContent = `Olá, ${user.displayName.split(" ")[0]} 👋`;
        close();
      })
      .catch(err => alert("Erro no login com Google: " + err.message));
  });
}

/* =========================================================
   INICIALIZAÇÃO
========================================================= */
window.addEventListener("DOMContentLoaded", () => {
  // Som global (leve)
  document.addEventListener("click", () => playClick(), { once: true });

  // Status + Countdown
  setStatusBanner();
  setInterval(setStatusBanner, 60_000);
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Carrinho
  updateCartBadge();
  hookMiniCartChrome();

  // Ações de adicionar + extras
  bindAddButtons();
  bindExtrasButtons();

  // Carrossel
  initCarousel();

  // Login
  ensureLoginUI();
});