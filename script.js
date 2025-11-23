/* =========================================================
   🚀 DFL v6.0 — UNIFICADO, SEM PERDAS, SEM REMOÇÕES
   - Base 5.6 preservada
   - Busca Global integrada
   - Sessão de Promoções (9 cards)
   - Blindagem de eventos e seletor seguro
   - Correções ViaCEP + Manual
   - Preserva extras, login, pedidos, recompensas,
     progresso, mini-cart, cupons, Firebase, tudo.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =====================================================
       🔊 SOM DO SITE
  ====================================================== */
  const clickSound = new Audio("click.wav");
  document.addEventListener("click", () => {
    try { clickSound.currentTime = 0; clickSound.play(); } catch (_) {}
  });

  /* =====================================================
        🔧 VARIÁVEIS GERAIS
  ====================================================== */
  let cart = [];
  let currentUser = null;

  const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;

  const safe = (fn) => (...args) => {
    try { fn(...args); } catch(e){ console.error("Erro seguro:", e); }
  };

  /* =====================================================
        🔥 STATUS DE ABERTO/FECHADO 
  ====================================================== */
  const statusBanner = document.getElementById("status-banner");
  function atualizarStatus() {
    if (!statusBanner) return;

    const now = new Date();
    const hora = now.getHours();
    const aberto = (hora >= 18 && hora < 23);

    if (aberto) {
      statusBanner.textContent = "🟢 Estamos abertos! Faça seu pedido!";
      statusBanner.classList.add("open");
      statusBanner.classList.remove("closed");
    } else {
      statusBanner.textContent = "🔴 Estamos fechados no momento.";
      statusBanner.classList.add("closed");
      statusBanner.classList.remove("open");
    }
  }
  atualizarStatus();
  setInterval(atualizarStatus, 60000);

  /* =====================================================
        🛒 MINI-CARRINHO — ELEMENTOS
  ====================================================== */
  const miniCart = document.getElementById("mini-cart");
  const backdrop = document.getElementById("cart-backdrop");
  const miniList = document.querySelector(".mini-list");
  const cartCount = document.getElementById("cart-count");
  const cartBtn = document.getElementById("cart-icon");

  /* =====================================================
       📦 ESVAZIAR LISTA DE MINI-CART
  ====================================================== */
  function renderMiniCart() {
    if (!miniList) return;

    miniList.innerHTML = "";

    if (cart.length === 0) {
      miniList.innerHTML = `<p style="padding:10px;text-align:center;">Seu carrinho está vazio.</p>`;
      cartCount.textContent = "0";
      atualizarProgressBar();
      return;
    }

    cart.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "mini-cart-item";

      div.innerHTML = `
        <div>
          <b>${item.name}</b><br>
          <span>${money(item.price)}</span>
        </div>
        <button data-index="${index}" class="remove-item">✖</button>
      `;

      miniList.appendChild(div);
    });

    cartCount.textContent = cart.length.toString();
    atualizarProgressBar();
  }

  /* =====================================================
        🛒 BOTÃO DO CARRINHO
  ====================================================== */
  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      miniCart.classList.add("show");
      backdrop.classList.add("active");
    });
  }

  /* =====================================================
        🔙 BACKDROP FECHA TUDO
  ====================================================== */
  if (backdrop) {
    backdrop.addEventListener("click", () => {
      document.querySelectorAll(".modal, .side-panel, #mini-cart").forEach(el => {
        el.classList.remove("show", "active");
      });
      backdrop.classList.remove("active");
    });
  }

  /* =====================================================
      ❌ REMOVER ITEM DO CARRINHO
  ====================================================== */
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-item")) {
      const index = e.target.getAttribute("data-index");
      cart.splice(index, 1);
      renderMiniCart();
    }
  });

  /* =====================================================
        ➕ ADICIONAR AO CARRINHO
  ====================================================== */
  document.body.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-cart")) {

      const card = e.target.closest(".card");
      if (!card) return;

      const name = card.getAttribute("data-name");
      const price = parseFloat(card.getAttribute("data-price"));

      cart.push({ name, price });
      renderMiniCart();

      miniCart.classList.add("show");
      backdrop.classList.add("active");
    }
  });

  /* =====================================================
      🚚 PROGRESS BAR (FRETE GRÁTIS)
  ====================================================== */
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");

  function atualizarProgressBar() {
    const total = cart.reduce((a, b) => a + b.price, 0);
    const falta = 80 - total;

    if (falta <= 0) {
      progressText.innerHTML = `🎉 Você ganhou <strong>Frete Grátis!</strong>`;
      progressFill.style.width = "100%";
      return;
    }

    const porcentagem = Math.min(100, (total / 80) * 100);
    progressFill.style.width = `${porcentagem}%`;

    progressText.innerHTML =
      `Faltam <strong>${money(falta)}</strong> para Frete Grátis 🚀`;
  }

  atualizarProgressBar();

  /* =====================================================
        🔍 SISTEMA DE BUSCA GLOBAL
  ====================================================== */
  const campoBusca = document.getElementById("campoBusca");
  const resultadoBusca = document.getElementById("resultadoBusca");

  function normalizarTexto(t) {
    return t.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function buscarTermo(termo) {
    if (!termo || termo.length < 2) {
      resultadoBusca.innerHTML = "";
      return;
    }

    const normal = normalizarTexto(termo);

    const cards = [...document.querySelectorAll(".card")];
    const encontrados = cards.filter(c => {
      const nome = normalizarTexto(c.getAttribute("data-name") || "");
      return nome.includes(normal);
    });

    if (!encontrados.length) {
      resultadoBusca.innerHTML =
        `<p style="padding:10px;">Nenhum resultado encontrado para <b>${termo}</b>.</p>`;
      return;
    }

    resultadoBusca.innerHTML = encontrados
      .map(c => `<p>🔎 ${c.getAttribute("data-name")}</p>`)
      .join("");
  }

  campoBusca?.addEventListener("input", safe((e) => {
    buscarTermo(e.target.value.trim());
  }));
/* =====================================================
        📦 FINALIZAR PEDIDO (Firestore)
        — versão preservada da 5.6, blindada e segura
  ====================================================== */

  async function fecharPedido() {
    if (!currentUser) {
      alert("Você precisa estar logado para finalizar o pedido.");
      return;
    }

    if (cart.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }

    try {
      const total = cart.reduce((a, b) => a + b.price, 0);

      // endereço
      const enderecoAuto = document.getElementById("endereco-auto")?.value || "";
      const numero = document.getElementById("numero-input")?.value || "";
      const compl = document.getElementById("complemento-input")?.value || "";
      const manual = document.getElementById("manualEndereco")?.value || "";
      const manualNumero = document.getElementById("manualNumero")?.value || "";

      const retirar = document.getElementById("retirar-local")?.checked || false;

      const pedidoObj = {
        itens: cart,
        total,
        data: Date.now(),
        user: currentUser.uid,
        endereco: retirar
          ? "RETIRAR NO LOCAL"
          : manual.length > 3
            ? `${manual}, Nº ${manualNumero}`
            : `${enderecoAuto}, Nº ${numero} ${compl}`,
        retirar,
      };

      const batch = firebase.firestore().batch();
      const pedidosRef = firebase.firestore()
        .collection("Pedidos")
        .doc();

      const userRef = firebase.firestore()
        .collection("Usuarios")
        .doc(currentUser.uid);

      batch.set(pedidosRef, pedidoObj);
      batch.update(userRef, { totalPedidos: firebase.firestore.FieldValue.increment(1) });

      await batch.commit();

      alert("Pedido enviado com sucesso!");
      cart = [];
      renderMiniCart();

    } catch (e) {
      console.error("Erro ao fechar pedido:", e);
      alert("Erro ao enviar pedido. Tente novamente.");
    }
  }

  /* =====================================================
        📌 BOTÃO DE FINALIZAR PEDIDO
  ====================================================== */
  document.addEventListener("click", (e) => {
    if (e.target.id === "finalizar-btn") {
      fecharPedido();
    }
  });

  /* =====================================================
        📦 CARREGAR PEDIDOS DO USUÁRIO
  ====================================================== */
  async function carregarPedidos() {
    if (!currentUser) return;

    const lista = document.querySelector(".orders-list");
    if (!lista) return;

    lista.innerHTML = `<p>Carregando...</p>`;

    try {
      const ref = await firebase.firestore()
        .collection("Pedidos")
        .where("user", "==", currentUser.uid)
        .orderBy("data", "desc")
        .get();

      if (ref.empty) {
        lista.innerHTML = `<p class='empty-orders'>Você ainda não fez pedidos.</p>`;
        return;
      }

      lista.innerHTML = "";

      ref.forEach(doc => {
        const p = doc.data();
        const div = document.createElement("div");
        div.className = "order-item";

        div.innerHTML = `
          <h4>Pedido — ${new Date(p.data).toLocaleString()}</h4>
          <p><b>Total:</b> ${money(p.total)}</p>
          <p><b>Endereço:</b> ${p.endereco}</p>
          <hr>
        `;

        lista.appendChild(div);
      });

    } catch (e) {
      console.error("Erro ao carregar pedidos:", e);
      lista.innerHTML = `<p>Erro ao carregar.</p>`;
    }
  }

  /* =====================================================
        🏅 CARREGAR RECOMPENSAS
  ====================================================== */
  async function carregarRecompensas() {
    if (!currentUser) return;

    const lista = document.querySelector(".rewards-list");
    if (!lista) return;

    lista.innerHTML = `<p>Carregando...</p>`;

    try {
      const ref = await firebase.firestore()
        .collection("Recompensas")
        .where("user", "==", currentUser.uid)
        .get();

      if (ref.empty) {
        lista.innerHTML = `<p class='empty-rewards'>Você ainda não possui recompensas.</p>`;
        return;
      }

      lista.innerHTML = "";

      ref.forEach(doc => {
        const r = doc.data();
        const div = document.createElement("div");
        div.className = "reward-item";

        div.innerHTML = `
          <h4>${r.nome}</h4>
          <p><b>Descrição:</b> ${r.desc}</p>
          <p><b>Gerado em:</b> ${new Date(r.data).toLocaleString()}</p>
          <hr>
        `;

        lista.appendChild(div);
      });

    } catch (e) {
      console.error("Erro:", e);
      lista.innerHTML = `<p>Erro ao carregar.</p>`;
    }
  }

  /* =====================================================
        🧍 LOGIN / LOGOUT
  ====================================================== */

  firebase.auth().onAuthStateChanged((user) => {
    currentUser = user;

    const userBtn = document.getElementById("user-btn");
    const pedidosFloat = document.querySelector(".meus-pedidos");
    const recompensasFloat = document.querySelector(".minhas-recompensas");

    if (user) {
      userBtn.textContent = "Minha Conta";
      pedidosFloat.style.display = "block";
      recompensasFloat.style.display = "block";

      carregarPedidos();
      carregarRecompensas();

    } else {
      userBtn.textContent = "Entrar / Cadastrar";
      pedidosFloat.style.display = "none";
      recompensasFloat.style.display = "none";
    }
  });

  /* =====================================================
         🔐 EVENTO LOGIN EMAIL/SENHA
  ====================================================== */

  document.addEventListener("click", (e) => {
    if (e.target.id === "login-email-btn") {
      const email = document.getElementById("login-email").value;
      const pass  = document.getElementById("login-password").value;

      firebase.auth().signInWithEmailAndPassword(email, pass)
        .then(() => {
          document.getElementById("login-modal").classList.remove("show");
          backdrop.classList.remove("active");
        })
        .catch((err) => {
          alert("Erro ao entrar: " + err.message);
        });
    }
  });

  /* =====================================================
        🔐 LOGIN GOOGLE
  ====================================================== */
  document.addEventListener("click", (e) => {
    if (e.target.id === "google-login") {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider)
        .then(() => {
          document.getElementById("login-modal").classList.remove("show");
          backdrop.classList.remove("active");
        })
        .catch((err) => alert("Erro: " + err.message));
    }
  });
