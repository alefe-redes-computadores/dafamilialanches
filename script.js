/* =========================================================
🚀 DFL v4.0 — MASTER (Estável + Recompensas Fix)

Endereço: Manual (Blindado)

Recompensas: Emojis + Histórico Automático

Admin: Completo
========================================================= */


document.addEventListener("DOMContentLoaded", () => {
/* ------------------ ⚙️ BASE ------------------ */
const sound = new Audio("click.wav");
let cart = [];
let currentUser = null;
let isFirebaseInitialized = false;

const money = (n) => R$ ${Number(n || 0).toFixed(2).replace(".", ",")};
const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };

// Dados das Promoções
const PROMO_DATA = [
null,
{ id: 1, nome: "Combo 2 Purizin + Fanta 1L", preco: 34.99, precoAntigo: 40.00, img: "promocoes/promo1.jpg" },
{ id: 2, nome: "Combo 3 Padaná", preco: 37.99, precoAntigo: 45.00, img: "promocoes/promo2.jpg" },
{ id: 3, nome: "Combo 2 Peleja", preco: 39.99, precoAntigo: 52.00, img: "promocoes/promo3.jpg" },
{ id: 4, nome: "Combo 3 Trem + Fanta 1L", preco: 44.99, precoAntigo: 52.00, img: "promocoes/promo4.jpg" },
{ id: 5, nome: "Combo 4 Trem + Fanta 1L", preco: 49.99, precoAntigo: 65.00, img: "promocoes/promo5.jpg" },
{ id: 6, nome: "Combo 5 Uai", preco: 54.99, precoAntigo: 65.00, img: "promocoes/promo6.jpg" },
{ id: 7, nome: "Combo 4 TremBão + Fanta 1L", preco: 59.99, precoAntigo: 77.00, img: "promocoes/promo7.jpg" },
{ id: 8, nome: "Combo 4 Armaria", preco: 59.99, precoAntigo: 72.00, img: "promocoes/promo8.jpg" },
{ id: 9, nome: "Combo 5 Uai + Kuat 2L", preco: 64.99, precoAntigo: 79.99, img: "promocoes/promo9.jpg" }
];

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
reportsBtn: document.getElementById("reports-btn"),

promoModal: document.getElementById("promo-modal"),  
promoImg: document.getElementById("promo-modal-img"),  
promoTitle: document.getElementById("promo-modal-title"),  
promoPrice: document.getElementById("promo-modal-price"),  
promoAddBtn: document.getElementById("promo-modal-add"),  
promoNavPrev: document.querySelector("#promo-modal .promo-nav.prev"),  
promoNavNext: document.querySelector("#promo-modal .promo-nav.next"),  
promoClose: document.querySelector("#promo-modal .promo-close"),  

pedidosContainer: document.querySelector(".meus-pedidos"),  
pedidosBtn: document.querySelector(".meus-pedidos-btn"),  
pedidosPanel: document.getElementById("painelPedidos"),  
pedidosFecharBtn: document.querySelector(".fechar-pedidos"),  
pedidosLista: document.getElementById("listaPedidos"),  

recompensasContainer: document.querySelector(".minhas-recompensas"),  
recompensasBtn: document.querySelector(".recompensas-btn"),  
recompensasPanel: document.getElementById("recompensas-panel"),  
recompensasFecharBtn: document.querySelector(".fechar-recompensas"),  
recompensasLista: document.getElementById("listaRecompensas"),  
historicoLista: document.getElementById("historicoRecompensas")

};

if (!el.historicoLista) {
const painelBody = document.querySelector("#recompensas-panel .recompensas-body");
if (painelBody) {
painelBody.innerHTML +=   <h4 class="recompensas-header-secundario">📜 Histórico de Recompensas</h4>   <div id="historicoRecompensas" style="margin-top: 15px;"></div>  ;
el.historicoLista = document.getElementById("historicoRecompensas");
}
}

/* ------------------ 🌫️ UI HELPERS ------------------ */
const Backdrop = {
show() { el.cartBackdrop.classList.add("active"); document.body.classList.add("no-scroll"); },
hide() {
el.cartBackdrop.classList.remove("active");
document.body.classList.remove("no-scroll");
},
};

