/* =========================================================
   DFL – Script estável (Parte 1/3)
   - Som de clique
   - Status aberto/fechado + contador
   - Estrutura inicial do carrinho
========================================================= */

const clickSfx = new Audio("click.wav");
clickSfx.volume = 0.35;
function playClick(){ try{ clickSfx.currentTime=0; clickSfx.play(); }catch(_){} }
document.addEventListener("click", playClick, { passive:true });

// ======= Carrinho =======
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
const cartCount = document.getElementById("cart-count");

function money(n){ return `R$ ${Number(n).toFixed(2).replace(".", ",")}`; }
function saveCart(){ localStorage.setItem("cart", JSON.stringify(cart)); updateCartUI(); }

// Atualiza contador e lista
function updateCartUI(){
  const list = document.getElementById("mini-list");
  const foot = document.querySelector(".mini-foot");
  cartCount.textContent = cart.reduce((a,i)=>a+(i.qtd||1),0);

  if(!list) return;
  if(!cart.length){
    list.innerHTML = `<p class="empty-cart">Seu carrinho está vazio.</p>`;
    foot.innerHTML = "";
    return;
  }

  list.innerHTML = "";
  cart.forEach((it,idx)=>{
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div style="flex:1;min-width:0">
        <span>${it.nome}</span><br>
        <small>${money(it.preco)}</small>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <button class="qty-dec" data-i="${idx}">−</button>
        <span>${it.qtd}</span>
        <button class="qty-inc" data-i="${idx}">+</button>
        <strong>${money(it.preco*it.qtd)}</strong>
        <button class="remove-item" data-i="${idx}" title="Remover">x</button>
      </div>`;
    list.appendChild(row);
  });

  const total = cart.reduce((a,i)=>a+i.preco*i.qtd,0);
  foot.innerHTML = `
    <button id="mini-clear" class="btn-secondary">Limpar</button>
    <button id="mini-checkout" class="btn-primary">Fechar pedido (${money(total)})</button>
  `;
}

// ======= Abertura e fechamento do carrinho =======
const miniCart = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");

function openMiniCart(){
  updateCartUI();
  miniCart.classList.add("active");
  cartBackdrop.classList.add("show");
  document.body.classList.add("no-scroll");
}
function closeMiniCart(){
  miniCart.classList.remove("active");
  cartBackdrop.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

document.getElementById("cart-icon")?.addEventListener("click", openMiniCart);
document.addEventListener("click",(e)=>{
  if(e.target.closest(".mini-close") || e.target===cartBackdrop) closeMiniCart();
});
document.addEventListener("keydown",(e)=>{ if(e.key==="Escape") closeMiniCart(); });

// ======= Controle de quantidade / exclusão =======
document.addEventListener("click",(e)=>{
  if(e.target.matches(".qty-inc")){
    const i = e.target.dataset.i;
    cart[i].qtd++; saveCart();
  }
  if(e.target.matches(".qty-dec")){
    const i = e.target.dataset.i;
    cart[i].qtd = Math.max(1, cart[i].qtd-1); saveCart();
  }
  if(e.target.matches(".remove-item")){
    cart.splice(e.target.dataset.i,1); saveCart();
  }
  if(e.target.matches("#mini-clear")){
    cart = []; saveCart();
  }
  if(e.target.matches("#mini-checkout")){
    const total = cart.reduce((a,i)=>a+i.preco*i.qtd,0);
    const txt = cart.map(i=>`• ${i.nome} x${i.qtd}`).join("%0A");
    window.open(`https://wa.me/5534997178336?text=🍔 Pedido DFL:%0A%0A${txt}%0A%0ATotal: ${money(total)}`,"_blank");
  }
});

// ======= Status e Contagem =======
function setStatusBanner(){
  const el = document.getElementById("status-banner");
  if(!el) return;
  const d=new Date(), day=d.getDay(), h=d.getHours(), m=d.getMinutes();
  if(day===2){ el.textContent="Fechado hoje (Terça) — voltamos amanhã!"; return;}
  const min=h*60+m; let ab=0, fe=0;
  if(day>=1 && day<=4){ ab=18*60; fe=23*60+15; }
  else { ab=17*60+30; fe=23*60+30; }
  if(min<ab) el.textContent=`Abrimos às ${day>=1&&day<=4?"18h":"17h30"}`;
  else if(min<=fe) el.textContent="🟢 Estamos abertos! Faça seu pedido 🍔";
  else el.textContent="Fechado agora — voltamos em breve!";
}

function updateCountdown(){
  const el=document.getElementById("timer");
  if(!el) return;
  const end=new Date(); end.setHours(23,59,59,999);
  const diff=end-new Date();
  if(diff<=0){ el.textContent="00:00:00"; return;}
  const h=String(Math.floor(diff/3.6e6)).padStart(2,"0");
  const m=String(Math.floor((diff%3.6e6)/6e4)).padStart(2,"0");
  const s=String(Math.floor((diff%6e4)/1e3)).padStart(2,"0");
  el.textContent=`${h}:${m}:${s}`;
}
setStatusBanner(); setInterval(setStatusBanner,60000);
updateCountdown(); setInterval(updateCountdown,1000);
/* =========================================================
   DFL – Script estável (Parte 2/3)
   - Adicionar ao carrinho
   - Adicionais oficiais
   - Carrossel de promoções
========================================================= */

