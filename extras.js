/* ===========================================================
   🍔 DFL – extras.js
   Complemento opcional e seguro para a versão 3.7 estável
   -----------------------------------------------------------
   ✅ Exibe toast flutuante "Login realizado com sucesso!"
   ✅ Adiciona miniaturas em "📦 Meus Pedidos"
   (sem alterar o script.js original)
   =========================================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* -------------------------------
     🟢 1. Toast de Login com Sucesso
  ---------------------------------- */
  window.showLoginToast = function (msg = "Login realizado com sucesso! 🎉") {
    // cria container se não existir
    let container = document.querySelector("#toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      Object.assign(container.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        zIndex: 9999,
      });
      document.body.appendChild(container);
    }

    // cria o toast
    const toast = document.createElement("div");
    Object.assign(toast.style, {
      background: "linear-gradient(135deg,#4caf50,#388e3c)",
      color: "#fff",
      padding: "12px 18px",
      borderRadius: "8px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
      fontWeight: "600",
      fontSize: "0.95rem",
      animation: "fadeIn 0.4s ease",
      opacity: "0.95",
    });
    toast.textContent = msg;
    container.appendChild(toast);

    // remove automaticamente após 3s
    setTimeout(() => {
      toast.style.transition = "opacity 0.5s";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  };

  /* -------------------------------
     🟡 2. Miniaturas em "Meus Pedidos"
  ---------------------------------- */
  window.getPedidoThumb = function (pedido) {
    if (!pedido) return "/imagens/padrao.jpg";
    if (pedido.thumb) return pedido.thumb;

    // tenta identificar pelo nome do item
    const nome = (pedido.itens?.[0]?.nome || "").toLowerCase();
    const mapa = {
      "bao": "bao.png",
      "uai": "uai.png",
      "trem": "trem.png",
      "cadim": "cadim.png",
      "armaria": "armaria.png",
      "bitela": "bitela.png",
      "apruma": "apruma.png",
      "peleja": "peleja.png",
      "tudibom": "tudibom.png",
      "custoso": "custoso.png",
      "nigucim": "nigucim.png",
      "simprao": "simprao.png",
      "nimin": "nimin.png",
      "padana": "padana.png",
      "purizin": "purizin.png",
      "trembao": "trembao.png",
      "combo casal tradicional": "combo-casal-tradicional.png",
      "combo casal artesanal": "combo-casal-artesanal.png",
      "combo familia tradicional": "combo-familia-tradicional.png",
      "combo familia artesanal": "combo-familia-artesanal.png",
    };

    for (const chave in mapa) {
      if (nome.includes(chave)) return `/imagens/${mapa[chave]}`;
    }

    return "/imagens/padrao.jpg";
  };

  /* ---------------------------------------------------
     🧩 3. Integração automática (opcional e segura)
     Substitui a imagem no painel “📦 Meus Pedidos”
  ------------------------------------------------------ */
  const observer = new MutationObserver(() => {
    const cards = document.querySelectorAll(".pedido-card, .pedido-item");
    cards.forEach(card => {
      if (card.dataset.thumbReady) return; // evita duplicar
      const thumbDiv = card.querySelector(".pedido-thumb");
      const nomeItem = card.textContent.toLowerCase();
      for (const chave of Object.keys({
        bao: "", uai: "", trem: "", cadim: "", armaria: "", bitela: "",
        apruma: "", peleja: "", tudibom: "", custoso: "", nigucim: "",
        simprao: "", nimin: "", padana: "", purizin: "", trembao: "",
      })) {
        if (nomeItem.includes(chave)) {
          if (thumbDiv) thumbDiv.style.backgroundImage = `url('/imagens/${chave}.png')`;
          card.dataset.thumbReady = "1";
          break;
        }
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

});