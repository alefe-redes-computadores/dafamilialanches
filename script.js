/* =======================================
   DFL – Script principal (COMPLETO)
   Visual atual preservado + Som click.wav
   Login por modal com "Entrar com Google"
   Carrinho + Adicionais + Carrossel + Status
======================================= */

/* ============== Firebase ============== */
/* Se já existir em outro arquivo, pode manter.
   Aqui deixo a inicialização defensiva.  */
(function initFirebase(){
  if (!window.firebase || !firebase.apps) return;
  try {
    if (!firebase.apps.length) {
      const firebaseConfig = window.firebaseConfig || {
        apiKey: "AIzaSyF-XXXXXX",
        authDomain: "dafamilia-lanches.firebaseapp.com",
        projectId: "dafamilia-lanches",
        storageBucket: "dafamilia-lanches.appspot.com",
        messagingSenderId: "XXXXXX",
        appId: "1:XXXXXX:web:XXXXXX"
      };
      firebase.initializeApp(firebaseConfig);
    }
  } catch (e) {
    console.warn("Firebase init warning:", e);
  }
})();

const auth = (window.firebase && firebase.auth) ? firebase.auth() : null;

/* ============== Áudio de clique ============== */
const clickSound = new Audio("click.wav");
clickSound.volume = 0.35;
function playClick(){ try { clickSound.currentTime = 0; clickSound.play(); } catch(e){} }

/* ============== Utilidades ============== */
function qs(sel, ctx=document){ return ctx.querySelector(sel); }
function qsa(sel, ctx=document){ return Array.from(ctx.querySelectorAll(sel)); }
function money(n){ return n.toFixed(2).replace(".", ","); }
function popup(msg){
  const div = document.createElement("div");
  div.className = "popup-add";
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(()=>div.remove(), 1400);
}

/* ============== Estado do carrinho ============== */
let cart = JSON.parse(localStorage.getItem("cart")||"[]");
function saveCart(){ localStorage.setItem("cart", JSON.stringify(cart)); updateCartCount(); renderCartList(); }
function updateCartCount(){ const el = qs("#cart-count"); if(el) el.textContent = cart.reduce((a,b)=>a+(b.quantidade||1),0); }

/* ============== Construção/garantia de DOM necessário ============== */
(function ensureCartDom(){
  if(!qs("#cart-backdrop")){
    const b = document.createElement("div"); b.id="cart-backdrop"; document.body.appendChild(b);
  }
  if(!qs("#mini-cart")){
    const aside = document.createElement("aside");
    aside.id = "mini-cart";
    aside.className = "mini-cart";
    aside.innerHTML = `
      <header class="mini-head">
        <h3>Seu Pedido</h3>
        <button class="mini-close" aria-label="Fechar">✕</button>
      </header>
      <div id="mini-list" class="mini-list">
        <p class="empty-cart">Seu carrinho está vazio.</p>
      </div>
      <footer class="mini-foot">
        <button id="mini-clear" class="btn-secondary">Limpar</button>
        <button id="mini-checkout" class="btn-primary">Fechar pedido</button>
      </footer>
    `;
    document.body.appendChild(aside);
  }
})();

