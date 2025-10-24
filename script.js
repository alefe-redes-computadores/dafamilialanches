// ===============================
// DFL v1.4.3 – Script Completo Corrigido
// ===============================
document.addEventListener("DOMContentLoaded", () => {

// ===============================
// 🔧 CONFIGURAÇÕES INICIAIS
// ===============================
const sound = new Audio("click.wav");
let cart = [];
let currentUser = null;
const money = n => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;

const cartCount = document.getElementById("cart-count");
const miniCart = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");

// ===============================
// 🔔 SOM DE CLIQUE
// ===============================
document.addEventListener("click", () => {
  try { sound.currentTime = 0; sound.play(); } catch (_) {}
});

// ===============================
// 🕒 STATUS DE FUNCIONAMENTO
// ===============================
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

// ===============================
// ⏳ CONTAGEM REGRESSIVA (23:59)
// ===============================
function atualizarTimer() {
  const timer1 = document.getElementById("timer");
  const timer2 = document.getElementById("promo-timer");
  if (!timer1 && !timer2) return;

  const agora = new Date();
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  const diff = fim - agora;

  const texto = diff <= 0
    ? "00:00:00"
    : (() => {
        const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
        return `${h}:${m}:${s}`;
      })();

  if (timer1) timer1.textContent = texto;
  if (timer2) timer2.textContent = texto;
}
setInterval(atualizarTimer, 1000);
atualizarTimer();

// ===============================
// 🛒 CARRINHO
// ===============================
function updateCartCount() {
  const total = cart.reduce((a, i) => a + i.qtd, 0);
  if (cartCount) cartCount.textContent = total;
}

function renderMiniCart() {
  const lista = document.querySelector(".mini-list");
  const foot = document.querySelector(".mini-foot");
  if (!lista || !foot) return;

  lista.innerHTML = "";
  let total = 0;

  if (!cart.length) {
    lista.innerHTML = `<p class="empty-cart">Seu carrinho está vazio 😢</p>`;
  } else {
    cart.forEach((item, i) => {
      total += item.preco * item.qtd;
      const linha = document.createElement("div");
      linha.className = "cart-item";
      linha.innerHTML = `
        <span>${item.nome} x${item.qtd}</span>
        <strong>${money(item.preco * item.qtd)}</strong>
        <div>
          <button class="qty-dec" data-i="${i}">−</button>
          <button class="qty-inc" data-i="${i}">+</button>
          <button class="remove-item" data-i="${i}">🗑</button>
        </div>`;
      lista.appendChild(linha);
    });

    lista.querySelectorAll(".qty-inc").forEach(btn => btn.addEventListener("click", e => {
      const i = +e.currentTarget.dataset.i;
      cart[i].qtd++;
      renderMiniCart();
      updateCartCount();
    }));

    lista.querySelectorAll(".qty-dec").forEach(btn => btn.addEventListener("click", e => {
      const i = +e.currentTarget.dataset.i;
      cart[i].qtd = Math.max(1, cart[i].qtd - 1);
      renderMiniCart();
      updateCartCount();
    }));

    lista.querySelectorAll(".remove-item").forEach(btn => btn.addEventListener("click", e => {
      cart.splice(+e.currentTarget.dataset.i, 1);
      renderMiniCart();
      updateCartCount();
    }));
  }

  foot.innerHTML = `
    <button id="close-order" class="btn-primary">Fechar Pedido (${money(total)})</button>
    <button id="clear-cart" class="btn-secondary">Limpar</button>
  `;

  document.getElementById("clear-cart")?.addEventListener("click", () => {
    cart = [];
    renderMiniCart();
    updateCartCount();
  });

  document.getElementById("close-order")?.addEventListener("click", fecharPedido);
  updateCartCount();
}

// abrir/fechar carrinho
document.getElementById("cart-icon")?.addEventListener("click", () => {
  miniCart?.classList.toggle("active");
  cartBackdrop?.classList.toggle("show");
  document.body.classList.toggle("no-scroll");
  renderMiniCart();
});

cartBackdrop?.addEventListener("click", () => {
  miniCart?.classList.remove("active");
  cartBackdrop?.classList.remove("show");
  document.body.classList.remove("no-scroll");
});

document.querySelector("#mini-cart .extras-close")?.addEventListener("click", () => {
  miniCart?.classList.remove("active");
  cartBackdrop?.classList.remove("show");
  document.body.classList.remove("no-scroll");
});
// ===============================
// ➕ ADICIONAR AO CARRINHO
// ===============================
function popupAdd(msg) {
  const pop = document.createElement("div");
  pop.className = "popup-add";
  pop.textContent = msg;
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 1500);
}

function addCommonItem(nome, preco) {
  const found = cart.find(i => i.nome === nome && i.preco === preco);
  if (found) found.qtd += 1;
  else cart.push({ nome, preco, qtd: 1 });
  renderMiniCart();
  popupAdd(`${nome} adicionado!`);
}

// vincular botões “Adicionar”
document.querySelectorAll(".add-cart").forEach(btn =>
  btn.addEventListener("click", e => {
    const card = e.currentTarget.closest(".card");
    if (!card) return;
    const nome = card.dataset.name || card.querySelector("h3")?.textContent;
    const preco = parseFloat(card.dataset.price || "0");

    if (/^combo/i.test(nome)) openComboModal(nome, preco);
    else addCommonItem(nome, preco);
  })
);

// ===============================
// 🖼️ CARROSSEL DE PROMOÇÕES
// ===============================
(() => {
  const slides = document.querySelector(".slides");
  const prev = document.querySelector(".c-prev");
  const next = document.querySelector(".c-next");

  prev?.addEventListener("click", () => {
    if (slides) slides.scrollLeft -= slides.clientWidth * 0.9;
  });

  next?.addEventListener("click", () => {
    if (slides) slides.scrollLeft += slides.clientWidth * 0.9;
  });

  document.querySelectorAll(".slide").forEach(img => {
    img.addEventListener("click", () => {
      const msg = encodeURIComponent(img.dataset.wa || "");
      if (msg)
        window.open(
          `https://wa.me/5534997178336?text=${msg}`,
          "_blank"
        );
    });
  });
})();

// ===============================
// 🔥 FIREBASE + LOGIN
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
  authDomain: "da-familia-lanches.firebaseapp.com",
  projectId: "da-familia-lanches",
  storageBucket: "da-familia-lanches.appspot.com",
  messagingSenderId: "106857147317",
  appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
  measurementId: "G-TCZ18HFWGX",
};

