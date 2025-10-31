/* =========================================================
   🍔 DFL v2.8 — Promoções Expansíveis + Layout Redondinho
   - HTML e CSS: Atualizados (Expansão de imagens)
   - JS: Mantido da v2.7 Estável
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

  /* 🚨 NOVO BANCO DE DADOS V2.7 
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
    myOrdersBtn: document.getElementById("orders-fab"),
    
    // 🚨 NOVOS ELEMENTOS V2.7
    promoModal: document.getElementById("promo-modal"),
    promoImg: document.getElementById("promo-modal-img"),
    promoTitle: document.getElementById("promo-modal-title"),
    promoPrice: document.getElementById("promo-modal-price"),
    promoAddBtn: document.getElementById("promo-modal-add"),
    promoNavPrev: document.querySelector("#promo-modal .promo-nav.prev"),
    promoNavNext: document.querySelector("#promo-modal .promo-nav.next"),
    promoClose: document.querySelector("#promo-modal .promo-close")
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
    hide() { el.cartBackdrop.classList.remove("active"); document.body.classList.remove("no-scroll"); },
  };

  /* ------------------ 🧩 OVERLAYS ------------------ */
  const Overlays = {
    closeAll() {
      document
        .querySelectorAll(".modal.show, #mini-cart.active, .orders-panel.active, #admin-dashboard.show")
        .forEach((e) => e.classList.remove("show", "active"));
      Backdrop.hide();
    },
    open(modalLike) {
      Overlays.closeAll();
      if (!modalLike) return;
      modalLike.classList.add(modalLike.id === "mini-cart" ? "active" : "show");
      Backdrop.show();
    },
  };
  el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());

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
      if(el.miniFoot) el.miniFoot.innerHTML = ""; 
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

  const _renderMiniCartOrig = renderMiniCart;
  renderMiniCart = function () {
    _renderMiniCartOrig();
    bindMiniCartButtons();
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
    // Se for um combo do *cardápio principal*, abre o modal de bebida
    if (/^combo/i.test(nome) && !/^\s*Combo [0-9]/.test(nome)) {
      openComboModal(nome, preco);
      return;
    }
    // Se for uma *promoção* (ex: "Combo 2 Purizin..."), adiciona direto
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


/* ------------------ ⚙️ CONFIGURAÇÕES V2.5 ------------------ */
  const DELIVERY_FEE = 6.00; 

  const COUPONS = {
    "DFL5":        { type: "percent", value: 5,  note: "5% OFF" },
    "DFL10":       { type: "percent", value: 10, note: "10% OFF" },
    "BEMVINDO":    { type: "value",   value: 5,  note: "R$ 5,00 OFF na 1ª compra" },
    "FRETEZERO":   { type: "frete",   value: 0,  note: "Frete grátis" },
    "FAMILIA10": { type: "percent", value: 10,  note: "10% OFF" },
    "PRIMEIRO": { type: "value",   value: 5,  note: "R$ 5,00 OFF" } 
  };

  let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();
  let addressValue  = (localStorage.getItem("dflAddress") || "").trim();

  const getCartSubtotal = () =>
    cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);

  function calcDiscount(subtotal, couponCode) {
    const code = (couponCode || "").toUpperCase();
    const rule = COUPONS[code];
    if (!rule) return { discount: 0, freeShipping: false, label: "" };

    if (rule.type === "percent") {
      const val = Math.max(0, subtotal * (rule.value / 100));
      return { discount: val, freeShipping: false, label: `${rule.value}% OFF` };
    }
    if (rule.type === "value") {
      const val = Math.min(subtotal, Math.max(0, rule.value));
      return { discount: val, freeShipping: false, label: `R$ ${val.toFixed(2).replace(".", ",")} OFF` };
    }
    if (rule.type === "frete") {
      return { discount: 0, freeShipping: true, label: "Frete Grátis" };
    }
    return { discount: 0, freeShipping: false, label: "" };
  }

  function calcTotals() {
    const subtotal = getCartSubtotal();
    const d = calcDiscount(subtotal, couponApplied);
    const delivery = d.freeShipping ? 0 : DELIVERY_FEE;
    const total = Math.max(0, subtotal + delivery - d.discount);
    return {
      subtotal,
      delivery,
      discount: d.discount,
      discountLabel: d.label,
      total
    };
  }

  /* ------------------ 🛒 MINI-CARRINHO: UI ESTENDIDA V2.5 ------------------ */
  function enhanceMiniCartUI() {
    if (!el.miniFoot) return;
    if (cart.length === 0) return;

    const { subtotal, delivery, discount, discountLabel, total } = calcTotals();

    el.miniFoot.innerHTML = `
      <div style="padding:14px 14px 10px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span>Subtotal</span><b>${money(subtotal)}</b>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span>Entrega</span><b>${money(delivery)}</b>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <span>Desconto ${discountLabel ? `(${discountLabel})` : ""}</span><b>- ${money(discount)}</b>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #eee;padding-top:10px;margin-bottom:12px;font-size:1.1rem;">
          <span><b>Total</b></span><span style="color:#e53935;font-weight:800;">${money(total)}</span>
        </div>

        <label style="display:block;font-weight:600;margin-bottom:6px;">🏠 Endereço para Entrega</label>
        <textarea id="address-input" rows="2" placeholder="Rua, número, complemento, bairro"
          style="width:100%;border:1px solid #ddd;border-radius:10px;padding:10px;resize:vertical;margin-bottom:10px">${addressValue}</textarea>

        <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
          <input id="coupon-input" type="text" inputmode="text" placeholder="Cupom de desconto"
            value="${couponApplied || ""}"
            style="flex:1;border:1px solid #ddd;border-radius:10px;padding:10px;font-weight:600;letter-spacing:.5px;text-transform:uppercase">
          <button id="apply-coupon" type="button" style="background:#000;color:#fff;border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer">Aplicar</button>
        </div>

        <button id="finish-order" type="button" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:10px;padding:12px;font-weight:700;cursor:pointer;margin-bottom:8px">
          Finalizar Pedido 🛍️
        </button>
        <button id="clear-cart" type="button" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;cursor:pointer">
          Limpar Carrinho
        </button>
      </div>
    `;

    document.getElementById("apply-coupon")?.addEventListener("click", () => {
      const input = document.getElementById("coupon-input");
      const val = (input?.value || "").trim().toUpperCase();
      if (!val) {
        couponApplied = "";
        localStorage.removeItem("dflCoupon");
        popupAdd("Cupom removido.");
        enhanceMiniCartUI();
        return;
      }
      if (!COUPONS[val]) {
        popupAdd("Cupom inválido.");
        return;
      }
      couponApplied = val;
      localStorage.setItem("dflCoupon", couponApplied);
      popupAdd(`Cupom aplicado: ${val}`);
      enhanceMiniCartUI();
    });

    document.getElementById("address-input")?.addEventListener("input", (e) => {
      addressValue = (e.target.value || "").trim();
      localStorage.setItem("dflAddress", addressValue);
    });

    document.getElementById("finish-order")?.addEventListener("click", fecharPedido);
    document.getElementById("clear-cart")?.addEventListener("click", () => {
      if (confirm("Limpar todo o carrinho?")) {
        cart = [];
        renderMiniCart();
        popupAdd("Carrinho limpo!");
      }
    });
  }

  const __renderMiniCartPrev = renderMiniCart;
  renderMiniCart = function() {
    __renderMiniCartPrev();
    enhanceMiniCartUI();
  };


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

  /* ------------------ 💾 Fechar pedido (V2.5 com endereço/cupom/frete) ------------------ */
  function fecharPedido() {
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

    const { subtotal, delivery, discount, discountLabel, total } = calcTotals();

    const pedido = {
      usuario: currentUser.email,
      userId: currentUser.uid,
      nome: currentUser.displayName || currentUser.email.split("@")[0],
      itens: cart.map((i) => `${i.nome} x${i.qtd}`),
      subtotal: Number(subtotal.toFixed(2)),
      entrega: Number(delivery.toFixed(2)),
      desconto: Number(discount.toFixed(2)),
      cupom: couponApplied || "",
      total: Number(total.toFixed(2)),
      endereco: addr,
      data: new Date().toISOString(),
    };

    db.collection("Pedidos")
      .add(pedido)
      .then(() => {
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
        renderMiniCart();
        Overlays.closeAll();
      })
      .catch((err) => alert("Erro: ".concat(err.message)));
  }

  renderMiniCart();
  