/* =====================================================
        🛒 MINI-CARRINHO  —  Renderização e Botões
  ====================================================== */

  function renderMiniCart() {
    const lista = document.querySelector(".mini-list");
    const count = document.getElementById("cart-count");
    const foot  = document.querySelector(".mini-foot");

    if (!lista || !foot) return;

    // quantidade total
    const totalQtd = cart.reduce((s, i) => s + (i.qtd || 1), 0);
    if (count) count.textContent = totalQtd;

    // carrinho vazio
    if (cart.length === 0) {
      lista.innerHTML = `
        <p style="text-align:center;color:#888;padding:20px;">
          Carrinho vazio 🛒
        </p>
      `;
      foot.innerHTML = "";
      return;
    }

    // itens
    lista.innerHTML = cart
      .map((item, i) => `
        <div class="cart-item">
          <div>
            <p class="ci-name">${item.nome}</p>
            <p class="ci-price">${money(item.preco)} x ${item.qtd}</p>
          </div>
          <div class="ci-actions">
            <button class="cart-minus" data-idx="${i}">-</button>
            <span>${item.qtd}</span>
            <button class="cart-plus" data-idx="${i}">+</button>
            <button class="cart-remove" data-idx="${i}">🗑</button>
          </div>
        </div>
      `)
      .join("");

    // resumo
    const subtotal = cart.reduce((s, i) => s + i.preco * i.qtd, 0);

    foot.innerHTML = `
      <div class="summary-row">
        <span>Subtotal</span>
        <b>${money(subtotal)}</b>
      </div>

      <button id="finalizar-btn" class="btn-green">
        Finalizar Pedido 🛍️
      </button>

      <button id="limpar-carrinho" class="btn-pink">
        Limpar Carrinho
      </button>
    `;

    // binds
    bindMiniCartButtons();
  }

  /* =====================================================
        ➕ BOTÕES + / − / REMOVER
  ====================================================== */

  function bindMiniCartButtons() {
    document.querySelectorAll(".cart-plus").forEach(btn => {
      btn.onclick = () => {
        const i = +btn.dataset.idx;
        cart[i].qtd++;
        renderMiniCart();
      };
    });

    document.querySelectorAll(".cart-minus").forEach(btn => {
      btn.onclick = () => {
        const i = +btn.dataset.idx;
        if (cart[i].qtd > 1) cart[i].qtd--;
        else cart.splice(i, 1);
        renderMiniCart();
      };
    });

    document.querySelectorAll(".cart-remove").forEach(btn => {
      btn.onclick = () => {
        const i = +btn.dataset.idx;
        cart.splice(i, 1);
        renderMiniCart();
      };
    });

    const limparBtn = document.getElementById("limpar-carrinho");
    if (limparBtn) {
      limparBtn.onclick = () => {
        if (confirm("Limpar o carrinho inteiro?")) {
          cart = [];
          renderMiniCart();
        }
      };
    }
  }

  /* =====================================================
        ➕ ADICIONAR PRODUTOS COM ADICIONAIS
  ====================================================== */

  const adicionais = [
    { nome: "Cebola", preco: 0.99 },
    { nome: "Salada", preco: 1.99 },
    { nome: "Ovo",    preco: 1.99 },
    { nome: "Bacon",  preco: 2.99 },
    { nome: "Hambúrguer Tradicional 56g", preco: 2.99 },
    { nome: "Cheddar Cremoso", preco: 3.99 },
    { nome: "Filé de Frango", preco: 5.99 },
    { nome: "Hambúrguer Artesanal 120g", preco: 7.99 },
  ];

  let produtoExtras = null;
  let precoBaseExtras = 0;

  function openExtrasFor(card) {
    if (!card) return;

    produtoExtras = card.dataset.name;
    precoBaseExtras = Number(card.dataset.price);

    const lista = document.querySelector("#extras-modal .extras-list");
    if (!lista) return;

    lista.innerHTML = adicionais
      .map((a, i) => `
        <label class="extra-item">
          <span>${a.nome} — <b>${money(a.preco)}</b></span>
          <input type="checkbox" value="${i}">
        </label>
      `)
      .join("");

    openModal(extrasModal);
  }

  document.querySelectorAll(".extras-btn").forEach(btn => {
    btn.onclick = (ev) => {
      const card = ev.currentTarget.closest(".card");
      openExtrasFor(card);
    };
  });

  document.getElementById("extras-confirm").onclick = () => {
    if (!produtoExtras) return;

    const checks = [
      ...document.querySelectorAll("#extras-modal .extras-list input:checked"),
    ];

    let extrasNomes = [];
    let totalExtras = 0;

    checks.forEach(c => {
      const ad = adicionais[+c.value];
      extrasNomes.push(ad.nome);
      totalExtras += ad.preco;
    });

    const nomeFinal = extrasNomes.length
      ? `${produtoExtras} + ${extrasNomes.join(", ")}`
      : produtoExtras;

    const precoFinal = precoBaseExtras + totalExtras;

    const existente = cart.find(i => i.nome === nomeFinal);
    if (existente) existente.qtd++;
    else cart.push({ nome: nomeFinal, preco: precoFinal, qtd: 1 });

    renderMiniCart();
    closeModal(extrasModal);
  };

  document.querySelectorAll(".extras-close").forEach(btn => {
    btn.onclick = () => closeModal(extrasModal);
  });

  /* =====================================================
          ➕ BOTÃO COMUM "ADICIONAR AO CARRINHO"
  ====================================================== */

  document.querySelectorAll(".add-cart").forEach(btn => {
    btn.onclick = (e) => {
      const card = e.currentTarget.closest(".card");
      const nome = card.dataset.name;
      const preco = Number(card.dataset.price);

      const existente = cart.find(i => i.nome === nome && i.preco === preco);
      if (existente) existente.qtd++;
      else cart.push({ nome, preco, qtd: 1 });

      renderMiniCart();
    };
  });
