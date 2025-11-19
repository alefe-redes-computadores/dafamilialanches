/* =========================================================  
   🚀 DFL v5.2.8 — VERSÃO FINAL ESTÁVEL COM CORREÇÃO DE RECOMPENSAS  
   - CORREÇÃO CRÍTICA (18/11/2025): Referência a elementos e limpeza de listas no painel de recompensas.  
   - CORREÇÃO FRETE (18/11/2025): Lógica de frete dentro de calcTotals revisada para Frete Grátis/Padrão  
   - CORREÇÃO FRETE DINÂMICO (NOVA VERSÃO POR BAIRRO) - FUNÇÃO ANTIGA REMOVIDA
========================================================= */  
  
document.addEventListener("DOMContentLoaded", () => {  
  /* ------------------ ⚙️ BASE ------------------ */  
  const sound = new Audio("click.wav");   
  let cart = [];  
  let currentUser = null;  
  let isFirebaseInitialized = false;   
  // VARIAVEIS DE FRETE ADICIONADAS  
  const DELIVERY_FEE_DEFAULT = 6.00; // Valor Padrão para fallback  
  // Adicionado um limite (o valor que estava faltando na discussão anterior) para simular o frete grátis do cupom.  
  // NOTE: Se o limite para FRETE GRÁTIS POR VALOR for diferente do cupom, este valor deve ser ajustado.  
  // Mantendo a lógica de frete grátis apenas via cupom e frete normal por localidade.  
  const LIMITE_PARA_FRETE_GRATIS_POR_VALOR = 200.00;   
  
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
    comboBody: document.querySelector("#combo-modal #combo-body"),  
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
    // 🚨 AJUSTE DE REFERÊNCIA: Garante que os elementos estáticos sejam referenciados  
    recompensasLista: document.getElementById("listaRecompensas"),  
    historicoLista: document.getElementById("historicoRecompensas")   
  };  
    
  // 🚨 REMOÇÃO DO CÓDIGO DUPLICADO (Linhas ~163-172)  
  // Agora o script confia que o Histórico já está no index.html e apenas busca o ID.  
  
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
    inicializarFirebase(); // OK manter aqui, pois é um formulário de submissão  
    if (!isFirebaseInitialized) return alert("Erro ao conectar ao serviço de login.");  
      
    const email = document.getElementById("login-email")?.value?.trim();  
    const senha = document.getElementById("login-senha")?.value?.trim();  
    if (!email || !senha) return alert("Preencha e-mail e senha.");  
  
    auth.signInWithEmailAndPassword(email, senha)  
      .then((cred) => handleLoginSuccess(cred.user))  
      .catch(handleLoginError);  
  });  
  
  el.googleBtn?.addEventListener("click", () => {  
    inicializarFirebase(); // OK manter aqui, pois é um formulário de submissão  
    if (!isFirebaseInitialized) return alert("Erro ao conectar ao serviço de login.");  
      
    const provider = new firebase.auth.GoogleAuthProvider();  
    auth.signInWithPopup(provider)  
      .then((res) => handleLoginSuccess(res.user))  
      .catch((err) => alert("Erro: ".concat(err.message)));  
  });  
    
  el.userBtn?.addEventListener("click", () => {  
      // CORREÇÃO CRÍTICA: REMOVER CHAMADA DUPLICADA  
      Overlays.open(el.loginModal);  
  });  
    
  el.cartIcon?.addEventListener("click", () => {  
      // CORREÇÃO CRÍTICA: REMOVER CHAMADA DUPLICADA  
      renderMiniCart();  
      Overlays.open(el.miniCart);  
  });  
  
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
            // CORREÇÃO (Diagnóstico 1): Manter o formato completo, a função de cálculo extrai o bairro.  
            const localidadeCompleta = `${data.localidade || 'Cidade não definida'}/${data.uf || 'UF'}`;  
            const enderecoString = `${data.logradouro || 'Rua não definida'} - ${data.bairro || 'Bairro não definida'} (${localidadeCompleta})`;  
            
            enderecoAuto.value = enderecoString;  
              
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
  
  
  // 💥 FUNÇÃO CRÍTICA DE CÁLCULO DE TOTAIS (CORREÇÃO DE LÓGICA DO FRETE APLICADA)  
  async function calcTotals() {  
    const subtotal = getCartSubtotal();  
    const d = await validarCupomFirestore(couponApplied, subtotal);   
      
    // BUSCA DE ENDEREÇO E CÁLCULO DE FRETE (INTEGRAÇÃO V5.2)  
    const cepInput = document.getElementById('cep-input');  
    const enderecoAuto = document.getElementById('endereco-auto');  
    const isRetirarLocal = document.getElementById('retirar-local')?.checked;  
      
    const cepValue = cepInput ? cepInput.value.trim().replace(/\D/g, '') : '';  
    let deliveryFee = DELIVERY_FEE_DEFAULT;   
  
    // --- LÓGICA DE FRETE CORRIGIDA ---  
    if (isRetirarLocal || subtotal >= LIMITE_PARA_FRETE_GRATIS_POR_VALOR) {  
        // Frete Grátis se: 1. Retirar no Local OU 2. Atingir Limite de Valor  
        deliveryFee = 0;  
    } else if (cepInput && cepValue.length === 8 && enderecoAuto && enderecoAuto.value) {  
        // Cálculo de Frete Dinâmico (só se houver um CEP e endereço válidos)  
        const enderecoCompleto = enderecoAuto.value.trim();  
  
        try {  
            // A função getDynamicDeliveryFee agora espera o endereço completo para extrair o bairro  
            // O getDynamicDeliveryFee foi movido para fora do DOMContentLoaded para não ser duplicado
            deliveryFee = await getDynamicDeliveryFee(enderecoCompleto);   
        } catch(e) {  
            console.error("Erro no cálculo do frete dinâmico:", e);  
            deliveryFee = DELIVERY_FEE_DEFAULT;  
        }  
    } else {  
        // Frete padrão se não for retirar, não atingir o limite e não tiver CEP válido buscado  
        deliveryFee = DELIVERY_FEE_DEFAULT;  
    }  
    // --- FIM DA LÓGICA DE FRETE CORRIGIDA ---  
  
  
    // Se o cupom der Frete Grátis, ele anula a taxa calculada acima  
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
      // Aqui a chamada é feita internamente, então a checagem 'if (!isFirebaseInitialized)' no início da função 'inicializarFirebase' é suficiente.  
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
  
  /* =========================================================  
   🔥 CHAMADAS DE INICIALIZAÇÃO DE FIREBASE (REMOVIDAS)  
   ========================================================= */  
  
  /* =========================================================  
    🔥 FUNÇÃO FECHAR PEDIDO (INTEGRADA COM CEP)  
    =========================================================  
  */  
  async function fecharPedido() {  
    if (!cart.length) return alert("Carrinho vazio!");  
    if (!currentUser) {  
      alert("Faça login para enviar o pedido!");  
      Overlays.open(el.loginModal);  
      return;  
    }  
  
    // NOVOS CAMPOS PARA LEITURA (DO FORMULÁRIO ESTRUTURADO)  
    const cepInput = document.getElementById('cep-input');  
    const autoRuaBairro = document.getElementById("endereco-auto");   
    const autoNumero = document.getElementById("numero-input");   
    const autoComp = document.getElementById("complemento-input");   
    const isRetirarLocal = document.getElementById('retirar-local')?.checked;  
      
    // Leitura segura dos valores  
    const ruaBairroValue = autoRuaBairro ? autoRuaBairro.value.trim() : '';  
    const numeroValue = autoNumero ? autoNumero.value.trim() : '';  
    const compValue = autoComp ? autoComp.value.trim() : '';  
    const cepValue = cepInput ? cepInput.value.trim().replace(/\D/g, '') : '';  
      
    let finalAddressString = "";  
  
    // 1. Tenta validar o modo ViaCEP (Campos estruturados)  
    if (ruaBairroValue && numeroValue) {  
        finalAddressString = `${ruaBairroValue}, N° ${numeroValue}`;  
        if (compValue) finalAddressString += `, Comp: ${compValue}`;  
        if (cepValue.length === 8) finalAddressString += ` | CEP: ${cepValue}`;  
    }  
  
    // 2. Checagem de Falha OU Retirada no Local  
    if (isRetirarLocal) {  
        finalAddressString = "CLIENTE IRÁ RETIRAR NO LOCAL"; // Retirada não precisa de endereço  
    } else if (!finalAddressString) {  
        alert("Preencha o CEP, endereço e número, ou marque 'Retirar no Local' para finalizar.");  
        return;   
    }  
      
    const addr = finalAddressString;  
  
    const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();  
  
    const pedido = {  
      usuario: currentUser.email,  
      userId: currentUser.uid,  
      nome: currentUser.displayName || currentUser.email.split("@")[0],  
        
      itens: cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"),  
      itensObj: cart.map(i => ({ nome: i.nome, preco: i.preco, qtd: i.qtd })),  
        
      subtotal: Number(subtotal.toFixed(2)),  
      entrega: Number(delivery.toFixed(2)),  
      desconto: Number(discount.toFixed(2)),  
      cupom: couponApplied || "",  
      total: Number(total.toFixed(2)),  
      endereco: addr,  
      data: new Date().toISOString(),  
        
      // 🚨 CORREÇÃO FINAL: Salva o thumb como vazio. O extras.js que definirá a imagem.  
      thumb: ''   
    };  
  
    try {  
      const batch = db.batch();  
      const userId = currentUser.uid;  
      const usuarioRef = db.collection("Usuarios").doc(userId);  
        
      if (cupomInfo.isPersonalizado && couponApplied) {  
          const cupomUserRef = db.collection("CuponsUsuarios").doc(userId);  
          batch.update(cupomUserRef, {  
              usado: true,  
              dataUso: firebase.firestore.FieldValue.serverTimestamp(),  
              pedidoId: 'PENDENTE'   
          });  
      }  
  
      const pedidoRef = db.collection("Pedidos").doc();  
      batch.set(pedidoRef, pedido);  
        
      batch.set(usuarioRef, {  
          email: currentUser.email,  
          pedidosFeitos: firebase.firestore.FieldValue.increment(1)   
      }, { merge: true });   
        
      await batch.commit();  
  
      if (cupomInfo.isPersonalizado && couponApplied) {  
          await db.collection("CuponsUsuarios").doc(userId).update({  
              pedidoId: pedidoRef.id  
          });  
      }  
  
      // --- LÓGICA DE RECOMPENSA (Mantida do v4.3) ---  
      const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();  
      const doc = await usuarioRef.get();  
      const data = doc.data() || { pedidosFeitos: 0, recompensaNivel: 0 };  
      const feitos = data.pedidosFeitos;  
      const nivelAtual = data.recompensaNivel;  
        
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
            
          await usuarioRef.update({  
              recompensaNivel: novoNivel,  
              ultimaRecompensa: recompensaAtingida.id  
          });  
            
          if (recompensaAtingida.tipo === 'cupom') {  
               await db.collection("CuponsUsuarios").doc(userId).set(itemLiberado, { merge: true });  
          }  
  
          await db.collection("Usuarios").doc(userId)  
                  .collection("RecompensasRecebidas").add(itemLiberado);  
  
          // POPUP ATUALIZADO E PROTEGIDO  
          const nomeNivel = String(recompensaAtingida.titulo || recompensaAtingida.valor || '');  
          const msg = `🎉 Parabéns! Você alcançou o nível ${nomeNivel} ${getTierIcon(nomeNivel)} e ganhou o cupom: ${recompensaAtingida.valor}`;  
          mostrarPopupRecompensa(msg);  
            
          configuracoesRecompensa = null;   
          _cupomCache = {};   
      }  
        
      popupAdd("Pedido salvo ✅");  
      try { sound.currentTime = 0; sound.play(); } catch (_) {}  
  
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
        
      renderMiniCart();  
      Overlays.closeAll();  
  
    } catch (err) {  
      console.error("Erro ao fechar pedido:", err);  
      alert(`Ocorreu um erro ao finalizar seu pedido. Detalhe: ${err.message}`);  
    }  
  }  
  renderMiniCart();  
    
