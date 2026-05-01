/* ===========================================================
   🍰 Degust extras.js — v10.0 (SISTEMA DE APOIO E TOASTS)
   =========================================================== */

// 1. CONFIGURAÇÃO DE ADICIONAIS (TOPPINGS)
const TOPPINGS_DATA = [
  { id: "extra_leite_ninho", nome: "Leite Ninho Extra", preco: 2.00 },
  { id: "extra_nutella",     nome: "Nutella Original",  preco: 4.50 },
  { id: "extra_morango",     nome: "Morango Picado",    preco: 3.00 },
  { id: "extra_granulado",   nome: "Granulado Belga",   preco: 2.00 },
  { id: "extra_coco",        nome: "Coco Ralado",       preco: 1.50 },
  { id: "extra_abacaxi",     nome: "Abacaxi em Calda",  preco: 2.50 }
];

// 2. SISTEMA DE POPUPS (TOASTS) v2.0
function popupAdd(mensagem, duracao = 3500) {
  // Remove popups antigos para não encavalar no celular
  const antigos = document.querySelectorAll('.popup-toast-degust');
  antigos.forEach(p => p.remove());

  const toast = document.createElement('div');
  toast.className = 'popup-toast-degust';
  
  // Lógica de ícones baseada no texto (Fidelidade vs Carrinho)
  let icone = "✅";
  if (mensagem.includes("Falta") || mensagem.includes("ganhar")) icone = "🎁";
  if (mensagem.includes("Erro") || mensagem.includes("⚠️")) icone = "⚠️";

  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${icone}</span>
      <span class="toast-text">${mensagem}</span>
    </div>
    <div class="toast-progress"></div>
  `;

  document.body.appendChild(toast);

  // Inicia animação de saída
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 500);
  }, duracao);
}

// 3. ESTILIZAÇÃO DINÂMICA DO TOAST (Injetada via JS para garantir)
const toastStyle = document.createElement('style');
toastStyle.innerHTML = `
  .popup-toast-degust {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--marrom);
    color: var(--bege);
    padding: 14px 22px;
    border-radius: 50px;
    z-index: 9999;
    box-shadow: var(--shadow-3);
    display: flex;
    flex-direction: column;
    min-width: 280px;
    border: 2px solid var(--dourado);
    animation: slideUpToast 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
  .toast-content { display: flex; align-items: center; gap: 12px; }
  .toast-icon { font-size: 1.4rem; }
  .toast-text { font-size: 0.9rem; font-weight: 700; line-height: 1.2; }
  .toast-progress {
    height: 3px;
    background: var(--dourado);
    margin-top: 8px;
    width: 100%;
    border-radius: 2px;
    animation: toastProgressAnim 3.5s linear forwards;
  }
  @keyframes slideUpToast {
    from { bottom: -100px; opacity: 0; }
    to { bottom: 30px; opacity: 1; }
  }
  @keyframes toastProgressAnim {
    from { width: 100%; }
    to { width: 0%; }
  }
  .popup-toast-degust.fade-out { opacity: 0; transform: translate(-50%, 20px); transition: 0.5s; }
`;
document.head.appendChild(toastStyle);
// 4. SISTEMA DE MINIATURAS E FALLBACK
function carregarMiniaturas() {
  const imagens = document.querySelectorAll('img[loading="lazy"]');
  
  imagens.forEach(img => {
    // Se a imagem falhar (link quebrado ou erro de rede), carrega a logo como fallback
    img.onerror = function() {
      this.src = 'logo.png';
      this.classList.add('img-fallback');
    };

    // Efeito de fade-in quando a imagem termina de carregar
    img.onload = function() {
      this.style.opacity = "1";
    };
    img.style.opacity = "0";
    img.style.transition = "opacity 0.5s ease-in-out";
  });
}

// 5. CONTROLE DE ÁUDIO (FEEDBACK TÁTIL)
const sound = {
  element: document.getElementById('checkout-sound'),
  play() {
    if (this.element) {
      this.element.currentTime = 0;
      this.element.play().catch(() => {
        // Silencia erro se o navegador bloquear o autoplay sem interação
        console.log("Áudio aguardando interação do usuário.");
      });
    }
  }
};

// 6. SOMBRAS DINÂMICAS NO HEADER (SCROLL)
window.addEventListener('scroll', () => {
  const header = document.querySelector('.header');
  if (window.scrollY > 20) {
    header.style.boxShadow = "var(--shadow-2)";
    header.style.height = "65px";
  } else {
    header.style.boxShadow = "var(--shadow-1)";
    header.style.height = "70px";
  }
}, { passive: true });

// 7. GERADOR DE COMPROVANTE TEXTUAL (PARA WHATSAPP)
function formatarPedidoZap(dados) {
  let texto = `*🍰 NOVO PEDIDO - DEGUST BOLOS*\n`;
  texto += `------------------------------\n`;
  texto += `👤 *Cliente:* ${dados.nome}\n`;
  texto += `📍 *Entrega:* ${dados.endereco}\n`;
  texto += `------------------------------\n\n`;
  
  dados.itens.forEach(item => {
    texto += `▪️ ${item.qtd}x ${item.nome} (R$ ${item.preco.toFixed(2)})\n`;
  });

  if (dados.desconto > 0) {
    texto += `\n🎁 *Desconto:* -R$ ${dados.desconto.toFixed(2)}`;
  }

  texto += `\n\n🛵 *Taxa:* R$ ${dados.taxa.toFixed(2)}`;
  texto += `\n💰 *TOTAL: R$ ${dados.total.toFixed(2)}*\n`;
  texto += `\n💳 *Pagamento:* ${dados.metodo}`;
  
  return encodeURIComponent(texto);
}

// Inicializa componentes de apoio
document.addEventListener('DOMContentLoaded', () => {
  carregarMiniaturas();
});