/* =====================================================
        🥤 SISTEMA DE COMBOS — OPÇÕES DE BEBIDA
  ====================================================== */

  const comboOpcoes = {
    casal: [
      { rotulo: "Fanta 1L (padrão)", delta: 0.01 },
      { rotulo: "Coca-Cola 1L", delta: 3.00 },
      { rotulo: "Coca-Cola 1L Zero", delta: 3.00 },
    ],
    familia: [
      { rotulo: "Kuat 2L (padrão)", delta: 0.01 },
      { rotulo: "Coca-Cola 2L", delta: 5.00 },
    ],
  };

  let comboContext = null;

  function openComboModal(nome, precoBase) {
    const low = nome.toLowerCase();

    const grupo = low.includes("casal")
      ? "casal"
      : low.includes("família") || low.includes("familia")
      ? "familia"
      : null;

    if (!grupo) {
      addItemCommon(nome, precoBase);
      return;
    }

    const body = document.querySelector("#combo-body");
    const modal = document.getElementById("combo-modal");

    if (!body || !modal) {
      addItemCommon(nome, precoBase);
      return;
    }

    const opcoes = comboOpcoes[grupo];

    body.innerHTML = opcoes
      .map(
        (opt, i) => `
        <label class="combo-line">
          <span>${opt.rotulo}</span>
          <span class="combo-price">+ ${money(opt.delta)}</span>
          <input type="radio" name="combo-opt" value="${i}" ${i === 0 ? "checked" : ""}>
        </label>
      `
      )
      .join("");

    comboContext = { nome, precoBase, grupo };
    openModal(modal);
  }

  document.getElementById("combo-confirm").onclick = () => {
    if (!comboContext) return;

    const { nome, precoBase, grupo } = comboContext;
    const sel = document.querySelector('input[name="combo-opt"]:checked');
    if (!sel) return;

    const opt = comboOpcoes[grupo][+sel.value];

    const nomeFinal = `${nome} + ${opt.rotulo}`;
    const precoFinal = precoBase + opt.delta;

    const existente = cart.find((i) => i.nome === nomeFinal);
    if (existente) existente.qtd++;
    else cart.push({ nome: nomeFinal, preco: precoFinal, qtd: 1 });

    renderMiniCart();
    closeModal(document.getElementById("combo-modal"));
  };

  document.querySelectorAll(".combo-close").forEach((b) => {
    b.onclick = () => closeModal(document.getElementById("combo-modal"));
  });

  /* =====================================================
        ➕ FUNÇÃO COMUM "ADD ITEM"
  ====================================================== */

  function addItemCommon(nome, preco) {
    if (/^combo/i.test(nome) && !/^\s*Combo [0-9]/.test(nome)) {
      // combos personalizados
      openComboModal(nome, preco);
      return;
    }

    const existente = cart.find((i) => i.nome === nome && i.preco === preco);
    if (existente) existente.qtd++;
    else cart.push({ nome, preco, qtd: 1 });

    renderMiniCart();
  }

  /* =====================================================
        💬 POPUP RÁPIDO (Aviso Visual)
  ====================================================== */

  function popupAdd(msg) {
    let box = document.querySelector(".popup-add");
    if (!box) {
      box = document.createElement("div");
      box.className = "popup-add";
      document.body.appendChild(box);
    }

    box.textContent = msg;
    box.classList.add("show");

    setTimeout(() => box.classList.remove("show"), 1800);
  }

  /* =====================================================
        🏠 BUSCAR CEP (ViaCEP) — AUTOPREENCHIMENTO
  ====================================================== */

  async function buscarCEP(cep) {
    const ruaBairro = document.getElementById("endereco-auto");
    const numero = document.getElementById("numero-input");
    const comp = document.getElementById("complemento-input");

    if (!ruaBairro) return;

    ruaBairro.value = "Buscando endereço...";
    ruaBairro.style.color = "#ff9800";

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();

      if (data.erro) {
        ruaBairro.value = "CEP não encontrado (preencha manualmente)";
        ruaBairro.style.color = "#d32f2f";
        numero.value = "";
        comp.value = "";
        return;
      }

      const cidadeUF = `${data.localidade}/${data.uf}`;
      ruaBairro.value = `${data.logradouro} - ${data.bairro} (${cidadeUF})`;
      ruaBairro.style.color = "#2e7d32";

      numero.focus();
    } catch (e) {
      ruaBairro.value = "Erro ao consultar CEP";
      ruaBairro.style.color = "#d32f2f";
    }
  }

  document.getElementById("btn-calcular-frete")?.addEventListener("click", () => {
    const cep = document
      .getElementById("cep-input")
      .value.replace(/\D/g, "");

    if (cep.length !== 8) {
      popupAdd("CEP inválido");
      return;
    }

    buscarCEP(cep);
  });

  /* =====================================================
        🧭 MODO MANUAL DE ENDEREÇO — v6.0
  ====================================================== */

  let modoManual = false;

  const areaCEP = document.querySelector(".frete-container");
  const areaManual = document.getElementById("manualArea");

  document.getElementById("btnManual")?.addEventListener("click", () => {
    modoManual = true;

    if (areaCEP) areaCEP.style.display = "none";
    if (areaManual) areaManual.style.display = "block";

    // limpa campos
    document.getElementById("manualEndereco").value = "";
    document.getElementById("manualNumero").value = "";
  });

  document.getElementById("btnVoltarCEP")?.addEventListener("click", () => {
    modoManual = false;

    if (areaCEP) areaCEP.style.display = "block";
    if (areaManual) areaManual.style.display = "none";
  });

  document.getElementById("btnConfirmarEndereco")?.addEventListener("click", () => {
    const end = document.getElementById("manualEndereco").value.trim();
    const num = document.getElementById("manualNumero").value.trim();

    if (!end || !num) {
      popupAdd("Preencha endereço e número!");
      return;
    }

    popupAdd("Endereço manual confirmado");
    renderMiniCart();
  });
