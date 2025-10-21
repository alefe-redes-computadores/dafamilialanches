/* =========================================================
   DFL – Script estável (Firebase v8 + Login/Registro)
   Funciona: som de clique, carrinho/checkout, adicionais,
   carrossel (WhatsApp), countdown, status aberto/fechado,
   login com Google e e-mail/senha.
   ========================================================= */

/* ---------------------------
   CONFIG / ESTADO
--------------------------- */
const CLICK_WAV = "click.wav";
const WHATSAPP_NUMBER = "5534997178336"; // <<< seu número com DDI + DDD
const clickSfx = new Audio(CLICK_WAV);
clickSfx.volume = 0.4;

// Carrinho persiste no localStorage
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

// Seletores principais já existentes no HTML
const cartCount     = document.getElementById("cart-count");
const miniCart      = document.getElementById("mini-cart");
const cartBackdrop  = document.getElementById("cart-backdrop");

const extrasModal   = document.getElementById("extras-modal");
const extrasList    = document.getElementById("extras-list");
const extrasAdd     = document.getElementById("extras-add");

const loginModal    = document.getElementById("login-modal");

/* ---------------------------
   UTILS
--------------------------- */
function playClick(){ try{ clickSfx.currentTime = 0; clickSfx.play(); }catch{} }
function money(n){ return `R$ ${Number(n||0).toFixed(2).replace(".", ",")}`; }
function saveCart(){ localStorage.setItem("cart", JSON.stringify(cart)); updateCartBadge(); }
function updateCartBadge(){
  const totalQtd = cart.reduce((acc, i)=> acc + (i.qtd||0), 0);
  cartCount.textContent = totalQtd;
}
function popup(msg){
  const el = document.createElement("div");
  el.className = "popup-add";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 1400);
}

/* ---------------------------
   STATUS: horario aberto / fechado
   Seg–Qui 18–23:15 | Sex–Dom 17:30–23:30 | Ter fechado
--------------------------- */
function setStatusBanner(){
  const el = document.getElementById("status-banner");
  if(!el) return;

  const d = new Date();
  const dow = d.getDay(); // 0 Dom, 1 Seg ... 6 Sáb
  const nowM = d.getHours()*60 + d.getMinutes();
  let openM=null, closeM=null, label="";

  if(dow === 2){ // Terça
    el.textContent = "⏰ Fechado hoje (Terça) — voltamos amanhã!";
    el.style.background = "#ff3d00";
    return;
  }

  if(dow>=1 && dow<=4){ // Seg-Qua-Qui
    openM = 18*60; closeM = 23*60+15; label = "Aberto até 23h15";
  }else{ // Sex, Sáb, Dom
    openM = 17*60+30; closeM = 23*60+30; label = "Aberto até 23h30";
  }

  if(nowM < openM){
    const falta = openM - nowM;
    const h = Math.floor(falta/60);
    const m = falta%60;
    el.textContent = `⏳ Abrimos às ${openM===18*60 ? "18h" : "17h30"} • falta ${h}h${String(m).padStart(2,"0")}m`;
    el.style.background = "#ffcc00";
  }else if(nowM <= closeM){
    el.textContent = `🟢 ${label}`;
    el.style.background = "#00c853";
  }else{
    el.textContent = "⏰ Fechado agora — abrimos no próximo horário.";
    el.style.background = "#ff3d00";
  }
}

