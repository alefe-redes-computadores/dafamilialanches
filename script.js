/* ================================
   Utilidades
==================================*/
function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/* ================================
   Estado do carrinho
==================================*/
const Cart = {
  items: [], // {id, name, price, qty, extras: [{name, qty, price}]}
  add(item) {
    const key = item.id + JSON.stringify(item.extras || []);
    const found = this.items.find(i => i._key === key);
    if (found) {
      found.qty += item.qty || 1;
    } else {
      item._key = key;
      this.items.push(item);
    }
    this.render();
  },
  remove(key) {
    this.items = this.items.filter(i => i._key !== key);
    this.render();
  },
  changeQty(key, delta) {
    const it = this.items.find(i => i._key === key);
    if (!it) return;
    it.qty = clamp(it.qty + delta, 1, 99);
    this.render();
  },
  total() {
    return this.items.reduce((acc, it) => {
      const base = it.price * it.qty;
      const extras = (it.extras || []).reduce((eacc, ex) => eacc + ex.price * ex.qty, 0) * it.qty;
      return acc + base + extras;
    }, 0);
  },
  count() {
    return this.items.reduce((acc, it) => acc + it.qty, 0);
  },
  render() {
    // bolha do carrinho
    const countEl = qs("#cart-count");
    if (countEl) countEl.textContent = this.count();

    // mini-carrinho
    const list = qs("#mini-list");
    const totalEl = qs("#mini-total");
    if (!list || !totalEl) return;

    if (this.items.length === 0) {
      list.innerHTML = `<p style="color:#ccc">Seu carrinho está vazio.</p>`;
      totalEl.textContent = "R$ 0,00";
      return;
    }

    list.innerHTML = this.items.map(it => {
      const extrasText = (it.extras && it.extras.length)
        ? `<div style="font-size:.9rem;color:#ddd;margin-top:4px">
             Adicionais: ${it.extras.map(ex => `${ex.qty}x ${ex.name}`).join(", ")}
           </div>`
        : "";
      return `
        <div class="mini-item" style="border-bottom:1px solid #333;padding:10px 0">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
            <div>
              <div style="font-weight:700;color:#f9d44b">${it.name}</div>
              <div style="color:#aaa;font-size:.9rem">R$ ${it.price.toFixed(2).replace(".", ",")}</div>
              ${extrasText}
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <button class="btn-secondary mini-dec" data-key="${it._key}">-</button>
              <span style="min-width:22px;text-align:center">${it.qty}</span>
              <button class="btn-secondary mini-inc" data-key="${it._key}">+</button>
              <button class="btn-secondary" data-remove="${it._key}">x</button>
            </div>
          </div>
        </div>`;
    }).join("");

    totalEl.textContent = "R$ " + Cart.total().toFixed(2).replace(".", ",");
  }
};

/* ================================
   Modal de adicionais (genérico)
==================================*/
const Extras = {
  // preços configuráveis (os seus)
  burgers: {
    "Cebola": 0.99,
    "Salada": 1.99,
    "Ovo": 1.99,
    "Salsicha": 1.99,
    "Bacon": 2.99,
    "Molho Verde": 2.99,
    "Hambúrguer Tradicional": 2.99,
    "Cheddar": 3.99,
    "Filé de Frango": 6.99,
    "Hambúrguer Artesanal 120": 7.99
  },
  hotdogs: {
    "Cheddar": 3.99,
    "Molho Verde": 2.99,
    "Bacon": 2.99,
    "Salsicha": 1.99,
    "Vinagrete": 2.99,
    "Purê de Batata": 3.99
  },
  open(product) {
    const modal = qs("#extras-modal");
    const back = qs("#extras-backdrop");
    const list = qs("#extras-list");
    const title = qs("#extras-title");
    if (!modal || !back || !list || !title) return;

    const type = (product.dataset.type || "").toLowerCase().includes("hotdog") ? "hotdogs" : "burgers";
    const table = this[type];

    title.textContent = `Adicionais para ${product.dataset.name}`;
    list.innerHTML = Object.entries(table).map(([name, price]) => `
      <div class="extras-item">
        <label>${name} — R$ ${price.toFixed(2).replace(".", ",")}</label>
        <input type="number" min="0" value="0" data-extra="${name}" data-price="${price}">
      </div>
    `).join("");

    modal.classList.add("active");
    back.style.display = "block";

    // Confirmar
    const confirmBtn = qs("#extras-confirm");
    const cancelBtn = qs("#extras-cancel");
    const closeAll = () => {
      modal.classList.remove("active");
      back.style.display = "none";
    };

    const onConfirm = () => {
      const inputs = qsa("input[data-extra]", list);
      const selected = inputs
        .map(inp => ({name: inp.dataset.extra, qty: parseInt(inp.value || "0", 10), price: parseFloat(inp.dataset.price)}))
        .filter(x => x.qty > 0);
      product._selectedExtras = selected; // anexa ao card (uso logo ao adicionar)
      closeAll();
      confirmBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
    };
    const onCancel = () => {
      product._selectedExtras = []; // zera
      closeAll();
      confirmBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
    };

    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
  }
};

