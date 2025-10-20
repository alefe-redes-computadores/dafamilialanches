/* ============================================
   DFL v1.2 – Script principal (Firebase v8)
   - Som de clique (click.wav)
   - Login Google (Redirect)
   - Carrossel com setas + auto
   - Adicionais básicos
   - FAB “Meus Pedidos”
   - Countdown
============================================ */

/* =============== Som de clique =============== */
const clickSound = new Audio("click.wav");
clickSound.preload = "auto";
clickSound.volume = 0.4;
function playClick() {
  try {
    clickSound.currentTime = 0;
    clickSound.play().catch(()=>{});
  } catch {}
}

/* Helper */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* =============== Firebase v8 =============== */
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
const auth = firebase.auth();
const db   = firebase.firestore();

/* =============== Carrinho =============== */
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
const cartCountEl = document.getElementById("cart-count");
function updateCartCount() {
  const total = cart.reduce((s, it) => s + (it.quantidade || 1), 0);
  if (cartCountEl) cartCountEl.textContent = total;
}
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}
function showPopup(msg) {
  const p = document.createElement("div");
  p.className = "popup-add";
  p.textContent = msg;
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 1400);
}

/* =============== Adicionar ao carrinho =============== */
function wireAddToCartButtons() {
  document.querySelectorAll(".add-cart").forEach(btn => {
    btn.onclick = () => {
      const card = btn.closest(".card");
      if (!card) return;
      const item = {
        id: card.dataset.id,
        name: card.dataset.name,
        price: parseFloat(card.dataset.price),
        quantidade: 1
      };
      cart.push(item);
      saveCart();
      showPopup(`🍔 ${item.name} adicionado!`);
      playClick();
    };
  });
}

/* =============== Adicionais (modal simples) =============== */
let extrasModal;
function ensureExtrasModal() {
  if (extrasModal) return;
  extrasModal = document.createElement("div");
  extrasModal.id = "extras-modal";
  extrasModal.innerHTML = `
    <div class="extras-head">
      <span>Escolha seus adicionais</span>
      <button class="extras-close" aria-label="Fechar">✕</button>
    </div>
    <div class="extras-list">
      <label><span>Bacon</span><input type="checkbox" data-extra="Bacon" data-price="3"></label>
      <label><span>Cheddar</span><input type="checkbox" data-extra="Cheddar" data-price="2"></label>
      <label><span>Ovo</span><input type="checkbox" data-extra="Ovo" data-price="1.5"></label>
    </div>
    <div class="extras-foot">
      <button id="extras-cancel" class="btn-secondary">Cancelar</button>
      <button id="extras-add" class="btn-primary">Adicionar</button>
    </div>
  `;
  document.body.appendChild(extrasModal);

  extrasModal.addEventListener("click", (e) => {
    if (e.target.classList.contains("extras-close") || e.target.id === "extras-cancel") {
      extrasModal.classList.remove("show");
      playClick();
    }
    if (e.target.id === "extras-add") {
      const checks = extrasModal.querySelectorAll("input:checked");
      if (!checks.length) { extrasModal.classList.remove("show"); return; }
      let extrasTotal = 0;
      const names = [];
      checks.forEach(chk => {
        extrasTotal += parseFloat(chk.dataset.price);
        names.push(chk.dataset.extra);
      });
      cart.push({
        id: "extra-" + Date.now(),
        name: "Adicionais: " + names.join(", "),
        price: extrasTotal,
        quantidade: 1
      });
      saveCart();
      showPopup("➕ Adicionais adicionados!");
      extrasModal.classList.remove("show");
      playClick();
    }
  });
}

function wireExtrasButtons() {
  ensureExtrasModal();
  document.querySelectorAll(".extras-btn").forEach(btn => {
    btn.onclick = () => { extrasModal.classList.add("show"); playClick(); };
  });
}

