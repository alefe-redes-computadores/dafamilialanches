/* =========================================================
   🎁 DFL v3.2.0 — IMPLEMENTAÇÃO DO CONTADOR DE RECOMPENSAS
   - Atualiza fecharPedido para incrementar o contador de pedidos
     na coleção 'Usuarios' após um pedido ser finalizado.
   - Baseado na v3.1.0 (Visual Recompensas OK).
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------ ⚙️ BASE ------------------ */
  const sound = new Audio("click.wav");
  let cart = [];
  let currentUser = null;

  const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
  const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };

  // 🔊 Clique com som suave (não bloqueia o site se falhar)
  document.addEventListener("click", () => {
    try { sound.currentTime = 0; sound.play(); } catch (_) {}
  });

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
    recompensasLista: document.getElementById("listaRecompensas")
  };

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
      // v3.1: A lógica de fechar painéis foi movida para Overlays.closeAll
    },
  };

  /* ------------------ 🧩 OVERLAYS ------------------ */
  const Overlays = {
    closeAll() {
      document
        // v3.1: Adicionado .recompensas-panel.active
        .querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show") 
        .forEach((e) => e.classList.remove("show", "active"));
      Backdrop.hide();
    },
    open(modalLike) {
      Overlays.closeAll();
      if (!modalLike) return;
      modalLike.classList.add(
        // v3.1: Adicionado #recompensas-panel
        (modalLike.id === "mini-cart" || modalLike.id === "painelPedidos" || modalLike.id === "recompensas-panel") ? "active" : "show"
      );
      Backdrop.show();
    },
  };
  el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());

  /* =========================================================
    ✨ v3.0: LISTENER DO FORMULÁRIO DE CUPOM (ESTÁTICO)
    Conecta o formulário do index.html ao script.
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
    // A validação real ocorrerá em 'calcTotals'
    couponApplied = val;
    localStorage.setItem("dflCoupon", couponApplied);
    
    // Apenas redesenha o carrinho. 
    // A 'enhanceMiniCartUI' mostrará a mensagem de sucesso/erro.
    renderMiniCart(); 
  });
  /* ========================================================= */


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

