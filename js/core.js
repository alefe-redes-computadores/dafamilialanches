// Local: /js/core.js

// Importa TODAS as funções de setup
import { setupCart, renderMiniCart, addCommonItem } from './cart.js';
import { setupRewards, carregarRecompensas } from './rewards.js';
import { setupAdmin, isAdmin } from './admin.js';

// Variáveis globais para os módulos do Firebase
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

// Variáveis essenciais (carrinho, user, etc.)
export const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
export const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };

export let cart = [];
export let currentUser = null;
export let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();
export let addressValue  = (localStorage.getItem("dflAddress") || "").trim();
export let configuracoesRecompensa = null; // Cache das configs globais

/* ------------------ 🎯 ELEMENTOS ------------------ */
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

/* ------------------ 🧩 OVERLAYS ------------------ */
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
        modalLike.classList.add(
            (modalLike.id === "mini-cart" || modalLike.id === "painelPedidos" || modalLike.id === "recompensas-panel") ? "active" : "show"
        );
        el.cartBackdrop.classList.add("active"); 
        document.body.classList.add("no-scroll");
    },
};

/* ------------------ 🔥 FIREBASE (LAZY INIT) ------------------ */
export function inicializarFirebase() {
    if (isFirebaseInitialized) return;

    try {
        if (!window.firebase) {
            console.error("Biblioteca principal do Firebase (app) não carregou.");
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
        console.error("ERRO FATAL AO INICIAR FIREBASE:", error);
        alert("Erro Crítico: Não foi possível conectar aos serviços DFL. Recarregue.");
    }
}

/* ------------------ SETUP LISTENERS E AUTH ------------------ */
function setupAuthListener() {
    auth.onAuthStateChanged(user => {
        currentUser = user; 
        
        if (user) {
            el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
            if (el.pedidosContainer) el.pedidosContainer.style.display = 'block';
            if (el.recompensasContainer) el.recompensasContainer.style.display = 'block';
            
        } else {
            el.userBtn.textContent = "Entrar / Cadastrar";
            if (el.pedidosContainer) el.pedidosContainer.style.display = 'none';
            if (el.recompensasContainer) el.recompensasContainer.style.display = 'none';
        }

        if (user && isAdmin(user)) {
            setupAdmin(); 
        } else {
            if (el.reportsBtn) el.reportsBtn.style.display = "none";
            document.getElementById("admin-dashboard")?.remove();
        }
    });
}


// Funções de login (movidas para core)
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
        alert("Erro: ".concat(err.message));
    }
};

// Funções de Toast
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


/* ------------------ CRONÔMETROS E STATUS (CORRIGIDO) ------------------ */
function atualizarStatus() {
    const agora = new Date();
    const h = agora.getHours();
    const m = agora.getMinutes();
    const aberto = h >= 18 && h < 23; // Aberto das 18:00 até 22:59
    if (el.statusBanner) {
      el.statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!";
      el.statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`;
    }
    if (el.hoursBanner) {
      const elTimer = el.hoursBanner.querySelector("#timer");
      if (!elTimer) return;

      if (aberto) {
        const fim = new Date(agora);
        fim.setHours(23, 30, 0); // 23h30
        
        let diff = (fim - agora) / 1000;
        if (diff < 0) diff = 0;
        
        const restH = Math.floor(diff / 3600);
        const restM = Math.floor((diff % 3600) / 60);
        
        elTimer.innerHTML = `<b>${restH}h ${restM}min</b>`;

      } else {
        const inicio = new Date(agora);
        if (h >= 23 || (h === 23 && m >= 30)) { 
          inicio.setDate(inicio.getDate() + 1);
        }
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
    if (diff <= 0) return (elTimer.textContent = "00:00:00");

    const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
    elTimer.textContent = `${h}:${m}:${s}`;
}


/* ------------------ INICIALIZAÇÃO GERAL ------------------ */
document.addEventListener("DOMContentLoaded", () => {
    
    // 🔊 Setup de som de clique (MANTIDO)
    const sound = new Audio("click.wav");
    document.addEventListener("click", () => {
      try { sound.currentTime = 0; sound.play(); } catch (_) {}
    });

    // 🚨 CORREÇÃO ESSENCIAL: CHAMA OS SETUPS DOS MÓDULOS AQUI!
    setupCart();
    setupRewards();
    setupAdmin();
    
    // Bindings de Login
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

    el.googleBtn?.addEventListener("click", () => {
        inicializarFirebase();
        if (!isFirebaseInitialized) return alert("Erro ao conectar ao serviço de login.");
        
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
          .then((res) => handleLoginSuccess(res.user))
          .catch((err) => alert("Erro: ".concat(err.message)));
    });

    el.userBtn?.addEventListener("click", () => {
        inicializarFirebase();
        Overlays.open(el.loginModal);
    });
    
    el.cartIcon?.addEventListener("click", () => {
        if (!currentUser) inicializarFirebase(); // Tenta autenticar/logar se for primeiro acesso
        renderMiniCart(); // Renderiza o carrinho
        Overlays.open(el.miniCart);
    });
    
    // Carrossel (mantido no core)
    el.cPrev?.addEventListener("click", () => {
      if (!el.slides) return;
      el.slides.scrollLeft -= Math.min(el.slides.clientWidth * 0.9, 320);
    });
    el.cNext?.addEventListener("click", () => {
      if (!el.slides) return;
      el.slides.scrollLeft += Math.min(el.slides.clientWidth * 0.9, 320);
    });
    
    // Inicia os cronômetros e o status do restaurante
    atualizarStatus();
    setInterval(atualizarStatus, 60000);
    atualizarTimer();
    setInterval(atualizarTimer, 1000);

    // Funções de inicialização remanescentes (mantidas no core)
    document.querySelectorAll(".add-cart").forEach((btn) =>
        btn.addEventListener("click", (e) => {
            if (!currentUser) inicializarFirebase();
            addCommonItem(e); 
        })
    );


    console.log("%c🚀 DFL v3.6.3 — Estabilidade Total (Modularização Corrigida)",
                "background:#1976D2;color:#fff;padding:8px 12px;border-radius:8px;font-weight:700;");
});
