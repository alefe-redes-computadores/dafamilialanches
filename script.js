/* =========================================================
   🚀 DFL v5.2.2 — CORREÇÃO CRÍTICA FINAL: INICIALIZAÇÃO FIREBASE
   - CORRIGIDO: Erro 'Firebase App already created' (chamadas duplicadas removidas).
   - Login agora depende apenas da inicialização ÚNICA no final.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------ ⚙️ BASE ------------------ */
  const sound = new Audio("click.wav"); 
  let cart = [];
  let currentUser = null;
  let isFirebaseInitialized = false; 
  // VARIAVEIS DE FRETE ADICIONADAS
  const DELIVERY_FEE_DEFAULT = 6.00; // Valor Padrão para fallback
  let deliveryFeesCache = null; 

  const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
  const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };

  /* --- 🆕 FUNÇÃO HELPER BLINDADA (ANTI-CRASH) --- */
  function getTierIcon(tier) {
    const level = tier ? String(tier).toLowerCase().trim() : '';
    
    // Níveis Clássicos (v4.3)
    if (level.includes('ouro')) return '🥇';
    if (level.includes('platina')) return '💎';
    if (level.includes('diamante')) return '👑';
    // Níveis Intermediários (Novos do v5)
    if (level.includes('safira')) return '💠';     
    if (level.includes('rubi')) return '♦️';       
    if (level.includes('esmeralda')) return '❇️'; 
    // Níveis Avançados (Novos do v5)
    if (level.includes('elite')) return '⚔️';      
    if (level.includes('supremo')) return '🚀';    
    // Níveis Lendários (Novos do v5)
    if (level.includes('lenda')) return '🦁';      
    if (level.includes('mítico') || level.includes('mitico')) return '🦄';
    
    return '👤'; 
  }

  /* DADOS PROMOÇÕES */
  const PROMO_DATA = [
    null, 
    { id: 1, nome: "Combo 2 Purizin + Fanta 1L", preco: 34.99, precoAntigo: 40.00, img: "promocoes/promo1.jpg" },
    { id: 2, nome: "Combo 3 Padaná", preco: 37.99, precoAntigo: 45.00, img: "promocoes/promo2.jpg" },
    { id: 3, nome: "Combo 2 Peleja", preco: 39.99, precoAntigo: 52.00, img: "promocoes/promo3.jpg" },
    { id: 4, nome: "Combo 3 Trem + Fanta 1L", preco: 44.99, precoAntigo: 52.00, img: "promocoes/promo4.jpg" },
    { id: 5, nome: "Combo 4 Trem + Fanta 1L", preco: 49.99, precoAntigo: 65.00, img: "promocoes/promo5.jpg" },
    { id: 6, nome: "Combo 5 Uai", preco: 54.99, precoAntigo: 65.00, img: "promocoes/promo6.jpg" },
    { id: 7, nome: "Combo 4 TremBão + Fanta 1L", preco: 59.99, precoAntigo: 77.00, img: "promocoes/promo7.jpg" },
    { id: 8, nome: "Combo 4 Armaria", preco: 59.99, precoAntigo: 72.00, img: "promocoes/promo8.jpg" },
    { id: 9, nome: "Combo 5 Uai + Kuat 2L", preco: 64.99, precoAntigo: 79.99, img: "promocoes/promo9.jpg" }
  ];
  
  /* ------------------ 🎯 ELEMENTOS ------------------ */
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
    comboBody: document.querySelector("#combo-modal #combo-body"), // Corrigido o seletor aqui
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
    
    promoModal: document.getElementById("promo-modal"),
    promoImg: document.getElementById("promo-modal-img"),
    promoTitle: document.getElementById("promo-modal-title"),
    promoPrice: document.getElementById("promo-modal-price"),
    promoAddBtn: document.getElementById("promo-modal-add"),
    promoNavPrev: document.querySelector("#promo-modal .promo-nav.prev"),
    promoNavNext: document.querySelector("#promo-modal .promo-nav.next"),
    promoClose: document.querySelector("#promo-modal .promo-close"),

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
  
  if (!el.historicoLista) {
     const painelBody = document.querySelector("#recompensas-panel .recompensas-body");
     if (painelBody) {
        painelBody.innerHTML += `
            <h4 class="recompensas-header-secundario">📜 Histórico de Recompensas</h4>
            <div id="historicoRecompensas" style="margin-top: 15px;"></div>
        `;
        el.historicoLista = document.getElementById("historicoReimagens");
     }
  }

  /* ------------------ 🌫️ BACKDROP ------------------ */
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

  /* ------------------ 🧩 OVERLAYS ------------------ */
  const Overlays = {
    closeAll() {
      document
        .querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show") 
        .forEach((e) => e.classList.remove("show", "active"));
      Backdrop.hide();
    },
    open(modalLike) {
      Overlays.closeAll();
      if (!modalLike) return;
      modalLike.classList.add(
        (modalLike.id === "mini-cart" || modalLike.id === "painelPedidos" || modalLike.id === "recompensas-panel") ? "active" : "show"
      );
      Backdrop.show();
    },
  };
  el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());

  /* ------------------ 🎟️ CUPOM FORM ------------------ */
  const couponForm = document.getElementById("coupon-form");
  couponForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("coupon-input");
    const val = (input?.value || "").trim().toUpperCase();

    if (!val) {
      couponApplied = "";
      localStorage.removeItem("dflCoupon");
      popupAdd("Cupom removido.");
      renderMiniCart();
      return;
    }
    
    couponApplied = val;
    localStorage.setItem("dflCoupon", couponApplied);
    renderMiniCart(); 
  });

  /* ------------------ 💬 POPUP ------------------ */
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
    pop.style.opacity = '1';
    pop.style.transform = 'translateX(-50%) scale(1)';
    setTimeout(() => {
      pop.style.transform = 'translateX(-50%) scale(0)';
      pop.style.opacity = '0';
    }, 6000);
  }

