document.addEventListener("DOMContentLoaded", () => {
// ===============================
// 🔧 CONFIGURAÇÃO INICIAL
// ===============================
const sound = new Audio("click.wav");
const cart = [];
const cartCount = document.getElementById("cart-count");
const miniCart = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");
const extrasModal = document.getElementById("extras-modal");
const extrasList = document.getElementById("extras-list");
const extrasAdd = document.getElementById("extras-add");
const loginModal = document.getElementById("login-modal");

// ===============================
// 🔔 SOM DE CLIQUE
// ===============================
document.addEventListener("click", () => sound.play());

// ===============================
// 🕒 STATUS DE FUNCIONAMENTO
// ===============================
function atualizarStatus() {
  const banner = document.getElementById("status-banner");
  const agora = new Date();
  const dia = agora.getDay();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();

  let aberto = false;
  if (dia >= 1 && dia <= 4) {
    aberto = hora >= 18 && (hora < 23 || (hora === 23 && minuto <= 15));
  } else if (dia >= 5 && dia <= 0) {
    aberto = hora >= 17 && (hora < 23 || (hora === 23 && minuto <= 30));
  }

  banner.textContent = aberto
    ? "✅ Estamos abertos! Faça seu pedido 🍔"
    : "⏰ Fechado no momento — Voltamos em breve!";
  banner.style.background = aberto ? "#00c853" : "#ff3d00";
}
setInterval(atualizarStatus, 60000);
atualizarStatus();

// ===============================
// ⏳ CONTAGEM REGRESSIVA
// ===============================
function atualizarTimer() {
  const agora = new Date();
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  const diff = fim - agora;
  if (diff <= 0) return (document.getElementById("timer").textContent = "00:00:00");
  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  document.getElementById("timer").textContent = `${h}:${m}:${s}`;
}
setInterval(atualizarTimer, 1000);
atualizarTimer();

// ===============================
// 🛒 CARRINHO
// ===============================
const openCartBtn = document.getElementById("cart-icon");
openCartBtn.addEventListener("click", () => {
  miniCart.classList.toggle("active");
  cartBackdrop.classList.toggle("show");
  document.body.classList.toggle("no-scroll");
});
cartBackdrop.addEventListener("click", () => {
  miniCart.classList.remove("active");
  cartBackdrop.classList.remove("show");
  document.body.classList.remove("no-scroll");
});

function atualizarCarrinho() {
  const lista = document.querySelector(".mini-list");
  lista.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    lista.innerHTML = `<p class="empty-cart">Seu carrinho está vazio 😢</p>`;
  } else {
    cart.forEach((item, i) => {
      const li = document.createElement("div");
      li.className = "cart-item";
      li.innerHTML = `
        <span>${item.nome} x${item.qtd}</span>
        <strong>R$ ${(item.preco * item.qtd).toFixed(2)}</strong>
        <div>
          <button class="qty-dec" data-i="${i}">−</button>
          <button class="qty-inc" data-i="${i}">+</button>
          <button class="remove-item" data-i="${i}">🗑</button>
        </div>`;
      lista.appendChild(li);
      total += item.preco * item.qtd;
    });
  }

  cartCount.textContent = cart.length;
  document.querySelector(".mini-foot").innerHTML = `
    <button id="close-order" class="btn-primary">Fechar Pedido (R$ ${total.toFixed(2)})</button>
    <button id="clear-cart" class="btn-secondary">Limpar</button>
  `;

  document.querySelectorAll(".qty-inc").forEach(b =>
    b.addEventListener("click", e => {
      const i = e.target.dataset.i;
      cart[i].qtd++;
      atualizarCarrinho();
    })
  );
  document.querySelectorAll(".qty-dec").forEach(b =>
    b.addEventListener("click", e => {
      const i = e.target.dataset.i;
      if (cart[i].qtd > 1) cart[i].qtd--;
      atualizarCarrinho();
    })
  );
  document.querySelectorAll(".remove-item").forEach(b =>
    b.addEventListener("click", e => {
      cart.splice(e.target.dataset.i, 1);
      atualizarCarrinho();
    })
  );

  document.getElementById("clear-cart").onclick = () => {
    cart.length = 0;
    atualizarCarrinho();
  };
  document.getElementById("close-order").onclick = () => {
    const texto = encodeURIComponent(
      "🍔 Pedido DFL:\n" +
        cart.map(i => `• ${i.nome} x${i.qtd}`).join("\n") +
        `\n\nTotal: R$ ${total.toFixed(2)}`
    );
    window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");
  };
}

// ===============================
// ➕ ADICIONAR AO CARRINHO
// ===============================
document.querySelectorAll(".add-cart").forEach(btn =>
  btn.addEventListener("click", e => {
    const card = e.target.closest(".card");
    const nome = card.dataset.name;
    const preco = parseFloat(card.dataset.price);
    const existente = cart.find(i => i.nome === nome);
    if (existente) existente.qtd++;
    else cart.push({ nome, preco, qtd: 1 });
    atualizarCarrinho();

    const pop = document.createElement("div");
    pop.className = "popup-add";
    pop.textContent = `${nome} adicionado!`;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 1400);
  })
);

