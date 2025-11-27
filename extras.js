/* =====================================================
   🍔 Da Família Lanches — Extras.js (v4.3 TOAST 70px)
   - Ajuste definitivo: toast sempre visível (top: 70px)
   ===================================================== */

(function () {

  // 1. INJEÇÃO DE CSS
  (function injectStyles() {
    if (document.getElementById('dfl-extras-js-style')) return;
    
    const st = document.createElement('style');
    st.id = 'dfl-extras-js-style';
    st.textContent = `
      /* --- BASE DOS TOASTS --- */
      .popup-add, .dfl-toast {
        position: fixed !important;
        top: 70px !important; /* ALTURA DEFINITIVA */
        bottom: auto !important;
        left: 50% !important;
        transform: translateX(-50%) translateY(-150%) !important;

        background: #222 !important;
        color: #fff !important;
        font-family: 'Segoe UI', Roboto, sans-serif !important;
        font-weight: 700 !important;
        font-size: 0.95rem !important;
        white-space: nowrap !important;

        padding: 12px 24px !important;
        border-radius: 50px !important;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3) !important;

        z-index: 2147483647 !important;
        opacity: 0 !important;
        pointer-events: none !important;

        transition: all 0.45s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 10px !important;
      }

      /* ESTADO VISÍVEL */
      .popup-add.show, .dfl-toast.show {
        opacity: 1 !important;
        transform: translateX(-50%) translateY(0) !important;
      }

      /* --- TOAST ESPECIAL (TELA CHEIA) --- */
      .popup-add.dfl-center, .dfl-toast.dfl-center {
        top: 50% !important;
        background: rgba(0,0,0,0.9) !important;
        backdrop-filter: blur(5px) !important;
        padding: 25px 35px !important;
        font-size: 1.1rem !important;
        border: 1px solid rgba(255,255,255,0.15) !important;
        transform: translate(-50%, -50%) scale(0.5) !important;
      }

      .popup-add.dfl-center.show, .dfl-toast.dfl-center.show {
        transform: translate(-50%, -50%) scale(1) !important;
      }

      /* MINIATURAS DE PEDIDOS */
      .pedido-card .pedido-thumb {
        width: 100% !important;
        height: 110px !important;
        background-size: cover !important;
        background-position: center !important;
        border-radius: 8px !important;
        background-color: transparent !important;
        box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
      }
    `;
    document.head.appendChild(st);
  })();

  // 2. OBSERVADOR PARA POPUPS
  function setupPopupObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.classList.contains('popup-add')) {
            stylizePopup(node);
          }
        });

        if (m.type === 'attributes' && m.target.classList.contains('popup-add')) {
          if (m.target.classList.contains('show')) stylizePopup(m.target);
        }

        if (m.type === 'childList' || m.type === 'characterData') {
          const el = m.target.closest?.('.popup-add');
          if (el) stylizePopup(el);
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  // 3. ESTILIZADOR DE TOASTS
  function stylizePopup(el) {
    const msg = el.textContent || "";
    if (el.dataset.processed === msg) return;

    const isSpecial = /Login|Sucesso|Parabéns|Finaliz|Obrigado/i.test(msg);
    const isError = /Erro|Falha|Inválid/i.test(msg);

    let icon = '🍔';
    if (/Login/i.test(msg)) icon = '🎉';
    else if (/Pedido/i.test(msg)) icon = '📦';
    else if (/adicionado/i.test(msg)) icon = '🛒';
    else if (/removido/i.test(msg)) icon = '🗑️';
    else if (/Cupom/i.test(msg)) icon = '🎟️';
    else if (isError) icon = '⚠️';

    if (isSpecial) el.classList.add('dfl-center');
    else el.classList.remove('dfl-center');

    if (!msg.includes(icon)) {
      el.innerHTML = `<span style="margin-right:8px;font-size:1.2em">${icon}</span> ${msg}`;
      el.dataset.processed = el.textContent;
    }
  }

  // 4. LOGIN AUTOMÁTICO (TOAST BONITO)
  document.addEventListener('DOMContentLoaded', () => {
    try {
      setTimeout(() => {
        if (firebase?.auth) {
          firebase.auth().onAuthStateChanged(user => {
            if (user && !sessionStorage.getItem('dfl_logged')) {
              sessionStorage.setItem('dfl_logged', 'true');
              if (window.popupAdd) {
                const nome = user.displayName?.split(' ')[0] ?? 'Cliente';
                popupAdd(`🎉 Login realizado! Olá, ${nome}.`);
              }
            }
          });
        }
      }, 1500);
    } catch (_) {}
  });

  // 5. MINIATURAS DE PEDIDOS
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

  function fixThumbnail(el) {
    const thumb = el.querySelector('.pedido-thumb');
    if (!thumb) return;

    const text = (el.innerText || '').toLowerCase();
    const found = THUMB_MAP.find(t => text.includes(t.key));

    thumb.style.backgroundImage = `url('${found ? found.img : "imagens/burger.png"}')`;
  }

  function watchOrders() {
    const list = document.getElementById('listaPedidos');
    if (!list) return;

    const mo = new MutationObserver(() => {
      [...list.children].forEach(fixThumbnail);
    });

    mo.observe(list, { childList: true, subtree: true });
    [...list.children].forEach(fixThumbnail);
  }

  // 6. INICIALIZAÇÃO
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