/* ------------------ 🛒 MINI-CARRINHO ------------------ */
  function renderMiniCart() {
    if (!el.miniList) return; 

    const totalItens = cart.reduce((s, i) => s + i.qtd, 0);
    if (el.cartCount) el.cartCount.textContent = totalItens;

    if (!cart.length) {
      el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';
      
      if(el.miniFoot) el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());
      const couponMsg = document.getElementById("coupon-message");
      const couponDiscountRow = document.getElementById("coupon-discount-row");
      if (couponMsg) couponMsg.innerHTML = "";
      if (couponDiscountRow) couponDiscountRow.style.display = "none";
      
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

  const _renderMiniCartOrig = renderMiniCart;
  renderMiniCart = function () {
    _renderMiniCartOrig(); 
    bindMiniCartButtons(); 
    enhanceMiniCartUI();
  };

  /* ------------------ 🔥 FIREBASE ------------------ */
  const firebaseConfig = {
    apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
    authDomain: "da-familia-lanches.firebaseapp.com",
    projectId: "da-familia-lanches",
    storageBucket: "da-familia-lanches.appspot.com",
    messagingSenderId: "106857147317",
    appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
  };
  
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
          
          auth = firebase.auth();
          db = firebase.firestore();
          isFirebaseInitialized = true;
          setupAuthListener(); 

      } catch (error) {
          console.error("ERRO FATAL AO INICIAR FIREBASE:", error);
          const elBody = document.querySelector("body");
          if (elBody) {
             elBody.innerHTML = `<div style="padding:20px;text-align:center;font-size:1.2rem;color:red;font-family:sans-serif;margin-top:50px;">
              <b>Erro Crítico</b><br>Não foi possível conectar aos nossos serviços.
              <br><small>Verifique sua conexão com a internet e tente recarregar a página.</small>
              <br><br><small style="color:#666">Detalhe: ${error.message}</small></div>`;
          }
      }
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

      if (user && isAdmin(user)) {
        if (el.reportsBtn) {
          createAdminFab();
        }
      } else {
        if (el.reportsBtn) el.reportsBtn.style.display = "none";
        document.getElementById("admin-dashboard")?.remove();
      }
    });
  }

  /* ------------------ ⚙️ LOGIN ------------------ */
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
      if (!currentUser) inicializarFirebase();
      renderMiniCart();
      Overlays.open(el.miniCart);
  });
