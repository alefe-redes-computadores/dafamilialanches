/* =========================================================
   🚀 DFL v3.9.1 — CLICKS + LOGIN FIX (ESTÁVEL)
   - Corrige cliques que "morreram" (rebinds sólidos + Overlays revisados)
   - Corrige login (garante Firebase inicializado antes de usar auth)
   - Mantém som APENAS na finalização do pedido (melhor UX)
   - Compatível com sua base v3.6.10+ (promos, cupons, pedidos, recompensas)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------ ⚙️ BASE ------------------ */
  const sound = new Audio("click.wav"); // Som só na finalização
  let cart = [];
  let currentUser = null;

  const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
  const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };

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

    // Promos
    promoModal: document.getElementById("promo-modal"),
    promoImg: document.getElementById("promo-modal-img"),
    promoTitle: document.getElementById("promo-modal-title"),
    promoPrice: document.getElementById("promo-modal-price"),
    promoAddBtn: document.getElementById("promo-modal-add"),
    promoNavPrev: document.querySelector("#promo-modal .promo-nav.prev"),
    promoNavNext: document.querySelector("#promo-modal .promo-nav.next"),
    promoClose: document.querySelector("#promo-modal .promo-close"),

    // Pedidos
    pedidosContainer: document.querySelector(".meus-pedidos"),
    pedidosBtn: document.querySelector(".meus-pedidos-btn"),
    pedidosPanel: document.getElementById("painelPedidos"),
    pedidosFecharBtn: document.querySelector(".fechar-pedidos"),
    pedidosLista: document.getElementById("listaPedidos"),

    // Recompensas
    recompensasContainer: document.querySelector(".minhas-recompensas"),
    recompensasBtn: document.querySelector(".recompensas-btn"),
    recompensasPanel: document.getElementById("recompensas-panel"),
    recompensasFecharBtn: document.querySelector(".fechar-recompensas"),
    recompensasLista: document.getElementById("listaRecompensas"),
    historicoLista: document.getElementById("historicoRecompensas"),
  };

  // Garante o backdrop
  if (!el.cartBackdrop) {
    const bd = document.createElement("div");
    bd.id = "cart-backdrop";
    document.body.appendChild(bd);
    el.cartBackdrop = bd;
  }

  /* ------------------ 🧩 OVERLAYS (NATIVO E ESTÁVEL) ------------------ */
  const Overlays = {
    _activeRoot: null,

    _asRoot(node) {
      if (!node) return null;
      // mini-cart e painéis usam "active"; modais usam "show"
      const isPanel = node.id === "mini-cart" || node.id === "painelPedidos" || node.id === "recompensas-panel" || node.id === "admin-dashboard";
      return { node, cls: isPanel ? "active" : "show" };
    },

    open(node) {
      if (!node) return;
      const root = this._asRoot(node);
      this.closeAll();
      root.node.classList.add(root.cls);
      el.cartBackdrop.classList.add("active");
      document.body.classList.add("no-scroll");
      this._activeRoot = root;
    },

    close(node) {
      const root = node ? this._asRoot(node) : this._activeRoot;
      if (!root) return;
      root.node.classList.remove(root.cls);
      this._activeRoot = null;
      // Se nenhum outro modal está aberto, fecha backdrop
      const anyOpen = document.querySelector(".modal.show, .modal.active, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show");
      if (!anyOpen) {
        el.cartBackdrop.classList.remove("active");
        document.body.classList.remove("no-scroll");
      }
    },

    closeAll() {
      document
        .querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show")
        .forEach((e) => e.classList.remove("show", "active"));
      el.cartBackdrop.classList.remove("active");
      document.body.classList.remove("no-scroll");
      this._activeRoot = null;
    },
  };

  // Tornar acessível globalmente (caso algum handler externo use)
  window.Overlays = Overlays;

  // Fecha somente quando clicar no backdrop/fora do conteúdo
  const stopInside = (e) => {
    const inside = e.target.closest(".modal-content, .login-box, .promo-content, .dashboard-body");
    if (inside) e.stopPropagation();
  };
  document.addEventListener("click", stopInside, { capture: true });

  // Clique no backdrop fecha o overlay atual
  el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());

  // Clique em área vazia do modal fecha (mas não cliques dentro do conteúdo)
  document.querySelectorAll(".modal").forEach((modal) => {
    if (modal._backdropBound) return;
    modal._backdropBound = true;
    modal.addEventListener("click", (ev) => {
      if (ev.target === modal) Overlays.close(modal);
    });
  });

  /* ------------------ 🗃️ DADOS DE PROMO ------------------ */
  const PROMO_DATA = [
    null, // índice 1 = Promo 1
    { id: 1, nome: "Combo 2 Purizin + Fanta 1L", preco: 34.99, precoAntigo: 40.0, img: "promocoes/promo1.jpg" },
    { id: 2, nome: "Combo 3 Padaná", preco: 37.99, precoAntigo: 45.0, img: "promocoes/promo2.jpg" },
    { id: 3, nome: "Combo 2 Peleja", preco: 39.99, precoAntigo: 52.0, img: "promocoes/promo3.jpg" },
    { id: 4, nome: "Combo 3 Trem + Fanta 1L", preco: 44.99, precoAntigo: 52.0, img: "promocoes/promo4.jpg" },
    { id: 5, nome: "Combo 4 Trem + Fanta 1L", preco: 49.99, precoAntigo: 65.0, img: "promocoes/promo5.jpg" },
    { id: 6, nome: "Combo 5 Uai", preco: 54.99, precoAntigo: 65.0, img: "promocoes/promo6.jpg" },
    { id: 7, nome: "Combo 4 TremBão + Fanta 1L", preco: 59.99, precoAntigo: 77.0, img: "promocoes/promo7.jpg" },
    { id: 8, nome: "Combo 4 Armaria", preco: 59.99, precoAntigo: 72.0, img: "promocoes/promo8.jpg" },
    { id: 9, nome: "Combo 5 Uai + Kuat 2L", preco: 64.99, precoAntigo: 79.99, img: "promocoes/promo9.jpg" },
  ];

  /* ------------------ 🌐 FIREBASE (LAZY + LOGIN FIX) ------------------ */
  const firebaseConfig = {
    apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
    authDomain: "da-familia-lanches.firebaseapp.com",
    projectId: "da-familia-lanches",
    storageBucket: "da-familia-lanches.appspot.com",
    messagingSenderId: "106857147317",
    appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
  };

  let auth = null;
  let db = null;
  let _firebaseReadyPromise = null;

  function ensureFirebaseReady() {
    if (_firebaseReadyPromise) return _firebaseReadyPromise;

    _firebaseReadyPromise = new Promise((resolve, reject) => {
      try {
        if (!window.firebase) throw new Error("Firebase SDK (app) não carregado.");
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

        auth = firebase.auth();
        db = firebase.firestore();

        // 👉 onAuthStateChanged **só após** app inicializado
        auth.onAuthStateChanged((user) => {
          currentUser = user;
          if (el.userBtn) el.userBtn.textContent = user ? `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}` : "Entrar / Cadastrar";
          if (el.pedidosContainer) el.pedidosContainer.style.display = user ? "block" : "none";
          if (el.recompensasContainer) el.recompensasContainer.style.display = user ? "block" : "none";

          // Controle admin
          if (user && isAdmin(user)) {
            if (el.reportsBtn) showAdminFab();
          } else {
            if (el.reportsBtn) el.reportsBtn.style.display = "none";
            document.getElementById("admin-dashboard")?.remove();
          }
        });

        resolve({ auth, db });
      } catch (err) {
        console.error("Firebase init error:", err);
        reject(err);
      }
    });

    return _firebaseReadyPromise;
  }

  /* ------------------ 🔐 LOGIN ------------------ */
  const handleLoginSuccess = (user) => {
    currentUser = user;
    popupAdd("Login realizado com sucesso!");
    // Fecha o modal de login com segurança (sem timeouts zero que brigam com overlays)
    setTimeout(() => Overlays.close(el.loginModal), 300);
  };

  const handleLoginError = (err) => {
    if (err?.code === "auth/user-not-found") {
      if (confirm("Conta não encontrada. Deseja criar uma nova?")) {
        const email = document.getElementById("login-email")?.value?.trim();
        const senha = document.getElementById("login-senha")?.value?.trim();
        auth
          .createUserWithEmailAndPassword(email, senha)
          .then((cred) => handleLoginSuccess(cred.user))
          .catch((e) => alert("Erro: " + e.message));
      }
    } else if (err?.code === "auth/wrong-password") {
      alert("Senha incorreta. Tente novamente.");
    } else {
      alert("Erro: " + (err?.message || "Falha ao autenticar"));
    }
  };

  // Abre modal de login (inicializando Firebase antes)
  el.userBtn?.addEventListener("click", async () => {
    try {
      await ensureFirebaseReady();
      Overlays.open(el.loginModal);
    } catch {
      alert("Erro ao conectar ao serviço de login. Tente recarregar a página.");
    }
  });

  el.loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await ensureFirebaseReady();
      const email = document.getElementById("login-email")?.value?.trim();
      const senha = document.getElementById("login-senha")?.value?.trim();
      if (!email || !senha) return alert("Preencha e-mail e senha.");
      const cred = await auth.signInWithEmailAndPassword(email, senha);
      handleLoginSuccess(cred.user);
    } catch (err) {
      handleLoginError(err);
    }
  });

  el.googleBtn?.addEventListener("click", async () => {
    try {
      await ensureFirebaseReady();
      const provider = new firebase.auth.GoogleAuthProvider();
      const res = await auth.signInWithPopup(provider);
      handleLoginSuccess(res.user);
    } catch (err) {
      handleLoginError(err);
    }
  });

  /* ------------------ 🧺 MINI-CARRINHO ------------------ */
  const DELIVERY_FEE = 6.0;
  let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();
  let addressValue = (localStorage.getItem("dflAddress") || "").trim();

  const getCartSubtotal = () => cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);

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

  function renderMiniCart() {
    if (!el.miniList) return;

    const totalItens = cart.reduce((s, i) => s + i.qtd, 0);
    if (el.cartCount) el.cartCount.textContent = totalItens;

    if (!cart.length) {
      el.miniList.innerHTML = `
        <div class="cart-empty-msg" style="padding:18px 14px;text-align:center;border:1px dashed #ffca28;border-radius:12px;background:#fffdf3;box-shadow:inset 0 1px 0 rgba(255,255,255,.6);font-weight:600;line-height:1.35;">
          <div style="font-size:1.05rem; margin-bottom:6px;">🍔 Carrinho vazio por aqui…</div>
          <div style="font-size:.95rem; color:#6b6b6b;">
            Nosso programador-chapeiro foi dar um trato no grill e já volta 😅<br/>
            Enquanto isso, dá um rolê no cardápio e escolhe um trem bão!
          </div>
        </div>
      `;
      // limpa resumo/cupom
      if (el.miniFoot) el.miniFoot.querySelectorAll(".cart-summary-generated").forEach((e) => e.remove());
      const couponMsg = document.getElementById("coupon-message");
      const couponDiscountRow = document.getElementById("coupon-discount-row");
      if (couponMsg) couponMsg.innerHTML = "";
      if (couponDiscountRow) couponDiscountRow.style.display = "none";
      return;
    }

    el.miniList.innerHTML = cart
      .map(
        (item, idx) => `
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
      </div>`
      )
      .join("");

    bindMiniCartButtons();
    // Atualiza o rodapé/calcula totais (async)
    enhanceMiniCartUI();
  }

  function bindMiniCartButtons() {
    el.miniList.querySelectorAll(".cart-plus").forEach((b) =>
      b.addEventListener("click", (e) => {
        const i = +e.currentTarget.dataset.idx;
        if (cart[i]) {
          cart[i].qtd++;
          renderMiniCart();
        }
      })
    );

    el.miniList.querySelectorAll(".cart-minus").forEach((b) =>
      b.addEventListener("click", (e) => {
        const i = +e.currentTarget.dataset.idx;
        if (!cart[i]) return;
        if (cart[i].qtd > 1) cart[i].qtd--;
        else cart.splice(i, 1);
        renderMiniCart();
      })
    );

    el.miniList.querySelectorAll(".cart-remove").forEach((b) =>
      b.addEventListener("click", (e) => {
        const i = +e.currentTarget.dataset.idx;
        cart.splice(i, 1);
        renderMiniCart();
        popupAdd("Item removido!");
      })
    );
  }

  // Abre carrinho (inicializa Firebase se não logado, mas não obriga login)
  el.cartIcon?.addEventListener("click", async () => {
    if (!currentUser) {
      try { await ensureFirebaseReady(); } catch {}
    }
    renderMiniCart();
    Overlays.open(el.miniCart);
  });

  /* ------------------ 🎟️ CUPOM (FORM) ------------------ */
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

  /* ------------------ 🥤 Combos & Adicionais ------------------ */
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
    el.extrasList.innerHTML = adicionais
      .map(
        (a, i) => `
      <label class="extra-line" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #ffb300;border-radius:8px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.08);cursor:pointer;transition:all .2s;font-size:1rem;">
        <span style="font-weight:600;color:#222;">${a.nome} — <b style="color:#d32f2f;">${money(a.preco)}</b></span>
        <input type="checkbox" value="${i}" style="margin-left:10px;">
      </label>`
      )
      .join("");
    Overlays.open(el.extrasModal);
  });

  document.querySelectorAll(".extras-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => openExtrasFor(e.currentTarget.closest(".card")))
  );

  el.extrasConfirm?.addEventListener("click", () => {
    if (!produtoExtras) return Overlays.close(el.extrasModal);

    const checks = [...document.querySelectorAll("#extras-modal .extras-list input:checked")];
    const extrasContagem = {};
    checks.forEach((c) => {
      const idx = +c.value;
      const adicional = adicionais[idx];
      if (extrasContagem[adicional.nome]) extrasContagem[adicional.nome].qtd++;
      else extrasContagem[adicional.nome] = { preco: adicional.preco, qtd: 1 };
    });

    const extrasNomes = Object.keys(extrasContagem)
      .map((nome) => {
        const qtd = extrasContagem[nome].qtd;
        return qtd > 1 ? `${qtd}x ${nome}` : nome;
      })
      .join(", ");

    const precoExtras = Object.values(extrasContagem).reduce((t, e) => t + e.preco * e.qtd, 0);
    const precoTotal = produtoPrecoBase + precoExtras;
    const nomeCompleto = extrasNomes ? `${produtoExtras} + ${extrasNomes}` : produtoExtras;

    const existente = cart.find((i) => i.nome === nomeCompleto);
    if (existente) existente.qtd++;
    else cart.push({ nome: nomeCompleto, preco: precoTotal, qtd: 1 });

    renderMiniCart();
    popupAdd("Adicionado ao carrinho!");
    Overlays.close(el.extrasModal);
  });

  // Combos
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
    const grupo = low.includes("casal") ? "casal" : low.includes("família") || low.includes("familia") ? "familia" : null;
    if (!grupo) {
      addCommonItem(nomeCombo, precoBase);
      return;
    }

    const opts = comboDrinkOptions[grupo];
    el.comboBody.innerHTML = opts
      .map(
        (o, i) => `
      <label class="combo-option-line" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #ffb300;border-radius:8px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.08);cursor:pointer;transition:all .2s;">
        <span style="font-weight:600;color:#222;">${o.rotulo}</span>
        <span style="font-weight:700;color:#d32f2f;">+ ${money(o.delta)}</span>
        <input type="radio" name="combo-drink" value="${i}" ${i === 0 ? "checked" : ""} style="margin-left:10px;">
      </label>`
      )
      .join("");

    _comboCtx = { nomeCombo, precoBase, grupo };
    Overlays.open(el.comboModal);
  });

  el.comboConfirm?.addEventListener("click", () => {
    if (!_comboCtx) return Overlays.close(el.comboModal);
    const sel = el.comboBody?.querySelector('input[name="combo-drink"]:checked');
    if (!sel) return;
    const opt = comboDrinkOptions[_comboCtx.grupo][+sel.value];
    const finalName = `${_comboCtx.nomeCombo} + ${opt.rotulo}`;
    const finalPrice = Number(_comboCtx.precoBase) + (opt.delta || 0);

    const existente = cart.find((i) => i.nome === finalName);
    if (existente) existente.qtd++;
    else cart.push({ nome: finalName, preco: finalPrice, qtd: 1 });

    popupAdd("Combo adicionado!");
    renderMiniCart();
    Overlays.close(el.comboModal);
  });

  document.querySelectorAll("#combo-modal .combo-close").forEach((b) =>
    b.addEventListener("click", () => Overlays.close(el.comboModal))
  );

  // Adicionar item comum
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

  /* ------------------ 🧮 CUPONS (FIRESTORE) ------------------ */
  let configuracoesRecompensa = null;
  const _cupomCache = {}; // key -> { ate, res }

  async function carregarConfiguracoesDeRecompensas() {
    try {
      await ensureFirebaseReady();
      if (configuracoesRecompensa) return configuracoesRecompensa;
      const snapshot = await db.collection("RecompensasConfig").get();
      const configs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        configs.push({
          id: doc.id,
          limite: data.meta || data.limite,
          tipo: data.tipo,
          valor: data.valor || data.titulo,
          titulo: data.titulo || data.valor,
          ...data,
        });
      });
      configuracoesRecompensa = configs.sort((a, b) => (a.limite || 0) - (b.limite || 0));
      return configuracoesRecompensa;
    } catch (e) {
      console.error("Erro ao carregar RecompensasConfig:", e);
      return [];
    }
  }

  function _cacheKey(codigo, subtotal) {
    const faixa = Math.floor((subtotal || 0) / 5);
    return `${(codigo || "").toUpperCase()}::${faixa}`;
  }

  async function validarCupomFirestore(codigo, subtotal) {
    try {
      await ensureFirebaseReady();
    } catch {
      return { valido: false, discount: 0, freeShipping: false, label: "", mensagem: "Sem conexão." };
    }

    const code = (codigo || "").toUpperCase();
    const invalido = { valido: false, discount: 0, freeShipping: false, label: "", mensagem: "" };
    if (!code) return invalido;
    const userId = currentUser?.uid;

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
        const recompensaEncontrada = RECOMPENSAS_DATA.find((r) => r.valor === code && r.tipo === "cupom");
        if (userId && recompensaEncontrada) {
          const snapPessoal = await db.collection("CuponsUsuarios").doc(userId).get();
          const pessoalData = snapPessoal.data();
          if (snapPessoal.exists && pessoalData?.cupom === code && !pessoalData?.usado) {
            data = {
              tipo: pessoalData.tipo,
              valor: pessoalData.valor,
              ativo: true,
              expiraEm: pessoalData.expiraEm,
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

      if (data.ativo === false) {
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
        const perc = Number(data.percent || data.valor);
        discount = Math.max(0, subtotal * (perc / 100));
        label = `${perc}% OFF`;
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

      const res = { valido: true, discount, freeShipping, label, mensagem: "Cupom aplicado com sucesso!", isPersonalizado };
      _cupomCache[key] = { ate: now + 30000, res };
      return res;
    } catch (err) {
      console.error("Erro ao validar cupom:", err);
      return { ...invalido, mensagem: "Erro ao processar o cupom." };
    }
  }

  async function calcTotals() {
    const subtotal = getCartSubtotal();
    const d = await validarCupomFirestore(couponApplied, subtotal);
    const delivery = d.freeShipping ? 0 : DELIVERY_FEE;
    const total = Math.max(0, subtotal + delivery - d.discount);
    return { subtotal, delivery, discount: d.discount, discountInfo: d, total };
  }

  async function enhanceMiniCartUI() {
    if (!el.miniFoot) return;

    el.miniFoot.querySelectorAll(".cart-summary-generated").forEach((e) => e.remove());

    if (cart.length === 0) {
      const couponMsg = document.getElementById("coupon-message");
      const couponDiscountRow = document.getElementById("coupon-discount-row");
      if (couponMsg) couponMsg.innerHTML = "";
      if (couponDiscountRow) couponDiscountRow.style.display = "none";
      return;
    }

    const { subtotal, delivery, discount, total, discountInfo } = await calcTotals();

    const couponMsg = document.getElementById("coupon-message");
    const couponDiscountRow = document.getElementById("coupon-discount-row");
    const cartDiscount = document.getElementById("cart-discount");

    if (couponMsg) {
      couponMsg.textContent = discountInfo.mensagem || "";
      couponMsg.className = `coupon-message ${discountInfo.valido ? "success" : "error"}`;
      if (!discountInfo.valido && couponApplied) {
        couponApplied = "";
        localStorage.removeItem("dflCoupon");
        const couponInput = document.getElementById("coupon-input");
        if (couponInput && document.activeElement !== couponInput) couponInput.value = "";
      }
    }

    if (couponDiscountRow && cartDiscount) {
      if (discount > 0 || discountInfo.label) {
        cartDiscount.textContent = `- ${money(discount)} ${couponApplied ? `(${couponApplied})` : ""}`;
        couponDiscountRow.style.display = "flex";
      } else {
        couponDiscountRow.style.display = "none";
      }
    }

    const summaryDiv = document.createElement("div");
    summaryDiv.className = "cart-summary-generated";
    summaryDiv.innerHTML = `
      <div class="summary-row" style="margin-top:10px;border-top:1px solid #eee;padding-top:10px;">
        <span>Subtotal</span><b>${money(subtotal)}</b>
      </div>
      <div class="summary-row">
        <span>Entrega</span><b>${money(delivery)}</b>
      </div>
      <div class="summary-row" style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #eee;padding-top:10px;margin:10px 0;font-size:1.1rem;">
        <span><b>Total</b></span><span style="color:#e53935;font-weight:800;">${money(total)}</span>
      </div>
      <label style="display:block;font-weight:600;margin-bottom:6px;">🏠 Endereço para Entrega</label>
      <textarea id="address-input" rows="2" placeholder="Rua, número, complemento, bairro" style="width:100%;border:1px solid #ddd;border-radius:10px;padding:10px;resize:vertical;margin-bottom:10px">${addressValue}</textarea>
      <button id="finish-order" type="button" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:10px;padding:12px;font-weight:700;cursor:pointer;margin-bottom:8px">Finalizar Pedido 🛍️</button>
      <button id="clear-cart" type="button" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;cursor:pointer">Limpar Carrinho</button>
    `;
    el.miniFoot.appendChild(summaryDiv);

    summaryDiv.querySelector("#address-input")?.addEventListener("input", (e) => {
      addressValue = (e.target.value || "").trim();
      localStorage.setItem("dflAddress", addressValue);
    });

    summaryDiv.querySelector("#finish-order")?.addEventListener("click", fecharPedido);
    summaryDiv.querySelector("#clear-cart")?.addEventListener("click", () => {
      if (confirm("Limpar todo o carrinho?")) {
        cart = [];
        couponApplied = "";
        localStorage.removeItem("dflCoupon");
        const couponInput = document.getElementById("coupon-input");
        if (couponInput) couponInput.value = "";
        renderMiniCart();
        popupAdd("Carrinho limpo!");
      }
    });
  }

  /* ------------------ 🖼️ CARROSSEL / PROMO MODAL ------------------ */
  let currentPromoId = 1;

  function showPromoModal(promoId) {
    if (!el.promoModal || !PROMO_DATA[promoId]) return;
    currentPromoId = Number(promoId);
    const promo = PROMO_DATA[currentPromoId];
    if (el.promoImg) el.promoImg.src = promo.img;
    if (el.promoTitle) el.promoTitle.textContent = promo.nome;
    if (el.promoPrice) {
      el.promoPrice.innerHTML = `<span class="old-price">De ${money(promo.precoAntigo)}</span> por <b>${money(promo.preco)}</b>`;
    }
    Overlays.open(el.promoModal);
  }

  document.querySelectorAll(".slide[data-promo-id]").forEach((img) => {
    img.addEventListener("click", () => {
      const id = parseInt(img.dataset.promoId, 10);
      if (id) showPromoModal(id);
    });
  });

  el.promoAddBtn?.addEventListener("click", () => {
    const promo = PROMO_DATA[currentPromoId];
    if (!promo) return;
    addCommonItem(promo.nome, promo.preco);
    Overlays.close(el.promoModal);
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
  el.promoClose?.addEventListener("click", () => Overlays.close(el.promoModal));

  el.cPrev?.addEventListener("click", () => {
    if (!el.slides) return;
    el.slides.scrollLeft -= Math.min(el.slides.clientWidth * 0.9, 320);
  });
  el.cNext?.addEventListener("click", () => {
    if (!el.slides) return;
    el.slides.scrollLeft += Math.min(el.slides.clientWidth * 0.9, 320);
  });

  /* ------------------ ⏰ Status + Timer ------------------ */
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
        const faltamH = Math.floor(diff / 3600);
        const faltamM = Math.floor((diff % 3600) / 60);
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

  /* ------------------ 📦 FECHAR PEDIDO ------------------ */
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

    try {
      await ensureFirebaseReady();
      const { subtotal, delivery, discount, total, discountInfo } = await calcTotals();

      const pedido = {
        usuario: currentUser.email,
        userId: currentUser.uid,
        nome: currentUser.displayName || currentUser.email.split("@")[0],
        itens: cart.map((i) => `${i.nome} x${i.qtd}`),
        itensObj: cart.map((i) => ({ nome: i.nome, preco: i.preco, qtd: i.qtd })),
        subtotal: Number(subtotal.toFixed(2)),
        entrega: Number(delivery.toFixed(2)),
        desconto: Number(discount.toFixed(2)),
        cupom: couponApplied || "",
        total: Number(total.toFixed(2)),
        endereco: addr,
        data: new Date(),
        thumb: "imagens/padrao.jpg",
      };

      const batch = db.batch();
      const userId = currentUser.uid;
      const usuarioRef = db.collection("Usuarios").doc(userId);

      if (discountInfo.isPersonalizado && couponApplied) {
        const cupomUserRef = db.collection("CuponsUsuarios").doc(userId);
        batch.update(cupomUserRef, {
          usado: true,
          dataUso: firebase.firestore.FieldValue.serverTimestamp(),
          pedidoId: "PENDENTE",
        });
      }

      const pedidoRef = db.collection("Pedidos").doc();
      batch.set(pedidoRef, pedido);
      batch.set(
        usuarioRef,
        {
          email: currentUser.email,
          pedidosFeitos: firebase.firestore.FieldValue.increment(1),
        },
        { merge: true }
      );

      await batch.commit();

      if (discountInfo.isPersonalizado && couponApplied) {
        await db.collection("CuponsUsuarios").doc(userId).update({ pedidoId: pedidoRef.id });
      }

      // Recompensas dinâmicas
      const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();
      const udoc = await usuarioRef.get();
      const udata = udoc.data() || { pedidosFeitos: 0, recompensaNivel: 0 };
      const feitos = udata.pedidosFeitos;
      const nivelAtual = udata.recompensaNivel;
      const primeiroLimite = RECOMPENSAS_DATA[0]?.limite || 1;
      const recompensaAtingida = RECOMPENSAS_DATA.find((r) => r.limite === feitos && (r.limite / primeiroLimite) > nivelAtual);

      if (recompensaAtingida) {
        const novoNivel = recompensaAtingida.limite / primeiroLimite;
        const itemLiberado = {
          cupom: recompensaAtingida.valor,
          tipo: recompensaAtingida.tipo,
          valor: recompensaAtingida.valor,
          liberadoEm: firebase.firestore.FieldValue.serverTimestamp(),
          usado: false,
          pedidoLiberacao: pedidoRef.id,
          titulo: recompensaAtingida.titulo || `Recompensa Nível ${novoNivel}`,
        };

        await usuarioRef.update({ recompensaNivel: novoNivel, ultimaRecompensa: recompensaAtingida.id });

        if (recompensaAtingida.tipo === "cupom") {
          await db.collection("CuponsUsuarios").doc(userId).set(itemLiberado, { merge: true });
        }

        await db.collection("Usuarios").doc(userId).collection("RecompensasRecebidas").add({
          ...itemLiberado,
          dataRecebimento: firebase.firestore.FieldValue.serverTimestamp(),
        });

        mostrarPopupRecompensa(`🎉 Parabéns! Você completou ${feitos} pedidos e ganhou: ${recompensaAtingida.valor}!`);
        configuracoesRecompensa = null;
        Object.keys(_cupomCache).forEach((k) => delete _cupomCache[k]);
      }

      popupAdd("Pedido salvo ✅");
      try {
        sound.currentTime = 0;
        sound.play();
      } catch {}

      const linhas = [
        "🍔 *Pedido DFL*",
        cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"),
        "",
        `Subtotal: *${money(subtotal)}*`,
        `Entrega: *${money(delivery)}*${discountInfo.freeShipping ? " _(Frete Grátis)_" : ""}`,
        `Desconto${couponApplied ? ` (${couponApplied})` : ""}: *-${money(discount)}*`,
        `*Total: ${money(total)}*`,
        "",
        `🏠 *Endereço:* ${addr}`,
      ].join("\n");

      const texto = encodeURIComponent(linhas);
      window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");

      cart = [];
      couponApplied = "";
      localStorage.removeItem("dflCoupon");
      const couponInput = document.getElementById("coupon-input");
      if (couponInput) couponInput.value = "";
      renderMiniCart();
      Overlays.close(el.miniCart);
    } catch (err) {
      console.error("Erro ao finalizar pedido:", err);
      alert(`Ocorreu um erro ao finalizar seu pedido. Tente novamente. Detalhe: ${err.message}`);
    }
  }

  function mostrarPopupRecompensa(msg) {
    let pop = document.getElementById("conquista-popup");
    if (!pop) {
      pop = document.createElement("div");
      pop.id = "conquista-popup";
      pop.style.cssText =
        "position:fixed;bottom:120px;left:50%;transform:translateX(-50%) scale(0);background:#4CAF50;color:white;padding:15px 25px;border-radius:12px;font-weight:bold;text-align:center;box-shadow:0 4px 15px rgba(0,0,0,.3);z-index:10001;opacity:0;transition:transform .4s cubic-bezier(.175,.885,.32,1.275), opacity .4s;";
      document.body.appendChild(pop);
    }
    pop.textContent = msg;
    pop.style.opacity = "1";
    pop.style.transform = "translateX(-50%) scale(1)";
    setTimeout(() => {
      pop.style.transform = "translateX(-50%) scale(0)";
      pop.style.opacity = "0";
    }, 4000);
  }

  /* ------------------ 📦 MEUS PEDIDOS ------------------ */
  el.pedidosBtn?.addEventListener("click", async () => {
    if (!currentUser) {
      alert("Faça login para ver seus pedidos.");
      Overlays.open(el.loginModal);
      return;
    }
    try {
      await ensureFirebaseReady();
      Overlays.open(el.pedidosPanel);
      carregarPedidos(currentUser.uid);
    } catch {
      alert("Erro ao conectar. Tente recarregar a página.");
    }
  });

  el.pedidosFecharBtn?.addEventListener("click", () => Overlays.close(el.pedidosPanel));

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
      const pedidos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      exibirPedidos(pedidos);
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
      el.pedidosLista.innerHTML = `<p class="empty-orders" style="color:red;">Erro ao buscar seus pedidos.</p>`;
    }
  }

  function exibirPedidos(pedidos) {
    if (!el.pedidosLista) return;
    el.pedidosLista.innerHTML = pedidos
      .map((p) => {
        const thumbUrl = p.thumb || "imagens/padrao.jpg";
        const dataFormatada = p.data
          ? new Date(p.data?.seconds * 1000 || p.data).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—";
        const podeRepetir = Array.isArray(p.itensObj) && p.itensObj.length > 0;
        return `
        <div class="pedido-card">
          <div class="pedido-thumb" style="background-image:url('${thumbUrl}');"></div>
          <h4>📅 ${dataFormatada}</h4>
          <p class="pedido-info">Total: ${money(p.total)}</p>
          <div class="pedido-itens">${(p.itens || []).map((i) => `• ${i}`).join("<br>")}</div>
          <button class="repetir-btn" data-id="${p.id}" ${podeRepetir ? "" : 'disabled style="background:grey;cursor:not-allowed;"'}>🔁 Repetir Pedido</button>
        </div>`;
      })
      .join("");
  }

  el.pedidosLista?.addEventListener("click", async (e) => {
    if (e.target.classList.contains("repetir-btn") && !e.target.disabled) {
      const idPedido = e.target.dataset.id;
      e.target.disabled = true;
      e.target.textContent = "Carregando...";
      await repetirPedido(idPedido);
    }
  });

  async function repetirPedido(idPedido) {
    try {
      await ensureFirebaseReady();
      const docRef = db.collection("Pedidos").doc(idPedido);
      const doc = await docRef.get();
      if (!doc.exists) return alert("Erro: Pedido antigo não encontrado.");
      const pedido = doc.data();
      const itens = pedido.itensObj;
      if (!Array.isArray(itens) || itens.length === 0) {
        return alert("Não é possível repetir este pedido. Faça um novo pedido para poder repeti-lo no futuro.");
      }
      cart = [];
      itens.forEach((item) => {
        if (item.nome && item.preco > 0 && item.qtd > 0) {
          cart.push({ nome: item.nome, preco: item.preco, qtd: item.qtd });
        }
      });
      couponApplied = "";
      localStorage.removeItem("dflCoupon");
      const couponInput = document.getElementById("coupon-input");
      if (couponInput) couponInput.value = "";
      popupAdd("Pedido anterior adicionado ao carrinho!");
      renderMiniCart();
      Overlays.close(el.pedidosPanel);
      Overlays.open(el.miniCart);
    } catch (err) {
      console.error("Erro ao repetir pedido:", err);
      alert("Erro ao processar seu pedido. Tente novamente.");
    }
  }

  /* ------------------ 🎁 MINHAS RECOMPENSAS ------------------ */
  el.recompensasBtn?.addEventListener("click", async () => {
    if (!currentUser) {
      alert("Faça login para ver suas recompensas.");
      Overlays.open(el.loginModal);
      return;
    }
    try {
      await ensureFirebaseReady();
      Overlays.open(el.recompensasPanel);
      carregarRecompensas(currentUser.uid);
    } catch {
      alert("Erro ao conectar. Tente recarregar a página.");
    }
  });

  el.recompensasFecharBtn?.addEventListener("click", () => Overlays.close(el.recompensasPanel));

  async function carregarRecompensas(userId) {
    try {
      await ensureFirebaseReady();
    } catch {
      return;
    }
    const contadorValor = document.getElementById("contador-valor");
    const progressoBar = document.getElementById("progresso-bar");
    const progressoMsg = document.getElementById("progresso-mensagem");
    if (!contadorValor || !progressoBar || !progressoMsg || !el.recompensasLista) return;

    contadorValor.textContent = "...";
    progressoBar.style.width = "0%";
    progressoMsg.textContent = "Carregando metas...";
    el.recompensasLista.innerHTML = "";
    if (el.historicoLista) el.historicoLista.innerHTML = "";

    const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();
    if (RECOMPENSAS_DATA.length === 0) {
      progressoMsg.textContent = "Sistema de fidelidade desativado no momento.";
      el.recompensasLista.innerHTML = '<p style="text-align:center;color:red;padding:20px;">Sem metas disponíveis.</p>';
      return;
    }
    const metaPrimeiroNivel = RECOMPENSAS_DATA[0]?.limite || 1;

    db.collection("Usuarios")
      .doc(userId)
      .onSnapshot(
        async (doc) => {
          el.recompensasLista.innerHTML = "";
          if (el.historicoLista) el.historicoLista.innerHTML = "";

          const data = doc.data() || { pedidosFeitos: 0, recompensaNivel: 0 };
          const feitos = data.pedidosFeitos;
          const nivelAtual = data.recompensaNivel;

          let cupomStatus = null;
          const recompensaAtual = RECOMPENSAS_DATA.find((r) => r.limite === nivelAtual * metaPrimeiroNivel);
          if (recompensaAtual && recompensaAtual.tipo === "cupom") {
            const cupomSnap = await db.collection("CuponsUsuarios").doc(userId).get();
            cupomStatus = cupomSnap.exists ? cupomSnap.data() : null;
          }

          const proximaRecompensa = RECOMPENSAS_DATA.find((r) => r.limite > feitos);
          const metaParaExibir = proximaRecompensa ? proximaRecompensa.limite : feitos;
          const metaBaseCalculo = proximaRecompensa ? proximaRecompensa.limite : metaPrimeiroNivel;
          const porcentagem = proximaRecompensa === undefined ? 100 : Math.min(100, (feitos / metaBaseCalculo) * 100);

          contadorValor.textContent = feitos;
          const elMeta = document.querySelector(".progress-container span:last-child");
          if (elMeta) elMeta.textContent = metaParaExibir;
          progressoBar.style.width = `${porcentagem}%`;

          if (proximaRecompensa) {
            const faltam = proximaRecompensa.limite - feitos;
            const tituloRecompensa = proximaRecompensa.titulo || proximaRecompensa.valor;
            progressoMsg.textContent = `Faltam apenas ${faltam} pedidos para você ganhar "${tituloRecompensa}"!`;
            progressoBar.style.background = "linear-gradient(90deg, #ffb300, #ff7043)";
            progressoBar.parentElement.parentElement.removeAttribute("data-status");

            const obtidas = RECOMPENSAS_DATA.filter((r) => r.limite <= feitos);
            exibirRecompensas(feitos, obtidas, cupomStatus, RECOMPENSAS_DATA);
            if (obtidas.length === 0) {
              el.recompensasLista.innerHTML = `<p style="text-align:center;color:#666;padding:20px;margin-top:20px;">Faça ${faltam} pedidos para desbloquear a primeira recompensa.</p>`;
            }
          } else {
            progressoMsg.textContent = "🎉 Parabéns! Você completou todas as metas de fidelidade!";
            progressoBar.style.background = "linear-gradient(90deg, #4caf50, #43a047)";
            progressoBar.parentElement.parentElement.setAttribute("data-status", "complete");
            exibirRecompensas(feitos, RECOMPENSAS_DATA, cupomStatus, RECOMPENSAS_DATA);
          }

          await carregarHistoricoRecompensas(userId);
        },
        (error) => {
          console.error("Erro ao ler contador de fidelidade:", error);
          progressoMsg.textContent = "Erro ao ler seu progresso. Tente recarregar a página.";
        }
      );
  }

  function exibirRecompensas(pedidosFeitos, recompensasDisponiveis, cupomStatus) {
    if (!el.recompensasLista) return;
    const html = recompensasDisponiveis
      .map((r) => {
        const liberada = pedidosFeitos >= r.limite;
        const cupomJaUsado = cupomStatus?.usado === true && cupomStatus?.cupom === r.valor;
        const titulo = r.titulo || `Recompensa: ${r.valor} (${r.limite} Pedidos)`;

        let acaoBtn = "";
        let statusTag = "";
        let cardStyle = "";
        const codigoCupom = r.tipo === "cupom" ? r.valor : "BRINDE";

        if (cupomJaUsado) {
          statusTag = '<span style="color:#d32f2f;font-weight:bold;">(JÁ UTILIZADO)</span>';
          acaoBtn = `<button disabled style="background:#ccc;color:#666;border:none;border-radius:6px;padding:8px 12px;cursor:not-allowed;margin-top:10px;">Cupom Usado</button>`;
          cardStyle = "opacity:0.7;";
        } else if (liberada && r.tipo === "cupom") {
          statusTag = '<span style="color:#4caf50;font-weight:bold;">(DISPONÍVEL)</span>';
          acaoBtn = `<button class="recompensa-aplicar-btn" data-cupom="${codigoCupom}" style="background:#4caf50;color:#fff;border:none;border-radius:6px;padding:8px 12px;cursor:pointer;font-weight:600;margin-top:10px;">Aplicar Cupom 🏷️</button>`;
        } else if (liberada && r.tipo === "brinde") {
          statusTag = '<span style="color:#1976D2;font-weight:bold;">(LIBERADO)</span>';
          acaoBtn = `<button disabled style="background:#1976D2;color:#fff;border:none;border-radius:6px;padding:8px 12px;cursor:default;margin-top:10px;">Brinde na Próxima Compra</button>`;
        } else {
          return ""; // ignora não liberadas
        }

        return `
          <div class="recompensa-card" style="display:flex;align-items:center;padding:15px;border-radius:10px;margin-bottom:15px;background:#f9f9f9;box-shadow:0 2px 5px rgba(0,0,0,0.1);${cardStyle}">
            <img src="imagens/recompensa-${r.tipo}.png" alt="Ícone de Recompensa" style="width:50px;height:50px;object-fit:cover;border-radius:50%;margin-right:15px;">
            <div style="flex:1;">
              <h4 style="margin:0 0 5px 0;color:#333;">${titulo} ${statusTag}</h4>
              <p style="margin:0;font-size:.9rem;color:#666;">Ganho por ${r.limite} pedidos.</p>
              ${r.tipo === "cupom" ? `<p style="margin:5px 0 0 0;font-size:1.1rem;font-weight:bold;color:#ff7043;">CÓDIGO: ${codigoCupom}</p>` : ""}
            </div>
            <div>${acaoBtn}</div>
          </div>
        `;
      })
      .join("");

    el.recompensasLista.innerHTML = html;

    el.recompensasLista.querySelectorAll(".recompensa-aplicar-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const codigo = e.currentTarget.dataset.cupom;
        if (!codigo) return;
        couponApplied = codigo;
        localStorage.setItem("dflCoupon", couponApplied);
        const couponInput = document.getElementById("coupon-input");
        if (couponInput) couponInput.value = codigo;
        renderMiniCart();
        Overlays.close(el.recompensasPanel);
        popupAdd(`Cupom ${codigo} aplicado! ✅`);
        Overlays.open(el.miniCart);
      });
    });
  }

  async function carregarHistoricoRecompensas(userId) {
    if (!el.historicoLista) return;
    el.historicoLista.innerHTML = `<p style="text-align:center;color:#999;">Carregando histórico...</p>`;
    try {
      await ensureFirebaseReady();
      const q = db.collection("Usuarios").doc(userId).collection("RecompensasRecebidas").orderBy("dataRecebimento", "desc");
      const snapshot = await q.get();
      if (snapshot.empty) {
        el.historicoLista.innerHTML = `<p style="text-align:center;color:#999;">Você ainda não recebeu recompensas.</p>`;
        return;
      }
      const logs = snapshot.docs.map((d) => d.data());
      const historicoHtml = logs
        .map((log) => {
          const dataRecebimento = log.dataRecebimento ? log.dataRecebimento.toDate().toLocaleDateString("pt-BR") : "—";
          let valorStr = log.tipo === "cupom" ? `${log.valor} OFF` : log.valor;
          if (log.tipo === "value") valorStr = money(log.valor);
          return `
          <div class="historico-card" style="display:flex;padding:10px 0;border-bottom:1px dashed #eee;align-items:center;justify-content:space-between;">
            <div style="flex:1;">
              <p style="font-weight:600;margin:0;color:#333;">🎁 ${log.titulo || log.valor}</p>
              <small style="color:#999;">Recebido em: ${dataRecebimento}</small>
            </div>
            <span style="font-weight:700;color:#4caf50;">+ ${valorStr}</span>
          </div>`;
        })
        .join("");
      el.historicoLista.innerHTML = historicoHtml.replace(/border-bottom: 1px dashed #eee;<\/div>$/, "border-bottom:none;</div>");
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
      el.historicoLista.innerHTML = `<p style="text-align:center;color:red;">Erro ao buscar histórico.</p>`;
    }
  }

  /* ------------------ 📊 ADMIN ------------------ */
  const ADMINS = ["alefejohsefe@gmail.com", "kalebhstanley650@gmail.com", "contato@dafamilialanches.com.br"];

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

    document.querySelectorAll(".cardBox").forEach((c) => {
      Object.assign(c.style, {
        flex: "1",
        minWidth: "200px",
        padding: "12px",
        background: "#f9f9f9",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
      });
    });

    div.querySelector(".dashboard-close").addEventListener("click", () => Overlays.close(div));
  }

  function showAdminFab() {
    if (!el.reportsBtn || el.reportsBtn._bound) return;
    el.reportsBtn._bound = true;
    el.reportsBtn.style.display = "block";
    el.reportsBtn.addEventListener("click", () => {
      createDashboard();
      ensureChartJS(() => carregarRelatorios("7"));
      Overlays.open(document.getElementById("admin-dashboard"));
    });
  }

  function gerarResumoECharts(pedidos) {
    if (!window.Chart) {
      console.error("Chart.js não está carregado.");
      return;
    }
    const ctxPedidos = document.getElementById("chart-pedidos")?.getContext("2d");
    const ctxProdutos = document.getElementById("chart-produtos")?.getContext("2d");
    if (!ctxPedidos || !ctxProdutos) return;

    const pedidosPorDia = {};
    pedidos.forEach((p) => {
      const dia = (p.data?.toDate?.() || new Date(p.data)).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      pedidosPorDia[dia] = (pedidosPorDia[dia] || 0) + 1;
    });

    const labelsPedidos = Object.keys(pedidosPorDia).sort((a, b) => {
      const [diaA, mesA] = a.split("/");
      const [diaB, mesB] = b.split("/");
      return new Date(`${mesA}/${diaA}/2025`) - new Date(`${mesB}/${diaB}/2025`);
    });
    const dataPedidos = labelsPedidos.map((label) => pedidosPorDia[label]);

    if (chartPedidos) chartPedidos.destroy();
    chartPedidos = new Chart(ctxPedidos, {
      type: "line",
      data: {
        labels: labelsPedidos,
        datasets: [{ label: "Pedidos por Dia", data: dataPedidos, backgroundColor: "rgba(255,179,0,.2)", borderColor: "#ffb300", borderWidth: 2, fill: true, tension: 0.1 }],
      },
      options: { responsive: true, plugins: { title: { display: true, text: "Volume de Pedidos por Dia" } } },
    });

    const produtosContagem = {};
    pedidos.forEach((p) => {
      (p.itens || []).forEach((itemStr) => {
        const parts = itemStr.split(" x");
        const nome = parts[0];
        const qtd = parts.length > 1 ? parseInt(parts[1], 10) : 1;
        if (nome) produtosContagem[nome] = (produtosContagem[nome] || 0) + (isNaN(qtd) ? 1 : qtd);
      });
    });

    const produtosOrdenados = Object.entries(produtosContagem).sort(([, a], [, b]) => b - a).slice(0, 10);
    const labelsProdutos = produtosOrdenados.map((p) => p[0]);
    const dataProdutos = produtosOrdenados.map((p) => p[1]);

    if (chartProdutos) chartProdutos.destroy();
    chartProdutos = new Chart(ctxProdutos, {
      type: "bar",
      data: { labels: labelsProdutos, datasets: [{ label: "Itens Mais Vendidos", data: dataProdutos, backgroundColor: "#ff7043", borderColor: "#d84315", borderWidth: 1 }] },
      options: { indexAxis: "y", responsive: true, plugins: { title: { display: true, text: "Top 10 Itens Mais Vendidos" } } },
    });
  }

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
      .then((snap) => {
        const pedidos = snap.docs.map((d) => {
          const p = d.data() || {};
          const subtotal = Number(p.subtotal ?? 0);
          const entrega = Number(p.entrega ?? 0);
          const desconto = Number(p.desconto ?? 0);
          const total = Number(p.total ?? subtotal + entrega - desconto) || 0;
          return {
            ...p,
            id: d.id,
            subtotal,
            entrega,
            desconto,
            total,
            data: typeof p.data === "string" ? new Date(p.data) : p.data?.toDate?.() ? p.data.toDate() : new Date(0),
            itens: Array.isArray(p.itens) ? p.itens : typeof p.itens === "string" ? p.itens.split("; ") : [],
          };
        });

        const filtrados = pedidos.filter((p) => periodo === "all" || p.data >= start);
        gerarResumoECharts(filtrados);

        const totalVendido = filtrados.reduce((s, p) => s + p.total, 0);
        const numPedidos = filtrados.length;
        const ticketMedio = numPedidos > 0 ? totalVendido / numPedidos : 0;

        document.getElementById("card-total").textContent = `Total Arrecadado: ${money(totalVendido)}`;
        document.getElementById("card-pedidos").textContent = `Pedidos: ${numPedidos}`;
        document.getElementById("card-ticket").textContent = `Ticket Médio: ${money(ticketMedio)}`;

        document.getElementById("export-csv").onclick = () => {
          let csv = "ID;Data;Usuario;Nome;Itens;Subtotal;Entrega;Desconto;Cupom;Total;Endereco\n";
          filtrados.forEach((p) => {
            const linha = [
              p.id || "N/A",
              p.data?.toLocaleString ? p.data.toLocaleString("pt-BR") : new Date(p.data).toLocaleString("pt-BR"),
              p.usuario || p.email || "",
              p.nome || "",
              `"${(p.itens || []).join(", ")}"`,
              String(p.subtotal.toFixed(2)).replace(".", ","),
              String(p.entrega.toFixed(2)).replace(".", ","),
              String(p.desconto.toFixed(2)).replace(".", ","),
              p.cupom || "",
              String(p.total.toFixed(2)).replace(".", ","),
              `"${(p.endereco || "").replace(/"/g, '""')}"`,
            ].join(";");
            csv += linha + "\n";
          });
          const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `pedidos_dfl_${periodo}.csv`;
          link.click();
          popupAdd("Exportando CSV...");
        };
      })
      .catch((err) => alert("Erro ao carregar relatórios: " + err.message));

    const sel = document.getElementById("filter-period");
    if (sel && !sel._bound) {
      sel._bound = true;
      sel.addEventListener("change", (e) => carregarRelatorios(e.target.value));
    }
  }

  /* ------------------ 🍪 COOKIES ------------------ */
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
      setTimeout(() => (cookieBanner.style.display = "none"), 500);
    });
  }

  /* ------------------ OUTROS ------------------ */
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

  // Render inicial (caso já haja itens salvos em outro fluxo seu)
  renderMiniCart();

  console.log("%c🔥 DFL v3.9.1 — Clicks + Login FIX pronto", "background:#4CAF50;color:#fff;padding:8px 12px;border-radius:8px;font-weight:700;");
});