// ===============================
// ⚙️ ADICIONAIS
// ===============================
const adicionais = [
  { nome: "Cebola", preco: 0.99 },
  { nome: "Salada", preco: 1.99 },
  { nome: "Ovo", preco: 1.99 },
  { nome: "Bacon", preco: 2.99 },
  { nome: "Hambúrguer Tradicional 56g", preco: 2.99 },
  { nome: "Cheddar Cremoso", preco: 3.99 },
  { nome: "Filé de Frango", preco: 5.99 },
  { nome: "Hambúrguer Artesanal 120g", preco: 7.99 }
];

document.querySelectorAll(".extras-btn").forEach(btn =>
  btn.addEventListener("click", e => {
    const card = e.target.closest(".card");
    extrasModal.dataset.produto = card.dataset.name;
    extrasList.innerHTML = adicionais
      .map(
        (a, i) => `
        <label>
          <span>${a.nome} — R$ ${a.preco.toFixed(2)}</span>
          <input type="checkbox" value="${i}">
        </label>`
      )
      .join("");
    extrasModal.classList.add("show");
    document.body.classList.add("no-scroll");
  })
);

document.querySelectorAll(".extras-close").forEach(btn =>
  btn.addEventListener("click", () => {
    extrasModal.classList.remove("show");
    document.body.classList.remove("no-scroll");
  })
);

extrasAdd.addEventListener("click", () => {
  const nome = extrasModal.dataset.produto;
  const selecionados = [...extrasList.querySelectorAll("input:checked")];
  if (selecionados.length) {
    selecionados.forEach(c => {
      const extra = adicionais[c.value];
      cart.push({ nome: `${nome} + ${extra.nome}`, preco: extra.preco, qtd: 1 });
    });
  }
  extrasModal.classList.remove("show");
  document.body.classList.remove("no-scroll");
  atualizarCarrinho();
});

// ===============================
// 🖼️ CARROSSEL
// ===============================
const slides = document.querySelector(".slides");
document.querySelector(".c-prev").onclick = () => (slides.scrollLeft -= 320);
document.querySelector(".c-next").onclick = () => (slides.scrollLeft += 320);

document.querySelectorAll(".slide").forEach(img => {
  img.addEventListener("click", () => {
    const msg = encodeURIComponent(img.dataset.wa);
    window.open(`https://wa.me/5534997178336?text=${msg}`, "_blank");
  });
});

// ===============================
// 🔐 LOGIN (VISUAL + GOOGLE)
// ===============================
const userBtn = document.createElement("button");
userBtn.id = "user-btn";
userBtn.className = "user-button";
userBtn.textContent = "Entrar / Cadastrar";
document.querySelector(".header").appendChild(userBtn);

userBtn.addEventListener("click", () => {
  loginModal.classList.add("show");
  document.body.classList.add("no-scroll");
});
document.querySelector(".login-x").addEventListener("click", () => {
  loginModal.classList.remove("show");
  document.body.classList.remove("no-scroll");
});
}); // 🔚 DOMContentLoaded