//... o restante do código continua na Parte 2
// ... continuação da Parte 1

  /* ------------------ ➕ ADICIONAIS ------------------ */
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

    el.extrasList.innerHTML = adicionais.map((a, i) => `
      <label class="extra-line" style="
        display: flex; justify-content: space-between; align-items: center; 
        padding: 12px; border: 1px solid #ffb300; border-radius: 8px; 
        background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.08); 
        cursor: pointer; transition: all 0.2s; font-size: 1rem;">
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

  // SELETOR GLOBAL PARA FECHAR MODAIS
  document.querySelectorAll(".extras-close").forEach((b) =>
    b.addEventListener("click", () => Overlays.closeAll())
  );

  /* ------------------ 🥤 COMBOS ------------------ */
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
    el.comboBody.innerHTML = opts.map((o, i) => `
      <label class="combo-option-line" style="
        display: flex; justify-content: space-between; align-items: center; 
        padding: 12px; border: 1px solid #ffb300; border-radius: 8px; 
        background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.08); 
        cursor: pointer; transition: all 0.2s; font-size: 1rem;">
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

  function addCommonItem(nome, preco) {
    if (/^combo/i.test(nome) && !/^\s*Combo [0-9]/.test(nome)) {
      openComboModal(nome, preco);
      return;
    }
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

  /* ------------------ ⚙️ CONFIGURAÇÕES E CÁLCULOS ------------------ */
  // v4.3: Removida a declaração de DELIVERY_FEE e a declaração de addressValue,
  // pois serão lidas dinamicamente do novo formulário.
  let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();

  const getCartSubtotal = () =>
    cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);

  /* VALIDAÇÃO DE CUPOM */
  const _cupomCache = {};
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
    
    // v4.3 - RECOMPENSAS: Usando a função carregarConfiguracoesDeRecompensas que falta no v4.3
    const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();

    const key = _cacheKey(code, subtotal);
    const now = Date.now();
    const hit = _cupomCache[key];
    if (hit && hit.ate > now) return hit.res;
    
    let data = null;
    let isPersonalizado = false;
    
    // ... Lógica de busca de cupom no Firestore (mantida do v4.3) ...

    try {
      const snapGeral = await db.collection("Cupons").doc(code).get();
      if (snapGeral.exists) {
        data = snapGeral.data();
      } else {
          const recompensaEncontrada = RECOMPENSAS_DATA.find(r => r.valor === code && r.tipo === 'cupom');
          
          if (userId && recompensaEncontrada) {
              const snapPessoal = await db.collection("CuponsUsuarios").doc(userId).get();
              const pessoalData = snapPessoal.data();
              
              if (snapPessoal.exists && pessoalData?.cupom === code && !pessoalData?.usado) {
                  data = {
                    tipo: pessoalData.tipo, 
                    valor: pessoalData.valor,
                    ativo: true, 
                    expiraEm: pessoalData.expiraEm 
                  };
                  isPersonalizado = true;
              } else if (snapPessoal.exists && pessoalData?.usado) {
                  return { ...invalido, mensagem: "Este cupom já foi utilizado." };
              } else {
                  return { ...invalido, mensagem: "Cupom inválido ou não liberado." };
              }
          } else {
              const res = { ...invalido, mensagem: "Cupom inválido." };
              _cupomCache[key] = { ate: now + 30000, res }; 
              return res;
          }
      }
      
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

      let discount = 0;
      let freeShipping = false;
      let label = "";

      if (data.tipo === "percent") {
        discount = Math.max(0, subtotal * (Number(data.percent || data.valor) / 100)); 
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
          isPersonalizado: isPersonalizado
      };
      _cupomCache[key] = { ate: now + 30000, res };
      return res;

    } catch (err) {
      console.error("Erro ao validar cupom no Firestore:", err);
      return { ...invalido, mensagem: "Erro ao processar o cupom." };
    }
  }

  /* --- FUNÇÃO FRETE DINÂMICO (v5.1) --- */
  // Incluído para futura implementação no Firestore
  // A versão V4.3 não tinha esta função, mas ela é necessária para a v5.2
  async function getDynamicDeliveryFee(localidade) {
    const DELIVERY_FEE = DELIVERY_FEE_DEFAULT; 
    let localidadeTaxaId = 'fallback'; 
    
    // 1. Determinar o ID do documento (Normalizar Patos de Minas)
    const localidadeClean = localidade ? localidade.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : '';
    if (localidadeClean.includes('patos de minas')) {
        localidadeTaxaId = 'patos-de-minas'; 
    }

    // 2. Checar e carregar o cache do Firestore (apenas se DB estiver ativo)
    if (isFirebaseInitialized && !deliveryFeesCache) {
        console.warn("FW: Buscando Taxas de Frete no Firestore (Primeiro acesso).");
        try {
            if (!db) throw new Error("Firestore not initialized for fee lookup."); 
            const snap = await db.collection("TaxasDeEntrega").get();
            deliveryFeesCache = {}; 
            
            snap.forEach(doc => {
                deliveryFeesCache[doc.id] = Number(doc.data().valor || doc.data().taxa || DELIVERY_FEE); 
            });

        } catch (e) {
            console.warn("FW: Erro ao ler Taxas de Entrega. Usando Fallback R$6,00.");
            return DELIVERY_FEE;
        }
    }

    // 3. Retornar a taxa correta do cache (ou o fallback de segurança)
    let taxa = deliveryFeesCache ? deliveryFeesCache[localidadeTaxaId] : undefined;

    if (taxa === undefined) {
        taxa = deliveryFeesCache ? (deliveryFeesCache['fallback'] || DELIVERY_FEE) : DELIVERY_FEE;
        console.warn(`FW: Cidade não mapeada (${localidade}). Usando taxa de fallback R$${taxa.toFixed(2)}.`);
    }

    if (isNaN(taxa) || taxa < 0) return DELIVERY_FEE;
    
    return taxa;
  }
  // --- FIM FUNÇÃO FRETE DINÂMICO ---

  /* --- FUNÇÃO VIA CEP V5.2 (INTEGRAÇÃO) --- */
  async function buscarCEP(cep) {
    const freteContainer = document.querySelector('.frete-container');
    const enderecoAuto = document.getElementById('endereco-auto');
    const numeroInput = document.getElementById('numero-input');
    const complementoInput = document.getElementById('complemento-input');
    const retirarLocal = document.getElementById('retirar-local');

    // Funções auxiliares para liberar/bloquear campos e atualizar o estilo
    const toggleAddressState = (isDisabled) => {
        if(enderecoAuto) enderecoAuto.disabled = isDisabled;
        if(numeroInput) numeroInput.disabled = isDisabled;
        if(complementoInput) complementoInput.disabled = isDisabled;
        if(retirarLocal) retirarLocal.disabled = isDisabled;
        document.querySelector('.frete-container')?.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
    };

    const updateStatus = (msg, color) => {
        if (freteContainer) freteContainer.querySelector('h4').innerHTML = `🚚 Entrega: <span style="color:${color}">${msg}</span>`;
    };

    const clearAndEnableManual = (msg) => {
        if (enderecoAuto) enderecoAuto.value = msg;
        if (numeroInput) numeroInput.value = '';
        if (complementoInput) complementoInput.value = '';
        
        toggleAddressState(false); 
        if (enderecoAuto) enderecoAuto.disabled = false; // Permite edição manual da Rua/Endereço
        updateStatus('Erro/Manual', 'var(--danger)');
        renderMiniCart(); // Recálculo para o frete padrão
    };
    
    // Bloqueia campos estruturados e indica busca
    toggleAddressState(true);
    updateStatus('Buscando endereço...', 'var(--botao)');
    
    // Garante que o CEP-INPUT não seja desativado (CORREÇÃO DE BUG ANTERIOR)
    document.getElementById('cep-input').disabled = false; 

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro || !response.ok) {
            clearAndEnableManual('CEP não encontrado ou inválido. Preencha manualmente.');
        } else {
            const localidadeCompleta = `${data.localidade || 'Cidade não definida'}/${data.uf || 'UF'}`;
            enderecoAuto.value = `${data.logradouro || 'Rua não definida'} - ${data.bairro || 'Bairro não definido'} (${localidadeCompleta})`;
            
            toggleAddressState(false);
            if (enderecoAuto) enderecoAuto.disabled = true; // Mantém a rua/bairro travada após a busca
            if (numeroInput) numeroInput.focus(); 
            
            updateStatus('Endereço encontrado!', 'var(--success)');
            renderMiniCart(); 
        }

    } catch (error) {
        console.error("ViaCEP Error:", error);
        popupAdd("Erro ao consultar CEP. Tente novamente ou preencha o manual.");
        clearAndEnableManual('Erro na consulta. Preencha manualmente.');
    }
  } // FIM buscarCEP

  // CORREÇÃO: Listener para o botão Buscar do CEP
  document.getElementById('btn-calcular-frete')?.addEventListener('click', safe(() => {
      const cepInput = document.getElementById('cep-input');
      const cep = cepInput.value.trim().replace(/\D/g, '');
      if (cep.length === 8) {
          buscarCEP(cep);
      } else {
          popupAdd("CEP deve ter 8 dígitos.");
      }
  }));


  async function calcTotals() {
    const subtotal = getCartSubtotal();
    const d = await validarCupomFirestore(couponApplied, subtotal); 
    
    // BUSCA DE ENDEREÇO E CÁLCULO DE FRETE (INTEGRAÇÃO V5.2)
    const cepInput = document.getElementById('cep-input');
    const enderecoAuto = document.getElementById('endereco-auto');
    const isRetirarLocal = document.getElementById('retirar-local')?.checked;
    
    const cepValue = cepInput ? cepInput.value.trim().replace(/\D/g, '') : '';
    let deliveryFee = DELIVERY_FEE_DEFAULT; 

    if (isRetirarLocal) {
        deliveryFee = 0;
    } else if (cepInput && cepValue.length === 8 && enderecoAuto && enderecoAuto.value) {
        // Se CEP foi buscado e endereço preenchido (modo CEP)
        const enderecoAutoValue = enderecoAuto.value.trim();
        const localidadeMatch = enderecoAutoValue.match(/\((.*?)\/.*?\)/);
        const localidade = localidadeMatch ? localidadeMatch[1] : '';

        try {
            deliveryFee = await getDynamicDeliveryFee(localidade); 
        } catch(e) {
            deliveryFee = DELIVERY_FEE_DEFAULT;
        }
    }
    // FIM DA INTEGRAÇÃO DE FRETE

    const delivery = d.freeShipping ? 0 : deliveryFee;
    const total = Math.max(0, subtotal + delivery - d.discount);
    
    return {
      subtotal,
      delivery,
      discount: d.discount,
      discountLabel: d.label,
      total,
      cupomInfo: d
    };
  }
