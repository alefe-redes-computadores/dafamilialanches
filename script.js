// DFL v1.4.6 — overlay/backdrops fix (parte 1/3)
document.addEventListener("DOMContentLoaded", () => {
/* =========================================
   ⚙️ BASE
========================================= */
const sound = new Audio("click.wav");
let cart = [];
let currentUser = null;
const money = n => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;

document.addEventListener("click", () => { try { sound.currentTime = 0; sound.play(); } catch (_) {} });

/* =========================================
   🔲 BACKDROPS / OVERLAY MANAGER (separados)
   - #bd-cart   -> carrinho
   - #bd-modal  -> modais e "Meus Pedidos"
========================================= */
function ensureBackdrop(id, z) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    // estilização mínima inline para não depender do CSS
    Object.assign(el.style, {
      position: "fixed", inset: "0", background: "rgba(0,0,0,.45)",
      display: "none", zIndex: String(z), backdropFilter: "blur(1px)"
    });
    document.body.appendChild(el);
  } else {
    el.style.zIndex = String(z);
  }
  return el;
}
const bdCart  = ensureBackdrop("bd-cart", 1000);   // atrás do carrinho
const bdModal = ensureBackdrop("bd-modal", 1100);  // atrás dos modais/painel

function showBackdrop(el, on) { el.style.display = on ? "block" : "none"; }
function hideAllBackdrops(){ showBackdrop(bdCart, false); showBackdrop(bdModal, false); }

/* =========================================
   🧩 ELEMENTOS BÁSICOS
========================================= */
const miniCart   = document.getElementById("mini-cart");  // lateral
const cartCount  = document.getElementById("cart-count");
const cartIcon   = document.getElementById("cart-icon");

// Garantir z-index dos contêineres principais (acima dos respectivos backdrops)
if (miniCart) miniCart.style.zIndex = "1001";

/* =========================================
   💬 MODAIS — Adicionais, Combo e Login
========================================= */
function closeModal(el){ if(!el) return; el.classList.remove("show"); document.body.classList.remove("no-scroll"); }
function openModal(el) { if(!el) return; el.classList.add("show"); document.body.classList.add("no-scroll"); showBackdrop(bdModal,true); }

// ====== ADICIONAIS ======
let extrasModal = document.getElementById("extras-modal");
const extrasList    = extrasModal?.querySelector(".extras-list");
const extrasConfirm = document.getElementById("extras-confirm");
extrasModal?.querySelectorAll(".extras-close").forEach(b=>b.addEventListener("click",()=>{ closeModal(extrasModal); showBackdrop(bdModal,false); }));

// Lista fixa de adicionais
const adicionais = [
  { nome: "Cebola", preco: 0.99 },
  { nome: "Salada", preco: 1.99 },
  { nome: "Ovo", preco: 1.99 },
  { nome: "Bacon", preco: 2.99 },
  { nome: "Hambúrguer Tradicional 56g", preco: 2.99 },
  { nome: "Cheddar Cremoso", preco: 3.99 },
  { nome: "Filé de Frango", preco: 5.99 },
  { nome: "Hambúrguer Artesanal 120g", preco: 7.99 },
];

function openExtrasFor(card){
  if (!extrasModal || !extrasList) return;
  const nomeProduto = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Produto";
  extrasList.innerHTML = adicionais.map((a,i)=>`
    <label style="display:flex;justify-content:space-between;gap:8px;align-items:center">
      <span>${a.nome} — ${money(a.preco)}</span>
      <input type="checkbox" value="${i}">
    </label>`).join("");
  extrasModal.dataset.produto = nomeProduto;
  openModal(extrasModal);
}

document.querySelectorAll(".extras-btn").forEach(btn=>{
  btn.addEventListener("click", e=>{
    const card=e.currentTarget.closest(".card"); if(!card) return;
    openExtrasFor(card);
  });
});

extrasConfirm?.addEventListener("click", ()=>{
  const produto = extrasModal?.dataset?.produto || "Produto";
  const selecionados = [...(extrasList?.querySelectorAll("input:checked")||[])];
  if (!selecionados.length){ closeModal(extrasModal); showBackdrop(bdModal,false); return; }
  selecionados.forEach(c=>{
    const extra = adicionais[+c.value];
    cart.push({ nome:`${produto} + ${extra.nome}`, preco:extra.preco, qtd:1 });
  });
  renderMiniCart(); popupAdd(`${produto} atualizado com adicionais!`);
  closeModal(extrasModal); showBackdrop(bdModal,false);
});

// fechar clicando fora
extrasModal?.addEventListener("click", e=>{ if(e.target===extrasModal){ closeModal(extrasModal); showBackdrop(bdModal,false);} });

