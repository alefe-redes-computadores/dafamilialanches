// ================================
//  DFL – SCRIPT COMPLETO (v4.0) com ADICIONAIS
// ================================
const WA_NUMBER = '5534997178336';

// ---------------- Status inteligente (se usado)
(function funcionamentoInteligente(){
  const banner = document.getElementById('status-banner');
  if(!banner) return;
  const now = new Date(), d = now.getDay(), m = now.getHours()*60+now.getMinutes();
  const H = {
    0:{abre:17*60+30, fecha:23*60+30},  // Dom
    1:{abre:18*60,   fecha:23*60+15},  // Seg
    2:null,                            // Ter fechado
    3:{abre:18*60,   fecha:23*60+15},  // Qua
    4:{abre:18*60,   fecha:23*60+15},  // Qui
    5:{abre:17*60+30,fecha:23*60+30},  // Sex
    6:{abre:17*60+30,fecha:23*60+30},  // Sáb
  };
  const h = H[d], next = H[(d+1)%7];
  const fmt = mins => `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
  let text='', cls='';
  if(!h){ text = `🚫 Hoje não abrimos. Voltamos amanhã às ${fmt(next.abre)}.`; cls='status-closed'; }
  else if(m<h.abre){ const dif=h.abre-m; text=`🕓 Abrimos em ${Math.floor(dif/60)}h ${dif%60}min (às ${fmt(h.abre)}).`; cls='status-soon'; }
  else if(m<=h.fecha){ text=`🟢 Aberto agora! Fechamos às ${fmt(h.fecha)}.`; cls='status-open'; }
  else { text = next?`🔴 Fechado. Abrimos amanhã às ${fmt(next.abre)}.`:`🔴 Fechado.`; cls='status-closed'; }
  banner.textContent = text;
  banner.className = `status-banner ${cls}`;
})();

// ---------------- Countdown até 23:59
(function countdown(){
  const el = document.getElementById('timer');
  if(!el) return;
  function tick(){
    const now=new Date(), end=new Date(); end.setHours(23,59,59,999);
    let s=Math.max(0, Math.floor((end-now)/1000));
    const h=String(Math.floor(s/3600)).padStart(2,'0'); s%=3600;
    const m=String(Math.floor(s/60)).padStart(2,'0');  s%=60;
    el.textContent = `${h}:${m}:${String(s).padStart(2,'0')}`;
  }
  tick(); setInterval(tick,1000);
})();

// ---------------- Carrossel
(function carousel(){
  const box=document.getElementById('promoCarousel'); if(!box) return;
  const slides=[...box.querySelectorAll('.slide')], prev=box.querySelector('.c-prev'), next=box.querySelector('.c-next');
  let i=slides.findIndex(s=>s.classList.contains('active')); if(i<0) i=0;
  const show=n=>slides.forEach((s,idx)=>{s.classList.toggle('active',idx===n); s.style.display = idx===n?'block':'none';});
  const go=d=>{i=(i+d+slides.length)%slides.length; show(i);};
  prev.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();go(-1);});
  next.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();go(1);});
  slides.forEach(s=>s.addEventListener('click',()=>{ const msg=encodeURIComponent(s.dataset.wa||'Quero a promoção'); window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`,'_blank');}));
  // swipe
  let x0=null; box.addEventListener('touchstart',e=>x0=e.touches[0].clientX,{passive:true});
  box.addEventListener('touchend',e=>{ if(x0==null) return; const dx=e.changedTouches[0].clientX-x0; if(Math.abs(dx)>40) go(dx<0?1:-1); x0=null;});
  show(i);
})();

// ---------------- Carrinho
let cart = JSON.parse(localStorage.getItem('dfl_cart')||'[]'); // {id,name,price,qty, type, extras:[{name, price, qty}]}
const saveCart = ()=>localStorage.setItem('dfl_cart', JSON.stringify(cart));
const cartCount = ()=>cart.reduce((s,i)=>s+i.qty,0);
function updateCartCount(){ const el=document.getElementById('cart-count'); if(el) el.textContent=cartCount(); }
function popAdded(name){ const d=document.createElement('div'); d.className='added-popup'; d.textContent=`+1 ${name}`; document.body.appendChild(d); setTimeout(()=>d.remove(),1200); }

