// DFL v3.6.7 — Cart.js (compatível com mobile)

let carrinho = [];
let contadorCarrinho = document.getElementById("cart-count");
let miniCart = document.getElementById("mini-cart");
let miniList = document.querySelector(".mini-list");
let backdrop = document.getElementById("cart-backdrop");

// Função utilitária de formatação de moeda
function money(valor) {
  return `R$ ${Number(valor || 0).toFixed(2).replace(".", ",")}`;
}

// Renderiza o conteúdo do mini carrinho
function renderMiniCart() {
  if (!miniList) return;

  miniList.innerHTML = "";

  if (carrinho.length === 0) {
    miniList.innerHTML = `<p style="text-align:center;margin:15px 0;">🛒 Seu carrinho está vazio.</p>`;
  } else {
    carrinho.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "mini-item";
      div.innerHTML = `
        <div class="mini-info">
          <b>${item.nome}</b><br>
          <small>${money(item.preco)} — ${item.quantidade}x</small>
        </div>
        <button class="remover-item" data-index="${index}">✖</button>
      `;
      miniList.appendChild(div);
    });
  }

  // Atualiza contador
  atualizarContador();

  // Atualiza total
  const total = carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  const totalDiv = document.createElement("div");
  totalDiv.className = "mini-total";
  totalDiv.innerHTML = `<b>Total:</b> ${money(total)}`;
  miniList.appendChild(totalDiv);

  // Botão finalizar
  const btnFinalizar = document.createElement("button");
  btnFinalizar.className = "btn-finalizar";
  btnFinalizar.textContent = "✅ Finalizar Pedido";
  btnFinalizar.addEventListener("click", () => fecharPedido());
  miniList.appendChild(btnFinalizar);

  // Evento para remover item
  document.querySelectorAll(".remover-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const i = e.target.getAttribute("data-index");
      removerItem(i);
    });
  });
}

// Atualiza o número no ícone do carrinho
function atualizarContador() {
  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  contadorCarrinho.textContent = totalItens;
}

// Adiciona item ao carrinho
function adicionarItem(nome, preco) {
  const existente = carrinho.find((p) => p.nome === nome);
  if (existente) {
    existente.quantidade++;
  } else {
    carrinho.push({ nome, preco, quantidade: 1 });
  }

  salvarCarrinho();
  renderMiniCart();
  abrirMiniCart();
  somClick();
}

// Remove item
function removerItem(index) {
  carrinho.splice(index, 1);
  salvarCarrinho();
  renderMiniCart();
  somClick();
}

// Salva carrinho no localStorage
function salvarCarrinho() {
  localStorage.setItem("dflCarrinho", JSON.stringify(carrinho));
}

// Carrega carrinho salvo
function carregarCarrinho() {
  const salvo = localStorage.getItem("dflCarrinho");
  if (salvo) {
    try {
      carrinho = JSON.parse(salvo);
    } catch {
      carrinho = [];
    }
  }
  atualizarContador();
}

// Função de clique sonoro
function somClick() {
  const sound = new Audio("click.wav");
  try { sound.currentTime = 0; sound.play(); } catch (_) {}
}

// Abre mini carrinho
function abrirMiniCart() {
  miniCart.classList.add("active");
  backdrop.classList.add("active");
  document.body.classList.add("no-scroll");
}

// Fecha mini carrinho
function fecharMiniCart() {
  miniCart.classList.remove("active");
  backdrop.classList.remove("active");
  document.body.classList.remove("no-scroll");
}

// Finaliza pedido (simples)
function fecharPedido() {
  if (carrinho.length === 0) {
    alert("Seu carrinho está vazio.");
    return;
  }

  const total = carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  let resumo = "🧾 *Resumo do Pedido:*\n\n";
  carrinho.forEach((p) => {
    resumo += `🍔 ${p.quantidade}x ${p.nome} — ${money(p.preco * p.quantidade)}\n`;
  });
  resumo += `\n💰 *Total:* ${money(total)}`;

  const msg = encodeURIComponent(resumo);
  const url = `https://wa.me/5534997178336?text=${msg}`;
  window.open(url, "_blank");

  carrinho = [];
  salvarCarrinho();
  renderMiniCart();
  fecharMiniCart();
}

// Configurações iniciais do carrinho
function setupCart() {
  carregarCarrinho();

  // Fecha mini cart ao clicar no fundo
  backdrop?.addEventListener("click", fecharMiniCart);

  // Fecha mini cart ao clicar no botão de fechar
  document.querySelectorAll(".extras-close").forEach((btn) =>
    btn.addEventListener("click", fecharMiniCart)
  );

  // Adiciona evento a todos os botões "Adicionar"
  document.querySelectorAll(".add-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".card");
      if (!card) return;
      const nome = card.getAttribute("data-name");
      const preco = parseFloat(card.getAttribute("data-price"));
      adicionarItem(nome, preco);
    });
  });
}

// Inicialização automática se o core já carregou
document.addEventListener("DOMContentLoaded", setupCart);