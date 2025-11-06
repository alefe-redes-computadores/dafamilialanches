/* =========================================================
   🚀 DFL v3.6.6 — Carrossel Corrigido + Lazy Load Firebase
   - Corrige o carrossel (botões ‹ / › e rolagem suave)
   - Mantém inicialização tardia (Lazy Load) do Firebase 8.x
   - Mantém som de clique e logs originais (console.log/err)
   - Compatível com HTML v3.6.5 fornecido (IDs/classes)
========================================================= */

/* ========================== BASE / ESTADO ========================== */
(function(){
  "use strict";

  // 🔊 Som de clique (mantido)
  const clickSound = (()=>{
    try { return new Audio("click.wav"); } catch(e){ console.error("Audio init fail", e); return null; }
  })();

  const playClick = () => { try { if(clickSound){ clickSound.currentTime = 0; clickSound.play(); } } catch(_){} };

  // Estado mínimo de app (cart, cupons)
  const state = {
    cart: [],
    coupon: null,
    couponMessage: "",
    orders: [],
    user: null,
    firebaseInit: false,
    carousel: { index: 0 }
  };

  // Mapa simples de cupons (mantido para compatibilidade local)
  const COUPONS = {
    "FAM10": { type:"percent", value:10 },     // 10%
    "FRETEGRATIS": { type:"shipping", value:8 }, // frete até R$8
    "VALE5": { type:"value", value:5 }         // R$5
  };

  // Utils
  const money = (n) => {
    const v = Number(n||0);
    return "R$ " + v.toFixed(2).replace(".", ",");
  };

  const safe = (fn) => (...a) => { try { return fn(...a); } catch(e) { console.error(e); } };

  /* ========================== CARROSSEL ========================== */
  function initCarousel(){
    const track = document.querySelector(".slides");
    const prev  = document.querySelector(".c-prev");
    const next  = document.querySelector(".c-next");

    if(!track || !prev || !next){
      console.warn("[DFL] Carousel: elementos não encontrados, aguardando DOM...");
      return;
    }

    // Distância de rolagem por clique (ajustado ao tamanho dos cards)
    const STEP = 300;

    const scrollByStep = (dir) => {
      playClick();
      track.scrollBy({ left: dir * STEP, behavior: "smooth" });
      console.log("[DFL] Carousel scroll:", dir > 0 ? "next" : "prev");
    };

    // Eventos dos botões
    prev.addEventListener("click", safe(()=> scrollByStep(-1)));
    next.addEventListener("click", safe(()=> scrollByStep(+1)));

    // Keyboard accessibility
    document.addEventListener("keydown", safe((e)=>{
      if(e.key === "ArrowLeft") scrollByStep(-1);
      if(e.key === "ArrowRight") scrollByStep(+1);
    }));

    // Clique no slide abre modal de promoção
    track.querySelectorAll(".slide").forEach((img)=>{
      img.addEventListener("click", safe(()=> openPromoFromImage(img)));
    });

    console.log("[DFL] Carousel inicializado.");
  }

  function openPromoFromImage(img){
    const modal = document.getElementById("promo-modal");
    const modalImg = document.getElementById("promo-modal-img");
    const title = document.getElementById("promo-modal-title");
    const price = document.getElementById("promo-modal-price");
    const addBtn = document.getElementById("promo-modal-add");
    const backdrop = ensureBackdrop();

    if(!modal || !modalImg || !title || !price || !addBtn) return;

    // Info básica
    modalImg.src = img.src;
    title.textContent = "Promoção " + (img.getAttribute("data-promo-id") || "");
    price.textContent = "Toque em 'Adicionar ao Pedido' para incluir no carrinho.";

    addBtn.onclick = safe(()=>{
      // Exemplo: adiciona um item genérico de promoção
      addToCart({ name: "Promoção DFL #" + (img.getAttribute("data-promo-id") || "?"), price: 9.99 });
      closeModal(modal);
      toast("Promoção adicionada ao pedido!");
    });

    // Navegação do modal (próx/ant)
    modal.querySelector(".promo-nav.prev")?.addEventListener("click", safe(()=> navigatePromo(-1)));
    modal.querySelector(".promo-nav.next")?.addEventListener("click", safe(()=> navigatePromo(1)));

    modal.classList.add("show");
    backdrop.classList.add("active");
  }

  function navigatePromo(delta){
    // Percorre a lista de slides na área do carrossel e abre outro item
    const slides = [...document.querySelectorAll(".slides .slide")];
    const modalImg = document.getElementById("promo-modal-img");
    if(!slides.length || !modalImg) return;
    let idx = slides.findIndex(s => s.src === modalImg.src);
    if(idx === -1) idx = 0;
    let next = idx + delta;
    if(next < 0) next = slides.length - 1;
    if(next >= slides.length) next = 0;
    openPromoFromImage(slides[next]);
  }

  /* ========================== BACKDROP / PAINÉIS ========================== */
  function ensureBackdrop(){
    const el = document.getElementById("cart-backdrop");
    if(!el){ console.warn("[DFL] Backdrop não encontrado (#cart-backdrop)."); }
    return el;
  }

  function openMiniCart(){
    const panel = document.getElementById("mini-cart");
    const backdrop = ensureBackdrop();
    panel?.classList.add("active");
    backdrop?.classList.add("active");
    panel?.setAttribute("aria-hidden","false");
  }

  function closeMiniCart(){
    const panel = document.getElementById("mini-cart");
    const backdrop = ensureBackdrop();
    panel?.classList.remove("active");
    panel?.setAttribute("aria-hidden","true");
    if(!document.querySelector(".modal.show") && !document.querySelector(".pedidos-panel.active") && !document.querySelector(".recompensas-panel.active")){
      backdrop?.classList.remove("active");
    }
  }

  function openPanel(id){
    const panel = document.getElementById(id);
    const backdrop = ensureBackdrop();
    panel?.classList.add("active");
    panel?.setAttribute("aria-hidden","false");
    backdrop?.classList.add("active");
  }

  function closePanel(id){
    const panel = document.getElementById(id);
    const backdrop = ensureBackdrop();
    panel?.classList.remove("active");
    panel?.setAttribute("aria-hidden","true");
    if(!document.querySelector(".modal.show") && !document.querySelector(".mini-cart.active") && !document.querySelector(".pedidos-panel.active") && !document.querySelector(".recompensas-panel.active")){
      backdrop?.classList.remove("active");
    }
  }

  function openModal(id){
    const modal = document.getElementById(id);
    const backdrop = ensureBackdrop();
    modal?.classList.add("show");
    modal?.setAttribute("aria-hidden","false");
    backdrop?.classList.add("active");
  }

  function closeModal(elOrId){
    const modal = typeof elOrId === "string" ? document.getElementById(elOrId) : elOrId;
    const backdrop = ensureBackdrop();
    modal?.classList.remove("show");
    modal?.setAttribute("aria-hidden","true");
    if(!document.querySelector(".modal.show") && !document.querySelector(".mini-cart.active") && !document.querySelector(".pedidos-panel.active") && !document.querySelector(".recompensas-panel.active")){
      backdrop?.classList.remove("active");
    }
  }

  /* ========================== CARRINHO ========================== */
  function addToCart(item, extras){
    const i = state.cart.findIndex(x => x.name === item.name);
    if(i >= 0){
      state.cart[i].qty += 1;
      if(extras?.length){ state.cart[i].extras = (state.cart[i].extras||[]).concat(extras); }
    } else {
      state.cart.push({ name:item.name, price:Number(item.price||0), qty:1, extras: extras||[] });
    }
    console.log("[DFL] addToCart:", item);
    playClick();
    renderCart();
    openMiniCart();
  }

  function removeFromCart(name){
    state.cart = state.cart.filter(x => x.name !== name);
    console.log("[DFL] removeFromCart:", name);
    renderCart();
  }

  function changeQty(name, delta){
    const i = state.cart.findIndex(x => x.name === name);
    if(i >= 0){
      state.cart[i].qty = Math.max(1, state.cart[i].qty + delta);
      console.log("[DFL] changeQty:", name, state.cart[i].qty);
      renderCart();
    }
  }

  function applyCoupon(code){
    const c = (code||"").trim().toUpperCase();
    if(!c){ state.coupon = null; state.couponMessage = ""; return; }
    if(COUPONS[c]){
      state.coupon = { code:c, ...COUPONS[c] };
      state.couponMessage = "Cupom aplicado: " + c;
    } else {
      state.coupon = null;
      state.couponMessage = "Cupom inválido.";
    }
  }

  function computeTotals(){
    const sub = state.cart.reduce((t,it)=> t + (it.price*it.qty), 0);
    let discount = 0;
    let shipping = 0;

    if(state.coupon){
      const c = state.coupon;
      if(c.type === "percent") discount = sub * (c.value/100);
      if(c.type === "value")   discount = c.value;
      if(c.type === "shipping") shipping = Math.max(0, 8 - c.value); // exemplo simples
    }

    const total = Math.max(0, sub - discount + shipping);
    return { sub, discount, shipping, total };
  }

  function renderCart(){
    const list = document.querySelector(".mini-list");
    const count = document.getElementById("cart-count");
    const msg = document.getElementById("coupon-message");
    const discRow = document.getElementById("coupon-discount-row");
    const discVal = document.getElementById("cart-discount");

    if(count) count.textContent = String(state.cart.reduce((t,it)=> t + it.qty, 0));

    if(list){
      list.innerHTML = "";
      if(!state.cart.length){
        list.innerHTML = `<p class="empty">Seu carrinho está vazio.</p>`;
      } else {
        state.cart.forEach(it=>{
          const row = document.createElement("div");
          row.className = "mini-row";
          row.style.cssText = "display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #eee;";
          row.innerHTML = `
            <div>
              <strong>${it.name}</strong>
              ${it.extras?.length ? `<div style="font-size:.85rem;color:#666;">Extras: ${it.extras.join(", ")}</div>` : ""}
              <div style="font-size:.9rem;color:#333;">${money(it.price)}</div>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <button class="qty-dec" aria-label="Diminuir">−</button>
              <span>${it.qty}</span>
              <button class="qty-inc" aria-label="Aumentar">+</button>
              <button class="remove" title="Remover" aria-label="Remover">✖</button>
            </div>
          `;
          row.querySelector(".qty-inc")?.addEventListener("click", safe(()=> changeQty(it.name, +1)));
          row.querySelector(".qty-dec")?.addEventListener("click", safe(()=> changeQty(it.name, -1)));
          row.querySelector(".remove")?.addEventListener("click", safe(()=> removeFromCart(it.name)));
          list.appendChild(row);
        });
      }
    }

    const totals = computeTotals();
    if(discRow && discVal){
      if(totals.discount > 0){
        discRow.style.display = "";
        discVal.textContent = money(totals.discount);
      } else {
        discRow.style.display = "none";
      }
    }
    if(msg){ msg.textContent = state.couponMessage || ""; }
  }

  /* ========================== MODAIS: EXTRAS / COMBO ========================== */
  function openExtrasFor(item){
    const modal = document.getElementById("extras-modal");
    const list = document.querySelector("#extras-modal .extras-list");
    if(!modal || !list) return;

    // Opções simples de exemplo
    const options = [
      {label:"Bacon", value:"Bacon"},
      {label:"Queijo extra", value:"Queijo extra"},
      {label:"Molho verde", value:"Molho verde"},
      {label:"Batata palha", value:"Batata palha"}
    ];
    list.innerHTML = options.map((o,i)=>`
      <label style="display:flex;align-items:center;gap:8px;margin:6px 0;">
        <input type="checkbox" value="${o.value}" id="extra_${i}"/> ${o.label}
      </label>
    `).join("");

    const confirm = document.getElementById("extras-confirm");
    confirm.onclick = safe(()=>{
      const picked = [...list.querySelectorAll("input:checked")].map(i=>i.value);
      addToCart(item, picked);
      closeModal("extras-modal");
      toast("Adicionais aplicados!");
    });

    openModal("extras-modal");
  }

  function openComboFor(item){
    const modal = document.getElementById("combo-modal");
    const body = document.getElementById("combo-body");
    if(!modal || !body) return;

    const options = ["Kuat 2L","Fanta 1L","Coca-Cola 1L","Coca-Cola 1L Zero"];
    body.innerHTML = options.map((op,idx)=>`
      <label style="display:flex;align-items:center;gap:8px;margin:6px 0;">
        <input type="radio" name="refri" value="${op}" ${idx===0?"checked":""}/> ${op}
      </label>
    `).join("");

    const confirm = document.getElementById("combo-confirm");
    confirm.onclick = safe(()=>{
      const chosen = body.querySelector("input[name='refri']:checked")?.value || options[0];
      addToCart({ name: item.name + " + " + chosen, price: item.price });
      closeModal("combo-modal");
      toast("Combo adicionado!");
    });

    openModal("combo-modal");
  }

  /* ========================== TOAST ========================== */
  let toastTimer = null;
  function toast(text){
    let el = document.getElementById("dfl-toast");
    if(!el){
      el = document.createElement("div");
      el.id = "dfl-toast";
      el.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:9999;background:#111;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.3);font-weight:700;";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.display = "block";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> el.style.display = "none", 2000);
  }

  /* ========================== STATUS DE ABERTURA ========================== */
  function refreshStatusBanner(){
    const el = document.getElementById("status-banner");
    if(!el) return;
    // Exemplo simples: Aberto das 18:00 às 23:30 — Ajuste conforme necessidade
    const now = new Date();
    const hour = now.getHours() + now.getMinutes()/60;
    const open = hour >= 18 && hour < 23.5;
    el.className = "status-banner " + (open ? "open" : "closed");
    el.textContent = open ? "🟢 Aberto agora" : "🔴 Fechado no momento";
  }

  function startClosingTimer(){
    const timerEl = document.getElementById("timer");
    if(!timerEl) return;
    function tick(){
      const now = new Date();
      const close = new Date(); close.setHours(23,30,0,0);
      let diff = Math.max(0, close - now);
      const h = Math.floor(diff/3_600_000);
      diff %= 3_600_000;
      const m = Math.floor(diff/60_000);
      timerEl.textContent = `${h}h ${m}min`;
      if(h===0 && m===0) refreshStatusBanner();
      requestAnimationFrame(()=> setTimeout(tick, 1000));
    }
    tick();
  }

  /* ========================== COOKIE BANNER ========================== */
  function initCookieBanner(){
    const banner = document.getElementById("cookie-banner");
    const btn = document.getElementById("cookie-accept");
    if(!banner || !btn) return;
    const KEY = "dfl_cookie_accept_v1";
    const ok = localStorage.getItem(KEY);
    if(!ok){ banner.classList.add("show"); }
    btn.addEventListener("click", safe(()=>{
      localStorage.setItem(KEY, "1");
      banner.classList.remove("show");
      playClick();
    }));
  }

  /* ========================== LOGIN / PAINÉIS ========================== */
  function initPanels(){
    // Mini-cart
    document.getElementById("cart-icon")?.addEventListener("click", safe(()=>{
      openMiniCart();
    }));
    document.querySelector(".extras-close")?.addEventListener("click", safe(()=> closeMiniCart()));

    // Pedidos
    document.querySelector(".meus-pedidos-btn")?.addEventListener("click", safe(()=>{
      openPanel("painelPedidos");
    }));
    document.querySelector(".fechar-pedidos")?.addEventListener("click", safe(()=>{
      closePanel("painelPedidos");
    }));

    // Recompensas
    document.querySelector(".recompensas-btn")?.addEventListener("click", safe(()=>{
      openPanel("recompensas-panel");
    }));
    document.querySelector(".fechar-recompensas")?.addEventListener("click", safe(()=>{
      closePanel("recompensas-panel");
    }));

    // Login modal
    document.getElementById("user-btn")?.addEventListener("click", safe(()=> openModal("login-modal")));
    document.querySelector(".login-close")?.addEventListener("click", safe(()=> closeModal("login-modal")));

    // Backdrop fecha tudo
    ensureBackdrop()?.addEventListener("click", safe(()=>{
      closeMiniCart();
      document.querySelectorAll(".modal.show").forEach(m => m.classList.remove("show"));
      document.querySelectorAll(".pedidos-panel.active").forEach(p => p.classList.remove("active"));
      document.querySelectorAll(".recompensas-panel.active").forEach(p => p.classList.remove("active"));
      ensureBackdrop()?.classList.remove("active");
    }));

    // ESC fecha
    document.addEventListener("keydown", safe((e)=>{
      if(e.key === "Escape"){
        closeMiniCart();
        document.querySelectorAll(".modal.show").forEach(m => m.classList.remove("show"));
        document.querySelectorAll(".pedidos-panel.active").forEach(p => p.classList.remove("active"));
        document.querySelectorAll(".recompensas-panel.active").forEach(p => p.classList.remove("active"));
        ensureBackdrop()?.classList.remove("active");
      }
    }));
  }

  /* ========================== CUPONS ========================== */
  function initCouponForm(){
    const form = document.getElementById("coupon-form");
    const input = document.getElementById("coupon-input");
    if(!form || !input) return;

    form.addEventListener("submit", safe((e)=>{
      e.preventDefault();
      applyCoupon(input.value);
      renderCart();
      playClick();
    }));
  }

  /* ========================== PRODUTOS (ADD / EXTRAS / COMBOS) ========================== */
  function initProductCards(){
    // Botões "Adicionar"
    document.querySelectorAll(".card .add-cart").forEach(btn => {
      btn.addEventListener("click", safe(()=>{
        const card = btn.closest(".card");
        if(!card) return;
        const item = {
          name: card.getAttribute("data-name") || "Item DFL",
          price: Number(card.getAttribute("data-price") || "0")
        };
        // Se for combo com refri, abrir modal do combo
        if(/combo/i.test(item.name)){
          openComboFor(item);
        } else {
          addToCart(item);
        }
      }));
    });

    // Botões "Adicionais"
    document.querySelectorAll(".card .extras-btn").forEach(btn => {
      btn.addEventListener("click", safe(()=>{
        const card = btn.closest(".card");
        if(!card) return;
        const item = {
          name: card.getAttribute("data-name") || "Item DFL",
          price: Number(card.getAttribute("data-price") || "0")
        };
        openExtrasFor(item);
      }));
    });
  }

  /* ========================== FIREBASE (LAZY) ========================== */
  function initFirebaseOnce(){
    if(state.firebaseInit) return;
    if(!window.firebase || !window.firebase.app){
      console.log("[DFL] Firebase ainda não disponível (scripts em lazy).");
      return; // scripts serão deferidos, re-tentaremos depois
    }
    try{
      // Se já existir, não duplicar
      const hasApp = firebase.apps && firebase.apps.length;
      if(!hasApp){
        // ⚠️ Se você usa config via ENV, injete aqui:
        // const firebaseConfig = { ... };
        // firebase.initializeApp(firebaseConfig);
        console.log("[DFL] Firebase pronto (aguardando config externa).");
      } else {
        console.log("[DFL] Firebase app já presente.");
      }
      state.firebaseInit = true;
    }catch(e){
      console.error("[DFL] Erro ao iniciar Firebase:", e);
    }
  }

  // Observa a disponibilidade do Firebase depois do load
  function watchFirebaseReady(){
    let tries = 0;
    const t = setInterval(()=>{
      tries++;
      if(window.firebase && window.firebase.app){
        initFirebaseOnce();
        clearInterval(t);
      }
      if(tries > 60){ clearInterval(t); }
    }, 500);
  }

  /* ========================== INICIALIZAÇÃO GERAL ========================== */
  document.addEventListener("DOMContentLoaded", safe(()=>{
    console.log("== DFL v3.6.6 — DOM pronto ==");
    // Clique global com som suave
    document.addEventListener("click", safe(()=> playClick()));

    initCarousel();          // 🔧 Corrigido aqui
    initPanels();
    initCouponForm();
    initProductCards();
    initCookieBanner();
    refreshStatusBanner();
    startClosingTimer();

    // Checa Firebase em lazy
    watchFirebaseReady();
  }));

})();