// ================================
//  DFL – JS do site (carrossel + timer + carrinho completo)
// ================================

// ----- Contagem até 23:59 -----
(function countdown(){
  const el = document.getElementById('timer');
  if(!el) return;
  function tick(){
    const now = new Date();
    const end = new Date(); end.setHours(23,59,59,999);
    let diff = Math.max(0, Math.floor((end - now)/1000));
    const h = String(Math.floor(diff/3600)).padStart(2,'0');
    const m = String(Math.floor((diff%3600)/60)).padStart(2,'0');
    const s = String(diff%60).padStart(2,'0');
    el.textContent = `${h}:${m}:${s}`;
  }
  tick(); setInterval(tick, 1000);
})();

// ----- Carrossel -----
(function carousel(){
  const box = document.getElementById('promoCarousel');
  if(!box) return;
  const slides = [...box.querySelectorAll('.slide')];
  const prev = box.querySelector('.c-prev');
  const next = box.querySelector('.c-next');
  let i = slides.findIndex(s=>s.classList.contains('active')); if(i<0) i=0;

  function show(n){
    slides.forEach((s,idx)=>{
      s.classList.toggle('active', idx===n);
      s.style.display = idx===n ? 'block' : 'none';
    });
  }
  function go(d){ i = (i + d + slides.length) % slides.length; show(i); }

  prev.addEventListener('click', e=>{ e.stopPropagation(); e.preventDefault(); go(-1); });
  next.addEventListener('click', e=>{ e.stopPropagation(); e.preventDefault(); go(1); });

  slides.forEach(s=>{
    s.addEventListener('click', ()=>{
      const msg = encodeURIComponent(s.dataset.wa || 'Quero a promoção');
      window.open(`https://wa.me/5534997178336?text=${msg}`, '_blank');
    });
  });

  // swipe
  let x0=null;
  box.addEventListener('touchstart', e=>{ x0 = e.touches[0].clientX; }, {passive:true});
  box.addEventListener('touchend', e=>{
    if(x0===null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if(Math.abs(dx)>40) go(dx<0?1:-1);
    x0=null;
  });

  show(i);
})();

// ================================
//  Carrinho
// ================================
const WA_NUMBER = '5534997178336';

let cart = JSON.parse(localStorage.getItem('dfl_cart')||'[]');

function saveCart(){ localStorage.setItem('dfl_cart', JSON.stringify(cart)); }
function cartCount(){ return cart.reduce((s,i)=>s+i.qty,0); }

function updateCartCount(){
  const el = document.getElementById('cart-count');
  if(el) el.textContent = cartCount();
}

function addToCartByCard(card){
  const id = card.dataset.id;
  const name = card.dataset.name;
  const price = Number(card.dataset.price||0);
  const found = cart.find(p=>p.id===id);
  if(found) found.qty++;
  else cart.push({id,name,price,qty:1});
  saveCart(); updateCartCount(); popAdded(name); renderMini();
}

function popAdded(name){
  const div = document.createElement('div');
  div.className = 'added-popup';
  div.textContent = `+1 ${name}`;
  document.body.appendChild(div);
  setTimeout(()=>div.remove(), 1200);
}

// aplica listeners nos botões "Adicionar"
function initAddButtons(){
  document.querySelectorAll('.card .add-cart').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const card = btn.closest('.card');
      addToCartByCard(card);
    });
  });
}

// ----- Mini cart (popup) -----
const mini = document.getElementById('mini-cart');
const miniList = document.getElementById('mini-list');
const miniClose = document.querySelector('.mini-close');
const miniClear = document.getElementById('mini-clear');
const miniCheckout = document.getElementById('mini-checkout');
const backdrop = document.getElementById('cart-backdrop');
const cartIcon = document.getElementById('cart-icon');

function openMini(){
  mini.classList.add('open');
  backdrop.classList.add('open');
  renderMini();
}
function closeMini(){
  mini.classList.remove('open');
  backdrop.classList.remove('open');
}

function renderMini(){
  if(!miniList) return;
  miniList.innerHTML = cart.length ? '' : '<div class="mini-item"><span class="mini-name">Seu carrinho está vazio.</span></div>';
  cart.forEach((item, idx)=>{
    const row = document.createElement('div');
    row.className = 'mini-item';
    row.innerHTML = `
      <span class="mini-name">${item.name}</span>
      <div class="mini-qty">
        <button class="qty-btn" aria-label="Diminuir">−</button>
        <span>${item.qty}</span>
        <button class="qty-btn" aria-label="Aumentar">+</button>
      </div>`;
    const [btnMinus,,btnPlus] = row.querySelectorAll('.qty-btn, span, .qty-btn');
    btnMinus.addEventListener('click', ()=>{
      item.qty--; if(item.qty<=0) cart.splice(idx,1);
      saveCart(); updateCartCount(); renderMini();
    });
    btnPlus.addEventListener('click', ()=>{
      item.qty++; saveCart(); updateCartCount(); renderMini();
    });
    miniList.appendChild(row);
  });
}

cartIcon.addEventListener('click', openMini);
miniClose.addEventListener('click', closeMini);
backdrop.addEventListener('click', closeMini);

miniClear.addEventListener('click', ()=>{
  cart = []; saveCart(); updateCartCount(); renderMini();
});

miniCheckout.addEventListener('click', ()=>{
  if(!cart.length){ alert('Seu carrinho está vazio.'); return; }
  const lines = cart.map(i=>`- ${i.qty}x ${i.name}`).join('%0A');
  const msg = `Olá, quero fazer um pedido:%0A${lines}`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
});

// Init
document.addEventListener('DOMContentLoaded', ()=>{
  updateCartCount();
  initAddButtons();
  renderMini();
});