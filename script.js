/* =========================================================
   🚀 DFL v3.9.1 — BASE SEGURA (CLICKS + FRETE ATIVO + FIREBASE)
   - Corrige cliques e modais invisíveis (delegação + touch fix).
   - Mantém carrinho, cupons, recompensas, promos e combos.
   - Frete REAL por bairro/CEP (ViaCEP + Firestore frete_zonas).
   - Firebase v8 (global window.firebase), lazy init.
   - Relatórios: gatilho básico preservado (painel abre).
========================================================= */

/* ------------------ ⚙️ FEATURE FLAGS ------------------ */
window.DFL_FLAGS = Object.assign({}, window.DFL_FLAGS || {}, {
  freightEnabled: true,      // Frete REAL por Firestore
  freightDebug:   true,      // Logs de frete/relatórios
  reportsEnabled: true,      // Mantém botão de relatórios (admin)
});

/* ------------------ 📝 LOGGER ------------------ */
const LOG = {
  info:   (...a) => (window.DFL_FLAGS?.freightDebug ? console.log("[DFL]", ...a) : void 0),
  warn:   (...a) => console.warn("[DFL/WARN]", ...a),
  error:  (...a) => console.error("[DFL/ERR]", ...a),
  hist:   (...a) => (window.DFL_FLAGS?.freightDebug ? console.log("[DFL/HIST]", ...a) : void 0),
  charts: (...a) => (window.DFL_FLAGS?.freightDebug ? console.log("[DFL/CHARTS]", ...a) : void 0),
  admin:  (...a) => (window.DFL_FLAGS?.freightDebug ? console.log("[DFL/ADMIN]", ...a) : void 0),
};

