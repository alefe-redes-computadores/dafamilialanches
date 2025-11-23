/* ============================================================
   🍔 Da Família Lanches — SCRIPT v6.0.0
   - Compatível com HTML/CSS v6.0 (promoções em grid)
   - Carrossel removido por completo
   - Nova Busca Inteligente
   - Frete (CEP + Manual + ViaCEP + Firebase)
   - Mini-Cart refeito (anti-crash)
   - Pedidos, Recompensas e Login mantidos
   - 100% compatível com Firebase 8.x
============================================================ */

/* ============================================================
   1) VARIÁVEIS GLOBAIS — ESTADO
============================================================ */

let cart = [];
let currentUser = null;
let isFirebaseInitialized = false;

// Para combos (refrigerantes)
let comboSelecionado = null;
let comboProdutoTemp = null;

// Modal aberto
let modalAberto = null;


/* ============================================================
   2) UTILITÁRIOS / HELPERS GERAIS
============================================================ */

const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;

const safe = (fn) => (...args) => {
  try { fn(...args); }
  catch (e) { console.error("🔥 ERRO:", e); }
};


/* ============================================================
   3) SOM DE CLIQUE GLOBAL (anti-crash)
============================================================ */

const clickSound = new Audio("click.wav");
document.addEventListener("click", () => {
  try {
    clickSound.currentTime = 0;
    clickSound.play();
  } catch (_) {}
});


/* ============================================================
   4) BACKDROP — FECHAR MODAIS, MINI-CART E PAINÉIS
============================================================ */

const cartBackdrop = document.querySelector("#cart-backdrop");

function abrirBackdrop() {
  cartBackdrop.classList.add("active");
}
function fecharBackdrop() {
  cartBackdrop.classList.remove("active");
}

/* Fechar no clique */
cartBackdrop.addEventListener("click", () => {
  fecharMiniCart();
  fecharModalExtras();
  fecharModalCombo();
  fecharLoginModal();
});


/* ============================================================
   5) MINI-CART — ABRIR / FECHAR / RESET
============================================================ */

const miniCart = document.querySelector("#mini-cart");
const cartIcon = document.querySelector("#cart-icon");
const cartCount = document.querySelector("#cart-count");

function abrirMiniCart() {
  miniCart.classList.add("active");
  abrirBackdrop();
}
function fecharMiniCart() {
  miniCart.classList.remove("active");
  fecharBackdrop();
}
document.querySelectorAll(".extras-close").forEach(btn => {
  btn.addEventListener("click", fecharMiniCart);
});
cartIcon.addEventListener("click", abrirMiniCart);


/* ============================================================
   6) POPUP DE CONFIRMAÇÃO (quando adiciona ao carrinho)
============================================================ */

function popupAdd(nome) {
  const div = document.createElement("div");
  div.style.position = "fixed";
  div.style.bottom = "25px";
  div.style.left = "50%";
  div.style.transform = "translateX(-50%)";
  div.style.background = "#4caf50";
  div.style.color = "#fff";
  div.style.padding = "14px 20px";
  div.style.borderRadius = "10px";
  div.style.fontWeight = "700";
  div.style.boxShadow = "0 3px 10px rgba(0,0,0,.25)";
  div.style.zIndex = "2000";
  div.style.opacity = "0";
  div.style.transition = "opacity .25s";

  div.textContent = `${nome} adicionado ao carrinho!`;

  document.body.appendChild(div);
  requestAnimationFrame(() => div.style.opacity = "1");

  setTimeout(() => {
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 250);
  }, 1500);
}


/* ============================================================
   7) MINI-CART — RENDERIZAÇÃO PRINCIPAL
============================================================ */

