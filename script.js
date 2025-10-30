/* =========================================================
   🍔 DFL v2.5 — ESTÁVEL (Cupom + Endereço + Taxa Fixa + Relatórios)
   Arquivo: script.js (Parte 1/6)
   Conteúdo desta parte:
   - Base/estado global + utilitários
   - Seletor de elementos
   - Backdrop/Overlays (abre/fecha modais e carrinho)
   - Popup “adicionado ao carrinho”
   - Carrossel e timers (status + promo)
   - Inicialização Firebase (com failsafe)
========================================================= */

(() => {
  // Evita múltiplas importações acidentais
  if (window.__DFL_SCRIPT_LOADED__) return;
  window.__DFL_SCRIPT_LOADED__ = true;

  /* ------------------ ⚙️ BASE ------------------ */
  const sound = new Audio("click.wav");
  let cart = [];
  let currentUser = null;

  const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
  const safe = (fn) => (...a) => { try { return fn(...a); } catch (e) { console.error(e); } };

  // 🔊 Clique suave (não quebra se falhar autoplay)
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
    userBtn: document.getElementById("user-btn"),
    reportsBtn: document.getElementById("reports-btn"),
    slides: document.querySelector(".slides"),
    cPrev: document.querySelector(".c-prev"),
    cNext: document.querySelector(".c-next"),
    statusBanner: document.getElementById("status-banner"),
    hoursBanner: document.querySelector(".hours-banner"),
    myOrdersBtn: document.getElementById("orders-fab"),
    promoTimer: document.getElementById("promo-timer"),
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
      el.cartBackdrop.classList.add("active");
      document.body.classList.add("no-scroll");
    },
    hide() {
      el.cartBackdrop.classList.remove("active");
      document.body.classList.remove("no-scroll");
    },
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

  /* ------------------ 💬 POPUP (toast) ------------------ */
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
  // Exponho para outras partes
  window.__DFL_popupAdd = popupAdd;

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
    const aberto = h >= 18 && h < 23; // 18:00 até 22:59

    if (el.statusBanner) {
      el.statusBanner.textContent = aberto
        ? "🟢 Aberto — Faça seu pedido!"
        : "🔴 Fechado — Voltamos às 18h!";
      el.statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`;
    }

    if (el.hoursBanner) {
      const elTimer = el.hoursBanner.querySelector("#timer");
      if (aberto) {
        const fim = new Date(agora);
        fim.setHours(23, 30, 0);
        let diff = Math.max(0, (fim - agora) / 1000);
        const restH = Math.floor(diff / 3600);
        const restM = Math.floor((diff % 3600) / 60);
        if (elTimer) elTimer.innerHTML = `<b>${restH}h ${restM}min</b>`;
      } else {
        const inicio = new Date(agora);
        if (h >= 23 || (h === 23 && m >= 30)) inicio.setDate(inicio.getDate() + 1);
        inicio.setHours(18, 0, 0);
        let diff = Math.max(0, (inicio - agora) / 1000);
        const faltamH = Math.floor(diff / 3600);
        const faltamM = Math.floor((diff % 3600) / 60);
        el.hoursBanner.innerHTML = `🔒 Fechado — Abrimos em <b>${faltamH}h ${faltamM}min</b>`;
      }
    }
  });
  atualizarStatus();
  setInterval(atualizarStatus, 60_000);

  const atualizarTimer = safe(() => {
    if (!el.promoTimer) return;
    const agora = new Date();
    const fim = new Date();
    fim.setHours(23, 59, 59, 999);
    const diff = fim - agora;
    if (diff <= 0) {
      el.promoTimer.textContent = "00:00:00";
      return;
    }
    const h = String(Math.floor(diff / 3_600_000)).padStart(2, "0");
    const m = String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, "0");
    const s = String(Math.floor((diff % 60_000) / 1000)).padStart(2, "0");
    el.promoTimer.textContent = `${h}:${m}:${s}`;
  });
  atualizarTimer();
  setInterval(atualizarTimer, 1_000);

  /* ------------------ 🔥 FIREBASE INIT (fail-safe) ------------------ */
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

  try {
    if (!window.firebase) {
      throw new Error("Firebase base não carregou (app).");
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    if (!firebase.auth || !firebase.firestore) {
      throw new Error("Módulos auth ou firestore não carregaram.");
    }
    auth = firebase.auth();
    db = firebase.firestore();
  } catch (error) {
    console.error("ERRO FATAL AO INICIAR FIREBASE:", error);
    const elBody = document.querySelector("body");
    if (elBody) {
      elBody.innerHTML = `
        <div style="padding:20px;text-align:center;font-size:1.2rem;color:red;font-family:sans-serif;margin-top:50px;">
          <b>Erro Crítico</b><br>Não foi possível conectar aos nossos serviços.
          <br><small>Verifique sua conexão com a internet e recarregue a página.</small>
          <br><br><small style="color:#666">Detalhe: ${error.message}</small>
        </div>`;
    }
    return; // aborta restante do script
  }

  // Exportar referências para as próximas partes
  window.__DFL = {
    el,
    Backdrop,
    Overlays,
    money,
    popupAdd,
    safe,
    state: { cart, currentUser },
    setUser(u) { currentUser = u; this.state.currentUser = u; },
    getUser() { return currentUser; },
    getCart() { return cart; },
    setCart(c) { cart = Array.isArray(c) ? c : []; this.state.cart = cart; },
    auth,
    db
  };

  // Logs de diagnóstico
  console.log("%cDFL v2.5 — Parte 1/6 carregada",
    "background:#4caf50;color:#fff;padding:4px 8px;border-radius:6px;font-weight:700;");
})();
/* =========================================================
   🍔 DFL v2.5 — ESTÁVEL (Parte 2/6)
   Conteúdo:
   - Controle do Carrinho (add/remove/update)
   - Toast “adicionado ao carrinho”
   - Cálculo automático com taxa fixa (R$6,00)
   - Sincronização localStorage
========================================================= */

(() => {
  const { el, money, popupAdd, state, setCart, getCart } = window.__DFL;
  const TAXA_ENTREGA_FIXA = 6.0; // 💰 taxa fixa definida por Álefe

  /* ------------------ 🛒 FUNÇÕES DO CARRINHO ------------------ */
  function salvarCarrinho() {
    localStorage.setItem("dfl_cart", JSON.stringify(state.cart));
  }

  function carregarCarrinho() {
    try {
      const salvo = JSON.parse(localStorage.getItem("dfl_cart"));
      if (Array.isArray(salvo)) {
        setCart(salvo);
      }
    } catch (e) {
      console.warn("Erro ao carregar carrinho:", e);
    }
    atualizarCarrinhoUI();
  }

  function adicionarAoCarrinho(nome, preco) {
    const item = state.cart.find((p) => p.nome === nome);
    if (item) {
      item.qtd++;
    } else {
      state.cart.push({ nome, preco, qtd: 1 });
    }
    salvarCarrinho();
    atualizarCarrinhoUI();
    popupAdd(`${nome} adicionado ao carrinho 🛍️`);
  }

  function removerItem(nome) {
    state.cart = state.cart.filter((i) => i.nome !== nome);
    salvarCarrinho();
    atualizarCarrinhoUI();
  }

  function atualizarQuantidade(nome, qtd) {
    const item = state.cart.find((i) => i.nome === nome);
    if (!item) return;
    item.qtd = Math.max(1, qtd);
    salvarCarrinho();
    atualizarCarrinhoUI();
  }

  function calcularTotal() {
    const subtotal = state.cart.reduce((acc, i) => acc + i.preco * i.qtd, 0);
    return subtotal + TAXA_ENTREGA_FIXA;
  }

  function atualizarCarrinhoUI() {
    const carrinho = getCart();
    const lista = el.miniList;
    const rodape = el.miniFoot;
    const contador = el.cartCount;

    if (!lista || !rodape || !contador) return;

    contador.textContent = carrinho.length;
    lista.innerHTML = "";

    if (!carrinho.length) {
      lista.innerHTML = `<p class="empty-orders">🛒 Carrinho vazio</p>`;
      rodape.innerHTML = "";
      return;
    }

    carrinho.forEach((item) => {
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <b>${item.nome}</b>
          <span>${money(item.preco)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <button class="menos" aria-label="Diminuir">➖</button>
            <span>${item.qtd}</span>
            <button class="mais" aria-label="Aumentar">➕</button>
          </div>
          <button class="remover" aria-label="Remover">🗑️</button>
        </div>
      `;

      const menos = div.querySelector(".menos");
      const mais = div.querySelector(".mais");
      const remover = div.querySelector(".remover");

      menos.addEventListener("click", () => {
        if (item.qtd > 1) {
          item.qtd--;
          salvarCarrinho();
          atualizarCarrinhoUI();
        }
      });
      mais.addEventListener("click", () => {
        item.qtd++;
        salvarCarrinho();
        atualizarCarrinhoUI();
      });
      remover.addEventListener("click", () => removerItem(item.nome));

      lista.appendChild(div);
    });

    const total = calcularTotal();
    const subtotal = total - TAXA_ENTREGA_FIXA;

    rodape.innerHTML = `
      <div style="padding:12px 16px;font-size:.95rem;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span>Subtotal:</span> <b>${money(subtotal)}</b>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span>Entrega:</span> <b>${money(TAXA_ENTREGA_FIXA)}</b>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:1.05rem;margin-top:6px;">
          <span>Total:</span> <b>${money(total)}</b>
        </div>
        <button id="finalizar-pedido" class="btn-primario" style="width:100%;margin-top:12px;">Finalizar Pedido</button>
      </div>
    `;

    const finalizarBtn = rodape.querySelector("#finalizar-pedido");
    finalizarBtn.addEventListener("click", finalizarPedido);
  }

  /* ------------------ 📦 FINALIZAR PEDIDO ------------------ */
  function finalizarPedido() {
    const carrinho = getCart();
    if (!carrinho.length) return alert("Adicione itens antes de finalizar.");

    const total = calcularTotal();
    const textoPedido = carrinho
      .map((i) => `• ${i.qtd}x ${i.nome} — ${money(i.preco * i.qtd)}`)
      .join("%0A");
    const msg = `🛍️ *Pedido Da Família Lanches*%0A${textoPedido}%0A———————————%0A💰 *Total:* ${money(total)} (inclui entrega)%0A🚚 Endereço: `;
    const url = `https://wa.me/5534997178336?text=${msg}`;
    window.open(url, "_blank");

    popupAdd("Pedido enviado para o WhatsApp 📦");
  }

  /* ------------------ 🔄 EVENTOS GERAIS ------------------ */
  document.querySelectorAll(".add-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      const nome = card.dataset.name;
      const preco = parseFloat(card.dataset.price);
      adicionarAoCarrinho(nome, preco);
    });
  });

  el.cartIcon?.addEventListener("click", () => {
    const { Overlays } = window.__DFL;
    Overlays.open(el.miniCart);
  });

  document
    .querySelector("#mini-cart .extras-close")
    ?.addEventListener("click", () => {
      el.miniCart.classList.remove("active");
      window.__DFL.Backdrop.hide();
    });

  // Carregar carrinho salvo
  carregarCarrinho();

  console.log("%cDFL v2.5 — Parte 2/6 carregada (Carrinho ✅)",
    "background:#ffb300;color:#000;padding:4px 8px;border-radius:6px;font-weight:700;");
})();
/* =========================================================
   🍟 DFL v2.5 — Parte 3/6
   Conteúdo:
   - Modais de Adicionais e Combos
   - Fechamento clicando fora
   - Estilo visual aprimorado (transições suaves)
========================================================= */

