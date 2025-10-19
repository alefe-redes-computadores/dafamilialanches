/* =========================
   DFL – script.js (completo)
   Seguro contra erros / over-lays
   ========================= */

(function () {
  "use strict";

  // --------- Helpers seguros ---------
  const qs  = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const on  = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt);

  const log  = (...a) => console.log("DFL:", ...a);
  const warn = (...a) => console.warn("DFL:", ...a);
  const err  = (...a) => console.error("DFL:", ...a);

  // --------- Estado básico ---------
  const state = {
    cart: [],              // {id, name, price, qty, type, extras: [{name, price, qty}]}
    phone: "5534997178336",
  };

  // --------- Persistência simples ---------
  const save = () => localStorage.setItem("DFL_CART", JSON.stringify(state.cart));
  const load = () => {
    try {
      const raw = localStorage.getItem("DFL_CART");
      state.cart = raw ? JSON.parse(raw) : [];
    } catch {
      state.cart = [];
    }
  };

  // --------- Cart badge ---------
  const updateBadge = () => {
    const badge = qs("#cart-count");
    if (!badge) return;
    const total = state.cart.reduce((s, i) => s + i.qty, 0);
    badge.textContent = total;
  };

  // --------- Overlay helpers (evita bloqueio de clique) ---------
  const hideOverlay = (el) => {
    if (!el) return;
    el.classList.remove("show");
    el.style.display = "none";
    el.style.pointerEvents = "none";
  };
  const showOverlay = (el) => {
    if (!el) return;
    el.classList.add("show");
    el.style.display = "block";
    el.style.pointerEvents = "auto";
  };

  // --------- Mini-carrinho ---------
  const renderMini = () => {
    const list = qs("#mini-list");
    if (!list) return;
    if (!state.cart.length) {
      list.innerHTML = `<p class="mini-empty">Seu carrinho está vazio.</p>`;
      return;
    }
    list.innerHTML = state.cart.map((item, idx) => {
      const extras = (item.extras || [])
        .map(ex => `${ex.qty}× ${ex.name} (${formatBR(ex.price)})`)
        .join(", ");
      return `
        <div class="mini-item">
          <div class="mini-line">
            <strong>${item.qty}× ${item.name}</strong>
            <span>${formatBR(item.price * item.qty)}</span>
          </div>
          ${extras ? `<div class="mini-extras">+ ${extras}</div>` : ""}
          <div class="mini-actions">
            <button data-act="dec" data-idx="${idx}" aria-label="Diminuir">−</button>
            <button data-act="inc" data-idx="${idx}" aria-label="Aumentar">+</button>
            <button data-act="rm"  data-idx="${idx}" aria-label="Remover">Remover</button>
          </div>
        </div>
      `;
    }).join("");
  };

  const openMini = () => {
    const aside = qs("#mini-cart");
    const bd    = qs("#cart-backdrop");
    if (!aside || !bd) return;
    aside.setAttribute("aria-hidden", "false");
    aside.classList.add("open");
    showOverlay(bd);
    renderMini();
  };
  const closeMini = () => {
    const aside = qs("#mini-cart");
    const bd    = qs("#cart-backdrop");
    if (!aside || !bd) return;
    aside.setAttribute("aria-hidden", "true");
    aside.classList.remove("open");
    hideOverlay(bd);
  };

  // --------- Extras (adicionais) ---------
  // Tabelas dos adicionais (iguais para todos os produtos do tipo)
  const EXTRAS = {
    burger: [
      { name: "Cebola",                 price: 0.99 },
      { name: "Salada",                 price: 1.99 },
      { name: "Ovo",                    price: 1.99 },
      { name: "Salsicha",               price: 1.99 },
      { name: "Bacon",                  price: 2.99 },
      { name: "Molho Verde",           price: 2.99 },
      { name: "Hambúrguer Tradicional",price: 2.99 },
      { name: "Cheddar",                price: 3.99 },
      { name: "Filé de Frango",         price: 6.99 },
      { name: "Hambúrguer Artesanal 120g", price: 7.99 },
    ],
    hotdog: [
      { name: "Cheddar",       price: 3.99 },
      { name: "Molho Verde",   price: 2.99 },
      { name: "Bacon",         price: 2.99 },
      { name: "Salsicha",      price: 1.99 },
      { name: "Vinagrete",     price: 2.99 },
      { name: "Purê de Batata",price: 3.99 },
    ],
    beverage: [],
  };

  let pendingExtras = null; // {baseItem, checks[]}

  const openExtras = (baseItem) => {
    const modal = qs("#extras-modal");
    const list  = qs("#extras-list");
    const bd    = qs("#extras-backdrop");
    const title = qs("#extras-title");

    if (!modal || !list || !bd) return;

    const opts = EXTRAS[baseItem.type] || [];
    if (!opts.length) {
      // sem extras para esse tipo — adiciona direto
      addToCart(baseItem);
      return;
    }

    title && (title.textContent = `Adicionais para ${baseItem.name}`);
    list.innerHTML = opts.map((opt, i) => `
      <label class="extra-row">
        <input type="checkbox" data-i="${i}" />
        <span>${opt.name}</span>
        <span class="extra-price">${formatBR(opt.price)}</span>
        <input type="number" min="1" value="1" class="extra-qty" data-i="${i}" />
      </label>
    `).join("");

    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("open");
    showOverlay(bd);

    pendingExtras = { baseItem, opts };
  };

  const closeExtras = () => {
    const modal = qs("#extras-modal");
    const bd    = qs("#extras-backdrop");
    if (!modal || !bd) return;
    modal.setAttribute("aria-hidden", "true");
    modal.classList.remove("open");
    hideOverlay(bd);
    pendingExtras = null;
  };

  const commitExtras = () => {
    if (!pendingExtras) return;
    const list = qs("#extras-list");
    if (!list) return;

    const sel = [];
    list.querySelectorAll('input[type="checkbox"]').forEach(chk => {
      if (!chk.checked) return;
      const i = Number(chk.dataset.i);
      const qtyInput = list.querySelector(`input.extra-qty[data-i="${i}"]`);
      const qty = Math.max(1, Number(qtyInput?.value || 1));
      const opt = pendingExtras.opts[i];
      sel.push({ name: opt.name, price: opt.price, qty });
    });

    addToCart(pendingExtras.baseItem, sel);
    closeExtras();
  };

  // --------- Carrinho: add / inc / dec / rm ---------
  const addToCart = (base, extras = []) => {
    const idx = state.cart.findIndex(i =>
      i.id === base.id &&
      JSON.stringify(i.extras || []) === JSON.stringify(extras || [])
    );
    if (idx >= 0) {
      state.cart[idx].qty += 1;
    } else {
      state.cart.push({ ...base, qty: 1, extras });
    }
    save();
    updateBadge();
    renderMini();
  };

  const changeQty = (idx, delta) => {
    if (idx < 0 || idx >= state.cart.length) return;
    state.cart[idx].qty += delta;
    if (state.cart[idx].qty <= 0) state.cart.splice(idx, 1);
    save();
    updateBadge();
    renderMini();
  };

  const clearCart = () => {
    state.cart = [];
    save();
    updateBadge();
    renderMini();
  };

  // --------- WhatsApp checkout ---------
  const formatBR = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const buildWhatsAppMessage = () => {
    if (!state.cart.length) return "Olá! Gostaria de fazer um pedido. (Carrinho vazio)";

    const lines = state.cart.map(item => {
      const nameB = `*${item.name}*`;
      const base  = `${item.qty}x ${nameB}`;
      const extras = (item.extras || [])
        .map(ex => `${ex.qty}x ${ex.name}`)
        .join(", ");
      const extrasPart = extras ? ` _adicionais:_ ${extras}` : "";
      return `• ${base}${extrasPart}`;
    });

    const total = state.cart.reduce((s, it) => {
      const base = it.price * it.qty;
      const ex   = (it.extras || []).reduce((es, e) => es + e.price * e.qty, 0);
      return s + base + ex;
    }, 0);

    return [
      "Olá! Gostaria de pedir:",
      ...lines,
      "",
      `*Total:* ${formatBR(total)}`,
      "",
      "Forma de retirada/entrega:"
    ].join("\n");
  };

  const goWhatsApp = () => {
    const msg = buildWhatsAppMessage();
    const url = `https://wa.me/${state.phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  // --------- Carrossel de promo ---------
  const initCarousel = () => {
    const carousel = qs("#promoCarousel");
    if (!carousel) return;

    const slides = qsa(".slides .slide", carousel);
    if (!slides.length) return;

    let idx = 0;
    const show = (i) => {
      idx = (i + slides.length) % slides.length;
      slides.forEach((img, n) => img.classList.toggle("active", n === idx));
    };

    const prev = qs(".c-prev", carousel);
    const next = qs(".c-next", carousel);

    on(prev, "click", (e) => { e.stopPropagation(); show(idx - 1); });
    on(next, "click", (e) => { e.stopPropagation(); show(idx + 1); });

    // Clique na imagem: vai pro WhatsApp com a mensagem da promo
    slides.forEach(img => {
      on(img, "click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const txt = img.getAttribute("data-wa") || "Quero a promoção!";
        const url = `https://wa.me/${state.phone}?text=${encodeURIComponent(txt)}`;
        window.open(url, "_blank");
      });
    });

    show(0);
  };

  // --------- Horário (já estava ok) ---------
  const initStatus = () => {
    const el = qs("#status-banner");
    if (!el) return;

    const now = new Date();
    const dow = now.getDay(); // 0 dom ... 6 sáb
    const toMin = (h, m) => h * 60 + m;
    const nowMin = toMin(now.getHours(), now.getMinutes());

    // seg-qui 18:00–23:15  |  sex-dom 17:30–23:30  |  ter fechado
    let openStart = null, openEnd = null, tomorrowText = "";

    if (dow === 2) { // terça
      el.textContent = "Fechado hoje. Abrimos amanhã.";
      return;
    }

    if (dow >= 5 || dow === 0) { // sex(5), sab(6), dom(0)
      openStart = toMin(17, 30);
      openEnd   = toMin(23, 30);
      tomorrowText = "Abertura às 17h30.";
    } else { // seg-qui
      openStart = toMin(18, 0);
      openEnd   = toMin(23, 15);
      tomorrowText = "Abertura às 18h00.";
    }

    if (nowMin < openStart) {
      const diff = openStart - nowMin;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      el.textContent = `Fechado agora. Abrimos em ${h}h${String(m).padStart(2,"0")}m.`;
    } else if (nowMin > openEnd) {
      el.textContent = `Fechado agora. ${tomorrowText}`;
    } else {
      el.textContent = "Estamos abertos ✅";
    }
  };

  // --------- Contagem até 23:59 ---------
  const initCountdown = () => {
    const el = qs("#timer");
    if (!el) return;

    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const diff = end - now;
      if (diff <= 0) { el.textContent = "00:00:00"; return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      el.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    };
    tick();
    setInterval(tick, 1000);
  };

  // --------- Inicializa botões dos cards ---------
  const initCards = () => {
    // Botões "Adicionar"
    qsa(".card .add-cart").forEach(btn => {
      on(btn, "click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest(".card");
        if (!card) return;
        const item = {
          id:   card.dataset.id,
          name: card.dataset.name,
          price: Number(card.dataset.price || "0"),
          type: card.dataset.type || "burger",
        };
        addToCart(item);
      });
    });

    // Botões "Adicionais"
    qsa(".card .extras-btn").forEach(btn => {
      on(btn, "click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest(".card");
        if (!card) return;
        const base = {
          id:   card.dataset.id,
          name: card.dataset.name,
          price: Number(card.dataset.price || "0"),
          type: card.dataset.type || "burger",
        };
        openExtras(base);
      });
    });
  };

  // --------- Eventos do mini-carrinho ---------
  const initMini = () => {
    const icon  = qs("#cart-icon");
    const close = qs("#mini-cart .mini-close");
    const bd    = qs("#cart-backdrop");
    const list  = qs("#mini-list");
    const clear = qs("#mini-clear");
    const check = qs("#mini-checkout");

    on(icon,  "click", openMini);
    on(close, "click", closeMini);
    on(bd,    "click", closeMini);

    on(list, "click", (e) => {
      const b = e.target.closest("button[data-act]");
      if (!b) return;
      const act = b.dataset.act;
      const idx = Number(b.dataset.idx);
      if (act === "inc") changeQty(idx, +1);
      if (act === "dec") changeQty(idx, -1);
      if (act === "rm")  { state.cart.splice(idx,1); save(); updateBadge(); renderMini(); }
    });

    on(clear, "click", () => clearCart());
    on(check, "click", () => goWhatsApp());
  };

  // --------- Eventos do modal de extras ---------
  const initExtrasModal = () => {
    const close = qs("#extras-modal .extras-close");
    const cancel= qs("#extras-cancel");
    const add   = qs("#extras-add");
    const bd    = qs("#extras-backdrop");

    on(close,  "click", closeExtras);
    on(cancel, "click", closeExtras);
    on(bd,     "click", closeExtras);
    on(add,    "click", commitExtras);
  };

  // --------- Z-index / overlays ao carregar (evita travar clique) ---------
  const resetOverlays = () => {
    hideOverlay(qs("#cart-backdrop"));
    hideOverlay(qs("#extras-backdrop"));
    const mini = qs("#mini-cart");
    mini && mini.setAttribute("aria-hidden", "true");
    mini && mini.classList.remove("open");
    const ex = qs("#extras-modal");
    ex && ex.setAttribute("aria-hidden", "true");
    ex && ex.classList.remove("open");
  };

  // --------- Mapa (carregado no HTML via Leaflet CDN) ---------
  const initMap = () => {
    try {
      const el = qs("#mapa-entregas");
      if (!el || typeof L === "undefined") return;
      const map = L.map("mapa-entregas", {
        center: [-18.5783, -46.5187],
        zoom: 13,
        scrollWheelZoom: true,
        zoomControl: true
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { attribution: "" }).addTo(map);
      L.circle([-18.5783, -46.5187], {
        radius: 6000, color: "#d4af37", fillColor: "#ffd700", fillOpacity: 0.25, weight: 2
      }).addTo(map);
      L.marker([-18.5783, -46.5187]).addTo(map)
        .bindPopup("<b>🍔 DFL</b><br>Entregamos em toda Patos de Minas 💛")
        .openPopup();
    } catch (e) {
      warn("Mapa não inicializado:", e);
    }
  };

  // --------- Boot ---------
  const boot = () => {
    try {
      load();
      resetOverlays();
      updateBadge();

      initStatus();
      initCountdown();
      initCarousel();
      initCards();
      initMini();
      initExtrasModal();
      initMap();

      log("Inicialização concluída ✅");
    } catch (e) {
      err("Falha na inicialização:", e);
    }
  };

  // Start
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();