/* ---------------------------
   COUNTDOWN até 23:59:59
--------------------------- */
function updateCountdown(){
  const box = document.getElementById("timer");
  if(!box) return;
  const end = new Date(); end.setHours(23,59,59,999);
  const diff = end - new Date();
  if(diff<=0){ box.textContent = "00:00:00"; return; }
  const h = Math.floor(diff/3_600_000);
  const m = Math.floor((diff%3_600_000)/60_000);
  const s = Math.floor((diff%60_000)/1000);
  box.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

/* ---------------------------
   CARROSSEL (setas + clique)
--------------------------- */
function initCarousel(){
  const rail = document.querySelector(".slides");
  if(!rail) return;
  const prev = document.querySelector(".c-prev");
  const next = document.querySelector(".c-next");
  const step = () => Math.min(rail.clientWidth*0.9, 320);

  prev?.addEventListener("click", ()=> rail.scrollBy({left:-step(), behavior:"smooth"}));
  next?.addEventListener("click", ()=> rail.scrollBy({left: step(), behavior:"smooth"}));

  rail.querySelectorAll(".slide").forEach(img=>{
    img.addEventListener("click", ()=>{
      // usar data-wa se houver; senão usa alt
      const wa = img.getAttribute("data-wa") || `Quero a promoção: ${img.alt||"Promoção"}`;
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(wa)}`;
      window.open(url, "_blank");
    });
  });
}

/* ---------------------------
   MINI-CARRINHO
--------------------------- */
function openMiniCart(){
  miniCart.classList.add("active");
  cartBackdrop.classList.add("show");
  document.body.classList.add("no-scroll");
}
function closeMiniCart(){
  miniCart.classList.remove("active");
  cartBackdrop.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

function renderMiniCart(){
  const list = document.getElementById("mini-list");
  const foot = miniCart.querySelector(".mini-foot");
  if(!list || !foot) return;

  list.innerHTML = "";
  if(!cart.length){
    list.innerHTML = `<p class="empty-cart">Seu carrinho está vazio 😢</p>`;
    foot.innerHTML = `
      <button id="mini-clear" class="btn-secondary">Limpar</button>
      <button id="mini-checkout" class="btn-primary" disabled>Fechar pedido</button>`;
    document.getElementById("mini-clear").onclick = ()=>{ cart = []; saveCart(); renderMiniCart(); };
    return;
  }

  let total = 0;
  cart.forEach((item, idx)=>{
    total += (item.preco||0) * (item.qtd||0);
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div style="flex:1;min-width:0">
        <span>${item.nome}</span><br>
        <small>${money(item.preco)}</small>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <button class="qty-dec">−</button>
        <span>${item.qtd}</span>
        <button class="qty-inc">+</button>
        <strong>${money(item.preco*item.qtd)}</strong>
        <button class="remove-item" title="Remover">x</button>
      </div>
    `;
    row.querySelector(".qty-inc").addEventListener("click", ()=>{ item.qtd++; saveCart(); renderMiniCart(); });
    row.querySelector(".qty-dec").addEventListener("click", ()=>{ item.qtd = Math.max(1, item.qtd-1); saveCart(); renderMiniCart(); });
    row.querySelector(".remove-item").addEventListener("click", ()=>{ cart.splice(idx,1); saveCart(); renderMiniCart(); });
    list.appendChild(row);
  });

  foot.innerHTML = `
    <button id="mini-clear" class="btn-secondary">Limpar</button>
    <button id="mini-checkout" class="btn-primary">Fechar pedido (${money(total)})</button>
  `;
  document.getElementById("mini-clear").onclick = ()=>{ cart = []; saveCart(); renderMiniCart(); };
  document.getElementById("mini-checkout").onclick = ()=>{
    const linhas = cart.map(i=>`• ${i.nome}${i.qtd>1?` x${i.qtd}`:""} — ${money(i.preco*i.qtd)}`);
    const text = `🍔 Pedido DFL:%0A%0A${linhas.join("%0A")}%0A%0ATotal: ${money(total)}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
  };
}

/* Eventos globais do mini-cart */
function wireMiniCart(){
  document.getElementById("cart-icon")?.addEventListener("click", ()=>{ playClick(); openMiniCart(); });
  cartBackdrop?.addEventListener("click", closeMiniCart);
  miniCart?.querySelector(".mini-close")?.addEventListener("click", closeMiniCart);
  document.addEventListener("keydown", (e)=>{ if(e.key==="Escape") closeMiniCart(); });
}

/* ---------------------------
   ADICIONAR AO CARRINHO
--------------------------- */
function bindAddButtons(){
  document.querySelectorAll(".add-cart").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const card  = btn.closest(".card");
      if(!card) return;
      const id    = card.dataset.id || card.dataset.name || Math.random().toString(36).slice(2);
      const nome  = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";
      const preco = parseFloat(card.dataset.price || "0");

      const found = cart.find(i=> i.id===id && i.preco===preco);
      if(found) found.qtd += 1; else cart.push({id, nome, preco, qtd: 1});
      saveCart();
      playClick();
      popup(`🍔 ${nome} adicionado!`);
      renderMiniCart(); // mantém o painel atualizado
    });
  });
}
/* ---------------------------
   ADICIONAIS (lista oficial)
--------------------------- */
const ADICIONAIS = [
  { nome: "Cebola",                         preco: 0.99 },
  { nome: "Salada",                         preco: 1.99 },
  { nome: "Ovo",                            preco: 1.99 },
  { nome: "Bacon",                          preco: 2.99 },
  { nome: "Hambúrguer Tradicional 56g",     preco: 2.99 },
  { nome: "Cheddar Cremoso",                preco: 3.99 },
  { nome: "Filé de frango",                 preco: 5.99 },
  { nome: "Hambúrguer Artesanal 120g",      preco: 7.99 }
];

function bindExtrasButtons(){
  document.querySelectorAll(".extras-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const card = btn.closest(".card");
      if(!card) return;
      const baseNome  = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";
      extrasModal.dataset.base = baseNome;

      // Render da lista
      extrasList.innerHTML = ADICIONAIS.map((a, i)=>`
        <label>
          <span>${a.nome} — ${money(a.preco)}</span>
          <input type="checkbox" value="${i}">
        </label>
      `).join("");

      extrasModal.classList.add("show");
      document.body.classList.add("no-scroll");
    });
  });

  // fechar modal
  document.querySelectorAll(".extras-close, #extras-cancel").forEach(el=>{
    el.addEventListener("click", ()=>{
      extrasModal.classList.remove("show");
      document.body.classList.remove("no-scroll");
    });
  });

  // adicionar selecionados
  extrasAdd.addEventListener("click", ()=>{
    const base = extrasModal.dataset.base || "Item";
    const checks = [...extrasList.querySelectorAll("input:checked")];
    if(!checks.length){
      extrasModal.classList.remove("show");
      document.body.classList.remove("no-scroll");
      return;
    }
    checks.forEach(c=>{
      const a = ADICIONAIS[Number(c.value)];
      cart.push({
        id: `extra-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        nome: `${base} + ${a.nome}`,
        preco: a.preco,
        qtd: 1
      });
    });
    saveCart();
    popup("➕ Adicionais adicionados!");
    renderMiniCart();
    extrasModal.classList.remove("show");
    document.body.classList.remove("no-scroll");
  });
}