(() => {
  const { el, Overlays, popupAdd, money, state } = window.__DFL;

  /* ------------------ 🧩 MODAL DE ADICIONAIS ------------------ */
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

  let produtoAtual = null;
  let precoBase = 0;

  function abrirExtras(card) {
    if (!card || !el.extrasModal || !el.extrasList) return;
    produtoAtual = card.dataset.name;
    precoBase = parseFloat(card.dataset.price) || 0;

    el.extrasList.innerHTML = adicionais.map((a, i) => `
      <label class="extra-line" style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        background:#fff;
        border:1px solid #eee;
        border-radius:8px;
        padding:8px 12px;
        margin-bottom:6px;
        transition:background 0.2s;
      ">
        <span>${a.nome} — <b>${money(a.preco)}</b></span>
        <input type="checkbox" value="${i}" style="transform:scale(1.3);cursor:pointer;">
      </label>
    `).join("");

    Overlays.open(el.extrasModal);
  }

  document.querySelectorAll(".extras-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => abrirExtras(e.currentTarget.closest(".card")));
  });

  el.extrasConfirm?.addEventListener("click", () => {
    if (!produtoAtual) return Overlays.closeAll();

    const checks = [...el.extrasList.querySelectorAll("input:checked")];
    const extras = checks.map((c) => adicionais[+c.value]);

    const precoExtras = extras.reduce((t, e) => t + e.preco, 0);
    const precoTotal = precoBase + precoExtras;
    const extrasNomes = extras.map((a) => a.nome).join(", ");

    const nomeFinal = extrasNomes
      ? `${produtoAtual} + ${extrasNomes}`
      : produtoAtual;

    const existente = state.cart.find((i) => i.nome === nomeFinal);
    if (existente) existente.qtd++;
    else state.cart.push({ nome: nomeFinal, preco: precoTotal, qtd: 1 });

    localStorage.setItem("dfl_cart", JSON.stringify(state.cart));
    popupAdd(`${nomeFinal} adicionado! 🍔`);
    Overlays.closeAll();
  });

  document.querySelectorAll("#extras-modal .extras-close").forEach((b) =>
    b.addEventListener("click", () => Overlays.closeAll())
  );

  /* ------------------ 🥤 MODAL DE COMBOS ------------------ */
  const opcoesBebidas = {
    casal: [
      { nome: "Fanta 1L (padrão)", preco: 0 },
      { nome: "Coca-Cola 1L", preco: 3.0 },
      { nome: "Coca-Cola 1L Zero", preco: 3.0 },
    ],
    familia: [
      { nome: "Kuat 2L (padrão)", preco: 0 },
      { nome: "Coca-Cola 2L", preco: 5.0 },
    ],
  };

  let comboContexto = null;

  function abrirCombo(nomeCombo, precoBase) {
    if (!el.comboModal || !el.comboBody) return;
    const nome = nomeCombo.toLowerCase();
    const grupo = nome.includes("casal")
      ? "casal"
      : nome.includes("família") || nome.includes("familia")
      ? "familia"
      : null;

    if (!grupo) {
      adicionarItemSimples(nomeCombo, precoBase);
      return;
    }

    el.comboBody.innerHTML = opcoesBebidas[grupo]
      .map(
        (o, i) => `
      <label class="extra-line" style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        border:1px solid #eee;
        border-radius:8px;
        padding:8px 12px;
        background:#fff;
        margin-bottom:6px;
      ">
        <span>${o.nome} ${o.preco ? `— + ${money(o.preco)}` : ""}</span>
        <input type="radio" name="combo-drink" value="${i}" ${
          i === 0 ? "checked" : ""
        }>
      </label>`
      )
      .join("");

    comboContexto = { nomeCombo, precoBase, grupo };
    Overlays.open(el.comboModal);
  }

  el.comboConfirm?.addEventListener("click", () => {
    if (!comboContexto) return Overlays.closeAll();
    const sel = el.comboBody.querySelector("input[name='combo-drink']:checked");
    if (!sel) return;

    const opt = opcoesBebidas[comboContexto.grupo][+sel.value];
    const precoFinal = comboContexto.precoBase + (opt.preco || 0);
    const nomeFinal = `${comboContexto.nomeCombo} + ${opt.nome}`;

    const existente = state.cart.find((i) => i.nome === nomeFinal);
    if (existente) existente.qtd++;
    else state.cart.push({ nome: nomeFinal, preco: precoFinal, qtd: 1 });

    localStorage.setItem("dfl_cart", JSON.stringify(state.cart));
    popupAdd(`${nomeFinal} adicionado! 🧃`);
    Overlays.closeAll();
  });

  document.querySelectorAll("#combo-modal .combo-close").forEach((b) =>
    b.addEventListener("click", () => Overlays.closeAll())
  );

  /* ------------------ 🧺 ITEM SIMPLES ------------------ */
  function adicionarItemSimples(nome, preco) {
    const existente = state.cart.find((i) => i.nome === nome);
    if (existente) existente.qtd++;
    else state.cart.push({ nome, preco, qtd: 1 });
    localStorage.setItem("dfl_cart", JSON.stringify(state.cart));
    popupAdd(`${nome} adicionado!`);
  }

  /* ------------------ 🖱️ FECHAR MODAL AO CLICAR FORA ------------------ */
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (ev) => {
      if (ev.target.classList.contains("modal")) {
        modal.classList.remove("show");
        window.__DFL.Backdrop.hide();
      }
    });
  });

  console.log("%cDFL v2.5 — Parte 3/6 carregada (Modais ✅)",
    "background:#ff7043;color:#fff;padding:4px 8px;border-radius:6px;font-weight:700;");
})();
/* =========================================================
   🔐 DFL v2.5 — Parte 4/6
   Conteúdo:
   - Login seguro (Google + e-mail/senha)
   - Cadeado no botão do usuário
   - Verificação de administrador (exibe botão Relatórios)
   - Correções de "Meus Pedidos" (abre/fecha corretamente e carrega dados)
========================================================= */

