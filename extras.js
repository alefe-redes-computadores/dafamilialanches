/* =====================================================
   🍰 Degust Bolos no Pote — extras.js v12.1
   Toast animado + miniaturas nos pedidos
===================================================== */

(function () {

  // 1. INJEÇÃO DE CSS EXTRA PARA TOASTS
  (function injectStyles() {
    if (document.getElementById('degust-extras-style')) return;
    const st = document.createElement('style');
    st.id = 'degust-extras-style';
    st.textContent = `
      .pedido-card .pedido-thumb {
        width: 100% !important;
        height: 110px !important;
        background-size: cover !important;
        background-position: center !important;
        border-radius: 8px !important;
        background-color: #fdf8ef !important;
        margin-bottom: 8px !important;
      }
    `;
    document.head.appendChild(st);
  })();

  // 2. ÍCONES CONTEXTUAIS NOS TOASTS
  function stylizePopup(el) {
    const msg = el.textContent || "";
    if (el.dataset.processed === msg) return;

    let icon = '🍰';
    if (/Login|Olá|Bem-vind/i.test(msg))    icon = '✨';
    else if (/Pedido|WhatsApp/i.test(msg))   icon = '🧁';
    else if (/adicionado/i.test(msg))        icon = '🛒';
    else if (/Recompensa|ponto|prêmio|brinde/i.test(msg)) icon = '🎁';
    else if (/Falta/i.test(msg))             icon = '⭐';
    else if (/Erro|Falha/i.test(msg))        icon = '⚠️';
    else if (/Copiado|Copiada/i.test(msg))   icon = '✅';
    else if (/removido/i.test(msg))          icon = '🗑️';
    else if (/Cupom/i.test(msg))             icon = '🏷️';
    else if (/Frete|Grátis/i.test(msg))      icon = '🚀';
    else if (/cookie|preferência/i.test(msg)) icon = '🍪';

    el.innerHTML = `<span style="font-size:1.2em">${icon}</span> ${msg}`;
    el.dataset.processed = el.textContent;
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.classList.contains('popup-add')) {
          stylizePopup(node);
        }
      });
      m.target && m.target.classList?.contains('popup-add') && stylizePopup(m.target);
    });
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

  // 3. MAPA DE MINIATURAS — todos os produtos
  const THUMB_MAP = [
    { key: 'brigadeiro',  img: 'produtos/brigadeiro.png' },
    { key: 'chocolatudo', img: 'produtos/chocolatudo.png' },
    { key: 'prestígio',   img: 'produtos/prestigio.png' },
    { key: 'prestigio',   img: 'produtos/prestigio.png' },
    { key: 'silvestre',   img: 'produtos/ninhosilvestre.png' },
    { key: 'geleia',      img: 'produtos/ninhosilvestre.png' },
    { key: 'morango',     img: 'produtos/ninhosilvestre.png' },
    { key: 'tropical',    img: 'produtos/tropicalcream.png' },
    { key: 'abacaxi',     img: 'produtos/tropicalcream.png' },
    { key: 'maracujá',    img: 'produtos/bombomdemaracuja.png' },
    { key: 'maracuja',    img: 'produtos/bombomdemaracuja.png' },
    { key: 'bombom',      img: 'produtos/bombomdemaracuja.png' },
    { key: 'ninho',       img: 'produtos/ninhocremoso.png' },
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