function renderMiniCart() {

  const list = document.querySelector(".mini-list");
  list.innerHTML = "";

  if (cart.length === 0) {
    list.innerHTML = `
      <div class="cart-empty-msg">
        <div>Seu carrinho está vazio 😢</div>
        <div>Adicione algo gostoso! 🍔🌭</div>
      </div>`;
    cartCount.textContent = "0";
    atualizarProgressoFrete(0);
    return;
  }

  let total = 0;

  cart.forEach((item, idx) => {
    total += item.price * item.qtd;

    const div = document.createElement("div");
    div.className = "mini-item";
    div.style = `
      display:flex; justify-content:space-between; 
      padding:10px 0; border-bottom:1px solid #eee;
    `;

    div.innerHTML = `
      <div>
        <b>${item.name}</b>  
        <div style="font-size:0.85rem; color:#666;">
          ${item.extras && item.extras.length ? 
            item.extras.map(e => `+ ${e.nome}`).join("<br>") 
          : ""}
        </div>
      </div>

      <div style="text-align:right;">
        <div>${money(item.price * item.qtd)}</div>
        <div style="margin-top:6px;">
          <button data-i="${idx}" class="menos-item" style="padding:2px 6px;">–</button>
          <span style="margin:0 6px;">${item.qtd}</span>
          <button data-i="${idx}" class="mais-item" style="padding:2px 6px;">+</button>
        </div>
      </div>
    `;

    list.appendChild(div);
  });

  cartCount.textContent = cart.length;
  atualizarProgressoFrete(total);

  // eventos (+/-)
  list.querySelectorAll(".menos-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.i);
      cart[i].qtd--;
      if (cart[i].qtd <= 0) cart.splice(i, 1);
      renderMiniCart();
    });
  });

  list.querySelectorAll(".mais-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.i);
      cart[i].qtd++;
      renderMiniCart();
    });
  });
}


/* ============================================================
   8) BARRA DE PROGRESSO DO FRETE GRÁTIS
============================================================ */

function atualizarProgressoFrete(total) {
  const wrap = document.querySelector("#progressWrapper");
  const fill = document.querySelector("#progressFill");
  const text = document.querySelector("#progressText");

  if (!wrap || !fill || !text) return;

  const meta = 80; // até 5km
  const falta = meta - total;

  if (falta <= 0) {
    fill.style.width = "100%";
    text.innerHTML = `🎉 Você ganhou FRETE GRÁTIS!`;
    return;
  }

  const pct = Math.min(100, (total / meta) * 100);
  fill.style.width = pct + "%";
  text.innerHTML = `Faltam <strong>${money(falta)}</strong> para Frete Grátis 🚀`;
}
/* ============================================================
   9) BUSCA INTELIGENTE — NORMALIZAÇÃO
============================================================ */

// Remove acentos e deixa tudo minúsculo
function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


/* ============================================================
   10) BANCO DE PRODUTOS PARA BUSCA
   - LEMBRA: Isso não substitui nada do cardápio
   - Serve apenas para buscar dentro do HTML já existente
============================================================ */