/* ------------------ 🛒 MINI-CARRINHO (Limpo e Corrigido) ------------------ */
  function renderMiniCart() {
    
    if (!el.miniList) return; 

    const totalItens = cart.reduce((s, i) => s + i.qtd, 0);
    if (el.cartCount) el.cartCount.textContent = totalItens;

    if (!cart.length) {
      el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';
      
      // v3.0: Limpa também o rodapé dinâmico e estático
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


  /* 🔄 Vincula botões dinâmicos (incremento, remoção, limpar, finalizar) */
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
     ✨ v3.0: HOOK ÚNICO DO RENDERMINICART
     Este é o "hook" (wrapper) que garante que a UI do rodapé
     (enhanceMiniCartUI) seja chamada APÓS a lista de itens
     ser desenhada (pela _renderMiniCartOrig).
     v3.0.2: Removido hook duplicado que estava no fim do arquivo.
    =========================================================
  */
  const _renderMiniCartOrig = renderMiniCart;
  renderMiniCart = function () {
    _renderMiniCartOrig(); // 1. Desenha a lista de itens (síncrono)
    bindMiniCartButtons(); // 2. Vincula botões da lista (síncrono)
    
    // 3. Dispara a atualização do rodapé (assíncrono)
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

  try {
    if (!window.firebase) {
      throw new Error("Biblioteca principal do Firebase (app) não carregou.");
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    if (!firebase.auth) {
      throw new Error("Módulo de Autenticação (auth) não carregou.");
    }
    auth = firebase.auth();
    if (!firebase.firestore) {
      throw new Error("Módulo de Banco de Dados (firestore) não carregou.");
    }
    db = firebase.firestore();

  } catch (error) {
    console.error("ERRO FATAL AO INICIAR FIREBASE:", error);
    const elBody = document.querySelector("body");
    if (elBody) {
       elBody.innerHTML = `<div style="padding:20px;text-align:center;font-size:1.2rem;color:red;font-family:sans-serif;margin-top:50px;">
        <b>Erro Crítico</b><br>Não foi possível conectar aos nossos serviços.
        <br><small>Verifique sua conexão com a internet e tente recarregar a página.</small>
        <br><br><small style="color:#666">Detalhe: ${error.message}</small></div>`;
    }
    return; // ABORTA O RESTO DO SCRIPT.JS
  }

  /* ------------------ ⚙️ LOGIN ------------------ */
  el.userBtn?.addEventListener("click", () => Overlays.open(el.loginModal));
  document.querySelectorAll("#login-modal .login-close").forEach(btn =>
    btn.addEventListener("click", () => Overlays.closeAll())
  );

  el.loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email")?.value?.trim();
    const senha = document.getElementById("login-senha")?.value?.trim();
    if (!email || !senha) return alert("Preencha e-mail e senha.");

    auth.signInWithEmailAndPassword(email, senha)
      .then((cred) => {
        currentUser = cred.user;
        popupAdd("Login realizado com sucesso!");
        Overlays.closeAll();
      })
      .catch((err) => {
        if (err.code === "auth/user-not-found") {
          if (confirm("Conta não encontrada. Deseja criar uma nova?")) {
            auth.createUserWithEmailAndPassword(email, senha)
              .then((cred) => {
                currentUser = cred.user;
                popupAdd("Conta criada com sucesso! 🎉");
                Overlays.closeAll();
              })
              .catch((e) => alert("Erro: " + e.message));
          }
        } else if (err.code === "auth/wrong-password") {
          alert("Senha incorreta. Tente novamente.");
        } else {
          alert("Erro: ".concat(err.message));
        }
      });
  });

  el.googleBtn?.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then((res) => {
        currentUser = res.user;
        popupAdd("Login com Google realizado! ✅");
        Overlays.closeAll();
      })
      .catch((err) => alert("Erro: ".concat(err.message)));
  });

  /* ------------------ ➕ Adicionais ------------------ */
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
      <label class="extra-line">
        <span>${a.nome} — <b>${money(a.preco)}</b></span>
        <input type="checkbox" value="${i}">
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

  /* ------------------ 🥤 Combos (modal de bebidas) ------------------ */
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
      <label class="extra-line">
        <span>${o.rotulo} — + ${money(o.delta)}</span>
        <input type="radio" name="combo-drink" value="${i}" ${i === 0 ? "checked" : ""}>
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

  /* ------------------ 🧺 Adicionar item comum ------------------ */
  function addCommonItem(nome, preco) {
    // Se for um combo do *cardápio principal* (mas não uma "Promo"), abre o modal de bebida
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

  /* ------------------ 🛒 ABRIR CARRINHO ------------------ */
  el.cartIcon?.addEventListener("click", () => {
    renderMiniCart();
    Overlays.open(el.miniCart);
  });
  document.querySelectorAll("#mini-cart .extras-close").forEach((b) =>
    b.addEventListener("click", () => Overlays.closeAll())
  );


/* ------------------ ⚙️ CONFIGURAÇÕES V3.0 ------------------ */
  const DELIVERY_FEE = 6.00; 

  /* =========================================================
    ✨ v3.0: CUPONS REMOVIDOS
    O objeto local 'COUPONS' foi removido.
    =========================================================
  */

  let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();
  let addressValue  = (localStorage.getItem("dflAddress") || "").trim();

  const getCartSubtotal = () =>
    cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);

  /* =========================================================
    ✨ v3.0: FUNÇÃO REMOVIDA
    'calcDiscount' foi removida.
    =========================================================
  */

  /* =========================================================
    ✨ v3.0.1: NOVA FUNÇÃO DE VALIDAÇÃO (CACHE + TOLERÂNCIA)
    Substitui a 'validarCupomFirestore' original da v3.0.
    =========================================================
  */
  // --- Substitua sua validarCupomFirestore por esta versão com cache e tolerâncias ---
  const _cupomCache = { /* key -> { ate: ms, res: {...} } */ };
  function _cacheKey(codigo, subtotal){
    // agrupa subtotal em faixas de R$ 5 para melhorar reaproveitamento sem “errar” o valor
    const faixa = Math.floor((subtotal || 0) / 5);
    return `${(codigo||"").toUpperCase()}::${faixa}`;
  }

  async function validarCupomFirestore(codigo, subtotal) {
    const code = (codigo || "").toUpperCase();
    const invalido = { valido:false, discount:0, freeShipping:false, label:"", mensagem:"" };
    if (!code) return invalido;

    // 1) Cache leve por 30s
    const key = _cacheKey(code, subtotal);
    const now = Date.now();
    const hit = _cupomCache[key];
    if (hit && hit.ate > now) return hit.res;

    try {
      const cupomSnap = await db.collection("Cupons").doc(code).get();
      if (!cupomSnap.exists) {
        const res = { ...invalido, mensagem: "Cupom inválido." };
        _cupomCache[key] = { ate: now + 30000, res }; // 30s de cache
        return res;
      }

      const data = cupomSnap.data();

      // 2) Ativo
      if (!data.ativo) {
        const res = { ...invalido, mensagem: "Este cupom não está mais ativo." };
        _cupomCache[key] = { ate: now + 30000, res };
        return res;
      }

      // 3) Expiração (aceita Timestamp ou string ISO)
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

      // 4) Cálculo
      let discount = 0;
      let freeShipping = false;
      let label = "";

      if (data.tipo === "percent") {
        discount = Math.max(0, subtotal * (Number(data.valor) / 100));
        label = `${Number(data.valor)}% OFF`;
      } else if (data.tipo === "value") {
        const val = Math.max(0, Number(data.valor) || 0);
        discount = Math.min(subtotal, val);
        label = `R$ ${val.toFixed(2).replace(".", ",")} OFF`;
      } else if (data.tipo === "frete") {
        freeShipping = true;
        label = "Frete Grátis";
      } else {
        // Fallback caso o 'tipo' seja inválido no DB
        const res = { ...invalido, mensagem: "Tipo de cupom desconhecido." };
        _cupomCache[key] = { ate: now + 30000, res };
        return res;
      }

      const res = { valido:true, discount, freeShipping, label, mensagem:"Cupom aplicado com sucesso!" };
      _cupomCache[key] = { ate: now + 30000, res };
      return res;

    } catch (err) {
      console.error("Erro ao validar cupom no Firestore:", err);
      // Erro de permissão ou rede cai aqui
      return { ...invalido, mensagem: "Erro ao processar o cupom." };
    }
  }

  /* =========================================================
    ✨ v3.0: FUNÇÃO 'calcTotals' AGORA É ASYNC
    =========================================================
  */
  async function calcTotals() {
    const subtotal = getCartSubtotal();
    
    // 'd' (discountInfo) agora vem do Firestore e precisa de 'await'
    const d = await validarCupomFirestore(couponApplied, subtotal); 
    
    const delivery = d.freeShipping ? 0 : DELIVERY_FEE;
    const total = Math.max(0, subtotal + delivery - d.discount);
    
    return {
      subtotal,
      delivery,
      discount: d.discount,
      discountLabel: d.label,
      total,
      cupomInfo: d // Passa a info completa (valido, mensagem)
    };
  }

  /* =========================================================
    ✨ v3.0: UI DO CARRINHO (ASYNC E CONECTADA)
    Substitui a 'enhanceMiniCartUI' antiga.
    =========================================================
  */
  async function enhanceMiniCartUI() {
    if (!el.miniFoot) return;
    
    // Pega os elementos do cupom que JÁ EXISTEM no HTML
    const couponMsg = document.getElementById("coupon-message");
    const couponDiscountRow = document.getElementById("coupon-discount-row");
    const cartDiscount = document.getElementById("cart-discount");

    // Remove o resumo antigo (Subtotal, Total, Botões) antes de recalcular
    // v3.0.2: Esta é a linha que impede a duplicação.
    el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());
    
    if (cart.length === 0) {
      // Se o carrinho está vazio, já limpamos a lista.
      // Agora limpamos a UI de cupom.
      if (couponMsg) couponMsg.innerHTML = "";
      if (couponDiscountRow) couponDiscountRow.style.display = "none";
      return; 
    }

    // 1. CALCULA TOTAIS (AGORA É ASYNC)
    const { subtotal, delivery, discount, discountLabel, total, cupomInfo } = await calcTotals();

    // 2. ATUALIZA MENSAGEM DO CUPOM (UI ESTÁTICA)
    if (couponMsg) {
      couponMsg.textContent = cupomInfo.mensagem;
      couponMsg.className = `coupon-message ${cupomInfo.valido ? 'success' : 'error'}`;
      
      // Se o cupom era inválido, mas não estava vazio, limpa ele
      if (!cupomInfo.valido && couponApplied) {
         couponApplied = "";
         localStorage.removeItem("dflCoupon");
         // Atualiza o valor do input se ele não estiver focado
         const couponInput = document.getElementById("coupon-input");
         if (couponInput && document.activeElement !== couponInput) {
           couponInput.value = "";
         }
      }
    }

    // 3. ATUALIZA LINHA DE DESCONTO (UI ESTÁTICA)
    if (couponDiscountRow && cartDiscount) {
      if (discount > 0 || discountLabel) {
        cartDiscount.textContent = `- ${money(discount)} ${discountLabel ? `(${discountLabel})` : ""}`;
        couponDiscountRow.style.display = "flex";
      } else {
        couponDiscountRow.style.display = "none";
      }
    }
    
    // 4. GERA O RESTO DO HTML (SUBTOTAL, TOTAL, BOTÕES)
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'cart-summary-generated'; // Classe para fácil remoção
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

      <label style="display:block;font-weight:600;margin-bottom:6px;">🏠 Endereço para Entrega</label>
      <textarea id="address-input" rows="2" placeholder="Rua, número, complemento, bairro"
        style="width:100%;border:1px solid #ddd;border-radius:10px;padding:10px;resize:vertical;margin-bottom:10px">${addressValue}</textarea>

      <button id="finish-order" type="button" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:10px;padding:12px;font-weight:700;cursor:pointer;margin-bottom:8px">
        Finalizar Pedido 🛍️
      </button>
      <button id="clear-cart" type="button" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;cursor:pointer">
        Limpar Carrinho
      </button>
    `;
    
    // Adiciona os novos elementos ao rodapé
    el.miniFoot.appendChild(summaryDiv);
    
    // 5. BIND EVENTOS (para os botões que acabamos de criar)
    summaryDiv.querySelector("#address-input")?.addEventListener("input", (e) => {
      addressValue = (e.target.value || "").trim();
      localStorage.setItem("dflAddress", addressValue);
    });

    summaryDiv.querySelector("#finish-order")?.addEventListener("click", fecharPedido);
    summaryDiv.querySelector("#clear-cart")?.addEventListener("click", () => {
      if (confirm("Limpar todo o carrinho?")) {
        cart = [];
        couponApplied = ""; // Limpa o cupom também
        localStorage.removeItem("dflCoupon");
        const couponInput = document.getElementById("coupon-input");
        if(couponInput) couponInput.value = "";
        
        renderMiniCart();
        popupAdd("Carrinho limpo!");
      }
    });
  }

  /* =========================================================
     v3.0.2: BLOCO HOOK REDUNDANTE REMOVIDO DAQUI
     O hook correto já está definido perto da linha 228.
    =========================================================
  */

  /* ------------------ 🖼️ CARROSSEL V2.7 (NOVA LÓGICA) ------------------ */
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

  // 5. Navegação do carrossel principal (mantida)
  el.cPrev?.addEventListener("click", () => {
    if (!el.slides) return;
    el.slides.scrollLeft -= Math.min(el.slides.clientWidth * 0.9, 320);
  });
  el.cNext?.addEventListener("click", () => {
    if (!el.slides) return;
    el.slides.scrollLeft += Math.min(el.slides.clientWidth * 0.9, 320);
  });


  /* ------------------ ⏰ Status + Timer (mantidos) ------------------ */
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

        el.hoursBanner.innerHTML = `🔒 Fechado — Abrimos em <b>${faltamH}h ${faltamM}min</b>`;
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
    ✨ v3.0: 'FECHAR PEDIDO' AGORA É ASYNC
    Para aguardar o 'calcTotals' antes de salvar.
    =========================================================
  */
  async function fecharPedido() {
    if (!cart.length) return alert("Carrinho vazio!");
    if (!currentUser) {
      alert("Faça login para enviar o pedido!");
      Overlays.open(el.loginModal);
      return;
    }

    const addr = (document.getElementById("address-input")?.value || "").trim();
    if (!addr) {
      alert("Informe o endereço para entrega antes de finalizar.");
      document.getElementById("address-input")?.focus();
      return;
    }

    // Espera o cálculo (que agora busca no Firebase)
    const { subtotal, delivery, discount, discountLabel, total } = await calcTotals();

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
      
      thumb: 'imagens/padrao.jpg' 
    };

    // Convertido de .then() para try/catch
    try {
      await db.collection("Pedidos").add(pedido);
      
      popupAdd("Pedido salvo ✅");

      const linhas = [
        "🍔 *Pedido DFL*",
        cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"),
        "",
        `Subtotal: *${money(subtotal)}*`,
        `Entrega: *${money(delivery)}*${couponApplied && discountLabel === "Frete Grátis" ? " _(Frete Grátis)_" : ""}`,
        `Desconto${couponApplied ? ` (${couponApplied})` : ""}: *-${money(discount)}*`,
        `*Total: ${money(total)}*`,
        "",
        `🏠 *Endereço:* ${addr}`
      ].join("\n");

      const texto = encodeURIComponent(linhas);
      window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");

      cart = [];
      couponApplied = ""; // Limpa o cupom ao finalizar
      localStorage.removeItem("dflCoupon");
      const couponInput = document.getElementById("coupon-input");
      if(couponInput) couponInput.value = "";
      
      renderMiniCart();
      Overlays.closeAll();

    } catch (err) {
      alert("Erro: ".concat(err.message));
    }
  }

  // Chama o renderMiniCart uma vez no início para carregar o rodapé
  // caso haja itens no localStorage (a lógica de carregar o 'cart' do localStorage
  // não está aqui, mas se estivesse, esta chamada inicializaria a UI)
  renderMiniCart();
  
/* ------------------ 📦 MEUS PEDIDOS PREMIUM (V2.10) ------------------ */

  // 1. Lógica de abrir/fechar o novo painel
  el.pedidosBtn?.addEventListener("click", () => {
    if (!currentUser) {
      alert("Faça login para ver seus pedidos.");
      Overlays.open(el.loginModal); 
      return;
    }
    Overlays.open(el.pedidosPanel);
    carregarPedidos(currentUser.uid); 
  });

  el.pedidosFecharBtn?.addEventListener("click", () => Overlays.closeAll());

  // 2. Lógica de carregar pedidos (v2.9)
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

      const pedidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      exibirPedidos(pedidos);

    } catch (err) {
      console.error("Erro ao carregar pedidos: ", err);
      el.pedidosLista.innerHTML = `<p class="empty-orders" style="color:red;">Erro ao buscar seus pedidos.</p>`;
    }
  }

  // 3. Lógica de exibir os pedidos no painel (v2.9)
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
  
  // 4. Lógica de "Repetir Pedido" (v2.10 - Lógica Real)
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

/* ------------------ FIM DO BLOCO V2.10 ------------------ */


/* ------------------ 🎁 MINHAS RECOMPENSAS (V3.1 - FASE 5 PARCIAL) ------------------ */

  // 1. Lógica de abrir/fechar o novo painel
  el.recompensasBtn?.addEventListener("click", () => {
    // Requer login, assim como "Meus Pedidos"
    if (!currentUser) {
      alert("Faça login para ver suas recompensas.");
      Overlays.open(el.loginModal); 
      return;
    }
    Overlays.open(el.recompensasPanel);
    // Futuramente, chamaremos a função de carregar recompensas aqui.
    // carregarRecompensas(currentUser.uid); 
  });

  // 2. Lógica de fechar o painel
  el.recompensasFecharBtn?.addEventListener("click", () => Overlays.closeAll());

/* ------------------ FIM DO BLOCO V3.1 ------------------ */


  /* =========================================================
     📊 ADMIN DASHBOARD (V2.5 com Cupom + Frete + Desconto)
  ========================================================= */
  const ADMINS = [
    "alefejohsefe@gmail.com",
    "kalebhstanley650@gmail.com",
    "contato@dafamilialanches.com.br"
  ];

  function isAdmin(user) {
    return user && user.email && ADMINS.includes(user.email.toLowerCase());
  }

  let chartPedidos = null;
  let chartProdutos = null;

  function ensureChartJS(cb) {
    if (window.Chart) return cb();
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js";
    s.onload = cb;
    document.head.appendChild(s);
  }

  function createDashboard() {
    if (document.getElementById("admin-dashboard")) return;

    const div = document.createElement("div");
    div.id = "admin-dashboard";
    div.className = "modal";
    div.innerHTML = `
      <div class="modal-content" style="max-width:1000px;width:95%;height:85vh;overflow:auto;background:#fff;border-radius:12px;">
        <div class="modal-head" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;">
          <h3>📊 Relatórios e Estatísticas</h3>
          <button class="dashboard-close" type="button" style="background:#ff5252;color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer;font-weight:600;">✖</button>
        </div>
        <div class="dashboard-body" style="padding:12px;">
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
            <div id="card-total" class="cardBox">Total Arrecadado: —</div>
            <div id="card-pedidos" class="cardBox">Pedidos: —</div>
            <div id="card-ticket" class="cardBox">Ticket Médio: —</div>
          </div>

          <div style="margin-bottom:10px;">
            <label style="font-weight:600;">Período: </label>
            <select id="filter-period" style="padding:6px 10px;border-radius:6px;border:1px solid #ccc;font-weight:600;">
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="all">Todos</option>
            </select>
          </div>

          <canvas id="chart-pedidos" style="width:100%;height:240px;"></canvas>
          <canvas id="chart-produtos" style="width:100%;height:240px;margin-top:16px;"></canvas>
          <div style="margin-top:12px;">
            <button id="export-csv" type="button" style="background:#4caf50;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-weight:600;cursor:pointer;">📁 Exportar CSV</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(div);

    document.querySelectorAll(".cardBox").forEach(c => {
      Object.assign(c.style, {
        flex: "1", minWidth: "200px", padding: "12px",
        background: "#f9f9f9", borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,.08)"
      });
    });

    div.querySelector(".dashboard-close").addEventListener("click", () => Overlays.closeAll());
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

