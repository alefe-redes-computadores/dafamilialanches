document.addEventListener("DOMContentLoaded", () => {
/* ===============================
   🔧 CONFIGURAÇÃO INICIAL
=============================== */
const sound = new Audio("click.wav");
let cart = []; // mantém em memória (pode persistir depois, se quiser)
const cartCount   = document.getElementById("cart-count");
const miniCart    = document.getElementById("mini-cart");
const cartBackdrop= document.getElementById("cart-backdrop");
const extrasModal = document.getElementById("extras-modal");
const extrasList  = document.getElementById("extras-list");
const extrasAdd   = document.getElementById("extras-add");
const loginModal  = document.getElementById("login-modal");
let currentUser   = null;

const money = n => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;

/* ===============================
   🔔 SOM DE CLIQUE (tolerante)
=============================== */
document.addEventListener("click", () => {
  try { sound.currentTime = 0; sound.play(); } catch(_) {}
});

/* ===============================
   🕒 STATUS DE FUNCIONAMENTO
=============================== */
function atualizarStatus() {
  const banner = document.getElementById("status-banner");
  if (!banner) return;
  const agora = new Date();
  const dia = agora.getDay();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();

  let aberto = false;
  if (dia >= 1 && dia <= 4) {
    aberto = hora >= 18 && (hora < 23 || (hora === 23 && minuto <= 15));
  } else if (dia === 5 || dia === 6 || dia === 0) {
    aberto = hora >= 17 && (hora < 23 || (hora === 23 && minuto <= 30));
  }

  banner.textContent = aberto
    ? "✅ Estamos abertos! Faça seu pedido 🍔"
    : "⏰ Fechado no momento — Voltamos em breve!";
  banner.style.background = aberto ? "#00c853" : "#ff3d00";
}
setInterval(atualizarStatus, 60000);
atualizarStatus();

/* ===============================
   ⏳ CONTAGEM REGRESSIVA
=============================== */
function atualizarTimer() {
  const box = document.getElementById("timer");
  if (!box) return;
  const agora = new Date();
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  const diff = fim - agora;
  if (diff <= 0) {
    box.textContent = "00:00:00";
    return;
  }
  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  box.textContent = `${h}:${m}:${s}`;
}
setInterval(atualizarTimer, 1000);
atualizarTimer();

/* ===============================
   🛒 CARRINHO
=============================== */
function renderMiniCart() {
  const lista = document.querySelector(".mini-list");
  const foot  = document.querySelector(".mini-foot");
  if (!lista || !foot) return;

  lista.innerHTML = "";
  let total = 0;

  if (!cart.length) {
    lista.innerHTML = `<p class="empty-cart">Seu carrinho está vazio 😢</p>`;
  } else {
    cart.forEach((item, i) => {
      total += item.preco * item.qtd;
      const li = document.createElement("div");
      li.className = "cart-item";
      li.innerHTML = `
        <span>${item.nome} x${item.qtd}</span>
        <strong>${money(item.preco * item.qtd)}</strong>
        <div>
          <button class="qty-dec" data-i="${i}">−</button>
          <button class="qty-inc" data-i="${i}">+</button>
          <button class="remove-item" data-i="${i}">🗑</button>
        </div>
      `;
      lista.appendChild(li);
    });

    lista.querySelectorAll(".qty-inc").forEach(b => {
      b.addEventListener("click", e => {
        const i = Number(e.currentTarget.dataset.i);
        cart[i].qtd++;
        renderMiniCart();
        updateCartCount();
      });
    });
    lista.querySelectorAll(".qty-dec").forEach(b => {
      b.addEventListener("click", e => {
        const i = Number(e.currentTarget.dataset.i);
        cart[i].qtd = Math.max(1, cart[i].qtd - 1);
        renderMiniCart();
        updateCartCount();
      });
    });
    lista.querySelectorAll(".remove-item").forEach(b => {
      b.addEventListener("click", e => {
        const i = Number(e.currentTarget.dataset.i);
        cart.splice(i, 1);
        renderMiniCart();
        updateCartCount();
      });
    });
  }

  foot.innerHTML = `
    <button id="close-order" class="btn-primary">Fechar Pedido (${money(total)})</button>
    <button id="clear-cart" class="btn-secondary">Limpar</button>
  `;
  const clearBtn = document.getElementById("clear-cart");
  const closeBtn = document.getElementById("close-order");
  clearBtn?.addEventListener("click", () => { cart = []; renderMiniCart(); updateCartCount(); });
  closeBtn?.addEventListener("click", fecharPedido);

  updateCartCount();
}
function updateCartCount() {
  if (!cartCount) return;
  cartCount.textContent = cart.reduce((acc, i) => acc + i.qtd, 0);
}

const openCartBtn = document.getElementById("cart-icon");
openCartBtn?.addEventListener("click", () => {
  if (!miniCart || !cartBackdrop) return;
  miniCart.classList.toggle("active");
  cartBackdrop.classList.toggle("show");
  document.body.classList.toggle("no-scroll");
  renderMiniCart();
});
cartBackdrop?.addEventListener("click", () => {
  miniCart?.classList.remove("active");
  cartBackdrop?.classList.remove("show");
  document.body.classList.remove("no-scroll");
});

/* ===============================
   ➕ ADICIONAR AO CARRINHO
=============================== */
function popupAdd(msg) {
  const pop = document.createElement("div");
  pop.className = "popup-add";
  pop.textContent = msg;
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 1400);
}
document.querySelectorAll(".add-cart").forEach(btn => {
  btn.addEventListener("click", e => {
    const card = e.currentTarget.closest(".card");
    if (!card) return;
    const nome  = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";
    const preco = parseFloat(card.dataset.price || "0");
    const found = cart.find(i => i.nome === nome && i.preco === preco);
    if (found) found.qtd += 1;
    else cart.push({ nome, preco, qtd: 1 });
    renderMiniCart();
    popupAdd(`${nome} adicionado!`);
  });
});

/* ===============================
   ⚙️ ADICIONAIS
=============================== */
const adicionais = [
  { nome: "Cebola",                       preco: 0.99 },
  { nome: "Salada",                       preco: 1.99 },
  { nome: "Ovo",                          preco: 1.99 },
  { nome: "Bacon",                        preco: 2.99 },
  { nome: "Hambúrguer Tradicional 56g",   preco: 2.99 },
  { nome: "Cheddar Cremoso",              preco: 3.99 },
  { nome: "Filé de Frango",               preco: 5.99 },
  { nome: "Hambúrguer Artesanal 120g",    preco: 7.99 },
];

document.querySelectorAll(".extras-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    if (!extrasModal || !extrasList) return;
    const card = e.currentTarget.closest(".card");
    const produto = card?.dataset.name || "Produto";
    extrasModal.dataset.produto = produto;
    extrasList.innerHTML = adicionais.map((a, i) => `
      <label>
        <span>${a.nome} — ${money(a.preco)}</span>
        <input type="checkbox" value="${i}">
      </label>
    `).join("");
    extrasModal.classList.add("show");
    document.body.classList.add("no-scroll");
  });
});
document.querySelectorAll(".extras-close").forEach(btn => {
  btn.addEventListener("click", () => {
    extrasModal?.classList.remove("show");
    document.body.classList.remove("no-scroll");
  });
});
extrasAdd?.addEventListener("click", () => {
  if (!extrasModal) return;
  const nomeProduto = extrasModal.dataset.produto || "Produto";
  const selecionados = [...(extrasList?.querySelectorAll("input:checked") || [])];
  selecionados.forEach(c => {
    const extra = adicionais[Number(c.value)];
    cart.push({ nome: `${nomeProduto} + ${extra.nome}`, preco: extra.preco, qtd: 1 });
  });
  extrasModal.classList.remove("show");
  document.body.classList.remove("no-scroll");
  renderMiniCart();
});

