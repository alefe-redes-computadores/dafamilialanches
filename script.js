// ================================
// 🛒 SISTEMA DE CARRINHO DFL
// ================================

// Carrinho de compras (array global)
let cart = [];

// Função para adicionar um produto ao carrinho
function addToCart(productName) {
  const existing = cart.find(item => item.name === productName);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name: productName, qty: 1 });
  }
  updateCartCount();
  showAddedPopup(productName);
}

// Atualiza o contador do carrinho no topo
function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const countElement = document.getElementById('cart-count');
  if (countElement) countElement.textContent = count;
}

// Mostra um pequeno aviso “+1” ao adicionar um produto
function showAddedPopup(productName) {
  const popup = document.createElement('div');
  popup.textContent = `+1 ${productName}`;
  popup.className = 'added-popup';
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1200);
}

// Gera mensagem personalizada e abre o WhatsApp
function openCart() {
  if (cart.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }

  let message = 'Olá, quero fazer um pedido:%0A';
  cart.forEach(item => {
    message += `- ${item.qty}x ${item.name}%0A`;
  });

  const whatsappNumber = '5534997178336';
  const url = `https://wa.me/${whatsappNumber}?text=${message}`;
  window.open(url, '_blank');
}

// Reseta o carrinho (opcional, pode chamar após envio)
function clearCart() {
  cart = [];
  updateCartCount();
}

// ================================
// 🕓 CONTADOR DE PROMOÇÃO (23:59)
// ================================
(function() {
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

// ================================
// 🎠 CARROSSEL DE PROMOÇÕES
// ================================
(function() {
  const slides = [...document.querySelectorAll('.slide')];
  const prev = document.querySelector('.c-prev');
  const next = document.querySelector('.c-next');
  const box = document.getElementById('promoCarousel');
  if (!slides.length || !prev || !next || !box) return;

  let i = slides.findIndex(s => s.classList.contains('active'));
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

  prev.addEventListener('click', e => {
    e.stopPropagation();
    e.preventDefault();
    go(-1);
  });

  next.addEventListener('click', e => {
    e.stopPropagation();
    e.preventDefault();
    go(1);
  });

  slides.forEach(s =>
    s.addEventListener('click', () => {
      const wa = s.dataset.wa;
      if (wa) window.open(wa, '_blank');
    })
  );

  // Suporte a toque (mobile)
  let x0 = null;
  const ts = e => (x0 = e.touches ? e.touches[0].clientX : e.clientX);
  const te = e => {
    if (x0 === null) return;
    const x1 = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const dx = x1 - x0;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    x0 = null;
  };
  box.addEventListener('touchstart', ts);
  box.addEventListener('touchend', te);

  show(i);
})();

// ================================
// 💅 ANIMAÇÃO POPUP "+1" AO ADICIONAR
// ================================
const style = document.createElement('style');
style.textContent = `
.added-popup {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: #ffcc00;
  color: #111;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 700;
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
  animation: popupFade 1.2s ease-out forwards;
  z-index: 9999;
}
@keyframes popupFade {
  0% { opacity: 0; transform: translate(-50%, 20px); }
  20% { opacity: 1; transform: translate(-50%, 0); }
  80% { opacity: 1; transform: translate(-50%, -10px); }
  100% { opacity: 0; transform: translate(-50%, -30px); }
}
`;
document.head.appendChild(style);