/* ------------------ 📊 Função dos Gráficos (Corrigida) ------------------ */
  function gerarResumoECharts(pedidos) {
    if (!window.Chart) {
      console.error("Chart.js não está carregado.");
      return;
    }
    
    const ctxPedidos = document.getElementById('chart-pedidos')?.getContext('2d');
    const ctxProdutos = document.getElementById('chart-produtos')?.getContext('2d');

    if (!ctxPedidos || !ctxProdutos) {
      console.error("Elementos <canvas> dos gráficos não encontrados.");
      return;
    }

    // --- Gráfico 1: Pedidos por Dia (Gráfico de Linha) ---
    const pedidosPorDia = {};
    pedidos.forEach(p => {
      const dia = (p.data?.toDate?.() || new Date(p.data)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      pedidosPorDia[dia] = (pedidosPorDia[dia] || 0) + 1;
    });

    const labelsPedidos = Object.keys(pedidosPorDia).sort((a, b) => {
      const [diaA, mesA] = a.split('/');
      const [diaB, mesB] = b.split('/');
      return new Date(`${mesA}/${diaA}/2025`) - new Date(`${mesB}/${diaB}/2025`);
    });
    const dataPedidos = labelsPedidos.map(label => pedidosPorDia[label]);

    if (chartPedidos) {
      chartPedidos.destroy();
    }
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
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Volume de Pedidos por Dia' }
        }
      }
    });

    // --- Gráfico 2: Produtos Mais Vendidos (Gráfico de Barras) ---
    const produtosContagem = {};
    pedidos.forEach(p => {
      (p.itens || []).forEach(itemStr => {
        const parts = itemStr.split(' x');
        const nome = parts[0];
        const qtd = parts.length > 1 ? parseInt(parts[1], 10) : 1;
        
        if (nome) {
          produtosContagem[nome] = (produtosContagem[nome] || 0) + (isNaN(qtd) ? 1 : qtd);
        }
      });
    });

    const produtosOrdenados = Object.entries(produtosContagem)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); 

    const labelsProdutos = produtosOrdenados.map(p => p[0]);
    const dataProdutos = produtosOrdenados.map(p => p[1]);

    if (chartProdutos) {
      chartProdutos.destroy();
    }
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
        indexAxis: 'y',
        responsive: true,
        plugins: {
          title: { display: true, text: 'Top 10 Itens Mais Vendidos' }
        }
      }
    });
  }

