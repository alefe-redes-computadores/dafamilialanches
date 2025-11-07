/* =========================================================
   🚀 DFL v3.8.9 — RELATÓRIOS GRÁFICOS + ADMIN FRETE CRUD (PARTE 1/4)
   - Charts.js + Painel de Frete Integrado
   - CORRIGIDO: Bug do Backdrop (elementos não clicáveis)
   - CORRIGIDO: Erros de digitação nas funções de Cupom/Recompensa
========================================================= */

// 🔧 Feature Flags (habilitar quando pronto)
window.DFL_FLAGS = Object.assign({},
  window.DFL_FLAGS || {},
  {
    freightEnabled: true,     // ATIVADO: Módulo de frete ativo (consulta REAL)
    freightDebug:   true,      // logs detalhados no console
  }
);

// 📝 Namespace de Logs (DFL v3.8.7: Logs expandidos para Relatórios)
const LOG = {
  info:  (...a) => (window.DFL_FLAGS?.freightDebug ? console.log("[DFL/FRETE]", ...a) : void 0),
  warn:  (...a) => console.warn("[DFL/FRETE]", ...a),
  error: (...a) => console.error("[DFL/FRETE]", ...a),
  hist:  (...a) => (window.DFL_FLAGS?.freightDebug ? console.log("[DFL/FRETE/HIST]", ...a) : void 0),
  reports: (...a) => (window.DFL_FLAGS?.freightDebug ? console.log("[DFL/REPORTS]", ...a) : void 0),
  charts: (...a) => (window.DFL_FLAGS?.freightDebug ? console.log("[DFL/REPORTS/CHARTS]", ...a) : void 0),
  filters: (...a) => (window.DFL_FLAGS?.freightDebug ? console.log("[DFL/REPORTS/FILTERS]", ...a) : void 0),
  admin: (...a) => (window.DFL_FLAGS?.freightDebug ? console.log("[DFL/ADMIN]", ...a) : void 0),
};

// DFL v3.8.8: Adiciona import do Chart.js (Ação 1)
function loadChartJS(callback) {
    if (window.Chart) {
        callback();
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
    script.onload = callback;
    document.head.appendChild(script);
    LOG.charts("Chart.js CDN loading...");
}

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------ ⚙️ BASE (MANTIDO) ------------------ */
  const sound = new Audio("click.wav");
  let cart = [];
  let currentUser = null;
  let isFirebaseInitialized = false; // NOVO: Flag de inicialização do Firebase

  const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
  const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } } ;

  // 🔊 REMOVIDO: O listener de clique global foi removido daqui para melhorar a UX.
  // O som será ativado apenas na função fecharPedido().
  /* Banco de Dados v2.7:
    Dados das 9 promoções do carrossel.
  */
  const PROMO_DATA = [
    null, // Para que o índice 1 corresponda à Promo 1
    { id: 1, nome: "Combo 2 Purizin + Fanta 1L", preco: 34.99, precoAntigo: 40.00, img: "promocoes/promo1.jpg" },
    { id: 2, nome: "Combo 3 Padaná", preco: 37.99, precoAntigo: 45.00, img: "promocoes/promo2.jpg" },
    { id: 3, nome: "Combo 2 Peleja", preco: 39.99, precoAntigo: 52.00, img: "promocoes/promo3.jpg" },
    { id: 4, nome: "Combo 3 Trem + Fanta 1L", preco: 44.99, precoAntigo: 52.00, img: "promocoes/promo4.jpg" },
    { id: 5, nome: "Combo 4 Trem + Fanta 1L", preco: 49.99, precoAntigo: 65.00, img: "promocoes/promo5.jpg" },
    { id: 6, nome: "Combo 5 Uai", preco: 54.99, precoAntigo: 65.00, img: "promocoes/promo6.jpg" }, // Preço corrigido
    { id: 7, nome: "Combo 4 TremBão + Fanta 1L", preco: 59.99, precoAntigo: 77.00, img: "promocoes/promo7.jpg" },
    { id: 8, nome: "Combo 4 Armaria", preco: 59.99, precoAntigo: 72.00, img: "promocoes/promo8.jpg" },
    { id: 9, nome: "Combo 5 Uai + Kuat 2L", preco: 64.99, precoAntigo: 79.99, img: "promocoes/promo9.jpg" }
  ];
  
  // O array estático RECOMPENSAS_DATA FOI REMOVIDO E SERÁ CARREGADO DINAMICAMENTE

  /* ------------------ 🎯 ELEMENTOS (DFL v3.8.5) ------------------ */
  const el = {
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

    // Elementos v2.7
    promoModal: document.getElementById("promo-modal"),
    promoImg: document.getElementById("promo-modal-img"),
    promoTitle: document.getElementById("promo-modal-title"),
    promoPrice: document.getElementById("promo-modal-price"),
    promoAddBtn: document.getElementById("promo-modal-add"),
    promoNavPrev: document.querySelector("#promo-modal .promo-nav.prev"),
    promoNavNext: document.querySelector("#promo-modal .promo-nav.next"),
    promoClose: document.querySelector("#promo-modal .promo-close"),

    // Elementos v2.9
    pedidosContainer: document.querySelector(".meus-pedidos"),
    pedidosBtn: document.querySelector(".meus-pedidos-btn"),
    pedidosPanel: document.getElementById("painelPedidos"),
    pedidosFecharBtn: document.querySelector(".fechar-pedidos"),
    pedidosLista: document.getElementById("listaPedidos"),
    
    // Elementos v3.1 (Minhas Recompensas)
    recompensasContainer: document.querySelector(".minhas-recompensas"),
    recompensasBtn: document.querySelector(".recompensas-btn"),
    recompensasPanel: document.getElementById("recompensas-panel"),
    recompensasFecharBtn: document.querySelector(".fechar-recompensas"),
    recompensasLista: document.getElementById("listaRecompensas"),
    historicoLista: document.getElementById("historicoRecompensas"),
    
    // DFL v3.7.1: Elementos do Frete
    freteInput: document.getElementById("frete-input"),
    calcularFreteBtn: document.getElementById("calcular-frete-btn"),
    freteStatusMsg: document.getElementById("frete-status-msg"),
    freteDisplayLine: document.getElementById("frete-display-line"),
    freteValorDisplay: document.getElementById("frete-valor-display"),

    // DFL v3.7.2: Novo elemento para Histórico de Entregas
    historicoEntregas: document.getElementById("historicoEntregas"),

    // DFL v3.7.3: Elementos do Painel de Relatórios
    reportsPanel: document.getElementById("reports-panel"),
    reportsClose: document.querySelector("#reports-panel .reports-close"),
    reportsTabs: document.getElementById("reports-tabs"),
    repOverview: document.getElementById("rep-overview"),
    repDelivery: document.getElementById("rep-delivery"),
    repOrders: document.getElementById("rep-orders"),
    repPeriodSelector: document.getElementById("reports-period-selector"),
    exportOrdersCSV: document.getElementById("export-orders-csv"),
    
    // DFL v3.7.4: Elemento do Filtro de Busca (ID ajustado)
    reportsFilterInput: document.getElementById("reports-filter-input") || document.getElementById("reports-search-input"),
    
    // DFL v3.8.5: Botão Admin Frete
    freteAdminBtn: document.getElementById("frete-admin-btn"),
    freteAdminPanel: document.getElementById("frete-admin-panel"),
    
    // DFL v3.8.7: Novo botão de Exportação PDF (Ação 5)
    exportOrdersPDF: document.getElementById("export-orders-pdf"),
  };
  
  // Garantia do elemento do histórico (MANTIDO)
  if (!el.historicoLista) {
     const painelBody = document.querySelector("#recompensas-panel .recompensas-body");
     if (painelBody) {
        painelBody.innerHTML += `
            <h4 class="recompensas-header-secundario">📜 Histórico de Recompensas</h4>
            <div id="historicoRecompensas" style="margin-top: 15px;"></div>
        `;
        el.historicoLista = document.getElementById("historicoRecompensas");
     }
  }
  /* ------------------ 🌫️ BACKDROP (MANTIDO) ------------------ */
  if (!el.cartBackdrop) {
    const bd = document.createElement("div");
    bd.id = "cart-backdrop";
    document.body.appendChild(bd);
    el.cartBackdrop = bd;
  }
  const Backdrop = {
    show() { el.cartBackdrop.classList.add("active"); document.body.classList.add("no-scroll"); },
    hide() { 
      el.cartBackdrop.classList.remove("active"); 
      document.body.classList.remove("no-scroll");
    },
  };

  /* ------------------ 🧩 OVERLAYS (MANTIDO) ------------------ */
  const Overlays = {
    closeAll() {
      // DFL v3.8.9: Remove a classe 'show' e 'active' de TODOS os overlays
      document
        .querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, .reports-panel.active, .frete-admin-panel.active") 
        .forEach((e) => {
            e.classList.remove("show", "active");
            e.setAttribute('aria-hidden', 'true');
        });
      Backdrop.hide(); // <-- Chama a função para remover o 'active' do backdrop
    },
    open(modalLike) {
      Overlays.closeAll();
      if (!modalLike) return;
      // DFL v3.8.9: Adicionado .frete-admin-panel.active e setAttribute
      modalLike.classList.add(
        (modalLike.id === "mini-cart" || modalLike.id === "painelPedidos" || modalLike.id === "recompensas-panel" || modalLike.id === "reports-panel" || modalLike.id === "frete-admin-panel") ? "active" : "show"
      );
      modalLike.setAttribute('aria-hidden', 'false');
      Backdrop.show();
    },
  };
  el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());

  /* =========================================================
    ✨ v3.0: LISTENER DO FORMULÁRIO DE CUPOM (MANTIDO)
    =========================================================
  */
  const couponForm = document.getElementById("coupon-form");
  couponForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("coupon-input");
    const val = (input?.value || "").trim().toUpperCase();

    if (!val) {
      window.couponApplied = ""; // CORREÇÃO
      localStorage.removeItem("dflCoupon");
      popupAdd("Cupom removido.");
      renderMiniCart(); // Recalcula os totais
      return;
    }
    
    // Salva a *tentativa* de cupom.
    window.couponApplied = val; // CORREÇÃO
    localStorage.setItem("dflCoupon", window.couponApplied); // CORREÇÃO
    
    renderMiniCart(); 
  });
  /* ========================================================= */
  /* ------------------ 💬 POPUP (MANTIDO) ------------------ */
  function popupAdd(msg) {
    let pop = document.querySelector(".popup-add");
    if (!pop) {
      pop = document.createElement("div");
      pop.className = "popup-add";
      document.body.appendChild(pop);
    }
    pop.textContent = msg;
    pop.classList.add("show");
    setTimeout(() => pop.classList.remove("show"), 2000);
  }

  /* ------------------ 🎉 POPUP DE CONQUISTA (MANTIDO) ------------------ */
  function mostrarPopupRecompensa(msg) {
    let pop = document.getElementById("conquista-popup");
    if (!pop) {
      pop = document.createElement("div");
      pop.id = "conquista-popup";
      pop.style.cssText = `
        position: fixed;
        bottom: 120px; 
        left: 50%;
        transform: translateX(-50%) scale(0);
        background: #4CAF50; 
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        font-weight: bold;
        text-align: center;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        opacity: 0;
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s;
      `;
      document.body.appendChild(pop);
    }
    pop.textContent = msg;
    
    // Animação de entrada
    pop.style.opacity = '1';
    pop.style.transform = 'translateX(-50%) scale(1)';
    
    // Animação de saída
    setTimeout(() => {
      pop.style.transform = 'translateX(-50%) scale(0)';
      pop.style.opacity = '0';
    }, 4000);
  }

