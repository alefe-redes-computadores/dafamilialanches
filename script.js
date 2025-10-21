document.addEventListener("DOMContentLoaded", () => {

/* ===============================
   🔧 CONFIGURAÇÃO INICIAL
=============================== */
const sound = new Audio("click.wav");
const cart = [];
const cartCount = document.getElementById("cart-count");
const miniCart = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");
const extrasModal = document.getElementById("extras-modal");
const extrasList = document.getElementById("extras-list");
const extrasAdd = document.getElementById("extras-add");
const loginModal = document.getElementById("login-modal");
let currentUser = null;

/* ===============================
   🔔 SOM DE CLIQUE
=============================== */
document.addEventListener("click", () => {
  try {
    sound.currentTime = 0;
    sound.play().catch(() => {});
  } catch (e) {}
});

/* ===============================
   🕒 STATUS DE FUNCIONAMENTO
=============================== */
function atualizarStatus() {
  const banner = document.getElementById("status-banner");
  const agora = new Date();
  const dia = agora.getDay();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();

  let aberto = false;
  if (dia >= 1 && dia <= 4)
    aberto = hora >= 18 && (hora < 23 || (hora === 23 && minuto <= 15));
  else if (dia === 5 || dia === 6 || dia === 0)
    aberto = hora >= 17 && (hora < 23 || (hora === 23 && minuto <= 30));

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
setInterval(atualizarTimer, 1000);
atualizarTimer();

/* ===============================
   🛒 CARRINHO
=============================== */
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

  document.getElementById("close-order").onclick = () => fecharPedido();
}
/* ===============================
   ⚙️ ADICIONAIS (MODAL)
=============================== */
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

document.querySelectorAll(".extras-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    const card = e.currentTarget.closest(".card");
    if (!card || !extrasModal || !extrasList) return;

    const produto = card.dataset.name || "Produto";
    extrasModal.dataset.produto = produto;

    // Monta a lista de adicionais dinamicamente
    extrasList.innerHTML = adicionais.map((a, i) => `
      <label>
        <span>${a.nome} — R$ ${a.preco.toFixed(2).replace(".", ",")}</span>
        <input type="checkbox" value="${i}">
      </label>
    `).join("");

    extrasModal.classList.add("show");
    document.body.classList.add("no-scroll");
  });
});

// Fechar modal
document.querySelectorAll(".extras-close").forEach(btn =>
  btn.addEventListener("click", () => {
    extrasModal.classList.remove("show");
    document.body.classList.remove("no-scroll");
  })
);

// Adicionar adicionais ao carrinho
extrasAdd.addEventListener("click", () => {
  const produto = extrasModal.dataset.produto || "Produto";
  const selecionados = [...extrasList.querySelectorAll("input:checked")];
  selecionados.forEach(chk => {
    const extra = adicionais[Number(chk.value)];
    cart.push({ nome: `${produto} + ${extra.nome}`, preco: extra.preco, qtd: 1 });
  });
  extrasModal.classList.remove("show");
  document.body.classList.remove("no-scroll");
  atualizarCarrinho();
  popupAdd("Adicional adicionado!");
});

/* ===============================
   🖼️ CARROSSEL (9 IMAGENS)
=============================== */
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
    const msg = img.dataset.wa ? encodeURIComponent(img.dataset.wa) : "";
    if (msg) {
      window.open(`https://wa.me/5534997178336?text=${msg}`, "_blank");
    } else {
      window.open(img.src, "_blank");
    }
  });
});

