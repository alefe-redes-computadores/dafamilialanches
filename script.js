/* =======================================
   DFL v1.3 – Script principal (COMPLETO)
   - Cria UI que faltar (login, carrinho, modais)
   - Carrinho com quantidade (localStorage)
   - Login Google (Firebase v8)
   - Status Aberto/Fechado + Contador Promo
   - Carrossel Prev/Next + clique abre WhatsApp
   - Fechar pedido -> WhatsApp
   - Som global click.wav
   ======================================= */

/* ========== Som Global ========== */
const clickSound = new Audio("click.wav");
clickSound.volume = 0.4;
const ding = () => { try { clickSound.currentTime = 0; clickSound.play(); } catch {} };

/* ========== Helpers ========== */
const $  = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));

/* =====================================================
   Firebase (usa v8 carregado no HTML)
   ===================================================== */
(function ensureFirebase(){
  if (!window.firebase) {
    console.error("Firebase não carregado no HTML.");
    return;
  }
  // Se seu HTML já inicializa o firebase, não reinicia:
  if (!firebase.apps.length) {
    // Ajuste para o seu projeto real (se necessário):
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

/* =====================================================
   Monta elementos que podem faltar no HTML
   - Carrinho lateral
   - Backdrops
   - Modal de adicionais (reaproveitado)
   - Modal de login
   ===================================================== */
function ensureBaseUI() {
  // Backdrop genérico
  if (!$("#cart-backdrop")) {
    const bd = document.createElement("div");
    bd.id = "cart-backdrop";
    document.body.appendChild(bd);
  }

  // Carrinho lateral
  if (!$("#mini-cart")) {
    const aside = document.createElement("aside");
    aside.id = "mini-cart";
    aside.setAttribute("aria-hidden","true");
    aside.innerHTML = `
      <header class="mini-head">
        <h3>Seu Pedido</h3>
        <button class="mini-close" aria-label="Fechar">✕</button>
      </header>
      <div id="mini-list" class="mini-list"></div>
      <footer class="mini-foot">
        <button id="mini-clear" class="btn-secondary">Limpar carrinho</button>
        <button id="mini-checkout" class="btn-primary">Fechar pedido</button>
      </footer>
    `;
    document.body.appendChild(aside);
  }

  // Modal de adicionais
  if (!$("#extras-backdrop")) {
    const bd = document.createElement("div");
    bd.id = "extras-backdrop";
    document.body.appendChild(bd);
  }
  if (!$("#extras-modal")) {
    const m = document.createElement("aside");
    m.id = "extras-modal";
    m.setAttribute("aria-hidden","true");
    m.innerHTML = `
      <header class="extras-head">
        <h3 id="extras-title">Adicionais</h3>
        <button class="extras-close" aria-label="Fechar">✕</button>
      </header>
      <div id="extras-list" class="extras-list"></div>
      <footer class="extras-foot">
        <button id="extras-cancel" class="btn-secondary">Cancelar</button>
        <button id="extras-add" class="btn-primary">Adicionar ao carrinho</button>
      </footer>
    `;
    document.body.appendChild(m);
  }

  // UI de Login (chip + modal)
  if (!$("#user-chip")) {
    const header = $(".header") || document.body;
    const chip = document.createElement("button");
    chip.id = "user-chip";
    chip.type = "button";
    chip.textContent = "Entrar / Cadastro";
    chip.style.cssText = `
      position: fixed; top: 12px; right: 12px; z-index:1100;
      background:#f9d44b; color:#000; font-weight:700; border:none;
      border-radius:999px; padding:8px 12px; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,.4);
    `;
    header.appendChild(chip);

    const backdrop = document.createElement("div");
    backdrop.id = "auth-backdrop";
    backdrop.style.cssText = `position:fixed; inset:0; background:rgba(0,0,0,.55); display:none; z-index:1200;`;
    document.body.appendChild(backdrop);

    const modal = document.createElement("div");
    modal.id = "auth-modal";
    modal.style.cssText = `
      position:fixed; left:50%; top:50%; transform:translate(-50%,-50%);
      background:#111; color:#fff; border:2px solid #f9d44b; border-radius:14px;
      width:90%; max-width:420px; padding:18px; z-index:1210; display:none;
      box-shadow:0 10px 30px rgba(0,0,0,.5);
    `;
    modal.innerHTML = `
      <h3 style="color:#f9d44b; margin:0 0 10px">Entrar / Criar conta</h3>
      <button id="btn-google" style="
        width:100%;
        display:flex; align-items:center; justify-content:center; gap:10px;
        padding:10px; border-radius:8px; border:1px solid #ccc; background:#fff; color:#111; font-weight:600; margin-bottom:12px;">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" height="20"/>
        <span>Continuar com Google</span>
      </button>
      <div style="height:1px;background:#333;margin:10px 0;"></div>
      <label style="display:block; font-size:.9rem; margin-bottom:6px;">E-mail</label>
      <input id="auth-email" type="email" placeholder="seu@email.com"
        style="width:100%; padding:10px; border-radius:8px; border:1px solid #333; background:#1a1a1a; color:#fff; margin-bottom:12px;" />
      <label style="display:block; font-size:.9rem; margin-bottom:6px;">Senha</label>
      <input id="auth-pass" type="password" placeholder="mínimo 6 caracteres"
        style="width:100%; padding:10px; border-radius:8px; border:1px solid #333; background:#1a1a1a; color:#fff; margin-bottom:16px;" />
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button id="btn-login" style="flex:1; background:#f9d44b; color:#000; font-weight:700; border:none; border-radius:8px; padding:10px;">Entrar</button>
        <button id="btn-sign"  style="flex:1; background:#f9d44b; color:#000; font-weight:700; border:none; border-radius:8px; padding:10px;">Criar conta</button>
        <button id="btn-close" style="flex:1; background:#333; color:#fff; border:1px solid #444; border-radius:8px; padding:10px;">Fechar</button>
      </div>
      <p id="auth-msg" style="margin-top:12px; min-height:20px; font-size:.9rem; color:#ffb13b;"></p>
    `;
    document.body.appendChild(modal);
  }
}
ensureBaseUI();

/* =====================================================
   Login (Google + Email/Senha)
   ===================================================== */
function buildAuthLogic(){
  const chip = $("#user-chip");
  const modal = $("#auth-modal");
  const backdrop = $("#auth-backdrop");
  const msg = $("#auth-msg");
  const emailEl = $("#auth-email");
  const passEl = $("#auth-pass");
  const btnGoogle = $("#btn-google");

  const open = ()=>{ ding(); backdrop.style.display="block"; modal.style.display="block"; };
  const close = ()=>{ backdrop.style.display="none"; modal.style.display="none"; };

  $("#btn-close")?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);
  chip?.addEventListener("click", open);

  async function doLogin() {
    msg.textContent = "Entrando...";
    try {
      await auth.signInWithEmailAndPassword(emailEl.value.trim(), passEl.value);
      msg.textContent = "✅ Login realizado!";
      await sleep(600);
      close();
    } catch (e) {
      msg.textContent = "⚠️ " + (e.message || "Erro ao entrar");
    }
  }
  async function doSign() {
    msg.textContent = "Criando conta...";
    try {
      await auth.createUserWithEmailAndPassword(emailEl.value.trim(), passEl.value);
      msg.textContent = "✅ Conta criada! Você já está logado.";
      await sleep(700);
      close();
    } catch (e) {
      msg.textContent = "⚠️ " + (e.message || "Erro ao criar conta");
    }
  }
  $("#btn-login")?.addEventListener("click", doLogin);
  $("#btn-sign")?.addEventListener("click", doSign);

  btnGoogle?.addEventListener("click", async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      msg.textContent = "✅ Logado com Google!";
      await sleep(500);
      close();
    } catch (e) {
      msg.textContent = "⚠️ " + (e.message || "Erro no Google Sign-In");
    }
  });

  auth.onAuthStateChanged((user) => {
    if (user) {
      chip.textContent = `Olá, ${user.displayName || user.email.split("@")[0]} (Sair)`;
      chip.onclick = async ()=>{ ding(); await auth.signOut(); };
    } else {
      chip.textContent = "Entrar / Cadastro";
      chip.onclick = open;
    }
  });
}
buildAuthLogic();

