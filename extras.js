
// =====================================================
// 🌟 DFL Extras.js — Toast + Miniaturas de Pedidos (v1.0)
// Compatível com v3.7+ (não altera o script.js principal)
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ extras.js carregado");

  /* === 1️⃣ Toast de Login com Sucesso === */
  function showLoginToast() {
    const toast = document.createElement("div");
    toast.textContent = "🎉 Login realizado com sucesso!";
    Object.assign(toast.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#4caf50",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: "8px",
      fontWeight: "600",
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      zIndex: "2000",
      opacity: "0",
      transition: "opacity 0.3s ease"
    });
    document.body.appendChild(toast);
    setTimeout(() => (toast.style.opacity = "1"), 100);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  // Gatilho de login — detecta se usuário logou com sucesso (variável global usada no script principal)
  const observer = new MutationObserver(() => {
    if (window.currentUser && !window._toastShown) {
      window._toastShown = true;
      showLoginToast();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  /* === 2️⃣ Miniaturas Automáticas dos Pedidos === */
  const lista = document.querySelector("#listaPedidos");
  if (lista) {
    const itens = lista.querySelectorAll(".pedido-card, .pedido-item");
    itens.forEach(card => {
      // Encontra o texto do pedido
      const texto = card.innerText.toLowerCase();
      let imagem = "default";

      // Mapeamento por palavra-chave
      const chaves = {
        combo: "combo1",
        bao: "bao",
        bitela: "bitela",
        cadim: "cadim",
        trem: "trem",
        armaria: "armaria",
        apruma: "apruma",
        gradicido: "gradicido",
        custoso: "custoso",
        nimin: "nimin",
        nigucim: "nigucim",
        purizin: "purizin"
      };

      for (const [chave, nome] of Object.entries(chaves)) {
        if (texto.includes(chave)) {
          imagem = nome;
          break;
        }
      }

      // Insere miniatura se não existir
      if (!card.querySelector(".pedido-thumb")) {
        const thumb = document.createElement("div");
        thumb.className = "pedido-thumb";
        thumb.style.width = "100%";
        thumb.style.height = "140px";
        thumb.style.borderRadius = "10px";
        thumb.style.background = `url('./imagens/${imagem}.png') center/cover no-repeat`;
        thumb.style.marginBottom = "10px";
        thumb.style.border = "1px solid #eee";
        thumb.style.backgroundColor = "#fafafa";
        card.insertBefore(thumb, card.firstChild);
      }
    });
  }
});