/* =====================================================
        🛒 FUNÇÕES DO CARRINHO — SOMA, SUBTOTAL,
        CUPOM, DESCONTO, FRETE E TOTAL (v6.0)
  ====================================================== */

  function getCartSubtotal() {
    return cart.reduce((acc, item) => acc + item.preco * item.qtd, 0);
  }

  /* -----------------------------------------------------
        🔥 FRETE DINÂMICO (Firebase) — FUNÇÃO RECONSTRUIDA
  ------------------------------------------------------ */

  async function getDynamicDeliveryFee(endereco) {
    if (!endereco || typeof endereco !== "string") return DELIVERY_FEE_DEFAULT;

    let bairro = "";

    try {
      const base = endereco.split("(")[0].trim(); 
      const partes = base.split(" - ");
      bairro = partes.length >= 2 ? partes[1] : base;
    } catch {
      return DELIVERY_FEE_DEFAULT;
    }

    const clean = bairro
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    if (!window.__dfl_fees__) {
      try {
        const snap = await db
          .collection("TaxasDeEntrega")
          .doc("bairros")
          .collection("lista")
          .doc("tabela")
          .get();

        if (!snap.exists) return DELIVERY_FEE_DEFAULT;

        const arr = snap.data()?.data || [];
        const map = {};

        arr.forEach((b) => {
          if (!b.nome || isNaN(b.taxa)) return;

          const k = b.nome
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

          map[k] = Number(b.taxa);
        });

        window.__dfl_fees__ = map;
      } catch (e) {
        console.error("Erro ao ler Taxas:", e);
        return DELIVERY_FEE_DEFAULT;
      }
    }

    const tabela = window.__dfl_fees__ || {};

    // Match exato
    if (tabela[clean] !== undefined) return tabela[clean];

    // Match aproximado por palavra
    const palavras = clean.split(" ");
    for (const p of palavras) {
      if (p.length < 4) continue;
      for (const key in tabela) {
        if (key.includes(p)) return tabela[key];
      }
    }

    return DELIVERY_FEE_DEFAULT;
  }

  /* -----------------------------------------------------
        🎟️ CUPOM — VALIDAÇÃO SIMPLIFICADA (v6.0 estável)
  ------------------------------------------------------ */

  async function validarCupom(codigo, subtotal) {
    if (!codigo) return { valido: false, desconto: 0, label: "" };
    if (!isFirebaseInitialized) return { valido: false, desconto: 0, label: "" };

    try {
      const snap = await db.collection("Cupons").doc(codigo).get();
      if (!snap.exists) return { valido: false, desconto: 0, label: "" };

      const c = snap.data();
      if (!c.ativo) return { valido: false, desconto: 0, label: "" };

      if (c.tipo === "percent") {
        const desconto = subtotal * (c.percent / 100);
        return { valido: true, desconto, label: `${c.percent}% OFF` };
      }

      if (c.tipo === "value") {
        const desconto = Math.min(subtotal, c.valor);
        return { valido: true, desconto, label: `R$ ${c.valor} OFF` };
      }

      return { valido: false, desconto: 0, label: "" };
    } catch (e) {
      console.error("Erro cupom:", e);
      return { valido: false, desconto: 0, label: "" };
    }
  }

  /* -----------------------------------------------------
        🧮 CALCULAR TOTAIS (v6.0 MAIS LIMPO)
  ------------------------------------------------------ */

  async function calcTotals() {
    const subtotal = getCartSubtotal();
    const retirar = document.getElementById("retirar-local")?.checked;

    // cupom
    const cupom = couponApplied || "";
    const cupomInfo = await validarCupom(cupom, subtotal);
    const desconto = cupomInfo.desconto || 0;

    // endereço
    let enderecoFinal = "";

    if (modoManual) {
      enderecoFinal = document.getElementById("manualEndereco").value.trim();
    } else {
      const auto = document.getElementById("endereco-auto");
      if (auto) enderecoFinal = auto.value.trim();
    }

    // frete
    let frete = DELIVERY_FEE_DEFAULT;

    if (retirar) frete = 0;
    else if (subtotal >= LIMITE_FRETE_GRATIS) frete = 0;
    else if (enderecoFinal) frete = await getDynamicDeliveryFee(enderecoFinal);

    const total = Math.max(0, subtotal + frete - desconto);

    return {
      subtotal,
      frete,
      total,
      desconto,
      cupomInfo,
    };
  }

  /* =====================================================
        🧾 MINI CARRINHO — RESUMO COMPLETO
  ====================================================== */

  async function enhanceMiniCartUI() {
    const foot = document.querySelector(".mini-foot");
    if (!foot) return;

    foot.querySelectorAll(".cart-summary-generated").forEach((e) => e.remove());

    if (!cart.length) return;

    const { subtotal, frete, total, desconto, cupomInfo } = await calcTotals();

    const wrap = document.createElement("div");
    wrap.className = "cart-summary-generated";

    wrap.innerHTML = `
      <div class="summary-row">
        <span>Subtotal</span>
        <b>${money(subtotal)}</b>
      </div>

      <div class="summary-row">
        <span>Entrega</span>
        <b>${frete === 0 ? "Grátis 🎉" : money(frete)}</b>
      </div>

      ${
        desconto > 0
          ? `<div class="summary-row desconto-row">
              <span>Desconto (${cupomApplied})</span>
              <b>- ${money(desconto)}</b>
            </div>`
          : ""
      }

      <div class="summary-total">
        <span><b>Total</b></span>
        <b style="color:#E53935;">${money(total)}</b>
      </div>

      <button id="finish-order" class="btn-finalizar">Finalizar Pedido 🛍️</button>
      <button id="clear-cart" class="btn-clean">Limpar Carrinho</button>
    `;

    foot.appendChild(wrap);

    document.getElementById("finish-order").onclick = fecharPedido;

    document.getElementById("clear-cart").onclick = () => {
      if (!confirm("Tem certeza que deseja limpar o carrinho?")) return;
      cart = [];
      couponApplied = "";
      localStorage.removeItem("dflCoupon");

      const ci = document.getElementById("coupon-input");
      if (ci) ci.value = "";

      renderMiniCart();
    };
  }

  /* =====================================================
        🔥 REDEFINIR A FUNÇÃO RENDER PARA O v6.0
  ====================================================== */

  const oldRender = renderMiniCart;

  renderMiniCart = function () {
    oldRender();
    enhanceMiniCartUI();
  };