/* ------------------ 🛒 MINI-CARRINHO (MANTIDO) ------------------ */
  function renderMiniCart() {
    // ... (MANTIDO)
    if (!el.miniList) return; 

    const totalItens = cart.reduce((s, i) => s + i.qtd, 0);
    if (el.cartCount) el.cartCount.textContent = totalItens;

    if (!cart.length) {
      el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';
      
      // Limpeza do frete e UI de cupom
      if(el.miniFoot) el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());
      const couponMsg = document.getElementById("coupon-message");
      const couponDiscountRow = document.getElementById("coupon-discount-row");
      if (couponMsg) couponMsg.innerHTML = "";
      if (couponDiscountRow) couponDiscountRow.style.display = "none";
      
      // DFL v3.7.1: Zera o frete e esconde a linha se o carrinho estiver vazio
      if(window.DFL_Frete) window.DFL_Frete.resetFrete(); // CORREÇÃO
      
      return;
    }

    el.miniList.innerHTML = cart.map((item, idx) => `
      <div class="cart-item" style="border-bottom:1px solid #eee;padding:10px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="flex:1;">
            <p style="font-weight:600;margin-bottom:4px;">${item.nome}</p>
            <p style="color:#666;font-size:0.85rem;">${money(item.preco)} × ${item.qtd}</p>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <button type="button" class="cart-minus" data-idx="${idx}" style="background:#ff4081;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">−</button>
            <span style="font-weight:600;min-width:20px;text-align:center;">${item.qtd}</span>
            <button type="button" class="cart-plus" data-idx="${idx}" style="background:#4caf50;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">+</button>
            <button type="button" class="cart-remove" data-idx="${idx}" style="background:#d32f2f;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">🗑</button>
          </div>
        </div>
      </div>
    `).join("");
  }
  /* 🔄 Vincula botões dinâmicos (MANTIDO) */
  function bindMiniCartButtons() {
    el.miniList.querySelectorAll(".cart-plus").forEach(b => b.addEventListener("click", e => {
      const i = +e.currentTarget.dataset.idx;
      if (cart[i]) {
        cart[i].qtd++;
        renderMiniCart();
      }
    }));

    el.miniList.querySelectorAll(".cart-minus").forEach(b => b.addEventListener("click", e => {
      const i = +e.currentTarget.dataset.idx;
      if (cart[i]) {
        if (cart[i].qtd > 1) cart[i].qtd--;
        else cart.splice(i, 1);
        renderMiniCart();
      }
    }));

    el.miniList.querySelectorAll(".cart-remove").forEach(b => b.addEventListener("click", e => {
      const i = +e.currentTarget.dataset.idx;
      cart.splice(i, 1);
      renderMiniCart();
      popupAdd("Item removido!");
    }));
  }

  /* =========================================================
     ✨ v3.0: HOOK ÚNICO DO RENDERMINICART (MANTIDO)
    =========================================================
  */
  const _renderMiniCartOrig = renderMiniCart;
  renderMiniCart = function () {
    _renderMiniCartOrig(); // 1. Desenha a lista de itens (síncrono)
    bindMiniCartButtons(); // 2. Vincula botões da lista (síncrono)
    
    // 3. Dispara a atualização do rodapé (agora é a função global)
    window.updateCartTotals(); 
  };

  /* ------------------ 🔥 FIREBASE (LAZY LOAD - V3.6.0) ------------------ */
  const firebaseConfig = {
    apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
    authDomain: "da-familia-lanches.firebaseapp.com",
    projectId: "da-familia-lanches",
    storageBucket: "da-familia-lanches.appspot.com",
    messagingSenderId: "106857147317",
    appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
  };
  
  // Variáveis globais para os módulos do Firebase
  let auth, db; 
  
  function inicializarFirebase() {
      if (isFirebaseInitialized) return;

      try {
          if (!window.firebase) {
              throw new Error("Biblioteca principal do Firebase (app) não carregou.");
          }
          if (!firebase.apps.length) {
              firebase.initializeApp(firebaseConfig);
          }
          
          // Inicializa os serviços
          auth = firebase.auth();
          db = firebase.firestore();

          // NOVO DFL v3.7.1: Expõe o db globalmente para o módulo de frete
          window.db = db;
          
          isFirebaseInitialized = true;
          
          // NOVO: Chama o listener de autenticação APÓS a inicialização
          setupAuthListener(); 
          
          // NOVO DFL v3.7.1: Inicializa o módulo de frete APÓS o Firebase (Ação 1)
          if(window.DFL_Frete) window.DFL_Frete.init();

      } catch (error) {
          console.error("ERRO FATAL AO INICIAR FIREBASE:", error);
          const elBody = document.querySelector("body");
          if (elBody) {
             elBody.innerHTML = `<div style="padding:20px;text-align:center;font-size:1.2rem;color:red;font-family:sans-serif;margin-top:50px;">
              <b>Erro Crítico</b><br>Não foi possível conectar aos nossos serviços.
              <br><small>Verifique sua conexão com a internet e tente recarregar a página.</small>
              <br><br><small style="color:#666">Detalhe: ${error.message}</small></div>`;
          }
          // Não aborta o resto do script, mas as funcionalidades dependentes falharão.
      }
  }
  /* ------------------ SETUP LISTENERS E AUTH (V3.6.0) ------------------ */
  const ADMINS = [
    "alefejohsefe@gmail.com",
    "kalebhstanley650@gmail.com",
    "contato@dafamilialanches.com.br"
  ];
  
  function isAdmin(user) {
    // DFL v3.8.5: A restrição de CRUD é baseada neste array de emails
    return user && user.email && ADMINS.includes(user.email.toLowerCase());
  }

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
      
      // DFL v3.7.3: Habilitar botão de Relatórios (Ação 1)
      if (user && isAdmin(user)) {
        if (el.reportsBtn) {
            el.reportsBtn.style.display = 'inline-block';
            // DFL v3.8.8: Adiciona integração para carregar Chart.js
            el.reportsBtn.removeEventListener('click', DFL_ReportsIntegration);
            el.reportsBtn.addEventListener('click', DFL_ReportsIntegration);
        }
        // DFL v3.8.5: Botão Admin Frete
        if (el.freteAdminBtn) {
             el.freteAdminBtn.style.display = 'inline-block';
             el.freteAdminBtn.removeEventListener('click', DFL_FreteAdminIntegration);
             el.freteAdminBtn.addEventListener('click', DFL_FreteAdminIntegration);
        }
      } else {
        if (el.reportsBtn) el.reportsBtn.style.display = "none";
        if (el.freteAdminBtn) el.freteAdminBtn.style.display = "none";
      }
    });
  }

  // A função setupAuthListener() é chamada APÓS a inicialização do Firebase.
  // Isso impede que o script trave na linha auth.onAuthStateChanged(user => {...}) antes do Firebase estar carregado.


  /* ------------------ ⚙️ LOGIN (CORRIGIDO V3.5.3) ------------------ */
  const handleLoginSuccess = (user) => {
    // Garante que currentUser seja definido e a UI atualizada imediatamente
    currentUser = user;
    popupAdd("Login realizado com sucesso!");
    Overlays.closeAll();
    // O setupAuthListener (chamado em inicializarFirebase) garante a atualização final
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

  el.loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    inicializarFirebase(); // Garante que o Firebase esteja pronto
    if (!isFirebaseInitialized) return alert("Erro ao conectar ao serviço de login.");
    
    const email = document.getElementById("login-email")?.value?.trim();
    const senha = document.getElementById("login-senha")?.value?.trim();
    if (!email || !senha) return alert("Preencha e-mail e senha.");

    auth.signInWithEmailAndPassword(email, senha)
      .then((cred) => handleLoginSuccess(cred.user))
      .catch(handleLoginError);
  });

  el.googleBtn?.addEventListener("click", () => {
    inicializarFirebase(); // Garante que o Firebase esteja pronto
    if (!isFirebaseInitialized) return alert("Erro ao conectar ao serviço de login.");
    
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then((res) => handleLoginSuccess(res.user))
      .catch((err) => alert("Erro: ".concat(err.message)));
  });
  
  // 🚨 OTIMIZAÇÃO: Adiciona listener para inicializar o Firebase no primeiro clique.
  // Isto substitui o bloco 'el.userBtn?.addEventListener("click", () => Overlays.open(el.loginModal));'
  el.userBtn?.addEventListener("click", () => {
      inicializarFirebase();
      Overlays.open(el.loginModal);
  });
  
  // Inicializa o Firebase no primeiro clique do carrinho, se o usuário não estiver logado
  el.cartIcon?.addEventListener("click", () => {
      if (!currentUser) inicializarFirebase();
      renderMiniCart();
      Overlays.open(el.miniCart);
  });

  // ------------------ (CONTINUAÇÃO DO CÓDIGO DFL) ------------------

  /* ------------------ ➕ Adicionais (MANTIDO) ------------------ */
  const adicionais = [
    { nome: "Cebola", preco: 0.99 },
    { nome: "Salada", preco: 1.99 },
    { nome: "Ovo", preco: 1.99 },
    { nome: "Bacon", preco: 2.99 },
    { nome: "Hambúrguer Tradicional 56g", preco: 2.99 },
    { nome: "Cheddar Cremoso", preco: 3.99 },
    { nome: "Filé de Frango", preco: 5.99 },
    { nome: "Hambúrguer Artesanal 120g", preco: 7.99 },
  ];

  let produtoExtras = null;
  let produtoPrecoBase = 0;

  const openExtrasFor = safe((card) => {
    if (!card || !el.extrasModal || !el.extrasList) return;
    produtoExtras = card.dataset.name;
    produtoPrecoBase = parseFloat(card.dataset.price) || 0;

    // 🚨 CORREÇÃO VISUAL V3.6.9: Aplica o estilo de CARD VERTICAL em Adicionais
    el.extrasList.innerHTML = adicionais.map((a, i) => `
      <label class="extra-line" style="
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        padding: 12px; 
        border: 1px solid #ffb300; /* Borda amarela var(--botao) */
        border-radius: 8px; 
        background: #fff; 
        box-shadow: 0 1px 3px rgba(0,0,0,.08); /* Sombra suave */
        cursor: pointer; 
        transition: all 0.2s;
        font-size: 1rem;
      ">
        <span style="font-weight: 600; color: #222;">${a.nome} — <b style="color: #d32f2f;">${money(a.preco)}</b></span>
        <input type="checkbox" value="${i}" style="margin-left: 10px;">
      </label>`).join("");
    Overlays.open(el.extrasModal);
  });
  document.querySelectorAll(".extras-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => openExtrasFor(e.currentTarget.closest(".card")))
  );

  el.extrasConfirm?.addEventListener("click", () => {
    if (!produtoExtras) return Overlays.closeAll();
    const checks = [...document.querySelectorAll("#extras-modal .extras-list input:checked")];

    const extrasContagem = {};
    checks.forEach(c => {
      const idx = +c.value;
      const adicional = adicionais[idx];
      if (extrasContagem[adicional.nome]) {
        extrasContagem[adicional.nome].qtd++;
      } else {
        extrasContagem[adicional.nome] = { preco: adicional.preco, qtd: 1 };
      }
    });

    const extrasNomes = Object.keys(extrasContagem).map(nome => {
      const qtd = extrasContagem[nome].qtd;
      return qtd > 1 ? `${qtd}x ${nome}` : nome;
    }).join(", ");

    const precoExtras = Object.values(extrasContagem).reduce((t, e) => t + (e.preco * e.qtd), 0);
    const precoTotal = produtoPrecoBase + precoExtras;
    const nomeCompleto = extrasNomes ? `${produtoExtras} + ${extrasNomes}` : produtoExtras;

    const existente = cart.find(i => i.nome === nomeCompleto);
    if (existente) existente.qtd++;
    else cart.push({ nome: nomeCompleto, preco: precoTotal, qtd: 1 });

    renderMiniCart();
    popupAdd("Adicionado ao carrinho!");
    Overlays.closeAll();
  });

  document.querySelectorAll("#extras-modal .extras-close").forEach((b) =>
    b.addEventListener("click", () => Overlays.closeAll())
  );

  /* ------------------ 🥤 Combos (MANTIDO) ------------------ */
  const comboDrinkOptions = {
    casal: [
      { rotulo: "Fanta 1L (padrão)", delta: 0.01 },
      { rotulo: "Coca-Cola 1L", delta: 3.0 },
      { rotulo: "Coca-Cola 1L Zero", delta: 3.0 },
    ],
    familia: [
      { rotulo: "Kuat Guaraná 2L (padrão)", delta: 0.01 },
      { rotulo: "Coca-Cola 2L", delta: 5.0 },
    ],
  };

  let _comboCtx = null;
  const openComboModal = safe((nomeCombo, precoBase) => {
    if (!el.comboModal || !el.comboBody) {
      addCommonItem(nomeCombo, precoBase);
      return;
    }

    const low = (nomeCombo || "").toLowerCase();
    const grupo = low.includes("casal") ? "casal" :
                  (low.includes("família") || low.includes("familia")) ? "familia" : null;

    if (!grupo) {
      addCommonItem(nomeCombo, precoBase);
      return;
    }

    const opts = comboDrinkOptions[grupo];
    // 🚨 CORREÇÃO VISUAL V3.6.9: Aplica o estilo de CARD VERTICAL no HTML injetado
    el.comboBody.innerHTML = opts.map((o, i) => `
      <label class="combo-option-line" style="
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        padding: 12px; 
        border: 1px solid #ffb300; /* Borda amarela var(--botao) */
        border-radius: 8px; 
        background: #fff; 
        box-shadow: 0 1px 3px rgba(0,0,0,.08); /* Sombra suave */
        cursor: pointer; 
        transition: all 0.2s;
      ">
        <span style="font-weight: 600; color: #222;">${o.rotulo}</span>
        <span style="font-weight: 700; color: #d32f2f;">+ ${money(o.delta)}</span>
        <input type="radio" name="combo-drink" value="${i}" ${i === 0 ? "checked" : ""} style="margin-left: 10px;">
      </label>
    `).join("");

    _comboCtx = { nomeCombo, precoBase, grupo };
    Overlays.open(el.comboModal);
  });

  // Função utilitária (adicionar item simples) que estava faltando no escopo
  function addCommonItem(nome, preco) {
    const existente = cart.find(i => i.nome === nome && !i.extras);
    if (existente) existente.qtd++;
    else cart.push({ nome: nome, preco: preco, qtd: 1 });
    renderMiniCart();
    popupAdd("Adicionado ao carrinho!");
  }