/* ------------------ 📊 Carregar Relatórios (V2.5) ------------------ */
  function carregarRelatorios(periodo = "7") {
    const agora = new Date();
    let start = new Date(0);
    if (periodo !== "all") {
      start = new Date(agora);
      start.setDate(start.getDate() - Number(periodo));
    }

    db.collection("Pedidos")
      .orderBy("data", "desc")
      .get()
      .then(snap => {
        const pedidos = snap.docs.map(d => {
          const p = d.data() || {};
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

        const filtrados = pedidos.filter(p => periodo === "all" || (p.data >= start));
        
        gerarResumoECharts(filtrados); 
        
        const totalVendido = filtrados.reduce((s, p) => s + p.total, 0);
        const numPedidos = filtrados.length;
        const ticketMedio = numPedidos > 0 ? totalVendido / numPedidos : 0;
        
        document.getElementById("card-total").textContent = `Total Arrecadado: ${money(totalVendido)}`;
        document.getElementById("card-pedidos").textContent = `Pedidos: ${numPedidos}`;
        document.getElementById("card-ticket").textContent = `Ticket Médio: ${money(ticketMedio)}`;

        document.getElementById("export-csv").onclick = () => {
            let csv = "ID;Data;Usuario;Nome;Itens;Subtotal;Entrega;Desconto;Cupom;Total;Endereco\n";
            filtrados.forEach(p => {
                const linha = [
                    p.id || 'N/A',
                    (p.data?.toLocaleString ? p.data.toLocaleString('pt-BR') : new Date(p.data).toLocaleString('pt-BR')),
                    p.usuario || p.email || '',
                    p.nome || '',
                    `"${(p.itens || []).join(', ')}"`,
                    String(p.subtotal.toFixed(2)).replace('.',','),
                    String(p.entrega.toFixed(2)).replace('.',','),
                    String(p.desconto.toFixed(2)).replace('.',','),
                    p.cupom || '',
                    String(p.total.toFixed(2)).replace('.',','),
                    `"${(p.endereco || '').replace(/"/g, '""')}"`
                ].join(';');
                csv += linha + '\n';
            });
            const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `pedidos_dfl_${periodo}.csv`;
            link.click();
            popupAdd('Exportando CSV...');
        };

      })
      .catch(err => alert("Erro ao carregar relatórios: ".concat(err.message)));

    const sel = document.getElementById("filter-period");
    if (sel && !sel._bound) {
      sel.addEventListener("change", e => carregarRelatorios(e.target.value));
      sel._bound = true;
    }
  }

  /* ------------------ 🔐 Segurança/Admin + UX Final ------------------ */
  auth.onAuthStateChanged(user => {
    currentUser = user; 
    
    if (user) {
      el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
      if (el.pedidosContainer) el.pedidosContainer.style.display = 'block';
      if (el.recompensasContainer) el.recompensasContainer.style.display = 'block'; // v3.1
      
    } else {
      el.userBtn.textContent = "Entrar / Cadastrar";
      if (el.pedidosContainer) el.pedidosContainer.style.display = 'none';
      if (el.recompensasContainer) el.recompensasContainer.style.display = 'none'; // v3.1
    }

    if (user && isAdmin(user)) {
      if (el.reportsBtn) {
        createAdminFab();
      }
    } else {
      if (el.reportsBtn) el.reportsBtn.style.display = "none";
      document.getElementById("admin-dashboard")?.remove();
      Overlays.closeAll();
    }
  });

  /* ------------------ 🍪 LÓGICA DO BANNER DE COOKIES ------------------ */
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
  
  /* ------------------ Outras Funções ------------------ */
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

  /* 🚨 ATUALIZADO V3.1: Mensagem de console */
  console.log("%c🎁 DFL v3.1 — Painel Recompensas (Visual) OK",
              "background:#ff7043;color:#fff;padding:8px 12px;border-radius:8px;font-weight:700;");

}); // Fim do DOMContentLoaded

