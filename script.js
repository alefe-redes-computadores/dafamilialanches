// DFL v1.4.7 — correção total de modais e carrinho travando
document.addEventListener("DOMContentLoaded", () => {
/* =========================================
   ⚙️ BASE E SONS
========================================= */
const sound = new Audio("click.wav");
let cart = [];
let currentUser = null;
const money = n => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;
document.addEventListener("click", () => {
  try { sound.currentTime = 0; sound.play(); } catch (_) {}
});

/* =========================================
   🧩 ELEMENTOS PRINCIPAIS
========================================= */
const miniCart = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");
const cartCount = document.getElementById("cart-count");

/* =========================================
   💬 MODAIS — Sistema com delay de segurança
========================================= */
function closeModal(el) {
  el.classList.remove("show");
  document.body.classList.remove("no-scroll");
  setTimeout(() => el.style.display = "none", 150);
}

function openModal(el) {
  el.style.display = "flex";
  setTimeout(() => {
    el.classList.add("show");
    document.body.classList.add("no-scroll");
  }, 50);
}

/* Função auxiliar — ativa fechamento externo com delay */
function enableOutsideClose(modalSelector) {
  const modal = document.querySelector(modalSelector);
  if (!modal) return;
  let ativo = false;
  modal.addEventListener("transitionend", () => { ativo = modal.classList.contains("show"); });
  modal.addEventListener("click", (e) => {
    if (ativo && e.target === modal) closeModal(modal);
  });
}

/* =========================================
   🧀 MODAL DE ADICIONAIS
========================================= */
const extrasModal = document.getElementById("extras-modal");
const extrasList = extrasModal.querySelector(".extras-list");
const extrasConfirm = document.getElementById("extras-confirm");
const extrasCloseBtns = extrasModal.querySelectorAll(".extras-close");

const adicionais = [
  { nome: "Cebola", preco: 0.99 },
  { nome: "Salada", preco: 1.99 },
  { nome: "Ovo", preco: 1.99 },
  { nome: "Bacon", preco: 2.99 },
  { nome: "Hambúrguer Tradicional 56g", preco: 2.99 },
  { nome: "Cheddar Cremoso", preco: 3.99 },
  { nome: "Filé de Frango", preco: 5.99 },
  { nome: "Hambúrguer Artesanal 120g", preco: 7.99 },
];

function openExtrasFor(card) {
  const nomeProduto = card.dataset.name || "Produto";
  extrasList.innerHTML = adicionais.map((a, i) => `
    <label>
      <span>${a.nome} — ${money(a.preco)}</span>
      <input type="checkbox" value="${i}">
    </label>`).join("");
  extrasModal.dataset.produto = nomeProduto;
  openModal(extrasModal);
}

document.querySelectorAll(".extras-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    const card = e.currentTarget.closest(".card");
    if (!card) return;
    openExtrasFor(card);
  });
});

extrasConfirm?.addEventListener("click", () => {
  const produto = extrasModal.dataset.produto || "Produto";
  const selecionados = [...extrasList.querySelectorAll("input:checked")];
  if (!selecionados.length) { closeModal(extrasModal); return; }

  selecionados.forEach(c => {
    const extra = adicionais[+c.value];
    cart.push({ nome: `${produto} + ${extra.nome}`, preco: extra.preco, qtd: 1 });
  });

  renderMiniCart();
  popupAdd(`${produto} atualizado com adicionais!`);
  closeModal(extrasModal);
});

extrasCloseBtns.forEach(btn => btn.addEventListener("click", () => closeModal(extrasModal)));
enableOutsideClose("#extras-modal");

/* =========================================
   🥤 MODAL DE COMBOS (bebidas)
========================================= */
const comboModal = document.getElementById("combo-modal");
const comboBody = document.getElementById("combo-body");
const comboConfirm = document.getElementById("combo-confirm");

const comboDrinkOptions = {
  casal: [
    { rotulo: "Fanta 1L (padrão)", delta: 0.01 },
    { rotulo: "Coca 1L", delta: 3.01 },
    { rotulo: "Coca 1L Zero", delta: 3.01 },
  ],
  familia: [
    { rotulo: "Kuat 2L (padrão)", delta: 0.01 },
    { rotulo: "Coca 2L", delta: 5.01 },
  ],
};
let _comboCtx = null;