function addToCartCard(card, extras=[]) {
  const id=card.dataset.id, name=card.dataset.name, price=Number(card.dataset.price||0), type=card.dataset.type||'other';
  // Se houver extras, adiciona como uma única linha com extras anexados
  const key = JSON.stringify({id, extras: extras.map(e=>({n:e.name, p:e.price}))}); // chave simplificada
  let item = cart.find(it => JSON.stringify({id:it.id, extras:(it.extras||[]).map(e=>({n:e.name,p:e.price}))}) === key);
  if(item) item.qty++;
  else cart.push({id,name,price,qty:1,type,extras: extras.length? extras.map(e=>({...e})) : []});
  saveCart(); updateCartCount(); renderMini(); popAdded(name);
}

// botões padrão "Adicionar"
document.addEventListener('click', e=>{
  if(e.target.classList.contains('add-cart')){
    const card = e.target.closest('.card');
    addToCartCard(card, []); // sem extras
  }
});

// ---------------- Mini-carrinho
const mini = document.getElementById('mini-cart');
const miniList = document.getElementById('mini-list');
const miniClose = document.querySelector('.mini-close');
const miniClear = document.getElementById('mini-clear');
const miniCheckout = document.getElementById('mini-checkout');
const backdrop = document.getElementById('cart-backdrop');
const cartIcon = document.getElementById('cart-icon');

function openMini(){ mini.classList.add('open'); backdrop.classList.add('open'); renderMini(); }
function closeMini(){ mini.classList.remove('open'); backdrop.classList.remove('open'); }

cartIcon.addEventListener('click', openMini);
miniClose.addEventListener('click', closeMini);
backdrop.addEventListener('click', closeMini);
miniClear.addEventListener('click', ()=>{ cart=[]; saveCart(); updateCartCount(); renderMini(); });

miniCheckout.addEventListener('click', ()=>{
  if(!cart.length){ alert('Seu carrinho está vazio.'); return; }
  // WhatsApp com negrito e extras indentados
  let lines = cart.map(it=>{
    const title = `- ${it.qty}x *${it.name}*`;
    const extras = (it.extras && it.extras.length)
      ? it.extras.map(ex=>`  + ${ex.qty||1}x ${ex.name}`).join('%0A')
      : '';
    return extras ? `${title}%0A${extras}` : title;
  }).join('%0A');
  const msg = `Olá! Gostaria de fazer um pedido:%0A${lines}`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
});

function renderMini(){
  miniList.innerHTML = '';
  if(!cart.length){
    miniList.innerHTML = '<div class="mini-item"><span class="mini-name">Seu carrinho está vazio.</span></div>';
    return;
  }
  cart.forEach((it, idx)=>{
    const row = document.createElement('div'); row.className='mini-item';
    const extrasText = (it.extras&&it.extras.length)
      ? `<div class="mini-extras">${it.extras.map(ex=>`+ ${ex.qty||1}x ${ex.name}`).join(' · ')}</div>`
      : '';
    row.innerHTML = `
      <div>
        <div class="mini-name">${it.name} ${it.price?`<span style="color:#FFD700">— R$ ${it.price.toFixed(2).replace('.',',')}</span>`:''}</div>
        ${extrasText}
      </div>
      <div class="mini-qty">
        <button class="qty-btn" data-idx="${idx}" data-act="dec">−</button>
        <span>${it.qty}</span>
        <button class="qty-btn" data-idx="${idx}" data-act="inc">+</button>
      </div>`;
    miniList.appendChild(row);
  });

  // listeners de quantidade
  miniList.querySelectorAll('.qty-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const idx = +btn.dataset.idx, act = btn.dataset.act;
      if(act==='inc') cart[idx].qty++;
      if(act==='dec'){ cart[idx].qty--; if(cart[idx].qty<=0) cart.splice(idx,1); }
      saveCart(); updateCartCount(); renderMini();
    });
  });
}

