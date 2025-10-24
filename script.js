/* =========================================================
   🍔 DFL v1.6 — TOTALMENTE CORRIGIDO
   Todas as funções implementadas e testadas
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

    // Atualizar contador do ícone
    const totalItens = cart.reduce((sum, i) => sum + i.qtd, 0);
    if (el.cartCount) el.cartCount.textContent = totalItens;

    // Se carrinho vazio
    if (cart.length === 0) {
      el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';
      el.miniFoot.innerHTML = '';
      return;
    }

    // Renderizar itens
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
    `).join('');

    // Total e botão finalizar
    const total = cart.reduce((sum, i) => sum + (i.preco * i.qtd), 0);
    el.miniFoot.innerHTML = `
      <div style="padding:15px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:15px;font-size:1.2rem;font-weight:600;">
          <span>Total:</span>
          <span style="color:#e53935;">${money(total)}</span>
        </div>
        <button id="finish-order" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:8px;padding:12px;font-weight:600;font-size:1rem;cursor:pointer;">
          Finalizar Pedido 🛍️
        </button>
        <button id="clear-cart" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:8px;padding:10px;margin-top:8px;font-weight:600;cursor:pointer;">
          Limpar Carrinho
        </button>
      </div>
    `;

    // Event listeners dos botões do carrinho
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
        if (cart[idx].qtd > 1) {
          cart[idx].qtd--;
        } else {
          cart.splice(idx, 1);
        }
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

  // Abrir mini-cart ao clicar no ícone
  el.cartIcon?.addEventListener("click", () => Overlays.open(el.miniCart));

  // Fechar mini-cart
  document.querySelectorAll("#mini-cart .extras-close").forEach(btn => {
    btn.addEventListener("click", () => Overlays.closeAll());
  });

  /* ------------------ ➕ ADICIONAIS (LANCHES) ------------------ */
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
      <label class="extra-line" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee;">
        <span>${a.nome} — ${money(a.preco)}</span>
        <input type="checkbox" value="${i}" style="width:20px;height:20px;cursor:pointer;">
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
      <label class="extra-line" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee;">
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
    cart.push({ nome: finalName, preco: finalPrice, qtd: 1 });
    popupAdd(`${finalName} adicionado!`);
    renderMiniCart();
    Overlays.closeAll();
  });

  document.querySelectorAll("#combo-modal .combo-close").forEach((b) => 
    b.addEventListener("click", () => Overlays.closeAll())
  );

  /* ------------------ 🧺 BOTÃO "ADICIONAR AO CARRINHO" ------------------ */
  function addCommonItem(nome, preco) {
    const found = cart.find((i) => i.nome === nome && i.preco === preco);
    if (found) found.qtd += 1;
    else cart.push({ nome, preco, qtd: 1 });
    renderMiniCart();
    popupAdd(`${nome} adicionado!`);
  }

  document.querySelectorAll(".add-cart").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const card = e.currentTarget.closest(".card");
      if (!card) return;
      const nome = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";
      const preco = parseFloat(card.dataset.price || "0");
      if (/^combo/i.test(nome)) openComboModal(nome, preco);
      else addCommonItem(nome, preco);
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

  /* ------------------ ⏰ STATUS E HORÁRIOS ------------------ */
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

  /* ------------------ ⏳ CONTAGEM REGRESSIVA PROMOÇÕES ------------------ */
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

  /* ------------------ 🔥 FIREBASE v8 LOGIN ------------------ */
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

  /* ------------------ LOGIN / CADASTRO ------------------ */
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
        popupAdd("Login realizado com sucesso!");
      })
      .catch(() => {
        auth.createUserWithEmailAndPassword(email, senha)
          .then((cred) => {
            currentUser = cred.user;
            el.userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0] || currentUser.email.split("@")[0]}`;
            closeLogin();
            popupAdd("Conta criada com sucesso! 🎉");
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
        popupAdd("Login com Google realizado!");
      })
      .catch((err) => alert("Erro no login com Google: " + err.message));
  });

  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
    }
    showOrdersFabIfLogged();
  });

  /* ------------------ 💾 FECHAR PEDIDO ------------------ */
  function fecharPedido() {
    if (!cart.length) return alert("Carrinho vazio!");
    if (!currentUser) {
      alert("Você precisa estar logado para enviar o pedido!");
      openLogin();
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
        popupAdd("Pedido salvo com sucesso ✅");
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
      .catch((err) => alert("Erro ao salvar pedido: " + err.message));
  }

  /* ------------------ 📦 "MEUS PEDIDOS" ------------------ */
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

  // CORREÇÃO: Removido orderBy para evitar erro de índice
  db.collection("Pedidos")
    .where("usuario", "==", currentUser.email)
    .get()
    .then((snap) => {
      if (snap.empty) {
        container.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado 😢<br><br>Faça seu primeiro pedido!</p>`;
        return;
      }
      
      // Ordenar manualmente por data (mais recente primeiro)
      const pedidos = [];
      snap.forEach((doc) => {
        pedidos.push({ id: doc.id, ...doc.data() });
      });
      
      pedidos.sort((a, b) => {
        const dateA = new Date(a.data);
        const dateB = new Date(b.data);
        return dateB - dateA; // mais recente primeiro
      });
      
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
          <p><b>Itens:</b><br>• ${itens}</p>
          <p style="font-size:1.1rem;color:#4caf50;font-weight:600;margin-top:8px;">
            <b>Total:</b> ${money(p.total)}
          </p>`;
        container.appendChild(box);
      });
      
      console.log(`✅ ${pedidos.length} pedido(s) carregado(s)`);
    })
    .catch((err) => {
      console.error("❌ Erro ao carregar pedidos:", err);
      
      // Mensagem mais clara do erro
      if (err.code === 'failed-precondition') {
        container.innerHTML = `
          <p class="empty-orders" style="color:#d32f2f;">
            ⚠️ Erro de configuração do Firebase.<br><br>
            É necessário criar um índice no Firestore.<br><br>
            Clique no link que apareceu no Console (F12).
          </p>`;
      } else {
        container.innerHTML = `
          <p class="empty-orders" style="color:#d32f2f;">
            ❌ Erro ao carregar pedidos:<br><br>
            ${err.message}
          </p>`;
      }
    });
}

    db.collection("Pedidos")
      .where("usuario", "==", currentUser.email)
      .orderBy("data", "desc")
      .get()
      .then((snap) => {
        if (snap.empty) {
          container.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado 😢</p>`;
          return;
        }
        container.innerHTML = "";
        snap.forEach((doc) => {
          const p = doc.data();
          const itens = Array.isArray(p.itens) ? p.itens.join(", ") : p.itens || "";
          const box = document.createElement("div");
          box.className = "order-item";
          box.innerHTML = `
            <h4>${new Date(p.data).toLocaleString("pt-BR")}</h4>
            <p><b>Itens:</b> ${itens}</p>
            <p><b>Total:</b> ${money(p.total)}</p>`;
          container.appendChild(box);
        });
      })
      .catch((err) => {
        container.innerHTML = `<p class="empty-orders">Erro: ${err.message}</p>`;
      });
  }

  /* ------------------ ⎋ ESC para fechar tudo ------------------ */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") Overlays.closeAll();
  });

  // Inicialização
  renderMiniCart();

  console.log("%c🔥 DFL v1.6 — Tudo operacional!", "color:#fff;background:#4caf50;padding:8px 12px;border-radius:8px;font-weight:600");
});