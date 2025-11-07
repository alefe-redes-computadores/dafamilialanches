/* =========================================================
   🚀 DFL v3.8.5 — PAINEL ADMIN DE ZONAS DE FRETE (CRUD Firestore)
   - Objetivo: Implementar CRUD para a coleção frete_zonas no Firestore.
   - Contém: Módulo DFL_AdminFrete e migração do DFL_Frete para consulta real.
   - Segurança: Acesso restrito ao painel e escrita no Firestore (admin@dafamilialanches.com).
========================================================= */

// 🔧 Feature Flags (habilitar quando pronto)
window.DFL_FLAGS = Object.assign({},
  window.DFL_FLAGS || {},
  {
    freightEnabled: true,     // ATIVADO: Módulo de frete ativo (consulta REAL)
    freightDebug:   true,      // logs detalhados no console
  }
);

// 📝 Namespace de Logs (DFL v3.8.5: Novo TAG /ADMIN)
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

  /* ------------------ 🎯 ELEMENTOS (DFL v3.7.4: Adição de Filtros) ------------------ */
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
      document
        .querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, .reports-panel.active, .frete-admin-panel.active") 
        .forEach((e) => e.classList.remove("show", "active"));
      Backdrop.hide();
    },
    open(modalLike) {
      Overlays.closeAll();
      if (!modalLike) return;
      // DFL v3.8.5: Adicionado .frete-admin-panel.active
      modalLike.classList.add(
        (modalLike.id === "mini-cart" || modalLike.id === "painelPedidos" || modalLike.id === "recompensas-panel" || modalLike.id === "reports-panel" || modalLike.id === "frete-admin-panel") ? "active" : "show"
      );
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
      couponApplied = "";
      localStorage.removeItem("dflCoupon");
      popupAdd("Cupom removido.");
      renderMiniCart(); // Recalcula os totais
      return;
    }
    
    // Salva a *tentativa* de cupom.
    couponApplied = val;
    localStorage.setItem("dflCoupon", couponApplied);
    
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
      window.DFL_Frete.resetFrete();
      
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
      
      // DFL v3.8.5: Habilitar botões de Admin
      if (user && isAdmin(user)) {
        if (el.reportsBtn) {
            el.reportsBtn.style.display = 'inline-block';
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

  el.comboConfirm?.addEventListener("click", () => {
    if (!_comboCtx) return Overlays.closeAll();
    const sel = el.comboBody?.querySelector('input[name="combo-drink"]:checked');
    if (!sel) return;
    const opt = comboDrinkOptions[_comboCtx.grupo][+sel.value];
    const finalName = `${_comboCtx.nomeCombo} + ${opt.rotulo}`;
    const finalPrice = Number(_comboCtx.precoBase) + (opt.delta || 0);

    const existente = cart.find(i => i.nome === finalName);
    if (existente) existente.qtd++;
    else cart.push({ nome: finalName, preco: finalPrice, qtd: 1 });

    popupAdd("Combo adicionado!");
    renderMiniCart();
    Overlays.closeAll();
  });

  document.querySelectorAll("#combo-modal .combo-close").forEach((b) =>
    b.addEventListener("click", () => Overlays.closeAll())
  );

  /* ------------------ 🧺 Adicionar item comum (MANTIDO) ------------------ */
  function addCommonItem(nome, preco) {
    // Se for um combo do *cardápio principal* (mas não uma "Promo"), abre o modal de combos
    if (/^combo/i.test(nome) && !/^\s*Combo [0-9]/.test(nome)) {
      openComboModal(nome, preco);
      return;
    }
    // Se for uma *promoção* (ex: "Combo 2 Purizin...") ou item normal, adiciona direto
    const found = cart.find((i) => i.nome === nome && i.preco === preco);
    if (found) found.qtd++;
    else cart.push({ nome, preco, qtd: 1 });
    renderMiniCart();
    popupAdd(`${nome} adicionado!`);
  }

  document.querySelectorAll(".add-cart").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const card = e.currentTarget.closest(".card");
      if (!card) return;
      const nome = card.dataset.name;
      const preco = parseFloat(card.dataset.price);
      addCommonItem(nome, preco);
    })
  );

  /* ------------------ 🛒 ABRIR CARRINHO (MANTIDO) ------------------ */
  // Já está acima, unificado com a inicialização do Firebase


