/* ================================
   DFL – Script principal (corrigido)
   ================================ */

/* 🔊 Som global */
const clickSound = new Audio("click.wav");
clickSound.volume = 0.4;

/* ========= Elementos principais ========= */
const cartBtn = document.getElementById("cart-icon");
const miniCart = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");
const cartList = document.getElementById("mini-list");
const cartCount = document.getElementById("cart-count");
const clearCartBtn = document.getElementById("mini-clear");
const finishOrderBtn = document.getElementById("mini-checkout");
const closeCartBtn = document.querySelector(".mini-close");

let cart = JSON.parse(localStorage.getItem("dflCart") || "[]");

/* ========= Controle do carrinho ========= */
function abrirCarrinho() {
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
  miniCart.classList.add("active");
  cartBackdrop.classList.add("show");
  document.body.classList.add("no-scroll");
}
function fecharCarrinho() {
  miniCart.classList.remove("active");
  cartBackdrop.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

/* ========= Atualização e persistência ========= */
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
  localStorage.setItem("dflCart", JSON.stringify(cart));
}

/* ========= Ações ========= */
function adicionarAoCarrinho(nome, preco) {
  cart.push({ nome, preco });
  atualizarCarrinho();
  mostrarPopupAdicionado(nome);
  if (!miniCart.classList.contains("active")) abrirCarrinho();
}
function removerDoCarrinho(index) {
  cart.splice(index, 1);
  atualizarCarrinho();
}
function limparCarrinho() {
  cart = [];
  atualizarCarrinho();
}

/* ========= Popup "+1 adicionado!" ========= */
function mostrarPopupAdicionado(nomeProduto = null) {
  const popup = document.createElement("div");
  popup.className = "popup-add";
  popup.textContent = nomeProduto ? `🍔 ${nomeProduto} adicionado!` : "+1 adicionado!";
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1400);
}

/* ========= Inicialização ========= */
document.addEventListener("DOMContentLoaded", () => {
  fecharCarrinho();
  atualizarCarrinho();

  cartBtn.addEventListener("click", abrirCarrinho);
  closeCartBtn.addEventListener("click", fecharCarrinho);
  cartBackdrop.addEventListener("click", fecharCarrinho);
  clearCartBtn.addEventListener("click", limparCarrinho);

  cartList.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-item")) {
      removerDoCarrinho(e.target.dataset.index);
    }
  });

  document.querySelectorAll(".add-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      adicionarAoCarrinho(card.dataset.name, parseFloat(card.dataset.price));
    });
  });
});

/* ========= Contagem regressiva ========= */
function atualizarContagem() {
  const agora = new Date();
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  const diff = fim - agora;
  if (diff <= 0) return (document.getElementById("timer").textContent = "00:00:00");
  const h = Math.floor(diff / 1000 / 60 / 60);
  const m = Math.floor((diff / 1000 / 60) % 60);
  const s = Math.floor((diff / 1000) % 60);
  document.getElementById("timer").textContent =
    `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
setInterval(atualizarContagem, 1000);
atualizarContagem();

/* ========= Status aberto/fechado ========= */
function atualizarStatus() {
  const banner = document.getElementById("status-banner");
  const agora = new Date();
  const dia = agora.getDay();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();
  let aberto = false;
  let msg = "";
  if (dia === 2) msg = "❌ Fechado — abrimos amanhã às 18h";
  else if ([1, 3, 4].includes(dia)) {
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

/* ========= Carrossel ========= */
(function initCarouselFix() {
  const container = document.querySelector("#promoCarousel .slides");
  const prevBtn  = document.querySelector("#promoCarousel .c-prev");
  const nextBtn  = document.querySelector("#promoCarousel .c-next");
  const slides   = Array.from(container.querySelectorAll(".slide"));
  let index = 0;
  if (slides.length === 0) return;
  function showSlide(i) {
    slides.forEach((s, idx) => (s.style.display = idx === i ? "block" : "none"));
  }
  showSlide(index);
  prevBtn.addEventListener("click", () => {
    clickSound.currentTime = 0;
    clickSound.play().catch(()=>{});
    index = (index - 1 + slides.length) % slides.length;
    showSlide(index);
  });
  nextBtn.addEventListener("click", () => {
    clickSound.currentTime = 0;
    clickSound.play().catch(()=>{});
    index = (index + 1) % slides.length;
    showSlide(index);
  });
  setInterval(() => {
    index = (index + 1) % slides.length;
    showSlide(index);
  }, 5000);
})();