// Extraído do seu HTML + seus textos oficiais + promoções novas
const searchIndex = [

  /* =======================
        PROMOÇÕES v6.0
  ======================== */
  {
    id: "promo1",
    type: "promo",
    title: "2 Purizin + 1 Fanta 1L",
    desc: "2 Dog Purizin + 1 Fanta 1L — de 40 por 34,99",
    ingredientes: "pão, salsicha, purê, milho, maionese",
  },
  {
    id: "promo2",
    type: "promo",
    title: "3 Padaná",
    desc: "3 Hot Dog Padaná — de 45 por 37,99",
    ingredientes: "pão, salsicha, vinagrete, milho",
  },
  {
    id: "promo3",
    type: "promo",
    title: "2 Peleja",
    desc: "2 Burguer Peleja — de 52 por 39,99",
    ingredientes: "pão, burger artesanal, queijo, bacon",
  },
  {
    id: "promo4",
    type: "promo",
    title: "3 Trem + 1 Fanta 1L",
    desc: "3 Burger Trem + Fanta 1L — de 51 por 44,99",
    ingredientes: "pão, burger, queijo, salada",
  },
  {
    id: "promo5",
    type: "promo",
    title: "4 Trem + 1 Fanta 1L",
    desc: "4 Burger Trem + Fanta 1L — de 65 por 49,99",
    ingredientes: "pão, burger, queijo, salada",
  },
  {
    id: "promo6",
    type: "promo",
    title: "5 Uai",
    desc: "5 Uai — de 65 por 54,00",
    ingredientes: "pão, burger, queijo, bacon",
  },
  {
    id: "promo7",
    type: "promo",
    title: "4 TremBão + 1 Fanta 1L",
    desc: "4 TremBão + 1 Fanta — de 77 por 59,99",
    ingredientes: "pão, salsicha, purê, batata-palha, molho",
  },
  {
    id: "promo8",
    type: "promo",
    title: "4 Armaria",
    desc: "4 Armaria — de 72 por 59,99",
    ingredientes: "pão, burger, cheddar, bacon, barbecue",
  },
  {
    id: "promo9",
    type: "promo",
    title: "5 Uai + 1 Kuat",
    desc: "5 Uai + 1 Kuat — de 75 por 64,99",
    ingredientes: "pão, burger, queijo, bacon",
  },

  /* =======================
        HAMBÚRGUERES
  ======================== */

  {
    id: "b1",
    type: "burger",
    title: "Bão",
    desc: "Hambúrguer simples e gostoso",
    ingredientes: "pão brioche, burger, queijo prato, molho especial",
  },
  {
    id: "b2",
    type: "burger",
    title: "Uai",
    desc: "Clássico mineiro com bacon",
    ingredientes: "pão brioche, burger, queijo, bacon crocante",
  },
  {
    id: "b3",
    type: "burger",
    title: "Trem",
    desc: "O favorito da galera",
    ingredientes: "pão brioche, burger, queijo, salada, molho",
  },
  {
    id: "b4",
    type: "burger",
    title: "Cadim",
    desc: "Pra quem quer só um cadim mais",
    ingredientes: "burger duplo, queijo, molho",
  },
  {
    id: "b5",
    type: "burger",
    title: "Armaria",
    desc: "O mais pedido!",
    ingredientes: "pão brioche, burger, cheddar, bacon, barbecue",
  },

  /* =======================
      HOT DOGS
  ======================== */

  {
    id: "hd1",
    type: "hotdog",
    title: "Nigucim",
    desc: "Nosso dog mais baratinho",
    ingredientes: "pão, 1 salsicha, vinagrete, milho, batata palha",
  },
  {
    id: "hd2",
    type: "hotdog",
    title: "Simprão",
    desc: "Simples e barato",
    ingredientes: "1 salsicha, sem vinagrete",
  },
  {
    id: "hd3",
    type: "hotdog",
    title: "Nimin",
    desc: "2 salsichas + bacon + vinagrete",
    ingredientes: "pão, 2 salsichas, bacon, vinagrete",
  },
  {
    id: "hd4",
    type: "hotdog",
    title: "Padaná",
    desc: "Um dos mais pedidos",
    ingredientes: "pão, salsicha, milho, vinagrete",
  },
  {
    id: "hd5",
    type: "hotdog",
    title: "Purizin",
    desc: "Com purê cremoso",
    ingredientes: "pão, salsicha, purê, batata palha",
  },

  /* =======================
        COMBOS
  ======================== */

  {
    id: "combo1",
    type: "combo",
    title: "Combo Família Tradicional",
    desc: "4 burgers tradicionais + Kuat 2L",
    ingredientes: "burger, queijo, salada, refrigerante",
  },
  {
    id: "combo2",
    type: "combo",
    title: "Combo Casal Trem",
    desc: "2 Trem + Fanta 1L",
    ingredientes: "burger, queijo, salada, refrigerante",
  },
  {
    id: "combo3",
    type: "combo",
    title: "Combo Artesanal",
    desc: "2 Peleja + Coca 1L",
    ingredientes: "burger artesanal, bacon, cheddar",
  },
];


/* ============================================================
   11) EXECUÇÃO DA BUSCA
============================================================ */

function executarBusca(query) {
  const termo = normalize(query.trim());

  if (!termo) return [];

  return searchIndex.filter(item => {

    const titulo = normalize(item.title);
    const desc   = normalize(item.desc);
    const ing    = normalize(item.ingredientes);

    return (
      titulo.includes(termo) ||
      desc.includes(termo)   ||
      ing.includes(termo)
    );
  });
}


