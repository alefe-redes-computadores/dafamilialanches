// ==========================
// Da Família Lanches – script.js (versão final 2025)
// ==========================

// ---------- ELEMENTOS ----------
const cartIcon = document.getElementById("cart-icon");
const cartCount = document.getElementById("cart-count");
const cartBackdrop = document.getElementById("cart-backdrop");
const miniCart = document.getElementById("mini-cart");
const miniList = document.getElementById("mini-list");
const miniClear = document.getElementById("mini-clear");
const miniCheckout = document.getElementById("mini-checkout");
const extrasBackdrop = document.getElementById("extras-backdrop");
const extrasModal = document.getElementById("extras-modal");
const extrasList = document.getElementById("extras-list");
const extrasCancel = document.getElementById("extras-cancel");
const extrasAdd = document.getElementById("extras-add");
const extrasTitle = document.getElementById("extras-title");
const statusBanner = document.getElementById("status-banner");

let carrinho = [];
let produtoAtual = null;
let extrasSelecionados = [];

// ---------- FUNÇÕES DO CARRINHO ----------
function atualizarCarrinho() {
  miniList.innerHTML = "";
  let total = 0;

  carrinho.forEach((item, i) => {
    const div = document.createElement("div");
    div.classList.add("mini-item");
    const extrasTxt = item.extras?.length
      ? `<small style="color:#aaa;">+ ${item.extras.join(", ")}</small>`
      : "";
    div.innerHTML = `
      <span>${item.nome} ${extrasTxt}</span>
      <strong>R$ ${item.preco.toFixed(2)}</strong>
      <button class="remove" data-i="${i}" aria-label="Remover">✕</button>
    `;
    miniList.appendChild(div);
    total += item.preco;
  });

  cartCount.textContent = carrinho.length;
  miniCheckout.textContent = carrinho.length
    ? `Fechar pedido – R$${total.toFixed(2)}`
    : "Fechar pedido";

  miniClear.style.display = carrinho.length ? "inline-block" : "none";
  miniCheckout.style.display = carrinho.length ? "inline-block" : "none";
}

function abrirCarrinho() {
  miniCart.classList.add("active");
  miniCart.setAttribute("aria-hidden","false");
  cartBackdrop.classList.add("show");
}
function fecharCarrinho() {
  miniCart.classList.remove("active");
  miniCart.setAttribute("aria-hidden","true");
  cartBackdrop.classList.remove("show");
}
function limparCarrinho() {
  carrinho = [];
  atualizarCarrinho();
}

// ---------- LISTENERS ROBUSTOS ----------
["click","touchstart"].forEach(evt=>{
  cartBackdrop.addEventListener(evt, fecharCarrinho);
  document.addEventListener(evt, (e)=>{
    if (e.target.closest(".mini-close")) fecharCarrinho();
  });
});

// (mantém o clique do ícone)
cartIcon.addEventListener("click", abrirCarrinho);

// remover item
miniList.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove")) {
    const i = +e.target.dataset.i;
    carrinho.splice(i, 1);
    atualizarCarrinho();
  }
});

// ---------- ADICIONAR PRODUTOS ----------
document.querySelectorAll(".add-cart").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".card");
    const nome = card.dataset.name;
    const preco = parseFloat(card.dataset.price);
    carrinho.push({ nome, preco, extras: [] });
    atualizarCarrinho();
    mostrarPopup("+1 adicionado!");
    animarBotao(btn);
  });
});

// ---------- POPUP “+1” ----------
function mostrarPopup(texto) {
  const pop = document.createElement("div");
  pop.className = "add-popup";
  pop.textContent = texto;
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 1000);
}
function animarBotao(btn) {
  btn.classList.add("clicked");
  setTimeout(() => btn.classList.remove("clicked"), 220);
}

// ---------- BOTÕES DE ADICIONAIS ----------
document.querySelectorAll(".extras-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    produtoAtual = btn.closest(".card");
    abrirExtras(produtoAtual.dataset.name);
  });
});

function abrirExtras(nome) {
  extrasTitle.textContent = `Adicionais – ${nome}`;
  extrasList.innerHTML = `
    <label><input type="checkbox" value="Cebola" data-price="0.99"> Cebola – R$0,99</label>
    <label><input type="checkbox" value="Salada" data-price="1.99"> Salada – R$1,99</label>
    <label><input type="checkbox" value="Ovo" data-price="1.99"> Ovo – R$1,99</label>
    <label><input type="checkbox" value="Salsicha" data-price="1.99"> Salsicha – R$1,99</label>
    <label><input type="checkbox" value="Bacon" data-price="2.99"> Bacon – R$2,99</label>
    <label><input type="checkbox" value="Molho Verde" data-price="2.99"> Molho Verde – R$2,99</label>
    <label><input type="checkbox" value="Hambúrguer Tradicional" data-price="2.99"> Hambúrguer Tradicional – R$2,99</label>
    <label><input type="checkbox" value="Cheddar" data-price="3.99"> Cheddar – R$3,99</label>
    <label><input type="checkbox" value="Filé de Frango" data-price="6.99"> Filé de Frango – R$6,99</label>
    <label><input type="checkbox" value="Hambúrguer Artesanal 120g" data-price="7.99"> Hambúrguer Artesanal 120g – R$7,99</label>
  `;
  extrasModal.classList.add("open");
  extrasBackdrop.classList.add("show");
}

