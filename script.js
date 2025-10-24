// DFL v1.4.6 — carrinho flutuante, modais estáveis e combos OK
document.addEventListener("DOMContentLoaded", () => {
/* =========================================
   ⚙️ BASE
========================================= */
const sound = new Audio("click.wav");
let cart = [];
let currentUser = null;
const money = n => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;
document.addEventListener("click", () => { try{ sound.currentTime=0; sound.play(); }catch(_){} });

/* Helpers modais */
function closeModal(el){ if(!el) return; el.classList.remove("show"); document.body.classList.remove("no-scroll"); }
function openModal(el){ if(!el) return; el.classList.add("show"); document.body.classList.add("no-scroll"); }

/* =========================================
   🧩 ELEMENTOS PRINCIPAIS
========================================= */
const miniCart     = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");
const cartCount    = document.getElementById("cart-count");

/* Garante um backdrop único para modais/painéis */
let globalBackdrop = cartBackdrop;
if (!globalBackdrop){
  globalBackdrop = document.createElement("div");
  globalBackdrop.id = "cart-backdrop";
  document.body.appendChild(globalBackdrop);
}

/* =========================================
   🛒 CARRINHO — render e controles
========================================= */
function updateCartCount(){
  const count = cart.reduce((a,i)=>a+i.qtd,0);
  if (cartCount) cartCount.textContent = count;
  // espelha no FAB também
  document.querySelectorAll("#cart-fab .fab-count").forEach(el => el.textContent = count);
}
function renderMiniCart(){
  const lista = document.querySelector(".mini-list");
  const foot  = document.querySelector(".mini-foot");
  if (!lista || !foot) return;

  lista.innerHTML = "";
  let total = 0;

  if (!cart.length){
    lista.innerHTML = `<p class="empty-cart">Seu carrinho está vazio 😢</p>`;
  } else {
    cart.forEach((item,i)=>{ total+=item.preco*item.qtd;
      const row=document.createElement("div");
      row.className="cart-item";
      row.innerHTML=`
        <span>${item.nome} x${item.qtd}</span>
        <strong>${money(item.preco*item.qtd)}</strong>
        <div>
          <button class="qty-dec" data-i="${i}">−</button>
          <button class="qty-inc" data-i="${i}">+</button>
          <button class="remove-item" data-i="${i}">🗑</button>
        </div>`;
      lista.appendChild(row);
    });

    lista.querySelectorAll(".qty-inc").forEach(b=>b.addEventListener("click",e=>{
      cart[+e.currentTarget.dataset.i].qtd++; renderMiniCart(); updateCartCount();
    }));
    lista.querySelectorAll(".qty-dec").forEach(b=>b.addEventListener("click",e=>{
      const it=cart[+e.currentTarget.dataset.i]; it.qtd=Math.max(1,it.qtd-1); renderMiniCart(); updateCartCount();
    }));
    lista.querySelectorAll(".remove-item").forEach(b=>b.addEventListener("click",e=>{
      cart.splice(+e.currentTarget.dataset.i,1); renderMiniCart(); updateCartCount();
    }));
  }

  foot.innerHTML = `
    <button id="close-order" class="btn-primary">Fechar Pedido (${money(total)})</button>
    <button id="clear-cart" class="btn-secondary">Limpar</button>`;
  document.getElementById("clear-cart")?.addEventListener("click",()=>{ cart=[]; renderMiniCart(); updateCartCount(); });
  document.getElementById("close-order")?.addEventListener("click", fecharPedido);

  updateCartCount();
}

/* Abre/fecha mini-carrinho (header e FAB usam isso) */
function toggleMiniCart(forceOpen=null){
  const open = forceOpen===null ? !miniCart.classList.contains("active") : forceOpen;
  if (open){
    miniCart?.classList.add("active");
    globalBackdrop?.classList.add("show");
    document.body.classList.add("no-scroll");
    renderMiniCart();
  } else {
    miniCart?.classList.remove("active");
    globalBackdrop?.classList.remove("show");
    document.body.classList.remove("no-scroll");
  }
}
document.getElementById("cart-icon")?.addEventListener("click", ()=> toggleMiniCart());

/* =========================================
   ➕ ADICIONAR ITENS
========================================= */
function popupAdd(msg){
  const pop=document.createElement("div");
  pop.className="popup-add"; pop.textContent=msg||"Item adicionado!";
  document.body.appendChild(pop);
  setTimeout(()=>pop.classList.add("show"),30);
  setTimeout(()=>{ pop.classList.remove("show"); setTimeout(()=>pop.remove(),250); },1800);
}
function addCommonItem(nome, preco){
  const found = cart.find(i=>i.nome===nome && i.preco===preco);
  if(found) found.qtd+=1; else cart.push({nome,preco,qtd:1});
  renderMiniCart(); popupAdd(`${nome} adicionado!`);
}

/* Delegação de eventos para .add-cart e .extras-btn (mais robusto) */
document.body.addEventListener("click",(e)=>{
  const addBtn = e.target.closest(".add-cart");
  if (addBtn){
    const card = addBtn.closest(".card"); if (!card) return;
    const nome  = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";
    const preco = parseFloat(card.dataset.price || "0");
    if (/^combo/i.test(nome)) openComboModal(nome, preco);
    else addCommonItem(nome, preco);
  }
  const extraBtn = e.target.closest(".extras-btn");
  if (extraBtn){
    const card = extraBtn.closest(".card"); if (!card) return;
    openExtrasFor(card);
  }
});

/* =========================================
   🥤 COMBOS — modal de bebidas
========================================= */
const comboModal   = document.getElementById("combo-modal");
const comboBody    = document.getElementById("combo-body");
const comboConfirm = document.getElementById("combo-confirm");

const comboDrinkOptions = {
  casal:   [ {rotulo:"Fanta 1L (padrão)", delta:0.01}, {rotulo:"Coca 1L", delta:3.01}, {rotulo:"Coca 1L Zero", delta:3.01} ],
  familia: [ {rotulo:"Kuat 2L (padrão)",  delta:0.01}, {rotulo:"Coca 2L", delta:5.01} ],
};
let _comboCtx=null;

function openComboModal(nomeCombo, precoBase){
  const lower=(nomeCombo||"").toLowerCase();
  const grupo = lower.includes("casal") ? "casal" :
                (lower.includes("família")||lower.includes("familia")) ? "familia" : null;
  if (!grupo){ addCommonItem(nomeCombo, precoBase); return; }

  const opts = comboDrinkOptions[grupo];
  comboBody.innerHTML = opts.map((o,i)=>`
    <label class="opt-row">
      <span>${o.rotulo} — + ${money(o.delta)}</span>
      <input type="radio" name="combo-drink" value="${i}" ${i===0?"checked":""}>
    </label>`).join("");
  _comboCtx = {nomeCombo, precoBase, grupo};
  openModal(comboModal);
}

/* CONFIRMAR BEBIDA — (corrigido: agora realmente adiciona) */
comboConfirm?.addEventListener("click", ()=>{
  if (!_comboCtx) return;
  const sel = comboBody.querySelector('input[name="combo-drink"]:checked');
  const opt = comboDrinkOptions[_comboCtx.grupo][+sel.value];
  const finalName  = `${_comboCtx.nomeCombo} + ${opt.rotulo}`;
  const finalPrice = Number(_comboCtx.precoBase) + (opt.delta||0);
  cart.push({ nome: finalName, preco: finalPrice, qtd:1 });
  popupAdd(`${finalName} adicionado!`);
  closeModal(comboModal);
  renderMiniCart();
});

/* Fecha modais clicando fora */
[comboModal].forEach(m => m?.addEventListener("click", e => { if (e.target===m) closeModal(m); }));
/* =========================================
   ➕ ADICIONAIS (modal estilizado)
========================================= */
const extrasModal   = document.getElementById("extras-modal");
const extrasList    = extrasModal?.querySelector(".extras-list");
const extrasConfirm = document.getElementById("extras-confirm");
extrasModal?.querySelectorAll(".extras-close").forEach(b=>b.addEventListener("click",()=>closeModal(extrasModal)));
extrasModal?.addEventListener("click", e=>{ if(e.target===extrasModal) closeModal(extrasModal); });

const adicionais = [
  { nome:"Cebola", preco:0.99 },
  { nome:"Salada", preco:1.99 },
  { nome:"Ovo", preco:1.99 },
  { nome:"Bacon", preco:2.99 },
  { nome:"Hambúrguer Tradicional 56g", preco:2.99 },
  { nome:"Cheddar Cremoso", preco:3.99 },
  { nome:"Filé de Frango", preco:5.99 },
  { nome:"Hambúrguer Artesanal 120g", preco:7.99 },
];

function openExtrasFor(card){
  const nome = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Produto";
  extrasModal.dataset.produto = nome;
  if (extrasList){
    extrasList.innerHTML = adicionais.map((a,i)=>`
      <label class="extra-row">
        <span>${a.nome} — ${money(a.preco)}</span>
        <input type="checkbox" value="${i}">
      </label>`).join("");
  }
  openModal(extrasModal);
}

extrasConfirm?.addEventListener("click", ()=>{
  const produto = extrasModal?.dataset?.produto || "Produto";
  const checks  = [...extrasList.querySelectorAll("input:checked")];
  if (!checks.length){ closeModal(extrasModal); return; }
  checks.forEach(c=>{
    const ex = adicionais[+c.value];
    cart.push({ nome:`${produto} + ${ex.nome}`, preco: ex.preco, qtd:1 });
  });
  renderMiniCart(); popupAdd(`${produto} atualizado com adicionais!`); closeModal(extrasModal);
});

/* =========================================
   🖼️ CARROSSEL DE PROMOÇÕES
========================================= */
(()=>{
  const slides = document.querySelector(".slides");
  document.querySelector(".c-prev")?.addEventListener("click", ()=>{ if(slides) slides.scrollLeft -= Math.min(slides.clientWidth*0.9, 320); });
  document.querySelector(".c-next")?.addEventListener("click", ()=>{ if(slides) slides.scrollLeft += Math.min(slides.clientWidth*0.9, 320); });
  document.querySelectorAll(".slide").forEach(img=>{
    img.addEventListener("click", ()=>{
      const msg = encodeURIComponent(img.dataset.wa || "");
      if (msg) window.open(`https://wa.me/5534997178336?text=${msg}`, "_blank");
    });
  });
})();

/* =========================================
   🔥 FIREBASE v8 + LOGIN
========================================= */
const firebaseConfig = {
  apiKey:"AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
  authDomain:"da-familia-lanches.firebaseapp.com",
  projectId:"da-familia-lanches",
  storageBucket:"da-familia-lanches.appspot.com",
  messagingSenderId:"106857147317",
  appId:"1:106857147317:web:769c98aed26bb8fc9e87fc",
  measurementId:"G-TCZ18HFWGX"
};
if (window.firebase && !firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); const db = firebase.firestore();

/* Botão usuário */
const userBtn = document.getElementById("user-btn") || (()=>{ const b=document.createElement("button"); b.id="user-btn"; b.className="user-button"; b.textContent="Entrar / Cadastrar"; document.querySelector(".header")?.appendChild(b); return b; })();

/* Login modal */
const loginModal = document.getElementById("login-modal");
const loginForm  = loginModal?.querySelector("#login-form") || loginModal?.querySelector("form");
const googleBtn  = loginModal?.querySelector("#google-login") || loginModal?.querySelector(".btn-google");
const loginClose = loginModal?.querySelector(".login-x");

function openLogin(){ openModal(loginModal); }
function closeLogin(){ closeModal(loginModal); }
userBtn?.addEventListener("click", openLogin);
loginClose?.addEventListener("click", closeLogin);
loginModal?.addEventListener("click", e=>{ if(e.target===loginModal) closeLogin(); });

/* Email/senha */
loginForm?.addEventListener("submit", (e)=>{
  e.preventDefault();
  const email = loginForm.querySelector('input[type="email"]')?.value?.trim();
  const senha = loginForm.querySelector('input[type="password"]')?.value?.trim();
  if(!email || !senha) return alert("Preencha e-mail e senha.");
  auth.signInWithEmailAndPassword(email, senha)
    .then(cred=>{ currentUser=cred.user; userBtn.textContent=`Olá, ${currentUser.displayName?.split(" ")[0]||currentUser.email.split("@")[0]}`; closeLogin(); showOrdersFabIfLogged(); })
    .catch(()=> auth.createUserWithEmailAndPassword(email, senha).then(cred=>{
      currentUser=cred.user; userBtn.textContent=`Olá, ${currentUser.displayName?.split(" ")[0]||currentUser.email.split("@")[0]}`; closeLogin(); alert("Conta criada com sucesso! 🎉"); showOrdersFabIfLogged();
    }).catch(err=>alert("Erro: "+err.message)));
});

/* Google */
googleBtn?.addEventListener("click", ()=>{
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then(result=>{
    currentUser=result.user; userBtn.textContent=`Olá, ${currentUser.displayName?.split(" ")[0]||"Cliente"}`; closeLogin(); showOrdersFabIfLogged();
  }).catch(err=>alert("Erro no login com Google: "+err.message));
});

/* Estado */
auth.onAuthStateChanged(user=>{
  if (user){ currentUser=user; userBtn.textContent=`Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`; }
  showOrdersFabIfLogged();
});

/* =========================================
   📦 FECHAR PEDIDO (Firestore)
========================================= */
function fecharPedido(){
  if (!cart.length) return alert("Carrinho vazio!");
  if (!currentUser){ alert("Você precisa estar logado para enviar o pedido!"); openLogin(); return; }
  const total = cart.reduce((a,i)=>a+i.preco*i.qtd,0);
  const pedido = {
    usuario: currentUser.email,
    userId: currentUser.uid,
    nome: currentUser.displayName || currentUser.email.split("@")[0],
    itens: cart.map(i=>`${i.nome} x${i.qtd}`),
    total: Number(total.toFixed(2)),
    data: new Date().toISOString(),
  };
  db.collection("Pedidos").add(pedido).then(()=>{
    alert("Pedido salvo com sucesso ✅");
    const texto = encodeURIComponent("🍔 *Pedido DFL*\n"+cart.map(i=>`• ${i.nome} x${i.qtd}`).join("\n")+`\n\nTotal: ${money(total)}`);
    window.open(`https://wa.me/5534997178336?text=${texto}`,"_blank");
    cart=[]; renderMiniCart();
  }).catch(err=>alert("Erro ao salvar pedido: "+err.message));
}

/* =========================================
   📋 MEUS PEDIDOS (painel lateral)
========================================= */
let ordersFab = document.getElementById("orders-fab");
if (!ordersFab){ ordersFab=document.createElement("button"); ordersFab.id="orders-fab"; ordersFab.innerHTML="📦 Meus Pedidos"; document.body.appendChild(ordersFab); }
let ordersPanel = document.querySelector(".orders-panel");
if (!ordersPanel){
  ordersPanel=document.createElement("div"); ordersPanel.className="orders-panel";
  ordersPanel.innerHTML=`<div class="orders-head"><span>📦 Meus Pedidos</span><button class="orders-close">✖</button></div><div class="orders-content" id="orders-content"><p class="empty-orders">Faça login para ver seus pedidos.</p></div>`;
  document.body.appendChild(ordersPanel);
}
ordersFab.addEventListener("click", ()=>{ if(!currentUser) return alert("Faça login para ver seus pedidos."); openOrdersPanel(); carregarPedidosSeguro(); });
ordersPanel.querySelector(".orders-close")?.addEventListener("click", closeOrdersPanel);

function openOrdersPanel(){ ordersPanel.classList.add("active"); globalBackdrop?.classList.add("show"); }
function closeOrdersPanel(){ ordersPanel.classList.remove("active"); globalBackdrop?.classList.remove("show"); }

/* Backdrop fecha tudo que estiver aberto */
globalBackdrop?.addEventListener("click", ()=>{
  closeOrdersPanel(); toggleMiniCart(false);
});

/* Mostrar FAB se logado */
function showOrdersFabIfLogged(){ if (currentUser) ordersFab.classList.add("show"); else ordersFab.classList.remove("show"); }

/* Buscar pedidos */
function carregarPedidosSeguro(){
  const container = document.getElementById("orders-content"); if (!container) return;
  container.innerHTML=`<p class="empty-orders">Carregando pedidos...</p>`;
  db.collection("Pedidos").where("usuario","==",currentUser.email).orderBy("data","desc").get()
    .then(snap=>{
      if (snap.empty){ container.innerHTML=`<p class="empty-orders">Nenhum pedido encontrado 😢</p>`; return; }
      container.innerHTML=""; snap.forEach(doc=>{
        const p=doc.data(); const itens = Array.isArray(p.itens)?p.itens.join(", "):(p.itens||"");
        const box=document.createElement("div"); box.className="order-item";
        box.innerHTML=`<h4>${new Date(p.data).toLocaleString("pt-BR")}</h4><p><b>Itens:</b> ${itens}</p><p><b>Total:</b> ${money(p.total)}</p>`;
        container.appendChild(box);
      });
    })
    .catch(err=>{ container.innerHTML=`<p class="empty-orders">Erro ao carregar pedidos: ${err.message}</p>`; });
}
/* =========================================
   🛎️ CARRINHO FLUTUANTE (mostra ao rolar)
========================================= */
let cartFab = document.getElementById("cart-fab");
if (!cartFab){
  cartFab = document.createElement("button");
  cartFab.id = "cart-fab";
  cartFab.innerHTML = `🛒 <span class="fab-count">0</span>`;
  document.body.appendChild(cartFab);
}
cartFab.addEventListener("click", ()=> toggleMiniCart(true));
function handleFab(){
  if (window.scrollY > 200) cartFab.classList.add("show");
  else cartFab.classList.remove("show");
}
window.addEventListener("scroll", handleFab); handleFab();

/* =========================================
   🕓 STATUS + TIMER PROMO
========================================= */
const statusBanner = document.getElementById("status-banner");
const hoursBanner  = document.querySelector(".hours-banner");

function atualizarStatus(){
  const now = new Date(); const d = now.getDay(), h=now.getHours(), m=now.getMinutes();
  let aberto=false;
  if (d>=1 && d<=4) aberto = h>=18 && (h<23 || (h===23 && m<=15));
  else aberto = h>=17 && (h<23 || (h===23 && m<=30));
  if (statusBanner){
    statusBanner.textContent = aberto ? "✅ Estamos abertos! Faça seu pedido 🍔" : "⏰ Fechado no momento — Voltamos em breve!";
    statusBanner.className = `status-banner ${aberto?"open":"closed"}`;
  }
  if (hoursBanner){
    if (aberto){
      const end = new Date(); end.setHours(23,59,59,999);
      const diff=end-now; const hh=String(Math.floor(diff/36e5)).padStart(2,"0"); const mm=String(Math.floor((diff%36e5)/6e4)).padStart(2,"0");
      hoursBanner.innerHTML = `⏰ Hoje atendemos até <b>23h30</b> — Faltam <b>${hh}h${mm}</b>`;
    } else {
      // texto já vem do HTML com countdown separado
    }
  }
}
function atualizarPromo(){
  const el1=document.getElementById("timer"), el2=document.getElementById("promo-timer");
  const now=new Date(); const end=new Date(); end.setHours(23,59,59,999);
  const diff=end-now;
  const h=String(Math.floor(diff/36e5)).padStart(2,"0");
  const m=String(Math.floor((diff%36e5)/6e4)).padStart(2,"0");
  const s=String(Math.floor((diff%6e4)/1e3)).padStart(2,"0");
  if (el1) el1.textContent = `${h}:${m}:${s}`;
  if (el2) el2.textContent = `${h}:${m}:${s}`;
}
atualizarStatus(); setInterval(atualizarStatus,60e3);
atualizarPromo();  setInterval(atualizarPromo,1e3);

/* =========================================
   🔚 LOG
========================================= */
console.log("%c🔥 DFL v1.4.6 — Carrinho flutuante + modais OK","color:#fff;background:#000;padding:6px;border-radius:6px;");
});