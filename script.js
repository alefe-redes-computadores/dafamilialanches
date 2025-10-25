/* =========================================================
   🍔 DFL v1.8.1 — VISUAL REFINADO + BEBIDAS + BADGES
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------ ⚙️ BASE ------------------ */
  const sound = new Audio("click.wav");
  let cart = [];
  let currentUser = null;

  const money = (n) => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;
  const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };

  document.addEventListener("click", () => { try { sound.currentTime = 0; sound.play(); } catch (_) {} });

  /* ------------------ 🎯 ELEMENTOS ------------------ */
  const el = {
    cartIcon: document.getElementById("cart-icon"),
    cartCount: document.getElementById("cart-count"),
    miniCart: document.getElementById("mini-cart"),
    miniList: document.querySelector(".mini-list"),
    miniFoot: document.querySelector(".mini-foot"),
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
    slides: document.querySelector(".slides"),
    cPrev: document.querySelector(".c-prev"),
    cNext: document.querySelector(".c-next"),
    userBtn: document.getElementById("user-btn"),
    statusBanner: document.getElementById("status-banner"),
    hoursBanner: document.querySelector(".hours-banner"),
    bebidasSection: document.getElementById("bebidas-section"),
  };

  /* ------------------ 🌫️ BACKDROP ------------------ */
  if (!el.cartBackdrop) {
    const bd = document.createElement("div");
    bd.id = "cart-backdrop";
    document.body.appendChild(bd);
    el.cartBackdrop = bd;
  }

  const Backdrop = {
    show(){ el.cartBackdrop.classList.add("show"); document.body.classList.add("no-scroll"); },
    hide(){ el.cartBackdrop.classList.remove("show"); document.body.classList.remove("no-scroll"); },
  };

  /* ------------------ 🧩 OVERLAYS ------------------ */
  const Overlays = {
    closeAll(){
      document.querySelectorAll(".modal.show, #mini-cart.active, .orders-panel.active")
        .forEach((e)=> e.classList.remove("show","active"));
      Backdrop.hide();
    },
    open(modalLike){
      Overlays.closeAll();
      if (!modalLike) return;
      modalLike.classList.add(modalLike.id === "mini-cart" ? "active" : "show");
      Backdrop.show();
    },
  };
  el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());

  /* ------------------ 💬 POPUP ------------------ */
  function popupAdd(msg){
    let pop = document.querySelector(".popup-add");
    if(!pop){ pop = document.createElement("div"); pop.className="popup-add"; document.body.appendChild(pop); }
    pop.textContent = msg; pop.classList.add("show");
    setTimeout(()=> pop.classList.remove("show"), 2000);
  }

  /* ------------------ 🛒 MINI-CARRINHO ------------------ */
  function renderMiniCart(){
    if(!el.miniList || !el.miniFoot) return;

    const totalItens = cart.reduce((s,i)=>s+i.qtd,0);
    if (el.cartCount) el.cartCount.textContent = totalItens;

    if(!cart.length){
      el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';
      el.miniFoot.innerHTML = "";
      return;
    }

    el.miniList.innerHTML = cart.map((item,idx)=>`
      <div class="cart-item" style="border-bottom:1px solid #eee;padding:10px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="flex:1;">
            <p style="font-weight:600;margin-bottom:4px;">${item.nome}</p>
            <p style="color:#666;font-size:0.85rem;">${money(item.preco)} × ${item.qtd}</p>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <button class="cart-minus modern-btn red" data-idx="${idx}">−</button>
            <span style="font-weight:600;min-width:20px;text-align:center;">${item.qtd}</span>
            <button class="cart-plus modern-btn green" data-idx="${idx}">+</button>
            <button class="cart-remove modern-btn black" data-idx="${idx}">🗑</button>
          </div>
        </div>
      </div>
    `).join("");

    const total = cart.reduce((s,i)=>s + i.preco*i.qtd, 0);
    el.miniFoot.innerHTML = `
      <div style="padding:15px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:15px;font-size:1.2rem;font-weight:600;">
          <span>Total:</span><span style="color:#e53935;">${money(total)}</span>
        </div>
        <button id="finish-order" class="btn-primary full">Finalizar Pedido 🛍️</button>
        <button id="clear-cart" class="btn-secondary full">Limpar Carrinho</button>
      </div>`;

    document.querySelectorAll(".cart-plus").forEach(b=>b.addEventListener("click",e=>{
      const i = +e.target.dataset.idx; cart[i].qtd++; renderMiniCart();
    }));
    document.querySelectorAll(".cart-minus").forEach(b=>b.addEventListener("click",e=>{
      const i = +e.target.dataset.idx; cart[i].qtd>1 ? cart[i].qtd-- : cart.splice(i,1); renderMiniCart();
    }));
    document.querySelectorAll(".cart-remove").forEach(b=>b.addEventListener("click",e=>{
      const i = +e.target.dataset.idx; cart.splice(i,1); renderMiniCart(); popupAdd("Item removido!");
    }));

    document.getElementById("finish-order")?.addEventListener("click", fecharPedido);
    document.getElementById("clear-cart")?.addEventListener("click", ()=>{
      if(confirm("Limpar todo o carrinho?")){ cart=[]; renderMiniCart(); popupAdd("Carrinho limpo!"); }
    });
  }
  el.cartIcon?.addEventListener("click", ()=> Overlays.open(el.miniCart));

  /* ------------------ ➕ ADICIONAIS ------------------ */
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
  let produtoExtras = null;

  const openExtrasFor = safe((card)=>{
    if(!card || !el.extrasModal || !el.extrasList) return;
    produtoExtras = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Produto";
    el.extrasList.innerHTML = adicionais.map((a,i)=>`
      <label class="extra-line modern-line">
        <span>${a.nome} — <b>${money(a.preco)}</b></span>
        <input type="checkbox" value="${i}" class="modern-check">
      </label>`).join("");
    Overlays.open(el.extrasModal);
  });

  document.querySelectorAll(".extras-btn").forEach(btn=>btn.addEventListener("click",(e)=>{
    const card = e.currentTarget.closest(".card"); openExtrasFor(card);
  }));

  el.extrasConfirm?.addEventListener("click", ()=>{
    if(!produtoExtras) return Overlays.closeAll();
    const checks = [...document.querySelectorAll("#extras-modal .extras-list input:checked")];
    if(!checks.length) return alert("Selecione pelo menos um adicional!");
    checks.forEach(c=>{ const a = adicionais[+c.value]; cart.push({ nome:`${produtoExtras} + ${a.nome}`, preco:a.preco, qtd:1 }); });
    renderMiniCart(); popupAdd("Adicionais incluídos!"); Overlays.closeAll();
  });
  document.querySelectorAll("#extras-modal .extras-close").forEach(b=>b.addEventListener("click",()=>Overlays.closeAll()));

  /* ------------------ 🥤 MODAL DE BEBIDAS (COMBOS) ------------------ */
  const comboDrinkOptions = {
    casal: [
      { rotulo: "Fanta 1L (padrão)", delta: 0.0 },
      { rotulo: "Coca 1L", delta: 3.0 },
      { rotulo: "Coca 1L Zero", delta: 3.0 },
      { rotulo: "Guaraná 1L", delta: 2.5 },
    ],
    familia: [
      { rotulo: "Kuat 2L (padrão)", delta: 0.0 },
      { rotulo: "Coca 2L", delta: 5.0 },
      { rotulo: "Guaraná 2L", delta: 4.5 },
    ],
  };
  let _comboCtx = null;

  const openComboModal = safe((nomeCombo, precoBase)=>{
    if(!el.comboModal || !el.comboBody){ addCommonItem(nomeCombo, precoBase); return; }
    const low = (nomeCombo||"").toLowerCase();
    const grupo = low.includes("casal") ? "casal" : ((low.includes("família")||low.includes("familia")) ? "familia" : null);
    if(!grupo){ addCommonItem(nomeCombo, precoBase); return; }
    const opts = comboDrinkOptions[grupo];
    el.comboBody.innerHTML = opts.map((o,i)=>`
      <label class="extra-line modern-line">
        <span>${o.rotulo} — <b>+${money(o.delta)}</b></span>
        <input type="radio" name="combo-drink" value="${i}" ${i===0?"checked":""} class="modern-check">
      </label>`).join("");
    _comboCtx = { nomeCombo, precoBase, grupo }; Overlays.open(el.comboModal);
  });

  el.comboConfirm?.addEventListener("click", ()=>{
    if(!_comboCtx) return Overlays.closeAll();
    const sel = el.comboBody?.querySelector('input[name="combo-drink"]:checked'); if(!sel) return;
    const opt = comboDrinkOptions[_comboCtx.grupo][+sel.value];
    const finalName = `${_comboCtx.nomeCombo} + ${opt.rotulo}`;
    const finalPrice = Number(_comboCtx.precoBase) + (opt.delta||0);
    cart.push({ nome:finalName, preco:finalPrice, qtd:1 }); popupAdd(`${finalName} adicionado!`);
    renderMiniCart(); Overlays.closeAll();
  });
  document.querySelectorAll("#combo-modal .combo-close").forEach(b=>b.addEventListener("click",()=>Overlays.closeAll()));

  /* ------------------ 🧺 ADD ITEM ------------------ */
  function addCommonItem(nome, preco){
    const found = cart.find((i)=> i.nome===nome && i.preco===preco);
    if(found) found.qtd += 1; else cart.push({ nome, preco, qtd:1 });
    renderMiniCart(); popupAdd(`${nome} adicionado!`);
  }
  document.querySelectorAll(".add-cart").forEach(btn=>btn.addEventListener("click",(e)=>{
    const card = e.currentTarget.closest(".card"); if(!card) return;
    const nome = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";
    const preco = parseFloat(card.dataset.price || "0");
    if(/^combo/i.test(nome)) openComboModal(nome, preco); else addCommonItem(nome, preco);
  }));

  /* ------------------ 🍾 BEBIDAS (não sobrescrever HTML já existente) ------------------ */
  const bebidas = [
    { nome:"Coca-Cola 200ml", preco:4.00 }, { nome:"Coca-Cola 310ml", preco:5.00 },
    { nome:"Coca-Cola 310ml Zero", preco:5.00 }, { nome:"Del Valle Uva 450ml", preco:5.00 },
    { nome:"Del Valle Laranja 450ml", preco:5.00 }, { nome:"Fanta 1L", preco:8.00 },
    { nome:"Coca-Cola 1L", preco:9.00 }, { nome:"Coca-Cola 1L Zero", preco:9.00 },
    { nome:"Kuat 2L", preco:10.00 }, { nome:"Coca-Cola 2L", preco:13.00 },
  ];
  if (el.bebidasSection && el.bebidasSection.querySelectorAll(".card").length === 0){
    // Só preenche dinamicamente se você NÃO listou no HTML.
    const grid = document.createElement("div"); grid.className="grid";
    bebidas.forEach(b=>{
      const c = document.createElement("div"); c.className="card"; c.dataset.name=b.nome; c.dataset.price=b.preco;
      c.innerHTML = `<h3>${b.nome}</h3><p><b>${money(b.preco)}</b></p><div class="actions"><button class="add-cart">Adicionar</button></div>`;
      grid.appendChild(c);
    });
    el.bebidasSection.appendChild(grid);
    grid.querySelectorAll(".add-cart").forEach(btn=>btn.addEventListener("click",(e)=>{
      const card = e.currentTarget.closest(".card"); addCommonItem(card.dataset.name, parseFloat(card.dataset.price));
    }));
  }

  /* ------------------ 🖼️ CARROSSEL ------------------ */
  el.cPrev?.addEventListener("click", ()=>{ if(!el.slides) return; el.slides.scrollLeft -= Math.min(el.slides.clientWidth*.9, 320); });
  el.cNext?.addEventListener("click", ()=>{ if(!el.slides) return; el.slides.scrollLeft += Math.min(el.slides.clientWidth*.9, 320); });
  document.querySelectorAll(".slide").forEach(img=>img.addEventListener("click", ()=>{
    const msg = encodeURIComponent(img.dataset.wa || "Quero essa promoção! 🍔");
    window.open(`https://wa.me/5534997178336?text=${msg}`, "_blank");
  }));

  /* ------------------ ⏰ STATUS + TIMER ------------------ */
  const atualizarStatus = safe(()=>{
    const agora = new Date(); const h = agora.getHours(); const m = agora.getMinutes();
    const aberto = h>=18 && h<23;
    if(el.statusBanner){ el.statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!"; el.statusBanner.className = `status-banner ${aberto?"open":"closed"}`; }
    if(el.hoursBanner){
      if(aberto){ const rest = (23-h)*60 - m; el.hoursBanner.innerHTML = `⏰ Hoje atendemos até <b>23h00</b> — Faltam <b>${Math.floor(rest/60)}h ${rest%60}min</b>`; }
      else { const faltam = h<18 ? (18-h)*60 - m : (24-h+18)*60 - m; el.hoursBanner.innerHTML = `🔒 Fechado — Abrimos em <b>${Math.floor(faltam/60)}h ${faltam%60}min</b>`; }
    }
  });
  atualizarStatus(); setInterval(atualizarStatus, 60000);

  const atualizarTimer = safe(()=>{
    const agora = new Date(); const fim = new Date(); fim.setHours(23,59,59,999);
    const diff = fim - agora; const elTimer = document.getElementById("promo-timer"); if(!elTimer) return;
    if(diff<=0) return elTimer.textContent="00:00:00";
    const hh = String(Math.floor(diff/3600000)).padStart(2,"0");
    const mm = String(Math.floor((diff%3600000)/60000)).padStart(2,"0");
    const ss = String(Math.floor((diff%60000)/1000)).padStart(2,"0");
    elTimer.textContent = `${hh}:${mm}:${ss}`;
  });
  atualizarTimer(); setInterval(atualizarTimer, 1000);

  /* ------------------ 🔥 FIREBASE ------------------ */
  const firebaseConfig = {
    apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
    authDomain: "da-familia-lanches.firebaseapp.com",
    projectId: "da-familia-lanches",
    storageBucket: "da-familia-lanches.appspot.com",
    messagingSenderId: "106857147317",
    appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
    measurementId: "G-TCZ18HFWGX",
  };
  if (window.firebase && !firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth(); const db = firebase.firestore();

  /* ------------------ LOGIN ------------------ */
  const openLogin = ()=> Overlays.open(el.loginModal);
  const closeLogin = ()=> Overlays.closeAll();
  document.getElementById("user-btn")?.addEventListener("click", openLogin);
  document.querySelectorAll("#login-modal .login-close").forEach(b=>b.addEventListener("click", closeLogin));

  // Google
  el.googleBtn?.addEventListener("click", ()=>{
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then((res)=>{ currentUser = res.user; el.userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0] || "Cliente"}`; closeLogin(); showOrdersFabIfLogged(); popupAdd("Login com Google!"); })
      .catch((err)=> alert("Erro: " + err.message));
  });

  // Email/senha (login ou cria)
  el.loginForm?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const email = document.getElementById("login-email")?.value?.trim();
    const senha = document.getElementById("login-senha")?.value?.trim();
    if(!email || !senha) return alert("Preencha e-mail e senha.");

    auth.signInWithEmailAndPassword(email, senha)
      .then((cred)=>{ currentUser = cred.user; el.userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0] || currentUser.email.split("@")[0]}`; closeLogin(); showOrdersFabIfLogged(); popupAdd("Login realizado!"); })
      .catch(()=> {
        auth.createUserWithEmailAndPassword(email, senha)
          .then((cred)=>{ currentUser = cred.user; el.userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0] || currentUser.email.split("@")[0]}`; closeLogin(); showOrdersFabIfLogged(); popupAdd("Conta criada! 🎉"); })
          .catch((err)=> alert("Erro: " + err.message));
      });
  });

  auth.onAuthStateChanged((user)=>{
    if(user){ currentUser=user; el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`; }
    showOrdersFabIfLogged();
  });

  /* ------------------ PEDIDOS ------------------ */
  let ordersFab = document.getElementById("orders-fab");
  if(!ordersFab){ ordersFab = document.createElement("button"); ordersFab.id="orders-fab"; ordersFab.innerHTML="📦 Meus Pedidos"; document.body.appendChild(ordersFab); }

  let ordersPanel = document.querySelector(".orders-panel");
  if(!ordersPanel){
    ordersPanel = document.createElement("div");
    ordersPanel.className = "orders-panel";
    ordersPanel.innerHTML = `
      <div class="orders-head"><span>📦 Meus Pedidos</span><button class="orders-close">✖</button></div>
      <div class="orders-content" id="orders-content"><p class="empty-orders">Faça login para ver seus pedidos.</p></div>`;
    document.body.appendChild(ordersPanel);
  }
  function openOrdersPanel(){ Overlays.closeAll(); ordersPanel.classList.add("active"); el.cartBackdrop.classList.add("show"); document.body.classList.add("no-scroll"); }
  function closeOrdersPanel(){ ordersPanel.classList.remove("active"); el.cartBackdrop.classList.remove("show"); document.body.classList.remove("no-scroll"); }
  ordersPanel.querySelector(".orders-close")?.addEventListener("click", closeOrdersPanel);

  ordersFab.addEventListener("click", ()=>{
    if(!currentUser){ alert("Faça login para ver seus pedidos."); return; }
    openOrdersPanel(); carregarPedidosSeguro();
  });

  function showOrdersFabIfLogged(){ currentUser ? ordersFab.classList.add("show") : ordersFab.classList.remove("show"); }

  function carregarPedidosSeguro(){
    const container = document.getElementById("orders-content"); if(!container) return;
    container.innerHTML = `<p class="empty-orders">⏳ Carregando pedidos...</p>`;
    if(!currentUser){ container.innerHTML = `<p class="empty-orders">Faça login para ver seus pedidos.</p>`; return; }

    db.collection("Pedidos").where("usuario","==", currentUser.email).get()
      .then((snap)=>{
        if(snap.empty){ container.innerHTML = `<p class="empty-orders">😢 Nenhum pedido encontrado.</p>`; return; }
        const pedidos=[]; snap.forEach(d=>pedidos.push({id:d.id, ...d.data()}));
        pedidos.sort((a,b)=> new Date(b.data) - new Date(a.data));
        container.innerHTML = pedidos.map(p=>`
          <div class="order-item">
            <h4>📅 ${new Date(p.data).toLocaleString("pt-BR")}</h4>
            <p><b>Itens:</b><br>• ${Array.isArray(p.itens)? p.itens.join("<br>• ") : p.itens}</p>
            <p style="color:#4caf50;margin-top:5px;"><b>Total:</b> ${money(p.total)}</p>
          </div>`).join("");
      })
      .catch(err=> container.innerHTML = `<p class="empty-orders" style="color:red;">Erro: ${err.message}</p>`);
  }

  /* ------------------ ESC fecha overlays ------------------ */
  document.addEventListener("keydown",(e)=>{ if(e.key==="Escape") Overlays.closeAll(); });

  // Inicializa
  renderMiniCart();
  console.log("%c🔥 DFL v1.8.1 — Visual + Badges + Bebidas OK!", "color:#fff;background:#4caf50;padding:8px 12px;border-radius:8px;font-weight:700");
});