/* ===============================
   🔥 FIREBASE + LOGIN
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

if (window.firebase && !firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = window.firebase ? firebase.auth() : null;
const db = window.firebase ? firebase.firestore() : null;

/* ===============================
   👤 LOGIN / CADASTRO (MODAL)
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
  loginModal.classList.add("show");
  document.body.classList.add("no-scroll");
});

document.querySelector(".login-x")?.addEventListener("click", () => {
  loginModal.classList.remove("show");
  document.body.classList.remove("no-scroll");
});

// Login via e-mail/senha
document.querySelector(".btn-primario")?.addEventListener("click", () => {
  if (!auth) return alert("Auth indisponível");
  const email = document.getElementById("login-email")?.value.trim();
  const senha = document.getElementById("login-senha")?.value.trim();
  if (!email || !senha) return alert("Preencha e-mail e senha.");

  auth.signInWithEmailAndPassword(email, senha)
    .then(cred => {
      currentUser = cred.user;
      userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
      loginModal.classList.remove("show");
      document.body.classList.remove("no-scroll");
      showOrdersFabIfLogged();
    })
    .catch(() => {
      auth.createUserWithEmailAndPassword(email, senha)
        .then(cred => {
          currentUser = cred.user;
          userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
          loginModal.classList.remove("show");
          document.body.classList.remove("no-scroll");
          alert("Conta criada com sucesso! 🎉");
          showOrdersFabIfLogged();
        })
        .catch(err => alert("Erro: " + err.message));
    });
});
// Login via Google
document.querySelector(".btn-google")?.addEventListener("click", () => {
  if (!auth) return alert("Auth indisponível");
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      currentUser = result.user;
      userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0] || "Cliente"}`;
      loginModal.classList.remove("show");
      document.body.classList.remove("no-scroll");
      showOrdersFabIfLogged();
    })
    .catch(err => alert("Erro no login com Google: " + err.message));
});

// Monitora se o usuário está logado
auth?.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
    showOrdersFabIfLogged();
  }
});

/* ===============================
   🧾 FINALIZAR PEDIDO (Firestore)
=============================== */
function fecharPedido() {
  if (!db) return alert("Banco indisponível");
  if (!cart.length) return alert("Carrinho vazio!");
  if (!currentUser) {
    alert("Você precisa estar logado para enviar o pedido!");
    loginModal.classList.add("show");
    return;
  }

  const total = cart.reduce((acc, i) => acc + i.preco * i.qtd, 0);
  const pedido = {
    usuario: currentUser.email,
    nome: currentUser.displayName || currentUser.email.split("@")[0] || "Usuário",
    itens: cart.map(i => `${i.nome} x${i.qtd}`),
    total: total.toFixed(2),
    data: new Date().toISOString(),
  };

  db.collection("Pedidos").add(pedido)
    .then(() => {
      alert("Pedido salvo com sucesso ✅");
      const texto = encodeURIComponent(
        "🍔 *Pedido DFL*\n" +
        cart.map(i => `• ${i.nome} x${i.qtd}`).join("\n") +
        `\n\nTotal: R$ ${total.toFixed(2).replace(".", ",")}`
      );
      window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");
      cart.length = 0;
      atualizarCarrinho();
    })
    .catch(err => alert("Erro ao salvar pedido: " + err.message));
}

/* ===============================
   📦 MEUS PEDIDOS (PAINEL)
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

// Fecha painel de pedidos
ordersPanel.querySelector(".orders-close")?.addEventListener("click", () => {
  ordersPanel.classList.remove("active");
});

// Abre painel de pedidos
ordersFab.addEventListener("click", () => {
  if (!currentUser) return alert("Faça login para ver seus pedidos.");
  ordersPanel.classList.add("active");
  carregarPedidos();
});

function showOrdersFabIfLogged() {
  if (currentUser) ordersFab.classList.add("show");
  else ordersFab.classList.remove("show");
}

function carregarPedidos() {
  const container = document.getElementById("orders-content");
  if (!db || !container) return;
  container.innerHTML = `<p class="empty-orders">Carregando pedidos...</p>`;

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
        const itens = Array.isArray(p.itens)
          ? p.itens.join("<br>")
          : p.itens || "Itens não especificados";
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

/* ===============================
   🎉 POPUP ADICIONADO
=============================== */
function popupAdd(msg) {
  const pop = document.createElement("div");
  pop.className = "popup-add";
  pop.textContent = msg;
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 1500);
}

/* ===============================
   ✅ INICIALIZAÇÃO FINAL
=============================== */
document.querySelectorAll(".add-cart").forEach(btn => {
  btn.addEventListener("click", e => {
    const card = e.currentTarget.closest(".card");
    const nome = card.dataset.name;
    const preco = parseFloat(card.dataset.price);
    const item = cart.find(i => i.nome === nome);
    if (item) item.qtd++;
    else cart.push({ nome, preco, qtd: 1 });
    atualizarCarrinho();
    popupAdd(`${nome} adicionado!`);
  });
});

console.log("🔥 DFL v1.2 – Carrinho, Login, Adicionais e Meus Pedidos funcionando perfeitamente.");
}); // fecha o DOMContentLoaded