const ADICIONAIS = [
  { nome:"Cebola", preco:0.99 },
  { nome:"Salada", preco:1.99 },
  { nome:"Ovo", preco:1.99 },
  { nome:"Bacon", preco:2.99 },
  { nome:"Hambúrguer Tradicional 56g", preco:2.99 },
  { nome:"Cheddar Cremoso", preco:3.99 },
  { nome:"Filé de Frango", preco:5.99 },
  { nome:"Hambúrguer Artesanal 120g", preco:7.99 }
];

// ======= Adicionar item =======
function bindAddButtons(){
  document.querySelectorAll(".add-cart").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const card=btn.closest(".card");
      const nome=card.dataset.name||"Item";
      const preco=parseFloat(card.dataset.price||"0");
      const f=cart.find(i=>i.nome===nome&&i.preco===preco);
      if(f) f.qtd++; else cart.push({nome,preco,qtd:1});
      saveCart();

      const pop=document.createElement("div");
      pop.className="popup-add";
      pop.textContent=`${nome} adicionado!`;
      document.body.appendChild(pop);
      setTimeout(()=>pop.remove(),1400);
    });
  });
}

// ======= Adicionais =======
const extrasModal=document.getElementById("extras-modal");
const extrasList=document.getElementById("extras-list");

function bindExtrasButtons(){
  document.querySelectorAll(".extras-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const card=btn.closest(".card");
      extrasModal.dataset.produto=card.dataset.name;
      extrasList.innerHTML=ADICIONAIS.map((a,i)=>`
        <label>
          <span>${a.nome} — ${money(a.preco)}</span>
          <input type="checkbox" value="${i}">
        </label>`).join("");
      extrasModal.classList.add("show");
      document.body.classList.add("no-scroll");
    });
  });

  document.addEventListener("click",(e)=>{
    if(e.target.closest(".extras-close")||e.target.matches("#extras-cancel")){
      extrasModal.classList.remove("show");
      document.body.classList.remove("no-scroll");
    }
  });

  document.getElementById("extras-add").addEventListener("click",()=>{
    const nomeBase=extrasModal.dataset.produto;
    const sel=[...extrasList.querySelectorAll("input:checked")];
    if(sel.length){
      sel.forEach(c=>{
        const a=ADICIONAIS[Number(c.value)];
        cart.push({nome:`${nomeBase} + ${a.nome}`,preco:a.preco,qtd:1});
      });
      saveCart();
    }
    extrasModal.classList.remove("show");
    document.body.classList.remove("no-scroll");
  });
}

// ======= Carrossel =======
function initCarousel(){
  const rail=document.querySelector(".slides");
  if(!rail) return;
  const prev=document.querySelector(".c-prev");
  const next=document.querySelector(".c-next");
  const step=()=>Math.min(rail.clientWidth*0.9,320);
  prev?.addEventListener("click",()=>rail.scrollBy({left:-step(),behavior:"smooth"}));
  next?.addEventListener("click",()=>rail.scrollBy({left:step(),behavior:"smooth"}));
  rail.querySelectorAll(".slide").forEach(img=>{
    img.addEventListener("click",()=>{
      const wa=img.dataset.wa||"Quero essa promoção!";
      window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(wa)}`,"_blank");
    });
  });
}
/* =========================================================
   DFL – Script estável (Parte 3/3)
   - Login visual (UI)
   - Inicialização geral
========================================================= */

function setupLoginUI(){
  let userBtn=document.getElementById("user-btn");
  if(!userBtn){
    userBtn=document.createElement("button");
    userBtn.id="user-btn";
    userBtn.className="user-button";
    userBtn.textContent="Entrar / Cadastrar";
    document.querySelector(".header")?.appendChild(userBtn);
  }

  const loginModal=document.getElementById("login-modal");
  userBtn.addEventListener("click",()=>{
    loginModal.classList.add("show");
    document.body.classList.add("no-scroll");
  });

  loginModal.querySelector(".login-x").addEventListener("click",()=>{
    loginModal.classList.remove("show");
    document.body.classList.remove("no-scroll");
  });

  loginModal.addEventListener("click",(e)=>{
    if(e.target===loginModal){
      loginModal.classList.remove("show");
      document.body.classList.remove("no-scroll");
    }
  });

  // Placeholder do botão Google
  loginModal.querySelector(".btn-google").addEventListener("click",(e)=>{
    e.preventDefault();
    alert("Login com Google será ativado quando conectarmos ao seu Firebase (visual já ok).");
  });
}

// ======= Inicialização =======
window.addEventListener("DOMContentLoaded",()=>{
  updateCartUI();
  bindAddButtons();
  bindExtrasButtons();
  initCarousel();
  setupLoginUI();
// ======= Corrige botão X do carrinho =======
document.querySelector(".mini-close")?.addEventListener("click", () => {
  miniCart.classList.remove("active");
  cartBackdrop.classList.remove("show");
  document.body.classList.remove("no-scroll");
});

});