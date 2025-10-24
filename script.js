/* =========================================================
   DFL v1.4.9 — HOTFIX GERAL (cliques, sobreposições, combos)
   -> Substitui 100% do script.js atual
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  /* ------------------ BASE ------------------ */
  const money = n => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;
  const safe = fn => (...a) => { try { return fn(...a); } catch(e){ console.error(e); } };
  const sound = new Audio("click.wav");
  document.addEventListener("click", () => { try{ sound.currentTime=0; sound.play(); }catch(_){} });

  let cart = [];
  let currentUser = null;

  /* ------------------ ELEMENTOS FIXOS DO HTML ------------------ */
  const el = {
    cartIcon: document.getElementById("cart-icon"),
    cartCount: document.getElementById("cart-count"),
    miniCart: document.getElementById("mini-cart"),
    cartBackdrop: document.getElementById("cart-backdrop"),
    extrasModal: document.getElementById("extras-modal"),
    extrasList: document.querySelector("#extras-modal .extras-list"),
    extrasConfirm: document.getElementById("extras-confirm"),
    comboModal: document.getElementById("combo-modal"),
    comboBody: document.getElementById("combo-body"),
    comboConfirm: document.getElementById("combo-confirm"),
    loginModal: document.getElementById("login-modal"),
    loginForm: document.getElementById("login-form"),
    googleBtn: document.getElementById("google-login"),
    statusBanner: document.getElementById("status-banner"),
    hoursBanner: document.querySelector(".hours-banner"),
    slides: document.querySelector(".slides"),
    cPrev: document.querySelector(".c-prev"),
    cNext: document.querySelector(".c-next"),
    userBtn: document.getElementById("user-btn"),
  };

  /* Garante que exista UM backdrop e o reutiliza */
  if (!el.cartBackdrop) {
    const bd = document.createElement("div");
    bd.id = "cart-backdrop";
    document.body.appendChild(bd);
    el.cartBackdrop = bd;
  }

  /* ------------------ FUNÇÕES AUX ------------------ */
  const Backdrop = {
    show(){ el.cartBackdrop.classList.add("show"); document.body.classList.add("no-scroll"); },
    hide(){ el.cartBackdrop.classList.remove("show"); document.body.classList.remove("no-scroll"); }
  };

  const Overlays = {
    closeAll(){
      el.miniCart?.classList.remove("active");
      document.querySelector(".orders-panel")?.classList.remove("active");
      el.extrasModal?.classList.remove("show");
      el.comboModal?.classList.remove("show");
      el.loginModal?.classList.remove("show");
      Backdrop.hide();
    },
    open(modalLike){
      // fecha tudo e abre apenas o pedido
      Overlays.closeAll();
      if (!modalLike) return;
      if (modalLike === el.miniCart){
        modalLike.classList.add("active");
      } else {
        modalLike.classList.add("show");
      }
      Backdrop.show();
    }
  };

  el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());

  /* ------------------ MINI-CARRINHO ------------------ */
  const updateCartCount = safe(() => {
    if (el.cartCount) el.cartCount.textContent = cart.reduce((a,i)=>a+i.qtd,0);
  });

  const renderMiniCart = safe(() => {
    const lista = document.querySelector(".mini-list");
    const foot  = document.querySelector(".mini-foot");
    if (!lista || !foot) return;

    lista.innerHTML = "";
    let total = 0;
    if (!cart.length){
      lista.innerHTML = `<p class="empty-cart">Seu carrinho está vazio 😢</p>`;
    } else {
      cart.forEach((item,i) => {
        total += item.preco * item.qtd;
        const row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML = `
          <span>${item.nome} x${item.qtd}</span>
          <strong>${money(item.preco * item.qtd)}</strong>
          <div>
            <button class="qty-dec" data-i="${i}">−</button>
            <button class="qty-inc" data-i="${i}">+</button>
            <button class="remove-item" data-i="${i}">🗑</button>
          </div>`;
        lista.appendChild(row);
      });

      lista.querySelectorAll(".qty-inc").forEach(b=>b.addEventListener("click", e=>{
        cart[+e.currentTarget.dataset.i].qtd++; renderMiniCart(); updateCartCount();
      }));
      lista.querySelectorAll(".qty-dec").forEach(b=>b.addEventListener("click", e=>{
        const it = cart[+e.currentTarget.dataset.i]; it.qtd=Math.max(1,it.qtd-1); renderMiniCart(); updateCartCount();
      }));
      lista.querySelectorAll(".remove-item").forEach(b=>b.addEventListener("click", e=>{
        cart.splice(+e.currentTarget.dataset.i,1); renderMiniCart(); updateCartCount();
      }));
    }

    foot.innerHTML = `
      <button id="close-order" class="btn-primary">Fechar Pedido (${money(total)})</button>
      <button id="clear-cart" class="btn-secondary">Limpar</button>`;
    document.getElementById("clear-cart")?.addEventListener("click", ()=>{
      cart=[]; renderMiniCart(); updateCartCount();
    });
    document.getElementById("close-order")?.addEventListener("click", fecharPedido);
    updateCartCount();
  });

  el.cartIcon?.addEventListener("click", () => {
    renderMiniCart();
    Overlays.open(el.miniCart);
  });

  // X do topo do mini-carrinho (no seu HTML é .extras-close dentro do mini-cart)
  document.querySelector("#mini-cart .extras-close")?.addEventListener("click", () => {
    Overlays.closeAll();
  });

  /* ------------------ POPUP “adicionado” ------------------ */
  const popupAdd = msg => {
    const pop = document.createElement("div");
    pop.className = "popup-add";
    pop.textContent = msg || "Item adicionado!";
    document.body.appendChild(pop);
    setTimeout(()=>pop.remove(), 1400);
  };

  /* ------------------ ADICIONAIS (LANCHES) ------------------ */
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

  let produtoExtras = null;
  const openExtrasFor = safe((card) => {
    if (!card || !el.extrasModal || !el.extrasList) return;
    produtoExtras = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Produto";
    el.extrasList.innerHTML = adicionais.map((a,i)=>`
      <label class="extra-line">
        <span>${a.nome} — ${money(a.preco)}</span>
        <input type="checkbox" value="${i}">
      </label>`).join("");
    Overlays.open(el.extrasModal);
  });

  document.querySelectorAll(".extras-btn").forEach(btn=>{
    btn.addEventListener("click", e=>{
      const card = e.currentTarget.closest(".card");
      openExtrasFor(card);
    });
  });

  el.extrasConfirm?.addEventListener("click", () => {
    if (!produtoExtras) return Overlays.closeAll();
    const checks = [...document.querySelectorAll("#extras-modal .extras-list input:checked")];
    checks.forEach(c=>{
      const a = adicionais[+c.value];
      cart.push({ nome:`${produtoExtras} + ${a.nome}`, preco:a.preco, qtd:1 });
    });
    renderMiniCart();
    popupAdd(`${produtoExtras} atualizado com adicionais!`);
    Overlays.closeAll();
  });

  document.querySelectorAll("#extras-modal .extras-close").forEach(b=>{
    b.addEventListener("click", ()=> Overlays.closeAll());
  });

  /* ------------------ ADICIONAIS (BEBIDA DOS COMBOS) ------------------ */
  const comboDrinkOptions = {
    casal:   [ {rotulo:"Fanta 1L (padrão)", delta:0.01}, {rotulo:"Coca 1L", delta:3.01}, {rotulo:"Coca 1L Zero", delta:3.01} ],
    familia: [ {rotulo:"Kuat 2L (padrão)",  delta:0.01}, {rotulo:"Coca 2L", delta:5.01} ],
  };
  let _comboCtx = null;

  const openComboModal = safe((nomeCombo, precoBase) => {
    if (!el.comboModal || !el.comboBody) { addCommonItem(nomeCombo, precoBase); return; }
    const low = (nomeCombo||"").toLowerCase();
    const grupo = low.includes("casal") ? "casal" :
                  (low.includes("família") || low.includes("familia")) ? "familia" : null;
    if (!grupo) { addCommonItem(nomeCombo, precoBase); return; }

    const opts = comboDrinkOptions[grupo];
    el.comboBody.innerHTML = opts.map((o,i)=>`
      <label class="extra-line">
        <span>${o.rotulo} — + ${money(o.delta)}</span>
        <input type="radio" name="combo-drink" value="${i}" ${i===0?"checked":""}>
      </label>`).join("");

    _comboCtx = { nomeCombo, precoBase, grupo };
    Overlays.open(el.comboModal);
  });

  el.comboConfirm?.addEventListener("click", () => {
    if (!_comboCtx) return Overlays.closeAll();
    const sel = el.comboBody?.querySelector('input[name="combo-drink"]:checked');
    if (!sel) return;
    const opt = comboDrinkOptions[_comboCtx.grupo][+sel.value];
    const finalName = `${_comboCtx.nomeCombo} + ${opt.rotulo}`;
    const finalPrice = Number(_comboCtx.precoBase) + (opt.delta||0);
    cart.push({ nome: finalName, preco: finalPrice, qtd:1 });
    popupAdd(`${finalName} adicionado!`);
    renderMiniCart();
    Overlays.closeAll();
  });

  document.querySelectorAll("#combo-modal .combo-close").forEach(b=>{
    b.addEventListener("click", ()=> Overlays.closeAll());
  });

  /* ------------------ ADD AO CARRINHO ------------------ */
  function addCommonItem(nome, preco){
    const found = cart.find(i=>i.nome===nome && i.preco===preco);
    if (found) found.qtd+=1; else cart.push({nome,preco,qtd:1});
    renderMiniCart(); popupAdd(`${nome} adicionado!`);
  }

  document.querySelectorAll(".add-cart").forEach(btn=>{
    btn.addEventListener("click", e=>{
      const card = e.currentTarget.closest(".card");
      if (!card) return;
      const nome  = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";
      const preco = parseFloat(card.dataset.price || "0");
      if (/^combo/i.test(nome)) openComboModal(nome, preco);
      else addCommonItem(nome, preco);
    });
  });

  /* ------------------ CARROSSEL ------------------ */
  el.cPrev?.addEventListener("click", ()=> {
    if (!el.slides) return; el.slides.scrollLeft -= Math.min(el.slides.clientWidth*0.9, 320);
  });
  el.cNext?.addEventListener("click", ()=> {
    if (!el.slides) return; el.slides.scrollLeft += Math.min(el.slides.clientWidth*0.9, 320);
  });
  document.querySelectorAll(".slide").forEach(img=>{
    img.addEventListener("click", ()=>{
      const msg = encodeURIComponent(img.dataset.wa || "Quero a promoção!");
      window.open(`https://wa.me/5534997178336?text=${msg}`, "_blank");
    });
  });

  /* ------------------ STATUS + TIMERS ------------------ */
  const atualizarStatus = safe(()=>{
    const agora = new Date(), d=agora.getDay(), h=agora.getHours(), m=agora.getMinutes();
    const aberto =
      (d>=1 && d<=4 && (h>18 || h===18 || (h<23) || (h===23 && m<=15))) ||
      ((d===5||d===6||d===0) && (h>=17 && (h<23 || (h===23 && m<=30))));
    if (el.statusBanner){
      el.statusBanner.textContent = aberto ? "✅ Estamos abertos! Faça seu pedido 🍔" : "⏰ Fechado — Voltamos em breve!";
      el.statusBanner.style.background = aberto ? "#00c853" : "#ff3d00";
    }
    if (el.hoursBanner){
      if (aberto){
        const limite = (d>=1 && d<=4) ? (23*60+15) : (23*60+30);
        const nowMin = h*60 + m;
        const rest = Math.max(0, limite - nowMin);
        el.hoursBanner.innerHTML = `⏰ Hoje atendemos até <b>${(d>=1&&d<=4)?"23h15":"23h30"}</b> — Faltam <b>${Math.floor(rest/60)}h ${rest%60}min</b>`;
      } else {
        const abreH = (d>=1 && d<=4) ? 18 : 17;
        const nowMin = h*60+m, openMin=abreH*60;
        const rest = (nowMin<=openMin)?(openMin-nowMin):((24*60-nowMin)+openMin);
        el.hoursBanner.innerHTML = `🔒 Fechado — Abrimos em <b>${Math.floor(rest/60)}h ${rest%60}min</b>`;
      }
    }
  });
  atualizarStatus(); setInterval(atualizarStatus, 60000);

  const atualizarTimer = safe(()=>{
    const box1 = document.getElementById("timer");
    const box2 = document.getElementById("promo-timer");
    if (!box1 && !box2) return;
    const agora = new Date(), fim = new Date();
    fim.setHours(23,59,59,999);
    const diff=fim-agora;
    const txt = diff<=0 ? "00:00:00" : (()=> {
      const h=String(Math.floor(diff/36e5)).padStart(2,"0");
      const m=String(Math.floor((diff%36e5)/6e4)).padStart(2,"0");
      const s=String(Math.floor((diff%6e4)/1e3)).padStart(2,"0");
      return `${h}:${m}:${s}`;
    })();
    if (box1) box1.textContent=txt; if (box2) box2.textContent=txt;
  });
  atualizarTimer(); setInterval(atualizarTimer, 1000);

  /* ------------------ FIREBASE v8 ------------------ */
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
  const auth = firebase.auth();
  const db   = firebase.firestore();

  /* ------------------ LOGIN ------------------ */
  const openLogin = ()=> Overlays.open(el.loginModal);
  const closeLogin = ()=> Overlays.closeAll();
  el.userBtn?.addEventListener("click", openLogin);
  el.loginModal?.querySelector(".login-x")?.addEventListener("click", closeLogin);
  el.loginModal?.addEventListener("click", (e)=>{ if (e.target===el.loginModal) closeLogin(); });

  el.loginForm?.addEventListener("submit", (e)=>{
    e.preventDefault();
    const email = el.loginForm.querySelector('input[type="email"]')?.value?.trim();
    const senha = el.loginForm.querySelector('input[type="password"]')?.value?.trim();
    if (!email || !senha) return alert("Preencha e-mail e senha.");
    auth.signInWithEmailAndPassword(email, senha)
      .then(cred=>{ currentUser=cred.user; el.userBtn.textContent=`Olá, ${currentUser.displayName?.split(" ")[0]||currentUser.email.split("@")[0]}`; closeLogin(); showOrdersFabIfLogged(); })
      .catch(()=> auth.createUserWithEmailAndPassword(email, senha).then(cred=>{
        currentUser=cred.user; el.userBtn.textContent=`Olá, ${currentUser.displayName?.split(" ")[0]||currentUser.email.split("@")[0]}`; closeLogin(); alert("Conta criada com sucesso! 🎉"); showOrdersFabIfLogged();
      }).catch(err=>alert("Erro: "+err.message)));
  });

  el.googleBtn?.addEventListener("click", ()=>{
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(res=>{ currentUser=res.user; el.userBtn.textContent=`Olá, ${currentUser.displayName?.split(" ")[0]||"Cliente"}`; closeLogin(); showOrdersFabIfLogged(); })
      .catch(err=>alert("Erro no login com Google: "+err.message));
  });

  auth.onAuthStateChanged(user=>{
    if (user){ currentUser=user; el.userBtn.textContent=`Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`; }
    showOrdersFabIfLogged();
  });

  /* ------------------ FECHAR PEDIDO ------------------ */
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
      window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");
      cart=[]; renderMiniCart();
    }).catch(err=>alert("Erro ao salvar pedido: "+err.message));
  }

  /* ------------------ MEUS PEDIDOS (painel) ------------------ */
  let ordersFab = document.getElementById("orders-fab");
  if (!ordersFab){
    ordersFab = document.createElement("button");
    ordersFab.id = "orders-fab";
    ordersFab.innerHTML = "📦 Meus Pedidos";
    document.body.appendChild(ordersFab);
  }
  let ordersPanel = document.querySelector(".orders-panel");
  if (!ordersPanel){
    ordersPanel = document.createElement("div");
    ordersPanel.className = "orders-panel";
    ordersPanel.innerHTML = `
      <div class="orders-head">
        <span>📦 Meus Pedidos</span>
        <button class="orders-close">✖</button>
      </div>
      <div class="orders-content" id="orders-content">
        <p class="empty-orders">Faça login para ver seus pedidos.</p>
      </div>`;
    document.body.appendChild(ordersPanel);
  }

  function openOrdersPanel(){ Overlays.open(ordersPanel); }
  function closeOrdersPanel(){ Overlays.closeAll(); }
  ordersFab.addEventListener("click", ()=>{
    if (!currentUser) return alert("Faça login para ver seus pedidos.");
    openOrdersPanel();
    carregarPedidosSeguro();
  });
  ordersPanel.querySelector(".orders-close")?.addEventListener("click", closeOrdersPanel);

  function showOrdersFabIfLogged(){ if (currentUser) ordersFab.classList.add("show"); else ordersFab.classList.remove("show"); }

  function carregarPedidosSeguro(){
    const container = document.getElementById("orders-content");
    if (!container) return;
    container.innerHTML = `<p class="empty-orders">Carregando pedidos...</p>`;
    if (!currentUser){ container.innerHTML = `<p class="empty-orders">Você precisa estar logado para ver seus pedidos.</p>`; return; }
    db.collection("Pedidos").where("usuario","==",currentUser.email).orderBy("data","desc").get()
      .then(snap=>{
        if (snap.empty){ container.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado 😢</p>`; return; }
        container.innerHTML = "";
        snap.forEach(doc=>{
          const p = doc.data(); const itens = Array.isArray(p.itens)?p.itens.join(", "):(p.itens||"");
          const box = document.createElement("div"); box.className="order-item";
          box.innerHTML = `
            <h4>${new Date(p.data).toLocaleString("pt-BR")}</h4>
            <p><b>Itens:</b> ${itens}</p>
            <p><b>Total:</b> ${money(p.total)}</p>`;
          container.appendChild(box);
        });
      })
      .catch(err=>{ container.innerHTML = `<p class="empty-orders">Erro ao carregar pedidos: ${err.message}</p>`; });
  }

  /* ------------------ ESC FECHA TUDO ------------------ */
  document.addEventListener("keydown", (e)=>{
    if (e.key !== "Escape") return;
    Overlays.closeAll();
  });

  /* ------------------ LOG ------------------ */
  console.log("%c✅ DFL v1.4.9 — Hotfix aplicado (cliques e sobreposições ok).", "color:#fff;background:#111;padding:6px 10px;border-radius:8px");
});