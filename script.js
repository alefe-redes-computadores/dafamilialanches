// ================== STATUS DE FUNCIONAMENTO ==================
function atualizarStatus() {
  const agora = new Date();
  const dia = agora.getDay(); // 0 = Domingo
  const hora = agora.getHours();
  const banner = document.getElementById("status-banner");

  let aberto = false;
  let msg = "";

  if (dia === 2) {
    msg = "🚫 Hoje (terça) estamos fechados. Voltamos amanhã!";
  } else if ((dia >= 1 && dia <= 4 && hora >= 18 && hora < 23) ||
             ((dia === 5 || dia === 6 || dia === 0) && hora >= 17 && hora < 23)) {
    aberto = true;
    msg = "✅ Estamos abertos! Faça seu pedido 💛";
  } else {
    const proximaAbertura = (dia === 2 ? "quarta às 18h" : "hoje às 18h");
    msg = `⏰ Fechado agora. Abrimos ${proximaAbertura}.`;
  }

  banner.textContent = msg;
}
setInterval(atualizarStatus, 30000);
atualizarStatus();


// ================== CONTAGEM REGRESSIVA PROMO ==================
function atualizarContagem() {
  const agora = new Date();
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);

  const diff = fim - agora;
  if (diff <= 0) {
    document.getElementById("timer").textContent = "00:00:00";
    return;
  }

  const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
  const m = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
  const s = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");

  document.getElementById("timer").textContent = `${h}:${m}:${s}`;
}
setInterval(atualizarContagem, 1000);
atualizarContagem();


// ================== CARROSSEL DE PROMOÇÕES ==================
const slides = document.querySelector(".slides");
const prevBtn = document.querySelector(".c-prev");
const nextBtn = document.querySelector(".c-next");
let scrollPos = 0;

if (slides) {
  prevBtn.addEventListener("click", () => slides.scrollBy({ left: -200, behavior: "smooth" }));
  nextBtn.addEventListener("click", () => slides.scrollBy({ left: 200, behavior: "smooth" }));

  slides.querySelectorAll(".slide").forEach(slide => {
    slide.addEventListener("click", () => {
      const msg = slide.getAttribute("data-wa");
      window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(msg)}`, "_blank");
    });
  });
}


// ================== CARRINHO ==================
let carrinho = [];

const cartIcon = document.getElementById("cart-icon");
const miniCart = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");
const cartCount = document.getElementById("cart-count");
const miniList = document.getElementById("mini-list");
const clearBtn = document.getElementById("mini-clear");
const checkoutBtn = document.getElementById("mini-checkout");

function atualizarCarrinho() {
  cartCount.textContent = carrinho.reduce((acc, item) => acc + item.qtd, 0);
  miniList.innerHTML = "";

  carrinho.forEach((item, i) => {
    const li = document.createElement("div");
    li.className = "mini-item";
    li.innerHTML = `
      <span>${item.qtd}x ${item.nome}</span>
      <button class="rm" data-i="${i}">✕</button>`;
    miniList.appendChild(li);
  });

  document.querySelectorAll(".rm").forEach(btn => {
    btn.addEventListener("click", e => {
      carrinho.splice(e.target.dataset.i, 1);
      atualizarCarrinho();
    });
  });
}

function abrirCarrinho() {
  miniCart.classList.add("active");
  cartBackdrop.classList.add("show");
}

function fecharCarrinho() {
  miniCart.classList.remove("active");
  cartBackdrop.classList.remove("show");
}

cartIcon.addEventListener("click", abrirCarrinho);
cartBackdrop.addEventListener("click", fecharCarrinho);
document.querySelector(".mini-close").addEventListener("click", fecharCarrinho);

clearBtn.addEventListener("click", () => {
  carrinho = [];
  atualizarCarrinho();
});

checkoutBtn.addEventListener("click", () => {
  if (carrinho.length === 0) return;
  const pedido = carrinho.map(i => `${i.qtd}x *${i.nome}*`).join(", ");
  const msg = `Olá! Gostaria de pedir: ${pedido}`;
  window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(msg)}`, "_blank");
});


// ================== BOTÕES ADICIONAR ==================
document.querySelectorAll(".add-cart").forEach(btn => {
  btn.addEventListener("click", e => {
    const card = e.target.closest(".card");
    const nome = card.dataset.name;
    const preco = parseFloat(card.dataset.price);

    const existente = carrinho.find(i => i.nome === nome);
    if (existente) existente.qtd++;
    else carrinho.push({ nome, preco, qtd: 1 });

    atualizarCarrinho();

    // animação do botão
    e.target.classList.add("clicked");
    setTimeout(() => e.target.classList.remove("clicked"), 200);
  });
});


// ================== MODAL DE ADICIONAIS ==================
const extrasModal = document.getElementById("extras-modal");
const extrasBackdrop = document.getElementById("extras-backdrop");
const extrasList = document.getElementById("extras-list");
const extrasAdd = document.getElementById("extras-add");
const extrasCancel = document.getElementById("extras-cancel");
const extrasClose = document.querySelector(".extras-close");
let itemAtual = null;

// lista fixa de adicionais
const adicionais = [
  { nome: "Cebola", preco: 0.99 },
  { nome: "Salada", preco: 1.99 },
  { nome: "Ovo", preco: 1.99 },
  { nome: "Salsicha", preco: 1.99 },
  { nome: "Bacon", preco: 2.99 },
  { nome: "Molho Verde", preco: 2.99 },
  { nome: "Hambúrguer Tradicional", preco: 2.99 },
  { nome: "Cheddar", preco: 3.99 },
  { nome: "Filé de Frango", preco: 6.99 },
  { nome: "Hambúrguer Artesanal 120g", preco: 7.99 }
];

function abrirExtras(card) {
  itemAtual = card;
  extrasList.innerHTML = "";
  adicionais.forEach(adc => {
    const div = document.createElement("label");
    div.innerHTML = `
      <span>${adc.nome}</span>
      <input type="number" min="0" max="5" value="0" step="1" data-nome="${adc.nome}" data-preco="${adc.preco}">
    `;
    extrasList.appendChild(div);
  });
  extrasModal.classList.add("active");
  extrasBackdrop.classList.add("show");
}

function fecharExtras() {
  extrasModal.classList.remove("active");
  extrasBackdrop.classList.remove("show");
}

document.querySelectorAll(".extras-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    const card = e.target.closest(".card");
    abrirExtras(card);
  });
});

extrasAdd.addEventListener("click", () => {
  if (!itemAtual) return;
  const nome = itemAtual.dataset.name;
  const preco = parseFloat(itemAtual.dataset.price);
  const adicionaisSelecionados = [];

  extrasList.querySelectorAll("input").forEach(inp => {
    if (inp.value > 0) {
      adicionaisSelecionados.push(`${inp.value}x ${inp.dataset.nome}`);
    }
  });

  const item = {
    nome,
    preco,
    qtd: 1,
    adicionais: adicionaisSelecionados
  };

  carrinho.push(item);
  atualizarCarrinho();
  fecharExtras();
});

extrasCancel.addEventListener("click", fecharExtras);
extrasClose.addEventListener("click", fecharExtras);
extrasBackdrop.addEventListener("click", fecharExtras);