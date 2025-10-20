/* =======================================
   DFL v1.2 – Script principal completo
   ======================================= */

/* 🔊 Som global */
const clickSound = new Audio("click.mp3"); // deixe click.mp3 na raiz
clickSound.volume = 0.35;

/* ========================
   Firebase v8 – Config
======================== */
const firebaseConfig = {
  apiKey: "AIzaSyF-XXXXXX",
  authDomain: "dafamilia-lanches.firebaseapp.com",
  projectId: "dafamilia-lanches",
  storageBucket: "dafamilia-lanches.appspot.com",
  messagingSenderId: "XXXXXX",
  appId: "1:XXXXXX:web:XXXXXX"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

/* ========================
   Variáveis do carrinho
======================== */
const CART_KEY = "dflCartV2";
let cart = []; // [{id,name,price,qty}]

const cartBtn        = document.getElementById("cart-icon");
const cartBackdrop   = document.getElementById("cart-backdrop");
const miniCart       = document.getElementById("mini-cart");
const cartList       = document.getElementById("mini-list");
const cartCount      = document.getElementById("cart-count");
const clearCartBtn   = document.getElementById("mini-clear");
const checkoutBtn    = document.getElementById("mini-checkout");
const miniCloseBtn   = document.querySelector(".mini-close");

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

/* ========================
   Carrinho – helpers
======================== */
function loadCart() {
  try { cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
  catch { cart = []; }
  updateCartBadge();
}
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}
function updateCartBadge() {
  const totalQty = cart.reduce((s, i)=> s+i.qty, 0);
  cartCount.textContent = totalQty;
}
function openCart() {
  clickSound.currentTime=0; clickSound.play().catch(()=>{});
  miniCart.classList.add("active");
  cartBackdrop.classList.add("show");
}
function closeCart() {
  miniCart.classList.remove("active");
  cartBackdrop.classList.remove("show");
}
function addItem({id,name,price}, qty=1){
  const idx = cart.findIndex(x => (x.id===id) && x.price===price);
  if (idx>=0) cart[idx].qty += qty;
  else cart.push({id,name,price,qty});
  renderCart(); saveCart(); showAddedPopup(name);
  if (!miniCart.classList.contains("active")) openCart();
}
function incItem(i){ cart[i].qty++; renderCart(); saveCart(); }
function decItem(i){ cart[i].qty--; if(cart[i].qty<=0) cart.splice(i,1); renderCart(); saveCart(); }
function removeItem(i){ cart.splice(i,1); renderCart(); saveCart(); }
function clearCart(){ cart = []; renderCart(); saveCart(); }

function renderCart() {
  cartList.innerHTML = "";
  let total = 0;
  cart.forEach((it, idx) => {
    total += it.price * it.qty;
    const li = document.createElement("div");
    li.className = "cart-item";
    li.innerHTML = `
      <span>${it.name}</span>
      <div style="display:flex;align-items:center;gap:8px;">
        <button class="qty-dec" data-i="${idx}">–</button>
        <strong>${it.qty}x</strong>
        <button class="qty-inc" data-i="${idx}">+</button>
        <strong>R$ ${(it.price*it.qty).toFixed(2)}</strong>
        <button class="remove-item" data-i="${idx}">✕</button>
      </div>
    `;
    cartList.appendChild(li);
  });
  // mostra/oculta botões do rodapé
  const show = cart.length>0 ? "inline-flex" : "none";
  clearCartBtn.style.display = show;
  checkoutBtn.style.display  = show;
  updateCartBadge();
}
function showAddedPopup(name){
  const pop = document.createElement("div");
  pop.className = "popup-add";
  pop.textContent = `🍔 ${name} adicionado!`;
  document.body.appendChild(pop);
  setTimeout(()=>pop.remove(),1400);
}

/* ========================
   Adicionais (modal simples)
======================== */
const extrasModal   = document.getElementById("extras-modal");
const extrasList    = document.getElementById("extras-list");
const extrasAddBtn  = document.getElementById("extras-add");
const extrasCancel  = document.getElementById("extras-cancel");
const extrasClose   = document.querySelector(".extras-close");
const extrasBackdrop= document.getElementById("extras-backdrop");

function openExtras() {
  extrasList.innerHTML = `
    <label><span>Bacon</span><input type="checkbox" data-name="Bacon" data-price="2.99"></label>
    <label><span>Cheddar</span><input type="checkbox" data-name="Cheddar" data-price="3.99"></label>
    <label><span>Ovo</span><input type="checkbox" data-name="Ovo" data-price="1.99"></label>
    <label><span>Salada</span><input type="checkbox" data-name="Salada" data-price="1.99"></label>
    <label><span>Molho Verde</span><input type="checkbox" data-name="Molho Verde" data-price="2.99"></label>
  `;
  extrasModal.classList.add("show");
  extrasBackdrop.classList.add("show");
}
function closeExtras(){
  extrasModal.classList.remove("show");
  extrasBackdrop.classList.remove("show");
}
extrasAddBtn?.addEventListener("click", ()=>{
  const checks = extrasList.querySelectorAll("input:checked");
  checks.forEach(ch => {
    addItem({ id: "extra:"+ch.dataset.name, name: ch.dataset.name, price: parseFloat(ch.dataset.price) }, 1);
  });
  closeExtras();
});
extrasCancel?.addEventListener("click", closeExtras);
extrasClose?.addEventListener("click", closeExtras);
extrasBackdrop?.addEventListener("click", closeExtras);

/* ========================
   Checkout (WhatsApp + Firestore)
======================== */
function montarPedido() {
  const itens = cart.map((it, i)=>({
    ordem: i+1,
    nome: it.name,
    preco: Number(it.price),
    quantidade: Number(it.qty),
    subtotal: Number(it.price*it.qty)
  }));
  const total = itens.reduce((s,x)=>s+x.subtotal,0);
  const user  = auth.currentUser || null;
  return {
    itens, total, moeda:"BRL", origem:"site", status:"aberto",
    uid: user? user.uid : null,
    email: user? user.email : null,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
  };
}
async function salvarPedido(pedido){
  try{
    const ref = await db.collection("pedidos").add(pedido);
    return ref.id;
  }catch(e){ console.error("Salvar pedido:",e); return null; }
}
function mensagemWhats(pedido){
  let msg = "🧾 *Pedido – Da Família Lanches*%0A%0A";
  pedido.itens.forEach(it=>{
    msg += `${it.ordem}. ${it.nome} (${it.quantidade}x) — R$ ${it.subtotal.toFixed(2)}%0A`;
  });
  msg += `%0A💰 *Total:* R$ ${pedido.total.toFixed(2)}%0A📍 Patos de Minas`;
  return msg;
}
async function handleCheckout(){
  try{
    if(!cart.length){ alert("Seu carrinho está vazio."); return; }
    clickSound.currentTime=0; clickSound.play().catch(()=>{});
    const pedido = montarPedido();
    await salvarPedido(pedido); // não bloqueia o WhatsApp
    const numero = "5534997178336";
    const texto  = mensagemWhats(pedido);
    window.open(`https://wa.me/${numero}?text=${texto}`,"_blank");
    closeCart();
    // clearCart(); // descomente se quiser limpar após envio
  }catch(e){
    console.error(e);
    alert("Não foi possível finalizar agora. Tente novamente.");
  }
}

/* ========================
   Login Google + Meus Pedidos
======================== */
function buildAuthUI() {
  const header = document.querySelector(".header");
  let userBtn = document.querySelector("#user-btn");
  if (!userBtn) {
    userBtn = document.createElement("button");
    userBtn.id = "user-btn";
    userBtn.className = "user-button";
    header.appendChild(userBtn);
  }
  auth.onAuthStateChanged(user=>{
    if(user){
      userBtn.innerHTML = `Olá, ${user.displayName || user.email.split("@")[0]} (Sair)`;
      userBtn.onclick = ()=> auth.signOut();
      ensureOrdersFab(user);
    }else{
      userBtn.innerHTML = "Entrar / Cadastro";
      userBtn.onclick = loginGoogle;
      ensureOrdersFab(null);
    }
  });
}
function loginGoogle(){
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err=> alert("Erro ao entrar: "+err.message));
}
function ensureOrdersFab(user){
  let fab = document.getElementById("orders-fab");
  if(user && !fab){
    fab = document.createElement("button");
    fab.id = "orders-fab";
    fab.innerHTML = "📜 <span>Meus Pedidos</span>";
    document.body.appendChild(fab);
    requestAnimationFrame(()=> fab.classList.add("show"));
    fab.onclick = async ()=>{
      const list = await loadUserOrders(user.uid);
      renderOrders(list);
      document.getElementById("orders-panel")?.classList.add("active");
    };
  }
  if(!user && fab) fab.remove();
}
async function loadUserOrders(uid){
  try{
    const snap = await db.collection("pedidos")
      .where("uid","==",uid)
      .orderBy("criadoEm","desc")
      .limit(20)
      .get();
    const arr=[]; snap.forEach(d=>arr.push({id:d.id, ...d.data()}));
    return arr;
  }catch(e){ console.error(e); return []; }
}
function renderOrders(list){
  const content = document.getElementById("orders-content");
  if(!content) return;
  if(!list.length){ content.innerHTML = `<p class="empty-orders">Nenhum pedido foi encontrado.</p>`; return; }
  content.innerHTML = "";
  list.forEach(p=>{
    const total = (p.total||0).toFixed(2);
    const quando = p.criadoEm?.toDate ? p.criadoEm.toDate().toLocaleString("pt-BR") : "";
    const box = document.createElement("div");
    box.className = "order-item";
    box.innerHTML = `
      <h4>Pedido #${p.id.slice(-6).toUpperCase()} <small>${quando}</small></h4>
      <ul style="margin:4px 0 8px 16px;">
        ${(p.itens||[]).map((it,i)=>`<li>${i+1}. ${it.nome} — ${it.quantidade}x (R$ ${(it.subtotal||0).toFixed(2)})</li>`).join("")}
      </ul>
      <strong>Total: R$ ${total}</strong>
    `;
    content.appendChild(box);
  });
}
// fechar painel pedidos
document.querySelector(".orders-close")?.addEventListener("click", ()=>{
  document.getElementById("orders-panel")?.classList.remove("active");
});

