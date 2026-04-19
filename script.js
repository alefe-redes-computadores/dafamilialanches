/* =========================================================
   🍰 Degust v11.0 — SISTEMA UI BLINDADO + PIX INTELIGENTE
   Correções: cookies, painéis, cliques, duplicações removidas
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

      // mini-cart e pix-modal usam classe 'active'; modais comuns usam 'show'
      const useActive = ["mini-cart", "pix-modal"];
      if (useActive.includes(panelElement.id)) {
        panelElement.classList.add("active");
      } else {
        panelElement.classList.add("show");
      }

      // Painéis deslizantes (pedidos / recompensas) têm overlay próprio
      const overlayId = panelElement.dataset.overlay;
      if (overlayId) {
        const overlay = document.getElementById(overlayId);
        if (overlay) overlay.classList.add("active");
        return; // não usa o backdrop geral
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
      // Fecha modais normais
      document.querySelectorAll(".modal.show, .modal.active, #mini-cart.active").forEach(el => {
        el.classList.remove("show", "active");
      });
      // Fecha os painéis deslizantes
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
     🎯 ATALHOS DO MENU LATERAL — usando data-action
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
          const reportsBtn = document.getElementById("reports-btn");
          if (reportsBtn) reportsBtn.click();
        }
      });
    });
  });

  // Scroll suave para seções
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
     🎁 PAINÉIS DESLIZANTES (PEDIDOS & RECOMPENSAS) v11.0
  ========================================================= */
  function abrirPainel(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (!overlay) return;
    UIManager.closeAll();
    overlay.classList.add("active");
  }

  function fecharTodosPaineis() {
    document.querySelectorAll(".painel-overlay").forEach(el => el.classList.remove("active"));
  }

  // Botões flutuantes
  const btnMeusPedidos = document.querySelector(".meus-pedidos-btn");
  const btnRecompensas = document.querySelector(".recompensas-btn");

  if (btnMeusPedidos) {
    btnMeusPedidos.addEventListener("click", () => abrirPainel("painelPedidosOverlay"));
  }
  if (btnRecompensas) {
    btnRecompensas.addEventListener("click", () => abrirPainel("painelRecompensasOverlay"));
  }

  // Fechar pelos botões X dentro dos painéis
  document.querySelectorAll(".fechar-painel, .fechar-pedidos, .fechar-recompensas").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      fecharTodosPaineis();
    });
  });

  // Fechar clicando no overlay (fundo escuro)
  document.querySelectorAll(".painel-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) fecharTodosPaineis();
    });
  });

  /* =========================================================
     💰 SISTEMA PIX v11.0
  ========================================================= */
  const pixModal       = document.getElementById("pix-modal");
  const pixValor       = document.getElementById("pix-valor");
  const pixBody        = document.querySelector("#pix-modal .pix-body");
  const pixBtnCopy     = document.getElementById("btn-copy-pix");
  const pixBtnWhatsapp = document.getElementById("btn-finish-pix");
  const pixClose       = document.querySelector(".pix-close");

  const CHAVE_PIX = "carols2maite@gmail.com";

  const AVISO_PIX = `<p style="font-size:.85rem;color:#c62828;font-weight:600;margin-bottom:14px;border-radius:8px;border:1px solid #ffcdd2;padding:8px 12px;background:#fff3f3;">
    ⚠️ IMPORTANTE: Antes de pagar, clique em "Enviar Pedido no WhatsApp". Após enviar, faça o PIX e mande o comprovante na mesma conversa.
  </p>`;

  async function abrirModalPIX() {
    try {
      const { total } = await calcTotals();
      if (pixValor) pixValor.textContent = money(total);

      if (pixBody && !pixBody.querySelector(".pix-aviso")) {
        const div = document.createElement("div");
        div.className = "pix-aviso";
        div.innerHTML = AVISO_PIX;
        const valorEl = pixBody.querySelector("#pix-valor")?.parentElement;
        if (valorEl) valorEl.after(div);
        else pixBody.prepend(div);
      }

      UIManager.open("pix", pixModal);
    } catch (err) {
      console.error("Erro ao abrir PIX:", err);
      fecharPedidoOriginal();
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
      setTimeout(() => fecharPedidoOriginal?.(), 300);
    });
  }

  if (pixBtnWhatsapp) {
    pixBtnWhatsapp.addEventListener("click", async () => {
      const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();
      const addr = window.finalAddressStringForWhatsApp || "Não informado";

      const msg = [
        "🍰 *Novo Pedido - Degust Bolos no Pote*",
        cart.map(i => `• ${i.nome} x${i.qtd}`).join("\n"),
        "",
        `Subtotal: *${money(subtotal)}*`,
        `Entrega: *${money(delivery)}*${cupomInfo.freeShipping ? " _(Frete Grátis)_" : ""}`,
        `Desconto${couponApplied ? ` (${couponApplied})` : ""}: *-${money(discount)}*`,
        `*Total: ${money(total)}*`,
        "",
        `🏠 *Endereço:* ${addr}`,
        "",
        "----------------------------------",
        "💳 *DADOS PARA PAGAMENTO PIX*",
        "",
        `📦 *Pedido:* ${money(total)}`,
        `🏷️ *Chave PIX:* ${CHAVE_PIX}`,
        `👤 *Beneficiário:* Degust / Carol`,
        "",
        "📎 *Por favor, anexe o comprovante após pagar*",
        "⏰ Iniciamos o preparo após a confirmação."
      ].join("\n");

      window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(msg)}`, "_blank");
      UIManager.closeAll();
    });
  }

  window.finalAddressStringForWhatsApp = "";
  /* =========================================================
     1. MÁSCARA DE CEP
  ========================================================= */
  const cepInputMask = document.getElementById("cep-input");
  if (cepInputMask) {
    cepInputMask.addEventListener("input", function (e) {
      let v = e.target.value.replace(/\D/g, "");
      if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
      e.target.value = v;
    });
  }

  /* =========================================================
     ⚙️ CONFIGURAÇÕES BASE
  ========================================================= */
  const sound = new Audio("click.wav");
  let cart = [];
  let currentUser = null;
  let isFirebaseInitialized = false;

  const DELIVERY_FEE_DEFAULT = 6.00;
  const LIMITE_FRETE_GRATIS  = 80.00;

  const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;

  /* =========================================================
     🔍 BUSCA INTELIGENTE
  ========================================================= */
  const searchInput = document.getElementById("search-input");

  const PRODUTOS_BUSCA = [
    { nome: "Brigadeiro",               aliases: ["chocolate", "preto", "granulado", "tradicional"] },
    { nome: "Prestígio",                aliases: ["prestigio", "coco", "beijinho"] },
    { nome: "Ninho com Geleia de Morango", aliases: ["morango", "geleia", "fruta", "ninho morango"] },
    { nome: "Ninho Cremoso",            aliases: ["leite ninho", "branco", "puro", "ninho"] }
  ];

  function normalizar(t) {
    return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  function distanciaLevenshtein(a, b) {
    const m = [];
    for (let i = 0; i <= b.length; i++) m[i] = [i];
    for (let j = 0; j <= a.length; j++) m[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        m[i][j] = b[i - 1] === a[j - 1]
          ? m[i-1][j-1]
          : Math.min(m[i-1][j-1] + 1, m[i][j-1] + 1, m[i-1][j] + 1);
      }
    }
    return m[b.length][a.length];
  }

  function filtrarCards(query) {
    if (!query || query.length < 2) {
      document.querySelectorAll(".card").forEach(c => (c.style.display = ""));
      return;
    }
    const q = normalizar(query);
    document.querySelectorAll(".card").forEach(card => {
      const nome = normalizar(card.dataset.name || card.querySelector("h3")?.textContent || "");
      let match = nome.includes(q);
      if (!match) {
        for (const p of PRODUTOS_BUSCA) {
          if (distanciaLevenshtein(q, normalizar(p.nome)) <= 2 && nome.includes(normalizar(p.nome))) { match = true; break; }
          for (const alias of p.aliases) {
            if (normalizar(alias).includes(q) || q.includes(normalizar(alias))) {
              if (nome.includes(normalizar(p.nome))) { match = true; break; }
            }
          }
          if (match) break;
        }
      }
      card.style.display = match ? "" : "none";
    });
  }

  if (searchInput) searchInput.addEventListener("input", e => filtrarCards(e.target.value));

  /* =========================================================
     🎯 MAPEAMENTO DO DOM
  ========================================================= */
  const el = {
    cartIcon:         document.getElementById("cart-icon"),
    cartCount:        document.getElementById("cart-count"),
    miniCart:         document.getElementById("mini-cart"),
    miniList:         document.querySelector(".mini-list"),
    miniFoot:         document.querySelector(".mini-foot"),
    cartBackdrop:     document.getElementById("cart-backdrop"),
    extrasModal:      document.getElementById("extras-modal"),
    extrasList:       document.querySelector("#extras-modal .extras-list"),
    extrasConfirm:    document.getElementById("extras-confirm"),
    loginModal:       document.getElementById("login-modal"),
    loginForm:        document.getElementById("login-form"),
    googleBtn:        document.getElementById("google-login"),
    userBtn:          document.getElementById("user-btn"),
    statusBanner:     document.getElementById("status-banner"),
    pedidosBtn:       document.querySelector(".meus-pedidos-btn"),
    pedidosPanel:     document.getElementById("painelPedidos"),
    pedidosLista:     document.getElementById("listaPedidos"),
    recompensasBtn:   document.querySelector(".recompensas-btn"),
    recompensasPanel: document.getElementById("recompensas-panel"),
    recompensasLista: document.getElementById("listaRecompensas"),
    historicoLista:   document.getElementById("historicoRecompensas"),
    btnNaoSeiCEP:     document.getElementById("btnNaoSeiCEP"),
    manualArea:       document.getElementById("manualArea"),
    manualEndereco:   document.getElementById("manualEndereco"),
    manualNumero:     document.getElementById("manualNumero"),
    btnConfirmar:     document.getElementById("btnConfirmarEndereco"),
    btnVoltarCEP:     document.getElementById("btnVoltarCEP"),
    progressWrapper:  document.getElementById("progressWrapper"),
    progressText:     document.getElementById("progressText"),
    progressFill:     document.getElementById("progressFill"),
    pixModal:         document.getElementById("pix-modal")
  };

  // Botões de fechar modais
  document.querySelectorAll(".extras-close, .login-close, .dashboard-close, .pix-close").forEach(btn => {
    btn.addEventListener("click", (e) => { e.stopPropagation(); UIManager.closeAll(); });
  });

  document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", (e) => { if (e.target === modal) UIManager.closeAll(); });
  });

  if (el.cartBackdrop) el.cartBackdrop.addEventListener("click", () => UIManager.closeAll());

  /* =========================================================
     🎟️ CUPONS
  ========================================================= */
  const couponForm = document.getElementById("coupon-form");
  let couponApplied = (localStorage.getItem("degustCoupon") || "").toUpperCase();

  couponForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("coupon-input");
    const val = (input?.value || "").trim().toUpperCase();
    if (!val) {
      couponApplied = "";
      localStorage.removeItem("degustCoupon");
      popupAdd("Cupom removido. 🏷️");
    } else {
      couponApplied = val;
      localStorage.setItem("degustCoupon", couponApplied);
    }
    renderMiniCart();
  });

  /* =========================================================
     💬 POPUP / TOAST
  ========================================================= */
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

  /* =========================================================
     📊 BARRA DE PROGRESSO (FRETE GRÁTIS)
  ========================================================= */
  function atualizarBarraProgresso() {
    const subtotal      = getCartSubtotal();
    const progressText  = document.getElementById("progressText");
    const progressFill  = document.getElementById("progressFill");
    const progressWrapper = document.getElementById("progressWrapper");
    if (!progressText || !progressFill || !progressWrapper) return;

    const pct = Math.min(100, (subtotal / LIMITE_FRETE_GRATIS) * 100);
    progressFill.style.width = `${pct}%`;

    if (subtotal >= LIMITE_FRETE_GRATIS) {
      progressText.innerHTML = `🎉 <strong>Frete Grátis Liberado!</strong>`;
      progressFill.style.background = "linear-gradient(90deg,#4caf50,#2e7d32)";
    } else {
      progressText.innerHTML = `Faltam <strong>${money(LIMITE_FRETE_GRATIS - subtotal)}</strong> p/ Frete Grátis`;
      progressFill.style.background = "linear-gradient(90deg,#E1A95F,#4B2C20)";
    }
  }

  /* =========================================================
     🛒 CARRINHO
  ========================================================= */
  function renderMiniCart() {
    if (!el.miniList) return;
    const totalItens = cart.reduce((s, i) => s + i.qtd, 0);
    if (el.cartCount) el.cartCount.textContent = totalItens;
    atualizarBarraProgresso();

    if (!cart.length) {
      el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Seu carrinho está vazio 🍰</p>';
      if (el.miniFoot) el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());
      const cm = document.getElementById("coupon-message");
      const cdr = document.getElementById("coupon-discount-row");
      if (cm) cm.innerHTML = "";
      if (cdr) cdr.style.display = "none";
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
            <button type="button" class="cart-minus" data-idx="${idx}" style="background:#E1A95F;color:#4B2C20;border:none;border-radius:5px;width:30px;height:30px;cursor:pointer;font-weight:bold;font-size:1.1rem;">−</button>
            <span style="font-weight:700;min-width:20px;text-align:center;">${item.qtd}</span>
            <button type="button" class="cart-plus"  data-idx="${idx}" style="background:#4B2C20;color:#F5E6CA;border:none;border-radius:5px;width:30px;height:30px;cursor:pointer;font-weight:bold;font-size:1.1rem;">+</button>
            <button type="button" class="cart-remove" data-idx="${idx}" style="background:#d32f2f;color:#fff;border:none;border-radius:5px;width:30px;height:30px;cursor:pointer;">🗑</button>
          </div>
        </div>
      </div>
    `).join("");

    bindMiniCartButtons();
    enhanceMiniCartUI();
  }

  const getCartSubtotal = () => cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);

  function bindMiniCartButtons() {
    el.miniList.querySelectorAll(".cart-plus").forEach(b => b.addEventListener("click", e => {
      const i = +e.currentTarget.dataset.idx;
      if (cart[i]) { cart[i].qtd++; renderMiniCart(); }
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
      popupAdd("Item removido! 🗑️");
    }));
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
  const ADMINS = ["alefejohsefe@gmail.com", "kalebhstanley650@gmail.com", "contato@dafamilialanches.com.br"];
  const isAdmin = (u) => u?.email && ADMINS.includes(u.email.toLowerCase());

  function inicializarFirebase() {
    if (isFirebaseInitialized) return;
    try {
      if (!window.firebase) throw new Error("Firebase SDK não carregado.");
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db   = firebase.firestore();
      isFirebaseInitialized = true;
      setupAuthListener();
    } catch (err) {
      console.error("ERRO FIREBASE:", err);
    }
  }

  function setupAuthListener() {
    auth.onAuthStateChanged(user => {
      currentUser = user;
      if (user) {
        const nome = user.displayName?.split(" ")[0] || user.email.split("@")[0];
        el.userBtn.textContent = `Olá, ${nome} ✨`;
        if (el.pedidosBtn)    el.pedidosBtn.style.display    = "";
        if (el.recompensasBtn) el.recompensasBtn.style.display = "";
        if (isAdmin(user)) {
          document.querySelector(".admin-section")?.style.setProperty("display", "block");
        }
      } else {
        el.userBtn.textContent = "Entrar / Perfil 👤";
        document.querySelector(".admin-section")?.style.setProperty("display", "none");
      }
    });
  }

  /* =========================================================
     🔑 LOGIN
  ========================================================= */
  const handleLoginSuccess = (user) => {
    currentUser = user;
    popupAdd(`Bem-vindo(a), ${user.displayName?.split(" ")[0] || "doçura"}! ✨`);
    UIManager.closeAll();
  };

  const handleLoginError = (err) => {
    console.error("Erro Auth:", err.code);
    if (err.code === "auth/user-not-found") {
      if (confirm("Conta não encontrada. Deseja criar um cadastro?")) {
        auth.createUserWithEmailAndPassword(
          document.getElementById("login-email")?.value?.trim(),
          document.getElementById("login-senha")?.value?.trim()
        ).then(c => handleLoginSuccess(c.user)).catch(e => alert("Erro: " + e.message));
      }
    } else if (err.code === "auth/wrong-password") {
      alert("Senha incorreta. Tente o login com Google.");
    } else if (err.code === "auth/invalid-email") {
      alert("Formato de e-mail inválido.");
    } else {
      alert("Erro: " + err.message);
    }
  };

  el.loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    inicializarFirebase();
    if (!isFirebaseInitialized) return alert("Erro de conexão. Recarregue a página.");
    const email = document.getElementById("login-email")?.value?.trim();
    const senha = document.getElementById("login-senha")?.value?.trim();
    if (!email || !senha) return alert("Preencha todos os campos.");
    auth.signInWithEmailAndPassword(email, senha).then(c => handleLoginSuccess(c.user)).catch(handleLoginError);
  });

  el.googleBtn?.addEventListener("click", () => {
    inicializarFirebase();
    if (!isFirebaseInitialized) return alert("Erro de conexão.");
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(r => handleLoginSuccess(r.user))
      .catch(err => { if (err.code !== "auth/popup-closed-by-user") alert("Erro: " + err.message); });
  });

  el.userBtn?.addEventListener("click", () => {
    if (!currentUser) {
      UIManager.open("login", el.loginModal);
    } else {
      if (confirm("Deseja sair da sua conta?")) {
        auth.signOut().then(() => { popupAdd("Até logo! 👋"); location.reload(); });
      }
    }
  });

  /* =========================================================
     🍬 ADICIONAIS (TOPPINGS)
  ========================================================= */
  const TOPPINGS_DATA = [
    { id: "extra_ninho",     nome: "Leite Ninho em Pó",   preco: 2.00 },
    { id: "extra_nutella",   nome: "Nutella Pura",         preco: 4.50 },
    { id: "extra_granulado", nome: "Granulado Gourmet",    preco: 1.50 },
    { id: "extra_morango",   nome: "Morango Picado",       preco: 3.00 },
    { id: "extra_coco",      nome: "Coco Ralado",          preco: 1.50 }
  ];

  let currentItemForExtras = null;

  function abrirModalExtras(nome, preco) {
    currentItemForExtras = { nome, preco };
    if (el.extrasList) {
      el.extrasList.innerHTML = TOPPINGS_DATA.map(t => `
        <label style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#fff;border-radius:8px;margin-bottom:8px;border:1px solid #eee;cursor:pointer;">
          <div style="display:flex;align-items:center;gap:10px;">
            <input type="checkbox" class="topping-check" data-id="${t.id}" data-nome="${t.nome}" data-preco="${t.preco}" style="width:20px;height:20px;accent-color:#4B2C20;">
            <span style="font-weight:600;color:#4B2C20;">${t.nome}</span>
          </div>
          <span style="color:#E1A95F;font-weight:bold;">+ ${money(t.preco)}</span>
        </label>
      `).join("");
    }
    UIManager.open("extras", el.extrasModal);
  }

  el.extrasConfirm?.addEventListener("click", () => {
    if (!currentItemForExtras) return;
    let precoExtra = 0;
    const tops = [];
    document.querySelectorAll(".topping-check:checked").forEach(c => {
      tops.push(c.dataset.nome);
      precoExtra += parseFloat(c.dataset.preco);
    });
    const nomeFinal  = tops.length ? `${currentItemForExtras.nome} (+ ${tops.join(", ")})` : currentItemForExtras.nome;
    const precoFinal = currentItemForExtras.preco + precoExtra;
    addCommonItem(nomeFinal, precoFinal);
    UIManager.closeAll();
    currentItemForExtras = null;
  });

  /* =========================================================
     🚀 PRODUTOS — LISTENERS
  ========================================================= */
  function addCommonItem(nome, preco) {
    const found = cart.find(i => i.nome === nome && i.preco === preco);
    if (found) found.qtd++;
    else cart.push({ nome, preco: Number(preco), qtd: 1 });
    renderMiniCart();
    popupAdd(`${nome.split("(")[0].trim()} adicionado! 🍰`);
    try { if (sound) sound.play(); } catch (e) {}
  }

  function resetListeners() {
    document.querySelectorAll(".add-cart").forEach(btn => {
      btn.onclick = null;
      btn.addEventListener("click", (e) => {
        const card = e.currentTarget.closest(".card");
        if (card) addCommonItem(card.dataset.name, parseFloat(card.dataset.price));
      });
    });
    document.querySelectorAll(".extras-btn").forEach(btn => {
      btn.onclick = null;
      btn.addEventListener("click", (e) => {
        const card = e.currentTarget.closest(".card");
        if (card) abrirModalExtras(card.dataset.name, parseFloat(card.dataset.price));
      });
    });
    if (el.cartIcon) {
      el.cartIcon.onclick = () => UIManager.open("cart", el.miniCart);
    }
  }

  /* =========================================================
     🚚 FRETE & ENDEREÇO
  ========================================================= */
  let modoEnderecoManual = false;

  const buscarCEP = async () => {
    const cep = document.getElementById("cep-input")?.value.replace(/\D/g, "");
    if (cep?.length !== 8) return alert("Digite um CEP válido com 8 dígitos.");
    const btn = document.getElementById("btn-calcular-frete");
    btn.textContent = "Buscando...";
    btn.disabled = true;
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) throw new Error("CEP não encontrado.");
      const ruaBairro = document.getElementById("endereco-auto");
      if (ruaBairro) ruaBairro.value = `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`;
      document.getElementById("numero-input").disabled    = false;
      document.getElementById("complemento-input").disabled = false;
      document.getElementById("numero-input")?.focus();
      popupAdd("Endereço localizado! 📍");
    } catch {
      alert("Erro ao buscar CEP. Tente digitar o endereço manualmente.");
    } finally {
      btn.textContent = "Buscar";
      btn.disabled = false;
    }
  };

  const ativarManual   = () => { modoEnderecoManual = true;  if (el.manualArea) el.manualArea.style.display = "block";  document.querySelector(".frete-container")?.style.setProperty("display","none"); };
  const desativarManual = () => { modoEnderecoManual = false; if (el.manualArea) el.manualArea.style.display = "none";   document.querySelector(".frete-container")?.style.setProperty("display","block"); };

  document.getElementById("btn-calcular-frete")?.addEventListener("click", buscarCEP);
  document.getElementById("btnManual")?.addEventListener("click", ativarManual);
  el.btnVoltarCEP?.addEventListener("click", desativarManual);
  el.btnNaoSeiCEP?.addEventListener("click", () => window.open("https://buscacepinter.correios.com.br/", "_blank"));

  el.btnConfirmar?.addEventListener("click", () => {
    const end = el.manualEndereco?.value.trim();
    const num = el.manualNumero?.value.trim();
    if (!end || !num) return alert("Preencha o endereço e o número!");
    popupAdd("Endereço manual salvo! ✅");
    renderMiniCart();
  });

  // Retirada no local
  document.getElementById("retirar-local")?.addEventListener("change", (e) => {
    ["cep-input","btn-calcular-frete","numero-input","complemento-input"].forEach(id => {
      const el2 = document.getElementById(id);
      if (!el2) return;
      el2.style.opacity = e.target.checked ? "0.5" : "1";
      if (el2.tagName === "INPUT") el2.disabled = e.target.checked;
    });
    if (e.target.checked) popupAdd("Opção: Retirada na Degust 🍰");
    renderMiniCart();
  });

  /* =========================================================
     💰 CÁLCULOS
  ========================================================= */
  async function calcTotals() {
    const subtotal = getCartSubtotal();
    let delivery = DELIVERY_FEE_DEFAULT;
    let discount = 0;
    let cupomInfo = { valid: false, freeShipping: false };

    if (couponApplied) {
      const cp = couponApplied.toUpperCase();
      if (cp === "DEGUST10")    { discount = subtotal * 0.10; cupomInfo.valid = true; }
      else if (cp === "FRETEGRATIS") { cupomInfo.freeShipping = true; cupomInfo.valid = true; }
      else if (cp === "BOASVINDAS")  { discount = 5.00;              cupomInfo.valid = true; }
    }

    const isRetirar = document.getElementById("retirar-local")?.checked;
    if (isRetirar || subtotal >= LIMITE_FRETE_GRATIS || cupomInfo.freeShipping) delivery = 0;

    const total = Math.max(0, subtotal + delivery - discount);
    return { subtotal, delivery, discount, total, cupomInfo };
  }

  async function enhanceMiniCartUI() {
    if (!el.miniFoot) return;
    const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();
    const couponMsg = document.getElementById("coupon-message");
    const couponDiscountRow = document.getElementById("coupon-discount-row");

    if (couponApplied) {
      if (cupomInfo.valid) {
        if (couponMsg) couponMsg.innerHTML = `<span style="color:#2e7d32;font-size:.85rem;">✅ Cupom <b>${couponApplied}</b> aplicado!</span>`;
        if (discount > 0 && couponDiscountRow) {
          couponDiscountRow.style.display = "flex";
          const cd = document.getElementById("cart-discount");
          if (cd) cd.textContent = `-${money(discount)}`;
        }
      } else {
        if (couponMsg) couponMsg.innerHTML = `<span style="color:#d32f2f;font-size:.85rem;">❌ Cupom inválido ou expirado.</span>`;
        if (couponDiscountRow) couponDiscountRow.style.display = "none";
      }
    }

    let summaryDiv = el.miniFoot.querySelector(".cart-summary-generated");
    if (!summaryDiv) {
      summaryDiv = document.createElement("div");
      summaryDiv.className = "cart-summary-generated";
      el.miniFoot.appendChild(summaryDiv);
    }

    summaryDiv.innerHTML = `
      <div style="padding:10px 0;border-top:1px solid #eee;margin-top:10px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;color:#666;">
          <span>Subtotal:</span><span>${money(subtotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;color:#666;">
          <span>Taxa de Entrega:</span>
          <span>${delivery === 0 ? '<b style="color:#2e7d32;">GRÁTIS</b>' : money(delivery)}</span>
        </div>
        ${discount > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;color:#2e7d32;">
          <span>Desconto:</span><span>-${money(discount)}</span>
        </div>` : ""}
        <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:1.2rem;font-weight:800;color:#4B2C20;">
          <span>Total:</span><span>${money(total)}</span>
        </div>
      </div>
      <button id="main-finish-btn" type="button" style="width:100%;background:#4caf50;color:#fff;border:none;padding:15px;border-radius:10px;font-weight:bold;font-size:1.1rem;cursor:pointer;margin-top:10px;box-shadow:0 4px 10px rgba(76,175,80,.3);">
        FINALIZAR PEDIDO 🍰
      </button>
    `;

    document.getElementById("main-finish-btn")?.addEventListener("click", () => window.fecharPedido());
  }

  /* =========================================================
     📦 FINALIZAR PEDIDO
  ========================================================= */
  window.fecharPedido = async function () {
    if (!cart.length) return alert("O carrinho está vazio! Escolha uma doçura primeiro. 🍰");
    if (!currentUser) { alert("Faça login para finalizar seu pedido!"); UIManager.open("login", el.loginModal); return; }

    const isRetirar = document.getElementById("retirar-local")?.checked;
    let addr = "";

    if (modoEnderecoManual) {
      const end = el.manualEndereco?.value?.trim() || "";
      const num = el.manualNumero?.value?.trim()   || "";
      if (end && num) addr = `${end}, N° ${num} (Manual)`;
    } else {
      const rua   = document.getElementById("endereco-auto")?.value.trim()   || "";
      const num   = document.getElementById("numero-input")?.value.trim()    || "";
      const comp  = document.getElementById("complemento-input")?.value.trim() || "";
      const cepV  = document.getElementById("cep-input")?.value.replace(/\D/g,"") || "";
      if (rua && num) {
        addr = `${rua}, N° ${num}`;
        if (comp) addr += `, Comp: ${comp}`;
        if (cepV.length === 8) addr += ` | CEP: ${cepV}`;
      }
    }

    if (isRetirar) {
      addr = "CLIENTE IRÁ RETIRAR NA DEGUST";
    } else if (!addr) {
      alert("Preencha o endereço completo (ou marque 'Retirar no Local') para continuar.");
      return;
    }

    window.finalAddressStringForWhatsApp = addr;
    abrirModalPIX();
  };

  /* =========================================================
     🕰️ STATUS DA LOJA
  ========================================================= */
  const atualizarStatusLoja = () => {
    const hora = new Date().getHours();
    const aberto = hora >= 14 && hora < 22;
    if (el.statusBanner) {
      el.statusBanner.textContent = aberto ? "🟢 Aberto — Peça sua doçura agora!" : "🔴 Fechado — Abrimos hoje às 14h";
      el.statusBanner.className   = `status-banner ${aberto ? "open" : "closed"}`;
    }
  };

  atualizarStatusLoja();
  setInterval(atualizarStatusLoja, 60000);

  /* =========================================================
     🍪 COOKIES — CORRIGIDO v11.0
     Problema anterior: display:flex !important no CSS impedia
     que o JS fechasse com display:none ou classList.remove
  ========================================================= */
  const cookieBanner    = document.getElementById("cookie-banner");
  const cookieAcceptBtn = document.getElementById("cookie-accept");

  if (cookieBanner && cookieAcceptBtn) {
    if (localStorage.getItem("degust-cookies-accepted")) {
      // Já aceitou antes — mantém oculto
      cookieBanner.style.display = "none";
    } else {
      // Aparece após 2s via classe .show (sem !important no CSS)
      setTimeout(() => cookieBanner.classList.add("show"), 2000);
    }

    cookieAcceptBtn.addEventListener("click", () => {
      localStorage.setItem("degust-cookies-accepted", "true");
      cookieBanner.classList.remove("show");
      // Aguarda a transição terminar e então oculta definitivamente
      setTimeout(() => { cookieBanner.style.display = "none"; }, 450);
      popupAdd("Preferências salvas! 🍪");
    });
  }

  /* =========================================================
     🏁 INICIALIZAÇÃO
  ========================================================= */
  inicializarFirebase();
  resetListeners();
  renderMiniCart();

  console.log("%c🍰 Degust Bolos no Pote v11.0 — Sistema Carregado!", "color:#E1A95F;font-size:14px;font-weight:bold;");

}); // fim DOMContentLoaded