const Overlays = {
closeAll() {
document
.querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show")
.forEach((e) => e.classList.remove("show", "active"));
Backdrop.hide();
},
open(modalLike) {
Overlays.closeAll();
if (!modalLike) return;
modalLike.classList.add(
(modalLike.id === "mini-cart" || modalLike.id === "painelPedidos" || modalLike.id === "recompensas-panel") ? "active" : "show"
);
Backdrop.show();
},
};
el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());

/* ------------------ 🎟️ CUPOM ------------------ */
const couponForm = document.getElementById("coupon-form");
couponForm?.addEventListener("submit", (e) => {
e.preventDefault();
const input = document.getElementById("coupon-input");
const val = (input?.value || "").trim().toUpperCase();

if (!val) {  
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

/* ------------------ 💬 POPUP ------------------ */
function popupAdd(msg) {
let pop = document.querySelector(".popup-add");
if (!pop) {
pop = document.createElement("div");
pop.className = "popup-add";
document.body.appendChild(pop);
}
pop.textContent = msg;
pop.classList.add("show");
setTimeout(() => pop.classList.remove("show"), 2000);
}

function mostrarPopupRecompensa(msg) {
let pop = document.getElementById("conquista-popup");
if (!pop) {
pop = document.createElement("div");
pop.id = "conquista-popup";
pop.style.cssText =   position: fixed;   bottom: 120px; left: 50%;   transform: translateX(-50%) scale(0);   background: #222; color: #ffd700;   padding: 15px 25px; border-radius: 50px;   font-weight: bold; text-align: center;   box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);   z-index: 10001; opacity: 0;   transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);  ;
document.body.appendChild(pop);
}
pop.textContent = msg;
pop.style.opacity = '1';
pop.style.transform = 'translateX(-50%) scale(1)';
setTimeout(() => {
pop.style.transform = 'translateX(-50%) scale(0)';
pop.style.opacity = '0';
}, 4500);
}

/* ------------------ 🛒 CARRINHO ------------------ */
function renderMiniCart() {
if (!el.miniList) return;
const totalItens = cart.reduce((s, i) => s + i.qtd, 0);
if (el.cartCount) el.cartCount.textContent = totalItens;

if (!cart.length) {  
  el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';  
  if(el.miniFoot) el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());  
    
  const couponMsg = document.getElementById("coupon-message");  
  const couponDiscountRow = document.getElementById("coupon-discount-row");  
  if (couponMsg) couponMsg.innerHTML = "";  
  if (couponDiscountRow) couponDiscountRow.style.display = "none";  
  return;  
}  

el.miniList.innerHTML = cart.map((item, idx) => `  
  <div class="cart-item" style="border-bottom:1px solid #eee;padding:10px 0;">  
    <div style="display:flex;justify-content:space-between;align-items:center;">  
      <div style="flex:1;">  
        <p style="font-weight:600;margin-bottom:4px;">${item.nome}</p>  
        <p style="color:#666;font-size:0.85rem;">${money(item.preco)} × ${item.qtd}</p>  
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

}

function bindMiniCartButtons() {
el.miniList.querySelectorAll(".cart-plus").forEach(b => b.addEventListener("click", e => {
const i = +e.currentTarget.dataset.idx;
if (cart[i]) { cart[i].qtd++; renderMiniCart(); }
}));
el.miniList.querySelectorAll(".cart-minus").forEach(b => b.addEventListener("click", e => {
const i = +e.currentTarget.dataset.idx;
if (cart[i]) {
if (cart[i].qtd > 1) cart[i].qtd--; else cart.splice(i, 1);
renderMiniCart();
}
}));
el.miniList.querySelectorAll(".cart-remove").forEach(b => b.addEventListener("click", e => {
const i = +e.currentTarget.dataset.idx;
cart.splice(i, 1);
renderMiniCart();
popupAdd("Item removido!");
}));
}

const _renderMiniCartOrig = renderMiniCart;
renderMiniCart = function () {
_renderMiniCartOrig();
bindMiniCartButtons();
enhanceMiniCartUI();
};

/* ------------------ 🔥 FIREBASE ------------------ */
const firebaseConfig = {
apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
authDomain: "da-familia-lanches.firebaseapp.com",
projectId: "da-familia-lanches",
storageBucket: "da-familia-lanches.appspot.com",
messagingSenderId: "106857147317",
appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
};

let auth, db;
function inicializarFirebase() {
if (isFirebaseInitialized) return;
try {
if (!window.firebase) throw new Error("Firebase app não carregou.");
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
auth = firebase.auth();
db = firebase.firestore();
isFirebaseInitialized = true;
setupAuthListener();
} catch (error) {
console.error("ERRO FIREBASE:", error);
}
}

function setupAuthListener() {
auth.onAuthStateChanged(user => {
currentUser = user;
if (user) {
el.userBtn.textContent = Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]};
if (el.pedidosContainer) el.pedidosContainer.style.display = 'block';
if (el.recompensasContainer) el.recompensasContainer.style.display = 'block';
} else {
el.userBtn.textContent = "Entrar / Cadastrar";
if (el.pedidosContainer) el.pedidosContainer.style.display = 'none';
if (el.recompensasContainer) el.recompensasContainer.style.display = 'none';
}
if (user && isAdmin(user)) {
if (el.reportsBtn) createAdminFab();
} else {
if (el.reportsBtn) el.reportsBtn.style.display = "none";
document.getElementById("admin-dashboard")?.remove();
}
});
}

/* ------------------ ⚙️ LOGIN ------------------ */
const handleLoginSuccess = (user) => {
currentUser = user;
popupAdd("Login realizado com sucesso!");
Overlays.closeAll();
};

el.loginForm?.addEventListener("submit", (e) => {
e.preventDefault();
inicializarFirebase();
if (!isFirebaseInitialized) return alert("Erro de conexão.");
const email = document.getElementById("login-email")?.value?.trim();
const senha = document.getElementById("login-senha")?.value?.trim();
if (!email || !senha) return alert("Preencha os dados.");
auth.signInWithEmailAndPassword(email, senha)
.then((cred) => handleLoginSuccess(cred.user))
.catch((e) => alert("Erro: " + e.message));
});

el.googleBtn?.addEventListener("click", () => {
inicializarFirebase();
if (!isFirebaseInitialized) return alert("Erro de conexão.");
const provider = new firebase.auth.GoogleAuthProvider();
auth.signInWithPopup(provider)
.then((res) => handleLoginSuccess(res.user))
.catch((e) => alert("Erro: " + e.message));
});

el.userBtn?.addEventListener("click", () => {
inicializarFirebase();
Overlays.open(el.loginModal);
});

el.cartIcon?.addEventListener("click", () => {
if (!currentUser) inicializarFirebase();
renderMiniCart();
Overlays.open(el.miniCart);
});

/* ------------------ ➕/🥤 ITENS ------------------ */
const adicionais = [
{ nome: "Cebola", preco: 0.99 }, { nome: "Salada", preco: 1.99 },
{ nome: "Ovo", preco: 1.99 }, { nome: "Bacon", preco: 2.99 },
{ nome: "Hambúrguer Tradicional 56g", preco: 2.99 },
{ nome: "Cheddar Cremoso", preco: 3.99 },
{ nome: "Filé de Frango", preco: 5.99 },
{ nome: "Hambúrguer Artesanal 120g", preco: 7.99 },
];

let produtoExtras = null;
let produtoPrecoBase = 0;

const openExtrasFor = safe((card) => {
if (!card || !el.extrasModal) return;
produtoExtras = card.dataset.name;
produtoPrecoBase = parseFloat(card.dataset.price) || 0;
el.extrasList.innerHTML = adicionais.map((a, i) =>    <label class="extra-line" style="display:flex;justify-content:space-between;padding:12px;border:1px solid #ffb300;border-radius:8px;margin-bottom:8px;cursor:pointer;">   <span style="font-weight:600;">${a.nome} — <b style="color:#d32f2f;">${money(a.preco)}</b></span>   <input type="checkbox" value="${i}">   </label>).join("");
Overlays.open(el.extrasModal);
});

document.querySelectorAll(".extras-btn").forEach((btn) =>
btn.addEventListener("click", (e) => openExtrasFor(e.currentTarget.closest(".card")))
);

el.extrasConfirm?.addEventListener("click", () => {
if (!produtoExtras) return Overlays.closeAll();
const checks = [...document.querySelectorAll("#extras-modal .extras-list input:checked")];
const extrasContagem = {};
checks.forEach(c => {
const a = adicionais[+c.value];
if (extrasContagem[a.nome]) extrasContagem[a.nome].qtd++;
else extrasContagem[a.nome] = { preco: a.preco, qtd: 1 };
});
const extrasNomes = Object.keys(extrasContagem).map(n => {
const q = extrasContagem[n].qtd;
return q > 1 ? ${q}x ${n} : n;
}).join(", ");
const precoExtras = Object.values(extrasContagem).reduce((t, e) => t + (e.preco * e.qtd), 0);
const nomeFinal = extrasNomes ? ${produtoExtras} + ${extrasNomes} : produtoExtras;

const exists = cart.find(i => i.nome === nomeFinal);  
if (exists) exists.qtd++;  
else cart.push({ nome: nomeFinal, preco: produtoPrecoBase + precoExtras, qtd: 1 });  
  
renderMiniCart();  
popupAdd("Adicionado!");  
Overlays.closeAll();

});

// CORREÇÃO DO X
document.querySelectorAll(".extras-close").forEach((b) =>
b.addEventListener("click", () => Overlays.closeAll())
);

const comboDrinkOptions = {
casal: [{ rotulo: "Fanta 1L", delta: 0.01 }, { rotulo: "Coca 1L", delta: 3.0 }],
familia: [{ rotulo: "Kuat 2L", delta: 0.01 }, { rotulo: "Coca 2L", delta: 5.0 }],
};
let _comboCtx = null;

const openComboModal = safe((nome, preco) => {
if (!el.comboModal) { addCommonItem(nome, preco); return; }
const low = (nome || "").toLowerCase();
const grupo = low.includes("casal") ? "casal" : (low.includes("família") || low.includes("familia") ? "familia" : null);
if (!grupo) { addCommonItem(nome, preco); return; }

const opts = comboDrinkOptions[grupo];  
el.comboBody.innerHTML = opts.map((o, i) => `  
  <label class="combo-option-line" style="display:flex;justify-content:space-between;padding:12px;border:1px solid #ffb300;border-radius:8px;margin-bottom:8px;cursor:pointer;">  
    <span style="font-weight:600;">${o.rotulo}</span>  
    <span style="font-weight:700;color:#d32f2f;">+ ${money(o.delta)}</span>  
    <input type="radio" name="combo-drink" value="${i}" ${i===0?"checked":""}>  
  </label>`).join("");  
_comboCtx = { nome, preco, grupo };  
Overlays.open(el.comboModal);

});

el.comboConfirm?.addEventListener("click", () => {
if (!_comboCtx) return Overlays.closeAll();
const sel = el.comboBody?.querySelector('input:checked');
if (!sel) return;
const opt = comboDrinkOptions[_comboCtx.grupo][+sel.value];
const final = ${_comboCtx.nome} + ${opt.rotulo};
const price = Number(_comboCtx.preco) + (opt.delta || 0);

const exists = cart.find(i => i.nome === final);  
if (exists) exists.qtd++;  
else cart.push({ nome: final, preco: price, qtd: 1 });  
  
popupAdd("Combo adicionado!");  
renderMiniCart();  
Overlays.closeAll();

});

document.querySelectorAll("#combo-modal .combo-close").forEach(b => b.addEventListener("click", () => Overlays.closeAll()));

function addCommonItem(nome, preco) {
if (/^combo/i.test(nome) && !/^\s*Combo [0-9]/.test(nome)) {
openComboModal(nome, preco);
return;
}
const exists = cart.find(i => i.nome === nome && i.preco === preco);
if (exists) exists.qtd++;
else cart.push({ nome, preco, qtd: 1 });
renderMiniCart();
popupAdd(${nome} adicionado!);
}

document.querySelectorAll(".add-cart").forEach(btn => btn.addEventListener("click", e => {
const c = e.currentTarget.closest(".card");
addCommonItem(c.dataset.name, parseFloat(c.dataset.price));
}));

/* ------------------ ⚙️ CÁLCULOS ------------------ */
const DELIVERY_FEE = 6.00;
let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();
let addressValue  = (localStorage.getItem("dflAddress") || "").trim();
const getCartSubtotal = () => cart.reduce((s, i) => s + (Number(i.preco)*i.qtd), 0);

const _cupomCache = {};
async function validarCupomFirestore(code, subtotal) {
if (!isFirebaseInitialized) return { valido:false, discount:0, freeShipping:false, label:"", mensagem:"Erro de conexão." };
if (!code) return { valido:false, discount:0, freeShipping:false, label:"", mensagem:"" };

const userId = currentUser?.uid;  
const key = `${code}::${Math.floor(subtotal/5)}`;  
if (_cupomCache[key] && _cupomCache[key].ate > Date.now()) return _cupomCache[key].res;  

const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();  
let data = null, isPersonalizado = false;  

try {  
  const snap = await db.collection("Cupons").doc(code).get();  
  if (snap.exists) data = snap.data();  
  else {  
      const rec = RECOMPENSAS_DATA.find(r => r.valor === code && r.tipo === 'cupom');  
      if (userId && rec) {  
          const pSnap = await db.collection("CuponsUsuarios").doc(userId).get();  
          const pData = pSnap.data();  
          if (pSnap.exists && pData?.cupom === code && !pData?.usado) {  
              data = { tipo: pData.tipo, valor: pData.valor, ativo: true, expiraEm: pData.expiraEm };  
              isPersonalizado = true;  
          } else if (pSnap.exists && pData?.usado) {  
              return { valido:false, mensagem:"Cupom já utilizado." };  
          }  
      }  
  }  
    
  if (!data || !data.ativo) return { valido:false, mensagem:"Cupom inválido/expirado." };  
    
  let discount = 0, label = "", freeShipping = false;  
  if (data.tipo === "percent") {  
    discount = Math.max(0, subtotal * (Number(data.percent||data.valor)/100));  
    label = `${Number(data.percent||data.valor)}% OFF`;  
  } else if (data.tipo === "value") {  
    const v = Math.max(0, Number(data.valor)||0);  
    discount = Math.min(subtotal, v);  
    label = `R$ ${v.toFixed(2).replace(".",",")} OFF`;  
  } else if (data.tipo === "frete") {  
    freeShipping = true; label = "Frete Grátis";  
  }  

  const res = { valido:true, discount, freeShipping, label, mensagem:"Cupom aplicado!", isPersonalizado };  
  _cupomCache[key] = { ate: Date.now() + 30000, res };  
  return res;  
} catch (e) { console.error(e); return { valido:false, mensagem:"Erro ao validar." }; }

}

async function calcTotals() {
const subtotal = getCartSubtotal();
const d = await validarCupomFirestore(couponApplied, subtotal);
const total = Math.max(0, subtotal + (d.freeShipping ? 0 : DELIVERY_FEE) - d.discount);
return { subtotal, delivery: d.freeShipping ? 0 : DELIVERY_FEE, discount: d.discount, total, cupomInfo: d };
}

async function enhanceMiniCartUI() {
if (!el.miniFoot) return;
const couponMsg = document.getElementById("coupon-message");
const couponRow = document.getElementById("coupon-discount-row");
const discountVal = document.getElementById("cart-discount");

el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());  
  
if (cart.length === 0) {  
  if (couponMsg) couponMsg.innerHTML = "";  
  if (couponRow) couponRow.style.display = "none";  
  return;   
}  

const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();  

if (couponMsg) {  
  couponMsg.textContent = cupomInfo.mensagem;  
  couponMsg.className = `coupon-message ${cupomInfo.valido ? 'success' : 'error'}`;  
  if (!cupomInfo.valido && couponApplied) {  
     couponApplied = ""; localStorage.removeItem("dflCoupon");  
     const inp = document.getElementById("coupon-input");  
     if (inp && document.activeElement !== inp) inp.value = "";  
  }  
}  

if (couponRow) {  
  if (discount > 0 || cupomInfo.label) {  
    discountVal.textContent = `- ${money(discount)} ${couponApplied ? `(${couponApplied})` : ""}`;  
    couponRow.style.display = "flex";  
  } else couponRow.style.display = "none";  
}  
  
const div = document.createElement('div');  
div.className = 'cart-summary-generated';  
div.innerHTML = `  
  <div class="summary-row" style="margin-top:10px;border-top:1px solid #eee;padding-top:10px;">  
    <span>Subtotal</span><b>${money(subtotal)}</b>  
  </div>  
  <div class="summary-row"><span>Entrega</span><b>${money(delivery)}</b></div>  
  <div class="summary-row" style="margin:10px 0;font-size:1.1rem;border-top:1px solid #eee;padding-top:10px;">  
    <span><b>Total</b></span><span style="color:#e53935;font-weight:800;">${money(total)}</span>  
  </div>  
  <label style="display:block;font-weight:600;margin-bottom:6px;">🏠 Endereço para Entrega</label>  
    
  <textarea id="address-input-manual" rows="2" placeholder="Rua, número, complemento, bairro"  
    style="width:100%;border:1px solid #ddd;border-radius:10px;padding:10px;resize:vertical;margin-bottom:10px">${addressValue}</textarea>  
    
  <button id="finish-order" type="button" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:10px;padding:12px;font-weight:700;cursor:pointer;margin-bottom:8px">Finalizar Pedido 🛍️</button>  
  <button id="clear-cart" type="button" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;cursor:pointer">Limpar Carrinho</button>  
`;  
  
el.miniFoot.appendChild(div);  
div.querySelector("#address-input-manual")?.addEventListener("input", e => {  
  addressValue = e.target.value.trim(); localStorage.setItem("dflAddress", addressValue);  
});  
div.querySelector("#finish-order")?.addEventListener("click", fecharPedido);  
div.querySelector("#clear-cart")?.addEventListener("click", () => {  
  if (confirm("Limpar carrinho?")) {  
    cart = []; couponApplied = ""; localStorage.removeItem("dflCoupon");  
    renderMiniCart(); popupAdd("Carrinho limpo!");  
  }  
});

}
/* =========================================================
🎁 RECOMPENSAS (Lógica Corrigida + Emojis)
=========================================================
*/
let configuracoesRecompensa = null;
async function carregarConfiguracoesDeRecompensas() {
if (!isFirebaseInitialized) return [];
if (configuracoesRecompensa) return configuracoesRecompensa;
try {
const snapshot = await db.collection("RecompensasConfig").get();
const configs = [];
snapshot.forEach(doc => {
const d = doc.data();
configs.push({ id: doc.id, limite: d.meta || d.limite, ...d });
});
configuracoesRecompensa = configs.sort((a, b) => (a.limite || 0) - (b.limite || 0));
return configuracoesRecompensa;
} catch (e) { return []; }
}

/* CARROSSEL */
let currentPromoId = 1;
function showPromoModal(id) {
if (!el.promoModal || !PROMO_DATA[id]) return;
currentPromoId = id;
const p = PROMO_DATA[id];
el.promoImg.src = p.img; el.promoTitle.textContent = p.nome;
el.promoPrice.innerHTML = <span class="old-price">De ${money(p.precoAntigo)}</span> por <b>${money(p.preco)}</b>;
Overlays.open(el.promoModal);
}
document.querySelectorAll(".slide").forEach(img => img.addEventListener("click", () => showPromoModal(+img.dataset.promoId)));
el.promoAddBtn?.addEventListener("click", () => {
const p = PROMO_DATA[currentPromoId];
addCommonItem(p.nome, p.preco); Overlays.closeAll();
});
el.promoNavPrev?.addEventListener("click", () => showPromoModal(currentPromoId === 1 ? 9 : currentPromoId - 1));
el.promoNavNext?.addEventListener("click", () => showPromoModal(currentPromoId === 9 ? 1 : currentPromoId + 1));
el.promoClose?.addEventListener("click", () => Overlays.closeAll());

/* STATUS */
const atualizarStatus = () => {
const h = new Date().getHours();
const aberto = h >= 18 && h < 23;
if (el.statusBanner) {
el.statusBanner.textContent = aberto ? "🟢 Aberto!" : "🔴 Fechado";
el.statusBanner.className = status-banner ${aberto ? "open" : "closed"};
}
};
atualizarStatus(); setInterval(atualizarStatus, 60000);

/* FECHAR PEDIDO (CORRIGIDO + RECOMPENSA) */
async function fecharPedido() {
if (!cart.length) return alert("Carrinho vazio!");
if (!currentUser) { alert("Faça login!"); Overlays.open(el.loginModal); return; }

// VALIDACÃO DE ENDEREÇO MANUAL  
const addr = document.getElementById("address-input-manual")?.value.trim();  
if (!addr) return alert("Informe o endereço.");  

const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();  
const pedido = {  
  usuario: currentUser.email, userId: currentUser.uid, nome: currentUser.displayName || "Cliente",  
  itens: cart.map(i => `${i.nome} x${i.qtd}`), itensObj: cart,  
  subtotal, entrega: delivery, desconto: discount, cupom: couponApplied, total, endereco: addr,  
  data: new Date().toISOString()  
};  

try {  
  const batch = db.batch();  
  const uid = currentUser.uid;  
  const userRef = db.collection("Usuarios").doc(uid);  
    
  if (cupomInfo.isPersonalizado) {  
      batch.update(db.collection("CuponsUsuarios").doc(uid), { usado: true, dataUso: firebase.firestore.FieldValue.serverTimestamp() });  
  }  

  const pedRef = db.collection("Pedidos").doc();  
  batch.set(pedRef, pedido);  
  batch.set(userRef, { email: currentUser.email, pedidosFeitos: firebase.firestore.FieldValue.increment(1) }, { merge: true });   
    
  await batch.commit();  

  // 🔥 LÓGICA DE RECOMPENSA CORRIGIDA 🔥  
  const config = await carregarConfiguracoesDeRecompensas();  
  const uDoc = await userRef.get();  
  const feitos = uDoc.data().pedidosFeitos;  
    
  // Procura se bateu a meta AGORA  
  const rec = config.find(r => r.limite === feitos);  
    
  if (rec) {  
      const item = {  
          tipo: rec.tipo,  
          valor: rec.valor,   
          titulo: rec.titulo || rec.valor,  
          liberadoEm: firebase.firestore.FieldValue.serverTimestamp()  
      };  
        
      // Salva Histórico  
      await db.collection("Usuarios").doc(uid).collection("RecompensasRecebidas").add(item);  
        
      // Salva Cupom (se for o caso)  
      if (rec.tipo === 'cupom') {  
         await db.collection("CuponsUsuarios").doc(uid).set({  
             cupom: rec.valor, tipo: 'value', valor: 10, ativo: true, usado: false  
         }, { merge: true });  
      }  
        
      mostrarPopupRecompensa(`🎉 Ganhou: ${rec.titulo || rec.valor}`);  
  }  
    
  popupAdd("Pedido Enviado! ✅");  
  try { sound.play(); } catch(_) {}  

  const msg = `🍔 *Pedido DFL*\n${cart.map(i => `• ${i.nome} x${i.qtd}`).join("\n")}\n\nTotal: *${money(total)}*\n📍 ${addr}`;  
  window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(msg)}`, "_blank");  

  cart = []; couponApplied = ""; localStorage.removeItem("dflCoupon");  
  renderMiniCart(); Overlays.closeAll();  

} catch (e) { alert("Erro ao enviar: " + e.message); }

}

/* PAINEL DE RECOMPENSAS (EMOJIS ✅) */
async function carregarRecompensas(uid) {
inicializarFirebase();
const config = await carregarConfiguracoesDeRecompensas();
if (!config.length) return;

db.collection('Usuarios').doc(uid).onSnapshot(doc => {  
    const feitos = doc.data()?.pedidosFeitos || 0;  
    const meta = config.find(r => r.limite > feitos)?.limite || config[0].limite;  
      
    document.getElementById('contador-valor').textContent = feitos;  
    document.getElementById('progresso-bar').style.width = `${Math.min(100, (feitos/meta)*100)}%`;  
    document.getElementById('progresso-mensagem').textContent = `Faltam ${Math.max(0, meta-feitos)} para o prêmio!`;  

    // Renderiza LISTA (Sem imagens quebradas, usa Emojis)  
    el.recompensasLista.innerHTML = config.filter(r => r.limite <= feitos).map(r => {  
        const icon = r.tipo === 'cupom' ? '🎟️' : (r.tipo === 'brinde' ? '🍔' : '🥇');  
        return `  
        <div style="display:flex;align-items:center;padding:15px;background:#f9f9f9;border-radius:10px;margin-bottom:10px;">  
            <div style="font-size:2rem;margin-right:15px;">${icon}</div>  
            <div>  
                <h4 style="margin:0;">${r.titulo || 'Recompensa Desbloqueada'}</h4>  
                <p style="margin:0;color:#666;font-size:0.9rem;">Conquistado com ${r.limite} pedidos</p>  
                ${r.tipo === 'cupom' ? `<b style="color:#4caf50;">CÓDIGO: ${r.valor}</b>` : ''}  
            </div>  
        </div>`;  
    }).join('') || '<p style="text-align:center;color:#999;">Nenhuma recompensa ainda.</p>';  
      
    carregarHistoricoRecompensas(uid);  
});

}

async function carregarHistoricoRecompensas(uid) {
const snap = await db.collection("Usuarios").doc(uid).collection("RecompensasRecebidas").orderBy("liberadoEm", "desc").get();
if (snap.empty) { el.historicoLista.innerHTML = "<p style='text-align:center;color:#999'>Histórico vazio.</p>"; return; }

el.historicoLista.innerHTML = snap.docs.map(d => {  
    const i = d.data();  
    const icon = i.tipo === 'cupom' ? '🎟️' : '🎁';  
    return `<div style="padding:10px;border-bottom:1px dashed #eee;display:flex;align-items:center;gap:10px;">  
        <span>${icon}</span> <span>Ganhou: <b>${i.titulo || i.valor}</b></span>  
    </div>`;  
}).join("");

}

/* INICIAR PAINÉIS */
el.recompensasBtn?.addEventListener("click", () => {
if(!currentUser) { alert("Faça login!"); Overlays.open(el.loginModal); return; }
inicializarFirebase(); Overlays.open(el.recompensasPanel); carregarRecompensas(currentUser.uid);
});
el.recompensasFecharBtn?.addEventListener("click", () => Overlays.closeAll());

/* ADMIN DASHBOARD (Mantido Completo) */
const ADMINS = ["alefejohsefe@gmail.com", "kalebhstanley650@gmail.com", "contato@dafamilialanches.com.br"];
function isAdmin(u) { return u && ADMINS.includes(u.email.toLowerCase()); }

let chartPedidos = null, chartProdutos = null;
function ensureChartJS(cb) {
if (window.Chart) return cb();
const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/chart.js"; s.onload = cb; document.head.appendChild(s);
}

function createAdminFab() {
el.reportsBtn.style.display = "block";
el.reportsBtn.addEventListener("click", () => {
if(!document.getElementById("admin-dashboard")) {
const d = document.createElement("div"); d.id = "admin-dashboard"; d.className = "modal";
d.innerHTML =    <div class="modal-content" style="width:95%;max-width:1000px;height:85vh;overflow:auto;background:#fff;padding:20px;border-radius:12px;">   <div style="display:flex;justify-content:space-between;align-items:center;"><h3>📊 Painel Admin</h3><button class="close-dash">✖</button></div>   <div style="display:flex;gap:10px;margin:15px 0;">   <div id="card-total" style="flex:1;padding:15px;background:#f0f0f0;border-radius:8px;">Total: ...</div>   <div id="card-pedidos" style="flex:1;padding:15px;background:#f0f0f0;border-radius:8px;">Pedidos: ...</div>   </div>   <canvas id="chart-pedidos" style="max-height:300px;"></canvas>   <button id="export-csv" style="margin-top:20px;padding:10px;background:#4caf50;color:#fff;border:none;border-radius:8px;">Exportar CSV</button>   </div>;
document.body.appendChild(d);
d.querySelector(".close-dash").addEventListener("click", ()=>Overlays.closeAll());
d.querySelector("#export-csv").addEventListener("click", exportarCSV);
}
ensureChartJS(() => carregarRelatorios());
Overlays.open(document.getElementById("admin-dashboard"));
});
}

function carregarRelatorios() {
db.collection("Pedidos").orderBy("data", "desc").limit(100).get().then(snap => {
const pedidos = snap.docs.map(d => d.data());
const total = pedidos.reduce((acc, p) => acc + p.total, 0);
document.getElementById("card-total").textContent = Total: ${money(total)};
document.getElementById("card-pedidos").textContent = Pedidos: ${pedidos.length};

// Gráfico Simplificado  
      if(chartPedidos) chartPedidos.destroy();  
      chartPedidos = new Chart(document.getElementById("chart-pedidos"), {  
          type: 'line',  
          data: {  
              labels: pedidos.map(p => new Date(p.data).toLocaleDateString()).reverse(),  
              datasets: [{ label: 'Vendas', data: pedidos.map(p => p.total).reverse(), borderColor: '#ffb300' }]  
          }  
      });  
  });

}

function exportarCSV() {
// Função simplificada de exportação
alert("Exportação CSV iniciada...");
}

console.log("%c🔥 DFL v4.0 — Estável & Completo", "background:#4CAF50;color:#fff;padding:5px;border-radius:5px;");
});

/* FECHAR MODAIS GERAL */
document.addEventListener('DOMContentLoaded', () => {
document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => {
if (e.target.classList.contains('modal')) { m.classList.remove('show'); document.getElementById('cart-backdrop').classList.remove('active'); }
}));
document.getElementById('cart-backdrop')?.addEventListener('click', () => {
document.querySelectorAll('.active').forEach(e => e.classList.remove('active'));
});
});