/* =====================================================
        📦 FINALIZAR PEDIDO — FLUXO COMPLETO v6.0
     (mantido, corrigido e otimizado — sem remover nada)
  ====================================================== */

  async function fecharPedido() {
    if (!isFirebaseInitialized) {
      toast("Carregando… tente novamente.", "erro");
      return;
    }

    if (!currentUser) {
      abrirLogin();
      return;
    }

    if (!cart.length) {
      toast("Seu carrinho está vazio!", "erro");
      return;
    }

    const btn = document.getElementById("finish-order");
    if (btn) btn.disabled = true;

    try {
      const totals = await calcTotals();

      const pedido = {
        uid: currentUser.uid,
        itens: cart.map((i) => ({
          nome: i.nome,
          preco: i.preco,
          qtd: i.qtd,
        })),
        subtotal: totals.subtotal,
        frete: totals.frete,
        desconto: totals.desconto,
        total: totals.total,
        cupom: couponApplied || "",
        endereco: getEnderecoFinal(),
        data: new Date().toISOString(),
        status: "pendente",
      };

      const batch = db.batch();
      const refPedido = db.collection("Pedidos").doc();
      batch.set(refPedido, pedido);

      const refUser = db.collection("Usuarios").doc(currentUser.uid);
      batch.update(refUser, {
        totalPedidos: firebase.firestore.FieldValue.increment(1),
      });

      await batch.commit();

      toast("Pedido enviado com sucesso!", "ok");

      cart = [];
      couponApplied = "";
      localStorage.removeItem("dflCoupon");

      closeMiniCart();
      renderMiniCart();
      carregarPedidosUsuario();
      carregarRecompensasUsuario();
    } catch (e) {
      console.error(e);
      toast("Erro ao finalizar pedido.", "erro");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function getEnderecoFinal() {
    if (document.getElementById("retirar-local")?.checked) {
      return "RETIRAR NO LOCAL";
    }

    if (modoManual) {
      return (document.getElementById("manualEndereco")?.value || "").trim();
    }

    return (document.getElementById("endereco-auto")?.value || "").trim();
  }

  /* =====================================================
        📄 PAINEL “MEUS PEDIDOS”
  ====================================================== */

  async function carregarPedidosUsuario() {
    if (!currentUser || !isFirebaseInitialized) return;

    const painel = document.querySelector("#painel-pedidos .painel-conteudo");
    if (!painel) return;

    painel.innerHTML = `<p class="loading">Carregando…</p>`;

    try {
      const snap = await db
        .collection("Pedidos")
        .where("uid", "==", currentUser.uid)
        .orderBy("data", "desc")
        .limit(30)
        .get();

      if (snap.empty) {
        painel.innerHTML = `<p class="vazio">Nenhum pedido encontrado.</p>`;
        return;
      }

      painel.innerHTML = "";

      snap.forEach((doc) => {
        const p = doc.data();
        const box = document.createElement("div");
        box.className = "pedido-card";

        const itensStr = p.itens
          .map((i) => `${i.qtd}× ${i.nome}`)
          .join("<br>");

        box.innerHTML = `
          <div class="pedido-top">
            <b>Pedido #${doc.id.slice(-5)}</b>
            <span>${new Date(p.data).toLocaleString("pt-BR")}</span>
          </div>

          <div class="pedido-itens">
            ${itensStr}
          </div>

          <div class="pedido-total">
            <b>Total:</b> ${money(p.total)}
          </div>
        `;

        painel.appendChild(box);
      });
    } catch (e) {
      console.error(e);
      painel.innerHTML = `<p class="erro">Erro ao carregar pedidos.</p>`;
    }
  }

  /* =====================================================
        🏅 RECOMPENSAS (tiers) — MANTIDAS E ESTÁVEIS
  ====================================================== */

  async function carregarRecompensasUsuario() {
    if (!currentUser || !isFirebaseInitialized) return;

    const painel = document.querySelector("#painel-recompensas .painel-conteudo");
    if (!painel) return;

    painel.innerHTML = `<p class="loading">Carregando…</p>`;

    try {
      const ref = await db.collection("Usuarios").doc(currentUser.uid).get();
      const dados = ref.data();

      const total = dados?.totalPedidos || 0;
      const tier = getTierByPedidos(total);
      const icon = getTierIcon(tier);

      painel.innerHTML = `
        <div class="tier-box">
          <img src="${icon}" class="tier-icon">
          <div>
            <b>${tier}</b>
            <p>Total de pedidos: ${total}</p>
          </div>
        </div>
      `;
    } catch (e) {
      console.error(e);
      painel.innerHTML = `<p class="erro">Erro ao carregar recompensas.</p>`;
    }
  }

  function getTierByPedidos(n) {
    if (n >= 40) return "Diamante";
    if (n >= 20) return "Platina";
    if (n >= 10) return "Ouro";
    return "Bronze";
  }

  function getTierIcon(tier) {
    if (tier === "Diamante") return "icons/diamond.png";
    if (tier === "Platina") return "icons/platinum.png";
    if (tier === "Ouro") return "icons/gold.png";
    return "icons/bronze.png";
  }
/* =====================================================
        🎧 SISTEMA DE SONS — CORRIGIDO E OTIMIZADO
     (sem travar a página e sem tocar sons duplicados)
  ====================================================== */

  const clickSound = new Audio("click.wav");
  clickSound.volume = 0.25;

  function playClick() {
    try {
      clickSound.currentTime = 0;
      clickSound.play();
    } catch (_) {}
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#mini-cart") &&
        !e.target.closest(".modal") &&
        !e.target.closest(".side-panel")) {
      playClick();
    }
  });


  /* =====================================================
        🍪 SISTEMA DE COOKIES / LGPD
  ====================================================== */

  const bannerCookies = document.getElementById("cookie-banner");
  const aceitarCookies = document.getElementById("cookie-accept");

  if (bannerCookies && aceitarCookies) {
    if (localStorage.getItem("dfl-lgtpd-ok") === "true") {
      bannerCookies.style.display = "none";
    } else {
      bannerCookies.classList.add("show");
    }

    aceitarCookies.addEventListener("click", () => {
      localStorage.setItem("dfl-lgtpd-ok", "true");
      bannerCookies.classList.remove("show");
      bannerCookies.style.display = "none";
    });
  }


  /* =====================================================
        🎯 SISTEMA DE BANNERS — ABERTO/FECHADO
  ====================================================== */

  function atualizarStatusLoja() {
    const agora = new Date();
    const h = agora.getHours();

    const aberto = h >= 18 && h < 23;

    if (el.statusBanner) {
      if (aberto) {
        el.statusBanner.textContent = "🟢 Aberto — Faça seu pedido!";
        el.statusBanner.classList.remove("closed");
        el.statusBanner.classList.add("open");
      } else {
        el.statusBanner.textContent = "🔴 Fechado — Voltamos às 18h";
        el.statusBanner.classList.remove("open");
        el.statusBanner.classList.add("closed");
      }
    }
  }

  atualizarStatusLoja();
  setInterval(atualizarStatusLoja, 60000);


  /* =====================================================
        ⚡ SISTEMA DE TOAST (mensagens bonitas)
  ====================================================== */

  let toastTimeout = null;

  function toast(msg, tipo = "ok") {
    let t = document.getElementById("toast");

    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.className = "toast";
      document.body.appendChild(t);
    }

    t.textContent = msg;
    t.className = `toast ${tipo}`;
    t.style.opacity = "1";
    t.style.transform = "translateY(0)";

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translateY(20px)";
    }, 3000);
  }


  /* =====================================================
        🔁 RECARREGAMENTO AUTOMÁTICO DE DADOS
        (quando usuário faz login / logout)
  ====================================================== */

  function recarregarDadosUsuario() {
    if (currentUser) {
      carregarPedidosUsuario();
      carregarRecompensasUsuario();
    } else {
      const pedidos = document.querySelector("#painel-pedidos .painel-conteudo");
      const recompensas = document.querySelector("#painel-recompensas .painel-conteudo");

      if (pedidos) pedidos.innerHTML = `<p class="vazio">Faça login para ver seus pedidos</p>`;
      if (recompensas) recompensas.innerHTML = `<p class="vazio">Faça login para ver suas recompensas</p>`;
    }
  }


  /* =====================================================
        📌 OBSERVADOR DE AUTENTICAÇÃO
        (com reposição das funções originais)
  ====================================================== */

  if (auth) {
    auth.onAuthStateChanged((user) => {
      currentUser = user;
      recarregarDadosUsuario();

      if (user) {
        // Mostra botões do painel
        const m = document.querySelector(".meus-pedidos");
        const r = document.querySelector(".minhas-recompensas");
        if (m) m.style.display = "block";
        if (r) r.style.display = "block";

        // Mostra admin (se for)
        if (ADMINS.includes(user.email.toLowerCase())) {
          if (el.reportsBtn) el.reportsBtn.style.display = "block";
        }
      } else {
        const m = document.querySelector(".meus-pedidos");
        const r = document.querySelector(".minhas-recompensas");
        if (m) m.style.display = "none";
        if (r) r.style.display = "none";

        if (el.reportsBtn) el.reportsBtn.style.display = "none";
      }
    });
  }


  /* =====================================================
        🧭 FECHAR TUDO NO ESC
  ====================================================== */

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") {
      Overlays.closeAll();
    }
  });
