/* =====================================================
   🍔 Da Família Lanches — Extras.js (v3.1 DFL Glow Edition)
   - Mantém tudo funcional (mensagens e miniaturas)
   - Adiciona brilho DFL às mensagens centrais
   - Nenhuma interferência no script principal
   ===================================================== */

(function () {

  // 1. CSS DE TRANSFORMAÇÃO (Aplica direto no elemento original)
  (function injectStyles() {
    if (document.getElementById('dfl-extras-style')) return;
    const st = document.createElement('style');
    st.id = 'dfl-extras-style';
    st.textContent = `
      /* --- O SEGREDO: Estilizar a classe .popup-add original --- */
      .popup-add {
        position: fixed !important;
        top: 20px !important; 
        left: 50% !important;
        transform: translateX(-50%) translateY(-150%) !important;
        background: #222 !important; 
        color: #fff !important;
        font-family: 'Segoe UI', Roboto, sans-serif !important;
        font-weight: 600 !important;
        font-size: 0.95rem !important;
        white-space: nowrap !important;
        padding: 12px 24px !important; 
        border-radius: 50px !important; 
        box-shadow: 0 8px 20px rgba(0,0,0,0.3) !important;
        z-index: 99999 !important;
        opacity: 0 !important;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        pointer-events: none !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-width: auto !important;
      }

      .popup-add.show {
        opacity: 1 !important;
        transform: translateX(-50%) translateY(0) !important;
      }

      /* --- MODO ESPECIAL: CENTRO (Adicionado via JS abaixo) --- */
      .popup-add.dfl-center {
        top: 50% !important;
        background: rgba(0, 0, 0, 0.85) !important;
        padding: 20px 30px !important;
        font-size: 1.1rem !important;
        transform: translate(-50%, -50%) scale(0.8) !important;
        border: 2px solid #ffca28 !important; /* Amarelo DFL */
        box-shadow: 0 0 30px rgba(255,202,40,0.35) !important; /* Brilho DFL */
        border-radius: 14px !important;
        backdrop-filter: blur(6px) !important;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
      }

      .popup-add.dfl-center.show {
        transform: translate(-50%, -50%) scale(1) !important;
      }

      /* --- CORREÇÃO DAS MINIATURAS --- */
      .pedido-card .pedido-thumb {
        width: 100% !important;
        height: 110px !important;
        background-size: cover !important;
        background-position: center center !important;
        border-radius: 8px !important;
        margin-bottom: 10px !important;
        background-color: transparent !important;
        box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
      }
    `;
    document.head.appendChild(st);
  })();

  // 2. OBSERVADOR INTELIGENTE (Detecta e estiliza os popups)
  function setupPopupObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.classList.contains('popup-add')) {
            stylizePopup(node);
          }
        });

        if (m.type === 'attributes' && m.target.classList.contains('popup-add')) {
          if (m.target.classList.contains('show')) stylizePopup(m.target);
        }

        if (m.type === 'characterData' || m.type === 'childList') {
          const target = m.target.closest ? m.target.closest('.popup-add') : m.target.parentElement;
          if (target && target.classList.contains('popup-add')) stylizePopup(target);
        }
      });
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['class'] 
    });
  }

  // 3. Função que aplica emojis e decide o modo visual
  function stylizePopup(el) {
    const msg = el.textContent || "";
    if (el.dataset.processed === msg) return;

    const isSpecial = /Login|Sucesso|Parabéns|Pedido|Finaliz/i.test(msg);
    const isError = /Erro|Inválido|Falha/i.test(msg);

    let icon = '🍔';
    if (msg.includes('Login')) icon = '🎉';
    else if (msg.includes('Pedido')) icon = '📦';
    else if (msg.includes('adicionado')) icon = '🛒';
    else if (msg.includes('removido')) icon = '🗑️';
    else if (msg.includes('Cupom')) icon = '🎟️';
    else if (isError) icon = '⚠️';

    if (isSpecial) el.classList.add('dfl-center');
    else el.classList.remove('dfl-center');

    if (!msg.includes(icon)) {
      el.innerHTML = `<span style="margin-right:8px; font-size:1.2em">${icon}</span> ${msg}`;
      el.dataset.processed = el.textContent;
    }
  }

  // 4. MINIATURAS MANTIDAS
  const THUMB_MAP = [
    { key: 'casal', img: 'imagens/combo1.png' },
    { key: 'família', img: 'imagens/combo3.png' },
    { key: 'familia', img: 'imagens/combo3.png' },
    { key: 'artesanal', img: 'imagens/combo4.png' },
    { key: 'purizin', img: 'imagens/purizin.png' },
    { key: 'padaná', img: 'imagens/padana.png' },
    { key: 'padana', img: 'imagens/padana.png' },
    { key: 'nigucim', img: 'imagens/nigucim.png' },
    { key: 'nimin', img: 'imagens/nimin.png' },
    { key: 'trembão', img: 'imagens/trembao.png' },
    { key: 'trembao', img: 'imagens/trembao.png' },
    { key: 'bão', img: 'imagens/bao.png' },
    { key: 'bao', img: 'imagens/bao.png' },
    { key: 'trem', img: 'imagens/trem.png' },
    { key: 'uai', img: 'imagens/uai.png' },
    { key: 'cadim', img: 'imagens/cadim.png' },
    { key: 'bitela', img: 'imagens/bitela.png' },
    { key: 'armaria', img: 'imagens/armaria.png' },
    { key: 'apruma', img: 'imagens/apruma.png' },
    { key: 'peleja', img: 'imagens/peleja.png' },
    { key: 'custoso', img: 'imagens/custoso.png' },
    { key: 'tudibom', img: 'imagens/tudibom.png' },
    { key: 'simprão', img: 'imagens/simprao.png' },
    { key: 'simprao', img: 'imagens/simprao.png' }
  ];

  function fixThumbnail(cardElement) {
    const thumbDiv = cardElement.querySelector('.pedido-thumb');
    if (!thumbDiv) return;
    const text = (cardElement.innerText || '').toLowerCase();
    const found = THUMB_MAP.find(t => text.includes(t.key));
    if (found) thumbDiv.style.backgroundImage = `url('${found.img}')`;
    thumbDiv.style.height = '110px'; 
    thumbDiv.style.backgroundSize = 'cover';
    thumbDiv.style.backgroundPosition = 'center';
  }

  function watchOrders() {
    const list = document.getElementById('listaPedidos');
    if (!list) return;
    const mo = new MutationObserver(() => Array.from(list.children).forEach(fixThumbnail));
    mo.observe(list, { childList: true, subtree: true });
    Array.from(list.children).forEach(fixThumbnail);
  }

  // 5. INICIALIZAÇÃO
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupPopupObserver();
      watchOrders();
    });
  } else {
    setupPopupObserver();
    watchOrders();
  }

})();