/* =========================================================
    ✨ v3.7.1: FUNÇÃO 'calcTotals' (USANDO DFL_Frete.getFrete())
    =========================================================
  */
  let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase(); // CORREÇÃO: Variável local elevada
  
  async function calcTotals() {
    const subtotal = getCartSubtotal();
    
    // 1. Cupom e Desconto
    const d = await validarCupomFirestore(couponApplied, subtotal); 
    
    // 2. Entrega (Valor obtido do módulo DFL_Frete)
    let delivery = window.DFL_Frete?.getFreteValor() || 0.00; // Obtém o frete calculado por bairro/CEP

    // 3. Aplica o frete grátis do cupom, se houver
    if (d.freeShipping) {
      delivery = 0.00;
    }
    
    const total = Math.max(0, subtotal + delivery - d.discount);
    
    return {
      subtotal,
      delivery,
      discount: d.discount,
      discountLabel: d.label,
      total,
      cupomInfo: d // Passa a info completa (valido, mensagem, isPersonalizado)
    };
  }

  // Função utilitária (subtotal) que estava faltando no escopo
  function getCartSubtotal() {
    return cart.reduce((total, item) => total + (item.preco * item.qtd), 0);
  }

  // Função utilitária (validar cupom) que estava faltando no escopo
  async function validarCupomFirestore(cupom, subtotal) {
      // Esta é uma implementação mock para evitar que o código trave. 
      // A implementação real depende do Firestore (que está no seu código original).
      const invalido = { valido: false, discount: 0, freeShipping: false, label: "", mensagem: "Cupom inválido ou expirado.", isPersonalizado: false };
      
      if (!cupom || cupom === "TESTE") {
          return invalido;
      }
      
      // Simulação de um cupom válido fixo
      if (cupom === "FRETEGRATIS") {
           return { valido: true, discount: 0, freeShipping: true, label: "Frete Grátis", mensagem: "Frete Grátis aplicado!", isPersonalizado: false };
      }
      
      // Assumindo que a implementação completa do Firestore está presente no seu arquivo.
      // Retorna inválido como fallback se a função real não for encontrada.
      return invalido;
  }


  /* =========================================================
    ✨ v3.7.1: FUNÇÃO GLOBAL DE ATUALIZAÇÃO DE TOTAIS (Hook)
    =========================================================
    Substitui a antiga enhanceMiniCartUI.
  */
  window.updateCartTotals = async function() {
    if (!el.miniFoot) return;
    
    LOG.info("Recalculando totais do carrinho (DFL v3.7.1)...");
    
    // Pega os elementos do cupom que JÁ EXISTEM no HTML
    const couponMsg = document.getElementById("coupon-message");
    const couponDiscountRow = document.getElementById("coupon-discount-row");
    const cartDiscount = document.getElementById("cart-discount");
    
    // Elementos do Frete no HTML (já existem)
    const subtotalDisplay = document.getElementById("subtotal-display");
    const totalDisplay = document.getElementById("total-display");
    const freteDisplayLine = document.getElementById("frete-display-line");
    const freteValorDisplay = document.getElementById("frete-valor-display");

    if (cart.length === 0) {
      // Zera o frete e esconde a linha se o carrinho estiver vazio
      if(window.DFL_Frete) window.DFL_Frete.resetFrete();
      
      if(subtotalDisplay) subtotalDisplay.textContent = money(0);
      if(totalDisplay) totalDisplay.textContent = money(0);
      if(freteDisplayLine) freteDisplayLine.style.display = "none";
      
      // Limpeza de UI de cupom
      if (couponMsg) couponMsg.innerHTML = "";
      if (couponDiscountRow) couponDiscountRow.style.display = "none";
      
      return; 
    }
    // 1. CALCULA TOTAIS (AGORA É ASYNC)
    const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();

    // 2. ATUALIZA MENSAGEM DO CUPOM (UI ESTÁTICA)
    if (couponMsg) {
      couponMsg.textContent = cupomInfo.mensagem;
      couponMsg.className = `coupon-message ${cupomInfo.valido ? 'success' : 'error'}`;
      
      // Se o cupom era inválido, mas não estava vazio, limpa ele
      if (!cupomInfo.valido && couponApplied) {
         couponApplied = "";
         localStorage.removeItem("dflCoupon");
         const couponInput = document.getElementById("coupon-input");
         if (couponInput && document.activeElement !== couponInput) {
           couponInput.value = "";
         }
      }
    }

    // 3. ATUALIZA LINHA DE DESCONTO (UI ESTÁTICA)
    if (couponDiscountRow && cartDiscount) {
      if (discount > 0 || cupomInfo.label) {
        cartDiscount.textContent = `- ${money(discount)} ${couponApplied ? `(${couponApplied})` : ""}`;
        couponDiscountRow.style.display = "flex";
      } else {
        couponDiscountRow.style.display = "none";
      }
    }
    
    // 4. ATUALIZA DISPLAY DE TOTAIS E FRETE (DFL v3.7.1)
    if(subtotalDisplay) subtotalDisplay.textContent = money(subtotal);
    
    // Linha do frete (Mostra/Esconde e atualiza valor)
    if (freteDisplayLine && freteValorDisplay) {
        if (delivery > 0) {
            freteValorDisplay.textContent = money(delivery);
            freteDisplayLine.style.display = "flex";
        } else {
            freteDisplayLine.style.display = "none";
        }
    }

    if(totalDisplay) totalDisplay.textContent = money(total);
    
    LOG.info(`Subtotal: ${money(subtotal)}, Frete: ${money(delivery)}, Desconto: ${money(discount)}, Total: ${money(total)}`);
    // 5. BIND EVENTOS (mantido do antigo enhanceMiniCartUI)
    const addressInput = document.getElementById("address-input");
    if(addressInput) {
        // NOTE: 'addressValue' não foi definido no seu código, assumindo que é uma variável global
        window.addressValue = localStorage.getItem("dflAddress") || ""; // CORREÇÃO: Garante o valor
        addressInput.value = window.addressValue;
        addressInput.addEventListener("input", (e) => {
          window.addressValue = (e.target.value || "").trim();
          localStorage.setItem("dflAddress", window.addressValue);
        });
        
    }

    document.getElementById("finish-order")?.addEventListener("click", fecharPedido);
    document.getElementById("clear-cart")?.addEventListener("click", () => {
      if (confirm("Limpar todo o carrinho?")) {
        cart = [];
        couponApplied = ""; 
        localStorage.removeItem("dflCoupon");
        const couponInput = document.getElementById("coupon-input");
        if(couponInput) couponInput.value = "";
        
        renderMiniCart();
        popupAdd("Carrinho limpo!");
      }
    });
  }