/* ------------------ 📦 MEUS PEDIDOS PREMIUM ------------------ */  
  
  el.pedidosBtn?.addEventListener("click", () => {  
    if (!currentUser) {  
      alert("Faça login para ver seus pedidos.");  
      Overlays.open(el.loginModal);   
      return;  
    }  
    // CORREÇÃO CRÍTICA: REMOVER CHAMADA DUPLICADA  
    Overlays.open(el.pedidosPanel);  
    carregarPedidos(currentUser.uid);   
  });  
  
  el.pedidosFecharBtn?.addEventListener("click", () => Overlays.closeAll());  
  
  async function carregarPedidos(userId) {  
    if (!el.pedidosLista) return;  
    el.pedidosLista.innerHTML = `<p class="empty-orders">Carregando pedidos...</p>`;  
  
    try {  
      const q = db.collection("Pedidos").where("userId", "==", userId).orderBy("data", "desc");  
      const snapshot = await q.get();  
  
      if (snapshot.empty) {  
        el.pedidosLista.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado 😢</p>`;  
        return;  
      }  
  
      // CORREÇÃO: Usando .map para garantir a estrutura correta para 'pedidos'  
      const pedidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));  
      exibirPedidos(pedidos);  
  
    } catch (err) {  
      console.error("Erro ao carregar pedidos: ", err);  
      el.pedidosLista.innerHTML = `<p class="empty-orders" style="color:red;">Erro ao buscar seus pedidos.</p>`;  
    }  
  }  
  
  function exibirPedidos(pedidos) {  
    if (!el.pedidosLista) return;  
      
    el.pedidosLista.innerHTML = pedidos.map(p => {  
      // O 'p.thumb' será vazio ou terá um valor se você o salvar assim  
      const thumbUrl = p.thumb || '';   
      const dataFormatada = p.data  
          ? new Date(p.data?.seconds * 1000 || p.data).toLocaleString("pt-BR", {  
              day: "2-digit", month: "2-digit", year: "numeric",  
              hour: "2-digit", minute: "2-digit",  
            })  
          : "—";  
  
      const podeRepetir = Array.isArray(p.itensObj) && p.itensObj.length > 0;  
        
      // 🚨 CORREÇÃO DE EXIBIÇÃO DE ITENS:   
      // 1. Tenta usar p.itens (a lista formatada), que deve ser um array de strings (corrigido anteriormente).  
      // 2. Se for vazio ou string, usa p.itensObj para RECONSTRUIR a lista (mais seguro).  
      const itensParaExibir = (Array.isArray(p.itens) && p.itens.length > 0) ? p.itens.join('<br>') :   
                             (p.itensObj && p.itensObj.length > 0) ? p.itensObj.map(i => `• ${i.nome} x${i.qtd}`).join('<br>') :   
                             '• Sem itens registrados no pedido'; // Fallback final  
  
      return `  
        <div class="pedido-card">  
          <div class="pedido-thumb" style="background-image:url('${thumbUrl}');"></div>  
          <h4>📅 ${dataFormatada}</h4>  
          <p class="pedido-info">Total: ${money(p.total)}</p>  
          <div class="pedido-itens">  
            ${itensParaExibir}  
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
    
  el.pedidosLista?.addEventListener('click', async (e) => {  
    if (e.target.classList.contains('repetir-btn') && !e.target.disabled) {  
      const idPedido = e.target.dataset.id;  
      e.target.disabled = true;  
      e.target.textContent = "Carregando...";  
      await repetirPedido(idPedido);  
    }  
  });  
  
  async function repetirPedido(idPedido) {  
    try {  
      const docRef = db.collection("Pedidos").doc(idPedido);  
      const doc = await docRef.get();  
  
      if (!doc.exists) return alert("Erro: Pedido antigo não encontrado.");  
  
      const pedido = doc.data();  
      const itensParaRepetir = pedido.itensObj;   
  
      if (!Array.isArray(itensParaRepetir) || itensParaRepetir.length === 0) {  
        return alert("Não é possível repetir este pedido.");  
      }  
  
      cart = [];  
      itensParaRepetir.forEach(item => {  
        if (item.nome && item.preco > 0 && item.qtd > 0) {  
          cart.push({ nome: item.nome, preco: item.preco, qtd: item.qtd });  
        }  
      });  
        
      couponApplied = "";  
      localStorage.removeItem("dflCoupon");  
      const couponInput = document.getElementById("coupon-input");  
      if(couponInput) couponInput.value = "";  
  
      popupAdd("Pedido anterior adicionado ao carrinho!");  
      renderMiniCart();   
      Overlays.closeAll();   
      Overlays.open(el.miniCart);   
  
    } catch (err) {  
      console.error("Erro ao repetir pedido: ", err);  
      alert("Erro ao processar seu pedido.");  
    }  
  }  
  
/* =========================================================  
   🎁 MINHAS RECOMPENSAS (ANTI-CRASH: DADOS PROTEGIDOS)  
========================================================= */  
async function carregarRecompensas(userId) {  
      
    // CORREÇÃO CRÍTICA: REMOVER CHAMADA DUPLICADA  
    if (!isFirebaseInitialized) return;  
  
    const contadorValor = document.getElementById('contador-valor');  
    const progressoBar = document.getElementById('progresso-bar');  
    const progressoMsg = document.getElementById('progresso-mensagem');  
      
    // 🚨 AJUSTE DE LIMPEZA: Garante que os containers estejam prontos e limpos  
    if (!contadorValor || !progressoBar || !progressoMsg || !el.recompensasLista) return;   
  
    contadorValor.textContent = '...';  
    progressoBar.style.width = '0%';  
    progressoMsg.textContent = 'Carregando metas...';  
      
    el.recompensasLista.innerHTML = '';   
    // Garante que o histórico seja limpo antes de recarregar  
    if(el.historicoLista) el.historicoLista.innerHTML = `<p class="empty-orders" style="text-align:center;color:#999;">Carregando...</p>`;   
      
    const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();  
  
    if (RECOMPENSAS_DATA.length === 0) {  
        progressoMsg.textContent = 'Erro ao carregar metas.';  
        el.recompensasLista.innerHTML = `<p class="empty-orders" style="text-align:center;color:red;">Sistema de fidelidade offline.</p>`;  
        return;   
    }  
      
    const metaPrimeiroNivel = RECOMPENSAS_DATA[0]?.limite || 1;   
  
    // O onSnapshot agora deve ser o único responsável por injetar os dados de progresso  
    db.collection('Usuarios').doc(userId).onSnapshot(async doc => {  
          
        el.recompensasLista.innerHTML = '';   
        if(el.historicoLista) el.historicoLista.innerHTML = '';   
  
        const data = doc.data() || { pedidosFeitos: 0, recompensaNivel: 0 };  
        const feitos = data.pedidosFeitos;  
        const nivelAtual = data.recompensaNivel;  
          
        let cupomStatus = null;  
        const recompensaAtual = RECOMPENSAS_DATA.find(r => r.limite === nivelAtual * metaPrimeiroNivel);  
          
        if (recompensaAtual && recompensaAtual.tipo === 'cupom') {  
            const cupomSnap = await db.collection('CuponsUsuarios').doc(userId).get();  
            cupomStatus = cupomSnap.exists ? cupomSnap.data() : null;  
        }  
  
        const proximaRecompensa = RECOMPENSAS_DATA.find(r => r.limite > feitos);  
        const metaParaExibir = proximaRecompensa ? proximaRecompensa.limite : feitos;   
        const metaBaseCalculo = proximaRecompensa ? proximaRecompensa.limite : metaPrimeiroNivel;  
  
        const porcentagem = proximaRecompensa === undefined ? 100 : Math.min(100, (feitos / metaBaseCalculo) * 100);  
              
        // 🚨 CORREÇÃO DE EXIBIÇÃO: Atualiza o contador de pedidos feitos  
        contadorValor.textContent = feitos;  
          
        const elMeta = document.querySelector('.progress-container span:last-child');  
        if(elMeta) elMeta.textContent = metaParaExibir;  
  
        progressoBar.style.width = `${porcentagem}%`;  
  
        if (proximaRecompensa) {  
            const faltam = proximaRecompensa.limite - feitos;  
            const tituloRecompensa = proximaRecompensa.titulo || proximaRecompensa.valor;  
            progressoMsg.textContent = `Faltam apenas ${faltam} pedidos para ganhar: ${tituloRecompensa}!`;  
              
            progressoBar.style.background = 'linear-gradient(90deg, #ffb300, #ff7043)';   
            progressoBar.parentElement.parentElement.removeAttribute('data-status');  
              
            const recompensasObtidas = RECOMPENSAS_DATA.filter(r => r.limite <= feitos);  
            exibirRecompensas(feitos, recompensasObtidas, cupomStatus, RECOMPENSAS_DATA);   
  
            if (recompensasObtidas.length === 0) {  
                 el.recompensasLista.innerHTML = `<p class="empty-orders" style="text-align:center;color:#666;margin-top:20px;">Faça ${faltam} pedidos para desbloquear a primeira recompensa.</p>`;  
            }  
  
        } else {  
            progressoMsg.textContent = '🎉 Parabéns! Você completou todas as metas!';  
            progressoBar.style.background = 'linear-gradient(90deg, #4caf50, #43a047)';   
            progressoBar.parentElement.parentElement.setAttribute('data-status', 'complete');  
            exibirRecompensas(feitos, RECOMPENSAS_DATA, cupomStatus, RECOMPENSAS_DATA);  
        }  
          
        await carregarHistoricoRecompensas(userId);  
          
    }, error => {  
        console.error("Erro ao ler contador:", error);  
        progressoMsg.textContent = 'Erro ao ler progresso.';  
        // Fallback visual para o contador  
        contadorValor.textContent = '0';  
        const elMeta = document.querySelector('.progress-container span:last-child');  
        if(elMeta) elMeta.textContent = metaPrimeiroNivel; // Mostra a meta inicial  
    });  
}  
  
function exibirRecompensas(pedidosFeitos, recompensasDisponiveis, cupomStatus, RECOMPENSAS_DATA) {  
    if (!el.recompensasLista) return;  
      
    // 🚨 CORREÇÃO CRÍTICA AQUI: Garante que recompensasDisponiveis seja um array antes de mapear  
    const recompensasHtml = (Array.isArray(recompensasDisponiveis) ? recompensasDisponiveis : []).map(r => {  
        const liberada = pedidosFeitos >= r.limite;  
        const cupomJaUsado = cupomStatus?.usado === true && cupomStatus?.cupom === r.valor;  
        // Anti-Crash: Converte o título para string  
        const tituloRaw = String(r.titulo || r.valor || '');  
        const titulo = r.titulo || `Recompensa: ${r.valor}`;  
          
        let acaoBtn = '';  
        let statusTag = '';  
        let cardStyle = '';  
        let codigoCupom = r.valor ? r.valor : 'BRINDE';  
  
          
        // --- ÍCONES EMOJI (ANTI-CRASH: DETECÇÃO SEGURA) ---  
        let icon = '🎁';  
        const tituloLower = tituloRaw.toLowerCase(); // Agora seguro porque convertemos pra string antes  
          
        if (tituloLower.includes('ouro') || tituloLower.includes('platina') || tituloLower.includes('diamante')) {  
             icon = getTierIcon(tituloRaw);  
        } else if (r.tipo === 'cupom') {  
             icon = '🎟️';  
        } else if (r.tipo === 'brinde') {  
             icon = '🍔';  
        }  
          
        if (cupomJaUsado) {  
             statusTag = '<span style="color:#d32f2f;font-weight:bold;">(USADO)</span>';  
             acaoBtn = `<button disabled style="background:#ccc;color:#666;border:none;border-radius:6px;padding:8px;cursor:not-allowed;margin-top:5px;">Usado</button>`;  
             cardStyle = 'opacity: 0.7;';  
        }  
        else if (liberada && r.tipo === 'cupom') {  
            statusTag = '<span style="color:#4caf50;font-weight:bold;">(DISPONÍVEL)</span>';  
            acaoBtn = `<button class="recompensa-aplicar-btn" data-cupom="${codigoCupom}" style="background:#4caf50;color:#fff;border:none;border-radius:6px;padding:8px 12px;cursor:pointer;font-weight:600;margin-top:5px;">Aplicar Cupom 🏷️</button>`;  
        } else if (liberada && r.tipo === 'brinde') {  
             statusTag = '<span style="color:#1976D2;font-weight:bold;">(LIBERADO)</span>';  
             acaoBtn = `<button disabled style="background:#1976D2;color:#fff;border:none;border-radius:6px;padding:8px;cursor:default;margin-top:5px;">Peça no Balcão</button>`;  
        }  
          
        // --- EXIBIÇÃO DE CUPOM ---  
        const mostrarCupom = (r.valor && !String(r.valor).includes('Nível'));  
          
        return `  
            <div class="recompensa-card" style="display:flex;align-items:center;padding:15px;border-radius:10px;margin-bottom:10px;background:#f9f9f9;box-shadow:0 2px 5px rgba(0,0,0,0.1);${cardStyle}">  
                <div style="font-size:2rem; margin-right:15px;">${icon}</div>  
                <div style="flex:1;">  
                    <h4 style="margin:0 0 5px 0;color:#333;">${titulo} ${statusTag}</h4>  
                    <p style="margin:0;font-size:0.9rem;color:#666;">Meta: ${r.limite} Pedidos</p>  
                    ${mostrarCupom ? `<b style="color:#4caf50;display:block;margin-top:4px;">CUPOM: ${codigoCupom}</b>` : ''}  
                </div>  
                <div>${acaoBtn}</div>  
            </div>  
        `;  
    }).join('');  
      
    el.recompensasLista.innerHTML = recompensasHtml;  
      
    el.recompensasLista.querySelectorAll('.recompensa-aplicar-btn').forEach(btn => {  
        btn.addEventListener('click', (e) => {  
            const codigo = e.currentTarget.dataset.cupom;  
            if (codigo) {  
                couponApplied = codigo;  
                localStorage.setItem("dflCoupon", couponApplied);  
                const couponInput = document.getElementById("coupon-input");  
                if(couponInput) couponInput.value = codigo;  
                renderMiniCart();   
                Overlays.closeAll();  
                popupAdd(`Cupom ${codigo} aplicado! ✅`);  
                Overlays.open(el.miniCart);   
            }  
        });  
    });  
}  
  
async function carregarHistoricoRecompensas(userId) {  
    if (!el.historicoLista) return;  
    el.historicoLista.innerHTML = `<p class="empty-orders" style="text-align:center;color:#999;">Carregando...</p>`;  
    try {  
        const q = db.collection("Usuarios").doc(userId)  
                    .collection("RecompensasRecebidas")  
                    .orderBy("liberadoEm", "desc");  
        const snapshot = await q.get();  
  
        if (snapshot.empty) {  
            el.historicoLista.innerHTML = `<p class="empty-orders" style="text-align:center;color:#999;">Nenhuma recompensa no histórico.</p>`;  
            return;  
        }  
  
        const logs = snapshot.docs.map(doc => doc.data());  
          
        const historicoHtml = logs.map(log => {  
            const dataRecebimento = log.liberadoEm  
                ? (log.liberadoEm.toDate().toLocaleDateString('pt-BR'))  
                : "—";  
  
            let valorStr = (log.tipo === 'cupom') ? `${log.valor} OFF` : log.valor;  
            if (log.tipo === 'value') valorStr = money(log.valor);  
              
            // --- ANTI-CRASH NO HISTÓRICO TAMBÉM ---  
            const tituloRaw = String(log.titulo || '');  
            const tituloLower = tituloRaw.toLowerCase();  
  
            let icon = '🎁';  
            if (tituloLower.includes('ouro') || tituloLower.includes('platina') || tituloLower.includes('diamante')) {  
                 icon = getTierIcon(tituloRaw);  
            } else if (log.tipo === 'cupom') {  
                 icon = '🎟️';  
            }  
  
            return `  
                <div class="historico-card" style="display:flex; padding: 10px 0; border-bottom: 1px dashed #eee; align-items: center; justify-content: space-between;">  
                    <div style="flex:1;">  
                        <p style="font-weight:600; margin:0; color:#333;">${icon} ${log.titulo || log.valor}</p>  
                        <small style="color:#999;">${dataRecebimento}</small>  
                    </div>  
                    <span style="font-weight:700; color:#4caf50;">Recebido</span>  
                </div>  
            `;  
        }).join('');  
          
        el.historicoLista.innerHTML = historicoHtml.replace(/border-bottom: 1px dashed #eee;<\/div>$/, 'border-bottom: none;</div>');  
  
    } catch (err) {  
        console.error("Erro histórico:", err);  
        el.historicoLista.innerHTML = `<p class="empty-orders" style="color:red;">Erro.</p>`;  
    }  
}  
  
  el.recompensasBtn?.addEventListener("click", () => {  
    if (!currentUser) { alert("Faça login!"); Overlays.open(el.loginModal); return; }  
    // CORREÇÃO CRÍTICA: REMOVER CHAMADA DUPLICADA  
    Overlays.open(el.recompensasPanel);  
    carregarRecompensas(currentUser.uid);   
  });  
  
  el.recompensasFecharBtn?.addEventListener("click", () => Overlays.closeAll());  
  
  /* =========================================================  
     📊 ADMIN DASHBOARD (MANTIDO)  
  ========================================================= */  
  const ADMINS = [ "alefejohsefe@gmail.com", "kalebhstanley650@gmail.com", "contato@dafamilialanches.com.br" ];  
  function isAdmin(user) { return user && user.email && ADMINS.includes(user.email.toLowerCase()); }  
  
  let chartPedidos = null;  
  let chartProdutos = null;  
  
  function ensureChartJS(cb) {  
    if (window.Chart) return;  
    const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/chart.js"; s.onload = cb; document.head.appendChild(s);  
  }  
  
  function createDashboard() {  
    if (document.getElementById("admin-dashboard")) return;  
    const div = document.createElement("div");  
    div.id = "admin-dashboard"; div.className = "modal";  
    div.innerHTML = `  
      <div class="modal-content" style="max-width:1000px;width:95%;height:85vh;overflow:auto;background:#fff;border-radius:12px;">  
        <div class="modal-head" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;">  
          <h3>📊 Relatórios</h3><button class="dashboard-close">✖</button>  
        </div>  
        <div class="dashboard-body" style="padding:12px;">  
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">  
            <div id="card-total" class="cardBox">Total: —</div>  
            <div id="card-pedidos" class="cardBox">Pedidos: —</div>  
            <div id="card-ticket" class="cardBox">Ticket Médio: —</div>  
          </div>  
          <div style="margin-bottom:10px;">  
            <label>Período: </label>  
            <select id="filter-period"><option value="7">7 dias</option><option value="30">30 dias</option><option value="all">Todos</option></select>  
          </div>  
          <canvas id="chart-pedidos" style="width:100%;height:240px;"></canvas>  
          <canvas id="chart-produtos" style="width:100%;height:240px;margin-top:16px;"></canvas>  
          <div style="margin-top:12px;"><button id="export-csv" style="background:#4caf50;color:#fff;border:none;border-radius:8px;padding:10px;">Exportar CSV</button></div>  
        </div>  
      </div>`;  
    document.body.appendChild(div);  
    div.querySelector(".dashboard-close").addEventListener("click", () => Overlays.closeAll());  
      
    // REMOVIDO: Estilos básicos do dash (AGORA NO CSS)  
  }  
  
  function createAdminFab() {  
    if (el.reportsBtn) {  
      el.reportsBtn.style.display = "block";  
      el.reportsBtn.addEventListener("click", () => {  
        createDashboard();  
        ensureChartJS(() => carregarRelatorios("7"));  
        Overlays.open(document.getElementById("admin-dashboard"));  
      });  
    }  
  }  
  
  function gerarResumoECharts(pedidos) {  
    if (!window.Chart) return;  
    const ctxPedidos = document.getElementById('chart-pedidos')?.getContext('2d');  
    const ctxProdutos = document.getElementById('chart-produtos')?.getContext('2d');  
    if (!ctxPedidos || !ctxProdutos) return;  
  
    const pedidosPorDia = {};  
    const produtosContagem = {};  
  
    pedidos.forEach(p => {  
      const dia = (p.data?.toDate?.() || new Date(p.data)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });  
      pedidosPorDia[dia] = (pedidosPorDia[dia] || 0) + 1;  
        
      // 🚨 CORREÇÃO CRÍTICA DO TYPE ERROR (map/forEach is not a function)  
      // Garante que 'p.itens' seja um array antes de iterar.  
      const itensArray = Array.isArray(p.itens) ? p.itens : [];  
      itensArray.forEach(itemStr => {  
        const nome = itemStr.split(' x')[0];  
        if (nome) produtosContagem[nome] = (produtosContagem[nome] || 0) + 1;  
      });  
      // --------------------------------------------------------------------  
    });  
  
    const labelsPedidos = Object.keys(pedidosPorDia).reverse();  
    const dataPedidos = Object.values(pedidosPorDia).reverse();  
  
    if (chartPedidos) chartPedidos.destroy();  
    chartPedidos = new Chart(ctxPedidos, {  
      type: 'line',  
      data: { labels: labelsPedidos, datasets: [{ label: 'Pedidos', data: dataPedidos, borderColor: '#ffb300', tension: 0.1 }] },  
      options: {  
        scales: {  
          x: {  
            ticks: {  
              maxRotation: 45, // Máxima rotação de 45 graus para legibilidade  
              minRotation: 45, // Mínima rotação de 45 graus  
            }  
          }  
        }  
      }  
    });  
  
    const produtosOrdenados = Object.entries(produtosContagem).sort(([, a], [, b]) => b - a).slice(0, 10);  
    if (chartProdutos) chartProdutos.destroy();  
    chartProdutos = new Chart(ctxProdutos, {  
      type: 'bar',  
      data: { labels: produtosOrdenados.map(p=>p[0]), datasets: [{ label: 'Mais Vendidos', data: produtosOrdenados.map(p=>p[1]), backgroundColor: '#ff7043' }] },  
      options: { indexAxis: 'y' }  
    });  
  }  
  // --- FUNÇÃO CARREGAR RELATÓRIOS (CORRIGIDA) ---  
  function carregarRelatorios(periodo = "7") {  
    // 1. Lógica de Período  
    const start = new Date();  
    if (periodo !== "all") start.setDate(start.getDate() - Number(periodo)); else start.setTime(0);  
      
    // 2. Busca de Dados  
    db.collection("Pedidos").orderBy("data", "desc").get().then(snap => {  
          
        const pedidos = snap.docs.map(d => {  
            const dataObjeto = d.data();  
              
            // 💥 CORREÇÃO CRÍTICA DO TYPE ERROR (Blindagem de Data)  
            const rawDate = dataObjeto.data;   
            let processedDate;  
  
            // 1. Blindagem: Verifica se rawDate existe e se é um objeto com o método toDate (Timestamp do Firestore)  
            if (rawDate && typeof rawDate.toDate === 'function') {  
                processedDate = rawDate.toDate();  
            }   
            // 2. Blindagem: Se for uma string (ou valor simples), tenta converter para Date.  
            else if (rawDate) {  
                processedDate = new Date(rawDate);  
            } else {  
                // Fallback de segurança caso o campo 'data' esteja faltando  
                processedDate = new Date();   
            }  
  
            return {   
                ...dataObjeto,   
                id: d.id,   
                data: processedDate   
            };  
        });  
  
        const filtrados = pedidos.filter(p => p.data >= start);  
          
        // 3. Processamento e Exibição  
        gerarResumoECharts(filtrados);  
          
        // 🚨 CORREÇÃO DO BUG NaN: Força a conversão para Number.  
        const totalVendido = filtrados.reduce((s, p) => s + (Number(p.total) || 0), 0);  
        document.getElementById("card-total").textContent = `Total: ${money(totalVendido)}`;  
        document.getElementById("card-pedidos").textContent = `Pedidos: ${filtrados.length}`;  
        document.getElementById("card-ticket").textContent = `Ticket Médio: ${money(filtrados.length ? totalVendido/filtrados.length : 0)}`;  
  
        document.getElementById("export-csv").onclick = () => {  
            const csv = "Data;Nome;Total\n" + filtrados.map(p => `${p.data.toLocaleString()};${p.nome};${p.total}`).join("\n");  
            const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });  
            const link = document.createElement('a');  
            link.href = URL.createObjectURL(blob);  
            link.download = "pedidos.csv";  
            link.click();  
        };  
    });  
      
    const sel = document.getElementById("filter-period");  
    if(sel && !sel._bound) { sel.addEventListener("change", e => carregarRelatorios(e.target.value)); sel._bound = true; }  
  }  
// --- FIM DA FUNÇÃO CORRIGIDA ---  
  
  
  /* ------------------ 🍪 COOKIES ------------------ */  
  const cookieBanner = document.getElementById("cookie-banner");  
  const cookieAcceptBtn = document.getElementById("cookie-accept");  
  if (cookieBanner && cookieAcceptBtn) {  
    if (localStorage.getItem("dfl-cookies-accepted") === "true") cookieBanner.style.display = "none";  
    else cookieBanner.classList.add("show");  
    cookieAcceptBtn.addEventListener("click", () => {  
      localStorage.setItem("dfl-cookies-accepted", "true");  
      cookieBanner.classList.remove("show");  
    });  
  }  
    
  console.log("%c🔥 DFL v5.2.8 — Ícones + Segurança Anti-Crash", "background:#4CAF50;color:#fff;padding:5px;border-radius:5px;");  
  
  // Chamada Única de Inicialização (CORREÇÃO DE BUG CRÍTICO)  
  inicializarFirebase();  
    
});   
  