/* =====================================================
   Carrinho com quantidade (cria/open/close/render)
   ===================================================== */
const cartBtn = $("#cart-icon");
const miniCart = $("#mini-cart");
const cartBackdrop = $("#cart-backdrop");
const cartList = $("#mini-list");
const clearCartBtn = $("#mini-clear");
const finishOrderBtn = $("#mini-checkout");
const closeCartBtn = $(".mini-close");

const CART_KEY = "dflCartV2";
let cart = [];
function loadCart(){
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { cart = []; }
}
function saveCart(){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}
function updateCartCount(){
  const countEl = $("#cart-count");
  const totalQty = cart.reduce((s,x)=>s+(x.qty||0),0);
  if (countEl) countEl.textContent = totalQty;
}

function openCart(){ ding(); miniCart.classList.add("active"); cartBackdrop.classList.add("show"); document.body.classList.add("no-scroll"); }
function closeCart(){ miniCart.classList.remove("active"); cartBackdrop.classList.remove("show"); document.body.classList.remove("no-scroll"); }

function addItem({id,name,price}, qty=1){
  const key = id || name;
  const i = cart.findIndex(x => (x.id||x.name)===key && Number(x.price)===Number(price));
  if (i>=0) cart[i].qty += qty;
  else cart.push({id:key, name, price:Number(price), qty:Number(qty)});
  renderCart(); saveCart(); showAddedPopup(name);
  if (!miniCart.classList.contains("active")) openCart();
}
function incItem(i){ cart[i].qty += 1; renderCart(); saveCart(); }
function decItem(i){ cart[i].qty -= 1; if (cart[i].qty<=0) cart.splice(i,1); renderCart(); saveCart(); }
function removeItem(i){ cart.splice(i,1); renderCart(); saveCart(); }
function clearCart(){ cart = []; renderCart(); saveCart(); }