/* =========================================================
   SCRIPT PARA FECHAR MODAIS AO CLICAR FORA (v2.5)
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
      cartBackdrop.classList.remove('active');
      miniCart.classList.remove('active');
      
      // v2.9: Garante que o painel de pedidos também feche
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
```Perfeito, Álefe. Recebido o seu `script.js` completo.

Eu mantive todo o seu código original (v3.1) e fiz a única alteração necessária para a **Fase 2 (Lógica de Contagem de Pedidos)**: a substituição da função `fecharPedido()`.

A nova função agora utiliza o **Firestore Batch** para garantir que a criação do pedido (`Pedidos/{documentId}`) e a atualização do contador do usuário (`Usuarios/{userId}`) ocorram de forma segura e atômica.

### 🚀 Seu `script.js` (DFL v3.2.0)

Aqui está o seu arquivo `script.js` **completo e atualizado**. Por favor, substitua seu arquivo antigo por este e faça o deploy.

```javascript
/* =========================================================
   🎁 DFL v3.2.0 — IMPLEMENTAÇÃO DO CONTADOR DE RECOMPENSAS
   - Atualiza fecharPedido para incrementar o contador de pedidos
     na coleção 'Usuarios' após um pedido ser finalizado.
   - Baseado na v3.1.0 (Visual Recompensas OK).
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------ ⚙️ BASE ------------------ */
  const sound = new Audio("click.wav");
  let cart = [];
  let currentUser = null;

  const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
  const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };

  // 🔊 Clique com som suave (não bloqueia o site se falhar)
  document.addEventListener("click", () => {
    try { sound.currentTime = 0; sound.play(); } catch (_) {}
  });

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
    recompensasLista: document.getElementById("listaRecompensas")
  };

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
      // v3.1: A lógica de fechar painéis foi movida para Overlays.closeAll
    },
  };

  /* ------------------ 🧩 OVERLAYS ------------------ */
  const Overlays = {
    closeAll() {
      document
        // v3.1: Adicionado .recompensas-panel.active
        .querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show") 
        .forEach((e) => e.classList.remove("show", "active"));
      Backdrop.hide();
    },
    open(modalLike) {
      Overlays.closeAll();
      if (!modalLike) return;
      modalLike.classList.add(
        // v3.1: Adicionado #recompensas-panel
        (modalLike.id === "mini-cart" || modalLike.id === "painelPedidos" || modalLike.id === "recompensas-panel") ? "active" : "show"
      );
      Backdrop.show();
    },
  };
  el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());

  /* =========================================================
    ✨ v3.0: LISTENER DO FORMULÁRIO DE CUPOM (ESTÁTICO)
    Conecta o formulário do index.html ao script.
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
    // A validação real ocorrerá em 'calcTotals'
    couponApplied = val;
    localStorage.setItem("dflCoupon", couponApplied);
    
    // Apenas redesenha o carrinho. 
    // A 'enhanceMiniCartUI' mostrará a mensagem de sucesso/erro.
    renderMiniCart(); 
  });
  /* ========================================================= */


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