/* ================================
   Carrossel de promoções
==================================*/
const Carousel = {
  idx: 0,
  init() {
    this.wrap = qs(".slides");
    this.slides = qsa(".slide", this.wrap || document);
    if (!this.wrap || this.slides.length === 0) return;

    const prev = qs("#promoPrev");
    const next = qs("#promoNext");

    const update = () => {
      const w = this.slides[0].getBoundingClientRect().width + 10; // slide + gap
      this.wrap.style.transform = `translateX(${-this.idx * w}px)`;
    };

    this.next = () => {
      this.idx = (this.idx + 1) % this.slides.length;
      update();
    };
    this.prev = () => {
      this.idx = (this.idx - 1 + this.slides.length) % this.slides.length;
      update();
    };

    if (prev) prev.addEventListener("click", this.prev);
    if (next) next.addEventListener("click", this.next);
  }
};

/* ================================
   Horário de funcionamento + contagem
   Seg–Qui 18:00–23:15 | Sex–Dom 17:30–23:30 | Ter fechado
==================================*/
function isOpen(now) {
  // 0=Dom,1=Seg,...6=Sáb
  const d = now.getDay();
  const h = now.getHours();
  const m = now.getMinutes();

  const after = (hh, mm) => (h > hh) || (h === hh && m >= mm);
  const before = (hh, mm) => (h < hh) || (h === hh && m < mm);

  if (d === 2) return false; // Ter fechado

  if (d >= 1 && d <= 4) { // Seg-Qui 18:00–23:15
    return after(18, 0) && before(23, 15);
  } else { // Sex-Dom 17:30–23:30
    return after(17, 30) && before(23, 30);
  }
}

function nextOpeningFrom(now) {
  // retorna um Date com a próxima abertura
  const n = new Date(now);
  for (let i = 0; i < 8; i++) {
    const day = n.getDay();
    if (day !== 2) {
      // hoje abre?
      const openH = (day >= 1 && day <= 4) ? {h:18,m:0} : {h:17,m:30};
      const candidate = new Date(n.getFullYear(), n.getMonth(), n.getDate(), openH.h, openH.m, 0, 0);
      if (candidate > now) return candidate;
    }
    n.setDate(n.getDate() + 1);
    n.setHours(0,0,0,0);
  }
  return null;
}