/* ---------------------------
   LOGIN (Google + e-mail/senha)
   — usa Firebase v8 já incluído no HTML
--------------------------- */
function setupLogin(){
  // injeta o botão no header se não existir
  let userBtn = document.getElementById("user-btn");
  if(!userBtn){
    userBtn = document.createElement("button");
    userBtn.id = "user-btn";
    userBtn.className = "user-button";
    userBtn.textContent = "Entrar / Cadastrar";
    document.querySelector(".header")?.appendChild(userBtn);
  }

  // Abre/fecha modal
  const closeLogin = loginModal?.querySelector(".login-x");
  userBtn.addEventListener("click", ()=>{
    if(!loginModal){ alert("Área de login indisponível no HTML."); return; }
    loginModal.classList.add("show");
    document.body.classList.add("no-scroll");
  });
  closeLogin?.addEventListener("click", ()=>{
    loginModal.classList.remove("show");
    document.body.classList.remove("no-scroll");
  });
  loginModal?.addEventListener("click", (e)=>{
    if(e.target === loginModal){
      loginModal.classList.remove("show");
      document.body.classList.remove("no-scroll");
    }
  });

  // --- Firebase init (v8) ---
  const firebaseConfig = {
    apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
    authDomain: "da-familia-lanches.firebaseapp.com",
    projectId: "da-familia-lanches",
    storageBucket: "da-familia-lanches.firebasestorage.app",
    messagingSenderId: "106857147317",
    appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
    measurementId: "G-TCZ18HFWGX"
  };
  if(!firebase.apps.length){ firebase.initializeApp(firebaseConfig); }
  const auth = firebase.auth();

  // Elementos do modal
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("senha");
  const loginBtn   = loginModal?.querySelector(".btn-primario");
  const googleBtn  = loginModal?.querySelector(".btn-google");

  // Login/cadastro por e-mail
  loginBtn?.addEventListener("click", ()=>{
    const email = emailInput?.value.trim();
    const senha = senhaInput?.value.trim();
    if(!email || !senha) return alert("Preencha e-mail e senha.");

    auth.signInWithEmailAndPassword(email, senha)
      .then(cred=>{
        const nome = cred.user.displayName || cred.user.email.split("@")[0];
        userBtn.textContent = nome;
        loginModal.classList.remove("show");
        document.body.classList.remove("no-scroll");
        popup(`👋 Bem-vindo, ${nome}!`);
      })
      .catch(err=>{
        if(err.code === "auth/user-not-found"){
          if(confirm("Usuário não encontrado. Deseja cadastrar?")){
            auth.createUserWithEmailAndPassword(email, senha)
              .then(u=>{
                const nome = email.split("@")[0];
                userBtn.textContent = nome;
                loginModal.classList.remove("show");
                document.body.classList.remove("no-scroll");
                popup("✅ Conta criada com sucesso!");
              })
              .catch(e=> alert("Erro ao criar conta: " + e.message));
          }
        }else{
          alert("Erro ao entrar: " + err.message);
        }
      });
  });

  // Login com Google
  googleBtn?.addEventListener("click", ()=>{
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(result=>{
        const user = result.user;
        const nome = user.displayName?.split(" ")[0] || user.email.split("@")[0];
        userBtn.textContent = nome;
        loginModal.classList.remove("show");
        document.body.classList.remove("no-scroll");
        popup(`👋 Olá, ${nome}!`);
      })
      .catch(err=> alert("Erro no login com Google: " + err.message));
  });

  // Quando já estiver logado, manter o nome no botão
  auth.onAuthStateChanged(user=>{
    if(user){
      const nome = user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "Conta";
      userBtn.textContent = nome;
    }else{
      userBtn.textContent = "Entrar / Cadastrar";
    }
  });
}
/* ---------------------------
   BOOT
--------------------------- */
window.addEventListener("DOMContentLoaded", ()=>{
  try{ updateCartBadge(); }catch{}
  try{ renderMiniCart(); }catch{}
  try{ wireMiniCart(); }catch{}

  try{ bindAddButtons(); }catch{}
  try{ bindExtrasButtons(); }catch{}

  try{ initCarousel(); }catch{}

  try{ setStatusBanner(); setInterval(setStatusBanner, 60_000); }catch{}
  try{ updateCountdown(); setInterval(updateCountdown, 1000); }catch{}

  try{ setupLogin(); }catch(e){ console.error("Login setup error:", e); }

  // pequeno feedback sonoro global (opcional)
  document.addEventListener("click", (e)=>{
    // evita som em cada key press dentro de input
    const tag = (e.target.tagName||"").toLowerCase();
    if(tag !== "input" && tag !== "textarea") playClick();
  });
});