/* ------------------ 🛒 MINI-CARRINHO (Limpo e Corrigido) ------------------ */
  function renderMiniCart() {
    
    if (!el.miniList) return; 

    const totalItens = cart.reduce((s, i) => s + i.qtd, 0);
    if (el.cartCount) el.cartCount.textContent = totalItens;

    if (!cart.length) {
      el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';
      
      // v3.0: Limpa também o rodapé dinâmico e estático
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


  /* 🔄 Vincula botões dinâmicos (incremento, remoção, limpar, finalizar) */
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
     ✨ v3.0: HOOK ÚNICO DO RENDERMINICART
     Este é o "hook" (wrapper) que garante que a UI do rodapé
     (enhanceMiniCartUI) seja chamada APÓS a lista de itens
     ser desenhada (pela _renderMiniCartOrig).
     v3.0.2: Removido hook duplicado que estava no fim do arquivo.
    =========================================================
  */
  const _renderMiniCartOrig = renderMiniCart;
  renderMiniCart = function () {
    _renderMiniCartOrig(); // 1. Desenha a lista de itens (síncrono)
    bindMiniCartButtons(); // 2. Vincula botões da lista (síncrono)
    
    // 3. Dispara a atualização do rodapé (assíncrono)
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

  try {
    if (!window.firebase) {
      throw new Error("Biblioteca principal do Firebase (app) não carregou.");
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    if (!firebase.auth) {
      throw new Error("Módulo de Autenticação (auth) não carregou.");
    }
    auth = firebase.auth();
    if (!firebase.firestore) {
      throw new Error("Módulo de Banco de Dados (firestore) não carregou.");
    }
    db = firebase.firestore();

  } catch (error) {
    console.error("ERRO FATAL AO INICIAR FIREBASE:", error);
    const elBody = document.querySelector("body");
    if (elBody) {
       elBody.innerHTML = `<div style="padding:20px;text-align:center;font-size:1.2rem;color:red;font-family:sans-serif;margin-top:50px;">
        <b>Erro Crítico</b><br>Não foi possível conectar aos nossos serviços.
        <br><small>Verifique sua conexão com a internet e tente recarregar a página.</small>
        <br><br><small style="color:#666">Detalhe: ${error.message}</small></div>`;
    }
    return; // ABORTA O RESTO DO SCRIPT.JS
  }

  /* ------------------ ⚙️ LOGIN ------------------ */
  el.userBtn?.addEventListener("click", () => Overlays.open(el.loginModal));
  document.querySelectorAll("#login-modal .login-close").forEach(btn =>
    btn.addEventListener("click", () => Overlays.closeAll())
  );

  el.loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email")?.value?.trim();
    const senha = document.getElementById("login-senha")?.value?.trim();
    if (!email || !senha) return alert("Preencha e-mail e senha.");

    auth.signInWithEmailAndPassword(email, senha)
      .then((cred) => {
        currentUser = cred.user;
        popupAdd("Login realizado com sucesso!");
        Overlays.closeAll();
      })
      .catch((err) => {
        if (err.code === "auth/user-not-found") {
          if (confirm("Conta não encontrada. Deseja criar uma nova?")) {
            auth.createUserWithEmailAndPassword(email, senha)
              .then((cred) => {
                currentUser = cred.user;
                popupAdd("Conta criada com sucesso! 🎉");
                Overlays.closeAll();
              })
              .catch((e) => alert("Erro: " + e.message));
          }
        } else if (err.code === "auth/wrong-password") {
          alert("Senha incorreta. Tente novamente.");
        } else {
          alert("Erro: ".concat(err.message));
        }
      });
  });

  el.googleBtn?.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then((res) => {
        currentUser = res.user;
        popupAdd("Login com Google realizado! ✅");
        Overlays.closeAll();
      })
      .catch((err) => alert("Erro: ".concat(err.message)));
  });

  /* ------------------ ➕ Adicionais ------------------ */
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
      <label class="extra-line">
        <span>${a.nome} — <b>${money(a.preco)}</b></span>
        <input type="checkbox" value="${i}">
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

  /* ------------------ 🥤 Combos (modal de bebidas) ------------------ */
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
      <label class="extra-line">
        <span>${o.rotulo} — + ${money(o.delta)}</span>
        <input type="radio" name="combo-drink" value="${i}" ${i === 0 ? "checked" : ""}>
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

  /* ------------------ 🧺 Adicionar item comum ------------------ */
  function addCommonItem(nome, preco) {
    // Se for um combo do *cardápio principal* (mas não uma "Promo"), abre o modal de bebida
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

  /* ------------------ 🛒 ABRIR CARRINHO ------------------ */
  el.cartIcon?.addEventListener("click", () => {
    renderMiniCart();
    Overlays.open(el.miniCart);
  });
  document.querySelectorAll("#mini-cart .extras-close").forEach((b) =>
    b.addEventListener("click", () => Overlays.closeAll())
  );


/* ------------------ ⚙️ CONFIGURAÇÕES V3.0 ------------------ */
  const DELIVERY_FEE = 6.00; 

  /* =========================================================
    ✨ v3.0: CUPONS REMOVIDOS
    O objeto local 'COUPONS' foi removido.
    =========================================================
  */

  let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();
  let addressValue  = (localStorage.getItem("dflAddress") || "").trim();

  const getCartSubtotal = () =>
    cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);

  /* =========================================================
    ✨ v3.0: FUNÇÃO REMOVIDA
    'calcDiscount' foi removida.
    =========================================================
  */

  /* =========================================================
    ✨ v3.0.1: NOVA FUNÇÃO DE VALIDAÇÃO (CACHE + TOLERÂNCIA)
    Substitui a 'validarCupomFirestore' original da v3.0.
    =========================================================
  */
  // --- Substitua sua validarCupomFirestore por esta versão com cache e tolerâncias ---
  const _cupomCache = { /* key -> { ate: ms, res: {...} } */ };
  function _cacheKey(codigo, subtotal){
    // agrupa subtotal em faixas de R$ 5 para melhorar reaproveitamento sem “errar” o valor
    const faixa = Math.floor((subtotal || 0) / 5);
    return `${(codigo||"").toUpperCase()}::${faixa}`;
  }

  async function validarCupomFirestore(codigo, subtotal) {
    const code = (codigo || "").toUpperCase();
    const invalido = { valido:false, discount:0, freeShipping:false, label:"", mensagem:"" };
    if (!code) return invalido;

    // 1) Cache leve por 30s
    const key = _cacheKey(code, subtotal);
    const now = Date.now();
    const hit = _cupomCache[key];
    if (hit && hit.ate > now) return hit.res;

    try {
      const cupomSnap = await db.collection("Cupons").doc(code).get();
      if (!cupomSnap.exists) {
        const res = { ...invalido, mensagem: "Cupom inválido." };
        _cupomCache[key] = { ate: now + 30000, res }; // 30s de cache
        return res;
      }

      const data = cupomSnap.data();

      // 2) Ativo
      if (!data.ativo) {
        const res = { ...invalido, mensagem: "Este cupom não está mais ativo." };
        _cupomCache[key] = { ate: now + 30000, res };
        return res;
      }

      // 3) Expiração (aceita Timestamp ou string ISO)
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

      // 4) Cálculo
      let discount = 0;
      let freeShipping = false;
      let label = "";

      if (data.tipo === "percent") {
        discount = Math.max(0, subtotal * (Number(data.valor) / 100));
        label = `${Number(data.valor)}% OFF`;
      } else if (data.tipo === "value") {
        const val = Math.max(0, Number(data.valor) || 0);
        discount = Math.min(subtotal, val);
        label = `R$ ${val.toFixed(2).replace(".", ",")} OFF`;
      } else if (data.tipo === "frete") {
        freeShipping = true;
        label = "Frete Grátis";
      } else {
        // Fallback caso o 'tipo' seja inválido no DB
        const res = { ...invalido, mensagem: "Tipo de cupom desconhecido." };
        _cupomCache[key] = { ate: now + 30000, res };
        return res;
      }

      const res = { valido:true, discount, freeShipping, label, mensagem:"Cupom aplicado com sucesso!" };
      _cupomCache[key] = { ate: now + 30000, res };
      return res;

    } catch (err) {
      console.error("Erro ao validar cupom no Firestore:", err);
      // Erro de permissão ou rede cai aqui
      return { ...invalido, mensagem: "Erro ao processar o cupom." };
    }
  }

  /* =========================================================
    ✨ v3.0: FUNÇÃO 'calcTotals' AGORA É ASYNC
    =========================================================
  */
  async function calcTotals() {
    const subtotal = getCartSubtotal();
    
    // 'd' (discountInfo) agora vem do Firestore e precisa de 'await'
    const d = await validarCupomFirestore(couponApplied, subtotal); 
    
    const delivery = d.freeShipping ? 0 : DELIVERY_FEE;
    const total = Math.max(0, subtotal + delivery - d.discount);
    
    return {
      subtotal,
      delivery,
      discount: d.discount,
      discountLabel: d.label,
      total,
      cupomInfo: d // Passa a info completa (valido, mensagem)
    };
  }

  /* =========================================================
    ✨ v3.0: UI DO CARRINHO (ASYNC E CONECTADA)
    Substitui a 'enhanceMiniCartUI' antiga.
    =========================================================
  */
  async function enhanceMiniCartUI() {
    if (!el.miniFoot) return;
    
    // Pega os elementos do cupom que JÁ EXISTEM no HTML
    const couponMsg = document.getElementById("coupon-message");
    const couponDiscountRow = document.getElementById("coupon-discount-row");
    const cartDiscount = document.getElementById("cart-discount");

    // Remove o resumo antigo (Subtotal, Total, Botões) antes de recalcular
    // v3.0.2: Esta é a linha que impede a duplicação.
    el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());
    
    if (cart.length === 0) {
      // Se o carrinho está vazio, já limpamos a lista.
      // Agora limpamos a UI de cupom.
      if (couponMsg) couponMsg.innerHTML = "";
      if (couponDiscountRow) couponDiscountRow.style.display = "none";
      return; 
    }

    // 1. CALCULA TOTAIS (AGORA É ASYNC)
    const { subtotal, delivery, discount, discountLabel, total, cupomInfo } = await calcTotals();

    // 2. ATUALIZA MENSAGEM DO CUPOM (UI ESTÁTICA)
    if (couponMsg) {
      couponMsg.textContent = cupomInfo.mensagem;
      couponMsg.className = `coupon-message ${cupomInfo.valido ? 'success' : 'error'}`;
      
      // Se o cupom era inválido, mas não estava vazio, limpa ele
      if (!cupomInfo.valido && couponApplied) {
         couponApplied = "";
         localStorage.removeItem("dflCoupon");
         // Atualiza o valor do input se ele não estiver focado
         const couponInput = document.getElementById("coupon-input");
         if (couponInput && document.activeElement !== couponInput) {
           couponInput.value = "";
         }
      }
    }

    // 3. ATUALIZA LINHA DE DESCONTO (UI ESTÁTICA)
    if (couponDiscountRow && cartDiscount) {
      if (discount > 0 || discountLabel) {
        cartDiscount.textContent = `- ${money(discount)} ${discountLabel ? `(${discountLabel})` : ""}`;
        couponDiscountRow.style.display = "flex";
      } else {
        couponDiscountRow.style.display = "none";
      }
    }
    
    // 4. GERA O RESTO DO HTML (SUBTOTAL, TOTAL, BOTÕES)
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'cart-summary-generated'; // Classe para fácil remoção
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

      <label style="display:block;font-weight:600;margin-bottom:6px;">🏠 Endereço para Entrega</label>
      <textarea id="address-input" rows="2" placeholder="Rua, número, complemento, bairro"
        style="width:100%;border:1px solid #ddd;border-radius:10px;padding:10px;resize:vertical;margin-bottom:10px">${addressValue}</textarea>

      <button id="finish-order" type="button" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:10px;padding:12px;font-weight:700;cursor:pointer;margin-bottom:8px">
        Finalizar Pedido 🛍️
      </button>
      <button id="clear-cart" type="button" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;cursor:pointer">
        Limpar Carrinho
      </button>
    `;
    
    // Adiciona os novos elementos ao rodapé
    el.miniFoot.appendChild(summaryDiv);
    
    // 5. BIND EVENTOS (para os botões que acabamos de criar)
    summaryDiv.querySelector("#address-input")?.addEventListener("input", (e) => {
      addressValue = (e.target.value || "").trim();
      localStorage.setItem("dflAddress", addressValue);
    });

    summaryDiv.querySelector("#finish-order")?.addEventListener("click", fecharPedido);
    summaryDiv.querySelector("#clear-cart")?.addEventListener("click", () => {
      if (confirm("Limpar todo o carrinho?")) {
        cart = [];
        couponApplied = ""; // Limpa o cupom também
        localStorage.removeItem("dflCoupon");
        const couponInput = document.getElementById("coupon-input");
        if(couponInput) couponInput.value = "";
        
        renderMiniCart();
        popupAdd("Carrinho limpo!");
      }
    });
  }

  /* =========================================================
     v3.0.2: BLOCO HOOK REDUNDANTE REMOVIDO DAQUI
     O hook correto já está definido perto da linha 228.
    =========================================================
  */

  /* ------------------ 🖼️ CARROSSEL V2.7 (NOVA LÓGICA) ------------------ */
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

  // 5. Navegação do carrossel principal (mantida)
  el.cPrev?.addEventListener("click", () => {
    if (!el.slides) return;
    el.slides.scrollLeft -= Math.min(el.slides.clientWidth * 0.9, 320);
  });
  el.cNext?.addEventListener("click", () => {
    if (!el.slides) return;
    el.slides.scrollLeft += Math.min(el.slides.clientWidth * 0.9, 320);
  });


  /* ------------------ ⏰ Status + Timer (mantidos) ------------------ */
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

        el.hoursBanner.innerHTML = `🔒 Fechado — Abrimos em <b>${faltamH}h ${faltamM}min</b>`;
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
    ✨ v3.0: 'FECHAR PEDIDO' AGORA É ASYNC
    Para aguardar o 'calcTotals' antes de salvar.
    =========================================================
  */
  // 🚨 FUNÇÃO ATUALIZADA V3.2: Inclui o Contador de Pedidos
  async function fecharPedido() {
    if (!cart.length) return alert("Carrinho vazio!");
    if (!currentUser) {
      alert("Faça login para enviar o pedido!");
      Overlays.open(el.loginModal);
      return;
    }

    const addr = (document.getElementById("address-input")?.value || "").trim();
    if (!addr) {
      alert("Informe o endereço para entrega antes de finalizar.");
      document.getElementById("address-input")?.focus();
      return;
    }

    // Espera o cálculo (que agora busca no Firebase)
    const { subtotal, delivery, discount, discountLabel, total } = await calcTotals();

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
      
      thumb: 'imagens/padrao.jpg' 
    };

    try {
      // Cria a transação Batch
      const batch = db.batch();
      
      // 1. Cria o Pedido (na coleção Pedidos)
      const pedidoRef = db.collection("Pedidos").doc();
      batch.set(pedidoRef, pedido);
      
      // 2. ATUALIZA O CONTADOR DE PEDIDOS (na coleção Usuarios)
      const usuarioRef = db.collection("Usuarios").doc(currentUser.uid);
      
      // Usa FieldValue.increment para aumentar o contador de forma segura
      batch.set(usuarioRef, {
          email: currentUser.email,
          pedidosFeitos: firebase.firestore.FieldValue.increment(1) 
      }, { merge: true }); // O merge é essencial para não apagar outros campos do usuário
      
      // 3. Commit da transação (cria o pedido e atualiza o contador)
      await batch.commit();
      
      // 4. Feedback e Limpeza
      popupAdd("Pedido salvo ✅");

      const linhas = [
        "🍔 *Pedido DFL*",
        cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"),
        "",
        `Subtotal: *${money(subtotal)}*`,
        `Entrega: *${money(delivery)}*${couponApplied && discountLabel === "Frete Grátis" ? " _(Frete Grátis)_" : ""}`,
        `Desconto${couponApplied ? ` (${couponApplied})` : ""}: *-${money(discount)}*`,
        `*Total: ${money(total)}*`,
        "",
        `🏠 *Endereço:* ${addr}`
      ].join("\n");

      const texto = encodeURIComponent(linhas);
      window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");

      cart = [];
      couponApplied = ""; // Limpa o cupom ao finalizar
      localStorage.removeItem("dflCoupon");
      const couponInput = document.getElementById("coupon-input");
      if(couponInput) couponInput.value = "";
      
      renderMiniCart();
      Overlays.closeAll();

    } catch (err) {
      console.error("Erro ao fechar pedido ou atualizar contador:", err);
      // Aqui, o erro pode ser tanto do pedido quanto do contador.
      alert(`Ocorreu um erro ao finalizar seu pedido. Por favor, tente novamente. Detalhe: ${err.message}`);
    }
  }

  // Chama o renderMiniCart uma vez no início para carregar o rodapé
  // caso haja itens no localStorage (a lógica de carregar o 'cart' do localStorage
  // não está aqui, mas se estivesse, esta chamada inicializaria a UI)
  renderMiniCart();
  
/* ------------------ 📦 MEUS PEDIDOS PREMIUM (V2.10) ------------------ */

  // 1. Lógica de abrir/fechar o novo painel
  el.pedidosBtn?.addEventListener("click", () => {
    if (!currentUser) {
      alert("Faça login para ver seus pedidos.");
      Overlays.open(el.loginModal); 
      return;
    }
    Overlays.open(el.pedidosPanel);
    carregarPedidos(currentUser.uid); 
  });

  el.pedidosFecharBtn?.addEventListener("click", () => Overlays.closeAll());

  // 2. Lógica de carregar pedidos (v2.9)
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

      const pedidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      exibirPedidos(pedidos);

    } catch (err) {
      console.error("Erro ao carregar pedidos: ", err);
      el.pedidosLista.innerHTML = `<p class="empty-orders" style="color:red;">Erro ao buscar seus pedidos.</p>`;
    }
  }

  // 3. Lógica de exibir os pedidos no painel (v2.9)
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
  
  // 4. Lógica de "Repetir Pedido" (v2.10 - Lógica Real)
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

/* ------------------ FIM DO BLOCO V2.10 ------------------ */


/* ------------------ 🎁 MINHAS RECOMPENSAS (V3.1 - FASE 5 PARCIAL) ------------------ */

  // 1. Lógica de abrir/fechar o novo painel
  el.recompensasBtn?.addEventListener("click", () => {
    // Requer login, assim como "Meus Pedidos"
    if (!currentUser) {
      alert("Faça login para ver suas recompensas.");
      Overlays.open(el.loginModal); 
      return;
    }
    Overlays.open(el.recompensasPanel);
    // Futuramente, chamaremos a função de carregar recompensas aqui.
    // carregarRecompensas(currentUser.uid); 
  });

  // 2. Lógica de fechar o painel
  el.recompensasFecharBtn?.addEventListener("click", () => Overlays.closeAll());

/* ------------------ FIM DO BLOCO V3.1 ------------------ */


  /* =========================================================
     📊 ADMIN DASHBOARD (V2.5 com Cupom + Frete + Desconto)
  ========================================================= */
  const ADMINS = [
    "alefejohsefe@gmail.com",
    "kalebhstanley650@gmail.com",
    "contato@dafamilialanches.com.br"
  ];

  function isAdmin(user) {
    return user && user.email && ADMINS.includes(user.email.toLowerCase());
  }

  let chartPedidos = null;
  let chartProdutos = null;

  function ensureChartJS(cb) {
    if (window.Chart) return cb();
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js";
    s.onload = cb;
    document.head.appendChild(s);
  }

  function createDashboard() {
    if (document.getElementById("admin-dashboard")) return;

    const div = document.createElement("div");
    div.id = "admin-dashboard";
    div.className = "modal";
    div.innerHTML = `
      <div class="modal-content" style="max-width:1000px;width:95%;height:85vh;overflow:auto;background:#fff;border-radius:12px;">
        <div class="modal-head" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;">
          <h3>📊 Relatórios e Estatísticas</h3>
          <button class="dashboard-close" type="button" style="background:#ff5252;color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer;font-weight:600;">✖</button>
        </div>
        <div class="dashboard-body" style="padding:12px;">
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
            <div id="card-total" class="cardBox">Total Arrecadado: —</div>
            <div id="card-pedidos" class="cardBox">Pedidos: —</div>
            <div id="card-ticket" class="cardBox">Ticket Médio: —</div>
          </div>

          <div style="margin-bottom:10px;">
            <label style="font-weight:600;">Período: </label>
            <select id="filter-period" style="padding:6px 10px;border-radius:6px;border:1px solid #ccc;font-weight:600;">
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="all">Todos</option>
            </select>
          </div>

          <canvas id="chart-pedidos" style="width:100%;height:240px;"></canvas>
          <canvas id="chart-produtos" style="width:100%;height:240px;margin-top:16px;"></canvas>
          <div style="margin-top:12px;">
            <button id="export-csv" type="button" style="background:#4caf50;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-weight:600;cursor:pointer;">📁 Exportar CSV</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(div);

    document.querySelectorAll(".cardBox").forEach(c => {
      Object.assign(c.style, {
        flex: "1", minWidth: "200px", padding: "12px",
        background: "#f9f9f9", borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,.08)"
      });
    });

    div.querySelector(".dashboard-close").addEventListener("click", () => Overlays.closeAll());
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

