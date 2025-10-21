/* ===============================
   🔧 CONFIGURAÇÃO INICIAL
=============================== */
const sound = new Audio("click.wav");
const cart = [];
const cartCount = document.getElementById("cart-count");
const miniCart = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");
let currentUser = null;

/* ===============================
   🔔 SOM DE CLIQUE
=============================== */
document.addEventListener("click", () => sound.play());

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

  if (dia >= 1 && dia <= 4) aberto = hora >= 18 && (hora < 23 || (hora === 23 && minuto <= 15));
  else if ([5, 6, 0].includes(dia)) aberto = hora >= 17 && (hora < 23 || (hora === 23 && minuto <= 30));

  banner.textContent = aberto ? "✅ Estamos abertos! Faça seu pedido 🍔" : "⏰ Fechado no momento — Voltamos em breve!";
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
  if (diff <= 0) return (document.getElementById("timer").textContent = "00:00:00");

  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  document.getElementById("timer").textContent = `${h}:${m}:${s}`;
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

function popupAdicionado() {
  const popup = document.createElement("div");
  popup.className = "popup-add";
  popup.textContent = "🍔 Item adicionado ao carrinho!";
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1400);
}

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

  const fecharBtn = document.getElementById("close-order");
  if (fecharBtn) fecharBtn.onclick = fecharPedido;
}
/* ===============================
   🔥 FIREBASE CONFIGURAÇÃO
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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* ===============================
   👤 LOGIN / CADASTRO
=============================== */
const userBtn = document.createElement("button");
userBtn.id = "user-btn";
userBtn.className = "user-button";
userBtn.textContent = "Entrar / Cadastrar";
document.querySelector(".header").appendChild(userBtn);

userBtn.addEventListener("click", () => {
  document.getElementById("login-modal").classList.add("show");
  document.body.classList.add("no-scroll");
});

document.querySelector(".login-x").addEventListener("click", () => {
  document.getElementById("login-modal").classList.remove("show");
  document.body.classList.remove("no-scroll");
});

document.querySelector(".btn-primario").addEventListener("click", () => {
  const email = document.getElementById("login-email").value;
  const senha = document.getElementById("login-senha").value;
  if (!email || !senha) return alert("Preencha e-mail e senha.");

  auth.signInWithEmailAndPassword(email, senha)
    .then(cred => {
      currentUser = cred.user;
      userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
      fecharLogin();
      carregarPedidos();
    })
    .catch(() => {
      auth.createUserWithEmailAndPassword(email, senha)
        .then(cred => {
          currentUser = cred.user;
          userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
          fecharLogin();
          alert("Conta criada com sucesso! 🎉");
        })
        .catch(err => alert("Erro: " + err.message));
    });
});

document.querySelector(".btn-google").addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      currentUser = result.user;
      userBtn.textContent = `Olá, ${currentUser.displayName.split(" ")[0]}`;
      fecharLogin();
      carregarPedidos();
    })
    .catch(err => alert("Erro no login com Google: " + err.message));
});

function fecharLogin() {
  document.getElementById("login-modal").classList.remove("show");
  document.body.classList.remove("no-scroll");
}

auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
  }
});

/* ===============================
   📦 FECHAR PEDIDO
=============================== */
function fecharPedido() {
  if (cart.length === 0) return alert("Carrinho vazio!");
  if (!currentUser) {
    alert("Você precisa estar logado para enviar o pedido!");
    document.getElementById("login-modal").classList.add("show");
    return;
  }

  const total = cart.reduce((acc, i) => acc + i.preco * i.qtd, 0);
  const pedido = {
    usuario: currentUser.email,
    nome: currentUser.displayName || "Usuário",
    itens: cart.map(i => `${i.nome} x${i.qtd}`),
    total: total.toFixed(2),
    data: new Date().toISOString(),
    userid: currentUser.uid,
  };

  db.collection("Pedidos")
    .add(pedido)
    .then(() => {
      popupAdicionado();
      alert("Pedido salvo com sucesso ✅");
      const texto = encodeURIComponent(
        "🍔 *Pedido DFL*\n" +
          cart.map(i => `• ${i.nome} x${i.qtd}`).join("\n") +
          `\n\nTotal: R$ ${total.toFixed(2)}`
      );
      window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");
      cart.length = 0;
      atualizarCarrinho();
    })
    .catch(err => alert("Erro ao salvar pedido: " + err.message));
}
/* ===============================
   📦 BOTÃO “MEUS PEDIDOS”
=============================== */
const ordersFab = document.createElement("button");
ordersFab.id = "orders-fab";
ordersFab.innerHTML = "📦 Meus Pedidos";
document.body.appendChild(ordersFab);

ordersFab.addEventListener("click", () => {
  document.querySelector(".orders-panel").classList.add("active");
  carregarPedidos();
});

/* ===============================
   📦 PAINEL LATERAL DE PEDIDOS
=============================== */
const ordersPanel = document.createElement("div");
ordersPanel.className = "orders-panel";
ordersPanel.innerHTML = `
  <div class="orders-head">
    <span>📦 Meus Pedidos</span>
    <button class="orders-close">✖</button>
  </div>
  <div class="orders-content" id="orders-content">
    <p class="empty-orders">Carregando pedidos...</p>
  </div>
`;
document.body.appendChild(ordersPanel);

document.querySelector(".orders-close").addEventListener("click", () => {
  ordersPanel.classList.remove("active");
});

/* ===============================
   📜 CARREGAR PEDIDOS DO FIRESTORE
=============================== */
function carregarPedidos() {
  const container = document.getElementById("orders-content");
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
        const itens = Array.isArray(p.itens)
          ? p.itens.join(", ")
          : typeof p.itens === "string"
          ? p.itens
          : "Itens não especificados";

        const bloco = document.createElement("div");
        bloco.className = "order-item";
        bloco.innerHTML = `
          <h4>${new Date(p.data).toLocaleString("pt-BR")}</h4>
          <p><b>Itens:</b> ${itens}</p>
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
   🎯 EXIBIÇÃO AUTOMÁTICA DO BOTÃO
=============================== */
auth.onAuthStateChanged(user => {
  if (user) {
    ordersFab.classList.add("show");
  } else {
    ordersFab.classList.remove("show");
  }
});

/* ===============================
   🏷️ ETIQUETAS “COM MOLHO VERDE”
=============================== */
document.querySelectorAll(".badge").forEach(b => {
  b.style.background = "#ffe66b";
  b.style.color = "#333";
  b.textContent = "🌿 Com Molho Verde";
});

/* ===============================
   ✅ FIM DO SCRIPT
=============================== */
console.log("✅ DFL v1.1 – Login, Carrinho, Pedidos e Etiquetas OK");