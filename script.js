/* =========================================================
   DFL – Script completo (parte 1/4)
   - Som de clique
   - Status aberto/fechado + countdown
   - Carrossel
   - Firebase v8 (auth + firestore)
   - Login com Google e E-mail/Senha (UI completa)
========================================================= */

/* ---------- Som de clique ---------- */
const clickSfx = new Audio("click.wav");
clickSfx.volume = 0.35;
function playClick() {
  try { clickSfx.currentTime = 0; clickSfx.play(); } catch (_) {}
}
document.addEventListener("click", playClick, { passive: true });

/* ---------- Util ---------- */
function money(n) { return `R$ ${Number(n).toFixed(2).replace(".", ",")}`; }
function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

/* =========================================================
   ABERTO/FECHADO + COUNTDOWN
========================================================= */
function nowMins() { const d = new Date(); return d.getHours()*60 + d.getMinutes(); }

function setStatusBanner() {
  const el = qs("#status-banner"); if (!el) return;
  const d = new Date(); const dow = d.getDay(); // 0=Dom..2=Ter
  if (dow === 2) { el.textContent = "Terça: Fechado hoje — voltamos amanhã!"; el.style.background="#ffd54f"; return; }

  let open = 0, close = 0, label = "";
  if (dow >= 1 && dow <= 4) { open = 18*60; close = 23*60 + 15; label = "Aberto até 23h15"; }
  else { open = 17*60 + 30; close = 23*60 + 30; label = "Aberto até 23h30"; }

  const now = nowMins();
  if (now < open) {
    const left = open - now; const h = Math.floor(left/60); const m = left%60;
    el.textContent = `Abrimos às ${label.includes("23h15")?"18h":"17h30"} • falta ${h}h${String(m).padStart(2,"0")}m`;
    el.style.background="#ffd54f";
  } else if (now <= close) {
    el.textContent = `✅ Estamos abertos! Faça seu pedido 🍔`;
    el.style.background="#2ecc71";
  } else {
    el.textContent = "⏰ Fechado no momento — Voltamos em breve!";
    el.style.background="#ff7043";
  }
}
function updateCountdown() {
  const box = qs("#timer"); if (!box) return;
  const end = new Date(); end.setHours(23,59,59,999);
  const diff = end - new Date();
  if (diff <= 0) { box.textContent = "00:00:00"; return; }
  const h = Math.floor(diff/3_600_000), m = Math.floor((diff%3_600_000)/60_000), s = Math.floor((diff%60_000)/1000);
  box.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

/* =========================================================
   CARROSSEL (setas + clique abre WhatsApp ou imagem)
========================================================= */
function initCarousel() {
  const rail = qs(".slides"); if (!rail) return;
  qs(".c-prev")?.addEventListener("click", () => rail.scrollBy({ left: -Math.min(rail.clientWidth*0.9, 320), behavior:"smooth" }));
  qs(".c-next")?.addEventListener("click", () => rail.scrollBy({ left:  Math.min(rail.clientWidth*0.9, 320), behavior:"smooth" }));

  qsa(".slide", rail).forEach(img => {
    img.addEventListener("click", () => {
      const wa = img.getAttribute("data-wa");
      if (wa) {
        const link = `https://wa.me/5534997178336?text=${encodeURIComponent(wa)}`;
        window.open(link, "_blank");
      } else {
        window.open(img.src, "_blank");
      }
    });
  });
}

/* =========================================================
   FIREBASE v8 – Auth + Firestore
   (seu HTML já inclui os <script> v8.10.1)
========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
  authDomain: "da-familia-lanches.firebaseapp.com",
  projectId: "da-familia-lanches",
  storageBucket: "da-familia-lanches.firebasestorage.app",
  messagingSenderId: "106857147317",
  appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
  measurementId: "G-TCZ18HFWGX",
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

/* =========================================================
   LOGIN UI (Google + E-mail/Senha – modal)
   - Se #login-modal não existir, criamos com HTML completo
========================================================= */
function ensureLoginModal() {
  let modal = qs("#login-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "login-modal";
  modal.className = "show"; // será removido depois da criação
  modal.innerHTML = `
    <div class="login-backdrop"></div>
    <div class="login-box">
      <button class="login-x" aria-label="Fechar">✕</button>
      <h3>Entrar / Cadastro</h3>
      <p>Acesse sua conta para acompanhar pedidos.</p>

      <form id="email-form" class="login-form" autocomplete="on">
        <input id="login-email" type="email" placeholder="Seu e-mail" required />
        <input id="login-pass"  type="password" placeholder="Sua senha" required />
        <button id="email-submit" class="btn-primario" type="submit">Entrar</button>
        <small id="email-toggle" style="display:block; margin-top:6px; cursor:pointer;">
          Ainda não tem conta? <b>Criar cadastro</b>
        </small>
      </form>

      <div class="divider">ou</div>

      <button class="btn-google" id="btn-google">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
        Entrar com Google
      </button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.classList.remove("show");
  return modal;
}

function setupLoginButton() {
  // botão no header
  let userBtn = qs("#user-btn");
  if (!userBtn) {
    userBtn = document.createElement("button");
    userBtn.id = "user-btn";
    userBtn.className = "user-button";
    userBtn.textContent = "Entrar / Cadastro";
    qs(".header")?.appendChild(userBtn);
  }

  const modal = ensureLoginModal();
  const openModal = () => { modal.classList.add("show"); document.body.classList.add("no-scroll"); };
  const closeModal = () => { modal.classList.remove("show"); document.body.classList.remove("no-scroll"); };

  userBtn.addEventListener("click", openModal);
  modal.addEventListener("click", (e) => { if (e.target.classList.contains("login-backdrop")) closeModal(); });
  modal.querySelector(".login-x").addEventListener("click", closeModal);

  // Google
  modal.querySelector("#btn-google").addEventListener("click", async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const res = await auth.signInWithPopup(provider);
      const name = res.user?.displayName || "Cliente";
      userBtn.textContent = `Olá, ${name.split(" ")[0]}!`;
      closeModal();
    } catch (err) {
      alert("Erro no login com Google: " + err.message);
    }
  });

  // E-mail / senha (entrar ⇄ cadastrar)
  const form   = modal.querySelector("#email-form");
  const email  = modal.querySelector("#login-email");
  const pass   = modal.querySelector("#login-pass");
  const submit = modal.querySelector("#email-submit");
  const toggle = modal.querySelector("#email-toggle");
  let isSignup = false;

  function refreshMode() {
    submit.textContent = isSignup ? "Criar conta" : "Entrar";
    toggle.innerHTML   = isSignup
      ? 'Já tem conta? <b>Fazer login</b>'
      : 'Ainda não tem conta? <b>Criar cadastro</b>';
  }
  toggle.addEventListener("click", () => { isSignup = !isSignup; refreshMode(); });
  refreshMode();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      if (isSignup) {
        const cred = await auth.createUserWithEmailAndPassword(email.value.trim(), pass.value.trim());
        userBtn.textContent = `Olá, ${cred.user.email.split("@")[0]}!`;
      } else {
        const cred = await auth.signInWithEmailAndPassword(email.value.trim(), pass.value.trim());
        userBtn.textContent = `Olá, ${cred.user.email.split("@")[0]}!`;
      }
      closeModal();
    } catch (err) {
      alert("Erro: " + err.message);
    }
  });

  // Observa auth para manter o nome no botão
  auth.onAuthStateChanged((user) => {
    if (user) {
      const name = user.displayName || user.email?.split("@")[0] || "Cliente";
      userBtn.textContent = `Olá, ${name.split(" ")[0]}!`;
    } else {
      userBtn.textContent = "Entrar / Cadastro";
    }
  });
}
/* =========================================================
   DFL – Script completo (parte 2/4)
   - Carrinho (abrir/fechar, itens, qty, limpar, WhatsApp)
   - Adicionais (sua lista oficial)
   - Pop-up "adicionado"
========================================================= */

/* ---------- Estado do carrinho ---------- */
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
  renderMiniCart();
}
function updateCartBadge() {
  const badge = qs("#cart-count");
  if (badge) badge.textContent = cart.reduce((a, i) => a + (i.qtd || 1), 0);
}

/* ---------- Mini-cart (abrir/fechar) ---------- */
function openMiniCart() {
  qs("#cart-backdrop")?.classList.add("show");
  qs("#mini-cart")?.classList.add("active");
  document.body.classList.add("no-scroll");
}
function closeMiniCart() {
  qs("#cart-backdrop")?.classList.remove("show");
  qs("#mini-cart")?.classList.remove("active");
  document.body.classList.remove("no-scroll");
}
function bindMiniCartToggles() {
  qs("#cart-icon")?.addEventListener("click", openMiniCart);
  qs("#cart-backdrop")?.addEventListener("click", closeMiniCart);
  qs("#mini-cart .mini-close")?.addEventListener("click", closeMiniCart);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMiniCart(); });
}

/* ---------- Render do mini-cart ---------- */
function renderMiniCart() {
  const list = qs("#mini-list"); if (!list) return;
  if (!cart.length) {
    list.innerHTML = `<p class="empty-cart">Seu carrinho está vazio.</p>`;
  } else {
    list.innerHTML = "";
    cart.forEach((it, idx) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div style="flex:1;min-width:0">
          <span>${it.nome}</span><br>
          <small>${money(it.preco)}</small>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <button class="qty-dec">−</button>
          <span>${it.qtd}</span>
          <button class="qty-inc">+</button>
          <strong>${money(it.preco*it.qtd)}</strong>
          <button class="remove-item" title="Remover">x</button>
        </div>
      `;
      row.querySelector(".qty-inc").addEventListener("click", () => { it.qtd++; saveCart(); });
      row.querySelector(".qty-dec").addEventListener("click", () => { it.qtd = Math.max(1, it.qtd-1); saveCart(); });
      row.querySelector(".remove-item").addEventListener("click", () => { cart.splice(idx,1); saveCart(); });
      list.appendChild(row);
    });
  }

  const clearBtn    = qs("#mini-clear");
  const checkoutBtn = qs("#mini-checkout");
  const total = cart.reduce((a,i)=>a+i.preco*i.qtd,0);

  if (clearBtn) clearBtn.onclick = () => { cart = []; saveCart(); };
  if (checkoutBtn) checkoutBtn.onclick = handleCheckoutWhatsApp;
  if (checkoutBtn) checkoutBtn.textContent = "Fechar pedido";
}