/* ------------------ 📊 Função dos Gráficos (Corrigida) ------------------ */
  function gerarResumoECharts(pedidos) {
    if (!window.Chart) {
      console.error("Chart.js não está carregado.");
      return;
    }
    
    const ctxPedidos = document.getElementById('chart-pedidos')?.getContext('2d');
    const ctxProdutos = document.getElementById('chart-produtos')?.getContext('2d');

    if (!ctxPedidos || !ctxProdutos) {
      console.error("Elementos <canvas> dos gráficos não encontrados.");
      return;
    }

    // --- Gráfico 1: Pedidos por Dia (Gráfico de Linha) ---
    const pedidosPorDia = {};
    pedidos.forEach(p => {
      const dia = (p.data?.toDate?.() || new Date(p.data)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      pedidosPorDia[dia] = (pedidosPorDia[dia] || 0) + 1;
    });

    const labelsPedidos = Object.keys(pedidosPorDia).sort((a, b) => {
      const [diaA, mesA] = a.split('/');
      const [diaB, mesB] = b.split('/');
      return new Date(`${mesA}/${diaA}/2025`) - new Date(`${mesB}/${diaB}/2025`);
    });
    const dataPedidos = labelsPedidos.map(label => pedidosPorDia[label]);

    if (chartPedidos) {
      chartPedidos.destroy();
    }
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
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Volume de Pedidos por Dia' }
        }
      }
    });

    // --- Gráfico 2: Produtos Mais Vendidos (Gráfico de Barras) ---
    const produtosContagem = {};
    pedidos.forEach(p => {
      (p.itens || []).forEach(itemStr => {
        const parts = itemStr.split(' x');
        const nome = parts[0];
        const qtd = parts.length > 1 ? parseInt(parts[1], 10) : 1;
        
        if (nome) {
          produtosContagem[nome] = (produtosContagem[nome] || 0) + (isNaN(qtd) ? 1 : qtd);
        }
      });
    });

    const produtosOrdenados = Object.entries(produtosContagem)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); 

    const labelsProdutos = produtosOrdenados.map(p => p[0]);
    const dataProdutos = produtosOrdenados.map(p => p[1]);

    if (chartProdutos) {
      chartProdutos.destroy();
    }
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
        indexAxis: 'y',
        responsive: true,
        plugins: {
          title: { display: true, text: 'Top 10 Itens Mais Vendidos' }
        }
      }
    });
  }

