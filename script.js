/* =======================================
   DFL v1.3.1 – Script principal (COMPLETO E CORRIGIDO)
   - Corrige botão "Fechar Pedido"
   - Som click.wav
   - Login Google
   - Carrinho lateral funcional
   - Contador + Status
   - Carrossel clicável
   ======================================= */

const clickSound = new Audio("click.wav");
clickSound.volume = 0.4;
const ding = () => { try { clickSound.currentTime = 0; clickSound.play(); } catch {} };

const $  = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));

(function ensureFirebase(){
  if (!window.firebase) {
    console.error("Firebase não carregado.");
    return;
  }
  if (!firebase.apps.length) {
    const firebaseConfig = {
      apiKey: "AIzaSyF-XXXXXX",
      authDomain: "dafamilia-lanches.firebaseapp.com",
      projectId: "dafamilia-lanches",
      storageBucket: "dafamilia-lanches.appspot.com",
      messagingSenderId: "XXXXXX",
      appId: "1:XXXXXX:web:XXXXXX"
    };
    firebase.initializeApp(firebaseConfig);
  }
  window.auth = firebase.auth();
  window.db   = firebase.firestore();
})();

function ensureBaseUI() {
  if (!$("#cart-backdrop")) {
    const bd = document.createElement("div");
    bd.id = "cart-backdrop";
    document.body.appendChild(bd);
  }
  if (!$("#mini-cart")) {
    const aside = document.createElement("aside");
    aside.id = "mini-cart";
    aside.innerHTML = `
      <header class="mini-head">
        <h3>Seu Pedido</h3>
        <button class="mini-close">✕</button>
      </header>
      <div id="mini-list" class="mini-list"></div>
      <footer class="mini-foot">
        <button id="mini-clear" class="btn-secondary">Limpar carrinho</button>
        <button id="mini-checkout" class="btn-primary">Fechar pedido</button>
      </footer>`;
    document.body.appendChild(aside);
  }
  if (!$("#extras-backdrop")) {
    const bd = document.createElement("div");
    bd.id = "extras-backdrop";
    document.body.appendChild(bd);
  }
  if (!$("#extras-modal")) {
    const m = document.createElement("aside");
    m.id = "extras-modal";
    m.innerHTML = `
      <header class="extras-head">
        <h3>Adicionais</h3>
        <button class="extras-close">✕</button>
      </header>
      <div id="extras-list" class="extras-list"></div>
      <footer class="extras-foot">
        <button id="extras-cancel" class="btn-secondary">Cancelar</button>
        <button id="extras-add" class="btn-primary">Adicionar</button>
      </footer>`;
    document.body.appendChild(m);
  }
  if (!$("#user-chip")) {
    const header = $(".header") || document.body;
    const chip = document.createElement("button");
    chip.id = "user-chip";
    chip.textContent = "Entrar / Cadastro";
    chip.style.cssText = `
      position: fixed; top: 12px; right: 12px; z-index:1100;
      background:#f9d44b; color:#000; font-weight:700;
      border:none; border-radius:999px; padding:8px 12px; cursor:pointer;
      box-shadow:0 2px 6px rgba(0,0,0,.4);`;
    header.appendChild(chip);
  }
}
ensureBaseUI();

function buildAuthLogic(){
  const chip = $("#user-chip");
  chip?.addEventListener("click", ()=>{
    ding();
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(e=>console.error(e));
  });
  auth.onAuthStateChanged((user)=>{
    if(user){
      chip.textContent = `Olá, ${user.displayName || user.email.split("@")[0]} (Sair)`;
      chip.onclick = ()=>auth.signOut();
    } else {
      chip.textContent = "Entrar / Cadastro";
      chip.onclick = ()=> {
        ding();
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(e=>console.error(e));
      };
    }
  });
}
buildAuthLogic();

const cartBtn = $("#cart-icon");
const miniCart = $("#mini-cart");
const cartBackdrop = $("#cart-backdrop");
const cartList = $("#mini-list");
const clearCartBtn = $("#mini-clear");
const finishOrderBtn = $("#mini-checkout");
const closeCartBtn = $(".mini-close");

const CART_KEY = "dflCartV2";
let cart = [];
function loadCart(){ try{cart=JSON.parse(localStorage.getItem(CART_KEY))||[]}catch{cart=[];} }
function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartCount(); }
function updateCartCount(){
  const countEl = $("#cart-count");
  const totalQty = cart.reduce((s,x)=>s+(x.qty||0),0);
  if(countEl) countEl.textContent = totalQty;
}
function openCart(){ ding(); miniCart.classList.add("active"); cartBackdrop.classList.add("show"); }
function closeCart(){ miniCart.classList.remove("active"); cartBackdrop.classList.remove("show"); }
function addItem({id,name,price},qty=1){
  const key=id||name;
  const i=cart.findIndex(x=>(x.id||x.name)===key&&Number(x.price)===Number(price));
  if(i>=0)cart[i].qty+=qty; else cart.push({id:key,name,price:Number(price),qty:Number(qty)});
  renderCart(); saveCart(); showAddedPopup(name);
}
function incItem(i){cart[i].qty+=1; renderCart(); saveCart();}
function decItem(i){cart[i].qty-=1; if(cart[i].qty<=0)cart.splice(i,1); renderCart(); saveCart();}
function removeItem(i){cart.splice(i,1); renderCart(); saveCart();}
function clearCart(){cart=[]; renderCart(); saveCart();}
function renderCart(){
  if(!cartList)return;
  cartList.innerHTML="";
  cart.forEach((it,idx)=>{
    const li=document.createElement("div");
    li.className="cart-item";
    li.innerHTML=`
      <span>${it.name}</span>
      <div>
        <button class="qty-dec" data-idx="${idx}">–</button>
        <strong>${it.qty}</strong>
        <button class="qty-inc" data-idx="${idx}">+</button>
        <strong>R$ ${(it.price*it.qty).toFixed(2)}</strong>
        <button class="remove-item" data-idx="${idx}">✕</button>
      </div>`;
    cartList.appendChild(li);
  });
  updateCartCount();
}
function showAddedPopup(name){
  const el=document.createElement("div");
  el.className="popup-add";
  el.textContent=`🍔 ${name} adicionado!`;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),1400);
}