if (window.firebase && !firebase.apps.length)
  firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// botão do usuário no topo
let userBtn = document.getElementById("user-btn");
const loginModal = document.getElementById("login-modal");

if (userBtn) {
  userBtn.addEventListener("click", () => {
    loginModal.classList.add("show");
    document.body.classList.add("no-scroll");
  });
}

// LOGIN email/senha
const formLogin = document.getElementById("login-form");
formLogin?.addEventListener("submit", e => {
  e.preventDefault();
  const email = formLogin.querySelector('input[type="email"]').value.trim();
  const senha = formLogin.querySelector('input[type="password"]').value.trim();

  if (!email || !senha) {
    alert("Preencha todos os campos!");
    return;
  }

  auth
    .signInWithEmailAndPassword(email, senha)
    .then(cred => {
      currentUser = cred.user;
      userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
      loginModal.classList.remove("show");
      document.body.classList.remove("no-scroll");
      showOrdersFabIfLogged();
    })
    .catch(() => {
      auth
        .createUserWithEmailAndPassword(email, senha)
        .then(cred => {
          currentUser = cred.user;
          userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
          alert("Conta criada com sucesso! 🎉");
          loginModal.classList.remove("show");
          document.body.classList.remove("no-scroll");
          showOrdersFabIfLogged();
        })
        .catch(err => alert("Erro: " + err.message));
    });
});