/* FECHAR MODAIS GLOBAL */  
document.addEventListener('DOMContentLoaded', () => {  
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => {  
    if (e.target.classList.contains('modal')) { m.classList.remove('show'); document.getElementById('cart-backdrop').classList.remove('active'); }  
  }));  
  document.getElementById('cart-backdrop')?.addEventListener('click', () => {  
    document.querySelectorAll('.active').forEach(e => e.classList.remove('active'));  
  });  
});
// ============================================================
// FRETE DINÂMICO — V5.2 DEFINITIVA (CORRIGIDA)
// Extrai o bairro corretamente do endereço completo
// Normaliza, tenta match EXATO e depois por palavra-chave
// ============================================================

async function getDynamicDeliveryFee(enderecoCompleto) {
    const DELIVERY_FEE = DELIVERY_FEE_DEFAULT;

    // 1. SE NÃO HOUVER ENDEREÇO, RETORNA FALLBACK
    if (!enderecoCompleto || typeof enderecoCompleto !== "string") {
        console.warn("FW: Endereço vazio, usando fallback.");
        return DELIVERY_FEE;
    }

    // ------------------------------------------------------------
    // 2. EXTRAI O BAIRRO DO FORMATO:
    //    "Rua Netuno - Jardim Andrades (Patos de Minas/MG)"
    // ------------------------------------------------------------

    let bairroExtraido = "";

    try {
        const partePrincipal = enderecoCompleto.split("(")[0].trim(); // remove a cidade

        const partes = partePrincipal.split(" - ");
        // Tenta pegar a parte entre a Rua e o parênteses (ex: "Jardim Andrades")
        bairroExtraido = partes.length > 1 ? partes[1].trim() : partePrincipal.trim();

    } catch (_) {
        console.warn("FW: Falha ao extrair bairro. Usando fallback.");
        return DELIVERY_FEE;
    }

    // ------------------------------------------------------------
    // 3. NORMALIZA O BAIRRO PARA COMPARAÇÃO
    // ------------------------------------------------------------

    const bairroClean = bairroExtraido
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    // ------------------------------------------------------------
    // 4. GARANTE QUE O CACHE FOI CARREGADO DO FIREBASE
    // ------------------------------------------------------------

    try {
        if (isFirebaseInitialized && !deliveryFeesCache) {

            console.warn("FW: Carregando taxas do Firebase (Bairros)...");
            
            // 🚨 CORREÇÃO DE REFERÊNCIA CRÍTICA (Diagnóstico 3): 
            // Agora usa um caminho de documento único e simples.
            const DOC_ID_BAIRROS = "tabelaBairros"; // <-- AJUSTE SE NECESSÁRIO
            
            const snap = await db
                .collection("TaxasDeEntrega")
                .doc(DOC_ID_BAIRROS)
                .get();

            if (!snap.exists) {
                console.warn(`FW: Documento de Bairros '${DOC_ID_BAIRROS}' não encontrado. Fallback.`);
                return DELIVERY_FEE;
            }

            const arr = snap.data()?.data || [];

            // MONTA O CACHE
            deliveryFeesCache = {};

            arr.forEach(item => {
                if (!item || !item.nome) return;

                const key = item.nome
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .trim();

                const valor = Number(item.taxa);

                if (!isNaN(valor) && valor >= 0) {
                    deliveryFeesCache[key] = valor;
                }
            });
        }
    } catch (e) {
        console.warn("FW: Erro ao carregar taxas. Usando fallback.", e);
        return DELIVERY_FEE;
    }

    if (!deliveryFeesCache) return DELIVERY_FEE;

    // ------------------------------------------------------------
    // 5. BUSCA EXATA PELO BAIRRO
    // ------------------------------------------------------------

    if (deliveryFeesCache[bairroClean] !== undefined) {
        console.log(`FW: Match Exato para ${bairroClean}. Taxa: ${deliveryFeesCache[bairroClean]}`);
        return deliveryFeesCache[bairroClean];
    }

    // ------------------------------------------------------------
    // 6. BUSCA "POR PALAVRA-CHAVE" (SUBSTRING)
    //    Exemplo: Jardim Andrades → andrades
    // ------------------------------------------------------------

    const palavras = bairroClean.split(" ");

    for (const palavra of palavras) {
        if (palavra.length < 4) continue; // ignora palavras muito curtas

        for (const key in deliveryFeesCache) {
            if (key.includes(palavra)) {
                console.log(`FW: Match Palavra-Chave '${palavra}' em ${key}. Taxa: ${deliveryFeesCache[key]}`);
                return deliveryFeesCache[key];
            }
        }
    }

    // ------------------------------------------------------------
    // 7. FALLBACK FINAL (pode ser o valor da cidade, se houver, ou o padrão)
    // ------------------------------------------------------------
    console.warn(`FW: Bairro não mapeado (${bairroExtraido}). Fallback R$ ${DELIVERY_FEE}.`);
    return DELIVERY_FEE;
}

// ============================================================
