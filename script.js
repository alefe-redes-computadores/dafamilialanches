/* ==========================================================
   🍔 Da Família Lanches — DFL v3.8.3 ESTÁVEL
   🔧 Correções principais:
   - Login via Google corrigido (popup seguro)
   - Eventos de clique restaurados
   - Fechamento externo sem bug instantâneo
   - Som apenas na finalização do pedido
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DFL v3.8.3 carregado com sucesso!");

  /* ------------------ 🔊 SOM AO FINALIZAR ------------------ */
  const soundFinalizar = new Audio("click-finalizar.wav");

  /* ------------------ ⚙️ VARIÁVEIS GLOBAIS ------------------ */
  let cart = [];
  let currentUser = null;
  let firebaseInitialized = false;

  /* ------------------ ⚡ FUNÇÕES ÚTEIS ------------------ */
  const safe = (fn) => (...args) => {
    try {
      fn(...args);
    } catch (err) {
      console.error("Erro:", err);
    }
  };

  const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;

  /* ------------------ 🔥 FIREBASE CONFIG ------------------ */
  const firebaseConfig = {
    apiKey: "AIzaSyEXEMPLO",
    authDomain: "dafamilialanches.firebaseapp.com",
    projectId: "dafamilialanches",
    storageBucket: "dafamilialanches.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  firebaseInitialized = true;

  /* ------------------ 👤 LOGIN GOOGLE ------------------ */
  const provider = new firebase.auth.GoogleAuthProvider();
  const googleBtn = document.getElementById("google-login");

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      try {
        console.log("Tentando login com Google...");
        const result = await auth.signInWithPopup(provider);
        currentUser = result.user;
        console.log("✅ Login bem-sucedido:", currentUser.displayName);
        alert("Login realizado com sucesso!");
        document.querySelector(".login-close")?.click();
      } catch (error) {
        console.warn("❌ Falha no login:", error.message);
        alert("Erro ao fazer login. Tente novamente.");
      }
    });
  }

  auth.onAuthStateChanged((user) => {
    currentUser = user;
    const userBtn = document.getElementById("user-btn");
    if (userBtn) {
      userBtn.textContent = user
        ? `Olá, ${user.displayName || "Usuário"}`
        : "Entrar / Cadastrar";
    }
  });

  /* ------------------ 📦 FINALIZAR PEDIDO ------------------ */
  const btnFinalizar = document.getElementById("btn-finalizar-pedido");
  if (btnFinalizar) {
    btnFinalizar.addEventListener("click", safe(() => {
      try { soundFinalizar.play(); } catch (_) {}
      alert("Pedido finalizado com sucesso!");
    }));
  }

  /* ------------------ 🪟 CONTROLE DE MODAIS ------------------ */
  const backdrop = document.getElementById("cart-backdrop");
  const modais = document.querySelectorAll(".modal, .mini-cart, .pedidos-panel, .recompensas-panel");

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    closeAllModals();
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("active");
    if (backdrop) backdrop.style.display = "block";
  }

  function closeAllModals() {
    modais.forEach((m) => {
      m.classList.remove("active");
      m.setAttribute("aria-hidden", "true");
    });
    if (backdrop) backdrop.style.display = "none";
  }

  document.querySelectorAll(".extras-close, .promo-close, .combo-close, .login-close, .fechar-pedidos, .fechar-recompensas")
    .forEach((btn) => btn.addEventListener("click", closeAllModals));

  if (backdrop) backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeAllModals();
  });

  console.log("✅ Bloco 1/5 carregado");
});
/* ==========================================================
   🛒 BLOCO 2/5 — CARRINHO E FRETE (PLACEHOLDER VISUAL)
   ========================================================== */