/* ---------- Checkout -> WhatsApp (e grava pedido) ---------- */
async function handleCheckoutWhatsApp() {
  if (!cart.length) return;
  const linhas = cart.map(i => `• ${i.nome}${i.qtd>1?` x${i.qtd}`:""} — ${money(i.preco*i.qtd)}`);
  const total = cart.reduce((a,i)=>a+i.preco*i.qtd,0);
  const texto = encodeURIComponent(`🍔 Pedido DFL\n\n${linhas.join("\n")}\n\nTotal: ${money(total)}`);
  // grava no Firestore (se logado)
  try {
    const user = auth.currentUser;
    if (user) {
      await db.collection("Pedidos").add({
        userId: user.uid,
        userName: user.displayName || user.email || "cliente",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        items: cart.map(i => ({ nome: i.nome, qtd: i.qtd, preco: i.preco })),
        total
      });
    }
  } catch (err) {
    console.warn("Falha ao salvar pedido:", err);
  }
  window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");
}

/* ---------- Pop-up curto ---------- */
function popup(msg) {
  const el = document.createElement("div");
  el.className = "popup-add"; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

/* ---------- Botões “Adicionar ao carrinho” ---------- */
function bindAddButtons() {
  qsa(".add-cart").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card"); if (!card) return;
      const id    = card.dataset.id || card.dataset.name || Math.random().toString(36).slice(2);
      const nome  = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";
      const preco = parseFloat(card.dataset.price || "0");
      if (Number.isNaN(preco)) return;

      const found = cart.find(i => i.id === id && i.preco === preco);
      if (found) found.qtd += 1; else cart.push({ id, nome, preco, qtd: 1 });
      saveCart();
      popup(`🍔 ${nome} adicionado!`);
    });
  });
}