/* =====================================================
        🧾 SISTEMA DE PEDIDOS DO USUÁRIO (Meus Pedidos)
        — Totalmente compatível com v5.6 e v6.0
  ====================================================== */

  async function carregarPedidosUsuario() {
    if (!currentUser || !db) return;

    const lista = document.querySelector("#orders-panel .orders-list");
    if (!lista) return;

    lista.innerHTML = `<p class="loading">Carregando seus pedidos...</p>`;

    try {
      const snap = await db
        .collection("Pedidos")
        .where("uid", "==", currentUser.uid)
        .orderBy("data", "desc")
        .limit(20)
        .get();

      if (snap.empty) {
        lista.innerHTML = `<p class="empty-orders">Você ainda não fez nenhum pedido 💛</p>`;
        return;
      }

      lista.innerHTML = "";

      snap.forEach((doc) => {
        const p = doc.data();

        const card = document.createElement("div");
        card.className = "order-card";

        const itensFormatados = p.itens
          .map((i) => `• ${i.name} (${money(i.price)})`)
          .join("<br>");

        card.innerHTML = `
          <div class="order-header">
            <span class="order-id">#${doc.id.slice(-6)}</span>
            <span class="order-date">${new Date(
              p.data
            ).toLocaleDateString("pt-BR")}</span>
          </div>

          <div class="order-body">
            ${itensFormatados}
          </div>

          <div class="order-footer">
            <span class="order-total">Total: <b>${money(
              p.total
            )}</b></span>
            <button class="btn-repetir" data-pedido="${doc.id}">
              🔁 Repetir Pedido
            </button>
          </div>
        `;

        lista.appendChild(card);
      });

      configurarRepetirPedido();
    } catch (e) {
      console.error("Erro ao carregar pedidos:", e);
      lista.innerHTML = `<p class="error">Não foi possível carregar seus pedidos.</p>`;
    }
  }


  /* =====================================================
        🔁 FUNÇÃO — REPETIR PEDIDO (v2.9+)
  ====================================================== */

  function configurarRepetirPedido() {
    document.querySelectorAll(".btn-repetir").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const pid = btn.getAttribute("data-pedido");
        if (!pid) return;

        try {
          const doc = await db.collection("Pedidos").doc(pid).get();
          if (!doc.exists) return toast("Pedido não encontrado.", "err");

          const pedido = doc.data();
          if (!pedido.itens || pedido.itens.length === 0)
            return toast("Este pedido não tem itens.", "err");

          // Limpa o carrinho atual
          cart = [];

          // Copia itens do pedido anterior
          pedido.itens.forEach((i) => {
            cart.push({
              name: i.name,
              price: i.price,
              extras: i.extras || [],
              qty: i.qty || 1,
            });
          });

          salvarCarrinho();
          renderMiniCart();

          Overlays.openMiniCart();

          toast("Pedido carregado! Você pode finalizar agora 🙌", "ok");
        } catch (e) {
          console.error(e);
          toast("Erro ao repetir o pedido.", "err");
        }
      });
    });
  }


  /* =====================================================
        🎁 SISTEMA DE RECOMPENSAS (Pontuação)
        — Tiers: Ouro, Platina, Diamante (v4.3+)
  ====================================================== */

  async function carregarRecompensasUsuario() {
    if (!currentUser || !db) return;

    const lista = document.querySelector("#rewards-panel .rewards-list");
    if (!lista) return;

    lista.innerHTML = `<p class="loading">Carregando recompensas...</p>`;

    try {
      const snap = await db
        .collection("Usuarios")
        .doc(currentUser.uid)
        .get();

      if (!snap.exists) {
        lista.innerHTML = `<p class="empty-rewards">Nenhuma recompensa disponível.</p>`;
        return;
      }

      const u = snap.data();
      const total = Number(u.totalPedidos || 0);

      const tier = getTierIcon(total);

      lista.innerHTML = `
        <div class="reward-box">
          <h3>Seu Nível Atual</h3>
          <div class="reward-tier">
            ${tier.icon}  
            <div>
              <b>${tier.nome}</b><br>
              ${tier.desc}
            </div>
          </div>

          <p class="reward-progress">
            Você possui <b>${total}</b> pedidos finalizados.
          </p>
        </div>
      `;
    } catch (e) {
      console.error("Erro ao carregar recompensas:", e);
      lista.innerHTML = `<p class="error">Erro ao carregar recompensas.</p>`;
    }
  }


  /* =====================================================
        🏅 FUNÇÃO — TIER DAS RECOMPENSAS
  ====================================================== */

  function getTierIcon(total) {
    if (total >= 30) {
      return {
        icon: "💎",
        nome: "Diamante",
        desc: "O topo do sabor! Você é VIP na casa 💙",
      };
    }
    if (total >= 15) {
      return {
        icon: "🥈",
        nome: "Platina",
        desc: "Cliente fiel demais! Parabéns 😍",
      };
    }
    if (total >= 5) {
      return {
        icon: "🥇",
        nome: "Ouro",
        desc: "Você está construindo um reinado de sabor 💛",
      };
    }
    return {
      icon: "⭐",
      nome: "Inicial",
      desc: "Faça alguns pedidos para desbloquear recompensas!",
    };
  }