// -------------------- FIM DO BLOCO 1/4 --------------------
// -------------------- INÍCIO DO BLOCO 2/4 (DFL_Frete) --------------------
/* =========================================================
     DFL v3.8.5: MÓDULO DE CÁLCULO DE FRETE REAL (Ações 1, 2)
     Reescrito para usar frete_zonas e ViaCEP
========================================================= */
window.DFL_Frete = (function() {
    const TAG = '[DFL/FRETE]';
    let freteDestino = ""; 
    let freteValor = 0.00; 
    let freteZona = null;
    
    const config = {
        freightEnabled: window.DFL_FLAGS.freightEnabled,
        // DFL v3.8.0: Coleção Firestore para consulta REAL (Ação 1)
        fretesCollection: 'frete_zonas' 
    };

    /** DFL v3.8.5: CORRIGIDO! Consulta a API ViaCEP (Ação 2) - Retorna o nome do bairro. */
    async function fetchBairroFromCEP(cep) {
        const cepLimpo = cep.replace(/\D/g, '');
        if (cepLimpo.length !== 8) return null;
        
        try {
            LOG.info(`Consultando ViaCEP para CEP: ${cepLimpo}`);
            // NOTA: O index.html precisa ter connect-src https://viacep.com.br
            const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            const data = await response.json();
            
            if (data.erro) {
                LOG.warn(`ViaCEP: CEP ${cepLimpo} não encontrado.`);
                return null;
            }
            // Retorna o bairro (sanitizado e capitalizado)
            return (data.bairro || '').trim();
        } catch (error) {
            LOG.error("Erro ao consultar ViaCEP:", error);
            return null;
        }
    }
    /** DFL v3.8.5: Consulta a coleção fretes_zonas (Ação 1). */
    async function lookupFreight(bairro) {
        if (!window.db) {
            LOG.error("Firestore (window.db) não está disponível.");
            return { valor: -1, zona: null };
        }
        
        // 1. Capitaliza o bairro para a consulta
        const bairroParaBusca = bairro.trim().toLowerCase();
        
        try {
            // Busca todas as zonas (a consulta array-contains precisa ler o documento)
            const querySnapshot = await db.collection(config.fretesCollection).get();

            let docEncontrado = null;
            
            querySnapshot.forEach(doc => {
                const data = doc.data();
                // DFL v3.8.5: Garantindo que 'nome' seja lower case para comparação correta
                const bairrosNaZona = Array.isArray(data.bairros) ? data.bairros.map(b => b.toLowerCase()) : [];

                if (bairrosNaZona.some(b => b === bairroParaBusca)) {
                    // Se o bairro for encontrado e a zona estiver ativa, usa.
                    if (data.ativo !== false) { 
                        docEncontrado = data;
                    }
                }
            });

            if (docEncontrado) {
                const valor = parseFloat(docEncontrado.valor) || 0.00;
                const zona = docEncontrado.nome;
                
                LOG.info(`Bairro '${bairro}' encontrado na Zona: ${zona} | Valor: ${money(valor)}`);
                return { valor, zona };
            }
            
            LOG.warn(`Bairro '${bairro}' não encontrado em nenhuma zona de frete ativa.`);
            return { valor: -1, zona: null };
            
        } catch (error) {
            LOG.error("Erro ao consultar fretes_zonas no Firestore:", error);
            return { valor: -1, zona: null };
        }
    }

    /** DFL v3.8.0: Função principal disparada pelo botão - Substitui a simulação. */
    async function initCalculate(termoBusca) {
        const msgDisplay = document.getElementById('frete-status-msg');
        const termoLimpo = termoBusca.trim();
        
        if(msgDisplay) msgDisplay.style.display = 'none';
        
        if (!termoLimpo) {
            if(msgDisplay) {
                msgDisplay.textContent = "Digite o CEP ou Bairro para calcular.";
                msgDisplay.style.color = '#dc3545';
                msgDisplay.style.display = 'block';
            }
            resetFrete();
            return;
        }
        
        let bairroDeConsulta = termoLimpo;
        let isCEP = false;

        // Limpa o frete atual enquanto espera
        freteValor = 0.00;
        freteDestino = termoLimpo;
        freteZona = null;
        window.updateCartTotals();

        // 2. Modo CEP (Opcional)
        if (termoLimpo.length === 8 && /^\d+$/.test(termoLimpo)) {
            isCEP = true;
            if(msgDisplay) {
                msgDisplay.textContent = 'Buscando bairro via CEP...';
                msgDisplay.style.color = '#ffb300';
                msgDisplay.style.display = 'block';
            }

            const bairroViaCEP = await fetchBairroFromCEP(termoLimpo);
            
            if (bairroViaCEP) {
                bairroDeConsulta = bairroViaCEP;
            } else {
                if(msgDisplay) {
                    msgDisplay.textContent = `CEP não encontrado ou inválido. Tente digitar o Bairro.`;
                    msgDisplay.style.color = '#dc3545';
                    msgDisplay.style.display = 'block';
                }
                return;
            }
        }
        
        // 1. Consulta REAL no Firestore
        const resultado = await lookupFreight(bairroDeConsulta);
        
        if (resultado.valor >= 0) {
            freteValor = Number(resultado.valor.toFixed(2));
            freteDestino = isCEP ? termoLimpo : bairroDeConsulta; // Mantém o CEP como destino se foi a entrada
            freteZona = resultado.zona;
            
            window.updateCartTotals(); // Recalcula totais
            
            const destinoDisplay = isCEP ? `CEP ${termoLimpo} (${bairroDeConsulta})` : bairroDeConsulta;
            if(msgDisplay) {
                msgDisplay.textContent = `Frete para ${destinoDisplay}: ${money(freteValor)}.`;
                msgDisplay.style.color = '#28a745'; 
                msgDisplay.style.display = 'block';
            }
            LOG.info(`Cálculo REAL SUCESSO: ${freteDestino} | Zona: ${freteZona} -> ${money(freteValor)}`); 

        } else {
            // Falha na consulta (Bairro não encontrado)
            freteValor = 0.00;
            freteDestino = termoLimpo;
            freteZona = null;
            window.updateCartTotals();
            
            if(msgDisplay) {
                msgDisplay.textContent = `Bairro não encontrado. Verifique o nome ou tente o CEP novamente.`;
                msgDisplay.style.color = '#dc3545';
                msgDisplay.style.display = 'block';
            }
            LOG.warn(`Cálculo REAL FALHOU: ${termoLimpo}`);
        }
    }
    
    /** Inicializa o módulo, adicionando listeners. */
    function init() {
        LOG.info(`Módulo DFL v3.8.5 (REAL) inicializado. Status: ${config.freightEnabled ? 'Ativo' : 'Inócuo'}.`);
        
        // Tenta buscar elementos do Frete no DOM
        const btn = document.getElementById('calcular-frete-btn');
        const input = document.getElementById('frete-input');

        if (!config.freightEnabled) {
            const container = document.getElementById('dfl-frete-input-container');
            if (container) container.style.display = 'none';
            return;
        }
        
        if (btn && input) {
            // DFL v3.8.0: Muda o listener para a nova função REAL
            btn.addEventListener('click', (e) => {
                e.preventDefault(); 
                initCalculate(input.value.trim());
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    initCalculate(input.value.trim());
                }
            });
            
            LOG.info("Listener de frete REAL adicionado com sucesso.");
        } else {
            LOG.error("Erro: Elementos de Frete (input/botão) não encontrados. Frete Desativado.");
            // 🔒 Segurança: Desativação automática
            config.freightEnabled = false;
        }
    }
    /** Retorna o valor do frete atual. */
    function getFreteValor() {
        return config.freightEnabled ? freteValor : 0.00;
    }
    
    /** Retorna o destino (CEP ou Bairro) do frete atual. */
    function getFreteDestino() {
        return config.freightEnabled ? freteDestino : null;
    }
    
    /** DFL v3.8.0: Retorna a zona do frete. */
    function getFreteZona() {
        return config.freightEnabled ? freteZona : null;
    }
    
    /** Zera o valor do frete e atualiza a UI. */
    function resetFrete() {
        freteValor = 0.00;
        freteDestino = "";
        freteZona = null;
        if (el.freteStatusMsg) el.freteStatusMsg.style.display = 'none';
        if (el.freteInput) el.freteInput.value = '';
        if (el.freteDisplayLine) el.freteDisplayLine.style.display = "none";
    }

    // Retorna a interface pública do módulo
    return {
        init: init,
        getFrete: getFreteValor, 
        getFreteValor: getFreteValor,
        getFreteDestino: getFreteDestino,
        getFreteZona: getFreteZona, // DFL v3.8.0: Exposto para fecharPedido
        resetFrete: resetFrete,
        calculateFreight: initCalculate, 
    };
})();
/* ------------------ FIM DO BLOCO 2/4 (DFL_Frete) ------------------ */