/* ---------- ADICIONAIS (lista oficial) ---------- */
const ADICIONAIS = [
  { nome: "Cebola", preco: 0.99 },
  { nome: "Salada", preco: 1.99 },
  { nome: "Ovo", preco: 1.99 },
  { nome: "Bacon", preco: 2.99 },
  { nome: "Hambúrguer Tradicional 56g", preco: 2.99 },
  { nome: "Cheddar Cremoso", preco: 3.99 },
  { nome: "Filé de frango", preco: 5.99 },
  { nome: "Hambúrguer Artesanal 120g", preco: 7.99 },
];

function bindExtrasButtons() {
  const modal = qs("#extras-modal"); const list = qs("#extras-list");
  const closeBy = (e) => {
    if (!modal) return;
    if (e.target.closest(".extras-close") || e.target.id === "extras-cancel") {
      modal.classList.remove("show"); document.body.classList.remove("no-scroll");
    }
  };
  document.addEventListener("click", closeBy);

  qsa(".extras-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card"); if (!card || !modal || !list) return;
      modal.dataset.produto = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";
      list.innerHTML = ADICIONAIS.map((a,i) => `
        <label>
          <span>${a.nome} — ${money(a.preco)}</span>
          <input type="checkbox" value="${i}">
        </label>
      `).join("");
      modal.classList.add("show");
      document.body.classList.add("no-scroll");
    });
  });

  qs("#extras-add")?.addEventListener("click", () => {
    if (!modal || !list) return;
    const nomeBase = modal.dataset.produto || "Item";
    const checks = qsa('input:checked', list);
    if (checks.length) {
      checks.forEach(c => {
        const a = ADICIONAIS[Number(c.value)];
        cart.push({ id:`extra-${Date.now()}-${Math.random()}`, nome:`${nomeBase} + ${a.nome}`, preco: a.preco, qtd:1 });
      });
      saveCart();
      popup("➕ Adicionais adicionados!");
    }
    modal.classList.remove("show");
    document.body.classList.remove("no-scroll");
  });
}
/* =========================================================
   DFL – Script completo (parte 3/4)
   - Botão/painel "Meus Pedidos"
   - Leitura dos pedidos do usuário logado (Firestore)
========================================================= */