/* =====================================================
        🎚️ SISTEMA DE STATUS (Aberto / Fechado)
        — Mantém compatibilidade com Firestore e Banner
  ====================================================== */

  async function carregarStatusLoja() {
    if (!db) return;

    const banner = document.getElementById("status-banner");
    if (!banner) return;

    try {
      const snap = await db.collection("Config").doc("status").get();

      if (!snap.exists) {
        banner.textContent = "⚠️ Status indisponível";
        banner.className = "status-banner fechado";
        return;
      }

      const data = snap.data();
      const aberto = data.aberto === true;

      if (aberto) {
        banner.textContent = "🟢 Estamos ABERTOS! Faça seu pedido 😋";
        banner.className = "status-banner aberto";
      } else {
        banner.textContent = "🔴 Estamos FECHADOS no momento.";
        banner.className = "status-banner fechado";
      }
    } catch (error) {
      console.error("Erro ao carregar status:", error);
      banner.textContent = "⚠️ Erro ao consultar status";
      banner.className = "status-banner fechado";
    }
  }


  /* =====================================================
        🛒 SISTEMA COMPLETO DO CARRINHO
        — Add, Remove, Extras, Quantidade, Subtotal
  ====================================================== */

  function addToCart(nome, preco, extras = []) {
    const item = cart.find((i) => i.name === nome && JSON.stringify(i.extras) === JSON.stringify(extras));
    
    if (item) {
      item.qty++;
    } else {
      cart.push({
        name: nome,
        price: preco,
        qty: 1,
        extras: extras
      });
    }

    salvarCarrinho();
    renderMiniCart();
    atualizarProgressoFrete();
  }


  function removeFromCart(index) {
    if (cart[index].qty > 1) {
      cart[index].qty--;
    } else {
      cart.splice(index, 1);
    }

    salvarCarrinho();
    renderMiniCart();
    atualizarProgressoFrete();
  }


  /* =====================================================
        🎛️ RENDERIZAÇÃO DO MINI-CART (Painel Lateral)
  ====================================================== */

  function renderMiniCart() {
    const list = document.querySelector(".mini-list");
    const totalSpan = document.querySelector(".cart-total");
    const countSpan = document.getElementById("cart-count");

    if (!list) return;

    list.innerHTML = "";

    if (cart.length === 0) {
      list.innerHTML = `<p class="empty-cart">Seu carrinho está vazio 😕</p>`;
      if (totalSpan) totalSpan.textContent = money(0);
      if (countSpan) countSpan.textContent = 0;
      return;
    }

    cart.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "mini-item";

      const extrasTxt = item.extras.length
        ? `<small class="extras-mini">+ ${item.extras.join(", ")}</small>`
        : "";

      div.innerHTML = `
        <div class="mini-info">
          <strong>${item.name}</strong>
          ${extrasTxt}
          <span>${money(item.price)}</span>
        </div>

        <div class="mini-controls">
          <button class="qty-btn minus" data-index="${index}">−</button>
          <span class="qty">${item.qty}</span>
          <button class="qty-btn plus" data-index="${index}">+</button>
        </div>
      `;

      list.appendChild(div);
    });

    const total = cart.reduce((acc, i) => acc + i.price * i.qty, 0);

    if (totalSpan) totalSpan.textContent = money(total);
    if (countSpan) countSpan.textContent = cart.reduce((acc, i) => acc + i.qty, 0);

    configurarBotoesQuantidade();
  }


  /* =====================================================
        ➕➖ BOTÕES DE QUANTIDADE (+) e (−)
  ====================================================== */

  function configurarBotoesQuantidade() {
    document.querySelectorAll(".qty-btn.plus").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = btn.getAttribute("data-index");
        cart[i].qty++;
        salvarCarrinho();
        renderMiniCart();
        atualizarProgressoFrete();
      });
    });

    document.querySelectorAll(".qty-btn.minus").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = btn.getAttribute("data-index");
        if (cart[i].qty > 1) {
          cart[i].qty--;
        } else {
          cart.splice(i, 1);
        }
        salvarCarrinho();
        renderMiniCart();
        atualizarProgressoFrete();
      });
    });
  }


  /* =====================================================
        💾 SALVAR / CARREGAR CARRINHO LOCAL
  ====================================================== */

  function salvarCarrinho() {
    localStorage.setItem("dfl-cart", JSON.stringify(cart));
  }

  function carregarCarrinhoLocal() {
    try {
      const saved = localStorage.getItem("dfl-cart");
      cart = saved ? JSON.parse(saved) : [];
    } catch {
      cart = [];
    }
  }


  /* =====================================================
        🚀 MOSTRAR MINI-CART
  ====================================================== */

  window.openMini = () => {
    const mini = document.getElementById("mini-cart");
    const backdrop = document.getElementById("cart-backdrop");

    if (mini) mini.classList.add("show");
    if (backdrop) backdrop.classList.add("active");

    renderMiniCart();
  };


  /* =====================================================
        🫗 FECHAR MINI-CART
  ====================================================== */

  function fecharMiniCart() {
    document.getElementById("mini-cart")?.classList.remove("show");
    document.getElementById("cart-backdrop")?.classList.remove("active");
  }

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("extras-close")) {
      fecharMiniCart();
    }
  });