/* =============== Carrossel =============== */
function initCarousel() {
  const root = document.getElementById("promoCarousel");
  if (!root) return;
  const slides = root.querySelector(".slides");
  const prev   = root.querySelector(".c-prev");
  const next   = root.querySelector(".c-next");
  if (!slides || !prev || !next) return;

  let auto = setInterval(() => slides.scrollBy({ left: slides.clientWidth * 0.9, behavior: "smooth" }), 5000);

  prev.onclick = () => {
    playClick();
    slides.scrollBy({ left: -slides.clientWidth * 0.9, behavior: "smooth" });
    resetAuto();
  };
  next.onclick = () => {
    playClick();
    slides.scrollBy({ left: slides.clientWidth * 0.9, behavior: "smooth" });
    resetAuto();
  };

  function resetAuto() {
    clearInterval(auto);
    auto = setInterval(() => slides.scrollBy({ left: slides.clientWidth * 0.9, behavior: "smooth" }), 5000);
  }
}
({ left: -slides.clientWidth * 0.9, behavior: "smooth" });
    resetAuto();
  };
  next.onclick = () => {
    playClick();
    slides.scrollBy({ left:  slides.clientWidth * 0.9, behavior: "smooth" });
    resetAuto();
  };

  function resetAuto() {
    clearInterval(auto);
    auto = setInterval(() => slides.scrollBy({ left: slides.clientWidth * 0.9, behavior: "smooth" }), 5000);
  }
}

/* =============== Countdown (encerra às 23:59:59) =============== */
function updateCountdown() {
  const el = document.getElementById("timer");
  if (!el) return;
  const now = new Date();
  const end = new Date();
  end.setHours(23,59,59,999);
  const diff = end - now;
  if (diff <= 0) { el.textContent = "00:00:00"; return; }
  const h = Math.floor(diff/1000/60/60);
  const m = Math.floor((diff/1000/60)%60);
  const s = Math.floor((diff/1000)%60);
  el.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

/* =============== FAB “Meus Pedidos” + Painel =============== */
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
        ${(p.itens || []).map((it,i)=>
          `<li>${i+1}. ${it.nome} — ${it.quantidade}x (R$ ${(it.subtotal || 0).toFixed(2)})</li>`
        ).join("")}
      </ul>
      <strong>Total: R$ ${total}</strong>
    `;
    content.appendChild(box);
  });
}

function ensureOrdersFab(user) {
  let fab = document.getElementById("orders-fab");
  if (user && !fab) {
    fab = document.createElement("button");
    fab.id = "orders-fab";
    fab.innerHTML = "📜 <span>Meus Pedidos</span>";
    document.body.appendChild(fab);
    requestAnimationFrame(()=> fab.classList.add("show"));
    fab.onclick = async () => {
      playClick();
      const list = await loadUserOrders(user.uid);
      renderOrders(list);
      document.getElementById("orders-panel")?.classList.add("active");
    };
  }
  if (!user && fab) fab.remove();
}

function wireOrdersPanelClose() {
  const btn = document.querySelector(".orders-close");
  if (!btn) return;
  btn.onclick = () => {
    playClick();
    document.getElementById("orders-panel")?.classList.remove("active");
  };
}

/* =============== Login UI (botão no header) =============== */
function buildAuthUI() {
  const header = document.querySelector(".header");
  if (!header) return;
  let userBtn = document.querySelector("#user-btn");
  if (!userBtn) {
    userBtn = document.createElement("button");
    userBtn.id = "user-btn";
    userBtn.className = "user-button";
    userBtn.style.cssText = `
      position:absolute;top:12px;right:12px;background:#111;color:#fff;
      border:none;border-radius:10px;padding:8px 12px;font-weight:700;cursor:pointer;
    `;
    header.appendChild(userBtn);
  }

  auth.onAuthStateChanged((user) => {
    if (user) {
      userBtn.textContent = `Olá, ${user.displayName || user.email.split("@")[0]} (Sair)`;
      userBtn.onclick = () => { playClick(); auth.signOut(); };
      ensureOrdersFab(user);
    } else {
      userBtn.textContent = "Entrar com Google";
      userBtn.onclick = () => {
        playClick();
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithRedirect(provider);
      };
      ensureOrdersFab(null);
    }
  });
}

/* =============== Inicialização =============== */
document.addEventListener("DOMContentLoaded", () => {
  updateCountdown();
  setInterval(updateCountdown, 1000);
  wireAddToCartButtons();
  wireExtrasButtons();
  initCarousel();
  wireOrdersPanelClose();
  buildAuthUI();
  updateCartCount();
});