// Local: /js/core.js — DFL v3.6.8 (Mobile-safe + imports dinâmicos)

// 🔁 NÃO fazemos import estático de rewards/admin para evitar ciclo.
// Cart pode permanecer estático (pressupondo que cart.js NÃO importa core.js).
import { setupCart, renderMiniCart, addCommonItem } from './cart.js';

// ───────────────────────────────────────────────────────────────────────────────
// Firebase (lazy)
export let auth, db;
export let isFirebaseInitialized = false;

const firebaseConfig = {
  apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
  authDomain: "da-familia-lanches.firebaseapp.com",
  projectId: "da-familia-lanches",
  storageBucket: "da-familia-lanches.appspot.com",
  messagingSenderId: "106857147317",
  appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
};

// ───────────────────────────────────────────────────────────────────────────────
// Estado & Utils
export const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
export const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };

export let cart = [];
export let currentUser = null;
export let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();
export let addressValue  = (localStorage.getItem("dflAddress") || "").trim();
export let configuracoesRecompensa = null; // cache

// ───────────────────────────────────────────────────────────────────────────────
// Elementos
export const el = {
  cartIcon: document.getElementById("cart-icon"),
  cartCount: document.getElementById("cart-count"),
  miniCart: document.getElementById("mini-cart"),
  miniList: document.querySelector(".mini-list"),
  miniFoot: document.querySelector(".mini-foot"),
  cartBackdrop: document.getElementById("cart-backdrop"),

  extrasModal: document.getElementById("extras-modal"),
  extrasList: document.querySelector("#extras-modal .extras-list"),
  extrasConfirm: document.getElementById("extras-confirm"),

  comboModal: document.getElementById("combo-modal"),
  comboBody: document.getElementById("combo-body"),
  comboConfirm: document.getElementById("combo-confirm"),

  loginModal: document.getElementById("login-modal"),
  loginForm: document.getElementById("login-form"),
  googleBtn: document.getElementById("google-login"),

  slides: document.querySelector(".slides"),
  cPrev: document.querySelector(".c-prev"),
  cNext: document.querySelector(".c-next"),

  userBtn: document.getElementById("user-btn"),
  statusBanner: document.getElementById("status-banner"),
  hoursBanner: document.querySelector(".hours-banner"),
  reportsBtn: document.getElementById("reports-btn"),

  pedidosContainer: document.querySelector(".meus-pedidos"),
  pedidosBtn: document.querySelector(".meus-pedidos-btn"),
  pedidosPanel: document.getElementById("painelPedidos"),
  pedidosFecharBtn: document.querySelector(".fechar-pedidos"),
  pedidosLista: document.getElementById("listaPedidos"),

  recompensasContainer: document.querySelector(".minhas-recompensas"),
  recompensasBtn: document.querySelector(".recompensas-btn"),
  recompensasPanel: document.getElementById("recompensas-panel"),
  recompensasFecharBtn: document.querySelector(".fechar-recompensas"),
  recompensasLista: document.getElementById("listaRecompensas"),
  historicoLista: document.getElementById("historicoRecompensas")
};

// ───────────────────────────────────────────────────────────────────────────────
// Overlays
export const Overlays = {
  closeAll() {
    document
      .querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show")
      .forEach((e) => e.classList.remove("show", "active"));
    el.cartBackdrop.classList.remove("active");
    document.body.classList.remove("no-scroll");
  },
  open(modalLike) {
    Overlays.closeAll();
    if (!modalLike) return;
    const isSide = (modalLike.id === "mini-cart" || modalLike.id === "painelPedidos" || modalLike.id === "recompensas-panel");
    modalLike.classList.add(isSide ? "active" : "show");
    el.cartBackdrop.classList.add("active");
    document.body.classList.add("no-scroll");
  },
};