function renderCart(){
  if (!cartList) return;
  cartList.innerHTML = "";
  cart.forEach((it, idx)=>{
    const li = document.createElement("div");
    li.className = "cart-item";
    li.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 0; border-bottom:1px solid #eee;";
    li.innerHTML = `
      <span style="flex:1">${it.name}</span>
      <div style="display:flex; align-items:center; gap:6px;">
        <button class="qty-dec" data-idx="${idx}" aria-label="Diminuir">–</button>
        <strong>${it.qty}x</strong>
        <button class="qty-inc" data-idx="${idx}" aria-label="Aumentar">+</button>
        <strong>R$ ${(it.price * it.qty).toFixed(2)}</strong>
        <button class="remove-item" data-idx="${idx}" aria-label="Remover">✕</button>
      </div>
    `;
    cartList.appendChild(li);
  });
  updateCartCount();
  if (clearCartBtn)  clearCartBtn.style.display  = cart.length? "inline-block":"none";
  if (finishOrderBtn) finishOrderBtn.style.display = cart.length? "inline-block":"none";
}

function showAddedPopup(name){
  const el = document.createElement("div");
  el.className = "popup-add";
  el.textContent = `🍔 ${name} adicionado!`;
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 1400);
}

/* Eventos do carrinho */
cartBtn?.addEventListener("click", openCart);
closeCartBtn?.addEventListener("click", closeCart);
cartBackdrop?.addEventListener("click", closeCart);
clearCartBtn?.addEventListener("click", ()=>{ ding(); clearCart(); });

/* Botões “Adicionar” (cards) */
$$(".add-cart").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const card = btn.closest(".card"); if (!card) return;
    const id = card.dataset.id || card.dataset.name;
    const name = card.dataset.name;
    const price = parseFloat(card.dataset.price);
    ding();
    addItem({id,name,price}, 1);
  });
});

/* Adicionais */
const extrasModal = $("#extras-modal");
const extrasBackdrop = $("#extras-backdrop");
const extrasList = $("#extras-list");
$("#extras-cancel")?.addEventListener("click", ()=>{ extrasModal.classList.remove("show"); extrasBackdrop.classList.remove("show"); });
$(".extras-close")?.addEventListener("click", ()=>{ extrasModal.classList.remove("show"); extrasBackdrop.classList.remove("show"); });
extrasBackdrop?.addEventListener("click", ()=>{ extrasModal.classList.remove("show"); extrasBackdrop.classList.remove("show"); });

let produtoAtual = null;
$$(".extras-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    produtoAtual = btn.closest(".card");
    if (extrasList) {
      extrasList.innerHTML = `
        <label><span>🧅 Cebola</span><input type="checkbox" value="Cebola" data-price="0.99"></label>
        <label><span>🥬 Salada</span><input type="checkbox" value="Salada" data-price="1.99"></label>
        <label><span>🥚 Ovo</span><input type="checkbox" value="Ovo" data-price="1.99"></label>
        <label><span>🌭 Salsicha</span><input type="checkbox" value="Salsicha" data-price="1.99"></label>
        <label><span>🥓 Bacon</span><input type="checkbox" value="Bacon" data-price="2.99"></label>
        <label><span>🌿 Molho Verde</span><input type="checkbox" value="Molho Verde" data-price="2.99"></label>
        <label><span>🧀 Cheddar</span><input type="checkbox" value="Cheddar" data-price="3.99"></label>
      `;
    }
    extrasModal.classList.add("show");
    extrasBackdrop.classList.add("show");
  });
});