/* ============== Abrir/fechar carrinho ============== */
function openCart(){
  qs("#mini-cart")?.classList.add("active");
  qs("#cart-backdrop")?.classList.add("show");
  document.body.classList.add("no-scroll");
}
function closeCart(){
  qs("#mini-cart")?.classList.remove("active");
  qs("#cart-backdrop")?.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

function wireCartToggles(){
  const icon = qs("#cart-icon");
  if(icon && !icon._wired){
    icon.addEventListener("click", ()=>{ playClick(); openCart(); });
    icon._wired = true;
  }
  const closeBtn = qs(".mini-close");
  if(closeBtn && !closeBtn._wired){
    closeBtn.addEventListener("click", closeCart);
    closeBtn._wired = true;
  }
  const backdrop = qs("#cart-backdrop");
  if(backdrop && !backdrop._wired){
    backdrop.addEventListener("click", closeCart);
    backdrop._wired = true;
  }
  const clearBtn = qs("#mini-clear");
  if(clearBtn && !clearBtn._wired){
    clearBtn.addEventListener("click", ()=>{ cart = []; saveCart(); popup("Carrinho limpo!"); });
    clearBtn._wired = true;
  }
  const checkoutBtn = qs("#mini-checkout");
  if(checkoutBtn && !checkoutBtn._wired){
    checkoutBtn.addEventListener("click", doCheckout);
    checkoutBtn._wired = true;
  }
}

/* ============== Render da lista do carrinho ============== */
function renderCartList(){
  const list = qs("#mini-list");
  if(!list) return;
  if(!cart.length){
    list.innerHTML = `<p class="empty-cart">Seu carrinho está vazio.</p>`;
    return;
  }
  let html = "";
  cart.forEach((item, idx)=>{
    const subtotal = (item.price * (item.quantidade||1));
    html += `
      <div class="cart-item" data-idx="${idx}">
        <span>${item.name}</span>
        <div style="display:flex;align-items:center;gap:6px;">
          <button class="qty-dec">−</button>
          <span>${item.quantidade||1}</span>
          <button class="qty-inc">+</button>
          <strong>R$ ${money(subtotal)}</strong>
          <button class="remove-item">✕</button>
        </div>
      </div>
    `;
  });
  list.innerHTML = html;

  // ações linha a linha
  qsa(".cart-item").forEach(row=>{
    const idx = +row.dataset.idx;
    const dec = qs(".qty-dec", row);
    const inc = qs(".qty-inc", row);
    const rem = qs(".remove-item", row);
    dec.onclick = ()=>{ cart[idx].quantidade = Math.max(1,(cart[idx].quantidade||1)-1); saveCart(); };
    inc.onclick = ()=>{ cart[idx].quantidade = (cart[idx].quantidade||1)+1; saveCart(); };
    rem.onclick = ()=>{ cart.splice(idx,1); saveCart(); };
  });
}

/* ============== Adicionar itens (botões dos cards) ============== */
function wireAddButtons(){
  qsa(".add-cart").forEach(btn=>{
    if(btn._wired) return;
    btn.addEventListener("click", (e)=>{
      const card = e.target.closest(".card");
      if(!card) return;
      const item = {
        id: card.dataset.id || ("ID-"+Date.now()),
        name: card.dataset.name || (qs("h3",card)?.textContent?.trim() || "Item"),
        price: parseFloat(card.dataset.price || "0"),
        quantidade: 1
      };
      cart.push(item);
      saveCart();
      playClick();
      popup(`🍔 ${item.name} adicionado!`);
    });
    btn._wired = true;
  });
}

/* ============== Adicionais (modal simples) ============== */
(function ensureExtrasModal(){
  if(!qs("#extras-backdrop")){
    const b = document.createElement("div"); b.id="extras-backdrop"; document.body.appendChild(b);
  }
  if(!qs("#extras-modal")){
    const m = document.createElement("div"); m.id="extras-modal"; m.setAttribute("aria-hidden","true");
    m.innerHTML = `
      <div class="extras-head">
        <span>Escolha seus adicionais</span>
        <button class="extras-close" aria-label="Fechar">✕</button>
      </div>
      <div class="extras-list" id="extras-list">
        <!-- opções injetadas via JS -->
      </div>
      <div class="extras-foot">
        <button id="extras-cancel" class="btn-secondary">Cancelar</button>
        <button id="extras-add" class="btn-primario">Adicionar</button>
      </div>
    `;
    document.body.appendChild(m);
  }
})();

const EXTRAS = [
  {label:"🧀 Cheddar", key:"Cheddar", price:2.0},
  {label:"🥓 Bacon",   key:"Bacon",   price:3.0},
  {label:"🥚 Ovo",     key:"Ovo",     price:1.5},
  {label:"🧅 Cebola",  key:"Cebola",  price:1.5}
];

let extrasTargetCard = null;

function openExtras(card){
  extrasTargetCard = card;
  const list = qs("#extras-list");
  list.innerHTML = EXTRAS.map(x=>`
    <label>
      <span>${x.label}</span>
      <input type="checkbox" data-extra="${x.key}" data-price="${x.price}">
    </label>
  `).join("");
  qs("#extras-backdrop")?.classList.add("show");
  qs("#extras-modal")?.classList.add("show");
  document.body.classList.add("no-scroll");
}
function closeExtras(){
  qs("#extras-backdrop")?.classList.remove("show");
  qs("#extras-modal")?.classList.remove("show");
  document.body.classList.remove("no-scroll");
  extrasTargetCard = null;
}

function wireExtras(){
  qsa(".extras-btn").forEach(btn=>{
    if(btn._wired) return;
    btn.addEventListener("click", (e)=>{
      const card = e.target.closest(".card");
      if(card) openExtras(card);
    });
    btn._wired = true;
  });
  const x = qs(".extras-close"); if(x && !x._wired){ x.addEventListener("click", closeExtras); x._wired=true; }
  const c = qs("#extras-cancel"); if(c && !c._wired){ c.addEventListener("click", closeExtras); c._wired=true; }
  const add = qs("#extras-add");
  if(add && !add._wired){
    add.addEventListener("click", ()=>{
      const checks = qsa("#extras-modal input:checked");
      if(!checks.length){ closeExtras(); return; }
      let total = 0; let names = [];
      checks.forEach(chk=>{ total += parseFloat(chk.dataset.price||"0"); names.push(chk.dataset.extra); });
      cart.push({
        id: "EXTRA-"+Date.now(),
        name: "Adicionais: " + names.join(", "),
        price: total,
        quantidade: 1
      });
      saveCart();
      closeExtras();
      popup("➕ Adicionais adicionados!");
    });
    add._wired = true;
  }
}

/* ============== Checkout (WhatsApp) ============== */
function doCheckout(){
  if(!cart.length){ popup("Carrinho vazio."); return; }
  let total = 0;
  const linhas = cart.map((it,i)=>{
    const q = it.quantidade||1;
    const sub = it.price*q; total += sub;
    return `${i+1}. ${it.name} — ${q}x (R$ ${money(sub)})`;
  });
  const msg = `*Pedido DFL*\n\n${linhas.join("\n")}\n\n*Total:* R$ ${money(total)}\n\nEndereço:\nForma de pagamento:`;
  const url = "https://wa.me/5534997178336?text=" + encodeURIComponent(msg);
  window.open(url, "_blank");
}

/* ============== Carrossel ============== */
function wireCarousel(){
  const carousel = qs("#promoCarousel");
  if(!carousel) return;
  const slides = qs(".slides", carousel);
  const prev = qs(".c-prev", carousel);
  const next = qs(".c-next", carousel);

  if(prev && !prev._wired){
    prev.addEventListener("click", ()=>{ slides.scrollBy({left:-300, behavior:"smooth"}); playClick(); });
    prev._wired = true;
  }
  if(next && !next._wired){
    next.addEventListener("click", ()=>{ slides.scrollBy({left:300, behavior:"smooth"}); playClick(); });
    next._wired = true;
  }

  qsa(".slide", slides).forEach((img, idx)=>{
    if(img._wired) return;
    img.addEventListener("click", ()=>{
      playClick();
      // Se existir data-wa usa; senão, usa alt.
      const texto = img.dataset.wa || `Quero a promoção ${idx+1}`;
      const url = "https://wa.me/5534997178336?text=" + encodeURIComponent(texto);
      window.open(url, "_blank");
    });
    img._wired = true;
  });
}

/* ============== Contador de promoção (até 23:59:59) ============== */
function tickCountdown(){
  const el = qs("#timer"); if(!el) return;
  const now = new Date();
  const end = new Date(); end.setHours(23,59,59,999);
  const diff = end - now;
  if(diff<=0){ el.textContent = "00:00:00"; return; }
  const h = Math.floor(diff/3_600_000);
  const m = Math.floor((diff%3_600_000)/60_000);
  const s = Math.floor((diff%60_000)/1000);
  el.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

/* ============== Banner de status (aberto/fechado) ============== */
/* Seg–Qui 18:00–23:15 | Sex–Dom 17:30–23:30 | Ter fechado */
function updateStatusBanner(){
  const el = qs("#status-banner"); if(!el) return;
  const now = new Date();
  const dow = now.getDay(); // 0=Dom,1=Seg,...,6=Sáb
  let aberto = false;
  if(dow===2){ // Terça
    aberto = false;
  } else if(dow>=1 && dow<=4){ // Seg–Qui
    const open = new Date(); open.setHours(18,0,0,0);
    const close = new Date(); close.setHours(23,15,0,0);
    aberto = now>=open && now<=close;
  } else { // Sex–Dom
    const open = new Date(); open.setHours(17,30,0,0);
    const close = new Date(); close.setHours(23,30,0,0);
    aberto = now>=open && now<=close;
  }
  el.textContent = aberto ? "💛 Estamos ABERTOS! Faça seu pedido" : "⏳ Estamos FECHADOS no momento";
  el.style.background = aberto ? "#c6ff8f" : "#ffd1d1";
  el.style.color = "#111";
}

/* ============== Login – Modal custom + Google ============== */
function ensureLoginModal(){
  if(qs("#login-modal")) return;
  const wrap = document.createElement("div");
  wrap.id = "login-modal";
  wrap.innerHTML = `
    <div class="login-backdrop"></div>
    <div class="login-box">
      <button class="login-x" aria-label="Fechar">✕</button>
      <h3>Entrar ou Cadastrar</h3>
      <p>Acesse sua conta para agilizar seus pedidos.</p>

      <form class="login-form" onsubmit="return false;">
        <input type="email" id="login-email" placeholder="Seu e-mail" autocomplete="username" />
        <input type="password" id="login-pass" placeholder="Sua senha" autocomplete="current-password" />
        <button id="btn-email-login" class="btn-primario">Entrar com e-mail</button>
      </form>

      <div class="divider">ou</div>

      <button id="btn-login-google" class="btn-google">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
        Entrar com Google
      </button>
    </div>
  `;
  document.body.appendChild(wrap);

  // fechar
  qs(".login-x", wrap)?.addEventListener("click", hideLoginModal);
  qs(".login-backdrop", wrap)?.addEventListener("click", hideLoginModal);

  // email/senha (opcional simples)
  qs("#btn-email-login", wrap)?.addEventListener("click", async ()=>{
    if(!auth){ alert("Login indisponível no momento."); return; }
    const email = qs("#login-email").value.trim();
    const pass = qs("#login-pass").value.trim();
    if(!email || !pass){ alert("Preencha e-mail e senha."); return; }
    try{
      await auth.signInWithEmailAndPassword(email, pass);
      hideLoginModal();
      popup("Bem-vindo(a)!");
    }catch(e){
      if(e.code==="auth/user-not-found"){
        // cria conta rápida
        await auth.createUserWithEmailAndPassword(email, pass);
        hideLoginModal();
        popup("Conta criada!");
      }else{
        alert("Erro no login: " + (e.message||e));
      }
    }
  });

  // Google
  qs("#btn-login-google", wrap)?.addEventListener("click", async ()=>{
    if(!auth){ alert("Login indisponível."); return; }
    try{
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      hideLoginModal();
      popup("Login com Google concluído!");
    }catch(e){
      // Geralmente pop-up bloqueado pelo navegador
      alert("Não foi possível abrir a janela de login.\nPermita pop-ups e tente novamente.");
      console.error(e);
    }
  });
}
function showLoginModal(){
  ensureLoginModal();
  qs("#login-modal")?.classList.add("show");
  document.body.classList.add("no-scroll");
}
function hideLoginModal(){
  qs("#login-modal")?.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

/* Botão do usuário no header (injetado) */
function mountUserButton(){
  const header = qs(".header"); if(!header) return;
  let btn = qs("#user-btn") || qs(".user-button");
  if(!btn){
    btn = document.createElement("button");
    btn.id = "user-btn";
    btn.className = "user-button";
    header.appendChild(btn);
  }
  if(auth){
    auth.onAuthStateChanged(user=>{
      if(user){
        btn.textContent = `Olá, ${user.displayName || (user.email? user.email.split("@")[0] : "Cliente")} (Sair)`;
        btn.onclick = async ()=>{ try{ await auth.signOut(); popup("Você saiu."); }catch(e){} };
      }else{
        btn.textContent = "Entrar / Cadastro";
        btn.onclick = ()=>{ showLoginModal(); };
      }
    });
  }else{
    // Sem Firebase: apenas abre modal visual (não faz auth real)
    btn.textContent = "Entrar / Cadastro";
    btn.onclick = ()=>{ showLoginModal(); };
  }
}

/* ============== STARTUP ============== */
function startup(){
  updateCartCount();
  renderCartList();
  wireCartToggles();
  wireAddButtons();
  wireExtras();
  wireCarousel();
  mountUserButton();

  // timers
  tickCountdown(); setInterval(tickCountdown, 1000);
  updateStatusBanner(); setInterval(updateStatusBanner, 60*1000);
}

document.addEventListener("DOMContentLoaded", startup);

---

# `script.js` (Parte 2/2) — **NÃO há mais código**  
Esta implementação ficou inteira na **Parte 1/2** acima. Não tem Parte 2 com mais código — deixei aqui só pra deixar claro que **a Parte 1 já é o arquivo completo**.

---

## O que esta versão resolve (do jeitinho que você pediu)
- ✅ **Visual mantido** (não mexi no seu CSS além de usar as classes/IDs que você já tem).
- ✅ **Som `click.wav`** tocando em:
  - clique no **ícone do carrinho**,
  - clique em **adicionar**,
  - clique nas **setas do carrossel**,
  - clique nas **imagens** do carrossel.
- ✅ **Carrinho**:
  - Abre/fecha com backdrop e trava o scroll,
  - Lista itens, altera quantidade, remove, limpa,
  - **Fechar pedido** abre WhatsApp com o resumo e total.
  - Caso o seu HTML não tenha mais o mini-cart, eu **crio tudo via JS**.
- ✅ **Adicionais**:
  - Modal com **Cheddar / Bacon / Ovo / Cebola**, com **emojis** (pra ficar bonitinho como você curtiu),
  - Soma no carrinho como item “Adicionais: …”.
- ✅ **Carrossel**:
  - Setas funcionam,
  - Clique na imagem abre WhatsApp com texto (usa `data-wa` se existir; senão “Quero a promoção X”).
- ✅ **Banner de status** (Aberto/Fechado) com a mesma lógica:  
  Seg–Qui 18:00–23:15 | Sex–Dom 17:30–23:30 | Ter fechado.
- ✅ **Login**:
  - **Botão Entrar/Cadastro** no topo, do tamanho certo (o seu CSS já limita),
  - **Modal** de login bonito (coerente com seu CSS),
  - **Entrar com Google** via `signInWithPopup` (a janela do Google abre — se o navegador bloquear pop-up, vai aparecer o aviso pra permitir),
  - **E-mail/senha** simples (opcional): se não existir o usuário, ele cria.
  - Quando logado, o botão vira “Olá, NOME (Sair)”.

---

## Como testar sem dor de cabeça
1. **Substitua** o conteúdo do seu `script.js` pela **PARTE 1/2** acima (é o arquivo todo).
2. Garanta que no **HTML** você tem os scripts do Firebase 8.x (como você já colocou).
3. O arquivo **`click.wav`** deve estar na mesma pasta do `script.js`.
4. Dê um refresh limpo (no celular: feche a aba e abra de novo; no desktop: `Ctrl+F5`).

Se algo **específico** ainda não bater com o seu HTML atual (por exemplo, se removeu o mini-cart do HTML), essa versão já se vira e **injeta** o que falta, então você não precisa sair caçando onde colar fragmento nenhum.

Se quiser, me manda um print depois do teste e eu ajusto na hora.0