// ───────────────────────────────────────────────────────────────────────────────
// Firebase init
export function inicializarFirebase() {
  if (isFirebaseInitialized) return;
  try {
    if (!window.firebase) {
      console.error("Firebase base não carregou.");
      return;
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    db = firebase.firestore();
    isFirebaseInitialized = true;
    setupAuthListener();
  } catch (error) {
    console.error("ERRO ao iniciar Firebase:", error);
    alert("Erro: não foi possível conectar aos serviços. Tente novamente.");
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Auth listener
function setupAuthListener() {
  auth.onAuthStateChanged(async (user) => {
    currentUser = user;

    if (user) {
      el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
      if (el.pedidosContainer) el.pedidosContainer.style.display = 'block';
      if (el.recompensasContainer) el.recompensasContainer.style.display = 'block';

      // admin (import dinâmico aqui)
      try {
        const { setupAdmin, isAdmin } = await import('./admin.js');
        if (isAdmin(user)) {
          el.reportsBtn.style.display = "block";
          // garante 1 só listener
          el.reportsBtn.onclick = async () => {
            if (!isFirebaseInitialized) inicializarFirebase();
            const admin = await import('./admin.js');
            admin.default?.(); // se houver default noop
            admin.openDashboard?.(); // caso tenha util
            // fallback: chama setupAdmin para construir painel e abrir
            setupAdmin();
          };
        } else {
          el.reportsBtn.style.display = "none";
          document.getElementById("admin-dashboard")?.remove();
        }
      } catch (e) {
        // se admin.js não existir ou não importar, seguimos sem travar
        console.debug("admin opcional:", e?.message || e);
      }
    } else {
      el.userBtn.textContent = "Entrar / Cadastrar";
      if (el.pedidosContainer) el.pedidosContainer.style.display = 'none';
      if (el.recompensasContainer) el.recompensasContainer.style.display = 'none';
      el.reportsBtn.style.display = "none";
      document.getElementById("admin-dashboard")?.remove();
    }
  });
}

// ───────────────────────────────────────────────────────────────────────────────
// Login helpers
const handleLoginSuccess = (user) => {
  currentUser = user;
  popupAdd("Login realizado com sucesso!");
  Overlays.closeAll();
};

const handleLoginError = (err) => {
  if (err.code === "auth/user-not-found") {
    if (confirm("Conta não encontrada. Deseja criar uma nova?")) {
      auth.createUserWithEmailAndPassword(
        document.getElementById("login-email")?.value?.trim(),
        document.getElementById("login-senha")?.value?.trim()
      )
      .then((cred) => handleLoginSuccess(cred.user))
      .catch((e) => alert("Erro: " + e.message));
    }
  } else if (err.code === "auth/wrong-password") {
    alert("Senha incorreta. Tente novamente.");
  } else {
    alert("Erro: " + err.message);
  }
};

// Toast
export function popupAdd(msg = "Feito!") {
  const box = document.createElement("div");
  box.className = "toast";
  box.textContent = msg;
  Object.assign(box.style, {
    position: "fixed",
    left: "50%",
    bottom: "24px",
    transform: "translateX(-50%)",
    padding: "10px 14px",
    background: "#323232",
    color: "#fff",
    borderRadius: "10px",
    zIndex: 9999,
    fontWeight: "600",
  });
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 2200);
}

// ───────────────────────────────────────────────────────────────────────────────
// Timers/Status
function atualizarStatus() {
  const agora = new Date();
  const h = agora.getHours();
  const m = agora.getMinutes();
  const aberto = h >= 18 && h < 23; // 18:00 até 22:59
  if (el.statusBanner) {
    el.statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!";
    el.statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`;
  }
  if (el.hoursBanner) {
    const elTimer = el.hoursBanner.querySelector("#timer");
    if (!elTimer) return;

    if (aberto) {
      const fim = new Date(agora);
      fim.setHours(23, 30, 0);
      let diff = (fim - agora) / 1000;
      if (diff < 0) diff = 0;
      const restH = Math.floor(diff / 3600);
      const restM = Math.floor((diff % 3600) / 60);
      elTimer.innerHTML = `<b>${restH}h ${restM}min</b>`;
    } else {
      const inicio = new Date(agora);
      if (h >= 23 || (h === 23 && m >= 30)) { inicio.setDate(inicio.getDate() + 1); }
      inicio.setHours(18, 0, 0);
      let diff = (inicio - agora) / 1000;
      const faltamH = Math.floor(diff / 3600);
      const faltamM = Math.floor((diff % 3600) / 60);
      el.hoursBanner.innerHTML = `⏰ Hoje atendemos até <b>23h30</b> — Faltam <b>${faltamH}h ${faltamM}min</b>`;
    }
  }
}

function atualizarTimer() {
  const agora = new Date();
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  const diff = fim - agora;
  const elTimer = document.getElementById("promo-timer");
  if (!elTimer) return;
  if (diff <= 0) { elTimer.textContent = "00:00:00"; return; }
  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  elTimer.textContent = `${h}:${m}:${s}`;
}

// ───────────────────────────────────────────────────────────────────────────────
// Boot
document.addEventListener("DOMContentLoaded", () => {

  // 🔊 Som de clique (só tocará após 1º gesto do usuário)
  let sound;
  try { sound = new Audio("click.wav"); } catch (_) {}
  document.addEventListener("click", () => {
    try { if (sound) { sound.currentTime = 0; sound.play(); } } catch (_) {}
  }, { passive: true });

  // Cart: setup imediato (não depende de auth)
  try { setupCart(); } catch (e) { console.error("setupCart falhou:", e); }

  // Rewards: import dinâmico só quando o botão for usado
  el.recompensasBtn?.addEventListener("click", async () => {
    if (!currentUser) {
      alert("Faça login para ver suas recompensas.");
      Overlays.open(el.loginModal);
      return;
    }
    try {
      inicializarFirebase();
      const rewards = await import('./rewards.js');
      rewards.setupRewards?.(); // garante listeners internos
      await rewards.carregarRecompensas?.(currentUser.uid);
      Overlays.open(el.recompensasPanel);
    } catch (e) {
      console.error("Erro ao abrir recompensas:", e);
      alert("Não foi possível carregar as recompensas agora.");
    }
  });

  el.recompensasFecharBtn?.addEventListener("click", () => Overlays.closeAll());

  // Pedidos painel (pode depender de auth mais tarde)
  el.pedidosBtn?.addEventListener("click", () => {
    if (!currentUser) {
      alert("Faça login para ver seus pedidos.");
      Overlays.open(el.loginModal);
      return;
    }
    Overlays.open(el.pedidosPanel);
    // aqui você pode carregar pedidos do Firestore depois
  });
  el.pedidosFecharBtn?.addEventListener("click", () => Overlays.closeAll());

  // Login: Email/senha
  el.loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    inicializarFirebase();
    if (!isFirebaseInitialized) return alert("Erro ao conectar ao serviço de login.");
    const email = document.getElementById("login-email")?.value?.trim();
    const senha = document.getElementById("login-senha")?.value?.trim();
    if (!email || !senha) return alert("Preencha e-mail e senha.");
    auth.signInWithEmailAndPassword(email, senha)
      .then((cred) => handleLoginSuccess(cred.user))
      .catch(handleLoginError);
  });

  // Login: Google
  el.googleBtn?.addEventListener("click", () => {
    inicializarFirebase();
    if (!isFirebaseInitialized) return alert("Erro ao conectar ao serviço de login.");
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then((res) => handleLoginSuccess(res.user))
      .catch((err) => alert("Erro: " + err.message));
  });

  // Botão do usuário abre modal de login
  el.userBtn?.addEventListener("click", () => {
    inicializarFirebase();
    Overlays.open(el.loginModal);
  });

  // Carrinho (mini-cart)
  el.cartIcon?.addEventListener("click", () => {
    if (!currentUser) inicializarFirebase();
    try { renderMiniCart(); } catch (e) { console.error("renderMiniCart falhou:", e); }
    Overlays.open(el.miniCart);
  });

  // Carrossel
  el.cPrev?.addEventListener("click", () => {
    if (!el.slides) return;
    el.slides.scrollLeft -= Math.min(el.slides.clientWidth * 0.9, 320);
  });
  el.cNext?.addEventListener("click", () => {
    if (!el.slides) return;
    el.slides.scrollLeft += Math.min(el.slides.clientWidth * 0.9, 320);
  });

  // Timers
  atualizarStatus();
  setInterval(atualizarStatus, 60000);
  atualizarTimer();
  setInterval(atualizarTimer, 1000);

  // Botões de adicionar (cards)
  document.querySelectorAll(".add-cart").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      if (!currentUser) inicializarFirebase();
      try { addCommonItem(e); } catch (err) { console.error("addCommonItem:", err); }
    })
  );

  console.log("%cDFL v3.6.8 — Núcleo carregado com imports dinâmicos (mobile-safe)","background:#1976D2;color:#fff;padding:6px 10px;border-radius:8px;font-weight:700;");
});