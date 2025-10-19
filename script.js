// ==========================
// DFL – Script Principal
// ==========================

document.addEventListener("DOMContentLoaded", () => {

  // === 1. STATUS DE HORÁRIO DINÂMICO ===
  const statusBanner = document.getElementById("status-banner");
  if (statusBanner) {
    function atualizarStatus() {
      const agora = new Date();
      const dia = agora.getDay();
      const hora = agora.getHours();
      const minuto = agora.getMinutes();
      let aberto = false;
      let msg = "";

      const dentro = (hIni, mIni, hFim, mFim) => {
        const min = hora * 60 + minuto;
        return min >= hIni * 60 + mIni && min < hFim * 60 + mFim;
      };

      if ([1, 3, 4].includes(dia)) aberto = dentro(18, 0, 23, 15);
      if ([5, 6].includes(dia)) aberto = dentro(17, 30, 23, 30);

      if (aberto) {
        msg = "🟢 Estamos abertos! Faça seu pedido 😋";
        statusBanner.className = "status-banner open";
      } else {
        let prox = "";
        if (dia === 2) prox = "Amanhã às 18h";
        else if ([0, 1, 3, 4].includes(dia)) prox = "Hoje às 18h";
        else prox = "Amanhã às 17h30";
        msg = `🔴 Fechado agora. Abrimos ${prox}.`;
        statusBanner.className = "status-banner closed";
      }

      statusBanner.textContent = msg;
    }
    atualizarStatus();
    setInterval(atualizarStatus, 60000);
  }

  // === 2. CARROSSEL DE PROMOÇÕES ===
  const slides = document.querySelectorAll(".slide");
  const prev = document.querySelector(".c-prev");
  const next = document.querySelector(".c-next");
  let i = 0;

  function showSlide(idx) {
    slides.forEach((s, j) => s.classList.toggle("active", j === idx));
  }
  if (next && prev && slides.length > 0) {
    next.onclick = () => {
      i = (i + 1) % slides.length;
      showSlide(i);
    };
    prev.onclick = () => {
      i = (i - 1 + slides.length) % slides.length;
      showSlide(i);
    };
  }

  // === 3. CARRINHO ===
  const cart = [];
  const cartIcon = document.getElementById("cart-icon");
  const miniCart = document.getElementById("mini-cart");
  const backdrop = document.getElementById("cart-backdrop");
  const list = document.getElementById("mini-list");
  const count = document.getElementById("cart-count");

  function atualizarCarrinho() {
    if (!list || !count) return;
    list.innerHTML = "";
    cart.forEach((item, idx) => {
      const el = document.createElement("div");
      el.className = "mini-item";
      el.innerHTML = `<b>${item.qtd}x</b> ${item.nome} - R$${(
        item.qtd * item.preco
      ).toFixed(2)} <button class="rm" data-i="${idx}">✕</button>`;
      list.appendChild(el);
    });
    count.textContent = cart.length;
  }

  document.body.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-cart")) {
      const card = e.target.closest(".card");
      if (!card) return;
      const nome = card.dataset.name || "Item";
      const preco = parseFloat(card.dataset.price || "0");
      const item = cart.find((i) => i.nome === nome);
      if (item) item.qtd++;
      else cart.push({ nome, preco, qtd: 1 });
      atualizarCarrinho();
    }

    if (e.target.classList.contains("rm")) {
      const idx = e.target.dataset.i;
      cart.splice(idx, 1);
      atualizarCarrinho();
    }

    if (e.target.id === "mini-clear") {
      cart.length = 0;
      atualizarCarrinho();
    }

    if (e.target.id === "mini-checkout") {
      if (!cart.length) return alert("Carrinho vazio!");
      let msg = "*Pedido Da Família Lanches*%0A";
      cart.forEach(
        (i) =>
          (msg += `%0A• *${i.qtd}x ${i.nome}* — R$${(i.qtd * i.preco).toFixed(
            2
          )}`)
      );
      msg += "%0A%0AEnviar pedido completo? 🍔";
      window.open(`https://wa.me/5534997178336?text=${msg}`, "_blank");
    }
  });

  if (cartIcon) {
    cartIcon.onclick = () => {
      miniCart.classList.toggle("open");
      backdrop.classList.toggle("show");
    };
  }
  if (backdrop) {
    backdrop.onclick = () => {
      miniCart.classList.remove("open");
      backdrop.classList.remove("show");
    };
  }

  // === 4. MODAL DE ADICIONAIS ===
  const extrasModal = document.getElementById("extras-modal");
  const extrasBackdrop = document.getElementById("extras-backdrop");
  const extrasBtns = document.querySelectorAll(".extras-btn");
  const extrasList = document.getElementById("extras-list");

  const adicionais = [
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

  if (extrasBtns.length && extrasModal && extrasList) {
    extrasBtns.forEach((btn) => {
      btn.onclick = () => {
        extrasModal.setAttribute("aria-hidden", "false");
        extrasBackdrop.classList.add("show");
        extrasList.innerHTML = adicionais
          .map(
            (a, i) =>
              `<label><input type="checkbox" data-i="${i}"> ${a.nome} – R$${a.preco.toFixed(
                2
              )}</label>`
          )
          .join("");
      };
    });

    const fecharExtras = () => {
      extrasModal.setAttribute("aria-hidden", "true");
      extrasBackdrop.classList.remove("show");
    };

    const extrasClose = document.querySelector(".extras-close");
    const extrasCancel = document.getElementById("extras-cancel");
    const extrasAdd = document.getElementById("extras-add");

    if (extrasClose) extrasClose.onclick = fecharExtras;
    if (extrasCancel) extrasCancel.onclick = fecharExtras;

    if (extrasAdd) {
      extrasAdd.onclick = () => {
        const selecionados = [
          ...extrasList.querySelectorAll("input:checked"),
        ].map((i) => adicionais[i.dataset.i]);
        if (!selecionados.length) return fecharExtras();
        alert(
          "Adicionais selecionados:\n" +
            selecionados.map((a) => `${a.nome} - R$${a.preco.toFixed(2)}`).join("\n")
        );
        fecharExtras();
      };
    }
  }

  // === 5. CONTAGEM REGRESSIVA ===
  const timer = document.getElementById("timer");
  if (timer) {
    let segundos = 8 * 60 * 60; // 8h
    setInterval(() => {
      segundos--;
      if (segundos <= 0) segundos = 8 * 60 * 60;
      const h = String(Math.floor(segundos / 3600)).padStart(2, "0");
      const m = String(Math.floor((segundos % 3600) / 60)).padStart(2, "0");
      const s = String(segundos % 60).padStart(2, "0");
      timer.textContent = `${h}:${m}:${s}`;
    }, 1000);
  }

  console.log("✅ script.js totalmente carregado e funcional!");
});