/* ------------------ ⚙️ CONFIGURAÇÕES V3.0 (MANTIDO) ------------------ */
  const DELIVERY_FEE = 6.00; // Será substituído pelo valor do DFL_Frete

  let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();
  let addressValue  = (localStorage.getItem("dflAddress") || "").trim();

  const getCartSubtotal = () =>
    cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);

  /* =========================================================
    ✨ v3.5.1: FUNÇÃO PARA CARREGAR METAS (CACHÊ REVISADO)
    =========================================================
  */
  let configuracoesRecompensa = null; // Cache global
  
  async function carregarConfiguracoesDeRecompensas() {
      if (!isFirebaseInitialized) return []; // Aborta se Firebase não estiver pronto
      if (configuracoesRecompensa) return configuracoesRecompensa; // Usa o cache
      
      try {
          const snapshot = await db.collection("RecompensasConfig").get();
          const configs = [];
          snapshot.forEach(doc => {
              // 🚨 CORREÇÃO DE ESTRUTURA: Adicionamos mapeamento de campos
              // O código espera: id, limite, tipo, valor, titulo
              const data = doc.data();
              configs.push({ 
                  id: doc.id,
                  limite: data.meta || data.limite, // Usa 'meta' ou 'limite'
                  tipo: data.tipo,
                  valor: data.valor || data.titulo, // Usa 'valor' ou 'titulo'
                  titulo: data.titulo || data.valor,
                  ...data // Mantém todos os outros campos (percent, ativo, etc.)
              });
          });
          // Ordena pelo campo 'limite' (pedidos) e salva no cache
          configuracoesRecompensa = configs.sort((a, b) => (a.limite || 0) - (b.limite || 0));
          
          if(configuracoesRecompensa.length === 0) {
              console.warn("Firestore: Coleção RecompensasConfig vazia. Recompensas desativadas.");
          }
          
          return configuracoesRecompensa;
          
      } catch (e) {
          console.error("Erro ao carregar configurações de recompensas do Firestore:", e);
          return [];
      }
  }


  /* =========================================================
    ✨ v3.5.0: Validação de cupons (Lê o cupom personalizado do Firestore)
    =========================================================
  */
  const _cupomCache = { /* key -> { ate: ms, res: {...} } */ };
  function _cacheKey(codigo, subtotal){
    const faixa = Math.floor((subtotal || 0) / 5);
    return `${(codigo||"").toUpperCase()}::${faixa}`;
  }

  async function validarCupomFirestore(codigo, subtotal) {
    if (!isFirebaseInitialized) return { valido:false, discount:0, freeShipping:false, label:"", mensagem:"Erro de conexão. Tente recarregar." };
    
    const code = (codigo || "").toUpperCase();
    const invalido = { valido:false, discount:0, freeShipping:false, label:"", mensagem:"" };
    if (!code) return invalido;
    const userId = currentUser?.uid;
    
    // Carrega as configurações (garante que temos as metas para checar o cupom)
    const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();

    const key = _cacheKey(code, subtotal);
    const now = Date.now();
    const hit = _cupomCache[key];
    if (hit && hit.ate > now) return hit.res;
    
    // Tenta primeiro em 'Cupons' (gerais)
    let data = null;
    let isPersonalizado = false;

    try {
      const snapGeral = await db.collection("Cupons").doc(code).get();
      if (snapGeral.exists) {
        data = snapGeral.data();
      } else {
          // Checa se o cupom é um dos códigos de recompensa configurados
          const recompensaEncontrada = RECOMPENSAS_DATA.find(r => r.valor === code && r.tipo === 'cupom');
          
          if (userId && recompensaEncontrada) {
              // Tenta em 'CuponsUsuarios' (personalizados)
              const snapPessoal = await db.collection("CuponsUsuarios").doc(userId).get();
              const pessoalData = snapPessoal.data();
              
              if (snapPessoal.exists && pessoalData?.cupom === code && !pessoalData?.usado) {
                  data = {
                    tipo: pessoalData.tipo, 
                    valor: pessoalData.valor, // O valor é o R$ 10 OFF (ou 15, etc.)
                    ativo: true, 
                    expiraEm: pessoalData.expiraEm 
                  };
                  isPersonalizado = true;
              } else if (snapPessoal.exists && pessoalData?.usado) {
                  return { ...invalido, mensagem: "Este cupom já foi utilizado." };
              } else {
                  // Cupom pessoal não encontrado/liberado
                  return { ...invalido, mensagem: "Cupom inválido ou não liberado." };
              }
          } else {
              // Não achou em Cupons nem é um cupom personalizado configurado
              const res = { ...invalido, mensagem: "Cupom inválido." };
              _cupomCache[key] = { ate: now + 30000, res }; // 30s de cache
              return res;
          }
      }
      
      // Validação do Cupom (Geral ou Pessoal)
      if (!data.ativo) {
        const res = { ...invalido, mensagem: "Este cupom não está mais ativo." };
        _cupomCache[key] = { ate: now + 30000, res };
        return res;
      }

      if (data.expiraEm) {
        let expiraDate = null;
        if (typeof data.expiraEm?.toDate === "function") expiraDate = data.expiraEm.toDate();
        else if (typeof data.expiraEm === "string") expiraDate = new Date(data.expiraEm);
        if (expiraDate && expiraDate < new Date()) {
          const res = { ...invalido, mensagem: "Este cupom expirou." };
          _cupomCache[key] = { ate: now + 30000, res };
          return res;
        }
      }

      // Cálculo
      let discount = 0;
      let freeShipping = false;
      let label = "";

      if (data.tipo === "percent") {
        discount = Math.max(0, subtotal * (Number(data.percent || data.valor) / 100)); // Usa 'percent' ou 'valor'
        label = `${Number(data.percent || data.valor)}% OFF`;
      } else if (data.tipo === "value") {
        const val = Math.max(0, Number(data.valor) || 0);
        discount = Math.min(subtotal, val);
        label = `R$ ${val.toFixed(2).replace(".", ",")} OFF`;
      } else if (data.tipo === "frete") {
        freeShipping = true;
        label = "Frete Grátis";
      } else {
        const res = { ...invalido, mensagem: "Tipo de cupom desconhecido." };
        _cupomCache[key] = { ate: now + 30000, res };
        return res;
      }

      const res = { 
          valido:true, 
          discount, 
          freeShipping, 
          label, 
          mensagem:"Cupom aplicado com sucesso!",
          isPersonalizado: isPersonalizado // Novo campo para rastreio
      };
      _cupomCache[key] = { ate: now + 30000, res };
      return res;

    } catch (err) {
      console.error("Erro ao validar cupom no Firestore:", err);
      return { ...invalido, mensagem: "Erro ao processar o cupom." };
    }
  }

  /* =========================================================
    ✨ v3.7.1: FUNÇÃO 'calcTotals' (USANDO DFL_Frete.getFrete())
    =========================================================
  */
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
      window.DFL_Frete.resetFrete();
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
        addressInput.value = addressValue;
        addressInput.addEventListener("input", (e) => {
          addressValue = (e.target.value || "").trim();
          localStorage.setItem("dflAddress", addressValue);
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
        fretesCollection: 'fretes_zonas' 
    };

    /** DFL v3.8.0: Consulta a API ViaCEP (Ação 2) - Retorna o nome do bairro. */
    async function fetchBairroFromCEP(cep) {
        const cepLimpo = cep.replace(/\D/g, '');
        if (cepLimpo.length !== 8) return null;
        
        try {
            LOG.info(`Consultando ViaCEP para CEP: ${cepLimpo}`);
            // Usamos a fetch API nativa.
            // NOTA: Para rodar em produção, o index.html deve ter connect-src atualizado no CSP!
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
                if (Array.isArray(data.bairros) && data.bairros.some(b => b.toLowerCase() === bairroParaBusca)) {
                    // DFL v3.8.5: Se o bairro for encontrado e a zona estiver ativa, usa.
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
        
        msgDisplay.style.display = 'none';
        
        if (!termoLimpo) {
            msgDisplay.textContent = "Digite o CEP ou Bairro para calcular.";
            msgDisplay.style.color = '#dc3545';
            msgDisplay.style.display = 'block';
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
            msgDisplay.textContent = 'Buscando bairro via CEP...';
            msgDisplay.style.color = '#ffb300';
            msgDisplay.style.display = 'block';

            const bairroViaCEP = await fetchBairroFromCEP(termoLimpo);
            
            if (bairroViaCEP) {
                bairroDeConsulta = bairroViaCEP;
            } else {
                msgDisplay.textContent = `CEP não encontrado ou inválido. Tente digitar o Bairro.`;
                msgDisplay.style.color = '#dc3545';
                msgDisplay.style.display = 'block';
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

            msgDisplay.textContent = `Frete para ${destinoDisplay}: ${money(freteValor)}.`;
            msgDisplay.style.color = '#28a745'; 
            msgDisplay.style.display = 'block';
            LOG.info(`Cálculo REAL SUCESSO: ${freteDestino} | Zona: ${freteZona} -> ${money(freteValor)}`); 

        } else {
            // Falha na consulta (Bairro não encontrado)
            freteValor = 0.00;
            freteDestino = termoLimpo;
            freteZona = null;
            window.updateCartTotals();
            
            msgDisplay.textContent = `Bairro não encontrado. Verifique o nome ou tente o CEP novamente.`;
            msgDisplay.style.color = '#dc3545';
            msgDisplay.style.display = 'block';
            LOG.warn(`Cálculo REAL FALHOU: ${termoLimpo}`);
        }
    }


    /** Inicializa o módulo, adicionando listeners. */
    function init() {
        LOG.info(`Módulo DFL v3.8.5 (REAL) inicializado. Status: ${config.freightEnabled ? 'Ativo' : 'Inócuo'}.`);

        if (!config.freightEnabled) {
            const container = document.getElementById('dfl-frete-input-container');
            if (container) container.style.display = 'none';
            return;
        }
        
        const btn = document.getElementById('calcular-frete-btn');
        const input = document.getElementById('frete-input');

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


  /* ------------------ 🖼️ CARROSSEL V2.7 (MANTIDO) ------------------ */
  let currentPromoId = 1;

  // Função central que abre e popula o modal
  function showPromoModal(promoId) {
    if (!el.promoModal || !PROMO_DATA[promoId]) return;
    
    currentPromoId = Number(promoId);
    const promo = PROMO_DATA[currentPromoId];

    if (el.promoImg) el.promoImg.src = promo.img;
    if (el.promoTitle) el.promoTitle.textContent = promo.nome;
    if (el.promoPrice) {
      el.promoPrice.innerHTML = 
        `<span class="old-price">De ${money(promo.precoAntigo)}</span> por <b>${money(promo.preco)}</b>`;
    }
    
    Overlays.open(el.promoModal);
  }

  // 1. Abrir o modal ao clicar em um slide
  document.querySelectorAll(".slide[data-promo-id]").forEach((img) => {
    img.addEventListener("click", () => {
      const id = parseInt(img.dataset.promoId, 10);
      if (id) {
        showPromoModal(id);
      }
    });
  });

  // 2. Adicionar ao carrinho (como item simples, conforme pedido)
  el.promoAddBtn?.addEventListener("click", () => {
    const promo = PROMO_DATA[currentPromoId];
    if (!promo) return;
    
    // Chama a função-base de adicionar, que não abre o modal de combos
    addCommonItem(promo.nome, promo.preco); 
    
    Overlays.closeAll(); // Fecha o modal após adicionar
  });

  // 3. Navegação (Próximo / Anterior)
  el.promoNavPrev?.addEventListener("click", () => {
    let newId = currentPromoId - 1;
    if (newId < 1) newId = 9; // Loop para o final
    showPromoModal(newId);
  });

  el.promoNavNext?.addEventListener("click", () => {
    let newId = currentPromoId + 1;
    if (newId > 9) newId = 1; // Loop para o início
    showPromoModal(newId);
  });
  
  // 4. Fechar o modal
  el.promoClose?.addEventListener("click", () => Overlays.closeAll());

  // 5. Navegação do carrossel principal (mantido)
  el.cPrev?.addEventListener("click", () => {
    if (!el.slides) return;
    el.slides.scrollLeft -= Math.min(el.slides.clientWidth * 0.9, 320);
  });
  el.cNext?.addEventListener("click", () => {
    if (!el.slides) return;
    el.slides.scrollLeft += Math.min(el.slides.clientWidth * 0.9, 320);
  });


  /* ------------------ ⏰ Status + Timer (MANTIDO) ------------------ */
  const atualizarStatus = safe(() => {
    const agora = new Date();
    const h = agora.getHours();
    const m = agora.getMinutes();
    const aberto = h >= 18 && h < 23; // Aberto das 18:00 até 22:59
    if (el.statusBanner) {
      el.statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!";
      el.statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`;
    }
    if (el.hoursBanner) {
      const elMsg = el.hoursBanner.querySelector("#hours-message");
      const elTimer = el.hoursBanner.querySelector("#timer");
      if (!elMsg || !elTimer) return;

      if (aberto) {
        const fim = new Date(agora);
        fim.setHours(23, 30, 0); // 23h30
        
        let diff = (fim - agora) / 1000;
        if (diff < 0) diff = 0;
        
        const restH = Math.floor(diff / 3600);
        const restM = Math.floor((diff % 3600) / 60);
        
        // 🚨 CORREÇÃO FINAL V3.6.10: Injeta o HTML na mensagem e o tempo no #timer
        elMsg.innerHTML = `⏰ Hoje atendemos até <b>23h30</b> — Faltam`;
        elTimer.textContent = `${restH}h ${restM}min`;

      } else {
        const inicio = new Date(agora);
        if (h >= 23 || (h === 23 && m >= 30)) { 
          inicio.setDate(inicio.getDate() + 1);
        }
        inicio.setHours(18, 0, 0); 

        let diff = (inicio - agora) / 1000;
        const faltamH = Math.floor(diff / 3600);
        const faltamM = Math.floor((diff % 3600) / 60);

        // 🚨 CORREÇÃO FINAL V3.6.10: Injeta o HTML na mensagem e o tempo no #timer
        elMsg.innerHTML = `🔒 Fechado — Abrimos em`;
        elTimer.textContent = `${faltamH}h ${faltamM}min`;
      }
    }
  });
  atualizarStatus();
  setInterval(atualizarStatus, 60000);

  // 🚨 CORREÇÃO 2: Reativação do Timer de Promoção
  const atualizarTimer = safe(() => {
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
  });
  atualizarTimer();
  setInterval(atualizarTimer, 1000);

  /* =========================================================
    ✨ v3.8.0: FUNÇÃO 'FECHAR PEDIDO' (Registro de Histórico)
    =========================================================
  */
  async function fecharPedido() {
    if (!cart.length) return alert("Carrinho vazio!");
    
    // DFL v3.8.0: Checagem se o Firestore está pronto para gravação
    if (!isFirebaseInitialized) {
        alert("Erro: O serviço de pedidos não está pronto. Recarregue a página.");
        return;
    }
    if (!currentUser) {
      alert("⚠️ Faça login para registrar o histórico de entregas."); // Ação 4
      Overlays.open(el.loginModal);
      return;
    }

    const addr = (document.getElementById("address-input")?.value || "").trim();
    if (!addr) {
      alert("Informe o endereço para entrega antes de finalizar.");
      document.getElementById("address-input")?.focus();
      return;
    }
    
    // 🚨 DFL v3.7.1: Checagem do Frete (Recomendação de UX)
    const freteValor = window.DFL_Frete?.getFreteValor() || 0.00;
    
    if (window.DFL_FLAGS.freightEnabled && freteValor === 0.00 && cart.length > 0) {
        alert("Calcule o frete para o seu bairro/CEP antes de finalizar o pedido.");
        document.getElementById("frete-input")?.focus();
        return;
    }


    // 1. CÁLCULO FINAL E INFORMAÇÕES DO CUPOM
    const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();
    
    // DFL v3.8.0: Captura os dados REAL de frete (Ação 3)
    const freteDestino = window.DFL_Frete?.getFreteDestino() || (addr.split(/[ ,]+/)[0] || null);
    const freteZona = window.DFL_Frete?.getFreteZona() || null;
    
    // Fallback: Se o Frete estiver 0, mas o endereço foi preenchido, salva o endereço como destino
    if (freteValor === 0 && freteDestino === "") {
        // Assume que a primeira palavra do endereço é o destino, se o frete não foi calculado
        freteDestino = addr.split(/[ ,]+/)[0] || addr; 
    }
    if (freteDestino === "") freteDestino = null;


    const pedido = {
      usuario: currentUser.email,
      userId: currentUser.uid,
      nome: currentUser.displayName || currentUser.email.split("@")[0],
      
      itens: cart.map((i) => `${i.nome} x${i.qtd}`),
      itensObj: cart.map(i => ({ nome: i.nome, preco: i.preco, qtd: i.qtd })),
      
      subtotal: Number(subtotal.toFixed(2)),
      entrega: Number(delivery.toFixed(2)),
      desconto: Number(discount.toFixed(2)),
      cupom: couponApplied || "",
      total: Number(total.toFixed(2)),
      endereco: addr,
      data: new Date().toISOString(),
      
      thumb: 'imagens/padrao.jpg',
      
      // DFL v3.8.0: PERSISTÊNCIA COMPLETA (Ação 3)
      freteDestino: freteDestino, 
      freteValor: Number(freteValor.toFixed(2)),
      zona: freteZona, // Novo campo
      dataEntrega: firebase.firestore.FieldValue.serverTimestamp(), // Novo campo
    };
    
    LOG.hist("Dados de frete para persistência:", { destino: pedido.freteDestino, valor: pedido.freteValor, zona: pedido.zona });


    try {
      // Cria a transação Batch
      // 🔒 Segurança: Se o Firebase falhar, a execução vai para o 'catch' (Fallback)
      const batch = db.batch();
      const userId = currentUser.uid;
      const usuarioRef = db.collection("Usuarios").doc(userId);
      
      // 2. Marca cupom personalizado como USADO, se houver
      if (cupomInfo.isPersonalizado && couponApplied) {
          const cupomUserRef = db.collection("CuponsUsuarios").doc(userId);
          batch.update(cupumUserRef, {
              usado: true,
              dataUso: firebase.firestore.FieldValue.serverTimestamp(),
              pedidoId: 'PENDENTE' 
          });
      }

      // 3. Cria o Pedido (na coleção Pedidos)
      const pedidoRef = db.collection("Pedidos").doc();
      batch.set(pedidoRef, pedido);
      
      // 4. ATUALIZA O CONTADOR DE PEDIDOS (na coleção Usuarios)
      batch.set(usuarioRef, {
          email: currentUser.email,
          pedidosFeitos: firebase.firestore.FieldValue.increment(1) 
      }, { merge: true }); 

      // DFL v3.8.0: Cria subcoleção Entregas dentro de Usuarios (Ação 3)
      const entregaHistoricoRef = db.collection("Usuarios").doc(userId)
          .collection("EntregasHistorico").doc(pedidoRef.id);
      
      batch.set(entregaHistoricoRef, {
          data: pedido.dataEntrega,
          freteDestino: pedido.freteDestino,
          freteValor: pedido.freteValor,
          zona: pedido.zona,
          pedidoId: pedidoRef.id
      });
      
      // 5. Commit da transação (cria o pedido e atualiza o contador/cupom)
      await batch.commit();
      
      LOG.hist("Pedido e Histórico de Entregas salvo com sucesso:", pedidoRef.id);


      // Atualiza o ID do pedido no CupomUsuarios (se usado)
      if (cupomInfo.isPersonalizado && couponApplied) {
          await db.collection("CuponsUsuarios").doc(userId).update({
              pedidoId: pedidoRef.id
          });
      }

      // 6. LÓGICA PÓS-PEDIDO (RECOMPENSAS DINÂMICAS - V3.5.0)
      const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();
      
      const doc = await usuarioRef.get();
      const data = doc.data() || { pedidosFeitos: 0, recompensaNivel: 0 };
      const feitos = data.pedidosFeitos;
      const nivelAtual = data.recompensaNivel;
      
      // Encontra a próxima recompensa com limite igual aos pedidos feitos
      const recompensaAtingida = RECOMPENSAS_DATA.find(r => 
          r.limite === feitos && (r.limite / (RECOMPENSAS_DATA[0]?.limite || 1)) > nivelAtual
      );
      
      
      if (recompensaAtingida) {
          const primeiroLimite = RECOMPENSAS_DATA[0]?.limite || 1;
          const novoNivel = recompensaAtingida.limite / primeiroLimite; 
          
          const itemLiberado = {
              cupom: recompensaAtingida.valor,
              tipo: recompensaAtingida.tipo,
              valor: recompensaAtingida.valor, 
              liberadoEm: firebase.firestore.FieldValue.serverTimestamp(),
              usado: false,
              pedidoLiberacao: pedidoRef.id,
              titulo: recompensaAtingida.titulo || `Recompensa Nível ${novoNivel}`
          };
          
          await usuarioRef.update({ recompensaNivel: novoNivel, ultimaRecompensa: recompensaAtingida.id });
          
          if (recompensaAtingida.tipo === 'cupom') {
               await db.collection("CuponsUsuarios").doc(userId).set(itemLiberado, { merge: true });
          }

          await db.collection("Usuarios").doc(userId)
                  .collection("RecompensasRecebidas").add(itemLiberado);

          const valorFormatado = (recompensaAtingida.tipo === 'cupom') ? `${recompensaAtingida.valor} OFF` : recompensaAtingida.valor;
          const msg = `🎉 Parabéns! Você completou ${feitos} pedidos e ganhou: ${valorFormatado}!`;
          mostrarPopupRecompensa(msg);
          
          configuracoesRecompensa = null; 
          _cupomCache = {}; 
      }
      
      // 7. Feedback e Limpeza
      popupAdd("Entrega registrada no seu histórico com sucesso!"); // Ação 5
      
      const linhas = [
        "🍔 *Pedido DFL*",
        cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"),
        "",
        `Subtotal: *${money(subtotal)}*`,
        `Entrega: *${money(delivery)}*${cupomInfo.freeShipping ? " _(Frete Grátis)_" : ""}`,
        `Desconto${couponApplied ? ` (${couponApplied})` : ""}: *-${money(discount)}*`,
        `*Total: ${money(total)}*`,
        "",
        `🏠 *Endereço:* ${addr}`
      ].join("\n");

      const texto = encodeURIComponent(linhas);
      window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");

      cart = [];
      couponApplied = ""; 
      localStorage.removeItem("dflCoupon");
      const couponInput = document.getElementById("coupon-input");
      if(couponInput) couponInput.value = "";
      
      // Limpa os dados do frete atual
      window.DFL_Frete.resetFrete();
      
      renderMiniCart();
      Overlays.closeAll();

    } catch (err) {
      console.error("Erro ao fechar pedido ou atualizar contador/recompensa:", err);
      // Fallback de Segurança
      alert(`Ocorreu um erro ao finalizar seu pedido. Por favor, tente novamente. Detalhe: ${err.message}`);
    }
  }

  // Chama o renderMiniCart uma vez no início para carregar o rodapé
  // caso haja itens no localStorage (MANTIDO)
  renderMiniCart();
  
/* ------------------ 📦 MEUS PEDIDOS PREMIUM (MANTIDO) ------------------ */

  // 1. Lógica de abrir/fechar o novo painel
  el.pedidosBtn?.addEventListener("click", () => {
    if (!currentUser) {
      alert("Faça login para ver seus pedidos.");
      Overlays.open(el.loginModal); 
      return;
    }
    inicializarFirebase(); // Garante o Firebase se for o primeiro acesso
    Overlays.open(el.pedidosPanel);
    carregarPedidos(currentUser.uid); 
    // DFL v3.8.0: Chama a função para carregar o histórico de entregas da SUBCOLEÇÃO (Ação 4)
    carregarHistoricoEntregas(currentUser.uid);
  });

  el.pedidosFecharBtn?.addEventListener("click", () => Overlays.closeAll());

  // 2. Lógica de carregar pedidos (MANTIDO)
  async function carregarPedidos(userId) {
    if (!el.pedidosLista) return;
    el.pedidosLista.innerHTML = `<p class="empty-orders">Carregando pedidos...</p>`;

    try {
      const q = db.collection("Pedidos").where("userId", "==", userId).orderBy("data", "desc").limit(10); // Limita para melhor performance
      const snapshot = await q.get();

      if (snapshot.empty) {
        el.pedidosLista.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado 😢</p>`;
        return;
      }

      const pedidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      exibirPedidos(pedidos);

    } catch (err) {
      console.error("Erro ao carregar pedidos: ", err);
      el.pedidosLista.innerHTML = `<p class="empty-orders" style="color:red;">Erro ao buscar seus pedidos.</p>`;
    }
  }

  // 3. Lógica de exibir os pedidos no painel (MANTIDO)
  function exibirPedidos(pedidos) {
    if (!el.pedidosLista) return;
    
    el.pedidosLista.innerHTML = pedidos.map(p => {
      const thumbUrl = p.thumb || 'imagens/padrao.jpg';
      const dataFormatada = p.data
          ? new Date(p.data?.seconds * 1000 || p.data).toLocaleString("pt-BR", {
              day: "2-digit", month: "2-digit", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })
          : "—";

      // Verifica se o pedido tem 'itensObj' para habilitar o botão
      const podeRepetir = Array.isArray(p.itensObj) && p.itensObj.length > 0;
      
      return `
        <div class="pedido-card">
          <div class="pedido-thumb" style="background-image:url('${thumbUrl}');"></div>
          <h4>📅 ${dataFormatada}</h4>
          <p class="pedido-info">Total: ${money(p.total)}</p>
          <div class="pedido-itens">
            ${(p.itens || []).map(i => `• ${i}`).join('<br>')}
          </div>
          <button 
            class="repetir-btn" 
            data-id="${p.id}" 
            ${podeRepetir ? '' : 'disabled style="background:grey;cursor:not-allowed;"'}
          >
            🔁 Repetir Pedido
          </button>
        </div>`;
    }).join('');
  }
  
  // 4. Lógica de "Repetir Pedido" (MANTIDO)
  el.pedidosLista?.addEventListener('click', async (e) => {
    if (e.target.classList.contains('repetir-btn') && !e.target.disabled) {
      const idPedido = e.target.dataset.id;
      
      // Desativa o botão para evitar clique duplo
      e.target.disabled = true;
      e.target.textContent = "Carregando...";
      
      await repetirPedido(idPedido);
      
      // O botão será reativado da próxima vez que o painel for aberto
      // (a menos que prefira reativá-lo manualmente aqui)
    }
  });

  async function repetirPedido(idPedido) {
    try {
      const docRef = db.collection("Pedidos").doc(idPedido);
      const doc = await docRef.get();

      if (!doc.exists) {
        return alert("Erro: Pedido antigo não encontrado.");
      }

      const pedido = doc.data();
      const itensParaRepetir = pedido.itensObj; // Lê o novo array de objetos

      if (!Array.isArray(itensParaRepetir) || itensParaRepetir.length === 0) {
        return alert("Não é possível repetir este pedido (formato antigo). Faça um novo pedido para poder repeti-lo no futuro.");
      }

      // Limpa o carrinho atual antes de adicionar os itens antigos
      cart = [];
      
      // Adiciona os itens ao carrinho
      itensParaRepetir.forEach(item => {
        // Validação simples (garante que temos o mínimo)
        if (item.nome && item.preco > 0 && item.qtd > 0) {
          cart.push({
            nome: item.nome,
            preco: item.preco,
            qtd: item.qtd
          });
        }
      });
      
      // v3.0: Limpa o cupom ao repetir um pedido
      couponApplied = "";
      localStorage.removeItem("dflCoupon");
      const couponInput = document.getElementById("coupon-input");
      if(couponInput) couponInput.value = "";

      // Feedback ao usuário
      popupAdd("Pedido anterior adicionado ao carrinho!");
      renderMiniCart(); // Atualiza o carrinho (backend)
      Overlays.closeAll(); // Fecha o painel de pedidos
      Overlays.open(el.miniCart); // Abre o mini-carrinho

    } catch (err) {
      console.error("Erro ao repetir pedido: ", err);
      alert("Erro ao processar seu pedido. Tente novamente.");
    }
  }

/* =========================================================
    DFL v3.8.0: FUNÇÃO DE CARREGAMENTO DO HISTÓRICO DE ENTREGAS (Ação 4)
========================================================= */
async function carregarHistoricoEntregas(userId) {
    if (!el.historicoEntregas) return;
    
    // Ação 5: Log
    LOG.hist("Carregando histórico de entregas da subcoleção...");

    el.historicoEntregas.innerHTML = `<p class="empty-history" style="text-align:center;color:#999;">Buscando entregas...</p>`;

    try {
        // DFL v3.8.0: Busca os dados da subcoleção EntregasHistorico (Ação 4)
        const q = db.collection("Usuarios").doc(userId)
            .collection("EntregasHistorico")
            .orderBy("data", "desc")
            .limit(10);
        
        const snapshot = await q.get();

        if (snapshot.empty) {
            el.historicoEntregas.innerHTML = `<p class="empty-history" style="text-align:center;color:#999;">Nenhuma entrega registrada ainda.</p>`;
            return;
        }

        const entregas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        exibirHistoricoEntregas(entregas);
        
        // Ação 5: Log
        LOG.hist(`Histórico de entregas carregado. Total de ${entregas.length} registros.`);

    } catch (err) {
        LOG.error("Erro ao carregar histórico de entregas:", err);
        el.historicoEntregas.innerHTML = `<p class="empty-history" style="text-align:center;color:red;">Erro ao buscar histórico de entregas.</p>`;
    }
}

/**
 * DFL v3.8.0: Desenha o histórico de entregas.
 */
function exibirHistoricoEntregas(entregas) {
    if (!el.historicoEntregas) return;
    
    const historicoHtml = entregas.map(e => {
        // DFL v3.8.0: Usa os campos da subcoleção
        const destino = e.freteDestino || 'N/A';
        const valorFrete = e.freteValor || 0.00;
        const pedidoId = e.pedidoId || e.id;
        
        const dataFormatada = e.data
            ? new Date(e.data?.seconds * 1000 || e.data).toLocaleString("pt-BR", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })
            : "—";
            
        // Exemplo de exibição (Ação 4)
        const zonaDisplay = e.zona ? ` (${e.zona.replace('Zona ', 'Z')})` : '';

        return `
            <div class="historico-frete-card">
                <h4>📦 Pedido #${pedidoId.substring(0, 8)}</h4>
                <p>🗓️ ${dataFormatada}</p>
                <p>
                    🚚 Entrega: <b>${destino}${zonaDisplay}</b> — ${money(valorFrete)}
                </p>
            </div>
        `;
    }).join('');
    
    el.historicoEntregas.innerHTML = historicoHtml;
}


/* ------------------ FIM DO BLOCO V2.10 ------------------ */


/* =========================================================
   🎁 V3.5.3: FUNÇÃO DE CARREGAMENTO DO PAINEL DE RECOMPENSAS (CORREÇÃO UI)
========================================================= */
async function carregarRecompensas(userId) {
    
    // 🚨 NOVO: Garante que o Firebase esteja inicializado antes de tudo
    inicializarFirebase();
    if (!isFirebaseInitialized) return;

    const contadorValor = document.getElementById('contador-valor');
    const progressoBar = document.getElementById('progresso-bar');
    const progressoMsg = document.getElementById('progresso-mensagem');
    
    if (!contadorValor || !progressoBar || !progressoMsg || !el.recompensasLista) return; 

    // 1. Inicializa a UI
    contadorValor.textContent = '...';
    progressoBar.style.width = '0%';
    progressoMsg.textContent = 'Carregando metas...';
    // 🚨 CORREÇÃO FINAL: Limpa a lista de recompensas (seções) aqui para remover "Aguardando o carregamento"
    el.recompensasLista.innerHTML = ''; 
    if(el.historicoLista) el.historicoLista.innerHTML = '';
    
    // 2. Carrega as metas primeiro.
    const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();

    if (RECOMPENSAS_DATA.length === 0) {
        progressoMsg.textContent = 'Erro ao carregar metas de recompensa. (Coleção Configuração vazia).';
        el.recompensasLista.innerHTML = '<p style="text-align:center;color:red;padding:20px;">O sistema de fidelidade está desativado no momento.</p>';
        return; 
    }
    
    const metaPrimeiroNivel = RECOMPENSAS_DATA[0]?.limite || 1; 

    // --- 3. Lógica de Progresso (onSnapshot para real-time) ---
    db.collection('Usuarios').doc(userId).onSnapshot(async doc => {
        
        // --- LIMPEZA DE UI ---
        el.recompensasLista.innerHTML = ''; 
        if(el.historicoLista) el.historicoLista.innerHTML = ''; 

        const data = doc.data() || { pedidosFeitos: 0, recompensaNivel: 0 };
        const feitos = data.pedidosFeitos;
        const nivelAtual = data.recompensaNivel;
        
        // Status do Cupom Personalizado
        let cupomStatus = null;
        const recompensaAtual = RECOMPENSAS_DATA.find(r => r.limite === nivelAtual * metaPrimeiroNivel);
        
        if (recompensaAtual && recompensaAtual.tipo === 'cupom') {
            const cupomSnap = await db.collection('CuponsUsuarios').doc(userId).get();
            // 🚨 CORREÇÃO CRÍTICA V3.6.2: Corrigindo o erro de digitação 'cupumSnap' para 'cupomSnap'
            cupomStatus = cupomSnap.exists ? cupumSnap.data() : null;
        }

        // Encontra a próxima meta que o cliente AINDA NÃO ATINGIU
        const proximaRecompensa = RECOMPENSAS_DATA.find(r => r.limite > feitos);
        
        // Define a meta base para exibição. 
        const metaParaExibir = proximaRecompensa ? proximaRecompensa.limite : feitos; 
        const metaBaseCalculo = proximaRecompensa ? proximaRecompensa.limite : metaPrimeiroNivel;

        // Se ele completou o último nível e não tem mais metas, a barra deve ser 100%
        const porcentagem = proximaRecompensa === undefined ? 100 : Math.min(100, (feitos / metaBaseCalculo) * 100);
            
        // Atualiza a barra
        contadorValor.textContent = feitos;
        
        // Ajusta a exibição da meta no HTML 
        const elMeta = document.querySelector('.progress-container span:last-child');
        if(elMeta) elMeta.textContent = metaParaExibir;

        progressoBar.style.width = `${porcentagem}%`;

        // Verifica o Status da Meta
        if (proximaRecompensa) {
            // A meta ainda não foi atingida
            const faltam = proximaRecompensa.limite - feitos;
            
            // 🚨 CORREÇÃO DE TEXTO: Usa o 'titulo' para exibir a recompensa na mensagem
            const tituloRecompensa = proximaRecompensa.titulo || proximaRecompensa.valor;
            progressoMsg.textContent = `Faltam apenas ${faltam} pedidos para você ganhar a recompensa "${tituloRecompensa}"!`;
            
            progressoBar.style.background = 'linear-gradient(90deg, #ffb300, #ff7043)'; 
            progressoBar.parentElement.parentElement.removeAttribute('data-status');
            
            // Exibe as recompensas já obtidas (as que têm limite <= pedidos feitos)
            const recompensasObtidas = RECOMPENSAS_DATA.filter(r => r.limite <= feitos);
            exibirRecompensas(feitos, recompensasObtidas, cupomStatus, RECOMPENSAS_DATA); // Passa RECOMPENSAS_DATA

            if (recompensasObtidas.length === 0) {
                 el.recompensasLista.innerHTML = `
                    <p style="text-align:center;color:#666;padding:20px;margin-top:20px;">
                        Faça ${faltam} pedidos para desbloquear a primeira recompensa.
                    </p>`;
            }


        } else {
             // Todas as metas foram atingidas
            progressoMsg.textContent = '🎉 Parabéns! Você completou todas as metas de fidelidade!';
            progressoBar.style.background = 'linear-gradient(90deg, #4caf50, #43a047)'; 
            progressoBar.parentElement.parentElement.setAttribute('data-status', 'complete');
            
            // Exibe todas as recompensas como obtidas
            exibirRecompensas(feitos, RECOMPENSAS_DATA, cupomStatus, RECOMPENSAS_DATA);
        }
        
        // --- 4. Lógica de Histórico (Chamada) ---
        await carregarHistoricoRecompensas(userId);
        
    }, error => {
        console.error("Erro ao ler contador de fidelidade:", error);
        progressoMsg.textContent = 'Erro ao ler seu progresso. Tente recarregar a página.';
    });
}

/**
 * Desenha as recompensas atuais disponíveis.
 */
function exibirRecompensas(pedidosFeitos, recompensasDisponiveis, cupomStatus, RECOMPENSAS_DATA) {
    if (!el.recompensasLista) return;
    
    // Filtra apenas as recompensas que o usuário atingiu (ou seja, todas as do array)
    const recompensasHtml = recompensasDisponiveis.map(r => {
        const liberada = pedidosFeitos >= r.limite;
        const cupomJaUsado = cupomStatus?.usado === true && cupomStatus?.cupom === r.valor;
        
        // Define o título de forma mais descritiva
        const titulo = r.titulo || `Recompensa: ${r.valor} (${r.limite} Pedidos)`;
        
        let acaoBtn = '';
        let statusTag = '';
        let cardStyle = '';
        let codigoCupom = r.tipo === 'cupom' ? r.valor : 'BRINDE';
        
        if (cupomJaUsado) {
             statusTag = '<span style="color:#d32f2f;font-weight:bold;">(JÁ UTILIZADO)</span>';
             acaoBtn = `<button disabled style="background:#ccc;color:#666;border:none;border-radius:6px;padding:8px 12px;cursor:not-allowed;margin-top:10px;">Cupom Usado</button>`;
             cardStyle = 'opacity: 0.7;';
        }
        else if (liberada && r.tipo === 'cupom') {
            statusTag = '<span style="color:#4caf50;font-weight:bold;">(DISPONÍVEL)</span>';
            acaoBtn = `
                <button 
                    class="recompensa-aplicar-btn" 
                    data-cupom="${codigoCupom}"
                    style="background:#4caf50;color:#fff;border:none;border-radius:6px;padding:8px 12px;cursor:pointer;font-weight:600;margin-top:10px;"
                >
                    Aplicar Cupom 🏷️
                </button>
            `;
        } else if (liberada && r.tipo === 'brinde') {
             statusTag = '<span style="color:#1976D2;font-weight:bold;">(LIBERADO)</span>';
             acaoBtn = `<button disabled style="background:#1976D2;color:#fff;border:none;border-radius:6px;padding:8px 12px;cursor:default;margin-top:10px;">Brinde na Próxima Compra</button>`;
        }
        
        // Se ainda não liberada, o filtro já removeu. Aqui só temos as liberadas.

        return `
            <div class="recompensa-card" style="display:flex;align-items:center;padding:15px;border-radius:10px;margin-bottom:15px;background:#f9f9f9;box-shadow:0 2px 5px rgba(0,0,0,0.1);${cardStyle}">
                <img src="imagens/recompensa-${r.tipo}.png" alt="Ícone de Recompensa" style="width:50px;height:50px;object-fit:cover;border-radius:50%;margin-right:15px;">
                <div style="flex:1;">
                    <h4 style="margin:0 0 5px 0;color:#333;">${titulo} ${statusTag}</h4>
                    <p style="margin:0;font-size:0.9rem;color:#666;">Ganho por ${r.limite} pedidos.</p>
                    ${r.tipo === 'cupom' ? `<p style="margin:5px 0 0 0;font-size:1.1rem;font-weight:bold;color:#ff7043;">CÓDIGO: ${codigoCupom}</p>` : ''}
                </div>
                <div>
                    ${acaoBtn}
                </div>
            </div>
        `;
    }).join('');
    
    el.recompensasLista.innerHTML = recompensasHtml;
    
    // BIND o evento de aplicar cupom (após o desenho)
    el.recompensasLista.querySelectorAll('.recompensa-aplicar-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const codigo = e.currentTarget.dataset.cupom;
            if (codigo) {
                // Aplica a lógica do cupom (similar ao formulário)
                couponApplied = codigo;
                localStorage.setItem("dflCoupon", couponApplied);
                
                // Atualiza o input de cupom (se estiver visível)
                const couponInput = document.getElementById("coupon-input");
                if(couponInput) couponInput.value = codigo;

                renderMiniCart(); // Recalcula e mostra a mensagem
                Overlays.closeAll();
                popupAdd(`Cupom ${codigo} aplicado! ✅`);
                Overlays.open(el.miniCart); // Abre o mini-carrinho para ver o desconto
            }
        });
    });
}


/**
 * NOVO na V3.4: Carrega e exibe o histórico de recompensas recebidas.
 */
async function carregarHistoricoRecompensas(userId) {
    if (!el.historicoLista) return;

    el.historicoLista.innerHTML = `<p style="text-align:center;color:#999;">Carregando histórico...</p>`;
    
    try {
        const q = db.collection("Usuarios").doc(userId)
                    .collection("RecompensasRecebidas")
                    .orderBy("liberadoEm", "desc"); // Corrigido para usar liberadoEm
        
        const snapshot = await q.get();

        if (snapshot.empty) {
            el.historicoLista.innerHTML = `<p class="empty-history" style="text-align:center;color:#999;">Você ainda não recebeu recompensas.</p>`;
            return;
        }

        const logs = snapshot.docs.map(doc => doc.data());
        
        const historicoHtml = logs.map(log => {
            const dataRecebimento = log.liberadoEm
                ? (log.liberadoEm.toDate().toLocaleDateString('pt-BR'))
                : "—";

            let valorStr = (log.tipo === 'cupom') ? log.valor : log.valor;
            if (log.tipo === 'value') valorStr = money(log.valor);

            
            return `
                <div class="historico-card" style="display:flex; padding: 10px 0; border-bottom: 1px dashed #eee; align-items: center; justify-content: space-between;">
                    <div style="flex:1;">
                        <p style="font-weight:600; margin:0; color:#333;">
                            🎁 ${log.titulo || log.valor}
                        </p>
                        <small style="color:#999;">Recebido em: ${dataRecebimento}</small>
                    </div>
                    <span style="font-weight:700; color:#4caf50;">
                        + ${valorStr}
                    </span>
                </div>
            `;
        }).join('');
        
        // Remove a borda do último item para melhor estética
        el.historicoLista.innerHTML = historicoHtml.replace(/border-bottom: 1px dashed #eee;<\/div>$/, 'border-bottom: none;</div>');


    } catch (err) {
        console.error("Erro ao carregar histórico de recompensas: ", err);
        el.historicoLista.innerHTML = `<p style="text-align:center;color:red;">Erro ao buscar histórico.</p>`;
    }
}


/* ------------------ 🎁 MINHAS RECOMPENSAS (V3.5.3) ------------------ */

  // 1. Lógica de abrir/fechar o novo painel
  el.recompensasBtn?.addEventListener("click", () => {
    // Requer login, assim como "Meus Pedidos"
    if (!currentUser) {
      alert("Faça login para ver suas recompensas.");
      Overlays.open(el.loginModal); 
      return;
    }
    // 🚨 OTIMIZAÇÃO: Garante o Firebase se for o primeiro acesso
    inicializarFirebase(); 
    Overlays.open(el.recompensasPanel);
    
    // 🚨 NOVO: Chama a função para carregar e monitorar o contador
    carregarRecompensas(currentUser.uid); 
  });

  // 2. Lógica de fechar o painel
  el.recompensasFecharBtn?.addEventListener("click", () => Overlays.closeAll());

/* ------------------ FIM DO BLOCO V3.5.3 ------------------ */


/* ------------------ 📦 MEUS PEDIDOS PREMIUM (MANTIDO) ------------------ */

  // 1. Lógica de abrir/fechar o novo painel
  el.pedidosBtn?.addEventListener("click", () => {
    if (!currentUser) {
      alert("Faça login para ver seus pedidos.");
      Overlays.open(el.loginModal); 
      return;
    }
    inicializarFirebase(); // Garante o Firebase se for o primeiro acesso
    Overlays.open(el.pedidosPanel);
    carregarPedidos(currentUser.uid); 
    // DFL v3.8.0: Chama a função para carregar o histórico de entregas da SUBCOLEÇÃO (Ação 4)
    carregarHistoricoEntregas(currentUser.uid);
  });

  el.pedidosFecharBtn?.addEventListener("click", () => Overlays.closeAll());

  // 2. Lógica de carregar pedidos (MANTIDO)
  async function carregarPedidos(userId) {
    if (!el.pedidosLista) return;
    el.pedidosLista.innerHTML = `<p class="empty-orders">Carregando pedidos...</p>`;

    try {
      const q = db.collection("Pedidos").where("userId", "==", userId).orderBy("data", "desc").limit(10); // Limita para melhor performance
      const snapshot = await q.get();

      if (snapshot.empty) {
        el.pedidosLista.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado 😢</p>`;
        return;
      }

      const pedidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      exibirPedidos(pedidos);

    } catch (err) {
      console.error("Erro ao carregar pedidos: ", err);
      el.pedidosLista.innerHTML = `<p class="empty-orders" style="color:red;">Erro ao buscar seus pedidos.</p>`;
    }
  }

  // 3. Lógica de exibir os pedidos no painel (MANTIDO)
  function exibirPedidos(pedidos) {
    if (!el.pedidosLista) return;
    
    el.pedidosLista.innerHTML = pedidos.map(p => {
      const thumbUrl = p.thumb || 'imagens/padrao.jpg';
      const dataFormatada = p.data
          ? new Date(p.data?.seconds * 1000 || p.data).toLocaleString("pt-BR", {
              day: "2-digit", month: "2-digit", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })
          : "—";

      // Verifica se o pedido tem 'itensObj' para habilitar o botão
      const podeRepetir = Array.isArray(p.itensObj) && p.itensObj.length > 0;
      
      return `
        <div class="pedido-card">
          <div class="pedido-thumb" style="background-image:url('${thumbUrl}');"></div>
          <h4>📅 ${dataFormatada}</h4>
          <p class="pedido-info">Total: ${money(p.total)}</p>
          <div class="pedido-itens">
            ${(p.itens || []).map(i => `• ${i}`).join('<br>')}
          </div>
          <button 
            class="repetir-btn" 
            data-id="${p.id}" 
            ${podeRepetir ? '' : 'disabled style="background:grey;cursor:not-allowed;"'}
          >
            🔁 Repetir Pedido
          </button>
        </div>`;
    }).join('');
  }
  
  // 4. Lógica de "Repetir Pedido" (MANTIDO)
  el.pedidosLista?.addEventListener('click', async (e) => {
    if (e.target.classList.contains('repetir-btn') && !e.target.disabled) {
      const idPedido = e.target.dataset.id;
      
      // Desativa o botão para evitar clique duplo
      e.target.disabled = true;
      e.target.textContent = "Carregando...";
      
      await repetirPedido(idPedido);
      
      // O botão será reativado da próxima vez que o painel for aberto
      // (a menos que prefira reativá-lo manualmente aqui)
    }
  });

  async function repetirPedido(idPedido) {
    try {
      const docRef = db.collection("Pedidos").doc(idPedido);
      const doc = await docRef.get();

      if (!doc.exists) {
        return alert("Erro: Pedido antigo não encontrado.");
      }

      const pedido = doc.data();
      const itensParaRepetir = pedido.itensObj; // Lê o novo array de objetos

      if (!Array.isArray(itensParaRepetir) || itensParaRepetir.length === 0) {
        return alert("Não é possível repetir este pedido (formato antigo). Faça um novo pedido para poder repeti-lo no futuro.");
      }

      // Limpa o carrinho atual antes de adicionar os itens antigos
      cart = [];
      
      // Adiciona os itens ao carrinho
      itensParaRepetir.forEach(item => {
        // Validação simples (garante que temos o mínimo)
        if (item.nome && item.preco > 0 && item.qtd > 0) {
          cart.push({
            nome: item.nome,
            preco: item.preco,
            qtd: item.qtd
          });
        }
      });
      
      // v3.0: Limpa o cupom ao repetir um pedido
      couponApplied = "";
      localStorage.removeItem("dflCoupon");
      const couponInput = document.getElementById("coupon-input");
      if(couponInput) couponInput.value = "";

      // Feedback ao usuário
      popupAdd("Pedido anterior adicionado ao carrinho!");
      renderMiniCart(); // Atualiza o carrinho (backend)
      Overlays.closeAll(); // Fecha o painel de pedidos
      Overlays.open(el.miniCart); // Abre o mini-carrinho

    } catch (err) {
      console.error("Erro ao repetir pedido: ", err);
      alert("Erro ao processar seu pedido. Tente novamente.");
    }
  }

/* =========================================================
    DFL v3.8.0: FUNÇÃO DE CARREGAMENTO DO HISTÓRICO DE ENTREGAS (Ação 4)
========================================================= */
async function carregarHistoricoEntregas(userId) {
    if (!el.historicoEntregas) return;
    
    // Ação 5: Log
    LOG.hist("Carregando histórico de entregas da subcoleção...");

    el.historicoEntregas.innerHTML = `<p class="empty-history" style="text-align:center;color:#999;">Buscando entregas...</p>`;

    try {
        // DFL v3.8.0: Busca os dados da subcoleção EntregasHistorico (Ação 4)
        const q = db.collection("Usuarios").doc(userId)
            .collection("EntregasHistorico")
            .orderBy("data", "desc")
            .limit(10);
        
        const snapshot = await q.get();

        if (snapshot.empty) {
            el.historicoEntregas.innerHTML = `<p class="empty-history" style="text-align:center;color:#999;">Nenhuma entrega registrada ainda.</p>`;
            return;
        }

        const entregas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        exibirHistoricoEntregas(entregas);
        
        // Ação 5: Log
        LOG.hist(`Histórico de entregas carregado. Total de ${entregas.length} registros.`);

    } catch (err) {
        LOG.error("Erro ao carregar histórico de entregas:", err);
        el.historicoEntregas.innerHTML = `<p class="empty-history" style="text-align:center;color:red;">Erro ao buscar histórico de entregas.</p>`;
    }
}

/**
 * DFL v3.8.0: Desenha o histórico de entregas.
 */
function exibirHistoricoEntregas(entregas) {
    if (!el.historicoEntregas) return;
    
    const historicoHtml = entregas.map(e => {
        // DFL v3.8.0: Usa os campos da subcoleção
        const destino = e.freteDestino || 'N/A';
        const valorFrete = e.freteValor || 0.00;
        const pedidoId = e.pedidoId || e.id;
        
        const dataFormatada = e.data
            ? new Date(e.data?.seconds * 1000 || e.data).toLocaleString("pt-BR", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })
            : "—";
            
        // Exemplo de exibição (Ação 4)
        const zonaDisplay = e.zona ? ` (${e.zona.replace('Zona ', 'Z')})` : '';

        return `
            <div class="historico-frete-card">
                <h4>📦 Pedido #${pedidoId.substring(0, 8)}</h4>
                <p>🗓️ ${dataFormatada}</p>
                <p>
                    🚚 Entrega: <b>${destino}${zonaDisplay}</b> — ${money(valorFrete)}
                </p>
            </div>
        `;
    }).join('');
    
    el.historicoEntregas.innerHTML = historicoHtml;
}


/* ------------------ FIM DO BLOCO V2.10 ------------------ */


/* =========================================================
   🎁 V3.5.3: FUNÇÃO DE CARREGAMENTO DO PAINEL DE RECOMPENSAS (CORREÇÃO UI)
========================================================= */
async function carregarRecompensas(userId) {
    
    // 🚨 NOVO: Garante que o Firebase esteja inicializado antes de tudo
    inicializarFirebase();
    if (!isFirebaseInitialized) return;

    const contadorValor = document.getElementById('contador-valor');
    const progressoBar = document.getElementById('progresso-bar');
    const progressoMsg = document.getElementById('progresso-mensagem');
    
    if (!contadorValor || !progressoBar || !progressoMsg || !el.recompensasLista) return; 

    // 1. Inicializa a UI
    contadorValor.textContent = '...';
    progressoBar.style.width = '0%';
    progressoMsg.textContent = 'Carregando metas...';
    // 🚨 CORREÇÃO FINAL: Limpa a lista de recompensas (seções) aqui para remover "Aguardando o carregamento"
    el.recompensasLista.innerHTML = ''; 
    if(el.historicoLista) el.historicoLista.innerHTML = '';
    
    // 2. Carrega as metas primeiro.
    const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();

    if (RECOMPENSAS_DATA.length === 0) {
        progressoMsg.textContent = 'Erro ao carregar metas de recompensa. (Coleção Configuração vazia).';
        el.recompensasLista.innerHTML = '<p style="text-align:center;color:red;padding:20px;">O sistema de fidelidade está desativado no momento.</p>';
        return; 
    }
    
    const metaPrimeiroNivel = RECOMPENSAS_DATA[0]?.limite || 1; 

    // --- 3. Lógica de Progresso (onSnapshot para real-time) ---
    db.collection('Usuarios').doc(userId).onSnapshot(async doc => {
        
        // --- LIMPEZA DE UI ---
        el.recompensasLista.innerHTML = ''; 
        if(el.historicoLista) el.historicoLista.innerHTML = ''; 

        const data = doc.data() || { pedidosFeitos: 0, recompensaNivel: 0 };
        const feitos = data.pedidosFeitos;
        const nivelAtual = data.recompensaNivel;
        
        // Status do Cupom Personalizado
        let cupomStatus = null;
        const recompensaAtual = RECOMPENSAS_DATA.find(r => r.limite === nivelAtual * metaPrimeiroNivel);
        
        if (recompensaAtual && recompensaAtual.tipo === 'cupom') {
            const cupomSnap = await db.collection('CuponsUsuarios').doc(userId).get();
            // 🚨 CORREÇÃO CRÍTICA V3.6.2: Corrigindo o erro de digitação 'cupumSnap' para 'cupomSnap'
            cupomStatus = cupumSnap.exists ? cupumSnap.data() : null;
        }

        // Encontra a próxima meta que o cliente AINDA NÃO ATINGIU
        const proximaRecompensa = RECOMPENSAS_DATA.find(r => r.limite > feitos);
        
        // Define a meta base para exibição. 
        const metaParaExibir = proximaRecompensa ? proximaRecompensa.limite : feitos; 
        const metaBaseCalculo = proximaRecompensa ? proximaRecompensa.limite : metaPrimeiroNivel;

        // Se ele completou o último nível e não tem mais metas, a barra deve ser 100%
        const porcentagem = proximaRecompensa === undefined ? 100 : Math.min(100, (feitos / metaBaseCalculo) * 100);
            
        // Atualiza a barra
        contadorValor.textContent = feitos;
        
        // Ajusta a exibição da meta no HTML 
        const elMeta = document.querySelector('.progress-container span:last-child');
        if(elMeta) elMeta.textContent = metaParaExibir;

        progressoBar.style.width = `${porcentagem}%`;

        // Verifica o Status da Meta
        if (proximaRecompensa) {
            // A meta ainda não foi atingida
            const faltam = proximaRecompensa.limite - feitos;
            
            // 🚨 CORREÇÃO DE TEXTO: Usa o 'titulo' para exibir a recompensa na mensagem
            const tituloRecompensa = proximaRecompensa.titulo || proximaRecompensa.valor;
            progressoMsg.textContent = `Faltam apenas ${faltam} pedidos para você ganhar a recompensa "${tituloRecompensa}"!`;
            
            progressoBar.style.background = 'linear-gradient(90deg, #ffb300, #ff7043)'; 
            progressoBar.parentElement.parentElement.removeAttribute('data-status');
            
            // Exibe as recompensas já obtidas (as que têm limite <= pedidos feitos)
            const recompensasObtidas = RECOMPENSAS_DATA.filter(r => r.limite <= feitos);
            exibirRecompensas(feitos, recompensasObtidas, cupomStatus, RECOMPENSAS_DATA); // Passa RECOMPENSAS_DATA

            if (recompensasObtidas.length === 0) {
                 el.recompensasLista.innerHTML = `
                    <p style="text-align:center;color:#666;padding:20px;margin-top:20px;">
                        Faça ${faltam} pedidos para desbloquear a primeira recompensa.
                    </p>`;
            }


        } else {
             // Todas as metas foram atingidas
            progressoMsg.textContent = '🎉 Parabéns! Você completou todas as metas de fidelidade!';
            progressoBar.style.background = 'linear-gradient(90deg, #4caf50, #43a047)'; 
            progressoBar.parentElement.parentElement.setAttribute('data-status', 'complete');
            
            // Exibe todas as recompensas como obtidas
            exibirRecompensas(feitos, RECOMPENSAS_DATA, cupomStatus, RECOMPENSAS_DATA);
        }
        
        // --- 4. Lógica de Histórico (Chamada) ---
        await carregarHistoricoRecompensas(userId);
        
    }, error => {
        console.error("Erro ao ler contador de fidelidade:", error);
        progressoMsg.textContent = 'Erro ao ler seu progresso. Tente recarregar a página.';
    });
}

/**
 * Desenha as recompensas atuais disponíveis.
 */
function exibirRecompensas(pedidosFeitos, recompensasDisponiveis, cupomStatus, RECOMPENSAS_DATA) {
    if (!el.recompensasLista) return;
    
    // Filtra apenas as recompensas que o usuário atingiu (ou seja, todas as do array)
    const recompensasHtml = recompensasDisponiveis.map(r => {
        const liberada = pedidosFeitos >= r.limite;
        const cupomJaUsado = cupomStatus?.usado === true && cupomStatus?.cupom === r.valor;
        
        // Define o título de forma mais descritiva
        const titulo = r.titulo || `Recompensa: ${r.valor} (${r.limite} Pedidos)`;
        
        let acaoBtn = '';
        let statusTag = '';
        let cardStyle = '';
        let codigoCupom = r.tipo === 'cupom' ? r.valor : 'BRINDE';
        
        if (cupomJaUsado) {
             statusTag = '<span style="color:#d32f2f;font-weight:bold;">(JÁ UTILIZADO)</span>';
             acaoBtn = `<button disabled style="background:#ccc;color:#666;border:none;border-radius:6px;padding:8px 12px;cursor:not-allowed;margin-top:10px;">Cupom Usado</button>`;
             cardStyle = 'opacity: 0.7;';
        }
        else if (liberada && r.tipo === 'cupom') {
            statusTag = '<span style="color:#4caf50;font-weight:bold;">(DISPONÍVEL)</span>';
            acaoBtn = `
                <button 
                    class="recompensa-aplicar-btn" 
                    data-cupom="${codigoCupom}"
                    style="background:#4caf50;color:#fff;border:none;border-radius:6px;padding:8px 12px;cursor:pointer;font-weight:600;margin-top:10px;"
                >
                    Aplicar Cupom 🏷️
                </button>
            `;
        } else if (liberada && r.tipo === 'brinde') {
             statusTag = '<span style="color:#1976D2;font-weight:bold;">(LIBERADO)</span>';
             acaoBtn = `<button disabled style="background:#1976D2;color:#fff;border:none;border-radius:6px;padding:8px 12px;cursor:default;margin-top:10px;">Brinde na Próxima Compra</button>`;
        }
        
        // Se ainda não liberada, o filtro já removeu. Aqui só temos as liberadas.

        return `
            <div class="recompensa-card" style="display:flex;align-items:center;padding:15px;border-radius:10px;margin-bottom:15px;background:#f9f9f9;box-shadow:0 2px 5px rgba(0,0,0,0.1);${cardStyle}">
                <img src="imagens/recompensa-${r.tipo}.png" alt="Ícone de Recompensa" style="width:50px;height:50px;object-fit:cover;border-radius:50%;margin-right:15px;">
                <div style="flex:1;">
                    <h4 style="margin:0 0 5px 0;color:#333;">${titulo} ${statusTag}</h4>
                    <p style="margin:0;font-size:0.9rem;color:#666;">Ganho por ${r.limite} pedidos.</p>
                    ${r.tipo === 'cupom' ? `<p style="margin:5px 0 0 0;font-size:1.1rem;font-weight:bold;color:#ff7043;">CÓDIGO: ${codigoCupom}</p>` : ''}
                </div>
                <div>
                    ${acaoBtn}
                </div>
            </div>
        `;
    }).join('');
    
    el.recompensasLista.innerHTML = recompensasHtml;
    
    // BIND o evento de aplicar cupom (após o desenho)
    el.recompensasLista.querySelectorAll('.recompensa-aplicar-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const codigo = e.currentTarget.dataset.cupom;
            if (codigo) {
                // Aplica a lógica do cupom (similar ao formulário)
                couponApplied = codigo;
                localStorage.setItem("dflCoupon", couponApplied);
                
                // Atualiza o input de cupom (se estiver visível)
                const couponInput = document.getElementById("coupon-input");
                if(couponInput) couponInput.value = codigo;

                renderMiniCart(); // Recalcula e mostra a mensagem
                Overlays.closeAll();
                popupAdd(`Cupom ${codigo} aplicado! ✅`);
                Overlays.open(el.miniCart); // Abre o mini-carrinho para ver o desconto
            }
        });
    });
}


/**
 * NOVO na V3.4: Carrega e exibe o histórico de recompensas recebidas.
 */
async function carregarHistoricoRecompensas(userId) {
    if (!el.historicoLista) return;

    el.historicoLista.innerHTML = `<p style="text-align:center;color:#999;">Carregando histórico...</p>`;
    
    try {
        const q = db.collection("Usuarios").doc(userId)
                    .collection("RecompensasRecebidas")
                    .orderBy("liberadoEm", "desc"); // Corrigido para usar liberadoEm
        
        const snapshot = await q.get();

        if (snapshot.empty) {
            el.historicoLista.innerHTML = `<p class="empty-history" style="text-align:center;color:#999;">Você ainda não recebeu recompensas.</p>`;
            return;
        }

        const logs = snapshot.docs.map(doc => doc.data());
        
        const historicoHtml = logs.map(log => {
            const dataRecebimento = log.liberadoEm
                ? (log.liberadoEm.toDate().toLocaleDateString('pt-BR'))
                : "—";

            let valorStr = (log.tipo === 'cupom') ? log.valor : log.valor;
            if (log.tipo === 'value') valorStr = money(log.valor);

            
            return `
                <div class="historico-card" style="display:flex; padding: 10px 0; border-bottom: 1px dashed #eee; align-items: center; justify-content: space-between;">
                    <div style="flex:1;">
                        <p style="font-weight:600; margin:0; color:#333;">
                            🎁 ${log.titulo || log.valor}
                        </p>
                        <small style="color:#999;">Recebido em: ${dataRecebimento}</small>
                    </div>
                    <span style="font-weight:700; color:#4caf50;">
                        + ${valorStr}
                    </span>
                </div>
            `;
        }).join('');
        
        // Remove a borda do último item para melhor estética
        el.historicoLista.innerHTML = historicoHtml.replace(/border-bottom: 1px dashed #eee;<\/div>$/, 'border-bottom: none;</div>');


    } catch (err) {
        console.error("Erro ao carregar histórico de recompensas: ", err);
        el.historicoLista.innerHTML = `<p style="text-align:center;color:red;">Erro ao buscar histórico.</p>`;
    }
}


/* ------------------ 🎁 MINHAS RECOMPENSAS (V3.5.3) ------------------ */

  // 1. Lógica de abrir/fechar o novo painel
  el.recompensasBtn?.addEventListener("click", () => {
    // Requer login, assim como "Meus Pedidos"
    if (!currentUser) {
      alert("Faça login para ver suas recompensas.");
      Overlays.open(el.loginModal); 
      return;
    }
    // 🚨 OTIMIZAÇÃO: Garante o Firebase se for o primeiro acesso
    inicializarFirebase(); 
    Overlays.open(el.recompensasPanel);
    
    // 🚨 NOVO: Chama a função para carregar e monitorar o contador
    carregarRecompensas(currentUser.uid); 
  });

  // 2. Lógica de fechar o painel
  el.recompensasFecharBtn?.addEventListener("click", () => Overlays.closeAll());

/* ------------------ FIM DO BLOCO V3.5.3 ------------------ */


// =========================================================
// DFL v3.8.5: MÓDULO ADMIN DE ZONAS DE FRETE (CRUD)
// =========================================================

window.DFL_AdminFrete = (() => {
    const TAG = '[DFL/ADMIN]';
    const COLLECTION = 'frete_zonas';
    
    function ensurePanelDOM() {
        if (el.freteAdminPanel) return;

        // Cria a estrutura HTML do painel admin de frete
        const panelHtml = `
            <div class="reports-panel frete-admin-panel" id="frete-admin-panel" aria-hidden="true">
                <div class="reports-header">
                    <span>🚚 Frete Admin - Zonas</span>
                    <button class="reports-close frete-admin-close" type="button" aria-label="Fechar painel">✖</button>
                </div>
                <div class="reports-body" style="padding: 10px;">
                    <div id="frete-admin-add-form" style="padding: 15px; background: #fff; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.1);">
                        <h4>➕ Nova Zona / Edição</h4>
                        <form id="frete-zona-form" style="display: grid; gap: 10px;">
                            <input type="hidden" id="zona-id-input">
                            <input type="text" id="zona-nome-input" placeholder="Nome da Zona (ex: Centro)" required style="padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <input type="number" id="zona-valor-input" placeholder="Valor (R$ 5.00)" step="0.01" required style="padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" id="zona-ativo-input" checked>
                                <label for="zona-ativo-input">Ativa para uso</label>
                            </div>
                            <div style="margin-top: 10px; border-top: 1px dashed #eee; padding-top: 10px;">
                                <label style="font-weight: 600;">Bairros (separados por vírgula):</label>
                                <textarea id="zona-bairros-input" rows="2" placeholder="Rosário, Alvorada, Bela Vista" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; resize: vertical;"></textarea>
                            </div>
                            <button type="submit" id="zona-submit-btn" class="btn-primary" style="padding: 12px;">Salvar Zona</button>
                        </form>
                    </div>

                    <h4>📜 Zonas Cadastradas</h4>
                    <div id="frete-admin-table-container">
                        <p style="text-align: center; color: #999;">Carregando zonas...</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', panelHtml);
        
        // Atualiza as referências dos elementos
        el.freteAdminPanel = document.getElementById("frete-admin-panel");
        el.freteAdminPanel.querySelector('.frete-admin-close')?.addEventListener('click', () => Overlays.closeAll());
        
        bindCRUDListeners();
    }
    
    // DFL v3.8.5: Adiciona listeners de CRUD
    function bindCRUDListeners() {
        // Listener do formulário (Create/Update)
        el.freteAdminPanel.querySelector('#frete-zona-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('zona-id-input').value;
            const nome = document.getElementById('zona-nome-input').value.trim();
            const valor = parseFloat(document.getElementById('zona-valor-input').value);
            const ativo = document.getElementById('zona-ativo-input').checked;
            const bairrosStr = document.getElementById('zona-bairros-input').value;

            if (!nome || isNaN(valor)) {
                popupAdd("Preencha o Nome e Valor corretamente.");
                return;
            }
            
            const bairros = bairrosStr.split(',').map(b => b.trim()).filter(b => b.length > 0);

            const dados = { nome, valor, ativo, bairros };
            
            if (id) {
                await editarZonaFrete(id, dados);
            } else {
                await adicionarZonaFrete(dados);
            }
            
            // Resetar formulário após salvar
            e.target.reset();
            document.getElementById('zona-id-input').value = '';
            document.getElementById('zona-submit-btn').textContent = 'Salvar Zona';
        });
        
        // Listener da Tabela (Edit/Delete) - Delegado ao container
        el.freteAdminPanel.querySelector('#frete-admin-table-container')?.addEventListener('click', async (e) => {
            const target = e.target;
            const id = target.closest('tr')?.dataset.id;
            if (!id) return;
            
            if (target.classList.contains('edit-btn')) {
                preencherFormularioEdicao(id);
            } else if (target.classList.contains('delete-btn')) {
                if (confirm(`Tem certeza que deseja excluir a zona ${id}?`)) {
                    await removerZonaFrete(id);
                }
            }
        });
    }


    // DFL v3.8.5: READ (usando onSnapshot para tempo real)
    function carregarZonasFrete() {
        if (!db) { return; }
        
        db.collection(COLLECTION).onSnapshot(snapshot => {
            const zonas = [];
            snapshot.forEach(doc => {
                zonas.push({ id: doc.id, ...doc.data() });
            });
            renderizarTabela(zonas);
            LOG.admin(`Zonas de Frete carregadas em tempo real. Total: ${zonas.length}`);
        }, error => {
            LOG.error("Erro ao carregar zonas de frete (onSnapshot):", error);
            document.getElementById('frete-admin-table-container').innerHTML = `<p style="color:red; text-align:center;">Erro de conexão com o Firestore.</p>`;
        });
    }

    // DFL v3.8.5: CREATE
    async function adicionarZonaFrete(dados) {
        try {
            await db.collection(COLLECTION).add(dados);
            popupAdd(`✅ Zona '${dados.nome}' adicionada com sucesso!`);
            LOG.admin(`Zona adicionada: ${dados.nome}`);
        } catch (e) {
            popupAdd("❌ Erro ao adicionar zona. Cheque a segurança.");
            LOG.error("Erro ao adicionar zona:", e);
        }
    }
    
    // DFL v3.8.5: UPDATE
    async function editarZonaFrete(id, novosDados) {
        try {
            await db.collection(COLLECTION).doc(id).update(novosDados);
            popupAdd(`✅ Zona '${novosDados.nome}' atualizada com sucesso!`);
            LOG.admin(`Zona atualizada: ${novosDados.nome} (${id})`);
        } catch (e) {
            popupAdd("❌ Erro ao editar zona. Cheque a segurança.");
            LOG.error("Erro ao editar zona:", e);
        }
    }
    
    // DFL v3.8.5: DELETE
    async function removerZonaFrete(id) {
        try {
            await db.collection(COLLECTION).doc(id).delete();
            popupAdd(`✅ Zona excluída com sucesso!`);
            LOG.admin(`Zona excluída: ID ${id}`);
        } catch (e) {
            popupAdd("❌ Erro ao excluir zona. Cheque a segurança.");
            LOG.error("Erro ao excluir zona:", e);
        }
    }
    
    // DFL v3.8.5: Popula o formulário para edição
    async function preencherFormularioEdicao(id) {
        const doc = await db.collection(COLLECTION).doc(id).get();
        if (!doc.exists) return popupAdd("Zona não encontrada.");
        
        const data = doc.data();
        
        document.getElementById('zona-id-input').value = id;
        document.getElementById('zona-nome-input').value = data.nome || '';
        document.getElementById('zona-valor-input').value = data.valor || 0;
        document.getElementById('zona-ativo-input').checked = data.ativo !== false;
        document.getElementById('zona-bairros-input').value = Array.isArray(data.bairros) ? data.bairros.join(', ') : '';
        document.getElementById('zona-submit-btn').textContent = 'Atualizar Zona';
        
        // Rolagem para o topo para visualização da edição
        el.freteAdminPanel.querySelector('.reports-body').scrollTo(0, 0);
    }


    // DFL v3.8.5: Renderização da Tabela de Zonas
    function renderizarTabela(zonas) {
        const container = document.getElementById('frete-admin-table-container');
        if (!container) return;
        
        if (zonas.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:#999;">Nenhuma zona cadastrada. Use o formulário acima para adicionar.</p>`;
            return;
        }

        const tableHtml = `
            <table class="reports-table" style="width: 100%;">
                <thead>
                    <tr>
                        <th>Bairro</th>
                        <th>Valor (R$)</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${zonas.map(z => {
                        const status = z.ativo !== false ? '✅ Ativo' : '❌ Inativo';
                        const statusColor = z.ativo !== false ? '#4caf50' : '#d32f2f';
                        const bairrosDisplay = (z.bairros || []).slice(0, 3).join(', ') + (z.bairros?.length > 3 ? `...` : '');
                        
                        return `
                            <tr data-id="${z.id}" style="vertical-align: top;">
                                <td><b>${z.nome}</b><br><small style="color:#777;">(${bairrosDisplay})</small></td>
                                <td>${money(z.valor)}</td>
                                <td style="color: ${statusColor}; font-weight: 600;">${status}</td>
                                <td>
                                    <button class="edit-btn" style="background: none; border: none; cursor: pointer; color: #1976D2; font-size: 1rem; margin-right: 5px;">✏️</button>
                                    <button class="delete-btn" style="background: none; border: none; cursor: pointer; color: #d32f2f; font-size: 1rem;">🗑️</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        container.innerHTML = tableHtml;
    }
    
    // API Pública do Módulo
    function openAdminPanel() {
        if (!currentUser || !isAdmin(currentUser)) {
            popupAdd("Acesso negado. Apenas administradores podem acessar.");
            return;
        }
        
        // Garante que o painel e os listeners de CRUD existam
        ensurePanelDOM();
        
        // Abre o painel e inicia a escuta em tempo real
        Overlays.open(el.freteAdminPanel);
        carregarZonasFrete(); 
    }


    // Retorna a API pública
    return {
        open: openAdminPanel
    };
})();

// DFL v3.8.5: Listener de integração (Ação 3)
const DFL_FreteAdminIntegration = () => {
    inicializarFirebase();
    if (window.DFL_AdminFrete) {
        try { 
            window.DFL_AdminFrete.open(); 
        } catch(e){ 
            console.log('[DFL/ADMIN] erro ao abrir:', e); 
        }
    }
};


  /* ------------------ 🔐 Segurança/Admin + UX Final (CORRIGIDO) ------------------ */
  
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

  /* 🚨 ATUALIZADO V3.8.5: Mensagem de console (Nova Versão) */
  console.log("%c🚀 DFL v3.8.5 — Painel Admin de Frete (CRUD) Ativo",
              "background:#ff5722;color:#fff;padding:8px 12px;border-radius:8px;font-weight:700;");

}); // Fim do DOMContentLoaded