// ---------------- Adicionais (dados)
const extrasData = {
  burger: [
    {name:'Cebola', price:0.99},
    {name:'Salada', price:1.99},
    {name:'Ovo', price:1.99},
    {name:'Salsicha', price:1.99},
    {name:'Bacon', price:2.99},
    {name:'Molho Verde', price:2.99},
    {name:'Hambúrguer Tradicional', price:2.99},
    {name:'Cheddar', price:3.99},
    {name:'Filé de Frango', price:6.99},
    {name:'Hambúrguer Artesanal 120g', price:7.99},
  ],
  hotdog: [
    {name:'Cheddar', price:3.99},
    {name:'Molho Verde', price:2.99},
    {name:'Bacon', price:2.99},
    {name:'Salsicha', price:1.99},
    {name:'Vinagrete', price:2.99},
    {name:'Purê de Batata', price:3.99},
  ]
};

// ---------------- Modal de Adicionais (UI)
const extrasBackdrop = document.getElementById('extras-backdrop');
const extrasModal = document.getElementById('extras-modal');
const extrasTitle = document.getElementById('extras-title');
const extrasList = document.getElementById('extras-list');
const extrasClose = document.querySelector('.extras-close');
const extrasCancel = document.getElementById('extras-cancel');
const extrasAdd = document.getElementById('extras-add');

let extrasCurrentCard = null;
let extrasSelection = []; // [{name, price, qty}]

function openExtras(card){
  extrasCurrentCard = card;
  const type = card.dataset.type || 'burger';
  const name = card.dataset.name;
  extrasTitle.textContent = `Adicionais — ${name}`;
  // monta lista
  extrasSelection = [];
  const list = extrasData[type] || [];
  extrasList.innerHTML = '';
  list.forEach((ex, idx)=>{
    const row = document.createElement('div'); row.className='extras-row';
    row.innerHTML = `
      <div>
        <div class="extras-name">${ex.name}</div>
        <div class="extras-price">R$ ${ex.price.toFixed(2).replace('.',',')}</div>
      </div>
      <div class="extras-qty">
        <button class="extras-btn-qty" data-idx="${idx}" data-act="dec">−</button>
        <span id="ex-q-${idx}">0</span>
        <button class="extras-btn-qty" data-idx="${idx}" data-act="inc">+</button>
      </div>`;
    extrasList.appendChild(row);
  });
  extrasModal.classList.add('open'); extrasBackdrop.classList.add('open');
}

function closeExtras(){
  extrasModal.classList.remove('open'); extrasBackdrop.classList.remove('open');
  extrasCurrentCard = null; extrasSelection = [];
}

function applyExtras(){
  // coleta quantidades
  const type = extrasCurrentCard.dataset.type || 'burger';
  const base = extrasData[type] || [];
  extrasSelection = [];
  base.forEach((ex, idx)=>{
    const q = parseInt(document.getElementById(`ex-q-${idx}`).textContent,10) || 0;
    if(q>0) extrasSelection.push({name: ex.name, price: ex.price, qty: q});
  });
  addToCartCard(extrasCurrentCard, extrasSelection);
  closeExtras();
}

// eventos dos botões do modal
extrasList.addEventListener('click', e=>{
  if(!e.target.classList.contains('extras-btn-qty')) return;
  const idx = +e.target.dataset.idx, act = e.target.dataset.act;
  const span = document.getElementById(`ex-q-${idx}`);
  let v = parseInt(span.textContent,10)||0;
  if(act==='inc') v++;
  if(act==='dec') v = Math.max(0, v-1);
  span.textContent = v;
});
extrasClose.addEventListener('click', closeExtras);
extrasCancel.addEventListener('click', closeExtras);
extrasAdd.addEventListener('click', applyExtras);
extrasBackdrop.addEventListener('click', closeExtras);

// abrir modal ao clicar no botão de adicionais
document.addEventListener('click', e=>{
  if(e.target.classList.contains('extras-btn')){
    const card = e.target.closest('.card');
    openExtras(card);
  }
});

// ---------------- Init
document.addEventListener('DOMContentLoaded', ()=>{
  updateCartCount();
  renderMini();
});