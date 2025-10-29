/* =========================================================
   🍔 DFL v2.5 — CUPOM + ENDEREÇO + TAXA ENTREGA FIXA
   - Adiciona campos de endereço e cupom no carrinho
   - Aplica taxa de entrega fixa (R$ 6,00)
   - Mantém compatibilidade total com Firestore e login seguro
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------ ⚙️ BASE ------------------ */
  const sound = new Audio("click.wav");
  let cart = [];
  let currentUser = null;

  // 💰 Valor fixo da taxa de entrega
  //   (REMOVIDO DAQUI - AGORA ESTÁ NA LÓGICA V2.5 ABAIXO)
  // const TAXA_ENTREGA = 6.00;

  // 💸 Cupons válidos e regras
  //   (REMOVIDO DAQUI - AGORA ESTÁ NA LÓGICA V2.5 ABAIXO)
  // const CUPONS = { ... };

  // 💾 Dados temporários
  //   (REMOVIDO DAQUI - AGORA ESTÁ NA LÓGICA V2.5 ABAIXO)
  // let cupomAplicado = null;
  // let enderecoCliente = "";

  const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
  const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };

  // 🔊 Clique com som suave (não bloqueia o site se falhar)
  document.addEventListener("click", () => {
    try { sound.currentTime = 0; sound.play(); } catch (_) {}
  });

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
  };

  /* ------------------ 🌫️ BACKDROP ------------------ */
  if (!el.cartBackdrop) {
    const bd = document.createElement("div");
    bd.id = "cart-backdrop";
    document.body.appendChild(bd);
    el.cartBackdrop = bd;
  }

  const Backdrop = {
    show() { el.cartBackdrop.classList.add("show"); document.body.classList.add("no-scroll"); },
    hide() { el.cartBackdrop.classList.remove("show"); document.body.classList.remove("no-scroll"); },
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
  // ESTA É A FUNÇÃO QUE FOI CORRIGIDA.
  // Ela agora SÓ renderiza a LISTA de itens.
  // O rodapé (totais, cupom, endereço) é feito pela 'enhanceMiniCartUI'
  function renderMiniCart() {
    
    if (!el.miniList) return; // Não precisamos mais do miniFoot aqui

    const totalItens = cart.reduce((s, i) => s + i.qtd, 0);
    if (el.cartCount) el.cartCount.textContent = totalItens;

    if (!cart.length) {
      el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';
      
      // Limpamos o rodapé manualmente se o carrinho estiver vazio
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
            <button class="cart-minus" data-idx="${idx}" style="background:#ff4081;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">−</button>
            <span style="font-weight:600;min-width:20px;text-align:center;">${item.qtd}</span>
            <button class="cart-plus" data-idx="${idx}" style="background:#4caf50;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">+</button>
            <button class="cart-remove" data-idx="${idx}" style="background:#d32f2f;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">🗑</button>
          </div>
        </div>
      </div>
    `).join("");

    // IMPORTANTE: Toda a lógica de criar o .mini-foot, os botões de cupom,
    // endereço e os cálculos foram REMOVIDOS daqui, pois a
    // função 'enhanceMiniCartUI' (linha 490) já faz isso.
  }


  /* 🔄 Vincula botões dinâmicos (incremento, remoção, limpar, finalizar) */
  function bindMiniCartButtons() {
    document.querySelectorAll(".cart-plus").forEach(b => b.addEventListener("click", e => {
      const i = +e.currentTarget.dataset.idx;
      cart[i].qtd++;
      renderMiniCart();
    }));

    document.querySelectorAll(".cart-minus").forEach(b => b.addEventListener("click", e => {
      const i = +e.currentTarget.dataset.idx;
      if (cart[i].qtd > 1) cart[i].qtd--;
      else cart.splice(i, 1);
      renderMiniCart();
    }));

    document.querySelectorAll(".cart-remove").forEach(b => b.addEventListener("click", e => {
      const i = +e.currentTarget.dataset.idx;
      cart.splice(i, 1);
      renderMiniCart();
      popupAdd("Item removido!");
    }));

    // Os botões "finish-order" e "clear-cart" agora são vinculados
    // pela função 'enhanceMiniCartUI'
  }

  const _renderMiniCartOrig = renderMiniCart;
  renderMiniCart = function () {
    _renderMiniCartOrig();
    bindMiniCartButtons();
  };
/* ------------------ ⚙️ LOGIN ------------------ */
  const firebaseConfig = {
    apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
    authDomain: "da-familia-lanches.firebaseapp.com",
    projectId: "da-familia-lanches",
    storageBucket: "da-familia-lanches.appspot.com",
    messagingSenderId: "106857147317",
    appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
  };
  if (window.firebase && !firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  el.userBtn?.addEventListener("click", () => Overlays.open(el.loginModal));
  document.querySelectorAll("#login-modal .login-close").forEach(btn =>
    btn.addEventListener("click", () => Overlays.closeAll())
  );

  // ✅ Login seguro com verificação + popup de feedback
  el.loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email")?.value?.trim();
    const senha = document.getElementById("login-senha")?.value?.trim();
    if (!email || !senha) return alert("Preencha e-mail e senha.");

    auth.signInWithEmailAndPassword(email, senha)
      .then((cred) => {
        currentUser = cred.user;
        el.userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0] || currentUser.email.split("@")[0]}`;
        popupAdd("Login realizado com sucesso!");
        Overlays.closeAll();
      })
      .catch((err) => {
        if (err.code === "auth/user-not-found") {
          if (confirm("Conta não encontrada. Deseja criar uma nova?")) {
            auth.createUserWithEmailAndPassword(email, senha)
              .then((cred) => {
                currentUser = cred.user;
                el.userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
                popupAdd("Conta criada com sucesso! 🎉");
                Overlays.closeAll();
              })
              .catch((e) => alert("Erro: " + e.message));
          }
        } else if (err.code === "auth/wrong-password") {
          alert("Senha incorreta. Tente novamente.");
        } else {
          alert("Erro: " + err.message);
        }
      });
  });

  /* ------------------ Login com Google + Estado ------------------ */
  el.googleBtn?.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then((res) => {
        currentUser = res.user;
        el.userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0] || "Cliente"}`;
        popupAdd("Login com Google realizado! ✅");
        Overlays.closeAll();
      })
      .catch((err) => alert("Erro: " + err.message));
  });

  auth.onAuthStateChanged((user) => {
    currentUser = user || null;
    if (user) {
      el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
      showOrdersFabIfLogged();
    } else {
      el.userBtn.textContent = "Entrar / Cadastrar";
      showOrdersFabIfLogged();
    }
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
      <label class="extra-line" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee;cursor:pointer;">
        <span>${a.nome} — <b>${money(a.preco)}</b></span>
        <input type="checkbox" value="${i}" style="width:20px;height:20px;cursor:pointer;">
      </label>`).join("");
    Overlays.open(el.extrasModal);
  });

  document.querySelectorAll(".extras-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => openExtrasFor(e.currentTarget.closest(".card")))
  );

  el.extrasConfirm?.addEventListener("click", () => {
    if (!produtoExtras) return Overlays.closeAll();
    const checks = [...document.querySelectorAll("#extras-modal .extras-list input:checked")];
    if (!checks.length) return alert("Selecione pelo menos um adicional!");

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
    const nomeCompleto = `${produtoExtras} + ${extrasNomes}`;

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
      <label class="extra-line" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee;cursor:pointer;">
        <span>${o.rotulo} — + ${money(o.delta)}</span>
        <input type="radio" name="combo-drink" value="${i}" ${i === 0 ? "checked" : ""} style="width:20px;height:20px;cursor:pointer;">
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
    if (/^combo/i.test(nome)) {
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
/* ------------------ ⚙️ CONFIGURAÇÕES V2.5 ------------------ */
  const DELIVERY_FEE = 6.00; // 💸 taxa fixa de entrega (R$ 6,00)

  // 🏷️ Tabela de cupons (exemplos)
  // - Valores percentuais usam "percent"
  // - Valores fixos usam "value"
  // - FRETEZERO zera a taxa de entrega
  const COUPONS = {
    "DFL5":        { type: "percent", value: 5,  note: "5% OFF" },
    "DFL10":       { type: "percent", value: 10, note: "10% OFF" },
    "BEMVINDO":    { type: "value",   value: 5,  note: "R$ 5,00 OFF na 1ª compra" },
    "FRETEZERO":   { type: "frete",   value: 0,  note: "Frete grátis" },
    // Adicionando os cupons da sua lógica antiga para garantir
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

    // Se o carrinho estiver vazio, a função 'renderMiniCart' (limpa)
    // já vai ter limpado o miniFoot. Então não fazemos nada.
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
          <button id="apply-coupon" style="background:#000;color:#fff;border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer">Aplicar</button>
        </div>

        <button id="finish-order" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:10px;padding:12px;font-weight:700;cursor:pointer;margin-bottom:8px">
          Finalizar Pedido 🛍️
        </button>
        <button id="clear-cart" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;cursor:pointer">
          Limpar Carrinho
        </button>
      </div>
    `;

    // Listeners dos novos campos
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

    // Reaplica os binds padrão do mini-carrinho (mantendo tudo funcionando)
    document.getElementById("finish-order")?.addEventListener("click", fecharPedido);
    document.getElementById("clear-cart")?.addEventListener("click", () => {
      if (confirm("Limpar todo o carrinho?")) {
        cart = [];
        renderMiniCart(); // isto reaplica enhanceMiniCartUI automaticamente (ver override abaixo)
        popupAdd("Carrinho limpo!");
      }
    });
  }

  // 🔁 Reforço: quando o renderMiniCart original roda, reaplicamos a UI estendida
  const __renderMiniCartPrev = renderMiniCart;
  renderMiniCart = function() {
    __renderMiniCartPrev();   // rendeiriza lista + botões + binds padrões
    enhanceMiniCartUI();      // injeta totais, endereço e cupom
  };

  /* ------------------ 🖼️ Carrossel (mantido) ------------------ */
  el.cPrev?.addEventListener("click", () => {
    if (!el.slides) return;
    el.slides.scrollLeft -= Math.min(el.slides.clientWidth * 0.9, 320);
  });
  el.cNext?.addEventListener("click", () => {
    if (!el.slides) return;
    el.slides.scrollLeft += Math.min(el.slides.clientWidth * 0.9, 320);
  });
  document.querySelectorAll(".slide").forEach((img) => {
    img.addEventListener("click", () => {
      const msg = encodeURIComponent(img.dataset.wa || "Quero essa promoção! 🍔");
      window.open(`https://wa.me/5534997178336?text=${msg}`, "_blank");
    });
  });

  /* ------------------ ⏰ Status + Timer (mantidos) ------------------ */
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
      if (aberto) {
        // CORREÇÃO: O seu timer estava 23h30 no HTML, mas 23h00 no JS.
        // Ajustei para 23h00 (23) como estava no seu JS.
        // Se quiser 23h30, mude (h < 23) para (h < 23 || (h === 23 && m < 30))
        const rest = (23 - h) * 60 - m; 
        el.hoursBanner.innerHTML = `⏰ Hoje atendemos até <b>23h00</b> — Faltam <b>${Math.floor(rest / 60)}h ${rest % 60}min</b>`;
      } else {
        const faltam = h < 18 ? (18 - h) * 60 - m : (24 - h + 18) * 60 - m;
        el.hoursBanner.innerHTML = `🔒 Fechado — Abrimos em <b>${Math.floor(faltam / 60)}h ${faltam % 60}min</b>`;
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

        // Limpa carrinho e mantém endereço/cupom salvos
        cart = [];
        renderMiniCart();
        Overlays.closeAll();
      })
      .catch((err) => alert("Erro: " + err.message));
  }

  // 🔰 Primeira renderização do mini-carrinho com UI estendida
  renderMiniCart();
