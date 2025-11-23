/* =========================================================
   🚨 DFL v5.7.0 — MODO DIAGNÓSTICO (DEBUG)
   Este script vai mostrar um ALERTA na tela se houver erro.
   ========================================================= */

// 1. CAPTURADOR DE ERROS GLOBAL (O "Dedo-Duro")
window.onerror = function(message, source, lineno, colno, error) {
    alert("⚠️ ERRO CRÍTICO DETECTADO:\n\n" + message + "\n\nLinha: " + lineno);
    return false;
};

try {
    console.log("Iniciando Script DFL v5.7...");

    // ====================================================================
    // 🧠 PARTE 0: FUNÇÕES E VARIÁVEIS GLOBAIS
    // ====================================================================

    function getProductsMap() {
        const allProducts = [];
        document.querySelectorAll(".menu-section .card[data-name]").forEach(card => {
            const name = card.dataset.name;
            const price = parseFloat(card.dataset.price);
            const sectionEl = card.closest('.menu-section');
            const section = sectionEl ? sectionEl.querySelector('h2').textContent.trim().replace(/[^a-zA-Z\s]/g, '') : 'Menu';
            
            allProducts.push({
                name: name,
                searchName: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
                price: price,
                section: section,
                element: card
            });
        });
        return allProducts;
    }

    function levenshteinDistance(s1, s2) {
        s1 = s1.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        s2 = s2.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
        for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
        for (let j = 1; j <= s2.length; j += 1) track[j][0] = j;
        for (let j = 1; j <= s2.length; j += 1) {
            for (let i = 1; i <= s1.length; i += 1) {
                const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
                track[j][i] = Math.min(track[j][i - 1] + 1, track[j - 1][i] + 1, track[j - 1][i - 1] + indicator);
            }
        }
        return track[s2.length][s1.length];
    }

    // ====================================================================
    // 2. INICIALIZAÇÃO DO DOM (PRINCIPAL)
    // ====================================================================
    document.addEventListener("DOMContentLoaded", () => {
        try {
            // --- MÁSCARA CEP ---
            const cepInputMask = document.getElementById("cep-input");
            if (cepInputMask) {
                cepInputMask.addEventListener("input", function(e) {
                    let v = e.target.value.replace(/\D/g, "");
                    if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
                    e.target.value = v;
                });
            }

            // --- BUSCA DE PRODUTOS ---
            const campoBusca = document.getElementById("campoBusca");
            const resultadoBusca = document.getElementById("resultadoBusca");
            let todosProdutos = [];

            setTimeout(() => { todosProdutos = getProductsMap(); }, 1000);

            campoBusca?.addEventListener("input", (e) => {
                const query = e.target.value.trim().toLowerCase();
                if (todosProdutos.length === 0) return;

                if (query.length === 0) {
                    todosProdutos.forEach(p => p.element.style.display = 'block');
                    document.querySelectorAll(".menu-section").forEach(s => s.style.display = 'block');
                    if(resultadoBusca) resultadoBusca.innerHTML = '';
                    return;
                }
                
                const queryClean = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const produtosEncontrados = todosProdutos.filter(p => p.searchName.includes(queryClean));
                
                if (produtosEncontrados.length > 0) {
                    todosProdutos.forEach(p => p.element.style.display = 'none');
                    document.querySelectorAll(".menu-section").forEach(s => s.style.display = 'none');
                    produtosEncontrados.forEach(p => {
                        p.element.style.display = 'block';
                        p.element.closest(".menu-section").style.display = 'block';
                    });
                    if(resultadoBusca) resultadoBusca.innerHTML = `<div class="feedback-busca success">✅ ${produtosEncontrados.length} resultados encontrados.</div>`;
                } else {
                    // Lógica Fuzzy simplificada para teste
                    todosProdutos.forEach(p => p.element.style.display = 'none');
                    document.querySelectorAll(".menu-section").forEach(s => s.style.display = 'none');
                    if(resultadoBusca) resultadoBusca.innerHTML = `<div class="feedback-busca erro">Nenhum produto encontrado com "${query}".</div>`;
                }
            });

            // --- VARIÁVEIS BASE ---
            const sound = new Audio("click.wav");   
            let cart = [];  
            let currentUser = null;  
            let isFirebaseInitialized = false;   
            const DELIVERY_FEE_DEFAULT = 6.00;
            const LIMITE_FRETE_GRATIS = 80.00;
            let deliveryFeesCache = null;   
            const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;  
            const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };  

            // --- OBJETO ELEMENTOS (EL) ---
            const el = {
                cartIcon: document.getElementById("cart-icon"),
                cartCount: document.getElementById("cart-count"),
                miniCart: document.getElementById("mini-cart"),
                miniList: document.querySelector(".mini-list"),
                miniFoot: document.querySelector(".mini-foot"),
                cartBackdrop: document.getElementById("cart-backdrop"),
                statusBanner: document.getElementById("status-banner"),
                hoursBanner: document.querySelector(".hours-banner"),
                loginModal: document.getElementById("login-modal"),
                loginForm: document.getElementById("login-form"),
                googleBtn: document.getElementById("google-login"),
                userBtn: document.getElementById("user-btn"),
                pedidosBtn: document.querySelector(".meus-pedidos-btn"),
                pedidosPanel: document.getElementById("painelPedidos"),
                pedidosFecharBtn: document.querySelector(".fechar-pedidos"),
                pedidosLista: document.getElementById("listaPedidos"),
                recompensasBtn: document.querySelector(".recompensas-btn"),
                recompensasPanel: document.getElementById("recompensas-panel"),
                recompensasFecharBtn: document.querySelector(".fechar-recompensas"),
                recompensasLista: document.getElementById("listaRecompensas"),
                historicoLista: document.getElementById("historicoRecompensas"),
                extrasModal: document.getElementById("extras-modal"),
                extrasList: document.querySelector("#extras-modal .extras-list"),
                extrasConfirm: document.getElementById("extras-confirm"),
                comboModal: document.getElementById("combo-modal"),
                comboBody: document.querySelector("#combo-modal #combo-body"),
                comboConfirm: document.getElementById("combo-confirm"),
                // Frete
                btnNaoSeiCEP: document.getElementById("btnNaoSeiCEP"),
                btnManual: document.getElementById("btnManual"),
                btnConfirmarEndereco: document.getElementById("btnConfirmarEndereco"),
                btnVoltarCEP: document.getElementById("btnVoltarCEP")
            };

            // --- INICIALIZAÇÃO FIREBASE ---
            const firebaseConfig = {
                apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
                authDomain: "da-familia-lanches.firebaseapp.com",
                projectId: "da-familia-lanches",
                storageBucket: "da-familia-lanches.appspot.com",
                messagingSenderId: "106857147317",
                appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
            };

            function inicializarFirebase() {
                if (isFirebaseInitialized) return;
                try {
                    if (!window.firebase) throw new Error("Firebase não carregou.");
                    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
                    auth = firebase.auth();
                    db = firebase.firestore();
                    isFirebaseInitialized = true;
                    setupAuthListener();
                } catch (error) {
                    console.error("Erro Firebase:", error);
                }
            }

            function setupAuthListener() {
                auth.onAuthStateChanged(user => {
                    currentUser = user;
                    if (user) {
                        if(el.userBtn) el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || "Cliente"}`;
                        if(document.querySelector(".meus-pedidos")) document.querySelector(".meus-pedidos").style.display = 'block';
                        if(document.querySelector(".minhas-recompensas")) document.querySelector(".minhas-recompensas").style.display = 'block';
                    } else {
                        if(el.userBtn) el.userBtn.textContent = "Entrar / Cadastrar";
                        if(document.querySelector(".meus-pedidos")) document.querySelector(".meus-pedidos").style.display = 'none';
                        if(document.querySelector(".minhas-recompensas")) document.querySelector(".minhas-recompensas").style.display = 'none';
                    }
                });
            }

            // --- STATUS BANNER ---
            const atualizarStatus = safe(() => {  
                const agora = new Date(); const h = agora.getHours();  
                const aberto = h >= 18 && h < 23;   
                if (el.statusBanner) { 
                    el.statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!"; 
                    el.statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`; 
                }  
            });
            
            // --- TIMER (ADAPTADO PARA GRADE) ---
            const getFormattedTime = (diff) => {
                if (diff <= 0) return "00:00:00";
                const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
                const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
                const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
                return `${h}:${m}:${s}`;
            };

            const atualizarTimer = safe(() => {
                const agora = new Date();
                const fim = new Date();
                fim.setHours(23, 59, 59, 999);
                const diff = fim - agora;
                
                const elSecaoPromo = document.getElementById("secao-promocoes");
                if (!elSecaoPromo) return;

                let elTimerWrapper = elSecaoPromo.querySelector(".contador-promo-wrapper");
                if (!elTimerWrapper) {
                    const elTitulo = elSecaoPromo.querySelector(".titulo-secao");
                    if (!elTitulo) return;
                    elTimerWrapper = document.createElement("div");
                    elTimerWrapper.className = "contador-promo-wrapper";
                    elTimerWrapper.innerHTML = `<span class="tempo-restante-label">⏳ Tempo restante:</span><span class="tempo-restante-valor" id="promo-timer-valor">${getFormattedTime(diff)}</span>`;
                    const elSlogan = document.createElement("p");
                    elSlogan.className = "slogan-promo";
                    elSlogan.textContent = "Aproveite antes que o cronômetro zere à meia-noite!";
                    elTitulo.after(elSlogan);
                    elTitulo.after(elTimerWrapper);
                } else {
                    const elValor = elTimerWrapper.querySelector("#promo-timer-valor");
                    if (elValor) elValor.textContent = getFormattedTime(diff);
                }
            });

            // --- INTERAÇÕES BÁSICAS ---
            el.cartIcon?.addEventListener("click", () => { 
                // Função simplificada de abrir carrinho
                if(el.miniCart) {
                    el.miniCart.classList.add("active");
                    if(el.cartBackdrop) el.cartBackdrop.classList.add("active");
                }
            });
            
            document.getElementById("cart-backdrop")?.addEventListener("click", () => {
                document.querySelectorAll(".active").forEach(e => e.classList.remove("active"));
                document.querySelectorAll(".show").forEach(e => e.classList.remove("show"));
            });

            // --- DISPARAR FUNÇÕES INICIAIS ---
            inicializarFirebase();
            atualizarStatus();
            setInterval(atualizarStatus, 60000);
            atualizarTimer();
            setInterval(atualizarTimer, 1000);

        } catch (err_inner) {
            alert("ERRO DENTRO DO DOMContentLoaded: " + err_inner.message);
        }
    });

} catch (err_global) {
    alert("ERRO GLOBAL: " + err_global.message);
}