/* ------------------ 📊 Carregar Relatórios (V2.5) ------------------ */
  function carregarRelatorios(periodo = "7") {
    const agora = new Date();
    let start = new Date(0);
    if (periodo !== "all") {
      start = new Date(agora);
      start.setDate(start.getDate() - Number(periodo));
    }

    db.collection("Pedidos")
      .orderBy("data", "desc")
      .get()
      .then(snap => {
        const pedidos = snap.docs.map(d => {
          const p = d.data() || {};
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

        const filtrados = pedidos.filter(p => periodo === "all" || (p.data >= start));
        
        gerarResumoECharts(filtrados); 
        
        const totalVendido = filtrados.reduce((s, p) => s + p.total, 0);
        const numPedidos = filtrados.length;
        const ticketMedio = numPedidos > 0 ? totalVendido / numPedidos : 0;
        
        document.getElementById("card-total").textContent = `Total Arrecadado: ${money(totalVendido)}`;
        document.getElementById("card-pedidos").textContent = `Pedidos: ${numPedidos}`;
        document.getElementById("card-ticket").textContent = `Ticket Médio: ${money(ticketMedio)}`;

        document.getElementById("export-csv").onclick = () => {
            let csv = "ID;Data;Usuario;Nome;Itens;Subtotal;Entrega;Desconto;Cupom;Total;Endereco\n";
            filtrados.forEach(p => {
                const linha = [
                    p.id || 'N/A',
                    (p.data?.toLocaleString ? p.data.toLocaleString('pt-BR') : new Date(p.data).toLocaleString('pt-BR')),
                    p.usuario || p.email || '',
                    p.nome || '',
                    `"${(p.itens || []).join(', ')}"`,
                    String(p.subtotal.toFixed(2)).replace('.',','),
                    String(p.entrega.toFixed(2)).replace('.',','),
                    String(p.desconto.toFixed(2)).replace('.',','),
                    p.cupom || '',
                    String(p.total.toFixed(2)).replace('.',','),
                    `"${(p.endereco || '').replace(/"/g, '""')}"`
                ].join(';');
                csv += linha + '\n';
            });
            const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `pedidos_dfl_${periodo}.csv`;
            link.click();
            popupAdd('Exportando CSV...');
        };

      })
      .catch(err => alert("Erro ao carregar relatórios: ".concat(err.message)));

    const sel = document.getElementById("filter-period");
    if (sel && !sel._bound) {
      sel.addEventListener("change", e => carregarRelatorios(e.target.value));
      sel._bound = true;
    }
  }

  /* ------------------ 🔐 Segurança/Admin + UX Final ------------------ */
  auth.onAuthStateChanged(user => {
    currentUser = user; 
    
    if (user) {
      el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
      if (el.pedidosContainer) el.pedidosContainer.style.display = 'block';
      if (el.recompensasContainer) el.recompensasContainer.style.display = 'block'; // v3.1
      
    } else {
      el.userBtn.textContent = "Entrar / Cadastrar";
      if (el.pedidosContainer) el.pedidosContainer.style.display = 'none';
      if (el.recompensasContainer) el.recompensasContainer.style.display = 'none'; // v3.1
    }

    if (user && isAdmin(user)) {
      if (el.reportsBtn) {
        createAdminFab();
      }
    } else {
      if (el.reportsBtn) el.reportsBtn.style.display = "none";
      document.getElementById("admin-dashboard")?.remove();
      Overlays.closeAll();
    }
  });

  /* ------------------ 🍪 LÓGICA DO BANNER DE COOKIES ------------------ */
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
  
  /* ------------------ Outras Funções ------------------ */
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

  /* 🚨 ATUALIZADO V3.1: Mensagem de console */
  console.log("%c🎁 DFL v3.1 — Painel Recompensas (Visual) OK",
              "background:#ff7043;color:#fff;padding:8px 12px;border-radius:8px;font-weight:700;");

}); // Fim do DOMContentLoaded

/* =========================================================
   SCRIPT PARA FECHAR MODAIS AO CLICAR FORA (v2.5)
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
      cartBackdrop.classList.remove('active');
      miniCart.classList.remove('active');
      
      // v2.9: Garante que o painel de pedidos também feche
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
