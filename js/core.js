// Local: /js/core.js  — DFL v3.6.1

// --- Imports dos módulos
import {
  renderMiniCart,
  enhanceMiniCartUI,
  fecharPedido,
  addCommonItem,
  openExtrasFor,
  openComboModal,
} from "./cart.js";
import {
  setupRewards,
  carregarConfiguracoesDeRecompensas,
  validarCupomFirestore,
  carregarHistoricoRecompensas,
  mostrarPopupRecompensa,
  carregarRecompensas,
} from "./rewards.js";
import { setupAdmin, isAdmin, createAdminFab } from "./admin.js";

// --- Firebase handles (v8)
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

// --- Estado essencial (exportado pois outros módulos usam)
export const DELIVERY_FEE = 6.0;
export const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
export const safe = (fn) => (...a) => {
  try {
    fn(...a);
  } catch (e) {
    console.error(e);
  }
};

export let cart = [];
export let currentUser = null;
export let couponApplied = (localStorage.getItem("dflCoupon") || "")
  .toUpperCase();
export let addressValue = (localStorage.getItem("dflAddress") || "").trim();
export let configuracoesRecompensa = null; // cache global

// --- Elementos de UI (exportado)
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

  // Painel "Meus Pedidos"
  pedidosContainer: document.querySelector(".meus-pedidos"),
  pedidosBtn: document.querySelector(".meus-pedidos-btn"),
  pedidosPanel: document.getElementById("painelPedidos"),
  pedidosFecharBtn: document.querySelector(".fechar-pedidos"),
  pedidosLista: document.getElementById("listaPedidos"),

  // Painel "Minhas Recompensas"
  recompensasContainer: document.querySelector(".minhas-recompensas"),
  recompensasBtn: document.querySelector(".recompensas-btn"),
  recompensasPanel: document.getElementById("recompensas-panel"),
  recompensasFecharBtn: document.querySelector(".fechar-recompensas"),
  recompensasLista: document.getElementById("listaRecompensas"),
  historicoLista: document.getElementById("historicoRecompensas"),
};

// --- Overlays
export const Overlays = {
  closeAll() {
    document
      .querySelectorAll(
        ".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show"
      )
      .forEach((e) => e.classList.remove("show", "active"));
    el.cartBackdrop?.classList.remove("active");
    document.body.classList.remove("no-scroll");
  },
  open(modalLike) {
    Overlays.closeAll();
    if (!modalLike) return;
    modalLike.classList.add(
      modalLike.id === "mini-cart" ||
        modalLike.id === "painelPedidos" ||
        modalLike.id === "recompensas-panel"
        ? "active"
        : "show"
    );
    el.cartBackdrop?.classList.add("active");
    document.body.classList.add("no-scroll");
  },
};

// --- Toast simples (utilizado em login e outros fluxos)
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

// --- Firebase (lazy init)
export function inicializarFirebase() {
  if (isFirebaseInitialized) return;
  try {
    if (!window.firebase) {
      console.error("Firebase SDK não carregado no HTML.");
      return;
    }
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    isFirebaseInitialized = true;
    setupAuthListener();
  } catch (error) {
    console.error("ERRO FATAL AO INICIAR FIREBASE:", error);
    alert(
      "Erro Crítico: Não foi possível conectar aos serviços DFL. Recarregue a página."
    );
  }
}

// --- Auth listener
function setupAuthListener() {
  auth.onAuthStateChanged((user) => {
    currentUser = user;

    if (user) {
      el.userBtn && (el.userBtn.textContent =
        `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`);
      if (el.pedidosContainer) el.pedidosContainer.style.display = "block";
      if (el.recompensasContainer) el.recompensasContainer.style.display = "block";
    } else {
      el.userBtn && (el.userBtn.textContent = "Entrar / Cadastrar");
      if (el.pedidosContainer) el.pedidosContainer.style.display = "none";
      if (el.recompensasContainer) el.recompensasContainer.style.display = "none";
    }

    if (user && isAdmin(user)) {
      setupAdmin();
    } else {
      if (el.reportsBtn) el.reportsBtn.style.display = "none";
      document.getElementById("admin-dashboard")?.remove();
    }
  });
}

// --- Fluxo de login (email/senha + Google)
const handleLoginSuccess = (user) => {
  currentUser = user;
  popupAdd("Login realizado com sucesso!");
  Overlays.closeAll();
};