/* ------------------ 📦 Meus Pedidos (UI + lógica V2.5) ------------------ */
  let ordersFab = el.myOrdersBtn;
  if (!ordersFab) {
    ordersFab = document.createElement("button");
    ordersFab.id = "orders-fab"; 
    ordersFab.innerHTML = "📦 Meus Pedidos";
    document.body.appendChild(ordersFab);
    el.myOrdersBtn = ordersFab; 
  }

  let ordersPanel = document.querySelector(".orders-panel");
  if (!ordersPanel) {
    ordersPanel = document.createElement("div");
    ordersPanel.className = "orders-panel";
    ordersPanel.innerHTML = `
      <div class="orders-head">
        <span>📦 Meus Pedidos</span>
        <button class="orders-close" type="button">✖</button>
      </div>
      <div class="orders-content" id="orders-content">
        <p class="empty-orders">Faça login para ver seus pedidos.</p>
      </div>`;
    document.body.appendChild(ordersPanel);
  }

  function openOrdersPanel() {
    Overlays.closeAll();
    ordersPanel.classList.add("active");
    Backdrop.show();
  }

  ordersFab.addEventListener("click", () => {
    if (!currentUser) return alert("Faça login para ver seus pedidos.");
    openOrdersPanel();
    carregarPedidosSeguro();
  });

  ordersPanel.querySelector(".orders-close")?.addEventListener("click", () => Overlays.closeAll());

  function showOrdersFabIfLogged() {
    if (el.myOrdersBtn) {
      if (currentUser) el.myOrdersBtn.classList.add("show");
      else el.myOrdersBtn.classList.remove("show");
    }
  }

  function carregarPedidosSeguro() {
    const container = document.getElementById("orders-content");
    if (!container) return;

    container.innerHTML = `<p class="empty-orders">Carregando pedidos...</p>`;

    if (!currentUser || !currentUser.email) {
      setTimeout(carregarPedidosSeguro, 500);
      return;
    }

    const render = (snap) => {
      if (snap.empty) {
        container.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado 😢</p>`;
        return;
      }

      const pedidos = [];
      snap.forEach((doc) => pedidos.push({ id: doc.id, ...doc.data() }));
      pedidos.sort((a, b) => new Date(b.data) - new Date(a.data));

      container.innerHTML = "";
      pedidos.forEach((p) => {
        const itens = Array.isArray(p.itens) ? p.itens.join("<br>• ") : (p.itens || "");
        const dataFormatada = p.data
          ? new Date(p.data).toLocaleString("pt-BR", {
              day: "2-digit", month: "2-digit", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })
          : "—";

        const box = document.createElement("div");
        box.className = "order-item";
        box.innerHTML = `
          <h4>📅 ${dataFormatada}</h4>
          <p style="margin:6px 0;"><b>Itens:</b><br>• ${itens}</p>
          ${p.endereco ? `<p style="margin:6px 0;"><b>Endereço:</b> ${p.endereco}</p>` : ""}
          ${p.cupom ? `<p style="margin:6px 0;"><b>Cupom:</b> ${p.cupom}</p>` : ""}
          <p style="margin:6px 0;">
            <b>Subtotal:</b> ${money(p.subtotal || 0)}<br>
            <b>Entrega:</b> ${money(p.entrega || 0)}<br>
            <b>Desconto:</b> -${money(p.desconto || 0)}
          </p>
          <p style="font-size:1.1rem;color:#4caf50;font-weight:700;margin-top:6px;">
            <b>Total:</b> ${money(p.total || 0)}
          </p>`;
        container.appendChild(box);
      });
    };

    db.collection("Pedidos")
      .where("usuario", "==", currentUser.email)
      .get()
      .then((snap) => {
        if (!snap.empty) return render(snap);
        return db.collection("Pedidos")
          .where("userId", "==", currentUser.uid)
          .get()
          .then(render);
      })
      .catch((err) => {
        container.innerHTML = `<p class="empty-orders" style="color:#d32f2f;">Erro: ${err.message}</p>`;
      });
  }

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
      const dia = p.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
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
      p.itens.forEach(itemStr => {
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
                    p.data.toLocaleString('pt-BR'),
                    p.usuario || p.email || '',
                    p.nome || '',
                    `"${p.itens.join(', ')}"`,
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
      showOrdersFabIfLogged();
    } else {
      el.userBtn.textContent = "Entrar / Cadastrar";
      showOrdersFabIfLogged();
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
  // (Este é o novo bloco de código adicionado)
  const cookieBanner = document.getElementById("cookie-banner");
  const cookieAcceptBtn = document.getElementById("cookie-accept");

  if (cookieBanner && cookieAcceptBtn) {
    // Verifica se o cookie já foi aceito
    if (localStorage.getItem("dfl-cookies-accepted") === "true") {
      cookieBanner.style.display = "none";
    } else {
      // A classe .show (do CSS) vai ativar a animação
      cookieBanner.classList.add("show");
    }

    // O que acontece ao clicar em "Aceitar"
    cookieAcceptBtn.addEventListener("click", () => {
      localStorage.setItem("dfl-cookies-accepted", "true");
      cookieBanner.classList.remove("show");
      
      // Opcional: esconde o banner após a animação de saída
      setTimeout(() => {
        cookieBanner.style.display = "none";
      }, 500); // 500ms (mesmo tempo da transição no CSS)
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

  /* 🚨 ATUALIZADO V2.7: Mensagem de console */
  console.log("%c🍔 DFL v2.7 — Modal de Promoções OK — Lógica v2.6 Estável",
              "background:#4caf50;color:#fff;padding:8px 12px;border-radius:8px;font-weight:700;");

}); // Fim do DOMContentLoaded

/* =========================================================
   SCRIPT PARA FECHAR MODAIS AO CLICAR FORA (v2.5)
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Lógica para fechar os MODAIS (Login, Extras, Combo) ---
  
  // Seleciona todos os elementos que são modais
  const allModals = document.querySelectorAll('.modal');

  allModals.forEach(modal => {
    modal.addEventListener('click', (event) => {
      
      // event.target é o elemento exato que foi clicado.
      // Verificamos se o clique foi DIRETAMENTE no fundo do modal
      // (que tem a classe '.modal') e não em um "filho" (como o .modal-content)
      if (event.target.classList.contains('modal')) {
        
        // Se foi no fundo, remove a classe 'show' para fechar
        modal.classList.remove('show');
        
        // Também remove a classe 'active' do backdrop do carrinho,
        // caso ele esteja ativo por algum motivo.
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
      // Ao clicar no backdrop, fecha tanto ele quanto o carrinho
      cartBackdrop.classList.remove('active');
      miniCart.classList.remove('active');
    });
  }

});