cartBtn?.addEventListener("click", openCart);
closeCartBtn?.addEventListener("click", closeCart);
cartBackdrop?.addEventListener("click", closeCart);
clearCartBtn?.addEventListener("click", ()=>{ ding(); clearCart(); });
$("#mini-list")?.addEventListener("click",(e)=>{
  const t=e.target;
  if(t.classList.contains("qty-inc"))incItem(Number(t.dataset.idx));
  else if(t.classList.contains("qty-dec"))decItem(Number(t.dataset.idx));
  else if(t.classList.contains("remove-item"))removeItem(Number(t.dataset.idx));
});
$$(".add-cart").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const card=btn.closest(".card"); if(!card)return;
    const id=card.dataset.id||card.dataset.name;
    const name=card.dataset.name;
    const price=parseFloat(card.dataset.price);
    ding(); addItem({id,name,price},1);
  });
});

function montarPedido(){
  const itens=cart.map((it,idx)=>({ordem:idx+1,nome:String(it.name),preco:Number(it.price),quantidade:Number(it.qty),subtotal:Number(it.price*it.qty)}));
  const total=itens.reduce((s,x)=>s+x.subtotal,0);
  const user=auth?.currentUser||null;
  return {itens,total,uid:user?user.uid:null,email:user?user.email:null};
}
function msgWhats(pedido){
  let m="🧾 *Pedido – Da Família Lanches*%0A%0A";
  pedido.itens.forEach(i=>{m+=`${i.ordem}. ${i.nome} (${i.quantidade}x) — R$ ${i.subtotal.toFixed(2)}%0A`;});
  m+=`%0A💰 *Total:* R$ ${pedido.total.toFixed(2)}%0A📍 Patos de Minas`;
  return m;
}
async function handleCheckout(){
  ding();
  if(!cart.length){alert("Seu carrinho está vazio!");return;}
  const pedido=montarPedido();
  const numero="5534997178336";
  const mensagem=msgWhats(pedido);
  window.open(`https://wa.me/${numero}?text=${mensagem}`,"_blank");
  closeCart();
}
finishOrderBtn?.addEventListener("click", handleCheckout);

function atualizarContagem(){
  const el=$("#timer"); if(!el)return;
  const agora=new Date(); const fim=new Date(); fim.setHours(23,59,59,999);
  const diff=fim-agora;
  if(diff<=0){el.textContent="00:00:00";return;}
  const h=Math.floor(diff/1000/60/60);
  const m=Math.floor((diff/1000/60)%60);
  const s=Math.floor((diff/1000)%60);
  el.textContent=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function atualizarStatus(){
  const banner=$("#status-banner"); if(!banner)return;
  const agora=new Date(); const dia=agora.getDay();
  const h=agora.getHours(), min=agora.getMinutes();
  let aberto=false, msg="";
  if(dia===2){msg="❌ Fechado — abrimos amanhã às 18h";}
  else if([1,3,4].includes(dia)){
    aberto=h>=18&&(h<23||(h===23&&min<=15));
    msg=aberto?"🟢 Aberto até 23h15":"🔴 Fechado — abrimos às 18h";
  }else if([5,6,0].includes(dia)){
    aberto=h>=17&&(h<23||(h===23&&min<=30));
    msg=aberto?"🟢 Aberto até 23h30":"🔴 Fechado — abrimos às 17h30";
  }
  banner.textContent=msg;
  banner.className=aberto?"status-banner aberto":"status-banner fechado";
}
setInterval(atualizarContagem,1000);
setInterval(atualizarStatus,60000);

function initCarousel(){
  const wrap=$("#promoCarousel");
  if(!wrap)return;
  const slides=$$(".slide",wrap);
  const prev=$(".c-prev",wrap), next=$(".c-next",wrap);
  let idx=0;
  function show(i){slides.forEach((s,k)=>s.style.display=(k===i?"block":"none"));}
  show(idx);
  prev?.addEventListener("click",()=>{ding();idx=(idx-1+slides.length)%slides.length;show(idx);});
  next?.addEventListener("click",()=>{ding();idx=(idx+1)%slides.length;show(idx);});
  setInterval(()=>{idx=(idx+1)%slides.length;show(idx);},5000);
  slides.forEach(img=>{
    img.style.cursor="pointer";
    img.addEventListener("click",()=>{
      ding();
      const label=img.getAttribute("data-wa")||`Quero a ${img.alt||"promoção"}`;
      const numero="5534997178336";
      const texto=encodeURIComponent(`Olá! ${label}`);
      window.open(`https://wa.me/${numero}?text=${texto}`,"_blank");
    });
  });
}

document.addEventListener("DOMContentLoaded",()=>{
  loadCart(); renderCart(); updateCartCount();
  atualizarContagem(); atualizarStatus(); initCarousel();
});