/* ------------------ 🧮 FUNÇÕES DO CARRINHO ------------------ */
function atualizarCarrinhoUI() {
  const cartList = document.querySelector(".mini-list");
  const totalEl = document.getElementById("cart-total");
  if (!cartList) return;

  cartList.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    cartList.innerHTML = `<p style="text-align:center;color:#666;margin:10px 0;">Seu carrinho está vazio 😢</p>`;
    if (totalEl) totalEl.textContent = "R$ 0,00";
    return;
  }

  cart.forEach((item, index) => {
    total += item.price * item.qty;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div class="item-info">
        <strong>${item.name}</strong><br>
        <span>${money(item.price)} x ${item.qty}</span>
      </div>
      <button class="remove-item" data-index="${index}">✖</button>
    `;
    cartList.appendChild(div);
  });

  if (totalEl) totalEl.textContent = money(total);
}

/* ------------------ ➕ ADICIONAR AO CARRINHO ------------------ */
document.querySelectorAll(".add-cart").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".card");
    const name = card?.dataset.name;
    const price = parseFloat(card?.dataset.price || 0);

    if (!name || !price) return;

    const existente = cart.find((i) => i.name === name);
    if (existente) existente.qty++;
    else cart.push({ name, price, qty: 1 });

    atualizarCarrinhoUI();
    openModal("mini-cart");
  });
});

/* ------------------ ❌ REMOVER ITEM ------------------ */
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-item")) {
    const index = e.target.dataset.index;
    cart.splice(index, 1);
    atualizarCarrinhoUI();
  }
});

/* ------------------ 🚚 FRETE PLACEHOLDER ------------------ */
const cepInput = document.getElementById("cep-input");
const btnFrete = document.getElementById("btn-calcular-frete");
const freteResultado = document.getElementById("frete-resultado");

if (btnFrete && cepInput && freteResultado) {
  btnFrete.addEventListener("click", () => {
    const cep = cepInput.value.trim();
    if (!cep) {
      freteResultado.textContent = "Informe um CEP válido.";
      freteResultado.style.color = "#d32f2f";
      return;
    }
    freteResultado.textContent = "🚧 Em breve: cálculo automático de frete!";
    freteResultado.style.color = "#444";
  });
}

/* ------------------ 🏠 PLACEHOLDER ENDEREÇO AUTOMÁTICO ------------------ */
const enderecoAuto = document.getElementById("endereco-auto");
if (enderecoAuto) {
  enderecoAuto.value = "🔜 Função automática de endereço em breve!";
  enderecoAuto.disabled = true;
  enderecoAuto.style.opacity = "0.8";
  enderecoAuto.style.cursor = "not-allowed";
}

console.log("✅ Bloco 2/5 carregado");
/* ==========================================================
   🎟️ BLOCO 3/5 — CUPONS, FIDELIDADE E PEDIDOS
   ========================================================== */

/* ------------------ 🎫 CUPONS DE DESCONTO ------------------ */
const couponForm = document.getElementById("coupon-form");
const couponInput = document.getElementById("coupon-input");
const couponMessage = document.getElementById("coupon-message");
const discountRow = document.getElementById("coupon-discount-row");
const discountValue = document.getElementById("cart-discount");

let appliedCoupon = null;

const couponsAtivos = {
  DFL10: { tipo: "percentual", valor: 10 },
  FAM20: { tipo: "valor", valor: 20 },
  FRETEGRATIS: { tipo: "frete", valor: 0 }
};

if (couponForm) {
  couponForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = couponInput.value.trim().toUpperCase();

    if (!code) {
      couponMessage.textContent = "Digite um código de cupom!";
      couponMessage.style.color = "#d32f2f";
      return;
    }

    const cupom = couponsAtivos[code];
    if (!cupom) {
      couponMessage.textContent = "Cupom inválido 😢";
      couponMessage.style.color = "#d32f2f";
      discountRow.style.display = "none";
      appliedCoupon = null;
      return;
    }

    appliedCoupon = cupom;
    couponMessage.textContent = "✅ Cupom aplicado com sucesso!";
    couponMessage.style.color = "#388e3c";
    discountRow.style.display = "flex";

    let desconto = 0;
    const subtotal = cart.reduce((acc, i) => acc + i.price * i.qty, 0);

    if (cupom.tipo === "percentual") desconto = subtotal * (cupom.valor / 100);
    if (cupom.tipo === "valor") desconto = cupom.valor;
    if (cupom.tipo === "frete") desconto = 0;

    discountValue.textContent = `- ${money(desconto)}`;
  });
}

/* ------------------ 🏆 SISTEMA DE FIDELIDADE ------------------ */
const contadorValor = document.getElementById("contador-valor");
const progressoBar = document.getElementById("progresso-bar");
const progressoMsg = document.getElementById("progresso-mensagem");
let contadorPedidos = 0;

function atualizarFidelidadeUI() {
  if (!contadorValor || !progressoBar || !progressoMsg) return;

  contadorValor.textContent = contadorPedidos;
  const percent = Math.min((contadorPedidos / 5) * 100, 100);
  progressoBar.style.width = `${percent}%`;

  if (contadorPedidos >= 5) {
    progressoMsg.textContent = "🎉 Parabéns! Você desbloqueou uma recompensa!";
    progressoMsg.style.color = "#388e3c";
  } else {
    const faltam = 5 - contadorPedidos;
    progressoMsg.textContent = `Faltam ${faltam} pedidos para desbloquear!`;
    progressoMsg.style.color = "#555";
  }
}

function registrarPedido() {
  contadorPedidos++;
  atualizarFidelidadeUI();
}

/* ------------------ 📦 MEUS PEDIDOS ------------------ */
const painelPedidos = document.getElementById("painelPedidos");
const listaPedidos = document.getElementById("listaPedidos");

function renderizarPedidos() {
  if (!listaPedidos) return;
  listaPedidos.innerHTML = "";

  if (cart.length === 0) {
    listaPedidos.innerHTML = `<p class="empty-orders">Seu histórico está vazio 😢</p>`;
    return;
  }

  cart.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "pedido-item";
    div.innerHTML = `
      <p><strong>${item.name}</strong> — ${item.qty}x (${money(item.price)})</p>
      <small>Pedido #${i + 1}</small>
    `;
    listaPedidos.appendChild(div);
  });
}

document.querySelector(".meus-pedidos-btn")?.addEventListener("click", () => {
  openModal("painelPedidos");
  renderizarPedidos();
});

console.log("✅ Bloco 3/5 carregado");
/* ==========================================================
   🕓 BLOCO 4/5 — PROMOÇÕES, CARROSSEL E HORÁRIO
   ========================================================== */

/* ------------------ 🎉 PROMOÇÕES ATIVAS ------------------ */
const promoArea = document.getElementById("promo-area");
if (promoArea) {
  promoArea.innerHTML = `
    <div class="promo-card">
      <strong>🔥 Combo Família Tradicional + Kuat 2L</strong>
      <span>De <s>R$ 74,99</s> por <b>R$ 59,99</b></span>
    </div>
    <div class="promo-card">
      <strong>🎁 4 Trembão + Fanta 1L</strong>
      <span>De <s>R$ 77,00</s> por <b>R$ 59,99</b></span>
    </div>
  `;
}

/* ------------------ 🖼️ CARROSSEL DE IMAGENS ------------------ */
const slides = document.querySelectorAll(".slide");
let slideIndex = 0;

function mostrarSlide(index) {
  slides.forEach((slide, i) => {
    slide.style.display = i === index ? "block" : "none";
  });
}

function proximoSlide() {
  slideIndex = (slideIndex + 1) % slides.length;
  mostrarSlide(slideIndex);
}

if (slides.length > 0) {
  mostrarSlide(slideIndex);
  setInterval(proximoSlide, 5000);
}

/* ------------------ ⏰ HORÁRIO DE FUNCIONAMENTO ------------------ */
const barraStatus = document.getElementById("status-bar");
const barraContagem = document.getElementById("countdown-bar");

function atualizarHorario() {
  const agora = new Date();
  const hora = agora.getHours();
  const minutos = agora.getMinutes();

  const horaAbertura = 18; // 18h = 6 da tarde
  const horaFechamento = 23; // 23h = 11 da noite

  if (hora >= horaAbertura && hora < horaFechamento) {
    if (barraStatus) {
      barraStatus.textContent = "🟢 Estamos Abertos!";
      barraStatus.style.background = "#4caf50";
    }
    if (barraContagem) barraContagem.textContent = "";
  } else {
    let horasRestantes = 0;
    let minutosRestantes = 0;

    if (hora < horaAbertura) {
      horasRestantes = horaAbertura - hora - 1;
      minutosRestantes = 60 - minutos;
    } else {
      horasRestantes = 24 - hora + horaAbertura - 1;
      minutosRestantes = 60 - minutos;
    }

    const tempo = `${String(horasRestantes).padStart(2, "0")}:${String(minutosRestantes).padStart(2, "0")}`;
    if (barraStatus) {
      barraStatus.textContent = "🔴 Estamos Fechados";
      barraStatus.style.background = "#d32f2f";
    }
    if (barraContagem) {
      barraContagem.textContent = `⏰ Abriremos em ${tempo}h`;
      barraContagem.style.background = "#444";
    }
  }
}

setInterval(atualizarHorario, 60000);
atualizarHorario();

console.log("✅ Bloco 4/5 carregado");
/* ==========================================================
   🧩 BLOCO 5/5 — EVENTOS, BACKDROP E SEGURANÇA
   ========================================================== */

/* ------------------ 🔒 FECHAR MODAIS CORRETAMENTE ------------------ */
const backdrop = document.getElementById("modal-backdrop");
const modais = document.querySelectorAll(".modal");

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.classList.add("active");
  if (backdrop) {
    backdrop.classList.add("active");
    backdrop.style.pointerEvents = "auto";
  }
  document.body.style.overflow = "hidden";
}

function closeModal(modal) {
  modal.classList.remove("active");
  if (backdrop) {
    backdrop.classList.remove("active");
    backdrop.style.pointerEvents = "none";
  }
  document.body.style.overflow = "";
}

/* Fecha ao clicar fora do modal */
if (backdrop) {
  backdrop.addEventListener("click", (e) => {
    e.stopPropagation();
    modais.forEach((modal) => {
      if (modal.classList.contains("active")) closeModal(modal);
    });
  });
}

/* Fecha no botão X */
document.addEventListener("click", (e) => {
  if (e.target.closest(".fechar-modal")) {
    const modal = e.target.closest(".modal");
    if (modal) closeModal(modal);
  }
});

/* ------------------ 🖱️ SEGURANÇA DE CLIQUES ------------------ */
// Impede fechamento instantâneo: só o clique real fora do modal conta.
document.addEventListener("mousedown", (e) => {
  if (backdrop && backdrop.classList.contains("active")) {
    const insideModal = e.target.closest(".modal");
    if (!insideModal && e.target === backdrop) {
      modais.forEach((m) => m.classList.remove("active"));
      backdrop.classList.remove("active");
      document.body.style.overflow = "";
    }
  }
});

/* ------------------ ✅ INICIALIZAÇÃO FINAL ------------------ */
document.addEventListener("DOMContentLoaded", () => {
  atualizarCarrinhoUI();
  atualizarHorario();
  atualizarFidelidadeUI();
  console.log("🚀 DFL v3.8.3 totalmente carregado e estável!");
});