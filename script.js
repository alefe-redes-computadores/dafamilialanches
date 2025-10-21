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
let currentUser = null;

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
// ⏳ CONTAGEM REGRESSIVA
// ===============================
function atualizarTimer() {
  const agora = new Date();
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  const diff = fim - agora;
  if (diff <= 0)
    return (document.getElementById("timer").textContent = "00:00:00");
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
}
// ===============================
// 📦 FINALIZAR PEDIDO (Firestore)
// ===============================
function fecharPedido() {
  if (cart.length === 0) return alert("Carrinho vazio!");
  const total = cart.reduce((acc, i) => acc + i.preco * i.qtd, 0);

  // se o usuário não estiver logado
  if (!currentUser) {
    alert("Você precisa estar logado para enviar o pedido!");
    loginModal.classList.add("show");
    return;
  }

  const pedido = {
    usuario: currentUser.email,
    nome: currentUser.displayName || "Usuário",
    itens: cart.map(i => `${i.nome} x${i.qtd}`),
    total: total.toFixed(2),
    data: new Date().toISOString(),
  };

  // salvar no Firestore
  db.collection("pedidos")
    .add(pedido)
    .then(() => {
      alert("Pedido salvo com sucesso no sistema ✅");
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

// botão principal
document.addEventListener("click", e => {
  if (e.target.id === "close-order") fecharPedido();
});

// ===============================
// ➕ ADICIONAIS
// ===============================
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

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===============================
// 👤 LOGIN / CADASTRO
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

// login com e-mail
document.querySelector(".btn-primario").addEventListener("click", () => {
  const email = document.getElementById("login-email").value;
  const senha = document.getElementById("login-senha").value;
  if (!email || !senha) return alert("Preencha e-mail e senha.");

  auth.signInWithEmailAndPassword(email, senha)
    .then(cred => {
      currentUser = cred.user;
      userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
      loginModal.classList.remove("show");
      document.body.classList.remove("no-scroll");
      carregarPedidos();
    })
    .catch(() => {
      // se o usuário não existir, cria uma conta
      auth.createUserWithEmailAndPassword(email, senha)
        .then(cred => {
          currentUser = cred.user;
          userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
          loginModal.classList.remove("show");
          document.body.classList.remove("no-scroll");
          alert("Conta criada com sucesso! 🎉");
        })
        .catch(err => alert("Erro: " + err.message));
    });
});

// login com Google
document.querySelector(".btn-google").addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      currentUser = result.user;
      userBtn.textContent = `Olá, ${currentUser.displayName.split(" ")[0]}`;
      loginModal.classList.remove("show");
      document.body.classList.remove("no-scroll");
      carregarPedidos();
    })
    .catch(err => alert("Erro no login com Google: " + err.message));
});

// mantém o login
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
    carregarPedidos();
  }
});

// ===============================
// 📋 MEUS PEDIDOS
// ===============================
const fab = document.createElement("button");
fab.id = "orders-fab";
fab.innerHTML = "📦 Meus Pedidos";
document.body.appendChild(fab);

const panel = document.createElement("aside");
panel.className = "orders-panel";
panel.innerHTML = `
  <div class="orders-head">
    <span>📦 Meus Pedidos</span>
    <button class="orders-close">✕</button>
  </div>
  <div class="orders-content"></div>
`;
document.body.appendChild(panel);

// abrir/fechar
fab.addEventListener("click", () => {
  if (!currentUser) return alert("Faça login para ver seus pedidos.");
  panel.classList.add("active");
  carregarPedidos();
});
panel.querySelector(".orders-close").addEventListener("click", () => {
  panel.classList.remove("active");
});

// carregar pedidos do Firestore
function carregarPedidos() {
  if (!currentUser) return;
  const content = panel.querySelector(".orders-content");
  content.innerHTML = "<p>Carregando...</p>";

  db.collection("pedidos")
    .where("usuario", "==", currentUser.email)
    .orderBy("data", "desc")
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        content.innerHTML = `<p class="empty-orders">Você ainda não fez nenhum pedido.</p>`;
        return;
      }

      content.innerHTML = "";
      snapshot.forEach(doc => {
        const p = doc.data();
        const div = document.createElement("div");
        div.className = "order-item";
        div.innerHTML = `
          <h4>${p.nome}</h4>
          <p>${p.itens.join("<br>")}</p>
          <p><b>Total:</b> R$ ${p.total}</p>
          <small>${new Date(p.data).toLocaleString("pt-BR")}</small>
        `;
        content.appendChild(div);
      });
    })
    .catch(err => {
      content.innerHTML = `<p>Erro ao carregar pedidos: ${err.message}</p>`;
    });
}

// mostra o botão “Meus Pedidos” após login
auth.onAuthStateChanged(user => {
  if (user) fab.classList.add("show");
  else fab.classList.remove("show");
});