/* ------------------ 🔄 CHART.JS (on-demand) ------------------ */
function loadChartJS(cb) {
  if (window.Chart) { cb?.(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
  s.onload = () => { LOG.charts("Chart.js carregado"); cb?.(); };
  document.head.appendChild(s);
}

/* ------------------ 🛠️ HELPERS ------------------ */
const safe = (fn) => (...a) => { try { return fn(...a); } catch (e) { console.error(e); } };
const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;

/* ------------------ 🔗 ELEMENTS (ligação preguiçosa) ------------------ */
const el = new Proxy({}, {
  get: (_, k) => document.getElementById(k) || document.querySelector(`.${k}`) || null
});

/* ------------------ 🌫️ BACKDROP + OVERLAYS ------------------ */
(function ensureBackdrop(){
  if (!document.getElementById("cart-backdrop")) {
    const bd = document.createElement("div");
    bd.id = "cart-backdrop";
    document.body.appendChild(bd);
  }
})();
const Backdrop = {
  show(){ const b = document.getElementById("cart-backdrop"); b?.classList.add("active"); document.body.classList.add("no-scroll"); },
  hide(){ const b = document.getElementById("cart-backdrop"); b?.classList.remove("active"); document.body.classList.remove("no-scroll"); }
};
const Overlays = {
  closeAll(){
    document
      .querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, .reports-panel.active, .frete-admin-panel.active")
      .forEach((e) => { e.classList.remove("show","active"); e.setAttribute("aria-hidden","true"); });
    Backdrop.hide();
  },
  open(node){
    Overlays.closeAll();
    if (!node) return;
    const useActive = ["mini-cart","painelPedidos","recompensas-panel","reports-panel","frete-admin-panel"].includes(node.id);
    node.classList.add(useActive ? "active" : "show");
    node.setAttribute("aria-hidden","false");
    Backdrop.show();
  }
};
document.getElementById("cart-backdrop")?.addEventListener("click", Overlays.closeAll);

/* ------------------ 📦 ESTADO BASE ------------------ */
let cart = [];
let currentUser = null;
let isFirebaseInitialized = false;
let auth = null, db = null;

let addressValue = (localStorage.getItem("dflAddress") || "").trim();
let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();

/* ------------------ 🔔 SOM (apenas na finalização) ------------------ */
const finishSound = new Audio("click.wav");
function playFinishSound(){ try { finishSound.currentTime = 0; finishSound.play(); } catch(_){} }

/* ------------------ 🔖 PROMO DATA (carrossel) ------------------ */
const PROMO_DATA = [
  null,
  { id:1, nome:"Combo 2 Purizin + Fanta 1L", preco:34.99, precoAntigo:40.00, img:"promocoes/promo1.jpg" },
  { id:2, nome:"Combo 3 Padaná",             preco:37.99, precoAntigo:45.00, img:"promocoes/promo2.jpg" },
  { id:3, nome:"Combo 2 Peleja",             preco:39.99, precoAntigo:52.00, img:"promocoes/promo3.jpg" },
  { id:4, nome:"Combo 3 Trem + Fanta 1L",    preco:44.99, precoAntigo:52.00, img:"promocoes/promo4.jpg" },
  { id:5, nome:"Combo 4 Trem + Fanta 1L",    preco:49.99, precoAntigo:65.00, img:"promocoes/promo5.jpg" },
  { id:6, nome:"Combo 5 Uai",                preco:54.99, precoAntigo:65.00, img:"promocoes/promo6.jpg" },
  { id:7, nome:"Combo 4 TremBão + Fanta 1L", preco:59.99, precoAntigo:77.00, img:"promocoes/promo7.jpg" },
  { id:8, nome:"Combo 4 Armaria",            preco:59.99, precoAntigo:72.00, img:"promocoes/promo8.jpg" },
  { id:9, nome:"Combo 5 Uai + Kuat 2L",      preco:64.99, precoAntigo:79.99, img:"promocoes/promo9.jpg" },
];

/* ------------------ 🔐 FIREBASE (v8 global) ------------------ */
const firebaseConfig = {
  apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
  authDomain: "da-familia-lanches.firebaseapp.com",
  projectId: "da-familia-lanches",
  storageBucket: "da-familia-lanches.appspot.com",
  messagingSenderId: "106857147317",
  appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
};
function inicializarFirebase(){
  if (isFirebaseInitialized) return;
  if (!window.firebase) { LOG.error("Firebase base não carregada"); return; }
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db   = firebase.firestore();
  window.db = db; // expõe p/ módulos
  isFirebaseInitialized = true;
  setupAuthListener();
  if (window.DFL_Frete) window.DFL_Frete.init();
  LOG.info("Firebase inicializado");
}

/* ------------------ 👤 AUTH + UI ADMIN ------------------ */
const ADMINS = [
  "alefejohsefe@gmail.com",
  "kalebhstanley650@gmail.com",
  "contato@dafamilialanches.com.br"
];
const isAdmin = (u) => !!(u?.email && ADMINS.includes(u.email.toLowerCase()));

function setupAuthListener(){
  auth.onAuthStateChanged((user) => {
    currentUser = user || null;
    const userBtn = document.getElementById("user-btn");
    if (userBtn) userBtn.textContent = user ? `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}` : "Entrar / Cadastrar";

    // Pedidos/Recompensas visíveis somente com login (mantido)
    const pedidosWrap = document.querySelector(".minhas-recompensas")?.parentElement || null;
    const pedidosContainer = document.querySelector(".meus-pedidos");
    if (pedidosContainer) pedidosContainer.style.display = user ? "block" : "none";
    const recompensasContainer = document.querySelector(".minhas-recompensas");
    if (recompensasContainer) recompensasContainer.style.display = user ? "block" : "none";

    // Botões Admin
    const reportsBtn = document.getElementById("reports-btn");
    const freteAdminBtn = document.getElementById("frete-admin-btn");

    if (user && isAdmin(user)) {
      if (reportsBtn) {
        reportsBtn.style.display = "inline-block";
        reportsBtn.onclick = () => window.DFL_ReportsCore?.initPanel?.();
      }
      if (freteAdminBtn) {
        freteAdminBtn.style.display = "inline-block";
        freteAdminBtn.onclick = () => window.DFL_FreteAdmin?.open?.();
      }
    } else {
      if (reportsBtn) reportsBtn.style.display = "none";
      if (freteAdminBtn) freteAdminBtn.style.display = "none";
    }
  });
}

/* ------------------ 💬 POPUPS ------------------ */
function popupAdd(msg) {
  let pop = document.querySelector(".popup-add");
  if (!pop) { pop = document.createElement("div"); pop.className = "popup-add"; document.body.appendChild(pop); }
  pop.textContent = msg;
  pop.classList.add("show");
  setTimeout(() => pop.classList.remove("show"), 2000);
}
function mostrarPopupRecompensa(msg) {
  let pop = document.getElementById("conquista-popup");
  if (!pop) {
    pop = document.createElement("div");
    pop.id = "conquista-popup";
    pop.style.cssText = `
      position:fixed; bottom:120px; left:50%; transform:translateX(-50%) scale(0);
      background:#4CAF50; color:#fff; padding:15px 25px; border-radius:12px;
      font-weight:bold; text-align:center; box-shadow:0 4px 15px rgba(0,0,0,.3);
      z-index:10001; opacity:0; transition:transform .4s cubic-bezier(.175,.885,.32,1.275),opacity .4s;
    `;
    document.body.appendChild(pop);
  }
  pop.textContent = msg;
  pop.style.opacity = '1';
  pop.style.transform = 'translateX(-50%) scale(1)';
  setTimeout(() => { pop.style.transform = 'translateX(-50%) scale(0)'; pop.style.opacity = '0'; }, 4000);
}

/* ------------------ 🛒 CARRINHO ------------------ */
function getCartSubtotal(){ return cart.reduce((t,i)=> t + (i.preco * i.qtd), 0); }

function bindMiniCartButtons(){
  const miniList = document.querySelector(".mini-list");
  if (!miniList) return;
  miniList.querySelectorAll(".cart-plus").forEach(b => b.addEventListener("click", (e)=>{
    const i = +e.currentTarget.dataset.idx; if (cart[i]) cart[i].qtd++; renderMiniCart();
  }));
  miniList.querySelectorAll(".cart-minus").forEach(b => b.addEventListener("click", (e)=>{
    const i = +e.currentTarget.dataset.idx; if (!cart[i]) return; if (cart[i].qtd>1) cart[i].qtd--; else cart.splice(i,1); renderMiniCart();
  }));
  miniList.querySelectorAll(".cart-remove").forEach(b => b.addEventListener("click", (e)=>{
    const i = +e.currentTarget.dataset.idx; cart.splice(i,1); renderMiniCart(); popupAdd("Item removido!");
  }));
}

function renderMiniCart(){
  const miniList = document.querySelector(".mini-list");
  const cartCount = document.getElementById("cart-count");
  const miniFoot  = document.querySelector(".mini-foot");
  if (!miniList) return;

  const totalItens = cart.reduce((s,i)=> s+i.qtd, 0);
  if (cartCount) cartCount.textContent = totalItens;

  if (!cart.length){
    miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';
    // limpar frete/cupons
    if (miniFoot) miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());
    const couponMsg = document.getElementById("coupon-message");
    const couponDiscountRow = document.getElementById("coupon-discount-row");
    if (couponMsg) couponMsg.innerHTML = "";
    if (couponDiscountRow) couponDiscountRow.style.display = "none";
    if (window.DFL_Frete) window.DFL_Frete.resetFrete();
    window.updateCartTotals(); // zera totais
    return;
  }

  miniList.innerHTML = cart.map((item, idx)=>`
    <div class="cart-item" style="border-bottom:1px solid #eee;padding:10px 0;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="flex:1;">
          <p style="font-weight:600;margin-bottom:4px;">${item.nome}</p>
          <p style="color:#666;font-size:.85rem;">${money(item.preco)} × ${item.qtd}</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button type="button" class="cart-minus" data-idx="${idx}" style="background:#ff4081;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">−</button>
          <span style="font-weight:600;min-width:20px;text-align:center;">${item.qtd}</span>
          <button type="button" class="cart-plus" data-idx="${idx}" style="background:#4caf50;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">+</button>
          <button type="button" class="cart-remove" data-idx="${idx}" style="background:#d32f2f;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">🗑</button>
        </div>
      </div>
    </div>
  `).join("");

  bindMiniCartButtons();
  window.updateCartTotals();
}

/* ------------------ 🧾 CUPOM ------------------ */
document.getElementById("coupon-form")?.addEventListener("submit", (e)=>{
  e.preventDefault();
  const input = document.getElementById("coupon-input");
  const val = (input?.value || "").trim().toUpperCase();
  if (!val){
    couponApplied = "";
    localStorage.removeItem("dflCoupon");
    popupAdd("Cupom removido.");
    renderMiniCart();
    return;
  }
  couponApplied = val;
  localStorage.setItem("dflCoupon", couponApplied);
  renderMiniCart();
});

/* ------------------ ➕ ADICIONAIS + COMBOS ------------------ */
const adicionais = [
  { nome: "Cebola", preco: 0.99 }, { nome: "Salada", preco: 1.99 }, { nome: "Ovo", preco: 1.99 },
  { nome: "Bacon", preco: 2.99 }, { nome: "Hambúrguer Tradicional 56g", preco: 2.99 },
  { nome: "Cheddar Cremoso", preco: 3.99 }, { nome: "Filé de Frango", preco: 5.99 },
  { nome: "Hambúrguer Artesanal 120g", preco: 7.99 },
];
let produtoExtras = null; let produtoPrecoBase = 0;

function openExtrasFor(card){
  const modal = document.getElementById("extras-modal");
  const list  = document.querySelector("#extras-modal .extras-list");
  if (!card || !modal || !list) return;
  produtoExtras = card.dataset.name;
  produtoPrecoBase = parseFloat(card.dataset.price) || 0;
  list.innerHTML = adicionais.map((a,i)=>`
    <label class="extra-line" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #ffb300;border-radius:8px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.08);cursor:pointer;transition:all .2s;font-size:1rem;">
      <span style="font-weight:600;color:#222;">${a.nome} — <b style="color:#d32f2f;">${money(a.preco)}</b></span>
      <input type="checkbox" value="${i}" style="margin-left:10px;">
    </label>
  `).join("");
  Overlays.open(modal);
}
document.getElementById("extras-confirm")?.addEventListener("click", ()=>{
  const checks = [...document.querySelectorAll("#extras-modal .extras-list input:checked")];
  const cont = {};
  checks.forEach(c=>{
    const a = adicionais[+c.value];
    cont[a.nome] ? cont[a.nome].qtd++ : cont[a.nome] = { preco:a.preco, qtd:1 };
  });
  const extrasNomes = Object.keys(cont).map(n=> cont[n].qtd>1 ? `${cont[n].qtd}x ${n}` : n).join(", ");
  const precoExtras = Object.values(cont).reduce((t,e)=> t + (e.preco*e.qtd), 0);
  const precoTotal = produtoPrecoBase + precoExtras;
  const nomeFinal = extrasNomes ? `${produtoExtras} + ${extrasNomes}` : produtoExtras;
  const found = cart.find(i=> i.nome === nomeFinal);
  if (found) found.qtd++; else cart.push({ nome:nomeFinal, preco:precoTotal, qtd:1 });
  popupAdd("Adicionado ao carrinho!");
  renderMiniCart();
  Overlays.closeAll();
});
document.querySelectorAll("#extras-modal .extras-close").forEach(b => b.addEventListener("click", Overlays.closeAll));

const comboDrinkOptions = {
  casal:   [ { rotulo:"Fanta 1L (padrão)", delta:0.01 }, { rotulo:"Coca-Cola 1L", delta:3.0 }, { rotulo:"Coca-Cola 1L Zero", delta:3.0 } ],
  familia: [ { rotulo:"Kuat Guaraná 2L (padrão)", delta:0.01 }, { rotulo:"Coca-Cola 2L", delta:5.0 } ],
};
let _comboCtx = null;
function openComboModal(nomeCombo, precoBase){
  const modal = document.getElementById("combo-modal");
  const body  = document.getElementById("combo-body");
  if (!modal || !body){ addCommonItem(nomeCombo, precoBase); return; }
  const low = (nomeCombo || "").toLowerCase();
  const grupo = low.includes("casal") ? "casal" : (low.includes("família") || low.includes("familia")) ? "familia" : null;
  if (!grupo){ addCommonItem(nomeCombo, precoBase); return; }
  const opts = comboDrinkOptions[grupo];
  body.innerHTML = opts.map((o,i)=>`
    <label class="combo-option-line" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #ffb300;border-radius:8px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.08);cursor:pointer;transition:all .2s;">
      <span style="font-weight:600;color:#222;">${o.rotulo}</span>
      <span style="font-weight:700;color:#d32f2f;">+ ${money(o.delta)}</span>
      <input type="radio" name="combo-drink" value="${i}" ${i===0?"checked":""} style="margin-left:10px;">
    </label>
  `).join("");
  _comboCtx = { nomeCombo, precoBase, grupo };
  Overlays.open(modal);
}
document.getElementById("combo-confirm")?.addEventListener("click", ()=>{
  if (!_comboCtx) return Overlays.closeAll();
  const sel = document.querySelector('#combo-modal input[name="combo-drink"]:checked');
  if (!sel) return;
  const opt = comboDrinkOptions[_comboCtx.grupo][+sel.value];
  const finalName  = `${_comboCtx.nomeCombo} + ${opt.rotulo}`;
  const finalPrice = Number(_comboCtx.precoBase) + (opt.delta || 0);
  const ex = cart.find(i=> i.nome === finalName);
  if (ex) ex.qtd++; else cart.push({ nome:finalName, preco:finalPrice, qtd:1 });
  popupAdd("Combo adicionado!");
  renderMiniCart();
  Overlays.closeAll();
});
document.querySelectorAll("#combo-modal .combo-close").forEach(b => b.addEventListener("click", Overlays.closeAll));

/* ------------------ ➕ ADD ITEM (cards & promos) ------------------ */
function addCommonItem(nome, preco){
  const ex = cart.find(i=> i.nome === nome);
  if (ex) ex.qtd++; else cart.push({ nome, preco, qtd:1 });
  popupAdd(`${nome} adicionado!`);
  renderMiniCart();
}
document.body.addEventListener("click", (e)=>{
  const btn = e.target.closest(".add-cart");
  if (btn){
    const card = btn.closest(".card");
    if (!card) return;
    const nome = card.dataset.name;
    const preco = parseFloat(card.dataset.price);
    // combos do cardápio principal (não “Promo X”)
    if (/^combo/i.test(nome) && !/^\s*Combo [0-9]/i.test(nome)) { openComboModal(nome, preco); return; }
    addCommonItem(nome, preco);
  }
  const btnExtras = e.target.closest(".extras-btn");
  if (btnExtras){
    const card = btnExtras.closest(".card");
    openExtrasFor(card);
  }
});

/* ------------------ 🪟 MINI-CART + USER + LOGIN ------------------ */
document.getElementById("cart-icon")?.addEventListener("click", ()=>{
  if (!currentUser) inicializarFirebase();
  renderMiniCart();
  Overlays.open(document.getElementById("mini-cart"));
});
document.getElementById("user-btn")?.addEventListener("click", ()=>{
  inicializarFirebase();
  Overlays.open(document.getElementById("login-modal"));
});
document.getElementById("login-form")?.addEventListener("submit", (e)=>{
  e.preventDefault();
  inicializarFirebase(); if (!isFirebaseInitialized) return alert("Erro ao conectar ao serviço de login.");
  const email = document.getElementById("login-email")?.value?.trim();
  const senha = document.getElementById("login-senha")?.value?.trim();
  if (!email || !senha) return alert("Preencha e-mail e senha.");
  auth.signInWithEmailAndPassword(email, senha)
    .then((cred)=>{ currentUser = cred.user; popupAdd("Login realizado com sucesso!"); Overlays.closeAll(); })
    .catch((err)=>{
      if (err.code==="auth/user-not-found"){
        if (confirm("Conta não encontrada. Deseja criar uma nova?")){
          auth.createUserWithEmailAndPassword(email, senha)
              .then((cred)=>{ currentUser = cred.user; popupAdd("Conta criada!"); Overlays.closeAll(); })
              .catch((e)=> alert("Erro: "+e.message));
        }
      } else if (err.code==="auth/wrong-password"){ alert("Senha incorreta. Tente novamente."); }
      else { alert("Erro: "+err.message); }
    });
});
document.getElementById("google-login")?.addEventListener("click", ()=>{
  inicializarFirebase(); if (!isFirebaseInitialized) return alert("Erro ao conectar ao serviço de login.");
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((res)=>{ currentUser = res.user; popupAdd("Login realizado com sucesso!"); Overlays.closeAll(); })
    .catch((err)=> alert("Erro: "+err.message));
});

/* ------------------ 🧮 CUPOM + TOTAIS ------------------ */
let _cupomCache = {};
async function validarCupomFirestore(codigo, subtotal){
  const code = (codigo || "").toUpperCase();
  const respInval = { valido:false, discount:0, freeShipping:false, label:"", mensagem:"" };
  if (!code) return respInval;

  const faixa = Math.floor((subtotal||0)/5);
  const key = `${code}::${faixa}`;
  const hit = _cupomCache[key]; const now = Date.now();
  if (hit && hit.exp > now) return hit.val;

  try{
    if (!db) return respInval;
    const doc = await db.collection("Cupons").doc(code).get();
    if (!doc.exists) return { ...respInval, mensagem:"Cupom não encontrado." };
    const d = doc.data() || {};
    if (d.ativo === false) return { ...respInval, mensagem:"Cupom inativo." };
    // Regras simples: tipo percent/valor, minSubtotal, frete gratis
    let discount = 0; let label = "";
    if (d.minSubtotal && subtotal < d.minSubtotal) return { ...respInval, mensagem:`Válido a partir de ${money(d.minSubtotal)}.` };
    if (d.tipo === "percent") { discount = Math.min(subtotal, subtotal * (Number(d.valor||0)/100)); label = `${d.valor}% OFF`; }
    else if (d.tipo === "valor") { discount = Math.min(subtotal, Number(d.valor||0)); label = `-${money(d.valor)}`; }
    const out = { valido:true, discount, freeShipping: !!d.freteGratis, label, mensagem:"Cupom aplicado!" };
    _cupomCache[key] = { exp: now + 60_000, val: out };
    return out;
  } catch(e){ LOG.error("validarCupomFirestore", e); return respInval; }
}

async function calcTotals(){
  const subtotal = getCartSubtotal();
  const cupomInfo = await validarCupomFirestore(couponApplied, subtotal);
  let delivery = window.DFL_Frete?.getFreteValor?.() || 0;
  if (cupomInfo.freeShipping) delivery = 0;
  const total = Math.max(0, subtotal + delivery - (cupomInfo.discount||0));
  return { subtotal, delivery, discount: cupomInfo.discount||0, total, cupomInfo };
}

window.updateCartTotals = async function(){
  const subtotalDisplay = document.getElementById("subtotal-display");
  const totalDisplay    = document.getElementById("total-display");
  const freteLine       = document.getElementById("frete-display-line");
  const freteVal        = document.getElementById("frete-valor-display");
  const couponMsg       = document.getElementById("coupon-message");
  const discountRow     = document.getElementById("coupon-discount-row");
  const cartDiscount    = document.getElementById("cart-discount");

  if (!cart.length){
    if (subtotalDisplay) subtotalDisplay.textContent = money(0);
    if (totalDisplay)    totalDisplay.textContent    = money(0);
    if (freteLine) freteLine.style.display = "none";
    if (couponMsg) couponMsg.innerHTML = "";
    if (discountRow) discountRow.style.display = "none";
    return;
  }

  const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();

  if (couponMsg){
    couponMsg.textContent = cupomInfo.mensagem || "";
    couponMsg.className = `coupon-message ${cupomInfo.valido ? "success":"error"}`;
    if (!cupomInfo.valido && couponApplied){
      couponApplied = ""; localStorage.removeItem("dflCoupon");
      const ci = document.getElementById("coupon-input");
      if (ci && document.activeElement !== ci) ci.value = "";
    }
  }
  if (discountRow && cartDiscount){
    if (discount > 0 || cupomInfo.label){
      cartDiscount.textContent = `- ${money(discount)} ${couponApplied ? `(${couponApplied})` : ""}`;
      discountRow.style.display = "flex";
    } else discountRow.style.display = "none";
  }
  if (subtotalDisplay) subtotalDisplay.textContent = money(subtotal);
  if (freteLine && freteVal){
    if (delivery > 0){ freteVal.textContent = money(delivery); freteLine.style.display = "flex"; }
    else freteLine.style.display = "none";
  }
  if (totalDisplay) totalDisplay.textContent = money(total);

  const addressInput = document.getElementById("address-input");
  if (addressInput){
    if (addressInput.value !== addressValue) addressInput.value = addressValue;
    addressInput.oninput = (e)=>{ addressValue = (e.target.value||"").trim(); localStorage.setItem("dflAddress", addressValue); };
  }

  document.getElementById("finish-order")?.addEventListener("click", fecharPedido);
  document.getElementById("clear-cart")?.addEventListener("click", ()=>{
    if (!confirm("Limpar todo o carrinho?")) return;
    cart = []; couponApplied = ""; localStorage.removeItem("dflCoupon");
    const ci = document.getElementById("coupon-input"); if (ci) ci.value = "";
    renderMiniCart(); popupAdd("Carrinho limpo!");
  });
};

/* ------------------ 📣 PROMOS + CARROSSEL ------------------ */
let currentPromoId = 1;
function showPromoModal(id){
  const promo = PROMO_DATA[Number(id)] || null;
  if (!promo) return;
  currentPromoId = Number(id);
  const img = document.getElementById("promo-modal-img");
  const ttl = document.getElementById("promo-modal-title");
  const p   = document.getElementById("promo-modal-price");
  if (img) img.src = promo.img;
  if (ttl) ttl.textContent = promo.nome;
  if (p)   p.innerHTML = `<span class="old-price">De ${money(promo.precoAntigo)}</span> por <b>${money(promo.preco)}</b>`;
  Overlays.open(document.getElementById("promo-modal"));
}
document.querySelectorAll(".slide[data-promo-id]").forEach((img)=>{
  img.addEventListener("click", ()=> showPromoModal(img.dataset.promoId));
});
document.getElementById("promo-modal-add")?.addEventListener("click", ()=>{
  const promo = PROMO_DATA[currentPromoId]; if (!promo) return;
  addCommonItem(promo.nome, promo.preco);
  Overlays.closeAll();
});
document.querySelector("#promo-modal .promo-nav.prev")?.addEventListener("click", ()=>{
  let n = currentPromoId - 1; if (n < 1) n = 9; showPromoModal(n);
});
document.querySelector("#promo-modal .promo-nav.next")?.addEventListener("click", ()=>{
  let n = currentPromoId + 1; if (n > 9) n = 1; showPromoModal(n);
});
document.querySelector("#promo-modal .promo-close")?.addEventListener("click", Overlays.closeAll);
document.querySelector(".c-prev")?.addEventListener("click", ()=>{
  const slides = document.querySelector(".slides"); if (!slides) return;
  slides.scrollLeft -= Math.min(slides.clientWidth * 0.9, 320);
});
document.querySelector(".c-next")?.addEventListener("click", ()=>{
  const slides = document.querySelector(".slides"); if (!slides) return;
  slides.scrollLeft += Math.min(slides.clientWidth * 0.9, 320);
});

/* ------------------ 🕒 STATUS + TIMERS ------------------ */
const atualizarStatus = safe(()=>{
  const now = new Date(); const h = now.getHours(); const m = now.getMinutes();
  const aberto = h >= 18 && h < 23;
  const statusBanner = document.getElementById("status-banner");
  const hoursBanner  = document.querySelector(".hours-banner");
  if (statusBanner){
    statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!";
    statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`;
  }
  if (!hoursBanner) return;
  const elMsg   = hoursBanner.querySelector("#hours-message");
  const elTimer = hoursBanner.querySelector("#timer");
  if (!elMsg || !elTimer) return;
  if (aberto){
    const fim = new Date(now); fim.setHours(23,30,0,0);
    let diff = (fim - now)/1000; if (diff<0) diff = 0;
    const H = Math.floor(diff/3600), M = Math.floor((diff%3600)/60);
    elMsg.innerHTML = `⏰ Hoje atendemos até <b>23h30</b> — Faltam`;
    elTimer.textContent = `${H}h ${M}min`;
  } else {
    const ini = new Date(now);
    if (h >= 23 || (h===23 && m>=30)) ini.setDate(ini.getDate()+1);
    ini.setHours(18,0,0,0);
    let diff = (ini - now)/1000; if (diff < 0) diff = 0;
    const H = Math.floor(diff/3600), M = Math.floor((diff%3600)/60);
    elMsg.innerHTML = `🔒 Fechado — Abrimos em`;
    elTimer.textContent = `${H}h ${M}min`;
  }
});
setInterval(atualizarStatus, 60_000); atualizarStatus();

const atualizarTimer = safe(()=>{
  const now = new Date(); const end = new Date(); end.setHours(23,59,59,999);
  const diff = end - now; const elTimer = document.getElementById("promo-timer"); if (!elTimer) return;
  if (diff <= 0) { elTimer.textContent = "00:00:00"; return; }
  const h = String(Math.floor(diff/3600000)).padStart(2,"0");
  const m = String(Math.floor((diff%3600000)/60000)).padStart(2,"0");
  const s = String(Math.floor((diff%60000)/1000)).padStart(2,"0");
  elTimer.textContent = `${h}:${m}:${s}`;
});
setInterval(atualizarTimer, 1000); atualizarTimer();

/* =========================================================
   🚚 FRETE REAL (ViaCEP + Firestore frete_zonas)
========================================================= */
window.DFL_Frete = (function(){
  let freteDestino = ""; let freteValor = 0.00; let freteZona = null;
  const cfg = { enabled: !!window.DFL_FLAGS.freightEnabled, col: "frete_zonas" };

  async function fetchBairroFromCEP(cep){
    const raw = String(cep||"").replace(/\D/g,""); if (raw.length !== 8) return null;
    try{
      const r = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const d = await r.json(); if (d?.erro) return null;
      return (d.bairro || "").trim();
    }catch(e){ LOG.warn("ViaCEP falhou", e); return null; }
  }

  async function lookupFreight(bairro){
    if (!db) return { valor:-1, zona:null };
    try{
      const snap = await db.collection(cfg.col).get();
      const alvo = String(bairro||"").toLowerCase();
      let found = null;
      snap.forEach(doc=>{
        const data = doc.data() || {};
        if (data.ativo === false) return;
        const lista = Array.isArray(data.bairros) ? data.bairros.map(b=> String(b).toLowerCase().trim()) : [];
        if (lista.includes(alvo)) found = { valor: Number(data.valor)||0, zona: data.nome||doc.id };
      });
      return found || { valor:-1, zona:null };
    }catch(e){ LOG.error("lookupFreight", e); return { valor:-1, zona:null }; }
  }

  async function calculateFreight(term){
    const msg = document.getElementById("frete-status-msg");
    const t = (term||"").trim();
    if (msg) msg.style.display = "none";
    if (!cfg.enabled){
      freteValor = 0; freteDestino=""; freteZona=null; window.updateCartTotals(); return;
    }
    if (!t){
      if (msg){ msg.textContent = "Digite o CEP ou Bairro para calcular."; msg.style.color="#dc3545"; msg.style.display="block"; }
      resetFrete(); return;
    }
    freteValor = 0; freteDestino = t; freteZona = null; window.updateCartTotals();

    let bairro = t; let isCEP = /^\d{8}$/.test(t);
    if (isCEP){
      if (msg){ msg.textContent = "Buscando bairro via CEP..."; msg.style.color="#ffb300"; msg.style.display="block"; }
      const via = await fetchBairroFromCEP(t);
      if (!via){ if (msg){ msg.textContent = "CEP inválido ou não encontrado. Tente pelo bairro."; msg.style.color="#dc3545"; } return; }
      bairro = via;
    }

    const res = await lookupFreight(bairro);
    if (res.valor >= 0){
      freteValor = Number(res.valor.toFixed(2)); freteZona = res.zona; freteDestino = isCEP ? t : bairro;
      window.updateCartTotals();
      if (msg){ const dest = isCEP ? `CEP ${t} (${bairro})` : bairro; msg.textContent = `Frete para ${dest}: ${money(freteValor)}.`; msg.style.color="#28a745"; msg.style.display="block"; }
      return;
    }
    freteValor = 0; freteZona = null; window.updateCartTotals();
    if (msg){ msg.textContent = "Bairro não encontrado. Verifique o nome ou tente CEP."; msg.style.color="#dc3545"; msg.style.display="block"; }
  }

  function init(){
    if (!cfg.enabled){
      const ctn = document.getElementById("dfl-frete-input-container");
      if (ctn) ctn.style.display = "none";
      return;
    }
    const btn = document.getElementById("calcular-frete-btn");
    const input = document.getElementById("frete-input");
    if (btn && input){
      btn.addEventListener("click", (e)=>{ e.preventDefault(); calculateFreight(input.value); });
      input.addEventListener("keydown", (e)=>{ if (e.key==="Enter"){ e.preventDefault(); calculateFreight(input.value); }});
    } else {
      LOG.warn("Elementos de frete não encontrados. Módulo ativo, aguardando DOM.");
    }
  }
  function resetFrete(){
    freteValor=0; freteDestino=""; freteZona=null;
    const msg = document.getElementById("frete-status-msg"); if (msg) msg.style.display = "none";
    const input = document.getElementById("frete-input"); if (input) input.value = "";
    const line  = document.getElementById("frete-display-line"); if (line) line.style.display = "none";
  }

  return {
    init, resetFrete,
    calculateFreight,
    getFreteValor: ()=> freteValor,
    getFreteDestino: ()=> freteDestino,
    getFreteZona: ()=> freteZona,
  };
})();

/* ------------------ ✅ FECHAR PEDIDO ------------------ */
async function fecharPedido(){
  if (!cart.length) return alert("Carrinho vazio!");
  if (!isFirebaseInitialized){ alert("Erro: serviço de pedidos não está pronto. Recarregue."); return; }
  if (!currentUser){ alert("⚠️ Faça login para registrar o pedido."); Overlays.open(document.getElementById("login-modal")); return; }
  const addr = (document.getElementById("address-input")?.value || "").trim();
  if (!addr){ alert("Informe o endereço para entrega antes de finalizar."); document.getElementById("address-input")?.focus(); return; }

  const freteSel = window.DFL_Frete?.getFreteValor?.() || 0;
  if (window.DFL_FLAGS.freightEnabled && freteSel === 0 && cart.length>0){
    alert("Calcule o frete para seu bairro/CEP antes de finalizar.");
    document.getElementById("frete-input")?.focus();
    return;
  }

  const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();
  let freteDestino = window.DFL_Frete?.getFreteDestino?.() || (addr.split(/[ ,]+/)[0] || null);
  const freteZona   = window.DFL_Frete?.getFreteZona?.() || null;
  if (!freteDestino) freteDestino = addr;

  const pedido = {
    usuario: currentUser.email,
    userId: currentUser.uid,
    nome: currentUser.displayName || currentUser.email.split("@")[0],
    itens: cart.map(i=> `${i.nome} x${i.qtd}`),
    itensObj: cart.map(i=> ({ nome:i.nome, preco:i.preco, qtd:i.qtd })),
    subtotal: Number(subtotal.toFixed(2)),
    entrega: Number(delivery.toFixed(2)),
    desconto: Number(discount.toFixed(2)),
    cupom: couponApplied || "",
    total: Number(total.toFixed(2)),
    endereco: addr,
    data: new Date().toISOString(),
    thumb: 'imagens/padrao.jpg',
    freteDestino, freteValor: Number(freteSel.toFixed(2)),
    zona: freteZona,
    dataEntrega: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try{
    const batch = db.batch();
    const userId = currentUser.uid;
    const usuarioRef = db.collection("Usuarios").doc(userId);
    const pedidoRef  = db.collection("Pedidos").doc();

    batch.set(pedidoRef, pedido);
    batch.set(usuarioRef, { email: currentUser.email, pedidosFeitos: firebase.firestore.FieldValue.increment(1) }, { merge:true });

    const entregaHistRef = usuarioRef.collection("EntregasHistorico").doc(pedidoRef.id);
    batch.set(entregaHistRef, {
      data: pedido.dataEntrega, freteDestino: pedido.freteDestino, freteValor: pedido.freteValor, zona: pedido.zona, pedidoId: pedidoRef.id
    });

    await batch.commit();

    // Som de finalização ✅
    playFinishSound();

    popupAdd("Pedido registrado com sucesso!");

    // WhatsApp
    const linhas = [
      "🍔 *Pedido DFL*",
      cart.map(i=> `• ${i.nome} x${i.qtd}`).join("\n"),
      "",
      `Subtotal: *${money(subtotal)}*`,
      `Entrega: *${money(delivery)}*${cupomInfo.freeShipping ? " _(Frete Grátis)_" : ""}`,
      `Desconto${couponApplied ? ` (${couponApplied})` : ""}: *-${money(discount)}*`,
      `*Total: ${money(total)}*`,
      "",
      `🏠 *Endereço:* ${addr}`
    ].join("\n");
    const texto = encodeURIComponent(linhas);
    window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");

    cart = []; couponApplied = ""; localStorage.removeItem("dflCoupon");
    const ci = document.getElementById("coupon-input"); if (ci) ci.value = "";
    window.DFL_Frete.resetFrete();
    renderMiniCart();
    Overlays.closeAll();
  }catch(e){
    console.error("Fechar pedido falhou:", e);
    alert("Ocorreu um erro ao finalizar seu pedido. Tente novamente.");
  }
}

/* =========================================================
   📊 RELATÓRIOS (stub estável — painel abre e lista KPIs)
========================================================= */
window.DFL_ReportsCore = (function(){
  function initPanel(){
    const panel = document.getElementById("reports-panel");
    if (!panel){ LOG.warn("reports-panel não encontrado"); return; }
    Overlays.open(panel);
    // carrega chart.js on-demand
    loadChartJS(()=>{ LOG.charts("Charts pronto (stub)"); });
  }
  return { initPanel };
})();

/* =========================================================
   🧰 ADMIN FRETE (stub estável — painel abre)
========================================================= */
window.DFL_FreteAdmin = (function(){
  function open(){
    const p = document.getElementById("frete-admin-panel");
    if (!p){ LOG.warn("frete-admin-panel não encontrado"); return; }
    Overlays.open(p);
  }
  return { open };
})();

/* =========================================================
   🖱️ FIX UNIVERSAL DE CLIQUES (touch/click) + OBSERVADOR
========================================================= */
(function clickFixAndObserver(){
  // Dispara click ao finalizar touch (corrige atraso e falhas no mobile)
  const getClickable = (el)=>{
    while (el && el !== document.body){
      if (el.classList?.contains("add-cart") || el.classList?.contains("extras-btn") || el.classList?.contains("c-btn") ||
          el.id === "cart-icon" || el.id === "user-btn" || el.id === "finish-order" || el.id === "clear-cart") return el;
      el = el.parentElement;
    }
    return null;
  };
  const handleTouchEnd = (ev)=>{
    if (ev.touches?.length > 0) return; // ignorar gestos/scroll
    const btn = getClickable(ev.target);
    if (!btn) return;
    ev.preventDefault();
    btn.click();
    LOG.info("[TOUCH FIX] click disparado em:", btn.id || btn.className);
  };
  document.body.addEventListener("touchend", handleTouchEnd, { passive:false });

  // Reanexa automaticamente listeners se DOM trocar nós (ex.: renderMiniCart)
  const MO = new MutationObserver(safe(()=>{
    // Reata sumário e botões do carrinho
    bindMiniCartButtons();
  }));
  MO.observe(document.body, { childList:true, subtree:true });
})();

/* =========================================================
   🔚 HARDENING GERAL
========================================================= */
window.addEventListener("pageshow", (e)=>{ if (e.persisted){ console.warn("↻ Reaberta via cache, recarregando..."); location.reload(); }});
window.addEventListener("error", (e)=>{ if (String(e?.message||"").toLowerCase().includes("split")) popupAdd("Humm… houve um pequeno erro. Atualize a página."); });

console.log("%c🚀 DFL v3.9.1 — Base segura carregada (cliques OK, frete ativo)",
            "background:#4CAF50;color:#fff;padding:8px 12px;border-radius:8px;font-weight:700;");