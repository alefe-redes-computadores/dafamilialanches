// ======================
// DFL – Da Família Lanches 🍔
// Script principal
// ======================

// Elementos principais
const cartBtn = document.getElementById("cart-icon");
const miniCart = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");
const cartList = document.getElementById("mini-list");
const cartCount = document.getElementById("cart-count");
const clearCartBtn = document.getElementById("mini-clear");
const finishOrderBtn = document.getElementById("mini-checkout");
const closeCartBtn = document.querySelector(".mini-close");

let cart = [];

// ======================
// Funções do Carrinho
// ======================
function atualizarCarrinho() {
  cartList.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    const li = document.createElement("li");
    li.classList.add("cart-item");
    li.innerHTML = `
      <span>${item.nome}</span>
      <strong>R$ ${item.preco.toFixed(2)}</strong>
      <button class="remove-item" data-index="${index}">✕</button>
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
  abrirCarrinho();
  mostrarPopupAdicionado();
}

function removerDoCarrinho(index) {
  cart.splice(index, 1);
  atualizarCarrinho();
}

function limparCarrinho() {
  cart = [];
  atualizarCarrinho();
}

function abrirCarrinho() {
  miniCart.classList.add("active");
  cartBackdrop.classList.add("show");
  document.body.style.overflow = "hidden";
}

function fecharCarrinho() {
  miniCart.classList.remove("active");
  cartBackdrop.classList.remove("show");
  document.body.style.overflow = "";
}

// ======================
// Eventos do Carrinho
// ======================
cartBtn.addEventListener("click", abrirCarrinho);
cartBackdrop.addEventListener("click", fecharCarrinho);
closeCartBtn.addEventListener("click", fecharCarrinho);
clearCartBtn.addEventListener("click", limparCarrinho);

cartList.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-item")) {
    const index = e.target.dataset.index;
    removerDoCarrinho(index);
  }
});

// ======================
// Adicionar produtos
// ======================
document.querySelectorAll(".add-cart").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".card");
    const nome = card.dataset.name;
    const preco = parseFloat(card.dataset.price);
    adicionarAoCarrinho(nome, preco);
  });
});

// ======================
// Popup “+1 Adicionado!”
// ======================
function mostrarPopupAdicionado() {
  const popup = document.createElement("div");
  popup.className = "popup-add";
  popup.textContent = "+1 adicionado!";
  document.body.appendChild(popup);

  setTimeout(() => popup.remove(), 1400);
}
// ======================
// Modal de Adicionais
// ======================
const extrasBackdrop = document.getElementById("extras-backdrop");
const extrasModal = document.getElementById("extras-modal");
const extrasList = document.getElementById("extras-list");
const extrasCancel = document.getElementById("extras-cancel");
const extrasAdd = document.getElementById("extras-add");
let extrasSelecionados = [];
let produtoAtual = null;

document.querySelectorAll(".extras-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    produtoAtual = btn.closest(".card");
    abrirExtras(produtoAtual.dataset.name);
  });
});

function abrirExtras(nomeProduto) {
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

extrasCancel.addEventListener("click", fecharExtras);
extrasBackdrop.addEventListener("click", fecharExtras);

function fecharExtras() {
  extrasModal.classList.remove("show");
  extrasBackdrop.classList.remove("show");
  extrasSelecionados = [];
}

extrasAdd.addEventListener("click", () => {
  const checkboxes = extrasList.querySelectorAll("input[type='checkbox']:checked");
  extrasSelecionados = Array.from(checkboxes).map((cb) => ({
    nome: cb.value,
    preco: parseFloat(cb.dataset.price),
  }));

  let totalExtras = 0;
  extrasSelecionados.forEach((x) => (totalExtras += x.preco));

  if (produtoAtual) {
    const nome = produtoAtual.dataset.name + " (com adicionais)";
    const precoBase = parseFloat(produtoAtual.dataset.price);
    adicionarAoCarrinho(nome, precoBase + totalExtras);
  }

  fecharExtras();
});

// ======================
// Contagem regressiva das promoções
// ======================
function atualizarContagem() {
  const agora = new Date();
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  const diff = fim - agora;

  if (diff <= 0) {
    document.getElementById("timer").textContent = "00:00:00";
    return;
  }

  const horas = Math.floor(diff / 1000 / 60 / 60);
  const minutos = Math.floor((diff / 1000 / 60) % 60);
  const segundos = Math.floor((diff / 1000) % 60);

  document.getElementById("timer").textContent = `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}