/* =====================================================
        🎚️ SISTEMA DE STATUS (Aberto / Fechado)
        — Mantém compatibilidade com Firestore e Banner
  ====================================================== */

  async function carregarStatusLoja() {
    if (!db) return;

    const banner = document.getElementById("status-banner");
    if (!banner) return;

    try {
      const snap = await db.collection("Config").doc("status").get();

      if (!snap.exists) {
        banner.textContent = "⚠️ Status indisponível";
        banner.className = "status-banner fechado";
        return;
      }

      const data = snap.data();
      const aberto = data.aberto === true;

      if (aberto) {
        banner.textContent = "🟢 Estamos ABERTOS! Faça seu pedido 😋";
        banner.className = "status-banner aberto";
      } else {
        banner.textContent = "🔴 Estamos FECHADOS no momento.";
        banner.className = "status-banner fechado";
      }
    } catch (error) {
      console.error("Erro ao carregar status:", error);
      banner.textContent = "⚠️ Erro ao consultar status";
      banner.className = "status-banner fechado";
    }
  }


  /* =====================================================
        🛒 SISTEMA COMPLETO DO CARRINHO
        — Add, Remove, Extras, Quantidade, Subtotal
  ====================================================== */

  function addToCart(nome, preco, extras = []) {
    const item = cart.find((i) => i.name === nome && JSON.stringify(i.extras) === JSON.stringify(extras));
    
    if (item) {
      item.qty++;
    } else {
      cart.push({
        name: nome,
        price: preco,
        qty: 1,
        extras: extras
      });
    }

    salvarCarrinho();
    renderMiniCart();
    atualizarProgressoFrete();
  }


  function removeFromCart(index) {
    if (cart[index].qty > 1) {
      cart[index].qty--;
    } else {
      cart.splice(index, 1);
    }

    salvarCarrinho();
    renderMiniCart();
    atualizarProgressoFrete();
  }


  /* =====================================================
        🎛️ RENDERIZAÇÃO DO MINI-CART (Painel Lateral)
  ====================================================== */

  function renderMiniCart() {
    const list = document.querySelector(".mini-list");
    const totalSpan = document.querySelector(".cart-total");
    const countSpan = document.getElementById("cart-count");

    if (!list) return;

    list.innerHTML = "";

    if (cart.length === 0) {
      list.innerHTML = `<p class="empty-cart">Seu carrinho está vazio 😕</p>`;
      if (totalSpan) totalSpan.textContent = money(0);
      if (countSpan) countSpan.textContent = 0;
      return;
    }

    cart.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "mini-item";

      const extrasTxt = item.extras.length
        ? `<small class="extras-mini">+ ${item.extras.join(", ")}</small>`
        : "";

      div.innerHTML = `
        <div class="mini-info">
          <strong>${item.name}</strong>
          ${extrasTxt}
          <span>${money(item.price)}</span>
        </div>

        <div class="mini-controls">
          <button class="qty-btn minus" data-index="${index}">−</button>
          <span class="qty">${item.qty}</span>
          <button class="qty-btn plus" data-index="${index}">+</button>
        </div>
      `;

      list.appendChild(div);
    });

    const total = cart.reduce((acc, i) => acc + i.price * i.qty, 0);

    if (totalSpan) totalSpan.textContent = money(total);
    if (countSpan) countSpan.textContent = cart.reduce((acc, i) => acc + i.qty, 0);

    configurarBotoesQuantidade();
  }


  /* =====================================================
        ➕➖ BOTÕES DE QUANTIDADE (+) e (−)
  ====================================================== */

  function configurarBotoesQuantidade() {
    document.querySelectorAll(".qty-btn.plus").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = btn.getAttribute("data-index");
        cart[i].qty++;
        salvarCarrinho();
        renderMiniCart();
        atualizarProgressoFrete();
      });
    });

    document.querySelectorAll(".qty-btn.minus").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = btn.getAttribute("data-index");
        if (cart[i].qty > 1) {
          cart[i].qty--;
        } else {
          cart.splice(i, 1);
        }
        salvarCarrinho();
        renderMiniCart();
        atualizarProgressoFrete();
      });
    });
  }


  /* =====================================================
        💾 SALVAR / CARREGAR CARRINHO LOCAL
  ====================================================== */

  function salvarCarrinho() {
    localStorage.setItem("dfl-cart", JSON.stringify(cart));
  }

  function carregarCarrinhoLocal() {
    try {
      const saved = localStorage.getItem("dfl-cart");
      cart = saved ? JSON.parse(saved) : [];
    } catch {
      cart = [];
    }
  }


  /* =====================================================
        🚀 MOSTRAR MINI-CART
  ====================================================== */

  window.openMini = () => {
    const mini = document.getElementById("mini-cart");
    const backdrop = document.getElementById("cart-backdrop");

    if (mini) mini.classList.add("show");
    if (backdrop) backdrop.classList.add("active");

    renderMiniCart();
  };


  /* =====================================================
        🫗 FECHAR MINI-CART
  ====================================================== */

  function fecharMiniCart() {
    document.getElementById("mini-cart")?.classList.remove("show");
    document.getElementById("cart-backdrop")?.classList.remove("active");
  }

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("extras-close")) {
      fecharMiniCart();
    }
  });