$("#extras-add")?.addEventListener("click", ()=>{
  ding();
  const checks = $$("#extras-list input[type='checkbox']:checked");
  checks.forEach(cb=>{
    addItem({ id:"extra:"+cb.value, name:cb.value, price: parseFloat(cb.dataset.price) }, 1);
  });
  extrasModal.classList.remove("show");
  extrasBackdrop.classList.remove("show");
});

/* Delegação dentro da lista do carrinho */
$("#mini-list")?.addEventListener("click", (e)=>{
  const t = e.target;
  if (t.classList.contains("qty-inc")) incItem(Number(t.dataset.idx));
  else if (t.classList.contains("qty-dec")) decItem(Number(t.dataset.idx));
  else if (t.classList.contains("remove-item")) removeItem(Number(t.dataset.idx));
});
/* =====================================================
   Finalizar pedido -> WhatsApp (+ Firestore opcional)
   ===================================================== */
function montarPedido() {
  const itens = cart.map((it, idx)=>({
    ordem: idx+1,
    nome: String(it.name),
    preco: Number(it.price),
    quantidade: Number(it.qty),
    subtotal: Number(it.price*it.qty)
  }));
  const total = itens.reduce((s,x)=>s+x.subtotal,0);
  const user = auth?.currentUser || null;
  return {
    itens, total, moeda:"BRL", origem:"site", status:"aberto",
    uid: user ? user.uid : null,
    email: user ? user.email : null,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
  };
}
function msgWhats(pedido){
  let m = "🧾 *Pedido – Da Família Lanches*%0A%0A";
  pedido.itens.forEach(i=>{
    m += `${i.ordem}. ${i.nome} (${i.quantidade}x) — R$ ${i.subtotal.toFixed(2)}%0A`;
  });
  m += `%0A💰 *Total:* R$ ${pedido.total.toFixed(2)}%0A📍 Patos de Minas`;
  return m;
}
async function salvarPedido(pedido){
  try{
    if (!window.db) return {ok:false,id:null};
    const ref = await db.collection("pedidos").add(pedido);
    return {ok:true,id:ref.id};
  }catch(e){
    console.error("Erro ao salvar:",e);
    return {ok:false,id:null};
  }
}
async function handleCheckout(){
  try{
    ding();
    if (!cart.length) { alert("Seu carrinho está vazio!"); return; }
    const pedido = montarPedido();
    await salvarPedido(pedido); // não bloqueia o fluxo se falhar
    const numero = "5534997178336";
    const mensagem = msgWhats(pedido);
    window.open(`https://wa.me/${numero}?text=${mensagem}`, "_blank");
    closeCart();
  }catch(e){
    console.error(e);
    alert("Não foi possível finalizar agora. Tente novamente.");
  }
}
$("#mini-checkout")?.addEventListener("click", handleCheckout);

/* =====================================================
   Contador Promo + Status Aberto/Fechado
   ===================================================== */