/* ============================================================
   12) RENDERIZAÇÃO DO RESULTADO
============================================================ */

function renderizarResultados(lista) {
  const box = document.querySelector("#search-results");
  box.innerHTML = "";

  if (!lista.length) {
    box.innerHTML = `
      <div style="padding:15px; text-align:center; color:#555;">
        Nenhum item encontrado 🧐<br>
        Tente outra palavra!
      </div>
    `;
    return;
  }

  lista.forEach(item => {
    const div = document.createElement("div");
    div.className = "search-item";

    // vai rolar scroll até o card clicado
    div.addEventListener("click", () => {
      const target = document.querySelector(`#${item.id}`);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    div.innerHTML = `
      <div class="search-title">${item.title}</div>
      <div class="search-desc">${item.desc}</div>
    `;

    box.appendChild(div);
  });
}


/* ============================================================
   13) EVENTOS — ENTER / INPUT
============================================================ */

const searchInput = document.querySelector("#search-input");

if (searchInput) {

  searchInput.addEventListener("input", () => {
    const txt = searchInput.value.trim();
    renderizarResultados(executarBusca(txt));
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const txt = searchInput.value.trim();
      renderizarResultados(executarBusca(txt));
    }
  });
}
/* ============================================================
   🟡 PARTE 3 — SISTEMA DE MODAIS V5.5 (100% COMPATÍVEL)
   - Abrir / Fechar modais
   - Blindagem contra bugs ("abre e fecha", duplo clique, loop)
   - Clique fora fecha modal corretamente
   - Compatível com: extras, combos, login, dashboard, pedidos,
     recompensas e backdrop global.
   ============================================================ */

/* ---------- SELECTORS ---------- */
const modalExtras = document.getElementById("extras-modal");
const modalCombo = document.getElementById("combo-modal");
const modalLogin = document.getElementById("login-modal");
const modalAdmin = document.getElementById("admin-dashboard");
const modalPedidos = document.getElementById("pedidos-panel");
const modalRecompensas = document.getElementById("recompensas-panel");

const backdropCart = document.getElementById("cart-backdrop");

const btnCloseExtras = document.querySelector(".extras-close");
const btnCloseCombo = document.querySelector(".combo-close");
const btnCloseLogin = document.querySelector(".login-close");
const btnCloseAdmin = document.querySelector(".dashboard-close");
const btnClosePedidos = document.querySelector(".fechar-pedidos");
const btnCloseRecompensas = document.querySelector(".fechar-recompensas");

/* ---------- FUNÇÃO UNIVERSAL PARA ABRIR MODAL ---------- */
function abrirModal(modal) {
    if (!modal) return;

    // Fecha qualquer modal aberto antes
    document.querySelectorAll(".modal.show").forEach(m => m.classList.remove("show"));
    document.querySelectorAll(".painel-aberto").forEach(p => p.classList.remove("active"));

    modal.classList.add("show");

    // Ativa backdrop se for modal de tela cheia
    if (modal !== modalPedidos && modal !== modalRecompensas) {
        backdropCart.classList.add("active");
    }
}

/* ---------- FUNÇÃO UNIVERSAL PARA FECHAR MODAL ---------- */
function fecharModal(modal) {
    if (!modal) return;
    modal.classList.remove("show");

    // Fecha painéis laterais
    if (modal.classList.contains("painel-aberto")) {
        modal.classList.remove("active");
    }

    // Fecha backdrop se nenhum modal estiver aberto
    setTimeout(() => {
        const aberto = document.querySelector(".modal.show");
        if (!aberto) backdropCart.classList.remove("active");
    }, 150);
}

/* ---------- FUNÇÃO PARA PAINÉIS LATERAIS ---------- */
function abrirPainel(painel) {
    if (!painel) return;
    painel.classList.add("active");
}
function fecharPainel(painel) {
    if (!painel) return;
    painel.classList.remove("active");
}

/* ============================================================
   BOTÕES DE FECHAR
   ============================================================ */
if (btnCloseExtras) btnCloseExtras.onclick = () => fecharModal(modalExtras);
if (btnCloseCombo) btnCloseCombo.onclick = () => fecharModal(modalCombo);
if (btnCloseLogin) btnCloseLogin.onclick = () => fecharModal(modalLogin);
if (btnCloseAdmin) btnCloseAdmin.onclick = () => fecharModal(modalAdmin);
if (btnClosePedidos) btnClosePedidos.onclick = () => fecharPainel(modalPedidos);
if (btnCloseRecompensas) btnCloseRecompensas.onclick = () => fecharPainel(modalRecompensas);

/* ============================================================
   CLIQUE FORA — FECHAR MODAL
   ============================================================ */
window.addEventListener("click", (e) => {
    const aberto = document.querySelector(".modal.show");

    if (!aberto) return;

    const content = aberto.querySelector(".modal-content");

    if (content && !content.contains(e.target)) {
        fecharModal(aberto);
    }
});

/* ============================================================
   CLIQUE FORA — FECHAR PAINÉIS LATERAIS (Pedidos / Recompensas)
   ============================================================ */
document.addEventListener("click", function (e) {
    if (modalPedidos && modalPedidos.classList.contains("active")) {
        if (!modalPedidos.contains(e.target) && !e.target.closest(".meus-pedidos-btn")) {
            fecharPainel(modalPedidos);
        }
    }

    if (modalRecompensas && modalRecompensas.classList.contains("active")) {
        if (!modalRecompensas.contains(e.target) && !e.target.closest(".recompensas-btn")) {
            fecharPainel(modalRecompensas);
        }
    }
});

/* ============================================================
   BOTÕES QUE ABREM OS MODAIS (GENÉRICOS)
   ============================================================ */
document.addEventListener("click", function (e) {
    const abrir = e.target.closest("[data-open]");
    if (!abrir) return;

    const alvo = abrir.getAttribute("data-open");

    switch (alvo) {
        case "extras":
            abrirModal(modalExtras);
            break;

        case "combo":
            abrirModal(modalCombo);
            break;

        case "login":
            abrirModal(modalLogin);
            break;

        case "admin":
            abrirModal(modalAdmin);
            break;

        case "pedidos":
            abrirPainel(modalPedidos);
            break;

        case "recompensas":
            abrirPainel(modalRecompensas);
            break;
    }
});

/* ============================================================
   ESC FECHA MODAIS
   ============================================================ */
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        if (document.querySelector(".modal.show")) {
            document.querySelectorAll(".modal.show").forEach(m => m.classList.remove("show"));
            backdropCart.classList.remove("active");
        }
        if (modalPedidos && modalPedidos.classList.contains("active")) {
            fecharPainel(modalPedidos);
        }
        if (modalRecompensas && modalRecompensas.classList.contains("active")) {
            fecharPainel(modalRecompensas);
        }
    }
});
/* ============================================================
   🔍 PARTE 4 — SISTEMA DE BUSCA GLOBAL V6.0
   - Campo: #campoBusca
   - Filtra TODAS as seções (promoções, tradicionais, artesanais, hot dogs, combos)
   - Fuzzy search leve (corrige acentos + minúsculas)
   ============================================================ */