/* =========================================================
   SCRIPT PARA FECHAR MODAIS AO CLICAR FORA (MANTIDO)
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Lógica para fechar os MODAIS (Login, Extras, Combo) ---
  
  const allModals = document.querySelectorAll('.modal');

  allModals.forEach(modal => {
    modal.addEventListener('click', (event) => {
      
      if (event.target.classList.contains('modal')) {
        
        modal.classList.remove('show');
        
        const cartBackdrop = document.getElementById('cart-backdrop');
        if (cartBackdrop) {
            cartBackdrop.classList.remove('active');
        }
      }
    });
  });

  // --- 2. Lógica para fechar o MINI-CARRINHO ---
  
  const cartBackdrop = document.getElementById('cart-backdrop');
  const miniCart = document.getElementById('mini-cart');

  if (cartBackdrop && miniCart) {
    cartBackdrop.addEventListener('click', () => {
      // Usamos a função Overlays.closeAll() agora.
      const Overlays = {
        closeAll() {
          document.querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, .reports-panel.active, .frete-admin-panel.active") 
            .forEach((e) => e.classList.remove("show", "active"));
          cartBackdrop.classList.remove('active');
        },
      };
      Overlays.closeAll();
      
      // v2.9: Garante que o painel de pedidos também feche
      // (Esta lógica é redundante se Overlays.closeAll() for usada, mas é mantida por segurança)
      const pedidosPanel = document.getElementById('painelPedidos');
      if (pedidosPanel) {
        pedidosPanel.classList.remove('active');
      }
      
      // v3.1: Garante que o painel de recompensas também feche
      const recompensasPanel = document.getElementById('recompensas-panel');
      if (recompensasPanel) {
        recompensasPanel.classList.remove('active');
      }
    });
  }

});