function atualizarContagem(){
  const el = $("#timer"); if (!el) return;
  const agora = new Date();
  const fim = new Date(); fim.setHours(23,59,59,999);
  const diff = fim - agora;
  if (diff<=0){ el.textContent = "00:00:00"; return; }
  const h = Math.floor(diff/1000/60/60);
  const m = Math.floor((diff/1000/60)%60);
  const s = Math.floor((diff/1000)%60);
  el.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function atualizarStatus(){
  const banner = $("#status-banner"); if (!banner) return;
  const agora = new Date();
  const dia = agora.getDay(); // 0-dom ... 2-ter
  const h = agora.getHours(), min = agora.getMinutes();
  let aberto=false, msg="";
  if (dia===2){ msg="❌ Fechado — abrimos amanhã às 18h"; }
  else if ([1,3,4].includes(dia)){ // seg, qua, qui
    aberto = h>=18 && (h<23 || (h===23 && min<=15));
    msg = aberto ? "🟢 Aberto até 23h15" : "🔴 Fechado — abrimos às 18h";
  } else if ([5,6,0].includes(dia)){ // sex, sáb, dom
    aberto = h>=17 && (h<23 || (h===23 && min<=30));
    msg = aberto ? "🟢 Aberto até 23h30" : "🔴 Fechado — abrimos às 17h30";
  }
  banner.textContent = msg;
  banner.className = aberto ? "status-banner aberto" : "status-banner fechado";
}
setInterval(atualizarContagem, 1000);
setInterval(atualizarStatus, 60000);

/* =====================================================
   Carrossel (Prev/Next) + Clique na imagem -> WhatsApp
   ===================================================== */
function initCarousel(){
  const wrap = $("#promoCarousel");
  if (!wrap) return;
  const container = $(".slides", wrap);
  const prevBtn = $(".c-prev", wrap);
  const nextBtn = $(".c-next", wrap);
  const slides = $$(".slide", wrap);
  if (!container || slides.length===0) return;

  let idx=0;
  function show(i){
    slides.forEach((s, k)=> s.style.display = (k===i ? "block":"none"));
  }
  show(idx);

  prevBtn?.addEventListener("click", ()=>{ ding(); idx = (idx-1+slides.length)%slides.length; show(idx); });
  nextBtn?.addEventListener("click", ()=>{ ding(); idx = (idx+1)%slides.length; show(idx); });
  setInterval(()=>{ idx = (idx+1)%slides.length; show(idx); }, 5000);

  // Clique na imagem -> WhatsApp com rótulo
  slides.forEach(img=>{
    img.style.cursor = "pointer";
    img.addEventListener("click", ()=>{
      ding();
      const label = img.getAttribute("data-wa") || `Quero a ${img.alt||"promoção"}`;
      const numero = "5534997178336";
      const texto = encodeURIComponent(`Olá! ${label}`);
      window.open(`https://wa.me/${numero}?text=${texto}`,"_blank");
    });
  });
}

/* =====================================================
   Bootstrap
   ===================================================== */
document.addEventListener("DOMContentLoaded", ()=>{
  // garante que está tudo criado
  ensureBaseUI();

  // carregar carrinho
  loadCart(); renderCart(); updateCartCount();

  // wire do carrinho (caso elementos tenham sido recriados)
  $("#cart-icon")?.addEventListener("click", openCart);
  $(".mini-close")?.addEventListener("click", closeCart);
  $("#mini-clear")?.addEventListener("click", ()=>{ ding(); clearCart(); });
  $("#mini-checkout")?.addEventListener("click", handleCheckout);

  // Botões "Adicionar" (garantia após recriar)
  $$(".add-cart").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const card = btn.closest(".card"); if (!card) return;
      const id = card.dataset.id || card.dataset.name;
      const name = card.dataset.name;
      const price = parseFloat(card.dataset.price);
      ding();
      addItem({id,name,price}, 1);
    });
  });

  // Adicionais (garantia)
  $$(".extras-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if (extrasList) {
        extrasList.innerHTML = `
          <label><span>🧅 Cebola</span><input type="checkbox" value="Cebola" data-price="0.99"></label>
          <label><span>🥬 Salada</span><input type="checkbox" value="Salada" data-price="1.99"></label>
          <label><span>🥚 Ovo</span><input type="checkbox" value="Ovo" data-price="1.99"></label>
          <label><span>🌭 Salsicha</span><input type="checkbox" value="Salsicha" data-price="1.99"></label>
          <label><span>🥓 Bacon</span><input type="checkbox" value="Bacon" data-price="2.99"></label>
          <label><span>🌿 Molho Verde</span><input type="checkbox" value="Molho Verde" data-price="2.99"></label>
          <label><span>🧀 Cheddar</span><input type="checkbox" value="Cheddar" data-price="3.99"></label>
        `;
      }
      $("#extras-modal").classList.add("show");
      $("#extras-backdrop").classList.add("show");
      ding();
    });
  });
  $("#extras-add")?.addEventListener("click", ()=>{
    const checks = $$("#extras-list input[type='checkbox']:checked");
    checks.forEach(cb=>{
      addItem({ id:"extra:"+cb.value, name:cb.value, price: parseFloat(cb.dataset.price) }, 1);
    });
    $("#extras-modal").classList.remove("show");
    $("#extras-backdrop").classList.remove("show");
    ding();
  });

  // Login UI já está ligado em buildAuthLogic()

  // Timers
  atualizarContagem();
  atualizarStatus();

  // Carrossel
  initCarousel();
});