const campoBusca = document.getElementById("campoBusca");
const secoes = document.querySelectorAll("section");
let feedbackBusca = null;

/* Função utilitária para remover acentos */
function normalizarTexto(txt) {
    return txt
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

/* Cria o banner de feedback se ainda não existir */
function criarFeedbackBusca() {
    if (!feedbackBusca) {
        feedbackBusca = document.createElement("div");
        feedbackBusca.className = "feedback-busca";
        campoBusca.insertAdjacentElement("afterend", feedbackBusca);
    }
}

/* Exibir mensagem */
function exibirMensagemBusca(msg, tipo = "erro") {
    criarFeedbackBusca();
    feedbackBusca.textContent = msg;
    feedbackBusca.className = "feedback-busca " + tipo;
}

/* Limpar feedback */
function limparFeedbackBusca() {
    if (feedbackBusca) feedbackBusca.textContent = "";
}

/* Função principal */
function realizarBusca() {
    const termo = normalizarTexto(campoBusca.value);

    limparFeedbackBusca();

    if (termo.length === 0) {
        // Mostra todas as seções
        secoes.forEach(sec => sec.style.display = "block");
        document.querySelectorAll(".card").forEach(c => c.style.display = "block");
        return;
    }

    let encontrou = false;

    secoes.forEach(secao => {
        let cardsVisiveis = 0;

        const cards = secao.querySelectorAll(".card, .promo-card");

        cards.forEach(card => {
            const titulo = normalizarTexto(card.querySelector("h3, .titulo-produto-promo")?.textContent || "");
            const desc = normalizarTexto(card.querySelector("p, .desc-produto-promo-destaque")?.textContent || "");

            if (titulo.includes(termo) || desc.includes(termo)) {
                card.style.display = "block";
                cardsVisiveis++;
                encontrou = true;
            } else {
                card.style.display = "none";
            }
        });

        // Se a seção inteira não tiver resultados → oculta seção
        secao.style.display = cardsVisiveis > 0 ? "block" : "none";
    });

    if (!encontrou) {
        exibirMensagemBusca("Nenhum item encontrado. Tente outro nome ✨", "erro");
    }
}

/* ENTER inicia a busca */
campoBusca.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        realizarBusca();
        campoBusca.blur();
    }
});