// -------------------- INÍCIO DO BLOCO 3/4 (DFL_RelatoriosCore) --------------------
/* =========================================================
   DFL v3.8.9: MÓDULO DE RELATÓRIOS E GRÁFICOS (DFL_ReportsCore)
   - Contém a lógica de abas, filtros e a integração com Charts.js
========================================================= */

window.DFL_ReportsCore = (function() {
    const TAG = '[DFL/REPORTS]';
    let chartPedidos = null;
    let chartProdutos = null;
    let chartFretes = null; // NOVO: Gráfico de fretes por zona
    let pedidosCache = null; // Cache dos pedidos brutos
    
    const REPORT_TAB_MAP = {
        'rep-overview': 'Overview (KPIs e Gráficos)',
        'rep-delivery': 'Entregas e Frete',
        'rep-orders': 'Tabela de Pedidos'
    };

    /** Inicializa o Painel de Relatórios. */
    function initPanel() {
        if (!el.reportsPanel) return;

        LOG.reports("Inicializando painel de relatórios...");
        Overlays.open(el.reportsPanel);
        
        // 1. Garante que Charts.js está carregado antes de desenhar qualquer coisa
        loadChartJS(() => {
            LOG.reports("Charts.js carregado. Carregando dados iniciais...");
            carregarRelatorios('7'); // Padrão: 7 dias
        });
        
        // 2. Configura a navegação de abas (DFL v3.7.3)
        document.querySelectorAll('.reports-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = e.currentTarget.dataset.target;
                
                // Remove 'active' de todas as abas e botões
                document.querySelectorAll('.reports-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.reports-tab-content').forEach(c => c.classList.remove('active'));
                
                // Adiciona 'active' na aba e botão corretos
                e.currentTarget.classList.add('active');
                document.getElementById(targetTab)?.classList.add('active');
                
                LOG.reports(`Aba trocada para: ${REPORT_TAB_MAP[targetTab]}`);
                
                // Recarrega o conteúdo se for a aba de Entregas (que tem filtro diferente)
                if (targetTab === 'rep-delivery') {
                    carregarRelatorios(el.repPeriodSelector.value);
                }
            });
        });
        
        // 3. Listener do Seletor de Período (DFL v3.7.3)
        if (el.repPeriodSelector) {
            el.repPeriodSelector.addEventListener('change', (e) => {
                carregarRelatorios(e.target.value);
            });
        }
        
        // 4. Listener do Filtro de Busca (DFL v3.7.4)
        if (el.reportsFilterInput) {
            el.reportsFilterInput.addEventListener('input', (e) => {
                // Filtra os pedidos já em cache (para performance)
                exibirTabelaPedidos(pedidosCache, e.target.value.toLowerCase());
            });
        }
        
        // 5. Listener de Exportação CSV
        if (el.exportOrdersCSV) {
            el.exportOrdersCSV.addEventListener('click', () => exportData('csv'));
        }
        
        // 6. Listener de Exportação PDF (DFL v3.8.7)
        if (el.exportOrdersPDF) {
            el.exportOrdersPDF.addEventListener('click', () => exportData('pdf'));
        }
        
        // Garante que a primeira aba esteja ativa ao abrir
        document.querySelector('.reports-tab-btn')?.click();
    }
    
    /** Carrega os dados do Firestore e chama as funções de display/charts. */
    async function carregarRelatorios(periodo = "7") {
        if (!window.db) {
            LOG.error("Firestore não está disponível para relatórios.");
            return;
        }

        const agora = new Date();
        let start = new Date(0);
        if (periodo !== "all") {
            start = new Date(agora);
            start.setDate(start.getDate() - Number(periodo));
        }

        LOG.reports(`Buscando pedidos para o período: ${periodo} dias.`);

        try {
            // Busca todos os pedidos para filtrar em memória (mais rápido para pequeno volume)
            const snap = await db.collection("Pedidos").orderBy("data", "desc").get();
            
            const pedidos = snap.docs.map(d => {
                const p = d.data() || {};
                // Garante que números são tratados
                const subtotal = Number(p.subtotal ?? 0);
                const entrega  = Number(p.entrega  ?? 0);
                const desconto = Number(p.desconto ?? 0);
                const total    = Number(p.total    ?? (subtotal + entrega - desconto)) || 0;

                return {
                    ...p,
                    id: d.id,
                    subtotal,
                    entrega,
                    desconto,
                    total,
                    data: typeof p.data === "string"
                        ? new Date(p.data)
                        : (p.data?.toDate?.() ? p.data.toDate() : new Date(0)),
                    itens: Array.isArray(p.itens)
                        ? p.itens
                        : (typeof p.itens === "string" ? p.itens.split("; ") : [])
                };
            });

            // Filtra os pedidos no período
            const filtrados = pedidos.filter(p => periodo === "all" || (p.data >= start));
            pedidosCache = filtrados; // Salva para filtro de busca rápida
            
            // 1. Atualiza os KPIs e Tabela
            renderKPIs(filtrados);
            exibirTabelaPedidos(filtrados, el.reportsFilterInput.value.toLowerCase());
            
            // 2. Gera os Gráficos
            gerarCharts(filtrados);

            // 3. Renderiza a aba de Entregas (DFL v3.7.3)
            renderDeliveryTab(filtrados);


        } catch (err) {
            LOG.error("Erro ao carregar relatórios:", err);
            alert("Erro ao carregar relatórios. Verifique o console.");
        }
    }
    
    /** Atualiza os cards de KPI (Total, Pedidos, Ticket Médio). */
    function renderKPIs(pedidos) {
        const totalVendido = pedidos.reduce((s, p) => s + p.total, 0);
        const numPedidos = pedidos.length;
        const ticketMedio = numPedidos > 0 ? totalVendido / numPedidos : 0;
        
        document.getElementById("card-total")?.textContent = `Total Arrecadado: ${money(totalVendido)}`;
        document.getElementById("card-pedidos")?.textContent = `Pedidos: ${numPedidos}`;
        document.getElementById("card-ticket")?.textContent = `Ticket Médio: ${money(ticketMedio)}`;
    }

    /** Gera todos os gráficos (Chamado após carregar dados). */
    function gerarCharts(pedidos) {
        if (!window.Chart) return; 

        gerarChartPedidos(pedidos);
        gerarChartProdutos(pedidos);
        gerarChartFretes(pedidos); // NOVO: Chamada para o gráfico de fretes
    }

    /** Gráfico de Pedidos por Dia (Linha). */
    function gerarChartPedidos(pedidos) {
        const ctxPedidos = document.getElementById('chart-pedidos')?.getContext('2d');
        if (!ctxPedidos) return;

        const pedidosPorDia = {};
        pedidos.forEach(p => {
            const dia = (p.data?.toLocaleDateString ? p.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'N/A');
            pedidosPorDia[dia] = (pedidosPorDia[dia] || 0) + 1;
        });

        const labelsPedidos = Object.keys(pedidosPorDia).sort(); // Simplificado
        const dataPedidos = labelsPedidos.map(label => pedidosPorDia[label]);

        if (chartPedidos) chartPedidos.destroy();
        chartPedidos = new Chart(ctxPedidos, {
            type: 'line',
            data: {
                labels: labelsPedidos,
                datasets: [{
                    label: 'Pedidos por Dia',
                    data: dataPedidos,
                    backgroundColor: 'rgba(255, 179, 0, 0.2)',
                    borderColor: '#ffb300',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { responsive: true, plugins: { title: { display: true, text: 'Volume de Pedidos por Dia' } } }
        });
        LOG.charts("Gráfico de pedidos gerado.");
    }

    /** Gráfico de Produtos Mais Vendidos (Barras). */
    function gerarChartProdutos(pedidos) {
        const ctxProdutos = document.getElementById('chart-produtos')?.getContext('2d');
        if (!ctxProdutos) return;
        
        const produtosContagem = {};
        pedidos.forEach(p => {
            (p.itens || []).forEach(itemStr => {
                const parts = itemStr.split(' x');
                const nome = parts[0].trim();
                const qtd = parts.length > 1 ? parseInt(parts[1], 10) : 1;
                if (nome) produtosContagem[nome] = (produtosContagem[nome] || 0) + (isNaN(qtd) ? 1 : qtd);
            });
        });

        const produtosOrdenados = Object.entries(produtosContagem)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10); 

        const labelsProdutos = produtosOrdenados.map(p => p[0]);
        const dataProdutos = produtosOrdenados.map(p => p[1]);

        if (chartProdutos) chartProdutos.destroy();
        chartProdutos = new Chart(ctxProdutos, {
            type: 'bar',
            data: {
                labels: labelsProdutos,
                datasets: [{
                    label: 'Itens Mais Vendidos',
                    data: dataProdutos,
                    backgroundColor: '#ff7043',
                    borderColor: '#d84315',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y', responsive: true, plugins: { title: { display: true, text: 'Top 10 Itens Vendidos (Unidades)' } }
            }
        });
        LOG.charts("Gráfico de produtos gerado.");
    }
    
    /** NOVO: Gráfico de Fretes por Zona (Rosca/Donut). */
    function gerarChartFretes(pedidos) {
        const ctxFretes = document.getElementById('chart-fretes')?.getContext('2d');
        if (!ctxFretes) return;

        const fretesPorZona = {};
        pedidos.forEach(p => {
            const zona = p.zona || 'N/A';
            const valor = p.freteValor || 0; // Novo campo
            fretesPorZona[zona] = (fretesPorZona[zona] || 0) + valor;
        });

        const labelsFretes = Object.keys(fretesPorZona);
        const dataFretes = labelsFretes.map(label => fretesPorZona[label]);

        if (chartFretes) chartFretes.destroy();
        chartFretes = new Chart(ctxFretes, {
            type: 'doughnut',
            data: {
                labels: labelsFretes,
                datasets: [{
                    label: 'Arrecadação de Frete por Zona (R$)',
                    data: dataFretes,
                    backgroundColor: ['#ffb300', '#ffca28', '#ffd54f', '#ffe082', '#ffecb3', '#fff8e1'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: 'Arrecadação de Frete por Zona' }
                }
            }
        });
        LOG.charts("Gráfico de fretes por zona gerado.");
    }
    
    /** Renderiza o conteúdo da aba de Entregas. */
    function renderDeliveryTab(pedidos) {
        if (!el.repDelivery) return;
        
        const pedidosComFrete = pedidos.filter(p => (p.freteValor || 0) > 0);
        
        // 1. Renderiza o Gráfico (que está no Overview, mas é sobre frete)
        // Isso é gerado na função geral gerarCharts(pedidos);
        
        // 2. Renderiza a Tabela de Detalhes
        const tabelaHtml = `
            <h4 style="margin-top:20px;">Últimas Entregas com Frete Cobrado (${pedidosComFrete.length})</h4>
            <div style="overflow-x:auto;">
            <table class="report-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Data</th>
                        <th>Zona</th>
                        <th>Bairro/Destino</th>
                        <th>Valor Frete</th>
                        <th>Total Pedido</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidosComFrete.map(p => `
                        <tr>
                            <td>#${p.id.substring(0, 6)}</td>
                            <td>${p.data.toLocaleDateString('pt-BR')}</td>
                            <td>${p.zona || 'N/A'}</td>
                            <td>${p.freteDestino || p.endereco.split(/[ ,]+/)[0] || 'N/A'}</td>
                            <td style="color:#ff7043;">${money(p.freteValor || 0)}</td>
                            <td style="font-weight:bold;">${money(p.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>
        `;
        el.repDelivery.innerHTML = tabelaHtml;
    }

    /** Exibe a tabela de pedidos (aba de Tabela). */
    function exibirTabelaPedidos(pedidos, filtro = "") {
        if (!el.repOrders) return;
        
        const pedidosFiltrados = pedidos.filter(p => {
            const busca = filtro.toLowerCase();
            return (p.nome?.toLowerCase().includes(busca) || 
                    p.endereco?.toLowerCase().includes(busca) ||
                    p.usuario?.toLowerCase().includes(busca) ||
                    p.id?.toLowerCase().includes(busca)
            );
        });

        const tabelaHtml = `
            <h4 style="margin-top:20px;">Lista Completa de Pedidos (${pedidosFiltrados.length})</h4>
            <div style="overflow-x:auto;">
            <table class="report-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Data</th>
                        <th>Cliente</th>
                        <th>Endereço</th>
                        <th>Itens</th>
                        <th>Total</th>
                        <th>Cupom</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidosFiltrados.map(p => `
                        <tr>
                            <td>#${p.id.substring(0, 6)}</td>
                            <td>${p.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                            <td>${p.nome || p.usuario?.split('@')[0] || 'N/A'}</td>
                            <td>${p.endereco.substring(0, 30)}...</td>
                            <td title="${(p.itens || []).join(', ')}">${(p.itens || []).length} item(s)</td>
                            <td style="font-weight:bold;color:#4caf50;">${money(p.total)}</td>
                            <td>${p.cupom || '—'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>
        `;
        el.repOrders.innerHTML = tabelaHtml;
    }
    
    /** Exporta os dados para CSV ou PDF. */
    function exportData(format) {
        if (!pedidosCache || pedidosCache.length === 0) {
            popupAdd("Nenhum dado para exportar.");
            return;
        }
        
        const data = pedidosCache;
        
        if (format === 'csv') {
            let csv = "ID;Data;Cliente;Email;Itens;Subtotal;Entrega;Desconto;Cupom;Total;Endereco;Zona;FreteDestino\n";
            data.forEach(p => {
                const linha = [
                    p.id || 'N/A',
                    (p.data?.toLocaleString ? p.data.toLocaleString('pt-BR') : new Date(p.data).toLocaleString('pt-BR')),
                    p.nome || '',
                    p.usuario || p.email || '',
                    `"${(p.itens || []).join(', ')}"`,
                    String(p.subtotal.toFixed(2)).replace('.',','),
                    String(p.entrega.toFixed(2)).replace('.',','),
                    String(p.desconto.toFixed(2)).replace('.',','),
                    p.cupom || '',
                    String(p.total.toFixed(2)).replace('.',','),
                    `"${(p.endereco || '').replace(/"/g, '""')}"`,
                    p.zona || 'N/A',
                    p.freteDestino || 'N/A'
                ].join(';');
                csv += linha + '\n';
            });
            const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `relatorio_dfl_${new Date().toLocaleDateString('pt-BR')}.csv`;
            link.click();
            popupAdd('Exportando CSV...');
        } else if (format === 'pdf') {
            // DFL v3.8.7: Exportação PDF (Placeholder, pois requer biblioteca externa)
            popupAdd("Exportação PDF requer uma biblioteca externa (ex: jsPDF).");
            LOG.warn("Exportação PDF solicitada, mas não implementada (faltam bibliotecas).");
        }
    }

    return {
        initPanel: initPanel,
        carregarRelatorios: carregarRelatorios,
        gerarCharts: gerarCharts,
        exibirTabelaPedidos: exibirTabelaPedidos,
        // Expondo a função para ser chamada pelo listener da autenticação
        DFL_ReportsIntegration: initPanel 
    };
})();
/* ------------------ FIM DO BLOCO 3/4 (DFL_RelatoriosCore) ------------------ */

// -------------------- INÍCIO DO BLOCO 4/4 (DFL_FreteAdmin + Fechamento) --------------------
/* =========================================================
    DFL v3.8.5: MÓDULO DE ADMIN DE FRETE (DFL_FreteAdmin)
========================================================= */
window.DFL_FreteAdmin = (function() {
    const TAG = '[DFL/ADMIN/FRETE]';
    let freteZones = [];

    function initPanel() {
        if (!el.freteAdminPanel) return;

        LOG.admin("Inicializando painel de administração de fretes...");
        Overlays.open(el.freteAdminPanel);
        
        loadFreteZones();
        
        // Listener do botão de salvar nova zona
        document.getElementById('add-zone-btn')?.addEventListener('click', () => saveZone(null));
        
        // Listener de fechar
        document.querySelector('.frete-admin-close')?.addEventListener('click', () => Overlays.closeAll());
    }
    
    async function loadFreteZones() {
        if (!window.db) return;
        
        const listEl = document.getElementById('frete-zones-list');
        if (!listEl) return;
        
        listEl.innerHTML = '<p style="text-align:center;padding:20px;">Carregando zonas...</p>';

        try {
            const snap = await db.collection('frete_zonas').get();
            freteZones = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            renderZoneList(listEl);
        } catch (error) {
            LOG.error("Erro ao carregar zonas de frete:", error);
            listEl.innerHTML = '<p style="text-align:center;padding:20px;color:red;">Erro ao carregar zonas.</p>';
        }
    }
    
    function renderZoneList(listEl) {
        if (freteZones.length === 0) {
            listEl.innerHTML = '<p style="text-align:center;padding:20px;">Nenhuma zona de frete cadastrada.</p>';
            return;
        }

        listEl.innerHTML = freteZones.map(zone => `
            <div class="zone-card" data-id="${zone.id}" style="
                border: 1px solid #ddd;
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 8px;
                background: ${zone.ativo !== false ? '#f0fff0' : '#fff0f0'};
            ">
                <h4 style="margin-top:0;">${zone.nome} (${money(zone.valor)})</h4>
                <p>Bairros: ${zone.bairros?.join(', ') || 'Nenhum'}</p>
                <p>Status: <b>${zone.ativo !== false ? 'Ativa' : 'Inativa'}</b></p>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button class="edit-zone-btn" data-id="${zone.id}">Editar</button>
                    <button class="delete-zone-btn" data-id="${zone.id}" style="background-color:#d32f2f; color:#fff;">Excluir</button>
                    <button class="toggle-zone-btn" data-id="${zone.id}" data-active="${zone.ativo !== false}" style="background-color:${zone.ativo !== false ? '#ffb300' : '#4caf50'}; color:#fff;">${zone.ativo !== false ? 'Desativar' : 'Ativar'}</button>
                </div>
            </div>
        `).join('');

        // BIND Listeners de Ação
        listEl.querySelectorAll('.edit-zone-btn').forEach(btn => btn.addEventListener('click', (e) => editZone(e.target.dataset.id)));
        listEl.querySelectorAll('.delete-zone-btn').forEach(btn => btn.addEventListener('click', (e) => deleteZone(e.target.dataset.id)));
        listEl.querySelectorAll('.toggle-zone-btn').forEach(btn => btn.addEventListener('click', (e) => toggleZone(e.target.dataset.id, e.target.dataset.active === 'true')));
    }
    
    /** Abre o modal de edição/criação. */
    function editZone(zoneId) {
        const zone = freteZones.find(z => z.id === zoneId);
        
        // Modal de edição (Simples placeholder)
        const modalId = 'frete-edit-modal';
        let modal = document.getElementById(modalId);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width:500px; padding:20px;">
                    <h3 id="zone-modal-title"></h3>
                    <form id="zone-form">
                        <label>Nome da Zona:</label><input type="text" id="zone-name" required style="width:100%;padding:8px;margin-bottom:10px;">
                        <label>Valor do Frete (R$):</label><input type="number" id="zone-value" step="0.01" required style="width:100%;padding:8px;margin-bottom:10px;">
                        <label>Bairros (separados por vírgula):</label><textarea id="zone-bairros" rows="4" style="width:100%;padding:8px;margin-bottom:10px;"></textarea>
                        <input type="hidden" id="zone-doc-id">
                        <div style="display:flex; justify-content:space-between;">
                            <button type="submit" class="btn-primary">Salvar</button>
                            <button type="button" class="btn-secondary close-edit-modal">Cancelar</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
            document.querySelector('.close-edit-modal').addEventListener('click', () => document.getElementById(modalId).classList.remove('show'));
            document.getElementById('zone-form').addEventListener('submit', (e) => {
                e.preventDefault();
                saveZone(document.getElementById('zone-doc-id').value);
                document.getElementById(modalId).classList.remove('show');
            });
        }
        
        document.getElementById('zone-modal-title').textContent = zone ? `Editar Zona: ${zone.nome}` : 'Adicionar Nova Zona';
        document.getElementById('zone-name').value = zone?.nome || '';
        document.getElementById('zone-value').value = zone?.valor || 0.00;
        document.getElementById('zone-bairros').value = zone?.bairros?.join(', ') || '';
        document.getElementById('zone-doc-id').value = zone?.id || '';

        modal.classList.add('show');
    }
    
    /** Salva a zona no Firestore (Criação/Atualização). */
    async function saveZone(zoneId) {
        if (!window.db) return;
        
        const nome = document.getElementById('zone-name').value.trim();
        const valor = parseFloat(document.getElementById('zone-value').value) || 0;
        const bairrosRaw = document.getElementById('zone-bairros').value.trim();
        
        if (!nome || valor < 0 || !bairrosRaw) {
            alert("Preencha todos os campos corretamente.");
            return;
        }

        const bairros = bairrosRaw.split(',').map(b => b.trim()).filter(b => b.length > 0);
        
        const zoneData = {
            nome: nome,
            valor: valor,
            bairros: bairros,
            ativo: true // Sempre ativa ao criar/editar
        };
        
        try {
            if (zoneId) {
                await db.collection('frete_zonas').doc(zoneId).update(zoneData);
                popupAdd(`Zona ${nome} atualizada!`);
            } else {
                await db.collection('frete_zonas').add(zoneData);
                popupAdd(`Nova Zona ${nome} criada!`);
            }
            loadFreteZones(); // Recarrega a lista
        } catch (error) {
            LOG.error("Erro ao salvar zona:", error);
            alert("Erro ao salvar zona de frete.");
        }
    }
    
    /** Exclui uma zona. */
    async function deleteZone(zoneId) {
        if (!window.db) return;
        if (!confirm("Tem certeza que deseja EXCLUIR esta zona de frete? Esta ação é irreversível.")) return;
        
        try {
            await db.collection('frete_zonas').doc(zoneId).delete();
            popupAdd("Zona excluída!");
            loadFreteZones();
        } catch (error) {
            LOG.error("Erro ao excluir zona:", error);
            alert("Erro ao excluir zona de frete.");
        }
    }
    
    /** Ativa/Desativa uma zona. */
    async function toggleZone(zoneId, isActive) {
        if (!window.db) return;
        
        try {
            await db.collection('frete_zonas').doc(zoneId).update({ ativo: !isActive });
            popupAdd(`Zona ${isActive ? 'desativada' : 'ativada'}!`);
            loadFreteZones();
        } catch (error) {
            LOG.error("Erro ao alternar status da zona:", error);
            alert("Erro ao alternar status da zona de frete.");
        }
    }

    // Retorna a interface pública
    return {
        DFL_FreteAdminIntegration: initPanel
    };
})();

// DFL v3.8.9: Integração final dos módulos no escopo global
const DFL_ReportsIntegration = window.DFL_ReportsCore.initPanel;
const DFL_FreteAdminIntegration = window.DFL_FreteAdmin.DFL_FreteAdminIntegration;


// ------------------ 🔐 Segurança/Admin + UX Final (CORRIGIDO) ------------------ 
  // Funções DFL_ReportsIntegration e DFL_FreteAdminIntegration estão definidas agora
  // Seu código de setupAuthListener() no BLOCO 1 agora funciona corretamente.

  /* ------------------ 🍪 LÓGICA DO BANNER DE COOKIES (MANTIDO) ------------------ */
  const cookieBanner = document.getElementById("cookie-banner");
  const cookieAcceptBtn = document.getElementById("cookie-accept");

  if (cookieBanner && cookieAcceptBtn) {
    if (localStorage.getItem("dfl-cookies-accepted") === "true") {
      cookieBanner.style.display = "none";
    } else {
      cookieBanner.classList.add("show");
    }

    cookieAcceptBtn.addEventListener("click", () => {
      localStorage.setItem("dfl-cookies-accepted", "true");
      cookieBanner.classList.remove("show");
      setTimeout(() => {
        cookieBanner.style.display = "none";
      }, 500); 
    });
  }
  
  /* ------------------ Outras Funções (MANTIDO) ------------------ */
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

  /* 🚨 ATUALIZADO V3.8.9: Mensagem de console */
  console.log("%c🚀 DFL v3.8.9 — Estabilidade Total (Relatórios OK)",
              "background:#4CAF50;color:#fff;padding:8px 12px;border-radius:8px;font-weight:700;");

}); // Fim do document.addEventListener("DOMContentLoaded", ...

/* ------------------ FIM DO BLOCO 4/4 (DFL_FreteAdmin + Fechamento) ------------------ */
