// DFL v1.4.2 — correção total: extras, combos, login, pedidos, carrossel e contador
document.addEventListener("DOMContentLoaded", () => {
/* =========================================
   ⚙️ BASE
========================================= */
const sound = new Audio("click.wav");
let cart = [];
let currentUser = null;

const money = n => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;
document.addEventListener("click", () => { try{ sound.currentTime=0; sound.play(); }catch(_){} });

/* =========================================
   🧩 ELEMENTOS ESSENCIAIS
========================================= */
const miniCart = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");
const cartCount = document.getElementById("cart-count");

/* MODAL ADICIONAIS */
let extrasModal = document.getElementById("extras-modal");
const extrasList = extrasModal.querySelector("#extras-list");
const extrasAdd  = extrasModal.querySelector("#extras-add");

/* MODAL LOGIN */
let loginModal = document.getElementById("login-modal");
function closeModal(el){ el.classList.remove("show"); document.body.classList.remove("no-scroll"); }
loginModal.querySelector(".login-x")?.addEventListener("click",()=>closeModal(loginModal));
extrasModal.querySelectorAll(".extras-close").forEach(b=>b.addEventListener("click",()=>closeModal(extrasModal)));

/* =========================================
   🕒 STATUS E CONTADOR
========================================= */
function atualizarStatus(){
  const banner = document.getElementById("status-banner");
  if (!banner) return;
  const now = new Date(); const d = now.getDay(), h=now.getHours(), m=now.getMinutes();
  let aberto=false;
  if (d>=1 && d<=4) aberto = h>=18 && (h<23 || (h===23 && m<=15));
  else aberto = h>=17 && (h<23 || (h===23 && m<=30));
  banner.textContent = aberto
    ? "✅ Estamos abertos! Faça seu pedido 🍔"
    : `⏰ Fechado agora — abrimos às ${d>=1&&d<=4?"18h":"17h"}`;
  banner.style.background = aberto ? "#00c853" : "#ff3d00";
}
function atualizarTimer(){
  const t1 = document.getElementById("timer");
  const t2 = document.getElementById("promo-timer");
  const now = new Date(), end = new Date(); end.setHours(23,59,59,999);
  const diff = end-now;
  const txt = diff<=0 ? "00:00:00" :
    (()=>{const h=String(Math.floor(diff/36e5)).padStart(2,"0");
           const m=String(Math.floor((diff%36e5)/6e4)).padStart(2,"0");
           const s=String(Math.floor((diff%6e4)/1e3)).padStart(2,"0");
           return `${h}:${m}:${s}`})();
  if (t1) t1.textContent=txt; if (t2) t2.textContent=txt;
}
atualizarStatus(); setInterval(atualizarStatus,60e3);
atualizarTimer();  setInterval(atualizarTimer,1e3);

/* =========================================
   🛒 CARRINHO
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
document.getElementById("cart-icon")?.addEventListener("click", ()=>{
  miniCart?.classList.toggle("active");
  cartBackdrop?.classList.toggle("show");
  document.body.classList.toggle("no-scroll");
  renderMiniCart();
});
cartBackdrop?.addEventListener("click", ()=>{
  miniCart?.classList.remove("active");
  cartBackdrop?.classList.remove("show");
  document.body.classList.remove("no-scroll");
});
document.querySelector("#mini-cart .extras-close")?.addEventListener("click", ()=>{
  miniCart?.classList.remove("active");
  cartBackdrop?.classList.remove("show");
  document.body.classList.remove("no-scroll");
});

/* =========================================
   ➕ ADICIONAIS DOS LANCHES
========================================= */
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
  extrasModal.dataset.produto = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Produto";
  extrasList.innerHTML = adicionais.map((a,i)=>`
    <label>
      <span>${a.nome} — ${money(a.preco)}</span>
      <input type="checkbox" value="${i}">
    </label>`).join("");
  extrasModal.classList.add("show"); document.body.classList.add("no-scroll");
}

document.querySelectorAll(".extras-btn").forEach(btn=>{
  btn.addEventListener("click", e=>{
    const card = e.currentTarget.closest(".card"); if (!card) return;
    openExtrasFor(card);
  });
});
extrasAdd?.addEventListener("click", ()=>{
  const produto = extrasModal.dataset.produto || "Produto";
  [...extrasList.querySelectorAll("input:checked")].forEach(c=>{
    const extra = adicionais[+c.value];
    cart.push({ nome:`${produto} + ${extra.nome}`, preco: extra.preco, qtd:1 });
  });
  closeModal(extrasModal);
  renderMiniCart();
});
/* =========================================
   🥤 MODAL DE BEBIDAS (COMBOS)
========================================= */
const comboDrinkOptions = {
  casal:   [
    { rotulo: "Fanta 1L (padrão)", delta: 0.01 },
    { rotulo: "Coca 1L",           delta: 3.01 },
    { rotulo: "Coca 1L Zero",      delta: 3.01 },
  ],
  familia: [
    { rotulo: "Kuat 2L (padrão)",  delta: 0.01 },
    { rotulo: "Coca 2L",           delta: 5.01 },
  ],
};

let comboModal = document.getElementById("combo-modal");
if (!comboModal){
  comboModal = document.createElement("div");
  comboModal.id = "combo-modal";
  comboModal.className = "modal";
  comboModal.innerHTML = `
    <div class="modal-content">
      <div class="modal-head">
        <h3>Escolher Refrigerante</h3>
        <button class="combo-close" title="Fechar">✖</button>
      </div>
      <div id="combo-body" style="display:flex;flex-direction:column;gap:8px;margin:12px 0;"></div>
      <div class="modal-foot" style="display:flex;gap:8px;">
        <button id="combo-confirm" class="btn-primary">Confirmar</button>
        <button class="combo-close btn-secondary">Cancelar</button>
      </div>
    </div>`;
  document.body.appendChild(comboModal);
}
const comboBody    = comboModal.querySelector("#combo-body");
const comboConfirm = comboModal.querySelector("#combo-confirm");
comboModal.querySelectorAll(".combo-close").forEach(b=>{
  b.addEventListener("click", () => {
    comboModal.classList.remove("show");
    document.body.classList.remove("no-scroll");
  });
});

let _comboCtx = null;
function openComboModal(nomeCombo, precoBase){
  const nameLower = (nomeCombo || "").toLowerCase();
  const grupo = nameLower.includes("casal") ? "casal" :
               (nameLower.includes("família") || nameLower.includes("familia")) ? "familia" : null;

  // Se não identificar o grupo, trata como item normal
  if (!grupo) { addCommonItem(nomeCombo, precoBase); return; }

  const opts = comboDrinkOptions[grupo] || [];
  comboBody.innerHTML = opts.map((o,i)=>`
    <label style="display:flex;justify-content:space-between;align-items:center;background:#f9f9f9;border:1px solid #eee;border-radius:8px;padding:8px 10px;">
      <span>${o.rotulo} — + ${money(o.delta)}</span>
      <input type="radio" name="combo-drink" value="${i}" ${i===0?"checked":""}>
    </label>`).join("");

  _comboCtx = { nomeCombo, precoBase, grupo };
  comboModal.classList.add("show");
  document.body.classList.add("no-scroll");
}

comboConfirm?.addEventListener("click", ()=>{
  const sel = comboBody.querySelector('input[name="combo-drink"]:checked');
  if (!_comboCtx || !sel) return;
  const { nomeCombo, precoBase, grupo } = _comboCtx;
  const opt = comboDrinkOptions[grupo][Number(sel.value)];
  const finalName  = `${nomeCombo} + ${opt.rotulo}`;
  const finalPrice = Number(precoBase) + (opt.delta || 0);
  cart.push({ nome: finalName, preco: finalPrice, qtd: 1 });
  popupAdd(`${finalName} adicionado!`);
  comboModal.classList.remove("show");
  document.body.classList.remove("no-scroll");
  renderMiniCart();
});

/* =========================================
   ➕ “ADICIONAR AO CARRINHO”
========================================= */
function addCommonItem(nome, preco){
  const found = cart.find(i => i.nome === nome && i.preco === preco);
  if (found) found.qtd += 1;
  else cart.push({ nome, preco, qtd: 1 });
  renderMiniCart();
  popupAdd(`${nome} adicionado!`);
}

document.querySelectorAll(".add-cart").forEach(btn=>{
  btn.addEventListener("click", e=>{
    const card = e.currentTarget.closest(".card");
    if (!card) return;
    const nome  = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";
    const preco = parseFloat(card.dataset.price || "0");

    if (/^combo/i.test(nome)) {
      openComboModal(nome, preco);
    } else {
      addCommonItem(nome, preco);
    }
  });
});

/* =========================================
   🖼️ CARROSSEL
========================================= */
(()=>{
  const slides = document.querySelector(".slides");
  document.querySelector(".c-prev")?.addEventListener("click", ()=>{
    if (slides) slides.scrollLeft -= Math.min(slides.clientWidth*0.9, 320);
  });
  document.querySelector(".c-next")?.addEventListener("click", ()=>{
    if (slides) slides.scrollLeft += Math.min(slides.clientWidth*0.9, 320);
  });
  document.querySelectorAll(".slide").forEach(img=>{
    img.addEventListener("click", ()=>{
      const msg = encodeURIComponent(img.dataset.wa || "");
      if (msg) window.open(`https://wa.me/5534997178336?text=${msg}`, "_blank");
      else if (img.src) window.open(img.src, "_blank");
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
if (window.firebase && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = window.firebase ? firebase.auth() : null;
const db   = window.firebase ? firebase.firestore() : null;

// Botão de usuário no header (se faltar)
let userBtn = document.getElementById("user-btn");
if (!userBtn){
  userBtn = document.createElement("button");
  userBtn.id = "user-btn";
  userBtn.className = "user-button";
  userBtn.textContent = "Entrar / Cadastrar";
  document.querySelector(".header")?.appendChild(userBtn);
}
userBtn.addEventListener("click", ()=>{
  loginModal?.classList.add("show");
  document.body.classList.add("no-scroll");
});

// e-mail/senha
document.querySelector(".btn-primario")?.addEventListener("click", ()=>{
  if (!auth) return alert("Auth indisponível no momento.");
  const email = document.getElementById("login-email")?.value?.trim();
  const senha = document.getElementById("login-senha")?.value?.trim();
  if (!email || !senha) return alert("Preencha e-mail e senha.");

  auth.signInWithEmailAndPassword(email, senha)
    .then(cred=>{
      currentUser = cred.user;
      userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
      loginModal?.classList.remove("show");
      document.body.classList.remove("no-scroll");
      showOrdersFabIfLogged();
    })
    .catch(()=>{
      auth.createUserWithEmailAndPassword(email, senha)
        .then(cred=>{
          currentUser = cred.user;
          userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
          loginModal?.classList.remove("show");
          document.body.classList.remove("no-scroll");
          alert("Conta criada com sucesso! 🎉");
          showOrdersFabIfLogged();
        })
        .catch(err=>alert("Erro: "+err.message));
    });
});

// Google
document.querySelector(".btn-google")?.addEventListener("click", ()=>{
  if (!auth) return alert("Auth indisponível no momento.");
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result=>{
      currentUser = result.user;
      userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0] || "Cliente"}`;
      loginModal?.classList.remove("show");
      document.body.classList.remove("no-scroll");
      showOrdersFabIfLogged();
    })
    .catch(err=>alert("Erro no login com Google: "+err.message));
});

auth?.onAuthStateChanged(user=>{
  if (user){
    currentUser = user;
    userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
    showOrdersFabIfLogged();
  }
});
/* =========================================
   📦 FECHAR PEDIDO (Firestore)
========================================= */
function fecharPedido(){
  if (!cart.length) return alert("Carrinho vazio!");
  if (!currentUser){
    alert("Você precisa estar logado para enviar o pedido!");
    loginModal?.classList.add("show");
    return;
  }

  const total = cart.reduce((a,i)=>a+i.preco*i.qtd,0);
  const pedido = {
    usuario: currentUser.email,
    nome: currentUser.displayName || currentUser.email.split("@")[0],
    itens: cart.map(i => `${i.nome} x${i.qtd}`),
    total: Number(total.toFixed(2)),
    data: new Date().toISOString(),
  };

  db?.collection("Pedidos").add(pedido)
    .then(()=>{
      alert("Pedido salvo com sucesso ✅");
      const texto = encodeURIComponent(
        "🍔 *Pedido DFL*\n" +
        cart.map(i => `• ${i.nome} x${i.qtd}`).join("\n") +
        `\n\nTotal: ${money(total)}`
      );
      window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");
      cart = [];
      renderMiniCart();
    })
    .catch(err=>alert("Erro ao salvar pedido: "+err.message));
}

/* =========================================
   📋 MEUS PEDIDOS
========================================= */
let ordersFab = document.getElementById("orders-fab");
if (!ordersFab){
  ordersFab = document.createElement("button");
  ordersFab.id="orders-fab";
  ordersFab.innerHTML="📦 Meus Pedidos";
  document.body.appendChild(ordersFab);
}

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

document.querySelector(".orders-close")?.addEventListener("click",()=>{
  ordersPanel.classList.remove("active");
});
ordersFab.addEventListener("click", ()=>{
  if (!currentUser) return alert("Faça login para ver seus pedidos.");
  ordersPanel.classList.add("active");
  carregarPedidosSeguro();
});

function showOrdersFabIfLogged(){
  if (currentUser) ordersFab.classList.add("show");
  else ordersFab.classList.remove("show");
}

function carregarPedidosSeguro(){
  const container = document.getElementById("orders-content");
  if (!container) return;
  container.innerHTML=`<p class="empty-orders">Carregando pedidos...</p>`;
  if (!currentUser){
    container.innerHTML=`<p class="empty-orders">Você precisa estar logado para ver seus pedidos.</p>`;
    return;
  }

  db?.collection("Pedidos")
    .where("usuario","==",currentUser.email)
    .orderBy("data","desc")
    .get()
    .then(snapshot=>{
      if (snapshot.empty){
        container.innerHTML=`<p class="empty-orders">Nenhum pedido encontrado 😢</p>`;
        return;
      }
      container.innerHTML="";
      snapshot.forEach(doc=>{
        const p = doc.data();
        const itens = Array.isArray(p.itens)?p.itens.join(", "):p.itens;
        const box = document.createElement("div");
        box.className="order-item";
        box.innerHTML=`
          <h4>${new Date(p.data).toLocaleString("pt-BR")}</h4>
          <p><b>Itens:</b> ${itens}</p>
          <p><b>Total:</b> ${money(p.total)}</p>`;
        container.appendChild(box);
      });
    })
    .catch(err=>{
      container.innerHTML=`<p class="empty-orders">Erro ao carregar pedidos: ${err.message}</p>`;
    });
}

/* =========================================
   🔔 POPUP DE ITEM ADICIONADO
========================================= */
function popupAdd(msg){
  const pop=document.createElement("div");
  pop.className="popup-add";
  pop.textContent=msg;
  document.body.appendChild(pop);
  setTimeout(()=>pop.remove(),1400);
}

/* =========================================
   ✅ CONSOLE
========================================= */
console.log("🔥 DFL v1.4.2 — tudo reativado e estável");
}); // fim DOMContentLoaded