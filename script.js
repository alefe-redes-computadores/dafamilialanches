/* =========================================================
   🍰 Degust v13.0 – FINAL
   - UI blindada, PIX, Firebase
   - Persistência do carrinho (localStorage)
   - Sistema de Recompensas progressivo (metas 5,10,15,20,25,30)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  let pixCopied = false;

  /* =========================================================
     🛠️ UIManager v11.0
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
          if (currentUser) carregarRecompensas(currentUser);
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
  function abrirPainel(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (!overlay) return;
    UIManager.closeAll();
    overlay.classList.add("active");
  }

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

  const AVISO_PIX = `
    <div style="background:#fff3cd;border:2px solid #ffc107;border-radius:12px;padding:14px;margin-bottom:14px;text-align:left;">
      <p style="margin:0 0 8px;font-size:.95rem;font-weight:800;color:#856404;">📋 SIGA ESSES PASSOS:</p>
      <p style="margin:0 0 6px;font-size:.85rem;color:#333;"><b>1️⃣️</b> Clique em <b>"Enviar Pedido no WhatsApp"</b></p>
      <p style="margin:0 0 6px;font-size:.85rem;color:#333;"><b>2️⃣️</b> Faça o PIX no valor acima</p>
      <p style="margin:0;font-size:.85rem;color:#333;"><b>3️⃣️</b> Mande o comprovante <b>na mesma conversa</b></p>
    </div>
    <div style="background:#fff0f0;border:1px solid #ffcdd2;border-radius:8px;padding:10px;margin-bottom:14px;text-align:center;">
      <p style="margin:0;font-size:.8rem;color:#c62828;font-weight:700;">⚠️ Sem o pedido no WhatsApp não saberemos do seu pedido!</p>
    </div>`;

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

      if (pixBody && !pixBody.querySelector(".pix-pontos")) {
        const pontosDiv = document.createElement("div");
        pontosDiv.className = "pix-pontos";
        pontosDiv.style.cssText = "background:linear-gradient(135deg,#fff8e1,#fffde7);border:1px solid #E1A95F;border-radius:10px;padding:10px 12px;margin-bottom:12px;display:flex;align-items:center;gap:8px;text-align:left;";
        pontosDiv.innerHTML = '<span style="font-size:1.3rem;">⭐</span><p style="margin:0;font-size:.78rem;color:#4B2C20;font-weight:600;">Este pedido acumula <b>+1 ponto</b> no seu cartão fidelidade!</p>';
        pixBody.appendChild(pontosDiv);
      }
      UIManager.open("pix", pixModal);
    } catch (err) {
      console.error("Erro ao abrir PIX:", err);
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
        "------------------------------------",
        "Pagamento: A COMBINAR",
        "Por favor, informe como deseja pagar.",
        "",
        "Iniciamos o preparo apos confirmar. Obrigada!"
      ].filter(l => l !== null).join("\n");
      window.open(`https://wa.me/5538998527894?text=${encodeURIComponent(msg)}`, "_blank");

      if (db && currentUser) {
        const itensSalvar = cart.map(i => ({ nome: i.nome, preco: i.preco, qtd: i.qtd }));
        await db.collection("Pedidos").add({
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
        // incrementar contador de pedidos para recompensas
        await incrementarContadorPedidos(currentUser.uid);
      }

      // limpar carrinho após finalizar
      cart = [];
      renderMiniCart();
      saveCart();
      UIManager.closeAll();
    });
  }

  if (pixBtnWhatsapp) {
    pixBtnWhatsapp.addEventListener("click", async () => {
      const { subtotal, delivery, discount, total } = await calcTotals();
      const addr = window.finalAddressStringForWhatsApp || "Não informado";

      const linhasPedido = [
        "*NOVO PEDIDO - Degust Bolos no Pote*",
        "------------------------------------",
        "",
        "*Itens do Pedido:*",
        cart.map(i => `  - ${i.nome} x${i.qtd}  (${money(i.preco * i.qtd)})`).join("\n"),
        "",
        "------------------------------------",
        `Subtotal: *${money(subtotal)}*`,
        `Entrega: *${delivery === 0 ? "GRATIS" : money(delivery)}*`,
        discount > 0 ? `Desconto${couponApplied ? ` (${couponApplied})` : ""}: *-${money(discount)}*` : null,
        `*TOTAL: ${money(total)}*`,
        "",
        `Endereco: ${addr}`,
        ""
      ].filter(l => l !== null);

      const linhasPix = pixCopied ? [
        "------------------------------------",
        "*PAGAMENTO VIA PIX*",
        "",
        `Chave PIX: ${CHAVE_PIX}`,
        `Beneficiario: Degust Bolos no Pote`,
        `Valor: ${money(total)}`,
        "",
        "IMPORTANTE:",
        "1. Faca o PIX no valor acima",
        "2. Tire print do comprovante",
        "3. Envie o comprovante nessa conversa",
        "",
        "Iniciamos o preparo apos confirmar o pagamento. Obrigada!"
      ] : [
        "------------------------------------",
        "Pagamento a combinar.",
        "Por favor, informe a forma de pagamento desejada.",
        "",
        "Iniciamos o preparo apos confirmar. Obrigada!"
      ];

      const msg = [...linhasPedido, ...linhasPix].join("\n");

      window.open(`https://wa.me/5538998527894?text=${encodeURIComponent(msg)}`, "_blank");

      if (db && currentUser) {
        const itensSalvar = cart.map(i => ({ nome: i.nome, preco: i.preco, qtd: i.qtd }));
        await db.collection("Pedidos").add({
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
        await incrementarContadorPedidos(currentUser.uid);
      }

      cart = [];
      renderMiniCart();
      saveCart();
      UIManager.closeAll();
    });
  }

  window.finalAddressStringForWhatsApp = "";

  /* =========================================================
     MÁSCARA DE CEP
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

  const DELIVERY_FEE_DEFAULT = 8.00;
  const LIMITE_FRETE_GRATIS  = 80.00;

  const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;

  // ================== PERSISTÊNCIA DO CARRINHO ==================
  function saveCart() {
    localStorage.setItem('degustCart', JSON.stringify(cart));
  }

  function loadCart() {
    const saved = localStorage.getItem('degustCart');
    if (saved) {
      try {
        cart = JSON.parse(saved);
        renderMiniCart();
      } catch(e) { console.error("Erro ao carregar carrinho", e); }
    }
  }

  /* =========================================================
     🔍 BUSCA INTELIGENTE
  ========================================================= */
  const searchInput = document.getElementById("search-input");

  const PRODUTOS_BUSCA = [
    { nome: "Brigadeiro",               aliases: ["chocolate", "preto", "granulado", "tradicional"], preco: 10 },
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
    const cards = document.querySelectorAll(".card");
    if (!query || query.length < 1) {
      cards.forEach(c => (c.style.display = ""));
      document.querySelectorAll(".menu-section").forEach(s => s.style.display = "");
      return;
    }
    const q = normalizar(query);
    cards.forEach(card => {
      const nomeProduto = card.dataset.name || "";
      const nomeH3      = card.querySelector("h3")?.textContent || "";
      const nomeDesc    = card.querySelector("p:not(.price)")?.textContent || "";
      const textoTotal  = normalizar(nomeProduto + " " + nomeH3 + " " + nomeDesc);

      let match = textoTotal.includes(q);

      if (!match) {
        for (const p of PRODUTOS_BUSCA) {
          if (distanciaLevenshtein(q, normalizar(p.nome)) <= 2) {
            if (textoTotal.includes(normalizar(p.nome))) { match = true; break; }
          }
          for (const alias of p.aliases) {
            const aliasNorm = normalizar(alias);
            if (aliasNorm.includes(q) || q.includes(aliasNorm)) {
              if (textoTotal.includes(normalizar(p.nome))) { match = true; break; }
            }
          }
          if (match) break;
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
    pedidosBtn:       null,
    pedidosPanel:     document.getElementById("painelPedidos"),
    pedidosLista:     document.getElementById("listaPedidos"),
    recompensasBtn:   null,
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
    const subtotal = getCartSubtotal();
    const progressText  = document.getElementById("progressText");
    const progressFill  = document.getElementById("progressFill");
    if (!progressText || !progressFill) return;

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
      saveCart();
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
    saveCart(); // Salva sempre que renderizar
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
  const ADMINS = ["carols2maite@gmail.com", "degustbolosnopote@gmail.com"];
  const isAdmin = (u) => u?.email && ADMINS.map(e=>e.toLowerCase()).includes(u.email.toLowerCase());

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

  function handleLoginSuccess(user) {
    currentUser = user;
    const nome = user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "doçura";
    UIManager.closeAll();
    atualizarBotaoUsuario(user);
    carregarPedidos(user);
    carregarRecompensas(user);
    mostrarToastLogin(`Bem-vinda(o), ${nome}! 🍰`);
  }

function atualizarBotaoUsuario(user) {
  if (!el.userBtn) return;

  if (user) {
    // Pega a foto do Google ou coloca um ícone se não existir
    const fotoUrl = user.photoURL || "";
    el.userBtn.innerHTML = fotoUrl 
      ? `<img src="${fotoUrl}" id="user-foto-header" alt="Perfil">` 
      : `<span>👤</span>`;
    
    // Ajustes de estilo via JS para a foto ficar perfeita
    el.userBtn.style.padding = "0"; 
    el.userBtn.style.display = "flex";
    el.userBtn.style.background = "transparent";

    if (isAdmin(user)) {
      document.querySelector(".admin-section")?.style.setProperty("display","block");
    }
  } else {
    // Volta ao estado original se não estiver logado (Novo Else)
    el.userBtn.innerHTML = `<span>Entrar</span>`;
    el.userBtn.style.padding = "8px 14px";
    el.userBtn.style.background = "var(--marrom)";
    el.userBtn.style.display = ""; // Reseta o flex se necessário
  }
}

  function mostrarToastLogin(msg) {
    let toast = document.getElementById("toast-login");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast-login";
      toast.style.cssText = `
        position:fixed; top:80px; left:50%; transform:translateX(-50%) translateY(-20px);
        background:#4B2C20; color:#F5E6CA; padding:14px 28px;
        border-radius:30px; font-weight:700; font-size:1rem;
        box-shadow:0 6px 20px rgba(0,0,0,.35); z-index:20001;
        opacity:0; pointer-events:none; transition:all .35s ease;
        border:2px solid #E1A95F; white-space:nowrap;
        display:flex; align-items:center; gap:8px;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(-20px)";
    }, 3500);
  }

  // ================== SISTEMA DE RECOMPENSAS (METAS PROGRESSIVAS) ==================
  let recompensasMetas = [];

  async function carregarMetasRecompensas() {
    if (!db) return;
    try {
      const doc = await db.collection("settings").doc("degust_config").get();
      if (doc.exists && doc.data().recompensas) {
        recompensasMetas = doc.data().recompensas;
      } else {
        // fallback
        recompensasMetas = [
          { pedido: 5, tipo: "cupom", valor: 5, descricao: "Cupom de R$5,00" },
          { pedido: 10, tipo: "cupom", valor: 10, descricao: "Cupom de R$10,00" },
          { pedido: 15, tipo: "brinde", valor: 0, descricao: "1 Bolo grátis" },
          { pedido: 20, tipo: "cupom", valor: 15, descricao: "Cupom de R$15,00" },
          { pedido: 25, tipo: "brinde", valor: 0, descricao: "2 Bolos grátis" },
          { pedido: 30, tipo: "combo", valor: 0, descricao: "Combo especial" }
        ];
      }
    } catch(e) { console.error("Erro ao carregar metas recompensas", e); }
  }

  async function incrementarContadorPedidos(userId) {
    if (!db) return;
    const userRef = db.collection("Usuarios").doc(userId);
    const userDoc = await userRef.get();
    let bolosPedidos = userDoc.exists ? (userDoc.data().bolosPedidos || 0) : 0;
    const novoTotal = bolosPedidos + 1;
    await userRef.set({ bolosPedidos: novoTotal }, { merge: true });

    const recompensasRecebidas = userDoc.exists ? (userDoc.data().recompensasRecebidas || []) : [];
    for (let meta of recompensasMetas) {
      if (novoTotal >= meta.pedido && !recompensasRecebidas.includes(meta.pedido.toString())) {
        await userRef.update({
          recompensasDisponiveis: firebase.firestore.FieldValue.arrayUnion({
            pedido: meta.pedido,
            tipo: meta.tipo,
            valor: meta.valor,
            descricao: meta.descricao,
            data: new Date().toISOString()
          }),
          recompensasRecebidas: firebase.firestore.FieldValue.arrayUnion(meta.pedido.toString())
        });
        popupAdd(`🎉 Parabéns! Você ganhou ${meta.descricao}!`);
      }
    }
  }

  async function carregarRecompensas(user) {
    if (!db || !user) return;
    const userRef = db.collection("Usuarios").doc(user.uid);
    const userDoc = await userRef.get();
    const bolos = userDoc.exists ? (userDoc.data().bolosPedidos || 0) : 0;

    const contadorEl = document.getElementById("contador-valor");
    if (contadorEl) contadorEl.textContent = bolos;

    let proximaMeta = null;
    for (let meta of recompensasMetas) {
      if (bolos < meta.pedido) {
        proximaMeta = meta;
        break;
      }
    }
    const faltam = proximaMeta ? (proximaMeta.pedido - bolos) : 0;
    const mensagemEl = document.getElementById("progresso-mensagem");
    if (mensagemEl) {
      if (proximaMeta) {
        mensagemEl.textContent = `Faltam ${faltam} bolo${faltam !== 1 ? 's' : ''} para ganhar ${proximaMeta.descricao}`;
      } else {
        mensagemEl.textContent = "🎉 Você já atingiu todas as metas! Novas em breve.";
      }
    }

    const pct = proximaMeta ? (bolos / proximaMeta.pedido) * 100 : 100;
    const barraEl = document.getElementById("progresso-bar");
    if (barraEl) barraEl.style.width = `${Math.min(100, pct)}%`;

    const recompensasDisponiveis = userDoc.exists ? (userDoc.data().recompensasDisponiveis || []) : [];
    const listaEl = document.getElementById("listaRecompensas");
    if (listaEl) {
      if (recompensasDisponiveis.length === 0) {
        listaEl.innerHTML = '<p style="color:#999;">Nenhuma recompensa disponível no momento.</p>';
      } else {
        listaEl.innerHTML = recompensasDisponiveis.map(r => `
          <div class="recompensa-item">
            <span>🎁 ${r.descricao}</span>
            <button class="btn-resgatar" data-pedido="${r.pedido}">Resgatar</button>
          </div>
        `).join("");
        document.querySelectorAll('.btn-resgatar').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const pedidoMeta = parseInt(e.currentTarget.dataset.pedido);
            await resgatarRecompensa(user.uid, pedidoMeta);
            carregarRecompensas(user);
          });
        });
      }
    }
  }

  async function resgatarRecompensa(userId, pedidoMeta) {
    if (!db) return;
    const userRef = db.collection("Usuarios").doc(userId);
    const userDoc = await userRef.get();
    let recompensas = userDoc.data().recompensasDisponiveis || [];
    const recompensa = recompensas.find(r => r.pedido === pedidoMeta);
    if (!recompensa) return;

    if (recompensa.tipo === "cupom") {
      const codigoCupom = `DEGUST${recompensa.valor}${Date.now()}`;
      popupAdd(`Cupom gerado: ${codigoCupom} - Válido por 30 dias`);
      await db.collection("cupons").add({
        codigo: codigoCupom,
        valor: recompensa.valor,
        userId: userId,
        usado: false,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      popupAdd(`🎁 ${recompensa.descricao} resgatado! Apresente no próximo pedido.`);
    }

    const novasDisponiveis = recompensas.filter(r => r.pedido !== pedidoMeta);
    const historico = userDoc.data().historicoRecompensas || [];
    historico.push({ ...recompensa, resgatadoEm: new Date().toISOString() });
    await userRef.update({
      recompensasDisponiveis: novasDisponiveis,
      historicoRecompensas: historico
    });
  }

  // status da loja (ignorar bolinha por enquanto)
  function checarStatusLoja() {
    if (!db) return;
    db.collection("settings").doc("degust_status").onSnapshot(doc => {
      const aberta = doc.exists ? (doc.data().aberta === true) : false;
      aplicarStatusLoja(aberta);
    }, () => aplicarStatusLoja(false));
  }

  function aplicarStatusLoja(aberta) {
    const cards   = document.querySelectorAll(".card");
    const addBtns = document.querySelectorAll(".add-cart, .extras-btn");
    if (!aberta) {
      cards.forEach(card => {
        card.style.opacity = "0.55";
        card.style.filter  = "grayscale(60%)";
        card.style.pointerEvents = "none";
      });
      addBtns.forEach(btn => { btn.disabled = true; });
    } else {
      cards.forEach(card => {
        card.style.opacity = "";
        card.style.filter  = "";
        card.style.pointerEvents = "";
      });
      addBtns.forEach(btn => { btn.disabled = false; });
    }
  }

  function setupAuthListener() {
    auth.getRedirectResult()
      .then(result => {
        if (result && result.user) handleLoginSuccess(result.user);
      })
      .catch(err => { if (err.code !== "auth/no-auth-event") console.error("Redirect error:", err.code); });

    auth.onAuthStateChanged(user => {
      currentUser = user;
      if (user) {
        const nome = user.displayName?.split(" ")[0] || user.email.split("@")[0];
        el.userBtn.textContent = `Olá, ${nome} ✨`;
        if (el.pedidosBtn)    el.pedidosBtn.style.display    = "";
        if (el.recompensasBtn) el.recompensasBtn.style.display = "";
        if (isAdmin(user)) document.querySelector(".admin-section")?.style.setProperty("display", "block");
        carregarPedidos(user);
        carregarRecompensas(user);
      } else {
        el.userBtn.textContent = "Entrar / Perfil 👤";
        document.querySelector(".admin-section")?.style.setProperty("display", "none");
      }
    });
  }

  /* =========================================================
     🔑 LOGIN
  ========================================================= */
  el.googleBtn?.addEventListener("click", () => {
    inicializarFirebase();
    if (!isFirebaseInitialized) return alert("Erro de conexão. Recarregue a página.");
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    auth.signInWithPopup(provider)
      .then(r => { if (r.user) handleLoginSuccess(r.user); })
      .catch(err => {
        if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user") {
          auth.signInWithRedirect(provider).catch(e => alert("Erro: " + e.message));
        } else if (err.code !== "auth/cancelled-popup-request") {
          alert("Erro ao entrar com Google: " + err.message);
        }
      });
  });

  el.userBtn?.addEventListener("click", () => {
    if (!currentUser) {
      UIManager.open("login", el.loginModal);
    } else {
      mostrarMenuConta();
    }
  });

  function mostrarMenuConta() {
    let menu = document.getElementById("conta-menu");
    if (menu) { menu.remove(); return; }

    const nome  = currentUser.displayName || currentUser.email?.split("@")[0] || "você";
    const foto  = currentUser.photoURL;
    const rect  = el.userBtn.getBoundingClientRect();

    menu = document.createElement("div");
    menu.id = "conta-menu";
    menu.style.cssText = `
      position:fixed; top:${rect.bottom + 8}px; right:16px;
      background:#fff; border:2px solid #E1A95F; border-radius:14px;
      box-shadow:0 8px 24px rgba(0,0,0,.18); z-index:9999;
      min-width:200px; overflow:hidden;
      animation:cardEntrada .2s ease both;
    `;
    menu.innerHTML = `
      <div style="background:#4B2C20;padding:14px 16px;display:flex;align-items:center;gap:10px;">
        ${foto ? `<img src="${foto}" style="width:38px;height:38px;border-radius:50%;border:2px solid #E1A95F;" onerror="this.style.display='none'">` : '<span style="font-size:1.8rem;">👤</span>'}
        <div>
          <div style="color:#F5E6CA;font-weight:700;font-size:.95rem;">${nome.split(" ")[0]}</div>
          <div style="color:#E1A95F;font-size:.72rem;opacity:.85;">${currentUser.email || ""}</div>
        </div>
      </div>
      <button id="conta-meus-pedidos" type="button" style="width:100%;padding:13px 16px;background:none;border:none;border-bottom:1px solid #f0e8d8;text-align:left;cursor:pointer;color:#4B2C20;font-weight:600;font-size:.9rem;display:flex;align-items:center;gap:8px;">
        📦 Meus Pedidos
      </button>
      <button id="conta-recompensas" type="button" style="width:100%;padding:13px 16px;background:none;border:none;border-bottom:1px solid #f0e8d8;text-align:left;cursor:pointer;color:#4B2C20;font-weight:600;font-size:.9rem;display:flex;align-items:center;gap:8px;">
        🎁 Recompensas
      </button>
      <button id="conta-sair" type="button" style="width:100%;padding:13px 16px;background:none;border:none;text-align:left;cursor:pointer;color:#C8282D;font-weight:700;font-size:.9rem;display:flex;align-items:center;gap:8px;">
        🚪 Sair da conta
      </button>
    `;
    document.body.appendChild(menu);

    document.getElementById("conta-meus-pedidos").addEventListener("click", () => {
      menu.remove();
      document.getElementById("painelPedidosOverlay")?.classList.add("active");
    });
    document.getElementById("conta-recompensas").addEventListener("click", () => {
      menu.remove();
      document.getElementById("painelRecompensasOverlay")?.classList.add("active");
      if (currentUser) carregarRecompensas(currentUser);
    });
    document.getElementById("conta-sair").addEventListener("click", () => {
      menu.remove();
      auth.signOut().then(() => {
        mostrarToastLogin("Até logo! 👋");
        setTimeout(() => location.reload(), 1200);
      });
    });

    setTimeout(() => {
      document.addEventListener("click", function fecharMenu(e) {
        if (!menu.contains(e.target) && e.target !== el.userBtn) {
          menu.remove();
          document.removeEventListener("click", fecharMenu);
        }
      });
    }, 100);
  }

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
     🚀 PRODUTOS
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
      document.getElementById("numero-input").disabled = false;
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
      <div style="background:linear-gradient(135deg,#fff8e1,#fffde7);border:1px solid #E1A95F;border-radius:10px;padding:10px 12px;margin-top:10px;display:flex;align-items:center;gap:8px;">
        <span style="font-size:1.4rem;">🎁</span>
        <div>
          <p style="margin:0;font-size:.78rem;font-weight:700;color:#4B2C20;">Esta compra acumula pontos de fidelidade!</p>
          <p style="margin:0;font-size:.72rem;color:#8d6e63;">Acesse pelo menu lateral ou pelo seu perfil</p>
        </div>
      </div>
      <button id="main-finish-btn" type="button" style="width:100%;background:#4caf50;color:#fff;border:none;padding:15px;border-radius:10px;font-weight:bold;font-size:1.1rem;cursor:pointer;margin-top:10px;box-shadow:0 4px 10px rgba(76,175,80,.3);">
        FINALIZAR PEDIDO 🍰
      </button>
    `;

    document.getElementById("main-finish-btn")?.addEventListener("click", () => window.fecharPedido());
  }

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
      addr = "Retirada na loja: Rua Espanha, 72 - Parque das Nações, Três Marias/MG";
    } else if (!addr) {
      alert("Preencha o endereço completo (ou marque 'Retirar no Local') para continuar.");
      return;
    }

    window.finalAddressStringForWhatsApp = addr;
    abrirModalPIX();
  };

  /* =========================================================
     📦 MEUS PEDIDOS
  ========================================================= */
  function emojiProduto(nome) {
    const n = (nome || "").toLowerCase();
    if (n.includes("brigadeiro"))  return "🍫";
    if (n.includes("prestígio") || n.includes("prestigio")) return "🥥";
    if (n.includes("morango"))     return "🍓";
    if (n.includes("ninho"))       return "🥛";
    return "🍰";
  }

  function carregarPedidos(user) {
    if (!db || !user) return;
    const lista = document.getElementById("listaPedidos");
    if (!lista) return;
    lista.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carregando seus pedidos...</p>';

    db.collection("Pedidos")
      .where("userId", "==", user.uid)
      .limit(20)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          return db.collection("Pedidos").where("uid", "==", user.uid).limit(20).get();
        }
        return snapshot;
      })
      .then(snapshot => {
        if (snapshot.empty) {
          lista.innerHTML = `
            <div style="text-align:center;padding:30px 10px;">
              <div style="font-size:3rem;margin-bottom:10px;">🍰</div>
              <p style="color:#999;font-size:.95rem;">Você ainda não fez nenhum pedido.</p>
              <p style="color:#E1A95F;font-size:.85rem;font-weight:600;">Que tal experimentar um bolinho hoje?</p>
            </div>`;
          return;
        }

        const docs = [...snapshot.docs].sort((a, b) => {
          const da = a.data().criadoEm?.toDate?.() || new Date(a.data().data || 0);
          const db2 = b.data().criadoEm?.toDate?.() || new Date(b.data().data || 0);
          return db2 - da;
        });
        lista.innerHTML = docs.map(doc => {
          const d = doc.data();
          let dataHora = "—";
          if (d.criadoEm?.toDate) {
            const dt = d.criadoEm.toDate();
            dataHora = dt.toLocaleDateString("pt-BR") + " às " + dt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
          } else if (d.data) {
            try {
              const dt = new Date(d.data);
              if (!isNaN(dt)) dataHora = dt.toLocaleDateString("pt-BR") + " às " + dt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
            } catch(e) { dataHora = d.data; }
          }

          const itens = Array.isArray(d.itensObj) ? d.itensObj : (Array.isArray(d.itens) ? d.itens : []);
          const emojis = itens.slice(0, 4).map(i => emojiProduto(i.nome));
          const miniatura = emojis.length > 0
            ? `<div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap;">
                ${emojis.map(e => `<span style="font-size:1.6rem;background:#fdf8ef;border-radius:8px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">${e}</span>`).join("")}
               </div>`
            : `<div style="font-size:2rem;margin-bottom:8px;">🍰</div>`;

          const itensTexto = itens.length > 0
            ? itens.map(i => `${i.nome}${i.qtd > 1 ? ` x${i.qtd}` : ""}`).join(" • ")
            : (d.resumo || "Pedido");

          const total  = d.total  ? money(d.total)  : "";
          const status = d.status || "enviado";
          const cores  = { enviado:"#E1A95F", preparando:"#1976d2", pronto:"#2e7d32", entregue:"#4caf50", cancelado:"#d32f2f" };
          const cor    = cores[status] || "#999";
          const icones = { enviado:"📨", preparando:"👩‍🍳", pronto:"✅", entregue:"🎉", cancelado:"❌" };
          const icone  = icones[status] || "📦";

          return `
            <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;border:1px solid rgba(225,169,95,.25);box-shadow:0 2px 8px rgba(0,0,0,.06);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="font-size:.78rem;color:#aaa;">${dataHora}</span>
                <span style="font-size:.72rem;font-weight:700;color:${cor};background:${cor}18;padding:3px 10px;border-radius:20px;text-transform:uppercase;">${icone} ${status}</span>
              </div>
              ${miniatura}
              <p style="margin:0 0 6px;font-size:.85rem;color:#6d4c41;line-height:1.4;">${itensTexto}</p>
              ${total ? `<p style="margin:0;font-weight:800;color:#C8282D;font-size:1rem;">${total}</p>` : ""}
            </div>`;
        }).join("");
      })
      .catch(err => {
        console.error("Erro ao carregar pedidos:", err);
        lista.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Erro ao carregar pedidos. Tente novamente.</p>';
      });
  }

  /* =========================================================
     📊 PAINEL DE RELATÓRIOS (Admin)
  ========================================================= */
  function abrirRelatorios() {
    let overlay = document.getElementById("relatoriosOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "relatoriosOverlay";
      overlay.className = "painel-overlay";
      overlay.innerHTML = `
        <div class="painel-box" style="max-width:560px;">
          <div class="painel-head">
            <span>📊 Relatórios Degust</span>
            <button class="fechar-painel" id="fechar-relatorios" type="button">✖</button>
          </div>
          <div class="painel-body">
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
              <button class="rel-filtro rel-ativo" data-dias="7"  type="button">7 dias</button>
              <button class="rel-filtro" data-dias="30" type="button">30 dias</button>
              <button class="rel-filtro" data-dias="0"  type="button">Personalizado</button>
            </div>
            <div id="rel-datas-custom" style="display:none;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
              <input type="date" id="rel-data-inicio" style="flex:1;padding:8px;border:1px solid var(--dourado);border-radius:8px;font-size:.85rem;">
              <input type="date" id="rel-data-fim"    style="flex:1;padding:8px;border:1px solid var(--dourado);border-radius:8px;font-size:.85rem;">
              <button id="rel-btn-custom" type="button" style="background:var(--marrom);color:var(--bege);border:none;padding:8px 16px;border-radius:8px;font-weight:700;cursor:pointer;">Filtrar</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;" id="rel-cards">
              <div class="rel-card"><div class="rel-card-val" id="rel-total-vendas">—</div><div class="rel-card-label">Total em Vendas</div></div>
              <div class="rel-card"><div class="rel-card-val" id="rel-num-pedidos">—</div><div class="rel-card-label">Pedidos</div></div>
              <div class="rel-card"><div class="rel-card-val" id="rel-ticket-medio">—</div><div class="rel-card-label">Ticket Médio</div></div>
              <div class="rel-card"><div class="rel-card-val" id="rel-mais-vendido">—</div><div class="rel-card-label">Mais Vendido</div></div>
            </div>
            <h4 style="color:var(--marrom);margin:0 0 10px;font-size:.95rem;">📋 Pedidos no Período</h4>
            <div id="rel-lista-pedidos" style="max-height:260px;overflow-y:auto;"></div>
            <button id="rel-exportar" type="button" style="width:100%;margin-top:14px;background:var(--dourado);color:var(--marrom);border:none;padding:13px;border-radius:10px;font-weight:800;font-size:.95rem;cursor:pointer;">
              📥 Exportar CSV
            </button>
          </div>
        </div>`;
      document.body.appendChild(overlay);

      document.getElementById("fechar-relatorios").addEventListener("click", () => {
        overlay.classList.remove("active");
      });
      overlay.addEventListener("click", e => { if (e.target === overlay) overlay.classList.remove("active"); });

      overlay.querySelectorAll(".rel-filtro").forEach(btn => {
        btn.addEventListener("click", () => {
          overlay.querySelectorAll(".rel-filtro").forEach(b => b.classList.remove("rel-ativo"));
          btn.classList.add("rel-ativo");
          const dias = parseInt(btn.dataset.dias);
          const custom = document.getElementById("rel-datas-custom");
          if (dias === 0) {
            custom.style.display = "flex";
          } else {
            custom.style.display = "none";
            const fim   = new Date();
            const inicio = new Date(); inicio.setDate(inicio.getDate() - dias);
            buscarRelatorio(inicio, fim);
          }
        });
      });

      document.getElementById("rel-btn-custom").addEventListener("click", () => {
        const di = document.getElementById("rel-data-inicio").value;
        const df = document.getElementById("rel-data-fim").value;
        if (!di || !df) return alert("Selecione as duas datas.");
        buscarRelatorio(new Date(di + "T00:00:00"), new Date(df + "T23:59:59"));
      });

      document.getElementById("rel-exportar").addEventListener("click", exportarCSV);
    }

    overlay.classList.add("active");
    const fim    = new Date();
    const inicio = new Date(); inicio.setDate(inicio.getDate() - 7);
    buscarRelatorio(inicio, fim);
  }

  let _pedidosRelatorio = [];

  function buscarRelatorio(inicio, fim) {
    const listaEl = document.getElementById("rel-lista-pedidos");
    if (!listaEl || !db) return;
    listaEl.innerHTML = '<p style="text-align:center;color:#999;padding:16px;">Carregando...</p>';

    db.collection("Pedidos")
      .where("criadoEm", ">=", firebase.firestore.Timestamp.fromDate(inicio))
      .where("criadoEm", "<=", firebase.firestore.Timestamp.fromDate(fim))
      .orderBy("criadoEm", "desc")
      .get()
      .then(snap => {
        _pedidosRelatorio = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const totalVendas  = _pedidosRelatorio.reduce((s, p) => s + (Number(p.total) || 0), 0);
        const numPedidos   = _pedidosRelatorio.length;
        const ticketMedio  = numPedidos > 0 ? totalVendas / numPedidos : 0;

        const contagem = {};
        _pedidosRelatorio.forEach(p => {
          (p.itens || []).forEach(i => {
            const k = i.nome?.split("(")[0].trim() || "?";
            contagem[k] = (contagem[k] || 0) + (i.qtd || 1);
          });
        });
        const maisVendido = Object.entries(contagem).sort((a,b) => b[1]-a[1])[0]?.[0] || "—";

        document.getElementById("rel-total-vendas").textContent  = money(totalVendas);
        document.getElementById("rel-num-pedidos").textContent   = numPedidos;
        document.getElementById("rel-ticket-medio").textContent  = money(ticketMedio);
        document.getElementById("rel-mais-vendido").textContent  = maisVendido.split(" ")[1] || maisVendido;

        if (numPedidos === 0) {
          listaEl.innerHTML = '<p style="text-align:center;color:#999;padding:16px;">Nenhum pedido neste período.</p>';
          return;
        }

        listaEl.innerHTML = _pedidosRelatorio.map(p => {
          const dt = p.criadoEm?.toDate?.();
          const dataHora = dt ? dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}) : "—";
          const itens = (p.itens||[]).map(i=>`${i.nome} x${i.qtd||1}`).join(", ") || p.resumo || "—";
          const cores = { enviado:"#E1A95F", preparando:"#1976d2", pronto:"#2e7d32", entregue:"#4caf50", cancelado:"#d32f2f" };
          const cor   = cores[p.status||"enviado"] || "#999";
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0e8d8;gap:8px;flex-wrap:wrap;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:.75rem;color:#aaa;">${dataHora}</div>
              <div style="font-size:.82rem;color:#4B2C20;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${itens}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-weight:800;color:#C8282D;font-size:.9rem;">${p.total ? money(p.total) : "—"}</div>
              <div style="font-size:.7rem;font-weight:700;color:${cor};text-transform:uppercase;">${p.status||"enviado"}</div>
            </div>
          </div>`;
        }).join("");
      })
      .catch(err => {
        console.error("Erro relatório:", err);
        listaEl.innerHTML = '<p style="text-align:center;color:#c62828;padding:16px;">Erro ao carregar dados.</p>';
      });
  }

  function exportarCSV() {
    if (!_pedidosRelatorio.length) return alert("Nenhum dado para exportar.");
    const linhas = [
      ["Data","Hora","Cliente","Itens","Total","Status"],
      ..._pedidosRelatorio.map(p => {
        const dt = p.criadoEm?.toDate?.();
        return [
          dt ? dt.toLocaleDateString("pt-BR") : "—",
          dt ? dt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}) : "—",
          p.nomeCliente || p.email || "—",
          (p.itens||[]).map(i=>`${i.nome} x${i.qtd||1}`).join(" | ") || p.resumo || "—",
          (p.total || 0).toFixed(2).replace(".",","),
          p.status || "enviado"
        ];
      })
    ];
    const csv = linhas.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(";")).join("\n");
    const blob = new Blob(["ï»¿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `degust-relatorio-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  /* =========================================================
     🕰️ STATUS LOJA (horário fixo, removido)
     Cookies
  ========================================================= */
  const cookieBanner    = document.getElementById("cookie-banner");
  const cookieAcceptBtn = document.getElementById("cookie-accept");

  if (cookieBanner && cookieAcceptBtn) {
    if (localStorage.getItem("degust-cookies-accepted")) {
      cookieBanner.style.display = "none";
    } else {
      setTimeout(() => cookieBanner.classList.add("show"), 2000);
    }

    cookieAcceptBtn.addEventListener("click", () => {
      localStorage.setItem("degust-cookies-accepted", "true");
      cookieBanner.classList.remove("show");
      setTimeout(() => { cookieBanner.style.display = "none"; }, 450);
      popupAdd("Preferências salvas! 🍪");
    });
  }

  /* =========================================================
     🏁 INICIALIZAÇÃO
  ========================================================= */
  inicializarFirebase();
  resetListeners();
  loadCart();          // carrega o carrinho salvo
  renderMiniCart();
  carregarMetasRecompensas();   // carrega as metas de recompensa
  setTimeout(() => checarStatusLoja(), 800);

  console.log("%c🍰 Degust Bolos no Pote v13.0 — Sistema Completo (carrinho persistente + recompensas)", "color:#E1A95F;font-size:14px;font-weight:bold;");

});