/* ===============================
   🖼️ CARROSSEL (tolerante)
=============================== */
const slides = document.querySelector(".slides");
const prev = document.querySelector(".c-prev");
const next = document.querySelector(".c-next");
prev?.addEventListener("click", () => { if (slides) slides.scrollLeft -= Math.min(slides.clientWidth*0.9, 320); });
next?.addEventListener("click", () => { if (slides) slides.scrollLeft += Math.min(slides.clientWidth*0.9, 320); });
document.querySelectorAll(".slide").forEach(img => {
  img.addEventListener("click", () => {
    const msg = img.dataset.wa ? encodeURIComponent(img.dataset.wa) : "";
    if (msg) window.open(`https://wa.me/5534997178336?text=${msg}`, "_blank");
    else window.open(img.src, "_blank");
  });
});

/* ===============================
   🔥 FIREBASE + LOGIN (v8)
=============================== */
const firebaseConfig = {
  apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
  authDomain: "da-familia-lanches.firebaseapp.com",
  projectId: "da-familia-lanches",
  storageBucket: "da-familia-lanches.appspot.com",
  messagingSenderId: "106857147317",
  appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
  measurementId: "G-TCZ18HFWGX"
};
if (window.firebase && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = window.firebase ? firebase.auth() : null;
const db   = window.firebase ? firebase.firestore() : null;

/* ===============================
   👤 LOGIN / CADASTRO (UI)
=============================== */
let userBtn = document.getElementById("user-btn");
if (!userBtn) {
  userBtn = document.createElement("button");
  userBtn.id = "user-btn";
  userBtn.className = "user-button";
  userBtn.textContent = "Entrar / Cadastrar";
  document.querySelector(".header")?.appendChild(userBtn);
}
userBtn.addEventListener("click", () => {
  if (!loginModal) return;
  loginModal.classList.add("show");
  document.body.classList.add("no-scroll");
});
document.querySelector(".login-x")?.addEventListener("click", () => {
  loginModal?.classList.remove("show");
  document.body.classList.remove("no-scroll");
});

// e-mail/senha
document.querySelector(".btn-primario")?.addEventListener("click", () => {
  if (!auth) return alert("Auth indisponível");
  const email = document.getElementById("login-email")?.value?.trim();
  const senha = document.getElementById("login-senha")?.value?.trim();
  if (!email || !senha) return alert("Preencha e-mail e senha.");

  auth.signInWithEmailAndPassword(email, senha)
    .then(cred => {
      currentUser = cred.user;
      userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
      loginModal?.classList.remove("show");
      document.body.classList.remove("no-scroll");
      showOrdersFabIfLogged();
    })
    .catch(() => {
      auth.createUserWithEmailAndPassword(email, senha)
        .then(cred => {
          currentUser = cred.user;
          userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
          loginModal?.classList.remove("show");
          document.body.classList.remove("no-scroll");
          alert("Conta criada com sucesso! 🎉");
          showOrdersFabIfLogged();
        })
        .catch(err => alert("Erro: " + err.message));
    });
});

// Google
document.querySelector(".btn-google")?.addEventListener("click", () => {
  if (!auth) return alert("Auth indisponível");
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      currentUser = result.user;
      userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0] || "Cliente"}`;
      loginModal?.classList.remove("show");
      document.body.classList.remove("no-scroll");
      showOrdersFabIfLogged();
    })
    .catch(err => alert("Erro no login com Google: " + err.message));
});

auth?.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
    showOrdersFabIfLogged();
  }
});

/* ===============================
   📦 FECHAR PEDIDO (Firestore)
=============================== */
function fecharPedido() {
  if (!db) return alert("Banco indisponível");
  if (!cart.length) return alert("Carrinho vazio!");
  if (!currentUser) {
    alert("Você precisa estar logado para enviar o pedido!");
    loginModal?.classList.add("show");
    return;
  }
  const total = cart.reduce((acc, i) => acc + i.preco * i.qtd, 0);
  const pedido = {
    usuario: currentUser.email,
    nome: currentUser.displayName || currentUser.email.split("@")[0] || "Usuário",
    itens: cart.map(i => `${i.nome} x${i.qtd}`),
    total: total.toFixed(2),
    data: new Date().toISOString(), // ISO ordena certinho
  };

  db.collection("Pedidos").add(pedido)
    .then(() => {
      alert("Pedido salvo com sucesso ✅");
      const texto = encodeURIComponent(
        "🍔 *Pedido DFL*\n" +
        cart.map(i => `• ${i.nome} x${i.qtd}`).join("\n") +
        `\n\nTotal: ${money(total)}`
      );
      window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");
      cart = [];
      renderMiniCart();
    })
    .catch(err => alert("Erro ao salvar pedido: " + err.message));
}

/* ===============================
   📦 MEUS PEDIDOS (painel)
=============================== */
const ordersFab = document.createElement("button");
ordersFab.id = "orders-fab";
ordersFab.innerHTML = "📦 Meus Pedidos";
document.body.appendChild(ordersFab);

const ordersPanel = document.createElement("div");
ordersPanel.className = "orders-panel";
ordersPanel.innerHTML = `
  <div class="orders-head">
    <span>📦 Meus Pedidos</span>
    <button class="orders-close">✖</button>
  </div>
  <div class="orders-content" id="orders-content">
    <p class="empty-orders">Faça login para ver seus pedidos.</p>
  </div>
`;
document.body.appendChild(ordersPanel);

document.querySelector(".orders-close")?.addEventListener("click", () => {
  ordersPanel.classList.remove("active");
});
ordersFab.addEventListener("click", () => {
  if (!currentUser) return alert("Faça login para ver seus pedidos.");
  ordersPanel.classList.add("active");
  carregarPedidosSeguro();
});

function showOrdersFabIfLogged() {
  if (currentUser) ordersFab.classList.add("show");
  else ordersFab.classList.remove("show");
}

function carregarPedidosSeguro() {
  const container = document.getElementById("orders-content");
  if (!db || !container) return;
  container.innerHTML = `<p class="empty-orders">Carregando pedidos...</p>`;
  if (!currentUser) {
    container.innerHTML = `<p class="empty-orders">Você precisa estar logado para ver seus pedidos.</p>`;
    return;
  }
  // ⚠️ Coleção exatamente "Pedidos" (P maiúsculo)
  db.collection("Pedidos")
    .where("usuario", "==", currentUser.email)
    .orderBy("data", "desc")
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        container.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado 😢</p>`;
        return;
      }
      container.innerHTML = "";
      snapshot.forEach(doc => {
        const p = doc.data();
        const itens = Array.isArray(p.itens) ? p.itens.join("<br>") : (p.itens || "Itens não especificados");
        const bloco = document.createElement("div");
        bloco.className = "order-item";
        bloco.innerHTML = `
          <h4>${new Date(p.data).toLocaleString("pt-BR")}</h4>
          <p>${itens}</p>
          <p><b>Total:</b> R$ ${p.total}</p>
        `;
        container.appendChild(bloco);
      });
    })
    .catch(err => {
      container.innerHTML = `<p class="empty-orders">Erro ao carregar pedidos: ${err.message}</p>`;
    });
}

console.log("✅ DFL v1.1 – Estável + Meus Pedidos (robusto)");
}); // ← fecha o DOMContentLoaded