//... o restante do código continua na Parte 3
// ... continuação da Parte 2

  async function enhanceMiniCartUI() {
    if (!el.miniFoot) return;
    
    const couponMsg = document.getElementById("coupon-message");
    const couponDiscountRow = document.getElementById("coupon-discount-row");
    const cartDiscount = document.getElementById("cart-discount");

    el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());
    
    if (cart.length === 0) {
      if (couponMsg) couponMsg.innerHTML = "";
      if (couponDiscountRow) couponDiscountRow.style.display = "none";
      return; 
    }

    const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();

    if (couponMsg) {
      couponMsg.textContent = cupomInfo.mensagem;
      couponMsg.className = `coupon-message ${cupomInfo.valido ? 'success' : 'error'}`;
      
      if (!cupomInfo.valido && couponApplied) {
         couponApplied = "";
         localStorage.removeItem("dflCoupon");
         const couponInput = document.getElementById("coupon-input");
         if (couponInput && document.activeElement !== couponInput) {
           couponInput.value = "";
         }
      }
    }

    if (couponDiscountRow && cartDiscount) {
      if (discount > 0 || cupomInfo.label) {
        cartDiscount.textContent = `- ${money(discount)} ${couponApplied ? `(${couponApplied})` : ""}`;
        couponDiscountRow.style.display = "flex";
      } else {
        couponDiscountRow.style.display = "none";
      }
    }
    
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'cart-summary-generated';
    summaryDiv.innerHTML = `
      <div class="summary-row" style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
        <span>Subtotal</span><b>${money(subtotal)}</b>
      </div>
      <div class="summary-row">
        <span>Entrega</span><b>${money(delivery)}</b>
      </div>
      
      <div class="summary-row" style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #eee;padding-top:10px;margin: 10px 0;font-size:1.1rem;">
        <span><b>Total</b></span><span style="color:#e53935;font-weight:800;">${money(total)}</span>
      </div>
      
      <button id="finish-order" type="button" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:10px;padding:12px;font-weight:700;cursor:pointer;margin-bottom:8px">
        Finalizar Pedido 🛍️
      </button>
      <button id="clear-cart" type="button" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;cursor:pointer">
        Limpar Carrinho
      </button>
    `;
    
    el.miniFoot.appendChild(summaryDiv);
    
    // Listener para o check de retirar no local (integração V5.2)
    document.getElementById('retirar-local')?.addEventListener('change', renderMiniCart);
    
    // Listener para os inputs de endereço (integração V5.2) - para garantir recálculo
    document.getElementById('numero-input')?.addEventListener('input', renderMiniCart);
    document.getElementById('complemento-input')?.addEventListener('input', renderMiniCart);


    summaryDiv.querySelector("#finish-order")?.addEventListener("click", fecharPedido);
    summaryDiv.querySelector("#clear-cart")?.addEventListener("click", () => {
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
    ✨ v4.3: FUNÇÃO PARA CARREGAR METAS (CACHÊ REVISADO)
    =========================================================
  */
  let configuracoesRecompensa = null; 
  
  async function carregarConfiguracoesDeRecompensas() {
      if (!isFirebaseInitialized) return []; 
      if (configuracoesRecompensa) return configuracoesRecompensa; 
      
      try {
          // Nota: v4.3 usa RecompensasConfig, não Configuracao. Revertendo para o que funciona.
          const snapshot = await db.collection("RecompensasConfig").get();
          const configs = [];
          snapshot.forEach(doc => {
              const data = doc.data();
              configs.push({ 
                  id: doc.id,
                  limite: data.meta || data.limite, 
                  tipo: data.tipo,
                  valor: data.valor || data.titulo, 
                  titulo: data.titulo || data.valor,
                  ...data 
              });
          });
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

  /* ------------------ 🖼️ CARROSSEL (LÓGICA RESTAURADA) ------------------ */
  let currentPromoId = 1;

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

  document.querySelectorAll(".slide[data-promo-id]").forEach((img) => {
    img.addEventListener("click", () => {
      const id = parseInt(img.dataset.promoId, 10);
      if (id) {
        showPromoModal(id);
      }
    });
  });

  el.promoAddBtn?.addEventListener("click", () => {
    const promo = PROMO_DATA[currentPromoId];
    if (!promo) return;
    addCommonItem(promo.nome, promo.preco); 
    Overlays.closeAll(); 
  });

  el.promoNavPrev?.addEventListener("click", () => {
    let newId = currentPromoId - 1;
    if (newId < 1) newId = 9; 
    showPromoModal(newId);
  });

  el.promoNavNext?.addEventListener("click", () => {
    let newId = currentPromoId + 1;
    if (newId > 9) newId = 1; 
    showPromoModal(newId);
  });
  
  el.promoClose?.addEventListener("click", () => Overlays.closeAll());

  // Lógica de Scroll do Carrossel (v4.3)
  el.cPrev?.addEventListener("click", () => {
    if (!el.slides) return;
    el.slides.scrollLeft -= Math.min(el.slides.clientWidth * 0.9, 320);
  });
  el.cNext?.addEventListener("click", () => {
    if (!el.slides) return;
    el.slides.scrollLeft += Math.min(el.slides.clientWidth * 0.9, 320);
  });


  /* ------------------ ⏰ Status + Timer (v4.3 Restaurado) ------------------ */
  const atualizarStatus = safe(() => {
    const agora = new Date();
    const h = agora.getHours();
    const m = agora.getMinutes();
    const aberto = h >= 18 && h < 23; 
    if (el.statusBanner) {
      el.statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!";
      el.statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`;
    }
    if (el.hoursBanner) {
      // NOTE: o HTML do hoursBanner não foi fornecido, a lógica pode falhar se os IDs não existirem
      const elMsg = el.hoursBanner.querySelector("#hours-message");
      const elTimer = el.hoursBanner.querySelector("#timer");
      if (!elMsg || !elTimer) return;

      if (aberto) {
        const fim = new Date(agora);
        fim.setHours(23, 30, 0); 
        
        let diff = (fim - agora) / 1000;
        if (diff < 0) diff = 0;
        
        const restH = Math.floor(diff / 3600);
        const restM = Math.floor((diff % 3600) / 60);
        
        elMsg.innerHTML = `⏰ Hoje atendemos até <b>23h30</b> — Faltam`;
        elTimer.textContent = `${restH}h ${restM}min`;

      } else {
        const inicio = new Date(agora);
        if (h >= 23 || (h === 23 && m >= 30)) { 
          inicio.setDate(inicio.getDate() + 1);
        }
        inicio.setHours(18, 0, 0); 

        let diff = (inicio - agora) / 1000;
        const faltamH = Math.floor((diff) / 3600); // Uso do diff corrigido aqui
        const faltamM = Math.floor((diff % 3600) / 60); // Uso do diff corrigido aqui

        elMsg.innerHTML = `🔒 Fechado — Abrimos em`;
        elTimer.textContent = `${faltamH}h ${faltamM}min`;
      }
    }
  });
  atualizarStatus();
  setInterval(atualizarStatus, 60000);

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

//... o restante do código continua na Parte 3
