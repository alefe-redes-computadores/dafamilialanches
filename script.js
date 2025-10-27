/* =========================================================
   🍔 DFL v2.2 — ESTÁVEL FINAL (Login Seguro + Admin Pro)
   - Corrige bug de login com senha incorreta
   - Corrige erro split() no painel admin
   - Corrige erro total.toFixed() (tratamento numérico)
   - Adiciona agrupamento diário e filtros
   - Mantém compatibilidade total com v2.1
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------ ⚙️ BASE ------------------ */
  const sound = new Audio("click.wav");
  let cart = [];
  let currentUser = null;

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

  /* ------------------ 🛒 MINI-CARRINHO ------------------ */
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

    const total = cart.reduce((s, i) => s + i.preco * i.qtd, 0);
    el.miniFoot.innerHTML = `
      <div style="padding:15px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:15px;font-size:1.2rem;font-weight:600;">
          <span>Total:</span><span style="color:#e53935;">${money(total)}</span>
        </div>
        <button id="finish-order" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;margin-bottom:8px;">Finalizar Pedido 🛍️</button>
        <button id="clear-cart" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:8px;padding:10px;font-weight:600;cursor:pointer;">Limpar Carrinho</button>
      </div>`;
  }

  // 🔧 rebind de botões para evitar bugs após render
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

    document.getElementById("finish-order")?.addEventListener("click", fecharPedido);
    document.getElementById("clear-cart")?.addEventListener("click", () => {
      if (confirm("Limpar todo o carrinho?")) {
        cart = [];
        renderMiniCart();
        popupAdd("Carrinho limpo!");
      }
    });
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

  // ✅ Login seguro (sem criar conta automaticamente)
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
                popupAdd("Conta criada com sucesso!");
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
        popupAdd("Login com Google!");
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

  /* ------------------ 🖼️ Carrossel ------------------ */
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

  /* ------------------ 💾 Fechar pedido ------------------ */
  function fecharPedido() {
    if (!cart.length) return alert("Carrinho vazio!");
    if (!currentUser) {
      alert("Faça login para enviar o pedido!");
      Overlays.open(el.loginModal);
      return;
    }

    const total = cart.reduce((a, i) => a + i.preco * i.qtd, 0);
    const pedido = {
      usuario: currentUser.email,
      userId: currentUser.uid,
      nome: currentUser.displayName || currentUser.email.split("@")[0],
      itens: cart.map((i) => `${i.nome} x${i.qtd}`),
      total: Number(total.toFixed(2)),
      data: new Date().toISOString(),
    };

    db.collection("Pedidos")
      .add(pedido)
      .then(() => {
        popupAdd("Pedido salvo ✅");
        const texto = encodeURIComponent(
          "🍔 *Pedido DFL*\n" +
          cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n") +
          `\n\n*Total: ${money(total)}*`
        );
        window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");
        cart = [];
        renderMiniCart();
        Overlays.closeAll();
      })
      .catch((err) => alert("Erro: " + err.message));
  }
