/* =========================================================
   🍔 DFL v1.7.2 — MEUS PEDIDOS CORRIGIDO
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
            <button class="cart-minus" data-idx="${idx}" style="background:#ff4081;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">−</button>
            <span style="font-weight:600;min-width:20px;text-align:center;">${item.qtd}</span>
            <button class="cart-plus" data-idx="${idx}" style="background:#4caf50;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">+</button>
            <button class="cart-remove" data-idx="${idx}" style="background:#d32f2f;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">🗑</button>
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
        <button id="finish-order" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:8px;padding:12px;font-weight:600;font-size:1rem;cursor:pointer;">
          Finalizar Pedido 🛍️
        </button>
        <button id="clear-cart" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:8px;padding:10px;margin-top:8px;font-weight:600;cursor:pointer;">
          Limpar Carrinho
        </button>
      </div>
    `;
    ...
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

  /* ------------------ 📦 MEUS PEDIDOS - CORRIGIDO ------------------ */
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

  // ✅ CORREÇÃO PRINCIPAL: uso de .active + backdrop sincronizado
  function openOrdersPanel() {
    Overlays.closeAll();
    ordersPanel.classList.add("active");
    el.cartBackdrop.classList.add("show");
    document.body.classList.add("no-scroll");
    console.log("📦 Painel de pedidos aberto (corrigido)");
  }

  function closeOrdersPanel() {
    ordersPanel.classList.remove("active");
    el.cartBackdrop.classList.remove("show");
    document.body.classList.remove("no-scroll");
  }

  ordersFab.addEventListener("click", () => {
    console.log("🖱️ Clique em Meus Pedidos");
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
    if (!container) return console.error("❌ Container orders-content não encontrado!");

    container.innerHTML = `<p class="empty-orders">⏳ Carregando pedidos...</p>`;

    if (!currentUser) {
      container.innerHTML = `<p class="empty-orders">Faça login para ver seus pedidos.</p>`;
      return;
    }

    console.log(`🔍 Buscando pedidos de: ${currentUser.email}`);

    db.collection("Pedidos")
      .where("usuario", "==", currentUser.email)
      .get()
      .then((snap) => {
        console.log(`📊 Encontrados ${snap.size} pedido(s)`);

        if (snap.empty) {
          container.innerHTML = `
            <p class="empty-orders">
              😢 Nenhum pedido encontrado
              <br><br>
              Faça seu primeiro pedido!
            </p>`;
          return;
        }

        const pedidos = [];
        snap.forEach((doc) => pedidos.push({ id: doc.id, ...doc.data() }));

        pedidos.sort((a, b) => new Date(b.data) - new Date(a.data));
        container.innerHTML = "";

        pedidos.forEach((p) => {
          const itens = Array.isArray(p.itens) ? p.itens.join("<br>• ") : p.itens || "";
          const dataFormatada = new Date(p.data).toLocaleString("pt-BR", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit"
          });
          const box = document.createElement("div");
          box.className = "order-item";
          box.innerHTML = `
            <h4>📅 ${dataFormatada}</h4>
            <p style="margin:8px 0;"><b>Itens:</b><br>• ${itens}</p>
            <p style="font-size:1.1rem;color:#4caf50;font-weight:600;margin-top:8px;">
              <b>Total:</b> R$ ${Number(p.total).toFixed(2).replace(".", ",")}
            </p>`;
          container.appendChild(box);
        });

        console.log(`✅ ${pedidos.length} pedido(s) carregado(s)`);
      })
      .catch((err) => {
        console.error("❌ Erro ao carregar pedidos:", err);
        container.innerHTML = `
          <p class="empty-orders" style="color:#d32f2f;padding:20px;">
            ⚠️ Erro ao carregar pedidos: ${err.message}
          </p>`;
      });
  }

  /* ------------------ 🔑 LOGIN ------------------ */
  const openLogin = () => Overlays.open(el.loginModal);
  const closeLogin = () => Overlays.closeAll();

  el.userBtn?.addEventListener("click", openLogin);
  document.querySelectorAll("#login-modal .login-close").forEach((btn) =>
    btn.addEventListener("click", closeLogin)
  );

  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
    }
    showOrdersFabIfLogged();
  });

  /* ------------------ ⎋ ESC ------------------ */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") Overlays.closeAll();
  });

  // Inicialização
  renderMiniCart();

  console.log("%c🔥 DFL v1.7.2 — Meus Pedidos corrigido e funcional!", "color:#fff;background:#4caf50;padding:8px 12px;border-radius:8px;font-weight:600");
});