function fecharExtras() {
  extrasModal.classList.remove("open");
  extrasBackdrop.classList.remove("show");
}
extrasCancel.addEventListener("click", fecharExtras);
extrasBackdrop.addEventListener("click", fecharExtras);

extrasAdd.addEventListener("click", () => {
  if (!produtoAtual) return;
  const check = extrasList.querySelectorAll("input[type='checkbox']:checked");
  extrasSelecionados = Array.from(check).map((c) => ({
    nome: c.value,
    preco: parseFloat(c.dataset.price),
  }));
  const extrasNomes = extrasSelecionados.map((x) => x.nome);
  const extrasPreco = extrasSelecionados.reduce((s, x) => s + x.preco, 0);

  carrinho.push({
    nome: produtoAtual.dataset.name,
    preco: parseFloat(produtoAtual.dataset.price) + extrasPreco,
    extras: extrasNomes,
  });

  atualizarCarrinho();
  fecharExtras();
  mostrarPopup("+1 com adicionais!");
});

// ---------- ANIMAÇÃO POPUP “+1 ADICIONADO” ----------
function mostrarPopup(texto) {
  const pop = document.createElement("div");
  pop.className = "add-popup";
  pop.textContent = texto;
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 1000);
}

function animarBotao(btn) {
  btn.classList.add("clicked");
  setTimeout(() => btn.classList.remove("clicked"), 200);
}

// ---------- CONTAGEM REGRESSIVA ----------
function atualizarContagem() {
  const agora = new Date();
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  const diff = fim - agora;
  if (diff <= 0) {
    document.getElementById("timer").textContent = "00:00:00";
    return;
  }
  const h = Math.floor(diff / 1000 / 60 / 60);
  const m = Math.floor((diff / 1000 / 60) % 60);
  const s = Math.floor((diff / 1000) % 60);
  document.getElementById("timer").textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
setInterval(atualizarContagem, 1000);
atualizarContagem();

// ---------- STATUS ABERTO/FECHADO ----------
function atualizarStatus() {
  const agora = new Date();
  const d = agora.getDay();
  const h = agora.getHours();
  const m = agora.getMinutes();
  let aberto = false, msg = "";

  if (d === 2) msg = "❌ Fechado — abrimos amanhã às 18h";
  else if ([1,3,4].includes(d)) {
    aberto = h >= 18 && (h < 23 || (h === 23 && m <= 15));
    msg = aberto ? "🟢 Aberto até 23h15" : "🔴 Fechado — abrimos às 18h";
  }
  else if ([5,6,0].includes(d)) {
    aberto = h >= 17 && (h < 23 || (h === 23 && m <= 30));
    msg = aberto ? "🟢 Aberto até 23h30" : "🔴 Fechado — abrimos às 17h30";
  }
  statusBanner.textContent = msg;
  statusBanner.className = aberto ? "status-banner aberto" : "status-banner fechado";
}
setInterval(atualizarStatus, 60000);
atualizarStatus();

// ---------- MAPA (SEGURANÇA EXTRA) ----------
document.addEventListener("DOMContentLoaded", () => {
  if (window.L && document.getElementById("mapa-entregas")) {
    try {
      const mapa = L.map("mapa-entregas", {
        center: [-18.5783, -46.5187],
        zoom: 13,
        scrollWheelZoom: true,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { attribution: "" }).addTo(mapa);
      L.circle([-18.5783, -46.5187], {
        radius: 6000,
        color: "#d4af37",
        fillColor: "#ffd700",
        fillOpacity: 0.25,
        weight: 2,
      }).addTo(mapa);
      L.marker([-18.5783, -46.5187])
        .addTo(mapa)
        .bindPopup("<b>🍔 DFL</b><br>Entregamos em toda Patos de Minas 💛")
        .openPopup();
    } catch (err) {
      console.warn("Erro ao iniciar mapa:", err);
    }
  }
});

// ---------- AJUSTE MOBILE ----------
function ajustarCarrinhoMobile() {
  if (window.innerWidth <= 768) {
    miniCart.style.height = "85vh";
    miniCart.style.bottom = "0";
    miniCart.style.top = "auto";
    miniCart.style.borderRadius = "20px 20px 0 0";
  } else {
    miniCart.style.height = "";
    miniCart.style.top = "";
    miniCart.style.borderRadius = "";
  }
}
ajustarCarrinhoMobile();
window.addEventListener("resize", ajustarCarrinhoMobile);
cartBackdrop.addEventListener("touchstart", fecharCarrinho);