/* Busca automática enquanto digita */
campoBusca.addEventListener("input", () => {
    realizarBusca();
});
/* ============================================================
   🛒 PARTE 5 — ADICIONAR PROMOÇÕES AO CARRINHO (V6.0)
   - Cada card de promoção tem data-promo-id="X"
   - Promoções NÃO têm adicionais
   - Preço vem diretamente do HTML
   ============================================================ */

/* Função principal para adicionar promoções */
function adicionarPromoAoCarrinho(promoId) {
    try {
        const card = document.querySelector(`[data-promo-id="${promoId}"]`);
        if (!card) {
            console.warn("Promoção não encontrada:", promoId);
            return;
        }

        const titulo = card.querySelector(".titulo-produto-promo")?.textContent.trim() || "Promoção";
        const precoElement = card.querySelector(".preco-novo b");
        const preco = precoElement ? Number(precoElement.textContent.replace(",", ".").trim()) : 0;

        if (!preco || preco === 0) {
            console.error("❌ ERRO: Preço da promoção não encontrado");
            return;
        }

        const promoItem = {
            id: "promo-" + promoId,
            nome: titulo,
            preco: preco,
            quantidade: 1,
            isPromo: true,
            adicionais: []
        };

        cart.push(promoItem);
        salvarCarrinho();
        atualizarMiniCarrinho();
        abrirMiniCarrinho();

        console.log(`Promo adicionada: ${promoId} - ${titulo} - R$ ${preco}`);

    } catch (e) {
        console.error("Erro ao adicionar promoção:", e);
    }
}

/* Delegação de eventos: todas promoções com botão .add-promo */
document.addEventListener("click", function (e) {
    const btn = e.target.closest(".add-promo");
    if (!btn) return;

    const promoId = btn.getAttribute("data-promo-id");
    if (!promoId) return;

    adicionarPromoAoCarrinho(promoId);
});
/* ============================================================
   🛒 PARTE 6 — RENDERIZAÇÃO DO MINI-CARRINHO (V6.0)
   - Compatível com promoções (isPromo: true)
   - Mantém todos os fluxos antigos do site
   ============================================================ */

