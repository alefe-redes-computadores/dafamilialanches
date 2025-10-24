// DFL v1.4.8 — Correções de Carrinho, Modais e Combos
document.addEventListener("DOMContentLoaded", () => {
/* =========================================
   ⚙️ BASE
========================================= */
const sound = new Audio("click.wav");
let cart = [];
let currentUser = null;
const money = n => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;

document.addEventListener("click", () => {
  try { sound.currentTime = 0; sound.play(); } catch (_) {}
});

/* =========================================
   🧩 ELEMENTOS BÁSICOS
========================================= */
const miniCart = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");
const cartCount = document.getElementById("cart-count");

/* =========================================
   💬 MODAIS — Adicionais, Combo e Login
========================================= */
function closeModal(el) {
  el.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

function openModal(el) {
  el.classList.add("show");
  document.body.classList.add("no-scroll");
}

/* ========== MODAL DE ADICIONAIS ========== */
let extrasModal = document.getElementById("extras-modal");
const extrasList = extrasModal.querySelector(".extras-list");
const extrasConfirm = document.getElementById("extras-confirm");
const extrasCloseBtns = extrasModal.querySelectorAll(".extras-close");

/* Lista fixa de adicionais */
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
  const nomeProduto = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Produto";
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

/* Fecha modal ao clicar no X ou fora */
extrasCloseBtns.forEach(btn => btn.addEventListener("click", () => closeModal(extrasModal)));
extrasModal.addEventListener("click", e => {
  if (e.target === extrasModal) closeModal(extrasModal);
});

/* =========================================
   🥤 MODAL DE BEBIDAS DOS COMBOS
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

  if (!grupo) {
    addCommonItem(nomeCombo, precoBase);
    return;
  }

  const opts = comboDrinkOptions[grupo];
  comboBody.innerHTML = opts
    .map(
      (o, i) => `
      <label>
        <input type="radio" name="combo-drink" value="${i}" ${i === 0 ? "checked" : ""}>
        <span>${o.rotulo} — + ${money(o.delta)}</span>
      </label>`
    )
    .join("");

  _comboCtx = { nomeCombo, precoBase, grupo };
  openModal(comboModal);
}

// Confirmar escolha do refrigerante
comboConfirm?.addEventListener("click", () => {
  if (!_comboCtx) return;
  const sel = comboBody.querySelector("input[name='combo-drink']:checked");
  if (!sel) return;

  const opt = comboDrinkOptions[_comboCtx.grupo][+sel.value];
  const precoFinal = _comboCtx.precoBase + opt.delta;
  cart.push({ nome: `${_comboCtx.nomeCombo} (${opt.rotulo})`, preco: precoFinal, qtd: 1 });

  renderMiniCart();
  popupAdd(`${_comboCtx.nomeCombo} adicionado!`);
  closeModal(comboModal);
  _comboCtx = null;
});

/* =========================================
   🛒 CARRINHO E BOTÕES
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
        <div>
          <button class="qty-dec" data-i="${i}">−</button>
          <button class="qty-inc" data-i="${i}">+</button>
          <button class="remove-item" data-i="${i}">🗑</button>
        </div>`;
      lista.appendChild(row);
    });

    lista.querySelectorAll(".qty-inc").forEach(b =>
      b.addEventListener("click", e => {
        cart[+e.currentTarget.dataset.i].qtd++;
        renderMiniCart();
        updateCartCount();
      })
    );

    lista.querySelectorAll(".qty-dec").forEach(b =>
      b.addEventListener("click", e => {
        const it = cart[+e.currentTarget.dataset.i];
        it.qtd = Math.max(1, it.qtd - 1);
        renderMiniCart();
        updateCartCount();
      })
    );

    lista.querySelectorAll(".remove-item").forEach(b =>
      b.addEventListener("click", e => {
        cart.splice(+e.currentTarget.dataset.i, 1);
        renderMiniCart();
        updateCartCount();
      })
    );
  }

  foot.innerHTML = `
    <button id="close-order" class="btn-primary">Fechar Pedido (${money(total)})</button>
    <button id="clear-cart" class="btn-secondary">Limpar</button>`;
  document.getElementById("clear-cart")?.addEventListener("click", () => {
    cart = [];
    renderMiniCart();
    updateCartCount();
  });
  document.getElementById("close-order")?.addEventListener("click", fecharPedido);
  updateCartCount();
}

/* ========== ABRIR E FECHAR MINI-CARRINHO ========== */
document.getElementById("cart-icon")?.addEventListener("click", () => {
  miniCart.classList.toggle("active");
  cartBackdrop.classList.toggle("show");
  document.body.classList.toggle("no-scroll");
  renderMiniCart();
});

cartBackdrop?.addEventListener("click", () => {
  miniCart.classList.remove("active");
  cartBackdrop.classList.remove("show");
  document.body.classList.remove("no-scroll");
});

/* =========================================
   ➕ BOTÕES “ADICIONAR AO CARRINHO”
========================================= */
function addCommonItem(nome, preco) {
  const found = cart.find(i => i.nome === nome && i.preco === preco);
  if (found) found.qtd += 1;
  else cart.push({ nome, preco, qtd: 1 });
  renderMiniCart();
  popupAdd(`${nome} adicionado!`);
}

document.querySelectorAll(".add-cart").forEach(btn => {
  btn.addEventListener("click", e => {
    const card = e.currentTarget.closest(".card");
    if (!card) return;
    const nome = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";
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

  prev?.addEventListener("click", () => {
    if (!slides) return;
    const step = Math.min(slides.clientWidth * 0.9, 320);
    slides.scrollLeft -= step;
  });

  next?.addEventListener("click", () => {
    if (!slides) return;
    const step = Math.min(slides.clientWidth * 0.9, 320);
    slides.scrollLeft += step;
  });

  document.querySelectorAll(".slide").forEach(img => {
    img.addEventListener("click", () => {
      const msg = encodeURIComponent(img.dataset.wa || "");
      if (msg) window.open(`https://wa.me/5534997178336?text=${msg}`, "_blank");
    });
  });
})();

/* =========================================
   🔥 FIREBASE v8 + LOGIN
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
if (window.firebase && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db   = firebase.firestore();

/* ===== Referências de login ===== */
const userBtn     = document.getElementById("user-btn") || (() => {
  const b = document.createElement("button");
  b.id = "user-btn";
  b.className = "user-button";
  b.textContent = "Entrar / Cadastrar";
  document.querySelector(".header")?.appendChild(b);
  return b;
})();

const loginModal  = document.getElementById("login-modal");
const loginForm   = document.getElementById("login-form")  || loginModal?.querySelector("form");
const googleBtn   = document.getElementById("google-login") || loginModal?.querySelector(".btn-google");
const loginCloseX = loginModal?.querySelector(".login-x");

/* ===== Abrir/fechar modal de login ===== */
function openLogin() {
  if (!loginModal) return;
  openModal(loginModal);
}
function closeLogin() {
  if (!loginModal) return;
  closeModal(loginModal);
}
userBtn?.addEventListener("click", openLogin);
loginCloseX?.addEventListener("click", closeLogin);
/* fechar clicando fora */
loginModal?.addEventListener("click", (e) => {
  if (e.target === loginModal) closeLogin();
});

/* ===== Login por e-mail/senha ===== */
loginForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const emailInput = loginForm.querySelector('input[type="email"]');
  const passInput  = loginForm.querySelector('input[type="password"]');
  const email = emailInput?.value?.trim();
  const senha = passInput?.value?.trim();
  if (!email || !senha) return alert("Preencha e-mail e senha.");

  auth.signInWithEmailAndPassword(email, senha)
    .then((cred) => {
      currentUser = cred.user;
      userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0] || currentUser.email.split("@")[0]}`;
      closeLogin();
      showOrdersFabIfLogged();
    })
    .catch(() => {
      // cria conta automaticamente se não existir
      auth.createUserWithEmailAndPassword(email, senha)
        .then((cred) => {
          currentUser = cred.user;
          userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0] || currentUser.email.split("@")[0]}`;
          closeLogin();
          alert("Conta criada com sucesso! 🎉");
          showOrdersFabIfLogged();
        })
        .catch((err) => alert("Erro: " + err.message));
    });
});