/* ------------------ 📦 Meus Pedidos (UI) ------------------ */
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

  /* ------------------ 📦 Meus Pedidos (lógica) ------------------ */
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
          <p style="margin:8px 0;"><b>Itens:</b><br>• ${itens}</p>
          <p style="font-size:1.1rem;color:#4caf50;font-weight:600;margin-top:8px;">
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

  /* ------------------ ⎋ ESC + Clique-fora ------------------ */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") Overlays.closeAll();
  });

  document.addEventListener("click", (e) => {
    const aberto = document.querySelector(".modal.show, #mini-cart.active, .orders-panel.active, #admin-dashboard.show");
    if (!aberto) return;
    if (e.target.closest(".modal-content, #mini-cart, .orders-panel")) return; // clique interno
    if (e.target.closest("#cart-icon, .add-cart, .extras-btn, .user-button, #orders-fab, #admin-fab")) return; // botões que abrem
    Overlays.closeAll();
  });

  /* ------------------ INIT (parte final do app) ------------------ */
  renderMiniCart();
  showOrdersFabIfLogged();
  console.log("%c🔥 DFL v2.2 — ESTÁVEL (App pronto)", "color:#fff;background:#4caf50;padding:6px 10px;border-radius:8px;font-weight:700");


  /* =========================================================
     📊 DFL v2.2 — Painel Administrativo PRO
     - Filtros 7/30/todos
     - Agrupa por dia
     - Corrige .split em dados vazios
  ========================================================= */

  const ADMINS = [
    "alefejohsefe@gmail.com",
    "kalebhstanley650@gmail.com",
    "contato@dafamilialanches.com.br"
  ];

  function isAdmin(user) {
    return user && user.email && ADMINS.includes(user.email.toLowerCase());
  }

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
      bottom: "210px",
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

  function gerarResumoECharts(pedidos) {
    if (!window.Chart) return;

    const total = pedidos.reduce((s, p) => s + (Number(p.total) || 0), 0);
    const ticket = pedidos.length ? total / pedidos.length : 0;

    const elTotal = document.getElementById("card-total");
    const elQtd   = document.getElementById("card-pedidos");
    const elTick  = document.getElementById("card-ticket");
    if (elTotal) elTotal.textContent = `Total Arrecadado: R$ ${total.toFixed(2).replace('.', ',')}`;
    if (elQtd)   elQtd.textContent   = `Pedidos: ${pedidos.length}`;
    if (elTick)  elTick.textContent  = `Ticket Médio: R$ ${ticket.toFixed(2).replace('.', ',')}`;

    // grafico por dia
    const porDia = {};
    pedidos.forEach(p => {
      const iso = typeof p.data === "string" ? p.data : (p.data?.toDate?.() ? p.data.toDate().toISOString() : "");
      const dia = iso ? iso.split("T")[0] : "—";
      porDia[dia] = (porDia[dia] || 0) + (Number(p.total) || 0);
    });
    const dias = Object.keys(porDia).sort();
    const valores = dias.map(d => porDia[d]);

    const ctx1 = document.getElementById("chart-pedidos");
    if (ctx1) {
      new Chart(ctx1, {
        type: "line",
        data: { labels: dias, datasets: [{ label: "Total por Dia", data: valores, borderColor: "#4caf50", fill: false }] },
        options: { responsive: true, interaction: { mode: 'index' }, scales: { y: { beginAtZero: true } } }
      });
    }

    // produtos mais vendidos (contagem)
    const produtos = {};
    pedidos.forEach(p => {
      const itensArr = Array.isArray(p.itens) ? p.itens : (typeof p.itens === "string" ? p.itens.split("; ") : []);
      itensArr.forEach(i => {
        const nome = (i && i.split(" x")[0]) ? i.split(" x")[0].trim() : "Item";
        produtos[nome] = (produtos[nome] || 0) + 1;
      });
    });
    const top = Object.entries(produtos).sort((a, b) => b[1] - a[1]).slice(0, 8);

    const ctx2 = document.getElementById("chart-produtos");
    if (ctx2) {
      new Chart(ctx2, {
        type: "bar",
        data: { labels: top.map(t => t[0]), datasets: [{ label: "Itens mais vendidos", data: top.map(t => t[1]), backgroundColor: "#ffb300" }] },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }

    // exportar CSV
    const btnCSV = document.getElementById("export-csv");
    if (btnCSV) {
      btnCSV.onclick = () => {
        const linhas = ["Data,Total,Itens"];
        pedidos.forEach(p => {
          const iso = typeof p.data === "string" ? p.data : (p.data?.toDate?.() ? p.data.toDate().toISOString() : "");
          const itens = Array.isArray(p.itens) ? p.itens.join("; ") : (p.itens || "");
          linhas.push(`${iso},${Number(p.total) || 0},"${itens.replaceAll('"', '""')}"`);
        });
        const blob = new Blob([linhas.join("\n")], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "pedidos_dfl.csv";
        link.click();
      };
    }
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
      .then(snap => {
        const pedidos = snap.docs.map(d => d.data());
        const filtrados = pedidos.filter(p => {
          const dt = typeof p.data === "string" ? new Date(p.data) :
                     (p.data?.toDate?.() ? p.data.toDate() : new Date(0));
          return periodo === "all" || (dt >= start);
        });
        gerarResumoECharts(filtrados);
      })
      .catch(err => alert("Erro ao carregar relatórios: " + err.message));

    // rebind seguro do filtro
    const sel = document.getElementById("filter-period");
    if (sel && !sel._bound) {
      sel.addEventListener("change", e => carregarRelatorios(e.target.value));
      sel._bound = true;
    }
  }

  // cria/remove botão admin conforme login
  auth.onAuthStateChanged(user => {
    const fab = document.getElementById("admin-fab");
    if (user && isAdmin(user)) {
      if (!fab) createAdminFab();
    } else {
      fab?.remove();
      document.getElementById("admin-dashboard")?.remove();
    }
  });

  /* ------------------ Logs e segurança final ------------------ */
  // Evita estado zombie ao voltar do cache
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      console.warn("↻ Página reaberta via cache, recarregando...");
      location.reload();
    }
  });

  // Sinalização para e-mails do domínio admin
  auth.onAuthStateChanged((user) => {
    if (user?.email?.toLowerCase()?.includes("dafamilialanches.com.br")) {
      console.log("%c👑 Painel Admin ativo", "color:#ffb300;font-weight:700;");
    }
  });

  // Handler global de erros (evita travar UI)
  window.addEventListener("error", (e) => {
    if (String(e?.message || "").toLowerCase().includes("split")) {
      popupAdd("Humm… houve um pequeno erro ao ler dados. Atualize a página.");
    }
    console.warn("⚠️ Erro interceptado:", e?.message);
  });

  console.log("%c🍔 DFL v2.2 FINAL — LOGIN SEGURO + ADMIN PRO + GRÁFICOS 🔥",
              "background:#4caf50;color:#fff;padding:8px 12px;border-radius:8px;font-weight:700;");
}); // <-- fim do DOMContentLoaded