function formatHM(diffMs) {
  const total = Math.max(0, Math.floor(diffMs / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${String(h).padStart(2,"0")}h${String(m).padStart(2,"0")}`;
}

function updateStatusBanners() {
  const statusText = qs("#status-text");      // linha preta “Abrimos em…”
  const hoursBanner = qs("#hours-line");      // faixa amarela com horários
  const countdownEl = qs("#countdown-ticker");// “Termina em 00:..” (promoções)
  const now = new Date();

  // Faixa fixa com horários (texto estático)
  if (hoursBanner) {
    hoursBanner.textContent = "Seg–Qui 18h–23h15 • Sex–Dom 17h30–23h30 • Ter: Fechado";
  }

  // Status abre/fecha + contagem até próxima abertura
  if (statusText) {
    if (isOpen(now)) {
      statusText.innerHTML = `Estamos <b style="color:#f9d44b">abertos</b> agora.`;
    } else {
      const next = nextOpeningFrom(now);
      if (next) {
        const diff = next - now;
        statusText.innerHTML = `Abrimos em <b style="color:#f9d44b">${formatHM(diff)}</b> (às ${String(next.getHours()).padStart(2,"0")}:${String(next.getMinutes()).padStart(2,"0")}).`;
      } else {
        statusText.textContent = "Fechado no momento.";
      }
    }
  }

  // Contagem regressiva das promoções (até 23:59:59 de hoje)
  if (countdownEl) {
    const end = new Date();
    end.setHours(23,59,59,999);
    let diff = end - now;
    if (diff < 0) diff = 0;
    const hh = String(Math.floor(diff / 3_600_000)).padStart(2, "0");
    const mm = String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, "0");
    const ss = String(Math.floor((diff % 60_000) / 1000)).padStart(2, "0");
    countdownEl.textContent = `${hh}:${mm}:${ss}`;
  }
}

/* ================================
   WhatsApp checkout
==================================*/
function buildWhatsappMessage() {
  if (Cart.items.length === 0) return "Olá! Gostaria de fazer um pedido.";
  const lines = Cart.items.map(it => {
    const nameBold = `*${it.name}*`;
    const extras = (it.extras && it.extras.length)
      ? ` _adicionais:_ ${it.extras.map(ex => `${ex.qty}x ${ex.name}`).join(", ")}`
      : "";
    return `${it.qty}x ${nameBold}${extras}`;
  });
  lines.push("");
  lines.push(`Total: *R$ ${Cart.total().toFixed(2).replace(".", ",")}*`);
  return "Olá! Segue meu pedido:%0A%0A" + encodeURIComponent(lines.join("%0A"));
}

function openWhatsapp() {
  // Use o seu número aqui (já usado antes)
  const phone = "5534997178336";
  const msg = buildWhatsappMessage();
  const url = `https://wa.me/${phone}?text=${msg}`;
  window.open(url, "_blank");
}

/* ================================
   Inicialização
==================================*/
document.addEventListener("DOMContentLoaded", () => {
  try {
    // Corrige texto do rodapé (entregas)
    const delivery = qs("#delivery-text");
    if (delivery) delivery.textContent = "Entregamos em toda Patos de Minas";

    // Carrossel
    Carousel.init();

    // Status/horários + ticker: atualiza a cada 1s para ticker e 30s para aberto/fechado
    updateStatusBanners();
    setInterval(() => {
      updateStatusBanners();
    }, 1000);

    // Botões "Adicionar" (espera data-name e data-price no botão ou no card pai)
    qsa(".add-cart").forEach(btn => {
      btn.addEventListener("click", () => {
        const card = btn.closest("[data-product]");
        if (!card) return;
        const name = card.dataset.name || btn.dataset.name || "Produto";
        const price = parseFloat(card.dataset.price || btn.dataset.price || "0");
        const qtyEl = qs(".qty-input", card);
        const qty = qtyEl ? clamp(parseInt(qtyEl.value || "1", 10), 1, 99) : 1;
        const extras = card._selectedExtras || [];

        Cart.add({
          id: card.dataset.id || name,
          name,
          price,
          qty,
          extras
        });

        // limpa extras selecionados para o próximo uso
        card._selectedExtras = [];
      });
    });

    // Botões "Adicionais" (abre modal)
    qsa(".extras-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const card = btn.closest("[data-product]");
        if (!card) return;
        Extras.open(card);
      });
    });

    // Mini-carrinho toggle
    const cartIcon = qs("#cart-icon");
    const miniCart = qs("#mini-cart");
    const cartBackdrop = qs("#cart-backdrop");
    if (cartIcon && miniCart && cartBackdrop) {
      const open = () => {
        miniCart.classList.add("active");
        cartBackdrop.style.display = "block";
        Cart.render();
      };
      const close = () => {
        miniCart.classList.remove("active");
        cartBackdrop.style.display = "none";
      };
      cartIcon.addEventListener("click", open);
      qsa("[data-close-cart]").forEach(b => b.addEventListener("click", close));
      cartBackdrop.addEventListener("click", close);

      // Delegação para + / - / remover
      miniCart.addEventListener("click", (e) => {
        const t = e.target;
        if (t.matches(".mini-inc")) {
          Cart.changeQty(t.dataset.key, +1);
        } else if (t.matches(".mini-dec")) {
          Cart.changeQty(t.dataset.key, -1);
        } else if (t.hasAttribute("data-remove")) {
          Cart.remove(t.getAttribute("data-remove"));
        }
      });
    }

    // Checkout WhatsApp
    const checkoutBtn = qs("#mini-checkout");
    if (checkoutBtn) checkoutBtn.addEventListener("click", openWhatsapp);

    // Segurança: primeira render
    Cart.render();

  } catch (err) {
    console.error("Erro na inicialização:", err);
  }
});