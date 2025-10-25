/* =========================================================
   🍔 DFL v1.8.3 — Adicionais Inteligentes + Visual Refinado
   - Agrupa extras iguais
   - Soma automática de preço
   - Mantém compatibilidade Firebase e UI
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
    hoursBanner: document.querySelector(".hours-banner"),
    bebidasSection: document.getElementById("bebidas-section"),
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
      document.querySelectorAll(".modal.show, #mini-cart.active, .orders-panel.active")
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
            <button class="cart-minus modern-btn red" data-idx="${idx}">−</button>
            <span style="font-weight:600;min-width:20px;text-align:center;">${item.qtd}</span>
            <button class="cart-plus modern-btn green" data-idx="${idx}">+</button>
            <button class="cart-remove modern-btn black" data-idx="${idx}">🗑</button>
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
        <button id="finish-order" class="btn-primary full">Finalizar Pedido 🛍️</button>
        <button id="clear-cart" class="btn-secondary full">Limpar Carrinho</button>
      </div>`;

    document.querySelectorAll(".cart-plus").forEach(b => b.addEventListener("click", e => {
      const i = +e.target.dataset.idx;
      cart[i].qtd++;
      renderMiniCart();
    }));

    document.querySelectorAll(".cart-minus").forEach(b => b.addEventListener("click", e => {
      const i = +e.target.dataset.idx;
      if (cart[i].qtd > 1) cart[i].qtd--;
      else cart.splice(i, 1);
      renderMiniCart();
    }));

    document.querySelectorAll(".cart-remove").forEach(b => b.addEventListener("click", e => {
      const i = +e.target.dataset.idx;
      cart.splice(i, 1);
      renderMiniCart();
      popupAdd("Item removido!");
    }));

    document.getElementById("clear-cart")?.addEventListener("click", () => {
      if (confirm("Limpar todo o carrinho?")) {
        cart = [];
        renderMiniCart();
        popupAdd("Carrinho limpo!");
      }
    });
  }

  el.cartIcon?.addEventListener("click", () => Overlays.open(el.miniCart));

  /* ------------------ ➕ ADICIONAIS ------------------ */
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
      <label class="extra-line modern-line">
        <span>${a.nome} — <b>${money(a.preco)}</b></span>
        <input type="checkbox" value="${i}" class="modern-check">
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

    const extrasSelecionados = checks.map(c => adicionais[+c.value]);
    const precoExtras = extrasSelecionados.reduce((t, e) => t + e.preco, 0);
    const precoTotal = produtoPrecoBase + precoExtras;

    const nomeCompleto = `${produtoExtras} + ${extrasSelecionados.map(e => e.nome).join(", ")}`;

    const existente = cart.find(i => i.nome === nomeCompleto && i.preco === precoTotal);
    if (existente) existente.qtd++;
    else cart.push({ nome: nomeCompleto, preco: precoTotal, qtd: 1 });

    renderMiniCart();
    popupAdd("Item com adicionais adicionado!");
    Overlays.closeAll();
  });

  /* ------------------ 🧺 ADD ITEM ------------------ */
  function addCommonItem(nome, preco) {
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

  /* ------------------ 🍾 BEBIDAS ------------------ */
  const bebidas = [
    { nome: "Coca-Cola 200ml", preco: 4.0 },
    { nome: "Coca-Cola 310ml", preco: 5.0 },
    { nome: "Coca-Cola 310ml Zero", preco: 5.0 },
    { nome: "Del Valle Uva 450ml", preco: 5.0 },
    { nome: "Del Valle Laranja 450ml", preco: 5.0 },
    { nome: "Fanta 1L", preco: 8.0 },
    { nome: "Coca-Cola 1L", preco: 9.0 },
    { nome: "Coca-Cola 1L Zero", preco: 9.0 },
    { nome: "Kuat 2L", preco: 10.0 },
    { nome: "Coca-Cola 2L", preco: 13.0 },
  ];
  if (el.bebidasSection && el.bebidasSection.querySelectorAll(".card").length === 0) {
    const grid = document.createElement("div");
    grid.className = "grid";
    bebidas.forEach(b => {
      const c = document.createElement("div");
      c.className = "card";
      c.dataset.name = b.nome;
      c.dataset.price = b.preco;
      c.innerHTML = `<h3>${b.nome}</h3><p><b>${money(b.preco)}</b></p><div class="actions"><button class="add-cart">Adicionar</button></div>`;
      grid.appendChild(c);
    });
    el.bebidasSection.appendChild(grid);
  }

  /* ------------------ 🖼️ CARROSSEL ------------------ */
  el.cPrev?.addEventListener("click", () => { if (!el.slides) return; el.slides.scrollLeft -= Math.min(el.slides.clientWidth * 0.9, 320); });
  el.cNext?.addEventListener("click", () => { if (!el.slides) return; el.slides.scrollLeft += Math.min(el.slides.clientWidth * 0.9, 320); });

  /* ------------------ STATUS + TIMER ------------------ */
  const atualizarStatus = safe(() => {
    const agora = new Date();
    const h = agora.getHours();
    const m = agora.getMinutes();
    const aberto = h >= 18 && h < 23;
    if (el.statusBanner)
      el.statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!";
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

  /* ------------------ ESC Fecha ------------------ */
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") Overlays.closeAll(); });

  renderMiniCart();
  console.log("%c🔥 DFL v1.8.3 — Adicionais OK + Visual Refinado!", "color:#fff;background:#4caf50;padding:8px 12px;border-radius:8px;font-weight:700");
});