const handleLoginError = (err) => {
  if (err?.code === "auth/user-not-found") {
    if (confirm("Conta não encontrada. Deseja criar uma nova?")) {
      auth
        .createUserWithEmailAndPassword(
          document.getElementById("login-email")?.value?.trim(),
          document.getElementById("login-senha")?.value?.trim()
        )
        .then((cred) => handleLoginSuccess(cred.user))
        .catch((e) => alert("Erro: " + e.message));
    }
  } else if (err?.code === "auth/wrong-password") {
    alert("Senha incorreta. Tente novamente.");
  } else {
    alert("Erro: " + (err?.message || "Falha ao autenticar."));
  }
};

// --- Status “Aberto/Fechado” e timers
function atualizarStatus() {
  const agora = new Date();
  const h = agora.getHours();
  const m = agora.getMinutes();
  const aberto = h >= 18 && h < 23; // 18:00–22:59

  if (el.statusBanner) {
    el.statusBanner.textContent = aberto
      ? "🟢 Aberto — Faça seu pedido!"
      : "🔴 Fechado — Voltamos às 18h!";
    el.statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`;
  }

  if (el.hoursBanner) {
    const elTimer = el.hoursBanner.querySelector("#timer");
    if (!elTimer) return;

    if (aberto) {
      const fim = new Date(agora);
      fim.setHours(23, 30, 0); // fecha 23h30
      let diff = Math.max(0, (fim - agora) / 1000);
      const restH = Math.floor(diff / 3600);
      const restM = Math.floor((diff % 3600) / 60);
      elTimer.innerHTML = `<b>${restH}h ${restM}min</b>`;
    } else {
      const inicio = new Date(agora);
      if (h > 18 || (h === 18 && m >= 0)) inicio.setDate(inicio.getDate() + 1);
      inicio.setHours(18, 0, 0);
      let diff = Math.max(0, (inicio - agora) / 1000);
      const faltamH = Math.floor(diff / 3600);
      const faltamM = Math.floor((diff % 3600) / 60);
      el.hoursBanner.innerHTML =
        `⏰ Hoje atendemos até <b>23h30</b> — Faltam <b>${faltamH}h ${faltamM}min</b>`;
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
  if (diff <= 0) {
    elTimer.textContent = "00:00:00";
    return;
  }
  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  elTimer.textContent = `${h}:${m}:${s}`;
}

// --- Boot
document.addEventListener("DOMContentLoaded", () => {
  // Clique sonoro (não bloqueia UI se falhar)
  const sound = new Audio("click.wav");
  document.addEventListener("click", () => {
    try {
      sound.currentTime = 0;
      sound.play();
    } catch (_) {}
  });

  // Header — Login
  el.loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    inicializarFirebase();
    if (!isFirebaseInitialized) return alert("Não foi possível conectar.");
    const email = document.getElementById("login-email")?.value?.trim();
    const senha = document.getElementById("login-senha")?.value?.trim();
    if (!email || !senha) return alert("Preencha e-mail e senha.");
    auth
      .signInWithEmailAndPassword(email, senha)
      .then((cred) => handleLoginSuccess(cred.user))
      .catch(handleLoginError);
  });

  el.googleBtn?.addEventListener("click", () => {
    inicializarFirebase();
    if (!isFirebaseInitialized) return alert("Não foi possível conectar.");
    const provider = new firebase.auth.GoogleAuthProvider();
    auth
      .signInWithPopup(provider)
      .then((res) => handleLoginSuccess(res.user))
      .catch((err) => alert("Erro: " + err.message));
  });

  el.userBtn?.addEventListener("click", () => {
    inicializarFirebase();
    Overlays.open(el.loginModal);
  });

  // Carrinho (mini cart)
  el.cartIcon?.addEventListener("click", () => {
    if (!currentUser) inicializarFirebase();
    renderMiniCart();
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

  // Binds dos Cards “Adicionar”
  document.querySelectorAll(".add-cart").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      if (!currentUser) inicializarFirebase();
      addCommonItem(e);
    })
  );

  // Painel: Meus Pedidos
  el.pedidosBtn?.addEventListener("click", () => Overlays.open(el.pedidosPanel));
  el.pedidosFecharBtn?.addEventListener("click", () => Overlays.closeAll());

  // Painel: Minhas Recompensas
  el.recompensasBtn?.addEventListener("click", () =>
    Overlays.open(el.recompensasPanel)
  );
  el.recompensasFecharBtn?.addEventListener("click", () => Overlays.closeAll());

  // Backdrop fecha tudo
  el.cartBackdrop?.addEventListener("click", () => Overlays.closeAll());

  // Timers principais
  atualizarStatus();
  setInterval(atualizarStatus, 60_000);
  atualizarTimer();
  setInterval(atualizarTimer, 1_000);

  console.log(
    "%c🚀 DFL v3.6.1 — Core Estável (Bindings OK)",
    "background:#1976D2;color:#fff;padding:8px 12px;border-radius:8px;font-weight:700;"
  );
});