/* ========================
   Status + Timer + Carrossel
======================== */
function atualizarStatus(){
  const banner = document.getElementById("status-banner");
  if(!banner) return;
  const agora = new Date(); const dia = agora.getDay(); const h = agora.getHours(); const m = agora.getMinutes();
  let aberto=false, msg="";
  if (dia===2) msg = "❌ Fechado — abrimos amanhã às 18h";
  else if ([1,3,4].includes(dia)) {
    aberto = h>=18 && (h<23 || (h===23 && m<=15));
    msg = aberto ? "🟢 Aberto até 23h15" : "🔴 Fechado — abrimos às 18h";
  } else if ([5,6,0].includes(dia)) {
    aberto = h>=17 && (h<23 || (h===23 && m<=30));
    msg = aberto ? "🟢 Aberto até 23h30" : "🔴 Fechado — abrimos às 17h30";
  }
  banner.textContent = msg;
}
setInterval(atualizarStatus, 60000);

function updateCountdown(){
  const el = document.getElementById("timer"); if(!el) return;
  const now = new Date(), end = new Date(); end.setHours(23,59,59,999);
  const diff = end-now; if(diff<=0){ el.textContent="00:00:00"; return; }
  const h = Math.floor(diff/3_600_000), m = Math.floor((diff/60_000)%60), s=Math.floor((diff/1000)%60);
  el.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
setInterval(updateCountdown,1000);

function initCarousel(){
  const cont = document.querySelector("#promoCarousel .slides"); if(!cont) return;
  const prev = document.querySelector("#promoCarousel .c-prev");
  const next = document.querySelector("#promoCarousel .c-next");
  const slides = Array.from(cont.querySelectorAll(".slide")); if(!slides.length) return;
  let i=0; function show(k){ slides.forEach((s,idx)=> s.style.display = (idx===k?"block":"none")); }
  show(i);
  prev?.addEventListener("click", ()=>{ clickSound.play().catch(()=>{}); i=(i-1+slides.length)%slides.length; show(i); });
  next?.addEventListener("click", ()=>{ clickSound.play().catch(()=>{}); i=(i+1)%slides.length; show(i); });
  setInterval(()=>{ i=(i+1)%slides.length; show(i); }, 5000);
}

/* ========================
   Bootstrap
======================== */
window.addEventListener("DOMContentLoaded", ()=>{
  // Carrinho fechado inicialmente
  miniCart?.classList.remove("active");
  cartBackdrop?.classList.remove("show");

  // Carregar carrinho e montar eventos
  loadCart(); renderCart(); updateCountdown(); atualizarStatus(); initCarousel(); buildAuthUI();

  // Ações carrinho
  cartBtn?.addEventListener("click", openCart);
  miniCloseBtn?.addEventListener("click", closeCart);
  cartBackdrop?.addEventListener("click", closeCart);
  clearCartBtn?.addEventListener("click", clearCart);
  checkoutBtn?.addEventListener("click", handleCheckout);

  // Delegação de + / – / remover
  cartList?.addEventListener("click", (e)=>{
    const t = e.target;
    if(t.classList.contains("qty-inc")) incItem(Number(t.dataset.i));
    else if(t.classList.contains("qty-dec")) decItem(Number(t.dataset.i));
    else if(t.classList.contains("remove-item")) removeItem(Number(t.dataset.i));
  });

  // Botões “Adicionar” e “Adicionais”
  document.querySelectorAll(".add-cart").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const card = btn.closest(".card"); if(!card) return;
      const id = card.dataset.id, name = card.dataset.name, price = parseFloat(card.dataset.price);
      addItem({id,name,price},1);
    });
  });
  document.querySelectorAll(".extras-btn").forEach(btn=>{
    btn.addEventListener("click", openExtras);
  });
});