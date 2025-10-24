// ==================================================
// DFL v1.4.2 — Reparo total (botões, combos, adicionais, login, pedidos)
// ==================================================
document.addEventListener("DOMContentLoaded", () => {

  /* ===============================
     🔧 CONFIGURAÇÃO INICIAL
  =============================== */
  const sound = new Audio("click.wav");
  let cart = [];
  let currentUser = null;

  const money = n => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;
  document.addEventListener("click", () => { try { sound.currentTime = 0; sound.play(); } catch (_) {} });

  const cartCount    = document.getElementById("cart-count");
  const miniCart     = document.getElementById("mini-cart");
  const cartBackdrop = document.getElementById("cart-backdrop");
  const extrasModal  = document.getElementById("extras-modal");
  const extrasList   = document.getElementById("extras-list");
  const extrasAdd    = document.getElementById("extras-add");
  const loginModal   = document.getElementById("login-modal");

  /* ===============================
     🕒 STATUS DE FUNCIONAMENTO
  =============================== */
  function atualizarStatus() {
    const banner = document.getElementById("status-banner");
    if (!banner) return;
    const agora = new Date();
    const dia = agora.getDay();
    const hora = agora.getHours();
    const minuto = agora.getMinutes();
    let aberto = false;
    let proximaAbertura = "";

    if (dia >= 1 && dia <= 4) {
      aberto = hora >= 18 && (hora < 23 || (hora === 23 && minuto <= 15));
      proximaAbertura = "às 18h";
    } else if (dia === 5 || dia === 6 || dia === 0) {
      aberto = hora >= 17 && (hora < 23 || (hora === 23 && minuto <= 30));
      proximaAbertura = "às 17h";
    }

    if (aberto) {
      banner.textContent = "✅ Estamos abertos! Faça seu pedido 🍔";
      banner.style.background = "#00c853";
    } else {
      banner.textContent = `⏰ Fechado no momento — abriremos ${proximaAbertura}`;
      banner.style.background = "#ff3d00";
    }
  }
  setInterval(atualizarStatus, 60000);
  atualizarStatus();

  /* ===============================
     ⏳ CONTAGEM REGRESSIVA
  =============================== */
  function atualizarTimer() {
    const box1 = document.getElementById("timer");
    const box2 = document.getElementById("promo-timer");
    if (!box1 && !box2) return;
    const agora = new Date();
    const fim = new Date();
    fim.setHours(23, 59, 59, 999);
    const diff = fim - agora;
    const texto = diff <= 0
      ? "00:00:00"
      : (() => {
          const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
          const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
          const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
          return `${h}:${m}:${s}`;
        })();
    if (box1) box1.textContent = texto;
    if (box2) box2.textContent = texto;
  }
  setInterval(atualizarTimer, 1000);
  atualizarTimer();

  /* ===============================
     🛒 CARRINHO
  =============================== */
  function renderMiniCart() {
    const lista = document.querySelector(".mini-list");
    const foot  = document.querySelector(".mini-foot");
    if (!lista || !foot) return;

    lista.innerHTML = "";
    let total = 0;

    if (!cart.length) {
      lista.innerHTML = `<p class="empty-cart">Seu carrinho está vazio 😢</p>`;
    } else {
      cart.forEach((item, i) => {
        total += item.preco * item.qtd;
        const li = document.createElement("div");
        li.className = "cart-item";
        li.innerHTML = `
          <span>${item.nome} x${item.qtd}</span>
          <strong>${money(item.preco * item.qtd)}</strong>
          <div>
            <button class="qty-dec" data-i="${i}">−</button>
            <button class="qty-inc" data-i="${i}">+</button>
            <button class="remove-item" data-i="${i}">🗑</button>
          </div>`;
        lista.appendChild(li);
      });

      lista.querySelectorAll(".qty-inc").forEach(b =>
        b.addEventListener("click", e => {
          const i = +e.currentTarget.dataset.i;
          cart[i].qtd++;
          renderMiniCart();
          updateCartCount();
        })
      );
      lista.querySelectorAll(".qty-dec").forEach(b =>
        b.addEventListener("click", e => {
          const i = +e.currentTarget.dataset.i;
          cart[i].qtd = Math.max(1, cart[i].qtd - 1);
          renderMiniCart();
          updateCartCount();
        })
      );
      lista.querySelectorAll(".remove-item").forEach(b =>
        b.addEventListener("click", e => {
          cart.splice(+e.currentTarget.dataset.i, 1);
          renderMiniCart();
          updateCartCount();
        })
      );
    }

    foot.innerHTML = `
      <button id="close-order" class="btn-primary">Fechar Pedido (${money(total)})</button>
      <button id="clear-cart" class="btn-secondary">Limpar</button>
    `;
    document.getElementById("clear-cart")?.addEventListener("click", () => {
      cart = [];
      renderMiniCart();
      updateCartCount();
    });
    document.getElementById("close-order")?.addEventListener("click", fecharPedido);

    updateCartCount();
  }

  function updateCartCount() {
    const q = cart.reduce((a, i) => a + i.qtd, 0);
    if (cartCount) cartCount.textContent = q;
  }

  const openCartBtn = document.getElementById("cart-icon");
  openCartBtn?.addEventListener("click", () => {
    miniCart?.classList.toggle("active");
    cartBackdrop?.classList.toggle("show");
    document.body.classList.toggle("no-scroll");
    renderMiniCart();
  });
  cartBackdrop?.addEventListener("click", () => {
    miniCart?.classList.remove("active");
    cartBackdrop?.classList.remove("show");
    document.body.classList.remove("no-scroll");
  });
  document.querySelector("#mini-cart .extras-close")?.addEventListener("click", () => {
    miniCart?.classList.remove("active");
    cartBackdrop?.classList.remove("show");
    document.body.classList.remove("no-scroll");
  });

  /* ===============================
     ⚙️ ADICIONAIS (lanches)
  =============================== */
  const adicionais = [
    { nome: "Cebola", preco: 0.99 },
    { nome: "Salada", preco: 1.99 },
    { nome: "Ovo", preco: 1.99 },
    { nome: "Bacon", preco: 2.99 },
    { nome: "Hambúrguer Tradicional 56g", preco: 2.99 },
    { nome: "Cheddar Cremoso", preco: 3.99 },
    { nome: "Filé de Frango", preco: 5.99 },
    { nome: "Hambúrguer Artesanal 120g", preco: 7.99 }
  ];

  document.querySelectorAll(".extras-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const card = e.currentTarget.closest(".card");
      if (!card || !extrasModal || !extrasList) return;
      const produto = card.dataset.name || "Produto";
      extrasModal.dataset.produto = produto;
      extrasList.innerHTML = adicionais.map((a, i) => `
        <label>
          <span>${a.nome} — ${money(a.preco)}</span>
          <input type="checkbox" value="${i}">
        </label>`).join("");
      extrasModal.classList.add("show");
      document.body.classList.add("no-scroll");
    });
  });

  document.querySelectorAll(".extras-close").forEach(btn => {
    btn.addEventListener("click", () => {
      extrasModal?.classList.remove("show");
      document.body.classList.remove("no-scroll");
    });
  });

  extrasAdd?.addEventListener("click", () => {
    if (!extrasModal) return;
    const produto = extrasModal.dataset.produto || "Produto";
    const selecionados = [...(extrasList?.querySelectorAll("input:checked") || [])];
    selecionados.forEach(c => {
      const extra = adicionais[Number(c.value)];
      cart.push({ nome: `${produto} + ${extra.nome}`, preco: extra.preco, qtd: 1 });
    });
    extrasModal.classList.remove("show");
    document.body.classList.remove("no-scroll");
    renderMiniCart();
  });

  /* ===============================
     🥤 ADICIONAIS (refrigerantes dos COMBOS)
  =============================== */
  const comboDrinkOptions = {
    casal: [
      { rotulo: "Fanta 1L (padrão)", delta: 0.01 },
      { rotulo: "Coca 1L", delta: 3.01 },
      { rotulo: "Coca 1L Zero", delta: 3.01 },
    ],
    familia: [
      { rotulo: "Kuat 2L (padrão)", delta: 0.01 },
      { rotulo: "Coca 2L", delta: 5.01 },
    ],
  };

  // Cria modal de combos se não existir
  let comboModal = document.getElementById("combo-modal");
  if (!comboModal) {
    comboModal = document.createElement("div");
    comboModal.id = "combo-modal";
    comboModal.className = "modal";
    comboModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-head">
          <h3>Escolher Refrigerante</h3>
          <button class="combo-close">✖</button>
        </div>
        <div id="combo-body"></div>
        <div class="modal-foot">
          <button id="combo-confirm" class="btn-primary">Confirmar</button>
          <button class="combo-close btn-secondary">Cancelar</button>
        </div>
      </div>`;
    document.body.appendChild(comboModal);
  }
  const comboBody = comboModal.querySelector("#combo-body");
  const comboConfirm = comboModal.querySelector("#combo-confirm");
  comboModal.querySelectorAll(".combo-close").forEach(btn =>
    btn.addEventListener("click", () => {
      comboModal.classList.remove("show");
      document.body.classList.remove("no-scroll");
    })
  );

  let comboContext = null;
  function openComboModal(nomeCombo, precoBase) {
    const nome = nomeCombo.toLowerCase();
    const grupo =
      nome.includes("casal") ? "casal" :
      (nome.includes("família") || nome.includes("familia")) ? "familia" : null;

    if (!grupo) {
      addCommonItem(nomeCombo, precoBase);
      return;
    }

    const opts = comboDrinkOptions[grupo];
    comboBody.innerHTML = opts.map((o, idx) => `
      <label>
        <span>${o.rotulo} — + ${money(o.delta)}</span>
        <input type="radio" name="combo-drink" value="${idx}" ${idx === 0 ? "checked" : ""}>
      </label>`).join("");
    comboContext = { nomeCombo, precoBase, grupo };
    comboModal.classList.add("show");
    document.body.classList.add("no-scroll");
  }
/* ===============================
     ✅ CONFIRMAR COMBO SELECIONADO
  =============================== */
  comboConfirm.addEventListener("click", () => {
    const sel = comboBody.querySelector('input[name="combo-drink"]:checked');
    if (!comboContext || !sel) return;
    const { nomeCombo, precoBase, grupo } = comboContext;
    const opt = comboDrinkOptions[grupo][Number(sel.value)];
    const finalName = `${nomeCombo} + ${opt.rotulo}`;
    const finalPrice = Number(precoBase) + (opt.delta || 0);
    cart.push({ nome: finalName, preco: finalPrice, qtd: 1 });
    popupAdd(`${finalName} adicionado!`);
    comboModal.classList.remove("show");
    document.body.classList.remove("no-scroll");
    renderMiniCart();
  });

  /* ===============================
     ➕ ADICIONAR AO CARRINHO
  =============================== */
  function addCommonItem(nome, preco) {
    const found = cart.find(i => i.nome === nome && i.preco === preco);
    if (found) found.qtd++;
    else cart.push({ nome, preco, qtd: 1 });
    renderMiniCart();
    popupAdd(`${nome} adicionado!`);
  }

  document.querySelectorAll(".add-cart").forEach(btn => {
    btn.addEventListener("click", e => {
      const card = e.currentTarget.closest(".card");
      if (!card) return;
      const nome = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";
      const preco = parseFloat(card.dataset.price || "0");

      // Detecta se é combo
      if (/^combo/i.test(nome)) openComboModal(nome, preco);
      else addCommonItem(nome, preco);
    });
  });

  /* ===============================
     🖼️ CARROSSEL
  =============================== */
  const slides = document.querySelector(".slides");
  document.querySelector(".c-prev")?.addEventListener("click", () => {
    if (slides) slides.scrollLeft -= 320;
  });
  document.querySelector(".c-next")?.addEventListener("click", () => {
    if (slides) slides.scrollLeft += 320;
  });
  document.querySelectorAll(".slide").forEach(img => {
    img.addEventListener("click", () => {
      const msg = encodeURIComponent(img.dataset.wa || "");
      if (msg) window.open(`https://wa.me/5534997178336?text=${msg}`, "_blank");
    });
  });

  /* ===============================
     🔥 FIREBASE + LOGIN
  =============================== */
  const firebaseConfig = {
    apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
    authDomain: "da-familia-lanches.firebaseapp.com",
    projectId: "da-familia-lanches",
    storageBucket: "da-familia-lanches.appspot.com",
    messagingSenderId: "106857147317",
    appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
    measurementId: "G-TCZ18HFWGX"
  };
  if (window.firebase && !firebase.apps.length) firebase.initializeApp(firebaseConfig);

  const auth = firebase.auth();
  const db = firebase.firestore();

  /* ===============================
     👤 LOGIN / CADASTRO
  =============================== */
  const userBtn = document.createElement("button");
  userBtn.id = "user-btn";
  userBtn.className = "user-button";
  userBtn.textContent = "Entrar / Cadastrar";
  document.querySelector(".header")?.appendChild(userBtn);

  userBtn.addEventListener("click", () => {
    loginModal?.classList.add("show");
    document.body.classList.add("no-scroll");
  });
  document.querySelector(".login-x")?.addEventListener("click", () => {
    loginModal?.classList.remove("show");
    document.body.classList.remove("no-scroll");
  });

  // Login com e-mail/senha
  document.querySelector(".btn-primario")?.addEventListener("click", () => {
    const email = document.getElementById("login-email")?.value?.trim();
    const senha = document.getElementById("login-senha")?.value?.trim();
    if (!email || !senha) return alert("Preencha e-mail e senha.");

    auth.signInWithEmailAndPassword(email, senha)
      .then(cred => {
        currentUser = cred.user;
        userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
        loginModal?.classList.remove("show");
        document.body.classList.remove("no-scroll");
        showOrdersFabIfLogged();
      })
      .catch(() => {
        auth.createUserWithEmailAndPassword(email, senha)
          .then(cred => {
            currentUser = cred.user;
            userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
            loginModal?.classList.remove("show");
            document.body.classList.remove("no-scroll");
            alert("Conta criada com sucesso! 🎉");
            showOrdersFabIfLogged();
          })
          .catch(err => alert("Erro: " + err.message));
      });
  });

  // Login com Google
  document.querySelector(".btn-google")?.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(result => {
        currentUser = result.user;
        userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0] || "Cliente"}`;
        loginModal?.classList.remove("show");
        document.body.classList.remove("no-scroll");
        showOrdersFabIfLogged();
      })
      .catch(err => alert("Erro no login com Google: " + err.message));
  });

  auth.onAuthStateChanged(user => {
    if (user) {
      currentUser = user;
      userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
      showOrdersFabIfLogged();
    }
  });
/* ===============================
     📦 FECHAR PEDIDO (Firestore)
  =============================== */
  function fecharPedido() {
    if (!cart.length) return alert("Carrinho vazio!");
    if (!currentUser) {
      alert("Você precisa estar logado para enviar o pedido!");
      loginModal?.classList.add("show");
      document.body.classList.add("no-scroll");
      return;
    }

    const total = cart.reduce((a, i) => a + i.preco * i.qtd, 0);
    const pedido = {
      usuario: currentUser.email,
      userId: currentUser.uid,
      nome: currentUser.displayName || currentUser.email.split("@")[0],
      itens: cart.map(i => `${i.nome} x${i.qtd}`),
      total: Number(total.toFixed(2)),
      data: new Date().toISOString(),
    };

    db.collection("Pedidos").add(pedido).then(() => {
      alert("Pedido salvo com sucesso ✅");
      const texto = encodeURIComponent(
        "🍔 *Pedido DFL*\n" +
        cart.map(i => `• ${i.nome} x${i.qtd}`).join("\n") +
        `\n\nTotal: ${money(total)}`
      );
      window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");
      cart = [];
      renderMiniCart();
    }).catch(err => alert("Erro ao salvar pedido: " + err.message));
  }

  /* ===============================
     🧾 MEUS PEDIDOS
  =============================== */
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

  document.querySelector(".orders-close")?.addEventListener("click", () => {
    ordersPanel.classList.remove("active");
  });

  ordersFab.addEventListener("click", () => {
    if (!currentUser) return alert("Faça login para ver seus pedidos.");
    ordersPanel.classList.add("active");
    carregarPedidos();
  });

  function showOrdersFabIfLogged() {
    if (currentUser) ordersFab.classList.add("show");
    else ordersFab.classList.remove("show");
  }

  function carregarPedidos() {
    const container = document.getElementById("orders-content");
    if (!container) return;
    container.innerHTML = `<p class="empty-orders">Carregando pedidos...</p>`;

    db.collection("Pedidos")
      .where("usuario", "==", currentUser.email)
      .orderBy("data", "desc")
      .get()
      .then(snap => {
        if (snap.empty) {
          container.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado 😢</p>`;
          return;
        }

        container.innerHTML = "";
        snap.forEach(doc => {
          const p = doc.data();
          const itens = Array.isArray(p.itens) ? p.itens.join(", ") : (p.itens || "");
          const box = document.createElement("div");
          box.className = "order-item";
          box.innerHTML = `
            <h4>${new Date(p.data).toLocaleString("pt-BR")}</h4>
            <p><b>Itens:</b> ${itens}</p>
            <p><b>Total:</b> ${money(p.total)}</p>`;
          container.appendChild(box);
        });
      })
      .catch(err => {
        container.innerHTML = `<p class="empty-orders">Erro ao carregar pedidos: ${err.message}</p>`;
      });
  }

  /* ===============================
     🔔 POPUP “Item Adicionado”
  =============================== */
  function popupAdd(msg) {
    const pop = document.createElement("div");
    pop.className = "popup-add";
    pop.textContent = msg;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 1400);
  }

  /* ===============================
     ✅ FINALIZAÇÃO
  =============================== */
  console.log("✅ DFL v1.4.2 – script.js carregado e estável");
});