/* ------------------ 📦 Meus Pedidos (UI + lógica V2.5) ------------------ */
  let ordersFab = document.getElementById("orders-fab");
  if (!ordersFab) {
    ordersFab = document.createElement("button");
    ordersFab.id = "orders-fab";
    ordersFab.innerHTML = "📦 Meus Pedidos";
    document.body.appendChild(ordersFab);
  }

  let ordersPanel = document.querySelector(".orders-panel");
  if (!ordersPanel) {
    ordersPanel = document.createElement("div");
    ordersPanel.className = "orders-panel";
    ordersPanel.innerHTML = `
      <div class="orders-head">
        <span>📦 Meus Pedidos</span>
        <button class="orders-close">✖</button>
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
  function closeOrdersPanel() { Overlays.closeAll(); }

  ordersFab.addEventListener("click", () => {
    if (!currentUser) return alert("Faça login para ver seus pedidos.");
    openOrdersPanel();
    carregarPedidosSeguro();
  });

  ordersPanel.querySelector(".orders-close")?.addEventListener("click", closeOrdersPanel);

  function showOrdersFabIfLogged() {
    if (currentUser) ordersFab.classList.add("show");
    else ordersFab.classList.remove("show");
  }

  function carregarPedidosSeguro() {
    const container = document.getElementById("orders-content");
    if (!container) return;

    container.innerHTML = `<p class="empty-orders">Carregando pedidos...</p>`;

    if (!currentUser || !currentUser.email) {
      setTimeout(carregarPedidosSeguro, 300);
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
     - Mantém Chart Destroy fix
     - Inclui novos campos no CSV
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
        <div class="modal-head" style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #ddd;padding:10px 14px;">
          <h3>📊 Relatórios e Estatísticas</h3>
          <button class="dashboard-close" style="background:#ff5252;color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer;font-weight:600;">✖</button>
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
            <button id="export-csv" style="background:#4caf50;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-weight:600;cursor:pointer;">📁 Exportar CSV</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(div);

    // estiliza cards
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
    if (document.getElementById("admin-fab")) return;
    const btn = document.createElement("button");
    btn.id = "admin-fab";
    btn.innerHTML = "📊 Relatórios";
    Object.assign(btn.style, {
      position: "fixed",
      bottom: "210px", // Posição do FAB de Admin
      right: "20px",
      background: "linear-gradient(135deg,#ffca28,#ffd54f)",
      border: "none",
      color: "#000",
      fontWeight: "600",
      borderRadius: "25px",
      padding: "12px 18px",
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(0,0,0,.3)",
      zIndex: "1300"
    });
    btn.addEventListener("click", () => {
      createDashboard();
      ensureChartJS(() => carregarRelatorios("7"));
      Overlays.open(document.getElementById("admin-dashboard"));
    });
    document.body.appendChild(btn);
  }
/* ------------------ 📊 Carregar Relatórios (V2.5) ------------------ */
  function carregarRelatorios(periodo = "7") {
    const agora = new Date();
    let start = new Date(0); // início de todos
    if (periodo !== "all") {
      start = new Date(agora);
      start.setDate(start.getDate() - Number(periodo));
    }

    db.collection("Pedidos")
      .orderBy("data", "desc")
      .get()
      .then(snap => {
        // Normaliza documentos (compatível com pedidos antigos e novos)
        const pedidos = snap.docs.map(d => {
          const p = d.data() || {};
          // Compat: total pode existir sem subtotal/desconto/entrega (v2.3-)
          const subtotal = Number(p.subtotal ?? 0);
          const entrega  = Number(p.entrega  ?? 0);
          const desconto = Number(p.desconto ?? 0);
          const total    = Number(p.total    ?? (subtotal + entrega - desconto)) || 0;

          return {
            ...p,
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
        // A função 'gerarResumoECharts' não foi fornecida no seu código,
        // então estou comentando para evitar erros.
        // Se você tiver essa função, pode descomentar.
        // gerarResumoECharts(filtrados); 
        
        // Em vez disso, vamos apenas preencher os cards de resumo:
        const totalVendido = filtrados.reduce((s, p) => s + p.total, 0);
        const numPedidos = filtrados.length;
        const ticketMedio = numPedidos > 0 ? totalVendido / numPedidos : 0;
        
        document.getElementById("card-total").textContent = `Total Arrecadado: ${money(totalVendido)}`;
        document.getElementById("card-pedidos").textContent = `Pedidos: ${numPedidos}`;
        document.getElementById("card-ticket").textContent = `Ticket Médio: ${money(ticketMedio)}`;

        // Lógica de exportar CSV (adaptada do seu código, mas não estava completa)
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
      .catch(err => alert("Erro ao carregar relatórios: " + err.message));

    // bind do seletor de período (uma única vez)
    const sel = document.getElementById("filter-period");
    if (sel && !sel._bound) {
      sel.addEventListener("change", e => carregarRelatorios(e.target.value));
      sel._bound = true;
    }
  }

  /* ------------------ 🔐 Segurança/Admin + UX Final ------------------ */
  auth.onAuthStateChanged(user => {
    currentUser = user; // Atualiza o currentUser global
    if (user) {
      el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
      showOrdersFabIfLogged(); // Mostra "Meus Pedidos"
    } else {
      el.userBtn.textContent = "Entrar / Cadastrar";
      showOrdersFabIfLogged(); // Esconde "Meus Pedidos"
    }

    // Lógica do Painel Admin
    const fab = document.getElementById("admin-fab");
    if (user && isAdmin(user)) {
      if (!fab) createAdminFab(); // Cria o botão "Relatórios"
    } else {
      fab?.remove();
      document.getElementById("admin-dashboard")?.remove();
      Overlays.closeAll(); // Fecha o dashboard se o usuário fizer logout
    }
  });

  // Evita estado “zumbi” ao voltar do histórico (PWA/Android)
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      console.warn("↻ Página reaberta via cache, recarregando...");
      location.reload();
    }
  });

  // Observabilidade: erros comuns em leitura de strings/arrays antigos
  window.addEventListener("error", (e) => {
    if (String(e?.message || "").toLowerCase().includes("split")) {
      popupAdd("Humm… houve um pequeno erro ao ler dados. Atualize a página.");
    }
    console.warn("⚠️ Erro interceptado:", e?.message);
  });

  console.log("%c🍔 DFL v2.5 — Cupom + Endereço + Frete R$6 — Relatórios e Painel OK",
              "background:#4caf50;color:#fff;padding:8px 12px;border-radius:8px;font-weight:700;");

}); // Fim do DOMContentLoaded