/* ====== COMBOS / BEBIDAS ====== */
const comboModal   = document.getElementById("combo-modal");
const comboBody    = document.getElementById("combo-body");
const comboConfirm = document.getElementById("combo-confirm");

const comboDrinkOptions = {
  casal:   [ {rotulo:"Fanta 1L (padrão)", delta:0.01}, {rotulo:"Coca 1L", delta:3.01}, {rotulo:"Coca 1L Zero", delta:3.01} ],
  familia: [ {rotulo:"Kuat 2L (padrão)",  delta:0.01}, {rotulo:"Coca 2L", delta:5.01} ],
};

let _comboCtx=null;
function openComboModal(nomeCombo, precoBase){
  const lower = (nomeCombo||"").toLowerCase();
  const grupo = lower.includes("casal") ? "casal" :
                (lower.includes("família")||lower.includes("familia")) ? "familia" : null;
  if (!grupo){ addCommonItem(nomeCombo, precoBase); return; }
  const opts = comboDrinkOptions[grupo];
  comboBody.innerHTML = opts.map((o,i)=>`
    <label style="display:flex;justify-content:space-between;gap:8px;align-items:center">
      <span>${o.rotulo} — + ${money(o.delta)}</span>
      <input type="radio" name="combo-drink" value="${i}" ${i===0?"checked":""}>
    </label>`).join("");
  _comboCtx = {nomeCombo, precoBase, grupo};
  openModal(comboModal);
}
comboConfirm?.addEventListener("click", ()=>{
  const sel = comboBody?.querySelector('input[name="combo-drink"]:checked');
  if(!_comboCtx || !sel) { closeModal(comboModal); showBackdrop(bdModal,false); return; }
  const {nomeCombo, precoBase, grupo} = _comboCtx;
  const opt = comboDrinkOptions[grupo][+sel.value];
  const finalName = `${nomeCombo} + ${opt.rotulo}`;
  const finalPrice = Number(precoBase) + (opt.delta||0);
  cart.push({ nome: finalName, preco: finalPrice, qtd:1 });
  popupAdd(`${finalName} adicionado!`);
  renderMiniCart();
  closeModal(comboModal); showBackdrop(bdModal,false);
});
comboModal?.addEventListener("click", e=>{ if(e.target===comboModal){ closeModal(comboModal); showBackdrop(bdModal,false);} });
/* =========================================
   🛒 CARRINHO (mini) — overlay separado
========================================= */
function updateCartCount(){ if (cartCount) cartCount.textContent = cart.reduce((a,i)=>a+i.qtd,0); }

