// DFL v1.4.7 — reativa cliques, modais modernos e posiciona login/carrinho
document.addEventListener("DOMContentLoaded", () => {
  /* ========== UTIL ========= */
  const money = n => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;
  const sound = new Audio("click.wav");
  let safeClick = () => { try { sound.currentTime = 0; sound.play(); } catch(e){} };

  /* ========== HEADER: garante cluster da direita (login + carrinho) ========== */
  const header = document.querySelector(".header");
  const headerContent = document.querySelector(".header-content");
  let headerRight = document.querySelector(".header-right");
  if (!headerRight) {
    headerRight = document.createElement("div");
    headerRight.className = "header-right";
    header.appendChild(headerRight);
  }

  // Botão carrinho — já existe no HTML
  const cartBtn = document.getElementById("cart-icon");
  if (cartBtn && !headerRight.contains(cartBtn)) headerRight.appendChild(cartBtn);

  // Botão usuário — único
  let userBtn = document.getElementById("user-btn");
  if (!userBtn) {
    userBtn = document.createElement("button");
    userBtn.id = "user-btn";
    userBtn.className = "user-button";
    userBtn.textContent = "Entrar / Cadastrar";
  }
  if (!headerRight.contains(userBtn)) headerRight.prepend(userBtn);

  /* ========== MINICARRINHO ========== */
  const miniCart = document.getElementById("mini-cart");
  const cartBackdrop = document.getElementById("cart-backdrop");
  const cartCount = document.getElementById("cart-count");
  const miniList  = document.querySelector(".mini-list");
  const miniFoot  = document.querySelector(".mini-foot");
  let cart = [];

  function updateCartCount(){
    if (cartCount) cartCount.textContent = cart.reduce((a,i)=>a+i.qtd,0);
  }
  function renderMiniCart(){
    if (!miniList || !miniFoot) return;
    miniList.innerHTML = "";
    let total = 0;
    if (!cart.length){
      miniList.innerHTML = `<p class="empty-cart">Seu carrinho está vazio 😢</p>`;
    } else {
      cart.forEach((item, i) => {
        total += item.preco * item.qtd;
        const row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML = `
          <span>${item.nome} x${item.qtd}</span>
          <strong>${money(item.preco * item.qtd)}</strong>
          <div>
            <button data-act="dec" data-i="${i}">−</button>
            <button data-act="inc" data-i="${i}">+</button>
            <button data-act="del" data-i="${i}">🗑</button>
          </div>`;
        miniList.appendChild(row);
      });
    }
    miniFoot.innerHTML = `
      <button id="close-order" class="btn-primary">Fechar Pedido (${money(total)})</button>
      <button id="clear-cart" class="btn-secondary">Limpar</button>`;
    updateCartCount();
  }

  function openCart(){
    if (!miniCart) return;
    miniCart.classList.add("active");
    cartBackdrop.classList.add("show");
    document.body.classList.add("no-scroll");
    renderMiniCart();
  }
  function closeCart(){
    miniCart?.classList.remove("active");
    cartBackdrop?.classList.remove("show");
    document.body.classList.remove("no-scroll");
  }

  cartBtn?.addEventListener("click", () => { safeClick(); openCart(); });
  cartBackdrop?.addEventListener("click", () => { closeCart(); });
  document.querySelector("#mini-cart .extras-close")?.addEventListener("click", closeCart);

  miniList?.addEventListener("click", (e)=>{
    const b = e.target.closest("button"); if(!b) return;
    const i = +b.dataset.i;
    if (b.dataset.act==="inc"){ cart[i].qtd++; }
    else if (b.dataset.act==="dec"){ cart[i].qtd = Math.max(1, cart[i].qtd-1); }
    else if (b.dataset.act==="del"){ cart.splice(i,1); }
    renderMiniCart();
  });

  /* ========== STATUS / CONTADOR ========== */
  function atualizarStatus(){
    const banner = document.getElementById("status-banner");
    if (!banner) return;
    const now = new Date(), d=now.getDay(), h=now.getHours(), m=now.getMinutes();
    let aberto=false;
    if (d>=1 && d<=4) aberto = h>=18 && (h<23 || (h===23 && m<=15));
    else aberto = h>=17 && (h<23 || (h===23 && m<=30));
    banner.textContent = aberto ? "✅ Estamos abertos! Faça seu pedido 🍔" :
                                  "⏰ Fechado no momento — Voltamos em breve!";
    banner.style.background = aberto ? "#00c853" : "#ff3d00";
  }
  function atualizarTimer(){
    const t1=document.getElementById("timer"), t2=document.getElementById("promo-timer");
    if(!t1 && !t2) return;
    const now=new Date(), end=new Date(); end.setHours(23,59,59,999);
    const diff=end-now;
    const fmt = diff<=0 ? "00:00:00" : (()=>{
      const h=String(Math.floor(diff/36e5)).padStart(2,"0");
      const m=String(Math.floor((diff%36e5)/6e4)).padStart(2,"0");
      const s=String(Math.floor((diff%6e4)/1e3)).padStart(2,"0");
      return `${h}:${m}:${s}`;
    })();
    if (t1) t1.textContent = fmt; if (t2) t2.textContent = fmt;
  }
  atualizarStatus(); setInterval(atualizarStatus, 60e3);
  atualizarTimer();  setInterval(atualizarTimer, 1e3);

  /* ========== POPUP “adicionado” ========== */
  function popupAdd(msg){
    const pop=document.createElement("div");
    pop.className="popup-add"; pop.textContent=msg;
    document.body.appendChild(pop);
    setTimeout(()=>pop.remove(),1400);
  }
/* ========== MODAL ADICIONAIS (lanches) ========== */
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

  let extrasModal = document.getElementById("extras-modal");
  if (!extrasModal){
    extrasModal = document.createElement("div");
    extrasModal.id="extras-modal"; extrasModal.className="modal";
    extrasModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-head">
          <h3>Adicionais</h3>
          <button class="extras-close" title="Fechar">✖</button>
        </div>
        <div id="extras-list" class="extras-list"></div>
        <div class="modal-foot">
          <button id="extras-add" class="btn-primary">Adicionar ao Pedido</button>
          <button class="extras-close btn-secondary">Cancelar</button>
        </div>
      </div>`;
    document.body.appendChild(extrasModal);
  }
  const extrasList = extrasModal.querySelector("#extras-list");
  const extrasAdd  = extrasModal.querySelector("#extras-add");

  function openExtrasFor(card){
    extrasModal.dataset.produto = card.dataset.name || card.querySelector("h3")?.firstChild?.textContent?.trim() || "Produto";
    extrasList.innerHTML = adicionais.map((a,i)=>`
      <label><span>${a.nome} — ${money(a.preco)}</span><input type="checkbox" value="${i}"></label>`).join("");
    extrasModal.classList.add("show"); document.body.classList.add("no-scroll");
  }
  function closeModal(modal){ modal.classList.remove("show"); document.body.classList.remove("no-scroll"); }
  extrasModal.addEventListener("click",(e)=>{ if(e.target===extrasModal) closeModal(extrasModal); });
  extrasModal.querySelectorAll(".extras-close").forEach(b=>b.addEventListener("click",()=>closeModal(extrasModal)));
  extrasAdd?.addEventListener("click", ()=>{
    const produto = extrasModal.dataset.produto || "Produto";
    [...extrasList.querySelectorAll("input:checked")].forEach(c=>{
      const extra = adicionais[+c.value];
      cart.push({ nome:`${produto} + ${extra.nome}`, preco: extra.preco, qtd:1 });
    });
    closeModal(extrasModal);
    renderMiniCart(); popupAdd(`${produto} — adicionais adicionados!`);
  });

  /* ========== MODAL COMBOS (escolha de refrigerante) ========== */
  const comboDrinkOptions = {
    casal:   [ {rotulo:"Fanta 1L (padrão)", delta:0.01}, {rotulo:"Coca 1L", delta:3.01}, {rotulo:"Coca 1L Zero", delta:3.01} ],
    familia: [ {rotulo:"Kuat 2L (padrão)",  delta:0.01}, {rotulo:"Coca 2L", delta:5.01} ],
  };
  let comboModal = document.getElementById("combo-modal");
  if (!comboModal){
    comboModal = document.createElement("div");
    comboModal.id="combo-modal"; comboModal.className="modal";
    comboModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-head">
          <h3>Escolher Refrigerante</h3>
          <button class="combo-close" title="Fechar">✖</button>
        </div>
        <div id="combo-body" style="display:flex;flex-direction:column;gap:8px;margin:6px 0;"></div>
        <div class="modal-foot">
          <button id="combo-confirm" class="btn-primary">Confirmar</button>
          <button class="combo-close btn-secondary">Cancelar</button>
        </div>
      </div>`;
    document.body.appendChild(comboModal);
  }
  comboModal.addEventListener("click",(e)=>{ if(e.target===comboModal) closeModal(comboModal); });
  comboModal.querySelectorAll(".combo-close").forEach(b=>b.addEventListener("click",()=>closeModal(comboModal)));
  const comboBody = comboModal.querySelector("#combo-body");
  const comboConfirm = comboModal.querySelector("#combo-confirm");

  let _comboCtx=null;
  function openComboModal(nomeCombo, precoBase){
    const nameLower=(nomeCombo||"").toLowerCase();
    const grupo = nameLower.includes("casal") ? "casal" :
                  (nameLower.includes("família") || nameLower.includes("familia")) ? "familia" : null;
    if (!grupo) { addCommonItem(nomeCombo, precoBase); return; }
    const opts = comboDrinkOptions[grupo];
    comboBody.innerHTML = opts.map((o,i)=>`
      <label style="display:flex;justify-content:space-between;align-items:center;border:1px solid #eee;border-radius:10px;padding:8px 10px;">
        <span>${o.rotulo} — + ${money(o.delta)}</span>
        <input type="radio" name="combo-drink" value="${i}" ${i===0?"checked":""}>
      </label>`).join("");
    _comboCtx = {nomeCombo, precoBase, grupo};
    comboModal.classList.add("show"); document.body.classList.add("no-scroll");
  }
  comboConfirm.addEventListener("click", ()=>{
    const sel = comboBody.querySelector('input[name="combo-drink"]:checked');
    if (!_comboCtx || !sel) return;
    const {nomeCombo, precoBase, grupo} = _comboCtx;
    const opt = comboDrinkOptions[grupo][+sel.value];
    const finalName = `${nomeCombo} + ${opt.rotulo}`;
    const finalPrice = Number(precoBase) + (opt.delta||0);
    cart.push({ nome: finalName, preco: finalPrice, qtd:1 });
    popupAdd(`${finalName} adicionado!`);
    closeModal(comboModal);
    renderMiniCart();
  });

  /* ========== BOTÕES “ADICIONAR” E “ADICIONAIS” (delegação) ========== */
  function addCommonItem(nome, preco){
    const found = cart.find(i=>i.nome===nome && i.preco===preco);
    if (found) found.qtd+=1; else cart.push({nome,preco,qtd:1});
    renderMiniCart(); popupAdd(`${nome} adicionado!`);
  }

  document.body.addEventListener("click", (e)=>{
    const add = e.target.closest(".add-cart");
    const extrasBtn = e.target.closest(".extras-btn");
    if (!add && !extrasBtn) return;

    safeClick();

    const card = (add||extrasBtn).closest(".card");
    if (!card) return;
    const nome  = card.dataset.name || card.querySelector("h3")?.firstChild?.textContent?.trim() || "Item";
    const preco = parseFloat(card.dataset.price || "0");

    if (add){
      if (/^combo/i.test(nome)) openComboModal(nome, preco);
      else addCommonItem(nome, preco);
    }
    if (extrasBtn) openExtrasFor(card);
  });
/* ========== CARROSSEL PROMO ========== */
  (()=> {
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

  /* ========== FIREBASE v8 + LOGIN ========== */
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

  /* Modal de Login (garantir estrutura) */
  let loginModal = document.getElementById("login-modal");
  if (!loginModal){
    loginModal = document.createElement("div");
    loginModal.id="login-modal"; loginModal.className="modal";
    loginModal.innerHTML = `
      <div class="modal-content login-box">
        <div class="modal-head"><h3>Entrar / Cadastrar</h3><button class="login-x" title="Fechar">✖</button></div>
        <div class="login-form">
          <input type="email" id="login-email" placeholder="E-mail" />
          <input type="password" id="login-senha" placeholder="Senha" />
        </div>
        <div class="modal-foot" style="margin-top:8px;">
          <button class="btn-primario" id="btn-email">Entrar</button>
        </div>
        <div class="divider" style="text-align:center;margin:8px 0;color:#999;">ou</div>
        <button class="btn-google" id="btn-google">Entrar com Google</button>
      </div>`;
    document.body.appendChild(loginModal);
  }
  function openLogin(){ loginModal.classList.add("show"); document.body.classList.add("no-scroll"); }
  function closeLogin(){ loginModal.classList.remove("show"); document.body.classList.remove("no-scroll"); }
  loginModal.addEventListener("click",(e)=>{ if(e.target===loginModal) closeLogin(); });
  loginModal.querySelector(".login-x")?.addEventListener("click", closeLogin);

  // Abrir pelo botão do header
  userBtn.addEventListener("click", ()=>{ safeClick(); openLogin(); });

  // Email/senha
  document.getElementById("btn-email")?.addEventListener("click", ()=>{
    const email = document.getElementById("login-email")?.value?.trim();
    const senha = document.getElementById("login-senha")?.value?.trim();
    if (!email || !senha) return alert("Preencha e-mail e senha.");
    auth.signInWithEmailAndPassword(email, senha)
      .then(cred=>{ setLoggedUser(cred.user); closeLogin(); })
      .catch(()=> auth.createUserWithEmailAndPassword(email, senha)
        .then(cred=>{ setLoggedUser(cred.user); closeLogin(); alert("Conta criada com sucesso! 🎉"); })
        .catch(err=>alert("Erro: "+err.message)));
  });

  // Google
  document.getElementById("btn-google")?.addEventListener("click", ()=>{
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(res=>{
      setLoggedUser(res.user); closeLogin();
    }).catch(err=>alert("Erro no login com Google: "+err.message));
  });

  function setLoggedUser(u){
    currentUser = u;
    userBtn.textContent = `Olá, ${u.displayName?.split(" ")[0] || u.email.split("@")[0]}`;
    showOrdersFabIfLogged();
  }

  let currentUser = null;
  auth.onAuthStateChanged(u=>{ if(u) setLoggedUser(u); });

  /* ========== FECHAR PEDIDO (Firestore + WhatsApp) ========== */
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
  document.body.addEventListener("click",(e)=>{
    if (e.target.id==="close-order") { safeClick(); fecharPedido(); }
    if (e.target.id==="clear-cart") { safeClick(); cart=[]; renderMiniCart(); updateCartCount(); }
  });

  /* ========== MEUS PEDIDOS ========= */
  let ordersFab = document.getElementById("orders-fab");
  if (!ordersFab){
    ordersFab = document.createElement("button");
    ordersFab.id="orders-fab"; ordersFab.innerHTML="📦 Meus Pedidos";
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
  function showOrdersFabIfLogged(){ if (currentUser) ordersFab.classList.add("show"); else ordersFab.classList.remove("show"); }
  document.querySelector(".orders-close")?.addEventListener("click",()=>ordersPanel.classList.remove("active"));
  ordersFab.addEventListener("click", ()=>{
    if (!currentUser) return alert("Faça login para ver seus pedidos.");
    ordersPanel.classList.add("active");
    carregarPedidosSeguro();
  });
  function carregarPedidosSeguro(){
    const container = document.getElementById("orders-content");
    container.innerHTML=`<p class="empty-orders">Carregando pedidos...</p>`;
    db.collection("Pedidos").where("usuario","==",currentUser.email).orderBy("data","desc").get()
      .then(snap=>{
        if (snap.empty){ container.innerHTML=`<p class="empty-orders">Nenhum pedido encontrado 😢</p>`; return; }
        container.innerHTML=""; snap.forEach(doc=>{
          const p=doc.data(); const itens = Array.isArray(p.itens)?p.itens.join(", "):(p.itens||"");
          const box=document.createElement("div"); box.className="order-item";
          box.innerHTML=`
            <h4>${new Date(p.data).toLocaleString("pt-BR")}</h4>
            <p><b>Itens:</b> ${itens}</p>
            <p><b>Total:</b> ${money(p.total)}</p>`;
          container.appendChild(box);
        });
      })
      .catch(err=>{ container.innerHTML=`<p class="empty-orders">Erro ao carregar pedidos: ${err.message}</p>`; });
  }

  console.log("✅ DFL v1.4.7 carregado");
});

/* ===== HOTFIX 1.4.8 (extras + marca DFL) ===== */
(function(){
  // 1) Forçar listeners explícitos nos botões "Adicionais"
  function bindExtrasButtons(){
    document.querySelectorAll(".extras-btn").forEach(btn=>{
      if (btn.dataset.boundExtras) return;
      btn.dataset.boundExtras = "1";
      btn.addEventListener("click", (e)=>{
        e.preventDefault(); e.stopPropagation();
        const card = btn.closest(".card"); if (!card) return;
        // Usa a mesma função já existente no arquivo
        if (typeof openExtrasFor === "function") openExtrasFor(card);
      });
    });
  }
  bindExtrasButtons();
  // Caso os cards sejam re-renderizados por qualquer motivo:
  const obs = new MutationObserver(bindExtrasButtons);
  obs.observe(document.body, {subtree:true, childList:true});

  // 2) Marca “DFL” sem mexer no HTML
  const title = document.querySelector(".header-info h1");
  if (title && !title.dataset.dflApplied){
    title.dataset.dflApplied = "1";
    title.textContent = "DFL";
    title.classList.add("brand-dfl");
    // Adiciona o subtítulo logo abaixo do H1
    if (!document.querySelector(".brand-sub")){
      const sub = document.createElement("div");
      sub.className = "brand-sub";
      sub.textContent = "Da Família Lanches";
      title.after(sub);
    }
  }

  // 3) Fechar modais ao clicar fora – garante em todos
  document.querySelectorAll(".modal").forEach(mod=>{
    if (mod.dataset.boundBackdrop) return;
    mod.dataset.boundBackdrop="1";
    mod.addEventListener("click", (e)=>{
      if (e.target === mod) {
        mod.classList.remove("show");
        document.body.classList.remove("no-scroll");
      }
    });
  });
})();