/* ===== Login com Google ===== */
googleBtn?.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      currentUser = result.user;
      userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0] || "Cliente"}`;
      closeLogin();
      showOrdersFabIfLogged();
    })
    .catch((err) => alert("Erro no login com Google: " + err.message));
});

/* ===== Estado de autenticação ===== */
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
  }
  showOrdersFabIfLogged();
});
/* =========================================
   📦 FECHAR PEDIDO (Firestore)
========================================= */
function fecharPedido() {
  if (cart.length === 0) return alert("Carrinho vazio!");
  if (!currentUser) {
    alert("Você precisa estar logado para enviar o pedido!");
    openLogin();
    return;
  }

  const total = cart.reduce((acc, i) => acc + i.preco * i.qtd, 0);
  const pedido = {
    usuario: currentUser.email,
    userId: currentUser.uid,
    nome: currentUser.displayName || currentUser.email.split("@")[0],
    itens: cart.map((i) => `${i.nome} x${i.qtd}`),
    total: Number(total.toFixed(2)),
    data: new Date().toISOString(),
  };

  db.collection("Pedidos")
    .add(pedido)
    .then(() => {
      alert("Pedido salvo com sucesso ✅");
      const texto = encodeURIComponent(
        "🍔 *Pedido DFL*\n" +
          cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n") +
          `\n\nTotal: ${money(total)}`
      );
      window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");
      cart = [];
      renderMiniCart();
    })
    .catch((err) => alert("Erro ao salvar pedido: " + err.message));
}

/* =========================================
   📋 “MEUS PEDIDOS” (painel lateral)
========================================= */
let ordersFab = document.getElementById("orders-fab");
if (!ordersFab) {
  ordersFab = document.createElement("button");
  ordersFab.id = "orders-fab";
  ordersFab.innerHTML = "📦 Meus Pedidos";
  document.body.appendChild(ordersFab);
}

let ordersPanel = document.querySelector(".orders-panel");
if (!ordersPanel) {
  ordersPanel = document.createElement("div");
  ordersPanel.className = "orders-panel";
  ordersPanel.innerHTML = `
    <div class="orders-head">
      <span>📦 Meus Pedidos</span>
      <button class="orders-close">✖</button>
    </div>
    <div class="orders-content" id="orders-content">
      <p class="empty-orders">Faça login para ver seus pedidos.</p>
    </div>`;
  document.body.appendChild(ordersPanel);
}

/* abrir/fechar painel lateral */
function openOrdersPanel() {
  ordersPanel.classList.add("active");
  document.getElementById("cart-backdrop")?.classList.add("show");
  document.body.classList.add("no-scroll");
}
function closeOrdersPanel() {
  ordersPanel.classList.remove("active");
  document.getElementById("cart-backdrop")?.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

ordersFab.addEventListener("click", () => {
  if (!currentUser) return alert("Faça login para ver seus pedidos.");
  openOrdersPanel();
  carregarPedidosSeguro();
});
ordersPanel.querySelector(".orders-close")?.addEventListener("click", closeOrdersPanel);

/* Backdrop fecha carrinho e “Meus Pedidos” (sem recriar elemento) */
document.getElementById("cart-backdrop")?.addEventListener("click", () => {
  closeOrdersPanel();
  miniCart?.classList.remove("active");
  document.getElementById("cart-backdrop")?.classList.remove("show");
  document.body.classList.remove("no-scroll");
});

/* mostrar/esconder FAB conforme login */
function showOrdersFabIfLogged() {
  if (currentUser) ordersFab.classList.add("show");
  else ordersFab.classList.remove("show");
}

/* carregar pedidos do usuário logado */
function carregarPedidosSeguro() {
  const container = document.getElementById("orders-content");
  if (!container) return;
  container.innerHTML = `<p class="empty-orders">Carregando pedidos...</p>`;

  if (!currentUser) {
    container.innerHTML = `<p class="empty-orders">Você precisa estar logado para ver seus pedidos.</p>`;
    return;
  }

  db.collection("Pedidos")
    .where("usuario", "==", currentUser.email)
    .orderBy("data", "desc")
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        container.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado 😢</p>`;
        return;
      }
      container.innerHTML = "";
      snapshot.forEach((doc) => {
        const p = doc.data();
        const itens = Array.isArray(p.itens) ? p.itens.join(", ") : p.itens || "";
        const box = document.createElement("div");
        box.className = "order-item";
        box.innerHTML = `
          <h4>${new Date(p.data).toLocaleString("pt-BR")}</h4>
          <p><b>Itens:</b> ${itens}</p>
          <p><b>Total:</b> ${money(p.total)}</p>`;
        container.appendChild(box);
      });
    })
    .catch((err) => {
      container.innerHTML = `<p class="empty-orders">Erro ao carregar pedidos: ${err.message}</p>`;
    });
}
/* =========================================
   🕓 STATUS ABERTO / FECHADO + TIMER
========================================= */
const statusBanner = document.getElementById("status-banner");
const hoursBanner = document.querySelector(".hours-banner");