function openComboModal(nomeCombo, precoBase) {
  const lower = nomeCombo.toLowerCase();
  const grupo = lower.includes("casal")
    ? "casal"
    : lower.includes("família") || lower.includes("familia")
    ? "familia"
    : null;

  if (!grupo) { addCommonItem(nomeCombo, precoBase); return; }

  comboBody.innerHTML = comboDrinkOptions[grupo]
    .map((o, i) => `
      <label><span>${o.rotulo} — + ${money(o.delta)}</span>
      <input type="radio" name="combo-drink" value="${i}" ${i === 0 ? "checked" : ""}></label>`)
    .join("");
  _comboCtx = { nomeCombo, precoBase, grupo };
  openModal(comboModal);
}

enableOutsideClose("#combo-modal");
/* =========================================
   🛒 CARRINHO — versão flutuante e estável
========================================= */
function updateCartCount() {
  cartCount.textContent = cart.reduce((a, i) => a + i.qtd, 0);
}

function renderMiniCart() {
  const lista = document.querySelector(".mini-list");
  const foot = document.querySelector(".mini-foot");
  lista.innerHTML = "";
  let total = 0;

  if (!cart.length) {
    lista.innerHTML = `<p class="empty-cart">Seu carrinho está vazio 😢</p>`;
  } else {
    cart.forEach((item, i) => {
      total += item.preco * item.qtd;
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <span>${item.nome} x${item.qtd}</span>
        <strong>${money(item.preco * item.qtd)}</strong>
        <div class="cart-btns">
          <button class="qty-dec" data-i="${i}">−</button>
          <button class="qty-inc" data-i="${i}">+</button>
          <button class="remove-item" data-i="${i}">🗑</button>
        </div>`;
      lista.appendChild(row);
    });

    lista.querySelectorAll(".qty-inc").forEach(b =>
      b.addEventListener("click", e => {
        cart[+e.currentTarget.dataset.i].qtd++;
        renderMiniCart(); updateCartCount();
      })
    );
    lista.querySelectorAll(".qty-dec").forEach(b =>
      b.addEventListener("click", e => {
        const it = cart[+e.currentTarget.dataset.i];
        it.qtd = Math.max(1, it.qtd - 1);
        renderMiniCart(); updateCartCount();
      })
    );
    lista.querySelectorAll(".remove-item").forEach(b =>
      b.addEventListener("click", e => {
        cart.splice(+e.currentTarget.dataset.i, 1);
        renderMiniCart(); updateCartCount();
      })
    );
  }

  foot.innerHTML = `
    <button id="close-order" class="btn-primary">Fechar Pedido (${money(total)})</button>
    <button id="clear-cart" class="btn-secondary">Limpar</button>`;

  document.getElementById("clear-cart")?.addEventListener("click", () => {
    cart = []; renderMiniCart(); updateCartCount();
  });
  document.getElementById("close-order")?.addEventListener("click", fecharPedido);
  updateCartCount();
}

/* ========== ABRIR/FECHAR MINI-CARRINHO ========== */
const toggleCart = () => {
  miniCart.classList.toggle("active");
  cartBackdrop.classList.toggle("show");
  renderMiniCart();
};

document.getElementById("cart-icon")?.addEventListener("click", toggleCart);
cartBackdrop?.addEventListener("click", () => {
  miniCart.classList.remove("active");
  cartBackdrop.classList.remove("show");
});

window.addEventListener("scroll", () => {
  // Faz o carrinho “flutuar” visivelmente no canto, sem travar tela
  const fab = document.getElementById("cart-icon");
  if (window.scrollY > 500) fab.classList.add("floating");
  else fab.classList.remove("floating");
});

/* =========================================
   ➕ ADICIONAR AO CARRINHO
========================================= */
function addCommonItem(nome, preco) {
  const found = cart.find(i => i.nome === nome && i.preco === preco);
  if (found) found.qtd++;
  else cart.push({ nome, preco, qtd: 1 });
  renderMiniCart();
  popupAdd(`${nome} adicionado!`);
}

document.querySelectorAll(".add-cart").forEach(btn => {
  btn.addEventListener("click", e => {
    const card = e.currentTarget.closest(".card");
    if (!card) return;
    const nome = card.dataset.name || "Item";
    const preco = parseFloat(card.dataset.price || "0");

    if (/^combo/i.test(nome)) openComboModal(nome, preco);
    else addCommonItem(nome, preco);
  });
});

/* =========================================
   🖼️ CARROSSEL DE PROMOÇÕES
========================================= */
(() => {
  const slides = document.querySelector(".slides");
  const prev = document.querySelector(".c-prev");
  const next = document.querySelector(".c-next");
  if (!slides) return;
  prev?.addEventListener("click", () => slides.scrollLeft -= 320);
  next?.addEventListener("click", () => slides.scrollLeft += 320);
  document.querySelectorAll(".slide").forEach(img => {
    img.addEventListener("click", () => {
      const msg = encodeURIComponent(img.dataset.wa || "");
      if (msg) window.open(`https://wa.me/5534997178336?text=${msg}`, "_blank");
    });
  });
})();
/* =========================================
   🔥 FIREBASE + LOGIN / CONTA
========================================= */
const firebaseConfig = {
  apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
  authDomain: "da-familia-lanches.firebaseapp.com",
  projectId: "da-familia-lanches",
  storageBucket: "da-familia-lanches.appspot.com",
  messagingSenderId: "106857147317",
  appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
  measurementId: "G-TCZ18HFWGX",
};
if (window.firebase && !firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

/* ===== ELEMENTOS ===== */
const userBtn     = document.getElementById("user-btn");
const loginModal  = document.getElementById("login-modal");
const loginForm   = document.getElementById("login-form");
const googleBtn   = document.getElementById("google-login");

/* ===== Abrir/Fechar Login ===== */
function openLogin() {
  openModal(loginModal);
}
function closeLogin() {
  closeModal(loginModal);
}
userBtn?.addEventListener("click", openLogin);
loginModal?.addEventListener("click", e => { if (e.target === loginModal) closeLogin(); });

/* ===== Login por E-mail ===== */
loginForm?.addEventListener("submit", e => {
  e.preventDefault();
  const email = loginForm.querySelector('input[type="email"]').value.trim();
  const senha = loginForm.querySelector('input[type="password"]').value.trim();
  if (!email || !senha) return alert("Preencha e-mail e senha!");

  auth.signInWithEmailAndPassword(email, senha)
    .then((cred) => {
      currentUser = cred.user;
      userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
      closeLogin(); showOrdersFabIfLogged();
    })
    .catch(() => {
      auth.createUserWithEmailAndPassword(email, senha)
        .then((cred) => {
          currentUser = cred.user;
          alert("Conta criada com sucesso 🎉");
          userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
          closeLogin(); showOrdersFabIfLogged();
        })
        .catch(err => alert("Erro: " + err.message));
    });
});

/* ===== Login com Google ===== */
googleBtn?.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((res) => {
      currentUser = res.user;
      userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0] || "Cliente"}`;
      closeLogin(); showOrdersFabIfLogged();
    })
    .catch(err => alert("Erro no login Google: " + err.message));
});

auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
    showOrdersFabIfLogged();
  }
});

/* =========================================
   📦 PEDIDOS (Firestore)
========================================= */
function fecharPedido() {
  if (!cart.length) return alert("Carrinho vazio!");
  if (!currentUser) { alert("Faça login antes de enviar!"); openLogin(); return; }

  const total = cart.reduce((t, i) => t + i.preco * i.qtd, 0);
  const pedido = {
    usuario: currentUser.email,
    userId: currentUser.uid,
    nome: currentUser.displayName || currentUser.email.split("@")[0],
    itens: cart.map(i => `${i.nome} x${i.qtd}`),
    total: Number(total.toFixed(2)),
    data: new Date().toISOString(),
  };

  db.collection("Pedidos").add(pedido)
    .then(() => {
      alert("Pedido salvo ✅");
      const texto = encodeURIComponent(
        "🍔 *Pedido DFL*\n" +
        cart.map(i => `• ${i.nome} x${i.qtd}`).join("\n") +
        `\n\nTotal: ${money(total)}`
      );
      window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");
      cart = []; renderMiniCart();
    })
    .catch(err => alert("Erro ao salvar: " + err.message));
}

/* =========================================
   📜 “MEUS PEDIDOS”
========================================= */
const ordersFab = document.getElementById("orders-fab") || (() => {
  const b = document.createElement("button");
  b.id = "orders-fab";
  b.innerHTML = "📦 Meus Pedidos";
  document.body.appendChild(b);
  return b;
})();
let ordersPanel = document.querySelector(".orders-panel");
if (!ordersPanel) {
  ordersPanel = document.createElement("div");
  ordersPanel.className = "orders-panel";
  ordersPanel.innerHTML = `
    <div class="orders-head"><span>📦 Meus Pedidos</span><button class="orders-close">✖</button></div>
    <div class="orders-content" id="orders-content"><p class="empty-orders">Faça login para ver.</p></div>`;
  document.body.appendChild(ordersPanel);
}
ordersFab.addEventListener("click", () => {
  if (!currentUser) return alert("Faça login primeiro!");
  ordersPanel.classList.add("active");
  carregarPedidos();
});
ordersPanel.querySelector(".orders-close")?.addEventListener("click", () => ordersPanel.classList.remove("active"));

function showOrdersFabIfLogged() {
  if (currentUser) ordersFab.classList.add("show");
  else ordersFab.classList.remove("show");
}

function carregarPedidos() {
  const container = document.getElementById("orders-content");
  if (!container) return;
  container.innerHTML = `<p class="empty-orders">Carregando...</p>`;
  db.collection("Pedidos").where("usuario", "==", currentUser.email)
    .orderBy("data", "desc").get()
    .then(snapshot => {
      if (snapshot.empty) return container.innerHTML = `<p class="empty-orders">Nenhum pedido.</p>`;
      container.innerHTML = "";
      snapshot.forEach(doc => {
        const p = doc.data();
        const box = document.createElement("div");
        box.className = "order-item";
        box.innerHTML = `
          <h4>${new Date(p.data).toLocaleString("pt-BR")}</h4>
          <p><b>Itens:</b> ${Array.isArray(p.itens) ? p.itens.join(", ") : p.itens}</p>
          <p><b>Total:</b> ${money(p.total)}</p>`;
        container.appendChild(box);
      });
    });
}

/* =========================================
   🔔 POPUP DE ADIÇÃO
========================================= */
function popupAdd(msg) {
  const pop = document.createElement("div");
  pop.className = "popup-add";
  pop.textContent = msg || "Item adicionado!";
  document.body.appendChild(pop);
  setTimeout(() => pop.classList.add("show"), 50);
  setTimeout(() => {
    pop.classList.remove("show");
    setTimeout(() => pop.remove(), 300);
  }, 1800);
}

/* =========================================
   ⏳ TIMER + STATUS ABERTO/FECHADO
========================================= */
function atualizaStatus() {
  const agora = new Date();
  const hora = agora.getHours();
  const aberto = hora >= 18 && hora < 23;
  const status = document.getElementById("status-banner");
  const hours = document.querySelector(".hours-banner");

  if (status) {
    status.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!";
    status.className = `status-banner ${aberto ? "open" : "closed"}`;
  }

  if (hours) {
    if (aberto) {
      const restante = (23 - hora) * 60 - agora.getMinutes();
      const h = Math.floor(restante / 60);
      const m = restante % 60;
      hours.innerHTML = `⏰ Hoje até <b>23h00</b> — Faltam <b>${h}h ${m}min</b>`;
    } else {
      const faltam = hora < 18 ? (18 - hora) * 60 - agora.getMinutes() : (24 - hora + 18) * 60 - agora.getMinutes();
      const h = Math.floor(faltam / 60);
      const m = faltam % 60;
      hours.innerHTML = `🔒 Fechado — Abrimos em <b>${h}h ${m}min</b>`;
    }
  }
}
setInterval(atualizaStatus, 60000);
atualizaStatus();

/* =========================================
   ⏳ CONTAGEM REGRESSIVA PROMOÇÕES
========================================= */
function promoCountdown() {
  const agora = new Date();
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  const diff = fim - agora;
  const el = document.getElementById("promo-timer");
  if (!el) return;
  if (diff <= 0) return el.textContent = "00:00:00";
  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  el.textContent = `${h}:${m}:${s}`;
}
setInterval(promoCountdown, 1000);
promoCountdown();

/* =========================================
   ✅ LOG DE VERSÃO
========================================= */
console.log("%c🔥 DFL v1.4.7 — Modais e Carrinho Estáveis", "background:#000;color:#0f0;padding:6px;border-radius:6px;");
});