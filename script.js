/* =========================================================
   🍔 DFL v1.7.6 — VISUAL REFINADO + SEÇÃO BEBIDAS
   Totalmente funcional + melhorias visuais + novos produtos
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ------------------ ⚙️ BASE ------------------ */
  const sound = new Audio("click.wav");
  let cart = [];
  let currentUser = null;

  const money = (n) => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;
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
    hoursBanner: document.querySelector(".hours-banner")
  };

  /* ------------------ 🌫️ BACKDROP ------------------ */
  if (!el.cartBackdrop) {
    const bd = document.createElement("div");
    bd.id = "cart-backdrop";
    document.body.appendChild(bd);
    el.cartBackdrop = bd;
  }

  const Backdrop = {
    show() {
      el.cartBackdrop.classList.add("show");
      document.body.classList.add("no-scroll");
    },
    hide() {
      el.cartBackdrop.classList.remove("show");
      document.body.classList.remove("no-scroll");
    },
  };

  /* ------------------ 🧩 OVERLAYS ------------------ */
  const Overlays = {
    closeAll() {
      document.querySelectorAll(".modal.show, #mini-cart.active, .orders-panel.active")
        .forEach((el) => el.classList.remove("show", "active"));
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

  /* ------------------ 💬 POPUP DE ADIÇÃO ------------------ */
  function popupAdd(msg) {
    let popup = document.querySelector(".popup-add");
    if (!popup) {
      popup = document.createElement("div");
      popup.className = "popup-add";
      document.body.appendChild(popup);
    }
    popup.textContent = msg;
    popup.classList.add("show");
    setTimeout(() => popup.classList.remove("show"), 2000);
  }

  /* ------------------ 🛒 RENDERIZAR MINI-CARRINHO ------------------ */
  function renderMiniCart() {
    if (!el.miniList || !el.miniFoot) return;

    const totalItens = cart.reduce((sum, i) => sum + i.qtd, 0);
    if (el.cartCount) el.cartCount.textContent = totalItens;

    if (cart.length === 0) {
      el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';
      el.miniFoot.innerHTML = '';
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
            <button class="cart-minus modern-btn red" data-idx="${idx}">−</button>
            <span style="font-weight:600;min-width:20px;text-align:center;">${item.qtd}</span>
            <button class="cart-plus modern-btn green" data-idx="${idx}">+</button>
            <button class="cart-remove modern-btn black" data-idx="${idx}">🗑</button>
          </div>
        </div>
      </div>
    `).join('');

    const total = cart.reduce((sum, i) => sum + (i.preco * i.qtd), 0);
    el.miniFoot.innerHTML = `
      <div style="padding:15px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:15px;font-size:1.2rem;font-weight:600;">
          <span>Total:</span>
          <span style="color:#e53935;">${money(total)}</span>
        </div>
        <button id="finish-order" class="btn-primary full">Finalizar Pedido 🛍️</button>
        <button id="clear-cart" class="btn-secondary full">Limpar Carrinho</button>
      </div>
    `;

    document.querySelectorAll(".cart-plus").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        cart[idx].qtd++;
        renderMiniCart();
      });
    });

    document.querySelectorAll(".cart-minus").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        if (cart[idx].qtd > 1) cart[idx].qtd--;
        else cart.splice(idx, 1);
        renderMiniCart();
      });
    });

    document.querySelectorAll(".cart-remove").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        cart.splice(idx, 1);
        renderMiniCart();
        popupAdd("Item removido!");
      });
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

  // ****** CORREÇÃO: Função "Finalizar Pedido" ADICIONADA ******
  function fecharPedido() {
    if (cart.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }
    
    const total = cart.reduce((sum, i) => sum + (i.preco * i.qtd), 0);
    
    let mensagem = "Olá, Da Família Lanches! 🍔\n\nGostaria de fazer o seguinte pedido:\n\n";
    
    cart.forEach(item => {
      // Formata cada item do carrinho
      let nomeItem = item.nome.replace(/<span class="badge.*?<\/span>/gi, "").trim(); // Limpa tags HTML se houver
      mensagem += `*${item.qtd}x* ${nomeItem} - ${money(item.preco * item.qtd)}\n`;
    });
    
    mensagem += `\n*Total:* *${money(total)}*`;
    
    if (currentUser) {
      mensagem += `\n\n*Cliente:* ${currentUser.displayName || currentUser.email}`;
    }
    
    mensagem += "\n\nAguardando confirmação. Obrigado!";

    const fone = "5534997178336"; // Seu número do WhatsApp
    const link = `https://wa.me/${fone}?text=${encodeURIComponent(mensagem)}`;
    
    window.open(link, "_blank");
    
    // Opcional: descomente as linhas abaixo para limpar o carrinho após enviar
    // cart = [];
    // renderMiniCart();
    // Overlays.closeAll();
  }
  // ****** FIM DA NOVA FUNÇÃO ******

  el.cartIcon?.addEventListener("click", () => Overlays.open(el.miniCart));
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
  const openExtrasFor = safe((card) => {
    if (!card || !el.extrasModal || !el.extrasList) return;
    produtoExtras = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Produto";

    el.extrasList.innerHTML = adicionais.map((a, i) => `
      <label class="extra-line modern-line">
        <span>${a.nome} — <b>${money(a.preco)}</b></span>
        <input type="checkbox" value="${i}" class="modern-check">
      </label>
    `).join("");

    Overlays.open(el.extrasModal);
  });

  document.querySelectorAll(".extras-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const card = e.currentTarget.closest(".card");
      openExtrasFor(card);
    })
  );

  el.extrasConfirm?.addEventListener("click", () => {
    if (!produtoExtras) return Overlays.closeAll();
    const checks = [...document.querySelectorAll("#extras-modal .extras-list input:checked")];

    if (checks.length === 0) {
      alert("Selecione pelo menos um adicional!");
      return;
    }

    checks.forEach((c) => {
      const a = adicionais[+c.value];
      cart.push({ nome: `${produtoExtras} + ${a.nome}`, preco: a.preco, qtd: 1 });
    });
    renderMiniCart();
    popupAdd(`Adicionais incluídos!`);
    Overlays.closeAll();
  });

  document.querySelectorAll("#extras-modal .extras-close").forEach((b) =>
    b.addEventListener("click", () => Overlays.closeAll())
  );

  /* ------------------ 🥤 MODAL DE BEBIDAS (COMBOS) ------------------ */
  const comboDrinkOptions = {
    casal: [
      { rotulo: "Fanta 1L (padrão)", delta: 0.0 },
      { rotulo: "Coca 1L", delta: 3.0 },
      { rotulo: "Coca 1L Zero", delta: 3.0 },
      { rotulo: "Guaraná 1L", delta: 2.5 },
    ],
    familia: [
      { rotulo: "Kuat 2L (padrão)", delta: 0.0 },
      { rotulo: "Coca 2L", delta: 5.0 },
      { rotulo: "Guaraná 2L", delta: 4.5 },
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
      <label class="extra-line modern-line">
        <span>${o.rotulo} — <b>+${money(o.delta)}</b></span>
        <input type="radio" name="combo-drink" value="${i}" ${i === 0 ? "checked" : ""} class="modern-check">
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
    cart.push({ nome: finalName, preco: finalPrice, qtd: 1 });
    popupAdd(`${finalName} adicionado!`);
    renderMiniCart();
    Overlays.closeAll();
  });

  document.querySelectorAll("#combo-modal .combo-close").forEach((b) =>
    b.addEventListener("click", () => Overlays.closeAll())
  );

  /* ------------------ 🧺 ADICIONAR ITEM ------------------ */
  function addCommonItem(nome, preco) {
    // Limpa o nome de tags HTML (como as badges) antes de comparar
    const nomeLimpo = nome.replace(/<span class="badge.*?<\/span>/gi, "").trim();
    
    const found = cart.find((i) => i.nome === nomeLimpo && i.preco === preco);
    if (found) {
      found.qtd += 1;
    } else {
      cart.push({ nome: nomeLimpo, preco: preco, qtd: 1 });
    }
    renderMiniCart();
    popupAdd(`${nomeLimpo} adicionado!`);
  }


  document.querySelectorAll(".add-cart").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const card = e.currentTarget.closest(".card");
      if (!card) return;
      // Pega o NOME do data-name, que é mais limpo
      const nome = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";
      const preco = parseFloat(card.dataset.price || "0");
      
      if (/^combo/i.test(nome)) {
        openComboModal(nome, preco);
      } else {
        addCommonItem(nome, preco);
      }
    })
  );

  /* ------------------ 🍾 SEÇÃO BEBIDAS (CORRIGIDA) ------------------ */
  const bebidas = [
    { nome: "Coca-Cola 200ml", preco: 4.00 },
    { nome: "Coca-Cola 310ml", preco: 5.00 },
    { nome: "Coca-Cola 310ml Zero", preco: 5.00 },
    { nome: "Del Valle Uva 450ml", preco: 5.00 },
    { nome: "Del Valle Laranja 450ml", preco: 5.00 },
    { nome: "Fanta 1L", preco: 8.00 },
    { nome: "Coca-Cola 1L", preco: 9.00 },
    { nome: "Coca-Cola 1L Zero", preco: 9.00 },
    { nome: "Kuat 2L", preco: 10.00 },
    { nome: "Coca-Cola 2L", preco: 13.00 },
  ];

  // 1. Pega a DIV correta que você criou no HTML
  const bebidasGrid = document.getElementById("bebidas-grid");
  if (bebidasGrid) {
    // 2. Preenche SÓ A DIV com os cards
    bebidasGrid.innerHTML = bebidas.map(b => `
      <div class="card" data-name="${b.nome}" data-price="${b.preco}">
        <h3>${b.nome}</h3>
        <p><b>${money(b.preco)}</b></p>
        <div class="actions">
          <button class="add-cart">Adicionar</button>
        </div>
      </div>
    `).join("");

    // 3. IMPORTANTE: Adiciona os cliques DEPOIS de criar os cards
    bebidasGrid.querySelectorAll(".add-cart").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const card = e.currentTarget.closest(".card");
        const nome = card.dataset.name;
        const preco = parseFloat(card.dataset.price);
        addCommonItem(nome, preco); // A função addCommonItem() agora funciona
      });
    });
  }

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

  /* ------------------ ⏰ STATUS ------------------ */
  const atualizarStatus = safe(() => {
    const agora = new Date();
    const hora = agora.getHours();
    const minuto = agora.getMinutes();
    const aberto = hora >= 18 && hora < 23;

    if (el.statusBanner) {
      el.statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!";
      el.statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`;
    }

    if (el.hoursBanner) {
      if (aberto) {
        const restante = (23 - hora) * 60 - minuto;
        const h = Math.floor(restante / 60);
        const m = restante % 60;
        el.hoursBanner.innerHTML = `⏰ Hoje atendemos até <b>23h00</b> — Faltam <b>${h}h ${m}min</b>`;
      } else {
        const faltam = hora < 18 ? (18 - hora) * 60 - minuto : (24 - hora + 18) * 60 - minuto;
        const h = Math.floor(faltam / 60);
        const m = faltam % 60;
        el.hoursBanner.innerHTML = `🔒 Fechado — Abrimos em <b>${h}h ${m}min</b>`;
      }
    }
  });
  atualizarStatus();
  setInterval(atualizarStatus, 60000);

  /* ------------------ ⏳ TIMER PROMOÇÕES ------------------ */
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

  function openOrdersPanel() {
    Overlays.closeAll();
    ordersPanel.classList.add("active");
    el.cartBackdrop.classList.add("show");
    document.body.classList.add("no-scroll");
  }

  function closeOrdersPanel() {
    ordersPanel.classList.remove("active");
    el.cartBackdrop.classList.remove("show");
    document.body.classList.remove("no-scroll");
  }

  ordersFab.addEventListener("click", () => {
    if (!currentUser) {
      alert("Faça login para ver seus pedidos.");
      return;
    }
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
    container.innerHTML = `<p class="empty-orders">⏳ Carregando pedidos...</p>`;

    if (!currentUser) {
      container.innerHTML = `<p class="empty-orders">Faça login para ver seus pedidos.</p>`;
      return;
    }

    db.collection("Pedidos")
      .where("usuario", "==", currentUser.email)
      .get()
      .then((snap) => {
        if (snap.empty) {
          container.innerHTML = `<p class="empty-orders">😢 Nenhum pedido encontrado.</p>`;
          return;
        }
        const pedidos = [];
        snap.forEach((doc) => pedidos.push({ id: doc.id, ...doc.data() }));
        pedidos.sort((a, b) => new Date(b.data) - new Date(a.data));

        container.innerHTML = pedidos.map(p => `
          <div class="order-item">
            <h4>📅 ${new Date(p.data).toLocaleString("pt-BR")}</h4>
            <p><b>Itens:</b><br>• ${Array.isArray(p.itens) ? p.itens.join("<br>• ") : p.itens}</p>
            <p style="color:#4caf50;margin-top:5px;"><b>Total:</b> ${money(p.total)}</p>
          </div>
        `).join("");
      })
      .catch((err) => {
        container.innerHTML = `<p class="empty-orders" style="color:red;">Erro: ${err.message}</p>`;
      });
  }

  /* ------------------ ⎋ ESC ------------------ */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") Overlays.closeAll();
  });

  renderMiniCart();
  console.log("%c🔥 DFL v1.7.6 — Visual refinado + bebidas OK!", "color:#fff;background:#4caf50;padding:8px 12px;border-radius:8px;font-weight:600");
});

/* CORREÇÃO: Bloco duplicado e quebrado de "Bebidas" foi removido daqui.
  A lógica correta já está dentro do 'DOMContentLoaded' acima.
*/