// LOGIN COM GOOGLE
document
  .getElementById("google-login")
  ?.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth
      .signInWithPopup(provider)
      .then(result => {
        currentUser = result.user;
        userBtn.textContent = `Olá, ${
          currentUser.displayName?.split(" ")[0] || "Cliente"
        }`;
        loginModal.classList.remove("show");
        document.body.classList.remove("no-scroll");
        showOrdersFabIfLogged();
      })
      .catch(err => alert("Erro no login com Google: " + err.message));
  });

// OBSERVADOR DE LOGIN
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    userBtn.textContent = `Olá, ${
      user.displayName?.split(" ")[0] || user.email.split("@")[0]
    }`;
  }
  showOrdersFabIfLogged();
});
// ===============================
// 📦 FECHAR PEDIDO (Firestore + WhatsApp)
// ===============================
function fecharPedido() {
  if (!cart.length) return alert("Carrinho vazio!");
  if (!currentUser) {
    alert("Você precisa estar logado para enviar o pedido!");
    const loginModal = document.getElementById("login-modal");
    loginModal?.classList.add("show");
    document.body.classList.add("no-scroll");
    return;
  }

  const total = cart.reduce((acc, i) => acc + i.preco * i.qtd, 0);
  const pedido = {
    usuario: currentUser.email,
    userId: currentUser.uid,
    nome: currentUser.displayName || currentUser.email.split("@")[0],
    itens: cart.map(i => `${i.nome} x${i.qtd}`),
    total: Number(total.toFixed(2)),
    data: new Date().toISOString(),
  };

  db.collection("Pedidos")
    .add(pedido)
    .then(() => {
      alert("Pedido salvo com sucesso ✅");
      const texto = encodeURIComponent(
        "🍔 *Pedido DFL*\n" +
        cart.map(i => `• ${i.nome} x${i.qtd}`).join("\n") +
        `\n\nTotal: R$ ${total.toFixed(2).replace(".", ",")}`
      );
      window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");
      cart = [];
      renderMiniCart();
    })
    .catch(err => alert("Erro ao salvar pedido: " + err.message));
}

// ===============================
// 📋 MEUS PEDIDOS (FAB + Painel)
// ===============================
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
    </div>
  `;
  document.body.appendChild(ordersPanel);
}

// abre/fecha painel
ordersFab.addEventListener("click", () => {
  if (!currentUser) return alert("Faça login para ver seus pedidos.");
  ordersPanel.classList.add("active");
  carregarPedidosSeguro();
});
ordersPanel.querySelector(".orders-close")?.addEventListener("click", () => {
  ordersPanel.classList.remove("active");
});

// mostra/oculta FAB conforme login
function showOrdersFabIfLogged() {
  if (currentUser) ordersFab.classList.add("show");
  else ordersFab.classList.remove("show");
}

// carrega pedidos do usuário
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
    .then(snapshot => {
      if (snapshot.empty) {
        container.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado 😢</p>`;
        return;
      }
      container.innerHTML = "";
      snapshot.forEach(doc => {
        const p = doc.data();
        const itens = Array.isArray(p.itens) ? p.itens.join("<br>") : (p.itens || "");
        const box = document.createElement("div");
        box.className = "order-item";
        box.innerHTML = `
          <h4>${new Date(p.data).toLocaleString("pt-BR")}</h4>
          <p>${itens}</p>
          <p><b>Total:</b> R$ ${Number(p.total).toFixed(2).replace(".", ",")}</p>
        `;
        container.appendChild(box);
      });
    })
    .catch(err => {
      container.innerHTML = `<p class="empty-orders">Erro ao carregar pedidos: ${err.message}</p>`;
    });
}

// ===============================
// ✅ LOG FINAL DA VERSÃO
// ===============================
console.log("✅ DFL v1.4.3-FIX carregado — Carrinho, Adicionais, Combos, Login e Meus Pedidos OK");
}); // ← fim do DOMContentLoaded