/* =====================================================
   🍰 Degust Bolos no Pote — Extras.js (v11.5)
   - Sistema de Toppings e Notificações Customizadas
   ===================================================== */

(function () {

  // 1. INJEÇÃO DE ESTILOS PARA TOASTS E MINIATURAS
  (function injectStyles() {
    if (document.getElementById('degust-extras-style')) return;
    
    const st = document.createElement('style');
    st.id = 'degust-extras-style';
    st.textContent = `
      .popup-add, .dfl-toast {
        position: fixed !important;
        top: 75px !important; 
        bottom: auto !important;
        left: 50% !important;
        transform: translateX(-50%) translateY(-150%) !important;
        background: #4B2C20 !important; 
        color: #F5E6CA !important; 
        font-family: 'Poppins', sans-serif !important;
        font-weight: 700 !important;
        font-size: 0.95rem !important;
        padding: 12px 24px !important;
        border-radius: 50px !important;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3) !important;
        z-index: 9999 !important;
        opacity: 0 !important;
        transition: all 0.45s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        border: 1px solid #E1A95F !important;
      }

      .popup-add.show, .dfl-toast.show {
        opacity: 1 !important;
        transform: translateX(-50%) translateY(0) !important;
      }

      .pedido-card .pedido-thumb {
        width: 100% !important;
        height: 110px !important;
        background-size: cover !important;
        background-position: center !important;
        border-radius: 8px !important;
        background-color: #fdf8ef !important;
      }
    `;
    document.head.appendChild(st);
  })();

  // 2. CONFIGURAÇÃO DE ÍCONES PARA NOTIFICAÇÕES
  function stylizePopup(el) {
    const msg = el.textContent || "";
    if (el.dataset.processed === msg) return;

    let icon = '🍰';
    if (/Login|Olá/i.test(msg)) icon = '✨';
    else if (/Pedido/i.test(msg)) icon = '🧁';
    else if (/adicionado/i.test(msg)) icon = '🛒';
    else if (/Erro|Falha/i.test(msg)) icon = '⚠️';

    el.innerHTML = `<span style="font-size:1.2em">${icon}</span> ${msg}`;
    el.dataset.processed = el.textContent;
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.classList.contains('popup-add')) stylizePopup(node);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // 3. MAPA DE MINIATURAS ATUALIZADO (Incluindo Novidades)
  const THUMB_MAP = [
    { key: 'chocolatudo', img: 'produtos/chocolatudo.png' },
    { key: 'prestigio', img: 'produtos/prestigio.png' },
    { key: 'silvestre', img: 'produtos/ninhosilvestre.png' },
    { key: 'ninho', img: 'produtos/ninhocremoso.png' },
    { key: 'tropical', img: 'produtos/tropicalcream.png' },
    { key: 'bombom', img: 'produtos/bombomdemaracuja.png' }
  ];

  function fixThumbnail(el) {
    const thumb = el.querySelector('.pedido-thumb');
    if (!thumb) return;
    const text = (el.innerText || '').toLowerCase();
    const found = THUMB_MAP.find(t => text.includes(t.key));
    thumb.style.backgroundImage = `url('${found ? found.img : "logo.png"}')`;
  }

  function watchOrders() {
    const list = document.getElementById('listaPedidos');
    if (!list) return;
    new MutationObserver(() => {
      [...list.children].forEach(fixThumbnail);
    }).observe(list, { childList: true });
  }

  window.addEventListener('DOMContentLoaded', watchOrders);

})();