function atualizaStatus() {
  const agora = new Date();
  const d = agora.getDay();
  const h = agora.getHours();
  const m = agora.getMinutes();

  // Seg–Qui 18:00–23:15 | Sex–Dom 17:00–23:30
  const aberto =
    (d >= 1 && d <= 4 && (h > 18 || (h === 18) || (h === 23 && m <= 15) || (h > 18 && h < 23))) ||
    ((d === 5 || d === 6 || d === 0) && (h >= 17 && (h < 23 || (h === 23 && m <= 30))));

  if (statusBanner) {
    statusBanner.textContent = aberto
      ? "🟢 Aberto — Faça seu pedido!"
      : "🔴 Fechado — Voltamos em breve!";
    statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`;
  }

  if (hoursBanner) {
    if (aberto) {
      // mostra horário de fechamento do dia (23:15 ou 23:30)
      const limitMin = (d >= 1 && d <= 4) ? (23 * 60 + 15) : (23 * 60 + 30);
      const nowMin = h * 60 + m;
      const rest = Math.max(0, limitMin - nowMin);
      const hh = Math.floor(rest / 60);
      const mm = rest % 60;
      const fecha = (d >= 1 && d <= 4) ? "23h15" : "23h30";
      hoursBanner.innerHTML = `⏰ Hoje atendemos até <b>${fecha}</b> — Faltam <b>${hh}h ${mm}min</b>`;
    } else {
      // mostra quanto falta para abrir
      const abreH = (d >= 1 && d <= 4) ? 18 : 17;
      const nowMin = h * 60 + m;
      const openMin = abreH * 60;
      const rest = (nowMin <= openMin) ? (openMin - nowMin) : ((24 * 60 - nowMin) + openMin);
      const hh = Math.floor(rest / 60);
      const mm = rest % 60;
      hoursBanner.innerHTML = `🔒 Fechado — Abrimos em <b>${hh}h ${mm}min</b>`;
    }
  }
}
setInterval(atualizaStatus, 60000);
atualizaStatus();

/* =========================================
   ⏳ CONTAGEM REGRESSIVA DAS PROMOÇÕES
========================================= */
function promoCountdown() {
  const agora = new Date();
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  const diff = fim - agora;
  const el = document.getElementById("promo-timer");
  if (!el) return;

  if (diff <= 0) {
    el.textContent = "00:00:00";
    return;
  }
  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  el.textContent = `${h}:${m}:${s}`;
}
setInterval(promoCountdown, 1000);
promoCountdown();

/* =========================================
   🔔 POPUP DE ITEM ADICIONADO
========================================= */
function popupAdd(msg) {
  const pop = document.createElement("div");
  pop.className = "popup-add";
  pop.textContent = msg || "Item adicionado!";
  document.body.appendChild(pop);
  setTimeout(() => pop.classList.add("show"), 30);
  setTimeout(() => {
    pop.classList.remove("show");
    setTimeout(() => pop.remove(), 200);
  }, 1700);
}

/* =========================================
   🧩 FECHAR MODAIS AO CLICAR FORA (garantia)
========================================= */
["#extras-modal", "#combo-modal", "#login-modal"].forEach((sel) => {
  const modal = document.querySelector(sel);
  if (!modal) return;
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(modal);
  });
});

/* =========================================
   ⌨️ ESC para fechar sobreposições
========================================= */
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  // fecha em ordem de prioridade
  if (document.getElementById("combo-modal")?.classList.contains("show")) {
    closeModal(document.getElementById("combo-modal")); return;
  }
  if (document.getElementById("extras-modal")?.classList.contains("show")) {
    closeModal(document.getElementById("extras-modal")); return;
  }
  if (document.getElementById("login-modal")?.classList.contains("show")) {
    closeModal(document.getElementById("login-modal")); return;
  }
  if (document.getElementById("mini-cart")?.classList.contains("active")) {
    miniCart.classList.remove("active");
    document.getElementById("cart-backdrop")?.classList.remove("show");
    document.body.classList.remove("no-scroll");
    return;
  }
  if (document.querySelector(".orders-panel")?.classList.contains("active")) {
    closeOrdersPanel();
  }
});

/* =========================================
   🧠 LOG DE VERSÃO
========================================= */
console.log("%c✅ DFL v1.4.8 — estável (combos, adicionais, login, pedidos, carrinho, timers).",
            "color:#fff;background:#111;padding:6px 10px;border-radius:8px");