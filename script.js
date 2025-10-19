// ================================
//  DFL – SCRIPT COMPLETO (v3.0)
// ================================

// WhatsApp oficial DFL
const WA_NUMBER = '5534997178336';

// ================================
// ⏳ CONTAGEM PROMOCIONAL (até 23:59)
// ================================
(function countdown(){
  const el = document.getElementById("countdown");
  if(!el) return;
  function tick(){
    const now = new Date();
    const end = new Date();
    end.setHours(23,59,59,999);
    const diff = Math.max(0, Math.floor((end - now)/1000));
    const h = String(Math.floor(diff/3600)).padStart(2,"0");
    const m = String(Math.floor((diff%3600)/60)).padStart(2,"0");
    const s = String(diff%60).padStart(2,"0");
    el.textContent = `${h}:${m}:${s}`;
  }
  tick();
  setInterval(tick,1000);
})();

// ================================
// 🛒 SISTEMA DE CARRINHO
// ================================
let cart = JSON.parse(localStorage.getItem("dfl_cart") || "[]");
function saveCart(){ localStorage.setItem("dfl_cart", JSON.stringify(cart)); }
function cartCount(){ return cart.reduce((s,i)=>s+i.qty,0); }
function updateCartCount(){
  const el = document.getElementById("cart-count");
  if(el) el.textContent = cartCount();
}
function addToCart(name, price){
  const item = cart.find(i=>i.name===name);
  if(item) item.qty++;
  else cart.push({name, price, qty:1});
  saveCart(); updateCartCount(); renderMini(); popAdded(name);
}

// Popup “+1 item”
function popAdded(name){
  const div = document.createElement("div");
  div.className="added-popup";
  div.textContent=`+1 ${name}`;
  document.body.appendChild(div);
  setTimeout(()=>div.remove(),1200);
}

// Botões “Adicionar”
document.addEventListener("click", e=>{
  if(e.target.classList.contains("add-btn")){
    const name=e.target.dataset.name;
    const price=parseFloat(e.target.dataset.price);
    addToCart(name,price);
  }
});

// ================================
// 🧾 MINI CARRINHO FLUTUANTE
// ================================
const mini=document.getElementById("mini-cart");
const backdrop=document.getElementById("cart-backdrop");
let miniList, miniClose, miniClear, miniCheckout;

function openMini(){
  mini.classList.add("open");
  backdrop.classList.add("open");
  renderMini();
}
function closeMini(){
  mini.classList.remove("open");
  backdrop.classList.remove("open");
}
function renderMini(){
  miniList=document.querySelector(".mini-list");
  miniClose=document.querySelector(".mini-close");
  miniClear=document.getElementById("mini-clear");
  miniCheckout=document.getElementById("mini-checkout");
  if(!miniList) return;
  miniList.innerHTML="";
  if(cart.length===0){
    miniList.innerHTML='<div class="mini-item"><span class="mini-name">Seu carrinho está vazio.</span></div>';
  }else{
    cart.forEach((item,idx)=>{
      const row=document.createElement("div");
      row.className="mini-item";
      row.innerHTML=`
        <span class="mini-name">${item.name}</span>
        <div class="mini-qty">
          <button class="qty-btn" data-idx="${idx}" data-act="dec">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" data-idx="${idx}" data-act="inc">+</button>
        </div>`;
      miniList.appendChild(row);
    });
  }
  attachMiniEvents();
}
function attachMiniEvents(){
  document.querySelectorAll(".qty-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const idx=btn.dataset.idx;
      const act=btn.dataset.act;
      if(act==="inc") cart[idx].qty++;
      if(act==="dec"){
        cart[idx].qty--;
        if(cart[idx].qty<=0) cart.splice(idx,1);
      }
      saveCart(); updateCartCount(); renderMini();
    });
  });
  if(miniClose) miniClose.onclick=closeMini;
  if(backdrop) backdrop.onclick=closeMini;
  if(miniClear) miniClear.onclick=()=>{
    cart=[]; saveCart(); updateCartCount(); renderMini();
  };
  if(miniCheckout) miniCheckout.onclick=()=>{
    if(cart.length===0){ alert("Seu carrinho está vazio."); return; }
    const lines=cart.map(i=>`- ${i.qty}x ${i.name}`).join("%0A");
    const msg=`Olá! Gostaria de fazer um pedido:%0A${lines}`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`,"_blank");
  };
}
document.getElementById("cart-icon").addEventListener("click", openMini);

// ================================
// 📦 INICIALIZAÇÃO
// ================================
document.addEventListener("DOMContentLoaded",()=>{
  updateCartCount();
  renderMini();
});