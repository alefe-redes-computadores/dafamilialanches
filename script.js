/* ===================================================
   DFL – script.js (compatível com seu HTML atual)
   =================================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ============== 1) STATUS (ABERTO/FECHADO) ============== */
  const statusBanner = document.getElementById("status-banner");
  function atualizarStatus() {
    if (!statusBanner) return;
    const agora = new Date();
    const d = agora.getDay(); // 0 dom ... 6 sáb
    const h = agora.getHours();
    const m = agora.getMinutes();
    let aberto = false;
    let txt = "";

    if (d === 2) {
      aberto = false;
      txt = "❌ Fechado — abrimos amanhã às 18h";
    } else if ([1, 3, 4].includes(d)) {
      aberto = (h > 18 || (h === 18 && m >= 0)) && (h < 23 || (h === 23 && m <= 15));
      txt = aberto ? "🟢 Aberto até 23h15" : "🔴 Fechado — abrimos às 18h";
    } else if ([5, 6, 0].includes(d)) {
      aberto = (h > 17 || (h === 17 && m >= 30)) && (h < 23 || (h === 23 && m <= 30));
      txt = aberto ? "🟢 Aberto até 23h30" : "🔴 Fechado — abrimos às 17h30";
    }

    statusBanner.textContent = txt;
    statusBanner.className = aberto ? "status-banner aberto" : "status-banner fechado";
  }
  atualizarStatus();
  setInterval(atualizarStatus, 60000);

  /* ============== 2) CONTAGEM REGRESSIVA 23:59:59 ============== */
  const timer = document.getElementById("timer");
  function atualizarContagem() {
    if (!timer) return;
    const agora = new Date();
    const fim = new Date();
    fim.setHours(23, 59, 59, 999);
    const diff = fim - agora;
    if (diff <= 0) {
      timer.textContent = "00:00:00";
      return;
    }
    const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
    timer.textContent = `${h}:${m}:${s}`;
  }
  atualizarContagem();
  setInterval(atualizarContagem, 1000);

  /* ============== 3) CARROSSEL PROMOS ============== */
  const slides = document.querySelector(".slides");
  const prev = document.querySelector(".c-prev");
  const next = document.querySelector(".c-next");

  if (slides && prev && next) {
    prev.addEventListener("click", () => slides.scrollBy({ left: -300, behavior: "smooth" }));
    next.addEventListener("click", () => slides.scrollBy({ left: 300, behavior: "smooth" }));

    slides.querySelectorAll(".slide").forEach((img) => {
      img.addEventListener("click", () => {
        const msg = img.getAttribute("data-wa") || "Quero a promoção!";
        window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(msg)}`, "_blank");
      });
    });
  }

  /* ============== 4) CARRINHO ============== */
  const cartIcon = document.getElementById("cart-icon");     // <- seu HTML
  const miniCart = document.getElementById("mini-cart");
  const cartBackdrop = document.getElementById("cart-backdrop");
  const miniList = document.getElementById("mini-list");
  const cartCount = document.getElementById("cart-count");
  const btnClear = document.getElementById("mini-clear");
  const btnCheckout = document.getElementById("mini-checkout");
  const btnCloseMini = document.querySelector(".mini-close");

  let carrinho = [];

  function atualizarCarrinho() {
    if (!miniList || !cartCount) return;
    miniList.innerHTML = "";
    let totalItens = 0;

    carrinho.forEach((item, idx) => {
      totalItens += item.qtd;

      const linha = document.createElement("div");
      linha.className = "mini-item";
      const extrasTxt = item.extras && item.extras.length
        ? ` <small>(+${item.extras.join(", ")})</small>`
        : "";
      linha.innerHTML = `
        <span><b>${item.qtd}x</b> ${item.nome}${extrasTxt}</span>
        <div>
          <button class="rm" data-i="${idx}" title="Remover">✕</button>
        </div>
      `;
      miniList.appendChild(linha);
    });

    cartCount.textContent = String(totalItens);

    // listeners de remover
    miniList.querySelectorAll(".rm").forEach((b) => {
      b.addEventListener("click", () => {
        const i = Number(b.getAttribute("data-i"));
        carrinho.splice(i, 1);
        atualizarCarrinho();
      });
    });
  }

  function abrirCarrinho() {
    if (!miniCart || !cartBackdrop) return;
    miniCart.classList.add("active");
    cartBackdrop.classList.add("show");
  }
  function fecharCarrinho() {
    if (!miniCart || !cartBackdrop) return;
    miniCart.classList.remove("active");
    cartBackdrop.classList.remove("show");
  }

  if (cartIcon) cartIcon.addEventListener("click", abrirCarrinho);
  if (cartBackdrop) cartBackdrop.addEventListener("click", fecharCarrinho);
  if (btnCloseMini) btnCloseMini.addEventListener("click", fecharCarrinho);
  if (btnClear) btnClear.addEventListener("click", () => { carrinho = []; atualizarCarrinho(); });

  if (btnCheckout) {
    btnCheckout.addEventListener("click", () => {
      if (!carrinho.length) return alert("Seu carrinho está vazio.");
      let msg = "*Pedido Da Família Lanches*%0A";
      carrinho.forEach((i) => {
        const extras = i.extras && i.extras.length ? ` (+${i.extras.join(", ")})` : "";
        msg += `%0A• *${i.qtd}x ${i.nome}*${extras}`;
      });
      msg += "%0A%0AObrigado! 💛";
      window.open(`https://wa.me/5534997178336?text=${msg}`, "_blank");
    });
  }

  /* ============== 5) BOTÕES ADICIONAR + POPUP ============== */
  function mostrarPopupAdd(nomeProduto) {
    const popup = document.createElement("div");
    popup.className = "add-popup";
    popup.textContent = `+1 ${nomeProduto} adicionado!`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
  }

  document.querySelectorAll(".add-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      if (!card) return;
      const nome = card.dataset.name || "Item";
      const preco = parseFloat(card.dataset.price || "0");

      const existente = carrinho.find((x) => x.nome === nome && (!x.extras || x.extras.length === 0));
      if (existente) existente.qtd += 1;
      else carrinho.push({ nome, preco, qtd: 1, extras: [] });

      // animação no botão
      btn.classList.add("clicked");
      setTimeout(() => btn.classList.remove("clicked"), 200);

      mostrarPopupAdd(nome);
      atualizarCarrinho();
    });
  });

  /* ============== 6) MODAL DE ADICIONAIS ============== */
  const extrasBackdrop = document.getElementById("extras-backdrop");
  const extrasModal = document.getElementById("extras-modal");
  const extrasList = document.getElementById("extras-list");
  const extrasCancel = document.getElementById("extras-cancel");
  const extrasAdd = document.getElementById("extras-add");
  const extrasClose = document.querySelector(".extras-close");
  let cardAtual = null;

  // lista de adicionais (hambúrguer/hot dog)
  const ADICIONAIS = [
    { nome: "Cebola", preco: 0.99 },
    { nome: "Salada", preco: 1.99 },
    { nome: "Ovo", preco: 1.99 },
    { nome: "Salsicha", preco: 1.99 },
    { nome: "Bacon", preco: 2.99 },
    { nome: "Molho Verde", preco: 2.99 },
    { nome: "Hambúrguer Tradicional", preco: 2.99 },
    { nome: "Cheddar", preco: 3.99 },
    { nome: "Filé de Frango", preco: 6.99 },
    { nome: "Hambúrguer Artesanal 120g", preco: 7.99 },
  ];

  function abrirExtras(card) {
    if (!extrasModal || !extrasBackdrop || !extrasList) return;
    cardAtual = card;
    extrasList.innerHTML = ADICIONAIS.map((a, i) =>
      `<label><input type="checkbox" data-i="${i}"> ${a.nome} – R$${a.preco.toFixed(2)}</label>`
    ).join("");
    extrasModal.classList.add("open");
    extrasBackdrop.classList.add("show");
  }
  function fecharExtras() {
    if (!extrasModal || !extrasBackdrop) return;
    extrasModal.classList.remove("open");
    extrasBackdrop.classList.remove("show");
    cardAtual = null;
  }

  document.querySelectorAll(".extras-btn").forEach((b) => {
    b.addEventListener("click", () => {
      const card = b.closest(".card");
      if (!card) return;
      abrirExtras(card);
    });
  });
  if (extrasCancel) extrasCancel.addEventListener("click", fecharExtras);
  if (extrasClose) extrasClose.addEventListener("click", fecharExtras);
  if (extrasBackdrop) extrasBackdrop.addEventListener("click", fecharExtras);

  if (extrasAdd) {
    extrasAdd.addEventListener("click", () => {
      if (!cardAtual) return fecharExtras();
      const nome = cardAtual.dataset.name || "Item";
      const preco = parseFloat(cardAtual.dataset.price || "0");
      const selecionados = [...extrasList.querySelectorAll("input:checked")]
        .map((inp) => ADICIONAIS[Number(inp.dataset.i)].nome);

      // Agrupa por nome+extras (para não misturar com o "sem extras")
      const keyMatch = (x) =>
        x.nome === nome &&
        Array.isArray(x.extras) &&
        x.extras.length === selecionados.length &&
        x.extras.every((e) => selecionados.includes(e));

      const existente = carrinho.find(keyMatch);
      if (existente) existente.qtd += 1;
      else carrinho.push({ nome, preco, qtd: 1, extras: selecionados });

      mostrarPopupAdd(nome);
      atualizarCarrinho();
      fecharExtras();
    });
  }

  /* ============== 7) MOBILE: FECHAR POR TOQUE/GEStO ============== */
  if (window.innerWidth <= 768) {
    if (cartBackdrop) cartBackdrop.addEventListener("click", fecharCarrinho);

    if (miniCart) {
      let startY = null;
      miniCart.addEventListener("touchstart", (e) => {
        startY = e.touches[0].clientY;
      });
      miniCart.addEventListener("touchmove", (e) => {
        if (startY === null) return;
        const endY = e.touches[0].clientY;
        if (endY - startY > 70) fecharCarrinho();
      });
    }
  }

  /* ============== 8) PRONTO! ============== */
  console.log("✅ script.js carregado e conectado ao seu HTML/IDs atuais.");
});