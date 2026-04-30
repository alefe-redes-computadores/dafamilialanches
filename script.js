/* =========================================================
   🍰 Degust v11.5 — SISTEMA UI BLINDADO + CARDÁPIO NOVO
   Correções: nomes de produtos, busca inteligente e emojis
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  let pixCopied = false;

  /* =========================================================
     🛡️ UIManager v11.0
  ========================================================= */
  let ui_lock = false;

  function lockUI(ms = 350) {
    ui_lock = true;
    setTimeout(() => ui_lock = false, ms);
  }

  const UIManager = {
    currentPanel: null,

    open(panelName, panelElement) {
      if (ui_lock) return;
      lockUI();
      this.closeAll();
      if (!panelElement) return;

      this.currentPanel = panelName;

      const useActive = ["mini-cart", "pix-modal"];
      if (useActive.includes(panelElement.id)) {
        panelElement.classList.add("active");
      } else {
        panelElement.classList.add("show");
      }

      const overlayId = panelElement.dataset.overlay;
      if (overlayId) {
        const overlay = document.getElementById(overlayId);
        if (overlay) overlay.classList.add("active");
        return; 
      }

      if (panelElement.id !== "side-menu") {
        Backdrop.show();
      }
      this.closeSideMenu();
    },

    close(panelName, panelElement) {
      if (panelElement) panelElement.classList.remove("show", "active");
      if (this.currentPanel === panelName) this.currentPanel = null;
    },

    closeAll() {
      document.querySelectorAll(".modal.show, .modal.active, #mini-cart.active").forEach(el => {
        el.classList.remove("show", "active");
      });
      document.querySelectorAll(".painel-overlay.active").forEach(el => {
        el.classList.remove("active");
      });
      this.closeSideMenu();
      Backdrop.hide();
      this.currentPanel = null;
    },

    closeSideMenu() {
      const sideMenu   = document.getElementById("side-menu");
      const menuOverlay = document.getElementById("menu-overlay");
      if (sideMenu)   sideMenu.classList.remove("active");
      if (menuOverlay) menuOverlay.classList.remove("active");
      document.body.style.overflow = "";
    },

    handleMenuAction(actionCallback) {
      if (ui_lock) return;
      lockUI(200);
      this.closeSideMenu();
      setTimeout(() => {
        if (typeof actionCallback === "function") actionCallback();
      }, 150);
    }
  };

  /* --- BACKDROP --- */
  const Backdrop = {
    show() {
      const bd = document.getElementById("cart-backdrop");
      if (bd) { bd.classList.add("active"); document.body.classList.add("no-scroll"); }
    },
    hide() {
      const bd = document.getElementById("cart-backdrop");
      if (bd) { bd.classList.remove("active"); document.body.classList.remove("no-scroll"); }
    }
  };

  const bdElement = document.getElementById("cart-backdrop");
  if (bdElement) bdElement.addEventListener("click", () => UIManager.closeAll());

  /* =========================================================
     🍔 MENU HAMBÚRGUER
  ========================================================= */
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const sideMenu     = document.getElementById("side-menu");
  const menuOverlay  = document.getElementById("menu-overlay");
  const menuClose    = document.getElementById("menu-close");

  function openSideMenu() {
    if (ui_lock) return;
    lockUI();
    UIManager.closeAll();
    if (sideMenu)   sideMenu.classList.add("active");
    if (menuOverlay) menuOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener("click", openSideMenu);
  if (menuClose)    menuClose.addEventListener("click",    () => UIManager.closeSideMenu());
  if (menuOverlay)  menuOverlay.addEventListener("click",  () => UIManager.closeSideMenu());

  /* =========================================================
     🎯 ATALHOS DO MENU LATERAL
  ========================================================= */
  document.querySelectorAll(".menu-link-action[data-action]").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const action = link.dataset.action;

      UIManager.handleMenuAction(() => {
        if (action === "meus-pedidos") {
          const overlay = document.getElementById("painelPedidosOverlay");
          if (overlay) overlay.classList.add("active");
        } else if (action === "recompensas") {
          const overlay = document.getElementById("painelRecompensasOverlay");
          if (overlay) overlay.classList.add("active");
        } else if (action === "perfil") {
          const userBtn = document.getElementById("user-btn");
          if (userBtn) userBtn.click();
        } else if (action === "relatorios") {
          abrirRelatorios();
        }
      });
    });
  });

  document.querySelectorAll(".menu-link[href^='#']").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      UIManager.handleMenuAction(() => {
        const target = document.querySelector(link.getAttribute("href"));
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          target.classList.add("highlight-section");
          setTimeout(() => target.classList.remove("highlight-section"), 1000);
        }
      });
    });
  });

  document.querySelectorAll(".menu-link-social").forEach(link => {
    link.addEventListener("click", () => UIManager.closeSideMenu());
  });

  /* =========================================================
     🎁 PAINÉIS DESLIZANTES
  ========================================================= */
  function fecharTodosPaineis() {
    document.querySelectorAll(".painel-overlay").forEach(el => el.classList.remove("active"));
  }

  document.querySelectorAll(".fechar-painel, .fechar-pedidos, .fechar-recompensas").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      fecharTodosPaineis();
    });
  });

  document.querySelectorAll(".painel-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) fecharTodosPaineis();
    });
  });

  /* =========================================================
     💰 SISTEMA PIX
  ========================================================= */
  const pixModal       = document.getElementById("pix-modal");
  const pixValor       = document.getElementById("pix-valor");
  const pixBody        = document.querySelector("#pix-modal .pix-body");
  const pixBtnCopy     = document.getElementById("btn-copy-pix");
  const pixBtnWhatsapp = document.getElementById("btn-finish-pix");
  const pixClose       = document.querySelector(".pix-close");

  const CHAVE_PIX = "degustbolosnopote@gmail.com";

  async function abrirModalPIX() {
    try {
      const { total } = await calcTotals();
      if (pixValor) pixValor.textContent = money(total);
      UIManager.open("pix", pixModal);
    } catch (err) {
      console.error("Erro ao abrir PIX:", err);
      fecharPedido();
    }
  }

  if (pixBtnCopy) {
    pixBtnCopy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(CHAVE_PIX);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = CHAVE_PIX;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      pixCopied = true;
      const orig = pixBtnCopy.textContent;
      pixBtnCopy.textContent = "Chave Copiada! ✓";
      pixBtnCopy.style.background = "#4CAF50";
      setTimeout(() => { pixBtnCopy.textContent = orig; pixBtnCopy.style.background = ""; }, 2000);
    });
  }

  if (pixClose) {
    pixClose.addEventListener("click", (e) => {
      e.preventDefault();
      UIManager.closeAll();
    });
  }

  const btnSemPix = document.getElementById("btn-finish-sem-pix");
  if (btnSemPix) {
    btnSemPix.addEventListener("click", async () => {
      const { subtotal, delivery, discount, total } = await calcTotals();
      const addr = window.finalAddressStringForWhatsApp || "Não informado";
      const msg = [
        "*NOVO PEDIDO - Degust Bolos no Pote*",
        "------------------------------------",
        "",
        "*Itens do Pedido:*",
        cart.map(i => `  - ${i.nome} x${i.qtd}  (${money(i.preco * i.qtd)})`).join("\n"),
        "",
        "------------------------------------",
        `Subtotal: *${money(subtotal)}*`,
        `Entrega: *${delivery === 0 ? "GRATIS" : money(delivery)}*`,
        discount > 0 ? `Desconto: *-${money(discount)}*` : null,
        `*TOTAL: ${money(total)}*`,
        "",
        `Endereco: ${addr}`,
        "",
        "Pagamento: A COMBINAR"
      ].filter(l => l !== null).join("\n");
      window.open(`https://wa.me/5538998527894?text=${encodeURIComponent(msg)}`, "_blank");
      salvarPedidoFirestore(total, subtotal, delivery, discount, addr);
      UIManager.closeAll();
    });
  }

  if (pixBtnWhatsapp) {
    pixBtnWhatsapp.addEventListener("click", async () => {
      const { subtotal, delivery, discount, total } = await calcTotals();
      const addr = window.finalAddressStringForWhatsApp || "Não informado";
      const msg = [
        "*NOVO PEDIDO - Degust Bolos no Pote*",
        "------------------------------------",
        "",
        "*Itens do Pedido:*",
        cart.map(i => `  - ${i.nome} x${i.qtd}  (${money(i.preco * i.qtd)})`).join("\n"),
        "",
        "------------------------------------",
        `Subtotal: *${money(subtotal)}*`,
        `Entrega: *${delivery === 0 ? "GRATIS" : money(delivery)}*`,
        discount > 0 ? `Desconto: *-${money(discount)}*` : null,
        `*TOTAL: ${money(total)}*`,
        "",
        `Endereco: ${addr}`,
        "",
        "Pagamento: PIX REALIZADO"
      ].filter(l => l !== null).join("\n");
      window.open(`https://wa.me/5538998527894?text=${encodeURIComponent(msg)}`, "_blank");
      salvarPedidoFirestore(total, subtotal, delivery, discount, addr);
      UIManager.closeAll();
    });
  }

  function salvarPedidoFirestore(total, subtotal, delivery, discount, addr) {
    if (db && currentUser) {
      const itensSalvar = cart.map(i => ({ nome: i.nome, preco: i.preco, qtd: i.qtd }));
      db.collection("Pedidos").add({
        userId:    currentUser.uid,
        nome:      currentUser.displayName || currentUser.email,
        email:     currentUser.email,
        itensObj:  itensSalvar,
        itens:     itensSalvar.map(i => `${i.nome} x${i.qtd}`).join(", "),
        total:     total,
        subtotal:  subtotal,
        entrega:   delivery,
        desconto:  discount,
        endereco:  addr,
        status:    "novo",
        fonte:     "degust",
        data:      new Date().toISOString(),
        criadoEm:  firebase.firestore.FieldValue.serverTimestamp()
      }).catch(err => console.error("Erro ao salvar pedido:", err));
    }
  }

  /* =========================================================
     ⚙️ CONFIGURAÇÕES BASE
  ========================================================= */
  const sound = new Audio("click.wav");
  let cart = [];
  let currentUser = null;
  let isFirebaseInitialized = false;

  const DELIVERY_FEE_DEFAULT = 8.00;
  const LIMITE_FRETE_GRATIS  = 80.00;

  const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;

  /* =========================================================
     🔍 BUSCA INTELIGENTE (ATUALIZADA V11.5)
  ========================================================= */
  const searchInput = document.getElementById("search-input");

  const PRODUTOS_BUSCA = [
    { nome: "Chocolatudo", aliases: ["chocolate", "preto", "cacau", "100%", "tradicional"] },
    { nome: "Prestígio", aliases: ["coco", "beijinho"] },
    { nome: "Ninho Silvestre", aliases: ["morango", "geleia", "fruta", "ninho morango"] },
    { nome: "Ninho Cremoso", aliases: ["leite ninho", "branco", "puro"] },
    { nome: "Tropical Cream", aliases: ["abacaxi", "fruta", "tropical", "ninho abacaxi"] },
    { nome: "Bombom de Maracujá", aliases: ["maracuja", "mousse", "chocolate maracuja"] }
  ];

  function normalizar(t) {
    return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  function filtrarCards(query) {
    const cards = document.querySelectorAll(".card");
    if (!query || query.length < 1) {
      cards.forEach(c => (c.style.display = ""));
      document.querySelectorAll(".menu-section").forEach(s => s.style.display = "");
      return;
    }
    const q = normalizar(query);
    cards.forEach(card => {
      const nomeProduto = card.dataset.name || "";
      const textoTotal  = normalizar(nomeProduto + " " + (card.querySelector("h3")?.textContent || ""));
      let match = textoTotal.includes(q);

      if (!match) {
        for (const p of PRODUTOS_BUSCA) {
          if (normalizar(p.nome).includes(q)) {
            if (normalizar(nomeProduto).includes(normalizar(p.nome))) { match = true; break; }
          }
          for (const alias of p.aliases) {
            if (normalizar(alias).includes(q)) {
              if (normalizar(nomeProduto).includes(normalizar(p.nome))) { match = true; break; }
            }
          }
        }
      }
      card.style.display = match ? "" : "none";
    });

    document.querySelectorAll(".menu-section").forEach(sec => {
      const temVisivel = [...sec.querySelectorAll(".card")].some(c => c.style.display !== "none");
      sec.style.display = temVisivel ? "" : "none";
    });
  }

  if (searchInput) searchInput.addEventListener("input", e => filtrarCards(e.target.value));

  /* =========================================================
     🛒 CARRINHO E MINI-CARRINHO
  ========================================================= */
  const el = {
    cartIcon:         document.getElementById("cart-icon"),
    cartCount:        document.getElementById("cart-count"),
    miniCart:         document.getElementById("mini-cart"),
    miniList:         document.querySelector(".mini-list"),
    miniFoot:         document.querySelector(".mini-foot"),
    extrasModal:      document.getElementById("extras-modal"),
    extrasList:       document.querySelector("#extras-modal .extras-list"),
    extrasConfirm:    document.getElementById("extras-confirm"),
    loginModal:       document.getElementById("login-modal"),
    userBtn:          document.getElementById("user-btn"),
    statusBanner:     document.getElementById("status-banner"),
    manualArea:       document.getElementById("manualArea"),
    manualEndereco:   document.getElementById("manualEndereco"),
    manualNumero:     document.getElementById("manualNumero"),
    btnConfirmar:     document.getElementById("btnConfirmarEndereco"),
    btnVoltarCEP:     document.getElementById("btnVoltarCEP"),
    progressText:     document.getElementById("progressText"),
    progressFill:     document.getElementById("progressFill")
  };

  function renderMiniCart() {
    if (!el.miniList) return;
    const totalItens = cart.reduce((s, i) => s + i.qtd, 0);
    if (el.cartCount) el.cartCount.textContent = totalItens;
    atualizarBarraProgresso();

    if (!cart.length) {
      el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Seu carrinho está vazio 🍰</p>';
      return;
    }

    el.miniList.innerHTML = cart.map((item, idx) => `
      <div class="cart-item">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="flex:1;">
            <p style="font-weight:700;margin-bottom:4px;color:#4B2C20;">${item.nome}</p>
            <p style="color:#666;font-size:.85rem;">${money(item.preco)} × ${item.qtd}</p>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <button type="button" class="cart-minus" data-idx="${idx}">−</button>
            <span style="font-weight:700;">${item.qtd}</span>
            <button type="button" class="cart-plus"  data-idx="${idx}">+</button>
          </div>
        </div>
      </div>
    `).join("");

    bindMiniCartButtons();
    enhanceMiniCartUI();
  }

  function bindMiniCartButtons() {
    el.miniList.querySelectorAll(".cart-plus").forEach(b => b.addEventListener("click", e => {
      cart[+e.currentTarget.dataset.idx].qtd++; renderMiniCart();
    }));
    el.miniList.querySelectorAll(".cart-minus").forEach(b => b.addEventListener("click", e => {
      const i = +e.currentTarget.dataset.idx;
      if (cart[i].qtd > 1) cart[i].qtd--; else cart.splice(i, 1);
      renderMiniCart();
    }));
  }

  function atualizarBarraProgresso() {
    const subtotal = cart.reduce((s, i) => s + (i.preco * i.qtd), 0);
    const pct = Math.min(100, (subtotal / LIMITE_FRETE_GRATIS) * 100);
    if (el.progressFill) el.progressFill.style.width = `${pct}%`;
    if (el.progressText) el.progressText.innerHTML = subtotal >= LIMITE_FRETE_GRATIS ? `🎉 <strong>Frete Grátis Liberado!</strong>` : `Faltam <strong>${money(LIMITE_FRETE_GRATIS - subtotal)}</strong> p/ Frete Grátis`;
  }

  /* =========================================================
     🔥 FIREBASE
  ========================================================= */
  const firebaseConfig = {
    apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
    authDomain: "da-familia-lanches.firebaseapp.com",
    projectId: "da-familia-lanches",
    storageBucket: "da-familia-lanches.appspot.com",
    messagingSenderId: "106857147317",
    appId: "1:106857147317:web:769c98aed26bb8fc9e87fc"
  };

  let auth, db;
  function inicializarFirebase() {
    if (isFirebaseInitialized) return;
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db   = firebase.firestore();
    isFirebaseInitialized = true;
    setupAuthListener();
  }

  function setupAuthListener() {
    auth.onAuthStateChanged(user => {
      currentUser = user;
      const content = document.getElementById("user-btn-content");
      if (user) {
        if (content) content.textContent = user.displayName?.split(" ")[0] || "Olá";
        carregarPedidos(user);
        carregarRecompensas(user);
      } else {
        if (content) content.textContent = "Entrar";
      }
    });
  }

  /* =========================================================
     🍬 ADICIONAIS
  ========================================================= */
  const TOPPINGS_DATA = [
    { id: "extra_ninho", nome: "Leite Ninho", preco: 2.00 },
    { id: "extra_nutella", nome: "Nutella", preco: 4.50 },
    { id: "extra_morango", nome: "Morango", preco: 3.00 }
  ];

  let currentItemForExtras = null;
  function abrirModalExtras(nome, preco) {
    currentItemForExtras = { nome, preco };
    el.extrasList.innerHTML = TOPPINGS_DATA.map(t => `
      <label class="extra-item-label">
        <input type="checkbox" class="topping-check" data-nome="${t.nome}" data-preco="${t.preco}">
        <span>${t.nome} (+${money(t.preco)})</span>
      </label>
    `).join("");
    UIManager.open("extras", el.extrasModal);
  }

  el.extrasConfirm?.addEventListener("click", () => {
    let precoExtra = 0; const tops = [];
    document.querySelectorAll(".topping-check:checked").forEach(c => {
      tops.push(c.dataset.nome); precoExtra += parseFloat(c.dataset.preco);
    });
    const nomeFinal = tops.length ? `${currentItemForExtras.nome} (+ ${tops.join(", ")})` : currentItemForExtras.nome;
    addCommonItem(nomeFinal, currentItemForExtras.preco + precoExtra);
    UIManager.closeAll();
  });

  /* =========================================================
     🚀 PRODUTOS - LISTENERS
  ========================================================= */
  function addCommonItem(nome, preco) {
    const found = cart.find(i => i.nome === nome);
    if (found) found.qtd++; else cart.push({ nome, preco: Number(preco), qtd: 1 });
    renderMiniCart();
    popupAdd("Adicionado! 🍰");
    try { sound.play(); } catch(e){}
  }

  function resetListeners() {
    document.querySelectorAll(".add-cart").forEach(btn => {
      btn.onclick = (e) => {
        const card = e.currentTarget.closest(".card");
        addCommonItem(card.dataset.name, parseFloat(card.dataset.price));
      };
    });
    document.querySelectorAll(".extras-btn").forEach(btn => {
      btn.onclick = (e) => {
        const card = e.currentTarget.closest(".card");
        abrirModalExtras(card.dataset.name, parseFloat(card.dataset.price));
      };
    });
    el.cartIcon.onclick = () => UIManager.open("cart", el.miniCart);
  }

  /* =========================================================
     💰 CÁLCULOS TOTAIS
  ========================================================= */
  async function calcTotals() {
    const subtotal = cart.reduce((s, i) => s + (i.preco * i.qtd), 0);
    const isRetirar = document.getElementById("retirar-local")?.checked;
    const delivery = (isRetirar || subtotal >= LIMITE_FRETE_GRATIS) ? 0 : DELIVERY_FEE_DEFAULT;
    return { subtotal, delivery, discount: 0, total: subtotal + delivery };
  }

  async function enhanceMiniCartUI() {
    const { subtotal, delivery, total } = await calcTotals();
    let summaryDiv = el.miniFoot.querySelector(".cart-summary-generated");
    if (!summaryDiv) {
      summaryDiv = document.createElement("div");
      summaryDiv.className = "cart-summary-generated";
      el.miniFoot.appendChild(summaryDiv);
    }
    summaryDiv.innerHTML = `
      <div class="cart-totals">
        <p>Subtotal: ${money(subtotal)}</p>
        <p>Entrega: ${delivery === 0 ? "GRÁTIS" : money(delivery)}</p>
        <h3>Total: ${money(total)}</h3>
      </div>
      <button id="main-finish-btn" class="btn-primario">FINALIZAR PEDIDO 🍰</button>
    `;
    document.getElementById("main-finish-btn").onclick = () => fecharPedido();
  }

  window.fecharPedido = function() {
    if (!cart.length) return alert("Carrinho vazio!");
    if (!currentUser) { UIManager.open("login", el.loginModal); return; }
    abrirModalPIX();
  };

  /* =========================================================
     📦 HISTÓRICO E FIDELIDADE (EMOJIS V11.5)
  ========================================================= */
  function emojiProduto(nome) {
    const n = nome.toLowerCase();
    if (n.includes("chocolatudo")) return "🍫";
    if (n.includes("prestígio")) return "🥥";
    if (n.includes("silvestre")) return "🍓";
    if (n.includes("tropical")) return "🍍";
    if (n.includes("maracujá")) return "🟡";
    return "🍰";
  }

  function carregarPedidos(user) {
    if (!db || !user) return;
    db.collection("Pedidos").where("userId", "==", user.uid).get().then(snap => {
      const lista = document.getElementById("listaPedidos");
      if (snap.empty) { lista.innerHTML = "<p>Nenhum pedido ainda.</p>"; return; }
      lista.innerHTML = snap.docs.map(doc => {
        const d = doc.data();
        return `<div class="pedido-card">
          <p>${new Date(d.data).toLocaleDateString()}</p>
          <p>${d.itens}</p>
          <strong>${money(d.total)}</strong>
        </div>`;
      }).join("");
    });
  }

  function carregarRecompensas(user) {
    if (!db || !user) return;
    db.collection("Usuarios").doc(user.uid).get().then(doc => {
      const d = doc.data() || {};
      const bolos = d.bolosPedidos || 0;
      document.getElementById("contador-valor").textContent = bolos;
      document.getElementById("progresso-bar").style.width = `${(bolos/5)*100}%`;
    });
  }

  function popupAdd(msg) {
    let pop = document.querySelector(".popup-add");
    if (!pop) { pop = document.createElement("div"); pop.className = "popup-add"; document.body.appendChild(pop); }
    pop.textContent = msg; pop.classList.add("show");
    setTimeout(() => pop.classList.remove("show"), 2000);
  }

  /* =========================================================
     🏁 INICIALIZAÇÃO
  ========================================================= */
  inicializarFirebase();
  resetListeners();
  renderMiniCart();

  const cookieAccept = document.getElementById("cookie-accept");
  if (cookieAccept) {
    cookieAccept.onclick = () => {
      document.getElementById("cookie-banner").style.display = "none";
      localStorage.setItem("cookies-degust", "true");
    };
  }
});