(() => {
  const { el, Overlays, Backdrop, popupAdd, money, state } = window.__DFL;

  /* ------------------ 🔥 Firebase (usa instância já carregada) ------------------ */
  const firebaseConfig = {
    apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
    authDomain: "da-familia-lanches.firebaseapp.com",
    projectId: "da-familia-lanches",
    storageBucket: "da-familia-lanches.appspot.com",
    messagingSenderId: "106857147317",
    appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
  };

  function ensureFirebase() {
    if (!window.firebase) throw new Error("Firebase não carregado.");
    if (!firebase.apps?.length) firebase.initializeApp(firebaseConfig);
    if (!firebase.auth || !firebase.firestore) throw new Error("Módulos do Firebase ausentes.");
    return { auth: firebase.auth(), db: firebase.firestore() };
  }

  let auth = null;
  let db   = null;

  try {
    ({ auth, db } = ensureFirebase());
  } catch (e) {
    console.error("Erro ao iniciar Firebase:", e);
    return;
  }

  /* ------------------ 👤 Login UI: abrir/fechar modal ------------------ */
  el.userBtn?.addEventListener("click", () => Overlays.open(el.loginModal));
  document.querySelectorAll("#login-modal .login-close").forEach(btn =>
    btn.addEventListener("click", () => Overlays.closeAll())
  );

  /* ------------------ ✉️ Login e-mail/senha ------------------ */
  el.loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email")?.value?.trim();
    const senha = document.getElementById("login-senha")?.value?.trim();
    if (!email || !senha) return alert("Preencha e-mail e senha.");

    auth.signInWithEmailAndPassword(email, senha)
      .then((cred) => {
        state.currentUser = cred.user;
        atualizarBotaoUsuario();
        popupAdd("Login realizado com sucesso! ✅");
        Overlays.closeAll();
      })
      .catch((err) => {
        if (err.code === "auth/user-not-found") {
          if (confirm("Conta não encontrada. Deseja criar uma nova?")) {
            auth.createUserWithEmailAndPassword(email, senha)
              .then((cred) => {
                state.currentUser = cred.user;
                atualizarBotaoUsuario();
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

  /* ------------------ 🟦 Login com Google ------------------ */
  el.googleBtn?.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then((res) => {
        state.currentUser = res.user;
        atualizarBotaoUsuario();
        popupAdd("Login com Google realizado! ✅");
        Overlays.closeAll();
      })
      .catch((err) => alert("Erro: " + err.message));
  });

  /* ------------------ 🛡️ Admins autorizados ------------------ */
  const ADMINS = [
    "alefejohsefe@gmail.com",
    "kalebhstanley650@gmail.com",
    "contato@dafamilialanches.com.br",
  ];
  const isAdmin = (user) => user?.email && ADMINS.includes(user.email.toLowerCase());

  /* ------------------ 🔒 Botão do usuário (cadeado + nome) ------------------ */
  function atualizarBotaoUsuario() {
    const u = state.currentUser;
    if (!el.userBtn) return;

    if (u) {
      const nome = u.displayName?.split(" ")[0] || u.email.split("@")[0];
      // 🔒 Cadeado restaurado no rótulo do botão
      el.userBtn.innerHTML = `🔒 Olá, ${nome}`;
    } else {
      el.userBtn.textContent = "Entrar / Cadastrar";
    }
  }

  /* ------------------ 📦 Meus Pedidos (abre/fecha e carrega) ------------------ */
  // Garante que comece fechado, evitando ocupar 30% da tela permanentemente
  const ordersPanel = document.querySelector(".orders-panel");
  if (ordersPanel) ordersPanel.classList.remove("active");

  function openOrdersPanel() {
    if (!state.currentUser) {
      alert("Faça login para ver seus pedidos.");
      return Overlays.open(el.loginModal);
    }
    Overlays.closeAll();
    ordersPanel?.classList.add("active");
    Backdrop.show();
    carregarPedidosSeguro(); // carrega sempre que abrir
  }

  function closeOrdersPanel() {
    ordersPanel?.classList.remove("active");
    Backdrop.hide();
  }

  el.myOrdersBtn?.addEventListener("click", openOrdersPanel);
  ordersPanel?.querySelector(".orders-close")?.addEventListener("click", closeOrdersPanel);

  function showOrdersFabIfLogged() {
    if (!el.myOrdersBtn) return;
    if (state.currentUser) el.myOrdersBtn.classList.add("show");
    else el.myOrdersBtn.classList.remove("show");
  }

  function carregarPedidosSeguro() {
    const container = document.getElementById("orders-content");
    if (!container) return;
    container.innerHTML = `<p class="empty-orders">Carregando pedidos...</p>`;

    const u = state.currentUser;
    if (!u?.email) {
      setTimeout(carregarPedidosSeguro, 400);
      return;
    }

    const render = (snap) => {
      if (snap.empty) {
        container.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado 😢</p>`;
        return;
      }
      const pedidos = [];
      snap.forEach((doc) => pedidos.push({ id: doc.id, ...doc.data() }));

      // Ordena por data descendente
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
            <b>Subtotal:</b> ${money(+p.subtotal || 0)}<br>
            <b>Entrega:</b> ${money(+p.entrega || 0)}<br>
            <b>Desconto:</b> -${money(+p.desconto || 0)}
          </p>
          <p style="font-size:1.1rem;color:#4caf50;font-weight:700;margin-top:6px;">
            <b>Total:</b> ${money(+p.total || 0)}
          </p>`;
        container.appendChild(box);
      });
    };

    // Busca por email e, se vazio, tenta por userId
    db.collection("Pedidos")
      .where("usuario", "==", u.email)
      .get()
      .then((snap) => {
        if (!snap.empty) return render(snap);
        return db.collection("Pedidos")
          .where("userId", "==", u.uid)
          .get()
          .then(render);
      })
      .catch((err) => {
        container.innerHTML = `<p class="empty-orders" style="color:#d32f2f;">Erro: ${err.message}</p>`;
      });
  }

  /* ------------------ 🧭 Estado de autenticação global ------------------ */
  auth.onAuthStateChanged((user) => {
    state.currentUser = user || null;
    atualizarBotaoUsuario();
    showOrdersFabIfLogged();

    // Botão de relatórios só para admins
    if (el.reportsBtn) {
      if (user && isAdmin(user)) {
        el.reportsBtn.style.display = "block";
      } else {
        el.reportsBtn.style.display = "none";
        document.getElementById("admin-dashboard")?.remove();
        Overlays.closeAll();
      }
    }
  });

  console.log("%cDFL v2.5 — Parte 4/6 carregada (Login + Admin + Pedidos ✅)",
    "background:#4caf50;color:#fff;padding:4px 8px;border-radius:6px;font-weight:700;");
})();
/* =========================================================
   📊 DFL v2.5 — Parte 5/6
   Conteúdo:
   - Painel de Relatórios (Admin)
   - Chart.js com destruição segura
   - Exportação CSV e filtros de período
   - Melhorias visuais dos gráficos
========================================================= */

(() => {
  const { popupAdd, money } = window.__DFL;
  let chartPedidos = null;
  let chartProdutos = null;

  function ensureChartJS(cb) {
    if (window.Chart) return cb();
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js";
    s.onload = cb;
    document.head.appendChild(s);
  }

  function criarPainelAdmin() {
    if (document.getElementById("admin-dashboard")) return;

    const div = document.createElement("div");
    div.id = "admin-dashboard";
    div.className = "modal show";
    div.innerHTML = `
      <div class="modal-content" style="max-width:1000px;width:95%;height:85vh;overflow:auto;background:#fff;border-radius:12px;">
        <div class="modal-head" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid #eee;">
          <h3>📈 Relatórios e Estatísticas</h3>
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

          <canvas id="chart-pedidos" style="width:100%;height:260px;"></canvas>
          <canvas id="chart-produtos" style="width:100%;height:260px;margin-top:16px;"></canvas>

          <div style="margin-top:16px;text-align:right;">
            <button id="export-csv" type="button" style="background:#4caf50;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-weight:600;cursor:pointer;">📁 Exportar CSV</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div);

    // Estilo visual dos cards
    document.querySelectorAll(".cardBox").forEach((c) => {
      Object.assign(c.style, {
        flex: "1",
        minWidth: "200px",
        padding: "12px",
        background: "linear-gradient(135deg, #fff7e6, #fff)",
        border: "1px solid #ffe082",
        borderRadius: "10px",
        boxShadow: "0 3px 10px rgba(255,193,7,0.15)",
        fontWeight: "600",
      });
    });

    div.querySelector(".dashboard-close").addEventListener("click", () => {
      div.classList.remove("show");
    });
  }

  function gerarGraficos(pedidos) {
    if (!window.Chart) return;

    const ctxPedidos = document.getElementById("chart-pedidos")?.getContext("2d");
    const ctxProdutos = document.getElementById("chart-produtos")?.getContext("2d");
    if (!ctxPedidos || !ctxProdutos) return;

    if (chartPedidos) chartPedidos.destroy();
    if (chartProdutos) chartProdutos.destroy();

    const pedidosPorDia = {};
    pedidos.forEach((p) => {
      const dia = p.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      pedidosPorDia[dia] = (pedidosPorDia[dia] || 0) + 1;
    });

    const labelsPedidos = Object.keys(pedidosPorDia);
    const dataPedidos = Object.values(pedidosPorDia);

    chartPedidos = new Chart(ctxPedidos, {
      type: "line",
      data: {
        labels: labelsPedidos,
        datasets: [{
          label: "Pedidos por Dia",
          data: dataPedidos,
          backgroundColor: "rgba(255, 204, 0, 0.3)",
          borderColor: "#ffb300",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: "#ffb300",
        }],
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: "📅 Volume de Pedidos por Dia" } },
        scales: { y: { beginAtZero: true } },
      },
    });

    const produtosContagem = {};
    pedidos.forEach((p) => {
      (p.itens || []).forEach((i) => {
        const nome = i.split(" x")[0];
        produtosContagem[nome] = (produtosContagem[nome] || 0) + 1;
      });
    });

    const produtosOrdenados = Object.entries(produtosContagem)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);

    chartProdutos = new Chart(ctxProdutos, {
      type: "bar",
      data: {
        labels: produtosOrdenados.map((p) => p[0]),
        datasets: [{
          label: "Itens Mais Vendidos",
          data: produtosOrdenados.map((p) => p[1]),
          backgroundColor: "rgba(255, 87, 34, 0.6)",
          borderColor: "#d84315",
          borderWidth: 1,
        }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: { title: { display: true, text: "🍔 Top 8 Itens Mais Vendidos" } },
      },
    });
  }

  function carregarRelatorios(periodo = "7") {
    const agora = new Date();
    let start = new Date(0);
    if (periodo !== "all") {
      start = new Date(agora);
      start.setDate(start.getDate() - Number(periodo));
    }

    const db = firebase.firestore();
    db.collection("Pedidos")
      .orderBy("data", "desc")
      .get()
      .then((snap) => {
        const pedidos = snap.docs.map((d) => {
          const p = d.data() || {};
          const total = Number(p.total) || 0;
          return {
            ...p,
            data: typeof p.data === "string"
              ? new Date(p.data)
              : p.data?.toDate?.() || new Date(0),
            total,
            itens: Array.isArray(p.itens)
              ? p.itens
              : typeof p.itens === "string"
              ? p.itens.split(";")
              : [],
          };
        });

        const filtrados = pedidos.filter(
          (p) => periodo === "all" || (p.data >= start)
        );

        gerarGraficos(filtrados);

        const totalVendido = filtrados.reduce((s, p) => s + p.total, 0);
        const numPedidos = filtrados.length;
        const ticketMedio = numPedidos ? totalVendido / numPedidos : 0;

        document.getElementById("card-total").textContent = `Total Arrecadado: ${money(totalVendido)}`;
        document.getElementById("card-pedidos").textContent = `Pedidos: ${numPedidos}`;
        document.getElementById("card-ticket").textContent = `Ticket Médio: ${money(ticketMedio)}`;

        document.getElementById("export-csv").onclick = () => {
          let csv = "Data;Usuário;Itens;Total\n";
          filtrados.forEach((p) => {
            csv += `${p.data.toLocaleString("pt-BR")};${p.usuario || ""};"${p.itens.join(", ")}";${p.total}\n`;
          });
          const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `pedidos_dfl_${periodo}.csv`;
          link.click();
          popupAdd("📊 Exportando relatório...");
        };
      })
      .catch((err) => alert("Erro ao carregar relatórios: " + err.message));

    const sel = document.getElementById("filter-period");
    if (sel && !sel._bound) {
      sel.addEventListener("change", (e) => carregarRelatorios(e.target.value));
      sel._bound = true;
    }
  }

  // Inicialização automática do painel (para admins)
  window.__DFL.loadAdminDashboard = function () {
    criarPainelAdmin();
    ensureChartJS(() => carregarRelatorios("7"));
  };

  console.log("%cDFL v2.5 — Parte 5/6 carregada (Relatórios ✅)",
    "background:#0288d1;color:#fff;padding:4px 8px;border-radius:6px;font-weight:700;");
})();
/* =========================================================
   🍪 DFL v2.5 — Parte 6/6 (Final)
   Conteúdo:
   - Banner de Cookies (moderno e responsivo)
   - Fechamento automático de modais e backdrop
   - Tratamento de erros e recarregamento seguro
========================================================= */

(() => {
  const { popupAdd } = window.__DFL || {};

  /* ------------------ 🍪 Banner de Cookies ------------------ */
  const banner = document.getElementById("cookie-banner");
  const btnAceitar = document.getElementById("cookie-accept");

  if (banner && btnAceitar) {
    if (localStorage.getItem("dfl-cookies-accepted") === "true") {
      banner.style.display = "none";
    } else {
      banner.classList.add("show");
    }

    btnAceitar.addEventListener("click", () => {
      localStorage.setItem("dfl-cookies-accepted", "true");
      banner.classList.remove("show");
      setTimeout(() => {
        banner.style.display = "none";
      }, 500);
      popupAdd?.("Preferências de cookies salvas 🍪");
    });
  }

  /* ------------------ 🎬 Fechar modais ao clicar fora ------------------ */
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (ev) => {
      if (ev.target.classList.contains("modal")) {
        modal.classList.remove("show");
        const backdrop = document.getElementById("cart-backdrop");
        backdrop?.classList.remove("active");
      }
    });
  });

  const cartBackdrop = document.getElementById("cart-backdrop");
  const miniCart = document.getElementById("mini-cart");
  if (cartBackdrop && miniCart) {
    cartBackdrop.addEventListener("click", () => {
      cartBackdrop.classList.remove("active");
      miniCart.classList.remove("active");
    });
  }

  /* ------------------ 🧱 Tratamento global de erros ------------------ */
  window.addEventListener("error", (e) => {
    const msg = String(e?.message || "").toLowerCase();
    if (msg.includes("split") || msg.includes("undefined")) {
      popupAdd?.("⚠️ Ocorreu um pequeno erro. Atualize a página.");
    }
    console.warn("⚠️ Erro capturado:", e?.message);
  });

  /* ------------------ 🔁 Reload seguro (cache/persisted) ------------------ */
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      console.log("↻ Página restaurada via cache, forçando recarregar...");
      location.reload();
    }
  });

  /* ------------------ 💚 Mensagem final ------------------ */
  console.log(
    "%c🔥 DFL v2.5 Estável — Cupom + Endereço + Frete + Relatórios + Cookies ✅",
    "background:#43a047;color:#fff;padding:8px 12px;border-radius:8px;font-weight:700;"
  );
})();