function atualizarMiniCarrinho() {
    const list = document.querySelector(".mini-list");
    const footTotal = document.querySelector("#mini-total");

    if (!list) return;

    list.innerHTML = "";

    if (cart.length === 0) {
        list.innerHTML = `
            <div class="cart-empty-msg">
                <div>Seu carrinho está vazio 😕</div>
                <div>Adicione algo gostoso aí!</div>
            </div>
        `;
        footTotal.textContent = "R$ 0,00";
        return;
    }

    let total = 0;

    cart.forEach((item, idx) => {
        const precoItem = Number(item.preco || 0);
        const subtotal = precoItem * item.quantidade;
        total += subtotal;

        // 🔥 Se for promoção, não exibe adicionais
        const adicionaisHTML = item.isPromo
            ? ""
            : `
                <div class="item-extras">
                    ${item.adicionais?.length ? item.adicionais.map(ad => `
                        <div class="extra-item">
                            + ${ad.nome} <span>R$ ${Number(ad.preco).toFixed(2).replace(".", ",")}</span>
                        </div>
                    `).join("") : ""}
                </div>
            `;

        const card = document.createElement("div");
        card.className = "mini-item";

        card.innerHTML = `
            <div class="mini-item-line">
                <span class="mini-item-name">
                    ${item.nome}
                    ${item.isPromo ? `<span class="badge-small economia">Promoção</span>` : ""}
                </span>
                <button class="remove-item" data-index="${idx}">×</button>
            </div>

            ${adicionaisHTML}

            <div class="mini-item-bottom">
                <div class="mini-qty">
                    <button class="qty-btn diminuir" data-index="${idx}">−</button>
                    <span>${item.quantidade}</span>
                    <button class="qty-btn aumentar" data-index="${idx}">+</button>
                </div>

                <div class="mini-subtotal">
                    R$ ${subtotal.toFixed(2).replace(".", ",")}
                </div>
            </div>
        `;

        list.appendChild(card);
    });

    footTotal.textContent = money(total);
}
/* ============================================================
   🛒 PARTE 7 — Funções de Quantidade e Remoção (V6.0)
   - Compatível com promoções
   - Blindado contra índices inválidos
   - Mantém fluxo antigo 100%
   ============================================================ */

// Aumentar quantidade de item
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("aumentar")) {
        const index = Number(e.target.dataset.index);
        if (isNaN(index) || !cart[index]) return;

        cart[index].quantidade++;
        salvarCarrinho();
        atualizarMiniCarrinho();
    }
});

// Diminuir quantidade
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("diminuir")) {
        const index = Number(e.target.dataset.index);
        if (isNaN(index) || !cart[index]) return;

        if (cart[index].quantidade > 1) {
            cart[index].quantidade--;
        } else {
            // Remove automaticamente se ficar 1 → 0
            cart.splice(index, 1);
        }

        salvarCarrinho();
        atualizarMiniCarrinho();
    }
});

// Remover item (X)
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-item")) {
        const index = Number(e.target.dataset.index);
        if (isNaN(index) || !cart[index]) return;

        cart.splice(index, 1);
        salvarCarrinho();
        atualizarMiniCarrinho();
    }
});

/* ============================================================
   🔒 Função de persistência — Mantida do seu fluxo
   ============================================================ */
function salvarCarrinho() {
    try {
        localStorage.setItem("dfl_cart", JSON.stringify(cart));
    } catch (e) {
        console.error("Erro ao salvar carrinho:", e);
    }
}
/* ============================================================
   🟩 PARTE 8 — Função oficial para Adicionar Promoções ao Carrinho
   - Compatível com toda a arquitetura v6.0
   - Blindada contra cliques inválidos e objetos inconsistentes
   ============================================================ */

function addPromoCart(promoId, nome, preco, imagem) {
    try {
        if (!promoId || !nome || !preco) {
            console.warn("Promoção inválida:", { promoId, nome, preco, imagem });
            return;
        }

        cart.push({
            nome: nome,
            preco: Number(preco),
            quantidade: 1,
            imagem: imagem || "",  // Caso a promo não tenha miniatura específica
            isPromo: true,          // Marca como promoção
            promoId: promoId        // Para identificação em relatórios / repetição futura
        });

        salvarCarrinho();
        atualizarMiniCarrinho();

        // Som opcional ao adicionar
        try { 
            sound.currentTime = 0;
            sound.play();
        } catch (e) {}

    } catch (e) {
        console.error("Erro ao adicionar promoção ao carrinho:", e);
    }
}