setInterval(atualizarContagem, 1000);
atualizarContagem();

// ======================
// Status de funcionamento
// ======================
function atualizarStatus() {
  const banner = document.getElementById("status-banner");
  const agora = new Date();
  const dia = agora.getDay(); // 0=Dom, 1=Seg, 2=Ter, ...
  const hora = agora.getHours();
  const minuto = agora.getMinutes();

  let aberto = false;
  let msg = "";

  if (dia === 2) {
    msg = "❌ Fechado — abrimos amanhã às 18h";
  } else if ([1, 3, 4].includes(dia)) {
    aberto = hora >= 18 && (hora < 23 || (hora === 23 && minuto <= 15));
    msg = aberto ? "🟢 Aberto até 23h15" : "🔴 Fechado — abrimos às 18h";
  } else if ([5, 6, 0].includes(dia)) {
    aberto = hora >= 17 && (hora < 23 || (hora === 23 && minuto <= 30));
    msg = aberto ? "🟢 Aberto até 23h30" : "🔴 Fechado — abrimos às 17h30";
  }

  banner.textContent = msg;
  banner.className = aberto ? "status-banner aberto" : "status-banner fechado";
}
setInterval(atualizarStatus, 60000);
atualizarStatus();
// ======================
// Mapa interativo – Patos de Minas
// ======================
document.addEventListener("DOMContentLoaded", () => {
  const mapaEl = document.getElementById("mapa-entregas");
  if (mapaEl && typeof L !== "undefined") {
    const mapa = L.map(mapaEl, {
      center: [-18.5783, -46.5187],
      zoom: 13,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "",
    }).addTo(mapa);

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
  }
});

// ======================
// Responsividade do carrinho (mobile)
// ======================
function ajustarCarrinhoMobile() {
  if (window.innerWidth <= 768) {
    miniCart.style.width = "100%";
    miniCart.style.height = "85vh";
    miniCart.style.bottom = "0";
    miniCart.style.top = "auto";
    miniCart.style.borderRadius = "16px 16px 0 0";
  } else {
    miniCart.style.width = "320px";
    miniCart.style.height = "100vh";
    miniCart.style.top = "0";
    miniCart.style.bottom = "";
    miniCart.style.borderRadius = "0";
  }
}
ajustarCarrinhoMobile();
window.addEventListener("resize", ajustarCarrinhoMobile);

// Fechar carrinho ao tocar fora no mobile
cartBackdrop.addEventListener("touchstart", fecharCarrinho);

// ======================
// Finalizar pedido – WhatsApp
// ======================
finishOrderBtn.addEventListener("click", () => {
  if (!cart.length) return alert("Seu carrinho está vazio!");

  let mensagem = "🧾 *Pedido – Da Família Lanches*%0A%0A";
  cart.forEach((item, i) => {
    mensagem += `${i + 1}x *${item.nome}* — R$ ${item.preco.toFixed(2)}%0A`;
  });

  const total = cart.reduce((sum, item) => sum + item.preco, 0);
  mensagem += `%0A💰 *Total:* R$ ${total.toFixed(2)}%0A%0A📍 Patos de Minas`;

  const numero = "5534997178336";
  const link = `https://wa.me/${numero}?text=${mensagem}`;
  window.open(link, "_blank");

  fecharCarrinho();
});

// ======================
// Inicialização final
// ======================
document.addEventListener("DOMContentLoaded", () => {
  atualizarCarrinho();
  atualizarContagem();
  atualizarStatus();
  ajustarCarrinhoMobile();
});