// Local: /js/core.js

import { setupCart } from './cart.js';
import { setupRewards } from './rewards.js';
import { setupAdmin } from './admin.js';

// Variáveis globais para os módulos do Firebase
export let auth, db; 
export let isFirebaseInitialized = false; 

const firebaseConfig = { /* ... (seus dados de configuração) */
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
    
    // ... (restante dos elementos)
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

/* ------------------ 🧩 OVERLAYS (MANTIDO) ------------------ */
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
        
        // Inicializa os serviços
        auth = firebase.auth();
        db = firebase.firestore();

        isFirebaseInitialized = true;
        
        setupAuthListener(); // Chama o listener de autenticação APÓS a inicialização

    } catch (error) {
        console.error("ERRO FATAL AO INICIAR FIREBASE:", error);
        alert("Erro Crítico: Não foi possível conectar aos serviços DFL. Recarregue.");
    }
}

/* ------------------ SETUP LISTENERS E AUTH (V3.6.0) ------------------ */
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
            if (el.reportsBtn) {
                // A lógica do admin será chamada em setupAdmin
            }
        } else {
            if (el.reportsBtn) el.reportsBtn.style.display = "none";
            document.getElementById("admin-dashboard")?.remove();
        }
    });
}
// Funções que o setupAuthListener precisa (extraídas)
const ADMINS = ["alefejohsefe@gmail.com", "kalebhstanley650@gmail.com", "contato@dafamilialanches.com.br"];
const isAdmin = (user) => user && user.email && ADMINS.includes(user.email.toLowerCase());
const createAdminFab = () => { el.reportsBtn.style.display = "block"; el.reportsBtn.addEventListener("click", () => { /* Logic in admin.js */ }); };


/* ------------------ INICIALIZAÇÃO GERAL ------------------ */
document.addEventListener("DOMContentLoaded", () => {
    
    // 🔊 Clique com som suave (não bloqueia o site se falhar)
    const sound = new Audio("click.wav");
    document.addEventListener("click", () => {
      try { sound.currentTime = 0; sound.play(); } catch (_) {}
    });

    // Setup de Modais e Carrinho (Função principal importada)
    setupCart();
    setupRewards();
    setupAdmin();
    
    // Bindings de Login (mantidos no core)
    el.userBtn?.addEventListener("click", () => {
        inicializarFirebase();
        Overlays.open(el.loginModal);
    });
    
    // Inicializa Firebase no primeiro clique do carrinho
    el.cartIcon?.addEventListener("click", () => {
        if (!currentUser) inicializarFirebase();
        setupCart(); // Renderiza/rebinda
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
    
    // Promo Modal (manter no core por enquanto)
    document.querySelectorAll(".slide[data-promo-id]").forEach((img) => {
        img.addEventListener("click", () => {
            const id = parseInt(img.dataset.promoId, 10);
            if (id) {
                // Lógica de showPromoModal
            }
        });
    });

    // Chamadas de Banner/Timer (mantidas no core)
    // As funções atualizarStatus e atualizarTimer serão reescritas no core.js na próxima etapa (Sprint 2)
    
    // Outras Funções (MANTIDO)
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) {
        console.warn("↻ Página reaberta via cache, recarregando...");
        location.reload();
      }
    });

    window.addEventListener("error", (e) => {
      if (String(e?.message || "").toLowerCase().includes("split")) {
        popupAdd("Humm… houve um pequeno erro ao ler dados. Atualize a página.");
      }
      console.warn("⚠️ Erro interceptado:", e?.message);
    });

    console.log("%c🚀 DFL v3.6.0 — Core Modularizado OK",
                "background:#1976D2;color:#fff;padding:8px 12px;border-radius:8px;font-weight:700;");
});