function formatDate(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch { return ""; }
}

function loadMyOrders() {
  const panel = qs("#orders-panel"); if (!panel) return;
  const content = qs("#orders-content", panel); if (!content) return;

  const user = auth.currentUser;
  if (!user) {
    content.innerHTML = `<p class="empty-orders">Entre para ver seus pedidos.</p>`;
    return;
  }

  content.innerHTML = `<p style="opacity:.8">Carregando pedidos…</p>`;
  db.collection("Pedidos").where("userId", "==", user.uid).orderBy("createdAt", "desc").limit(20)
    .get()
    .then((snap) => {
      if (snap.empty) {
        content.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado.</p>`;
        return;
      }
      content.innerHTML = "";
      snap.forEach(doc => {
        const p = doc.data();
        const div = document.createElement("div");
        div.className = "order-item";
        const itens = (p.items || []).map(i => `• ${i.nome}${i.qtd>1?` x${i.qtd}`:""}`).join("<br>");
        div.innerHTML = `
          <h4>#${doc.id.slice(-6).toUpperCase()} — ${money(p.total || 0)}</h4>
          <p>${formatDate(p.createdAt)}</p>
          <p style="margin-top:6px">${itens}</p>
        `;
        content.appendChild(div);
      });
    })
    .catch(err => {
      content.innerHTML = `<p class="empty-orders">Erro ao carregar: ${err.message}</p>`;
    });
}

function bindOrdersPanel() {
  const panel = qs("#orders-panel"); if (!panel) return;
  const close = () => panel.classList.remove("active");
  qsa(".orders-close", panel).forEach(b => b.addEventListener("click", close));

  // Sugestão: crie um botão flutuante #orders-fab se quiser
  let fab = qs("#orders-fab");
  if (fab) {
    fab.classList.add("show");
    fab.addEventListener("click", () => { panel.classList.add("active"); loadMyOrders(); });
  }

  // Se quiser abrir pelo menu/botão customizado:
  window.openOrders = () => { panel.classList.add("active"); loadMyOrders(); };
}
/* =========================================================
   DFL – Script completo (parte 4/4)
   - Inicialização geral e binds
========================================================= */

window.addEventListener("DOMContentLoaded", () => {
  // Status e countdown
  setStatusBanner(); setInterval(setStatusBanner, 60_000);
  updateCountdown(); setInterval(updateCountdown, 1000);

  // Carrossel
  initCarousel();

  // Carrinho
  updateCartBadge();
  bindMiniCartToggles();
  renderMiniCart();
  bindAddButtons();
  bindExtrasButtons();

  // Login (Google + e-mail/senha)
  setupLoginButton();

  // Meus pedidos
  bindOrdersPanel();
});