function renderMiniCart(){
  const lista = document.querySelector(".mini-list");
  const foot  = document.querySelector(".mini-foot");
  if (!lista || !foot) return;
  lista.innerHTML=""; let total=0;

  if (!cart.length){
    lista.innerHTML = `<p class="empty-cart">Seu carrinho está vazio 😢</p>`;
  } else {
    cart.forEach((item,i)=>{ total += item.preco*item.qtd;
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
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
    <button id="clear-cart"  class="btn-secondary">Limpar</button>`;
  document.getElementById("clear-cart")?.addEventListener("click",()=>{ cart=[]; renderMiniCart(); updateCartCount(); });
  document.getElementById("close-order")?.addEventListener("click", fecharPedido);
  updateCartCount();
}

/* abrir/fechar carrinho usando backdrop próprio */
function openCart(){
  if (!miniCart) return;
  // garante que o painel de pedidos e modais não fiquem por cima
  closeOrdersPanel(); closeModal(comboModal); closeModal(extrasModal); closeLogin();
  miniCart.classList.add("active");
  showBackdrop(bdCart,true);
  document.body.classList.add("no-scroll");
  renderMiniCart();
}
function closeCart(){
  if (!miniCart) return;
  miniCart.classList.remove("active");
  showBackdrop(bdCart,false);
  document.body.classList.remove("no-scroll");
}
cartIcon?.addEventListener("click", ()=>{ (miniCart?.classList.contains("active")) ? closeCart() : openCart(); });
bdCart.addEventListener("click", closeCart);

/* =========================================
   ➕ BOTÕES “ADICIONAR AO CARRINHO”
========================================= */
function addCommonItem(nome, preco){
  const found = cart.find(i=>i.nome===nome && i.preco===preco);
  if (found) found.qtd+=1; else cart.push({nome,preco,qtd:1});
  renderMiniCart(); popupAdd(`${nome} adicionado!`);
}
document.querySelectorAll(".add-cart").forEach(btn=>{
  btn.addEventListener("click", e=>{
    const card = e.currentTarget.closest(".card"); if (!card) return;
    const nome  = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";
    const preco = parseFloat(card.dataset.price || "0");
    if (/^combo/i.test(nome)) openComboModal(nome, preco);
    else addCommonItem(nome, preco);
  });
});

/* =========================================
   🖼️ CARROSSEL PROMOS
========================================= */
(()=> {
  const slides = document.querySelector(".slides");
  document.querySelector(".c-prev")?.addEventListener("click", ()=>{ if(slides) slides.scrollLeft -= Math.min(slides.clientWidth*0.9,320); });
  document.querySelector(".c-next")?.addEventListener("click", ()=>{ if(slides) slides.scrollLeft += Math.min(slides.clientWidth*0.9,320); });
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

// Referências do login
const userBtn   = document.getElementById("user-btn") || (()=>{ const b=document.createElement("button"); b.id="user-btn"; b.className="user-button"; b.textContent="Entrar / Cadastrar"; document.querySelector(".header")?.appendChild(b); return b;})();
const loginModal= document.getElementById("login-modal");
const loginForm = document.getElementById("login-form");
const googleBtn = document.getElementById("google-login");
const loginCloseX = loginModal?.querySelector(".login-x");

// helpers
function openLogin(){ if(!loginModal) return; openModal(loginModal); }
function closeLogin(){ if(!loginModal) return; closeModal(loginModal); showBackdrop(bdModal,false); }

userBtn?.addEventListener("click", openLogin);
loginCloseX?.addEventListener("click", closeLogin);
loginModal?.addEventListener("click", e=>{ if(e.target===loginModal){ closeLogin(); }});

// email/senha
loginForm?.addEventListener("submit",(e)=>{
  e.preventDefault();
  const email = loginForm.querySelector('input[type="email"]')?.value?.trim();
  const senha = loginForm.querySelector('input[type="password"]')?.value?.trim();
  if (!email || !senha) return alert("Preencha e-mail e senha.");
  auth.signInWithEmailAndPassword(email, senha)
    .then(cred=>{ currentUser=cred.user; userBtn.textContent=`Olá, ${currentUser.displayName?.split(" ")[0] || currentUser.email.split("@")[0]}`; closeLogin(); showOrdersFabIfLogged(); })
    .catch(()=> auth.createUserWithEmailAndPassword(email, senha).then(cred=>{
      currentUser=cred.user; userBtn.textContent=`Olá, ${currentUser.displayName?.split(" ")[0] || currentUser.email.split("@")[0]}`; closeLogin(); alert("Conta criada com sucesso! 🎉"); showOrdersFabIfLogged();
    }).catch(err=>alert("Erro: "+err.message)));
});
// google
googleBtn?.addEventListener("click", ()=>{
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then(result=>{
    currentUser=result.user; userBtn.textContent=`Olá, ${currentUser.displayName?.split(" ")[0]||"Cliente"}`; closeLogin(); showOrdersFabIfLogged();
  }).catch(err=>alert("Erro no login com Google: "+err.message));
});
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
    cart=[]; renderMiniCart(); updateCartCount(); closeCart();
  }).catch(err=>alert("Erro ao salvar pedido: "+err.message));
}
/* =========================================
   📋 MEUS PEDIDOS — painel lateral
========================================= */
let ordersFab = document.getElementById("orders-fab");
if (!ordersFab){ ordersFab=document.createElement("button"); ordersFab.id="orders-fab"; ordersFab.innerHTML="📦 Meus Pedidos"; document.body.appendChild(ordersFab); }

let ordersPanel = document.querySelector(".orders-panel");
if (!ordersPanel){
  ordersPanel = document.createElement("div");
  ordersPanel.className="orders-panel";
  ordersPanel.innerHTML=`
    <div class="orders-head">
      <span>📦 Meus Pedidos</span>
      <button class="orders-close">✖</button>
    </div>
    <div class="orders-content" id="orders-content">
      <p class="empty-orders">Faça login para ver seus pedidos.</p>
    </div>`;
  document.body.appendChild(ordersPanel);
}
ordersPanel.style.zIndex = "1101"; // acima do bd-modal

function openOrdersPanel(){ closeCart(); openModal(ordersPanel); } // usa bd-modal
function closeOrdersPanel(){ closeModal(ordersPanel); showBackdrop(bdModal,false); }

ordersFab.addEventListener("click", ()=>{
  if (!currentUser) return alert("Faça login para ver seus pedidos.");
  openOrdersPanel(); carregarPedidosSeguro();
});
ordersPanel.querySelector(".orders-close")?.addEventListener("click", closeOrdersPanel);
bdModal.addEventListener("click", e=>{
  // fecha painéis/modais ao clicar fora
  if (ordersPanel?.classList.contains("show")) closeOrdersPanel();
  if (loginModal?.classList.contains("show")) closeLogin();
  if (comboModal?.classList.contains("show")) { closeModal(comboModal); showBackdrop(bdModal,false); }
  if (extrasModal?.classList.contains("show")){ closeModal(extrasModal); showBackdrop(bdModal,false); }
});

/* mostrar FAB conforme login */
function showOrdersFabIfLogged(){ if (currentUser) ordersFab.classList.add("show"); else ordersFab.classList.remove("show"); }

/* carregar pedidos */
function carregarPedidosSeguro(){
  const container = document.getElementById("orders-content"); if (!container) return;
  container.innerHTML=`<p class="empty-orders">Carregando pedidos...</p>`;
  db.collection("Pedidos").where("usuario","==",currentUser.email).orderBy("data","desc").get()
    .then(snap=>{
      if (snap.empty){ container.innerHTML=`<p class="empty-orders">Nenhum pedido encontrado 😢</p>`; return; }
      container.innerHTML=""; snap.forEach(doc=>{
        const p=doc.data(); const itens = Array.isArray(p.itens)?p.itens.join(", "):(p.itens||"");
        const box=document.createElement("div"); box.className="order-item";
        box.innerHTML=`<h4>${new Date(p.data).toLocaleString("pt-BR")}</h4>
                       <p><b>Itens:</b> ${itens}</p>
                       <p><b>Total:</b> ${money(p.total)}</p>`;
        container.appendChild(box);
      });
    })
    .catch(err=>{ container.innerHTML=`<p class="empty-orders">Erro ao carregar pedidos: ${err.message}</p>`; });
}

/* =========================================
   🔔 Popup "adicionado"
========================================= */
function popupAdd(msg){
  const pop=document.createElement("div");
  pop.className="popup-add"; pop.textContent=msg||"Item adicionado!";
  Object.assign(pop.style,{position:"fixed",left:"50%",bottom:"24px",transform:"translateX(-50%)",
    background:"#000",color:"#fff",padding:"10px 14px",borderRadius:"12px",zIndex:"1200",opacity:"0",transition:"opacity .2s"});
  document.body.appendChild(pop);
  requestAnimationFrame(()=>pop.style.opacity="1");
  setTimeout(()=>{ pop.style.opacity="0"; setTimeout(()=>pop.remove(),220); },1800);
}

/* =========================================
   🕒 STATUS + TIMER
========================================= */
const statusBanner = document.getElementById("status-banner");
const hoursBanner  = document.querySelector(".hours-banner");

function atualizarStatus(){
  const now=new Date(); const d=now.getDay(), h=now.getHours(), m=now.getMinutes();
  let aberto=false;
  if (d>=1 && d<=4) aberto = h>=18 && (h<23 || (h===23 && m<=15));
  else aberto = h>=17 && (h<23 || (h===23 && m<=30));
  if (statusBanner){
    statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!";
    statusBanner.className = `status-banner ${aberto ? "open":"closed"}`;
  }
  if (hoursBanner){
    if (aberto){
      const restanteMin = (23-h)*60 - m;
      const hh = Math.max(0,Math.floor(restanteMin/60));
      const mm = Math.max(0,restanteMin%60);
      hoursBanner.innerHTML = `⏰ Hoje atendemos até <b>23h30</b> — Faltam <b>${hh}h ${String(mm).padStart(2,"0")}min</b>`;
    }else{
      const faltam = h<18 ? (18-h)*60 - m : (24-h+18)*60 - m;
      const hh = Math.max(0,Math.floor(faltam/60)); const mm = Math.max(0,faltam%60);
      hoursBanner.innerHTML = `🔒 Fechado — Abrimos em <b>${hh}h ${String(mm).padStart(2,"0")}min</b>`;
    }
  }
}
function atualizarTimer(){
  const el1=document.getElementById("timer");
  const el2=document.getElementById("promo-timer");
  const now=new Date(); const end=new Date(); end.setHours(23,59,59,999);
  const diff=end-now;
  const txt = diff<=0 ? "00:00:00" : (()=>{const h=String(Math.floor(diff/36e5)).padStart(2,"0"); const m=String(Math.floor((diff%36e5)/6e4)).padStart(2,"0"); const s=String(Math.floor((diff%6e4)/1e3)).padStart(2,"0"); return `${h}:${m}:${s}`})();
  if (el1) el1.textContent=txt; if (el2) el2.textContent=txt;
}
atualizarStatus(); setInterval(atualizarStatus,60e3);
atualizarTimer();  setInterval(atualizarTimer,1e3);

/* =========================================
   🧠 LOG
========================================= */
console.log("%cDFL v1.4.6 — overlays separados, carrinho + pedidos sem conflito ✅","background:#000;color:#0f0;padding:6px;border-radius:6px");
});