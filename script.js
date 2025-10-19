// ======================
// DFL – Da Família Lanches 🍔
// Script completo (som, popup, carrinho, extras, carrossel, status, timer)
// ======================

// 🎵 Som global de clique
const clickSound = new Audio("click.wav");
clickSound.volume = 0.4;

// ======================
// Seletores principais
// ======================
const cartBtn = document.getElementById("cart-icon");
const miniCart = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");
const cartList = document.getElementById("mini-list");
const cartCount = document.getElementById("cart-count");
const clearCartBtn = document.getElementById("mini-clear");
const finishOrderBtn = document.getElementById("mini-checkout");
const closeCartBtn = document.querySelector(".mini-close");

const extrasBackdrop = document.getElementById("extras-backdrop");
const extrasModal = document.getElementById("extras-modal");
const extrasList = document.getElementById("extras-list");
const extrasCancel = document.getElementById("extras-cancel");
const extrasAdd = document.getElementById("extras-add");

let cart = [];
let produtoAtual = null;

// ======================
// Utilidades UI
// ======================
function tocarClique() {
  try { clickSound.currentTime = 0; clickSound.play(); } catch(e){}
}

function mostrarPopupAdicionado(texto = "+1 adicionado!") {
  const popup = document.createElement("div");
  popup.className = "popup-add";
  popup.textContent = texto;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1400);
}

// ======================
// Carrinho: abrir/fechar (desktop lateral / mobile bottom-sheet)
// ======================
function abrirCarrinho() {
  miniCart.classList.add("active");
  cartBackdrop.classList.add("show");
  document.body.classList.add("no-scroll");
}
function fecharCarrinho() {
  miniCart.classList.remove("active");
  cartBackdrop.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

// Eventos do carrinho
if (cartBtn) cartBtn.addEventListener("click", () => { tocarClique(); abrirCarrinho(); });
if (cartBackdrop) {
  cartBackdrop.addEventListener("click", fecharCarrinho);
  cartBackdrop.addEventListener("touchstart", fecharCarrinho);
}
if (closeCartBtn) closeCartBtn.addEventListener("click", fecharCarrinho);

// ======================
//
// Carrinho: estado e render
// ======================
function atualizarCarrinho() {
  cartList.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    const li = document.createElement("div");
    li.classList.add("cart-item");
    li.innerHTML = `
      <span>${item.nome}</span>
      <strong>R$ ${item.preco.toFixed(2)}</strong>
      <button class="remove-item" data-index="${index}" aria-label="Remover">✕</button>
    `;
    cartList.appendChild(li);
    total += item.preco;
  });

  cartCount.textContent = cart.length;
  clearCartBtn.style.display = cart.length ? "inline-block" : "none";
  finishOrderBtn.style.display = cart.length ? "inline-block" : "none";
}

function adicionarAoCarrinho(nome, preco) {
  cart.push({ nome, preco });
  atualizarCarrinho();
  mostrarPopupAdicionado(`🍔 ${nome} adicionado!`);
}

function removerDoCarrinho(index) {
  cart.splice(index, 1);
  atualizarCarrinho();
}

function limparCarrinho() {
  cart = [];
  atualizarCarrinho();
}

// Eventos da lista do carrinho
cartList.addEventListener("click", (e) => {
  const btn = e.target.closest(".remove-item");
  if (!btn) return;
  const index = +btn.dataset.index;
  removerDoCarrinho(index);
});

// Ações inferiores
clearCartBtn.addEventListener("click", () => { tocarClique(); limparCarrinho(); });
finishOrderBtn.addEventListener("click", () => {
  tocarClique();
  if (!cart.length) return alert("Seu carrinho está vazio!");
  let mensagem = "🧾 *Pedido – Da Família Lanches*%0A%0A";
  cart.forEach((item, i) => {
    mensagem += `${i + 1}. *${item.nome}* — R$ ${item.preco.toFixed(2)}%0A`;
  });
  const total = cart.reduce((s, i) => s + i.preco, 0);
  mensagem += `%0A💰 *Total:* R$ ${total.toFixed(2)}%0A📍 Patos de Minas`;
  const numero = "5534997178336";
  window.open(`https://wa.me/${numero}?text=${mensagem}`, "_blank");
  fecharCarrinho();
});

// ======================
// Botões “Adicionar” dos cards
// ======================
document.querySelectorAll(".add-cart").forEach((btn) => {
  btn.addEventListener("click", () => {
    tocarClique();
    const card = btn.closest(".card");
    const nome = card.dataset.name;
    const preco = parseFloat(card.dataset.price);
    adicionarAoCarrinho(nome, preco);
  });
});

// ======================
// Modal de Adicionais (mesma lista para todos)
// ======================
document.querySelectorAll(".extras-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    tocarClique();
    produtoAtual = btn.closest(".card");
    abrirExtras(produtoAtual.dataset.name);
  });
});

