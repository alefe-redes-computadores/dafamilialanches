// DFL v3.6.7 — Execução Garantida Mobile

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
  authDomain: "da-familia-lanches.firebaseapp.com",
  projectId: "da-familia-lanches",
  storageBucket: "da-familia-lanches.appspot.com",
  messagingSenderId: "106857147317",
  appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
};

let auth, db, currentUser = null;
let isFirebaseInitialized = false;

// Inicializa Firebase
function inicializarFirebase() {
  if (isFirebaseInitialized) return;
  try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    isFirebaseInitialized = true;
    setupAuthListener();
  } catch (e) {
    console.error("Erro Firebase:", e);
  }
}

// Listener de Autenticação
function setupAuthListener() {
  auth.onAuthStateChanged((user) => {
    currentUser = user;
    const userBtn = document.getElementById("user-btn");
    if (user) {
      userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
    } else {
      userBtn.textContent = "Entrar / Cadastrar";
    }
  });
}

// Banner aberto/fechado
function atualizarStatus() {
  const elStatus = document.getElementById("status-banner");
  const elTimer = document.querySelector(".hours-banner #timer");
  const agora = new Date();
  const h = agora.getHours();
  const aberto = h >= 18 && h < 23;

  if (elStatus) {
    elStatus.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!";
    elStatus.className = `status-banner ${aberto ? "open" : "closed"}`;
  }

  if (elTimer) {
    const fim = new Date();
    fim.setHours(23, 30, 0);
    const diff = (fim - agora) / 1000;
    const restH = Math.floor(diff / 3600);
    const restM = Math.floor((diff % 3600) / 60);
    elTimer.innerHTML = `<b>${restH}h ${restM}min</b>`;
  }
}

// Timer de promoções
function atualizarTimer() {
  const elPromo = document.getElementById("promo-timer");
  if (!elPromo) return;
  const agora = new Date();
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  let diff = fim - agora;
  if (diff <= 0) return (elPromo.textContent = "00:00:00");
  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  elPromo.textContent = `${h}:${m}:${s}`;
}

// Overlay simples
const Overlays = {
  closeAll() {
    document.querySelectorAll(".modal.show, .active").forEach((e) => e.classList.remove("show", "active"));
    document.body.classList.remove("no-scroll");
  },
  open(el) {
    this.closeAll();
    if (el) el.classList.add("show");
    document.body.classList.add("no-scroll");
  },
};

// Inicialização Geral
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔥 DFL v3.6.7 — JS executando normalmente");

  // Som de clique
  const sound = new Audio("click.wav");
  document.addEventListener("click", () => {
    try { sound.currentTime = 0; sound.play(); } catch (_) {}
  });

  // Inicializa Firebase ao clicar no botão de usuário
  document.getElementById("user-btn")?.addEventListener("click", () => {
    inicializarFirebase();
    Overlays.open(document.getElementById("login-modal"));
  });

  // Carrossel
  const slides = document.querySelector(".slides");
  document.querySelector(".c-prev")?.addEventListener("click", () => slides.scrollLeft -= 320);
  document.querySelector(".c-next")?.addEventListener("click", () => slides.scrollLeft += 320);

  // Setup dos módulos se existirem
  if (typeof setupCart === "function") setupCart();
  if (typeof setupRewards === "function") setupRewards();
  if (typeof setupAdmin === "function") setupAdmin();

  // Banners e timers
  atualizarStatus();
  atualizarTimer();
  setInterval(atualizarStatus, 60000);
  setInterval(atualizarTimer, 1000);
});