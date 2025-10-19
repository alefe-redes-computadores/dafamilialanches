// ================================
//  DFL – SCRIPT COMPLETO (v2.0)
// ================================

// WhatsApp oficial DFL
const WA_NUMBER = '5534997178336';

// ==========================================
// 🕓 STATUS INTELIGENTE DE FUNCIONAMENTO
// ==========================================
(function funcionamentoInteligente() {
  const banner = document.getElementById('status-banner');
  if (!banner) return;

  const agora = new Date();
  const dia = agora.getDay(); // 0=Dom, 1=Seg... 6=Sáb
  const hora = agora.getHours();
  const minuto = agora.getMinutes();
  const minutosTotais = hora * 60 + minuto;

  // Horários de funcionamento por dia
  const horarios = {
    0: { abre: 17 * 60 + 30, fecha: 23 * 60 + 30 }, // Domingo
    1: { abre: 18 * 60, fecha: 23 * 60 + 15 },      // Segunda
    2: null,                                        // Terça (fechado)
    3: { abre: 18 * 60, fecha: 23 * 60 + 15 },      // Quarta
    4: { abre: 18 * 60, fecha: 23 * 60 + 15 },      // Quinta
    5: { abre: 17 * 60 + 30, fecha: 23 * 60 + 30 }, // Sexta
    6: { abre: 17 * 60 + 30, fecha: 23 * 60 + 30 }, // Sábado
  };

  const hoje = horarios[dia];
  const proxDia = horarios[(dia + 1) % 7];

  let status = '';
  let classe = '';

  // Se for terça (fechado)
  if (!hoje) {
    status = `🚫 Hoje não abrimos. Voltamos amanhã às ${formatarHora(proxDia.abre)}.`;
    classe = 'status-closed';
  } else if (minutosTotais < hoje.abre) {
    const diff = hoje.abre - minutosTotais;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    status = `🕓 Abrimos em ${h}h ${m}min (às ${formatarHora(hoje.abre)}).`;
    classe = 'status-soon';
  } else if (minutosTotais >= hoje.abre && minutosTotais <= hoje.fecha) {
    status = `🟢 Aberto agora! Fechamos às ${formatarHora(hoje.fecha)}.`;
    classe = 'status-open';
  } else {
    if (!proxDia) {
      status = `🔴 Fechado. Amanhã estamos de folga.`;
      classe = 'status-closed';
    } else {
      status = `🔴 Fechado. Abrimos amanhã às ${formatarHora(proxDia.abre)}.`;
      classe = 'status-closed';
    }
  }

  banner.textContent = status;
  banner.className = `status-banner ${classe}`;

  function formatarHora(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
})();

// ==========================================
// ⏳ CONTAGEM PROMOCIONAL (até 23:59)
// ==========================================
(function countdown() {
  const el = document.getElementById('timer');
  if (!el) return;
  function tick() {
    const now = new Date();
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    let diff = Math.max(0, Math.floor((end - now) / 1000));
    const h = String(Math.floor(diff / 3600)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
    const s = String(diff % 60).padStart(2, '0');
    el.textContent = `${h}:${m}:${s}`;
  }
  tick();
  setInterval(tick, 1000);
})();

// ==========================================
// 🎠 CARROSSEL DE PROMOÇÕES
// ==========================================
(function carousel() {
  const box = document.getElementById('promoCarousel');
  if (!box) return;
  const slides = [...box.querySelectorAll('.slide')];
  const prev = box.querySelector('.c-prev');
  const next = box.querySelector('.c-next');
  let i = slides.findIndex((s) => s.classList.contains('active'));
  if (i < 0) i = 0;

  function show(n) {
    slides.forEach((s, idx) => {
      s.classList.toggle('active', idx === n);
      s.style.display = idx === n ? 'block' : 'none';
    });
  }

  function go(d) {
    i = (i + d + slides.length) % slides.length;
    show(i);
  }

  prev.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    go(-1);
  });
  next.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    go(1);
  });

  slides.forEach((s) => {
    s.addEventListener('click', () => {
      const msg = encodeURIComponent(s.dataset.wa || 'Quero a promoção');
      window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
    });
  });

  let x0 = null;
  box.addEventListener('touchstart', (e) => {
    x0 = e.touches[0].clientX;
  });
  box.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    x0 = null;
  });

  show(i);
})();

// ==========================================
// 🛒 CARRINHO DE COMPRAS + MINI POPUP
// ==========================================
let cart = JSON.parse(localStorage.getItem('dfl_cart') || '[]');
function saveCart() { localStorage.setItem('dfl_cart', JSON.stringify(cart)); }
function cartCount() { return cart.reduce((s, i) => s + i.qty, 0); }
function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (el) el.textContent = cartCount();
}
function addToCartByCard(card) {
  const id = card.dataset.id;
  const name = card.dataset.name;
  const price = Number(card.dataset.price || 0);
  const found = cart.find((p) => p.id === id);
  if (found) found.qty++;
  else cart.push({ id, name, price, qty: 1 });
  saveCart();
  updateCartCount();
  popAdded(name);
  renderMini();
}
function popAdded(name) {
  const div = document.createElement('div');
  div.className = 'added-popup';
  div.textContent = `+1 ${name}`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1200);
}
function initAddButtons() {
  document.querySelectorAll('.card .add-cart').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.card');
      addToCartByCard(card);
    });
  });
}

// ===== Mini Carrinho =====
const mini = document.getElementById('mini-cart');
const miniList = document.getElementById('mini-list');
const miniClose = document.querySelector('.mini-close');
const miniClear = document.getElementById('mini-clear');
const miniCheckout = document.getElementById('mini-checkout');
const backdrop = document.getElementById('cart-backdrop');
const cartIcon = document.getElementById('cart-icon');

function openMini() {
  mini.classList.add('open');
  backdrop.classList.add('open');
  renderMini();
}
function closeMini() {
  mini.classList.remove('open');
  backdrop.classList.remove('open');
}
function renderMini() {
  if (!miniList) return;
  miniList.innerHTML = cart.length
    ? ''
    : '<div class="mini-item"><span class="mini-name">Seu carrinho está vazio.</span></div>';
  cart.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'mini-item';
    row.innerHTML = `
      <span class="mini-name">${item.name}</span>
      <div class="mini-qty">
        <button class="qty-btn" aria-label="Diminuir">−</button>
        <span>${item.qty}</span>
        <button class="qty-btn" aria-label="Aumentar">+</button>
      </div>`;
    const [btnMinus, , btnPlus] = row.querySelectorAll('.qty-btn, span, .qty-btn');
    btnMinus.addEventListener('click', () => {
      item.qty--;
      if (item.qty <= 0) cart.splice(idx, 1);
      saveCart();
      updateCartCount();
      renderMini();
    });
    btnPlus.addEventListener('click', () => {
      item.qty++;
      saveCart();
      updateCartCount();
      renderMini();
    });
    miniList.appendChild(row);
  });
}
cartIcon.addEventListener('click', openMini);
miniClose.addEventListener('click', closeMini);
backdrop.addEventListener('click', closeMini);
miniClear.addEventListener('click', () => {
  cart = [];
  saveCart();
  updateCartCount();
  renderMini();
});
miniCheckout.addEventListener('click', () => {
  if (!cart.length) {
    alert('Seu carrinho está vazio.');
    return;
  }
  const lines = cart.map((i) => `- ${i.qty}x ${i.name}`).join('%0A');
  const msg = `Olá, quero fazer um pedido:%0A${lines}`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
});
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  initAddButtons();
  renderMini();
});