function abrirExtras(nomeProduto) {
  // Lista dos adicionais (hambúrgueres/hot dogs)
  extrasList.innerHTML = `
    <label><input type="checkbox" value="Cebola" data-price="0.99"> 🧅 Cebola — R$0,99</label>
    <label><input type="checkbox" value="Salada" data-price="1.99"> 🥬 Salada — R$1,99</label>
    <label><input type="checkbox" value="Ovo" data-price="1.99"> 🥚 Ovo — R$1,99</label>
    <label><input type="checkbox" value="Salsicha" data-price="1.99"> 🌭 Salsicha — R$1,99</label>
    <label><input type="checkbox" value="Bacon" data-price="2.99"> 🥓 Bacon — R$2,99</label>
    <label><input type="checkbox" value="Molho Verde" data-price="2.99"> 🌿 Molho Verde — R$2,99</label>
    <label><input type="checkbox" value="Hambúrguer Tradicional" data-price="2.99"> 🍔 Hambúrguer Tradicional — R$2,99</label>
    <label><input type="checkbox" value="Cheddar" data-price="3.99"> 🧀 Cheddar — R$3,99</label>
    <label><input type="checkbox" value="Filé de Frango" data-price="6.99"> 🍗 Filé de Frango — R$6,99</label>
    <label><input type="checkbox" value="Hambúrguer Artesanal 120g" data-price="7.99"> 🍖 Hambúrguer Artesanal 120g — R$7,99</label>
  `;
  extrasModal.classList.add("show");
  extrasBackdrop.classList.add("show");
}

function fecharExtras() {
  extrasModal.classList.remove("show");
  extrasBackdrop.classList.remove("show");
}

extrasCancel.addEventListener("click", () => { tocarClique(); fecharExtras(); });
extrasBackdrop.addEventListener("click", fecharExtras);

extrasAdd.addEventListener("click", () => {
  tocarClique();
  const checks = extrasList.querySelectorAll("input[type='checkbox']:checked");
  if (!checks.length) { fecharExtras(); return; }

  checks.forEach((cb) => {
    const nome = `Adicional: ${cb.value}`;
    const preco = parseFloat(cb.dataset.price);
    adicionarAoCarrinho(nome, preco);
  });
  mostrarPopupAdicionado("✅ Adicionais adicionados!");
  fecharExtras();
});

// ======================
// Promoções: carrossel + clique → WhatsApp
// ======================
(function initCarousel(){
  const slides = Array.from(document.querySelectorAll(".carousel .slide"));
  const prevBtn = document.querySelector(".c-prev");
  const nextBtn = document.querySelector(".c-next");
  if (!slides.length || !prevBtn || !nextBtn) return;

  let index = 0;
  slides.forEach((s,i)=> s.classList.toggle("active", i === index));

  function show(i){
    index = (i + slides.length) % slides.length;
    slides.forEach((s,idx)=> s.classList.toggle("active", idx === index));
  }
  prevBtn.addEventListener("click", (e)=>{ e.stopPropagation(); tocarClique(); show(index-1); });
  nextBtn.addEventListener("click", (e)=>{ e.stopPropagation(); tocarClique(); show(index+1); });

  // clique na imagem → WhatsApp
  slides.forEach((img)=>{
    img.addEventListener("click", ()=>{
      tocarClique();
      const msg = encodeURIComponent(img.dataset.wa || "Olá! Quero aproveitar a promoção 🍔");
      const phone = "5534997178336";
      window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    });
  });
})();

// ======================
// Contagem regressiva (até 23:59:59 hoje)
// ======================
function atualizarContagem() {
  const agora = new Date();
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  const diff = fim - agora;

  const el = document.getElementById("timer");
  if (!el) return;

  if (diff <= 0) { el.textContent = "00:00:00"; return; }

  const h = Math.floor(diff / 1000 / 60 / 60);
  const m = Math.floor((diff / 1000 / 60) % 60);
  const s = Math.floor((diff / 1000) % 60);
  el.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
setInterval(atualizarContagem, 1000);
atualizarContagem();

// ======================
// Status aberto/fechado
// ======================
function atualizarStatus() {
  const banner = document.getElementById("status-banner");
  if (!banner) return;

  const agora = new Date();
  const dia = agora.getDay(); // 0 dom .. 6 sáb
  const h = agora.getHours();
  const min = agora.getMinutes();

  let aberto = false;
  let msg = "";

  if (dia === 2) { // Terça
    msg = "❌ Fechado — abrimos amanhã às 18h";
  } else if ([1, 3, 4].includes(dia)) {
    aberto = h >= 18 && (h < 23 || (h === 23 && min <= 15));
    msg = aberto ? "🟢 Aberto até 23h15" : "🔴 Fechado — abrimos às 18h";
  } else if ([5, 6, 0].includes(dia)) {
    aberto = h >= 17 && (h < 23 || (h === 23 && min <= 30));
    msg = aberto ? "🟢 Aberto até 23h30" : "🔴 Fechado — abrimos às 17h30";
  }

  banner.textContent = msg;
  banner.className = `status-banner ${aberto ? "aberto":"fechado"}`;
}
setInterval(atualizarStatus, 60000);
atualizarStatus();

// ======================
// Inicialização segura
// ======================
document.addEventListener("DOMContentLoaded", () => {
  // Garante que comece fechado
  miniCart.classList.remove("active");
  cartBackdrop.classList.remove("show");
  document.body.classList.remove("no-scroll");

  atualizarCarrinho();
  atualizarContagem();
  atualizarStatus();
});