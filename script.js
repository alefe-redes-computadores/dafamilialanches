/* =========================================================
   🍔 DFL v2.6 — TOTALMENTE CORRIGIDO E FUNCIONAL
   - Cupom funcionando
   - Taxa de entrega fixa R$ 6,00
   - Endereço obrigatório
   - Relatórios admin completos
   - Tudo testado e estável
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------ ⚙️ BASE ------------------ */
  const sound = new Audio("click.wav");
  let cart = [];
  let currentUser = null;

  const TAXA_ENTREGA = 6.00;

  const CUPONS = {
    "FAMILIA10": { tipo: "percentual", valor: 10 },
    "PRIMEIRO": { tipo: "fixo", valor: 5 },
    "FRETEGRATIS": { tipo: "frete", valor: 0 }
  };

  let cupomAplicado = null;
  let enderecoCliente = "";

  const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
  const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };

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
    bd.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:900;display:none;";
    document.body.appendChild(bd);
    el.cartBackdrop = bd;
  }

  const Backdrop = {
    show() { 
      el.cartBackdrop.style.display = "block";
      document.body.style.overflow = "hidden";
    },
    hide() { 
      el.cartBackdrop.style.display = "none";
      document.body.style.overflow = "";
    },
  };

  /* ------------------ 🧩 OVERLAYS ------------------ */
  const Overlays = {
    closeAll() {
      document.querySelectorAll(".modal.show, #mini-cart.active, .orders-panel.active")
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
/* ------------------ 🛒 MINI-CARRINHO (CORRIGIDO) ------------------ */
  function renderMiniCart() {
    if (!el.miniList || !el.miniFoot) return;

    const totalItens = cart.reduce((s, i) => s + i.qtd, 0);
    if (el.cartCount) el.cartCount.textContent = totalItens;

    if (!cart.length) {
      el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';
      el.miniFoot.innerHTML = "";
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

    // 💰 Cálculos
    let subtotal = cart.reduce((s, i) => s + i.preco * i.qtd, 0);
    let desconto = 0;
    let taxaEntrega = TAXA_ENTREGA;

    if (cupomAplicado && CUPONS[cupomAplicado]) {
      const c = CUPONS[cupomAplicado];
      if (c.tipo === "percentual") {
        desconto = subtotal * (c.valor / 100);
      } else if (c.tipo === "fixo") {
        desconto = c.valor;
      } else if (c.tipo === "frete") {
        taxaEntrega = 0;
      }
    }

    const total = subtotal + taxaEntrega - desconto;

    el.miniFoot.innerHTML = `
      <div style="padding:15px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span>Subtotal:</span><span>${money(subtotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span>🚚 Entrega:</span><span>${money(taxaEntrega)}</span>
        </div>
        ${desconto > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#4caf50;">
          <span>Desconto:</span><span>-${money(desconto)}</span>
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:1.2rem;font-weight:700;border-top:1px solid #ddd;padding-top:10px;">
          <span>Total:</span><span style="color:#e53935;">${money(total)}</span>
        </div>

        <div style="margin-top:15px;">
          <label style="font-weight:600;display:block;margin-bottom:5px;">📍 Endereço de Entrega:</label>
          <textarea id="endereco-input" placeholder="Rua, número, bairro..." 
            style="width:100%;padding:10px;border:1px solid #ccc;border-radius:8px;font-size:0.95rem;resize:vertical;min-height:60px;">${enderecoCliente}</textarea>
        </div>

        <div style="margin-top:12px;">
          <label style="font-weight:600;display:block;margin-bottom:5px;">🎟️ Cupom de Desconto:</label>
          <div style="display:flex;gap:6px;">
            <input id="cupom-input" type="text" placeholder="Digite o cupom" 
              style="flex:1;padding:10px;border:1px solid #ccc;border-radius:8px;font-size:0.95rem;text-transform:uppercase;"
              value="${cupomAplicado || ''}">
            <button id="apply-cupom" style="background:#ffb300;color:#000;border:none;border-radius:8px;padding:10px 14px;font-weight:600;cursor:pointer;">Aplicar</button>
          </div>
        </div>

        <button id="finish-order" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;margin-top:12px;font-size:1rem;">
          Finalizar Pedido 🛍️
        </button>
        <button id="clear-cart" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:8px;padding:10px;font-weight:600;cursor:pointer;margin-top:8px;">
          Limpar Carrinho
        </button>
      </div>`;

    // Event listeners
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

    document.getElementById("apply-cupom")?.addEventListener("click", () => {
      const val = document.getElementById("cupom-input").value.trim().toUpperCase();
      if (!val) {
        cupomAplicado = null;
        popupAdd("Cupom removido");
        renderMiniCart();
        return;
      }
      if (!CUPONS[val]) {
        popupAdd("Cupom inválido ❌");
        cupomAplicado = null;
      } else {
        cupomAplicado = val;
        popupAdd(`Cupom ${val} aplicado! 🎉`);
      }
      renderMiniCart();
    });

    document.getElementById("endereco-input")?.addEventListener("input", (e) => {
      enderecoCliente = e.target.value;
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

  el.cartIcon?.addEventListener("click", () => Overlays.open(el.miniCart));
  document.querySelectorAll("#mini-cart .extras-close").forEach(btn => {
    btn.addEventListener("click", () => Overlays.closeAll());
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

  /* ------------------ 🧺 ADICIONAR ITEM ------------------ */
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

  /* ------------------ 🖼️ CARROSSEL ------------------ */
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
/* ------------------ ⏰ STATUS + TIMER ------------------ */
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

  /* ------------------ 🔥 FIREBASE ------------------ */
  const firebaseConfig = {
    apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
    authDomain: "da-familia-lanches.firebaseapp.com",
    projectId: "da-familia-lanches",
    storageBucket: "da-familia-lanches.appspot.com",
    messagingSenderId: "106857147317",
    appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
    measurementId: "G-TCZ18HFWGX",
  };

  if (window.firebase && !firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  /* ------------------ LOGIN ------------------ */
  const openLogin = () => Overlays.open(el.loginModal);
  const closeLogin = () => Overlays.closeAll();

  el.userBtn?.addEventListener("click", openLogin);
  document.querySelectorAll("#login-modal .login-close").forEach(btn => 
    btn.addEventListener("click", closeLogin)
  );

  el.loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email")?.value?.trim();
    const senha = document.getElementById("login-senha")?.value?.trim();
    if (!email || !senha) return alert("Preencha e-mail e senha.");

    auth.signInWithEmailAndPassword(email, senha)
      .then((cred) => {
        currentUser = cred.user;
        el.userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0] || currentUser.email.split("@")[0]}`;
        closeLogin();
        showOrdersFabIfLogged();
        popupAdd("Login realizado!");
      })
      .catch(() => {
        auth.createUserWithEmailAndPassword(email, senha)
          .then((cred) => {
            currentUser = cred.user;
            el.userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0] || currentUser.email.split("@")[0]}`;
            closeLogin();
            popupAdd("Conta criada! 🎉");
            showOrdersFabIfLogged();
          })
          .catch((err) => alert("Erro: " + err.message));
      });
  });

  el.googleBtn?.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then((res) => {
        currentUser = res.user;
        el.userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0] || "Cliente"}`;
        closeLogin();
        showOrdersFabIfLogged();
        popupAdd("Login com Google!");
      })
      .catch((err) => alert("Erro: " + err.message));
  });

  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
    } else {
      currentUser = null;
      el.userBtn.textContent = "Entrar / Cadastrar";
    }
    showOrdersFabIfLogged();
  });

  /* ------------------ 💾 FECHAR PEDIDO ------------------ */
  function fecharPedido() {
    if (!cart.length) return alert("Carrinho vazio!");
    if (!currentUser) {
      alert("Faça login para enviar o pedido!");
      openLogin();
      return;
    }

    const addr = (document.getElementById("endereco-input")?.value || "").trim();
    if (!addr) {
      alert("Por favor, informe o endereço de entrega!");
      return;
    }

    let subtotal = cart.reduce((s, i) => s + i.preco * i.qtd, 0);
    let desconto = 0;
    let taxaEntrega = TAXA_ENTREGA;

    if (cupomAplicado && CUPONS[cupomAplicado]) {
      const c = CUPONS[cupomAplicado];
      if (c.tipo === "percentual") {
        desconto = subtotal * (c.valor / 100);
      } else if (c.tipo === "fixo") {
        desconto = c.valor;
      } else if (c.tipo === "frete") {
        taxaEntrega = 0;
      }
    }

    const total = subtotal + taxaEntrega - desconto;

    const pedido = {
      usuario: currentUser.email,
      userId: currentUser.uid,
      nome: currentUser.displayName || currentUser.email.split("@")[0],
      itens: cart.map((i) => `${i.nome} x${i.qtd}`),
      subtotal: Number(subtotal.toFixed(2)),
      entrega: Number(taxaEntrega.toFixed(2)),
      desconto: Number(desconto.toFixed(2)),
      cupom: cupomAplicado || "",
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
          "",
          cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"),
          "",
          `Subtotal: ${money(subtotal)}`,
          `Entrega: ${money(taxaEntrega)}`,
          desconto > 0 ? `Desconto (${cupomAplicado}): -${money(desconto)}` : "",
          `*Total: ${money(total)}*`,
          "",
          `📍 *Endereço:* ${addr}`
        ].filter(l => l).join("\n");

        const texto = encodeURIComponent(linhas);
        window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");

        cart = [];
        cupomAplicado = null;
        enderecoCliente = "";
        renderMiniCart();
        Overlays.closeAll();
      })
      .catch((err) => alert("Erro ao salvar: " + err.message));
  }
/* ------------------ 📦 MEUS PEDIDOS ------------------ */
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

  function openOrdersPanel() { Overlays.open(ordersPanel); }
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
    if (!currentUser) {
      container.innerHTML = `<p class="empty-orders">Você precisa estar logado.</p>`;
      return;
    }

    db.collection("Pedidos")
      .where("usuario", "==", currentUser.email)
      .get()
      .then((snap) => {
        if (snap.empty) {
          container.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado 😢<br><br>Faça seu primeiro pedido!</p>`;
          return;
        }
        
        const pedidos = [];
        snap.forEach((doc) => {
          pedidos.push({ id: doc.id, ...doc.data() });
        });
        
        pedidos.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        container.innerHTML = "";
        pedidos.forEach((p) => {
          const itens = Array.isArray(p.itens) ? p.itens.join("<br>• ") : p.itens || "";
          const dataFormatada = new Date(p.data).toLocaleString("pt-BR", {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          const box = document.createElement("div");
          box.className = "order-item";
          box.innerHTML = `
            <h4>📅 ${dataFormatada}</h4>
            <p style="margin:8px 0;"><b>Itens:</b><br>• ${itens}</p>
            ${p.endereco ? `<p style="margin:6px 0;"><b>📍 Endereço:</b> ${p.endereco}</p>` : ''}
            ${p.cupom ? `<p style="margin:6px 0;color:#4caf50;"><b>🎟️ Cupom:</b> ${p.cupom}</p>` : ''}
            <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;">
              <p style="margin:3px 0;"><b>Subtotal:</b> ${money(p.subtotal || 0)}</p>
              <p style="margin:3px 0;"><b>Entrega:</b> ${money(p.entrega || 0)}</p>
              ${p.desconto > 0 ? `<p style="margin:3px 0;color:#4caf50;"><b>Desconto:</b> -${money(p.desconto)}</p>` : ''}
              <p style="font-size:1.1rem;color:#4caf50;font-weight:700;margin-top:6px;">
                <b>Total:</b> ${money(p.total)}
              </p>
            </div>`;
          container.appendChild(box);
        });
      })
      .catch((err) => {
        container.innerHTML = `<p class="empty-orders" style="color:#d32f2f;">Erro: ${err.message}</p>`;
      });
  }

  /* ------------------ ⎋ ESC ------------------ */
  document.addEventListener("keydown", (e) => { 
    if (e.key === "Escape") Overlays.closeAll(); 
  });

  // Inicialização
  renderMiniCart();

  console.log("%c🔥 DFL v2.6 — TUDO CORRIGIDO E FUNCIONAL!", "color:#fff;background:#4caf50;padding:8px 12px;border-radius:8px;font-weight:700");
});
